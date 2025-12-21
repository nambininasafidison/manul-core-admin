<script lang="ts">
  import { Alert, Button } from '$lib/components/ui';
  import { Shield, Smartphone } from 'lucide-svelte';
  import { onMount } from 'svelte';

  interface Props {
    onSubmit: (code: string) => Promise<void>;
    onResend?: () => Promise<void>;
    isLoading?: boolean;
    error?: string;
  }

  let { onSubmit, onResend, isLoading = false, error }: Props = $props();

  let code = $state(['', '', '', '', '', '']);
  let inputs: HTMLInputElement[] = [];
  let countdown = $state(0);

  function handleInput(index: number, e: Event) {
    const target = e.target as HTMLInputElement;
    const value = target.value.replace(/\D/g, '');

    if (value.length === 1) {
      code[index] = value;
      if (index < 5) {
        inputs[index + 1]?.focus();
      }
    } else if (value.length > 1) {
      // Handle paste
      const values = value.slice(0, 6).split('');
      values.forEach((v, i) => {
        if (index + i < 6) {
          code[index + i] = v;
        }
      });
      const lastIndex = Math.min(index + values.length - 1, 5);
      inputs[lastIndex]?.focus();
    }
  }

  function handleKeydown(index: number, e: KeyboardEvent) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs[index - 1]?.focus();
    }
  }

  async function handleSubmit() {
    const fullCode = code.join('');
    if (fullCode.length !== 6) return;
    await onSubmit(fullCode);
  }

  async function handleResend() {
    if (countdown > 0 || !onResend) return;
    await onResend();
    countdown = 30;
  }

  onMount(() => {
    inputs[0]?.focus();

    const interval = setInterval(() => {
      if (countdown > 0) countdown--;
    }, 1000);

    return () => clearInterval(interval);
  });

  $effect(() => {
    if (code.every((c) => c.length === 1)) {
      handleSubmit();
    }
  });
</script>

<div class="space-y-6">
  <div class="text-center">
    <div
      class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--primary))]/20"
    >
      <Shield class="h-8 w-8 text-[hsl(var(--primary))]" />
    </div>
    <h2 class="text-xl font-bold text-[hsl(var(--foreground))]">TOTP Verification</h2>
    <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
      Enter the 6-digit code from your authenticator app
    </p>
  </div>

  {#if error}
    <Alert type="error" title="Invalid Code">
      {error}
    </Alert>
  {/if}

  <div class="flex justify-center gap-2">
    {#each code as digit, index}
      <input
        bind:this={inputs[index]}
        type="text"
        inputmode="numeric"
        maxlength="6"
        value={digit}
        oninput={(e) => handleInput(index, e)}
        onkeydown={(e) => handleKeydown(index, e)}
        disabled={isLoading}
        class="h-14 w-12 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] text-center text-2xl font-bold text-[hsl(var(--foreground))] transition-all focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20 disabled:opacity-50"
      />
    {/each}
  </div>

  <div class="flex items-center justify-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
    <Smartphone class="h-4 w-4" />
    <span>Open Google Authenticator or similar app</span>
  </div>

  <Button
    variant="gradient"
    size="lg"
    class="w-full"
    onclick={handleSubmit}
    loading={isLoading}
    disabled={code.some((c) => !c)}
  >
    {#if isLoading}
      Verifying...
    {:else}
      Verify Code
    {/if}
  </Button>

  {#if onResend}
    <div class="text-center">
      <button
        onclick={handleResend}
        disabled={countdown > 0}
        class="text-sm text-[hsl(var(--primary))] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
      >
        {#if countdown > 0}
          Resend code in {countdown}s
        {:else}
          Didn't receive code? Resend
        {/if}
      </button>
    </div>
  {/if}
</div>
