import type { TeamTreeApiNode } from '@/lib/teamTree';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

type RequestOptions = {
  method?: string;
  token?: string | null;
  body?: unknown;
};

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok || json?.success === false) {
    const message = json?.message || `Request failed (${response.status})`;
    throw new ApiError(message, response.status, json?.errors);
  }

  return json as T;
}

export const authApi = {
  getNonce: (walletAddress: string) =>
    apiRequest<{
      success: boolean;
      nonce: string;
      message: string;
    }>(`/api/auth/nonce?walletAddress=${encodeURIComponent(walletAddress)}`),

  verify: (walletAddress: string, signature: string, referralCode?: string) =>
    apiRequest<{
      success: boolean;
      token: string;
      user: {
        id: string;
        walletAddress: string;
        name?: string | null;
        referralCode?: string;
        status: string;
      };
    }>('/api/auth/verify', {
      method: 'POST',
      body: { walletAddress, signature, ...(referralCode ? { referralCode } : {}) },
    }),
};

export const usersApi = {
  getProfile: (token: string) =>
    apiRequest<{
      success: boolean;
      user: {
        id: string;
        walletAddress: string;
        name?: string | null;
        status: string;
        referralCode?: string;
        totalInvested?: number;
        _count?: { referrals?: number };
      };
    }>('/api/users/profile', { token }),

  getBalance: (token: string) =>
    apiRequest<{
      success: boolean;
      balance: {
        totalEarned: number;
        totalWithdrawn: number;
        availableBalance: number;
      };
    }>('/api/users/balance', { token }),

  getTransactions: (token: string, limit = 20) =>
    apiRequest<{
      success: boolean;
      transactions: Array<{
        id: string;
        type: string;
        amount: number;
        createdAt: string;
      }>;
    }>(`/api/users/transactions?limit=${limit}`, { token }),

  getReferralLink: (token: string) =>
    apiRequest<{
      success: boolean;
      referralCode: string;
      referralLink: string;
    }>('/api/users/referral-link', { token }),
};

export const teamApi = {
  getStats: (token: string) =>
    apiRequest<{
      success: boolean;
      stats: {
        totalMembers: number;
        level1Count?: number;
        level2Count?: number;
        activeEnrollments?: number;
        enrollmentsByPlan?: Array<{
          planId: number;
          count: number;
        }>;
      };
    }>('/api/team/stats', { token }),

  getTree: (token: string, depth = 3) =>
    apiRequest<{
      success: boolean;
      tree: TeamTreeApiNode[];
    }>(`/api/team/tree?depth=${depth}`, { token }),

  getCommissions: (token: string, limit = 20) =>
    apiRequest<{
      success: boolean;
      commissions: Array<{
        id: string;
        level: number;
        displayLevel?: number;
        percentage: number;
        amount: number;
        planId: number;
        createdAt: string;
        fromUser?: { walletAddress: string; name?: string | null } | null;
      }>;
      totalEarned: number;
      commissionSummary?: {
        totalEarned: number;
        levels: Array<{
          key: string;
          label: string;
          percentage: number | null;
          amount: number;
        }>;
      };
    }>(`/api/team/commissions?limit=${limit}`, { token }),
};

export const poolsApi = {
  getStats: () =>
    apiRequest<{
      success: boolean;
      stats: {
        plans: Array<{
          planId: number;
          planName: string;
          pools: {
            leaderPool?: number | null;
            rewardPool?: number | null;
            sponsorPool?: number | null;
          };
        }>;
        totals: {
          leaderPool?: number | null;
          rewardPool?: number | null;
          sponsorPool?: number | null;
        };
      };
    }>('/api/pools/stats'),
};

export const plansApi = {
  getMembers: () =>
    apiRequest<{
      success: boolean;
      members: {
        plans: Array<{
          planId: number;
          planName: string;
          enrollments?: number | null;
        }>;
        totalEnrollments?: number | null;
      };
    }>('/api/plans/members'),
};

export const communityApi = {
  getBootstrap: () =>
    apiRequest<{
      success: boolean;
      rooms: Array<{
        id: string;
        name: string;
        unread: number;
        isVip: boolean;
        description?: string;
        icon?: 'hash' | 'pin' | 'lock' | 'star';
        memberCount?: number;
        isPinned?: boolean;
      }>;
      messages: Array<{
        id: string;
        roomId: string;
        text: string;
        createdAt: string;
        userId: string;
        user?: { name?: string; walletAddress?: string };
        replyToId?: string;
        isPinned?: boolean;
      }>;
    }>('/api/community/bootstrap'),
};

export const adminApi = {
  getDashboard: (token: string) =>
    apiRequest<{
      success: boolean;
      dashboard: {
        users: number;
        enrollments: Record<string, number>;
        withdrawals: Record<string, number>;
        treasury?: {
          systemBalance?: number | null;
          totalRevenue?: number | null;
          totalWithdrawn?: number | null;
        } | null;
        pools: Record<string, number>;
        stats: {
          totalUsers: number;
          totalBalance: number;
          totalWithdrawals: number;
          totalFlushouts: number;
        };
        planPerformance: Array<{
          planId: number;
          planName: string;
          activeUsers: number;
          maturedUsers: number;
          flushedUsers: number;
          totalEnrollments: number;
          totalRevenue: number;
        }>;
        recentWithdrawals: Array<{
          id: string;
          userId: string;
          wallet: string;
          userName?: string | null;
          amount: number;
          status: string;
          requestedAt: string;
          processedAt?: string | null;
          txHash?: string | null;
        }>;
        recentFlushouts: Array<{
          id: string;
          userId: string;
          wallet: string;
          userName?: string | null;
          planId: number;
          planName: string;
          amount: number;
          flushedAt: string;
          type: 'Auto' | 'Manual';
        }>;
      };
    }>('/api/admin/dashboard', { token }),

  getPlanMetrics: (token: string) =>
    apiRequest<{
      success: boolean;
      planMetrics: Array<{
        planId: number;
        planName: string;
        activeUsers: number;
        maturedUsers: number;
        flushedUsers: number;
        totalEnrollments: number;
        totalRevenue: number;
        adoptionRate: number;
      }>;
      totals: {
        totalEnrollments: number;
      };
    }>('/api/admin/plan-metrics', { token }),

  getPoolMetrics: (token: string) =>
    apiRequest<{
      success: boolean;
      pools: Array<{
        id: string;
        planId: number;
        planName: string;
        type: 'SYSTEM' | 'LEADER' | 'REWARD' | 'SPONSOR';
        balance: number;
        totalReceived: number;
        totalDistributed: number;
      }>;
      totals: {
        systemPool: number;
        leaderPool: number;
        rewardPool: number;
        sponsorPool: number;
        allFund: number;
        systemFund: number;
      };
    }>('/api/admin/pool-metrics', { token }),

  // If amount is omitted, backend withdraws the full available balance for the selected scope.
  withdrawPoolFunds: (token: string, payload: { scope: 'REWARD' | 'ALL'; amount?: number }) =>
    apiRequest<{
      success: boolean;
      message: string;
      withdrawal: {
        scope: 'REWARD' | 'ALL';
        requestedAmount: number;
        withdrawnAmount: number;
        affectedPools: Array<{
          poolId: string;
          type: 'SYSTEM' | 'LEADER' | 'REWARD' | 'SPONSOR';
          withdrawnAmount: number;
          balanceAfter: number;
        }>;
      };
    }>('/api/admin/pools/withdraw', { method: 'POST', token, body: payload }),

  getWithdrawals: (token: string, params?: { page?: number; limit?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    const queryString = query.toString();
    return apiRequest<{
      success: boolean;
      withdrawals: Array<{
        id: string;
        userId: string;
        amount: number;
        status: string;
        requestedAt: string;
        processedAt?: string | null;
        txHash?: string | null;
        user: { walletAddress: string; name?: string | null };
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/api/admin/withdrawals${queryString ? `?${queryString}` : ''}`, { token });
  },

  getFlushouts: (token: string, params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const queryString = query.toString();
    return apiRequest<{
      success: boolean;
      flushouts: Array<{
        id: string;
        userId: string;
        wallet: string;
        userName?: string | null;
        planId: number;
        planName: string;
        amount: number;
        flushedAt: string;
        type: 'Auto' | 'Manual';
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/api/admin/flushouts${queryString ? `?${queryString}` : ''}`, { token });
  },

  manualFlushout: (token: string, enrollmentId: string) =>
    apiRequest<{
      success: boolean;
      message: string;
      result?: {
        status: 'success' | 'failed';
        memberProfit?: number;
        message?: string;
      };
    }>(`/api/admin/flushout/${encodeURIComponent(enrollmentId)}`, { method: 'POST', token }),

  getGiftCodes: (token: string, params?: { page?: number; limit?: number; status?: 'ACTIVE' | 'USED' | 'EXPIRED' | 'DISABLED'; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const queryString = query.toString();
    return apiRequest<{
      success: boolean;
      giftCodes: Array<{
        id: string;
        code: string;
        planId: number;
        planName: string;
        amount: number;
        status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'DISABLED';
        expiresAt: string | null;
        createdAt: string;
        updatedAt?: string;
        usedCount: number;
        maxUses: number;
        redeemedAt?: string | null;
        redeemedBy?: { id: string; walletAddress: string; name?: string | null } | null;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/api/admin/gift-codes${queryString ? `?${queryString}` : ''}`, { token });
  },

  createGiftCode: (token: string, payload: { planId: number; customAmount?: number; expiryDays?: number; quantity?: number; code?: string }) =>
    apiRequest<{
      success: boolean;
      giftCodes: Array<{
        id: string;
        code: string;
        planId: number;
        planName: string;
        amount: number;
        status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'DISABLED';
        expiresAt: string | null;
        createdAt: string;
        usedCount: number;
        maxUses: number;
      }>;
    }>('/api/admin/gift-codes', {
      method: 'POST',
      token,
      body: payload,
    }),

  updateGiftCodeStatus: (token: string, giftCodeId: string, status: 'ACTIVE' | 'DISABLED') =>
    apiRequest<{
      success: boolean;
      message: string;
      giftCode: {
        id: string;
        code: string;
        planId: number;
        planName: string;
        amount: number;
        status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'DISABLED';
        expiresAt: string | null;
        createdAt: string;
        usedCount: number;
        maxUses: number;
      };
    }>(`/api/admin/gift-codes/${giftCodeId}/status`, {
      method: 'PATCH',
      token,
      body: { status },
    }),

  getAuditLogs: (token: string, params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const queryString = query.toString();
    return apiRequest<{
      success: boolean;
      logs: Array<{
        id: string;
        action: string;
        description: string;
        createdAt: string;
        admin?: { walletAddress: string; name?: string | null } | null;
        user?: { walletAddress: string; name?: string | null } | null;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/api/admin/audit-logs${queryString ? `?${queryString}` : ''}`, { token });
  },
};
