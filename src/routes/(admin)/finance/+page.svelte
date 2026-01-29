<script lang="ts">
  import { adminApi } from '$lib/api/client';
  import { Button } from '$lib/components/ui';
  import { formatLoon, formatPercent, formatRelativeTime } from '$lib/utils';
  import {
    ArrowUpRight,
    Building2,
    Coins,
    DollarSign,
    PieChart,
    RefreshCw,
    TrendingUp,
    Users,
    Wallet,
  } from 'lucide-svelte';
  import { onMount } from 'svelte';

  // Types
  type Transaction = {
    id: string;
    type: string;
    user: string;
    bot: string | null;
    amount: number;
    timestamp: Date;
  };

  // States
  let loading = $state(true);

  let systemStats = $state({
    totalCirculation: 0,
    dailyVolume: 0,
    dailyChange: 0,
    totalProfitToday: 0,
    averageROI: 0,
    activeCapital: 0,
  });

  let profitDistribution = $state({
    user: 0.7,
    enterprise: 0.2,
    bot: 0.1,
    userAmount: 0,
    enterpriseAmount: 0,
    botAmount: 0,
  });

  let recentTransactions = $state<Transaction[]>([]);
  let topEarners = $state<{ rank: number; username: string; earned: number; bots: number }[]>([]);

  async function loadData() {
    loading = true;
    try {
      const [financeRes, transactionsRes, usersRes, motherRes] = await Promise.allSettled([
        adminApi.getFinancialSummary(),
        adminApi.getTransactions({ limit: 10 }),
        adminApi.getUsers({ limit: 5 }),
        adminApi.getMotherStatus(),
      ]);

      if (financeRes.status === 'fulfilled') {
        systemStats.totalCirculation = financeRes.value.totalCapital;
        systemStats.dailyVolume = financeRes.value.dailyProfit * 10;
        systemStats.totalProfitToday = financeRes.value.dailyProfit;
        systemStats.activeCapital = financeRes.value.userCapital;
        systemStats.averageROI =
          financeRes.value.dailyProfit / (financeRes.value.totalCapital || 1);
      }

      if (motherRes.status === 'fulfilled') {
        profitDistribution.userAmount = motherRes.value.summary.total_profit * 0.7;
        profitDistribution.enterpriseAmount = motherRes.value.summary.total_profit * 0.2;
        profitDistribution.botAmount = motherRes.value.summary.total_profit * 0.1;
      }

      if (transactionsRes.status === 'fulfilled') {
        recentTransactions = transactionsRes.value.items.map((t) => ({
          id: t.id,
          type: t.type,
          user: t.userId || 'System',
          bot: t.botId || null,
          amount: t.amount,
          timestamp: new Date(t.createdAt),
        }));
      }

      if (usersRes.status === 'fulfilled') {
        topEarners = usersRes.value.items.map((u, i) => ({
          rank: i + 1,
          username: u.username,
          earned: u.totalProfit,
          bots: u.activeRentals,
        }));
      }
    } catch (error) {
      console.error('Failed to load finance data:', error);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadData();
  });

  const typeColors: Record<string, { bg: string; text: string }> = {
    profit: { bg: 'bg-[hsl(var(--success))]/20', text: 'text-[hsl(var(--success))]' },
    rental: { bg: 'bg-[hsl(var(--info))]/20', text: 'text-[hsl(var(--info))]' },
    enterprise: { bg: 'bg-[hsl(var(--gold))]/20', text: 'text-[hsl(var(--gold))]' },
    withdrawal: { bg: 'bg-[hsl(var(--destructive))]/20', text: 'text-[hsl(var(--destructive))]' },
    deposit: { bg: 'bg-[hsl(var(--primary))]/20', text: 'text-[hsl(var(--primary))]' },
  };

  const rankColors = [
    'text-[hsl(var(--gold))]',
    'text-[hsl(var(--muted-foreground))]',
    'text-[hsl(var(--accent))]',
  ];
</script>

<svelte:head>
  <title>Finance - Manul Admin</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">Finance Overview</h1>
      <p class="text-[hsl(var(--muted-foreground))]">LOON economy metrics and transactions</p>
    </div>
    <div class="flex gap-2">
      <Button variant="outline" size="sm" onclick={loadData} disabled={loading}>
        <RefreshCw class="h-4 w-4 {loading ? 'animate-spin' : ''}" />
        {loading ? 'Loading...' : 'Refresh'}
      </Button>
      <Button variant="outline" size="sm">Export Report</Button>
    </div>
  </div>

  <!-- Main Stats -->
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <div
      class="card-hover stat-card rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
    >
      <div class="flex items-center justify-between">
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--gold))]/20">
          <Coins class="h-6 w-6 text-[hsl(var(--gold))]" />
        </div>
        <div
          class="flex items-center gap-1 rounded-full bg-[hsl(var(--success))]/20 px-2 py-1 text-xs font-medium text-[hsl(var(--success))]"
        >
          <ArrowUpRight class="h-3 w-3" />
          {formatPercent(systemStats.dailyChange)}
        </div>
      </div>
      <p class="mt-4 text-sm text-[hsl(var(--muted-foreground))]">Total Circulation</p>
      <p class="text-2xl font-bold text-[hsl(var(--gold))]">
        {formatLoon(systemStats.totalCirculation)}
      </p>
    </div>

    <div
      class="card-hover stat-card rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
    >
      <div class="flex items-center justify-between">
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--info))]/20">
          <TrendingUp class="h-6 w-6 text-[hsl(var(--info))]" />
        </div>
      </div>
      <p class="mt-4 text-sm text-[hsl(var(--muted-foreground))]">Daily Volume</p>
      <p class="text-2xl font-bold text-[hsl(var(--info))]">
        {formatLoon(systemStats.dailyVolume)}
      </p>
    </div>

    <div
      class="card-hover stat-card rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
    >
      <div class="flex items-center justify-between">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--success))]/20"
        >
          <DollarSign class="h-6 w-6 text-[hsl(var(--success))]" />
        </div>
      </div>
      <p class="mt-4 text-sm text-[hsl(var(--muted-foreground))]">Today's Profit</p>
      <p class="text-2xl font-bold text-[hsl(var(--success))]">
        {formatLoon(systemStats.totalProfitToday)}
      </p>
    </div>

    <div
      class="card-hover stat-card rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
    >
      <div class="flex items-center justify-between">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--primary))]/20"
        >
          <PieChart class="h-6 w-6 text-[hsl(var(--primary))]" />
        </div>
      </div>
      <p class="mt-4 text-sm text-[hsl(var(--muted-foreground))]">Average ROI</p>
      <p class="text-2xl font-bold text-[hsl(var(--primary))]">
        {formatPercent(systemStats.averageROI)}
      </p>
    </div>

    <div
      class="card-hover stat-card rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:col-span-2"
    >
      <div class="flex items-center justify-between">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/20"
        >
          <Wallet class="h-6 w-6 text-[hsl(var(--accent))]" />
        </div>
      </div>
      <p class="mt-4 text-sm text-[hsl(var(--muted-foreground))]">Active Capital</p>
      <p class="text-2xl font-bold text-[hsl(var(--accent))]">
        {formatLoon(systemStats.activeCapital)}
      </p>
    </div>
  </div>

  <!-- Profit Distribution & Top Earners -->
  <div class="grid gap-6 lg:grid-cols-2">
    <!-- Profit Distribution -->
    <div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
      <h2 class="mb-4 text-lg font-semibold text-[hsl(var(--foreground))]">Profit Distribution</h2>
      <div class="space-y-4">
        <!-- Users 70% -->
        <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-4">
          <div class="mb-2 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Users class="h-5 w-5 text-[hsl(var(--primary))]" />
              <span class="font-medium text-[hsl(var(--foreground))]">Users (70%)</span>
            </div>
            <span class="font-bold text-[hsl(var(--primary))]"
              >{formatLoon(profitDistribution.userAmount)}</span
            >
          </div>
          <div class="progress-bar progress-primary">
            <div class="progress-bar-fill" style="width: 70%"></div>
          </div>
        </div>

        <!-- Enterprise 20% -->
        <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-4">
          <div class="mb-2 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Building2 class="h-5 w-5 text-[hsl(var(--gold))]" />
              <span class="font-medium text-[hsl(var(--foreground))]">Enterprise (20%)</span>
            </div>
            <span class="font-bold text-[hsl(var(--gold))]"
              >{formatLoon(profitDistribution.enterpriseAmount)}</span
            >
          </div>
          <div class="progress-bar progress-gold">
            <div class="progress-bar-fill" style="width: 100%"></div>
          </div>
        </div>

        <!-- Bot Maintenance 10% -->
        <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-4">
          <div class="mb-2 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Wallet class="h-5 w-5 text-[hsl(var(--info))]" />
              <span class="font-medium text-[hsl(var(--foreground))]">Bot Maintenance (10%)</span>
            </div>
            <span class="font-bold text-[hsl(var(--info))]"
              >{formatLoon(profitDistribution.botAmount)}</span
            >
          </div>
          <div class="progress-bar progress-info">
            <div class="progress-bar-fill" style="width: 50%"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Earners -->
    <div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
      <h2 class="mb-4 text-lg font-semibold text-[hsl(var(--foreground))]">Top Earners Today</h2>
      <div class="space-y-3">
        {#each topEarners as earner, i}
          <div
            class="flex items-center gap-4 rounded-lg bg-[hsl(var(--secondary))]/30 p-3 transition-colors hover:bg-[hsl(var(--secondary))]/50"
          >
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--primary))]/20 text-lg font-bold {rankColors[
                i
              ] || 'text-[hsl(var(--foreground))]'}"
            >
              {earner.rank}
            </div>
            <div class="flex-1">
              <p class="font-medium text-[hsl(var(--foreground))]">{earner.username}</p>
              <p class="text-xs text-[hsl(var(--muted-foreground))]">{earner.bots} active bots</p>
            </div>
            <p class="font-bold text-[hsl(var(--success))]">{formatLoon(earner.earned)}</p>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Recent Transactions -->
  <div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
    <div class="border-b border-[hsl(var(--border))] p-4">
      <h2 class="text-lg font-semibold text-[hsl(var(--foreground))]">Recent Transactions</h2>
    </div>
    <div class="overflow-x-auto">
      <table class="admin-table w-full">
        <thead>
          <tr>
            <th>Type</th>
            <th>User</th>
            <th>Bot</th>
            <th>Amount</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {#each recentTransactions as tx}
            <tr class="transition-colors hover:bg-[hsl(var(--secondary))]/30">
              <td>
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-medium capitalize {typeColors[
                    tx.type
                  ].bg} {typeColors[tx.type].text}"
                >
                  {tx.type}
                </span>
              </td>
              <td>
                <span class="font-medium text-[hsl(var(--foreground))]">{tx.user}</span>
              </td>
              <td>
                {#if tx.bot}
                  <span class="text-[hsl(var(--foreground))]">{tx.bot}</span>
                {:else}
                  <span class="text-[hsl(var(--muted-foreground))]">—</span>
                {/if}
              </td>
              <td>
                <span
                  class="font-medium {tx.amount >= 0
                    ? 'text-[hsl(var(--success))]'
                    : 'text-[hsl(var(--destructive))]'}"
                >
                  {tx.amount >= 0 ? '+' : ''}{formatLoon(tx.amount)}
                </span>
              </td>
              <td>
                <span class="text-sm text-[hsl(var(--muted-foreground))]"
                  >{formatRelativeTime(tx.timestamp)}</span
                >
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
