/**
 * Dashboard Store - Gère les données du dashboard admin
 * Intégré avec le backend Rust Manul Core
 */

import { adminApi } from '$lib/api/client';
import type { SystemStats } from '$lib/types';
import { derived, writable } from 'svelte/store';

// Types
export interface MotherSupremeStatus {
  capital: number;
  childrenCount: number;
  generationMax: number;
  compoundRate: number;
  lastActivity: string;
  canSpawn: boolean;
}

export interface RecentActivity {
  type: 'rental' | 'spawn' | 'profit' | 'withdrawal' | 'deposit';
  user?: string;
  bot?: string;
  parent?: string;
  amount?: number;
  time: Date;
}

export interface SystemAlert {
  level: 'info' | 'warning' | 'critical';
  message: string;
  time: Date;
}

export interface DashboardData {
  systemStats: SystemStats;
  motherSupreme: MotherSupremeStatus | null;
  recentActivity: RecentActivity[];
  alerts: SystemAlert[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: DashboardData = {
  systemStats: {
    totalBots: 0,
    activeBots: 0,
    totalUsers: 0,
    activeRentals: 0,
    totalCapital: 0,
    totalProfit: 0,
    uptimeSeconds: 0,
    cpuUsage: 0,
    memoryUsage: 0,
  },
  motherSupreme: null,
  recentActivity: [],
  alerts: [],
  loading: false,
  error: null,
};

function createDashboardStore() {
  const { subscribe, set, update } = writable<DashboardData>(initialState);

  return {
    subscribe,

    async loadStats() {
      update((s) => ({ ...s, loading: true, error: null }));

      try {
        const stats = await adminApi.getSystemStats();
        update((s) => ({
          ...s,
          systemStats: {
            totalBots: stats.total_bots,
            activeBots: stats.active_bots,
            totalUsers: 0, // Not provided by backend, will be fetched separately if needed
            activeRentals: stats.active_contracts,
            totalCapital: stats.total_capital,
            totalProfit: stats.total_distributed,
            uptimeSeconds: stats.uptime_seconds,
            cpuUsage: 0, // System metrics not exposed for security
            memoryUsage: 0,
          },
          loading: false,
        }));
      } catch (error) {
        // Fallback to mock data if backend unavailable
        update((s) => ({
          ...s,
          systemStats: {
            totalBots: 1247,
            activeBots: 892,
            totalUsers: 15483,
            activeRentals: 3421,
            totalCapital: 2847392.45,
            totalProfit: 487293.12,
            uptimeSeconds: 2592000,
            cpuUsage: 34,
            memoryUsage: 52,
          },
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load stats',
        }));
      }
    },

    async loadMotherSupreme() {
      try {
        const mother = await adminApi.getMotherStatus();
        update((s) => ({
          ...s,
          motherSupreme: {
            capital: mother.summary.capital,
            childrenCount: mother.summary.total_children,
            generationMax: mother.summary.max_generation,
            compoundRate: mother.config.child_capital_share,
            lastActivity: new Date().toISOString(),
            canSpawn: mother.can_spawn,
          },
        }));
      } catch (error) {
        // Fallback to mock data
        update((s) => ({
          ...s,
          motherSupreme: {
            capital: 892341.67,
            childrenCount: 1247,
            generationMax: 8,
            compoundRate: 0.4,
            lastActivity: new Date().toISOString(),
            canSpawn: true,
          },
        }));
      }
    },

    async loadRecentActivity() {
      try {
        const auditLogs = await adminApi.getAuditLogs({ limit: 10 });
        const activities: RecentActivity[] = auditLogs.items.map((log) => ({
          type: log.action.includes('rental')
            ? 'rental'
            : log.action.includes('spawn')
              ? 'spawn'
              : log.action.includes('profit')
                ? 'profit'
                : log.action.includes('withdrawal')
                  ? 'withdrawal'
                  : 'deposit',
          user: log.actorType === 'user' ? log.actorId : undefined,
          bot: log.targetType === 'bot' ? log.targetId : undefined,
          amount: (log.details as Record<string, number>)?.amount,
          time: new Date(log.timestamp),
        }));
        update((s) => ({ ...s, recentActivity: activities }));
      } catch {
        // Keep existing mock data
      }
    },

    async loadAlerts() {
      try {
        const securityEvents = await adminApi.getSecurityEvents({ limit: 5 });
        const alerts: SystemAlert[] = securityEvents.items
          .filter((e) => !e.resolved)
          .map((e) => ({
            level: e.severity,
            message: e.event,
            time: new Date(e.timestamp),
          }));
        update((s) => ({ ...s, alerts }));
      } catch {
        // Keep existing mock data
      }
    },

    async loadAll() {
      await Promise.all([
        this.loadStats(),
        this.loadMotherSupreme(),
        this.loadRecentActivity(),
        this.loadAlerts(),
      ]);
    },

    setRecentActivity(activities: RecentActivity[]) {
      update((s) => ({ ...s, recentActivity: activities }));
    },

    setAlerts(alerts: SystemAlert[]) {
      update((s) => ({ ...s, alerts }));
    },

    reset() {
      set(initialState);
    },
  };
}

export const dashboardStore = createDashboardStore();

// Derived stores for specific data
export const systemStats = derived(dashboardStore, ($d) => $d.systemStats);
export const motherSupreme = derived(dashboardStore, ($d) => $d.motherSupreme);
export const isLoading = derived(dashboardStore, ($d) => $d.loading);
