<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui';
  import { authStore, unreadCount } from '$lib/stores';
  import { Bell, LogOut, Menu, PanelLeft, Shield } from 'lucide-svelte';
  import NotificationDropdown from './NotificationDropdown.svelte';

  interface Props {
    onMenuToggle?: () => void;
  }

  let { onMenuToggle }: Props = $props();
  let notifOpen = $state(false);
  let unread = $state(0);

  unreadCount.subscribe((v) => (unread = v));

  function handleLogout() {
    authStore.logout();
    goto('/login');
  }
</script>

<header
  class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 px-4 backdrop-blur"
>
  <!-- Left: Menu toggle -->
  <div class="flex items-center gap-4">
    <button
      class="rounded-lg p-2 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
      onclick={onMenuToggle}
    >
      <Menu class="h-5 w-5 lg:hidden" />
      <PanelLeft class="hidden h-5 w-5 lg:block" />
    </button>

    <div class="hidden items-center gap-2 text-sm lg:flex">
      <Shield class="h-4 w-4 text-[hsl(var(--success))]" />
      <span class="text-[hsl(var(--muted-foreground))]">Triple Auth Active</span>
    </div>
  </div>

  <!-- Right: Actions -->
  <div class="flex items-center gap-3">
    <!-- System Status -->
    <div
      class="hidden items-center gap-2 rounded-full bg-[hsl(var(--success))]/20 px-3 py-1.5 text-sm sm:flex"
    >
      <div class="h-2 w-2 animate-pulse rounded-full bg-[hsl(var(--success))]"></div>
      <span class="text-[hsl(var(--success))]">Online</span>
    </div>

    <!-- Notifications -->
    <div class="relative">
      <button
        class="relative rounded-lg p-2 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
        onclick={() => (notifOpen = !notifOpen)}
        aria-label="Notifications"
      >
        <Bell class="h-5 w-5" />
        {#if unread > 0}
          <span
            class="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--destructive))] text-[10px] font-bold text-white"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        {/if}
      </button>
      <NotificationDropdown open={notifOpen} onclose={() => (notifOpen = false)} />
    </div>

    <!-- Logout -->
    <Button variant="ghost" size="sm" onclick={handleLogout}>
      <LogOut class="h-4 w-4" />
    </Button>
  </div>
</header>
