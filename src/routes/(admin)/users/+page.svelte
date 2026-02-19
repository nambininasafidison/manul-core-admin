<script lang="ts">
  import { adminApi } from '$lib/api/client';
  import { Button, Modal } from '$lib/components/ui';
  import { toastStore } from '$lib/stores/auth';
  import { formatLoon, formatNumber, formatRelativeTime } from '$lib/utils';
  import {
    Ban,
    Check,
    Crown,
    Edit,
    Eye,
    RefreshCw,
    Search,
    User,
    Users,
    Wallet,
  } from 'lucide-svelte';
  import { onMount } from 'svelte';

  // Types
  type UserData = {
    id: string;
    username: string;
    email: string;
    wallet_address: string | null;
    balance: number;
    total_earned: number;
    stars: number;
    vip_level: number;
    rank: number;
    active_rentals: number;
    referral_count: number;
    status: string;
    created_at: Date;
    last_login: Date;
  };

  // States
  let searchQuery = $state('');
  let selectedVip = $state('all');
  let selectedStatus = $state('all');
  let showUserModal = $state(false);
  let selectedUser = $state<UserData | null>(null);
  let loading = $state(true);
  let users = $state<UserData[]>([]);

  let stats = $state({
    totalUsers: 0,
    activeUsers: 0,
    vipUsers: 0,
    bannedUsers: 0,
    totalCapital: 0,
  });

  async function loadData() {
    loading = true;
    try {
      const res = await adminApi.getUsers({ limit: 100 });
      users = res.items.map((u, i) => ({
        id: u.id,
        username: u.username,
        email: u.email || `${u.username}@manul.io`,
        wallet_address: u.walletAddress || null,
        balance: u.balance,
        total_earned: u.totalProfit,
        stars: Math.floor(u.totalProfit / 100),
        vip_level: u.vipLevel,
        rank: i + 1,
        active_rentals: u.activeRentals,
        referral_count: 0,
        status: u.status,
        created_at: new Date(u.createdAt),
        last_login: u.lastActive ? new Date(u.lastActive) : new Date(),
      }));

      stats.totalUsers = res.total;
      stats.activeUsers = users.filter((u) => u.status === 'active').length;
      stats.vipUsers = users.filter((u) => u.vip_level > 0).length;
      stats.bannedUsers = users.filter((u) => u.status === 'banned').length;
      stats.totalCapital = users.reduce((sum, u) => sum + u.balance, 0);
    } catch (error) {
      console.error('Failed to load users:', error);
      toastStore.add('error', 'Failed to load users');
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadData();
  });

  function viewUser(user: UserData) {
    selectedUser = user;
    showUserModal = true;
  }

  function handleExport() {
    if (filteredUsers.length === 0) {
      toastStore.add('warning', 'No users to export');
      return;
    }
    const headers = [
      'Username',
      'Email',
      'Balance',
      'VIP Level',
      'Status',
      'Stars',
      'Active Rentals',
    ];
    const rows = filteredUsers.map((u) => [
      u.username,
      u.email,
      u.balance,
      u.vip_level,
      u.status,
      u.stars,
      u.active_rentals,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join(
      '\n',
    );
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toastStore.add('success', `Exported ${filteredUsers.length} users`);
  }

  function handleEditUser() {
    toastStore.add('warning', 'User editing disabled in read-only admin mode');
  }

  function handleBanUser(username: string) {
    toastStore.add('warning', `Ban/unban for ${username} disabled in read-only admin mode`);
  }

  const filteredUsers = $derived(
    users.filter((user) => {
      const matchesSearch =
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesVip =
        selectedVip === 'all' ||
        (selectedVip === 'vip' && user.vip_level > 0) ||
        (selectedVip === 'standard' && user.vip_level === 0);
      const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
      return matchesSearch && matchesVip && matchesStatus;
    }),
  );
</script>

<svelte:head>
  <title>Users Management - Manul Admin</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">Users Management</h1>
      <p class="text-[hsl(var(--muted-foreground))]">Manage user accounts and permissions</p>
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
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
    <div
      class="card-hover stat-card rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--primary))]/20"
        >
          <Users class="h-5 w-5 text-[hsl(var(--primary))]" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Total Users</p>
          <p class="text-xl font-bold text-[hsl(var(--foreground))]">
            {formatNumber(stats.totalUsers)}
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
          <User class="h-5 w-5 text-[hsl(var(--success))]" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Active</p>
          <p class="text-xl font-bold text-[hsl(var(--success))]">
            {formatNumber(stats.activeUsers)}
          </p>
        </div>
      </div>
    </div>
    <div
      class="card-hover stat-card rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
    >
      <div class="flex items-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--gold))]/20">
          <Crown class="h-5 w-5 text-[hsl(var(--gold))]" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">VIP Users</p>
          <p class="text-xl font-bold text-[hsl(var(--gold))]">{formatNumber(stats.vipUsers)}</p>
        </div>
      </div>
    </div>
    <div
      class="card-hover stat-card rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--destructive))]/20"
        >
          <Ban class="h-5 w-5 text-[hsl(var(--destructive))]" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Banned</p>
          <p class="text-xl font-bold text-[hsl(var(--destructive))]">
            {formatNumber(stats.bannedUsers)}
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
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Total Capital</p>
          <p class="text-xl font-bold text-[hsl(var(--info))]">{formatLoon(stats.totalCapital)}</p>
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
          placeholder="Search users by username or email..."
          class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] py-2 pl-10 pr-4 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
          bind:value={searchQuery}
        />
      </div>
      <div class="flex gap-2">
        <select
          class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none"
          bind:value={selectedVip}
        >
          <option value="all">All Users</option>
          <option value="vip">VIP Only</option>
          <option value="standard">Standard Only</option>
        </select>
        <select
          class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none"
          bind:value={selectedStatus}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="flagged">Flagged</option>
          <option value="banned">Banned</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Table -->
  <div class="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
    <table class="admin-table w-full">
      <thead>
        <tr>
          <th>User</th>
          <th>Balance</th>
          <th>VIP</th>
          <th>Status</th>
          <th>Rentals</th>
          <th>Last Login</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredUsers as user}
          <tr class="transition-colors hover:bg-[hsl(var(--secondary))]/30">
            <td>
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--primary))]/20 font-bold text-[hsl(var(--primary))]"
                >
                  {user.username[0].toUpperCase()}
                </div>
                <div>
                  <p class="font-medium text-[hsl(var(--foreground))]">{user.username}</p>
                  <p class="text-xs text-[hsl(var(--muted-foreground))]">{user.email}</p>
                </div>
              </div>
            </td>
            <td>
              <div>
                <p class="font-medium text-[hsl(var(--gold))]">{formatLoon(user.balance)}</p>
                <p class="text-xs text-[hsl(var(--muted-foreground))]">
                  {formatNumber(user.stars)} ⭐
                </p>
              </div>
            </td>
            <td>
              {#if user.vip_level > 0}
                <span
                  class="inline-flex items-center rounded-full bg-[hsl(var(--gold))]/20 px-2.5 py-1 text-xs font-medium text-[hsl(var(--gold))]"
                >
                  <Crown class="mr-1 h-3 w-3" />
                  VIP {user.vip_level}
                </span>
              {:else}
                <span
                  class="rounded-full bg-[hsl(var(--secondary))] px-2.5 py-1 text-xs font-medium text-[hsl(var(--muted-foreground))]"
                >
                  Standard
                </span>
              {/if}
            </td>
            <td>
              <span class="status-{user.status} rounded-full px-2.5 py-1 text-xs font-medium"
                >{user.status}</span
              >
            </td>
            <td>
              <span class="font-medium text-[hsl(var(--foreground))]">{user.active_rentals}</span>
            </td>
            <td>
              <span class="text-sm text-[hsl(var(--muted-foreground))]"
                >{formatRelativeTime(user.last_login)}</span
              >
            </td>
            <td>
              <div class="flex items-center gap-1">
                <button
                  class="rounded-lg p-2 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
                  onclick={() => viewUser(user)}
                >
                  <Eye class="h-4 w-4" />
                </button>
                <button
                  class="rounded-lg p-2 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
                  onclick={handleEditUser}
                >
                  <Edit class="h-4 w-4" />
                </button>
                {#if user.status === 'banned'}
                  <button
                    class="rounded-lg p-2 text-[hsl(var(--success))] transition-colors hover:bg-[hsl(var(--success))]/20"
                    onclick={() => handleBanUser(user.username)}
                  >
                    <Check class="h-4 w-4" />
                  </button>
                {:else}
                  <button
                    class="rounded-lg p-2 text-[hsl(var(--destructive))] transition-colors hover:bg-[hsl(var(--destructive))]/20"
                    onclick={() => handleBanUser(user.username)}
                  >
                    <Ban class="h-4 w-4" />
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

<!-- User Detail Modal -->
<Modal bind:open={showUserModal} title={selectedUser?.username || 'User Details'}>
  {#if selectedUser}
    <div class="space-y-4">
      <div class="flex items-center gap-4">
        <div
          class="flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--primary))]/20 text-2xl font-bold text-[hsl(var(--primary))]"
        >
          {selectedUser.username[0].toUpperCase()}
        </div>
        <div>
          <p class="text-lg font-bold text-[hsl(var(--foreground))]">{selectedUser.username}</p>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">{selectedUser.email}</p>
          <span
            class="status-{selectedUser.status} mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
            >{selectedUser.status}</span
          >
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
          <p class="text-sm text-[hsl(var(--muted-foreground))]">LOON Balance</p>
          <p class="text-lg font-bold text-[hsl(var(--gold))]">
            {formatLoon(selectedUser.balance)}
          </p>
        </div>
        <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Total Earned</p>
          <p class="text-lg font-bold text-[hsl(var(--success))]">
            {formatLoon(selectedUser.total_earned)}
          </p>
        </div>
        <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Stars</p>
          <p class="text-lg font-bold text-[hsl(var(--foreground))]">
            {formatNumber(selectedUser.stars)} ⭐
          </p>
        </div>
        <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Rank</p>
          <p class="text-lg font-bold text-[hsl(var(--foreground))]">#{selectedUser.rank}</p>
        </div>
        <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
          <p class="text-sm text-[hsl(var(--muted-foreground))]">VIP Level</p>
          <p class="text-lg font-bold text-[hsl(var(--foreground))]">
            {selectedUser.vip_level > 0 ? `VIP ${selectedUser.vip_level}` : 'Standard'}
          </p>
        </div>
        <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Referrals</p>
          <p class="text-lg font-bold text-[hsl(var(--foreground))]">
            {selectedUser.referral_count}
          </p>
        </div>
      </div>

      {#if selectedUser.wallet_address}
        <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Wallet Address</p>
          <p class="font-mono text-sm text-[hsl(var(--foreground))]">
            {selectedUser.wallet_address}
          </p>
        </div>
      {/if}

      <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
        <p class="text-sm text-[hsl(var(--muted-foreground))]">Member Since</p>
        <p class="text-sm text-[hsl(var(--foreground))]">
          {selectedUser.created_at.toLocaleDateString()}
        </p>
      </div>

      <div class="flex gap-2 pt-4">
        <button
          class="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/30 px-4 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--secondary))]/50"
          onclick={() => (showUserModal = false)}
        >
          Close
        </button>
        {#if selectedUser.status === 'banned'}
          <button
            class="flex-1 rounded-lg bg-[hsl(var(--success))] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[hsl(var(--success))]/90"
            onclick={() => handleBanUser(selectedUser?.username || '')}
          >
            <Check class="mr-2 inline h-4 w-4" />
            Unban User
          </button>
        {:else}
          <button
            class="flex-1 rounded-lg bg-[hsl(var(--destructive))] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[hsl(var(--destructive))]/90"
            onclick={() => handleBanUser(selectedUser?.username || '')}
          >
            <Ban class="mr-2 inline h-4 w-4" />
            Ban User
          </button>
        {/if}
      </div>
    </div>
  {/if}
</Modal>
