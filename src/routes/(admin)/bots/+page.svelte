<script lang="ts">
  import { adminApi } from '$lib/api/client';
  import { Button, Modal } from '$lib/components/ui';
  import { formatLoon, formatNumber } from '$lib/utils';
  import { Bot, Edit, Eye, Pause, Play, RefreshCw, Search, TrendingUp, Zap } from 'lucide-svelte';
  import { onMount } from 'svelte';

  // Types
  type BotData = {
    id: string;
    name: string;
    tier: string;
    generation: number;
    status: string;
    performance: { winRate: number; totalProfit: number; trades: number };
    rentals: number;
    dailyRate: number;
    created: Date;
  };

  // States
  let searchQuery = $state('');
  let selectedTier = $state('all');
  let selectedStatus = $state('all');
  let showBotModal = $state(false);
  let selectedBot = $state<BotData | null>(null);
  let loading = $state(true);
  let bots = $state<BotData[]>([]);

  // Stats from API
  let stats = $state({
    totalBots: 0,
    activeBots: 0,
    trainingBots: 0,
    totalProfit: 0,
    avgWinRate: 0,
  });

  // Tier mapping based on generation
  function getTierFromGeneration(gen: number): string {
    if (gen >= 7) return 'mythic';
    if (gen >= 5) return 'legendary';
    if (gen >= 4) return 'epic';
    if (gen >= 3) return 'rare';
    return 'common';
  }

  async function loadData() {
    loading = true;
    try {
      const [botsRes, populationRes, motherRes] = await Promise.allSettled([
        adminApi.getBots({ limit: 100 }),
        adminApi.getPopulationStats(),
        adminApi.getMotherStatus(),
      ]);

      if (botsRes.status === 'fulfilled') {
        bots = botsRes.value.bots.map((b) => ({
          id: b.id,
          name: b.name,
          tier: getTierFromGeneration(b.generation),
          generation: b.generation,
          status: b.status,
          performance: {
            winRate: b.performance,
            totalProfit: b.capital * b.performance,
            trades: Math.floor(b.capital / 1000),
          },
          rentals: b.children_count,
          dailyRate: Math.floor(b.capital * 0.01),
          created: new Date(b.created_at),
        }));
        stats.totalBots = botsRes.value.total;
      }

      if (populationRes.status === 'fulfilled') {
        const pop = populationRes.value;
        stats.avgWinRate = pop.reproduction_rate * 100;
      }

      if (motherRes.status === 'fulfilled') {
        stats.totalProfit = motherRes.value.summary.total_profit;
        stats.activeBots = motherRes.value.summary.living_children;
      }

      // Count by status
      stats.trainingBots = bots.filter((b) => b.status === 'training').length;
    } catch (error) {
      console.error('Failed to load bots:', error);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadData();
  });

  function viewBot(bot: BotData) {
    selectedBot = bot;
    showBotModal = true;
  }

  const filteredBots = $derived(
    bots.filter((bot) => {
      const matchesSearch = bot.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier = selectedTier === 'all' || bot.tier === selectedTier;
      const matchesStatus = selectedStatus === 'all' || bot.status === selectedStatus;
      return matchesSearch && matchesTier && matchesStatus;
    }),
  );
</script>

<svelte:head>
  <title>Bots Management - Manul Admin</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">Bots Management</h1>
      <p class="text-[hsl(var(--muted-foreground))]">Monitor and manage all trading bots</p>
    </div>
    <div class="flex gap-2">
      <Button variant="outline" size="sm" onclick={loadData} disabled={loading}>
        <RefreshCw class="h-4 w-4 {loading ? 'animate-spin' : ''}" />
        {loading ? 'Loading...' : 'Refresh'}
      </Button>
      <Button variant="outline" size="sm">Export</Button>
    </div>
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
          <Bot class="h-5 w-5 text-[hsl(var(--primary))]" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Total Bots</p>
          <p class="text-xl font-bold text-[hsl(var(--foreground))]">
            {formatNumber(stats.totalBots)}
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
          <Play class="h-5 w-5 text-[hsl(var(--success))]" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Active</p>
          <p class="text-xl font-bold text-[hsl(var(--success))]">
            {formatNumber(stats.activeBots)}
          </p>
        </div>
      </div>
    </div>
    <div
      class="card-hover stat-card rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
    >
      <div class="flex items-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--info))]/20">
          <Zap class="h-5 w-5 text-[hsl(var(--info))]" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Training</p>
          <p class="text-xl font-bold text-[hsl(var(--info))]">
            {formatNumber(stats.trainingBots)}
          </p>
        </div>
      </div>
    </div>
    <div
      class="card-hover stat-card rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
    >
      <div class="flex items-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--gold))]/20">
          <TrendingUp class="h-5 w-5 text-[hsl(var(--gold))]" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Total Profit</p>
          <p class="text-xl font-bold text-[hsl(var(--gold))]">{formatLoon(stats.totalProfit)}</p>
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
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Avg Win Rate</p>
          <p class="text-xl font-bold text-[hsl(var(--accent))]">{stats.avgWinRate}%</p>
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
          placeholder="Search bots by name..."
          class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] py-2 pl-10 pr-4 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
          bind:value={searchQuery}
        />
      </div>
      <div class="flex gap-2">
        <select
          class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none"
          bind:value={selectedTier}
        >
          <option value="all">All Tiers</option>
          <option value="common">Common</option>
          <option value="uncommon">Uncommon</option>
          <option value="rare">Rare</option>
          <option value="epic">Epic</option>
          <option value="legendary">Legendary</option>
          <option value="mythic">Mythic</option>
        </select>
        <select
          class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none"
          bind:value={selectedStatus}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="training">Training</option>
          <option value="paused">Paused</option>
          <option value="offline">Offline</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Table -->
  <div class="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
    <table class="admin-table w-full">
      <thead>
        <tr>
          <th>Bot</th>
          <th>Tier</th>
          <th>Status</th>
          <th>Win Rate</th>
          <th>Profit</th>
          <th>Rentals</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredBots as bot}
          <tr class="transition-colors hover:bg-[hsl(var(--secondary))]/30">
            <td>
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary))]/20"
                >
                  <Bot class="h-5 w-5 text-[hsl(var(--primary))]" />
                </div>
                <div>
                  <p class="font-medium text-[hsl(var(--foreground))]">{bot.name}</p>
                  <p class="text-xs text-[hsl(var(--muted-foreground))]">Gen {bot.generation}</p>
                </div>
              </div>
            </td>
            <td>
              <span class="badge-{bot.tier} rounded-full px-2.5 py-1 text-xs font-medium"
                >{bot.tier}</span
              >
            </td>
            <td>
              <span class="status-{bot.status} rounded-full px-2.5 py-1 text-xs font-medium"
                >{bot.status}</span
              >
            </td>
            <td>
              <span class="font-medium text-[hsl(var(--foreground))]"
                >{(bot.performance.winRate * 100).toFixed(1)}%</span
              >
            </td>
            <td>
              <span class="font-medium text-[hsl(var(--success))]"
                >{formatLoon(bot.performance.totalProfit)}</span
              >
            </td>
            <td>
              <span class="text-[hsl(var(--foreground))]">{bot.rentals}</span>
            </td>
            <td>
              <div class="flex items-center gap-1">
                <button
                  class="rounded-lg p-2 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
                  onclick={() => viewBot(bot)}
                >
                  <Eye class="h-4 w-4" />
                </button>
                <button
                  class="rounded-lg p-2 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
                >
                  <Edit class="h-4 w-4" />
                </button>
                {#if bot.status === 'paused'}
                  <button
                    class="rounded-lg p-2 text-[hsl(var(--success))] transition-colors hover:bg-[hsl(var(--success))]/20"
                  >
                    <Play class="h-4 w-4" />
                  </button>
                {:else}
                  <button
                    class="rounded-lg p-2 text-[hsl(var(--warning))] transition-colors hover:bg-[hsl(var(--warning))]/20"
                  >
                    <Pause class="h-4 w-4" />
                  </button>
                {/if}
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<!-- Bot Detail Modal -->
<Modal bind:open={showBotModal} title={selectedBot?.name || 'Bot Details'}>
  {#if selectedBot}
    <div class="space-y-4">
      <div class="flex items-center gap-4">
        <div
          class="flex h-16 w-16 items-center justify-center rounded-xl bg-[hsl(var(--primary))]/20"
        >
          <Bot class="h-8 w-8 text-[hsl(var(--primary))]" />
        </div>
        <div>
          <p class="text-lg font-bold text-[hsl(var(--foreground))]">{selectedBot.name}</p>
          <div class="flex items-center gap-2">
            <span class="badge-{selectedBot.tier} rounded-full px-2 py-0.5 text-xs font-medium"
              >{selectedBot.tier}</span
            >
            <span class="text-sm text-[hsl(var(--muted-foreground))]"
              >Gen {selectedBot.generation}</span
            >
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Win Rate</p>
          <p class="text-lg font-bold text-[hsl(var(--success))]">
            {(selectedBot.performance.winRate * 100).toFixed(1)}%
          </p>
        </div>
        <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Total Profit</p>
          <p class="text-lg font-bold text-[hsl(var(--gold))]">
            {formatLoon(selectedBot.performance.totalProfit)}
          </p>
        </div>
        <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Total Trades</p>
          <p class="text-lg font-bold text-[hsl(var(--foreground))]">
            {formatNumber(selectedBot.performance.trades)}
          </p>
        </div>
        <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Daily Rate</p>
          <p class="text-lg font-bold text-[hsl(var(--info))]">
            {formatLoon(selectedBot.dailyRate)}
          </p>
        </div>
      </div>

      <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
        <p class="text-sm text-[hsl(var(--muted-foreground))]">Active Rentals</p>
        <p class="text-[hsl(var(--foreground))]">{selectedBot.rentals} users currently renting</p>
      </div>

      <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
        <p class="text-sm text-[hsl(var(--muted-foreground))]">Created</p>
        <p class="text-[hsl(var(--foreground))]">{selectedBot.created.toLocaleDateString()}</p>
      </div>

      <div class="flex gap-2 pt-4">
        <button
          class="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/30 px-4 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--secondary))]/50"
          onclick={() => (showBotModal = false)}
        >
          Close
        </button>
        <button
          class="flex-1 rounded-lg bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-medium text-[hsl(var(--primary-foreground))] transition-colors hover:bg-[hsl(var(--primary))]/90"
        >
          <Edit class="mr-2 inline h-4 w-4" />
          Edit Bot
        </button>
      </div>
    </div>
  {/if}
</Modal>
