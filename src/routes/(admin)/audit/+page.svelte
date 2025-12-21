<script lang="ts">
  import { Button } from '$lib/components/ui';
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

  // States
  let searchQuery = $state('');
  let selectedType = $state('all');
  let selectedSeverity = $state('all');

  // Mock data
  const stats = {
    totalLogs: 284739,
    criticalEvents: 12,
    warningsToday: 847,
    lastScan: new Date(Date.now() - 300000),
  };

  const auditLogs = [
    {
      id: 'log-001',
      timestamp: new Date(Date.now() - 60000),
      type: 'security',
      severity: 'critical',
      action: 'Failed login attempt',
      actor: 'unknown@1.2.3.4',
      details: '5 failed attempts from IP 1.2.3.4',
      resource: 'Auth System',
    },
    {
      id: 'log-002',
      timestamp: new Date(Date.now() - 180000),
      type: 'user',
      severity: 'info',
      action: 'User registered',
      actor: 'NewUser123',
      details: 'New user registration completed',
      resource: 'User Management',
    },
    {
      id: 'log-003',
      timestamp: new Date(Date.now() - 300000),
      type: 'bot',
      severity: 'warning',
      action: 'Bot performance degraded',
      actor: 'Zeus-Prime',
      details: 'Win rate dropped below threshold',
      resource: 'Bot Engine',
    },
    {
      id: 'log-004',
      timestamp: new Date(Date.now() - 600000),
      type: 'finance',
      severity: 'info',
      action: 'Large withdrawal',
      actor: 'WhaleUser',
      details: 'Withdrawal of Ⱡ1,000,000',
      resource: 'Finance System',
    },
    {
      id: 'log-005',
      timestamp: new Date(Date.now() - 900000),
      type: 'system',
      severity: 'info',
      action: 'Database backup completed',
      actor: 'System',
      details: 'Automatic backup successful',
      resource: 'Database',
    },
    {
      id: 'log-006',
      timestamp: new Date(Date.now() - 1200000),
      type: 'security',
      severity: 'warning',
      action: 'Suspicious API pattern',
      actor: 'api-client-892',
      details: 'Unusual request pattern detected',
      resource: 'API Gateway',
    },
  ];

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
      <Button variant="outline" size="sm">
        <RefreshCw class="h-4 w-4" />
        Refresh
      </Button>
      <Button variant="outline" size="sm">
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
        class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/30 px-3 py-1.5 text-sm font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--secondary))]/50"
      >
        Previous
      </button>
      <button
        class="rounded-lg bg-[hsl(var(--primary))] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[hsl(var(--primary))]/90"
      >
        Next
      </button>
    </div>
  </div>
</div>
