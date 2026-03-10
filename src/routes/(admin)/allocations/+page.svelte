<script lang="ts">
  import { adminApi } from '$lib/api/client';
  import { Button } from '$lib/components/ui';
  import { toastStore } from '$lib/stores/auth';
  import { formatLoon, formatNumber } from '$lib/utils';
  import {
    ArrowLeftRight,
    Bot,
    Info,
    Loader2,
    RefreshCw,
    Search,
    TrendingUp,
    Wallet,
  } from 'lucide-svelte';
  import { onMount } from 'svelte';

  type Allocation = {
    id: string;
    investor_id: string;
    investor_name: string;
    trader_id: string;
    trader_name: string;
    capital: number;
    strategy: string;
    status: string;
    roi: number;
    started_at: string;
    expires_at: string;
  };

  type AllocationStats = {
    total_allocations: number;
    active_allocations: number;
    total_capital_allocated: number;
    avg_roi: number;
    total_profit: number;
  };

  let loading = $state(true);
  let allocations = $state<Allocation[]>([]);
  let stats = $state<AllocationStats>({
    total_allocations: 0,
    active_allocations: 0,
    total_capital_allocated: 0,
    avg_roi: 0,
    total_profit: 0,
  });
  let searchQuery = $state('');
  let statusFilter = $state('all');

  async function loadData() {
    loading = true;
    try {
      const [allocData, statsData] = await Promise.all([
        adminApi.getAllocations().catch(() => ({ allocations: [], total: 0 })),
        adminApi.getAllocationStats().catch(() => ({
          total_allocations: 0,
          active_allocations: 0,
          total_capital_allocated: 0,
          avg_roi: 0,
          total_profit: 0,
        })),
      ]);

      allocations = allocData.allocations || [];
      stats = statsData;
    } catch {
      toastStore.add('error', 'Failed to load allocations data');
    } finally {
      loading = false;
    }
  }

  let filteredAllocations = $derived(
    allocations.filter((a) => {
      const matchesSearch =
        !searchQuery ||
        a.investor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.trader_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    }),
  );

  onMount(() => {
    loadData();
  });
</script>

<svelte:head>
  <title>Allocations - Manul Core Admin</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">Capital Allocations</h1>
      <p class="text-[hsl(var(--muted-foreground))]">
        Autonomous bot-to-bot investment decisions — system-managed
      </p>
    </div>
    <Button variant="outline" size="sm" onclick={loadData} disabled={loading}>
      {#if loading}
        <Loader2 class="h-4 w-4 animate-spin" />
      {:else}
        <RefreshCw class="h-4 w-4" />
      {/if}
      <span class="ml-2">{loading ? 'Loading...' : 'Refresh'}</span>
    </Button>
  </div>

  <!-- Stats -->
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
    <div
      class="card-hover stat-card rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--primary))]/20"
        >
          <ArrowLeftRight class="h-5 w-5 text-[hsl(var(--primary))]" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Total Allocations</p>
          <p class="text-xl font-bold text-[hsl(var(--foreground))]">
            {formatNumber(stats.total_allocations)}
          </p>
        </div>
      </div>
    </div>

    <div
      class="card-hover stat-card rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--success))]/20"
        >
          <TrendingUp class="h-5 w-5 text-[hsl(var(--success))]" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Active</p>
          <p class="text-xl font-bold text-[hsl(var(--success))]">
            {formatNumber(stats.active_allocations)}
          </p>
        </div>
      </div>
    </div>

    <div
      class="card-hover stat-card rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
    >
      <div class="flex items-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--gold))]/20">
          <Wallet class="h-5 w-5 text-[hsl(var(--gold))]" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Capital Allocated</p>
          <p class="text-xl font-bold text-[hsl(var(--gold))]">
            {formatLoon(stats.total_capital_allocated)}
          </p>
        </div>
      </div>
    </div>

    <div
      class="card-hover stat-card rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/20"
        >
          <TrendingUp class="h-5 w-5 text-[hsl(var(--accent))]" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Avg ROI</p>
          <p class="text-xl font-bold text-[hsl(var(--accent))]">
            {(stats.avg_roi ?? 0).toFixed(2)}%
          </p>
        </div>
      </div>
    </div>

    <div
      class="card-hover stat-card rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
    >
      <div class="flex items-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--info))]/20">
          <Wallet class="h-5 w-5 text-[hsl(var(--info))]" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Total Profit</p>
          <p class="text-xl font-bold text-[hsl(var(--info))]">
            {formatLoon(stats.total_profit)}
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Filters -->
  <div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div class="relative flex-1">
        <Search
          class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
        />
        <input
          type="text"
          placeholder="Search by bot name..."
          class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] py-2 pl-10 pr-4 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
          bind:value={searchQuery}
        />
      </div>
      <select
        class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none"
        bind:value={statusFilter}
      >
        <option value="all">All Statuses</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
        <option value="expired">Expired</option>
      </select>
    </div>
  </div>

  <!-- Allocations Table -->
  {#if loading}
    <div class="flex h-64 items-center justify-center">
      <Loader2 class="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
    </div>
  {:else if filteredAllocations.length === 0}
    <div class="flex h-64 flex-col items-center justify-center text-[hsl(var(--muted-foreground))]">
      <ArrowLeftRight class="mb-4 h-12 w-12 opacity-50" />
      <p class="text-lg font-medium">No allocations found</p>
      <p class="text-sm">
        Bots autonomously decide when to invest in other bots based on their personality.
      </p>
    </div>
  {:else}
    <div
      class="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
    >
      <table class="admin-table w-full">
        <thead>
          <tr>
            <th>Investor</th>
            <th>Trader</th>
            <th>Capital</th>
            <th>Strategy</th>
            <th>ROI</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredAllocations as allocation}
            <tr class="transition-colors hover:bg-[hsl(var(--secondary))]/30">
              <td>
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary))]/20"
                  >
                    <Bot class="h-5 w-5 text-[hsl(var(--primary))]" />
                  </div>
                  <span class="font-medium text-[hsl(var(--foreground))]">
                    {allocation.investor_name}
                  </span>
                </div>
              </td>
              <td>
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--accent))]/20"
                  >
                    <Bot class="h-5 w-5 text-[hsl(var(--accent))]" />
                  </div>
                  <span class="text-[hsl(var(--foreground))]">
                    {allocation.trader_name}
                  </span>
                </div>
              </td>
              <td>
                <span class="font-medium text-[hsl(var(--gold))]">
                  {formatLoon(allocation.capital)}
                </span>
              </td>
              <td>
                <span class="text-[hsl(var(--foreground))]">{allocation.strategy}</span>
              </td>
              <td>
                <span
                  class="font-medium"
                  class:text-[hsl(var(--success))]={allocation.roi >= 0}
                  class:text-[hsl(var(--destructive))]={allocation.roi < 0}
                >
                  {allocation.roi >= 0 ? '+' : ''}{allocation.roi.toFixed(2)}%
                </span>
              </td>
              <td>
                <span
                  class="status-{allocation.status} rounded-full px-2.5 py-1 text-xs font-medium"
                >
                  {allocation.status}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <!-- Info -->
  <div
    class="flex items-start gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/30 p-4"
  >
    <Info class="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--muted-foreground))]" />
    <div>
      <h3 class="text-sm font-semibold text-[hsl(var(--foreground))]">
        How Bot-to-Bot Allocation Works
      </h3>
      <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
        Each bot has a unique <strong>InvestmentPersonality</strong> derived from its archetype. Bots
        autonomously decide when and how much to invest in other bots based on their personality traits:
        investment appetite, risk tolerance, preferred strategy, and emotional state. No manual intervention
        is possible — the system is fully autonomous.
      </p>
    </div>
  </div>
</div>
