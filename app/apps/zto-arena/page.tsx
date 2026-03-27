'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const modules = [
  {
    title: 'Master Console',
    desc: 'Main scoring systems and production cues for iPad.',
    icon: 'fa-tablet-screen-button',
    href: '/apps/zto-arena/master',
    color: 'amber',
    bg: 'bg-amber-500/10',
    borderBase: 'border-amber-500/20',
    borderHover: 'hover:border-amber-500/50',
    text: 'text-amber-500',
  },
  {
    title: 'Ads Placement',
    desc: 'Rotate commercials and event graphics on-screen.',
    icon: 'fa-rectangle-ad',
    href: '/apps/zto-arena/ads',
    color: 'emerald',
    bg: 'bg-emerald-500/10',
    borderBase: 'border-emerald-500/20',
    borderHover: 'hover:border-emerald-500/50',
    text: 'text-emerald-500',
  },
  {
    title: 'Referee Screen',
    desc: 'Streamlined live view for referees and judges.',
    icon: 'fa-user-tie',
    href: '/apps/zto-arena/referee',
    color: 'blue',
    bg: 'bg-blue-500/10',
    borderBase: 'border-blue-500/20',
    borderHover: 'hover:border-blue-500/50',
    text: 'text-blue-500',
  },
  {
    title: 'Arena Screen',
    desc: 'The public billboard display for the big screen.',
    icon: 'fa-display',
    href: '/apps/zto-arena/screen',
    color: 'cyan',
    bg: 'bg-cyan-500/10',
    borderBase: 'border-cyan-500/20',
    borderHover: 'hover:border-cyan-500/50',
    text: 'text-cyan-400',
    fullWidth: true
  }
];

export default function ArenaHubPage() {
  const [sessionConfig, setSessionConfig] = React.useState({
    eventId: 'BINTULU_OPEN_2026',
    sportType: 'PICKLEBALL'
  });
  const [isConfigMode, setIsConfigMode] = React.useState(false);

  const sports = [
    { id: 'PICKLEBALL', name: 'Pickleball', icon: 'fa-table-tennis-paddle-ball' },
    { id: 'BADMINTON', name: 'Badminton', icon: 'fa-shuttlecock' },
    { id: 'BASKETBALL', name: 'Basketball', icon: 'fa-basketball' },
    { id: 'FUTSAL', name: 'Futsal', icon: 'fa-futbol' },
    { id: 'ARCHERY', name: 'Archery', icon: 'fa-bullseye' },
  ];

  const getUrl = (base: string) => {
    return `${base}?eventId=${sessionConfig.eventId}&sport=${sessionConfig.sportType}`;
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 md:p-12 relative flex flex-col items-center justify-center">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.05),transparent_70%)] pointer-events-none"></div>
      
      <div className="max-w-4xl w-full z-10">
        <header className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-4 mb-4"
          >
            <div className="w-12 h-12 bg-amber-500 text-black rounded-2xl flex items-center justify-center text-2xl shadow-[0_0_30px_rgba(245,158,11,0.3)]">
              <i className="fa-solid fa-trophy"></i>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-[0.2em] italic">ZTO Arena</h1>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-500 tracking-widest text-xs font-bold uppercase"
          >
            Stadium-Grade Event Control System
          </motion.p>
        </header>

        {/* Configuration Section */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 p-8 bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] flex flex-col md:flex-row gap-8 items-end"
        >
            <div className="flex-1 w-full">
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Event Session ID</label>
                <input 
                    type="text" 
                    value={sessionConfig.eventId}
                    onChange={(e) => setSessionConfig(prev => ({ ...prev, eventId: e.target.value.toUpperCase().replace(/\s+/g, '_') }))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-3 font-mono text-sm focus:outline-none focus:border-amber-500 transition-colors uppercase"
                    placeholder="E.G. KUCHING_2026"
                />
            </div>
            <div className="flex-1 w-full">
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Sport Discipline</label>
                <select 
                    value={sessionConfig.sportType}
                    onChange={(e) => setSessionConfig(prev => ({ ...prev, sportType: e.target.value }))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-3 font-bold text-sm focus:outline-none focus:border-amber-500 transition-colors appearance-none cursor-pointer"
                >
                    {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
            <div className="flex-shrink-0 flex items-center gap-3 bg-zinc-800/50 p-1.5 rounded-2xl border border-white/5">
                <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center text-lg">
                    <i className={`fa-solid ${sports.find(s => s.id === sessionConfig.sportType)?.icon || 'fa-medal'}`}></i>
                </div>
                <div className="pr-4">
                    <div className="text-[8px] font-black text-zinc-600 uppercase tracking-tighter">Ready to sync</div>
                    <div className="text-[10px] font-black uppercase text-zinc-300">{sessionConfig.sportType}</div>
                </div>
            </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modules.map((mod, idx) => (
            <motion.div
              key={mod.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * idx }}
              className={mod.fullWidth ? 'md:col-span-3' : ''}
            >
              <Link 
                href={getUrl(mod.href)}
                className={`group block h-full p-8 bg-zinc-900/40 backdrop-blur-xl border ${mod.borderBase} rounded-[2rem] ${mod.borderHover} transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden`}
              >
                <div className={`absolute -right-4 -bottom-4 opacity-5 text-8xl transition-transform duration-700 group-hover:scale-125 group-hover:rotate-12 ${mod.text}`}>
                    <i className={`fa-solid ${mod.icon}`}></i>
                </div>

                <div className={`w-14 h-14 ${mod.bg} ${mod.text} rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform`}>
                  <i className={`fa-solid ${mod.icon}`}></i>
                </div>
                
                <h3 className="text-xl font-bold mb-2 text-zinc-100 group-hover:text-white transition-colors">{mod.title}</h3>
                <p className="text-zinc-500 text-sm font-light leading-relaxed">{mod.desc}</p>

                <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-zinc-300 transition-colors">
                  <span>Enter Module</span>
                  <i className="fa-solid fa-arrow-right-long transition-transform group-hover:translate-x-2"></i>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <footer className="mt-12 text-center">
            <Link href="/" className="text-zinc-600 hover:text-zinc-400 transition-colors text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                <i className="fa-solid fa-house"></i> Back to EventOS Hub
            </Link>
        </footer>
      </div>
    </div>
  );
}

