import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Share2, Clock, TrendingUp,
  Shield, Users, Zap, X, Loader2, CheckCircle2, Copy
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

/* ── Withdraw Modal ─────────────────────────────────────────── */
const WithdrawModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'confirm' | 'done'>('input');

  const handleConfirm = () => {
    setStep('confirm');
    setTimeout(() => setStep('done'), 2000);
  };

  const reset = () => { setAmount(''); setStep('input'); onClose(); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={reset}
        >
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="glass-strong rounded-2xl p-6 w-full max-w-md border border-border/30 relative"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={reset} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>

            {step === 'input' && (
              <>
                <h3 className="text-lg font-bold text-foreground mb-1">Withdraw Funds</h3>
                <p className="text-xs text-muted-foreground mb-5">Available: $12,840.00</p>
                <label className="text-xs text-muted-foreground mb-1.5 block">Amount (USD)</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                  className="w-full bg-secondary/60 border border-border/30 rounded-xl px-4 py-3 text-foreground text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4" />
                <div className="flex gap-2 mb-5">
                  {[100, 500, 1000].map(v => (
                    <button key={v} onClick={() => setAmount(String(v))}
                      className="flex-1 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors">
                      ${v}
                    </button>
                  ))}
                </div>
                <button onClick={handleConfirm} disabled={!amount || Number(amount) <= 0}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-40 transition-all hover:opacity-90">
                  Confirm Withdrawal
                </button>
              </>
            )}

            {step === 'confirm' && (
              <div className="flex flex-col items-center py-8 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Processing withdrawal of <span className="text-foreground font-bold">${amount}</span>…</p>
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2 }}
                    className="h-full bg-primary rounded-full" />
                </div>
              </div>
            )}

            {step === 'done' && (
              <div className="flex flex-col items-center py-8 gap-3">
                <CheckCircle2 className="w-12 h-12 text-neon-green" />
                <p className="text-foreground font-bold">Withdrawal Submitted</p>
                <p className="text-xs text-muted-foreground">${amount} will arrive in 1-3 business days.</p>
                <button onClick={reset} className="mt-4 px-6 py-2 rounded-xl bg-primary/10 text-primary text-sm font-bold">Done</button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ── Referral Tree (SVG data-node visualization) ──────────── */
const TreeViz: React.FC = () => {
  const nodes = [
    { id: 'you', x: 350, y: 40, filled: true, label: 'You' },
    { id: 'n1', x: 80, y: 140, filled: true, label: 'N-01' },
    { id: 'n2', x: 195, y: 140, filled: true, label: 'N-02' },
    { id: 'n3', x: 310, y: 140, filled: true, label: 'N-03' },
    { id: 'n4', x: 425, y: 140, filled: false, label: 'N-04' },
    { id: 'n5', x: 505, y: 140, filled: true, label: 'N-05' },
    { id: 'n6', x: 580, y: 140, filled: false, label: 'N-06' },
    { id: 'n7', x: 660, y: 140, filled: false, label: 'N-07' },
  ];

  return (
    <svg viewBox="0 0 740 200" className="w-full h-auto">
      {/* Lines from center node to children */}
      {nodes.slice(1).map(n => (
        <line key={n.id} x1={350} y1={65} x2={n.x} y2={n.y - 20}
          className="stroke-primary/20" strokeWidth={1.5} strokeDasharray={n.filled ? '0' : '6 4'} />
      ))}
      {/* Nodes */}
      {nodes.map(n => (
        <g key={n.id}>
          {n.id === 'you' ? (
            <>
              <circle cx={n.x} cy={n.y + 12} r={24} fill="hsl(var(--secondary))"
                style={{ filter: 'drop-shadow(0 0 15px rgba(143,0,255,0.4))' }} />
              <circle cx={n.x} cy={n.y + 12} r={24} fill="none" className="stroke-primary" strokeWidth={2} />
            </>
          ) : n.filled ? (
            <rect x={n.x - 28} y={n.y - 16} width={56} height={40} rx={10}
              fill="hsl(270 20% 18%)" className="stroke-primary/30" strokeWidth={1} />
          ) : (
            <rect x={n.x - 28} y={n.y - 16} width={56} height={40} rx={10}
              fill="transparent" className="stroke-primary/30" strokeWidth={1} strokeDasharray="5 3" />
          )}
          <text x={n.x} y={n.id === 'you' ? n.y + 17 : n.y + 8} textAnchor="middle"
            className={`text-[11px] font-semibold ${n.id === 'you' ? 'fill-primary' : 'fill-muted-foreground'}`}>
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
};

/* ── Ledger Table ─────────────────────────────────────────── */
const ledgerData = [
  { pool: 'Leader Pool', amount: '$2,180.00', status: 'Distributed', hash: '0xa3f...12b4' },
  { pool: 'Reward Pool', amount: '$1,450.00', status: 'Distributed', hash: '0xb7e...89c1' },
  { pool: 'Daily Income', amount: '$86.50', status: 'Pending', hash: '—' },
  { pool: 'Auto-Fill Reserve', amount: '$320.00', status: 'Distributed', hash: '0xd2c...44f8' },
];

/* ── Main Component ──────────────────────────────────────── */
const ReferralEngine: React.FC = () => {
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
      <div className="p-4 sm:p-6 max-w-6xl mx-auto flex flex-col gap-5">

        {/* Row 1: Wallet Management */}
        <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}
          className="glass-strong rounded-2xl p-5 sm:p-7 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/8 rounded-full blur-[80px] pointer-events-none" />
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-5 h-5 text-primary" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em]">User Funds</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-0.5">Live Wallet Balance</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">$12,840<span className="text-base text-muted-foreground">.00</span></p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-0.5">Total Matrix Earnings</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-neon-green tracking-tight">$4,892<span className="text-base text-muted-foreground/60">.50</span></p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 sm:gap-3 w-full">
              <button className="bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 min-h-[48px] w-full">
                <ArrowDownLeft className="w-4 h-4 shrink-0" /> Deposit
              </button>
              <button onClick={() => setWithdrawOpen(true)}
                className="bg-primary text-primary-foreground py-3 px-4 rounded-xl font-bold text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2 min-h-[48px] w-full">
                <ArrowUpRight className="w-4 h-4 shrink-0" /> Withdraw
              </button>
              <button className="bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-400 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 min-h-[48px] w-full">
                <Share2 className="w-4 h-4 shrink-0" /> Refer
              </button>
              <button className="bg-secondary/60 hover:bg-secondary/80 border border-border/30 text-muted-foreground py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 min-h-[48px] w-full">
                <Clock className="w-4 h-4 shrink-0" /> History
              </button>
            </div>
          </div>
        </motion.div>

        {/* Row 2: 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Shield, label: 'Active Level', value: 'Plan 3', sub: 'Pro', color: 'text-primary' },
            { icon: Clock, label: 'Next Flushout', value: '12d 04:30', sub: 'Remaining', color: 'text-accent' },
            { icon: Users, label: 'Total Referrals', value: '14', sub: 'Active', color: 'text-cyan-400' },
            { icon: Zap, label: 'Daily Income', value: 'Active', sub: '1.5x / 2.0x Limit', color: 'text-neon-green', progress: 75 },
          ].map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div key={kpi.label} initial="hidden" animate="visible" custom={1 + i * 0.3} variants={fadeUp}
                className="glass rounded-2xl p-4 border border-border/20 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{kpi.label}</span>
                </div>
                <p className={`text-xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground">{kpi.sub}</p>
                {kpi.progress && (
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-auto">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${kpi.progress}%` }} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Row 3: Referral Tree Visualization */}
        <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp}
          className="glass rounded-2xl p-4 sm:p-6 border border-border/20">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Referral Tree
            </h2>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[hsl(270,20%,18%)] border border-primary/30" /> Filled</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded border border-dashed border-primary/30" /> Pending</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <TreeViz />
            </div>
          </div>
        </motion.div>

        {/* Row 4: Flushout Distribution Ledger */}
        <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp}
          className="glass rounded-2xl p-4 sm:p-6 border border-border/20">
          <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Flushout Distribution Ledger
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead>
                <tr className="border-b border-border/20 text-muted-foreground">
                  <th className="pb-2 font-semibold">Distribution Pool</th>
                  <th className="pb-2 font-semibold">Allocation</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {ledgerData.map((row, i) => (
                  <tr key={i} className="border-b border-border/10 last:border-0">
                    <td className="py-3 font-semibold text-foreground whitespace-nowrap">{row.pool}</td>
                    <td className="py-3 text-foreground">{row.amount}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.status === 'Distributed' ? 'bg-neon-green/10 text-neon-green' : 'bg-accent/10 text-accent'
                      }`}>{row.status}</span>
                    </td>
                    <td className="py-3 font-mono text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                      {row.hash}
                      {row.hash !== '—' && <Copy className="w-3 h-3 cursor-pointer hover:text-primary transition-colors" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} />
    </div>
  );
};

export default ReferralEngine;
