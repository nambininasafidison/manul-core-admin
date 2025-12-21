<script lang="ts">
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores';
  import { cn } from '$lib/utils';
  import {
    Activity,
    Bot,
    Coins,
    Database,
    FileText,
    Home,
    Settings,
    Shield,
    User,
    Users,
    X,
  } from 'lucide-svelte';

  interface Props {
    isOpen?: boolean;
    onClose?: () => void;
    class?: string;
  }

  let { isOpen = $bindable(false), onClose, class: className }: Props = $props();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/bots', label: 'Bots', icon: Bot },
    { href: '/users', label: 'Users', icon: Users },
    { href: '/finance', label: 'Finance', icon: Coins },
    { href: '/rentals', label: 'Rentals', icon: Activity },
  ];

  const secondaryItems = [
    { href: '/audit', label: 'Audit Logs', icon: FileText },
    { href: '/security', label: 'Security', icon: Shield },
    { href: '/database', label: 'Database', icon: Database },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];
</script>

<!-- Mobile overlay -->
{#if isOpen}
  <button
    type="button"
    class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden cursor-default border-none"
    onclick={onClose}
    aria-label="Close sidebar"
  ></button>
{/if}

<!-- Sidebar -->
<aside
  class={cn(
    'fixed left-0 top-0 z-50 h-screen w-64 bg-[hsl(var(--card))]/95 backdrop-blur-xl transition-all duration-300 border-r border-[hsl(var(--border))]',
    'lg:relative lg:z-auto',
    isOpen
      ? 'translate-x-0'
      : '-translate-x-full lg:w-0 lg:translate-x-0 lg:overflow-hidden lg:border-r-0',
    className,
  )}
>
  <div class="flex h-full flex-col">
    <!-- Logo -->
    <div
      class="flex h-16 items-center justify-between gap-3 border-b border-[hsl(var(--border))] px-4"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))]"
        >
          <span class="text-2xl">🐱</span>
        </div>
        <div>
          <h1 class="font-bold text-[hsl(var(--foreground))]">Manul Admin</h1>
          <p class="text-xs text-[hsl(var(--muted-foreground))]">Creator Dashboard</p>
        </div>
      </div>
      <!-- Close button (mobile only) -->
      <button
        type="button"
        class="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] lg:hidden"
        onclick={onClose}
        aria-label="Close sidebar"
      >
        <X class="h-5 w-5" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 space-y-1 overflow-y-auto p-4">
      <div class="mb-4">
        <p
          class="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]"
        >
          Main
        </p>
        {#each navItems as item}
          {@const isActive =
            $page.url.pathname === item.href || $page.url.pathname.startsWith(item.href + '/')}
          <a
            href={item.href}
            class={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
              isActive
                ? 'bg-[hsl(var(--primary))] text-white shadow-lg shadow-[hsl(var(--primary))]/20'
                : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]',
            )}
            onclick={onClose}
          >
            <item.icon class="h-5 w-5" />
            {item.label}
          </a>
        {/each}
      </div>

      <div>
        <p
          class="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]"
        >
          System
        </p>
        {#each secondaryItems as item}
          {@const isActive =
            $page.url.pathname === item.href || $page.url.pathname.startsWith(item.href + '/')}
          <a
            href={item.href}
            class={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
              isActive
                ? 'bg-[hsl(var(--primary))] text-white'
                : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]',
            )}
            onclick={onClose}
          >
            <item.icon class="h-5 w-5" />
            {item.label}
          </a>
        {/each}
      </div>
    </nav>

    <!-- User info -->
    <div class="border-t border-[hsl(var(--border))] p-4">
      <div class="flex items-center gap-3 rounded-xl bg-[hsl(var(--secondary))]/50 p-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-white"
        >
          <User class="h-5 w-5" />
        </div>
        <div class="flex-1">
          <p class="font-medium text-[hsl(var(--foreground))]">
            {$authStore.user?.username || 'Admin'}
          </p>
          <p class="text-xs text-[hsl(var(--muted-foreground))]">Administrator</p>
        </div>
      </div>
    </div>
  </div>
</aside>
