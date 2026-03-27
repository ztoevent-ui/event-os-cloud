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
                href={mod.href}
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
