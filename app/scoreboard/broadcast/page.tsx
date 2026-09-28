"use client";
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { Leaderboard } from '../components/Leaderboard';
import { ScoreBarChart } from '../components/ScoreBarChart';

export default function BroadcastScoreboard() {
  const [teams, setTeams] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [config, setConfig] = useState<Record<string, string>>({
    event_title: 'Family Day',
    event_subtitle: 'Live Scoreboard',
    organizer: '',
  });
  const [tick, setTick] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [flash, setFlash] = useState(false);
  const [flashColor, setFlashColor] = useState('#ffffff');

  const fetchTeams = async () => {
    const { data } = await supabase.from('teams').select('*');
    if (data) setTeams(data);
  };

  const fetchScores = async () => {
    const { data } = await supabase.from('game_scores').select('*');
    if (data) {
      setScores(data);
      setLastUpdate(new Date());
    }
  };

  const fetchConfig = async () => {
    const { data } = await supabase.from('scoreboard_config').select('*');
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((r: any) => { map[r.key] = r.value; });
      setConfig(prev => ({ ...prev, ...map }));
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchScores();
    fetchConfig();

    // ── Realtime channels ──────────────────────────────────────────────────
    const scoreChannel = supabase.channel('broadcast_game_scores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_scores' }, (payload) => {
        fetchScores();
        // Flash with the scoring team's color
        setFlash(true);
        setTimeout(() => setFlash(false), 900);
      })
      .subscribe();

    // Listen to team name / color updates in real time
    const teamsChannel = supabase.channel('broadcast_teams')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'teams' }, () => {
        fetchTeams();
      })
      .subscribe();

    // Listen to config updates (event title, organiser)
    const configChannel = supabase.channel('broadcast_config')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scoreboard_config' }, () => {
        fetchConfig();
      })
      .subscribe();

    // Clock
    const clock = setInterval(() => setTick(t => t + 1), 1000);

    document.body.style.overflow = 'hidden';
    document.body.style.background = '#000';
    return () => {
      supabase.removeChannel(scoreChannel);
      supabase.removeChannel(teamsChannel);
      supabase.removeChannel(configChannel);
      clearInterval(clock);
      document.body.style.overflow = '';
      document.body.style.background = '';
    };
  }, []);

  const mergedTeams = teams.map(t => ({
    ...t,
    score: scores.filter(s => s.team_id === t.id).reduce((sum, s) => sum + s.score, 0),
  }));

  const sorted = [...mergedTeams].sort((a, b) => b.score - a.score);
  const leader = sorted[0];

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  return (
    <div className="w-screen h-screen bg-[#020202] overflow-hidden text-white flex flex-col"
      style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Flash on score update */}
      <AnimatePresence>
        {flash && leader && (
          <motion.div key="flash"
            initial={{ opacity: 0.6 }} animate={{ opacity: 0 }} transition={{ duration: 0.9 }}
            className="fixed inset-0 pointer-events-none z-50"
            style={{ background: `radial-gradient(ellipse at center, ${leader.color_hex}25 0%, transparent 65%)` }}
          />
        )}
      </AnimatePresence>

      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.022]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-12 pt-8 pb-4 shrink-0">
        <div>
          {config.organizer && (
            <div className="text-[9px] font-black tracking-[0.5em] text-zinc-600 uppercase mb-1">{config.organizer}</div>
          )}
          <h1 className="text-4xl font-black tracking-tight text-white uppercase leading-none">
            {config.event_title}
          </h1>
          <p className="text-[10px] font-black tracking-[0.4em] text-zinc-600 uppercase mt-1.5">{config.event_subtitle}</p>
        </div>

        {/* Center accent line */}
        <div className="flex-1 mx-12 h-px opacity-15"
          style={{ background: leader ? `linear-gradient(90deg, transparent, ${leader.color_hex}, transparent)` : '#333' }} />

        <div className="text-right">
          <div className="text-[9px] font-black tracking-[0.4em] text-zinc-600 uppercase mb-1.5">Current Time</div>
          <div className="text-3xl font-black tabular-nums tracking-widest text-white font-mono">{timeStr}</div>
          {lastUpdate && (
            <div className="text-[9px] text-zinc-700 tracking-widest mt-1.5 uppercase font-bold">
              Score updated {lastUpdate.toLocaleTimeString('en-MY', { hour12: false })}
            </div>
          )}
        </div>
      </header>

      {/* Top accent line */}
      <div className="relative z-10 h-px w-full shrink-0"
        style={{ background: leader ? `linear-gradient(90deg, transparent 0%, ${leader.color_hex}60 50%, transparent 100%)` : 'rgba(255,255,255,0.05)' }} />

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex gap-0 overflow-hidden px-12 py-6 min-h-0">

        {/* Left: Bar Chart */}
        <div className="flex-1 flex flex-col justify-end pb-2 min-w-0">
          <div className="text-[9px] font-black tracking-[0.4em] text-zinc-700 uppercase mb-6 text-center">
            Score Distribution
          </div>
          <ScoreBarChart teams={mergedTeams} />
        </div>

        {/* Vertical divider */}
        <div className="w-px bg-white/[0.05] mx-10 self-stretch shrink-0" />

        {/* Right: Ranked list */}
        <div className="w-[500px] flex flex-col justify-center shrink-0">
          <div className="text-[9px] font-black tracking-[0.4em] text-zinc-700 uppercase mb-5">Standings</div>
          <Leaderboard teams={mergedTeams} variant="broadcast" />
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 px-12 py-3.5 flex items-center justify-between border-t border-white/[0.04] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Realtime Active</span>
        </div>
        <div className="flex items-center gap-6">
          {sorted.map(team => (
            <div key={team.id} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: team.color_hex }} />
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.15em]">{team.name}</span>
            </div>
          ))}
        </div>
        <span className="text-[9px] font-black text-zinc-800 uppercase tracking-widest">Event OS · Broadcast Mode</span>
      </footer>
    </div>
  );
}
