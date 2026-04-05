import React, { useEffect, useMemo, useRef, useState } from 'react';
import NotificationPanel from '@/components/NotificationPanel';
import {
  ArrowLeft, BadgeCheck, ChevronDown, Hash, Lock, Pin, Plus, Reply, 
  Search, Send, Settings, Shield, Smile, Users, Wallet, X, User, 
  Paperclip, Crown, Bell, Phone, Video, Trash2, Flag, Check, 
  Sparkles, ChevronRight, Star, Globe, MessageCircle, 
  MoreHorizontal, Copy, Archive, VolumeX, Share2, Ban, LogOut
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════════
   TYPES & INTERFACES
   ═══════════════════════════════════════════════════════════════════════════════ */
type Room = { 
  id: string; 
  name: string; 
  unread: number; 
  isVip: boolean; 
  description?: string; 
  icon?: 'hash' | 'pin' | 'lock' | 'star';
  memberCount?: number;
  isPinned?: boolean;
};

type Contact = { 
  id: string; 
  name: string; 
  initials: string; 
  online: boolean; 
  role: string; 
  wallet: string; 
  lastMsg: string; 
  badge?: string;
  avatar?: string;
  isBlocked?: boolean;
  lastSeen?: string;
};

interface Msg { 
  id: number; 
  roomId: string; 
  user: string; 
  initials: string; 
  text: string; 
  time: string; 
  isOwn?: boolean; 
  userId?: string; 
  role?: string; 
  wallet?: string; 
  replyToId?: number;
  reactions?: { emoji: string; count: number; users: string[] }[];
  isEdited?: boolean;
  attachments?: { type: 'image' | 'file'; url: string; name: string; size?: string }[];
  isPinned?: boolean;
}

type Profile = { 
  id: string; 
  name: string; 
  initials: string; 
  online?: boolean; 
  role?: string; 
  wallet?: string; 
  subtitle?: string; 
  badge?: string;
  avatar?: string;
  bio?: string;
  joinedDate?: string;
  isBlocked?: boolean;
};

/* ═══════════════════════════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════════════════════════ */
const seedRooms: Room[] = [
  { id: 'announcements', name: 'announcements', unread: 0, isVip: false, description: 'Official updates and releases', icon: 'pin', memberCount: 12450, isPinned: true },
  { id: 'general', name: 'general', unread: 3, isVip: false, description: 'Community talk and support', icon: 'hash', memberCount: 8932 },
  { id: 'dev-talk', name: 'dev-talk', unread: 0, isVip: false, description: 'Engineering & integrations', icon: 'hash', memberCount: 2341 },
  { id: 'trading-signals', name: 'trading-signals', unread: 7, isVip: false, description: 'Market discussion & alerts', icon: 'hash', memberCount: 5678 },
  { id: 'alpha-signals', name: 'alpha-signals', unread: 0, isVip: true, description: 'VIP alpha access only', icon: 'lock', memberCount: 420 },
  { id: 'nft-alpha', name: 'nft-alpha', unread: 0, isVip: true, description: 'NFT drops & whitelists', icon: 'star', memberCount: 380 },
];

const dmContacts: Contact[] = [
  { id: 'dm1', name: 'AIDevSara', initials: 'AS', online: true, role: 'Moderator', wallet: '0x71C...4A2b', lastMsg: 'Thanks for the tip! 🚀', badge: 'trusted', lastSeen: 'now' },
  { id: 'dm2', name: 'Web3Wizard', initials: 'WW', online: true, role: 'Admin', wallet: '0x99B...1C3d', lastMsg: 'Let me check the docs...', badge: 'team', lastSeen: 'now' },
  { id: 'dm3', name: 'NodeRunner', initials: 'NR', online: false, role: 'VIP Member', wallet: '0x11A...9F8e', lastMsg: 'Validator setup complete ✅', badge: 'vip', lastSeen: '2h ago' },
  { id: 'dm4', name: 'CryptoKing', initials: 'CK', online: true, role: 'Member', wallet: '0x44D...2E1f', lastMsg: 'BEP-20 deployed 🚀', badge: 'member', lastSeen: 'now' },
  { id: 'dm5', name: 'DeFiQueen', initials: 'DQ', online: false, role: 'VIP Member', wallet: '0x88F...3A7c', lastMsg: 'APY looking good!', badge: 'vip', lastSeen: '5h ago' },
];

const communityMembers: Contact[] = [...dmContacts, 
  { id: 'dm6', name: 'SignalFox', initials: 'SF', online: true, role: 'VIP Member', wallet: '0x22D...1B9f', lastMsg: 'Entry confirmed', badge: 'vip', lastSeen: 'now' },
  { id: 'dm7', name: 'BlockMaster', initials: 'BM', online: true, role: 'Moderator', wallet: '0x33E...5C2a', lastMsg: 'Rules updated', badge: 'trusted', lastSeen: 'now' },
];

const seedMessages: Msg[] = [
  { id: 1, roomId: 'announcements', user: 'Web3Wizard', initials: 'WW', text: '🎉 Welcome to the new E@Akhuwat Premium Lounge! Experience the future of community.', time: '09:15', userId: 'dm2', role: 'Admin', wallet: '0x99B...1C3d', reactions: [{ emoji: '🎉', count: 24, users: [] }, { emoji: '🔥', count: 18, users: [] }] },
  { id: 2, roomId: 'general', user: 'CryptoKing', initials: 'CK', text: 'This UI is absolutely fire! The glassmorphism effects are chefs kiss 👌', time: '09:18', userId: 'dm4', role: 'Member', wallet: '0x44D...2E1f', reactions: [{ emoji: '❤️', count: 8, users: [] }] },
  { id: 3, roomId: 'general', user: 'AIDevSara', initials: 'AS', text: 'Agreed! The mobile experience is so smooth now 🚀', time: '09:19', userId: 'dm1', role: 'Moderator', wallet: '0x71C...4A2b', replyToId: 2, reactions: [{ emoji: '💯', count: 5, users: [] }] },
  { id: 4, roomId: 'general', user: 'NodeRunner', initials: 'NR', text: 'Just staked my tokens. The yield is insane! 📈', time: '09:22', userId: 'dm3', role: 'VIP Member', wallet: '0x11A...9F8e' },
];

const emojis = ['👍', '❤️', '🔥', '😂', '🎉', '👏', '😍', '🤔', '👎', '😢'];

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */
const CommunityLounge: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [activeTab, setActiveTab] = useState<'community' | 'dms'>('community');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [vipOpen, setVipOpen] = useState(true);

  const [rooms, setRooms] = useState<Room[]>(seedRooms);
  const [contacts, setContacts] = useState<Contact[]>(dmContacts);
  const [messages, setMessages] = useState<Msg[]>(seedMessages);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  
  const [selectedRoomId, setSelectedRoomId] = useState('announcements');
  const [selectedDM, setSelectedDM] = useState<string | null>(null);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<number | null>(null);
  const [showMessageMenu, setShowMessageMenu] = useState<number | null>(null);
  const [profileTarget, setProfileTarget] = useState<Profile | null>(null);
  const [showSearchInChat, setShowSearchInChat] = useState(false);
  const [myBio, setMyBio] = useState('Web3 enthusiast and crypto trader. Building the future of decentralized finance.');
  const [editingMyBio, setEditingMyBio] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [isNewRoomVip, setIsNewRoomVip] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const activeRoom = rooms.find((r) => r.id === selectedRoomId) ?? rooms[0];
  const activeDMObj = selectedDM ? contacts.find((c) => c.id === selectedDM) ?? null : null;
  const activeTitle = selectedDM ? activeDMObj?.name ?? 'Direct Message' : `#${activeRoom?.name ?? 'announcements'}`;
  const activeDescription = selectedDM ? `${activeDMObj?.role} • Last seen ${activeDMObj?.lastSeen}` : `${activeRoom?.memberCount?.toLocaleString() ?? '0'} members • ${activeRoom?.description ?? 'Community space'}`;

  const activeChannelMessages = useMemo(() => {
    const base = messages.filter((m) => m.roomId === (selectedDM ? `dm:${selectedDM}` : selectedRoomId));
    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();
    return base.filter((m) => m.user.toLowerCase().includes(q) || m.text.toLowerCase().includes(q));
  }, [messages, selectedRoomId, selectedDM, searchQuery]);

  useEffect(() => { 
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [activeChannelMessages, mobileShowChat]);

  const openProfile = (profile: Profile) => { 
    setProfileTarget(profile); 
    setShowUserProfileModal(true); 
  };

  const openMemberProfile = (contact: Contact) => {
    openProfile({ 
      id: contact.id, 
      name: contact.name, 
      initials: contact.initials, 
      online: contact.online, 
      role: contact.role, 
      wallet: contact.wallet, 
      subtitle: 'Community member', 
      badge: contact.badge,
      isBlocked: contact.isBlocked,
      bio: 'Web3 enthusiast and crypto trader. Building the future of decentralized finance.',
      joinedDate: 'March 2024'
    });
  };

  const openMessageProfile = (msg: Msg) => {
    const matched = communityMembers.find((m) => m.name === msg.user);
    openProfile({ 
      id: msg.userId ?? matched?.id ?? msg.user, 
      name: msg.user, 
      initials: msg.initials, 
      online: matched?.online, 
      role: msg.role ?? matched?.role ?? 'Member', 
      wallet: msg.wallet ?? matched?.wallet ?? '—',
      bio: 'Active community member',
      joinedDate: '2024'
    });
  };

  const handleSelectRoom = (roomId: string) => { 
    setSelectedDM(null); 
    setSelectedRoomId(roomId); 
    setReplyTo(null); 
    if (isMobile) setMobileShowChat(true); 
  };

  const openDM = (contactId: string) => { 
    setSelectedDM(contactId); 
    setSelectedRoomId('announcements'); 
    setReplyTo(null); 
    if (isMobile) setMobileShowChat(true); 
  };

  const send = () => {
    if (!input.trim()) return;
    const targetRoomId = selectedDM ? `dm:${selectedDM}` : selectedRoomId;
    setMessages((prev) => [...prev, { 
      id: Date.now(), 
      roomId: targetRoomId, 
      user: 'You', 
      initials: 'YO', 
      text: input.trim(), 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
      isOwn: true, 
      userId: 'you', 
      role: 'You', 
      wallet: '—', 
      replyToId: replyTo?.id 
    }]);
    setInput(''); 
    setReplyTo(null);
    setShowEmojiPicker(null);
  };

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return;
    const newId = newRoomName.toLowerCase().replace(/\s+/g, '-');
    setRooms((prev) => [...prev, { 
      id: newId, 
      name: newRoomName.trim(), 
      unread: 0, 
      isVip: isNewRoomVip, 
      description: isNewRoomVip ? 'VIP-exclusive space' : 'Public room', 
      icon: isNewRoomVip ? 'lock' : 'hash',
      memberCount: 1
    }]);
    setNewRoomName(''); 
    setIsNewRoomVip(false); 
    setShowCreateRoomModal(false); 
    handleSelectRoom(newId);
  };

  const handleBlockUser = () => {
    if (profileTarget) {
      setContacts(prev => prev.map(c => 
        c.id === profileTarget.id ? { ...c, isBlocked: !c.isBlocked } : c
      ));
      setProfileTarget({ ...profileTarget, isBlocked: !profileTarget.isBlocked });
    }
  };

  const addReaction = (msgId: number, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const existing = m.reactions?.find(r => r.emoji === emoji);
      if (existing) {
        return {
          ...m,
          reactions: m.reactions?.map(r => 
            r.emoji === emoji ? { ...r, count: r.count + 1 } : r
          )
        };
      }
      return {
        ...m,
        reactions: [...(m.reactions || []), { emoji, count: 1, users: [] }]
      };
    }));
    setShowMessageMenu(null);
  };

  const deleteMessage = (msgId: number) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
    setShowMessageMenu(null);
  };

  const pinMessage = (msgId: number) => {
    setMessages(prev => prev.map(m => 
      m.id === msgId ? { ...m, isPinned: !m.isPinned } : m
    ));
    setShowMessageMenu(null);
  };

  /* ═══════════════════════════════════════════════════════════════════════════════
     SIDEBAR COMPONENT
     ═══════════════════════════════════════════════════════════════════════════════ */
  const Sidebar = (
    <div className="flex h-full w-full flex-col" style={{ backgroundColor: '#0a0c12' }}>
      {/* Premium Header */}
      <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'linear-gradient(to right, rgba(139,92,246,0.1), rgba(217,70,239,0.1))' }}>
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(135deg, #8b5cf6, #d946ef)', boxShadow: '0 10px 25px -5px rgba(139,92,246,0.4)' }}>
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2" style={{ borderColor: '#0a0c12' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-white tracking-wide truncate">E@Akhuwat</h2>
          <p className="text-xs uppercase tracking-widest font-semibold mt-0.5 flex items-center gap-1" style={{ color: '#a78bfa' }}>
            <Crown className="w-3 h-3" /> Premium Lounge
          </p>
        </div>
        <button onClick={() => setShowNotifPanel(true)} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
          <Bell className="h-5 w-5" style={{ color: '#94a3b8' }} />
        </button>
      </div>

      {/* Tabs */}
      <div className="p-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex gap-1.5 p-1 rounded-xl border" style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <button 
            onClick={() => setActiveTab('community')} 
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ${
              activeTab === 'community' 
                ? 'text-violet-300 border' 
                : 'hover:text-white hover:bg-white/5'
            }`}
            style={activeTab === 'community' ? { background: 'linear-gradient(to right, rgba(139,92,246,0.2), rgba(217,70,239,0.2))', borderColor: 'rgba(139,92,246,0.3)' } : { color: '#94a3b8' }}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Community
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('dms')} 
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ${
              activeTab === 'dms' 
                ? 'text-emerald-300 border' 
                : 'hover:text-white hover:bg-white/5'
            }`}
            style={activeTab === 'dms' ? { background: 'linear-gradient(to right, rgba(16,185,129,0.2), rgba(20,184,166,0.2))', borderColor: 'rgba(16,185,129,0.3)' } : { color: '#94a3b8' }}
          >
            <div className="flex items-center justify-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" /> DMs
              <span className="text-white text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#10b981' }}>3</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {activeTab === 'community' ? (
          <>
            {/* Join Room Input */}
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5" style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <Search className="h-4 w-4" style={{ color: '#64748b' }} />
              <input 
                value={roomIdInput} 
                onChange={(e) => setRoomIdInput(e.target.value)} 
                placeholder="Join by Room ID..." 
                className="flex-1 bg-transparent text-xs text-white outline-none"
                style={{ color: 'white' }}
              />
              <button 
                onClick={() => roomIdInput.trim() && setRoomIdInput('')} 
                className="rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
                style={{ backgroundColor: 'rgba(139,92,246,0.2)', color: '#c4b5fd' }}
              >
                Join
              </button>
            </div>

            {/* Pinned Channel */}
            <button 
              onClick={() => handleSelectRoom('announcements')} 
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 ${
                !selectedDM && selectedRoomId === 'announcements' 
                  ? 'border' 
                  : 'border border-transparent hover:bg-white/5'
              }`}
              style={!selectedDM && selectedRoomId === 'announcements' ? { background: 'linear-gradient(to right, rgba(139,92,246,0.15), rgba(217,70,239,0.15))', borderColor: 'rgba(139,92,246,0.3)' } : {}}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                !selectedDM && selectedRoomId === 'announcements' ? 'text-violet-300' : ''
              }`}
              style={!selectedDM && selectedRoomId === 'announcements' ? { backgroundColor: 'rgba(139,92,246,0.3)' } : { backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}
              >
                <Pin className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className={`block truncate text-sm font-semibold ${!selectedDM && selectedRoomId === 'announcements' ? 'text-violet-300' : 'text-white'}`}>announcements</span>
                <span className="text-xs" style={{ color: '#64748b' }}>12.4k members</span>
              </div>
            </button>

            {/* Public Rooms */}
            <div className="space-y-1">
              <button 
                onClick={() => setChannelsOpen(!channelsOpen)} 
                className="flex w-full items-center gap-2 px-2 py-2 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
                style={{ color: '#64748b' }}
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${channelsOpen ? '' : '-rotate-90'}`} /> 
                Public Rooms
              </button>
              {channelsOpen && rooms.filter(r => !r.isVip && r.id !== 'announcements').map((room) => (
                <button 
                  key={room.id} 
                  onClick={() => handleSelectRoom(room.id)} 
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                    !selectedDM && selectedRoomId === room.id 
                      ? 'text-white' 
                      : 'hover:bg-white/5 hover:text-white'
                  }`}
                  style={!selectedDM && selectedRoomId === room.id ? { backgroundColor: 'rgba(255,255,255,0.08)' } : { color: '#94a3b8' }}
                >
                  <Hash className="h-4 w-4 shrink-0" style={{ opacity: 0.6 }} />
                  <span className="flex-1 truncate text-sm font-medium">{room.name}</span>
                  {!!room.unread && (
                    <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: '#8b5cf6' }}>
                      {room.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* VIP Rooms */}
            <div className="space-y-1">
              <button 
                onClick={() => setVipOpen(!vipOpen)} 
                className="flex w-full items-center gap-2 px-2 py-2 text-xs font-bold uppercase tracking-widest hover:text-amber-300 transition-colors"
                style={{ color: '#fbbf24' }}
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${vipOpen ? '' : '-rotate-90'}`} /> 
                <Crown className="w-3.5 h-3.5" /> VIP Exclusive
              </button>
              {vipOpen && rooms.filter(r => r.isVip).map((room) => (
                <button 
                  key={room.id} 
                  onClick={() => handleSelectRoom(room.id)} 
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 border ${
                    !selectedDM && selectedRoomId === room.id 
                      ? 'text-amber-300' 
                      : 'border-transparent hover:bg-white/5 hover:text-amber-300'
                  }`}
                  style={!selectedDM && selectedRoomId === room.id ? { backgroundColor: 'rgba(251,191,36,0.15)', borderColor: 'rgba(251,191,36,0.3)' } : { color: '#94a3b8' }}
                >
                  <Lock className="h-4 w-4 shrink-0" style={{ opacity: 0.8 }} />
                  <div className="flex-1 min-w-0">
                    <span className="block truncate text-sm font-medium">{room.name}</span>
                    <span className="text-xs" style={{ color: '#64748b' }}>{room.memberCount} members</span>
                  </div>
                  <Crown className="h-3.5 w-3.5" style={{ color: '#fbbf24' }} />
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-1">
            {/* DM Search */}
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5 mb-3" style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <Search className="h-4 w-4" style={{ color: '#64748b' }} />
              <input 
                placeholder="Search messages..." 
                className="flex-1 bg-transparent text-xs outline-none"
                style={{ color: 'white' }}
              />
            </div>

            {contacts.map((c) => (
              <button 
                key={c.id} 
                onClick={() => openDM(c.id)} 
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 border ${
                  selectedDM === c.id 
                    ? 'text-emerald-300' 
                    : 'border-transparent hover:bg-white/5'
                }`}
                style={selectedDM === c.id ? { background: 'linear-gradient(to right, rgba(16,185,129,0.15), rgba(20,184,166,0.15))', borderColor: 'rgba(16,185,129,0.3)' } : {}}
              >
                <div className="relative shrink-0">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold text-white ${
                    selectedDM === c.id ? '' : ''
                  }`}
                  style={selectedDM === c.id ? { background: 'linear-gradient(135deg, #10b981, #14b8a6)' } : { backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    {c.initials}
                  </div>
                  {c.online && (
                    <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 bg-emerald-500" style={{ borderColor: '#0a0c12' }} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-center">
                    <span className={`truncate font-semibold text-sm ${selectedDM === c.id ? 'text-emerald-300' : 'text-white'}`}>
                      {c.name}
                    </span>
                    <span className="text-xs" style={{ color: '#64748b' }}>{c.lastSeen}</span>
                  </div>
                  <p className="truncate text-xs mt-0.5" style={{ color: '#94a3b8' }}>{c.lastMsg}</p>
                </div>
                {c.badge && (
                  <div className={`px-1.5 py-0.5 rounded text-xs font-bold uppercase ${
                    c.badge === 'team' ? 'text-violet-300' :
                    c.badge === 'vip' ? 'text-amber-300' :
                    'text-emerald-300'
                  }`}
                  style={c.badge === 'team' ? { backgroundColor: 'rgba(139,92,246,0.3)' } : c.badge === 'vip' ? { backgroundColor: 'rgba(251,191,36,0.3)' } : { backgroundColor: 'rgba(16,185,129,0.3)' }}
                  >
                    {c.badge}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create Room Button */}
      {activeTab === 'community' && (
        <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button 
            onClick={() => setShowCreateRoomModal(true)} 
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all hover:scale-102 active:scale-98"
            style={{ background: 'linear-gradient(to right, #7c3aed, #d946ef)', boxShadow: '0 10px 25px -5px rgba(139,92,246,0.4)' }}
          >
            <Plus className="h-4 w-4" /> Create Room
          </button>
        </div>
      )}

      {/* User Profile Mini */}
      <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
        <button 
          onClick={() => openProfile({
            id: 'you',
            name: 'You',
            initials: 'YO',
            online: true,
            role: 'Member',
            wallet: '0xYour...Wallet',
            bio: 'Premium member since 2024',
            joinedDate: 'March 2024'
          })}
          className="flex w-full items-center gap-3 rounded-xl p-2 hover:bg-white/5 transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #8b5cf6, #d946ef)' }}>
            YO
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-white truncate">You</p>
            <p className="text-xs" style={{ color: '#a78bfa' }}>Premium Member</p>
          </div>
          <Settings className="h-4 w-4" style={{ color: '#64748b' }} />
        </button>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════════════
     CHAT CANVAS COMPONENT
     ═══════════════════════════════════════════════════════════════════════════════ */
  const ChatCanvas = (
    <div className="flex h-full w-full flex-col" style={{ backgroundColor: '#07080c' }}>
      {/* Premium Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(10,12,18,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-3 min-w-0">
          {isMobile && (
            <button 
              onClick={() => setMobileShowChat(false)} 
              className="rounded-xl p-2 -ml-2 hover:bg-white/10 hover:text-white transition-colors"
              style={{ color: '#94a3b8' }}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div 
            onClick={() => selectedDM && activeDMObj && openMemberProfile(activeDMObj)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl cursor-pointer transition-transform hover:scale-105"
            style={selectedDM 
              ? { background: 'linear-gradient(135deg, #10b981, #14b8a6)', boxShadow: '0 10px 25px -5px rgba(16,185,129,0.4)' }
              : activeRoom?.isVip 
                ? { background: 'linear-gradient(135deg, #fbbf24, #f97316)', boxShadow: '0 10px 25px -5px rgba(251,191,36,0.4)' }
                : { background: 'linear-gradient(135deg, #8b5cf6, #d946ef)', boxShadow: '0 10px 25px -5px rgba(139,92,246,0.4)' }
            }
          >
            {selectedDM ? <User className="h-5 w-5 text-white" /> : activeRoom?.isVip ? <Crown className="h-5 w-5 text-white" /> : <Hash className="h-5 w-5 text-white" />}
          </div>
          <div 
            className="min-w-0 cursor-pointer"
            onClick={() => selectedDM && activeDMObj && openMemberProfile(activeDMObj)}
          >
            <h1 className="truncate text-base font-bold text-white flex items-center gap-2">
              {activeTitle}
              {selectedDM && activeDMObj?.role === 'Admin' && <BadgeCheck className="h-4 w-4" style={{ color: '#8b5cf6' }} />}
              {activeRoom?.isVip && <Crown className="h-4 w-4" style={{ color: '#fbbf24' }} />}
            </h1>
            <p className="truncate text-xs flex items-center gap-1.5" style={{ color: '#94a3b8' }}>
              {selectedDM ? (
                <>
                  <span className={`w-2 h-2 rounded-full ${activeDMObj?.online ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                  {activeDMObj?.online ? 'Online' : `Last seen ${activeDMObj?.lastSeen}`}
                </>
              ) : (
                <>
                  <Users className="w-3 h-3" /> {activeRoom?.memberCount?.toLocaleString()} members
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setShowSearchInChat(!showSearchInChat)}
            className={`rounded-xl p-2.5 transition-colors ${showSearchInChat ? 'text-violet-400' : 'hover:bg-white/10 hover:text-white'}`}
            style={showSearchInChat ? { backgroundColor: 'rgba(139,92,246,0.2)' } : { color: '#94a3b8' }}
          >
            <Search className="h-5 w-5" />
          </button>
          {!selectedDM && (
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="rounded-xl p-2.5 hover:bg-white/10 hover:text-white transition-colors"
              style={{ color: '#94a3b8' }}
            >
              <Settings className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Search in Chat */}
      {showSearchInChat && (
        <div className="px-4 py-2 border-b" style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 rounded-xl border px-3 py-2" style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <Search className="h-4 w-4" style={{ color: '#64748b' }} />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in conversation..." 
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'white' }}
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ color: '#94a3b8' }} className="hover:text-white">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* Pinned Message */}
        {activeChannelMessages.some(m => m.isPinned) && (
          <div className="mb-4 rounded-xl border p-3" style={{ backgroundColor: 'rgba(251,191,36,0.1)', borderColor: 'rgba(251,191,36,0.3)' }}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#fbbf24' }}>
              <Pin className="w-3.5 h-3.5" /> Pinned Message
            </div>
            {activeChannelMessages.filter(m => m.isPinned).map(msg => (
              <div key={msg.id} className="text-sm" style={{ color: '#cbd5e1' }}>
                <span className="font-semibold text-white">{msg.user}:</span> {msg.text}
              </div>
            ))}
          </div>
        )}

        {activeChannelMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full" style={{ color: '#64748b' }}>
            <MessageCircle className="h-16 w-16 mb-4" style={{ opacity: 0.3 }} />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          activeChannelMessages.map((msg) => (
            <div 
              key={msg.id} 
              className={`group flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[90%] sm:max-w-[75%] gap-3 ${msg.isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                <button 
                  onClick={() => openMessageProfile(msg)} 
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-lg transition-all hover:scale-110 ${
                    msg.isOwn ? 'text-white' : 'text-white border'
                  }`}
                  style={msg.isOwn 
                    ? { background: 'linear-gradient(135deg, #8b5cf6, #d946ef)' } 
                    : { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }
                  }
                >
                  {msg.initials}
                </button>
                <div className="flex min-w-0 flex-col">
                  <div className={`mb-1 flex items-center gap-2 ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                    {!msg.isOwn && <span className="text-sm font-semibold text-white">{msg.user}</span>}
                    {msg.role && msg.role !== 'You' && (
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1"
                        style={{ 
                          backgroundColor: msg.role === 'Admin' ? 'rgba(139,92,246,0.15)' : msg.role === 'Moderator' ? 'rgba(16,185,129,0.15)' : msg.role === 'VIP Member' ? 'rgba(251,191,36,0.15)' : 'rgba(100,116,139,0.15)',
                          borderColor: msg.role === 'Admin' ? 'rgba(139,92,246,0.3)' : msg.role === 'Moderator' ? 'rgba(16,185,129,0.3)' : msg.role === 'VIP Member' ? 'rgba(251,191,36,0.3)' : 'rgba(100,116,139,0.3)',
                          color: msg.role === 'Admin' ? '#a78bfa' : msg.role === 'Moderator' ? '#34d399' : msg.role === 'VIP Member' ? '#fbbf24' : '#94a3b8'
                        }}
                      >
                        {msg.role === 'Admin' && <Crown className="w-3 h-3" />}
                        {msg.role === 'Moderator' && <Shield className="w-3 h-3" />}
                        {msg.role === 'VIP Member' && <Star className="w-3 h-3" />}
                        {msg.role}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: '#64748b' }}>{msg.time}</span>
                    {msg.isEdited && <span className="text-xs" style={{ color: '#64748b' }}>(edited)</span>}
                  </div>
                  
                  {/* Reply Preview */}
                  {msg.replyToId && (
                    <div className="mb-2 rounded-r-lg border-l-2 px-3 py-2 text-xs" style={{ borderColor: 'rgba(139,92,246,0.5)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                      <span style={{ color: '#a78bfa' }} className="font-semibold">
                        {activeChannelMessages.find(m => m.id === msg.replyToId)?.user}
                      </span>
                      <p className="truncate mt-0.5" style={{ color: '#94a3b8' }}>
                        {activeChannelMessages.find(m => m.id === msg.replyToId)?.text}
                      </p>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg transition-all ${
                    msg.isOwn ? 'rounded-tr-sm text-white' : 'rounded-tl-sm border text-slate-200'
                  }`}
                  style={msg.isOwn 
                    ? { background: 'linear-gradient(135deg, #8b5cf6, #a855f7)', boxShadow: '0 4px 20px -4px rgba(139,92,246,0.5)' }
                    : { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(4px)' }
                  }
                  >
                    {msg.text}
                    
                    {/* Message Actions */}
                    <div className="absolute -top-3 right-2 hidden items-center gap-1 rounded-lg border p-1 shadow-xl group-hover:flex"
                      style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(4px)' }}
                    >
                      <button 
                        onClick={() => setReplyTo(msg)} 
                        className="rounded p-1.5 hover:bg-white/20 hover:text-white transition-colors"
                        style={{ color: 'rgba(255,255,255,0.7)' }}
                        title="Reply"
                      >
                        <Reply className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => setShowMessageMenu(showMessageMenu === msg.id ? null : msg.id)}
                        className="rounded p-1.5 hover:bg-white/20 hover:text-white transition-colors"
                        style={{ color: 'rgba(255,255,255,0.7)' }}
                        title="More"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Message Menu Dropdown */}
                    {showMessageMenu === msg.id && (
                      <div className="absolute -top-2 right-0 z-20 w-40 rounded-xl border shadow-xl overflow-hidden"
                        style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#1a1c25' }}
                      >
                        <button 
                          onClick={() => pinMessage(msg.id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors"
                          style={{ color: '#cbd5e1' }}
                        >
                          <Pin className="h-3.5 w-3.5" /> {msg.isPinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button 
                          onClick={() => setReplyTo(msg)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors"
                          style={{ color: '#cbd5e1' }}
                        >
                          <Reply className="h-3.5 w-3.5" /> Reply
                        </button>
                        {msg.isOwn && (
                          <button 
                            onClick={() => deleteMessage(msg.id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-red-500/10 transition-colors"
                            style={{ color: '#f87171' }}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Reactions */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className={`flex gap-1 mt-1.5 ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                      {msg.reactions.map((reaction, idx) => (
                        <button 
                          key={idx}
                          onClick={() => addReaction(msg.id, reaction.emoji)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full border hover:bg-white/10 transition-colors"
                          style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                        >
                          <span>{reaction.emoji}</span>
                          <span className="text-xs" style={{ color: '#94a3b8' }}>{reaction.count}</span>
                        </button>
                      ))}
                      <button 
                        onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                        className="px-2 py-0.5 rounded-full border hover:bg-white/10 transition-colors"
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                      >
                        <Smile className="h-3 w-3" style={{ color: '#94a3b8' }} />
                      </button>
                    </div>
                  )}

                  {/* Emoji Picker for Message */}
                  {showEmojiPicker === msg.id && (
                    <div className={`mt-2 p-2 rounded-xl border shadow-xl ${msg.isOwn ? 'ml-auto' : ''}`}
                      style={{ backgroundColor: '#1a1c25', borderColor: 'rgba(255,255,255,0.1)' }}
                    >
                      <div className="flex gap-1 flex-wrap">
                        {emojis.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => addReaction(msg.id, emoji)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-lg transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t px-4 py-4" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#0a0c12' }}>
        {/* Reply Preview */}
        {replyTo && (
          <div className="mb-3 flex items-center justify-between rounded-xl border px-4 py-2.5"
            style={{ borderColor: 'rgba(139,92,246,0.3)', backgroundColor: 'rgba(139,92,246,0.1)' }}
          >
            <div className="min-w-0 flex items-center gap-2">
              <Reply className="h-4 w-4" style={{ color: '#a78bfa' }} />
              <div>
                <p className="text-xs font-bold" style={{ color: '#a78bfa' }}>Replying to {replyTo.user}</p>
                <p className="truncate text-xs max-w-[200px] sm:max-w-[400px]" style={{ color: '#94a3b8' }}>{replyTo.text}</p>
              </div>
            </div>
            <button 
              onClick={() => setReplyTo(null)} 
              className="rounded-lg p-1.5 hover:bg-black/40 transition-colors"
            >
              <X className="h-4 w-4" style={{ color: '#94a3b8' }} />
            </button>
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-2 rounded-2xl border px-3 py-2" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl p-2.5 hover:bg-white/10 hover:text-white transition-colors"
            style={{ color: '#94a3b8' }}
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <input 
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setInput(prev => prev + ` [${e.target.files![0].name}]`);
              }
            }}
          />
          
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Type a message..." 
            className="flex-1 bg-transparent text-sm outline-none min-h-[44px] py-2"
            style={{ color: 'white' }}
          />
          
          <button 
            onClick={() => setShowEmojiPicker(showEmojiPicker === -1 ? null : -1)}
            className={`rounded-xl p-2.5 transition-colors ${showEmojiPicker === -1 ? 'text-violet-400' : 'hover:bg-white/10 hover:text-white'}`}
            style={showEmojiPicker === -1 ? { backgroundColor: 'rgba(139,92,246,0.2)' } : { color: '#94a3b8' }}
          >
            <Smile className="h-5 w-5" />
          </button>
          
          <button 
            onClick={send} 
            disabled={!input.trim()} 
            className={`ml-1 rounded-xl p-3 transition-all duration-200 ${
              input.trim() ? 'hover:scale-105' : 'cursor-not-allowed'
            }`}
            style={input.trim() 
              ? { background: 'linear-gradient(to right, #7c3aed, #d946ef)', color: 'white', boxShadow: '0 0 15px rgba(139,92,246,0.4)' }
              : { backgroundColor: 'rgba(255,255,255,0.05)', color: '#475569' }
            }
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker === -1 && (
          <div className="mt-3 p-3 rounded-xl border shadow-xl"
            style={{ backgroundColor: '#1a1c25', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <div className="flex gap-1.5 flex-wrap">
              {emojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    setInput(prev => prev + emoji);
                    setShowEmojiPicker(null);
                  }}
                  className="p-2 rounded-lg hover:bg-white/10 text-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════════════
     RIGHT SIDEBAR (Desktop)
     ═══════════════════════════════════════════════════════════════════════════════ */
  const RightSidebar = !isMobile && (
    <aside className="w-80 flex-col border-l hidden xl:flex" style={{ backgroundColor: '#0a0c12', borderColor: 'rgba(255,255,255,0.06)' }}>
      {/* Room/DM Info */}
      <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={selectedDM 
              ? { background: 'linear-gradient(135deg, #10b981, #14b8a6)' }
              : activeRoom?.isVip 
                ? { background: 'linear-gradient(135deg, #fbbf24, #f97316)' }
                : { background: 'linear-gradient(135deg, #8b5cf6, #d946ef)' }
            }
          >
            {selectedDM ? <User className="h-7 w-7 text-white" /> : activeRoom?.isVip ? <Crown className="h-7 w-7 text-white" /> : <Hash className="h-7 w-7 text-white" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{activeTitle}</h3>
            <p className="text-xs" style={{ color: '#94a3b8' }}>{activeDescription}</p>
          </div>
        </div>
        
        {!selectedDM && (
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="w-full rounded-xl border py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <Settings className="h-4 w-4" /> Room Settings
          </button>
        )}
      </div>

      {/* Members */}
      <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>Members</h4>
          <span className="text-xs" style={{ color: '#64748b' }}>{communityMembers.length} online</span>
        </div>
        <div className="space-y-1">
          {communityMembers.map((m) => (
            <button 
              key={m.id} 
              onClick={() => openMemberProfile(m)} 
              className="flex w-full items-center gap-3 rounded-xl p-2.5 hover:bg-white/5 text-left transition-all group"
            >
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #475569, #334155)' }}
                >
                  {m.initials}
                </div>
                {m.online && (
                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 bg-emerald-500" style={{ borderColor: '#0a0c12' }} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white group-hover:text-violet-300 transition-colors">{m.name}</p>
                <p className="text-xs font-medium uppercase tracking-wider"
                  style={{ color: m.role === 'Admin' ? '#a78bfa' : m.role === 'Moderator' ? '#34d399' : m.role === 'VIP Member' ? '#fbbf24' : '#94a3b8' }}
                >
                  {m.role}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <Users className="h-4 w-4" /> Invite
          </button>
          <button className="flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>
      </div>
    </aside>
  );

  /* ═══════════════════════════════════════════════════════════════════════════════
     MODALS
     ═══════════════════════════════════════════════════════════════════════════════ */
  
  // Create Room Modal
  const CreateRoomModal = showCreateRoomModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
    >
      <div className="w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden"
        style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#13151f' }}
      >
        <div className="flex items-center justify-between border-b p-5" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #d946ef)' }}
            >
              <Plus className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Create Room</h3>
              <p className="text-xs" style={{ color: '#94a3b8' }}>Start a new community space</p>
            </div>
          </div>
          <button 
            onClick={() => setShowCreateRoomModal(false)} 
            className="rounded-xl p-2 hover:bg-white/10 hover:text-white transition-colors"
            style={{ color: '#94a3b8' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: '#64748b' }}>Room Name</label>
            <input 
              value={newRoomName} 
              onChange={(e) => setNewRoomName(e.target.value)} 
              placeholder="e.g. alpha-alerts" 
              className="w-full rounded-xl border px-4 py-3.5 text-sm font-semibold text-white outline-none transition-colors"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.1)' }}
              autoFocus 
            />
          </div>
          
          <button 
            onClick={() => setIsNewRoomVip(!isNewRoomVip)} 
            className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${
              isNewRoomVip ? '' : 'hover:bg-white/5'
            }`}
            style={isNewRoomVip 
              ? { borderColor: 'rgba(251,191,36,0.4)', backgroundColor: 'rgba(251,191,36,0.1)' }
              : { borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.3)' }
            }
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isNewRoomVip ? 'text-amber-400' : 'text-slate-400'}`}
              style={isNewRoomVip ? { backgroundColor: 'rgba(251,191,36,0.3)' } : { backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
              <Crown className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white flex items-center gap-2">
                VIP Exclusive {isNewRoomVip && <Check className="h-4 w-4 text-amber-400" />}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>Token-gated access for premium members only</p>
            </div>
          </button>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <button 
            onClick={() => setShowCreateRoomModal(false)} 
            className="px-5 py-2.5 text-sm font-semibold hover:text-white transition-colors"
            style={{ color: '#94a3b8' }}
          >
            Cancel
          </button>
          <button 
            onClick={handleCreateRoom} 
            disabled={!newRoomName.trim()} 
            className="rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{ 
              background: 'linear-gradient(to right, #7c3aed, #d946ef)', 
              boxShadow: '0 0 15px rgba(139,92,246,0.3)',
              opacity: newRoomName.trim() ? 1 : 0.5
            }}
          >
            Create Room
          </button>
        </div>
      </div>
    </div>
  );

  // User Profile Modal
  const ProfileModal = showUserProfileModal && profileTarget && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
    >
      <div className="w-full max-w-sm rounded-3xl border shadow-2xl overflow-hidden relative"
        style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#13151f' }}
      >
        <button 
          onClick={() => setShowUserProfileModal(false)} 
          className="absolute right-4 top-4 z-10 rounded-full p-2 hover:text-white hover:bg-black/70 transition-colors"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.7)' }}
        >
          <X className="h-5 w-5" />
        </button>
        
        {/* Banner */}
        <div className="h-36 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.5), rgba(217,70,239,0.3), transparent)' }}
        />
        
        <div className="px-6 pb-6 -mt-14">
          {/* Avatar */}
          <div className="relative inline-block">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 text-4xl font-bold text-white shadow-xl"
              style={{ borderColor: '#13151f', background: 'linear-gradient(135deg, #8b5cf6, #d946ef)' }}
            >
              {profileTarget.initials}
            </div>
            {profileTarget.online && (
              <div className="absolute bottom-2 right-2 h-6 w-6 rounded-full border-4 bg-emerald-500" style={{ borderColor: '#13151f' }} />
            )}
          </div>
          
          {/* Info */}
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              {profileTarget.name} 
              {profileTarget.role === 'Admin' && <BadgeCheck className="h-6 w-6" style={{ color: '#8b5cf6' }} />}
            </h3>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full inline-flex items-center gap-1"
              style={{ 
                backgroundColor: profileTarget.role === 'Admin' ? 'rgba(139,92,246,0.15)' : profileTarget.role === 'Moderator' ? 'rgba(16,185,129,0.15)' : profileTarget.role === 'VIP Member' ? 'rgba(251,191,36,0.15)' : 'rgba(100,116,139,0.15)',
                border: `1px solid ${profileTarget.role === 'Admin' ? 'rgba(139,92,246,0.3)' : profileTarget.role === 'Moderator' ? 'rgba(16,185,129,0.3)' : profileTarget.role === 'VIP Member' ? 'rgba(251,191,36,0.3)' : 'rgba(100,116,139,0.3)'}`,
                color: profileTarget.role === 'Admin' ? '#a78bfa' : profileTarget.role === 'Moderator' ? '#34d399' : profileTarget.role === 'VIP Member' ? '#fbbf24' : '#94a3b8'
              }}
            >
              {profileTarget.role === 'Admin' && <Crown className="w-3 h-3" />}
              {profileTarget.role === 'Moderator' && <Shield className="w-3 h-3" />}
              {profileTarget.role === 'VIP Member' && <Star className="w-3 h-3" />}
              {profileTarget.role}
            </p>
            {profileTarget.id === 'you' ? (
              <div className="mt-3">
                {editingMyBio ? (
                  <div className="flex gap-2">
                    <input
                      value={myBio}
                      onChange={(e) => setMyBio(e.target.value)}
                      className="flex-1 text-sm bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-violet-500/50"
                      maxLength={120}
                      autoFocus
                    />
                    <button onClick={() => setEditingMyBio(false)} className="px-2 py-1 text-xs font-bold rounded-lg" style={{ backgroundColor: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}>Save</button>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed cursor-pointer hover:text-white/80 transition-colors" style={{ color: '#94a3b8' }} onClick={() => setEditingMyBio(true)}>
                    {myBio || 'Tap to add bio...'}
                  </p>
                )}
              </div>
            ) : profileTarget.bio ? (
              <p className="mt-3 text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{profileTarget.bio}</p>
            ) : null}
          </div>
          
          {/* Stats */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <p className="text-lg font-bold text-white">1.2k</p>
              <p className="text-xs uppercase tracking-wider" style={{ color: '#64748b' }}>Messages</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <p className="text-lg font-bold text-white">{profileTarget.joinedDate}</p>
              <p className="text-xs uppercase tracking-wider" style={{ color: '#64748b' }}>Joined</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <p className="text-lg font-bold" style={{ color: '#a78bfa' }}>Premium</p>
              <p className="text-xs uppercase tracking-wider" style={{ color: '#64748b' }}>Status</p>
            </div>
          </div>
          
          {/* Details */}
          <div className="mt-5 space-y-3 rounded-2xl border p-4" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <div className="flex items-center gap-3">
              <Wallet className="h-4 w-4" style={{ color: '#64748b' }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>Wallet</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-xs text-white truncate">{profileTarget.wallet}</p>
                  <button 
                    onClick={() => navigator.clipboard.writeText(profileTarget.wallet || '')}
                    className="p-1 rounded hover:bg-white/10 transition-colors"
                    style={{ color: '#94a3b8' }}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4" style={{ color: '#64748b' }} />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>Status</p>
                <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${profileTarget.online ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                  {profileTarget.online ? 'Online now' : 'Offline'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="mt-5 space-y-2">
            {profileTarget.id !== 'you' && (
              <>
                <button 
                  onClick={() => { 
                    setShowUserProfileModal(false); 
                    setSelectedDM(profileTarget.id); 
                    setActiveTab('dms'); 
                    if(isMobile) setMobileShowChat(true); 
                  }} 
                  className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(to right, #7c3aed, #d946ef)', boxShadow: '0 0 20px rgba(139,92,246,0.4)' }}
                >
                  <MessageCircle className="h-4 w-4" /> Send Message
                </button>
                
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={handleBlockUser}
                    className="rounded-xl py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    style={profileTarget.isBlocked 
                      ? { backgroundColor: 'rgba(16,185,129,0.2)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }
                      : { backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }
                    }
                  >
                    <Ban className="h-4 w-4" /> 
                    {profileTarget.isBlocked ? 'Unblock' : 'Block'}
                  </button>
                  <button className="rounded-xl py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}
                  >
                    <Flag className="h-4 w-4" /> Report
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Settings Modal
  const SettingsModal = showSettingsModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
    >
      <div className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden"
        style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#13151f' }}
      >
        <div className="flex items-center justify-between border-b p-5" style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg, #475569, #334155)' }}
            >
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Room Settings</h3>
              <p className="text-xs" style={{ color: '#94a3b8' }}>Manage #{activeRoom.name}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowSettingsModal(false)} 
            className="rounded-xl p-2 hover:bg-white/10 hover:text-white transition-colors"
            style={{ color: '#94a3b8' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Notification Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl border"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}
              >
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Notifications</p>
                <p className="text-xs" style={{ color: '#94a3b8' }}>Get notified about new messages</p>
              </div>
            </div>
            <button 
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className="w-12 h-6 rounded-full transition-colors relative"
              style={{ backgroundColor: notificationsEnabled ? '#8b5cf6' : '#475569' }}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notificationsEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {/* Mute Room */}
          <div className="flex items-center justify-between p-4 rounded-xl border hover:bg-white/5 transition-colors cursor-pointer"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'rgba(251,191,36,0.2)', color: '#fbbf24' }}
              >
                <VolumeX className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Mute Room</p>
                <p className="text-xs" style={{ color: '#94a3b8' }}>Temporarily silence notifications</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5" style={{ color: '#64748b' }} />
          </div>

          {/* Pin Room */}
          <div className="flex items-center justify-between p-4 rounded-xl border hover:bg-white/5 transition-colors cursor-pointer"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'rgba(16,185,129,0.2)', color: '#34d399' }}
              >
                <Pin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Pin to Top</p>
                <p className="text-xs" style={{ color: '#94a3b8' }}>Keep this room at the top of your list</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5" style={{ color: '#64748b' }} />
          </div>

          {/* Archive */}
          <div className="flex items-center justify-between p-4 rounded-xl border hover:bg-white/5 transition-colors cursor-pointer"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'rgba(100,116,139,0.2)', color: '#94a3b8' }}
              >
                <Archive className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Archive Room</p>
                <p className="text-xs" style={{ color: '#94a3b8' }}>Hide from active rooms</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5" style={{ color: '#64748b' }} />
          </div>

          {/* Danger Zone */}
          <div className="mt-6 pt-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#f87171' }}>Danger Zone</p>
            <button className="w-full flex items-center gap-3 p-4 rounded-xl transition-colors"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-semibold">Leave Room</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════════════
     MAIN RENDER
     ═══════════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ backgroundColor: '#05060a', color: 'white' }}>
      {isMobile ? (
        mobileShowChat ? (
          <div className="flex-1 w-full">{ChatCanvas}</div>
        ) : (
          <div className="flex-1 w-full">{Sidebar}</div>
        )
      ) : (
        <>
          <aside className="w-80 shrink-0 border-r" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>{Sidebar}</aside>
          <main className="flex-1 min-w-0">{ChatCanvas}</main>
          {RightSidebar}
        </>
      )}
      
      {CreateRoomModal}
      {ProfileModal}
      {SettingsModal}
      <NotificationPanel open={showNotifPanel} onClose={() => setShowNotifPanel(false)} />
    </div>
  );
};

export default CommunityLounge;
