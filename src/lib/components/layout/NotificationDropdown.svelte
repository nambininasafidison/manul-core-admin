<script lang="ts">
  import {
    notificationStore,
    unreadCount,
    type AdminNotification,
  } from '$lib/stores/notifications';
  import {
    CheckCheck,
    Trash2,
    X,
    AlertTriangle,
    Info,
    ShieldAlert,
    Server,
    CheckCircle2,
    XCircle,
  } from 'lucide-svelte';

  interface Props {
    open: boolean;
    onclose: () => void;
  }

  let { open, onclose }: Props = $props();

  let notifications = $state<AdminNotification[]>([]);
  let unread = $state(0);

  notificationStore.subscribe((v) => (notifications = v));
  unreadCount.subscribe((v) => (unread = v));

  function getIcon(type: AdminNotification['type']) {
    switch (type) {
      case 'warning':
        return AlertTriangle;
      case 'error':
        return XCircle;
      case 'success':
        return CheckCircle2;
      case 'security':
        return ShieldAlert;
      case 'system':
        return Server;
      default:
        return Info;
    }
  }

  function getColor(type: AdminNotification['type']) {
    switch (type) {
      case 'warning':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      case 'success':
        return 'text-emerald-400';
      case 'security':
        return 'text-orange-400';
      case 'system':
        return 'text-blue-400';
      default:
        return 'text-[hsl(var(--muted-foreground))]';
    }
  }

  function formatTime(ts: number) {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString();
  }
</script>

{#if open}
  <!-- Backdrop -->
  <button class="fixed inset-0 z-40" onclick={onclose} aria-label="Close notifications"></button>

  <!-- Dropdown -->
  <div
    class="absolute right-0 top-full z-50 mt-2 w-96 max-h-112 overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-2xl"
  >
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-3">
      <h3 class="text-sm font-semibold text-[hsl(var(--foreground))]">
        Notifications {#if unread > 0}<span class="ml-1 text-xs text-[hsl(var(--muted-foreground))]"
            >({unread} unread)</span
          >{/if}
      </h3>
      <div class="flex items-center gap-1">
        {#if unread > 0}
          <button
            class="rounded p-1 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
            title="Mark all as read"
            onclick={() => notificationStore.markAllAsRead()}
          >
            <CheckCheck class="h-4 w-4" />
          </button>
        {/if}
        {#if notifications.length > 0}
          <button
            class="rounded p-1 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-red-400"
            title="Clear all"
            onclick={() => notificationStore.clear()}
          >
            <Trash2 class="h-4 w-4" />
          </button>
        {/if}
      </div>
    </div>

    <!-- List -->
    <div class="max-h-80 overflow-y-auto">
      {#if notifications.length === 0}
        <div
          class="flex flex-col items-center justify-center py-10 text-[hsl(var(--muted-foreground))]"
        >
          <Info class="mb-2 h-8 w-8 opacity-40" />
          <p class="text-sm">No notifications</p>
        </div>
      {:else}
        {#each notifications as notif (notif.id)}
          {@const IconComp = getIcon(notif.type)}
          <div
            class="group flex items-start gap-3 border-b border-[hsl(var(--border))]/50 px-4 py-3 transition-colors hover:bg-[hsl(var(--secondary))]/50 {notif.read
              ? 'opacity-60'
              : ''}"
          >
            <div class="mt-0.5 shrink-0 {getColor(notif.type)}">
              <IconComp class="h-4 w-4" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2">
                <p class="truncate text-sm font-medium text-[hsl(var(--foreground))]">
                  {notif.title}
                </p>
                <span class="shrink-0 text-xs text-[hsl(var(--muted-foreground))]"
                  >{formatTime(notif.timestamp)}</span
                >
              </div>
              <p class="mt-0.5 line-clamp-2 text-xs text-[hsl(var(--muted-foreground))]">
                {notif.message}
              </p>
              {#if notif.source}
                <span
                  class="mt-1 inline-block rounded bg-[hsl(var(--secondary))] px-1.5 py-0.5 text-[10px] text-[hsl(var(--muted-foreground))]"
                  >{notif.source}</span
                >
              {/if}
            </div>
            <div
              class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
            >
              {#if !notif.read}
                <button
                  class="rounded p-0.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  title="Mark as read"
                  onclick={() => notificationStore.markAsRead(notif.id)}
                >
                  <CheckCheck class="h-3.5 w-3.5" />
                </button>
              {/if}
              <button
                class="rounded p-0.5 text-[hsl(var(--muted-foreground))] hover:text-red-400"
                title="Remove"
                onclick={() => notificationStore.remove(notif.id)}
              >
                <X class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>
{/if}

<style>
</style>
