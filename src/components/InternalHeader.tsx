import React, { useState } from 'react';
import { Bell, ChevronLeft, Menu } from 'lucide-react';
import NotificationPanel from '@/components/NotificationPanel';

interface InternalHeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  onNavigateHome?: () => void;
}

const InternalHeader: React.FC<InternalHeaderProps> = ({ onToggleSidebar, sidebarOpen }) => {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between h-14 px-4 border-b border-white/10 sticky top-0 z-30"
        style={{
          background: 'linear-gradient(135deg, hsl(220 15% 18% / 0.85), hsl(220 12% 22% / 0.75))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 2px 20px hsl(220 20% 50% / 0.12), inset 0 1px 0 hsl(0 0% 100% / 0.06)',
        }}
      >
        {/* Left: hamburger menu */}
        <button onClick={onToggleSidebar} className="p-2.5 rounded-lg hover:bg-white/10 transition-colors">
          {sidebarOpen ? <ChevronLeft className="w-6 h-6 text-slate-300" /> : <Menu className="w-6 h-6 text-slate-300" />}
        </button>

        {/* Right: notification bell */}
        <button
          onClick={() => setNotifOpen(true)}
          className="relative p-2.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Bell className="w-6 h-6 text-slate-300" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-background animate-pulse" />
        </button>
      </header>

      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
};

export default InternalHeader;
