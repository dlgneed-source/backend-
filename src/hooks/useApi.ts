// ============================================================================
// React Query hooks for API data fetching with fallback to dummy data
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plansApi, userApi, poolApi, adminApi, withdrawalApi, giftCodeApi, healthCheck } from '@/lib/api';
import { toast } from 'sonner';

// ── Check if backend is available ──
export function useBackendStatus() {
  return useQuery({
    queryKey: ['backend-status'],
    queryFn: healthCheck,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: false,
  });
}

// ── Plans ──
export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: plansApi.getAll,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

// ── User Profile ──
export function useUserProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: userApi.getProfile,
    staleTime: 30_000,
    retry: 1,
    enabled: !!localStorage.getItem('eakhuwat_token'),
  });
}

// ── User Transactions ──
export function useTransactions(page = 1) {
  return useQuery({
    queryKey: ['transactions', page],
    queryFn: () => userApi.getTransactions(page),
    staleTime: 15_000,
    retry: 1,
    enabled: !!localStorage.getItem('eakhuwat_token'),
  });
}

// ── Referral Tree ──
export function useReferralTree() {
  return useQuery({
    queryKey: ['referral-tree'],
    queryFn: userApi.getReferralTree,
    staleTime: 60_000,
    retry: 1,
    enabled: !!localStorage.getItem('eakhuwat_token'),
  });
}

// ── Pools ──
export function usePools() {
  return useQuery({
    queryKey: ['pools'],
    queryFn: poolApi.getAll,
    staleTime: 30_000,
    retry: 1,
  });
}

// ── Enroll in Plan ──
export function useEnrollInPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: number) => plansApi.enroll(planId),
    onSuccess: () => {
      toast.success('Successfully enrolled in plan!');
      qc.invalidateQueries({ queryKey: ['user-profile'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Withdraw ──
export function useWithdraw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (amount: number) => withdrawalApi.request(amount),
    onSuccess: () => {
      toast.success('Withdrawal request submitted!');
      qc.invalidateQueries({ queryKey: ['user-profile'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Redeem Gift Code ──
export function useRedeemGiftCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => giftCodeApi.redeem(code),
    onSuccess: () => {
      toast.success('Gift code redeemed successfully!');
      qc.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Admin: Gift Codes ──
export function useAdminGiftCodes() {
  return useQuery({
    queryKey: ['admin-gift-codes'],
    queryFn: adminApi.getGiftCodes,
    staleTime: 15_000,
    retry: 1,
  });
}

export function useCreateGiftCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { amount: number; maxUses: number; expiresInDays: number }) =>
      adminApi.createGiftCode(data),
    onSuccess: () => {
      toast.success('Gift code created!');
      qc.invalidateQueries({ queryKey: ['admin-gift-codes'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRevokeGiftCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.revokeGiftCode(id),
    onSuccess: () => {
      toast.success('Gift code revoked!');
      qc.invalidateQueries({ queryKey: ['admin-gift-codes'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Admin: Dashboard Stats ──
export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminApi.getDashboardStats,
    staleTime: 15_000,
    retry: 1,
  });
}

// ── Admin: Users ──
export function useAdminUsers(page = 1) {
  return useQuery({
    queryKey: ['admin-users', page],
    queryFn: () => adminApi.getUsers(page),
    staleTime: 15_000,
    retry: 1,
  });
}

// ── Admin: Withdrawals ──
export function useAdminWithdrawals(status?: string) {
  return useQuery({
    queryKey: ['admin-withdrawals', status],
    queryFn: () => adminApi.getWithdrawals(status),
    staleTime: 15_000,
    retry: 1,
  });
}

// ── Admin: Pools ──
export function useAdminPools() {
  return useQuery({
    queryKey: ['admin-pools'],
    queryFn: adminApi.getPools,
    staleTime: 30_000,
    retry: 1,
  });
}

// ── Admin: Flushouts ──
export function useAdminFlushouts() {
  return useQuery({
    queryKey: ['admin-flushouts'],
    queryFn: adminApi.getFlushouts,
    staleTime: 15_000,
    retry: 1,
  });
}

// ── Admin: Commissions ──
export function useAdminCommissions() {
  return useQuery({
    queryKey: ['admin-commissions'],
    queryFn: adminApi.getCommissions,
    staleTime: 15_000,
    retry: 1,
  });
}

// ── Admin: Security Logs ──
export function useAdminSecurityLogs() {
  return useQuery({
    queryKey: ['admin-security-logs'],
    queryFn: adminApi.getSecurityLogs,
    staleTime: 15_000,
    retry: 1,
  });
}
