'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

interface Tournament {
  id: string;
  name: string;
  sport_type: string;
  event_id_slug: string;
  format: 'TIE_TEAM' | 'INDIVIDUAL';
  linked_project_id: string | null;
  has_third_place?: boolean;
  created_at?: string;
}

export default function ArenaScreenPicker() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
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
      setTournaments(data as Tournament[]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 md:p-12 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(6,182,212,0.1),transparent_70%)] pointer-events-none animate-pulse" style={{ animationDuration: '4s' }}></div>

      <div className="max-w-2xl w-full z-10 text-center">
        <Link href="/apps/zto-arena" className="mb-12 inline-flex items-center gap-2 text-[10px] font-black uppercase text-zinc-600 hover:text-white transition-colors tracking-widest group">
            <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
            Back to Arena Hub
        </Link>

        <header className="mb-12">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="w-20 h-20 bg-cyan-500/20 text-cyan-400 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-[0_0_50px_rgba(6,182,212,0.3)] border border-cyan-500/20">
            <i className="fa-solid fa-display"></i>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-black uppercase tracking-[0.2em] italic mb-3">Public Screens</motion.h1>
          <p className="text-zinc-500 tracking-widest text-[10px] font-black uppercase">Launch high-visibility billboard modes</p>
        </header>

        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl animate-pulse">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-zinc-800 rounded-xl"></div>
                     <div className="text-left space-y-2">
                       <div className="h-4 w-32 bg-zinc-800 rounded"></div>
                       <div className="h-2 w-24 bg-zinc-800 rounded"></div>
                     </div>
                   </div>
                </div>
              ))}
            </div>
          ) : tournaments.length === 0 ? (
            <div className="py-12 text-zinc-600 font-black uppercase tracking-widest text-xs border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
              <i className="fa-solid fa-ghost text-2xl mb-4 block opacity-50"></i>
              No Active Tournaments Found
            </div>
          ) : (
            tournaments.map((t, idx) => (
              <motion.div key={t.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * idx }}>
                <Link 
                  href={`/arena/${t.id}/screen`}
                  target="_blank"
                  className="group flex items-center justify-between p-6 bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl hover:border-cyan-500/40 hover:bg-zinc-800/50 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-cyan-500/10 text-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <i className="fa-solid fa-bolt-lightning"></i>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-zinc-100 group-hover:text-white transition-colors uppercase tracking-wider">{t.name}</div>
                      <div className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">{t.sport_type} • ID: {t.event_id_slug}</div>
                    </div>
                  </div>
                  <div className="text-zinc-700 group-hover:text-cyan-400 transition-colors">
                    <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>

        <p className="mt-12 text-[9px] font-black text-zinc-700 uppercase tracking-widest leading-relaxed max-w-sm mx-auto">
            These links open a full-page live broadcast view intended for 4K stadium displays and projector outputs.
        </p>
      </div>
    </div>
  );
}
