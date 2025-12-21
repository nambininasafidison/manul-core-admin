<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    variant?: 'default' | 'glass' | 'gradient';
    class?: string;
    children?: import('svelte').Snippet;
  }

  let { variant = 'default', class: className, children }: Props = $props();

  const variants = {
    default: 'bg-[hsl(var(--card))] border border-[hsl(var(--border))]',
    glass: 'glass-effect',
    gradient:
      'bg-gradient-to-br from-[hsl(var(--card))] to-[hsl(var(--secondary))] border border-[hsl(var(--border))]',
  };
</script>

<div class={cn('rounded-xl p-4', variants[variant], className)}>
  {#if children}
    {@render children()}
  {/if}
</div>
