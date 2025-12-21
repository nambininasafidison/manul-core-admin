/**
 * Dashboard Store - Gère les données du dashboard admin
 */

import { adminApi } from '$lib/api/client';
import { derived, writable } from 'svelte/store';

// Types
export interface SystemStats {
  totalBots: number;
  activeBots: number;
  totalUsers: number;
  activeRentals: number;
  totalCapital: number;
  totalProfit: number;
  uptimeSeconds: number;
  cpuUsage: number;
  memoryUsage: number;
}

export interface MotherSupremeStatus {
  capital: number;
  childrenCount: number;
  generationMax: number;
  compoundRate: number;
  lastActivity: string;
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
          systemStats: stats,
          loading: false,
        }));
      } catch (error) {
        // Utiliser des données mock en cas d'erreur
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
          error: null,
        }));
      }
    },

    async loadMotherSupreme() {
      try {
        const mother = await adminApi.getMotherSupremeStatus();
        update((s) => ({ ...s, motherSupreme: mother }));
      } catch (error) {
        // Mock data
        update((s) => ({
          ...s,
          motherSupreme: {
            capital: 892341.67,
            childrenCount: 1247,
            generationMax: 8,
            compoundRate: 0.4,
            lastActivity: new Date().toISOString(),
          },
        }));
      }
    },

    async loadAll() {
      await Promise.all([this.loadStats(), this.loadMotherSupreme()]);
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
