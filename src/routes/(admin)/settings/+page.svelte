<script lang="ts">
  import { adminApi } from '$lib/api/client';
  import { Button } from '$lib/components/ui';
  import { toastStore } from '$lib/stores/auth';
  import { RefreshCw, Server, Settings } from 'lucide-svelte';
  import { onMount } from 'svelte';

  let loading = $state(true);

  let systemConfig = $state({
    max_population: 0,
    spawn_threshold: 0,
    child_capital_share: 0,
    mutation_rate: 0,
    spawn_cooldown_secs: 0,
  });

  async function loadData() {
    loading = true;
    try {
      const configRes = await adminApi.getConfig();
      systemConfig = configRes;
    } catch (error) {
      console.error('Failed to load config:', error);
      toastStore.add('error', 'Failed to load system configuration');
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadData();
  });

  const configItems = $derived([
    {
      label: 'Max Population',
      value: systemConfig.max_population,
      description: 'Maximum number of bots in the population',
    },
    {
      label: 'Spawn Threshold',
      value: systemConfig.spawn_threshold,
      description: 'Performance threshold for spawning new bots',
    },
    {
      label: 'Child Capital Share',
      value: `${(systemConfig.child_capital_share * 100).toFixed(1)}%`,
      description: 'Percentage of capital allocated to child bots',
    },
    {
      label: 'Mutation Rate',
      value: `${(systemConfig.mutation_rate * 100).toFixed(1)}%`,
      description: 'Rate of genetic mutation during evolution',
    },
    {
      label: 'Spawn Cooldown',
      value: `${systemConfig.spawn_cooldown_secs}s`,
      description: 'Cooldown period between spawn events',
    },
  ]);
</script>

<svelte:head>
  <title>Settings - Manul Admin</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">Settings</h1>
      <p class="text-[hsl(var(--muted-foreground))]">System configuration (read-only)</p>
    </div>
    <Button variant="outline" size="sm" onclick={loadData} disabled={loading}>
      <RefreshCw class="h-4 w-4 {loading ? 'animate-spin' : ''}" />
      {loading ? 'Loading...' : 'Refresh'}
    </Button>
  </div>

  <!-- System Configuration -->
  <div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
    <div class="mb-6 flex items-center gap-3">
      <div
        class="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--primary))]/20"
      >
        <Settings class="h-5 w-5 text-[hsl(var(--primary))]" />
      </div>
      <div>
        <h2 class="text-lg font-semibold text-[hsl(var(--foreground))]">
          Evolution Engine Configuration
        </h2>
        <p class="text-sm text-[hsl(var(--muted-foreground))]">
          These values are managed via the deployment configuration
        </p>
      </div>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-12">
        <RefreshCw class="h-6 w-6 animate-spin text-[hsl(var(--muted-foreground))]" />
      </div>
    {:else}
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each configItems as item}
          <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-4">
            <p class="text-sm text-[hsl(var(--muted-foreground))]">{item.label}</p>
            <p class="mt-1 text-2xl font-bold text-[hsl(var(--foreground))]">{item.value}</p>
            <p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{item.description}</p>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Info Banner -->
  <div class="rounded-xl border border-[hsl(var(--info))]/30 bg-[hsl(var(--info))]/10 p-4">
    <div class="flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--info))]/20">
        <Server class="h-5 w-5 text-[hsl(var(--info))]" />
      </div>
      <div>
        <p class="font-medium text-[hsl(var(--foreground))]">Configuration is Immutable</p>
        <p class="text-sm text-[hsl(var(--muted-foreground))]">
          System settings are managed through the deployment pipeline. Changes require a
          redeployment.
        </p>
      </div>
    </div>
  </div>
</div>
