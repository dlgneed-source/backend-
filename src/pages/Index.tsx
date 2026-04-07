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
function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const Index: React.FC = () => {
  const [activePanel, setActivePanel] = useState<PanelId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const { isAuthenticated, login, logout, isLoading, walletAddress, walletError, clearWalletError } = useAuth();

  if (!isAuthenticated) {
    return (
      <Landing
        onLogin={() => {
          if (!isLoading) {
            clearWalletError();
            void login();
          }
        }}
        isLoading={isLoading}
        walletAddress={walletAddress}
        walletError={walletError}
      />
    );
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
            connectedAddress={walletAddress ? truncateAddress(walletAddress) : undefined}
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
