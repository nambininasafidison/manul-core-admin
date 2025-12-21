/**
 * Admin API Client
 * 
 * Client pour communiquer avec le backend Rust Manul Core
 */

const API_BASE = '/api/admin';

interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	timestamp: string;
}

class AdminApiClient {
	private adminSecret: string = '';
	private sessionId: string = '';

	setCredentials(sessionId: string, adminSecret: string) {
		this.sessionId = sessionId;
		this.adminSecret = adminSecret;
	}

	private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
		const headers: HeadersInit = {
			'Content-Type': 'application/json',
			...(this.sessionId && { 'X-Session-Id': this.sessionId }),
			...(this.adminSecret && { 'X-Admin-Secret': this.adminSecret }),
			...options.headers
		};

		const response = await fetch(`${API_BASE}${endpoint}`, {
			...options,
			headers
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: 'Request failed' }));
			throw new Error(error.error || `HTTP ${response.status}`);
		}

		const result: ApiResponse<T> = await response.json();
		if (!result.success) {
			throw new Error(result.error || 'Unknown error');
		}

		return result.data as T;
	}

	// ==================== AUTH ====================
	
	async login(username: string, password: string, deviceFingerprint: string) {
		return this.fetch<{ sessionId: string; requiresTotp: boolean; requiresHardwareKey: boolean }>(
			'/auth/login',
			{
				method: 'POST',
				body: JSON.stringify({ username, password, deviceFingerprint })
			}
		);
	}

	async verifyTotp(sessionId: string, code: string) {
		return this.fetch<{ verified: boolean; challengeId?: string }>(
			'/auth/totp/verify',
			{
				method: 'POST',
				body: JSON.stringify({ sessionId, code })
			}
		);
	}

	async verifyHardwareKey(sessionId: string, challengeId: string, response: string) {
		return this.fetch<{ verified: boolean; token: string; expiresAt: number }>(
			'/auth/hardware-key/verify',
			{
				method: 'POST',
				body: JSON.stringify({ sessionId, challengeId, response })
			}
		);
	}

	async logout() {
		return this.fetch<void>('/auth/logout', { method: 'POST' });
	}

	// ==================== SYSTEM ====================
	
	async getSystemStats() {
		return this.fetch<{
			totalBots: number;
			activeBots: number;
			totalUsers: number;
			activeRentals: number;
			totalCapital: number;
			totalProfit: number;
			uptimeSeconds: number;
			cpuUsage: number;
			memoryUsage: number;
		}>('/system/stats');
	}

	async getMotherSupremeStatus() {
		return this.fetch<{
			capital: number;
			childrenCount: number;
			generationMax: number;
			compoundRate: number;
			lastActivity: string;
		}>('/system/mother-supreme');
	}

	async getSystemHealth() {
		return this.fetch<{
			status: 'healthy' | 'degraded' | 'critical';
			services: Array<{ name: string; status: string; latency: number }>;
			lastCheck: string;
		}>('/system/health');
	}

	// ==================== BOTS ====================
	
	async getBots(params?: { status?: string; generation?: number; page?: number; limit?: number }) {
		const searchParams = new URLSearchParams();
		if (params?.status) searchParams.set('status', params.status);
		if (params?.generation) searchParams.set('generation', params.generation.toString());
		if (params?.page) searchParams.set('page', params.page.toString());
		if (params?.limit) searchParams.set('limit', params.limit.toString());

		return this.fetch<{
			items: Array<{
				id: string;
				name: string;
				status: string;
				generation: number;
				capital: number;
				profit: number;
				performance: number;
				trades: number;
				winRate: number;
				createdAt: string;
				parentId?: string;
			}>;
			total: number;
			page: number;
			perPage: number;
		}>(`/bots?${searchParams.toString()}`);
	}

	async getBot(id: string) {
		return this.fetch<{
			id: string;
			name: string;
			status: string;
			generation: number;
			capital: number;
			savings: number;
			profit: number;
			performance: number;
			cycleCount: number;
			trades: number;
			winRate: number;
			createdAt: string;
			parentId?: string;
			children: string[];
			personality: {
				riskTolerance: number;
				creativity: number;
				patience: number;
				aggression: number;
			};
			stats: {
				intelligence: number;
				speed: number;
				endurance: number;
				luck: number;
			};
		}>(`/bots/${id}`);
	}

	async updateBotStatus(id: string, status: 'active' | 'idle' | 'suspended') {
		return this.fetch<void>(`/bots/${id}/status`, {
			method: 'PUT',
			body: JSON.stringify({ status })
		});
	}

	async forceBotSpawn(parentId: string) {
		return this.fetch<{ childId: string; childName: string }>(
			`/bots/${parentId}/spawn`,
			{ method: 'POST' }
		);
	}

	// ==================== USERS ====================
	
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

	async updateUserStatus(id: string, status: 'active' | 'suspended' | 'banned', reason?: string) {
		return this.fetch<void>(`/users/${id}/status`, {
			method: 'PUT',
			body: JSON.stringify({ status, reason })
		});
	}

	// ==================== RENTALS ====================
	
	async getRentals(params?: { status?: string; userId?: string; botId?: string; page?: number; limit?: number }) {
		const searchParams = new URLSearchParams();
		if (params?.status) searchParams.set('status', params.status);
		if (params?.userId) searchParams.set('userId', params.userId);
		if (params?.botId) searchParams.set('botId', params.botId);
		if (params?.page) searchParams.set('page', params.page.toString());
		if (params?.limit) searchParams.set('limit', params.limit.toString());

		return this.fetch<{
			items: Array<{
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
			total: number;
			page: number;
			perPage: number;
		}>(`/rentals?${searchParams.toString()}`);
	}

	async cancelRental(id: string, reason: string) {
		return this.fetch<void>(`/rentals/${id}/cancel`, {
			method: 'POST',
			body: JSON.stringify({ reason })
		});
	}

	// ==================== FINANCE ====================
	
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

	// ==================== AUDIT ====================
	
	async getAuditLogs(params?: { action?: string; actorType?: string; from?: string; to?: string; page?: number; limit?: number }) {
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

	// ==================== CONFIG ====================
	
	async getConfig() {
		return this.fetch<{
			tradingEnabled: boolean;
			rentalEnabled: boolean;
			withdrawalEnabled: boolean;
			maintenanceMode: boolean;
			profitSharing: {
				userShare: number;
				enterpriseShare: number;
				botShare: number;
			};
			binanceConfig: {
				connected: boolean;
				tradingPairs: string[];
			};
		}>('/config');
	}

	async updateConfig(config: Partial<{
		tradingEnabled: boolean;
		rentalEnabled: boolean;
		withdrawalEnabled: boolean;
		maintenanceMode: boolean;
	}>) {
		return this.fetch<void>('/config', {
			method: 'PUT',
			body: JSON.stringify(config)
		});
	}
}

export const adminApi = new AdminApiClient();
