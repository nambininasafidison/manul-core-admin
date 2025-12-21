<script lang="ts">
  import { goto } from '$app/navigation';
  import { AuthProgress, CredentialsForm, HardwareKeyForm, TotpForm } from '$lib/components/auth';
  import { Card } from '$lib/components/ui';
  import {
    clearAttempts,
    createSession,
    generateDeviceFingerprint,
    isLockedOut,
    logSecurityEvent,
    recordFailedAttempt,
  } from '$lib/security';
  import { authStore, deviceFingerprintStore, securityAlertsStore } from '$lib/stores';
  import { AlertTriangle, Shield } from 'lucide-svelte';
  import { onMount } from 'svelte';

  let error = $state('');
  let isLoading = $state(false);
  let attemptsRemaining = $state<number | undefined>(undefined);
  let lockoutRemaining = $state<number | undefined>(undefined);
  let challenge = $state<string | undefined>(undefined);

  // Demo credentials (in production, validate against backend)
  const DEMO_ADMIN = {
    username: 'creator',
    password: 'ManulCore2024!@#',
  };

  onMount(() => {
    // Generate and store device fingerprint
    const fingerprint = generateDeviceFingerprint();
    deviceFingerprintStore.set(fingerprint);

    // Check if already authenticated
    if ($authStore.isAuthenticated) {
      goto('/dashboard');
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
      // Simulate API delay
      await new Promise((r) => setTimeout(r, 1000));

      // Validate credentials (demo - in production use secure backend)
      if (username === DEMO_ADMIN.username && password === DEMO_ADMIN.password) {
        clearAttempts(fingerprint);
        const { sessionId, expiresAt } = createSession('admin-001', fingerprint);
        authStore.setSessionId(sessionId, expiresAt);
        authStore.setStep('totp');

        logSecurityEvent('login_success', { deviceFingerprint: fingerprint });
      } else {
        const result = recordFailedAttempt(fingerprint);
        attemptsRemaining = result.attemptsRemaining;

        if (result.locked) {
          lockoutRemaining = 30 * 60 * 1000;
          logSecurityEvent('lockout_triggered', { deviceFingerprint: fingerprint });
          securityAlertsStore.add('error', 'Account locked due to too many failed attempts');
          checkLockout();
        } else {
          error = 'Invalid username or password';
          logSecurityEvent('login_failed', { deviceFingerprint: fingerprint });
        }
      }
    } catch (e) {
      error = 'Authentication service unavailable';
    } finally {
      isLoading = false;
    }
  }

  async function handleTotp(code: string) {
    error = '';
    isLoading = true;

    try {
      await new Promise((r) => setTimeout(r, 800));

      // Demo: accept "000000" or any 6-digit code for testing
      // In production, validate against TOTP secret
      if (code.length === 6) {
        authStore.setStep('hardware_key');
        // Generate challenge for hardware key
        challenge = Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        authStore.setChallengeId(challenge);

        logSecurityEvent('totp_verified', { deviceFingerprint: $deviceFingerprintStore || '' });
      } else {
        error = 'Invalid TOTP code';
        logSecurityEvent('totp_failed', { deviceFingerprint: $deviceFingerprintStore || '' });
      }
    } catch (e) {
      error = 'Verification failed';
    } finally {
      isLoading = false;
    }
  }

  async function handleHardwareKey(response: string) {
    error = '';
    isLoading = true;

    try {
      await new Promise((r) => setTimeout(r, 1000));

      // Demo: accept any response for testing
      // In production, validate WebAuthn response
      if (response) {
        // Complete authentication
        const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
        authStore.completeAuth(
          {
            id: 'admin-001',
            username: 'creator',
            email: 'creator@manulcore.io',
            role: 'creator',
            totpEnabled: true,
            hardwareKeyEnabled: true,
            createdAt: new Date().toISOString(),
          },
          expiresAt,
        );

        logSecurityEvent('hardware_key_verified', {
          deviceFingerprint: $deviceFingerprintStore || '',
        });

        securityAlertsStore.add('success', 'Authentication successful');
        goto('/dashboard');
      } else {
        error = 'Hardware key verification failed';
        logSecurityEvent('hardware_key_failed', {
          deviceFingerprint: $deviceFingerprintStore || '',
        });
      }
    } catch (e) {
      error = 'Verification failed';
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
      <div
        class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))]"
      >
        <span class="text-5xl">🐱</span>
      </div>
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

    <!-- Demo Info (remove in production) -->
    <div class="mt-4 rounded-lg bg-[hsl(var(--primary))]/10 p-4 text-center">
      <p class="text-xs text-[hsl(var(--muted-foreground))]">
        <span class="font-medium text-[hsl(var(--primary))]">Demo Mode:</span> Use credentials
        <code class="mx-1 rounded bg-[hsl(var(--secondary))] px-1">creator</code> /
        <code class="rounded bg-[hsl(var(--secondary))] px-1">ManulCore2024!@#</code>
        <br />
        TOTP: Any 6 digits | Hardware Key: Click verify
      </p>
    </div>
  </div>
</div>
