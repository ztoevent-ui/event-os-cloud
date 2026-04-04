'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

const modules = [
  { 
    title: 'Tournament Architect', 
    desc: 'Configure round rules, tie templates, and scoring logic.', 
    path: '/architect', 
    icon: 'fa-vial-circle-check',
    bg: 'bg-violet-500/10',
    text: 'text-violet-500',
    borderBase: 'border-violet-500/10',
    borderHover: 'hover:border-violet-500/40'
  },
  { 
    title: 'Referee Panel', 
    desc: 'Simplified scoring engine for match officials.', 
    path: '/referee', 
    icon: 'fa-eye',
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    borderBase: 'border-blue-500/10',
    borderHover: 'hover:border-blue-500/40'
  },
  { 
    title: 'Director Dashboard', 
    desc: 'Real-time overview of all courts and match statuses.', 
    path: '/director', 
    icon: 'fa-tower-observation',
    bg: 'bg-rose-500/10',
    text: 'text-rose-500',
    borderBase: 'border-rose-500/10',
    borderHover: 'hover:border-rose-500/40'
  }
];

const sports = [
  { id: 'PICKLEBALL', name: 'Pickleball', icon: 'fa-table-tennis-paddle-ball' },
  { id: 'BADMINTON', name: 'Badminton', icon: 'fa-shuttlecock' },
  { id: 'BASKETBALL', name: 'Basketball', icon: 'fa-basketball' },
  { id: 'FUTSAL', name: 'Futsal', icon: 'fa-futbol' },
  { id: 'ARCHERY', name: 'Archery', icon: 'fa-bullseye' },
];

export default function ArenaHubRoot() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTournament, setNewTournament] = useState({ name: '', sport: 'PICKLEBALL' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('arena_tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTournaments(data);
      if (data.length > 0) setSelectedTournament(data[0]);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newTournament.name) return;
    const slug = newTournament.name.toUpperCase().replace(/\s+/g, '_') + '_' + Math.floor(Math.random() * 1000);
    
    const { data, error } = await supabase
      .from('arena_tournaments')
      .insert([{
        name: newTournament.name,
        sport_type: newTournament.sport,
        event_id_slug: slug
      }])
      .select()
      .single();

    if (data) {
      setTournaments([data, ...tournaments]);
      setSelectedTournament(data);
      setIsCreating(false);
      setNewTournament({ name: '', sport: 'PICKLEBALL' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 md:p-12 relative flex flex-col items-center justify-center overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.05),transparent_70%)] pointer-events-none"></div>
      
      <div className="max-w-4xl w-full z-10">
        <header className="mb-12 text-center relative">
          <Link href="/" className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[10px] font-black uppercase text-zinc-600 hover:text-white transition-colors tracking-widest group">
            <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
            Back to OS
          </Link>

          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-4 mb-4">
            <div className="w-12 h-12 bg-amber-500 text-black rounded-2xl flex items-center justify-center text-2xl shadow-[0_0_30px_rgba(245,158,11,0.3)]">
              <i className="fa-solid fa-trophy"></i>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-[0.2em] italic">Arena Hub</h1>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-zinc-500 tracking-widest text-[10px] font-black uppercase">
            Central orchestration for all tournament projects
          </motion.p>
        </header>

        {/* Selection Area */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 p-8 bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <i className="fa-solid fa-layer-group text-8xl"></i>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-end relative z-10">
                <div className="flex-1 w-full">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Select Active Tournament</label>
                        <button 
                            onClick={() => setIsCreating(!isCreating)}
                            className="text-[10px] font-black text-amber-500 uppercase tracking-widest hover:text-amber-400 transition-colors"
                        >
                            {isCreating ? 'Cancel' : '+ Create Tournament'}
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {isCreating ? (
                            <motion.div key="create" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex gap-3">
                                <input 
                                    autoFocus
                                    type="text" 
                                    value={newTournament.name}
                                    onChange={(e) => setNewTournament(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter Name..."
                                    className="flex-1 bg-black/50 border border-amber-500/20 rounded-2xl px-5 py-4 font-bold text-sm focus:outline-none focus:border-amber-500 transition-all uppercase placeholder-zinc-700"
                                />
                                <select 
                                    value={newTournament.sport}
                                    onChange={(e) => setNewTournament(prev => ({ ...prev, sport: e.target.value }))}
                                    className="bg-black/50 border border-amber-500/20 rounded-2xl px-4 py-4 font-black text-[10px] uppercase tracking-widest focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
                                >
                                    {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <button onClick={handleCreate} className="px-6 bg-amber-500 text-black rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-amber-400 transition-all">
                                    Init
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div key="select" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <select 
                                    value={selectedTournament?.id || ''}
                                    onChange={(e) => setSelectedTournament(tournaments.find(t => t.id === e.target.value))}
                                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 font-bold text-sm focus:outline-none focus:border-amber-500 transition-all appearance-none cursor-pointer uppercase"
                                >
                                    {loading ? <option>Loading...</option> : 
                                     tournaments.length === 0 ? <option>No Tournaments Found</option> :
                                     tournaments.map(t => <option key={t.id} value={t.id}>{t.name} • {t.sport_type}</option>)}
                                </select>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modules.map((mod, idx) => (
            <motion.div 
              key={mod.title} 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ delay: 0.1 * idx }}
            >
              <Link 
                href={selectedTournament ? `/arena/${selectedTournament.id}${mod.path}` : '#'}
                className={`group block p-8 bg-zinc-900/40 backdrop-blur-xl border ${mod.borderBase} rounded-[2.5rem] ${mod.borderHover} transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden ${!selectedTournament ? 'opacity-30 pointer-events-none grayscale' : ''}`}
              >
                <div className={`absolute -right-4 -bottom-4 opacity-5 text-8xl transition-transform duration-700 group-hover:scale-125 group-hover:rotate-12 ${mod.text}`}>
                    <i className={`fa-solid ${mod.icon}`}></i>
                </div>

                <div className={`w-14 h-14 ${mod.bg} ${mod.text} rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform`}>
                  <i className={`fa-solid ${mod.icon}`}></i>
                </div>
                
                <h3 className="text-xl font-bold mb-2 text-zinc-100 group-hover:text-white transition-colors">{mod.title}</h3>
                <p className="text-zinc-500 text-[11px] font-medium leading-relaxed uppercase tracking-wider">{mod.desc}</p>

                <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-zinc-300 transition-colors">
                  <span>Enter Management</span>
                  <i className="fa-solid fa-arrow-right-long transition-transform group-hover:translate-x-2"></i>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Footer Shortcut to Screen Display */}
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
        >
            <Link 
                href="/apps/zto-arena/screen"
                className="inline-flex items-center gap-3 px-6 py-3 bg-zinc-900 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:border-amber-500/20 transition-all"
            >
                <i className="fa-solid fa-display text-amber-500"></i>
                Public Screen Picker
            </Link>
        </motion.div>
      </div>
    </div>
  );
}
