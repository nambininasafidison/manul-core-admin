<script lang="ts">
  import { adminApi } from '$lib/api/client';
  import { Button } from '$lib/components/ui';
  import { formatRelativeTime } from '$lib/utils';
  import {
    Activity,
    Check,
    Clock,
    Database,
    Download,
    HardDrive,
    Play,
    RefreshCw,
    Server,
    Upload,
    Zap,
  } from 'lucide-svelte';
  import { onMount } from 'svelte';

  // Types
  type TableStat = {
    name: string;
    rows: number;
    size: string;
    lastModified: Date;
  };

  type RecentOperation = {
    id: string;
    type: string;
    status: string;
    message: string;
    timestamp: Date;
    duration: string;
  };

  // States
  let loading = $state(true);

  let dbStats = $state({
    status: 'healthy',
    connections: 0,
    maxConnections: 100,
    uptime: '99.99%',
    size: '0 GB',
    tables: 0,
    lastBackup: new Date(),
    nextBackup: new Date(Date.now() + 86400000),
  });

  let tableStats = $state<TableStat[]>([]);
  let recentOperations = $state<RecentOperation[]>([]);

  async function loadData() {
    loading = true;
    try {
      const [dbRes, healthRes] = await Promise.allSettled([
        adminApi.getDatabaseStats(),
        adminApi.getSystemHealth(),
      ]);

      if (dbRes.status === 'fulfilled') {
        const db = dbRes.value;
        dbStats.connections = db.connection_pool.active;
        dbStats.maxConnections = db.connection_pool.size;
        dbStats.size = `${db.total_size_mb.toFixed(1)} MB`;
        dbStats.tables = db.tables.length;
        dbStats.lastBackup = new Date(db.last_backup);
        dbStats.status = db.replication_lag_ms < 1000 ? 'healthy' : 'degraded';

        tableStats = db.tables.map((t) => ({
          name: t.name,
          rows: t.rows,
          size: `${t.size_mb.toFixed(1)} MB`,
          lastModified: new Date(),
        }));
      }

      if (healthRes.status === 'fulfilled') {
        dbStats.uptime = healthRes.value.uptime_seconds
          ? `${(healthRes.value.uptime_seconds / 86400).toFixed(2)} days`
          : '99.99%';
      }

      // Set some default operations since we don't have an API for this yet
      recentOperations = [
        {
          id: 'op-001',
          type: 'backup',
          status: 'completed',
          message: 'Automatic backup completed',
          timestamp: dbStats.lastBackup,
          duration: 'auto',
        },
      ];
    } catch (error) {
      console.error('Failed to load database stats:', error);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadData();
  });

  const operationIcons: Record<string, typeof Database> = {
    backup: Download,
    migration: Upload,
    vacuum: RefreshCw,
    reindex: Zap,
  };
</script>

<svelte:head>
  <title>Database - Manul Admin</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">Database Management</h1>
      <p class="text-[hsl(var(--muted-foreground))]">Monitor and manage database operations</p>
    </div>
    <div class="flex gap-2">
      <Button variant="outline" size="sm" onclick={loadData} disabled={loading}>
        <RefreshCw class="h-4 w-4 {loading ? 'animate-spin' : ''}" />
        {loading ? 'Loading...' : 'Refresh'}
      </Button>
      <Button variant="default" size="sm" disabled>
        <Download class="h-4 w-4" />
        Backup (Auto)
      </Button>
    </div>
  </div>

  <!-- Status Banner -->
  <div class="rounded-xl border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 p-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--success))]/20"
        >
          <Database class="h-6 w-6 text-[hsl(var(--success))]" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Database Status</p>
          <div class="flex items-center gap-2">
            <span class="text-xl font-bold text-[hsl(var(--success))]">Healthy</span>
            <span class="text-sm text-[hsl(var(--muted-foreground))]"
              >• All systems operational</span
            >
          </div>
        </div>
      </div>
      <span class="rounded-full bg-[hsl(var(--success))] px-4 py-2 text-sm font-bold text-white">
        ONLINE
      </span>
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
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Connections</p>
          <p class="text-xl font-bold text-[hsl(var(--foreground))]">
            {dbStats.connections}/{dbStats.maxConnections}
          </p>
        </div>
      </div>
      <div class="mt-3 progress-bar progress-primary">
        <div
          class="progress-bar-fill"
          style="width: {(dbStats.connections / dbStats.maxConnections) * 100}%"
        ></div>
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
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Uptime</p>
          <p class="text-xl font-bold text-[hsl(var(--info))]">{dbStats.uptime}</p>
        </div>
      </div>
    </div>
    <div
      class="card-hover stat-card rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
    >
      <div class="flex items-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--gold))]/20">
          <HardDrive class="h-5 w-5 text-[hsl(var(--gold))]" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Database Size</p>
          <p class="text-xl font-bold text-[hsl(var(--gold))]">{dbStats.size}</p>
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
          <Server class="h-5 w-5 text-[hsl(var(--accent))]" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Tables</p>
          <p class="text-xl font-bold text-[hsl(var(--accent))]">{dbStats.tables}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Two Column Layout -->
  <div class="grid gap-6 lg:grid-cols-2">
    <!-- Table Statistics -->
    <div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div class="border-b border-[hsl(var(--border))] p-4">
        <h2 class="text-lg font-semibold text-[hsl(var(--foreground))]">Table Statistics</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="admin-table w-full">
          <thead>
            <tr>
              <th>Table</th>
              <th>Rows</th>
              <th>Size</th>
              <th>Last Modified</th>
            </tr>
          </thead>
          <tbody>
            {#each tableStats as table}
              <tr class="transition-colors hover:bg-[hsl(var(--secondary))]/30">
                <td>
                  <span class="font-mono font-medium text-[hsl(var(--primary))]">{table.name}</span>
                </td>
                <td>
                  <span class="text-[hsl(var(--foreground))]">{table.rows.toLocaleString()}</span>
                </td>
                <td>
                  <span class="text-[hsl(var(--gold))]">{table.size}</span>
                </td>
                <td>
                  <span class="text-sm text-[hsl(var(--muted-foreground))]"
                    >{formatRelativeTime(table.lastModified)}</span
                  >
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Recent Operations -->
    <div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div class="border-b border-[hsl(var(--border))] p-4">
        <h2 class="text-lg font-semibold text-[hsl(var(--foreground))]">Recent Operations</h2>
      </div>
      <div class="space-y-3 p-4">
        {#each recentOperations as op}
          {@const Icon = operationIcons[op.type] || Database}
          <div
            class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/30 p-4 transition-colors hover:bg-[hsl(var(--secondary))]/50"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-start gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--success))]/20"
                >
                  <Icon class="h-5 w-5 text-[hsl(var(--success))]" />
                </div>
                <div>
                  <p class="font-medium text-[hsl(var(--foreground))]">{op.message}</p>
                  <div
                    class="mt-1 flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"
                  >
                    <span>Duration: {op.duration}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(op.timestamp)}</span>
                  </div>
                </div>
              </div>
              <span
                class="rounded-full bg-[hsl(var(--success))]/20 px-2 py-0.5 text-xs font-medium text-[hsl(var(--success))]"
              >
                <Check class="mr-1 inline h-3 w-3" />
                {op.status}
              </span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Backup Info -->
  <div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
    <h2 class="mb-4 text-lg font-semibold text-[hsl(var(--foreground))]">Backup Schedule</h2>
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-4">
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--success))]/20"
          >
            <Check class="h-5 w-5 text-[hsl(var(--success))]" />
          </div>
          <div>
            <p class="text-sm text-[hsl(var(--muted-foreground))]">Last Backup</p>
            <p class="font-medium text-[hsl(var(--foreground))]">
              {formatRelativeTime(dbStats.lastBackup)}
            </p>
          </div>
        </div>
      </div>
      <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-4">
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--info))]/20"
          >
            <Clock class="h-5 w-5 text-[hsl(var(--info))]" />
          </div>
          <div>
            <p class="text-sm text-[hsl(var(--muted-foreground))]">Next Backup</p>
            <p class="font-medium text-[hsl(var(--foreground))]">In 23 hours</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Quick Actions -->
  <div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
    <h2 class="mb-4 text-lg font-semibold text-[hsl(var(--foreground))]">Maintenance Actions</h2>
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <button
        class="flex items-center gap-3 rounded-lg bg-[hsl(var(--secondary))]/30 p-4 text-left transition-colors hover:bg-[hsl(var(--secondary))]/50"
      >
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--info))]/20">
          <Download class="h-5 w-5 text-[hsl(var(--info))]" />
        </div>
        <div>
          <p class="font-medium text-[hsl(var(--foreground))]">Full Backup</p>
          <p class="text-xs text-[hsl(var(--muted-foreground))]">Create backup now</p>
        </div>
      </button>
      <button
        class="flex items-center gap-3 rounded-lg bg-[hsl(var(--secondary))]/30 p-4 text-left transition-colors hover:bg-[hsl(var(--secondary))]/50"
      >
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary))]/20"
        >
          <RefreshCw class="h-5 w-5 text-[hsl(var(--primary))]" />
        </div>
        <div>
          <p class="font-medium text-[hsl(var(--foreground))]">Vacuum</p>
          <p class="text-xs text-[hsl(var(--muted-foreground))]">Reclaim storage</p>
        </div>
      </button>
      <button
        class="flex items-center gap-3 rounded-lg bg-[hsl(var(--secondary))]/30 p-4 text-left transition-colors hover:bg-[hsl(var(--secondary))]/50"
      >
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--gold))]/20">
          <Zap class="h-5 w-5 text-[hsl(var(--gold))]" />
        </div>
        <div>
          <p class="font-medium text-[hsl(var(--foreground))]">Reindex</p>
          <p class="text-xs text-[hsl(var(--muted-foreground))]">Rebuild indexes</p>
        </div>
      </button>
      <button
        class="flex items-center gap-3 rounded-lg bg-[hsl(var(--secondary))]/30 p-4 text-left transition-colors hover:bg-[hsl(var(--secondary))]/50"
      >
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--warning))]/20"
        >
          <Play class="h-5 w-5 text-[hsl(var(--warning))]" />
        </div>
        <div>
          <p class="font-medium text-[hsl(var(--foreground))]">Run Migration</p>
          <p class="text-xs text-[hsl(var(--muted-foreground))]">Apply pending</p>
        </div>
      </button>
    </div>
  </div>
</div>
