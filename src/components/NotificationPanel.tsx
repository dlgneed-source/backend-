import React from 'react';
import { X, Bell, MessageSquare, Users, Zap, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

const notifications = [
  { id: 1, icon: Zap, title: 'AI Credits Bonus', desc: 'You received 50 bonus credits!', time: '2 min ago', color: '#8b5cf6' },
  { id: 2, icon: Users, title: 'New Follower', desc: 'CryptoKing started following you', time: '15 min ago', color: '#10b981' },
  { id: 3, icon: MessageSquare, title: 'New Message', desc: 'AIDevSara sent you a message', time: '1 hr ago', color: '#3b82f6' },
  { id: 4, icon: TrendingUp, title: 'Referral Reward', desc: 'You earned $5 from a referral!', time: '3 hr ago', color: '#f59e0b' },
  { id: 5, icon: Bell, title: 'System Update', desc: 'New features available in AI Tools', time: '5 hr ago', color: '#6366f1' },
];

const NotificationPanel: React.FC<NotificationPanelProps> = ({ open, onClose }) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 z-[80] h-full w-80 max-w-[90vw] border-l border-white/10 flex flex-col"
            style={{
              background: 'linear-gradient(180deg, hsl(220 15% 13%), hsl(220 12% 10%))',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-bold text-white">Notifications</h2>
                <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">{notifications.length}</span>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.map((n) => {
                const Icon = n.icon;
                return (
                  <div key={n.id} className="px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${n.color}20` }}>
                        <Icon className="w-4 h-4" style={{ color: n.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{n.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{n.desc}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{n.time}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/10">
              <button className="w-full py-2 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors">
                Mark all as read
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationPanel;
