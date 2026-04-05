import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, MessageCircle, GraduationCap, Sparkles, UserCircle } from 'lucide-react';

export type PanelId = 'dashboard' | 'referral' | 'community' | 'edtech' | 'aitools' | 'admin' | 'profile';

interface BottomNavProps {
  activePanel: PanelId;
  onNavigate: (panel: PanelId) => void;
}

const navItems: { id: PanelId; label: string; icon: React.ElementType; gradient: string }[] = [
  { id: 'dashboard', label: 'Hub', icon: LayoutDashboard, gradient: 'from-cyan-400 via-blue-500 to-purple-600' },
  { id: 'edtech', label: 'Learn', icon: GraduationCap, gradient: 'from-emerald-400 via-teal-500 to-cyan-600' },
  { id: 'aitools', label: 'AI Tools', icon: Sparkles, gradient: 'from-violet-400 via-purple-500 to-fuchsia-600' },
  { id: 'community', label: 'Lounge', icon: MessageCircle, gradient: 'from-amber-400 via-orange-500 to-pink-600' },
  { id: 'profile', label: 'Profile', icon: UserCircle, gradient: 'from-rose-400 via-pink-500 to-purple-600' },
];

const BottomNav: React.FC<BottomNavProps> = ({ activePanel, onNavigate }) => {
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      style={{
        background: 'linear-gradient(180deg, rgba(10,10,20,0) 0%, rgba(5,5,10,0.6) 40%, rgba(2,2,5,0.98) 100%)',
      }}
    >
      {/* Ambient Glow Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[100px] opacity-30 blur-[80px]"
          style={{
            background: 'radial-gradient(ellipse at center bottom, rgba(56,189,248,0.3) 0%, rgba(99,102,241,0.1) 40%, transparent 70%)'
          }}
        />
      </div>

      {/* Glass Container - Reduced padding to bring it closer to bottom */}
      <div 
        className="relative mx-auto w-full max-w-lg px-3 pb-3 pt-1"
        style={{
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        {/* Floating Pill Container - Made thinner (p-1 instead of p-2) */}
        <div 
          className="relative flex items-center justify-between rounded-[1.5rem] p-1.5"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.04) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: `
              0 20px 40px -10px rgba(0,0,0,0.8),
              0 10px 20px -5px rgba(0,0,0,0.5),
              inset 0 1px 1px rgba(255,255,255,0.15),
              inset 0 -1px 1px rgba(0,0,0,0.1)
            `,
          }}
        >
          {navItems.map((item) => {
            const isActive = activePanel === item.id;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                // Reduced height to h-12/14 for a thinner look
                className="group relative flex flex-col items-center justify-center flex-1 h-[3.25rem] outline-none"
              >
                {/* Active Liquid Background */}
                {isActive && (
                  <motion.div
                    layoutId="premium-active-bg"
                    className={`absolute inset-0.5 rounded-xl bg-gradient-to-br ${item.gradient} opacity-15`}
                    initial={false}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 400, 
                      damping: 35,
                      mass: 1.2
                    }}
                    style={{
                      boxShadow: `
                        0 0 30px -10px rgba(99,102,241,0.5),
                        inset 0 1px 2px rgba(255,255,255,0.2),
                        inset 0 -1px 2px rgba(0,0,0,0.1)
                      `
                    }}
                  >
                    {/* Animated gradient overlay */}
                    <motion.div
                      className="absolute inset-0 rounded-xl opacity-40"
                      style={{
                        background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
                        backgroundSize: '200% 200%',
                      }}
                      animate={{
                        backgroundPosition: ['200% 200%', '-200% -200%'],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'linear'
                      }}
                    />
                  </motion.div>
                )}

                {/* Glowing Orb Behind Icon */}
                {isActive && (
                  <motion.div
                    layoutId="glowing-orb"
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gradient-to-r ${item.gradient} blur-lg opacity-50`}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}

                {/* Icon Container with Floating Effect */}
                <motion.div
                  animate={{ 
                    y: isActive ? -3 : 0,
                    scale: isActive ? 1.15 : 1,
                  }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 400, 
                    damping: 25 
                  }}
                  className="relative z-10"
                >
                  <div className="relative flex items-center justify-center">
                    <Icon
                      strokeWidth={isActive ? 2.5 : 1.5}
                      className={`h-[1.15rem] w-[1.15rem] transition-all duration-500 ${
                        isActive 
                          ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]' 
                          : 'text-slate-400 group-hover:text-slate-200 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                      }`}
                    />
                    {/* Inner Glow Dot */}
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gradient-to-r ${item.gradient}`}
                        style={{
                          boxShadow: `0 0 8px 1px rgba(255,255,255,0.8)`
                        }}
                      />
                    )}
                  </div>
                </motion.div>
                
                {/* Label with Glow */}
                <motion.span
                  animate={{ 
                    opacity: isActive ? 1 : 0.6,
                    y: isActive ? 0 : 2,
                    scale: isActive ? 1.05 : 1
                  }}
                  className={`relative z-10 mt-1.5 text-[9px] font-bold tracking-[0.05em] uppercase transition-all duration-300 ${
                    isActive 
                      ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]' 
                      : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                >
                  {item.label}
                </motion.span>

                {/* Hover Glow Effect (for inactive) */}
                {!isActive && (
                  <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
