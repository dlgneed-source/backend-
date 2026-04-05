import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, CheckCircle, Sparkles, Zap, Users, Gift, Target,
  TrendingUp, BellRing, Layers, ArrowDownLeft, TimerReset
} from 'lucide-react';
import { TreeNode, depositPlans, poolStats, planBadges, formatCountdown } from './DashboardData';

// ============================================
// COUNTDOWN PILL
// ============================================
export const CountdownPill: React.FC<{ label: string; targetDate: Date; compact?: boolean }> = ({
  label,
  targetDate,
  compact = false,
}) => {
  const [value, setValue] = useState('00:00:00');

  useEffect(() => {
    const tick = () => {
      setValue(formatCountdown(targetDate.getTime() - Date.now()));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [targetDate]);

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 ${
        compact ? 'px-2.5 py-1.5 text-[10px]' : 'px-3 py-2 text-xs'
      } font-semibold text-slate-200`}
    >
      <TimerReset className={compact ? 'h-3.5 w-3.5 text-cyan-300' : 'h-4 w-4 text-cyan-300'} />
      <span className="text-slate-400">{label}</span>
      <span className="font-mono text-slate-200">{value}</span>
    </div>
  );
};

// ============================================
// TREE NODE ITEM
// ============================================
export const TreeNodeItem: React.FC<{ node: TreeNode; depth?: number }> = ({ node, depth = 0 }) => {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children.length > 0;

  return (
    <div className={depth > 0 ? 'ml-4 border-l border-white/10 pl-3 sm:ml-6 sm:pl-4' : ''}>
      <motion.button
        onClick={() => hasChildren && setExpanded(!expanded)}
        whileHover={{ x: 4 }}
        className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-white/[0.05] sm:gap-3"
      >
        {hasChildren ? (
          <motion.div
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </motion.div>
        ) : (
          <div className="flex h-4 w-4 items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500" />
          </div>
        )}

        <motion.div
          whileHover={{ scale: 1.05 }}
          className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold ${
            depth === 0 
              ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25' 
              : 'bg-white/10 text-slate-300 border border-white/10'
          }`}
        >
          {node.name[0]}
        </motion.div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{node.name}</p>
          <p className="truncate font-mono text-[11px] text-slate-500">{node.wallet}</p>
        </div>

        {depth > 0 && (
          <span className="ml-auto rounded-full border border-white/10 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-2.5 py-1 text-[10px] font-semibold text-cyan-300">
            L{node.level}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {node.children.map((child, i) => (
              <TreeNodeItem key={i} node={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// PREMIUM PLAN CARD
// ============================================
export const PremiumPlanCard: React.FC<{ plan: typeof depositPlans[0]; index: number }> = ({ plan, index }) => {
  const PlanIcon = plan.icon;
  const { theme } = plan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="group relative"
    >
      <div 
        className="absolute -inset-1 rounded-[2.5rem] opacity-60 blur-xl transition-all duration-500 group-hover:opacity-100 group-hover:blur-2xl"
        style={{ background: `linear-gradient(135deg, ${theme.glow}, transparent 60%)` }}
      />
      
      <motion.div
        className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-40 blur-2xl"
        style={{ background: theme.bgGlow }}
        animate={{ y: [0, -15, 0], x: [0, 10, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full opacity-30 blur-3xl"
        style={{ background: theme.bgGlow }}
        animate={{ y: [0, 15, 0], x: [0, -10, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      <div 
        className="relative overflow-hidden rounded-[2rem] border p-6 backdrop-blur-xl transition-all duration-500 sm:p-7"
        style={{
          background: `linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 50%, rgba(0,0,0,0.2) 100%)`,
          borderColor: `${theme.primary}30`,
          boxShadow: `0 8px 32px ${theme.glow}20, inset 0 1px 0 rgba(255,255,255,0.1)`,
        }}
      >
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `linear-gradient(105deg, transparent 40%, ${theme.bgGlow} 50%, transparent 60%)` }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        />

        <div 
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: `linear-gradient(90deg, transparent, ${theme.primary}, ${theme.secondary}, transparent)` }}
        />

        <motion.div
          className="absolute right-6 top-6"
          animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Sparkles className="h-4 w-4 opacity-50" style={{ color: theme.primary }} />
        </motion.div>

        <div className="relative z-10">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <motion.div 
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  background: `linear-gradient(135deg, ${theme.bgGlow}, transparent)`,
                  boxShadow: `0 0 20px ${theme.glow}40, inset 0 1px 0 rgba(255,255,255,0.1)`,
                  border: `1px solid ${theme.primary}40`,
                }}
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <PlanIcon className="h-6 w-6" style={{ color: theme.text }} />
              </motion.div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Tier {plan.level}
                </p>
                <h3 className="mt-1 text-2xl font-bold tracking-tight text-white">
                  {plan.name}
                </h3>
                <p className="mt-2 max-w-[22rem] text-sm leading-6 text-slate-300/80">
                  {plan.subtitle}
                </p>
              </div>
            </div>

            <span 
              className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-sm"
              style={{
                borderColor: `${theme.primary}40`,
                background: `${theme.bgGlow}`,
                color: theme.text,
              }}
            >
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" /> Premium
              </span>
            </span>
          </div>

          <div className="flex items-end gap-2 mb-5">
            <motion.p 
              className="text-5xl font-bold tracking-tight"
              style={{ color: theme.text, textShadow: `0 0 30px ${theme.glow}` }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.15 + 0.3, duration: 0.4 }}
            >
              {plan.price}
            </motion.p>
            <span className="pb-2 text-sm font-medium text-slate-400">/mo</span>
          </div>

          {/* Bubbles */}
          <div className="mb-5 flex flex-wrap gap-2">
            {plan.bubbles.map((bubble, i) => {
              const BubbleIcon = bubble.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.15 + 0.4 + i * 0.1, type: 'spring', stiffness: 200 }}
                  whileHover={{ scale: 1.08, y: -2 }}
                  className="relative"
                >
                  <div className="absolute inset-0 rounded-full blur-md" style={{ background: `linear-gradient(135deg, ${theme.primary}30, transparent)` }} />
                  <div 
                    className="relative flex items-center gap-1.5 rounded-full px-3 py-1.5 backdrop-blur-md"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.08) 40%, rgba(200,230,255,0.1) 60%, rgba(255,255,255,0.05) 100%)',
                      boxShadow: `inset 0 1px 2px rgba(255,255,255,0.5), inset 0 -1px 2px rgba(0,0,0,0.1), 0 2px 8px ${theme.glow}30, 0 0 15px ${theme.glow}20`,
                      border: '1px solid rgba(255,255,255,0.3)',
                    }}
                  >
                    <div className="absolute -top-0.5 left-2 h-1.5 w-2 rounded-full" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.4) 50%, transparent 70%)' }} />
                    <div className="absolute bottom-0.5 right-2 h-0.5 w-1 rounded-full bg-white/50" />
                    <BubbleIcon className="h-3 w-3" style={{ color: theme.primary }} />
                    <span className="text-[11px] font-medium text-slate-100">{bubble.text}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Features */}
          <div className="mb-6 space-y-3">
            {plan.features.map((feature, i) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 + 0.6 + i * 0.1, duration: 0.3 }}
                className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3.5 backdrop-blur-sm transition-all duration-300 hover:border-white/10 hover:bg-white/[0.05]"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: `${theme.bgGlow}` }}>
                  <CheckCircle className="h-4 w-4" style={{ color: theme.primary }} />
                </div>
                <span className="text-sm font-medium text-slate-200">{feature}</span>
              </motion.div>
            ))}
          </div>

          {/* Deposit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group/btn relative mt-2 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 py-4 text-sm font-bold tracking-wide transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
              boxShadow: '0 4px 20px rgba(251, 191, 36, 0.4), 0 0 0 1px rgba(251, 191, 36, 0.3)',
            }}
          >
            <motion.div
              className="absolute inset-0 opacity-0 group-hover/btn:opacity-100"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            />
            <span className="relative z-10 flex items-center gap-2 text-slate-900">
              <ArrowDownLeft className="h-4 w-4" />
              Deposit {plan.price}
            </span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// PREMIUM POOL CARD
// ============================================
export const PremiumPoolCard: React.FC<{ stat: typeof poolStats[0]; index: number }> = ({ stat, index }) => {
  const Icon = stat.icon;
  const { theme } = stat;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden rounded-2xl"
    >
      <div 
        className="absolute -inset-0.5 rounded-2xl opacity-0 blur-lg transition-all duration-500 group-hover:opacity-60"
        style={{ background: `linear-gradient(135deg, ${theme.glow}, transparent 60%)` }}
      />
      
      <div 
        className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300"
        style={{
          background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.15) 100%)`,
          borderColor: `${theme.primary}20`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08)`,
        }}
      >
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-30 blur-2xl" style={{ background: theme.bgGlow }} />
        <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${theme.primary}60, transparent)` }} />

        <div className="relative z-10">
          <div className="mb-3 flex items-center justify-between">
            <motion.div 
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${theme.bgGlow}, transparent)`,
                border: `1px solid ${theme.primary}30`,
              }}
              whileHover={{ scale: 1.1, rotate: 10 }}
            >
              <Icon className="h-5 w-5" style={{ color: theme.primary }} />
            </motion.div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {stat.subtext}
            </span>
          </div>
          
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{stat.label}</p>
          
          <motion.p 
            className="text-3xl font-bold tracking-tight"
            style={{ color: theme.primary, textShadow: `0 0 20px ${theme.glow}` }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
          >
            {stat.value}
          </motion.p>

          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/5">
            <motion.div 
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${theme.primary}, ${theme.primary}80)` }}
              initial={{ width: 0 }}
              animate={{ width: `${60 + index * 10}%` }}
              transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// PREMIUM TIER BADGE
// ============================================
export const PremiumTierBadge: React.FC<{ plan: typeof planBadges[0] }> = ({ plan }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="group relative cursor-pointer"
    >
      <div 
        className={`absolute -inset-0.5 rounded-full blur-md transition-opacity duration-300 ${plan.active ? 'opacity-60' : 'opacity-0 group-hover:opacity-40'}`}
        style={{ background: plan.color }}
      />
      <div 
        className={`relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-all duration-300 ${
          plan.active ? '' : 'border-white/10 bg-white/[0.03] text-slate-500 hover:border-white/20 hover:bg-white/[0.06]'
        }`}
        style={plan.active ? {
          borderColor: `${plan.color}50`,
          background: `linear-gradient(135deg, ${plan.color}15, ${plan.color}05)`,
          color: plan.color,
          boxShadow: `0 0 20px ${plan.color}30`,
        } : {}}
      >
        {plan.active && (
          <motion.span 
            className="flex h-2 w-2 rounded-full"
            style={{ background: plan.color, boxShadow: `0 0 8px ${plan.color}` }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        <span>{plan.name}</span>
        <span className="text-[10px] opacity-70">{plan.price}</span>
      </div>
    </motion.div>
  );
};

// ============================================
// PREMIUM DAILY INCOME CARD
// ============================================
export const PremiumDailyIncomeCard: React.FC<{ isSubscribed: boolean; onSubscribe: () => void }> = ({ isSubscribed, onSubscribe }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group relative overflow-hidden rounded-3xl"
    >
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-blue-500/20 opacity-60 blur-xl" />
      
      <motion.div
        className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl"
        animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-cyan-500/15 blur-3xl"
        animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      <div 
        className="relative overflow-hidden rounded-3xl border p-6 backdrop-blur-xl sm:p-7"
        style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(6,182,212,0.05) 50%, rgba(0,0,0,0.2) 100%)',
          borderColor: 'rgba(16,185,129,0.25)',
          boxShadow: '0 8px 32px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400" />
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(16,185,129,0.1) 50%, transparent 60%)' }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
        />

        <div className="relative z-10">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div 
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.1))',
                  border: '1px solid rgba(16,185,129,0.3)',
                  boxShadow: '0 0 20px rgba(16,185,129,0.3)',
                }}
                whileHover={{ scale: 1.1, rotate: 10 }}
              >
                <Gift className="h-6 w-6 text-emerald-300" />
              </motion.div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Daily Income Plan</p>
                <p className="text-sm text-slate-400">$10 subscription • Midnight distribution</p>
              </div>
            </div>

            <motion.button
              onClick={onSubscribe}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isSubscribed}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
                isSubscribed 
                  ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300' 
                  : 'border-amber-500/30 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 shadow-[0_4px_20px_rgba(251,191,36,0.4)]'
              }`}
            >
              {isSubscribed ? (
                <><CheckCircle className="h-3.5 w-3.5" /> Active</>
              ) : (
                <><BellRing className="h-3.5 w-3.5" /> Subscribe $10</>
              )}
            </motion.button>
          </div>

          <div className={`grid grid-cols-2 gap-4 transition-all ${isSubscribed ? 'opacity-100' : 'opacity-50 grayscale'}`}>
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur-sm">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Today's Earning</p>
              <p className="text-3xl font-bold text-emerald-300">$86<span className="text-base text-emerald-300/60">.50</span></p>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-400/70">
                <TrendingUp className="h-3 w-3" />
                <span>+12.4% from yesterday</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur-sm">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Monthly Total</p>
              <p className="text-3xl font-bold text-slate-200">$2,595<span className="text-base text-slate-400">.00</span></p>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                <Target className="h-3 w-3" />
                <span>Target: $3,000</span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/5 bg-white/[0.03] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Monthly Progress</span>
              <span className="text-[10px] font-semibold text-emerald-300">86.5%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <motion.div 
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: '86.5%' }}
                transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-slate-400">
              <Layers className="h-3 w-3" /> Plan 1 excluded
            </span>
            <span className="flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-medium text-cyan-300">
              <Zap className="h-3 w-3" /> Plan 2+ eligible
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// PREMIUM REFERRAL CARD
// ============================================
export const PremiumReferralCard: React.FC<{ refMode: 'Level 1' | 'Downline'; setRefMode: (m: 'Level 1' | 'Downline') => void }> = ({ refMode, setRefMode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="group relative overflow-hidden rounded-3xl"
    >
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-500/15 via-violet-500/15 to-fuchsia-500/15 opacity-50 blur-xl" />
      
      <motion.div
        className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-500/12 blur-3xl"
        animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-violet-500/12 blur-3xl"
        animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      <div 
        className="relative overflow-hidden rounded-3xl border p-5 backdrop-blur-xl sm:p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(6,182,212,0.05) 0%, rgba(139,92,246,0.03) 50%, rgba(0,0,0,0.2) 100%)',
          borderColor: 'rgba(6,182,212,0.2)',
          boxShadow: '0 8px 32px rgba(6,182,212,0.1), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400" />
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(6,182,212,0.08) 50%, transparent 60%)' }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
        />

        <div className="relative z-10 mb-5 flex flex-col gap-4 border-b border-white/5 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.1))',
                border: '1px solid rgba(6,182,212,0.3)',
                boxShadow: '0 0 20px rgba(6,182,212,0.25)',
              }}
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <Users className="h-5 w-5 text-cyan-300" />
            </motion.div>
            <div>
              <h2 className="text-base font-semibold text-slate-200">Referral Network</h2>
              <p className="text-xs text-slate-500">Your downline tree structure</p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
            </span>
            Live Updates
          </span>
        </div>

        <div className="relative z-10 mb-5">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1 w-fit">
            <button
              onClick={() => setRefMode('Level 1')}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                refMode === 'Level 1' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Level 1
            </button>
            <button
              onClick={() => setRefMode('Downline')}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                refMode === 'Downline' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Full Tree
            </button>
          </div>
        </div>

        <div className="relative z-10 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <TreeNodeItem node={
            {
              name: 'You',
              wallet: '0x1A4...B9F2',
              level: 0,
              children: [
                {
                  name: 'User A',
                  wallet: '0x7B2...F1A3',
                  level: 1,
                  children: [
                    { name: 'User D', wallet: '0x3C1...E4B2', level: 2, children: [] },
                    { name: 'User E', wallet: '0x9F8...D2C1', level: 2, children: [] },
                  ],
                },
                {
                  name: 'User B',
                  wallet: '0x5E6...A8D4',
                  level: 1,
                  children: [{ name: 'User F', wallet: '0x2D7...C5E3', level: 2, children: [] }],
                },
                {
                  name: 'User C',
                  wallet: '0x8A3...B7F6',
                  level: 1,
                  children: [],
                },
              ],
            }
          } />
        </div>

        <div className="relative z-10 mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
            <p className="text-lg font-bold text-cyan-300">6</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Total</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
            <p className="text-lg font-bold text-violet-300">3</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Level 1</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
            <p className="text-lg font-bold text-fuchsia-300">3</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Level 2</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
