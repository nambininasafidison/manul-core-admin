<script lang="ts">
  import { goto } from '$app/navigation';
  import { Alert, Button, Card } from '$lib/components/ui';
  import {
    authStore,
    lastActivityStore,
    dashboardStore,
    systemStats as statsStore,
    motherSupreme,
    isLoading,
  } from '$lib/stores';
  import { formatCurrency, formatNumber, formatRelativeTime } from '$lib/utils';
  import {
    Bot,
    ChevronRight,
    Clock,
    Cpu,
    Database,
    DollarSign,
    HardDrive,
    Loader2,
    RefreshCw,
    Server,
    Shield,
    TrendingUp,
    Users,
    Zap,
  } from 'lucide-svelte';
  import { onMount } from 'svelte';

  // Check auth on mount
  onMount(() => {
    if (!$authStore.isAuthenticated) {
      goto('/login');
      return;
    }

    // Load dashboard data
    dashboardStore.loadAll();

    // Update activity on any interaction
    const updateActivity = () => {
      lastActivityStore.set(Date.now());
    };

    document.addEventListener('click', updateActivity);
    document.addEventListener('keydown', updateActivity);

    return () => {
      document.removeEventListener('click', updateActivity);
      document.removeEventListener('keydown', updateActivity);
    };
  });

  // Use store for system stats
  $: systemStats = {
    ...$statsStore,
    motherSupremeCapital: $motherSupreme?.capital ?? 892341.67,
  };

  const recentActivity = [
    {
      type: 'rental',
      user: 'user_8472',
      bot: 'Quantum Alpha',
      amount: 500,
      time: new Date(Date.now() - 300000),
    },
    {
      type: 'spawn',
      bot: 'Neural Trader V3',
      parent: 'Neural Trader V2',
      time: new Date(Date.now() - 900000),
    },
    { type: 'profit', user: 'user_1293', amount: 847.23, time: new Date(Date.now() - 1800000) },
    { type: 'withdrawal', user: 'user_5621', amount: 2500, time: new Date(Date.now() - 3600000) },
    {
      type: 'rental',
      user: 'user_9102',
      bot: 'Chameleon Prime',
      amount: 1200,
      time: new Date(Date.now() - 7200000),
    },
  ];

  const alerts = [
    {
      level: 'warning',
      message: 'High CPU usage on Trading Node 3',
      time: new Date(Date.now() - 1800000),
    },
    {
      level: 'info',
      message: 'Scheduled maintenance in 48 hours',
      time: new Date(Date.now() - 86400000),
    },
  ];

  function handleLogout() {
    authStore.logout();
    goto('/login');
  }

  function handleRefresh() {
    dashboardStore.loadAll();
  }

  function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  }
</script>

<svelte:head>
  <title>Dashboard - Manul Core Admin</title>
</svelte:head>

<!-- Main Content -->
<main class="mx-auto max-w-7xl p-4 lg:p-6">
  <!-- Welcome Section -->
  <div class="mb-8 flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-[hsl(var(--foreground))]">
        Welcome back, {$authStore.user?.username}
      </h2>
      <p class="text-[hsl(var(--muted-foreground))]">
        Here's what's happening with Manul Core today.
      </p>
    </div>
    <Button variant="outline" onclick={handleRefresh} disabled={$isLoading}>
      {#if $isLoading}
        <Loader2 class="h-4 w-4 animate-spin" />
      {:else}
        <RefreshCw class="h-4 w-4" />
      {/if}
      <span class="ml-2">Refresh</span>
    </Button>
  </div>

  <!-- Stats Grid -->
  <div class="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <Card class="p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Total Bots</p>
          <p class="text-2xl font-bold text-[hsl(var(--foreground))]">
            {formatNumber(systemStats.totalBots)}
          </p>
          <p class="text-xs text-[hsl(var(--success))]">{systemStats.activeBots} active</p>
        </div>
        <div class="rounded-lg bg-[hsl(var(--primary))]/20 p-3">
          <Bot class="h-6 w-6 text-[hsl(var(--primary))]" />
        </div>
      </div>
    </Card>

    <Card class="p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Total Users</p>
          <p class="text-2xl font-bold text-[hsl(var(--foreground))]">
            {formatNumber(systemStats.totalUsers)}
          </p>
          <p class="text-xs text-[hsl(var(--primary))]">
            {formatNumber(systemStats.activeRentals)} rentals
          </p>
        </div>
        <div class="rounded-lg bg-[hsl(var(--accent))]/20 p-3">
          <Users class="h-6 w-6 text-[hsl(var(--accent))]" />
        </div>
      </div>
    </Card>

    <Card class="p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Total Capital</p>
          <p class="text-2xl font-bold text-[hsl(var(--foreground))]">
            {formatCurrency(systemStats.totalCapital)}
          </p>
          <p class="text-xs text-[hsl(var(--gold))]">
            Mother: {formatCurrency(systemStats.motherSupremeCapital)}
          </p>
        </div>
        <div class="rounded-lg bg-[hsl(var(--gold))]/20 p-3">
          <DollarSign class="h-6 w-6 text-[hsl(var(--gold))]" />
        </div>
      </div>
    </Card>

    <Card class="p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Total Profit</p>
          <p class="text-2xl font-bold text-[hsl(var(--success))]">
            {formatCurrency(systemStats.totalProfit)}
          </p>
          <p class="text-xs text-[hsl(var(--muted-foreground))]">All time</p>
        </div>
        <div class="rounded-lg bg-[hsl(var(--success))]/20 p-3">
          <TrendingUp class="h-6 w-6 text-[hsl(var(--success))]" />
        </div>
      </div>
    </Card>
  </div>

  <!-- System Health & Activity -->
  <div class="grid gap-6 lg:grid-cols-3">
    <!-- System Health -->
    <Card class="lg:col-span-1">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="font-semibold text-[hsl(var(--foreground))]">System Health</h3>
        <Server class="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
      </div>

      <div class="space-y-4">
        <div>
          <div class="mb-1 flex items-center justify-between text-sm">
            <span class="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
              <Cpu class="h-4 w-4" /> CPU Usage
            </span>
            <span class="font-medium text-[hsl(var(--foreground))]">{systemStats.cpuUsage}%</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-[hsl(var(--secondary))]">
            <div
              class="h-full rounded-full bg-[hsl(var(--primary))] transition-all"
              style="width: {systemStats.cpuUsage}%"
            ></div>
          </div>
        </div>

        <div>
          <div class="mb-1 flex items-center justify-between text-sm">
            <span class="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
              <HardDrive class="h-4 w-4" /> Memory
            </span>
            <span class="font-medium text-[hsl(var(--foreground))]">{systemStats.memoryUsage}%</span
            >
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-[hsl(var(--secondary))]">
            <div
              class="h-full rounded-full bg-[hsl(var(--accent))] transition-all"
              style="width: {systemStats.memoryUsage}%"
            ></div>
          </div>
        </div>

        <div class="flex items-center justify-between rounded-lg bg-[hsl(var(--secondary))] p-3">
          <div class="flex items-center gap-2">
            <Clock class="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <span class="text-sm text-[hsl(var(--muted-foreground))]">Uptime</span>
          </div>
          <span class="font-mono text-sm font-medium text-[hsl(var(--foreground))]">
            {formatUptime(systemStats.uptimeSeconds)}
          </span>
        </div>

        <div class="flex items-center justify-between rounded-lg bg-[hsl(var(--success))]/10 p-3">
          <div class="flex items-center gap-2">
            <Zap class="h-4 w-4 text-[hsl(var(--success))]" />
            <span class="text-sm text-[hsl(var(--success))]">All systems operational</span>
          </div>
          <Shield class="h-4 w-4 text-[hsl(var(--success))]" />
        </div>
      </div>
    </Card>

    <!-- Recent Activity -->
    <Card class="lg:col-span-2">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="font-semibold text-[hsl(var(--foreground))]">Recent Activity</h3>
        <Button variant="ghost" size="sm">
          View All
          <ChevronRight class="h-4 w-4" />
        </Button>
      </div>

      <div class="space-y-3">
        {#each recentActivity as activity}
          <div
            class="flex items-center justify-between rounded-lg bg-[hsl(var(--secondary))]/50 p-3"
          >
            <div class="flex items-center gap-3">
              {#if activity.type === 'rental'}
                <div class="rounded-lg bg-[hsl(var(--primary))]/20 p-2">
                  <Bot class="h-4 w-4 text-[hsl(var(--primary))]" />
                </div>
                <div>
                  <p class="text-sm font-medium text-[hsl(var(--foreground))]">
                    New Rental: {activity.bot}
                  </p>
                  <p class="text-xs text-[hsl(var(--muted-foreground))]">
                    by {activity.user} • {formatCurrency(activity.amount || 0)}
                  </p>
                </div>
              {:else if activity.type === 'spawn'}
                <div class="rounded-lg bg-[hsl(var(--purple))]/20 p-2">
                  <Zap class="h-4 w-4 text-[hsl(var(--purple))]" />
                </div>
                <div>
                  <p class="text-sm font-medium text-[hsl(var(--foreground))]">
                    Bot Spawned: {activity.bot}
                  </p>
                  <p class="text-xs text-[hsl(var(--muted-foreground))]">
                    from {activity.parent}
                  </p>
                </div>
              {:else if activity.type === 'profit'}
                <div class="rounded-lg bg-[hsl(var(--success))]/20 p-2">
                  <TrendingUp class="h-4 w-4 text-[hsl(var(--success))]" />
                </div>
                <div>
                  <p class="text-sm font-medium text-[hsl(var(--foreground))]">
                    Profit Distributed
                  </p>
                  <p class="text-xs text-[hsl(var(--muted-foreground))]">
                    {activity.user} • +{formatCurrency(activity.amount || 0)}
                  </p>
                </div>
              {:else}
                <div class="rounded-lg bg-[hsl(var(--gold))]/20 p-2">
                  <DollarSign class="h-4 w-4 text-[hsl(var(--gold))]" />
                </div>
                <div>
                  <p class="text-sm font-medium text-[hsl(var(--foreground))]">
                    Withdrawal Processed
                  </p>
                  <p class="text-xs text-[hsl(var(--muted-foreground))]">
                    {activity.user} • {formatCurrency(activity.amount || 0)}
                  </p>
                </div>
              {/if}
            </div>
            <span class="text-xs text-[hsl(var(--muted-foreground))]">
              {formatRelativeTime(activity.time)}
            </span>
          </div>
        {/each}
      </div>
    </Card>
  </div>

  <!-- Alerts -->
  {#if alerts.length > 0}
    <div class="mt-6">
      <h3 class="mb-4 font-semibold text-[hsl(var(--foreground))]">System Alerts</h3>
      <div class="space-y-3">
        {#each alerts as alert}
          <Alert type={alert.level === 'warning' ? 'warning' : 'info'} dismissible>
            <div class="flex items-center justify-between">
              <span>{alert.message}</span>
              <span class="text-xs opacity-75">{formatRelativeTime(alert.time)}</span>
            </div>
          </Alert>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Quick Actions -->
  <div class="mt-8">
    <h3 class="mb-4 font-semibold text-[hsl(var(--foreground))]">Quick Actions</h3>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Button variant="outline" class="h-auto flex-col gap-2 p-4" onclick={() => goto('/bots')}>
        <Bot class="h-8 w-8 text-[hsl(var(--primary))]" />
        <span>Manage Bots</span>
      </Button>
      <Button variant="outline" class="h-auto flex-col gap-2 p-4" onclick={() => goto('/users')}>
        <Users class="h-8 w-8 text-[hsl(var(--accent))]" />
        <span>Manage Users</span>
      </Button>
      <Button variant="outline" class="h-auto flex-col gap-2 p-4" onclick={() => goto('/finance')}>
        <DollarSign class="h-8 w-8 text-[hsl(var(--gold))]" />
        <span>Finance Overview</span>
      </Button>
      <Button variant="outline" class="h-auto flex-col gap-2 p-4" onclick={() => goto('/audit')}>
        <Database class="h-8 w-8 text-[hsl(var(--muted-foreground))]" />
        <span>Audit Logs</span>
      </Button>
    </div>
  </div>
</main>
