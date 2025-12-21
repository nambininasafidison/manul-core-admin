<script lang="ts">
  import { Button, Modal } from '$lib/components/ui';
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

  // States
  let searchQuery = $state('');
  let selectedVip = $state('all');
  let selectedStatus = $state('all');
  let showUserModal = $state(false);
  let selectedUser = $state<(typeof mockUsers)[0] | null>(null);

  // Mock data
  const mockUsers = [
    {
      id: 'user-001',
      username: 'CooperTrader',
      email: 'cooper@example.com',
      wallet_address: '0x1234...5678',
      balance: 15483290,
      total_earned: 2847391,
      stars: 4521,
      vip_level: 5,
      rank: 1,
      active_rentals: 3,
      referral_count: 47,
      status: 'active',
      created_at: new Date(Date.now() - 86400000 * 180),
      last_login: new Date(Date.now() - 3600000),
    },
    {
      id: 'user-002',
      username: 'CryptoMaster',
      email: 'master@example.com',
      wallet_address: '0xabcd...efgh',
      balance: 8923456,
      total_earned: 1234567,
      stars: 2341,
      vip_level: 4,
      rank: 5,
      active_rentals: 2,
      referral_count: 23,
      status: 'active',
      created_at: new Date(Date.now() - 86400000 * 120),
      last_login: new Date(Date.now() - 7200000),
    },
    {
      id: 'user-003',
      username: 'NewbieTrader',
      email: 'newbie@example.com',
      wallet_address: null,
      balance: 54321,
      total_earned: 12345,
      stars: 156,
      vip_level: 0,
      rank: 1542,
      active_rentals: 0,
      referral_count: 2,
      status: 'active',
      created_at: new Date(Date.now() - 86400000 * 7),
      last_login: new Date(Date.now() - 86400000),
    },
    {
      id: 'user-004',
      username: 'SuspiciousUser',
      email: 'sus@example.com',
      wallet_address: '0xsus1...2345',
      balance: 999999999,
      total_earned: 0,
      stars: 10,
      vip_level: 0,
      rank: 9999,
      active_rentals: 0,
      referral_count: 0,
      status: 'flagged',
      created_at: new Date(Date.now() - 86400000 * 2),
      last_login: new Date(Date.now() - 1800000),
    },
    {
      id: 'user-005',
      username: 'BannedUser',
      email: 'banned@example.com',
      wallet_address: '0xban1...2345',
      balance: 0,
      total_earned: 45678,
      stars: 234,
      vip_level: 1,
      rank: 5000,
      active_rentals: 0,
      referral_count: 5,
      status: 'banned',
      created_at: new Date(Date.now() - 86400000 * 60),
      last_login: new Date(Date.now() - 86400000 * 30),
    },
  ];

  const stats = {
    totalUsers: 15483,
    activeUsers: 12341,
    vipUsers: 2847,
    bannedUsers: 124,
    totalCapital: 2847392045,
  };

  function viewUser(user: (typeof mockUsers)[0]) {
    selectedUser = user;
    showUserModal = true;
  }

  const filteredUsers = $derived(
    mockUsers.filter((user) => {
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
      <Button variant="outline" size="sm">
        <RefreshCw class="h-4 w-4" />
        Refresh
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
                >
                  <Edit class="h-4 w-4" />
                </button>
                {#if user.status === 'banned'}
                  <button
                    class="rounded-lg p-2 text-[hsl(var(--success))] transition-colors hover:bg-[hsl(var(--success))]/20"
                  >
                    <Check class="h-4 w-4" />
                  </button>
                {:else}
                  <button
                    class="rounded-lg p-2 text-[hsl(var(--destructive))] transition-colors hover:bg-[hsl(var(--destructive))]/20"
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
          >
            <Check class="mr-2 inline h-4 w-4" />
            Unban User
          </button>
        {:else}
          <button
            class="flex-1 rounded-lg bg-[hsl(var(--destructive))] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[hsl(var(--destructive))]/90"
          >
            <Ban class="mr-2 inline h-4 w-4" />
            Ban User
          </button>
        {/if}
      </div>
    </div>
  {/if}
</Modal>
