import { z } from 'zod';

// Admin user schema
export const adminUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3).max(50),
  email: z.string().email(),
  role: z.enum(['creator', 'super_admin']),
  totpEnabled: z.boolean(),
  hardwareKeyEnabled: z.boolean(),
  lastLogin: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  allowedIPs: z.array(z.string()).optional(),
});
export type AdminUser = z.infer<typeof adminUserSchema>;

// Triple auth state
export const authStateSchema = z.object({
  step: z.enum(['credentials', 'totp', 'hardware_key', 'complete']),
  sessionId: z.string().optional(),
  expiresAt: z.number().optional(),
  challengeId: z.string().optional(),
});
export type AuthState = z.infer<typeof authStateSchema>;

// Login credentials
export const loginCredentialsSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(12),
  deviceFingerprint: z.string(),
});
export type LoginCredentials = z.infer<typeof loginCredentialsSchema>;

// TOTP verification
export const totpVerificationSchema = z.object({
  code: z
    .string()
    .length(6)
    .regex(/^\d{6}$/),
  sessionId: z.string(),
});
export type TotpVerification = z.infer<typeof totpVerificationSchema>;

// Hardware key challenge
export const hardwareKeyChallengeSchema = z.object({
  challengeId: z.string(),
  response: z.string(),
  sessionId: z.string(),
});
export type HardwareKeyChallenge = z.infer<typeof hardwareKeyChallengeSchema>;

// System stats
export const systemStatsSchema = z.object({
  totalBots: z.number(),
  activeBots: z.number(),
  totalUsers: z.number(),
  activeRentals: z.number(),
  totalCapital: z.number(),
  totalProfit: z.number(),
  uptimeSeconds: z.number(),
  cpuUsage: z.number(),
  memoryUsage: z.number(),
});
export type SystemStats = z.infer<typeof systemStatsSchema>;

// Bot admin view
export const botAdminSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.enum(['active', 'idle', 'training', 'rented', 'retired', 'suspended']),
  generation: z.number(),
  capital: z.number(),
  profit: z.number(),
  performance: z.number(),
  trades: z.number(),
  winRate: z.number(),
  createdAt: z.string().datetime(),
  parentId: z.string().uuid().optional(),
});
export type BotAdmin = z.infer<typeof botAdminSchema>;

// User admin view
export const userAdminSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email().optional(),
  walletAddress: z.string().optional(),
  balance: z.number(),
  invested: z.number(),
  totalProfit: z.number(),
  vipLevel: z.number(),
  activeRentals: z.number(),
  createdAt: z.string().datetime(),
  lastActive: z.string().datetime().optional(),
  status: z.enum(['active', 'suspended', 'banned']),
});
export type UserAdmin = z.infer<typeof userAdminSchema>;

// Rental admin view
export const rentalAdminSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  botId: z.string().uuid(),
  botName: z.string(),
  userName: z.string(),
  amount: z.number(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: z.enum(['active', 'completed', 'cancelled', 'suspended']),
  profit: z.number(),
  userShare: z.number(),
  systemShare: z.number(),
});
export type RentalAdmin = z.infer<typeof rentalAdminSchema>;

// Audit log
export const auditLogSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  action: z.string(),
  actorId: z.string(),
  actorType: z.enum(['admin', 'system', 'bot', 'user']),
  targetType: z.string(),
  targetId: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});
export type AuditLog = z.infer<typeof auditLogSchema>;

// Financial summary
export const financialSummarySchema = z.object({
  totalCapital: z.number(),
  userCapital: z.number(),
  systemCapital: z.number(),
  motherSupremeCapital: z.number(),
  dailyProfit: z.number(),
  weeklyProfit: z.number(),
  monthlyProfit: z.number(),
  pendingWithdrawals: z.number(),
  pendingDeposits: z.number(),
});
export type FinancialSummary = z.infer<typeof financialSummarySchema>;
