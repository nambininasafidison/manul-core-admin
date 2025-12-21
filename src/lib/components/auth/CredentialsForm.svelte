<script lang="ts">
  import { Alert, Button, Input } from '$lib/components/ui';
  import { Eye, EyeOff, Lock, User } from 'lucide-svelte';

  interface Props {
    onSubmit: (username: string, password: string) => Promise<void>;
    isLoading?: boolean;
    error?: string;
    attemptsRemaining?: number;
    lockoutRemaining?: number;
  }

  let { onSubmit, isLoading = false, error, attemptsRemaining, lockoutRemaining }: Props = $props();

  let username = $state('');
  let password = $state('');
  let showPassword = $state(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!username || !password) return;
    await onSubmit(username, password);
  }

  function formatTime(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
</script>

<form onsubmit={handleSubmit} class="space-y-6">
  {#if lockoutRemaining && lockoutRemaining > 0}
    <Alert type="error" title="Account Locked">
      Too many failed attempts. Please wait {formatTime(lockoutRemaining)} before trying again.
    </Alert>
  {:else if error}
    <Alert type="error" title="Authentication Failed">
      {error}
      {#if attemptsRemaining !== undefined && attemptsRemaining > 0}
        <span class="block mt-1 text-xs opacity-75">
          {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
        </span>
      {/if}
    </Alert>
  {/if}

  <div class="space-y-4">
    <div>
      <label for="username" class="mb-2 block text-sm font-medium text-[hsl(var(--foreground))]">
        Username
      </label>
      <div class="relative">
        <User
          class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
        />
        <Input
          type="text"
          placeholder="Enter your username"
          bind:value={username}
          disabled={isLoading || !!(lockoutRemaining && lockoutRemaining > 0)}
          autocomplete="username"
          class="pl-10"
        />
      </div>
    </div>

    <div>
      <label for="password" class="mb-2 block text-sm font-medium text-[hsl(var(--foreground))]">
        Password
      </label>
      <div class="relative">
        <Lock
          class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
        />
        <Input
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          bind:value={password}
          disabled={isLoading || !!(lockoutRemaining && lockoutRemaining > 0)}
          autocomplete="current-password"
          class="pl-10 pr-10"
        />
        <button
          type="button"
          onclick={() => (showPassword = !showPassword)}
          class="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        >
          {#if showPassword}
            <EyeOff class="h-5 w-5" />
          {:else}
            <Eye class="h-5 w-5" />
          {/if}
        </button>
      </div>
    </div>
  </div>

  <Button
    type="submit"
    variant="gradient"
    size="lg"
    class="w-full"
    loading={isLoading}
    disabled={!username || !password || !!(lockoutRemaining && lockoutRemaining > 0)}
  >
    {#if isLoading}
      Verifying...
    {:else}
      Continue to TOTP
    {/if}
  </Button>

  <p class="text-center text-xs text-[hsl(var(--muted-foreground))]">
    🔒 Secured with 256-bit encryption
  </p>
</form>
