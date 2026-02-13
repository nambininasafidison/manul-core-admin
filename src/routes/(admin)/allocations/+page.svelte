<script lang="ts">
  import { adminApi } from '$lib/api/client';
  import { Button } from '$lib/components/ui';
  import { formatLoon, formatNumber } from '$lib/utils';
  import { ArrowLeftRight, RefreshCw, Search, TrendingUp, Wallet } from 'lucide-svelte';
  import { onMount } from 'svelte';

  // Types
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

  // State
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
    } catch (e) {
      console.error('Failed to load allocation data:', e);
    } finally {
      loading = false;
    }
  }

  // Filtered allocations
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

  function statusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'expired':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
  }

  onMount(() => {
    loadData();
  });
</script>

<svelte:head>
  <title>Bot Allocations — ManulCore Admin</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Bot-to-Bot Capital Allocations
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Autonomous investment decisions made by each bot based on their personality. System-managed
        — no manual intervention possible.
      </p>
    </div>
    <Button onclick={loadData} variant="secondary" size="sm">
      <RefreshCw class="mr-2 h-4 w-4" />
      Refresh
    </Button>
  </div>

  <!-- Stats Cards -->
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
    <div class="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="flex items-center gap-3">
        <div class="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
          <ArrowLeftRight class="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Allocations</p>
          <p class="text-xl font-bold text-gray-900 dark:text-white">
            {formatNumber(stats.total_allocations)}
          </p>
        </div>
      </div>
    </div>

    <div class="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="flex items-center gap-3">
        <div class="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
          <TrendingUp class="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Active Now</p>
          <p class="text-xl font-bold text-gray-900 dark:text-white">
            {formatNumber(stats.active_allocations)}
          </p>
        </div>
      </div>
    </div>

    <div class="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="flex items-center gap-3">
        <div class="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
          <Wallet class="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Capital Allocated</p>
          <p class="text-xl font-bold text-gray-900 dark:text-white">
            {formatLoon(stats.total_capital_allocated)}
          </p>
        </div>
      </div>
    </div>

    <div class="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="flex items-center gap-3">
        <div class="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
          <TrendingUp class="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Avg ROI</p>
          <p class="text-xl font-bold text-gray-900 dark:text-white">
            {stats.avg_roi.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>

    <div class="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="flex items-center gap-3">
        <div class="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
          <Wallet class="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Profit</p>
          <p class="text-xl font-bold text-gray-900 dark:text-white">
            {formatLoon(stats.total_profit)}
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Filters -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
    <div class="relative flex-1">
      <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search by bot name..."
        class="w-full rounded-lg border bg-white py-2 pl-10 pr-4 text-sm shadow-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />
    </div>
    <select
      bind:value={statusFilter}
      class="rounded-lg border bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
    >
      <option value="all">All statuses</option>
      <option value="active">Active</option>
      <option value="completed">Completed</option>
      <option value="expired">Expired</option>
    </select>
  </div>

  <!-- Allocations Table -->
  {#if loading}
    <div class="flex h-64 items-center justify-center">
      <div
        class="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"
      ></div>
    </div>
  {:else if filteredAllocations.length === 0}
    <div class="flex h-64 flex-col items-center justify-center text-gray-500 dark:text-gray-400">
      <ArrowLeftRight class="mb-4 h-12 w-12 opacity-50" />
      <p class="text-lg font-medium">No allocations yet</p>
      <p class="text-sm">
        Bots autonomously decide when to invest in other bots based on their personality.
      </p>
    </div>
  {:else}
    <div class="overflow-hidden rounded-lg border shadow-sm dark:border-gray-700">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th
              class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              Investor
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              Trader
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              Capital
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              Strategy
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              ROI
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
          {#each filteredAllocations as allocation}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td
                class="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white"
              >
                {allocation.investor_name}
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {allocation.trader_name}
              </td>
              <td
                class="whitespace-nowrap px-4 py-3 text-sm font-mono text-gray-900 dark:text-white"
              >
                {formatLoon(allocation.capital)}
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                {allocation.strategy}
              </td>
              <td
                class="whitespace-nowrap px-4 py-3 text-sm font-mono"
                class:text-green-600={allocation.roi >= 0}
                class:text-red-600={allocation.roi < 0}
              >
                {allocation.roi >= 0 ? '+' : ''}{allocation.roi.toFixed(2)}%
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-sm">
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {statusColor(
                    allocation.status,
                  )}"
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
    class="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20"
  >
    <h3 class="text-sm font-semibold text-purple-800 dark:text-purple-300">
      How Bot-to-Bot Allocation Works
    </h3>
    <p class="mt-1 text-sm text-purple-700 dark:text-purple-400">
      Each bot has a unique <strong>InvestmentPersonality</strong> derived from its archetype (Lion,
      Fox, Owl, Turtle, Eagle, Wolf, Cheetah, Shark, Butterfly). Bots autonomously decide when and
      how much to invest in other bots based on their personality traits: investment appetite, risk
      tolerance, preferred strategy, and emotional state.
      <strong>No human intervention is possible</strong> — the system is fully autonomous.
    </p>
  </div>
</div>
