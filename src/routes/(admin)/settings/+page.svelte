<script lang="ts">
  import { adminApi } from '$lib/api/client';
  import { Button } from '$lib/components/ui';
  import {
    Bell,
    Key,
    Lock,
    Mail,
    Moon,
    RefreshCw,
    Save,
    Server,
    Settings,
    Shield,
    Webhook,
  } from 'lucide-svelte';
  import { onMount } from 'svelte';

  // States
  let loading = $state(true);
  let activeTab = $state('general');
  let siteName = $state('Manul Core');
  let siteUrl = $state('https://manul.io');
  let supportEmail = $state('support@manul.io');
  let timezone = $state('UTC');
  let apiRateLimit = $state('100');
  let webhookUrl = $state('');
  let isDarkMode = $state(true);
  let emailNotifications = $state(true);
  let pushNotifications = $state(true);
  let twoFactorEnabled = $state(true);
  let autoBackup = $state(true);
  let maintenanceMode = $state(false);

  // System config from backend
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
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadData();
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api', label: 'API & Webhooks', icon: Webhook },
    { id: 'system', label: 'System', icon: Server },
  ];
</script>

<svelte:head>
  <title>Settings - Manul Admin</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">Settings</h1>
      <p class="text-[hsl(var(--muted-foreground))]">Configure system preferences and options</p>
    </div>
    <Button variant="default" size="sm" disabled>
      <Save class="h-4 w-4" />
      Config Immutable
    </Button>
  </div>

  <!-- Tab Navigation -->
  <div class="flex flex-wrap gap-2 border-b border-[hsl(var(--border))] pb-4">
    {#each tabs as tab}
      {@const Icon = tab.icon}
      <button
        class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors {activeTab ===
        tab.id
          ? 'bg-[hsl(var(--primary))] text-white'
          : 'bg-[hsl(var(--secondary))]/30 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]/50 hover:text-[hsl(var(--foreground))]'}"
        onclick={() => (activeTab = tab.id)}
      >
        <Icon class="h-4 w-4" />
        {tab.label}
      </button>
    {/each}
  </div>

  <!-- Tab Content -->
  {#if activeTab === 'general'}
    <div class="space-y-6">
      <div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        <h3 class="mb-4 text-lg font-semibold text-[hsl(var(--foreground))]">General Settings</h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              for="siteName"
              class="mb-2 block text-sm font-medium text-[hsl(var(--foreground))]">Site Name</label
            >
            <input
              id="siteName"
              type="text"
              bind:value={siteName}
              class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
            />
          </div>
          <div>
            <label
              for="siteUrl"
              class="mb-2 block text-sm font-medium text-[hsl(var(--foreground))]">Site URL</label
            >
            <input
              id="siteUrl"
              type="text"
              bind:value={siteUrl}
              class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
            />
          </div>
          <div>
            <label
              for="supportEmail"
              class="mb-2 block text-sm font-medium text-[hsl(var(--foreground))]"
              >Support Email</label
            >
            <input
              id="supportEmail"
              type="email"
              bind:value={supportEmail}
              class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
            />
          </div>
          <div>
            <label
              for="timezone"
              class="mb-2 block text-sm font-medium text-[hsl(var(--foreground))]">Timezone</label
            >
            <select
              id="timezone"
              bind:value={timezone}
              class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Europe/Paris">Europe/Paris</option>
              <option value="Asia/Tokyo">Asia/Tokyo</option>
            </select>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        <h3 class="mb-4 text-lg font-semibold text-[hsl(var(--foreground))]">Appearance</h3>
        <div class="flex items-center justify-between rounded-lg bg-[hsl(var(--secondary))]/30 p-4">
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary))]/20"
            >
              <Moon class="h-5 w-5 text-[hsl(var(--primary))]" />
            </div>
            <div>
              <p class="font-medium text-[hsl(var(--foreground))]">Dark Mode</p>
              <p class="text-sm text-[hsl(var(--muted-foreground))]">
                Use dark theme across the application
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isDarkMode}
            aria-label="Toggle dark mode"
            class="relative h-6 w-11 rounded-full transition-colors {isDarkMode
              ? 'bg-[hsl(var(--primary))]'
              : 'bg-[hsl(var(--secondary))]'}"
            onclick={() => (isDarkMode = !isDarkMode)}
          >
            <span
              class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform {isDarkMode
                ? 'translate-x-5'
                : ''}"
            ></span>
          </button>
        </div>
      </div>
    </div>
  {:else if activeTab === 'notifications'}
    <div class="space-y-4">
      <div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        <h3 class="mb-4 text-lg font-semibold text-[hsl(var(--foreground))]">
          Notification Preferences
        </h3>
        <div class="space-y-4">
          <div
            class="flex items-center justify-between rounded-lg bg-[hsl(var(--secondary))]/30 p-4"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--info))]/20"
              >
                <Mail class="h-5 w-5 text-[hsl(var(--info))]" />
              </div>
              <div>
                <p class="font-medium text-[hsl(var(--foreground))]">Email Notifications</p>
                <p class="text-sm text-[hsl(var(--muted-foreground))]">
                  Receive email alerts for important events
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={emailNotifications}
              aria-label="Toggle email notifications"
              class="relative h-6 w-11 rounded-full transition-colors {emailNotifications
                ? 'bg-[hsl(var(--primary))]'
                : 'bg-[hsl(var(--secondary))]'}"
              onclick={() => (emailNotifications = !emailNotifications)}
            >
              <span
                class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform {emailNotifications
                  ? 'translate-x-5'
                  : ''}"
              ></span>
            </button>
          </div>
          <div
            class="flex items-center justify-between rounded-lg bg-[hsl(var(--secondary))]/30 p-4"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--warning))]/20"
              >
                <Bell class="h-5 w-5 text-[hsl(var(--warning))]" />
              </div>
              <div>
                <p class="font-medium text-[hsl(var(--foreground))]">Push Notifications</p>
                <p class="text-sm text-[hsl(var(--muted-foreground))]">
                  Get browser push notifications
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={pushNotifications}
              aria-label="Toggle push notifications"
              class="relative h-6 w-11 rounded-full transition-colors {pushNotifications
                ? 'bg-[hsl(var(--primary))]'
                : 'bg-[hsl(var(--secondary))]'}"
              onclick={() => (pushNotifications = !pushNotifications)}
            >
              <span
                class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform {pushNotifications
                  ? 'translate-x-5'
                  : ''}"
              ></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  {:else if activeTab === 'security'}
    <div class="space-y-4">
      <div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        <h3 class="mb-4 text-lg font-semibold text-[hsl(var(--foreground))]">Security Settings</h3>
        <div class="space-y-4">
          <div
            class="flex items-center justify-between rounded-lg bg-[hsl(var(--secondary))]/30 p-4"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--success))]/20"
              >
                <Shield class="h-5 w-5 text-[hsl(var(--success))]" />
              </div>
              <div>
                <p class="font-medium text-[hsl(var(--foreground))]">Two-Factor Authentication</p>
                <p class="text-sm text-[hsl(var(--muted-foreground))]">
                  Require 2FA for all admin accounts
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={twoFactorEnabled}
              aria-label="Toggle two-factor authentication"
              class="relative h-6 w-11 rounded-full transition-colors {twoFactorEnabled
                ? 'bg-[hsl(var(--primary))]'
                : 'bg-[hsl(var(--secondary))]'}"
              onclick={() => (twoFactorEnabled = !twoFactorEnabled)}
            >
              <span
                class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform {twoFactorEnabled
                  ? 'translate-x-5'
                  : ''}"
              ></span>
            </button>
          </div>
          <div class="rounded-lg bg-[hsl(var(--secondary))]/30 p-4">
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--gold))]/20"
              >
                <Key class="h-5 w-5 text-[hsl(var(--gold))]" />
              </div>
              <div class="flex-1">
                <p class="font-medium text-[hsl(var(--foreground))]">API Key</p>
                <p class="font-mono text-sm text-[hsl(var(--muted-foreground))]">
                  sk-****************************abc
                </p>
              </div>
              <Button variant="outline" size="sm">
                <RefreshCw class="h-4 w-4" />
                Regenerate
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  {:else if activeTab === 'api'}
    <div class="space-y-4">
      <div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        <h3 class="mb-4 text-lg font-semibold text-[hsl(var(--foreground))]">API Configuration</h3>
        <div class="space-y-4">
          <div>
            <label
              for="apiRateLimit"
              class="mb-2 block text-sm font-medium text-[hsl(var(--foreground))]"
              >API Rate Limit (requests/min)</label
            >
            <input
              id="apiRateLimit"
              type="number"
              bind:value={apiRateLimit}
              class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
            />
          </div>
          <div>
            <label
              for="webhookUrl"
              class="mb-2 block text-sm font-medium text-[hsl(var(--foreground))]"
              >Webhook URL</label
            >
            <input
              id="webhookUrl"
              type="url"
              bind:value={webhookUrl}
              placeholder="https://your-webhook-endpoint.com"
              class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
            />
          </div>
        </div>
      </div>
    </div>
  {:else if activeTab === 'system'}
    <div class="space-y-4">
      <div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        <h3 class="mb-4 text-lg font-semibold text-[hsl(var(--foreground))]">System Settings</h3>
        <div class="space-y-4">
          <div
            class="flex items-center justify-between rounded-lg bg-[hsl(var(--secondary))]/30 p-4"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--info))]/20"
              >
                <Server class="h-5 w-5 text-[hsl(var(--info))]" />
              </div>
              <div>
                <p class="font-medium text-[hsl(var(--foreground))]">Auto Backup</p>
                <p class="text-sm text-[hsl(var(--muted-foreground))]">
                  Automatically backup database daily
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoBackup}
              aria-label="Toggle auto backup"
              class="relative h-6 w-11 rounded-full transition-colors {autoBackup
                ? 'bg-[hsl(var(--primary))]'
                : 'bg-[hsl(var(--secondary))]'}"
              onclick={() => (autoBackup = !autoBackup)}
            >
              <span
                class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform {autoBackup
                  ? 'translate-x-5'
                  : ''}"
              ></span>
            </button>
          </div>
          <div
            class="flex items-center justify-between rounded-lg border border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/10 p-4"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--warning))]/20"
              >
                <Lock class="h-5 w-5 text-[hsl(var(--warning))]" />
              </div>
              <div>
                <p class="font-medium text-[hsl(var(--foreground))]">Maintenance Mode</p>
                <p class="text-sm text-[hsl(var(--muted-foreground))]">
                  Disable public access temporarily
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={maintenanceMode}
              aria-label="Toggle maintenance mode"
              class="relative h-6 w-11 rounded-full transition-colors {maintenanceMode
                ? 'bg-[hsl(var(--warning))]'
                : 'bg-[hsl(var(--secondary))]'}"
              onclick={() => (maintenanceMode = !maintenanceMode)}
            >
              <span
                class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform {maintenanceMode
                  ? 'translate-x-5'
                  : ''}"
              ></span>
            </button>
          </div>
        </div>
      </div>

      <div
        class="rounded-xl border border-[hsl(var(--destructive))]/30 bg-[hsl(var(--destructive))]/10 p-6"
      >
        <h3 class="mb-2 text-lg font-semibold text-[hsl(var(--destructive))]">Danger Zone</h3>
        <p class="mb-4 text-sm text-[hsl(var(--muted-foreground))]">
          These actions are irreversible. Please proceed with caution.
        </p>
        <div class="flex flex-wrap gap-3">
          <button
            class="rounded-lg border border-[hsl(var(--destructive))] bg-transparent px-4 py-2 text-sm font-medium text-[hsl(var(--destructive))] transition-colors hover:bg-[hsl(var(--destructive))]/10"
          >
            Clear Cache
          </button>
          <button
            class="rounded-lg bg-[hsl(var(--destructive))] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[hsl(var(--destructive))]/90"
          >
            Reset Database
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
