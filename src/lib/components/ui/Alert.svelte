<script lang="ts">
  import { cn } from '$lib/utils';
  import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-svelte';

  interface Props {
    type?: 'info' | 'success' | 'warning' | 'error';
    title?: string;
    dismissible?: boolean;
    class?: string;
    onDismiss?: () => void;
    children?: import('svelte').Snippet;
  }

  let {
    type = 'info',
    title,
    dismissible = false,
    class: className,
    onDismiss,
    children,
  }: Props = $props();

  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle,
  };

  const styles = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    success: 'bg-green-500/10 border-green-500/30 text-green-400',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
  };

  const Icon = $derived(icons[type]);
</script>

<div class={cn('flex items-start gap-3 rounded-lg border p-4', styles[type], className)}>
  <Icon class="h-5 w-5 shrink-0 mt-0.5" />
  <div class="flex-1">
    {#if title}
      <h4 class="font-medium mb-1">{title}</h4>
    {/if}
    <div class="text-sm opacity-90">
      {#if children}
        {@render children()}
      {/if}
    </div>
  </div>
  {#if dismissible}
    <button onclick={onDismiss} class="shrink-0 p-1 hover:opacity-70 transition-opacity">
      <X class="h-4 w-4" />
    </button>
  {/if}
</div>
