import { adminApi } from '$lib/api/client';
import type { AdminUser, AuthState } from '$lib/types';
import { derived, writable } from 'svelte/store';

// Auth store with triple authentication state
function createAuthStore() {
  const { subscribe, set, update } = writable<{
    user: AdminUser | null;
    authState: AuthState;
    isAuthenticated: boolean;
    sessionExpiry: number | null;
  }>({
    user: null,
    authState: { step: 'credentials' },
    isAuthenticated: false,
    sessionExpiry: null,
  });

  return {
    subscribe,
    setStep: (step: AuthState['step']) =>
      update((state) => ({
        ...state,
        authState: { ...state.authState, step },
      })),
    setSessionId: (sessionId: string, expiresAt: number) =>
      update((state) => ({
        ...state,
        authState: { ...state.authState, sessionId, expiresAt },
      })),
    setChallengeId: (challengeId: string) =>
      update((state) => ({
        ...state,
        authState: { ...state.authState, challengeId },
      })),
    completeAuth: (user: AdminUser, sessionExpiry: number) =>
      set({
        user,
        authState: { step: 'complete' },
        isAuthenticated: true,
        sessionExpiry,
      }),
    logout: () => {
      adminApi.logout().catch(() => {});
      set({
        user: null,
        authState: { step: 'credentials' },
        isAuthenticated: false,
        sessionExpiry: null,
      });
    },
    updateSessionExpiry: (expiry: number) =>
      update((state) => ({
        ...state,
        sessionExpiry: expiry,
      })),
    // Initialize from stored token
    async initFromToken() {
      if (adminApi.isAuthenticated()) {
        try {
          const session = await adminApi.getSession();
          set({
            user: {
              id: session.user_id,
              username: session.username,
              email: `${session.username}@manulcore.io`,
              role: session.role === 'creator' ? 'creator' : 'super_admin',
              totpEnabled: session.two_factor_verified,
              hardwareKeyEnabled: session.two_factor_verified,
              createdAt: new Date().toISOString(),
            },
            authState: { step: 'complete' },
            isAuthenticated: true,
            sessionExpiry: new Date(session.expires_at).getTime(),
          });
          return true;
        } catch {
          adminApi.clearTokens();
        }
      }
      return false;
    },
  };
}

export const authStore = createAuthStore();

// Session activity tracker
export const lastActivityStore = writable<number>(Date.now());

// Derived store for session validity
export const isSessionValid = derived([authStore, lastActivityStore], ([$auth, $lastActivity]) => {
  if (!$auth.isAuthenticated || !$auth.sessionExpiry) return false;
  const now = Date.now();
  const inactivityTimeout = 15 * 60 * 1000; // 15 minutes
  return now < $auth.sessionExpiry && now - $lastActivity < inactivityTimeout;
});

// Device fingerprint store (for security verification)
export const deviceFingerprintStore = writable<string | null>(null);

// Security alerts store
function createSecurityAlertsStore() {
  const { subscribe, update } = writable<
    Array<{
      id: string;
      type: 'warning' | 'error' | 'info' | 'success';
      message: string;
      timestamp: number;
      dismissed: boolean;
    }>
  >([]);

  return {
    subscribe,
    add: (type: 'warning' | 'error' | 'info' | 'success', message: string) =>
      update((alerts) => [
        ...alerts,
        {
          id: crypto.randomUUID(),
          type,
          message,
          timestamp: Date.now(),
          dismissed: false,
        },
      ]),
    dismiss: (id: string) =>
      update((alerts) => alerts.map((a) => (a.id === id ? { ...a, dismissed: true } : a))),
    clear: () => update(() => []),
  };
}

export const securityAlertsStore = createSecurityAlertsStore();
