<script lang="ts">
  import { page } from '$app/stores';
  import { cn } from '$lib/utils';
  import { Activity, Bot, Home, Settings, Users } from 'lucide-svelte';

  interface Props {
    class?: string;
  }

  let { class: className }: Props = $props();

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/bots', label: 'Bots', icon: Bot },
    { href: '/users', label: 'Users', icon: Users },
    { href: '/rentals', label: 'Rentals', icon: Activity },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];
</script>

<nav
  class={cn(
    'fixed bottom-0 left-0 right-0 z-40 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]/95 backdrop-blur-xl lg:hidden',
    className,
  )}
>
  <div class="flex items-center justify-around py-2">
    {#each navItems as item, index}
      {@const isActive =
        $page.url.pathname === item.href || $page.url.pathname.startsWith(item.href + '/')}
      <a
        href={item.href}
        class={cn(
          'flex flex-col items-center px-4 py-1 transition-all',
          isActive ? 'text-primary' : 'text-muted-foreground',
          index === 2 ? 'rounded-full bg-foreground' : 'rounded-lg ',
        )}
      >
        <div class={cn('rounded-lg p-2 transition-all', isActive && 'bg-[hsl(var(--primary))]/20')}>
          <item.icon class={`${index === 2 ? 'h-8 w-8' : 'h-5 w-5'}`} />
        </div>
        <span class={`${index === 2 ? 'text-md' : 'text-xs'} font-medium`}>{item.label}</span>
      </a>
    {/each}
  </div>
</nav>
