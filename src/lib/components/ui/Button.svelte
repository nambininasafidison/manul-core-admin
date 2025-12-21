<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'gradient';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    disabled?: boolean;
    loading?: boolean;
    type?: 'button' | 'submit' | 'reset';
    class?: string;
    onclick?: () => void;
    children?: import('svelte').Snippet;
  }

  let {
    variant = 'default',
    size = 'default',
    disabled = false,
    loading = false,
    type = 'button',
    class: className,
    onclick,
    children,
  }: Props = $props();

  const baseStyles =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const variants = {
    default: 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90',
    destructive:
      'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:opacity-90',
    outline: 'border border-[hsl(var(--border))] bg-transparent hover:bg-[hsl(var(--secondary))]',
    secondary:
      'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:opacity-80',
    ghost: 'hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]',
    gradient:
      'bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-white hover:opacity-90',
  };

  const sizes = {
    default: 'h-10 px-4 py-2 text-sm',
    sm: 'h-8 px-3 text-xs',
    lg: 'h-12 px-6 text-base',
    icon: 'h-10 w-10',
  };
</script>

<button
  {type}
  class={cn(baseStyles, variants[variant], sizes[size], className)}
  disabled={disabled || loading}
  {onclick}
>
  {#if loading}
    <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  {/if}
  {#if children}
    {@render children()}
  {/if}
</button>
