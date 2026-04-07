// ============================================================================
// API SERVICE LAYER - Connects frontend to Express backend
// ============================================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('eakhuwat_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: getAuthHeaders(),
    ...options,
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || `API error: ${res.status}`);
  }
  return json.data;
}

// ── Auth ──
export const authApi = {
  login: (walletAddress: string, signature: string) =>
    apiRequest<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, signature }),
    }),
  getProfile: () => apiRequest<any>('/user/profile'),
};

// ── Plans ──
export const plansApi = {
  getAll: () => apiRequest<any[]>('/plans'),
  getById: (id: number) => apiRequest<any>(`/plans/${id}`),
  enroll: (planId: number) =>
    apiRequest<any>('/plans/enroll', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    }),
};

// ── User ──
export const userApi = {
  getProfile: () => apiRequest<any>('/user/profile'),
  getEnrollments: () => apiRequest<any[]>('/enrollments'),
  getTransactions: (page = 1, limit = 20) =>
    apiRequest<any[]>(`/user/transactions?page=${page}&limit=${limit}`),
  getReferralTree: () => apiRequest<any>('/user/referral-tree'),
  getStats: () => apiRequest<any>('/user/stats'),
};

// ── Withdrawals ──
export const withdrawalApi = {
  request: (amount: number) =>
    apiRequest<any>('/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),
  getHistory: () => apiRequest<any[]>('/withdraw/history'),
};

// ── Pools ──
export const poolApi = {
  getAll: () => apiRequest<any[]>('/pools'),
  getByPlan: (planId: number) => apiRequest<any[]>(`/pools/${planId}`),
};

// ── Gift Codes ──
export const giftCodeApi = {
  redeem: (code: string) =>
    apiRequest<any>('/gift-codes/redeem', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
};

// ── Admin ──
export const adminApi = {
  getUsers: (page = 1, limit = 50) =>
    apiRequest<any>(`/admin/users?page=${page}&limit=${limit}`),
  getUserById: (id: string) => apiRequest<any>(`/admin/users/${id}`),
  suspendUser: (id: string) =>
    apiRequest<any>(`/admin/users/${id}/suspend`, { method: 'POST' }),
  unsuspendUser: (id: string) =>
    apiRequest<any>(`/admin/users/${id}/unsuspend`, { method: 'POST' }),

  getGiftCodes: () => apiRequest<any[]>('/admin/gift-codes'),
  createGiftCode: (data: { amount: number; maxUses: number; expiresInDays: number }) =>
    apiRequest<any>('/admin/gift-codes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  revokeGiftCode: (id: string) =>
    apiRequest<any>(`/admin/gift-codes/${id}/revoke`, { method: 'POST' }),

  getWithdrawals: (status?: string) =>
    apiRequest<any[]>(`/admin/withdrawals${status ? `?status=${status}` : ''}`),
  approveWithdrawal: (id: string) =>
    apiRequest<any>(`/admin/withdrawals/${id}/approve`, { method: 'POST' }),
  rejectWithdrawal: (id: string, reason: string) =>
    apiRequest<any>(`/admin/withdrawals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  getPools: () => apiRequest<any[]>('/admin/pools'),
  getFlushouts: () => apiRequest<any[]>('/admin/flushouts'),
  getCommissions: () => apiRequest<any[]>('/admin/commissions'),
  getSecurityLogs: () => apiRequest<any[]>('/admin/security-logs'),
  getDashboardStats: () => apiRequest<any>('/admin/dashboard'),
};

// ── Health Check ──
export const healthCheck = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE.replace('/api', '')}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
};
