<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { BottomNav, Header, Sidebar } from '$lib/components/layout';
  import { authStore } from '$lib/stores';
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';

  let { children }: { children: Snippet } = $props();

  let sidebarOpen = $state(true);
  let isMobile = $state(false);
  let mounted = $state(false);

  onMount(() => {
    mounted = true;

    // Détecter si on est sur mobile
    const checkMobile = () => {
      isMobile = window.innerWidth < 1024;
      // Fermer la sidebar par défaut sur mobile
      if (isMobile) {
        sidebarOpen = false;
      } else {
        sidebarOpen = true;
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Check auth
    if (!$authStore.isAuthenticated) {
      goto('/login');
    }

    return () => window.removeEventListener('resize', checkMobile);
  });

  // Watch for auth changes
  $effect(() => {
    if (mounted && !$authStore.isAuthenticated && $page.url.pathname !== '/login') {
      goto('/login');
    }
  });

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
  }

  function closeSidebar() {
    if (isMobile) {
      sidebarOpen = false;
    }
  }
</script>

{#if $authStore.isAuthenticated}
  <div class="flex h-screen overflow-hidden bg-[hsl(var(--background))]">
    <!-- Sidebar -->
    <Sidebar bind:isOpen={sidebarOpen} onClose={closeSidebar} />

    <!-- Main Content -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <Header onMenuToggle={toggleSidebar} />

      <main class="flex-1 overflow-y-auto p-6 pb-24 lg:pb-8">
        {@render children?.()}
      </main>
    </div>

    <!-- Bottom Navigation (mobile) -->
    <BottomNav />
  </div>
{:else}
  {@render children?.()}
{/if}
