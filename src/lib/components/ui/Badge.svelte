<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
    size?: 'sm' | 'md';
    class?: string;
    children?: import('svelte').Snippet;
  }

  let { variant = 'default', size = 'md', class: className, children }: Props = $props();

  const variants = {
    default: 'bg-secondary text-secondary-foreground',
    success: 'bg-success/20 text-success',
    warning: 'bg-warning/20 text-warning',
    error: 'bg-destructive/20 text-destructive',
    info: 'bg-primary/20 text-primary',
  };

  const sizes = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
  };
</script>

<span
  class={cn(
    'inline-flex items-center rounded-full font-medium',
    variants[variant],
    sizes[size],
    className,
  )}
>
  {@render children?.()}
</span>
