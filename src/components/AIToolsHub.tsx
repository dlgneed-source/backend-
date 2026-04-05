import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, ChevronDown, Image as ImageIcon, MessageSquare, 
  Settings, X, Key, Plus, Copy, Eye, EyeOff, Trash2, 
  Download, Check, Send, Menu, Wand2, Sliders, Mic, Paperclip,
  RefreshCw, Share2, Wallet, TrendingUp, Users,
  Zap, Clock, ArrowUpRight, ChevronRight, CreditCard,
  Shield, Activity, Server, Terminal, Calendar
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Model types
interface TextModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  latency: string;
}

interface ImageModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  latency: string;
}

const textModels: TextModel[] = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Most capable multimodal model', latency: '320ms' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', description: 'Fast and cost-effective', latency: '180ms' },
  { id: 'claude-3-5', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', description: 'Excellent for complex tasks', latency: '450ms' },
  { id: 'llama-3-70b', name: 'Llama 3.3 70B', provider: 'Meta', description: 'Open source powerhouse', latency: '280ms' },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google', description: 'Strong reasoning capabilities', latency: '350ms' },
];

const imageModels: ImageModel[] = [
  { id: 'dall-e-3', name: 'DALL·E 3', provider: 'OpenAI', description: 'Highest quality images', latency: '2.4s' },
  { id: 'midjourney-v6', name: 'Midjourney V6', provider: 'Midjourney', description: 'Artistic excellence', latency: '4.2s' },
  { id: 'stable-diffusion-xl', name: 'Stable Diffusion XL', provider: 'Stability AI', description: 'Open source flexibility', latency: '1.8s' },
  { id: 'flux-pro', name: 'Flux Pro', provider: 'Black Forest Labs', description: 'State-of-the-art detail', latency: '3.1s' },
];

const aspectRatios = [
  { id: '1:1', label: 'Square', dimensions: '1024 × 1024' },
  { id: '16:9', label: 'Wide', dimensions: '1792 × 1024' },
  { id: '9:16', label: 'Tall', dimensions: '1024 × 1792' },
  { id: '4:3', label: 'Standard', dimensions: '1440 × 1080' },
];

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
  expires: string;
  lastUsed: string;
  usage: number;
  status: 'active' | 'expired' | 'revoked';
}

const dummyApiKeys: ApiKey[] = [
  { id: 'ak_1', name: 'Production Key', key: 'sk-proj-****8f2a', created: 'Dec 1, 2024', expires: 'Dec 1, 2025', lastUsed: '2 hours ago', usage: 45230, status: 'active' },
  { id: 'ak_2', name: 'Development', key: 'sk-dev-****3b9c', created: 'Nov 15, 2024', expires: 'Never', lastUsed: '1 day ago', usage: 8934, status: 'active' },
  { id: 'ak_3', name: 'Testing', key: 'sk-test-****7d4e', created: 'Oct 20, 2024', expires: 'Oct 20, 2024', lastUsed: '2 weeks ago', usage: 1234, status: 'expired' },
];

// Message type for chat
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Stats for developer dashboard
const devStats = {
  totalRequests: 1245893,
  avgLatency: '245ms',
  activeUsers: 3421,
  errorRate: '0.02%',
  uptime: '99.99%',
};

const latencyData = [
  { time: '00:00', latency: 220 },
  { time: '04:00', latency: 180 },
  { time: '08:00', latency: 340 },
  { time: '12:00', latency: 420 },
  { time: '16:00', latency: 380 },
  { time: '20:00', latency: 290 },
];

export default function AIStudio() {
  const [activeMode, setActiveMode] = useState<'text' | 'image'>('text');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showDevDashboard, setShowDevDashboard] = useState(false);
  
  // Model selection
  const [selectedTextModel, setSelectedTextModel] = useState(textModels[0]);
  const [selectedImageModel, setSelectedImageModel] = useState(imageModels[0]);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  
  // Parameters
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState([2048]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState(aspectRatios[0]);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  // Input/Output
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  
  // API Keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(dummyApiKeys);
  const [showKeyId, setShowKeyId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('30');
  
  // Wallet
  const [balance, setBalance] = useState(1250.50);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [prompt]);

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const addKey = () => {
    if (!newKeyName.trim()) return;
    const expiryDays = parseInt(newKeyExpiry);
    const expiryDate = expiryDays > 0 
      ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Never';
    
    const newKey: ApiKey = {
      id: `ak_${Date.now()}`,
      name: newKeyName,
      key: `sk-${Math.random().toString(36).substring(2, 10)}****${Math.random().toString(36).substring(2, 6)}`,
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      expires: expiryDate,
      lastUsed: 'Never',
      usage: 0,
      status: 'active'
    };
    setApiKeys([...apiKeys, newKey]);
    setNewKeyName('');
    setNewKeyExpiry('30');
    setShowCreateKeyModal(false);
  };

  const deleteKey = (id: string) => {
    setApiKeys(apiKeys.filter(k => k.id !== id));
  };

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (amount > 0) {
      setBalance(prev => prev + amount);
      setDepositAmount('');
      setShowDepositModal(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    if (activeMode === 'text') {
      const userMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: prompt,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      setPrompt('');
      
      setTimeout(() => {
        const assistantMessage: Message = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: `This is a response from ${selectedTextModel.name}. In production, this would stream from your backend with real-time token generation.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsGenerating(false);
      }, 1500);
    } else {
      setTimeout(() => {
        setGeneratedImages(prev => [...prev, `Generated image ${prev.length + 1}`]);
        setIsGenerating(false);
        setPrompt('');
      }, 2500);
    }
  };

  const currentModel = activeMode === 'text' ? selectedTextModel : selectedImageModel;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(180deg, hsl(270 60% 5%), hsl(270 50% 3%))' }}>
      {/* Glowing Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] opacity-25">
          <div className="absolute inset-0" 
               style={{ 
                 background: 'radial-gradient(ellipse at center, hsl(270 80% 50% / 0.35) 0%, hsl(270 60% 30% / 0.15) 40%, transparent 70%)',
                 filter: 'blur(80px)'
               }} 
          />
        </div>
        <div className="absolute top-1/4 -left-32 w-48 h-48 rounded-full blur-[100px]" style={{ background: 'hsl(270 70% 40% / 0.15)' }} />
        <div className="absolute bottom-1/4 -right-32 w-48 h-48 rounded-full blur-[100px]" style={{ background: 'hsl(280 60% 40% / 0.12)' }} />
        <div className="absolute inset-0 opacity-[0.015]" 
             style={{ 
               backgroundImage: 'linear-gradient(hsl(270 60% 50% / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(270 60% 50% / 0.4) 1px, transparent 1px)',
               backgroundSize: '50px 50px'
             }} 
        />
      </div>

      {/* Header */}
      <header className="border-b border-violet-500/10 sticky top-0 z-40" style={{ background: 'linear-gradient(180deg, hsl(270 50% 8% / 0.95), hsl(270 60% 5% / 0.95))', backdropFilter: 'blur(20px)' }}>
        <div className="h-14 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 -ml-2 hover:bg-violet-500/10 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-violet-300" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Sparkles className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="leading-tight">
                <span className="font-bold text-white text-sm block">AI</span>
                <span className="font-bold text-white text-sm block -mt-0.5">Studio</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setShowWallet(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-violet-600/15 to-purple-600/15 border border-violet-500/25 rounded-xl text-sm text-violet-200 hover:border-violet-400/40 transition-all"
          >
            <Wallet className="w-4 h-4 text-violet-400" />
            <span className="font-semibold">${balance.toFixed(2)}</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
            <motion.aside 
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2 }}
              style={{ background: 'hsl(270 50% 6% / 0.95)' }}
               className={cn(
                "fixed lg:static inset-y-0 left-0 z-50 w-64 border-r border-violet-500/10 flex flex-col backdrop-blur-xl pt-16 lg:pt-0",
                "lg:translate-x-0 lg:block"
              )}
            >
              <div className="p-3">
                <button className="w-full flex items-center gap-2 px-3 py-2 bg-violet-500/10 border border-violet-500/20 rounded-lg text-sm font-medium text-violet-300 hover:bg-violet-500/20 transition-all">
                  <Plus className="w-4 h-4" />
                  New chat
                </button>
              </div>
              
              <ScrollArea className="flex-1 px-3">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-500 px-3 py-2 uppercase tracking-wider">Today</div>
                  {['Website copy ideas', 'React component help', 'Image generation prompt'].map((item, i) => (
                    <button 
                      key={i}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
                    >
                      <MessageSquare className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item}</span>
                    </button>
                  ))}
                </div>
                
                <div className="space-y-1 mt-4">
                  <div className="text-xs font-medium text-gray-500 px-3 py-2 uppercase tracking-wider">Yesterday</div>
                  {['Marketing campaign', 'Code review', 'Design feedback'].map((item, i) => (
                    <button 
                      key={i}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
                    >
                      <MessageSquare className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="p-3 border-t border-white/5">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Overlay for mobile sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Mode Toggle - 4 tabs */}
          <div className="flex items-center justify-center gap-1 p-3 border-b border-violet-500/10 overflow-x-auto scrollbar-hide">
            {[
              { key: 'text' as const, label: 'Chat', icon: MessageSquare },
              { key: 'image' as const, label: 'Images', icon: ImageIcon },
              { key: 'dev' as const, label: 'Dev', icon: Terminal },
              { key: 'apikeys' as const, label: 'API Keys', icon: Key },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  if (tab.key === 'dev') { setShowDevDashboard(true); }
                  else if (tab.key === 'apikeys') { setShowApiKeys(true); }
                  else { setActiveMode(tab.key); }
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap",
                  (tab.key === 'text' && activeMode === 'text') || (tab.key === 'image' && activeMode === 'image')
                    ? "bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            {/* Left Panel - Controls */}
            <div className="lg:w-80 border-r border-violet-500/10 overflow-y-auto" style={{ background: 'hsl(270 45% 5% / 0.5)' }}>
              <div className="p-4 space-y-6">
                {/* Model Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Model</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowModelDropdown(!showModelDropdown)}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-left hover:border-violet-500/30 hover:bg-white/[0.07] transition-all"
                    >
                      <div>
                        <div className="font-medium text-white text-sm">{currentModel.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          {currentModel.provider}
                          <span className="flex items-center gap-1 text-violet-400">
                            <Zap className="w-3 h-3" />
                            {currentModel.latency}
                          </span>
                        </div>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </button>
                    
                    <AnimatePresence>
                      {showModelDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a22] border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden"
                        >
                          {(activeMode === 'text' ? textModels : imageModels).map((model) => (
                            <button
                              key={model.id}
                              onClick={() => {
                                if (activeMode === 'text') {
                                  setSelectedTextModel(model as TextModel);
                                } else {
                                  setSelectedImageModel(model as ImageModel);
                                }
                                setShowModelDropdown(false);
                              }}
                              className={cn(
                                "w-full px-3 py-2.5 text-left hover:bg-violet-500/10 transition-colors first:rounded-t-lg last:rounded-b-lg border-b border-white/5 last:border-0",
                                currentModel.id === model.id && "bg-violet-500/10"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-white text-sm">{model.name}</span>
                                <span className="flex items-center gap-1 text-xs text-violet-400">
                                  <Zap className="w-3 h-3" />
                                  {model.latency}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">{model.description}</div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Advanced Settings Toggle */}
                <button
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <Sliders className="w-4 h-4" />
                  Advanced settings
                  <ChevronDown className={cn("w-4 h-4 transition-transform", showAdvancedSettings && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {showAdvancedSettings && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-6 overflow-hidden"
                    >
                      {activeMode === 'text' ? (
                        <>
                          {/* Temperature */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Temperature</label>
                              <span className="text-xs font-medium text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">{temperature[0]}</span>
                            </div>
                            <Slider
                              value={temperature}
                              onValueChange={setTemperature}
                              min={0}
                              max={2}
                              step={0.1}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Precise</span>
                              <span>Creative</span>
                            </div>
                          </div>

                          {/* Max Tokens */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Max Tokens</label>
                              <span className="text-xs font-medium text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">{maxTokens[0]}</span>
                            </div>
                            <Slider
                              value={maxTokens}
                              onValueChange={setMaxTokens}
                              min={256}
                              max={4096}
                              step={256}
                              className="w-full"
                            />
                          </div>

                          {/* System Prompt */}
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">System Prompt</label>
                            <textarea
                              value={systemPrompt}
                              onChange={(e) => setSystemPrompt(e.target.value)}
                              placeholder="You are a helpful assistant..."
                              rows={3}
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 resize-none transition-all"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Aspect Ratio */}
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Aspect Ratio</label>
                            <div className="grid grid-cols-2 gap-2">
                              {aspectRatios.map((ratio) => (
                                <button
                                  key={ratio.id}
                                  onClick={() => setAspectRatio(ratio)}
                                  className={cn(
                                    "px-3 py-2 border rounded-lg text-left transition-all",
                                    aspectRatio.id === ratio.id
                                      ? "border-violet-500 bg-violet-500/10 text-white"
                                      : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                                  )}
                                >
                                  <div className="text-sm font-medium">{ratio.label}</div>
                                  <div className={cn("text-xs", aspectRatio.id === ratio.id ? "text-violet-400" : "text-gray-500")}>
                                    {ratio.dimensions}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Style Options */}
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Style</label>
                            <div className="flex flex-wrap gap-2">
                              {['Vivid', 'Natural', 'Artistic', 'Photographic'].map((style) => (
                                <button
                                  key={style}
                                  className="px-3 py-1.5 text-xs font-medium border border-white/10 rounded-full text-gray-400 hover:border-violet-500/30 hover:text-violet-300 hover:bg-violet-500/10 transition-colors"
                                >
                                  {style}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Panel - Output */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0f]/50">
              {activeMode === 'text' ? (
                <>
                  {/* Chat Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-violet-500/20 to-fuchsia-600/20 rounded-2xl flex items-center justify-center mb-4 border border-violet-500/20">
                          <Sparkles className="w-8 h-8 text-violet-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">How can I help you today?</h3>
                        <p className="text-sm text-gray-500 max-w-md">
                          Start a conversation with {selectedTextModel.name}. Ask questions, get creative, or solve problems.
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 mt-6">
                          {['Explain quantum computing', 'Write a poem about AI', 'Help me debug code', 'Generate ideas'].map((suggestion) => (
                            <button
                              key={suggestion}
                              onClick={() => setPrompt(suggestion)}
                              className="px-3 py-1.5 text-sm border border-white/10 rounded-full text-gray-400 hover:border-violet-500/30 hover:text-violet-300 hover:bg-violet-500/10 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6 max-w-3xl mx-auto">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={cn(
                              "flex gap-4",
                              message.role === 'assistant' && "bg-white/[0.02] -mx-4 px-4 py-4 rounded-xl"
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                              message.role === 'user' 
                                ? "bg-gradient-to-br from-violet-600 to-fuchsia-700" 
                                : "bg-gradient-to-br from-violet-500/20 to-fuchsia-600/20 border border-violet-500/20"
                            )}>
                              {message.role === 'user' ? (
                                <span className="text-xs font-medium text-white">U</span>
                              ) : (
                                <Sparkles className="w-4 h-4 text-violet-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-white">
                                  {message.role === 'user' ? 'You' : selectedTextModel.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {message.content}
                              </div>
                            </div>
                          </div>
                        ))}
                        {isGenerating && (
                          <div className="flex gap-4 bg-white/[0.02] -mx-4 px-4 py-4 rounded-xl">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-600/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                              <Sparkles className="w-4 h-4 text-violet-400" />
                            </div>
                            <div className="flex-1 flex items-center gap-1">
                              <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Input Area */}
                  <div className="p-4 border-t border-white/5">
                    <div className="max-w-3xl mx-auto">
                      <div className="relative bg-white/5 border border-white/10 rounded-2xl hover:border-violet-500/30 hover:bg-white/[0.07] transition-all focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/50">
                        <textarea
                          ref={textareaRef}
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleGenerate();
                            }
                          }}
                          placeholder="Message..."
                          rows={1}
                          className="w-full px-4 py-3 pr-24 bg-transparent text-white placeholder:text-gray-600 resize-none focus:outline-none min-h-[48px] max-h-[200px]"
                        />
                        <div className="absolute right-2 bottom-2 flex items-center gap-1">
                          <button className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                            <Paperclip className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                            <Mic className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleGenerate}
                            disabled={!prompt.trim() || isGenerating}
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              prompt.trim() && !isGenerating
                                ? "bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white hover:opacity-90"
                                : "bg-white/5 text-gray-600 cursor-not-allowed"
                            )}
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 text-center mt-2">
                        Press Enter to send, Shift + Enter for new line
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Image Generation Area */}
                  <ScrollArea className="flex-1 p-4">
                    {generatedImages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-violet-500/20 to-fuchsia-600/20 rounded-2xl flex items-center justify-center mb-4 border border-violet-500/20">
                          <ImageIcon className="w-8 h-8 text-violet-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Create stunning images</h3>
                        <p className="text-sm text-gray-500 max-w-md">
                          Describe what you want to see and {selectedImageModel.name} will generate it for you.
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 mt-6">
                          {['A serene mountain landscape', 'Futuristic city at night', 'Abstract art composition', 'Portrait of a cat'].map((suggestion) => (
                            <button
                              key={suggestion}
                              onClick={() => setPrompt(suggestion)}
                              className="px-3 py-1.5 text-sm border border-white/10 rounded-full text-gray-400 hover:border-violet-500/30 hover:text-violet-300 hover:bg-violet-500/10 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
                        {generatedImages.map((_, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="aspect-square bg-gradient-to-br from-violet-500/10 to-fuchsia-600/10 rounded-xl flex items-center justify-center relative group overflow-hidden border border-violet-500/20"
                          >
                            <div className="text-center p-4">
                              <ImageIcon className="w-12 h-12 text-violet-400/50 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">Generated Image {index + 1}</p>
                            </div>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button className="p-2 bg-white/10 backdrop-blur rounded-lg text-white hover:bg-white/20 transition-colors">
                                <Download className="w-4 h-4" />
                              </button>
                              <button className="p-2 bg-white/10 backdrop-blur rounded-lg text-white hover:bg-white/20 transition-colors">
                                <Share2 className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  {/* Image Input Area */}
                  <div className="p-4 border-t border-white/5">
                    <div className="max-w-3xl mx-auto">
                      <div className="relative bg-white/5 border border-white/10 rounded-2xl hover:border-violet-500/30 hover:bg-white/[0.07] transition-all focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/50">
                        <textarea
                          ref={textareaRef}
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Describe the image you want to generate..."
                          rows={2}
                          className="w-full px-4 py-3 pr-32 bg-transparent text-white placeholder:text-gray-600 resize-none focus:outline-none"
                        />
                        <div className="absolute right-2 bottom-2 flex items-center gap-1">
                          <button className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                            <Wand2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleGenerate}
                            disabled={!prompt.trim() || isGenerating}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium",
                              prompt.trim() && !isGenerating
                                ? "bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white hover:opacity-90"
                                : "bg-white/5 text-gray-600 cursor-not-allowed"
                            )}
                          >
                            {isGenerating ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                Generate
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Wallet Modal */}
      <AnimatePresence>
        {showWallet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowWallet(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#0f0f14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">Wallet</h2>
                    <p className="text-xs text-gray-500">Manage your credits</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWallet(false)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6">
                {/* Balance Card */}
                <div className="bg-gradient-to-br from-violet-500/20 to-fuchsia-600/20 border border-violet-500/20 rounded-2xl p-6 mb-6">
                  <p className="text-sm text-gray-400 mb-1">Available Balance</p>
                  <p className="text-4xl font-bold text-white">${balance.toFixed(2)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <TrendingUp className="w-3 h-3" />
                      +12.5% this week
                    </span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button 
                    onClick={() => setShowDepositModal(true)}
                    className="flex items-center justify-center gap-2 p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-300 hover:bg-violet-500/20 transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    Deposit
                  </button>
                  <button className="flex items-center justify-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:bg-white/10 transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                    Withdraw
                  </button>
                </div>

                {/* Recent Transactions */}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Transactions</h3>
                  <div className="space-y-2">
                    {[
                      { type: 'Usage', desc: 'GPT-4o API calls', amount: -12.50, time: '2 hours ago' },
                      { type: 'Deposit', desc: 'Credit card payment', amount: 100.00, time: '1 day ago' },
                      { type: 'Usage', desc: 'DALL-E 3 generation', amount: -8.00, time: '2 days ago' },
                    ].map((tx, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-sm text-white">{tx.desc}</p>
                          <p className="text-xs text-gray-500">{tx.time}</p>
                        </div>
                        <span className={cn("text-sm font-medium", tx.amount > 0 ? "text-emerald-400" : "text-gray-400")}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deposit Modal */}
      <AnimatePresence>
        {showDepositModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDepositModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#0f0f14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/5">
                <h2 className="font-semibold text-white">Deposit Funds</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Amount (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {['10', '25', '50', '100'].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setDepositAmount(amount)}
                      className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 hover:border-violet-500/30 hover:text-violet-300 transition-colors"
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleDeposit}
                  disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                  className="w-full py-3 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Deposit ${depositAmount || '0.00'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Developer Dashboard Modal */}
      <AnimatePresence>
        {showDevDashboard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDevDashboard(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl bg-[#0f0f14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center">
                    <Terminal className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">Developer Dashboard</h2>
                    <p className="text-xs text-gray-500">API metrics and analytics</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDevDashboard(false)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Total Requests', value: devStats.totalRequests.toLocaleString(), icon: Activity, color: 'violet' },
                    { label: 'Avg Latency', value: devStats.avgLatency, icon: Zap, color: 'fuchsia' },
                    { label: 'Active Users', value: devStats.activeUsers.toLocaleString(), icon: Users, color: 'emerald' },
                    { label: 'Uptime', value: devStats.uptime, icon: Server, color: 'blue' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
                        <span className="text-xs text-gray-500">{stat.label}</span>
                      </div>
                      <p className="text-xl font-bold text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Latency Chart */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-white">Latency (24h)</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Avg: 245ms</span>
                    </div>
                  </div>
                  <div className="h-32 flex items-end gap-2">
                    {latencyData.map((data, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className="w-full bg-gradient-to-t from-violet-500/50 to-violet-400/30 rounded-t"
                          style={{ height: `${(data.latency / 500) * 100}%` }}
                        />
                        <span className="text-xs text-gray-600">{data.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* API Keys Table */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-white">API Key Usage</h3>
                    <button 
                      onClick={() => { setShowDevDashboard(false); setShowApiKeys(true); }}
                      className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                    >
                      Manage Keys <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left p-3 text-xs text-gray-500 font-medium">Key Name</th>
                          <th className="text-left p-3 text-xs text-gray-500 font-medium">Requests</th>
                          <th className="text-left p-3 text-xs text-gray-500 font-medium">Avg Latency</th>
                          <th className="text-left p-3 text-xs text-gray-500 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apiKeys.filter(k => k.status === 'active').map((key) => (
                          <tr key={key.id} className="border-b border-white/5 last:border-0">
                            <td className="p-3 text-sm text-white">{key.name}</td>
                            <td className="p-3 text-sm text-gray-400">{key.usage.toLocaleString()}</td>
                            <td className="p-3 text-sm text-gray-400">{Math.floor(Math.random() * 100 + 200)}ms</td>
                            <td className="p-3">
                              <span className="px-2 py-1 text-xs bg-emerald-500/10 text-emerald-400 rounded-full">
                                Active
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* API Keys Modal */}
      <AnimatePresence>
        {showApiKeys && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowApiKeys(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-[#0f0f14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center">
                    <Key className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">API Keys</h2>
                    <p className="text-xs text-gray-500">Manage your API access</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCreateKeyModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-sm text-violet-300 hover:bg-violet-500/20 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    New Key
                  </button>
                  <button
                    onClick={() => setShowApiKeys(false)}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-violet-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{key.name}</span>
                          <span className={cn(
                            "px-2 py-0.5 text-xs rounded-full",
                            key.status === 'active' && "bg-emerald-500/10 text-emerald-400",
                            key.status === 'expired' && "bg-amber-500/10 text-amber-400",
                            key.status === 'revoked' && "bg-red-500/10 text-red-400"
                          )}>
                            {key.status.charAt(0).toUpperCase() + key.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <code className="text-sm font-mono text-gray-500 bg-black/30 px-2 py-1 rounded">
                            {showKeyId === key.id ? key.key.replace(/\*/g, 'x') : key.key}
                          </code>
                          <button
                            onClick={() => setShowKeyId(showKeyId === key.id ? null : key.id)}
                            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
                          >
                            {showKeyId === key.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Created {key.created}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Expires {key.expires}
                          </span>
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            {key.usage.toLocaleString()} requests
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopyKey(key.key, key.id)}
                          className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          title="Copy"
                        >
                          {copiedKey === key.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteKey(key.id)}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                <div className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-500">
                    Keep your API keys secure. Never share them or expose them in client-side code. 
                    <a href="#" className="text-violet-400 hover:text-violet-300 ml-1">Learn more</a>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Key Modal */}
      <AnimatePresence>
        {showCreateKeyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateKeyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#0f0f14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/5">
                <h2 className="font-semibold text-white">Create API Key</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Key Name</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production Key"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Expires In</label>
                  <select
                    value={newKeyExpiry}
                    onChange={(e) => setNewKeyExpiry(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/50 appearance-none"
                  >
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="365">1 year</option>
                    <option value="0">Never</option>
                  </select>
                </div>
                <button
                  onClick={addKey}
                  disabled={!newKeyName.trim()}
                  className="w-full py-3 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Key
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
