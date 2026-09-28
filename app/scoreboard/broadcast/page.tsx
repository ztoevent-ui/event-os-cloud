"use client";
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { Leaderboard } from '../components/Leaderboard';
import { ScoreBarChart } from '../components/ScoreBarChart';

export default function BroadcastScoreboard() {
  const [teams, setTeams] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [tick, setTick] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [flash, setFlash] = useState(false);

  const fetchScores = async () => {
    const { data } = await supabase.from('game_scores').select('*');
    if (data) {
      setScores(data);
      setLastUpdate(new Date());
      setFlash(true);
      setTimeout(() => setFlash(false), 800);
    }
  };

  useEffect(() => {
    supabase.from('teams').select('*').then(res => {
      if (res.data) setTeams(res.data);
    });
    fetchScores();

    const channel = supabase.channel('broadcast_scores_v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_scores' }, () => {
        fetchScores();
      })
      .subscribe();

    // Clock tick
    const clockInterval = setInterval(() => setTick(t => t + 1), 1000);

    document.body.style.overflow = 'hidden';
    document.body.style.background = '#000';
    return () => {
      supabase.removeChannel(channel);
      clearInterval(clockInterval);
      document.body.style.overflow = '';
      document.body.style.background = '';
    };
  }, []);

  const mergedTeams = teams.map(t => {
    const total = scores.filter(s => s.team_id === t.id).reduce((sum, s) => sum + s.score, 0);
    return { ...t, score: total };
  });

  const sorted = [...mergedTeams].sort((a, b) => b.score - a.score);
  const leader = sorted[0];

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  return (
    <div className="w-screen h-screen bg-[#020202] overflow-hidden text-white flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Flash overlay on score update */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key="flash"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 pointer-events-none z-50"
            style={{ background: `radial-gradient(ellipse at center, ${leader?.color_hex || '#ffffff'}20 0%, transparent 70%)` }}
          />
        )}
      </AnimatePresence>

      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.025]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-12 pt-8 pb-4">
        <div>
          <div className="text-[10px] font-black tracking-[0.5em] text-zinc-600 uppercase mb-1">Shell MDS Sarawak</div>
          <h1 className="text-4xl font-black tracking-tight text-white uppercase">
            Family Day <span className="text-zinc-600">2026</span>
          </h1>
        </div>

        {/* Divider center glow */}
        <div className="flex-1 mx-16 h-px opacity-10"
          style={{ background: `linear-gradient(90deg, transparent, ${leader?.color_hex || '#fff'}, transparent)` }} />

        <div className="text-right">
          <div className="text-[10px] font-black tracking-[0.4em] text-zinc-600 uppercase mb-1">Live Scoreboard</div>
          <div className="text-3xl font-black tabular-nums tracking-widest text-white font-mono">{timeStr}</div>
          {lastUpdate && (
            <div className="text-[9px] text-zinc-700 tracking-widest mt-1 uppercase font-bold">
              Updated {lastUpdate.toLocaleTimeString('en-MY', { hour12: false })}
            </div>
          )}
        </div>
      </header>

      {/* Thin top accent line using leader color */}
      <div className="relative z-10 h-px w-full mx-0 opacity-40"
        style={{ background: leader ? `linear-gradient(90deg, transparent 0%, ${leader.color_hex} 50%, transparent 100%)` : '#333' }} />

      {/* Main content: Bar Chart (left) + Leaderboard (right) */}
      <main className="relative z-10 flex-1 flex gap-0 overflow-hidden px-12 py-8">

        {/* LEFT: Bar Chart */}
        <div className="flex-1 flex flex-col justify-end pb-4">
          <div className="text-[9px] font-black tracking-[0.4em] text-zinc-700 uppercase mb-8 text-center">Score Distribution</div>
          <ScoreBarChart teams={mergedTeams} />
        </div>

        {/* Vertical divider */}
        <div className="w-px bg-white/5 mx-10 self-stretch" />

        {/* RIGHT: Ranked list */}
        <div className="w-[480px] flex flex-col justify-center gap-6 shrink-0">
          <div className="text-[9px] font-black tracking-[0.4em] text-zinc-700 uppercase">Standings</div>
          <Leaderboard teams={mergedTeams} variant="broadcast" />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-12 py-4 flex items-center justify-between border-t border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Realtime · WebSocket Active</span>
        </div>
        <div className="flex items-center gap-8">
          {sorted.map(team => (
            <div key={team.id} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: team.color_hex }} />
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.15em]">{team.name}</span>
            </div>
          ))}
        </div>
        <span className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">Event OS · Broadcast</span>
      </footer>
    </div>
  );
}
