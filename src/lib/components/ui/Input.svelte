<script lang="ts">
  import { cn } from '$lib/utils';
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props {
    type?: 'text' | 'password' | 'email' | 'number';
    placeholder?: string;
    value?: string;
    disabled?: boolean;
    error?: string;
    class?: string;
    autocomplete?: HTMLInputAttributes['autocomplete'];
    oninput?: (e: Event) => void;
  }

  let {
    type = 'text',
    placeholder = '',
    value = $bindable(''),
    disabled = false,
    error,
    class: className,
    autocomplete,
    oninput,
  }: Props = $props();
</script>

<div class="w-full">
  <input
    {type}
    {placeholder}
    {disabled}
    {autocomplete}
    bind:value
    {oninput}
    class={cn(
      'w-full rounded-lg border bg-[hsl(var(--input))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] transition-colors',
      'focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20',
      'disabled:cursor-not-allowed disabled:opacity-50',
      error ? 'border-[hsl(var(--destructive))]' : 'border-[hsl(var(--border))]',
      className,
    )}
  />
  {#if error}
    <p class="mt-1 text-xs text-[hsl(var(--destructive))]">{error}</p>
  {/if}
</div>
