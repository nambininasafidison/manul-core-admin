<script lang="ts">
  import { adminApi } from '$lib/api/client';
  import { Button } from '$lib/components/ui';
  import { toastStore } from '$lib/stores';
  import { formatRelativeTime } from '$lib/utils';
  import {
    AlertTriangle,
    Ban,
    Clock,
    Globe,
    RefreshCw,
    Shield,
    ShieldAlert,
    ShieldCheck,
  } from 'lucide-svelte';
  import { onMount } from 'svelte';

  // Types
  type SecurityAlert = {
    id: string;
    type: string;
    severity: string;
    message: string;
    source: string;
    timestamp: Date;
    status: string;
  };

  type BlockedIP = {
    ip: string;
    reason: string;
    blocked_at: Date;
    attempts: number;
  };

  // States
  let searchQuery = $state('');
  let loading = $state(true);

  let securityStats = $state({
    threatLevel: 'low',
    blockedAttempts: 0,
    activeAlerts: 0,
    lastIncident: new Date(),
    firewallStatus: 'active',
    lastBackup: new Date(),
  });

  let securityAlerts = $state<SecurityAlert[]>([]);
  let blockedIPs = $state<BlockedIP[]>([]);

  async function loadData() {
    loading = true;
    try {
      const securityRes = await adminApi.getSecurityEvents({ limit: 50 });

      if (securityRes) {
        securityAlerts = securityRes.items.map((s) => ({
          id: s.id,
          type: s.event.includes('login') ? 'brute_force' : 'suspicious_activity',
          severity:
            s.severity === 'critical' ? 'high' : s.severity === 'warning' ? 'medium' : 'low',
          message: s.event,
          source: s.source,
          timestamp: new Date(s.timestamp),
          status: s.resolved ? 'resolved' : 'active',
        }));

        securityStats.activeAlerts = securityAlerts.filter((a) => a.status === 'active').length;
        securityStats.blockedAttempts = securityAlerts.length;

        if (securityAlerts.length > 0) {
          securityStats.lastIncident = securityAlerts[0].timestamp;
          const criticalCount = securityAlerts.filter((a) => a.severity === 'high').length;
          securityStats.threatLevel =
            criticalCount > 5 ? 'high' : criticalCount > 0 ? 'medium' : 'low';
        }
      }
    } catch (error) {
      toastStore.add('error', 'Failed to load security data. Please try again.');
      console.error('Failed to load security data:', error);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadData();
  });

  const severityStyles: Record<string, { bg: string; text: string }> = {
    high: { bg: 'bg-[hsl(var(--destructive))]/20', text: 'text-[hsl(var(--destructive))]' },
    medium: { bg: 'bg-[hsl(var(--warning))]/20', text: 'text-[hsl(var(--warning))]' },
    low: { bg: 'bg-[hsl(var(--info))]/20', text: 'text-[hsl(var(--info))]' },
  };

  const statusStyles: Record<string, { bg: string; text: string }> = {
    active: { bg: 'bg-[hsl(var(--destructive))]/20', text: 'text-[hsl(var(--destructive))]' },
    investigating: { bg: 'bg-[hsl(var(--warning))]/20', text: 'text-[hsl(var(--warning))]' },
    resolved: { bg: 'bg-[hsl(var(--success))]/20', text: 'text-[hsl(var(--success))]' },
  };

  const threatLevelStyles: Record<string, { bg: string; text: string; label: string }> = {
    low: { bg: 'bg-[hsl(var(--success))]', text: 'text-white', label: 'LOW' },
    medium: { bg: 'bg-[hsl(var(--warning))]', text: 'text-white', label: 'MEDIUM' },
    high: { bg: 'bg-[hsl(var(--destructive))]', text: 'text-white', label: 'HIGH' },
    critical: { bg: 'bg-[hsl(var(--destructive))]', text: 'text-white', label: 'CRITICAL' },
  };
</script>

<svelte:head>
  <title>Security - Manul Admin</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">Security Center</h1>
      <p class="text-[hsl(var(--muted-foreground))]">
        Monitor threats and manage security settings
      </p>
    </div>
    <div class="flex gap-2">
      <Button variant="outline" size="sm" onclick={loadData} disabled={loading}>
        <RefreshCw class="h-4 w-4 {loading ? 'animate-spin' : ''}" />
        {loading ? 'Scanning...' : 'Scan Now'}
      </Button>
    </div>
  </div>

  <!-- Threat Level Banner -->
  <div class="rounded-xl border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 p-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--success))]/20"
        >
          <ShieldCheck class="h-6 w-6 text-[hsl(var(--success))]" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Current Threat Level</p>
          <div class="flex items-center gap-2">
            <span class="text-xl font-bold text-[hsl(var(--success))]">LOW</span>
            <span class="text-sm text-[hsl(var(--muted-foreground))]"
              >• All systems operational</span
            >
          </div>
        </div>
      </div>
      <span
        class="{threatLevelStyles[securityStats.threatLevel].bg} {threatLevelStyles[
          securityStats.threatLevel
        ].text} rounded-full px-4 py-2 text-sm font-bold"
      >
        {threatLevelStyles[securityStats.threatLevel].label}
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
          class="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--destructive))]/20"
        >
          <Ban class="h-5 w-5 text-[hsl(var(--destructive))]" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Blocked Today</p>
          <p class="text-xl font-bold text-[hsl(var(--destructive))]">
            {securityStats.blockedAttempts}
          </p>
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
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Active Alerts</p>
          <p class="text-xl font-bold text-[hsl(var(--warning))]">{securityStats.activeAlerts}</p>
        </div>
      </div>
    </div>
    <div
      class="card-hover stat-card rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--primary))]/20"
        >
          <Shield class="h-5 w-5 text-[hsl(var(--primary))]" />
        </div>
        <div>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Firewall</p>
          <p class="text-xl font-bold text-[hsl(var(--primary))]">Active</p>
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
          <p class="text-sm text-[hsl(var(--muted-foreground))]">Last Incident</p>
          <p class="text-xl font-bold text-[hsl(var(--info))]">
            {formatRelativeTime(securityStats.lastIncident)}
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Two Column Layout -->
  <div class="grid gap-6 lg:grid-cols-2">
    <!-- Security Alerts -->
    <div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div class="border-b border-[hsl(var(--border))] p-4">
        <h2 class="text-lg font-semibold text-[hsl(var(--foreground))]">Security Alerts</h2>
      </div>
      <div class="space-y-3 p-4">
        {#each securityAlerts as alert}
          <div
            class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/30 p-4 transition-colors hover:bg-[hsl(var(--secondary))]/50"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-start gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-lg {severityStyles[
                    alert.severity
                  ].bg}"
                >
                  <ShieldAlert class="h-5 w-5 {severityStyles[alert.severity].text}" />
                </div>
                <div>
                  <p class="font-medium text-[hsl(var(--foreground))]">{alert.message}</p>
                  <div
                    class="mt-1 flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"
                  >
                    <span class="flex items-center gap-1">
                      <Globe class="h-3 w-3" />
                      {alert.source}
                    </span>
                    <span>•</span>
                    <span>{formatRelativeTime(alert.timestamp)}</span>
                  </div>
                </div>
              </div>
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium capitalize {statusStyles[
                  alert.status
                ].bg} {statusStyles[alert.status].text}"
              >
                {alert.status}
              </span>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Blocked IPs -->
    <div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div class="flex items-center justify-between border-b border-[hsl(var(--border))] p-4">
        <h2 class="text-lg font-semibold text-[hsl(var(--foreground))]">Blocked IPs</h2>
      </div>
      <div class="space-y-3 p-4">
        {#each blockedIPs as blocked}
          <div
            class="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/30 p-4 transition-colors hover:bg-[hsl(var(--secondary))]/50"
          >
            <div class="flex items-start justify-between">
              <div>
                <p class="font-mono font-medium text-[hsl(var(--foreground))]">{blocked.ip}</p>
                <p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{blocked.reason}</p>
                <div
                  class="mt-2 flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"
                >
                  <span>{blocked.attempts} attempts</span>
                  <span>•</span>
                  <span>Blocked {formatRelativeTime(blocked.blocked_at)}</span>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
