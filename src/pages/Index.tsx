import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Landing from '@/components/Landing';
import InternalHeader from '@/components/InternalHeader';
import InternalSidebar from '@/components/InternalSidebar';
import Dashboard from '@/components/Dashboard';
import ReferralEngine from '@/components/ReferralEngine';
import CommunityLounge from '@/components/CommunityLounge';
import EdTechSpace from '@/components/EdTechSpace';
import AIToolsHub from '@/components/AIToolsHub';
import AdminPanel from '@/components/AdminPanel';
import ProfilePanel from '@/components/ProfilePanel';
import BottomNav, { type PanelId } from '@/components/BottomNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';

const panelVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.12 } },
};
const WALLET_ADDRESS_BYTES = 20;

const Index: React.FC = () => {
  const [activePanel, setActivePanel] = useState<PanelId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const { isAuthenticated, login, logout, isLoading } = useAuth();

  const handleLogin = async () => {
    const key = 'ea_wallet_address';
    let wallet = localStorage.getItem(key);

    if (!wallet) {
      const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(WALLET_ADDRESS_BYTES)))
        .map((n) => n.toString(16).padStart(2, '0'))
        .join('');
      wallet = `0x${randomHex}`;
      localStorage.setItem(key, wallet);
    }

    await login(wallet);
  };

  if (!isAuthenticated) {
    return <Landing onLogin={() => { if (!isLoading) void handleLogin(); }} />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <InternalSidebar
        activePanel={activePanel}
        onNavigate={(p: PanelId) => { setActivePanel(p); setSidebarOpen(false); }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={logout}
      />
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {activePanel === 'dashboard' && (
          <InternalHeader
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            sidebarOpen={sidebarOpen}
          />
        )}
        <AnimatePresence mode="wait">
          <motion.div key={activePanel} variants={panelVariants} initial="initial" animate="animate" exit="exit" className="flex-1">
            {activePanel === 'dashboard' && <Dashboard onBack={logout} />}
            {activePanel === 'referral' && <ReferralEngine />}
            {activePanel === 'community' && <CommunityLounge />}
            {activePanel === 'edtech' && <EdTechSpace />}
            {activePanel === 'aitools' && <AIToolsHub />}
            {activePanel === 'admin' && <AdminPanel />}
            {activePanel === 'profile' && <ProfilePanel />}
          </motion.div>
        </AnimatePresence>
        <BottomNav activePanel={activePanel} onNavigate={setActivePanel} />
      </div>
    </div>
  );
};

export default Index;
