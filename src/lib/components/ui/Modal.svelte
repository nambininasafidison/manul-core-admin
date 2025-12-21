<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    open?: boolean;
    title?: string;
    onClose?: () => void;
    class?: string;
    children?: import('svelte').Snippet;
  }

  let { open = $bindable(false), title, onClose, class: className, children }: Props = $props();

  function handleClose() {
    open = false;
    onClose?.();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') handleClose();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
    onclick={handleClose}
    role="presentation"
  ></div>

  <!-- Modal -->
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      class={cn(
        'relative max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl border border-border bg-background p-6 shadow-2xl',
        className,
      )}
      role="dialog"
      aria-modal="true"
    >
      {#if title}
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-xl font-semibold text-foreground">{title}</h2>
          <button
            class="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            onclick={handleClose}
            aria-label="Close modal"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      {/if}

      {@render children?.()}
    </div>
  </div>
{/if}
