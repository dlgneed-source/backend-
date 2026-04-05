import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertOctagon, Ban, Briefcase, ChevronRight, Copy, Gift, Radio, RefreshCw,
  Search, Send, Shield, TrendingUp, Wallet, Zap, Users, LayoutDashboard,
  Layers, Award, Crown, Gem, Network, ArrowUpRight, ArrowDownLeft, X,
  Check, Clock, AlertCircle, Info, Filter, Download, MoreHorizontal,
  Settings as SettingsIcon, LogOut, Bell, MessageSquare, FileText, BarChart3, PieChart,
  Activity, Target, Percent, Calendar, Lock, Unlock, Eye, EyeOff,
  Trash2, Edit, Plus, Minus, ChevronDown, ChevronUp, ExternalLink,
  Hash, UserPlus, UserCheck, UserX, Repeat, Flame, Star, Trophy,
  Medal, Sparkles, Timer, CreditCard, History, Globe, Server,
  Database, ShieldCheck, Verified, BadgeCheck, CircleDollarSign,
  TrendingDown, ArrowLeft, ArrowRight, Home, Menu, XCircle, CheckCircle,
  AlertTriangle, HelpCircle, BookOpen, Code2, Cpu, Brain, Terminal,
  Monitor, Smartphone, Tablet, Laptop, MousePointer, Keyboard, ChevronLeft
} from 'lucide-react';

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
  activeUsers: number;
  maturedUsers: number;
  totalRevenue: number;
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
  name: string;
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

interface WithdrawalRequest {
  id: number;
  userId: string;
  wallet: string;
  amount: number;
  status: RequestStatus;
  requestedAt: string;
  processedAt?: string;
  txHash?: string;
}

interface FlushoutRecord {
  id: number;
  userId: string;
  wallet: string;
  planId: number;
  planName: string;
  amount: number;
  flushedAt: string;
  type: 'Auto' | 'Manual';
}

interface CommissionRecord {
  id: number;
  fromUser: string;
  toUser: string;
  amount: number;
  level: number;
  planId: number;
  createdAt: string;
}

interface SecurityLog {
  id: number;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  severity: 'Info' | 'Warning' | 'Critical';
}

interface KIMILevel {
  level: number;
  name: string;
  usersCount: number;
  totalEarnings: number;
}

// =============================================
// PLANS DATA (6 PLANS)
// =============================================

const plansData: Plan[] = [
  {
    id: 1,
    name: 'Foundation',
    joiningFee: 5,
    teamSize: 5,
    uplineCommission: 1,
    systemFee: 0.50,
    levelCommission: 0.50,
    slotFee: 3,
    totalCollection: 15,
    memberProfit: 12,
    leaderPool: 1,
    rewardPool: 0,
    sponsorPool: 0,
    roi: 240,
    flushoutDays: 3,
    activeUsers: 1245,
    maturedUsers: 892,
    totalRevenue: 18675,
    theme: { primary: '#fbbf24', secondary: '#f59e0b', glow: 'rgba(251, 191, 36, 0.5)', bgGlow: 'rgba(251, 191, 36, 0.15)', text: '#fef3c7' },
  },
  {
    id: 2,
    name: 'Pro Builder',
    joiningFee: 10,
    teamSize: 6,
    uplineCommission: 2,
    systemFee: 1,
    levelCommission: 1,
    slotFee: 6,
    totalCollection: 36,
    memberProfit: 30,
    leaderPool: 2,
    rewardPool: 2,
    sponsorPool: 0,
    roi: 300,
    flushoutDays: 8,
    activeUsers: 892,
    maturedUsers: 654,
    totalRevenue: 32112,
    theme: { primary: '#22d3ee', secondary: '#0ea5e9', glow: 'rgba(34, 211, 238, 0.5)', bgGlow: 'rgba(34, 211, 238, 0.15)', text: '#cffafe' },
  },
  {
    id: 3,
    name: 'Cyber Elite',
    joiningFee: 20,
    teamSize: 7,
    uplineCommission: 4,
    systemFee: 1,
    levelCommission: 2,
    slotFee: 13,
    totalCollection: 91,
    memberProfit: 80,
    leaderPool: 4,
    rewardPool: 3,
    sponsorPool: 0,
    roi: 400,
    flushoutDays: 16,
    activeUsers: 567,
    maturedUsers: 423,
    totalRevenue: 51597,
    theme: { primary: '#34d399', secondary: '#10b981', glow: 'rgba(52, 211, 153, 0.5)', bgGlow: 'rgba(52, 211, 153, 0.15)', text: '#d1fae5' },
  },
  {
    id: 4,
    name: 'AI Mastery',
    joiningFee: 40,
    teamSize: 8,
    uplineCommission: 7,
    systemFee: 1,
    levelCommission: 4,
    slotFee: 28,
    totalCollection: 224,
    memberProfit: 200,
    leaderPool: 8,
    rewardPool: 4,
    sponsorPool: 2,
    roi: 500,
    flushoutDays: 25,
    activeUsers: 345,
    maturedUsers: 278,
    totalRevenue: 77280,
    theme: { primary: '#e879f9', secondary: '#a855f7', glow: 'rgba(232, 121, 249, 0.5)', bgGlow: 'rgba(232, 121, 249, 0.15)', text: '#fae8ff' },
  },
  {
    id: 5,
    name: 'Quantum Leader',
    joiningFee: 80,
    teamSize: 8,
    uplineCommission: 14,
    systemFee: 2,
    levelCommission: 8,
    slotFee: 56,
    totalCollection: 448,
    memberProfit: 400,
    leaderPool: 16,
    rewardPool: 10,
    sponsorPool: 2,
    roi: 500,
    flushoutDays: 40,
    activeUsers: 189,
    maturedUsers: 156,
    totalRevenue: 84672,
    theme: { primary: '#f472b6', secondary: '#ec4899', glow: 'rgba(244, 114, 182, 0.5)', bgGlow: 'rgba(244, 114, 182, 0.15)', text: '#fce7f3' },
  },
  {
    id: 6,
    name: 'Supreme Visionary',
    joiningFee: 160,
    teamSize: 8,
    uplineCommission: 32,
    systemFee: 2,
    levelCommission: 16,
    slotFee: 110,
    totalCollection: 880,
    memberProfit: 800,
    leaderPool: 24,
    rewardPool: 12,
    sponsorPool: 4,
    roi: 500,
    flushoutDays: 60,
    activeUsers: 98,
    maturedUsers: 87,
    totalRevenue: 86240,
    theme: { primary: '#fb7185', secondary: '#f43f5e', glow: 'rgba(251, 113, 133, 0.5)', bgGlow: 'rgba(251, 113, 133, 0.15)', text: '#ffe4e6' },
  },
];

// =============================================
// USERS DATA
// =============================================

const usersData: User[] = [
  { id: 'USR001', wallet: '0x7B2...F1A3', name: 'John Doe', email: 'john@example.com', status: 'Active', joinedAt: '2026-01-15', totalInvested: 155, totalEarned: 420, balance: 265, activePlans: [1, 2, 3], referralCount: 12, teamSize: 45, kimiLevel: 3, lastActive: '2 min ago' },
  { id: 'USR002', wallet: '0x5E6...A8D4', name: 'Jane Smith', email: 'jane@example.com', status: 'Active', joinedAt: '2026-01-20', totalInvested: 80, totalEarned: 180, balance: 100, activePlans: [1, 2], referralCount: 8, teamSize: 23, kimiLevel: 2, lastActive: '5 min ago' },
  { id: 'USR003', wallet: '0x8A3...B7F6', name: 'Mike Johnson', email: 'mike@example.com', status: 'Suspended', joinedAt: '2026-02-01', totalInvested: 40, totalEarned: 45, balance: 5, activePlans: [1], referralCount: 3, teamSize: 8, kimiLevel: 1, lastActive: '2 days ago' },
  { id: 'USR004', wallet: '0x3C1...E4B2', name: 'Sarah Williams', email: 'sarah@example.com', status: 'Active', joinedAt: '2026-02-10', totalInvested: 320, totalEarned: 850, balance: 530, activePlans: [1, 2, 3, 4], referralCount: 25, teamSize: 89, kimiLevel: 4, lastActive: 'Just now' },
  { id: 'USR005', wallet: '0x9F8...D2C1', name: 'David Brown', email: 'david@example.com', status: 'Active', joinedAt: '2026-02-15', totalInvested: 200, totalEarned: 380, balance: 180, activePlans: [2, 3], referralCount: 15, teamSize: 52, kimiLevel: 3, lastActive: '1 hour ago' },
];

// =============================================
// POOLS DATA
// =============================================

const poolsData: Pool[] = [
  { id: 'SYS-1', name: 'System Fund - Plan 1', planId: 1, balance: 12450, totalDistributed: 45600, type: 'System', theme: { primary: '#22d3ee', bg: 'bg-sky-500/10', border: 'border-sky-400/20' } },
  { id: 'LDR-1', name: 'Leader Pool - Plan 1', planId: 1, balance: 8920, totalDistributed: 23400, type: 'Leader', theme: { primary: '#fbbf24', bg: 'bg-amber-500/10', border: 'border-amber-400/20' } },
  { id: 'REW-1', name: 'Reward Pool - Plan 1', planId: 1, balance: 0, totalDistributed: 12400, type: 'Reward', theme: { primary: '#e879f9', bg: 'bg-purple-500/10', border: 'border-purple-400/20' } },
  { id: 'SYS-2', name: 'System Fund - Plan 2', planId: 2, balance: 18920, totalDistributed: 67800, type: 'System', theme: { primary: '#22d3ee', bg: 'bg-sky-500/10', border: 'border-sky-400/20' } },
  { id: 'LDR-2', name: 'Leader Pool - Plan 2', planId: 2, balance: 12450, totalDistributed: 35600, type: 'Leader', theme: { primary: '#fbbf24', bg: 'bg-amber-500/10', border: 'border-amber-400/20' } },
  { id: 'REW-2', name: 'Reward Pool - Plan 2', planId: 2, balance: 8920, totalDistributed: 18900, type: 'Reward', theme: { primary: '#e879f9', bg: 'bg-purple-500/10', border: 'border-purple-400/20' } },
  { id: 'SYS-3', name: 'System Fund - Plan 3', planId: 3, balance: 23400, totalDistributed: 89200, type: 'System', theme: { primary: '#22d3ee', bg: 'bg-sky-500/10', border: 'border-sky-400/20' } },
  { id: 'LDR-3', name: 'Leader Pool - Plan 3', planId: 3, balance: 18920, totalDistributed: 45600, type: 'Leader', theme: { primary: '#fbbf24', bg: 'bg-amber-500/10', border: 'border-amber-400/20' } },
  { id: 'REW-3', name: 'Reward Pool - Plan 3', planId: 3, balance: 12450, totalDistributed: 28900, type: 'Reward', theme: { primary: '#e879f9', bg: 'bg-purple-500/10', border: 'border-purple-400/20' } },
  { id: 'SYS-4', name: 'System Fund - Plan 4', planId: 4, balance: 34500, totalDistributed: 124000, type: 'System', theme: { primary: '#22d3ee', bg: 'bg-sky-500/10', border: 'border-sky-400/20' } },
  { id: 'LDR-4', name: 'Leader Pool - Plan 4', planId: 4, balance: 28900, totalDistributed: 67800, type: 'Leader', theme: { primary: '#fbbf24', bg: 'bg-amber-500/10', border: 'border-amber-400/20' } },
  { id: 'REW-4', name: 'Reward Pool - Plan 4', planId: 4, balance: 18920, totalDistributed: 35600, type: 'Reward', theme: { primary: '#e879f9', bg: 'bg-purple-500/10', border: 'border-purple-400/20' } },
  { id: 'SPN-4', name: 'Sponsor Pool - Plan 4', planId: 4, balance: 12450, totalDistributed: 18900, type: 'Sponsor', theme: { primary: '#34d399', bg: 'bg-emerald-500/10', border: 'border-emerald-400/20' } },
  { id: 'SYS-5', name: 'System Fund - Plan 5', planId: 5, balance: 45600, totalDistributed: 189000, type: 'System', theme: { primary: '#22d3ee', bg: 'bg-sky-500/10', border: 'border-sky-400/20' } },
  { id: 'LDR-5', name: 'Leader Pool - Plan 5', planId: 5, balance: 38900, totalDistributed: 89200, type: 'Leader', theme: { primary: '#fbbf24', bg: 'bg-amber-500/10', border: 'border-amber-400/20' } },
  { id: 'REW-5', name: 'Reward Pool - Plan 5', planId: 5, balance: 28900, totalDistributed: 45600, type: 'Reward', theme: { primary: '#e879f9', bg: 'bg-purple-500/10', border: 'border-purple-400/20' } },
  { id: 'SPN-5', name: 'Sponsor Pool - Plan 5', planId: 5, balance: 18920, totalDistributed: 23400, type: 'Sponsor', theme: { primary: '#34d399', bg: 'bg-emerald-500/10', border: 'border-emerald-400/20' } },
  { id: 'SYS-6', name: 'System Fund - Plan 6', planId: 6, balance: 67800, totalDistributed: 234000, type: 'System', theme: { primary: '#22d3ee', bg: 'bg-sky-500/10', border: 'border-sky-400/20' } },
  { id: 'LDR-6', name: 'Leader Pool - Plan 6', planId: 6, balance: 56700, totalDistributed: 124000, type: 'Leader', theme: { primary: '#fbbf24', bg: 'bg-amber-500/10', border: 'border-amber-400/20' } },
  { id: 'REW-6', name: 'Reward Pool - Plan 6', planId: 6, balance: 38900, totalDistributed: 67800, type: 'Reward', theme: { primary: '#e879f9', bg: 'bg-purple-500/10', border: 'border-purple-400/20' } },
  { id: 'SPN-6', name: 'Sponsor Pool - Plan 6', planId: 6, balance: 28900, totalDistributed: 35600, type: 'Sponsor', theme: { primary: '#34d399', bg: 'bg-emerald-500/10', border: 'border-emerald-400/20' } },
];

// =============================================
// WITHDRAWAL REQUESTS DATA
// =============================================

const withdrawalRequests: WithdrawalRequest[] = [
  { id: 1, userId: 'USR001', wallet: '0x7B2...F1A3', amount: 150, status: 'Pending', requestedAt: '2026-03-30 14:30:00' },
  { id: 2, userId: 'USR002', wallet: '0x5E6...A8D4', amount: 75, status: 'Approved', requestedAt: '2026-03-30 12:15:00', processedAt: '2026-03-30 13:00:00', txHash: '0xabc...def' },
  { id: 3, userId: 'USR004', wallet: '0x3C1...E4B2', amount: 300, status: 'Processing', requestedAt: '2026-03-30 10:00:00' },
  { id: 4, userId: 'USR005', wallet: '0x9F8...D2C1', amount: 100, status: 'Rejected', requestedAt: '2026-03-29 18:45:00', processedAt: '2026-03-29 19:30:00' },
  { id: 5, userId: 'USR001', wallet: '0x7B2...F1A3', amount: 50, status: 'Approved', requestedAt: '2026-03-28 09:00:00', processedAt: '2026-03-28 10:15:00', txHash: '0xdef...abc' },
];

// =============================================
// FLUSHOUT RECORDS DATA
// =============================================

const flushoutRecords: FlushoutRecord[] = [
  { id: 1, userId: 'USR001', wallet: '0x7B2...F1A3', planId: 1, planName: 'Foundation', amount: 12, flushedAt: '2026-03-30 10:00:00', type: 'Auto' },
  { id: 2, userId: 'USR002', wallet: '0x5E6...A8D4', planId: 1, planName: 'Foundation', amount: 12, flushedAt: '2026-03-29 15:30:00', type: 'Auto' },
  { id: 3, userId: 'USR004', wallet: '0x3C1...E4B2', planId: 2, planName: 'Pro Builder', amount: 30, flushedAt: '2026-03-28 12:00:00', type: 'Manual' },
  { id: 4, userId: 'USR005', wallet: '0x9F8...D2C1', planId: 3, planName: 'Cyber Elite', amount: 80, flushedAt: '2026-03-27 09:00:00', type: 'Auto' },
  { id: 5, userId: 'USR001', wallet: '0x7B2...F1A3', planId: 2, planName: 'Pro Builder', amount: 30, flushedAt: '2026-03-26 18:00:00', type: 'Auto' },
];

// =============================================
// COMMISSION RECORDS DATA
// =============================================

const commissionRecords: CommissionRecord[] = [
  { id: 1, fromUser: '0x8A3...B7F6', toUser: '0x7B2...F1A3', amount: 0.20, level: 1, planId: 1, createdAt: '2026-03-30 14:00:00' },
  { id: 2, fromUser: '0x2D7...C5E3', toUser: '0x7B2...F1A3', amount: 0.12, level: 2, planId: 1, createdAt: '2026-03-30 13:30:00' },
  { id: 3, fromUser: '0x5E6...A8D4', toUser: '0x3C1...E4B2', amount: 0.40, level: 1, planId: 2, createdAt: '2026-03-30 12:00:00' },
  { id: 4, fromUser: '0x9F8...D2C1', toUser: '0x3C1...E4B2', amount: 0.80, level: 1, planId: 3, createdAt: '2026-03-30 10:00:00' },
  { id: 5, fromUser: '0x7B2...F1A3', toUser: '0x5E6...A8D4', amount: 0.20, level: 1, planId: 1, createdAt: '2026-03-29 16:00:00' },
];

// =============================================
// SECURITY LOGS DATA
// =============================================

const securityLogs: SecurityLog[] = [
  { id: 1, timestamp: '2026-03-30 14:32:01', action: 'CONTRACT_CALL', user: '0xA1b3...7d2F', details: 'Leader Pool distribution +$5.00', severity: 'Info' },
  { id: 2, timestamp: '2026-03-30 14:31:58', action: 'AUTH_LOGIN', user: '0xA1b3...7d2F', details: 'POST /api/auth - 200 OK', severity: 'Info' },
  { id: 3, timestamp: '2026-03-30 14:31:45', action: 'WITHDRAWAL_REQUEST', user: '0x71Aa...b08C', details: 'Withdrawal request $150 - Pending', severity: 'Info' },
  { id: 4, timestamp: '2026-03-30 14:31:30', action: 'ACCESS_DENIED', user: '0xD4e9...1f3A', details: 'GET /api/tree - 403 Forbidden', severity: 'Warning' },
  { id: 5, timestamp: '2026-03-30 14:30:00', action: 'USER_BLOCKED', user: '0x8A3...B7F6', details: 'User account suspended by admin', severity: 'Critical' },
];

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
    { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpRight },
    { id: 'flushouts', label: 'Flushouts', icon: Flame },
    { id: 'commissions', label: 'Commissions', icon: Percent },
    
    { id: 'rewards', label: 'Rewards', icon: Gift },
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
          <button onClick={() => { onMobileClose(); setCollapsed(!collapsed); }} className="text-slate-400 hover:text-white hidden lg:block">
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
          <button onClick={onMobileClose} className="text-slate-400 hover:text-white lg:hidden">
            <X className="h-5 w-5" />
          </button>
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
function DashboardOverview() {
  const stats = [
    { icon: Users, label: 'Total Users', value: '3,336', subtext: '+124 this week', tone: 'bg-indigo-500/15', trend: { value: '+12.5%', positive: true } },
    { icon: Wallet, label: 'Total Balance', value: '$1,248,392', subtext: 'Across all pools', tone: 'bg-emerald-500/15', trend: { value: '+8.2%', positive: true } },
    { icon: ArrowUpRight, label: 'Total Withdrawals', value: '$456,789', subtext: 'This month', tone: 'bg-sky-500/15', trend: { value: '+15.3%', positive: true } },
    { icon: Flame, label: 'Total Flushouts', value: '2,847', subtext: 'Auto + Manual', tone: 'bg-amber-500/15', trend: { value: '+5.7%', positive: true } },
  ];

  const planStats = plansData.map(plan => ({
    name: plan.name,
    active: plan.activeUsers,
    matured: plan.maturedUsers,
    revenue: plan.totalRevenue,
    color: plan.theme.primary,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-sm text-slate-400">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-300 hover:bg-white/10">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Last 30 Days</span>
            <span className="sm:hidden">30d</span>
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-2 text-xs sm:text-sm font-medium text-white">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Plans Overview */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Plans Performance</h3>
            <p className="text-sm text-slate-400">Active and matured users by plan</p>
          </div>
          <button className="text-sm text-cyan-400 hover:text-cyan-300">View All</button>
        </div>
        <div className="space-y-4">
          {planStats.map((plan, index) => (
            <div key={index} className="flex items-center gap-2 sm:gap-4">
              <div className="w-20 sm:w-32 text-xs sm:text-sm font-medium text-slate-300 truncate">{plan.name}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(plan.active / (plan.active + plan.matured)) * 100}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: plan.color }}
                    />
                  </div>
                  <span className="w-12 sm:w-16 text-right text-[10px] sm:text-xs text-slate-400">{plan.active}</span>
                </div>
              </div>
              <div className="w-16 sm:w-24 text-right text-xs sm:text-sm font-medium text-emerald-400">${plan.revenue.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Withdrawals */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Recent Withdrawals</h3>
            <button className="text-sm text-cyan-400 hover:text-cyan-300">View All</button>
          </div>
          <div className="space-y-3">
            {withdrawalRequests.slice(0, 5).map((req) => (
              <div key={req.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-2.5 sm:p-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${statusStyle(req.status).split(' ')[1]}`}>
                    <Wallet className={`h-4 w-4 ${statusStyle(req.status).split(' ')[0]}`} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-200 truncate max-w-[100px] sm:max-w-none">{req.wallet}</p>
                    <p className="text-[10px] text-slate-500 hidden sm:block">{req.requestedAt}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">${req.amount}</p>
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusStyle(req.status)}`}>
                    {req.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Flushouts */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Recent Flushouts</h3>
            <button className="text-sm text-cyan-400 hover:text-cyan-300">View All</button>
          </div>
          <div className="space-y-3">
            {flushoutRecords.slice(0, 5).map((record) => (
              <div key={record.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-2.5 sm:p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                    <Flame className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-200 truncate max-w-[100px] sm:max-w-none">{record.wallet}</p>
                    <p className="text-[10px] text-slate-500">{record.planName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-400">+${record.amount}</p>
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${record.type === 'Auto' ? 'text-sky-200 bg-sky-500/10 border-sky-400/20' : 'text-violet-200 bg-violet-500/10 border-violet-400/20'}`}>
                    {record.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
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
function PlansManagement() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Plans Management</h1>
        <p className="text-sm text-slate-400">View and manage all investment plans</p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {plansData.map((plan) => (
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
                <p className="text-[10px] text-slate-500">Joining Fee</p>
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
                <p className="text-[10px] text-slate-500">Flushout</p>
                <p className="text-lg font-bold text-white">{plan.flushoutDays}d</p>
              </div>
            </div>

            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Active Users</span>
                <span className="font-medium text-white">{plan.activeUsers}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Matured Users</span>
                <span className="font-medium text-emerald-400">{plan.maturedUsers}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Total Revenue</span>
                <span className="font-medium" style={{ color: plan.theme.primary }}>${plan.totalRevenue.toLocaleString()}</span>
              </div>
            </div>

            <button 
              onClick={() => setSelectedPlan(plan)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              View Details
            </button>
          </motion.div>
        ))}
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
                  <p className="text-xs text-slate-500">Joining Fee</p>
                  <p className="text-xl font-bold text-white">${selectedPlan.joiningFee}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                  <p className="text-xs text-slate-500">Slot Fee</p>
                  <p className="text-xl font-bold text-white">${selectedPlan.slotFee}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                  <p className="text-xs text-slate-500">Member Profit</p>
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
                    <p className="text-[10px] text-slate-500">System</p>
                    <p className="text-lg font-bold text-white">${selectedPlan.systemFee}</p>
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
function PoolsManagement() {
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);

  const systemPools = poolsData.filter(p => p.type === 'System');
  const leaderPools = poolsData.filter(p => p.type === 'Leader');
  const rewardPools = poolsData.filter(p => p.type === 'Reward');
  const sponsorPools = poolsData.filter(p => p.type === 'Sponsor');

  const PoolCard = ({ pool }: { pool: Pool }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group rounded-xl border p-4 transition-all hover:-translate-y-1"
      style={{ 
        borderColor: pool.theme.border, 
        background: `linear-gradient(135deg, ${pool.theme.bg}40, transparent)` 
      }}
    >
      <div className="mb-3 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${pool.theme.bg}`}>
          <Database className={`h-5 w-5`} style={{ color: pool.theme.primary }} />
        </div>
        <div>
          <p className="text-xs text-slate-400">{pool.name}</p>
          <p className="font-mono text-xl font-semibold text-white">${pool.balance.toLocaleString()}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">Total Distributed</span>
        <span className="font-medium text-emerald-400">${pool.totalDistributed.toLocaleString()}</span>
      </div>
      <div className="mt-3 flex gap-2">
        <button 
          onClick={() => setSelectedPool(pool)}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-medium text-slate-300 hover:bg-white/10"
        >
          Withdraw
        </button>
        <button className="flex-1 rounded-lg border border-cyan-500/20 bg-cyan-500/10 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-500/15">
          Details
        </button>
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
          <p className="text-[10px] sm:text-xs text-slate-500">Total Pool Balance</p>
          <p className="font-mono text-lg sm:text-xl font-bold text-emerald-400">$425,890</p>
        </div>
      </div>

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

      {/* Withdraw Modal */}
      <AnimatePresence>
        {selectedPool && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setSelectedPool(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0f] p-6"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Withdraw from Pool</h3>
                <button onClick={() => setSelectedPool(null)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-4 rounded-xl border border-white/5 bg-white/[0.03] p-4">
                <p className="text-xs text-slate-500">Pool</p>
                <p className="text-sm font-medium text-white">{selectedPool.name}</p>
                <p className="mt-2 text-xs text-slate-500">Available Balance</p>
                <p className="text-2xl font-bold text-emerald-400">${selectedPool.balance.toLocaleString()}</p>
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-xs text-slate-500">Amount to Withdraw</label>
                <input
                  type="number"
                  placeholder="Enter amount..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/30"
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedPool(null)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-slate-300 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-3 text-sm font-medium text-white">
                  Withdraw
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
// WITHDRAWALS MANAGEMENT COMPONENT
// =============================================
function WithdrawalsManagement() {
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'All'>('All');

  const filteredRequests = withdrawalRequests.filter(req => 
    statusFilter === 'All' || req.status === statusFilter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Withdrawal Requests</h1>
          <p className="text-sm text-slate-400">Manage and process withdrawal requests</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 sm:px-4 py-2">
            <p className="text-[10px] sm:text-xs text-amber-400">Pending</p>
            <p className="font-mono text-lg sm:text-xl font-bold text-amber-300">12</p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 sm:px-4 py-2">
            <p className="text-[10px] sm:text-xs text-emerald-400">Approved</p>
            <p className="font-mono text-lg sm:text-xl font-bold text-emerald-300">$4,250</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as RequestStatus | 'All')}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
        >
          <option value="All" className="bg-[#0a0a0f]">All Status</option>
          <option value="Pending" className="bg-[#0a0a0f]">Pending</option>
          <option value="Processing" className="bg-[#0a0a0f]">Processing</option>
          <option value="Approved" className="bg-[#0a0a0f]">Approved</option>
          <option value="Rejected" className="bg-[#0a0a0f]">Rejected</option>
        </select>
      </div>

      {/* Requests Table */}
      <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] min-w-[650px]">
        <table className="w-full">
          <thead className="bg-white/[0.03]">
            <tr className="border-b border-white/10">
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">ID</th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">User</th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Amount</th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Status</th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Requested</th>
              <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((req) => (
              <tr key={req.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                <td className="px-6 py-4 font-mono text-sm text-slate-300">#{req.id}</td>
                <td className="px-6 py-4 font-mono text-sm text-slate-300">{req.wallet}</td>
                <td className="px-6 py-4 text-sm font-semibold text-white">${req.amount}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${statusStyle(req.status)}`}>
                    {req.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">{req.requestedAt}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {req.status === 'Pending' && (
                      <>
                        <button className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20">
                          Approve
                        </button>
                        <button className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20">
                          Reject
                        </button>
                      </>
                    )}
                    {req.status === 'Processing' && (
                      <button className="rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-400 hover:bg-sky-500/20">
                        Complete
                      </button>
                    )}
                    {req.txHash && (
                      <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/10">
                        <ExternalLink className="h-3 w-3" />
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
    </div>
  );
}

// =============================================
// FLUSHOUTS MANAGEMENT COMPONENT
// =============================================
function FlushoutsManagement() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Flushout Management</h1>
          <p className="text-sm text-slate-400">Track and manage plan flushouts</p>
        </div>
        <button className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-300 hover:bg-amber-500/20 w-full sm:w-auto">
          <Flame className="h-4 w-4" />
          Manual Flushout
        </button>
      </div>

      {/* Flushout Schedule */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Flushout Schedule</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {plansData.map((plan) => (
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
              {flushoutRecords.map((record) => (
                <tr key={record.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                  <td className="px-4 sm:px-6 py-4 font-mono text-sm text-slate-300">#{record.id}</td>
                  <td className="px-4 sm:px-6 py-4 font-mono text-sm text-slate-300">{record.wallet}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-slate-300">{record.planName}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-emerald-400">+${record.amount}</td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${
                      record.type === 'Auto' 
                        ? 'text-sky-200 bg-sky-500/10 border-sky-400/20' 
                        : 'text-violet-200 bg-violet-500/10 border-violet-400/20'
                    }`}>
                      {record.type}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-slate-400">{record.flushedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =============================================
// COMMISSIONS MANAGEMENT COMPONENT
// =============================================
function CommissionsManagement() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Commission Distribution</h1>
          <p className="text-sm text-slate-400">Track multi-level commission payouts</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 sm:px-4 py-2">
          <p className="text-[10px] sm:text-xs text-emerald-400">Total Distributed Today</p>
          <p className="font-mono text-lg sm:text-xl font-bold text-emerald-300">$1,245.50</p>
        </div>
      </div>

      {/* Level Commission Structure */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Level Commission Structure</h3>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {[
            { level: 1, percent: 4, label: 'Direct' },
            { level: 2, percent: 2, label: 'L2' },
            { level: 3, percent: 1, label: 'L3' },
            { level: 4, percent: 1, label: 'L4' },
            { level: 5, percent: 1, label: 'L5' },
            { level: 6, percent: 0.5, label: 'L6' },
            { level: 7, percent: 0.5, label: 'L7' },
          ].map((lvl) => (
            <div key={lvl.level} className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 text-center">
              <p className="text-[10px] text-violet-400">{lvl.label}</p>
              <p className="text-xl font-bold text-violet-300">{lvl.percent}%</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">Total: 10% distributed across 7 levels</p>
      </div>

      {/* Commission Records */}
      <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] min-w-[700px]">
          <div className="border-b border-white/10 px-4 sm:px-6 py-4">
            <h3 className="text-lg font-semibold text-white">Recent Commissions</h3>
          </div>
          <table className="w-full">
            <thead className="bg-white/[0.03]">
              <tr className="border-b border-white/10">
                <th className="px-4 sm:px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">ID</th>
                <th className="px-4 sm:px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">From</th>
                <th className="px-4 sm:px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">To</th>
                <th className="px-4 sm:px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Level</th>
                <th className="px-4 sm:px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Plan</th>
                <th className="px-4 sm:px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Amount</th>
                <th className="px-4 sm:px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {commissionRecords.map((record) => (
                <tr key={record.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                  <td className="px-4 sm:px-6 py-4 font-mono text-sm text-slate-300">#{record.id}</td>
                  <td className="px-4 sm:px-6 py-4 font-mono text-sm text-slate-300">{record.fromUser}</td>
                  <td className="px-4 sm:px-6 py-4 font-mono text-sm text-slate-300">{record.toUser}</td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className="inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-300">
                      L{record.level}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-slate-300">Plan {record.planId}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-emerald-400">+${record.amount}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-slate-400">{record.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
// REWARDS MANAGEMENT COMPONENT
// =============================================
function RewardsManagement() {
  const [activeTab, setActiveTab] = useState<'club' | 'individual'>('club');

  const clubIncentives = [
    { id: 1, plan1: 25, plan2: 18, plan3: 14, plan4: 4, plan5: 2, plan6: 1, reward: 30, rank: 'Bronze Club' },
    { id: 2, plan1: 50, plan2: 36, plan3: 28, plan4: 8, plan5: 4, plan6: 2, reward: 70, rank: 'Silver Club' },
    { id: 3, plan1: 75, plan2: 54, plan3: 42, plan4: 12, plan5: 6, plan6: 3, reward: 110, rank: 'Gold Club' },
    { id: 4, plan1: 100, plan2: 72, plan3: 56, plan4: 16, plan5: 8, plan6: 4, reward: 200, rank: 'Platinum Club' },
  ];

  const individualIncentives = [
    { plan: 'Plan 1', target: 100, reward: 20 },
    { plan: 'Plan 2', target: 75, reward: 25 },
    { plan: 'Plan 3', target: 50, reward: 28 },
    { plan: 'Plan 4', target: 25, reward: 25 },
    { plan: 'Plan 5', target: 15, reward: 30 },
    { plan: 'Plan 6', target: 10, reward: 30 },
  ];

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
          <p className="font-mono text-base sm:text-lg font-bold text-amber-300">March 30, 2026</p>
        </div>
      </div>

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
                    <span className="text-lg font-bold text-emerald-400">${incentive.reward}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Individual Incentives */}
      {activeTab === 'individual' && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {individualIncentives.map((incentive, index) => (
            <motion.div
              key={index}
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
                <span className="text-lg font-bold text-emerald-400">${incentive.reward}</span>
              </div>
            </motion.div>
          ))}
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
function SecurityLogs() {
  const [severityFilter, setSeverityFilter] = useState<'All' | 'Info' | 'Warning' | 'Critical'>('All');

  const filteredLogs = securityLogs.filter(log => 
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
        <button className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 w-full sm:w-auto">
          <Download className="h-4 w-4" />
          Export Logs
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as any)}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
        >
          <option value="All" className="bg-[#0a0a0f]">All Severities</option>
          <option value="Info" className="bg-[#0a0a0f]">Info</option>
          <option value="Warning" className="bg-[#0a0a0f]">Warning</option>
          <option value="Critical" className="bg-[#0a0a0f]">Critical</option>
        </select>
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
            {filteredLogs.map((log) => (
              <tr key={log.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                <td className="px-6 py-4 font-mono text-sm text-slate-400">{log.timestamp}</td>
                <td className="px-6 py-4 text-sm font-medium text-white">{log.action}</td>
                <td className="px-6 py-4 font-mono text-sm text-slate-300">{log.user}</td>
                <td className="px-6 py-4 text-sm text-slate-300">{log.details}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${severityStyle(log.severity)}`}>
                    {log.severity}
                  </span>
                </td>
              </tr>
            ))}
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
function Settings() {
  const [killConfirm, setKillConfirm] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');

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
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={() => setBroadcastOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <Radio className="h-4 w-4" /> Global Broadcast
          </button>
          <button
            onClick={() => setKillConfirm(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-rose-300/30 bg-rose-700/35 px-4 py-4 text-sm font-semibold text-rose-50 transition hover:bg-rose-700/45"
          >
            <AlertOctagon className="h-4 w-4" /> KILL-SWITCH
          </button>
        </div>
      </div>

      {/* System Settings */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">System Configuration</h3>
        <div className="space-y-4">
          {[
            { label: 'Maintenance Mode', desc: 'Temporarily disable new registrations', enabled: false },
            { label: 'Auto Flushout', desc: 'Enable automatic plan flushouts', enabled: true },
            { label: 'Commission Distribution', desc: 'Auto-distribute level commissions', enabled: true },
            { label: 'Withdrawal Approval', desc: 'Require manual approval for withdrawals', enabled: true },
          ].map((setting, index) => (
            <div key={index} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-4">
              <div>
                <p className="text-sm font-medium text-white">{setting.label}</p>
                <p className="text-xs text-slate-500">{setting.desc}</p>
              </div>
              <button className={`h-6 w-11 rounded-full transition ${setting.enabled ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                <div className={`h-5 w-5 rounded-full bg-white transition ${setting.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
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
                This will instantly pause all operations, freeze actions, and lock the treasury.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => setKillConfirm(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white"
                >
                  Abort
                </button>
                <button
                  onClick={() => setKillConfirm(false)}
                  className="flex-1 rounded-xl border border-rose-300/30 bg-rose-700/45 py-3 text-sm font-semibold text-rose-50"
                >
                  Confirm Override
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Broadcast Modal */}
      <AnimatePresence>
        {broadcastOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setBroadcastOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0f] p-6"
            >
              <div className="mb-4 flex items-center gap-4 border-b border-white/10 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
                  <Radio className="h-6 w-6 text-slate-100" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Global Broadcast</h3>
                  <p className="text-sm text-slate-400">Push a message to all users</p>
                </div>
              </div>
              <textarea
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                placeholder="Type alert message to push to all users..."
                rows={4}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white placeholder:text-slate-500 outline-none"
              />
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => setBroadcastOpen(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setBroadcastOpen(false)}
                  className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-3 text-sm font-semibold text-white"
                >
                  <Send className="mr-2 inline h-4 w-4" /> Push Alert
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'users':
        return <UsersManagement />;
      case 'plans':
        return <PlansManagement />;
      case 'pools':
        return <PoolsManagement />;
      case 'withdrawals':
        return <WithdrawalsManagement />;
      case 'flushouts':
        return <FlushoutsManagement />;
      case 'commissions':
        return <CommissionsManagement />;
      case 'rewards':
        return <RewardsManagement />;
      case 'daily-income':
        return <DailyIncomeManagement />;
      case 'security':
        return <SecurityLogs />;
      case 'settings':
        return <Settings />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
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
        <button onClick={() => setMobileMenuOpen(true)} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
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
