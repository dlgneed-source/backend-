import {
  BookOpen, Code2, Shield, Brain, Cpu, Zap, Wand2, Headphones, FileCode,
  Crown, Gem, BadgeCent, Network
} from 'lucide-react';

export interface TreeNode {
  name: string;
  wallet: string;
  level: number;
  children: TreeNode[];
}

export const referralTree: TreeNode = {
  name: 'You',
  wallet: '0x1A4...B9F2',
  level: 0,
  children: [
    {
      name: 'User A',
      wallet: '0x7B2...F1A3',
      level: 1,
      children: [
        { name: 'User D', wallet: '0x3C1...E4B2', level: 2, children: [] },
        { name: 'User E', wallet: '0x9F8...D2C1', level: 2, children: [] },
      ],
    },
    {
      name: 'User B',
      wallet: '0x5E6...A8D4',
      level: 1,
      children: [{ name: 'User F', wallet: '0x2D7...C5E3', level: 2, children: [] }],
    },
    {
      name: 'User C',
      wallet: '0x8A3...B7F6',
      level: 1,
      children: [],
    },
  ],
};

export const recentTransactions = [
  { id: 1, type: 'Deposit', amount: '+$500.00', time: '2h ago', status: 'Completed' },
  { id: 2, type: 'Commission', amount: '+$24.50', time: '5h ago', status: 'Completed' },
  { id: 3, type: 'Withdrawal', amount: '-$200.00', time: '1d ago', status: 'Pending' },
  { id: 4, type: 'Referral Bonus', amount: '+$15.00', time: '2d ago', status: 'Completed' },
];

export const planBadges = [
  { name: 'Plan 1', price: '$7', active: true, color: '#fbbf24' },
  { name: 'Plan 2', price: '$14', active: false, color: '#22d3ee' },
  { name: 'Plan 3', price: '$40', active: false, color: '#34d399' },
  { name: 'Plan 4', price: '$150', active: false, color: '#e879f9' },
];

export const depositPlans = [
  {
    level: 1,
    name: 'Foundation',
    price: '$7',
    icon: BookOpen,
    subtitle: 'Core skills with a clean premium starter experience.',
    bubbles: [
      { icon: Cpu, text: '+25 AI Credits' },
      { icon: Zap, text: '25K AI Tokens' },
    ],
    features: ['HTML, CSS & JS', 'Python Hands-on', 'Linux Command Line'],
    theme: {
      primary: '#fbbf24',
      secondary: '#f59e0b',
      glow: 'rgba(251, 191, 36, 0.5)',
      bgGlow: 'rgba(251, 191, 36, 0.15)',
      text: '#fef3c7',
    },
  },
  {
    level: 2,
    name: 'Pro Builder',
    price: '$14',
    icon: Code2,
    subtitle: 'Sharper workflow, cleaner execution, more control.',
    bubbles: [
      { icon: Cpu, text: '50 AI Credits' },
      { icon: Zap, text: '80K AI Tokens' },
    ],
    features: ['React.js & Tailwind CSS', 'SQL & DBMS', 'Git & GitHub'],
    theme: {
      primary: '#22d3ee',
      secondary: '#0ea5e9',
      glow: 'rgba(34, 211, 238, 0.5)',
      bgGlow: 'rgba(34, 211, 238, 0.15)',
      text: '#cffafe',
    },
  },
  {
    level: 3,
    name: 'Cyber Elite',
    price: '$40',
    icon: Shield,
    subtitle: 'A stronger, sharper tier with executive energy.',
    bubbles: [
      { icon: Cpu, text: '100 AI Credits' },
      { icon: Zap, text: '120K AI Tokens' },
      { icon: Wand2, text: 'Adv. Tools' },
    ],
    features: ['Ethical Hacking', 'Network Analysis', 'Web App Security'],
    theme: {
      primary: '#34d399',
      secondary: '#10b981',
      glow: 'rgba(52, 211, 153, 0.5)',
      bgGlow: 'rgba(52, 211, 153, 0.15)',
      text: '#d1fae5',
    },
  },
  {
    level: 4,
    name: 'AI Mastery',
    price: '$150',
    icon: Brain,
    subtitle: 'Luxury-grade visual treatment with an AI-first identity.',
    bubbles: [
      { icon: Cpu, text: '250 AI Credits' },
      { icon: Zap, text: '300K AI Tokens' },
      { icon: Headphones, text: 'Priority Support' },
      { icon: FileCode, text: 'Daily Src + Dev Guide' },
    ],
    features: ['Data Analysis', 'Neural Networks', 'AI API Integration'],
    theme: {
      primary: '#e879f9',
      secondary: '#a855f7',
      glow: 'rgba(232, 121, 249, 0.5)',
      bgGlow: 'rgba(232, 121, 249, 0.15)',
      text: '#fae8ff',
    },
  },
];

export const poolStats = [
  { 
    label: 'Leader Pool', 
    value: '$2,180', 
    subtext: 'Top performers',
    icon: Crown, 
    theme: {
      primary: '#fbbf24',
      glow: 'rgba(251, 191, 36, 0.4)',
      bgGlow: 'rgba(251, 191, 36, 0.12)',
    }
  },
  { 
    label: 'Reward Pool', 
    value: '$1,450', 
    subtext: 'Available rewards',
    icon: Gem, 
    theme: {
      primary: '#22d3ee',
      glow: 'rgba(34, 211, 238, 0.4)',
      bgGlow: 'rgba(34, 211, 238, 0.12)',
    }
  },
  { 
    label: 'Level 1 Comm.', 
    value: '$1,240', 
    subtext: 'Direct referrals',
    icon: BadgeCent, 
    theme: {
      primary: '#34d399',
      glow: 'rgba(52, 211, 153, 0.4)',
      bgGlow: 'rgba(52, 211, 153, 0.12)',
    }
  },
  { 
    label: 'Auto Filling Tree', 
    value: '142 Nodes', 
    subtext: 'Network growth',
    icon: Network, 
    theme: {
      primary: '#e879f9',
      glow: 'rgba(232, 121, 249, 0.4)',
      bgGlow: 'rgba(232, 121, 249, 0.12)',
    }
  },
];

export const scheduleNotes = [
  { plan: 'Plan 1', cadence: 'Every 2 days' },
  { plan: 'Plan 2', cadence: 'Every 7 days' },
  { plan: 'Plan 3', cadence: 'Every 15 days' },
  { plan: 'Plan 4', cadence: 'Every 30 days' },
];

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export const pageTransition = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2, ease: [0.42, 0, 1, 1] as const } },
};

export function getISTNow() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + 330 * 60000);
}

export function getNextISTMidnight() {
  const istNow = getISTNow();
  const next = new Date(istNow);
  next.setHours(24, 0, 0, 0);
  const utcMs = next.getTime() - 330 * 60000;
  return new Date(utcMs);
}

export function formatCountdown(ms: number) {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
