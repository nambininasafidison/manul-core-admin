<script lang="ts">
  import { adminApi } from '$lib/api/client';
  import { Button } from '$lib/components/ui';
  import { toastStore } from '$lib/stores/auth';
  import { formatRelativeTime } from '$lib/utils';
  import {
    AlertTriangle,
    Bot,
    Clock,
    DollarSign,
    Download,
    Eye,
    FileText,
    RefreshCw,
    Search,
    Shield,
    User,
  } from 'lucide-svelte';
  import { onMount } from 'svelte';

  // Types
  type AuditLog = {
    id: string;
    timestamp: Date;
    type: string;
    severity: string;
    action: string;
    actor: string;
    details: string;
    resource: string;
  };

  // States
  let searchQuery = $state('');
  let selectedType = $state('all');
  let selectedSeverity = $state('all');
  let loading = $state(true);

  let stats = $state({
    totalLogs: 0,
    criticalEvents: 0,
    warningsToday: 0,
    lastScan: new Date(),
  });

  let auditLogs = $state<AuditLog[]>([]);
  let currentPage = $state(1);
  let selectedLog = $state<AuditLog | null>(null);

  async function loadData() {
    loading = true;
    try {
      const [logsRes, securityRes] = await Promise.allSettled([
        adminApi.getAuditLogs({ limit: 50 }),
        adminApi.getSecurityEvents({ limit: 20 }),
      ]);

      if (logsRes.status === 'fulfilled') {
        auditLogs = logsRes.value.items.map((l) => ({
          id: l.id,
          timestamp: new Date(l.timestamp),
          type: l.actorType,
          severity: 'info',
          action: l.action,
          actor: l.actorId,
          details: JSON.stringify(l.details || {}),
          resource: l.targetType,
        }));
        stats.totalLogs = logsRes.value.total;
      }

      if (securityRes.status === 'fulfilled') {
        // Merge security events with audit logs
        const securityLogs = securityRes.value.items.map((s) => ({
          id: s.id,
          timestamp: new Date(s.timestamp),
          type: 'security',
          severity: s.severity,
          action: s.event,
          actor: s.source,
          details: JSON.stringify(s.details || {}),
          resource: 'Security System',
        }));

        auditLogs = [...securityLogs, ...auditLogs].sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
        );

        stats.criticalEvents = securityRes.value.items.filter(
          (s) => s.severity === 'critical',
        ).length;
        stats.warningsToday = securityRes.value.items.filter(
          (s) => s.severity === 'warning',
        ).length;
      }

      stats.lastScan = new Date();
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      toastStore.add('error', 'Failed to load audit logs');
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadData();
  });

  function handleExport() {
    if (filteredLogs.length === 0) {
      toastStore.add('warning', 'No logs to export');
      return;
    }
    const headers = ['Timestamp', 'Type', 'Severity', 'Action', 'Actor', 'Resource', 'Details'];
    const rows = filteredLogs.map((l) => [
      l.timestamp.toISOString(),
      l.type,
      l.severity,
      l.action,
      l.actor,
      l.resource,
      l.details.replace(/"/g, '""'),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join(
      '\n',
    );
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toastStore.add('success', `Exported ${filteredLogs.length} logs`);
  }

  function viewLog(log: AuditLog) {
    selectedLog = log;
  }

  function handleNextPage() {
    currentPage++;
    toastStore.add('info', `Page ${currentPage} — showing cached results`);
  }

  function handlePrevPage() {
    if (currentPage > 1) {
      currentPage--;
      toastStore.add('info', `Page ${currentPage}`);
    }
  }

  const typeIcons: Record<string, typeof Shield> = {
    security: Shield,
    user: User,
    bot: Bot,
    finance: DollarSign,
    system: FileText,
  };

  const severityStyles: Record<string, { bg: string; text: string; border: string }> = {
    critical: {
      bg: 'bg-[hsl(var(--destructive))]/20',
      text: 'text-[hsl(var(--destructive))]',
      border: 'border-[hsl(var(--destructive))]/30',
    },
    warning: {
      bg: 'bg-[hsl(var(--warning))]/20',
      text: 'text-[hsl(var(--warning))]',
      border: 'border-[hsl(var(--warning))]/30',
    },
    info: {
      bg: 'bg-[hsl(var(--info))]/20',
      text: 'text-[hsl(var(--info))]',
      border: 'border-[hsl(var(--info))]/30',
    },
    success: {
      bg: 'bg-[hsl(var(--success))]/20',
      text: 'text-[hsl(var(--success))]',
      border: 'border-[hsl(var(--success))]/30',
    },
  };

  const filteredLogs = $derived(
    auditLogs.filter((log) => {
      const matchesSearch =
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || log.type === selectedType;
      const matchesSeverity = selectedSeverity === 'all' || log.severity === selectedSeverity;
      return matchesSearch && matchesType && matchesSeverity;
    }),
  );
</script>

<svelte:head>
  <title>Audit Logs - Manul Admin</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">Audit Logs</h1>
      <p class="text-[hsl(var(--muted-foreground))]">System activity and security events</p>
    </div>
    <div class="flex gap-2">
      <Button variant="outline" size="sm" onclick={loadData} disabled={loading}>
        <RefreshCw class="h-4 w-4 {loading ? 'animate-spin' : ''}" />
        {loading ? 'Loading...' : 'Refresh'}
      </Button>
      <Button variant="outline" size="sm" onclick={handleExport}>
        <Download class="h-4 w-4" />
        Export
      </Button>
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
          <FileText class="h-5 w-5 text-[hsl(var(--primary))]" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Total Logs</p>
          <p class="text-xl font-bold text-[hsl(var(--foreground))]">
            {stats.totalLogs.toLocaleString()}
          </p>
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
          <AlertTriangle class="h-5 w-5 text-[hsl(var(--destructive))]" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Critical Events</p>
          <p class="text-xl font-bold text-[hsl(var(--destructive))]">{stats.criticalEvents}</p>
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
          <Shield class="h-5 w-5 text-[hsl(var(--warning))]" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Warnings Today</p>
          <p class="text-xl font-bold text-[hsl(var(--warning))]">{stats.warningsToday}</p>
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
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Last Scan</p>
          <p class="text-xl font-bold text-[hsl(var(--info))]">
            {formatRelativeTime(stats.lastScan)}
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
          placeholder="Search logs..."
          class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] py-2 pl-10 pr-4 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
          bind:value={searchQuery}
        />
      </div>
      <div class="flex gap-2">
        <select
          class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none"
          bind:value={selectedType}
        >
          <option value="all">All Types</option>
          <option value="security">Security</option>
          <option value="user">User</option>
          <option value="bot">Bot</option>
          <option value="finance">Finance</option>
          <option value="system">System</option>
        </select>
        <select
          class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none"
          bind:value={selectedSeverity}
        >
          <option value="all">All Severity</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Logs List -->
  <div class="space-y-3">
    {#each filteredLogs as log}
      {@const Icon = typeIcons[log.type] || FileText}
      {@const style = severityStyles[log.severity]}
      <div
        class="card-hover rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 transition-all hover:border-[hsl(var(--primary))]/30"
      >
        <div class="flex items-start gap-4">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl {style.bg}">
            <Icon class="h-5 w-5 {style.text}" />
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="font-medium text-[hsl(var(--foreground))]">{log.action}</span>
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium capitalize {style.bg} {style.text}"
              >
                {log.severity}
              </span>
            </div>
            <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{log.details}</p>
            <div
              class="mt-2 flex flex-wrap items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]"
            >
              <span class="flex items-center gap-1">
                <User class="h-3 w-3" />
                {log.actor}
              </span>
              <span class="flex items-center gap-1">
                <FileText class="h-3 w-3" />
                {log.resource}
              </span>
              <span class="flex items-center gap-1">
                <Clock class="h-3 w-3" />
                {formatRelativeTime(log.timestamp)}
              </span>
            </div>
          </div>
          <button
            class="rounded-lg p-2 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
            onclick={() => viewLog(log)}
            title="View details"
          >
            <Eye class="h-4 w-4" />
          </button>
        </div>
      </div>
    {/each}
  </div>

  <!-- Pagination -->
  <div
    class="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
  >
    <p class="text-sm text-[hsl(var(--muted-foreground))]">
      Showing {filteredLogs.length} of {stats.totalLogs.toLocaleString()} logs
    </p>
    <div class="flex gap-2">
      <button
        class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/30 px-3 py-1.5 text-sm font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))]/50 disabled:opacity-50"
        onclick={handlePrevPage}
        disabled={currentPage <= 1}
      >
        Previous
      </button>
      <span class="px-2 py-1.5 text-sm text-[hsl(var(--muted-foreground))]">{currentPage}</span>
      <button
        class="rounded-lg bg-[hsl(var(--primary))] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[hsl(var(--primary))]/90"
        onclick={handleNextPage}
      >
        Next
      </button>
    </div>
  </div>
</div>

<!-- Log Detail Panel -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
{#if selectedLog}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    onclick={() => (selectedLog = null)}
    role="dialog"
    tabindex="-1"
    onkeydown={(e) => e.key === 'Escape' && (selectedLog = null)}
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="mx-4 w-full max-w-lg rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-xl"
      onclick={(e) => e.stopPropagation()}
    >
      <h3 class="mb-4 text-lg font-bold text-[hsl(var(--foreground))]">Log Details</h3>
      <div class="space-y-3">
        <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
          <p class="text-xs text-[hsl(var(--muted-foreground))]">Action</p>
          <p class="font-medium text-[hsl(var(--foreground))]">{selectedLog.action}</p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
            <p class="text-xs text-[hsl(var(--muted-foreground))]">Type</p>
            <p class="font-medium text-[hsl(var(--foreground))]">{selectedLog.type}</p>
          </div>
          <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
            <p class="text-xs text-[hsl(var(--muted-foreground))]">Severity</p>
            <p class="font-medium text-[hsl(var(--foreground))]">{selectedLog.severity}</p>
          </div>
          <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
            <p class="text-xs text-[hsl(var(--muted-foreground))]">Actor</p>
            <p class="font-medium text-[hsl(var(--foreground))]">{selectedLog.actor}</p>
          </div>
          <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
            <p class="text-xs text-[hsl(var(--muted-foreground))]">Resource</p>
            <p class="font-medium text-[hsl(var(--foreground))]">{selectedLog.resource}</p>
          </div>
        </div>
        <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
          <p class="text-xs text-[hsl(var(--muted-foreground))]">Timestamp</p>
          <p class="font-medium text-[hsl(var(--foreground))]">
            {selectedLog.timestamp.toLocaleString()}
          </p>
        </div>
        <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-3">
          <p class="text-xs text-[hsl(var(--muted-foreground))]">Details</p>
          <pre
            class="mt-1 overflow-x-auto text-xs text-[hsl(var(--foreground))]">{selectedLog.details}</pre>
        </div>
      </div>
      <button
        class="mt-4 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/30 px-4 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--secondary))]/50"
        onclick={() => (selectedLog = null)}
      >
        Close
      </button>
    </div>
  </div>
{/if}
