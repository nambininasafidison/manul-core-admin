/**
 * Admin API Client
 *
 * Client pour communiquer avec le backend Rust Manul Core.
 * Le X-Admin-Secret est injecté côté serveur par le proxy SvelteKit
 * (routes/api/admin/[...path]/+server.ts) — il ne passe JAMAIS par le browser.
 */
import { config } from '$lib/config';

const API_BASE = config.apiBase;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

class AdminApiClient {
  private adminToken: string = '';
  private sessionToken: string = '';

  constructor() {
    // Restaurer le token depuis localStorage si disponible
    if (typeof window !== 'undefined') {
      this.adminToken = localStorage.getItem('admin_token') || '';
    }
  }

  setToken(token: string) {
    this.adminToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('admin_token', token);
      } else {
        localStorage.removeItem('admin_token');
      }
    }
  }

  setSessionToken(sessionToken: string) {
    this.sessionToken = sessionToken;
  }

  getToken(): string {
    return this.adminToken;
  }

  clearTokens() {
    this.adminToken = '';
    this.sessionToken = '';
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.adminToken && { Authorization: `Bearer ${this.adminToken}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      // Handle token expiration
      if (response.status === 401) {
        this.clearTokens();
      }
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result: ApiResponse<T> = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Unknown error');
    }

    return result.data as T;
  }

  // Compatible avec les routes backend: /api/admin/auth/*

  async login(username: string, password: string) {
    const result = await this.fetch<{
      requires_2fa: boolean;
      totp_enabled: boolean;
      hardware_key_enabled: boolean;
      session_token: string | null;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (result.session_token) {
      this.setSessionToken(result.session_token);
    }

    return {
      sessionToken: result.session_token,
      requiresTotp: result.totp_enabled,
      requiresHardwareKey: result.hardware_key_enabled,
    };
  }

  async verifyTotp(code: string) {
    const result = await this.fetch<{
      success: boolean;
      token: string;
      expires_in: number;
      challenge?: string;
    }>('/auth/totp/verify', {
      method: 'POST',
      body: JSON.stringify({ code, session_token: this.sessionToken }),
    });

    if (result.token) {
      this.setToken(result.token);
    }

    return {
      verified: result.success,
      token: result.token,
      expiresIn: result.expires_in,
      challenge: result.challenge,
    };
  }

  async verifyHardwareKey(credentialId: string, response: string) {
    const result = await this.fetch<{ success: boolean; token: string; expires_in: number }>(
      '/auth/hardware-key/verify',
      {
        method: 'POST',
        body: JSON.stringify({
          credential_id: credentialId,
          response,
          session_token: this.sessionToken,
        }),
      },
    );

    if (result.token) {
      this.setToken(result.token);
    }

    return {
      verified: result.success,
      token: result.token,
      expiresIn: result.expires_in,
    };
  }

  /**
   * Obtenir les options pour enregistrer un nouveau credential WebAuthn
   * (passkey: fingerprint, security key, Microsoft Authenticator, Google Passkey...)
   * Si authenticatorType n'est pas spécifié, le serveur omet authenticatorAttachment
   * et le navigateur propose TOUTES les options disponibles.
   */
  async getWebAuthnRegisterOptions(authenticatorType?: 'platform' | 'cross-platform') {
    return this.fetch<{
      challenge: string;
      rp: { name: string; id: string };
      user: { id: string; name: string; displayName: string };
      pubKeyCredParams: Array<{ type: string; alg: number }>;
      authenticatorSelection: {
        authenticatorAttachment: string;
        userVerification: string;
        residentKey: string;
      };
      timeout: number;
      excludeCredentials: Array<{ id: string; type: string }>;
      attestation: string;
    }>('/auth/webauthn/register-options', {
      method: 'POST',
      body: JSON.stringify({
        session_token: this.sessionToken,
        ...(authenticatorType ? { authenticator_type: authenticatorType } : {}),
      }),
    });
  }

  /**
   * Enregistrer un credential WebAuthn après création côté client
   */
  async registerWebAuthnCredential(
    credentialId: string,
    publicKey: string,
    authenticatorType: string,
    label: string,
  ) {
    const result = await this.fetch<{
      success: boolean;
      token: string;
      expires_in: number;
      credential_registered: boolean;
      authenticator_type: string;
      label: string;
    }>('/auth/webauthn/register', {
      method: 'POST',
      body: JSON.stringify({
        session_token: this.sessionToken,
        credential_id: credentialId,
        public_key: publicKey,
        authenticator_type: authenticatorType,
        label,
      }),
    });

    if (result.token) {
      this.setToken(result.token);
    }

    return result;
  }

  /**
   * Obtenir les options d'authentification WebAuthn (credentials existants)
   */
  async getWebAuthnAuthOptions() {
    return this.fetch<{
      has_credentials: boolean;
      challenge: string;
      rpId: string;
      allowCredentials: Array<{ id: string; type: string; transports: string[] }>;
      userVerification: string;
      timeout: number;
      registered_types: string[];
    }>('/auth/webauthn/auth-options', {
      method: 'POST',
      body: JSON.stringify({ session_token: this.sessionToken }),
    });
  }

  async logout() {
    try {
      await this.fetch<{ success: boolean }>('/auth/logout', { method: 'POST' });
    } finally {
      this.clearTokens();
    }
  }

  async getSession() {
    return this.fetch<{
      user_id: string;
      username: string;
      role: string;
      permissions: string[];
      expires_at: string;
      two_factor_verified: boolean;
    }>('/auth/session');
  }

  isAuthenticated(): boolean {
    return !!this.adminToken;
  }

  // Compatible avec les routes backend: /api/admin/stats, /api/admin/mother, /api/admin/health

  async getDashboard() {
    return this.fetch<{
      uptime_seconds: number;
      supreme_mother: {
        capital: number;
        total_children: number;
        living_children: number;
        total_profit: number;
        max_generation: number;
      };
      rentals: {
        active_contracts: number;
        total_capital: number;
        total_distributed: number;
      };
      naming_capacity: number;
    }>('/dashboard');
  }

  async getSystemStats() {
    return this.fetch<{
      uptime_seconds: number;
      total_bots: number;
      active_bots: number;
      total_capital: number;
      total_distributed: number;
      active_contracts: number;
      naming_capacity_remaining: number;
    }>('/stats');
  }

  async getMotherStatus() {
    return this.fetch<{
      summary: {
        capital: number;
        total_children: number;
        living_children: number;
        total_profit: number;
        max_generation: number;
      };
      can_spawn: boolean;
      config: {
        spawn_threshold: number;
        child_capital_share: number;
        mutation_rate: number;
        max_population: number;
        spawn_cooldown_secs: number;
      };
    }>('/mother');
  }

  async getMotherConfig() {
    return this.fetch<{
      initial_capital: number;
      spawn_threshold: number;
      child_capital_share: number;
      mutation_rate: number;
      max_population: number;
      spawn_cooldown_secs: number;
    }>('/mother/config');
  }

  async getSystemHealth() {
    return this.fetch<{
      status: 'healthy' | 'degraded' | 'critical';
      uptime_seconds: number;
      services: Array<{ name: string; status: string; latency: number }>;
      lastCheck: string;
    }>('/health');
  }

  // Compatible avec les routes backend: /api/admin/population

  async getPopulationStats() {
    return this.fetch<{
      by_generation: Array<{ generation: number; count: number }>;
      max_generation: number;
      reproduction_rate: number;
      mortality_rate: number;
    }>('/population');
  }

  // Compatible avec les routes backend: /api/admin/bots (LECTURE SEULE)
  // Note: updateBotStatus et forceBotSpawn ont été SUPPRIMÉS pour sécurité

  async getBots(params?: { status?: string; generation?: number; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.generation) searchParams.set('generation', params.generation.toString());
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    return this.fetch<{
      bots: Array<{
        id: string;
        name: string;
        status: string;
        generation: number;
        capital: number;
        performance: number;
        created_at: string;
        parent_name?: string;
        children_count: number;
      }>;
      total: number;
    }>(`/bots?${searchParams.toString()}`);
  }

  async getBot(id: string) {
    return this.fetch<{
      id: string;
      name: string;
      status: string;
      generation: number;
      capital: number;
      performance: number;
      created_at: string;
      parent_name?: string;
      children_count: number;
    }>(`/bots/${id}`);
  }

  // SUPPRIMÉ: updateBotStatus - Le statut des bots est géré automatiquement
  // SUPPRIMÉ: forceBotSpawn - Seule la Supreme Mother peut spawn des bots

  // Compatible avec les routes backend: /api/admin/users (LECTURE SEULE)
  // Note: updateUserStatus a été SUPPRIMÉ pour sécurité

  async getUsers(params?: { status?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    return this.fetch<{
      items: Array<{
        id: string;
        username: string;
        email?: string;
        walletAddress?: string;
        balance: number;
        invested: number;
        totalProfit: number;
        vipLevel: number;
        activeRentals: number;
        createdAt: string;
        lastActive?: string;
        status: 'active' | 'suspended' | 'banned';
      }>;
      total: number;
      page: number;
      perPage: number;
    }>(`/users?${searchParams.toString()}`);
  }

  async getUser(id: string) {
    return this.fetch<{
      id: string;
      username: string;
      email?: string;
      walletAddress?: string;
      balance: number;
      invested: number;
      totalProfit: number;
      vipLevel: number;
      referralCode: string;
      referralCount: number;
      createdAt: string;
      lastActive?: string;
      status: 'active' | 'suspended' | 'banned';
      rentals: Array<{
        id: string;
        botId: string;
        botName: string;
        amount: number;
        profit: number;
        status: string;
        startDate: string;
        endDate: string;
      }>;
    }>(`/users/${id}`);
  }

  // SUPPRIMÉ: updateUserStatus - Les utilisateurs ne peuvent pas être bannis manuellement

  // Compatible avec les routes backend: /api/admin/rentals (LECTURE SEULE)
  // Note: cancelRental a été SUPPRIMÉ - les contrats sont irrévocables

  async getRentals(params?: {
    status?: string;
    userId?: string;
    botId?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.botId) searchParams.set('botId', params.botId);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    return this.fetch<{
      stats: {
        active_contracts: number;
        total_users: number;
        total_capital: number;
        total_distributed: number;
      };
      rentals: Array<{
        id: string;
        userId: string;
        botId: string;
        botName: string;
        userName: string;
        amount: number;
        startDate: string;
        endDate: string;
        status: string;
        profit: number;
        userShare: number;
        systemShare: number;
      }>;
    }>(`/rentals?${searchParams.toString()}`);
  }

  async getRentalStats() {
    return this.fetch<{
      active_contracts: number;
      total_users: number;
      total_capital: number;
      total_distributed: number;
    }>('/rentals/stats');
  }

  // SUPPRIMÉ: cancelRental - Les contrats sont engageants et irrévocables

  // Compatible avec les routes backend: /api/admin/finance/summary, /api/admin/finance/transactions

  async getFinancialSummary() {
    return this.fetch<{
      totalCapital: number;
      userCapital: number;
      systemCapital: number;
      motherSupremeCapital: number;
      dailyProfit: number;
      weeklyProfit: number;
      monthlyProfit: number;
      pendingWithdrawals: number;
      pendingDeposits: number;
    }>('/finance/summary');
  }

  async getTransactions(params?: { type?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    return this.fetch<{
      items: Array<{
        id: string;
        type: string;
        amount: number;
        currency: string;
        userId?: string;
        botId?: string;
        status: string;
        createdAt: string;
        description?: string;
      }>;
      total: number;
      page: number;
      perPage: number;
    }>(`/finance/transactions?${searchParams.toString()}`);
  }

  // Compatible avec les routes backend: /api/admin/audit/*

  async getAuditLogs(params?: {
    action?: string;
    actorType?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.action) searchParams.set('action', params.action);
    if (params?.actorType) searchParams.set('actorType', params.actorType);
    if (params?.from) searchParams.set('from', params.from);
    if (params?.to) searchParams.set('to', params.to);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    return this.fetch<{
      items: Array<{
        id: string;
        timestamp: string;
        action: string;
        actorId: string;
        actorType: string;
        targetType: string;
        targetId?: string;
        details?: Record<string, unknown>;
        ipAddress?: string;
        userAgent?: string;
      }>;
      total: number;
      page: number;
      perPage: number;
    }>(`/audit/logs?${searchParams.toString()}`);
  }

  async getSecurityEvents(params?: { severity?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.severity) searchParams.set('severity', params.severity);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    return this.fetch<{
      items: Array<{
        id: string;
        timestamp: string;
        severity: 'info' | 'warning' | 'critical';
        event: string;
        source: string;
        details?: Record<string, unknown>;
        resolved: boolean;
      }>;
      total: number;
      page: number;
      perPage: number;
    }>(`/audit/security?${searchParams.toString()}`);
  }

  async getAuditTrail(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    return this.fetch<{
      events: Array<Record<string, unknown>>;
      total: number;
    }>(`/audit?${searchParams.toString()}`);
  }

  // Compatible avec les routes backend: /api/admin/config (LECTURE SEULE)
  // Note: updateConfig a été SUPPRIMÉ - la configuration est immuable

  async getConfig() {
    return this.fetch<{
      max_population: number;
      spawn_threshold: number;
      child_capital_share: number;
      mutation_rate: number;
      spawn_cooldown_secs: number;
    }>('/config');
  }

  // SUPPRIMÉ: updateConfig - La configuration est immuable après déploiement

  // Compatible avec les routes backend: /api/admin/database/stats (LECTURE SEULE)
  // Note: backup et optimize ont été SUPPRIMÉS - automatiques

  async getDatabaseStats() {
    return this.fetch<{
      connection_pool: {
        size: number;
        active: number;
        idle: number;
      };
      tables: Array<{
        name: string;
        rows: number;
        size_mb: number;
      }>;
      total_size_mb: number;
      last_backup: string;
      replication_lag_ms: number;
    }>('/database/stats');
  }

  // SUPPRIMÉ: databaseBackup - Les sauvegardes sont automatiques
  // SUPPRIMÉ: databaseOptimize - L'optimisation est automatique

  // Compatible avec les routes backend: /api/admin/logs

  async getSystemLogs(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    return this.fetch<{
      logs: Array<Record<string, unknown>>;
      total: number;
    }>(`/logs?${searchParams.toString()}`);
  }

  // Compatible avec les routes backend: /api/admin/naming/*

  async getNamingStats() {
    return this.fetch<{
      max_capacity: number;
      used: number;
      remaining: number;
      used_percent: number;
    }>('/naming/stats');
  }

  async getNamingExamples() {
    return this.fetch<{
      examples: string[];
    }>('/naming/examples');
  }

  // ====================================================================
  // 💰 Bot-to-Bot Autonomous Capital Allocation (LECTURE SEULE)
  // ====================================================================

  async getAllocations(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const query = searchParams.toString();
    return this.fetch<{
      allocations: Array<{
        id: string;
        investor_id: string;
        investor_name: string;
        trader_id: string;
        trader_name: string;
        capital: number;
        strategy: string;
        status: string;
        roi: number;
        started_at: string;
        expires_at: string;
      }>;
      total: number;
    }>(`/allocations${query ? `?${query}` : ''}`);
  }

  async getAllocationStats() {
    return this.fetch<{
      total_allocations: number;
      active_allocations: number;
      total_capital_allocated: number;
      avg_roi: number;
      total_profit: number;
    }>('/allocations/stats');
  }

  async getAllocation(id: string) {
    return this.fetch<{
      id: string;
      investor_id: string;
      investor_name: string;
      trader_id: string;
      trader_name: string;
      capital: number;
      strategy: string;
      status: string;
      roi: number;
      started_at: string;
      expires_at: string;
    }>(`/allocations/${id}`);
  }

  async getBotAllocations(botId: string) {
    return this.fetch<{
      as_investor: Array<{
        id: string;
        trader_name: string;
        capital: number;
        roi: number;
        status: string;
      }>;
      as_trader: Array<{
        id: string;
        investor_name: string;
        capital: number;
        roi: number;
        status: string;
      }>;
    }>(`/allocations/bot/${botId}`);
  }

  // ====================================================================
  // 🔒 Security / 📋 Compliance / 🏛️ Governance / 💹 Exchanges
  // ====================================================================

  async getSecurityStatus() {
    return this.fetch<{
      status: string;
      threats_blocked: number;
      active_sessions: number;
      last_scan: string;
    }>('/security/status');
  }

  async getExchangesList() {
    return this.fetch<{
      exchanges: Array<{
        name: string;
        status: string;
        pairs: number;
        volume_24h: number;
      }>;
    }>('/exchanges');
  }
}

export const adminApi = new AdminApiClient();
