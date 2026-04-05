import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, User, Sparkles, MessageSquareText, Code2 } from 'lucide-react';

const techStackRow1 = [
  { name: 'BEP-20 Network', icon: <svg viewBox="0 0 24 24" fill="#F3BA2F" className="w-7 h-7"><path d="M16.624 13.9202l2.7175 2.7154-7.353 7.353-7.353-7.352 2.7175-2.7164 4.6355 4.6595 4.6356-4.6595zm4.6366-4.6366L24 12l-2.7394 2.7154-2.738-2.7154 2.738-2.7155zM7.376 9.2836l2.7175 2.7164L5.458 16.6355 2.7393 13.9202l4.6366-4.6366zm9.248 0l4.6366 4.6366-2.7188 2.7154-4.6355-4.6595 2.7176-2.7165zM2.738 9.2845L0 12l2.738 2.7154L5.4773 12l-2.7393-2.7155zm9.25-9.2845l7.353 7.353-2.7175 2.7154-4.6355-4.6595-4.6355 4.6595-2.7175-2.7154 7.353-7.353zM12 10.9602l1.0425 1.0398L12 13.0425l-1.0425-1.0425L12 10.9602z"/></svg> },
  { name: 'Smart Contracts', icon: <svg viewBox="0 0 24 24" fill="#627EEA" className="w-7 h-7"><path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 11.25l7.365 4.354 7.365-4.35L12.056 0z"/></svg> },
  { name: 'Fireworks AI', icon: <svg viewBox="0 0 24 24" fill="none" stroke="#FF5722" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> },
];

const techStackRow2 = [
  { name: 'Web3 Core', icon: <svg viewBox="0 0 24 24" fill="none" stroke="#00B4DB" strokeWidth="2" className="w-7 h-7"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg> },
  { name: 'Decentralized Nodes', icon: <svg viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" className="w-7 h-7"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> },
  { name: 'React SPA', icon: <svg viewBox="-11.5 -10.23174 23 20.46348" className="w-7 h-7" fill="#61dafb"><circle cx="0" cy="0" r="2.05"/><g stroke="#61dafb" strokeWidth="1" fill="none"><ellipse rx="11" ry="4.2"/><ellipse rx="11" ry="4.2" transform="rotate(60)"/><ellipse rx="11" ry="4.2" transform="rotate(120)"/></g></svg> },
];

const marqueeItems1 = [...techStackRow1, ...techStackRow2, ...techStackRow1, ...techStackRow2, ...techStackRow1, ...techStackRow2];
const marqueeItems2 = [...techStackRow2, ...techStackRow1, ...techStackRow2, ...techStackRow1, ...techStackRow2, ...techStackRow1];

const menuItems = [
  { label: 'Home (Hub)', icon: Home },
  { label: 'Profile', icon: User },
  { label: 'AI Models', icon: Sparkles },
  { label: 'Feedback', icon: MessageSquareText },
  { label: 'Developer Options', icon: Code2 },
];

interface LandingProps {
  onLogin: () => void;
}

const Landing: React.FC<LandingProps> = ({ onLogin }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/15 rounded-full blur-[140px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/20 rounded-full blur-[120px]" />
        <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-[0.15]">
          <source src="https://res.cloudinary.com/da9zypkoj/video/upload/v1774124881/1774124802516_i64wyo.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-background/70" />
      </div>

      {/* Header */}
      <header className="flex justify-between items-center py-2 px-4 sm:px-6 border-b border-primary/20 backdrop-blur-md z-40 relative">
        <div className="flex items-center gap-2">
          <svg className="h-14 sm:h-20 w-auto" viewBox="0 0 1200 320" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="g" x1="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#FF2D9A"/>
                <stop offset="100%" stopColor="#7B4DFF"/>
              </linearGradient>
              <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%">
                <stop offset="0%" stopColor="#F5F5FF"/>
                <stop offset="100%" stopColor="#D1C4FF"/>
              </linearGradient>
            </defs>
            <text x="120" y="155" fontFamily="Inter, Arial, sans-serif" fontSize="78" fontWeight="750" fill="url(#textGrad)">𝐞＠𝐀𝐤𝐡𝐮𝐰𝐚𝐭</text>
            <text x="122" y="205" fontFamily="Inter, Arial, sans-serif" fontSize="22" fontWeight="500" letterSpacing="4" fill="#B9AFFF">DIGITAL PLATFORM</text>
            <path d="M120 232 H454" stroke="url(#g)" strokeWidth="5" strokeLinecap="round"/>
            <text x="120" y="262" fontFamily="Inter, Arial, sans-serif" fontSize="20" fontWeight="600" letterSpacing="2" fill="#E6D9FF">LEARN • EARN • GROW | WEB3 POWERED</text>
          </svg>
        </div>

        <div className="relative cursor-pointer p-2 z-50" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <div className="space-y-1.5 transition-all duration-300">
            <div className={`w-7 h-[2px] rounded-full transition-all duration-300 ${isMenuOpen ? 'bg-primary rotate-45 translate-y-2' : 'bg-foreground'}`} />
            <div className={`w-7 h-[2px] rounded-full transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'bg-foreground'}`} />
            <div className={`h-[2px] rounded-full transition-all duration-300 ${isMenuOpen ? 'w-7 bg-primary -rotate-45 -translate-y-1.5' : 'w-5 bg-primary ml-auto'}`} />
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      <div className={`fixed inset-0 bg-background/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMenuOpen(false)} />
      <div className={`fixed top-0 right-0 h-full w-64 glass-strong z-50 transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col pt-24 px-6 gap-2">
          <p className="text-primary font-bold tracking-widest text-[11px] uppercase border-b border-border pb-2 mb-2">Menu</p>
          {menuItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3 text-foreground hover:text-primary cursor-pointer transition-colors px-2 py-2.5 rounded-lg hover:bg-primary/5">
              <item.icon className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 relative z-10 mt-6 sm:mt-10 w-full mb-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative w-full max-w-md"
        >
          <div className="absolute -inset-1 rounded-[3rem] bg-gradient-to-r from-accent via-primary to-accent opacity-40 blur-xl animate-pulse pointer-events-none" />
          <div className="relative z-10 w-full p-8 sm:p-10 rounded-[2.5rem] glass-strong text-center overflow-hidden">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-primary-foreground tracking-wide drop-shadow-lg">𝐞＠𝐀𝐤𝐡𝐮𝐰𝐚𝐭</h1>
            <div className="flex flex-col items-center gap-1 my-5">
              <div className="h-[2px] w-32 bg-gradient-to-r from-transparent via-primary to-transparent glow-fuchsia" />
            </div>
            <p className="text-primary font-bold tracking-widest text-[11px] uppercase mb-4">Next-Gen dAPP & AI Infra</p>
            <p className="text-foreground text-[13px] leading-relaxed font-medium px-2">High-performance Web3 architecture natively integrated with decentralized AI utilities for enterprise scaling.</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex flex-row gap-3 sm:gap-4 mt-10 sm:mt-12 z-20 w-full max-w-md px-2 sm:px-4"
        >
          <button
            onClick={onLogin}
            className="flex-1 bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 text-primary-foreground py-3.5 rounded-2xl font-bold transition-all glow-fuchsia border border-primary/30 text-sm"
          >
            Wallet Connect
          </button>
          <button className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground py-3.5 rounded-2xl font-bold border border-primary/20 text-sm transition-colors">
            Explore AI Hub
          </button>
        </motion.div>

        {/* Marquee */}
        <div className="w-full mt-12 sm:mt-16 relative overflow-hidden flex flex-col items-center gap-4">
          <p className="text-muted-foreground text-[11px] font-bold tracking-widest uppercase mb-2">Powered By Enterprise Ecosystem</p>
          <div className="animate-slider-left gap-4 px-2">
            {marqueeItems1.map((item, idx) => (
              <div key={`mq1-${idx}`} className="flex items-center gap-4 glass rounded-2xl px-6 sm:px-8 py-3 sm:py-4 hover:border-primary/30 transition-all duration-300">
                {item.icon}
                <span className="text-foreground text-sm font-bold tracking-wide whitespace-nowrap">{item.name}</span>
              </div>
            ))}
          </div>
          <div className="animate-slider-right gap-4 px-2 mt-2">
            {marqueeItems2.map((item, idx) => (
              <div key={`mq2-${idx}`} className="flex items-center gap-4 glass rounded-2xl px-6 sm:px-8 py-3 sm:py-4 hover:border-primary/30 transition-all duration-300">
                {item.icon}
                <span className="text-foreground text-sm font-bold tracking-wide whitespace-nowrap">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-background/95 backdrop-blur-3xl border-t border-primary/20 pt-8 sm:pt-10 pb-6 px-4 sm:px-6 z-20 relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="grid grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-10 text-sm max-w-4xl mx-auto w-full">
          {[
            { title: 'Ecosystem', items: ['Official Marketplace', 'AI Utility Hub', 'EdTech Space'] },
            { title: 'Network', items: ['Help Center', 'Contact Us', 'Community Lounge'] },
            { title: 'Web3 Core', items: ['Smart Contract ↗', 'Audit Report ↗'] },
            { title: 'Legal', items: ['Terms & Conditions', 'Privacy & Security'] },
          ].map((section) => (
            <div key={section.title}>
              <h3 className="text-primary-foreground font-semibold mb-3 sm:mb-4 border-b border-border/40 pb-2 text-xs sm:text-sm">{section.title}</h3>
              <ul className="space-y-2 sm:space-y-3 text-muted-foreground text-xs font-medium">
                {section.items.map((item) => (
                  <li key={item} className="cursor-pointer hover:text-primary transition-colors">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-4 sm:gap-6 pt-4 sm:pt-6 border-t border-border/20 items-center text-center max-w-4xl mx-auto w-full">
          <div className="flex space-x-6 items-center">
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-foreground hover:fill-primary transition-colors cursor-pointer"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.965h-1.83z"/></svg>
            <svg viewBox="0 0 24 24" className="w-[20px] h-[20px] fill-accent hover:fill-primary transition-colors cursor-pointer"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-2.228-.3329-4.4673-.3329-6.6562 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/></svg>
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-foreground hover:fill-primary transition-colors cursor-pointer"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-[#229ED9] hover:fill-primary transition-colors cursor-pointer"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
          </div>
          <div className="text-muted-foreground font-medium text-[11px] tracking-wider uppercase">
            © 2026 All rights Reserved. E-Akhuwat
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
