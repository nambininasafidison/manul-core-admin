<script lang="ts">
  import { Alert, Button, Input } from '$lib/components/ui';
  import { Fingerprint, Key, Shield } from 'lucide-svelte';

  interface Props {
    onVerify: (response: string) => Promise<void>;
    onUseBackupCode: () => void;
    challenge?: string;
    isLoading?: boolean;
    error?: string;
  }

  let { onVerify, onUseBackupCode, challenge, isLoading = false, error }: Props = $props();

  let backupCode = $state('');
  let isUsingBackup = $state(false);

  async function handleHardwareKey() {
    // In production, this would use WebAuthn API
    // For demo, we simulate hardware key verification
    try {
      // Simulate hardware key response
      const mockResponse = crypto.randomUUID();
      await onVerify(mockResponse);
    } catch (e) {
      console.error('Hardware key error:', e);
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
      <Key class="h-8 w-8 text-[hsl(var(--gold))]" />
    </div>
    <h2 class="text-xl font-bold text-[hsl(var(--foreground))]">Security Key Verification</h2>
    <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
      {#if isUsingBackup}
        Enter your backup recovery code
      {:else}
        Use your hardware security key to complete authentication
      {/if}
    </p>
  </div>

  {#if error}
    <Alert type="error" title="Verification Failed">
      {error}
    </Alert>
  {/if}

  {#if isUsingBackup}
    <div class="space-y-4">
      <Input
        type="text"
        placeholder="Enter backup code (e.g., XXXX-XXXX-XXXX)"
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
          Verifying...
        {:else}
          Verify Backup Code
        {/if}
      </Button>

      <button
        onclick={() => (isUsingBackup = false)}
        class="mx-auto block text-sm text-[hsl(var(--primary))] hover:underline"
      >
        ← Use hardware key instead
      </button>
    </div>
  {:else}
    <div class="space-y-4">
      <div
        class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-center"
      >
        <div class="mb-4 flex items-center justify-center">
          <div class="animate-pulse rounded-full bg-[hsl(var(--primary))]/20 p-4">
            <Fingerprint class="h-12 w-12 text-[hsl(var(--primary))]" />
          </div>
        </div>
        <p class="text-sm text-[hsl(var(--muted-foreground))]">
          Insert and touch your security key when it blinks
        </p>
        {#if challenge}
          <p class="mt-2 font-mono text-xs text-[hsl(var(--muted-foreground))] opacity-50">
            Challenge: {challenge.slice(0, 16)}...
          </p>
        {/if}
      </div>

      <Button
        variant="gradient"
        size="lg"
        class="w-full"
        onclick={handleHardwareKey}
        loading={isLoading}
      >
        {#if isLoading}
          Waiting for key...
        {:else}
          <Shield class="h-5 w-5" />
          Authenticate with Security Key
        {/if}
      </Button>

      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-[hsl(var(--border))]"></div>
        </div>
        <div class="relative flex justify-center text-xs uppercase">
          <span class="bg-[hsl(var(--background))] px-2 text-[hsl(var(--muted-foreground))]"
            >or</span
          >
        </div>
      </div>

      <Button variant="outline" size="lg" class="w-full" onclick={() => (isUsingBackup = true)}>
        Use Backup Code
      </Button>
    </div>
  {/if}

  <div
    class="rounded-lg bg-[hsl(var(--warning))]/10 p-3 text-center text-xs text-[hsl(var(--warning))]"
  >
    ⚠️ This is the final security check. Only proceed if you are the authorized administrator.
  </div>
</div>
