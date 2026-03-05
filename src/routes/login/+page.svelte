<script lang="ts">
  import { goto } from '$app/navigation';
  import { adminApi } from '$lib/api/client';
  import { AuthProgress, CredentialsForm, HardwareKeyForm, TotpForm } from '$lib/components/auth';
  import { Card } from '$lib/components/ui';
  import {
    clearAttempts,
    generateDeviceFingerprint,
    isLockedOut,
    logSecurityEvent,
    recordFailedAttempt,
  } from '$lib/security';
  import { authStore, deviceFingerprintStore, securityAlertsStore } from '$lib/stores';
  import { AlertTriangle, Check, Copy, Shield, ShieldAlert } from 'lucide-svelte';
  import { onMount } from 'svelte';

  let error = $state('');
  let isLoading = $state(false);
  let showBackupModal = $state(false);
  let pendingBackupCode = $state<string | null>(null);
  let backupCodeCopied = $state(false);
  let attemptsRemaining = $state<number | undefined>(undefined);
  let lockoutRemaining = $state<number | undefined>(undefined);
  let challenge = $state<string | undefined>(undefined);

  onMount(async () => {
    // Generate and store device fingerprint
    const fingerprint = generateDeviceFingerprint();
    deviceFingerprintStore.set(fingerprint);

    // Check if already authenticated via stored token
    const isAuth = await authStore.initFromToken();
    if (isAuth || $authStore.isAuthenticated) {
      goto('/dashboard');
      return;
    }

    // Check lockout status
    checkLockout();
  });

  function checkLockout() {
    const fingerprint = $deviceFingerprintStore || 'unknown';
    const lockout = isLockedOut(fingerprint);
    if (lockout.locked && lockout.remainingMs) {
      lockoutRemaining = lockout.remainingMs;
      // Update countdown
      const interval = setInterval(() => {
        if (lockoutRemaining && lockoutRemaining > 1000) {
          lockoutRemaining -= 1000;
        } else {
          lockoutRemaining = undefined;
          clearInterval(interval);
        }
      }, 1000);
    }
  }

  async function handleCredentials(username: string, password: string) {
    error = '';
    isLoading = true;

    const fingerprint = $deviceFingerprintStore || 'unknown';

    // Log attempt
    logSecurityEvent('login_attempt', {
      deviceFingerprint: fingerprint,
      timestamp: Date.now(),
    });

    try {
      // Call real backend API
      const result = await adminApi.login(username, password);

      clearAttempts(fingerprint);

      if (result.sessionToken) {
        authStore.setSessionId(result.sessionToken, Date.now() + 3600 * 1000);
      }

      // Move to TOTP step if required
      if (result.requiresTotp) {
        authStore.setStep('totp');
      } else if (result.requiresHardwareKey) {
        authStore.setStep('hardware_key');
        challenge = Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        authStore.setChallengeId(challenge);
      }

      logSecurityEvent('login_success', { deviceFingerprint: fingerprint });
    } catch (e) {
      const result = recordFailedAttempt(fingerprint);
      attemptsRemaining = result.attemptsRemaining;

      if (result.locked) {
        lockoutRemaining = 30 * 60 * 1000;
        logSecurityEvent('lockout_triggered', { deviceFingerprint: fingerprint });
        securityAlertsStore.add('error', 'Account locked due to too many failed attempts');
        checkLockout();
      } else {
        error = e instanceof Error ? e.message : 'Invalid username or password';
        logSecurityEvent('login_failed', { deviceFingerprint: fingerprint });
      }
    } finally {
      isLoading = false;
    }
  }

  async function handleTotp(code: string) {
    error = '';
    isLoading = true;

    try {
      // Call real backend API for TOTP verification
      const result = await adminApi.verifyTotp(code);

      if (result.verified) {
        // Move to hardware key step — use server-provided challenge
        authStore.setStep('hardware_key');

        // The challenge comes from the server (generated during login)
        if (result.challenge) {
          challenge = result.challenge;
        } else {
          // Fallback: generate client-side challenge
          challenge = Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
        }
        authStore.setChallengeId(challenge);

        logSecurityEvent('totp_verified', { deviceFingerprint: $deviceFingerprintStore || '' });
      } else {
        error = 'Invalid TOTP code';
        logSecurityEvent('totp_failed', { deviceFingerprint: $deviceFingerprintStore || '' });
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Verification failed';
      logSecurityEvent('totp_failed', { deviceFingerprint: $deviceFingerprintStore || '' });
    } finally {
      isLoading = false;
    }
  }

  async function handleHardwareKey(response: string) {
    error = '';
    isLoading = true;

    try {
      // Si c'est un enregistrement WebAuthn réussi (la réponse commence par "registered:")
      // le token a déjà été posé par l'API client dans registerWebAuthnCredential
      const isRegistration = response.startsWith('registered:');
      let result;
      let extractedBackupCode: string | null = null;

      if (isRegistration) {
        // Format: "registered:<credentialId>:<backupCode>"
        const regParts = response.split(':');
        if (regParts[2]) extractedBackupCode = regParts[2];
        // L'enregistrement a déjà authentifié — le token est déjà posé
        result = { verified: true, token: adminApi.getToken(), expiresIn: 3600 };
      } else if (response.startsWith('passkey:')) {
        // Format: "passkey:<credential_id>:<clientDataB64>:<authenticatorDataB64>:<signatureB64>"
        const parts = response.split(':');
        const credentialId = parts[1] || '';
        const clientDataB64 = parts[2] || '';
        const authenticatorDataB64 = parts[3] || undefined;
        const signatureB64 = parts[4] || undefined;
        const webauthnResponse = `webauthn:${clientDataB64}`;
        result = await adminApi.verifyHardwareKey(
          credentialId,
          webauthnResponse,
          authenticatorDataB64,
          signatureB64,
        );
      } else {
        // Vérification classique (backup code)
        const credentialId = response.startsWith('backup:') ? 'backup' : 'credential-id';
        result = await adminApi.verifyHardwareKey(credentialId, response);
      }

      if (result.verified || result.token) {
        const expiresAt = Date.now() + (result.expiresIn || 3600) * 1000;

        try {
          const session = await adminApi.getSession();
          authStore.completeAuth(
            {
              id: session.user_id,
              username: session.username,
              email: `${session.username}@manulcore.io`,
              role: session.role === 'super_admin' ? 'creator' : 'super_admin',
              totpEnabled: true,
              hardwareKeyEnabled: true,
              createdAt: new Date().toISOString(),
            },
            expiresAt,
          );
        } catch {
          authStore.completeAuth(
            {
              id: 'admin-001',
              username: 'admin',
              email: 'admin@manulcore.io',
              role: 'creator',
              totpEnabled: true,
              hardwareKeyEnabled: true,
              createdAt: new Date().toISOString(),
            },
            expiresAt,
          );
        }

        logSecurityEvent('hardware_key_verified', {
          deviceFingerprint: $deviceFingerprintStore || '',
        });

        // Récupérer le backup code (de l'enregistrement ou de l'API)
        const backupCode = extractedBackupCode || result.backupCode || null;

        if (backupCode) {
          // Afficher le modal avec le backup code avant de rediriger
          pendingBackupCode = backupCode;
          showBackupModal = true;
          securityAlertsStore.add('success', 'Authentification réussie');
        } else {
          securityAlertsStore.add('success', 'Authentification réussie');
          goto('/dashboard');
        }
      } else {
        error = 'Échec de vérification';
        logSecurityEvent('hardware_key_failed', {
          deviceFingerprint: $deviceFingerprintStore || '',
        });
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Échec de vérification';
      logSecurityEvent('hardware_key_failed', {
        deviceFingerprint: $deviceFingerprintStore || '',
      });
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Login - Manul Core Admin</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] p-4">
  <div class="w-full max-w-md">
    <!-- Header -->
    <div class="mb-8 text-center">
      <img src="/manul.png" alt="Manul Core" class="mx-auto mb-4 h-20 w-20 rounded-2xl" />
      <h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">Manul Core Admin</h1>
      <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Secure Administration Portal</p>
    </div>

    <!-- Security Badge -->
    <div class="mb-6 flex items-center justify-center gap-2">
      <div
        class="security-badge flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white"
      >
        <Shield class="h-4 w-4" />
        Triple Authentication Required
      </div>
    </div>

    <!-- Auth Progress -->
    <AuthProgress currentStep={$authStore.authState.step} class="mb-8" />

    <!-- Auth Card -->
    <Card variant="glass" class="p-6">
      {#if $authStore.authState.step === 'credentials'}
        <CredentialsForm
          onSubmit={handleCredentials}
          {isLoading}
          {error}
          {attemptsRemaining}
          {lockoutRemaining}
        />
      {:else if $authStore.authState.step === 'totp'}
        <TotpForm onSubmit={handleTotp} {isLoading} {error} />
      {:else if $authStore.authState.step === 'hardware_key'}
        <HardwareKeyForm
          onVerify={handleHardwareKey}
          onUseBackupCode={() => {}}
          {challenge}
          {isLoading}
          {error}
        />
      {/if}
    </Card>

    <!-- Security Notice -->
    <div class="mt-6 rounded-lg bg-[hsl(var(--warning))]/5 p-4">
      <div class="flex items-start gap-3">
        <AlertTriangle class="h-5 w-5 shrink-0 text-[hsl(var(--warning))]" />
        <div class="text-xs text-[hsl(var(--muted-foreground))]">
          <p class="font-medium text-[hsl(var(--warning))]">Security Notice</p>
          <p class="mt-1">
            This portal is restricted to authorized administrators only. All access attempts are
            logged and monitored. Unauthorized access is prohibited and may result in legal action.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Backup Code Modal -->
{#if showBackupModal && pendingBackupCode}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div
      class="w-full max-w-md rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 shadow-2xl"
    >
      <!-- Icon -->
      <div
        class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--warning))]/20"
      >
        <ShieldAlert class="h-8 w-8 text-[hsl(var(--warning))]" />
      </div>

      <!-- Title -->
      <h2 class="text-center text-xl font-bold text-[hsl(var(--foreground))]">Code d'urgence</h2>
      <p class="mt-2 text-center text-sm text-[hsl(var(--muted-foreground))]">
        Notez ce code en lieu sûr. Il vous permettra de vous connecter si votre passkey est
        indisponible. <strong class="text-[hsl(var(--warning))]">Ce code est à usage unique.</strong
        >
      </p>

      <!-- Backup Code Display -->
      <div
        class="mt-6 rounded-xl border-2 border-dashed border-[hsl(var(--warning))]/40 bg-[hsl(var(--warning))]/5 p-6"
      >
        <p
          class="text-center font-mono text-2xl font-bold tracking-[0.3em] text-[hsl(var(--foreground))]"
        >
          {pendingBackupCode}
        </p>
      </div>

      <!-- Copy Button -->
      <button
        onclick={async () => {
          if (pendingBackupCode) {
            await navigator.clipboard.writeText(pendingBackupCode);
            backupCodeCopied = true;
            setTimeout(() => (backupCodeCopied = false), 2000);
          }
        }}
        class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[hsl(var(--border))] px-4 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
      >
        {#if backupCodeCopied}
          <Check class="h-4 w-4 text-green-500" />
          Copié !
        {:else}
          <Copy class="h-4 w-4" />
          Copier le code
        {/if}
      </button>

      <!-- Warning -->
      <div
        class="mt-4 rounded-lg bg-[hsl(var(--destructive))]/10 p-3 text-center text-xs text-[hsl(var(--destructive))]"
      >
        <AlertTriangle class="inline h-3.5 w-3.5 mr-1" />
        Ce code ne sera plus affiché après cette page.
      </div>

      <!-- Continue Button -->
      <button
        onclick={() => {
          showBackupModal = false;
          pendingBackupCode = null;
          goto('/dashboard');
        }}
        class="mt-6 w-full rounded-xl bg-linear-to-r from-[hsl(var(--primary))] to-[hsl(var(--gold))] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl"
      >
        J'ai noté mon code — Continuer
      </button>
    </div>
  </div>
{/if}
