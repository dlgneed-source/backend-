import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Home, User, Sparkles, MessageSquareText, Code2, X, Camera, Key, Plus, Trash2, Clock, Shield } from 'lucide-react';

type HeaderView = 'none' | 'menu' | 'profile' | 'devOptions';

interface DashboardHeaderProps {
  onLogout: () => void;
  onNavigateHome?: () => void;
}

const mockApiKeys = [
  { id: 1, name: 'Production Key', key: 'ea_live_***...k9F2', created: '2026-01-15', expires: '2026-07-15', active: true },
  { id: 2, name: 'Test Key', key: 'ea_test_***...m3A1', created: '2026-03-01', expires: '2026-06-01', active: true },
];

const menuItems = [
  { label: 'Home (Hub)', icon: Home, action: 'home' as const },
  { label: 'Profile', icon: User, action: 'profile' as const },
  { label: 'AI Models', icon: Sparkles, action: 'aimodels' as const },
  { label: 'Feedback', icon: MessageSquareText, action: 'feedback' as const },
  { label: 'Developer Options', icon: Code2, action: 'devOptions' as const },
];

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onLogout, onNavigateHome }) => {
  const [view, setView] = useState<HeaderView>('none');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState(mockApiKeys);

  const isMenuOpen = view !== 'none';

  const handleMenuAction = (action: string) => {
    if (action === 'profile') setView('profile');
    else if (action === 'devOptions') setView('devOptions');
    else if (action === 'home') {
      setView('none');
      onNavigateHome?.();
    } else {
      setView('none');
    }
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setProfilePic(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const generateKey = () => {
    const newKey = {
      id: Date.now(),
      name: `Key ${apiKeys.length + 1}`,
      key: `ea_live_***...${Math.random().toString(36).slice(-4)}`,
      created: new Date().toISOString().split('T')[0],
      expires: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      active: true,
    };
    setApiKeys([...apiKeys, newKey]);
  };

  const revokeKey = (id: number) => {
    setApiKeys(apiKeys.map(k => k.id === id ? { ...k, active: false } : k));
  };

  const removeKey = (id: number) => {
    setApiKeys(apiKeys.filter(k => k.id !== id));
  };

  return (
    <>
      <header className="flex justify-between items-center py-3 px-4 sm:px-6 glass-strong border-b border-primary/20 relative z-20">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full bg-gradient-to-tr from-accent to-primary flex items-center justify-center font-bold text-primary-foreground text-sm cursor-pointer glow-fuchsia overflow-hidden"
            onClick={() => setView(view === 'menu' ? 'none' : 'menu')}
          >
            {profilePic ? (
              <img src={profilePic} alt="DP" className="w-full h-full object-cover" />
            ) : (
              'EA'
            )}
          </div>
          <span className="font-bold tracking-wide text-primary-foreground text-lg sm:text-xl">Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-secondary border border-primary/30 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            <span className="text-xs font-semibold text-primary">0x1A4...B9F2</span>
          </div>
          <button
            onClick={() => setView(isMenuOpen ? 'none' : 'menu')}
            className="relative p-2 z-50"
          >
            <div className="space-y-1.5 transition-all duration-300">
              <div className={`w-6 h-[2px] rounded-full transition-all duration-300 ${isMenuOpen ? 'bg-primary rotate-45 translate-y-[7px]' : 'bg-foreground'}`} />
              <div className={`w-6 h-[2px] rounded-full transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'bg-foreground'}`} />
              <div className={`h-[2px] rounded-full transition-all duration-300 ${isMenuOpen ? 'w-6 bg-primary -rotate-45 -translate-y-[3px]' : 'w-4 bg-primary ml-auto'}`} />
            </div>
          </button>
        </div>
      </header>

      {/* Overlay */}
      <div className={`fixed inset-0 bg-background/60 backdrop-blur-sm z-30 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setView('none')} />

      {/* Slide-out panel */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className="fixed top-0 right-0 h-full w-72 sm:w-80 glass-strong z-40 overflow-y-auto scrollbar-hide"
          >
            <div className="p-5 pt-20">
              {view === 'menu' && (
                <div className="flex flex-col gap-1">
                  <p className="text-primary font-bold tracking-widest text-[11px] uppercase border-b border-border/40 pb-2 mb-3">Menu</p>
                  {menuItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleMenuAction(item.action)}
                      className="flex items-center gap-3 text-foreground hover:text-primary hover:bg-primary/5 px-3 py-3 rounded-xl transition-all"
                    >
                      <item.icon className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm">{item.label}</span>
                    </button>
                  ))}
                  <div className="border-t border-border/30 mt-4 pt-4">
                    <button onClick={onLogout} className="flex items-center gap-3 text-destructive hover:bg-destructive/5 px-3 py-3 rounded-xl w-full transition-all">
                      <X className="w-4 h-4" />
                      <span className="font-semibold text-sm">Disconnect Wallet</span>
                    </button>
                  </div>
                </div>
              )}

              {view === 'profile' && (
                <div className="flex flex-col gap-5">
                  <button onClick={() => setView('menu')} className="text-xs text-primary font-bold self-start">← Back</button>
                  <p className="text-primary font-bold tracking-widest text-[11px] uppercase border-b border-border/40 pb-2">Profile</p>
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-accent to-primary flex items-center justify-center text-2xl font-bold text-primary-foreground glow-fuchsia overflow-hidden">
                        {profilePic ? (
                          <img src={profilePic} alt="DP" className="w-full h-full object-cover" />
                        ) : (
                          'EA'
                        )}
                      </div>
                      <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center cursor-pointer glow-fuchsia">
                        <Camera className="w-3.5 h-3.5 text-primary-foreground" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
                      </label>
                    </div>
                    <p className="text-sm font-bold text-primary-foreground">e-Akhuwat User</p>
                    <p className="text-[10px] font-mono text-muted-foreground">0x1A4...B9F2</p>
                  </div>
                  <div className="glass rounded-xl p-4 space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Level</span>
                      <span className="text-primary font-bold">2</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Referrals</span>
                      <span className="text-foreground font-bold">24</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Joined</span>
                      <span className="text-foreground font-bold">Jan 2026</span>
                    </div>
                  </div>
                </div>
              )}

              {view === 'devOptions' && (
                <div className="flex flex-col gap-4">
                  <button onClick={() => setView('menu')} className="text-xs text-primary font-bold self-start">← Back</button>
                  <p className="text-primary font-bold tracking-widest text-[11px] uppercase border-b border-border/40 pb-2">Developer Options</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-primary-foreground">API Keys</span>
                    </div>
                    <button onClick={generateKey} className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors">
                      <Plus className="w-3 h-3" /> Generate
                    </button>
                  </div>
                  <div className="space-y-2">
                    {apiKeys.map((k) => {
                      const daysLeft = Math.ceil((new Date(k.expires).getTime() - Date.now()) / 86400000);
                      const isExpiring = daysLeft <= 30;
                      return (
                        <div key={k.id} className="glass rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">{k.name}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${k.active ? 'bg-neon-green/20 text-neon-green' : 'bg-destructive/20 text-destructive'}`}>
                              {k.active ? 'Active' : 'Revoked'}
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-muted-foreground">{k.key}</p>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span className={isExpiring ? 'text-accent font-bold' : ''}>Expires: {k.expires} {isExpiring && `(${daysLeft}d)`}</span>
                          </div>
                          <div className="flex gap-2 pt-1">
                            {k.active && (
                              <button onClick={() => revokeKey(k.id)} className="text-[10px] font-bold text-accent hover:text-accent/80 transition-colors flex items-center gap-1">
                                <Key className="w-3 h-3" /> Revoke
                              </button>
                            )}
                            <button onClick={() => removeKey(k.id)} className="text-[10px] font-bold text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1">
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DashboardHeader;
