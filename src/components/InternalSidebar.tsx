import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  LogOut,
  Globe,
  Mail,
  FileText,
  X,
} from 'lucide-react';
import type { PanelId } from '@/components/BottomNav';

const menuItems: { label: string; icon: React.ElementType; action: string }[] = [
  { label: 'Admin Panel', icon: Shield, action: 'admin' },
  { label: 'Terms & Conditions', icon: FileText, action: 'terms' },
  { label: 'Privacy & Policy', icon: Globe, action: 'privacy' },
  { label: 'Contact Us', icon: Mail, action: 'contact' },
];

interface InternalSidebarProps {
  open: boolean;
  activePanel: PanelId;
  onNavigate: (panel: PanelId) => void;
  onClose: () => void;
  onLogout?: () => void;
}

const InternalSidebar: React.FC<InternalSidebarProps> = ({ open, activePanel, onNavigate, onClose, onLogout }) => {
  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen
          flex flex-col
          bg-sidebar border-r border-sidebar-border
          transition-all duration-300 ease-in-out
          ${open ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'}
        `}
      >
        <div className="flex-1 flex flex-col pt-4 overflow-y-auto overflow-x-hidden">
          {/* Close button */}
          <div className="px-4 pb-1 flex justify-end">
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu heading */}
          <div className="px-4 pb-2 mb-0">
            <p className="text-primary font-bold tracking-widest text-[11px] uppercase border-b border-border/40 pb-2">Menu</p>
          </div>

          {/* Menu items */}
          <nav className="px-2 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.action === 'admin' && activePanel === 'admin';
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.action === 'admin') { onNavigate('admin'); onClose(); }
                    else onClose();
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px]
                    ${isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }
                  `}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Sign Out - moved up after menu items */}
          <div className="px-3 pt-2 pb-2 border-t border-border/30 mt-3">
            <button
              onClick={(e) => { e.stopPropagation(); onLogout?.(); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-destructive hover:bg-destructive/10 transition-all min-h-[44px] cursor-pointer relative z-[60]"
            >
              <LogOut className="w-[18px] h-[18px] shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Social icons - in the middle */}
          <div className="px-4 py-4 border-t border-border/30">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 text-center">Connect With Us</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {/* X/Twitter */}
              <a href="#" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <svg viewBox="0 0 24 24" className="w-[19.5px] h-[19.5px] fill-foreground hover:fill-primary transition-colors"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.965h-1.83z"/></svg>
              </a>
              {/* Discord */}
              <a href="#" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <svg viewBox="0 0 24 24" className="w-[19.5px] h-[19.5px]" style={{ fill: '#5865F2' }}><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-2.228-.3329-4.4673-.3329-6.6562 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/></svg>
              </a>
              {/* Telegram */}
              <a href="#" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <svg viewBox="0 0 24 24" className="w-[19.5px] h-[19.5px]" style={{ fill: '#26A5E4' }}><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
              {/* Facebook */}
              <a href="#" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <svg viewBox="0 0 24 24" className="w-[19.5px] h-[19.5px]" style={{ fill: '#1877F2' }}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              {/* Instagram */}
              <a href="#" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <svg viewBox="0 0 24 24" className="w-[19.5px] h-[19.5px]" style={{ fill: '#E4405F' }}><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z"/></svg>
              </a>
              {/* TikTok */}
              <a href="#" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <svg viewBox="0 0 24 24" className="w-[19.5px] h-[19.5px] fill-foreground"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
              </a>
              {/* Snapchat */}
              <a href="#" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <svg viewBox="0 0 24 24" className="w-[19.5px] h-[19.5px]" style={{ fill: '#FFFC00' }}><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.916-.217.143-.058.301-.09.46-.09a.892.892 0 01.875.842c.013.263-.126.475-.321.662-.376.355-.917.477-1.374.603-.166.045-.327.093-.481.147-.052.017-.06.022-.08.027l-.007.002a1.104 1.104 0 00-.507.394c-.166.252-.217.57-.063.904.347.771.76 1.479 1.341 2.109.253.27.528.497.793.67.775.504 1.252.592 1.406.62a.674.674 0 01.06.015c.24.058.348.236.319.486-.05.376-.365.703-.76.965-.472.31-1.073.555-1.611.741-.187.064-.334.139-.462.254-.193.173-.275.396-.369.65l-.009.024c-.094.263-.196.544-.545.837-.72.595-1.92.683-2.803.683-.31 0-.577-.023-.783-.041l-.074-.007c-.473-.049-.897-.093-1.346.003-1.046.232-2.054.766-3.156.763-.026 0-.052 0-.078-.002-1.131.003-2.14-.531-3.182-.763-.449-.096-.873-.052-1.346-.003l-.074.007c-.206.018-.473.041-.783.041-.884 0-2.084-.088-2.803-.683-.349-.293-.451-.574-.545-.837l-.009-.024c-.094-.254-.176-.477-.369-.65-.128-.115-.275-.19-.462-.254-.538-.186-1.139-.43-1.611-.741-.395-.262-.71-.589-.76-.965-.029-.25.079-.428.319-.486a.674.674 0 01.06-.015c.154-.028.631-.116 1.406-.62.265-.173.54-.4.793-.67.58-.63.994-1.338 1.341-2.11.154-.333.103-.651-.063-.903a1.104 1.104 0 00-.507-.394l-.007-.002c-.02-.005-.028-.01-.08-.027-.154-.054-.315-.102-.481-.147-.457-.126-.998-.248-1.374-.603-.195-.187-.334-.399-.321-.662a.892.892 0 01.875-.842c.159 0 .317.032.46.09.257.097.616.201.916.217.198 0 .326-.045.401-.09-.008-.165-.018-.33-.03-.51l-.003-.06c-.104-1.628-.23-3.654.299-4.847C7.653 1.069 11.016.793 12.006.793h.2z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default InternalSidebar;
