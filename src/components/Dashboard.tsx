import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Users, TrendingUp, Share2, Clock, X, Download,
  BookOpen, Layers, User, Send, Gift, CheckCircle, ChevronRight, ChevronDown, ChevronUp,
  Info, AlertCircle, Flame, Crown, Gem, Award, Medal, Trophy, Network, RefreshCw,
  Repeat, BarChart3, Calendar, GraduationCap, Code2, Shield, Brain, Database, Server,
  MessageSquare, Copy, Menu, LayoutDashboard, Check, Zap
} from 'lucide-react';

// =============================================
// TYPES & INTERFACES
// =============================================
export interface TreeNode {
  name: string;
  wallet: string;
  level: number;
  children: TreeNode[];
}

export interface PlanData {
  level: number;
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

// =============================================
// PLANS DATA (6 PLANS)
// =============================================
export const plansData: PlanData[] = [
  {
    level: 1, name: 'Foundation', joiningFee: 5, teamSize: 5, uplineCommission: 1, systemFee: 0.50, levelCommission: 0.50, slotFee: 3, totalCollection: 15, memberProfit: 12, leaderPool: 1, rewardPool: 0, sponsorPool: 0, roi: 240, flushoutDays: 3,
    theme: { primary: '#fbbf24', secondary: '#f59e0b', glow: 'rgba(251, 191, 36, 0.5)', bgGlow: 'rgba(251, 191, 36, 0.15)', text: '#fef3c7' },
  },
  {
    level: 2, name: 'Pro Builder', joiningFee: 10, teamSize: 6, uplineCommission: 2, systemFee: 1, levelCommission: 1, slotFee: 6, totalCollection: 36, memberProfit: 30, leaderPool: 2, rewardPool: 2, sponsorPool: 0, roi: 300, flushoutDays: 8,
    theme: { primary: '#22d3ee', secondary: '#0ea5e9', glow: 'rgba(34, 211, 238, 0.5)', bgGlow: 'rgba(34, 211, 238, 0.15)', text: '#cffafe' },
  },
  {
    level: 3, name: 'Cyber Elite', joiningFee: 20, teamSize: 7, uplineCommission: 4, systemFee: 1, levelCommission: 2, slotFee: 13, totalCollection: 91, memberProfit: 80, leaderPool: 4, rewardPool: 3, sponsorPool: 0, roi: 400, flushoutDays: 16,
    theme: { primary: '#34d399', secondary: '#10b981', glow: 'rgba(52, 211, 153, 0.5)', bgGlow: 'rgba(52, 211, 153, 0.15)', text: '#d1fae5' },
  },
  {
    level: 4, name: 'AI Mastery', joiningFee: 40, teamSize: 8, uplineCommission: 7, systemFee: 1, levelCommission: 4, slotFee: 28, totalCollection: 224, memberProfit: 200, leaderPool: 8, rewardPool: 4, sponsorPool: 2, roi: 500, flushoutDays: 25,
    theme: { primary: '#e879f9', secondary: '#a855f7', glow: 'rgba(232, 121, 249, 0.5)', bgGlow: 'rgba(232, 121, 249, 0.15)', text: '#fae8ff' },
  },
  {
    level: 5, name: 'Quantum Leader', joiningFee: 80, teamSize: 8, uplineCommission: 14, systemFee: 2, levelCommission: 8, slotFee: 56, totalCollection: 448, memberProfit: 400, leaderPool: 16, rewardPool: 10, sponsorPool: 2, roi: 500, flushoutDays: 40,
    theme: { primary: '#f472b6', secondary: '#ec4899', glow: 'rgba(244, 114, 182, 0.5)', bgGlow: 'rgba(244, 114, 182, 0.15)', text: '#fce7f3' },
  },
  {
    level: 6, name: 'Supreme Visionary', joiningFee: 160, teamSize: 8, uplineCommission: 32, systemFee: 2, levelCommission: 16, slotFee: 110, totalCollection: 880, memberProfit: 800, leaderPool: 24, rewardPool: 12, sponsorPool: 4, roi: 500, flushoutDays: 60,
    theme: { primary: '#fb7185', secondary: '#f43f5e', glow: 'rgba(251, 113, 133, 0.5)', bgGlow: 'rgba(251, 113, 133, 0.15)', text: '#ffe4e6' },
  },
];

export const levelCommissions = [
  { level: 1, percentage: 4, label: 'Direct' },
  { level: 2, percentage: 2, label: 'L2' },
  { level: 3, percentage: 1, label: 'L3' },
  { level: 4, percentage: 1, label: 'L4' },
  { level: 5, percentage: 1, label: 'L5' },
  { level: 6, percentage: 0.5, label: 'L6' },
  { level: 7, percentage: 0.5, label: 'L7' },
];

export const skillLevels = [
  { level: 1, name: 'Foundation Explorer', title: 'Beginner', skills: ['HTML5 & CSS3', 'JavaScript Basics', 'Python Intro', 'Linux CLI', 'Git'], icon: BookOpen, theme: { primary: '#fbbf24', bgGlow: 'rgba(251, 191, 36, 0.15)' } },
  { level: 2, name: 'Frontend Craftsman', title: 'Intermediate', skills: ['React.js', 'Tailwind CSS', 'TypeScript', 'Responsive Design', 'APIs'], icon: Code2, theme: { primary: '#22d3ee', bgGlow: 'rgba(34, 211, 238, 0.15)' } },
  { level: 3, name: 'Backend Architect', title: 'Advanced', skills: ['Node.js', 'Database Design', 'REST APIs', 'Auth & Security', 'Cloud'], icon: Server, theme: { primary: '#34d399', bgGlow: 'rgba(52, 211, 153, 0.15)' } },
  { level: 4, name: 'Security Guardian', title: 'Expert', skills: ['Ethical Hacking', 'Network Security', 'Pen Testing', 'Web Security', 'Vuln Assessment'], icon: Shield, theme: { primary: '#e879f9', bgGlow: 'rgba(232, 121, 249, 0.15)' } },
  { level: 5, name: 'AI & ML Engineer', title: 'Master', skills: ['ML Algorithms', 'Deep Learning', 'Data Analysis', 'Neural Networks', 'AI Deployment'], icon: Brain, theme: { primary: '#f472b6', bgGlow: 'rgba(244, 114, 182, 0.15)' } },
  { level: 6, name: 'Blockchain Pioneer', title: 'Grandmaster', skills: ['Smart Contracts', 'Web3 & dApps', 'DeFi', 'NFTs', 'Layer 2'], icon: Database, theme: { primary: '#fb7185', bgGlow: 'rgba(251, 113, 133, 0.15)' } },
  { level: 7, name: 'Full-Stack Visionary', title: 'Legend', skills: ['System Architecture', 'DevOps', 'Microservices', 'Scalable Systems', 'Leadership'], icon: Crown, theme: { primary: '#a78bfa', bgGlow: 'rgba(167, 139, 250, 0.15)' } },
];

export const clubIncentives = [
  { id: 1, plan1Ids: 25, plan2Ids: 18, plan3Ids: 14, plan4Ids: 4, plan5Ids: 2, plan6Ids: 1, reward: 30, rank: 'Bronze' },
  { id: 2, plan1Ids: 50, plan2Ids: 36, plan3Ids: 28, plan4Ids: 8, plan5Ids: 4, plan6Ids: 2, reward: 70, rank: 'Silver' },
  { id: 3, plan1Ids: 75, plan2Ids: 54, plan3Ids: 42, plan4Ids: 12, plan5Ids: 6, plan6Ids: 3, reward: 110, rank: 'Gold' },
  { id: 4, plan1Ids: 100, plan2Ids: 72, plan3Ids: 56, plan4Ids: 16, plan5Ids: 8, plan6Ids: 4, reward: 200, rank: 'Platinum' },
];

export const individualIncentives = [
  { plan: 'Plan 1', target: 100, reward: 20 },
  { plan: 'Plan 2', target: 75, reward: 25 },
  { plan: 'Plan 3', target: 50, reward: 28 },
  { plan: 'Plan 4', target: 25, reward: 25 },
  { plan: 'Plan 5', target: 15, reward: 30 },
  { plan: 'Plan 6', target: 10, reward: 30 },
];

export const referralTree = {
  name: 'You', wallet: '0x1A4...B9F2', level: 0,
  children: [
    { name: 'User A', wallet: '0x7B2...F1A3', level: 1, children: [
      { name: 'User D', wallet: '0x3C1...E4B2', level: 2, children: [] },
      { name: 'User E', wallet: '0x9F8...D2C1', level: 2, children: [] },
    ]},
    { name: 'User B', wallet: '0x5E6...A8D4', level: 1, children: [{ name: 'User F', wallet: '0x2D7...C5E3', level: 2, children: [] }] },
    { name: 'User C', wallet: '0x8A3...B7F6', level: 1, children: [] },
  ],
};

export const recentTransactions = [
  { id: 1, type: 'Deposit', amount: '+$500.00', time: '2h ago' },
  { id: 2, type: 'Commission', amount: '+$24.50', time: '5h ago' },
  { id: 3, type: 'Withdrawal', amount: '-$200.00', time: '1d ago' },
  { id: 4, type: 'Referral', amount: '+$15.00', time: '2d ago' },
];


// =============================================
// MOBILE MENU DRAWER
// =============================================
const MobileMenuDrawer = ({ isOpen, onClose, activeTab, setActiveTab }: any) => {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'plans', label: 'Plans', icon: Layers },
    { id: 'network', label: 'Network', icon: Network },
    { id: 'rewards', label: 'Rewards', icon: Gift },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
          <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed left-0 top-0 z-50 h-full w-[280px] bg-[#0a0a0f] border-r border-white/10">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                  <Crown className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Dashboard</span>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-6 w-6" /></button>
            </div>
            {/* Wallet Info - Top */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3 rounded-xl bg-white/5 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">0x1A4...B9F2</p>
                  <p className="text-xs text-slate-400">$2,580.50</p>
                </div>
              </div>
            </div>
            <nav className="p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} onClick={() => { setActiveTab(item.id); onClose(); }} className={`flex w-full items-center gap-4 rounded-xl px-4 py-4 text-base font-medium transition-all ${activeTab === item.id ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
                    <Icon className="h-6 w-6" /><span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// =============================================
// TREE NODE ITEM
// =============================================
const TreeNodeItem = ({ node, depth = 0 }: any) => {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children.length > 0;
  return (
    <div className={depth > 0 ? 'ml-3 border-l border-white/10 pl-3 sm:ml-4 sm:pl-4' : ''}>
      <motion.button onClick={() => hasChildren && setExpanded(!expanded)} whileHover={{ x: 2 }} className="group flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-all hover:bg-white/[0.05] sm:gap-3 sm:px-3">
        {hasChildren ? (
          <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400" />
          </motion.div>
        ) : <div className="flex h-4 w-4 items-center justify-center"><div className="h-2 w-2 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500" /></div>}
        <div className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-xs font-bold ${depth === 0 ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25' : 'bg-white/10 text-slate-300 border border-white/10'}`}>
          {node.name[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs sm:text-sm font-medium text-slate-200">{node.name}</p>
          <p className="truncate font-mono text-[10px] text-slate-500">{node.wallet}</p>
        </div>
        {depth > 0 && <span className="ml-auto rounded-full border border-white/10 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">L{node.level}</span>}
      </motion.button>
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
            {node.children.map((child: any, i: number) => <TreeNodeItem key={i} node={child} depth={depth + 1} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// =============================================
// PLAN CARD
// =============================================
const PremiumPlanCard = ({ plan, index, onSelect }: any) => {
  const [showDetails, setShowDetails] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.4 }} className="group relative">
      <div className="absolute -inset-1 rounded-[1.5rem] sm:rounded-[2rem] opacity-40 blur-lg transition-all group-hover:opacity-70" style={{ background: `linear-gradient(135deg, ${plan.theme.glow}, transparent 60%)` }} />
      <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] border p-4 sm:p-6 backdrop-blur-xl" style={{ borderColor: `${plan.theme.primary}30`, background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 50%, rgba(0,0,0,0.2) 100%)', boxShadow: `0 8px 32px ${plan.theme.glow}15` }}>
        <div className="absolute inset-x-0 top-0 h-0.5 sm:h-1" style={{ background: `linear-gradient(90deg, transparent, ${plan.theme.primary}, ${plan.theme.secondary}, transparent)` }} />
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Plan {plan.level}</p>
            <h3 className="mt-0.5 text-lg sm:text-2xl font-bold text-white truncate">{plan.name}</h3>
            <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: plan.theme.bgGlow, color: plan.theme.text, border: `1px solid ${plan.theme.primary}40` }}><Users className="h-3 w-3" />{plan.teamSize} Team</span>
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"><TrendingUp className="h-3 w-3" />{plan.roi}% ROI</span>
            </div>
          </div>
          <div className="flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl" style={{ background: `linear-gradient(135deg, ${plan.theme.bgGlow}, transparent)`, border: `1px solid ${plan.theme.primary}40` }}>
            <Crown className="h-4 w-4 sm:h-6 sm:w-6" style={{ color: plan.theme.text }} />
          </div>
        </div>
        <div className="flex items-end gap-2 mb-4">
          <p className="text-3xl sm:text-5xl font-bold" style={{ color: plan.theme.text, textShadow: `0 0 20px ${plan.theme.glow}` }}>${plan.joiningFee}</p>
          <span className="pb-1 text-xs sm:text-sm text-slate-400">Joining Fee</span>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2.5"><p className="text-[9px] text-slate-500">Member Profit</p><p className="text-base font-bold" style={{ color: plan.theme.text }}>${plan.memberProfit}</p></div>
          <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2.5"><p className="text-[9px] text-slate-500">Flush Out</p><p className="text-base font-bold text-slate-200">{plan.flushoutDays} Days</p></div>
        </div>
        <button onClick={() => setShowDetails(!showDetails)} className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-xs font-semibold text-slate-400 hover:bg-white/[0.06]">
          {showDetails ? <><ChevronUp className="h-4 w-4" /> Hide</> : <><ChevronDown className="h-4 w-4" /> Details</>}
        </button>
        <AnimatePresence>
          {showDetails && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mb-3 space-y-1">
                <p className="text-[10px] text-slate-500">Fee Distribution</p>
                <div className="space-y-1">
                  <div className="flex justify-between rounded-lg bg-white/[0.02] px-2.5 py-1.5"><span className="text-xs text-slate-400">Upline</span><span className="text-xs font-semibold">${plan.uplineCommission}</span></div>
                  <div className="flex justify-between rounded-lg bg-white/[0.02] px-2.5 py-1.5"><span className="text-xs text-slate-400">System</span><span className="text-xs font-semibold">${plan.systemFee}</span></div>
                  <div className="flex justify-between rounded-lg bg-white/[0.02] px-2.5 py-1.5"><span className="text-xs text-slate-400">Level (10%)</span><span className="text-xs font-semibold">${plan.levelCommission}</span></div>
                </div>
              </div>
              <div className="mb-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <p className="mb-2 text-[10px] text-slate-500">Flushout Distribution</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-slate-400">Member Profit</span><span className="text-emerald-400">${plan.memberProfit}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Leader Pool</span><span className="text-amber-400">${plan.leaderPool}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Reward Pool</span><span className="text-purple-400">${plan.rewardPool}</span></div>
                  {plan.sponsorPool > 0 && <div className="flex justify-between"><span className="text-slate-400">Sponsor Pool</span><span className="text-cyan-400">${plan.sponsorPool}</span></div>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => onSelect?.(plan)} className="w-full rounded-xl py-3.5 text-sm font-bold" style={{ background: `linear-gradient(135deg, ${plan.theme.primary}, ${plan.theme.secondary})`, boxShadow: `0 4px 15px ${plan.theme.glow}` }}>
          <span className="flex items-center justify-center gap-2 text-slate-900"><ArrowDownLeft className="h-4 w-4" />Join ${plan.joiningFee}</span>
        </button>
      </div>
    </motion.div>
  );
};


// =============================================
// LEVEL COMMISSION CARD
// =============================================
const LevelCommissionCard = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-6 backdrop-blur-xl" style={{ borderColor: 'rgba(139,92,246,0.2)', background: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(168,85,247,0.03) 50%, rgba(0,0,0,0.2) 100%)' }}>
    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400" />
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(168,85,247,0.08))', border: '1px solid rgba(139,92,246,0.25)' }}>
        <Network className="h-5 w-5 sm:h-7 sm:w-7 text-violet-300" />
      </div>
      <div>
        <p className="text-[10px] text-violet-300">Multi-Level Commission</p>
        <h3 className="text-lg sm:text-2xl font-bold text-white">Level Commission</h3>
        <p className="text-xs text-slate-400">7 Levels • 10% Total</p>
      </div>
    </div>
    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
      {levelCommissions.map((c, i) => (
        <div key={i} className="relative rounded-lg border border-white/5 bg-white/[0.03] p-2 text-center">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-400 to-purple-400" />
          <p className="text-[9px] text-slate-500">L{c.level}</p>
          <p className="text-base sm:text-xl font-bold text-violet-300">{c.percentage}%</p>
        </div>
      ))}
    </div>
  </motion.div>
);

// =============================================
// SKILL LEVELS CARD
// =============================================
const SkillLevelsCard = () => {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-6 backdrop-blur-xl" style={{ borderColor: 'rgba(245,158,11,0.2)', background: 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(251,146,60,0.03) 50%, rgba(0,0,0,0.2) 100%)' }}>
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400" />
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,146,60,0.08))', border: '1px solid rgba(245,158,11,0.25)' }}>
          <GraduationCap className="h-5 w-5 sm:h-7 sm:w-7 text-amber-300" />
        </div>
        <div>
          <p className="text-[10px] text-amber-300">Skill Development</p>
          <h3 className="text-lg sm:text-2xl font-bold text-white">7 Skill Levels</h3>
          <p className="text-xs text-slate-400">Master Skills • Earn While You Learn</p>
        </div>
      </div>
      <div className="space-y-2">
        {skillLevels.map((level, i) => {
          const Icon = level.icon;
          const isSel = selected === level.level;
          return (
            <div key={i} onClick={() => setSelected(isSel ? null : level.level)} className={`cursor-pointer rounded-lg border p-3 transition-all ${isSel ? 'border-amber-500/30 bg-amber-500/8' : 'border-white/5 bg-white/[0.03]'}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `linear-gradient(135deg, ${level.theme.bgGlow}, transparent)`, border: `1px solid ${level.theme.primary}40` }}>
                  <Icon className="h-4 w-4" style={{ color: level.theme.primary }} />
                </div>
                <div className="flex-1">
                  <span className="text-[9px]" style={{ color: level.theme.primary }}>Level {level.level}</span>
                  <p className="text-sm font-semibold text-slate-200">{level.name}</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isSel ? 'rotate-180' : ''}`} />
              </div>
              <AnimatePresence>
                {isSel && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="mt-3 border-t border-white/5 pt-3">
                      <p className="mb-2 text-[10px] text-slate-500">Skills</p>
                      <div className="grid grid-cols-2 gap-1">
                        {level.skills.map((s, j) => <div key={j} className="flex items-center gap-2"><CheckCircle className="h-3 w-3" style={{ color: level.theme.primary }} /><span className="text-[10px] text-slate-300">{s}</span></div>)}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

// =============================================
// PLAN MATURITY CARD
// =============================================
const PlanMaturityCard = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-6 backdrop-blur-xl" style={{ borderColor: 'rgba(16,185,129,0.2)', background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(20,184,166,0.03) 50%, rgba(0,0,0,0.2) 100%)' }}>
    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(20,184,166,0.08))', border: '1px solid rgba(16,185,129,0.25)' }}>
        <RefreshCw className="h-5 w-5 sm:h-7 sm:w-7 text-emerald-300" />
      </div>
      <div>
        <p className="text-[10px] text-emerald-300">Plan Lifecycle</p>
        <h3 className="text-lg sm:text-2xl font-bold text-white">Plan Maturity & Rejoin</h3>
        <p className="text-xs text-slate-400">Individual Plans • Flexible Options</p>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2">
      {[{ icon: Layers, title: 'Individual Plans', desc: 'Each plan operates independently' }, { icon: Users, title: 'Slot Filling', desc: 'Plan matures when slots filled' }, { icon: Flame, title: 'Auto Flush Out', desc: 'Guaranteed system flushout' }, { icon: Repeat, title: 'Rejoin Anytime', desc: 'Upgrade, downgrade, rebuy' }].map((item, i) => (
        <div key={i} className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
            <item.icon className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-xs font-semibold text-slate-200">{item.title}</p>
          <p className="text-[9px] text-slate-400">{item.desc}</p>
        </div>
      ))}
    </div>
  </motion.div>
);

// =============================================
// COMING SOON CARD
// =============================================
const ComingSoonCard = ({ title, description, icon: Icon }: any) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-6 backdrop-blur-xl" style={{ borderColor: 'rgba(245,158,11,0.2)', background: 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(234,179,8,0.03) 50%, rgba(0,0,0,0.2) 100%)' }}>
    <div className="absolute right-3 top-3"><span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/12 px-2 py-1 text-[9px] font-bold text-amber-300"><TrendingUp className="h-2.5 w-2.5" />Coming Soon</span></div>
    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400" />
    <div className="mb-3 flex items-center gap-3">
      <div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(234,179,8,0.08))', border: '1px solid rgba(245,158,11,0.25)' }}>
        <Icon className="h-5 w-5 sm:h-7 sm:w-7 text-amber-300" />
      </div>
      <div className="pr-16">
        <h3 className="text-lg sm:text-2xl font-bold text-white">{title}</h3>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
    </div>
    <div className="rounded-lg border border-amber-500/10 bg-amber-500/5 p-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10"><Clock className="h-4 w-4 text-amber-400" /></div>
        <div><p className="text-xs text-amber-200">Stay Tuned</p><p className="text-[10px] text-slate-400">Feature under development</p></div>
      </div>
    </div>
  </motion.div>
);


// =============================================
// REWARDS CARD
// =============================================
const RewardsIncentivesCard = () => {
  const [tab, setTab] = useState<'club' | 'individual'>('club');
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-6 backdrop-blur-xl" style={{ borderColor: 'rgba(244,63,94,0.2)', background: 'linear-gradient(135deg, rgba(244,63,94,0.06) 0%, rgba(236,72,153,0.03) 50%, rgba(0,0,0,0.2) 100%)' }}>
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400" />
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.15), rgba(236,72,153,0.08))', border: '1px solid rgba(244,63,94,0.25)' }}>
          <Award className="h-5 w-5 sm:h-7 sm:w-7 text-rose-300" />
        </div>
        <div>
          <p className="text-[10px] text-rose-300">Monthly Rewards</p>
          <h3 className="text-lg sm:text-2xl font-bold text-white">Rewards & Incentives</h3>
          <p className="text-xs text-slate-400">Earn Extra Based on Performance</p>
        </div>
      </div>
      <div className="mb-4 flex gap-2">
        <button onClick={() => setTab('club')} className={`rounded-lg px-3 py-2 text-xs font-semibold ${tab === 'club' ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white' : 'text-slate-500'}`}>Club</button>
        <button onClick={() => setTab('individual')} className={`rounded-lg px-3 py-2 text-xs font-semibold ${tab === 'individual' ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white' : 'text-slate-500'}`}>Individual</button>
      </div>
      {tab === 'club' ? (
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full min-w-[400px]">
            <thead><tr className="border-b border-white/5"><th className="pb-2 text-left text-[9px] text-slate-500">Rank</th><th className="pb-2 text-center text-[9px] text-slate-500">P1</th><th className="pb-2 text-center text-[9px] text-slate-500">P2</th><th className="pb-2 text-center text-[9px] text-slate-500">P3</th><th className="pb-2 text-center text-[9px] text-slate-500">P4</th><th className="pb-2 text-center text-[9px] text-slate-500">P5</th><th className="pb-2 text-center text-[9px] text-slate-500">P6</th><th className="pb-2 text-right text-[9px] text-slate-500">Reward</th></tr></thead>
            <tbody>
              {clubIncentives.map((inc) => (
                <tr key={inc.id} className="border-b border-white/5">
                  <td className="py-2"><span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-300"><Medal className="h-2.5 w-2.5" />{inc.rank}</span></td>
                  <td className="py-2 text-center text-[10px] text-slate-300">{inc.plan1Ids}</td>
                  <td className="py-2 text-center text-[10px] text-slate-300">{inc.plan2Ids}</td>
                  <td className="py-2 text-center text-[10px] text-slate-300">{inc.plan3Ids}</td>
                  <td className="py-2 text-center text-[10px] text-slate-300">{inc.plan4Ids}</td>
                  <td className="py-2 text-center text-[10px] text-slate-300">{inc.plan5Ids}</td>
                  <td className="py-2 text-center text-[10px] text-slate-300">{inc.plan6Ids}</td>
                  <td className="py-2 text-right"><span className="text-sm font-bold text-emerald-400">${inc.reward}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {individualIncentives.map((inc, i) => (
            <div key={i} className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
              <p className="text-[9px] text-slate-500">{inc.plan}</p>
              <p className="text-xl font-bold text-white">{inc.target}</p>
              <p className="text-[10px] text-slate-400">Target IDs</p>
              <div className="mt-2 flex items-center gap-1"><Gift className="h-3.5 w-3.5 text-rose-400" /><span className="text-base font-bold text-emerald-400">${inc.reward}</span></div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// =============================================
// FLUSHOUT SCHEDULE CARD
// =============================================
const FlushoutScheduleCard = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-6 backdrop-blur-xl" style={{ borderColor: 'rgba(59,130,246,0.2)', background: 'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(99,102,241,0.03) 50%, rgba(0,0,0,0.2) 100%)' }}>
    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400" />
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.08))', border: '1px solid rgba(59,130,246,0.25)' }}>
        <Calendar className="h-5 w-5 sm:h-7 sm:w-7 text-blue-300" />
      </div>
      <div>
        <p className="text-[10px] text-blue-300">Guaranteed Flushout</p>
        <h3 className="text-lg sm:text-2xl font-bold text-white">Flushout Schedule</h3>
        <p className="text-xs text-slate-400">System-Guaranteed Maturity</p>
      </div>
    </div>
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {plansData.map((plan, i) => (
        <div key={i} className="relative rounded-lg border p-2.5 text-center" style={{ borderColor: `${plan.theme.primary}25`, background: `linear-gradient(135deg, ${plan.theme.bgGlow}30, rgba(0,0,0,0.1))` }}>
          <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${plan.theme.primary}, transparent)` }} />
          <p className="text-[9px]" style={{ color: plan.theme.primary }}>P{plan.level}</p>
          <p className="text-xl font-bold text-slate-200">{plan.flushoutDays}</p>
          <p className="text-[9px] text-slate-500">Days</p>
        </div>
      ))}
    </div>
    <div className="mt-4 rounded-lg border border-blue-500/15 bg-blue-500/8 p-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5" />
        <div><p className="text-xs text-blue-200">What is Guaranteed Flushout?</p><p className="text-[10px] text-slate-400">In case of no joining, system auto flushes ID per schedule.</p></div>
      </div>
    </div>
  </motion.div>
);

// =============================================
// POOL STATS CARD
// =============================================
const PoolStatsCard = () => {
  const stats = [
    { label: 'Leader Pool', value: '$2,180', subtext: 'Plan 1-6', icon: Crown, color: '#fbbf24' },
    { label: 'Reward Pool', value: '$1,450', subtext: 'Plan 1-6', icon: Gem, color: '#22d3ee' },
    { label: 'Sponsor Pool', value: '$320', subtext: 'Plan 4-6', icon: Award, color: '#34d399' },
    { label: 'Auto Fill', value: '142', subtext: 'Nodes', icon: Network, color: '#e879f9' },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-6 backdrop-blur-xl" style={{ borderColor: 'rgba(6,182,212,0.2)', background: 'linear-gradient(135deg, rgba(6,182,212,0.06) 0%, rgba(59,130,246,0.03) 50%, rgba(0,0,0,0.2) 100%)' }}>
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400" />
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(59,130,246,0.08))', border: '1px solid rgba(6,182,212,0.25)' }}>
          <BarChart3 className="h-5 w-5 sm:h-7 sm:w-7 text-cyan-300" />
        </div>
        <div>
          <p className="text-[10px] text-cyan-300">Live Statistics</p>
          <h3 className="text-lg sm:text-2xl font-bold text-white">Pool Statistics</h3>
          <p className="text-xs text-slate-400">Real-time Pool Balances</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="relative rounded-lg border border-white/5 bg-white/[0.03] p-3">
              <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${s.color}, transparent)` }} />
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${s.color}15` }}><Icon className="h-4 w-4" style={{ color: s.color }} /></div>
              <p className="text-[9px] text-slate-500">{s.label}</p>
              <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] text-slate-500">{s.subtext}</p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

// =============================================
// REFERRAL NETWORK CARD
// =============================================
const ReferralNetworkCard = () => {
  const [mode, setMode] = useState<'Level 1' | 'Downline'>('Level 1');
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-6 backdrop-blur-xl" style={{ borderColor: 'rgba(6,182,212,0.15)', background: 'linear-gradient(135deg, rgba(6,182,212,0.04) 0%, rgba(139,92,246,0.02) 50%, rgba(0,0,0,0.2) 100%)' }}>
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400" />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(139,92,246,0.08))', border: '1px solid rgba(6,182,212,0.25)' }}>
            <Users className="h-4 w-4 text-cyan-300" />
          </div>
          <div><h2 className="text-sm font-semibold text-slate-200">Referral Network</h2><p className="text-[10px] text-slate-500">Your downline tree</p></div>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] text-emerald-300"><span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex h-full w-full rounded-full bg-emerald-400"></span></span>Live</span>
      </div>
      <div className="mb-4">
        <div className="flex gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1 w-fit">
          <button onClick={() => setMode('Level 1')} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${mode === 'Level 1' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' : 'text-slate-500'}`}>Level 1</button>
          <button onClick={() => setMode('Downline')} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${mode === 'Downline' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' : 'text-slate-500'}`}>Full Tree</button>
        </div>
      </div>
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3"><TreeNodeItem node={referralTree} /></div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2 text-center"><p className="text-base font-bold text-cyan-300">6</p><p className="text-[9px] text-slate-500">Total</p></div>
        <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2 text-center"><p className="text-base font-bold text-violet-300">3</p><p className="text-[9px] text-slate-500">Level 1</p></div>
        <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2 text-center"><p className="text-base font-bold text-fuchsia-300">3</p><p className="text-[9px] text-slate-500">Level 2</p></div>
      </div>
    </motion.div>
  );
};


// =============================================
// WITHDRAWAL PAGE CONTENT
// =============================================
const WithdrawalPageContent = ({ balance }: { balance: number }) => {
  const [amount, setAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleWithdraw = () => {
    if (parseFloat(amount) > 0 && parseFloat(amount) <= balance) {
      setShowSuccess(true);
      setTimeout(() => { setShowSuccess(false); setAmount(''); }, 4000);
    }
  };

  if (showSuccess) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-12 gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/40">
          <Check className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white">Withdrawal Initiated!</h3>
        <p className="text-sm text-slate-300">${amount} will be credited instantly after blockchain reaches at height</p>
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />Processing on blockchain...
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="relative">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-emerald-500/30 blur-xl" />
        <div className="relative rounded-2xl border p-5 backdrop-blur-xl" style={{ borderColor: 'rgba(6,182,212,0.25)', background: 'linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(16,185,129,0.04) 50%, rgba(0,0,0,0.3) 100%)' }}>
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400" />
          <div className="mb-5">
            <label className="mb-2 block text-xs text-slate-400">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold text-slate-400">$</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-10 py-3.5 text-base font-semibold text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/40" />
              <button onClick={() => setAmount(balance.toString())}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-cyan-500/20 px-2.5 py-1 text-[10px] font-semibold text-cyan-300">MAX</button>
            </div>
          </div>
          <div className="mb-6 flex gap-2">
            {['10', '25', '50', '100'].map((amt) => <button key={amt} onClick={() => setAmount(amt)} className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-slate-400 hover:bg-white/10">${amt}</button>)}
          </div>
          <button onClick={handleWithdraw} disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-4 text-sm font-bold text-white disabled:opacity-50">
            <ArrowUpRight className="mr-2 inline h-4 w-4" />Confirm Withdrawal
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================
// REFER PAGE CONTENT
// =============================================
const ReferPageContent = () => {
  const code = 'EA2026REF';
  const link = 'https://app.example.com/ref/EA2026REF';
  const copyText = (text: string) => navigator.clipboard.writeText(text);

  return (
    <div className="max-w-lg mx-auto">
      <div className="relative">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-rose-500/30 blur-xl" />
        <div className="relative rounded-2xl border p-5 backdrop-blur-xl" style={{ borderColor: 'rgba(139,92,246,0.25)', background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(236,72,153,0.04) 50%, rgba(0,0,0,0.3) 100%)' }}>
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400" />
          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center"><p className="text-2xl font-bold text-purple-400">12</p><p className="text-[10px] text-slate-500">Total Referrals</p></div>
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center"><p className="text-2xl font-bold text-emerald-400">$245</p><p className="text-[10px] text-slate-500">Earnings</p></div>
          </div>
          <div className="mb-4">
            <label className="mb-2 block text-xs text-slate-400">Your Referral Code</label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-center"><span className="text-lg font-bold tracking-wider text-white">{code}</span></div>
              <button onClick={() => copyText(code)} className="flex items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 text-purple-300"><Copy className="h-5 w-5" /></button>
            </div>
          </div>
          <div className="mb-5">
            <label className="mb-2 block text-xs text-slate-400">Referral Link</label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3"><span className="text-xs text-slate-300 truncate block">{link}</span></div>
              <button onClick={() => copyText(link)} className="flex items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 text-purple-300"><Copy className="h-5 w-5" /></button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-xs text-slate-300"><MessageSquare className="h-4 w-4" />WhatsApp</button>
            <button className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-xs text-slate-300"><Send className="h-4 w-4" />Telegram</button>
            <button className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-xs text-slate-300"><Share2 className="h-4 w-4" />More</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================
// DETAILS PAGE CONTENT
// =============================================
const DetailsPageContent = () => (
  <div className="max-w-lg mx-auto">
    <div className="relative">
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500/30 via-yellow-500/30 to-orange-500/30 blur-xl" />
      <div className="relative rounded-2xl border p-5 backdrop-blur-xl" style={{ borderColor: 'rgba(245,158,11,0.25)', background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(234,179,8,0.04) 50%, rgba(0,0,0,0.3) 100%)' }}>
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400" />
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4"><p className="text-[10px] text-slate-500">Total Balance</p><p className="text-2xl font-bold text-emerald-400">$2,580</p></div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4"><p className="text-[10px] text-slate-500">Total Invested</p><p className="text-2xl font-bold text-white">$155</p></div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4"><p className="text-[10px] text-slate-500">Total Earned</p><p className="text-2xl font-bold text-emerald-400">$420</p></div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4"><p className="text-[10px] text-slate-500">Referrals</p><p className="text-2xl font-bold text-purple-400">12</p></div>
        </div>
        <div className="mb-5">
          <h4 className="mb-3 text-sm font-semibold text-white">Active Plans</h4>
          <div className="space-y-2">
            {[{ name: 'Foundation', invested: 5, profit: 12, color: '#fbbf24' }, { name: 'Pro Builder', invested: 10, profit: 30, color: '#22d3ee' }, { name: 'Cyber Elite', invested: 20, profit: 80, color: '#34d399' }].map((p, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full" style={{ background: p.color }} /><span className="text-sm text-slate-200">{p.name}</span></div>
                <div className="text-right"><span className="text-xs text-slate-400">${p.invested} → </span><span className="text-sm font-medium text-emerald-400">${p.profit}</span></div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white">Recent Activity</h4>
            <button 
              onClick={() => {
                const csv = 'Type,Amount,Time\n' + recentTransactions.map(tx => `${tx.type},${tx.amount},${tx.time}`).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'transactions.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-3 py-1.5 text-[10px] font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
            >
              <Download className="h-3 w-3" /> Export All
            </button>
          </div>
          <div className="space-y-2">
            {recentTransactions.slice(0, 3).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tx.type === 'Withdrawal' ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}>
                    {tx.type === 'Withdrawal' ? <ArrowUpRight className="h-4 w-4 text-rose-400" /> : <ArrowDownLeft className="h-4 w-4 text-emerald-400" />}
                  </div>
                  <div><p className="text-sm text-slate-200">{tx.type}</p><p className="text-[10px] text-slate-500">{tx.time}</p></div>
                </div>
                <span className={`text-sm font-medium ${tx.amount.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>{tx.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);


// =============================================
// MAIN DASHBOARD COMPONENT
// =============================================
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'network' | 'rewards'>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [subView, setSubView] = useState<'none' | 'details' | 'withdrawal' | 'refer'>('none');
  const balance = 2580.5;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none"><div className="absolute -top-1/2 -left-1/2 h-full w-full rounded-full bg-violet-500/5 blur-3xl" /><div className="absolute -bottom-1/2 -right-1/2 h-full w-full rounded-full bg-cyan-500/5 blur-3xl" /></div>
      
      {/* Mobile Menu */}
      <MobileMenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Header */}
      <nav className="sticky top-0 z-30 border-b border-white/5 bg-[#0a0a0f]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-3 sm:px-4">
          <div className="flex h-14 items-center justify-between">
            <button onClick={() => setMenuOpen(true)} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10">
              <Menu className="h-5 w-5" /><span className="hidden sm:inline">Menu</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600"><Crown className="h-4 w-4 text-white" /></div>
              <span className="text-base font-bold text-white">Dashboard</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
              <Wallet className="h-4 w-4 text-cyan-400" /><span className="text-xs font-semibold">${balance.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-7xl px-3 py-4 sm:px-4">
        {subView !== 'none' ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <button onClick={() => setSubView('none')} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-400 transition hover:bg-white/20 hover:text-white">
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                {subView === 'details' && <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500"><Info className="h-5 w-5 text-white" /></div>}
                {subView === 'withdrawal' && <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30"><ArrowUpRight className="h-5 w-5 text-white" /></div>}
                {subView === 'refer' && <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500"><Share2 className="h-5 w-5 text-white" /></div>}
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {subView === 'details' && 'Account Details'}
                    {subView === 'withdrawal' && 'Withdraw'}
                    {subView === 'refer' && 'Refer & Earn'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {subView === 'details' && 'Your portfolio'}
                    {subView === 'withdrawal' && `Available: $${balance.toLocaleString()}`}
                    {subView === 'refer' && 'Share with friends'}
                  </p>
                </div>
              </div>
            </div>

            {subView === 'details' && <DetailsPageContent />}
            {subView === 'withdrawal' && <WithdrawalPageContent balance={balance} />}
            {subView === 'refer' && <ReferPageContent />}
          </motion.div>
        ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div>
                <h1 className="text-xl font-bold text-white">Welcome Back!</h1>
                <p className="text-xs text-slate-400">Here's your dashboard overview</p>
              </div>
              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setSubView('details')} className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-3 text-xs text-slate-300 hover:bg-white/10"><Info className="h-5 w-5 text-amber-400" /><span>Details</span></button>
                <button onClick={() => setSubView('withdrawal')} className="flex flex-col items-center gap-1.5 rounded-xl border border-blue-600/30 bg-blue-900/40 py-3 text-xs text-slate-300 hover:bg-blue-800/50"><ArrowUpRight className="h-5 w-5 text-cyan-400" /><span>Withdrawal</span></button>
                <button onClick={() => setSubView('refer')} className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-3 text-xs text-slate-300 hover:bg-white/10"><Share2 className="h-5 w-5 text-purple-400" /><span>Refer</span></button>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <PoolStatsCard />
                <ReferralNetworkCard />
              </div>
              <LevelCommissionCard />
              <PlanMaturityCard />
              <SkillLevelsCard />
              <ComingSoonCard title="Daily Income Plan" description="Earn Daily Rewards Based on Your Activity" icon={TrendingUp} />
            </motion.div>
          )}

          {activeTab === 'plans' && (
            <motion.div key="plans" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div><h1 className="text-xl font-bold text-white">Investment Plans</h1><p className="text-xs text-slate-400">Choose a plan that fits your goals</p></div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{plansData.map((plan, i) => <PremiumPlanCard key={plan.level} plan={plan} index={i} />)}</div>
              <FlushoutScheduleCard />
            </motion.div>
          )}

          {activeTab === 'network' && (
            <motion.div key="network" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div><h1 className="text-xl font-bold text-white">Your Network</h1><p className="text-xs text-slate-400">Track your referral tree and commissions</p></div>
              <ReferralNetworkCard />
              <LevelCommissionCard />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[{ label: 'Direct Referrals', value: '12', color: '#22d3ee' }, { label: 'Total Team', value: '48', color: '#34d399' }, { label: 'Active Plans', value: '6', color: '#fbbf24' }, { label: 'Total Earnings', value: '$3,240', color: '#e879f9' }].map((s, i) => (
                  <div key={i} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                    <p className="text-[9px] text-slate-500">{s.label}</p>
                    <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
              <ReferPageContent />
            </motion.div>
          )}

          {activeTab === 'rewards' && (
            <motion.div key="rewards" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div><h1 className="text-xl font-bold text-white">Rewards & Incentives</h1><p className="text-xs text-slate-400">Earn extra rewards for your performance</p></div>
              <RewardsIncentivesCard />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[{ name: 'Bronze', icon: Medal, achieved: true, color: '#cd7f32' }, { name: 'Silver', icon: Award, achieved: true, color: '#c0c0c0' }, { name: 'Gold', icon: Trophy, achieved: false, color: '#ffd700' }, { name: 'Platinum', icon: Crown, achieved: false, color: '#e5e4e2' }].map((b, i) => {
                  const Icon = b.icon;
                  return (
                    <div key={i} className={`rounded-xl border p-3 text-center ${b.achieved ? 'border-white/10 bg-white/[0.05]' : 'border-white/5 bg-white/[0.02] opacity-50'}`}>
                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: b.achieved ? `${b.color}20` : 'rgba(255,255,255,0.05)' }}>
                        <Icon className="h-5 w-5" style={{ color: b.achieved ? b.color : '#64748b' }} />
                      </div>
                      <p className="text-xs font-semibold text-slate-200">{b.name}</p>
                      {b.achieved && <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] text-emerald-400"><Check className="h-2.5 w-2.5" />Achieved</span>}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
