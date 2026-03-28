'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

const modules = [
  { 
    title: 'Master Console', 
    desc: 'Main match control for scoring, sets, and game clock.', 
    href: '/apps/zto-arena/master', 
    icon: 'fa-gamepad',
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    borderBase: 'border-amber-500/10',
    borderHover: 'hover:border-amber-500/40'
  },
  { 
    title: 'Ads Placement', 
    desc: 'Live media controller for multi-tenant ad rotation.', 
    href: '/apps/zto-arena/ads', 
    icon: 'fa-rectangle-ad',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    borderBase: 'border-emerald-500/10',
    borderHover: 'hover:border-emerald-500/40'
  },
  { 
    title: 'Referee Screen', 
    desc: 'Simplified high-contrast display for match officials.', 
    href: '/apps/zto-arena/referee', 
    icon: 'fa-eye',
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    borderBase: 'border-blue-500/10',
    borderHover: 'hover:border-blue-500/40'
  },
  { 
    title: 'Arena Screen', 
    desc: 'Public billboard display with duo-mode visuals.', 
    href: '/apps/zto-arena/screen', 
    icon: 'fa-tv',
    fullWidth: true,
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-500',
    borderBase: 'border-indigo-500/10',
    borderHover: 'hover:border-indigo-500/40'
  },
];

const sports = [
  { id: 'PICKLEBALL', name: 'Pickleball', icon: 'fa-table-tennis-paddle-ball' },
  { id: 'BADMINTON', name: 'Badminton', icon: 'fa-shuttlecock' },
  { id: 'BASKETBALL', name: 'Basketball', icon: 'fa-basketball' },
  { id: 'FUTSAL', name: 'Futsal', icon: 'fa-futbol' },
  { id: 'ARCHERY', name: 'Archery', icon: 'fa-bullseye' },
];

export default function ArenaHubPage() {
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
      if (data.length > 0 && !selectedTournament) {
        setSelectedTournament(data[0]);
      }
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

    if (!error && data) {
      setTournaments([data, ...tournaments]);
      setSelectedTournament(data);
      setIsCreating(false);
      setNewTournament({ name: '', sport: 'PICKLEBALL' });
    }
  };

  const getUrl = (base: string) => {
    if (!selectedTournament) return '#';
    return `${base}?eventId=${selectedTournament.event_id_slug}&sport=${selectedTournament.sport_type}`;
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
            <h1 className="text-4xl font-black uppercase tracking-[0.2em] italic">ZTO Arena</h1>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-zinc-500 tracking-widest text-[10px] font-black uppercase">
            Stadium-Grade Tournament Orchestration
          </motion.p>
        </header>

        {/* Tournament Configuration */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 p-8 bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <i className="fa-solid fa-layer-group text-8xl"></i>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-end relative z-10">
                <div className="flex-1 w-full">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Tournament</label>
                        <button 
                            onClick={() => setIsCreating(!isCreating)}
                            className="text-[10px] font-black text-amber-500 uppercase tracking-widest hover:text-amber-400 transition-colors"
                        >
                            {isCreating ? 'Cancel Creation' : '+ Create New'}
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
                                    placeholder="Tournament Name..."
                                    className="flex-1 bg-black/50 border border-amber-500/20 rounded-2xl px-5 py-4 font-bold text-sm focus:outline-none focus:border-amber-500 transition-all uppercase placeholder-zinc-700"
                                />
                                <select 
                                    value={newTournament.sport}
                                    onChange={(e) => setNewTournament(prev => ({ ...prev, sport: e.target.value }))}
                                    className="bg-black/50 border border-amber-500/20 rounded-2xl px-4 py-4 font-black text-[10px] uppercase tracking-widest focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
                                >
                                    {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <button onClick={handleCreate} className="px-6 bg-amber-500 text-black rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20">
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
                                    {loading ? <option>Loading Tournaments...</option> : 
                                     tournaments.length === 0 ? <option>No Tournaments Found</option> :
                                     tournaments.map(t => <option key={t.id} value={t.id}>{t.name} • {t.sport_type}</option>)}
                                </select>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {!isCreating && selectedTournament && (
                    <div className="flex-shrink-0 flex items-center gap-4 bg-zinc-800/40 p-2 pr-6 rounded-2xl border border-white/5">
                        <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center text-xl">
                            <i className={`fa-solid ${sports.find(s => s.id === selectedTournament.sport_type)?.icon || 'fa-medal'}`}></i>
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter leading-none mb-1">Session ID</div>
                            <div className="text-[12px] font-mono font-black uppercase text-zinc-300 tracking-tighter">{selectedTournament.event_id_slug}</div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modules.map((mod, idx) => (
            <motion.div key={mod.title} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * idx }} className={mod.fullWidth ? 'md:col-span-3' : ''}>
              <Link 
                href={getUrl(mod.href)}
                className={`group block h-full p-8 bg-zinc-900/40 backdrop-blur-xl border ${mod.borderBase} rounded-[2.5rem] ${mod.borderHover} transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden ${!selectedTournament ? 'opacity-50 pointer-events-none grayscale' : ''}`}
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
                  <span>Open Management Layer</span>
                  <i className="fa-solid fa-arrow-right-long transition-transform group-hover:translate-x-2"></i>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
