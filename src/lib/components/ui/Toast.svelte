<script lang="ts">
  import { toastStore } from '$lib/stores';
  import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-svelte';
  import { fly } from 'svelte/transition';

  const iconMap = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colorMap = {
    success: 'border-[hsl(var(--success))] bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]',
    error:
      'border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))]',
    warning: 'border-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]',
    info: 'border-[hsl(var(--info))] bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]',
  };
</script>

{#if $toastStore.length > 0}
  <div class="fixed right-4 top-4 z-100 flex flex-col gap-2">
    {#each $toastStore as toast (toast.id)}
      <div
        class="flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm {colorMap[
          toast.type
        ]}"
        transition:fly={{ x: 300, duration: 300 }}
      >
        <svelte:component this={iconMap[toast.type]} class="h-5 w-5 shrink-0" />
        <p class="text-sm font-medium text-[hsl(var(--foreground))]">{toast.message}</p>
        <button
          class="ml-2 shrink-0 opacity-60 hover:opacity-100"
          onclick={() => toastStore.remove(toast.id)}
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    {/each}
  </div>
{/if}
