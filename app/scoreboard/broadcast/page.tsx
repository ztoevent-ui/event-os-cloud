"use client";
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { Leaderboard } from '../components/Leaderboard';
import { ScoreBarChart } from '../components/ScoreBarChart';

export default function BroadcastScoreboard() {
  const [teams,        setTeams]        = useState<any[]>([]);
  const [scores,       setScores]       = useState<any[]>([]);
  const [config,       setConfig]       = useState<Record<string,string>>({
    event_title:         'Family Day',
    event_subtitle:      'Live Scoreboard',
    organizer:           '',
    announcement_text:   '',
    announcement_active: 'false',
  });
  const [tick,         setTick]         = useState(0);
  const [lastUpdate,   setLastUpdate]   = useState<Date|null>(null);
  const [flash,        setFlash]        = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Fullscreen ────────────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ── Data fetch ────────────────────────────────────────────────────────────
  const fetchTeams  = async () => { const {data} = await supabase.from('teams').select('*');            if (data) setTeams(data); };
  const fetchScores = async () => {
    const {data} = await supabase.from('game_scores').select('*');
    if (data) { setScores(data); setLastUpdate(new Date()); setFlash(true); setTimeout(()=>setFlash(false), 900); }
  };
  const fetchConfig = async () => {
    const {data} = await supabase.from('scoreboard_config').select('*');
    if (data) {
      const map: Record<string,string> = {};
      data.forEach((r:any) => { map[r.key] = r.value; });
      setConfig(prev => ({ ...prev, ...map }));
    }
  };

  useEffect(() => {
    fetchTeams(); fetchScores(); fetchConfig();

    const scoresCh = supabase.channel('bc_scores')
      .on('postgres_changes', { event:'*', schema:'public', table:'game_scores' }, fetchScores)
      .subscribe();
    const teamsCh = supabase.channel('bc_teams')
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'teams' }, fetchTeams)
      .subscribe();
    const configCh = supabase.channel('bc_config')
      .on('postgres_changes', { event:'*', schema:'public', table:'scoreboard_config' }, fetchConfig)
      .subscribe();

    const clock = setInterval(() => setTick(t=>t+1), 1000);
    document.body.style.overflow = 'hidden';
    document.body.style.background = '#000';
    return () => {
      supabase.removeChannel(scoresCh);
      supabase.removeChannel(teamsCh);
      supabase.removeChannel(configCh);
      clearInterval(clock);
      document.body.style.overflow = '';
      document.body.style.background = '';
    };
  }, []);

  const mergedTeams = teams.map(t => ({
    ...t,
    score: scores.filter(s=>s.team_id===t.id).reduce((sum,s)=>sum+s.score, 0),
  }));

  const sorted   = [...mergedTeams].sort((a,b) => b.score - a.score);
  const leader   = sorted[0];
  const annActive = config.announcement_active === 'true';
  const annLines  = (config.announcement_text || '').split('\n');
  const now       = new Date();
  const timeStr   = now.toLocaleTimeString('en-MY', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false });

  return (
    <div ref={containerRef}
      className="w-screen h-screen bg-[#020202] overflow-hidden text-white flex flex-col select-none"
      style={{ fontFamily:"'Inter', sans-serif" }}>

      {/* Fullscreen key listener */}
      <button
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
        onKeyDown={e => e.key==='f' && toggleFullscreen()}
        className="fixed top-4 right-4 z-50 w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-500 hover:text-white transition-all text-xs"
        style={{ backdropFilter:'blur(8px)' }}>
        {isFullscreen ? '⤡' : '⛶'}
      </button>

      {/* Score update flash */}
      <AnimatePresence>
        {flash && leader && (
          <motion.div key="flash"
            initial={{ opacity:0.5 }} animate={{ opacity:0 }} transition={{ duration:0.9 }}
            className="fixed inset-0 pointer-events-none z-40"
            style={{ background:`radial-gradient(ellipse at center, ${leader.color_hex}25 0%, transparent 65%)` }} />
        )}
      </AnimatePresence>

      {/* ── Announcement Overlay ────────────────────────────────────────────── */}
      <AnimatePresence>
        {annActive && config.announcement_text && (
          <motion.div
            key="announcement"
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            transition={{ duration:0.4 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            style={{ background:'rgba(0,0,0,0.92)', backdropFilter:'blur(8px)' }}>

            {/* Pulsing ring */}
            <motion.div
              animate={{ scale:[1, 1.08, 1], opacity:[0.3, 0.6, 0.3] }}
              transition={{ repeat:Infinity, duration:2.2 }}
              className="absolute w-[600px] h-[600px] rounded-full border-2 border-orange-500/30" />
            <motion.div
              animate={{ scale:[1, 1.05, 1], opacity:[0.2, 0.4, 0.2] }}
              transition={{ repeat:Infinity, duration:2.2, delay:0.4 }}
              className="absolute w-[800px] h-[800px] rounded-full border border-orange-500/15" />

            {/* Icon */}
            <motion.div
              initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:200, damping:20 }}
              className="text-6xl mb-8 relative z-10">
              📢
            </motion.div>

            {/* Text */}
            <div className="relative z-10 text-center px-16 max-w-4xl">
              {annLines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity:0, y:20 }}
                  animate={{ opacity:1, y:0 }}
                  transition={{ delay:i * 0.12, type:'spring', stiffness:200, damping:25 }}
                  className={i===0
                    ? "text-6xl font-black text-white uppercase tracking-wider leading-tight mb-4"
                    : "text-2xl font-bold text-orange-300 uppercase tracking-widest leading-relaxed"
                  }>
                  {line}
                </motion.div>
              ))}
            </div>

            {/* Label */}
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
              className="relative z-10 mt-12 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[10px] font-black text-orange-700 uppercase tracking-[0.5em]">Live Announcement</span>
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.022]"
        style={{ backgroundImage:'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize:'64px 64px' }} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-12 pt-7 pb-3 shrink-0">
        <div>
          {config.organizer && <div className="text-[9px] font-black tracking-[0.5em] text-zinc-600 uppercase mb-1">{config.organizer}</div>}
          <h1 className="text-4xl font-black tracking-tight text-white uppercase leading-none">{config.event_title}</h1>
          <p className="text-[10px] font-black tracking-[0.4em] text-zinc-600 uppercase mt-1.5">{config.event_subtitle}</p>
        </div>

        <div className="flex-1 mx-10 h-px opacity-15"
          style={{ background: leader ? `linear-gradient(90deg, transparent, ${leader.color_hex}, transparent)` : '#333' }} />

        <div className="text-right">
          <div className="text-[9px] font-black tracking-[0.4em] text-zinc-600 uppercase mb-1.5">Current Time</div>
          <div className="text-3xl font-black tabular-nums tracking-widest text-white font-mono">{timeStr}</div>
          {lastUpdate && (
            <div className="text-[9px] text-zinc-700 tracking-widest mt-1.5 uppercase font-bold">
              Score updated {lastUpdate.toLocaleTimeString('en-MY', { hour12:false })}
            </div>
          )}
        </div>
      </header>

      {/* Accent line */}
      <div className="relative z-10 h-px w-full shrink-0"
        style={{ background: leader ? `linear-gradient(90deg, transparent 0%, ${leader.color_hex}60 50%, transparent 100%)` : 'rgba(255,255,255,0.05)' }} />

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex gap-0 overflow-hidden px-12 py-5 min-h-0">
        {/* Bar chart */}
        <div className="flex-1 flex flex-col justify-end pb-2 min-w-0">
          <div className="text-[9px] font-black tracking-[0.4em] text-zinc-700 uppercase mb-5 text-center">Score Distribution</div>
          <ScoreBarChart teams={mergedTeams} />
        </div>

        <div className="w-px bg-white/[0.05] mx-10 self-stretch shrink-0" />

        {/* Ranked list */}
        <div className="w-[500px] flex flex-col justify-center shrink-0">
          <div className="text-[9px] font-black tracking-[0.4em] text-zinc-700 uppercase mb-5">Standings</div>
          <Leaderboard teams={mergedTeams} variant="broadcast" />
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 px-12 py-3 flex items-center justify-between border-t border-white/[0.04] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Realtime Active</span>
        </div>
        <div className="flex items-center gap-6">
          {sorted.map(team=>(
            <div key={team.id} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background:team.color_hex }} />
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.15em]">{team.name}</span>
            </div>
          ))}
        </div>
        <button onClick={toggleFullscreen} className="text-[9px] font-black text-zinc-800 uppercase tracking-widest hover:text-zinc-500 transition-all">
          {isFullscreen ? '⤡ Exit Fullscreen' : '⛶ Fullscreen'}
        </button>
      </footer>
    </div>
  );
}
