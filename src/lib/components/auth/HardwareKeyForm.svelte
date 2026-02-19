<script lang="ts">
  import { adminApi } from '$lib/api/client';
  import { Alert, Button, Input } from '$lib/components/ui';
  import { AlertTriangle, Key, Shield } from 'lucide-svelte';

  interface Props {
    onVerify: (response: string) => Promise<void>;
    onUseBackupCode: () => void;
    challenge?: string;
    isLoading?: boolean;
    error?: string;
  }

  let { onVerify, onUseBackupCode, challenge, isLoading = false, error }: Props = $props();

  let backupCode = $state('');
  let mode = $state<'detecting' | 'passkey' | 'backup'>('detecting');
  let isRegistering = $state(false);
  let registrationStep = $state<'checking' | 'register' | 'authenticate'>('checking');
  let statusMessage = $state('');
  let webauthnSupported = $state(false);

  // Auto-détection au montage
  $effect(() => {
    autoDetectAndRoute();
  });

  async function autoDetectAndRoute() {
    statusMessage = "Détection des méthodes d'authentification...";

    // 1. Vérifier si WebAuthn est supporté par le navigateur
    if (!window.PublicKeyCredential) {
      webauthnSupported = false;
      mode = 'backup';
      statusMessage = "WebAuthn non supporté — utilisez un code d'urgence";
      return;
    }

    webauthnSupported = true;
    mode = 'passkey';

    // 2. Vérifier si un credential est déjà enregistré
    try {
      const authOptions = await adminApi.getWebAuthnAuthOptions();
      if (authOptions.has_credentials) {
        registrationStep = 'authenticate';
        statusMessage = 'Authentifiez-vous avec votre passkey';
      } else {
        registrationStep = 'register';
        statusMessage = 'Premier accès — enregistrez votre passkey';
      }
    } catch {
      registrationStep = 'register';
      statusMessage = 'Premier accès — enregistrez votre passkey';
    }
  }

  /**
   * Enregistrer un nouveau credential WebAuthn (passkey)
   * Supporte: fingerprint, Face ID, Microsoft Authenticator, Google Passkey, YubiKey...
   * On ne restreint PAS authenticatorAttachment pour laisser le navigateur proposer toutes les options.
   */
  async function handleRegistration() {
    isRegistering = true;
    statusMessage = "Sélectionnez votre méthode d'authentification...";

    try {
      // Ne pas spécifier authenticator_type → le serveur omet authenticatorAttachment
      // → le navigateur propose TOUTES les options (fingerprint, passkey, security key, phone...)
      const options = await adminApi.getWebAuthnRegisterOptions();

      const challengeBytes = new Uint8Array(
        (options.challenge.match(/.{2}/g) || []).map((b: string) => parseInt(b, 16)),
      );
      const userIdBytes = new Uint8Array(
        (options.user.id.match(/.{2}/g) || []).map((b: string) => parseInt(b, 16)),
      );

      // Construire authenticatorSelection à partir du serveur
      const authSelection: AuthenticatorSelectionCriteria = {
        userVerification: (options.authenticatorSelection?.userVerification ||
          'required') as UserVerificationRequirement,
        residentKey: (options.authenticatorSelection?.residentKey ||
          'preferred') as ResidentKeyRequirement,
      };
      // N'ajouter authenticatorAttachment que si le serveur l'a envoyé
      if (options.authenticatorSelection?.authenticatorAttachment) {
        authSelection.authenticatorAttachment = options.authenticatorSelection
          .authenticatorAttachment as AuthenticatorAttachment;
      }

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: challengeBytes,
          rp: { name: options.rp.name, id: options.rp.id },
          user: {
            id: userIdBytes,
            name: options.user.name,
            displayName: options.user.displayName,
          },
          pubKeyCredParams: options.pubKeyCredParams.map((p) => ({
            type: 'public-key' as const,
            alg: p.alg,
          })),
          authenticatorSelection: authSelection,
          timeout: options.timeout,
          attestation: (options.attestation || 'none') as AttestationConveyancePreference,
        },
      });

      if (!credential) {
        statusMessage = 'Enregistrement annulé';
        isRegistering = false;
        return;
      }

      const pkCredential = credential as PublicKeyCredential;
      const attestationResponse = pkCredential.response as AuthenticatorAttestationResponse;

      const credentialId = btoa(String.fromCharCode(...new Uint8Array(pkCredential.rawId)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      const publicKeyHex = Array.from(
        new Uint8Array(
          attestationResponse.getPublicKey?.() || attestationResponse.attestationObject,
        ),
      )
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      // Détecter le type d'authenticator utilisé
      const authenticatorType = pkCredential.authenticatorAttachment || 'cross-platform';
      const label =
        authenticatorType === 'platform'
          ? `${navigator.platform} Biometric`
          : `Passkey / Security Key`;

      const result = await adminApi.registerWebAuthnCredential(
        credentialId,
        publicKeyHex,
        authenticatorType,
        label,
      );

      if (result.success) {
        statusMessage = '✅ Passkey enregistrée ! Authentification complète.';
        await onVerify(`registered:${credentialId}`);
      }
    } catch (e) {
      console.error('WebAuthn registration error:', e);
      if (e instanceof Error && e.name === 'NotAllowedError') {
        statusMessage = "Enregistrement annulé par l'utilisateur";
      } else {
        statusMessage = `Erreur : ${e instanceof Error ? e.message : 'Enregistrement échoué'}`;
      }
    } finally {
      isRegistering = false;
    }
  }

  /**
   * S'authentifier avec une passkey déjà enregistrée
   * Le navigateur propose automatiquement les authenticators disponibles
   */
  async function handlePasskeyAuth() {
    statusMessage = 'Authentification en cours...';

    try {
      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn non supporté');
      }

      // Récupérer les options d'authentification (challenge + credentials autorisés)
      const authOptions = await adminApi.getWebAuthnAuthOptions();
      const challengeHex = authOptions.challenge;
      const challengeBytes = new Uint8Array(
        (challengeHex.match(/.{2}/g) || []).map((b: string) => parseInt(b, 16)),
      );

      // Construire la liste des credentials autorisés
      const allowCredentials: PublicKeyCredentialDescriptor[] = (
        authOptions.allowCredentials || []
      ).map((c) => {
        // Decode base64url credential ID to Uint8Array
        const idStr = c.id.replace(/-/g, '+').replace(/_/g, '/');
        const padded = idStr + '='.repeat((4 - (idStr.length % 4)) % 4);
        const binary = atob(padded);
        const idBytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) idBytes[i] = binary.charCodeAt(i);
        return {
          type: 'public-key' as const,
          id: idBytes,
          transports: (c.transports || []) as AuthenticatorTransport[],
        };
      });

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: challengeBytes,
          timeout: 120000,
          rpId: authOptions.rpId || window.location.hostname,
          allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
          userVerification: 'required',
        },
      });

      if (!credential) {
        statusMessage = 'Authentification annulée';
        return;
      }

      const pkCredential = credential as PublicKeyCredential;
      const authResponse = pkCredential.response as AuthenticatorAssertionResponse;

      // Extraire le credential_id (base64url)
      const credentialId = btoa(String.fromCharCode(...new Uint8Array(pkCredential.rawId)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      // Extraire le clientDataJSON en base64url pour vérification du challenge côté serveur
      const clientDataB64 = btoa(
        String.fromCharCode(...new Uint8Array(authResponse.clientDataJSON)),
      )
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      // Extraire authenticatorData en base64url (pour vérification signature)
      const authenticatorDataB64 = btoa(
        String.fromCharCode(...new Uint8Array(authResponse.authenticatorData)),
      )
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      // Extraire la signature en base64url (ASN.1 DER format)
      const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(authResponse.signature)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      // Format: "passkey:<credential_id>:<clientDataB64>:<authenticatorDataB64>:<signatureB64>"
      // Le login page extrait tous les champs et envoie via verifyHardwareKey
      await onVerify(
        `passkey:${credentialId}:${clientDataB64}:${authenticatorDataB64}:${signatureB64}`,
      );
    } catch (e) {
      console.error('Passkey auth error:', e);
      if (e instanceof Error && e.name === 'NotAllowedError') {
        statusMessage = "Authentification annulée par l'utilisateur";
      } else {
        statusMessage = `Erreur : ${e instanceof Error ? e.message : 'Authentification échouée'}`;
      }
    }
  }

  async function handleBackupCode() {
    if (!backupCode || backupCode.length < 8) return;
    await onVerify(`backup:${backupCode}`);
  }
</script>

<div class="space-y-6">
  <div class="text-center">
    <div
      class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--gold))]/20"
    >
      {#if mode === 'passkey'}
        <Key class="h-8 w-8 text-[hsl(var(--gold))]" />
      {:else if mode === 'backup'}
        <AlertTriangle class="h-8 w-8 text-[hsl(var(--gold))]" />
      {:else}
        <Shield class="h-8 w-8 text-[hsl(var(--gold))]" />
      {/if}
    </div>
    <h2 class="text-xl font-bold text-[hsl(var(--foreground))]">
      {#if mode === 'detecting'}
        Détection en cours...
      {:else if mode === 'backup'}
        Code d'urgence
      {:else if mode === 'passkey' && registrationStep === 'register'}
        Enregistrement passkey
      {:else}
        Authentification passkey
      {/if}
    </h2>
    <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
      {statusMessage}
    </p>
  </div>

  {#if error}
    <Alert type="error" title="Échec de vérification">
      {error}
    </Alert>
  {/if}

  {#if mode === 'detecting'}
    <!-- DÉTECTION EN COURS -->
    <div class="flex justify-center py-8">
      <div class="animate-pulse rounded-full bg-[hsl(var(--primary))]/20 p-6">
        <Shield class="h-12 w-12 text-[hsl(var(--primary))]" />
      </div>
    </div>
  {:else if mode === 'backup'}
    <!-- MODE URGENCE : Code de secours -->
    <div class="space-y-4">
      <div
        class="rounded-lg bg-[hsl(var(--destructive))]/10 p-3 text-center text-xs text-[hsl(var(--destructive))]"
      >
        <AlertTriangle class="inline h-4 w-4 mr-1" />
        Mode d'urgence — les codes sont à usage unique
      </div>

      <Input
        type="text"
        placeholder="Code d'urgence (ex: XXXX-XXXX)"
        bind:value={backupCode}
        disabled={isLoading}
        class="text-center font-mono text-lg tracking-widest"
      />

      <Button
        variant="gradient"
        size="lg"
        class="w-full"
        onclick={handleBackupCode}
        loading={isLoading}
        disabled={backupCode.length < 8}
      >
        {#if isLoading}
          Vérification...
        {:else}
          Valider le code d'urgence
        {/if}
      </Button>

      {#if webauthnSupported}
        <button
          onclick={() => {
            mode = 'passkey';
            backupCode = '';
          }}
          class="mx-auto block text-sm text-[hsl(var(--primary))] hover:underline"
        >
          ← Retour à l'authentification passkey
        </button>
      {/if}
    </div>
  {:else if mode === 'passkey' && registrationStep === 'register'}
    <!-- PREMIER ACCÈS : Enregistrement passkey -->
    <div class="space-y-4">
      <div
        class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-center"
      >
        <div class="mb-4 flex items-center justify-center">
          <div
            class="rounded-full bg-[hsl(var(--primary))]/20 p-4"
            class:animate-pulse={isRegistering}
          >
            <Key class="h-12 w-12 text-[hsl(var(--primary))]" />
          </div>
        </div>
        <p class="text-sm font-medium text-[hsl(var(--foreground))]">Enregistrez votre passkey</p>
        <p class="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
          Votre navigateur va vous proposer les méthodes disponibles : empreinte digitale, Face ID,
          Microsoft Authenticator, Google Passkey, clé de sécurité USB/NFC...
        </p>
      </div>

      <Button
        variant="gradient"
        size="lg"
        class="w-full"
        onclick={handleRegistration}
        loading={isRegistering || isLoading}
      >
        {#if isRegistering}
          En attente de confirmation...
        {:else}
          <Shield class="h-5 w-5" />
          Enregistrer une passkey
        {/if}
      </Button>

      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-[hsl(var(--border))]"></div>
        </div>
        <div class="relative flex justify-center text-xs uppercase">
          <span class="bg-[hsl(var(--background))] px-2 text-[hsl(var(--muted-foreground))]"
            >urgence</span
          >
        </div>
      </div>

      <Button variant="outline" size="sm" class="w-full" onclick={() => (mode = 'backup')}>
        <AlertTriangle class="h-4 w-4" />
        Code d'urgence
      </Button>
    </div>
  {:else if mode === 'passkey'}
    <!-- AUTHENTIFICATION avec passkey existante -->
    <div class="space-y-4">
      <div
        class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-center"
      >
        <div class="mb-4 flex items-center justify-center">
          <div class="animate-pulse rounded-full bg-[hsl(var(--primary))]/20 p-4">
            <Key class="h-12 w-12 text-[hsl(var(--primary))]" />
          </div>
        </div>
        <p class="text-sm text-[hsl(var(--muted-foreground))]">
          Utilisez votre passkey enregistrée (fingerprint, Face ID, Microsoft Authenticator, Google
          Passkey, clé USB/NFC...)
        </p>
      </div>

      <Button
        variant="gradient"
        size="lg"
        class="w-full"
        onclick={handlePasskeyAuth}
        loading={isLoading}
      >
        {#if isLoading}
          Authentification...
        {:else}
          <Shield class="h-5 w-5" />
          S'authentifier avec passkey
        {/if}
      </Button>

      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-[hsl(var(--border))]"></div>
        </div>
        <div class="relative flex justify-center text-xs uppercase">
          <span class="bg-[hsl(var(--background))] px-2 text-[hsl(var(--muted-foreground))]"
            >urgence</span
          >
        </div>
      </div>

      <Button variant="outline" size="sm" class="w-full" onclick={() => (mode = 'backup')}>
        <AlertTriangle class="h-4 w-4" />
        Code d'urgence
      </Button>
    </div>
  {/if}

  {#if mode !== 'detecting'}
    <div
      class="rounded-lg bg-[hsl(var(--warning))]/10 p-3 text-center text-xs text-[hsl(var(--warning))]"
    >
      ⚠️ Dernière vérification de sécurité. Seul l'administrateur autorisé peut continuer.
    </div>
  {/if}
</div>
