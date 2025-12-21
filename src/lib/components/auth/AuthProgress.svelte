<script lang="ts">
  import { cn } from '$lib/utils';
  import { CheckCircle, Key, Lock, Shield } from 'lucide-svelte';

  interface Props {
    currentStep: 'credentials' | 'totp' | 'hardware_key' | 'complete';
    class?: string;
  }

  let { currentStep, class: className }: Props = $props();

  const steps = [
    { id: 'credentials', label: 'Credentials', icon: Lock },
    { id: 'totp', label: 'TOTP Code', icon: Shield },
    { id: 'hardware_key', label: 'Security Key', icon: Key },
  ];

  function getStepStatus(stepId: string): 'completed' | 'current' | 'pending' {
    const stepOrder = ['credentials', 'totp', 'hardware_key', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepId);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  }
</script>

<div class={cn('flex items-center justify-center gap-4', className)}>
  {#each steps as step, index}
    {@const status = getStepStatus(step.id)}
    {@const Icon = step.icon}

    {#if index > 0}
      <div
        class={cn(
          'h-px w-12 transition-colors duration-300',
          status === 'completed' || status === 'current'
            ? 'bg-[hsl(var(--primary))]'
            : 'bg-[hsl(var(--border))]',
        )}
      ></div>
    {/if}

    <div class="flex flex-col items-center gap-2">
      <div
        class={cn(
          'flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300',
          status === 'completed' && 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]',
          status === 'current' &&
            'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/20 animate-pulse-glow',
          status === 'pending' && 'border-[hsl(var(--border))] bg-transparent',
        )}
      >
        {#if status === 'completed'}
          <CheckCircle class="h-6 w-6 text-white" />
        {:else if status === 'current'}
          <Icon class="h-6 w-6 text-[hsl(var(--primary))]" />
        {:else}
          <Icon class="h-6 w-6 text-[hsl(var(--muted-foreground))]" />
        {/if}
      </div>
      <span
        class={cn(
          'text-xs font-medium transition-colors',
          status === 'completed' || status === 'current'
            ? 'text-[hsl(var(--foreground))]'
            : 'text-[hsl(var(--muted-foreground))]',
        )}
      >
        {step.label}
      </span>
    </div>
  {/each}
</div>
