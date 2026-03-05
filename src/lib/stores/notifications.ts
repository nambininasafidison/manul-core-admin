import { derived, writable } from 'svelte/store';

export type NotificationType = 'info' | 'warning' | 'error' | 'success' | 'security' | 'system';

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  source?: string;
}

const STORAGE_KEY = 'manul_admin_notifications';
const MAX_NOTIFICATIONS = 50;

function loadFromStorage(): AdminNotification[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(notifications: AdminNotification[]) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)));
  } catch {
    // Ignore storage errors
  }
}

function createNotificationStore() {
  const { subscribe, update, set } = writable<AdminNotification[]>(loadFromStorage());

  // Persist on every change
  subscribe((notifications) => {
    saveToStorage(notifications);
  });

  return {
    subscribe,
    add: (type: NotificationType, title: string, message: string, source?: string) => {
      const notification: AdminNotification = {
        id: crypto.randomUUID(),
        type,
        title,
        message,
        timestamp: Date.now(),
        read: false,
        source,
      };
      update((list) => [notification, ...list].slice(0, MAX_NOTIFICATIONS));
    },
    markAsRead: (id: string) => {
      update((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
    },
    markAllAsRead: () => {
      update((list) => list.map((n) => ({ ...n, read: true })));
    },
    remove: (id: string) => {
      update((list) => list.filter((n) => n.id !== id));
    },
    clear: () => {
      set([]);
    },
  };
}

export const notificationStore = createNotificationStore();

export const unreadCount = derived(
  notificationStore,
  ($notifications) => $notifications.filter((n) => !n.read).length,
);
