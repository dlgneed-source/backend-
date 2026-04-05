import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight, X, Check, Rocket, User, Wallet2, Bot, Zap, Send
} from 'lucide-react';

// ============================================
// WITHDRAWAL MODAL
// ============================================
export const WithdrawalModal: React.FC<{ isOpen: boolean; onClose: () => void; balance: number }> = ({ 
  isOpen, onClose, balance 
}) => {
  const [amount, setAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleWithdraw = () => {
    if (parseFloat(amount) > 0 && parseFloat(amount) <= balance) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setAmount('');
        onClose();
      }, 4000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-500/40 via-cyan-500/40 to-emerald-500/40 blur-xl" />
            <div 
              className="relative overflow-hidden rounded-3xl border p-6 backdrop-blur-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(16,185,129,0.05) 50%, rgba(0,0,0,0.3) 100%)',
                borderColor: 'rgba(6,182,212,0.3)',
                boxShadow: '0 8px 32px rgba(6,182,212,0.2)',
              }}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400" />

              {showSuccess ? (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/40"
                  >
                    <Check className="h-10 w-10 text-white" />
                  </motion.div>
                  <h3 className="mb-2 text-xl font-bold text-white">Withdrawal Initiated!</h3>
                  <p className="text-sm text-slate-300">${amount} will be credited instantly after blockchain reaches at height</p>
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-emerald-400">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    Processing on blockchain...
                  </div>
                </motion.div>
              ) : (
                <>
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30">
                        <ArrowUpRight className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Withdraw</h3>
                        <p className="text-xs text-slate-400">Available: ${balance.toLocaleString()}</p>
                      </div>
                    </div>
                    <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-400 transition hover:bg-white/20 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">Enter Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">$</span>
                      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-10 py-4 text-2xl font-bold text-white placeholder-slate-600 outline-none transition focus:border-cyan-500/50 focus:bg-white/10"
                      />
                      <button onClick={() => setAmount(balance.toString())}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/30"
                      >
                        MAX
                      </button>
                    </div>
                  </div>

                  <div className="mb-6 flex gap-2">
                    {['100', '500', '1000', '2500'].map((amt) => (
                      <button key={amt} onClick={() => setAmount(amt)}
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-slate-400 transition hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-300"
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>

                  <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                    <div className="flex items-start gap-2">
                      <Rocket className="mt-0.5 h-4 w-4 text-emerald-400" />
                      <div>
                        <p className="text-xs font-medium text-emerald-300">Instant Withdrawal</p>
                        <p className="text-[10px] text-emerald-400/70">Will credit instantly after blockchain reaches at height</p>
                      </div>
                    </div>
                  </div>

                  <button onClick={handleWithdraw}
                    disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
                    className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:from-blue-400 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm Withdrawal
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================
// TRANSFER SUCCESS POPUP
// ============================================
export const TransferSuccessPopup: React.FC<{ 
  isOpen: boolean; onClose: () => void; amount: string; address: string;
  type: 'platform' | 'bep20' | 'aiwallet';
}> = ({ isOpen, onClose, amount, address, type }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => onClose(), 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl"
          >
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-emerald-500/40 via-cyan-500/40 to-blue-500/40 blur-xl" />
            <div 
              className="relative overflow-hidden rounded-3xl border p-8 backdrop-blur-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(6,182,212,0.1) 50%, rgba(0,0,0,0.4) 100%)',
                borderColor: 'rgba(16,185,129,0.4)',
                boxShadow: '0 8px 32px rgba(16,185,129,0.3)',
              }}
            >
              <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full border border-emerald-500/20"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 rounded-full border border-cyan-500/20"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
              />

              <div className="relative z-10 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-lg shadow-emerald-500/40"
                >
                  <Check className="h-12 w-12 text-white" />
                </motion.div>
                <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-2 text-2xl font-bold text-white">Transfer Successful!</motion.h3>
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-4 text-lg font-semibold text-emerald-300">${amount}</motion.p>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-4"
                >
                  <p className="text-xs text-slate-400 mb-1">
                    {type === 'platform' ? 'Transferred to Platform User' : type === 'bep20' ? 'Transferred to BEP-20 Wallet' : 'Transferred to AI Wallet'}
                  </p>
                  <p className="text-sm font-mono text-slate-200 break-all">{address}</p>
                </motion.div>
                {type === 'bep20' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className="flex items-center justify-center gap-2 text-xs text-emerald-400/80"
                  >
                    <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    Will transfer instantly when blockchain reaches height
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================
// SEND VIEW
// ============================================
export const SendView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'platform' | 'bep20' | 'aiwallet'>('platform');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleTransfer = () => {
    if (amount && recipient) setShowSuccess(true);
  };

  const closeSuccess = () => {
    setShowSuccess(false);
    setAmount('');
    setRecipient('');
  };

  const tabs = [
    { id: 'platform' as const, label: 'Platform User', icon: User, desc: 'Transfer to E@Akhuwat user' },
    { id: 'bep20' as const, label: 'BEP-20 Wallet', icon: Wallet2, desc: 'Transfer to BSC address' },
    { id: 'aiwallet' as const, label: 'AI Wallet', icon: Bot, desc: 'Transfer to AI wallet' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="mx-auto flex max-w-4xl flex-col gap-5 p-4 sm:p-6 lg:p-8"
    >
      <TransferSuccessPopup isOpen={showSuccess} onClose={closeSuccess} amount={amount} address={recipient} type={activeTab} />

      <div className="mb-2 flex items-center gap-4 border-b border-white/5 pb-5">
        <button onClick={onBack} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-slate-200">
          <X className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-slate-200 sm:text-2xl">Send Funds</h2>
          <p className="mt-1 text-sm text-slate-400">Transfer to platform users, BEP-20 wallets, or AI wallets.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ y: -2 }}
              className={`relative overflow-hidden rounded-2xl border p-4 text-left transition-all ${
                activeTab === tab.id
                  ? 'border-cyan-500/30 bg-cyan-500/10'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/20'
              }`}
            >
              {activeTab === tab.id && <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-400" />}
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  activeTab === tab.id ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-slate-400'
                }`}>
                  <TabIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${activeTab === tab.id ? 'text-white' : 'text-slate-300'}`}>{tab.label}</p>
                  <p className="text-[11px] text-slate-500">{tab.desc}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Form */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 mb-5">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">Enter Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">$</span>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-10 py-4 text-2xl font-bold text-white placeholder-slate-600 outline-none transition focus:border-cyan-500/50 focus:bg-white/10"
            />
            <button onClick={() => setAmount('4892.50')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/30"
            >
              MAX
            </button>
          </div>
        </div>

        <div className="mb-5">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">
            {activeTab === 'platform' ? 'Username or Email' : 'Wallet Address'}
          </label>
          <div className="relative">
            {activeTab === 'platform' ? (
              <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            ) : (
              <Wallet2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            )}
            <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)}
              placeholder={
                activeTab === 'platform' ? 'Enter username or email' : 
                activeTab === 'bep20' ? 'Enter BEP-20 wallet address (0x...)' : 'Enter AI wallet address'
              }
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-12 py-4 text-sm font-medium text-white placeholder-slate-600 outline-none transition focus:border-cyan-500/50 focus:bg-white/10"
            />
          </div>
        </div>

        <div className={`mb-6 rounded-xl border p-4 ${
          activeTab === 'bep20' ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-cyan-500/20 bg-cyan-500/10'
        }`}>
          <div className="flex items-start gap-3">
            <Zap className="mt-0.5 h-5 w-5 text-cyan-400" />
            <div>
              <p className={`text-sm font-medium ${activeTab === 'bep20' ? 'text-emerald-300' : 'text-cyan-300'}`}>
                {activeTab === 'platform' && 'Instant Transfer'}
                {activeTab === 'bep20' && 'Blockchain Transfer'}
                {activeTab === 'aiwallet' && 'AI Wallet Transfer'}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {activeTab === 'platform' && "Funds will be transferred instantly to the recipient's platform account."}
                {activeTab === 'bep20' && 'Will transfer instantly when blockchain reaches height. Network fee: ~$0.50'}
                {activeTab === 'aiwallet' && 'Funds will be transferred to your AI-managed wallet for automated trading.'}
              </p>
            </div>
          </div>
        </div>

        <motion.button onClick={handleTransfer} disabled={!amount || !recipient}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 py-4 text-sm font-bold text-white shadow-lg shadow-cyan-500/30 transition-all hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-100"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}
            animate={{ x: ['-100%', '200%'] }} transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="relative z-10 flex items-center justify-center gap-2">
            <Send className="h-4 w-4" /> Send ${amount || '0.00'}
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
};
