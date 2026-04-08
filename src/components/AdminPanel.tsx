import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError, adminApi, systemApi, teamApi } from '@/lib/api';
import { getDirectReferralIncome, toSafeNonNegativeNumber } from '@/lib/referral';
import { buildCsv, downloadCsv } from '@/utils/exportCsv';
import {
  AlertOctagon, Ban, Briefcase, ChevronRight, Copy, Gift, RefreshCw,
  Search, Shield, TrendingUp, Wallet, Zap, Users, LayoutDashboard,
  Layers, Award, Crown, Gem, Network, ArrowUpRight, ArrowDownLeft, X,
  Check, Clock, AlertCircle, Info, Filter, Download, MoreHorizontal,
  Settings as SettingsIcon, LogOut, Bell, MessageSquare, FileText, BarChart3, PieChart,
  Activity, Target, Percent, Calendar, Lock, Unlock, Eye, EyeOff,
  Trash2, Edit, Plus, Minus, ChevronDown, ChevronUp,
  Hash, UserPlus, UserCheck, UserX, Repeat, Flame, Star, Trophy,
  Medal, Sparkles, Timer, CreditCard, History, Globe, Server,
  Database, ShieldCheck, Verified, BadgeCheck, CircleDollarSign,
  TrendingDown, ArrowLeft, ArrowRight, Home, Menu, XCircle, CheckCircle,
  AlertTriangle, HelpCircle, BookOpen, Code2, Cpu, Brain, Terminal,
  Monitor, Smartphone, Tablet, Laptop, MousePointer, Keyboard, ChevronLeft
} from 'lucide-react';

const ADMIN_AUTH_TOKEN_KEY = 'ea_admin_token';

// =============================================
// TYPES & INTERFACES
// =============================================

type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Resolved' | 'Processing';
type UserStatus = 'Active' | 'Suspended' | 'Blocked' | 'Pending';
type PlanStatus = 'Active' | 'Matured' | 'Flushed' | 'Pending';

interface Plan {
  id: number;
  name: string;
  joiningFee: number;
  teamSize: number;
  uplineCommission: number;
  systemFee: number;
  levelCommission: number;
  slotFee: number;
  totalCollection: number;
  memberProfit: number;
  leaderPool: number;
  rewardPool: number;
  sponsorPool: number;
  roi: number;
  flushoutDays: number;
  theme: {
    primary: string;
    secondary: string;
    glow: string;
    bgGlow: string;
    text: string;
  };
}

interface User {
  id: string;
  wallet: string;
  name: string;
  email: string;
  status: UserStatus;
  joinedAt: string;
  totalInvested: number;
  totalEarned: number;
  balance: number;
  activePlans: number[];
  referralCount: number;
  teamSize: number;
  kimiLevel: number;
  lastActive: string;
}

interface Pool {
  id: string;
  displayName: string;
  planId: number;
  balance: number;
  totalDistributed: number;
  type: 'System' | 'Leader' | 'Reward' | 'Sponsor';
  theme: {
    primary: string;
    bg: string;
    border: string;
  };
}

interface FlushoutRecord {
  id: string;
  userId: string;
  wallet: string;
  planId: number;
  planName: string;
  amount: number;
  flushedAt: string;
  type: 'Auto' | 'Manual';
}

interface KIMILevel {
  level: number;
  name: string;
  usersCount: number;
  totalEarnings: number;
}

const formatUsd = (value: number | null | undefined): string =>
  `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const mapEconomicsPlanToAdminPlan = (
  plan: Awaited<ReturnType<typeof systemApi.getPlanEconomics>>['economics']['plans'][number],
): Plan => ({
  id: plan.planId,
  name: plan.name,
  joiningFee: plan.fees.joiningFee,
  teamSize: plan.fees.teamSize,
  uplineCommission: plan.distributions.directUpline,
  systemFee: plan.distributions.systemFee,
  levelCommission: plan.distributions.levelCommission,
  slotFee: plan.fees.slotFee,
  totalCollection: plan.fees.totalCollection,
  memberProfit: plan.distributions.memberProfit,
  leaderPool: plan.distributions.pools.leader,
  rewardPool: plan.distributions.pools.reward,
  sponsorPool: plan.distributions.pools.sponsor,
  roi: plan.fees.joiningFee > 0 ? Number(((plan.distributions.memberProfit / plan.fees.joiningFee) * 100).toFixed(2)) : 0,
  flushoutDays: plan.flushout.days,
  theme: PLAN_THEMES[plan.planId] || PLAN_THEMES[1],
});

const PLAN_THEMES: Record<number, Plan['theme']> = {
  1: { primary: '#fbbf24', secondary: '#f59e0b', glow: 'rgba(251, 191, 36, 0.5)', bgGlow: 'rgba(251, 191, 36, 0.15)', text: '#fef3c7' },
  2: { primary: '#22d3ee', secondary: '#0ea5e9', glow: 'rgba(34, 211, 238, 0.5)', bgGlow: 'rgba(34, 211, 238, 0.15)', text: '#cffafe' },
  3: { primary: '#34d399', secondary: '#10b981', glow: 'rgba(52, 211, 153, 0.5)', bgGlow: 'rgba(52, 211, 153, 0.15)', text: '#d1fae5' },
  4: { primary: '#e879f9', secondary: '#a855f7', glow: 'rgba(232, 121, 249, 0.5)', bgGlow: 'rgba(232, 121, 249, 0.15)', text: '#fae8ff' },
  5: { primary: '#f472b6', secondary: '#ec4899', glow: 'rgba(244, 114, 182, 0.5)', bgGlow: 'rgba(244, 114, 182, 0.15)', text: '#fce7f3' },
  6: { primary: '#e11d48', secondary: '#be123c', glow: 'rgba(225, 29, 72, 0.5)', bgGlow: 'rgba(225, 29, 72, 0.15)', text: '#fb7185' },
};

// =============================================
// USERS DATA
// =============================================

const usersData: User[] = [];

// =============================================
// POOLS DATA
// =============================================

// =============================================
// COMMISSION RECORDS DATA
// =============================================

// =============================================
// KIMI LEVELS DATA
// =============================================

const kimiLevels: KIMILevel[] = [
  { level: 1, name: 'KIMI Initiate', usersCount: 1245, totalEarnings: 45600 },
  { level: 2, name: 'KIMI Apprentice', usersCount: 892, totalEarnings: 67800 },
  { level: 3, name: 'KIMI Specialist', usersCount: 567, totalEarnings: 89200 },
  { level: 4, name: 'KIMI Expert', usersCount: 345, totalEarnings: 124000 },
  { level: 5, name: 'KIMI Master', usersCount: 189, totalEarnings: 156000 },
  { level: 6, name: 'KIMI Grandmaster', usersCount: 98, totalEarnings: 189000 },
  { level: 7, name: 'KIMI Legend', usersCount: 45, totalEarnings: 234000 },
];

// =============================================
// UTILITY FUNCTIONS
// =============================================

const statusStyle = (s: RequestStatus | UserStatus | PlanStatus) => {
  switch (s) {
    case 'Pending':
      return 'text-amber-200 bg-amber-500/10 border-amber-400/20';
    case 'Resolved':
    case 'Approved':
    case 'Active':
      return 'text-emerald-200 bg-emerald-500/10 border-emerald-400/20';
    case 'Processing':
      return 'text-sky-200 bg-sky-500/10 border-sky-400/20';
    case 'Rejected':
    case 'Suspended':
    case 'Blocked':
      return 'text-rose-200 bg-rose-500/10 border-rose-400/20';
    case 'Matured':
      return 'text-violet-200 bg-violet-500/10 border-violet-400/20';
    case 'Flushed':
      return 'text-cyan-200 bg-cyan-500/10 border-cyan-400/20';
    default:
      return 'text-slate-300 bg-white/5 border-white/10';
  }
};

const severityStyle = (s: 'Info' | 'Warning' | 'Critical') => {
  switch (s) {
    case 'Info':
      return 'text-sky-200 bg-sky-500/10 border-sky-400/20';
    case 'Warning':
      return 'text-amber-200 bg-amber-500/10 border-amber-400/20';
    case 'Critical':
      return 'text-rose-200 bg-rose-500/10 border-rose-400/20';
    default:
      return 'text-slate-300 bg-white/5 border-white/10';
  }
};

// =============================================
// STAT CARD COMPONENT
// =============================================
function StatCard({ icon: Icon, label, value, subtext, tone, trend }: { 
  icon: React.ElementType; 
  label: string; 
  value: string; 
  subtext?: string;
  tone: string;
  trend?: { value: string; positive: boolean };
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-sm backdrop-blur-xl"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 ${tone}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{label}</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-white">{value}</p>
            {subtext && <p className="text-xs text-slate-500">{subtext}</p>}
          </div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${trend.positive ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
            {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend.value}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// =============================================
// SIDEBAR COMPONENT
// =============================================
function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed, mobileOpen, onMobileClose }: { 
  activeTab: string; 
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'plans', label: 'Plans', icon: Layers },
    { id: 'pools', label: 'Pools', icon: Database },
    { id: 'flushouts', label: 'Flushouts', icon: Flame },
    { id: 'commissions', label: 'Commissions', icon: Percent },
    { id: 'gift-codes', label: 'Gift Codes', icon: Gift },
    { id: 'rewards', label: 'Rewards', icon: Award },
    { id: 'daily-income', label: 'Daily Income', icon: Calendar },
    { id: 'security', label: 'Security Logs', icon: Shield },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div 
        className={`
          fixed left-0 top-0 z-50 h-screen border-r border-white/10 bg-[#0a0a0f]/95 backdrop-blur-xl transition-all duration-300
          lg:translate-x-0
          ${collapsed ? 'lg:w-20' : 'lg:w-64'} w-64
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
              <Crown className="h-5 w-5 text-white" />
            </div>
            {(!collapsed || mobileOpen) && <span className="text-lg font-bold text-white lg:block">Admin Panel</span>}
          </div>
          <button aria-label={collapsed ? 'Expand admin sidebar' : 'Collapse admin sidebar'} onClick={() => { onMobileClose(); setCollapsed(!collapsed); }} className="text-slate-400 hover:text-white hidden lg:block">
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
          {mobileOpen && (
            <button aria-label="Close admin menu" onClick={onMobileClose} className="text-slate-400 hover:text-white lg:hidden">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="space-y-1 p-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 130px)' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); onMobileClose(); }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {(!collapsed || mobileOpen) && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-3">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all">
            <LogOut className="h-5 w-5 shrink-0" />
            {(!collapsed || mobileOpen) && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
}

// =============================================
// DASHBOARD OVERVIEW COMPONENT
// =============================================
function DashboardOverview({ token, onPermissionDenied }: { token: string | null; onPermissionDenied?: () => void }) {
  const EXPORT_PAGE_SIZE = 500;
  const [isLoading, setIsLoading] = useState(false);
  const [isExportingWithdrawals, setIsExportingWithdrawals] = useState(false);
  const [isExportingFlushouts, setIsExportingFlushouts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<{
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
  } | null>(null);

  const formatMoney = formatUsd;

  const normalizeStatus = (status: string): RequestStatus => {
    const normalized = status.toUpperCase();
    if (normalized === 'PENDING') return 'Pending';
    if (normalized === 'PROCESSING') return 'Processing';
    if (normalized === 'APPROVED' || normalized === 'COMPLETED') return 'Approved';
    if (normalized === 'REJECTED') return 'Rejected';
    return 'Pending';
  };

  const loadDashboard = useCallback(async () => {
    if (!token) {
      setDashboard(null);
      setError('Permission denied. Admin login required.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await adminApi.getDashboard(token);
      setDashboard({
        stats: response.dashboard.stats,
        planPerformance: response.dashboard.planPerformance,
        recentWithdrawals: response.dashboard.recentWithdrawals,
        recentFlushouts: response.dashboard.recentFlushouts,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        onPermissionDenied?.();
      }
      setDashboard(null);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [onPermissionDenied, token]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleExportWithdrawals = async () => {
    if (!token) {
      setError('Permission denied. Admin login required.');
      return;
    }

    setIsExportingWithdrawals(true);
    setError(null);
    try {
      const firstPage = await adminApi.getWithdrawals(token, { page: 1, limit: EXPORT_PAGE_SIZE });
      const allRows = [...firstPage.withdrawals];

      for (let page = 2; page <= firstPage.pagination.pages; page += 1) {
        const nextPage = await adminApi.getWithdrawals(token, { page, limit: EXPORT_PAGE_SIZE });
        allRows.push(...nextPage.withdrawals);
      }

      const csv = buildCsv(
        allRows.map((item) => ({
          id: item.id,
          wallet: item.user.walletAddress,
          userName: item.user.name ?? '',
          amount: item.amount,
          status: item.status,
          requestedAt: item.requestedAt,
          processedAt: item.processedAt ?? '',
          txHash: item.txHash ?? '',
        })),
      );
      downloadCsv(`admin-withdrawals-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export withdrawals');
    } finally {
      setIsExportingWithdrawals(false);
    }
  };

  const handleExportFlushouts = async () => {
    if (!token) {
      setError('Permission denied. Admin login required.');
      return;
    }

    setIsExportingFlushouts(true);
    setError(null);
    try {
      const firstPage = await adminApi.getFlushouts(token, { page: 1, limit: EXPORT_PAGE_SIZE });
      const allRows = [...firstPage.flushouts];

      for (let page = 2; page <= firstPage.pagination.pages; page += 1) {
        const nextPage = await adminApi.getFlushouts(token, { page, limit: EXPORT_PAGE_SIZE });
        allRows.push(...nextPage.flushouts);
      }

      const csv = buildCsv(
        allRows.map((item) => ({
          id: item.id,
          wallet: item.wallet,
          userName: item.userName ?? '',
          planId: item.planId,
          planName: item.planName,
          amount: item.amount,
          type: item.type,
          flushedAt: item.flushedAt,
        })),
      );
      downloadCsv(`admin-flushouts-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export flushouts');
    } finally {
      setIsExportingFlushouts(false);
    }
  };

  const stats = dashboard ? [
    { icon: Users, label: 'Total Users', value: dashboard.stats.totalUsers.toLocaleString(), subtext: 'Registered users', tone: 'bg-indigo-500/15' },
    { icon: Wallet, label: 'Total Balance', value: formatMoney(dashboard.stats.totalBalance), subtext: 'Across all pools', tone: 'bg-emerald-500/15' },
    { icon: ArrowUpRight, label: 'Total Withdrawals', value: formatMoney(dashboard.stats.totalWithdrawals), subtext: 'Approved + completed', tone: 'bg-sky-500/15' },
    { icon: Flame, label: 'Total Flushouts', value: dashboard.stats.totalFlushouts.toLocaleString(), subtext: 'Total flushed enrollments', tone: 'bg-amber-500/15' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-sm text-slate-400">Live admin metrics from system data.</p>
        </div>
        <button
          onClick={() => void loadDashboard()}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-300 hover:bg-white/10 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs text-rose-200">
          <p>{error}</p>
          <button
            onClick={() => void loadDashboard()}
            className="mt-2 inline-flex items-center gap-1 rounded-lg border border-rose-400/30 px-2 py-1 text-[11px] font-semibold text-rose-100 hover:bg-rose-500/10"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      {isLoading && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">Loading dashboard...</div>
      )}

      {!isLoading && dashboard && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Plans Performance</h3>
                <p className="text-sm text-slate-400">Plan-wise active, matured and revenue stats</p>
              </div>
            </div>
            <div className="space-y-4">
              {dashboard.planPerformance.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">No plan performance data found.</div>
              ) : dashboard.planPerformance.map((plan, index) => {
                const denominator = Math.max(plan.totalEnrollments, 1);
                const activeRatio = (plan.activeUsers / denominator) * 100;
                return (
                  <div key={plan.planId} className="flex items-center gap-2 sm:gap-4">
                    <div className="w-24 sm:w-36 text-xs sm:text-sm font-medium text-slate-300 truncate">{plan.planName}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${activeRatio}%` }}
                            transition={{ duration: 0.6, delay: index * 0.05 }}
                            className="h-full rounded-full bg-cyan-400"
                          />
                        </div>
                        <span className="w-14 sm:w-24 text-right text-[10px] sm:text-xs text-slate-400">
                          A:{plan.activeUsers} M:{plan.maturedUsers}
                        </span>
                      </div>
                    </div>
                    <div className="w-20 sm:w-28 text-right text-xs sm:text-sm font-medium text-emerald-400">
                      {formatMoney(plan.totalRevenue)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Recent Withdrawals</h3>
                <button
                  onClick={() => void handleExportWithdrawals()}
                  disabled={isExportingWithdrawals}
                  className="text-sm text-cyan-400 hover:text-cyan-300 disabled:opacity-60"
                >
                  {isExportingWithdrawals ? 'Exporting...' : 'Export All'}
                </button>
              </div>
              <div className="space-y-3">
                {dashboard.recentWithdrawals.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">No recent withdrawals.</div>
                ) : dashboard.recentWithdrawals.map((req) => {
                  const displayStatus = normalizeStatus(req.status);
                  return (
                    <div key={req.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-2.5 sm:p-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${statusStyle(displayStatus).split(' ')[1]}`}>
                          <Wallet className={`h-4 w-4 ${statusStyle(displayStatus).split(' ')[0]}`} />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-slate-200 truncate max-w-[120px] sm:max-w-none">{req.wallet}</p>
                          <p className="text-[10px] text-slate-500 hidden sm:block">{new Date(req.requestedAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{formatMoney(req.amount)}</p>
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusStyle(displayStatus)}`}>
                          {displayStatus}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Recent Flushouts</h3>
                <button
                  onClick={() => void handleExportFlushouts()}
                  disabled={isExportingFlushouts}
                  className="text-sm text-cyan-400 hover:text-cyan-300 disabled:opacity-60"
                >
                  {isExportingFlushouts ? 'Exporting...' : 'Export All'}
                </button>
              </div>
              <div className="space-y-3">
                {dashboard.recentFlushouts.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">No recent flushouts.</div>
                ) : dashboard.recentFlushouts.map((record) => (
                  <div key={record.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-2.5 sm:p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                        <Flame className="h-4 w-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-slate-200 truncate max-w-[120px] sm:max-w-none">{record.wallet}</p>
                        <p className="text-[10px] text-slate-500">{record.planName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-400">+{formatMoney(record.amount)}</p>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${record.type === 'Auto' ? 'text-sky-200 bg-sky-500/10 border-sky-400/20' : 'text-violet-200 bg-violet-500/10 border-violet-400/20'}`}>
                        {record.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {!isLoading && !error && !dashboard && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">No dashboard data available.</div>
      )}
    </div>
  );
}

// =============================================
// USERS MANAGEMENT COMPONENT
// =============================================
function UsersManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'All'>('All');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filteredUsers = usersData.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         user.wallet.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Users Management</h1>
          <p className="text-sm text-slate-400">Manage user accounts, plans, and permissions</p>
        </div>
        <button className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white w-full sm:w-auto">
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
        <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, wallet, or email..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-500/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'All')}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500/30"
        >
          <option value="All" className="bg-[#0a0a0f]">All Status</option>
          <option value="Active" className="bg-[#0a0a0f]">Active</option>
          <option value="Suspended" className="bg-[#0a0a0f]">Suspended</option>
          <option value="Blocked" className="bg-[#0a0a0f]">Blocked</option>
        </select>
        <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/10">
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] min-w-[700px]">
        <table className="w-full">
          <thead className="bg-white/[0.03]">
            <tr className="border-b border-white/10">
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">User</th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Wallet</th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Status</th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Plans</th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Team</th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Balance</th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                      <span className="text-sm font-bold text-cyan-300">{user.name[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-sm text-slate-300">{user.wallet}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${statusStyle(user.status)}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    {user.activePlans.map(planId => (
                      <span key={planId} className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] font-medium text-cyan-300">
                        {planId}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-300">{user.teamSize}</td>
                <td className="px-6 py-4 text-sm font-medium text-emerald-400">${user.balance}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedUser(user)}
                      className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-white">
                      <Edit className="h-4 w-4" />
                    </button>
                    {user.status === 'Active' ? (
                      <button className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20">
                        <Ban className="h-4 w-4" />
                      </button>
                    ) : (
                      <button className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-400 hover:bg-emerald-500/20">
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0f] p-6"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">User Details</h3>
                <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                  <p className="text-xs text-slate-500">Name</p>
                  <p className="text-sm font-medium text-white">{selectedUser.name}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm font-medium text-white">{selectedUser.email}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                  <p className="text-xs text-slate-500">Wallet</p>
                  <p className="text-sm font-medium text-white">{selectedUser.wallet}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                  <p className="text-xs text-slate-500">KIMI Level</p>
                  <p className="text-sm font-medium text-white">Level {selectedUser.kimiLevel}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                  <p className="text-xs text-slate-500">Total Invested</p>
                  <p className="text-sm font-medium text-emerald-400">${selectedUser.totalInvested}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                  <p className="text-xs text-slate-500">Total Earned</p>
                  <p className="text-sm font-medium text-emerald-400">${selectedUser.totalEarned}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================
// PLANS MANAGEMENT COMPONENT
// =============================================
function PlansManagement({ token, plans }: { token: string | null; plans: Plan[] }) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planMetrics, setPlanMetrics] = useState<Array<{
    planId: number;
    planName: string;
    activeUsers: number;
    maturedUsers: number;
    flushedUsers: number;
    totalEnrollments: number;
    totalRevenue: number;
    adoptionRate: number;
  }>>([]);

  const loadPlanMetrics = useCallback(async () => {
    if (!token) {
      setPlanMetrics([]);
      setError('Permission denied. Admin login required.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await adminApi.getPlanMetrics(token);
      setPlanMetrics(response.planMetrics);
    } catch (err) {
      setPlanMetrics([]);
      setError(err instanceof Error ? err.message : 'Failed to load plan metrics');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadPlanMetrics();
  }, [loadPlanMetrics]);

  const planMetricsMap = useMemo(() => (
    new Map(planMetrics.map((metric) => [metric.planId, metric]))
  ), [planMetrics]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Plans Management</h1>
          <p className="text-sm text-slate-400">View and manage all investment plans</p>
        </div>
        <button
          onClick={() => void loadPlanMetrics()}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-300 hover:bg-white/10 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Metrics
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs text-rose-200">
          <p>{error}</p>
          <button
            onClick={() => void loadPlanMetrics()}
            className="mt-2 inline-flex items-center gap-1 rounded-lg border border-rose-400/30 px-2 py-1 text-[11px] font-semibold text-rose-100 hover:bg-rose-500/10"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      {isLoading && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">Loading plan metrics...</div>
      )}

      {!isLoading && !error && planMetrics.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
          No plan enrollment metrics found yet.
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const metrics = planMetricsMap.get(plan.id);
          const activeUsers = metrics?.activeUsers ?? 0;
          const maturedUsers = metrics?.maturedUsers ?? 0;
          const totalRevenue = metrics?.totalRevenue ?? 0;
          const totalEnrollments = metrics?.totalEnrollments ?? 0;
          const adoptionRate = metrics?.adoptionRate ?? 0;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl"
              style={{
                borderColor: `${plan.theme.primary}30`,
                background: `linear-gradient(135deg, ${plan.theme.bgGlow} 0%, rgba(0,0,0,0.2) 100%)`,
              }}
            >
              <div
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: `linear-gradient(90deg, transparent, ${plan.theme.primary}, transparent)` }}
              />

              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: plan.theme.primary }}>Plan {plan.id}</p>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                </div>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: plan.theme.bgGlow, border: `1px solid ${plan.theme.primary}40` }}
                >
                  <Layers className="h-5 w-5" style={{ color: plan.theme.primary }} />
                </div>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                  <p className="text-[10px] text-slate-500">Enrollment Fee</p>
                  <p className="text-lg font-bold text-white">${plan.joiningFee}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                  <p className="text-[10px] text-slate-500">ROI</p>
                  <p className="text-lg font-bold" style={{ color: plan.theme.primary }}>{plan.roi}%</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                  <p className="text-[10px] text-slate-500">Team Size</p>
                  <p className="text-lg font-bold text-white">{plan.teamSize}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                  <p className="text-[10px] text-slate-500">Guaranteed Flushout</p>
                  <p className="text-lg font-bold text-white">{plan.flushoutDays}d</p>
                </div>
              </div>

              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Active Users</span>
                  <span className="font-medium text-white">{activeUsers.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Matured Users</span>
                  <span className="font-medium text-emerald-400">{maturedUsers.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Total Revenue</span>
                  <span className="font-medium" style={{ color: plan.theme.primary }}>{formatUsd(totalRevenue)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Plan Adoption</span>
                  <span className="font-medium text-sky-300">{adoptionRate.toFixed(2)}% ({totalEnrollments.toLocaleString()})</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedPlan(plan)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                View Details
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Plan Detail Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setSelectedPlan(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0f] p-6"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: selectedPlan.theme.primary }}>Plan {selectedPlan.id}</p>
                  <h3 className="text-2xl font-bold text-white">{selectedPlan.name}</h3>
                </div>
                <button onClick={() => setSelectedPlan(null)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                   <p className="text-xs text-slate-500">Enrollment Fee</p>
                   <p className="text-xl font-bold text-white">${selectedPlan.joiningFee}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                  <p className="text-xs text-slate-500">Slot Fee</p>
                  <p className="text-xl font-bold text-white">${selectedPlan.slotFee}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                   <p className="text-xs text-slate-500">Total Earning</p>
                   <p className="text-xl font-bold text-emerald-400">${selectedPlan.memberProfit}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                  <p className="text-xs text-slate-500">ROI</p>
                  <p className="text-xl font-bold" style={{ color: selectedPlan.theme.primary }}>{selectedPlan.roi}%</p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="mb-3 text-sm font-semibold text-white">Fee Distribution</h4>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                    <p className="text-[10px] text-slate-500">Upline</p>
                    <p className="text-lg font-bold text-white">${selectedPlan.uplineCommission}</p>
                  </div>
                   <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                     <p className="text-[10px] text-slate-500">Level (10%)</p>
                    <p className="text-lg font-bold text-white">${selectedPlan.levelCommission}</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                    <p className="text-[10px] text-slate-500">Leader Pool</p>
                    <p className="text-lg font-bold text-amber-400">${selectedPlan.leaderPool}</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                    <p className="text-[10px] text-slate-500">Reward Pool</p>
                    <p className="text-lg font-bold text-purple-400">${selectedPlan.rewardPool}</p>
                  </div>
                </div>
              </div>

              {selectedPlan.sponsorPool > 0 && (
                <div className="mt-4">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                    <p className="text-[10px] text-emerald-400">Sponsor Pool</p>
                    <p className="text-lg font-bold text-emerald-300">${selectedPlan.sponsorPool}</p>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================
// POOLS MANAGEMENT COMPONENT
// =============================================
function PoolsManagement({ token }: { token: string | null }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState<'REWARD' | 'ALL' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [withdrawMessage, setWithdrawMessage] = useState<string | null>(null);
  const [pools, setPools] = useState<Pool[]>([]);
  const [totals, setTotals] = useState({
    systemPool: 0,
    leaderPool: 0,
    rewardPool: 0,
    sponsorPool: 0,
    allFund: 0,
    systemFund: 0,
  });

  const loadPoolMetrics = useCallback(async () => {
    if (!token) {
      setPools([]);
      setError('Permission denied. Admin login required.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const getPoolPresentation = (type: 'SYSTEM' | 'LEADER' | 'REWARD' | 'SPONSOR') => {
        switch (type) {
          case 'SYSTEM':
            return {
              theme: { primary: '#22d3ee', bg: 'bg-cyan-500/10', border: 'rgba(34,211,238,0.35)' },
              label: 'System Fund',
            };
          case 'LEADER':
            return {
              theme: { primary: '#f59e0b', bg: 'bg-amber-500/10', border: 'rgba(245,158,11,0.35)' },
              label: 'Leader Pool',
            };
          case 'REWARD':
            return {
              theme: { primary: '#a855f7', bg: 'bg-purple-500/10', border: 'rgba(168,85,247,0.35)' },
              label: 'Reward Pool',
            };
          default:
            return {
              theme: { primary: '#34d399', bg: 'bg-emerald-500/10', border: 'rgba(52,211,153,0.35)' },
              label: 'Sponsor Pool',
            };
        }
      };

      const response = await adminApi.getPoolMetrics(token);
      const mapPoolType = (type: 'SYSTEM' | 'LEADER' | 'REWARD' | 'SPONSOR'): Pool['type'] => {
        switch (type) {
          case 'SYSTEM':
            return 'System';
          case 'LEADER':
            return 'Leader';
          case 'REWARD':
            return 'Reward';
          default:
            return 'Sponsor';
        }
      };

      const nextPools: Pool[] = response.pools.map((pool) => {
        const presentation = getPoolPresentation(pool.type);

        return {
          id: pool.id,
          planId: pool.planId,
          displayName: `${pool.planName} • ${presentation.label}`,
          balance: pool.balance,
          totalDistributed: pool.totalDistributed,
          type: mapPoolType(pool.type),
          theme: presentation.theme,
        };
      });

      setPools(nextPools);
      setTotals(response.totals);
    } catch (err) {
      setPools([]);
      setTotals({ systemPool: 0, leaderPool: 0, rewardPool: 0, sponsorPool: 0, allFund: 0, systemFund: 0 });
      setError(err instanceof Error ? err.message : 'Failed to load pool metrics');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const handleWithdraw = useCallback(async (scope: 'REWARD' | 'ALL') => {
    if (!token) {
      setError('Permission denied. Admin login required.');
      return;
    }
    const confirmed = window.confirm(
      scope === 'REWARD'
        ? 'Confirm reward pool withdrawal? This action updates balances immediately.'
        : 'Confirm all-pool withdrawal? This action updates balances immediately.',
    );
    if (!confirmed) return;

    setIsWithdrawing(scope);
    setWithdrawMessage(null);
    setError(null);
    try {
      const response = await adminApi.withdrawPoolFunds(token, { scope, confirmation: 'CONFIRM_POOL_WITHDRAW' });
      setWithdrawMessage(response.message);
      await loadPoolMetrics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process withdrawal');
    } finally {
      setIsWithdrawing(null);
    }
  }, [loadPoolMetrics, token]);

  useEffect(() => {
    void loadPoolMetrics();
  }, [loadPoolMetrics]);

  const systemPools = useMemo(() => pools.filter((pool) => pool.type === 'System'), [pools]);
  const leaderPools = useMemo(() => pools.filter((pool) => pool.type === 'Leader'), [pools]);
  const rewardPools = useMemo(() => pools.filter((pool) => pool.type === 'Reward'), [pools]);
  const sponsorPools = useMemo(() => pools.filter((pool) => pool.type === 'Sponsor'), [pools]);

  const PoolCard = ({ pool }: { pool: Pool }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group rounded-xl border p-4"
      style={{
        borderColor: pool.theme.border,
        background: `linear-gradient(135deg, ${pool.theme.border}20, transparent)`,
      }}
    >
      <div className="mb-3 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${pool.theme.bg}`}>
          <Database className="h-5 w-5" style={{ color: pool.theme.primary }} />
        </div>
        <div>
          <p className="text-xs text-slate-400">{pool.displayName}</p>
          <p className="font-mono text-xl font-semibold text-white">{formatUsd(pool.balance)}</p>
        </div>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Plan ID</span>
          <span className="font-medium text-slate-200">{pool.planId}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Total Distributed</span>
          <span className="font-medium text-emerald-400">{formatUsd(pool.totalDistributed)}</span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Pools Management</h1>
          <p className="text-sm text-slate-400">Manage all treasury pools and distributions</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 sm:px-4 py-2">
          <p className="text-[10px] sm:text-xs text-slate-500">All Fund (System Fund)</p>
          <p className="font-mono text-lg sm:text-xl font-bold text-emerald-400">{formatUsd(totals.systemFund)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] text-slate-500">All Fund</p>
          <p className="text-lg font-bold text-white">{formatUsd(totals.allFund)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] text-slate-500">Leader Pool</p>
          <p className="text-lg font-bold text-amber-300">{formatUsd(totals.leaderPool)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] text-slate-500">Reward Pool</p>
          <p className="text-lg font-bold text-purple-300">{formatUsd(totals.rewardPool)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] text-slate-500">Sponsor Pool</p>
          <p className="text-lg font-bold text-emerald-300">{formatUsd(totals.sponsorPool)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm font-semibold text-white">Admin Pool Withdraw Actions</p>
        <p className="text-xs text-slate-400">Run secure backend withdrawals for Reward Pool only or complete All Fund.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            onClick={() => void handleWithdraw('REWARD')}
            disabled={isLoading || isWithdrawing !== null || totals.rewardPool <= 0}
            className="rounded-xl border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-200 hover:bg-purple-500/20 disabled:opacity-50"
          >
            {isWithdrawing === 'REWARD' ? 'Withdrawing...' : 'Withdraw Reward Pool'}
          </button>
          <button
            onClick={() => void handleWithdraw('ALL')}
            disabled={isLoading || isWithdrawing !== null || totals.allFund <= 0}
            className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
          >
            {isWithdrawing === 'ALL' ? 'Withdrawing...' : 'Withdraw All Pool Balance'}
          </button>
          <button
            onClick={() => void loadPoolMetrics()}
            disabled={isLoading || isWithdrawing !== null}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {withdrawMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
          {withdrawMessage}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">
          Loading pool metrics...
        </div>
      )}

      {!isLoading && !error && pools.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">
          No pool records found.
        </div>
      )}

      {/* System Pools */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">System Funds</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {systemPools.map(pool => <PoolCard key={pool.id} pool={pool} />)}
        </div>
      </div>

      {/* Leader Pools */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Leader Pools</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leaderPools.map(pool => <PoolCard key={pool.id} pool={pool} />)}
        </div>
      </div>

      {/* Reward Pools */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Reward Pools</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rewardPools.map(pool => <PoolCard key={pool.id} pool={pool} />)}
        </div>
      </div>

      {/* Sponsor Pools */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Sponsor Pools</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sponsorPools.map(pool => <PoolCard key={pool.id} pool={pool} />)}
        </div>
      </div>
    </div>
  );
}

// =============================================
// FLUSHOUTS MANAGEMENT COMPONENT
// =============================================
function FlushoutsManagement({ token, plans }: { token: string | null; plans: Plan[] }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [records, setRecords] = useState<FlushoutRecord[]>([]);
  const [manualEnrollmentId, setManualEnrollmentId] = useState('');

  const EXPORT_PAGE_SIZE = 500;

  const loadFlushouts = useCallback(async () => {
    if (!token) {
      setRecords([]);
      setError('Permission denied. Admin login required.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await adminApi.getFlushouts(token, { page: 1, limit: 100 });
      setRecords(response.flushouts);
    } catch (err) {
      setRecords([]);
      setError(err instanceof Error ? err.message : 'Failed to load flushouts');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadFlushouts();
  }, [loadFlushouts]);

  const handleExportAll = async () => {
    if (!token) {
      setError('Permission denied. Admin login required.');
      return;
    }

    setIsExporting(true);
    setError(null);
    try {
      const firstPage = await adminApi.getFlushouts(token, { page: 1, limit: EXPORT_PAGE_SIZE });
      const allRows = [...firstPage.flushouts];

      for (let page = 2; page <= firstPage.pagination.pages; page += 1) {
        const nextPage = await adminApi.getFlushouts(token, { page, limit: EXPORT_PAGE_SIZE });
        allRows.push(...nextPage.flushouts);
      }

      const csv = buildCsv(
        allRows.map((item) => ({
          id: item.id,
          userId: item.userId,
          wallet: item.wallet,
          userName: item.userName ?? '',
          planId: item.planId,
          planName: item.planName,
          amount: item.amount,
          type: item.type,
          flushedAt: item.flushedAt,
        })),
      );
      downloadCsv(`admin-flushouts-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export flushouts');
    } finally {
      setIsExporting(false);
    }
  };

  const handleManualFlushout = async () => {
    const enrollmentId = manualEnrollmentId.trim();
    if (!enrollmentId) {
      setError('Enrollment ID is required for manual flushout.');
      return;
    }
    if (!token) {
      setError('Permission denied. Admin login required.');
      return;
    }
    const confirmed = window.confirm(`Confirm manual flushout for enrollment ${enrollmentId}?`);
    if (!confirmed) return;

    setIsSubmittingManual(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await adminApi.manualFlushout(token, enrollmentId, { confirmation: 'CONFIRM_MANUAL_FLUSHOUT' });
      setSuccess(response.message || 'Manual flushout processed.');
      setManualEnrollmentId('');
      await loadFlushouts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process manual flushout');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Flushout Management</h1>
          <p className="text-sm text-slate-400">Track and manage plan flushouts</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            onClick={() => void handleExportAll()}
            disabled={isExporting || isLoading}
            className="flex items-center justify-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export All'}
          </button>
          <button
            onClick={() => void loadFlushouts()}
            disabled={isLoading || isSubmittingManual}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
        <p className="text-sm font-semibold text-amber-100">Manual Flushout</p>
        <p className="mt-1 text-xs text-amber-200/80">Enter enrollment ID and trigger backend manual flushout.</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={manualEnrollmentId}
            onChange={(event) => setManualEnrollmentId(event.target.value)}
            placeholder="Enrollment ID"
            className="w-full rounded-xl border border-white/10 bg-[#0b0b10] px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-400/40"
          />
          <button
            onClick={() => void handleManualFlushout()}
            disabled={isSubmittingManual || isLoading}
            className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-amber-500/30 disabled:opacity-60"
          >
            <Flame className="h-4 w-4" />
            {isSubmittingManual ? 'Processing...' : 'Run Manual Flushout'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{success}</div>
      )}

      {/* Flushout Schedule */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Flushout Schedule</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className="rounded-xl border p-4 text-center"
              style={{ borderColor: `${plan.theme.primary}30`, background: `${plan.theme.bgGlow}40` }}
            >
              <p className="text-[10px]" style={{ color: plan.theme.primary }}>Plan {plan.id}</p>
              <p className="text-2xl font-bold text-white">{plan.flushoutDays}</p>
              <p className="text-xs text-slate-500">Days</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Flushouts */}
      <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] min-w-[600px]">
          <div className="border-b border-white/10 px-4 sm:px-6 py-4">
            <h3 className="text-lg font-semibold text-white">Recent Flushouts</h3>
          </div>
          {isLoading ? (
            <div className="p-4 text-sm text-slate-300">Loading flushout records...</div>
          ) : records.length === 0 ? (
            <div className="p-4 text-sm text-slate-300">No flushout records found.</div>
          ) : (
          <table className="w-full">
            <thead className="bg-white/[0.03]">
              <tr className="border-b border-white/10">
                <th className="px-4 sm:px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">ID</th>
                <th className="px-4 sm:px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">User</th>
                <th className="px-4 sm:px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Plan</th>
                <th className="px-4 sm:px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Amount</th>
                <th className="px-4 sm:px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Type</th>
                <th className="px-4 sm:px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                  <td className="px-4 sm:px-6 py-4 font-mono text-sm text-slate-300">{(record.id || '').slice(0, 10)}</td>
                  <td className="px-4 sm:px-6 py-4 font-mono text-sm text-slate-300">{record.wallet}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-slate-300">{record.planName}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-emerald-400">+{formatUsd(record.amount)}</td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${
                      record.type === 'Auto' 
                        ? 'text-sky-200 bg-sky-500/10 border-sky-400/20' 
                        : 'text-violet-200 bg-violet-500/10 border-violet-400/20'
                    }`}>
                      {record.type}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-slate-400">{new Date(record.flushedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================
// COMMISSIONS MANAGEMENT COMPONENT
// =============================================
function CommissionsManagement() {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalEarned, setTotalEarned] = useState(0);
  const [directReferralIncome, setDirectReferralIncome] = useState(0);
  const [levels, setLevels] = useState<Array<{ key: string; label: string; percentage: number | null; amount: number }>>([]);
  const [records, setRecords] = useState<Array<{
    id: string;
    fromUser?: { walletAddress: string; name?: string | null } | null;
    level: number;
    displayLevel: number;
    planId: number;
    amount: number;
    createdAt: string;
  }>>([]);
  const formatMoney = (value: number | null | undefined): string =>
    `$${(toSafeNonNegativeNumber(value) ?? 0).toFixed(6)}`;

  const loadCommissions = async () => {
    if (!token) {
      setLevels([]);
      setRecords([]);
      setTotalEarned(0);
      setDirectReferralIncome(0);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await teamApi.getCommissions(token, 20);
      const summaryLevels = response.commissionSummary?.levels;
      const isValidCommissionLevel = (
        level: unknown,
      ): level is { key: string; label: string; percentage: number | null; amount: number } => {
        if (!level || typeof level !== 'object') return false;
        const candidate = level as Record<string, unknown>;
        const hasValidPercentage = typeof candidate.percentage === 'number' || candidate.percentage === null;
        return (
          typeof candidate.key === 'string' &&
          candidate.key.length > 0 &&
          typeof candidate.label === 'string' &&
          candidate.label.length > 0 &&
          hasValidPercentage &&
          typeof candidate.amount === 'number' &&
          Number.isFinite(candidate.amount)
        );
      };
      setTotalEarned(typeof response.totalEarned === 'number' && Number.isFinite(response.totalEarned) ? Math.max(0, response.totalEarned) : 0);
      setDirectReferralIncome(getDirectReferralIncome(response.commissionSummary) ?? 0);
      setLevels(
        Array.isArray(summaryLevels)
          ? summaryLevels.filter(isValidCommissionLevel).map((level) => ({
              key: level.key,
              label: level.label,
              percentage: typeof level.percentage === 'number' ? level.percentage : null,
              amount: typeof level.amount === 'number' && Number.isFinite(level.amount) && level.amount > 0 ? level.amount : 0,
            }))
          : [],
      );
      setRecords(
        Array.isArray(response.commissions)
          ? response.commissions.map((commission) => ({
              id: commission.id,
              fromUser: commission.fromUser,
              level: commission.level,
              displayLevel: typeof commission.displayLevel === 'number' ? commission.displayLevel : commission.level + 1,
              planId: commission.planId,
              amount: typeof commission.amount === 'number' && Number.isFinite(commission.amount) && commission.amount > 0 ? commission.amount : 0,
              createdAt: commission.createdAt,
            }))
          : [],
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load commissions');
      setLevels([]);
      setRecords([]);
      setTotalEarned(0);
      setDirectReferralIncome(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCommissions();
  }, [token]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Commission Distribution</h1>
          <p className="text-sm text-slate-400">Track multi-level commission payouts</p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 sm:px-4 py-2">
            <p className="text-[10px] sm:text-xs text-emerald-400">Total Earned</p>
            <p className="font-mono text-lg sm:text-xl font-bold text-emerald-300">{formatMoney(totalEarned)}</p>
          </div>
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 sm:px-4 py-2">
            <p className="text-[10px] sm:text-xs text-cyan-300">Direct Referral Income</p>
            <p className="font-mono text-lg sm:text-xl font-bold text-cyan-200">{formatMoney(directReferralIncome)}</p>
          </div>
        </div>
      </div>

      {/* Level Commission Structure */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Level Commission Structure</h3>
        {isLoading && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <p className="text-sm font-semibold text-slate-200">Loading commissions...</p>
          </div>
        )}
        {!isLoading && error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
            <p className="text-xs font-semibold text-rose-300">Could not load commission data</p>
            <p className="mt-1 text-[11px] text-rose-200/80">{error}</p>
            <button
              onClick={loadCommissions}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-rose-400/30 bg-rose-500/15 px-3 py-1.5 text-[11px] font-semibold text-rose-200 hover:bg-rose-500/20"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        )}
        {!isLoading && !error && levels.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <p className="text-sm font-semibold text-slate-200">No commission data</p>
          </div>
        )}
        {!isLoading && !error && levels.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {levels.map((lvl) => (
              <div key={lvl.key} className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 text-center">
                <p className="text-[10px] text-violet-400">{lvl.label}</p>
                <p className="text-xl font-bold text-violet-300">{lvl.percentage === null ? '—' : `${lvl.percentage}%`}</p>
                <p className="text-[10px] text-emerald-300">${lvl.amount.toFixed(6)}</p>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500">Direct Upline + Level 2 to Level 8</p>
      </div>

      {/* Commission Records */}
      <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] min-w-[700px]">
          <div className="border-b border-white/10 px-4 sm:px-6 py-4">
            <h3 className="text-lg font-semibold text-white">Recent Commissions</h3>
          </div>
          {!isLoading && !error && records.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-slate-300">No commission records found.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-white/[0.03]">
                <tr className="border-b border-white/10">
                  <th className="px-4 sm:px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">ID</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">From</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Level</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Plan</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Amount</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                    <td className="px-4 sm:px-6 py-4 font-mono text-sm text-slate-300">{record.id.slice(0, 8)}</td>
                    <td className="px-4 sm:px-6 py-4 font-mono text-sm text-slate-300">{record.fromUser?.walletAddress || '-'}</td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className="inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-300">
                        Level {record.displayLevel}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-slate-300">Plan {record.planId}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-emerald-400">+${record.amount.toFixed(6)}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-slate-400">{new Date(record.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================
// KIMI LEVELS MANAGEMENT COMPONENT
// =============================================
function KIMILevelsManagement() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">KIMI Levels</h1>
        <p className="text-sm text-slate-400">Manage skill levels and user progression</p>
      </div>

      {/* Levels Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {kimiLevels.map((level, index) => {
          const colors = [
            { primary: '#fbbf24', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
            { primary: '#22d3ee', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
            { primary: '#34d399', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { primary: '#e879f9', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
            { primary: '#f472b6', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
            { primary: '#fb7185', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
            { primary: '#a78bfa', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
          ];
          const theme = colors[index];
          
          return (
            <motion.div
              key={level.level}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-2xl border ${theme.border} bg-white/[0.04] p-5`}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${theme.bg}`}>
                  <Trophy className="h-5 w-5" style={{ color: theme.primary }} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: theme.primary }}>Level {level.level}</p>
                  <h3 className="text-lg font-bold text-white">{level.name}</h3>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                  <p className="text-[10px] text-slate-500">Users</p>
                  <p className="text-xl font-bold text-white">{level.usersCount.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                  <p className="text-[10px] text-slate-500">Earnings</p>
                  <p className="text-xl font-bold text-emerald-400">${level.totalEarnings.toLocaleString()}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================
// GIFT CODE MANAGEMENT COMPONENT
// =============================================
interface GiftCode {
  id: string;
  code: string;
  amount: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'DISABLED';
  planId: number;
  planName: string;
  createdAt: string;
}

export function GiftCodeManagement({ token }: { token: string | null }) {
  const [codes, setCodes] = useState<GiftCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState({
    code: '',
    planId: '1',
    days: '',
    quantity: '1',
    amountMode: 'PLAN' as 'PLAN' | 'CUSTOM',
    customAmount: '',
  });
  const isNumericDaysInput = (value: string): boolean => /^\d*$/.test(value);

  const loadGiftCodes = useCallback(async () => {
    if (!token) {
      setCodes([]);
      setError('Permission denied. Admin login required.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await adminApi.getGiftCodes(token, { limit: 100 });
      setCodes(response.giftCodes);
    } catch (err) {
      setCodes([]);
      setError(err instanceof Error ? err.message : 'Failed to load gift codes');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadGiftCodes();
  }, [loadGiftCodes]);

  const handleCreate = async () => {
    if (!token) {
      setError('Permission denied. Admin login required.');
      return;
    }

    const daysRaw = newCode.days.trim();
    const daysInputProvided = daysRaw.length > 0;
    const days = daysInputProvided ? Number(daysRaw) : undefined;
    const quantity = Number(newCode.quantity);
    const planId = Number(newCode.planId);
    const code = newCode.code.trim().toUpperCase();
    const customAmountRaw = newCode.customAmount.trim();
    const customAmount = newCode.amountMode === 'CUSTOM' ? Number(customAmountRaw) : undefined;

    if (!Number.isInteger(planId) || planId < 1 || planId > 6) {
      setError('Plan must be between 1 and 6.');
      return;
    }
    if (daysInputProvided && !isNumericDaysInput(daysRaw)) {
      setError('Valid for days must contain numbers only.');
      return;
    }
    if (days !== undefined && (!Number.isInteger(days) || days < 1 || days > 365)) {
      setError('Valid for days must be between 1 and 365.');
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      setError('Quantity must be between 1 and 50.');
      return;
    }
    if (code && !/^[A-Z0-9_-]{4,32}$/.test(code)) {
      setError('Code must be 4-32 chars and contain only A-Z, 0-9, _ or -.');
      return;
    }
    if (code && quantity !== 1) {
      setError('Custom code can only be created with quantity 1.');
      return;
    }
    if (newCode.amountMode === 'CUSTOM') {
      if (!/^\d+(\.\d+)?$/.test(customAmountRaw)) {
        setError('Custom amount must be numeric.');
        return;
      }
      if (!Number.isFinite(customAmount) || (customAmount ?? 0) <= 0) {
        setError('Custom amount must be greater than 0.');
        return;
      }
      if ((customAmount ?? 0) > 1_000_000) {
        setError('Custom amount is too large.');
        return;
      }
    }

    setIsCreating(true);
    setError(null);
    try {
      await adminApi.createGiftCode(token, {
        planId,
        ...(days !== undefined ? { expiryDays: days } : {}),
        quantity,
        ...(newCode.amountMode === 'CUSTOM' ? { customAmount } : {}),
        ...(code ? { code } : {}),
      });
      setNewCode({
        code: '',
        planId: '1',
        days: '',
        quantity: '1',
        amountMode: 'PLAN',
        customAmount: '',
      });
      setShowCreate(false);
      await loadGiftCodes();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create gift code');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusChange = async (id: string, status: 'ACTIVE' | 'DISABLED') => {
    if (!token) {
      setError('Permission denied. Admin login required.');
      return;
    }

    setIsUpdating(id);
    setError(null);
    try {
      await adminApi.updateGiftCodeStatus(token, id, status);
      await loadGiftCodes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update gift code status');
      await loadGiftCodes();
    } finally {
      setIsUpdating(null);
    }
  };

  const gcStatusStyle = (s: GiftCode['status']) => {
    if (s === 'ACTIVE') return 'text-emerald-200 bg-emerald-500/10 border-emerald-400/20';
    if (s === 'EXPIRED') return 'text-amber-200 bg-amber-500/10 border-amber-400/20';
    if (s === 'USED') return 'text-sky-200 bg-sky-500/10 border-sky-400/20';
    return 'text-rose-200 bg-rose-500/10 border-rose-400/20';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Gift Code Management</h1>
          <p className="text-xs text-slate-400">Create, manage and revoke gift codes</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all">
          <Plus className="h-4 w-4" /> Create Code
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs text-rose-200">
          <p>{error}</p>
          <button
            onClick={() => void loadGiftCodes()}
            className="mt-2 inline-flex items-center gap-1 rounded-lg border border-rose-400/30 px-2 py-1 text-[11px] font-semibold text-rose-100 hover:bg-rose-500/10"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Codes', value: codes.length, color: '#22d3ee' },
          { label: 'Active', value: codes.filter(c => c.status === 'ACTIVE').length, color: '#34d399' },
          { label: 'Total Redeemed', value: codes.reduce((a, c) => a + c.usedCount, 0), color: '#fbbf24' },
          { label: 'Total Amount Given', value: `$${codes.reduce((a, c) => a + c.amount * c.usedCount, 0).toLocaleString()}`, color: '#e879f9' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Codes List */}
      <div className="space-y-3">
        {isLoading && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">Loading gift codes...</div>
        )}
        {!isLoading && codes.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">No gift codes found.</div>
        )}
        {!isLoading && codes.map((gc) => (
          <motion.div key={gc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/20">
                  <Gift className="h-5 w-5 text-rose-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold font-mono text-white tracking-wider">{gc.code}</p>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${gcStatusStyle(gc.status)}`}>{gc.status}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{gc.planName} • Created {new Date(gc.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-400">${gc.amount}</p>
                  <p className="text-[10px] text-slate-500">per redeem</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{gc.usedCount}/{gc.maxUses}</p>
                  <p className="text-[10px] text-slate-500">used</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-300">{gc.expiresAt ? new Date(gc.expiresAt).toLocaleDateString() : 'No expiry'}</p>
                  <p className="text-[10px] text-slate-500">expires</p>
                </div>
                {gc.status !== 'USED' && gc.status !== 'EXPIRED' && (
                  <button
                    disabled={isUpdating === gc.id}
                    onClick={() => void handleStatusChange(gc.id, gc.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE')}
                    className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors disabled:opacity-60"
                  >
                    <Ban className="h-3.5 w-3.5" /> {gc.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                  </button>
                )}
              </div>
            </div>
            {/* Usage bar */}
            <div className="mt-3">
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all" style={{ width: `${Math.min((gc.usedCount / gc.maxUses) * 100, 100)}%` }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d1321] p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/25">
                    <Gift className="h-6 w-6 text-emerald-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Create Gift Code</h3>
                    <p className="text-xs text-slate-400">Generate code(s) from backend</p>
                  </div>
                </div>
                <button onClick={() => setShowCreate(false)} className="p-2 rounded-full bg-white/5 text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="gift-code-custom-code" className="text-xs text-slate-400 mb-1 block">Custom Code (Optional)</label>
                  <input id="gift-code-custom-code" value={newCode.code} onChange={e => setNewCode({ ...newCode, code: e.target.value })} placeholder="e.g. WELCOME50" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-mono uppercase text-white tracking-wider placeholder:text-slate-600 focus:border-emerald-500/40 focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="gift-code-plan" className="text-xs text-slate-400 mb-1 block">Plan</label>
                    <select id="gift-code-plan" value={newCode.planId} onChange={e => setNewCode({ ...newCode, planId: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-emerald-500/40 focus:outline-none">
                      {[1, 2, 3, 4, 5, 6].map((planId) => (
                        <option key={planId} value={String(planId)} className="bg-[#0a0a0f]">Plan {planId}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="gift-code-quantity" className="text-xs text-slate-400 mb-1 block">Quantity</label>
                    <input id="gift-code-quantity" type="number" value={newCode.quantity} min={1} max={50} onChange={e => setNewCode({ ...newCode, quantity: e.target.value })} placeholder="1" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500/40 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Amount Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewCode({ ...newCode, amountMode: 'PLAN', customAmount: '' })}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold ${newCode.amountMode === 'PLAN' ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-300'}`}
                    >
                      Plan Amount
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCode({ ...newCode, amountMode: 'CUSTOM' })}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold ${newCode.amountMode === 'CUSTOM' ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-300'}`}
                    >
                      Custom Amount
                    </button>
                  </div>
                </div>
                {newCode.amountMode === 'CUSTOM' && (
                  <div>
                    <label htmlFor="gift-code-custom-amount" className="text-xs text-slate-400 mb-1 block">Custom Amount (USD)</label>
                    <input
                      id="gift-code-custom-amount"
                      value={newCode.customAmount}
                      onChange={(e) => setNewCode({ ...newCode, customAmount: e.target.value })}
                      placeholder="e.g. 1"
                      inputMode="decimal"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500/40 focus:outline-none"
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="gift-code-days" className="text-xs text-slate-400 mb-1 block">Valid For (Days)</label>
                  <input
                    id="gift-code-days"
                    type="text"
                    inputMode="numeric"
                    value={newCode.days}
                    onChange={e => {
                      const next = e.target.value;
                      if (isNumericDaysInput(next)) {
                        setNewCode({ ...newCode, days: next });
                      } else {
                        setError('Valid for days must contain numbers only.');
                      }
                    }}
                    placeholder="e.g. 30"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500/40 focus:outline-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowCreate(false)} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white">Cancel</button>
                  <button disabled={isCreating} onClick={() => void handleCreate()} className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-bold text-white disabled:opacity-60">{isCreating ? 'Creating...' : 'Create Code'}</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Revoke Confirm Modal */}
      {/* Status actions are backend-driven and applied directly */}
    </div>
  );
}

// =============================================
// REWARDS MANAGEMENT COMPONENT
// =============================================
export function RewardsManagement({ token }: { token: string | null }) {
  const [activeTab, setActiveTab] = useState<'club' | 'individual'>('club');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextDistributionAt, setNextDistributionAt] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    totalClaims: 0,
    pendingClaims: 0,
    approvedClaims: 0,
    paidClaims: 0,
    rejectedClaims: 0,
    totalClaimedAmount: 0,
    totalPaidAmount: 0,
  });
  const [clubIncentives, setClubIncentives] = useState<Array<{
    id: string;
    rank: string;
    plan1: number;
    plan2: number;
    plan3: number;
    plan4: number;
    plan5: number;
    plan6: number;
    reward: number;
  }>>([]);
  const [individualIncentives, setIndividualIncentives] = useState<Array<{
    id: string;
    plan: string;
    target: number;
    reward: number;
  }>>([]);

  const loadRewardsMetrics = useCallback(async () => {
    if (!token) {
      setError('Permission denied. Admin login required.');
      setClubIncentives([]);
      setIndividualIncentives([]);
      setNextDistributionAt(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await adminApi.getRewardsMetrics(token);
      setNextDistributionAt(response.nextDistributionAt ?? null);
      setSummary({
        totalClaims: Number(response.summary?.totalClaims ?? 0),
        pendingClaims: Number(response.summary?.pendingClaims ?? 0),
        approvedClaims: Number(response.summary?.approvedClaims ?? 0),
        paidClaims: Number(response.summary?.paidClaims ?? 0),
        rejectedClaims: Number(response.summary?.rejectedClaims ?? 0),
        totalClaimedAmount: Number(response.summary?.totalClaimedAmount ?? 0),
        totalPaidAmount: Number(response.summary?.totalPaidAmount ?? 0),
      });
      setClubIncentives(Array.isArray(response.clubIncentives) ? response.clubIncentives : []);
      setIndividualIncentives(Array.isArray(response.individualIncentives) ? response.individualIncentives : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rewards metrics');
      setNextDistributionAt(null);
      setClubIncentives([]);
      setIndividualIncentives([]);
      setSummary({
        totalClaims: 0,
        pendingClaims: 0,
        approvedClaims: 0,
        paidClaims: 0,
        rejectedClaims: 0,
        totalClaimedAmount: 0,
        totalPaidAmount: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadRewardsMetrics();
  }, [loadRewardsMetrics]);

  const hasRewardConfig = Boolean(nextDistributionAt) || clubIncentives.length > 0 || individualIncentives.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Rewards & Incentives</h1>
          <p className="text-sm text-slate-400">Manage monthly rewards and incentive programs</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 sm:px-4 py-2">
          <p className="text-[10px] sm:text-xs text-amber-400">Next Distribution</p>
          {isLoading ? (
            <p className="font-mono text-base sm:text-lg font-bold text-amber-300">Loading...</p>
          ) : nextDistributionAt ? (
            <p className="font-mono text-base sm:text-lg font-bold text-amber-300">{new Date(nextDistributionAt).toLocaleString()}</p>
          ) : (
            <p className="font-mono text-sm sm:text-base font-bold text-amber-200/90">Not configured</p>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs text-rose-200">
          <p>{error}</p>
          <button
            onClick={() => void loadRewardsMetrics()}
            className="mt-2 inline-flex items-center gap-1 rounded-lg border border-rose-400/30 px-2 py-1 text-[11px] font-semibold text-rose-100 hover:bg-rose-500/10"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Claims', value: summary.totalClaims, color: '#22d3ee' },
          { label: 'Pending Claims', value: summary.pendingClaims, color: '#fbbf24' },
          { label: 'Paid Claims', value: summary.paidClaims, color: '#34d399' },
          { label: 'Total Paid', value: formatUsd(summary.totalPaidAmount), color: '#e879f9' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</p>
            <p className="text-xl sm:text-2xl font-bold mt-1" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">Loading rewards configuration...</div>
      )}
      {!isLoading && !error && !hasRewardConfig && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">No rewards configuration found.</div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('club')}
          className={`rounded-xl px-6 py-3 text-sm font-medium transition-all ${
            activeTab === 'club'
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'
              : 'border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          Club Incentives
        </button>
        <button
          onClick={() => setActiveTab('individual')}
          className={`rounded-xl px-6 py-3 text-sm font-medium transition-all ${
            activeTab === 'individual'
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'
              : 'border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
          }`}
        >
          Individual Incentives
        </button>
      </div>

      {/* Club Incentives */}
      {activeTab === 'club' && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
          {clubIncentives.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-slate-300">No club incentives configured.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-white/[0.03]">
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Rank</th>
                  <th className="px-6 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Plan 1 IDs</th>
                  <th className="px-6 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Plan 2 IDs</th>
                  <th className="px-6 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Plan 3 IDs</th>
                  <th className="px-6 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Plan 4 IDs</th>
                  <th className="px-6 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Plan 5 IDs</th>
                  <th className="px-6 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Plan 6 IDs</th>
                  <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Reward</th>
                </tr>
              </thead>
              <tbody>
                {clubIncentives.map((incentive) => (
                  <tr key={incentive.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1 text-sm font-semibold text-rose-300">
                        <Medal className="h-4 w-4" />
                        {incentive.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-300">{incentive.plan1}</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-300">{incentive.plan2}</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-300">{incentive.plan3}</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-300">{incentive.plan4}</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-300">{incentive.plan5}</td>
                    <td className="px-6 py-4 text-center text-sm text-slate-300">{incentive.plan6}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-lg font-bold text-emerald-400">{formatUsd(incentive.reward)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Individual Incentives */}
      {activeTab === 'individual' && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {individualIncentives.length === 0 ? (
            <div className="col-span-full rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
              No individual incentives configured.
            </div>
          ) : (
            individualIncentives.map((incentive, index) => (
              <motion.div
                key={incentive.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-5"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{incentive.plan}</p>
                <p className="mt-2 text-3xl font-bold text-white">{incentive.target}</p>
                <p className="text-sm text-slate-400">Target IDs</p>
                <div className="mt-4 flex items-center gap-2">
                  <Gift className="h-4 w-4 text-rose-400" />
                  <span className="text-lg font-bold text-emerald-400">{formatUsd(incentive.reward)}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// =============================================
// DAILY INCOME MANAGEMENT COMPONENT
// =============================================
function DailyIncomeManagement() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Daily Income Plan</h1>
          <p className="text-sm text-slate-400">Coming Soon Feature Management</p>
        </div>
        <span className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/15 px-4 py-2 text-sm font-bold text-amber-300">
          <Sparkles className="h-4 w-4" />
          Coming Soon
        </span>
      </div>

      {/* Coming Soon Card */}
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-8 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/20">
          <Calendar className="h-10 w-10 text-amber-400" />
        </div>
        <h3 className="mb-2 text-2xl font-bold text-white">Daily Income Plan</h3>
        <p className="mx-auto max-w-md text-slate-400">
          This feature is currently under development. Users will be able to earn daily rewards 
          based on their activity and plan participation.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-slate-300 hover:bg-white/10">
            Preview Settings
          </button>
          <button className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-medium text-white">
            Notify When Live
          </button>
        </div>
      </div>

      {/* Planned Features */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: 'Daily Rewards', desc: 'Automatic daily distribution based on activity', icon: Gift },
          { title: 'Activity Tracking', desc: 'Monitor user engagement and participation', icon: Activity },
          { title: 'Flexible Payouts', desc: 'Customizable payout schedules and amounts', icon: Clock },
          { title: 'Performance Bonus', desc: 'Extra rewards for top performers', icon: Trophy },
          { title: 'Staking Options', desc: 'Lock tokens for higher returns', icon: Lock },
          { title: 'Referral Boost', desc: 'Increased earnings from referrals', icon: Users },
        ].map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-xl border border-white/5 bg-white/[0.03] p-5"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <Icon className="h-5 w-5 text-amber-400" />
              </div>
              <h4 className="mb-1 text-sm font-semibold text-white">{feature.title}</h4>
              <p className="text-xs text-slate-500">{feature.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================
// SECURITY LOGS COMPONENT
// =============================================
export function SecurityLogs({ token }: { token: string | null }) {
  const [severityFilter, setSeverityFilter] = useState<'All' | 'Info' | 'Warning' | 'Critical'>('All');
  const [actionFilter, setActionFilter] = useState('');
  const [adminIdFilter, setAdminIdFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [logs, setLogs] = useState<Array<{
    id: string;
    timestamp: string;
    action: string;
    user: string;
    details: string;
    severity: 'Info' | 'Warning' | 'Critical';
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAuditLogs = useCallback(async () => {
    if (!token) {
      setLogs([]);
      setError('Permission denied. Admin login required.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await adminApi.getAuditLogs(token, {
        limit: 100,
        action: actionFilter.trim() || undefined,
        adminId: adminIdFilter.trim() || undefined,
        from: fromDate ? new Date(`${fromDate}T00:00:00.000Z`).toISOString() : undefined,
        to: toDate ? new Date(`${toDate}T23:59:59.999Z`).toISOString() : undefined,
      });
      const mappedLogs = response.logs.map((log) => {
        const action = log.action.toUpperCase();
        const severity: 'Info' | 'Warning' | 'Critical' = action.includes('BLOCK') || action.includes('REJECT') || action.includes('DENIED')
          ? 'Critical'
          : action.includes('DISABLED') || action.includes('SUSPEND')
            ? 'Warning'
            : 'Info';

        return {
          id: log.id,
          timestamp: log.createdAt,
          action: log.action,
          user: log.user?.walletAddress || log.admin?.walletAddress || '-',
          details: log.description,
          severity,
        };
      });
      setLogs(mappedLogs);
    } catch (err) {
      setLogs([]);
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter, adminIdFilter, fromDate, toDate, token]);

  useEffect(() => {
    void loadAuditLogs();
  }, [loadAuditLogs]);

  const filteredLogs = logs.filter((log) =>
    severityFilter === 'All' || log.severity === severityFilter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Security Logs</h1>
          <p className="text-sm text-slate-400">Monitor system activity and security events</p>
        </div>
        <button
          onClick={() =>
            downloadCsv(
              `admin-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`,
              buildCsv(
                filteredLogs.map((log) => ({
                  timestamp: log.timestamp,
                  action: log.action,
                  user: log.user,
                  details: log.details,
                  severity: log.severity,
                })),
                ['timestamp', 'action', 'user', 'details', 'severity'],
              ),
            )
          }
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 w-full sm:w-auto"
        >
          <Download className="h-4 w-4" />
          Export Logs
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs text-rose-200">
          <p>{error}</p>
          <button
            onClick={() => void loadAuditLogs()}
            className="mt-2 inline-flex items-center gap-1 rounded-lg border border-rose-400/30 px-2 py-1 text-[11px] font-semibold text-rose-100 hover:bg-rose-500/10"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={severityFilter}
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'All' || value === 'Info' || value === 'Warning' || value === 'Critical') {
              setSeverityFilter(value);
            }
          }}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
        >
          <option value="All" className="bg-[#0a0a0f]">All Severities</option>
          <option value="Info" className="bg-[#0a0a0f]">Info</option>
          <option value="Warning" className="bg-[#0a0a0f]">Warning</option>
          <option value="Critical" className="bg-[#0a0a0f]">Critical</option>
        </select>
        <input
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          placeholder="Action (e.g. POOL_DISTRIBUTED)"
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none"
        />
        <input
          value={adminIdFilter}
          onChange={(e) => setAdminIdFilter(e.target.value)}
          placeholder="Admin ID"
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none"
        />
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
        />
        <button
          onClick={() => void loadAuditLogs()}
          disabled={isLoading}
          className="rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-4 py-3 text-sm font-semibold text-cyan-200 disabled:opacity-60"
        >
          Apply Filters
        </button>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] min-w-[650px]">
        <table className="w-full">
          <thead className="bg-white/[0.03]">
            <tr className="border-b border-white/10">
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Timestamp</th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Action</th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">User</th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Details</th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Severity</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-300">Loading audit logs...</td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-300">No audit logs found.</td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                  <td className="px-6 py-4 font-mono text-sm text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-medium text-white">{log.action}</td>
                  <td className="px-6 py-4 font-mono text-sm text-slate-300">{log.user}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{log.details}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${severityStyle(log.severity)}`}>
                      {log.severity}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}

// =============================================
// SETTINGS COMPONENT
// =============================================
export function Settings({ token }: { token: string | null }) {
  const [killConfirm, setKillConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSavingKey, setIsSavingKey] = useState<string | null>(null);
  const [isTriggeringKill, setIsTriggeringKill] = useState(false);
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [walletDraft, setWalletDraft] = useState('');
  const [killReason, setKillReason] = useState('');
  const [killResult, setKillResult] = useState<string | null>(null);

  const toggleSettings = useMemo(
    () => [
      { key: 'MAINTENANCE_MODE', label: 'Maintenance Mode', desc: 'Temporarily disable new registrations' },
      { key: 'FLUSHOUT_ENABLED', label: 'Auto Flushout', desc: 'Enable automatic plan flushouts' },
      { key: 'COMMISSION_DISTRIBUTION_ENABLED', label: 'Commission Distribution', desc: 'Auto-distribute level commissions' },
      { key: 'AUTO_WITHDRAWAL_SIGNING_ENABLED', label: 'Auto Withdrawal Signing', desc: 'Enable EIP-712 automatic withdrawal authorization' },
      { key: 'KILL_SWITCH_ACTIVE', label: 'Kill Switch Active', desc: 'Emergency state after kill switch execution' },
    ],
    [],
  );

  const isTrue = useCallback((value: string | undefined): boolean => {
    if (!value) return false;
    return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
  }, []);

  const loadConfigs = useCallback(async () => {
    if (!token) {
      setError('Permission denied. Admin login required.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSaveError(null);
    try {
      const response = await adminApi.getSystemConfig(token);
      const nextConfigs = Object.fromEntries(
        (response.configs || []).map((item) => [item.key, item.value]),
      );
      setConfigs(nextConfigs);
      setWalletDraft(nextConfigs.KILL_SWITCH_WALLET_ADDRESS || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      setConfigs({});
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadConfigs();
  }, [loadConfigs]);

  const upsertConfig = useCallback(
    async (key: string, value: string, description: string) => {
      if (!token) {
        setSaveError('Permission denied. Admin login required.');
        return;
      }
      setIsSavingKey(key);
      setSaveError(null);
      setSaveMessage(null);
      try {
        const response = await adminApi.updateSystemConfig(token, key, { value, description });
        setConfigs((prev) => ({ ...prev, [response.config.key]: response.config.value }));
        if (key === 'KILL_SWITCH_WALLET_ADDRESS') {
          setWalletDraft(response.config.value);
        }
        setSaveMessage(`Updated ${key}`);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : `Failed to update ${key}`);
      } finally {
        setIsSavingKey(null);
      }
    },
    [token],
  );

  const handleTriggerKillSwitch = useCallback(async () => {
    if (!token) {
      setSaveError('Permission denied. Admin login required.');
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletDraft.trim())) {
      setSaveError('Enter a valid BEP20 wallet address before kill switch trigger.');
      return;
    }

    setIsTriggeringKill(true);
    setSaveError(null);
    setSaveMessage(null);
    setKillResult(null);
    try {
      const response = await adminApi.triggerKillSwitch(token, {
        reason: killReason.trim() || undefined,
        confirmation: 'CONFIRM_KILL_SWITCH',
      });
      setKillResult(
        `Transfer initiated to ${response.transfer.destinationWallet} for ${formatUsd(response.transfer.amount)}.`,
      );
      setKillConfirm(false);
      setKillReason('');
      await loadConfigs();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to trigger kill switch');
    } finally {
      setIsTriggeringKill(false);
    }
  }, [killReason, loadConfigs, token, walletDraft]);

  const toggleCount = toggleSettings.length;
  const hasAnyConfig = Object.keys(configs).length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-slate-400">System configuration and emergency controls</p>
        </div>
      </div>

      {/* Emergency Controls */}
      <div className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-transparent p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/20">
            <AlertOctagon className="h-6 w-6 text-rose-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Emergency Controls</h3>
            <p className="text-sm text-slate-400">Critical system actions</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Admin BEP20 Wallet Address</label>
            <input
              value={walletDraft}
              onChange={(e) => setWalletDraft(e.target.value)}
              placeholder="0x..."
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/40"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                disabled={isSavingKey === 'KILL_SWITCH_WALLET_ADDRESS'}
                onClick={() => void upsertConfig('KILL_SWITCH_WALLET_ADDRESS', walletDraft.trim(), 'Emergency destination BEP20 wallet for kill switch')}
                className="rounded-lg border border-cyan-400/30 bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-200 disabled:opacity-60"
              >
                {isSavingKey === 'KILL_SWITCH_WALLET_ADDRESS' ? 'Saving...' : 'Save Wallet'}
              </button>
              <button
                onClick={() => setKillConfirm(true)}
                disabled={isTriggeringKill}
                className="rounded-lg border border-rose-300/30 bg-rose-700/35 px-3 py-2 text-xs font-semibold text-rose-50 disabled:opacity-60"
              >
                <AlertOctagon className="mr-1 inline h-3 w-3" /> Trigger Kill Switch
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Configured Wallet</p>
              <p className="mt-1 break-all font-mono text-xs text-slate-200">{configs.KILL_SWITCH_WALLET_ADDRESS || 'Not configured'}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Kill Switch Status</p>
              <p className={`mt-1 text-sm font-semibold ${isTrue(configs.KILL_SWITCH_ACTIVE) ? 'text-rose-300' : 'text-emerald-300'}`}>
                {isTrue(configs.KILL_SWITCH_ACTIVE) ? 'ACTIVE' : 'INACTIVE'}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Last Triggered</p>
              <p className="mt-1 text-sm text-slate-300">
                {configs.KILL_SWITCH_LAST_TRIGGERED_AT ? new Date(configs.KILL_SWITCH_LAST_TRIGGERED_AT).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {(error || saveError || saveMessage || killResult) && (
        <div className="space-y-2">
          {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>}
          {saveError && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{saveError}</div>}
          {saveMessage && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{saveMessage}</div>}
          {killResult && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">{killResult}</div>}
        </div>
      )}

      {/* System Settings */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">System Configuration</h3>
          <button
            onClick={() => void loadConfigs()}
            disabled={isLoading}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 disabled:opacity-60"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        {isLoading ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">Loading settings...</div>
        ) : (
          <div className="space-y-4">
            {!hasAnyConfig && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                No system config found yet. Toggle values below to create config entries.
              </div>
            )}
            {toggleSettings.map((setting) => {
              const enabled = isTrue(configs[setting.key]);
              return (
                <div key={setting.key} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-4">
                  <div>
                    <p className="text-sm font-medium text-white">{setting.label}</p>
                    <p className="text-xs text-slate-500">{setting.desc}</p>
                  </div>
                  <button
                    aria-label={`Toggle ${setting.label}`}
                    disabled={isSavingKey === setting.key}
                    onClick={() => void upsertConfig(setting.key, String(!enabled), setting.desc)}
                    className={`h-6 w-11 rounded-full transition disabled:opacity-60 ${enabled ? 'bg-emerald-500' : 'bg-slate-600'}`}
                  >
                    <div className={`h-5 w-5 rounded-full bg-white transition ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              );
            })}
            <p className="text-[11px] text-slate-500">
              Loaded keys: {Object.keys(configs).length} • Managed toggles: {toggleCount}
            </p>
          </div>
        )}
      </div>

      {/* Kill Switch Modal */}
      <AnimatePresence>
        {killConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setKillConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-3xl border border-rose-500/20 bg-[#0a0a0f] p-6 text-center"
            >
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/20">
                <AlertOctagon className="h-10 w-10 text-rose-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white">Execute Kill-Switch</h3>
              <p className="mt-3 text-sm text-slate-400">
                This will initiate emergency transfer flow for available pool funds to configured admin BEP20 wallet.
              </p>
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Destination Wallet</p>
                <p className="mt-1 break-all font-mono text-xs text-slate-200">{walletDraft || 'Not configured'}</p>
              </div>
              <textarea
                value={killReason}
                onChange={(e) => setKillReason(e.target.value)}
                placeholder="Reason (optional)"
                rows={3}
                className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white placeholder:text-slate-500 outline-none"
              />
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => {
                    setKillConfirm(false);
                    setKillReason('');
                  }}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white"
                >
                  Abort
                </button>
                <button
                  onClick={() => void handleTriggerKillSwitch()}
                  disabled={isTriggeringKill}
                  className="flex-1 rounded-xl border border-rose-300/30 bg-rose-700/45 py-3 text-sm font-semibold text-rose-50 disabled:opacity-60"
                >
                  {isTriggeringKill ? 'Triggering...' : 'Confirm Override'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================
// MAIN ADMIN PANEL COMPONENT
// =============================================
export default function AdminPanel() {
  const { token: walletToken, walletAddress } = useAuth();
  const [adminToken, setAdminToken] = useState<string | null>(() => sessionStorage.getItem(ADMIN_AUTH_TOKEN_KEY));
  const [walletAdminAccessDenied, setWalletAdminAccessDenied] = useState(false);
  const [adminLinkedWallet, setAdminLinkedWallet] = useState<string | null>(null);
  const [adminLoginId, setAdminLoginId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [isLinkingWallet, setIsLinkingWallet] = useState(false);
  const [linkWalletError, setLinkWalletError] = useState<string | null>(null);
  const [linkWalletSuccess, setLinkWalletSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [plansData, setPlansData] = useState<Plan[]>([]);
  const previousOverflow = useRef<string | null>(null);
  const effectiveToken = adminToken || (walletAdminAccessDenied ? null : walletToken);

  // Whether the connected wallet needs to be linked (admin logged in via credentials, wallet not yet linked)
  const showLinkWalletBanner = !!adminToken && !!walletAddress && !adminLinkedWallet;

  const handleCredentialLogin = useCallback(async () => {
    if (!adminLoginId.trim() || !adminPassword.trim()) {
      setAdminLoginError('ID and password are required.');
      return;
    }

    setIsAdminLoggingIn(true);
    setAdminLoginError(null);
    try {
      const response = await adminApi.loginWithCredentials(adminLoginId.trim(), adminPassword);
      sessionStorage.setItem(ADMIN_AUTH_TOKEN_KEY, response.token);
      setAdminToken(response.token);
      setWalletAdminAccessDenied(false);
      setAdminLinkedWallet(response.admin.walletAddress ?? null);
      setAdminPassword('');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAdminLoginError('Invalid credentials. Please try again.');
      } else {
        setAdminLoginError(err instanceof Error ? err.message : 'Admin login failed');
      }
    } finally {
      setIsAdminLoggingIn(false);
    }
  }, [adminLoginId, adminPassword]);

  const handleLinkWallet = useCallback(async () => {
    if (!adminToken || !walletAddress) return;
    setIsLinkingWallet(true);
    setLinkWalletError(null);
    setLinkWalletSuccess(null);
    try {
      const response = await adminApi.linkWallet(adminToken, walletAddress);
      setAdminLinkedWallet(response.admin.walletAddress ?? null);
      setLinkWalletSuccess('Wallet linked successfully!');
    } catch (err) {
      setLinkWalletError(err instanceof Error ? err.message : 'Failed to link wallet');
    } finally {
      setIsLinkingWallet(false);
    }
  }, [adminToken, walletAddress]);

  const clearCredentialSession = useCallback(() => {
    sessionStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
    setAdminToken(null);
    setWalletAdminAccessDenied(false);
    setAdminLinkedWallet(null);
  }, []);

  const handleWalletPermissionDenied = useCallback(() => {
    if (!adminToken && walletToken) {
      setWalletAdminAccessDenied(true);
    }
  }, [adminToken, walletToken]);

  const loadPlanEconomics = useCallback(async () => {
    try {
      const response = await systemApi.getPlanEconomics();
      setPlansData(response.economics.plans.map(mapEconomicsPlanToAdminPlan));
    } catch {
      setPlansData([]);
    }
  }, []);

  const restoreBodyOverflow = useCallback(() => {
    if (previousOverflow.current !== null) {
      document.body.style.overflow = previousOverflow.current;
      previousOverflow.current = null;
    }
  }, []);

  useEffect(() => {
    void loadPlanEconomics();
  }, [loadPlanEconomics]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      if (previousOverflow.current === null) {
        previousOverflow.current = document.body.style.overflow;
      }
      document.body.style.overflow = 'hidden';
      return () => {
        restoreBodyOverflow();
      };
    }

    restoreBodyOverflow();
  }, [mobileMenuOpen, restoreBodyOverflow]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview token={effectiveToken} onPermissionDenied={handleWalletPermissionDenied} />;
      case 'users':
        return <UsersManagement />;
      case 'plans':
        return <PlansManagement token={effectiveToken} plans={plansData} />;
      case 'pools':
        return <PoolsManagement token={effectiveToken} />;
      case 'flushouts':
        return <FlushoutsManagement token={effectiveToken} plans={plansData} />;
      case 'commissions':
        return <CommissionsManagement />;
      case 'gift-codes':
        return <GiftCodeManagement token={effectiveToken} />;
      case 'rewards':
        return <RewardsManagement token={effectiveToken} />;
      case 'daily-income':
        return <DailyIncomeManagement />;
      case 'security':
        return <SecurityLogs token={effectiveToken} />;
      case 'settings':
        return <Settings token={effectiveToken} />;
      default:
        return <DashboardOverview token={effectiveToken} onPermissionDenied={handleWalletPermissionDenied} />;
    }
  };

  if (!effectiveToken) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-slate-200 p-4 sm:p-6">
        <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-6 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Login</h1>
            <p className="text-sm text-slate-400">Sign in with requested credentials. Wallet-signature admin access remains supported as fallback.</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">ID</label>
              <input
                value={adminLoginId}
                onChange={(e) => setAdminLoginId(e.target.value)}
                placeholder="Admin ID"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none"
              />
            </div>
            {adminLoginError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{adminLoginError}</div>
            )}
            <button
              disabled={isAdminLoggingIn}
              onClick={() => void handleCredentialLogin()}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isAdminLoggingIn ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0a0a0f] text-slate-200">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 h-full w-full rounded-full bg-violet-500/5 blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 h-full w-full rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-xl px-4 py-3 lg:hidden">
        <button aria-label="Open admin menu" onClick={() => setMobileMenuOpen(true)} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
            <Crown className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-white">Admin Panel</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Main Content */}
      <main className={`min-h-screen transition-all duration-300 p-3 sm:p-4 lg:p-6 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {adminToken && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3">
              <p className="text-xs text-cyan-100">Credential-based admin session active. Wallet-signature auth remains available as fallback.</p>
              <button
                onClick={clearCredentialSession}
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Use Wallet Session
              </button>
            </div>
            {showLinkWalletBanner && (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3">
                <p className="text-xs text-violet-100">
                  Wallet detected: <span className="font-mono">{walletAddress?.slice(0, 6)}…{walletAddress?.slice(-4)}</span>. Link it to your admin profile to enable wallet-dependent features.
                </p>
                <button
                  disabled={isLinkingWallet}
                  onClick={() => void handleLinkWallet()}
                  className="rounded-lg border border-violet-400/40 bg-violet-500/20 px-3 py-1.5 text-xs font-semibold text-violet-100 disabled:opacity-60"
                >
                  {isLinkingWallet ? 'Linking…' : 'Link Wallet'}
                </button>
              </div>
            )}
            {linkWalletSuccess && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-200">{linkWalletSuccess}</div>
            )}
            {linkWalletError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-200">{linkWalletError}</div>
            )}
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
