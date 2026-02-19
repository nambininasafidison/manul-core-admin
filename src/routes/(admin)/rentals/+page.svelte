<script lang="ts">
  import { adminApi } from '$lib/api/client';
  import { Button, Modal } from '$lib/components/ui';
  import { toastStore } from '$lib/stores/auth';
  import { formatLoon } from '$lib/utils';
  import {
    Activity,
    AlertTriangle,
    Bot,
    Calendar,
    Clock,
    Eye,
    Pause,
    Play,
    RefreshCw,
    Search,
    Zap,
  } from 'lucide-svelte';
  import { onMount } from 'svelte';

  // Types
  type RentalData = {
    id: string;
    user: string;
    bot: { name: string; tier: string; generation: number };
    startDate: Date;
    endDate: Date;
    dailyRate: number;
    totalPaid: number;
    profit: number;
    status: string;
  };

  // States
  let searchQuery = $state('');
  let selectedStatus = $state('all');
  let showRentalModal = $state(false);
  let selectedRental = $state<RentalData | null>(null);
  let loading = $state(true);
  let rentals = $state<RentalData[]>([]);

  let stats = $state({
    totalActive: 0,
    totalRevenue: 0,
    avgDuration: '0 days',
    expiringToday: 0,
  });

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
      const res = await adminApi.getRentals({ limit: 100 });
      rentals = res.rentals.map((r) => {
        const startDate = new Date(r.startDate);
        const endDate = new Date(r.endDate);
        const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000));
        const now = Date.now();
        let status = 'active';
        if (endDate.getTime() < now) status = 'expired';
        else if (endDate.getTime() - now < 86400000 * 2) status = 'expiring';

        return {
          id: r.id,
          user: r.userName,
          bot: {
            name: r.botName,
            tier: getTierFromGeneration(4), // Default to epic
            generation: 4,
          },
          startDate,
          endDate,
          dailyRate: Math.floor(r.amount / days),
          totalPaid: r.amount,
          profit: r.profit,
          status,
        };
      });

      stats.totalActive = res.stats.active_contracts;
      stats.totalRevenue = res.stats.total_capital;
      stats.expiringToday = rentals.filter((r) => r.status === 'expiring').length;

      // Calculate average duration
      if (rentals.length > 0) {
        const avgDays =
          rentals.reduce((sum, r) => {
            return sum + (r.endDate.getTime() - r.startDate.getTime()) / 86400000;
          }, 0) / rentals.length;
        stats.avgDuration = `${avgDays.toFixed(1)} days`;
      }
    } catch (error) {
      console.error('Failed to load rentals:', error);
      toastStore.add('error', 'Failed to load rental data');
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadData();
  });

  const statusStyles: Record<string, { bg: string; text: string }> = {
    active: { bg: 'bg-[hsl(var(--success))]/20', text: 'text-[hsl(var(--success))]' },
    expiring: { bg: 'bg-[hsl(var(--warning))]/20', text: 'text-[hsl(var(--warning))]' },
    expired: { bg: 'bg-[hsl(var(--destructive))]/20', text: 'text-[hsl(var(--destructive))]' },
    paused: {
      bg: 'bg-[hsl(var(--muted-foreground))]/20',
      text: 'text-[hsl(var(--muted-foreground))]',
    },
  };

  function viewRental(rental: RentalData) {
    selectedRental = rental;
    showRentalModal = true;
  }

  function handleExport() {
    if (filteredRentals.length === 0) {
      toastStore.add('warning', 'No rentals to export');
      return;
    }
    const headers = [
      'User',
      'Bot',
      'Tier',
      'Status',
      'Daily Rate',
      'Total Paid',
      'Profit',
      'Start Date',
      'End Date',
    ];
    const rows = filteredRentals.map((r) => [
      r.user,
      r.bot.name,
      r.bot.tier,
      r.status,
      r.dailyRate,
      r.totalPaid,
      r.profit,
      r.startDate.toISOString().slice(0, 10),
      r.endDate.toISOString().slice(0, 10),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join(
      '\n',
    );
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rentals-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toastStore.add('success', `Exported ${filteredRentals.length} rentals`);
  }

  function handlePauseResume(rental: RentalData) {
    const action = rental.status === 'paused' ? 'Resume' : 'Pause';
    toastStore.add('warning', `${action} rental is disabled in read-only admin mode`);
  }

  function handleExtendRental() {
    toastStore.add('warning', 'Rental extension is disabled in read-only admin mode');
  }

  function getDaysRemaining(endDate: Date): number {
    return Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86400000));
  }

  const filteredRentals = $derived(
    rentals.filter((rental) => {
      const matchesSearch =
        rental.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rental.bot.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || rental.status === selectedStatus;
      return matchesSearch && matchesStatus;
    }),
  );
</script>

<svelte:head>
  <title>Rentals - Manul Admin</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">Rentals Management</h1>
      <p class="text-[hsl(var(--muted-foreground))]">Active bot rentals and revenue tracking</p>
    </div>
    <div class="flex gap-2">
      <Button variant="outline" size="sm" onclick={loadData} disabled={loading}>
        <RefreshCw class="h-4 w-4 {loading ? 'animate-spin' : ''}" />
        {loading ? 'Loading...' : 'Refresh'}
      </Button>
      <Button variant="outline" size="sm" onclick={handleExport}>Export</Button>
    </div>
  </div>

  <!-- Stats -->
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <div
      class="card-hover stat-card rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--primary))]/20"
        >
          <Activity class="h-5 w-5 text-[hsl(var(--primary))]" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Active Rentals</p>
          <p class="text-xl font-bold text-[hsl(var(--primary))]">{stats.totalActive}</p>
        </div>
      </div>
    </div>
    <div
      class="card-hover stat-card rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
    >
      <div class="flex items-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--gold))]/20">
          <Zap class="h-5 w-5 text-[hsl(var(--gold))]" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Total Revenue</p>
          <p class="text-xl font-bold text-[hsl(var(--gold))]">{formatLoon(stats.totalRevenue)}</p>
        </div>
      </div>
    </div>
    <div
      class="card-hover stat-card rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
    >
      <div class="flex items-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--info))]/20">
          <Clock class="h-5 w-5 text-[hsl(var(--info))]" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Avg Duration</p>
          <p class="text-xl font-bold text-[hsl(var(--info))]">{stats.avgDuration}</p>
        </div>
      </div>
    </div>
    <div
      class="card-hover stat-card rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--warning))]/20"
        >
          <AlertTriangle class="h-5 w-5 text-[hsl(var(--warning))]" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Expiring Today</p>
          <p class="text-xl font-bold text-[hsl(var(--warning))]">{stats.expiringToday}</p>
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
          placeholder="Search by user or bot name..."
          class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] py-2 pl-10 pr-4 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
          bind:value={searchQuery}
        />
      </div>
      <select
        class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none"
        bind:value={selectedStatus}
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="expiring">Expiring Soon</option>
        <option value="expired">Expired</option>
        <option value="paused">Paused</option>
      </select>
    </div>
  </div>

  <!-- Table -->
  <div class="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
    <table class="admin-table w-full">
      <thead>
        <tr>
          <th>User</th>
          <th>Bot</th>
          <th>Status</th>
          <th>Days Left</th>
          <th>Daily Rate</th>
          <th>Profit</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredRentals as rental}
          <tr class="transition-colors hover:bg-[hsl(var(--secondary))]/30">
            <td>
              <span class="font-medium text-[hsl(var(--foreground))]">{rental.user}</span>
            </td>
            <td>
              <div class="flex items-center gap-2">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--primary))]/20"
                >
                  <Bot class="h-4 w-4 text-[hsl(var(--primary))]" />
                </div>
                <div>
                  <p class="font-medium text-[hsl(var(--foreground))]">{rental.bot.name}</p>
                  <p class="text-xs">
                    <span
                      class="badge-{rental.bot.tier} rounded-full px-2 py-0.5 text-xs font-medium"
                      >{rental.bot.tier}</span
                    >
                    <span class="ml-1 text-[hsl(var(--muted-foreground))]"
                      >Gen {rental.bot.generation}</span
                    >
                  </p>
                </div>
              </div>
            </td>
            <td>
              <span
                class="rounded-full px-2.5 py-1 text-xs font-medium capitalize {statusStyles[
                  rental.status
                ].bg} {statusStyles[rental.status].text}"
              >
                {rental.status}
              </span>
            </td>
            <td>
              {#if rental.status === 'expired'}
                <span class="text-[hsl(var(--destructive))]">Expired</span>
              {:else}
                <span class="font-medium text-[hsl(var(--foreground))]"
                  >{getDaysRemaining(rental.endDate)} days</span
                >
              {/if}
            </td>
            <td>
              <span class="font-medium text-[hsl(var(--gold))]"
                >{formatLoon(rental.dailyRate)}/day</span
              >
            </td>
            <td>
              <span class="font-medium text-[hsl(var(--success))]"
                >+{formatLoon(rental.profit)}</span
              >
            </td>
            <td>
              <div class="flex items-center gap-1">
                <button
                  class="rounded-lg p-2 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
                  onclick={() => viewRental(rental)}
                >
                  <Eye class="h-4 w-4" />
                </button>
                {#if rental.status === 'active'}
                  <button
                    class="rounded-lg p-2 text-[hsl(var(--warning))] transition-colors hover:bg-[hsl(var(--warning))]/20"
                    onclick={() => handlePauseResume(rental)}
                  >
                    <Pause class="h-4 w-4" />
                  </button>
                {:else if rental.status === 'paused'}
                  <button
                    class="rounded-lg p-2 text-[hsl(var(--success))] transition-colors hover:bg-[hsl(var(--success))]/20"
                    onclick={() => handlePauseResume(rental)}
                  >
                    <Play class="h-4 w-4" />
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

<!-- Rental Detail Modal -->
<Modal bind:open={showRentalModal} title="Rental Details">
  {#if selectedRental}
    <div class="space-y-4">
      <div class="flex items-center gap-4">
        <div
          class="flex h-14 w-14 items-center justify-center rounded-xl bg-[hsl(var(--primary))]/20"
        >
          <Bot class="h-7 w-7 text-[hsl(var(--primary))]" />
        </div>
        <div>
          <p class="text-lg font-bold text-[hsl(var(--foreground))]">{selectedRental.bot.name}</p>
          <p class="text-sm">
            <span
              class="badge-{selectedRental.bot.tier} rounded-full px-2 py-0.5 text-xs font-medium"
              >{selectedRental.bot.tier}</span
            >
            <span class="ml-2 text-[hsl(var(--muted-foreground))]"
              >Generation {selectedRental.bot.generation}</span
            >
          </p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Renter</p>
          <p class="font-medium text-[hsl(var(--foreground))]">{selectedRental.user}</p>
        </div>
        <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Status</p>
          <span
            class="rounded-full px-2 py-0.5 text-xs font-medium capitalize {statusStyles[
              selectedRental.status
            ].bg} {statusStyles[selectedRental.status].text}"
          >
            {selectedRental.status}
          </span>
        </div>
        <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Daily Rate</p>
          <p class="font-bold text-[hsl(var(--gold))]">
            {formatLoon(selectedRental.dailyRate)}/day
          </p>
        </div>
        <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Total Paid</p>
          <p class="font-bold text-[hsl(var(--info))]">{formatLoon(selectedRental.totalPaid)}</p>
        </div>
        <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Profit Generated</p>
          <p class="font-bold text-[hsl(var(--success))]">+{formatLoon(selectedRental.profit)}</p>
        </div>
        <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Days Remaining</p>
          <p class="font-bold text-[hsl(var(--foreground))]">
            {#if selectedRental.status === 'expired'}
              Expired
            {:else}
              {getDaysRemaining(selectedRental.endDate)} days
            {/if}
          </p>
        </div>
      </div>

      <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
        <div class="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
          <Calendar class="h-4 w-4" />
          <span
            >Started {selectedRental.startDate.toLocaleDateString()} • Ends {selectedRental.endDate.toLocaleDateString()}</span
          >
        </div>
      </div>

      <div class="flex gap-2 pt-4">
        <button
          class="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/30 px-4 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--secondary))]/50"
          onclick={() => (showRentalModal = false)}
        >
          Close
        </button>
        {#if selectedRental.status === 'active'}
          <button
            class="flex-1 rounded-lg bg-[hsl(var(--warning))] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[hsl(var(--warning))]/90"
            onclick={() => handlePauseResume(selectedRental!)}
          >
            <Pause class="mr-2 inline h-4 w-4" />
            Pause Rental
          </button>
        {:else if selectedRental.status === 'expiring'}
          <button
            class="flex-1 rounded-lg bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[hsl(var(--primary))]/90"
            onclick={handleExtendRental}
          >
            <RefreshCw class="mr-2 inline h-4 w-4" />
            Extend Rental
          </button>
        {/if}
      </div>
    </div>
  {/if}
</Modal>
