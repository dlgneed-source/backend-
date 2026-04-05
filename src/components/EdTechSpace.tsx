import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Lock, Send, X, Bot, Clock, Paperclip, Trophy, GraduationCap,
  ArrowLeft, FileText, Download, Video, CheckCircle2,
  Star, Sparkles, Zap, BookOpen, Flame, Award,
  TrendingUp, Users, Check, Circle, LockKeyhole, ChevronRight,
  Target, Layers, Code2, Shield, Brain, Rocket, Crown
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════ */
/*                    SKILL LEVELS (matches Dashboard 6 plans)     */
/* ═══════════════════════════════════════════════════════════════ */
const skillLevels = [
  { id: 'foundation', name: 'Foundation', icon: BookOpen, color: '#fbbf24', gradient: 'from-amber-400 to-yellow-500', bg: 'bg-amber-500/15', border: 'border-amber-400/40', text: 'text-amber-400', btnGrad: 'from-amber-500 to-yellow-500' },
  { id: 'pro-builder', name: 'Pro Builder', icon: Code2, color: '#22d3ee', gradient: 'from-cyan-400 to-blue-500', bg: 'bg-cyan-500/15', border: 'border-cyan-400/40', text: 'text-cyan-400', btnGrad: 'from-cyan-500 to-blue-500' },
  { id: 'cyber-elite', name: 'Cyber Elite', icon: Shield, color: '#34d399', gradient: 'from-emerald-400 to-green-500', bg: 'bg-emerald-500/15', border: 'border-emerald-400/40', text: 'text-emerald-400', btnGrad: 'from-emerald-500 to-green-500' },
  { id: 'ai-mastery', name: 'AI Mastery', icon: Brain, color: '#e879f9', gradient: 'from-fuchsia-400 to-purple-500', bg: 'bg-fuchsia-500/15', border: 'border-fuchsia-400/40', text: 'text-fuchsia-400', btnGrad: 'from-fuchsia-500 to-purple-500' },
  { id: 'quantum-leader', name: 'Quantum Leader', icon: Rocket, color: '#f472b6', gradient: 'from-pink-400 to-rose-500', bg: 'bg-pink-500/15', border: 'border-pink-400/40', text: 'text-pink-400', btnGrad: 'from-pink-500 to-rose-500' },
  { id: 'supreme-visionary', name: 'Supreme Visionary', icon: Crown, color: '#fb7185', gradient: 'from-rose-400 to-red-500', bg: 'bg-rose-500/15', border: 'border-rose-400/40', text: 'text-rose-400', btnGrad: 'from-rose-500 to-red-500' },
];

/* ═══════════════════════════════════════════════════════════════ */
/*                    COURSE DATA (all 6 levels)                   */
/* ═══════════════════════════════════════════════════════════════ */
const courses = [
  // Foundation
  { id: 1, title: 'HTML, CSS & JS Fundamentals', duration: '12h 30m', emoji: '🌐', locked: false, progress: 100, levelId: 'foundation', lessons: 24, students: '12.5K', rating: 4.9 },
  { id: 2, title: 'Python for Termux Users', duration: '8h 45m', emoji: '🐍', locked: false, progress: 65, levelId: 'foundation', lessons: 18, students: '9.2K', rating: 4.8 },
  { id: 3, title: 'Linux Command Line Mastery', duration: '6h 20m', emoji: '🐧', locked: false, progress: 30, levelId: 'foundation', lessons: 15, students: '15.1K', rating: 4.9 },
  // Pro Builder
  { id: 4, title: 'React.js & Tailwind CSS', duration: '18h 15m', emoji: '⚛️', locked: true, progress: 0, levelId: 'pro-builder', lessons: 32, students: '22.3K', rating: 4.9 },
  { id: 5, title: 'SQL & DBMS Foundations', duration: '10h 40m', emoji: '🗄️', locked: true, progress: 0, levelId: 'pro-builder', lessons: 22, students: '8.7K', rating: 4.7 },
  { id: 6, title: 'Git & Github Complete', duration: '5h 55m', emoji: '🔀', locked: true, progress: 0, levelId: 'pro-builder', lessons: 14, students: '18.9K', rating: 4.8 },
  { id: 7, title: 'Bot Architecture (TG/Discord)', duration: '14h 20m', emoji: '🤖', locked: true, progress: 0, levelId: 'pro-builder', lessons: 28, students: '6.4K', rating: 4.9 },
  // Cyber Elite
  { id: 8, title: 'Ethical Hacking Foundations', duration: '22h 10m', emoji: '🔓', locked: true, progress: 0, levelId: 'cyber-elite', lessons: 42, students: '11.2K', rating: 5.0 },
  { id: 9, title: 'Network Analysis (Wireshark)', duration: '11h 25m', emoji: '📡', locked: true, progress: 0, levelId: 'cyber-elite', lessons: 24, students: '7.8K', rating: 4.8 },
  { id: 10, title: 'Web App Security Testing', duration: '9h 50m', emoji: '🛡️', locked: true, progress: 0, levelId: 'cyber-elite', lessons: 20, students: '5.6K', rating: 4.9 },
  // AI Mastery
  { id: 11, title: 'Neural Networks Deep Dive', duration: '16h 50m', emoji: '🧠', locked: true, progress: 0, levelId: 'ai-mastery', lessons: 35, students: '5.3K', rating: 4.9 },
  { id: 12, title: 'Data Analysis with Python', duration: '13h 20m', emoji: '📊', locked: true, progress: 0, levelId: 'ai-mastery', lessons: 28, students: '8.1K', rating: 4.8 },
  { id: 13, title: 'AI API Integration', duration: '10h 15m', emoji: '🔗', locked: true, progress: 0, levelId: 'ai-mastery', lessons: 22, students: '4.2K', rating: 4.9 },
  // Quantum Leader
  { id: 14, title: 'Cloud Architecture (AWS/GCP)', duration: '20h 30m', emoji: '☁️', locked: true, progress: 0, levelId: 'quantum-leader', lessons: 38, students: '3.8K', rating: 4.9 },
  { id: 15, title: 'DevOps & CI/CD Pipelines', duration: '15h 45m', emoji: '🔄', locked: true, progress: 0, levelId: 'quantum-leader', lessons: 30, students: '4.5K', rating: 4.8 },
  { id: 16, title: 'System Design Masterclass', duration: '18h 10m', emoji: '🏗️', locked: true, progress: 0, levelId: 'quantum-leader', lessons: 34, students: '6.1K', rating: 5.0 },
  // Supreme Visionary
  { id: 17, title: 'Blockchain & Web3 Development', duration: '24h 00m', emoji: '⛓️', locked: true, progress: 0, levelId: 'supreme-visionary', lessons: 45, students: '2.9K', rating: 4.9 },
  { id: 18, title: 'Quantum Computing Basics', duration: '12h 30m', emoji: '⚡', locked: true, progress: 0, levelId: 'supreme-visionary', lessons: 26, students: '1.8K', rating: 4.8 },
  { id: 19, title: 'Advanced AI & AGI Concepts', duration: '22h 45m', emoji: '🚀', locked: true, progress: 0, levelId: 'supreme-visionary', lessons: 40, students: '2.1K', rating: 5.0 },
];

const attachments = [
  { name: 'Course_Syllabus.pdf', size: '2.4 MB', icon: FileText },
  { name: 'Python_Cheatsheet.pdf', size: '1.1 MB', icon: FileText },
  { name: 'Project_Starter.zip', size: '8.7 MB', icon: Paperclip },
  { name: 'Source_Code.zip', size: '15.2 MB', icon: Paperclip },
];

interface ChatMsg { role: 'user' | 'ai'; text: string; }

const getLevel = (id: string) => skillLevels.find(l => l.id === id)!;

/* ═══════════════════════════════════════════════════════════════ */
/*                    MAIN COMPONENT                               */
/* ═══════════════════════════════════════════════════════════════ */
const EdTechSpace: React.FC = () => {
  const [activeCourseId, setActiveCourseId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'attachments' | 'certificate'>('overview');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [showAI, setShowAI] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { role: 'ai', text: "👋 Welcome! I'm your AI learning assistant. Ask me anything about your courses." },
  ]);
  const filterRef = useRef<HTMLDivElement>(null);

  const activeCourse = courses.find(c => c.id === activeCourseId);
  const activeLevel = activeCourse ? getLevel(activeCourse.levelId) : null;

  const filteredCourses = selectedLevel === 'all' ? courses : courses.filter(c => c.levelId === selectedLevel);

  const totalProgress = Math.round(courses.filter(c => !c.locked).reduce((a, c) => a + c.progress, 0) / Math.max(courses.filter(c => !c.locked).length, 1));

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { role: 'user', text: chatInput }]);
    setChatInput('');
    setTimeout(() => {
      setChatMessages(prev => [...prev, { role: 'ai', text: '🎯 Great question! Based on your progress, I recommend focusing on completing your current module before advancing.' }]);
    }, 1200);
  };

  /* ─── COURSE DETAIL VIEW ─── */
  if (activeCourse && activeLevel) {
    return (
      <div className="flex-1 flex flex-col pb-16 overflow-hidden bg-slate-950 text-white min-h-screen">
        {/* Compact header */}
        <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/60">
          <div className="flex items-center gap-3 px-4 py-3">
            <button onClick={() => setActiveCourseId(null)} className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center active:scale-95 transition-transform">
              <ArrowLeft className="w-4 h-4 text-slate-300" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{activeCourse.title}</p>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${activeLevel.text}`}>{activeLevel.name}</p>
            </div>
            <span className="text-2xl">{activeCourse.emoji}</span>
          </div>
        </div>

        {/* Video player area */}
        <div className="w-full aspect-video bg-slate-900 relative flex items-center justify-center overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${activeLevel.gradient} opacity-10`} />
          <div className="text-center z-10">
            <motion.button
              whileTap={{ scale: 0.9 }}
              className={`w-16 h-16 rounded-full bg-gradient-to-r ${activeLevel.btnGrad} flex items-center justify-center mx-auto mb-3 shadow-xl`}
            >
              <Play className="w-7 h-7 text-white ml-1" fill="white" />
            </motion.button>
            <p className="text-sm font-bold">Resume Learning</p>
            <p className="text-xs text-slate-400 mt-0.5">Module 3: Advanced Concepts</p>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-1 bg-slate-800">
            <div className={`h-full bg-gradient-to-r ${activeLevel.gradient}`} style={{ width: `${activeCourse.progress}%` }} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md sticky top-[52px] z-20 overflow-x-auto scrollbar-hide">
          {(['overview', 'attachments', 'certificate'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[100px] px-4 py-3.5 text-xs font-bold uppercase tracking-wider transition-all relative ${activeTab === tab ? 'text-white' : 'text-slate-500'}`}
            >
              {tab}
              {activeTab === tab && <motion.div layoutId="dtab" className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r ${activeLevel.gradient}`} />}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 space-y-5">
                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { icon: Video, label: 'Lessons', value: activeCourse.lessons },
                    { icon: Clock, label: 'Duration', value: activeCourse.duration.split(' ')[0] },
                    { icon: Star, label: 'Rating', value: activeCourse.rating },
                    { icon: Users, label: 'Students', value: activeCourse.students },
                  ].map(s => (
                    <div key={s.label} className="p-3 rounded-2xl bg-slate-900 border border-slate-800/60 text-center">
                      <s.icon className={`w-4 h-4 mx-auto mb-1.5 ${activeLevel.text}`} />
                      <p className="text-sm font-bold">{s.value}</p>
                      <p className="text-[10px] text-slate-500">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Description */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/60">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Master the fundamentals and advanced concepts through hands-on projects.
                    This comprehensive course includes {activeCourse.lessons} video lessons,
                    practical assignments, and a verified completion certificate.
                  </p>
                </div>

                {/* Instructor */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800/60">
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${activeLevel.gradient} flex items-center justify-center text-sm font-bold`}>EA</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">E@Akhuwat Academy</p>
                    <p className={`text-xs ${activeLevel.text}`}>Official Instructor</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>

                {/* Lesson list */}
                <div>
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><Layers className="w-4 h-4 text-fuchsia-400" /> Course Content</h4>
                  <div className="space-y-2">
                    <div className={`p-3 rounded-xl ${activeLevel.bg} border ${activeLevel.border}`}>
                      <p className="text-xs font-bold flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-amber-400" /> Section 1: Introduction</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">5 lessons • 45 mins</p>
                    </div>
                    {[1, 2, 3, 4, 5].map((l, i) => (
                      <button key={l} className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${i === 0 ? `${activeLevel.bg} border ${activeLevel.border}` : 'bg-slate-900 border border-slate-800/40 active:bg-slate-800'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${i === 0 ? `bg-gradient-to-r ${activeLevel.btnGrad}` : 'bg-slate-800'}`}>
                          {i === 0 ? <Play className="w-3.5 h-3.5 text-white ml-0.5" /> : i < 3 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Circle className="w-3.5 h-3.5 text-slate-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold truncate ${i === 0 ? 'text-white' : 'text-slate-300'}`}>
                            {i + 1}. {['Course Introduction', 'Setting Up Environment', 'Basic Concepts', 'Advanced Topics', 'Project Walkthrough'][i]}
                          </p>
                          <p className="text-[10px] text-slate-500">12:30</p>
                        </div>
                        {i === 0 && <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${activeLevel.text} bg-slate-950`}>NOW</span>}
                      </button>
                    ))}
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/40 opacity-50">
                      <p className="text-xs font-bold text-slate-500 flex items-center gap-2"><Lock className="w-3.5 h-3.5" /> Section 2: Advanced Concepts</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">8 lessons • 1h 20m</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'attachments' && (
              <motion.div key="att" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2 mb-1"><Paperclip className="w-4 h-4 text-fuchsia-400" /> Resources</h4>
                {attachments.map(file => (
                  <div key={file.name} className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800/60 active:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${activeLevel.bg} border ${activeLevel.border} flex items-center justify-center`}>
                        <file.icon className={`w-4 h-4 ${activeLevel.text}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{file.name}</p>
                        <p className="text-[10px] text-slate-500">{file.size}</p>
                      </div>
                    </div>
                    <button className={`w-9 h-9 rounded-xl bg-gradient-to-r ${activeLevel.btnGrad} flex items-center justify-center active:scale-90 transition-transform`}>
                      <Download className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'certificate' && (
              <motion.div key="cert" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
                <div className={`relative rounded-3xl border border-slate-800/60 bg-slate-900 p-6 overflow-hidden`}>
                  <div className={`absolute -inset-1 bg-gradient-to-r ${activeLevel.gradient} opacity-10 blur-2xl`} />
                  <div className="text-center relative z-10">
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${activeLevel.gradient} flex items-center justify-center mx-auto mb-5 shadow-xl`}>
                      <Trophy className="w-9 h-9 text-white" />
                    </div>
                    <h3 className="text-xl font-extrabold mb-2">Certificate of Completion</h3>
                    <p className="text-sm text-slate-400 mb-6">Complete all lessons to unlock your verified credential.</p>

                    {/* Progress ring */}
                    <div className="relative w-32 h-32 mx-auto mb-6">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="7" />
                        <circle cx="50" cy="50" r="42" fill="none" stroke={activeLevel.color} strokeWidth="7" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 42}`}
                          strokeDashoffset={`${2 * Math.PI * 42 * (1 - (activeCourse.progress) / 100)}`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">{activeCourse.progress}%</span>
                      </div>
                    </div>

                    <button
                      disabled={activeCourse.progress !== 100}
                      className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${activeCourse.progress === 100 ? `bg-gradient-to-r ${activeLevel.btnGrad} text-white shadow-lg active:scale-95` : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                    >
                      {activeCourse.progress === 100 ? (
                        <span className="flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Download Certificate</span>
                      ) : (
                        <span className="flex items-center justify-center gap-2"><Lock className="w-4 h-4" /> Complete Course to Unlock</span>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI FAB */}
        <AIChatFAB showAI={showAI} setShowAI={setShowAI} chatMessages={chatMessages} chatInput={chatInput} setChatInput={setChatInput} sendChat={sendChat} />
      </div>
    );
  }

  /* ─── CATALOG VIEW (Mobile-First) ─── */
  return (
    <div className="flex-1 flex flex-col pb-16 overflow-hidden bg-slate-950 text-white min-h-screen">
      {/* Header — compact mobile */}
      <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/60">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/25">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight">E@Akhuwat Academy</h1>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-fuchsia-400">Premium Learning</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800/60">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-bold">12</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Quick Stats Bar */}
        <div className="px-4 py-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800/60 text-center">
              <p className="text-lg font-bold text-fuchsia-400">{totalProgress}%</p>
              <p className="text-[10px] text-slate-500">Overall</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800/60 text-center">
              <p className="text-lg font-bold text-emerald-400">{courses.filter(c => c.progress === 100).length}</p>
              <p className="text-[10px] text-slate-500">Completed</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800/60 text-center">
              <p className="text-lg font-bold text-amber-400">{courses.length}</p>
              <p className="text-[10px] text-slate-500">Total</p>
            </div>
          </div>
        </div>

        {/* Level filter pills — horizontal scroll */}
        <div ref={filterRef} className="px-4 pb-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 w-max">
            <button
              onClick={() => setSelectedLevel('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedLevel === 'all' ? 'bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30' : 'bg-slate-900 text-slate-400 border border-slate-800/60 active:bg-slate-800'}`}
            >
              All ({courses.length})
            </button>
            {skillLevels.map(level => {
              const count = courses.filter(c => c.levelId === level.id).length;
              return (
                <button
                  key={level.id}
                  onClick={() => setSelectedLevel(level.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${selectedLevel === level.id ? `bg-gradient-to-r ${level.btnGrad} text-white shadow-lg` : 'bg-slate-900 text-slate-400 border border-slate-800/60 active:bg-slate-800'}`}
                >
                  <level.icon className="w-3.5 h-3.5" />
                  {level.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Course cards — mobile optimized list */}
        <div className="px-4 pb-8 space-y-3">
          {filteredCourses.map((course, i) => {
            const level = getLevel(course.levelId);
            return (
              <motion.button
                key={course.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
                onClick={() => !course.locked && setActiveCourseId(course.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all active:scale-[0.98] ${
                  course.locked
                    ? 'bg-slate-900/60 border border-slate-800/40 opacity-60'
                    : `bg-slate-900 border ${level.border} shadow-sm`
                }`}
              >
                {/* Emoji thumbnail */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 relative overflow-hidden ${course.locked ? 'bg-slate-800' : `bg-gradient-to-br ${level.gradient} bg-opacity-20 ${level.bg}`}`}>
                  {course.locked ? (
                    <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
                      <LockKeyhole className="w-5 h-5 text-slate-500" />
                    </div>
                  ) : (
                    <span className="relative z-10">{course.emoji}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${level.text}`}>{level.name}</span>
                    <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                      <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />{course.rating}
                    </span>
                  </div>
                  <p className={`text-sm font-semibold truncate ${course.locked ? 'text-slate-500' : 'text-white'}`}>{course.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><Video className="w-3 h-3" />{course.lessons}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.students}</span>
                  </div>
                  {/* Progress bar */}
                  {!course.locked && course.progress > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${level.gradient}`} style={{ width: `${course.progress}%` }} />
                      </div>
                      <span className={`text-[10px] font-bold ${level.text}`}>{course.progress}%</span>
                    </div>
                  )}
                </div>

                {/* Action */}
                <div className="shrink-0">
                  {course.locked ? (
                    <Lock className="w-4 h-4 text-slate-600" />
                  ) : (
                    <ChevronRight className={`w-5 h-5 ${level.text}`} />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* AI FAB */}
      <AIChatFAB showAI={showAI} setShowAI={setShowAI} chatMessages={chatMessages} chatInput={chatInput} setChatInput={setChatInput} sendChat={sendChat} />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/*                    AI CHAT FAB (extracted)                       */
/* ═══════════════════════════════════════════════════════════════ */
const AIChatFAB: React.FC<{
  showAI: boolean;
  setShowAI: (v: boolean) => void;
  chatMessages: ChatMsg[];
  chatInput: string;
  setChatInput: (v: string) => void;
  sendChat: () => void;
}> = ({ showAI, setShowAI, chatMessages, chatInput, setChatInput, sendChat }) => (
  <>
    <AnimatePresence>
      {!showAI && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAI(true)}
          className="fixed bottom-20 right-4 w-14 h-14 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 flex items-center justify-center z-40 shadow-xl shadow-fuchsia-500/30 border border-white/10"
        >
          <Bot className="w-6 h-6 text-white" />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
        </motion.button>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {showAI && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 right-3 left-3 sm:left-auto sm:w-[380px] h-[420px] z-50 bg-slate-950 border border-slate-800/60 flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60 bg-slate-900/80 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="block text-xs font-bold">AI Assistant</span>
                <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
                </span>
              </div>
            </div>
            <button onClick={() => setShowAI(false)} className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center active:scale-90">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white rounded-2xl rounded-tr-sm'
                    : 'bg-slate-900 border border-slate-800/60 rounded-2xl rounded-tl-sm text-slate-200'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-800/60 bg-slate-900/80 shrink-0">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800/60 rounded-xl px-3 py-2.5 focus-within:border-fuchsia-500/40">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder="Ask anything..."
                className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-600 focus:outline-none"
              />
              <button onClick={sendChat} disabled={!chatInput.trim()} className="w-8 h-8 rounded-lg bg-gradient-to-r from-fuchsia-500 to-pink-500 disabled:opacity-30 flex items-center justify-center active:scale-90">
                <Send className="w-3.5 h-3.5 text-white ml-0.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </>
);

export default EdTechSpace;
