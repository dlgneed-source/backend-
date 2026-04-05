import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Users, Award, Wallet, Copy, Check, 
  Settings, ChevronRight, ShieldCheck, Headphones, X, Edit3,
  Link, ArrowUpRight, History, LockKeyhole, LogOut
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } }),
};

const ProfilePanel: React.FC = () => {
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userName, setUserName] = useState('Arushi tyagi');
  const [userBio, setUserBio] = useState('Web3 enthusiast & crypto trader. Building the decentralized future.');
  const [editingBio, setEditingBio] = useState(false);
  const [userId] = useState(() => Math.floor(100000 + Math.random() * 900000));

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setProfilePic(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const copyToClipboard = (text: string, type: 'wallet' | 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'wallet') {
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const settingsOptions = [
    { id: 'payout', label: 'Withdrawal Address', icon: Wallet, desc: 'Manage where you receive funds', color: 'text-slate-200' },
    { id: 'pin', label: 'Transaction PIN', icon: LockKeyhole, desc: 'Set 6-digit PIN for withdrawals', color: 'text-slate-200' },
    { id: 'security', label: 'Security & 2FA', icon: ShieldCheck, desc: 'Manage account security', color: 'text-slate-200' },
    { id: 'history', label: 'Login History', icon: History, desc: 'View recent account access', color: 'text-slate-200' },
    { id: 'support', label: 'Help Center', icon: Headphones, desc: 'FAQs and direct support', color: 'text-slate-200' },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_24%),linear-gradient(180deg,#0b1220_0%,#111827_45%,#0f172a_100%)] px-3 py-3 text-slate-100 sm:px-4 sm:py-4 md:px-6 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-5 pb-20">
        
        {/* Header - Profile Card */}
        <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp} className="overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(2,6,23,0.55)] backdrop-blur-2xl">
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            
            {/* Avatar Section */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center text-3xl font-bold text-white overflow-hidden shadow-sm">
                {profilePic ? (
                  <img src={profilePic} alt="DP" className="w-full h-full object-cover" />
                ) : (
                  'PK'
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center cursor-pointer transition-colors border border-white/10">
                <Camera className="w-4 h-4 text-slate-200" />
                <input type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
              </label>
            </div>

            {/* User Info & Invite Link */}
            <div className="flex-1 w-full flex flex-col items-center sm:items-start pt-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">{userName}</h2>
                <button className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              {/* User ID */}
              <p className="text-xs font-mono text-slate-400 mt-1">User ID: #{userId}</p>
              
              {/* Bio */}
              <div className="mt-2 w-full">
                {editingBio ? (
                  <div className="flex gap-2">
                    <input
                      value={userBio}
                      onChange={(e) => setUserBio(e.target.value)}
                      className="flex-1 text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500/50"
                      maxLength={120}
                      autoFocus
                    />
                    <button onClick={() => setEditingBio(false)} className="px-2 py-1 text-xs font-bold text-sky-300 bg-sky-500/10 rounded-lg border border-sky-400/20">Save</button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 cursor-pointer hover:text-slate-300 transition-colors" onClick={() => setEditingBio(true)}>
                    {userBio || 'Tap to add bio...'} <Edit3 className="w-3 h-3 inline ml-1 opacity-50" />
                  </p>
                )}
              </div>
              
              <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px] font-semibold text-slate-200">Level 4 Node</span>
                <span className="px-2 py-0.5 rounded bg-sky-500/10 border border-sky-400/20 text-[11px] font-semibold text-sky-200">Active Account</span>
              </div>

              <div className="mt-5 w-full rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Referral Link</p>
                    <p className="text-sm font-mono text-slate-200 mt-0.5 truncate max-w-[200px] sm:max-w-xs">e-akhuwat.com/ref/PK992</p>
                  </div>
                  <button 
                    onClick={() => copyToClipboard('e-akhuwat.com/ref/PK992', 'link')}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
                  >
                    {copiedLink ? <><Check className="w-3.5 h-3.5 text-sky-300" /> Copied</> : <><Link className="w-3.5 h-3.5" /> Copy Link</>}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Quick Settings (Desktop) */}
            <button onClick={() => setShowSettings(true)} className="hidden sm:flex p-2 rounded-xl border border-white/10 bg-white/[0.05] text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors absolute top-6 right-6">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Network & Sponsorship Info */}
        <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5 shadow-sm backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Network Stats</h3>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Direct Partners</p>
                <p className="text-2xl font-bold text-white mt-1">24</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Total Team</p>
                <p className="text-2xl font-bold text-white mt-1">1,240</p>
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5 shadow-sm backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Sponsor Details</h3>
              <Award className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center text-xs font-bold text-slate-200">AM</div>
              <div>
                <p className="text-sm font-bold text-white">Alpha Master</p>
                <p className="text-xs text-slate-400">ID: AM445 • Joined Jan 2025</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Financial Breakdown */}
        <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp} className="overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.04] shadow-sm backdrop-blur-xl">
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-slate-300" />
              <h3 className="text-sm font-bold text-white">Financial Overview</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wallet</span>
              <button onClick={() => copyToClipboard('0x1A4F...B9F2', 'wallet')} className="flex items-center gap-1 text-xs font-mono text-slate-200 hover:text-white bg-white/[0.05] px-2 py-1 rounded-lg border border-white/10">
                0x1A4F...B9F2 {copiedWallet ? <Check className="w-3 h-3 text-sky-300" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {/* Balance Highlight (Fixed Button Color) */}
            <div className="mb-6 p-4 rounded-2xl border border-sky-400/20 bg-sky-500/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-sky-200 uppercase tracking-widest">Available Balance</p>
                <p className="text-3xl font-bold text-white mt-1">$1,240.50</p>
              </div>
              <button className="flex items-center gap-1.5 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:scale-105 border border-transparent">
                Withdraw <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-xs font-medium text-slate-400">Total Matrix Earnings</span>
                <span className="text-sm font-bold text-white">$4,892.50</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-xs font-medium text-slate-400">Direct Referral Income</span>
                <span className="text-sm font-bold text-white">$1,200.00</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-xs font-medium text-slate-400">Total Withdrawn</span>
                <span className="text-sm font-bold text-slate-300">$3,652.00</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-xs font-medium text-slate-400">Active Package</span>
                <span className="text-xs font-bold bg-white/[0.06] text-slate-200 px-2.5 py-1 rounded-lg border border-white/10">Plan 4 • $56</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mobile Settings Button */}
        <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp} className="sm:hidden">
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center justify-between p-5 rounded-[26px] bg-white/[0.04] border border-white/10 hover:bg-white/[0.06] transition-colors shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-slate-300" />
              <span className="text-sm font-bold text-white">Account Settings</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </motion.div>

        {/* Settings Modal - SCROLL & OVERLAP FIXED */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 sm:p-4 backdrop-blur-sm"
              onClick={() => setShowSettings(false)}
            >
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full sm:max-w-md rounded-t-[32px] sm:rounded-[28px] bg-[#0d1321] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.03] shrink-0">
                  <div>
                    <h3 className="text-lg font-bold text-white">Settings</h3>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-0.5">Preferences & Security</p>
                  </div>
                  <button onClick={() => setShowSettings(false)} className="p-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors border border-white/10">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Modal Body - Scrollable with extra bottom padding */}
                <div className="p-6 pb-24 sm:pb-6 space-y-2 bg-white/[0.02] overflow-y-auto">
                  {settingsOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-white/10 hover:bg-white/[0.04] transition-colors text-left group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300 group-hover:text-white transition-colors">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold ${opt.color}`}>{opt.label}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                      </button>
                    );
                  })}
                  
                  {/* LogOut Button - Properly visible now */}
                  <div className="pt-4 mt-2 border-t border-white/10">
                    <button className="w-full flex items-center justify-between p-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 hover:bg-rose-500/20 transition-colors text-left">
                      <div className="flex items-center gap-3 text-rose-400">
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-bold">Sign Out</span>
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default ProfilePanel;
