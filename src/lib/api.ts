const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

type RequestOptions = {
  method?: string;
  token?: string | null;
  body?: unknown;
};

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
    throw new Error(message);
  }

  return json as T;
}

export const authApi = {
  devLogin: (walletAddress: string, name?: string) =>
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
    }>('/api/auth/dev-login', {
      method: 'POST',
      body: { walletAddress, name },
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
      };
    }>('/api/team/stats', { token }),

  getCommissions: (token: string) =>
    apiRequest<{
      success: boolean;
      totalEarned: number;
    }>('/api/team/commissions?limit=1', { token }),
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
