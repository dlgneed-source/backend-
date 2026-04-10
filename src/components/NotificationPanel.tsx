import React from 'react';
import { X, Bell, MessageSquare, Users, Zap, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type NotificationItem = {
  id: string | number;
  type?: 'message' | 'user' | 'bonus' | 'reward' | 'system';
  title: string;
  desc: string;
  time: string;
};

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  notifications?: NotificationItem[];
}

const fallbackNotifications: NotificationItem[] = [
  { id: 1, title: 'AI Credits Bonus', desc: 'You received 50 bonus credits!', time: '2 min ago', type: 'bonus' },
  { id: 2, title: 'New Follower', desc: 'CryptoKing started following you', time: '15 min ago', type: 'user' },
  { id: 3, title: 'New Message', desc: 'AIDevSara sent you a message', time: '1 hr ago', type: 'message' },
  { id: 4, title: 'Referral Reward', desc: 'You earned $5 from a referral!', time: '3 hr ago', type: 'reward' },
  { id: 5, title: 'System Update', desc: 'New features available in AI Tools', time: '5 hr ago', type: 'system' },
];

const iconMap = {
  message: { icon: MessageSquare, color: '#3b82f6' },
  user: { icon: Users, color: '#10b981' },
  bonus: { icon: Zap, color: '#8b5cf6' },
  reward: { icon: TrendingUp, color: '#f59e0b' },
  system: { icon: Bell, color: '#6366f1' },
};

const NotificationPanel: React.FC<NotificationPanelProps> = ({ open, onClose, notifications }) => {
  const hasExternalNotifications = notifications !== undefined;
  const items = hasExternalNotifications ? notifications : fallbackNotifications;

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
                <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">{items.length}</span>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 && (
                <div className="h-full flex items-center justify-center px-6 text-center">
                  <p className="text-xs text-slate-400">No notifications yet.</p>
                </div>
              )}
              {items.map((n) => {
                const { icon: Icon, color } = iconMap[n.type || 'system'];
                return (
                  <div key={n.id} className="px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20` }}>
                        <Icon className="w-4 h-4" style={{ color }} />
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
