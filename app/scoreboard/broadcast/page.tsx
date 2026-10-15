"use client";
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
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
  const [showQR,       setShowQR]       = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Fullscreen & Shortcuts ────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'q' || e.key === 'Q') {
        setShowQR(prev => !prev);
      }
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
      if (e.key === 'Escape') {
        setShowQR(false);
      }
    };
    document.addEventListener('fullscreenchange', handler);
    window.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      window.removeEventListener('keydown', keyHandler);
    };
  }, [toggleFullscreen]);

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

      {/* 1000 Attendees QR Code Toggle Button */}
      <button
        onClick={() => setShowQR(prev => !prev)}
        title="Scan QR Code (Press Q)"
        className="fixed top-4 right-16 z-50 h-9 px-3 flex items-center gap-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-300 hover:text-white transition-all text-xs font-bold"
        style={{ backdropFilter:'blur(8px)' }}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        <span className="text-[10px] uppercase tracking-wider hidden sm:inline">Scan QR (Q)</span>
      </button>

      {/* ── 1000 Attendees QR Code Large Broadcast Modal ────────────────────── */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            key="qr-overlay"
            initial={{ opacity:0, scale:0.95 }}
            animate={{ opacity:1, scale:1 }}
            exit={{ opacity:0, scale:0.95 }}
            transition={{ duration:0.25 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 select-none"
            onClick={() => setShowQR(false)}>
            <div
              className="relative max-w-lg w-full bg-[#0d0e14] border-2 border-white/20 rounded-3xl p-8 flex flex-col items-center text-center shadow-[0_0_120px_rgba(239,68,68,0.3)]"
              onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setShowQR(false)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-all">
                ✕
              </button>
              <div className="px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-black uppercase tracking-widest mb-3">
                ● 1,000 Spectators Live Sync · Scan for Scores
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-1">
                {config.event_title || 'FAMILY DAY 2026'}
              </h2>
              <p className="text-xs text-zinc-400 font-medium mb-6">
                Point your phone camera to view real-time scores and team standings
              </p>
              <div className="p-6 bg-white rounded-3xl shadow-2xl border-4 border-white">
                <QRCodeSVG
                  value={typeof window !== 'undefined' ? `${window.location.origin}/scoreboard/public` : '/scoreboard/public'}
                  size={300}
                  level="H"
                  includeMargin={false}
                  fgColor="#09090b"
                  bgColor="#ffffff"
                />
              </div>
              <div className="mt-5 px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-blue-300">
                {typeof window !== 'undefined' ? `${window.location.origin}/scoreboard/public` : '/scoreboard/public'}
              </div>
              <div className="mt-3 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                Press ESC or Q to close
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        <div className="flex items-center gap-6">
          {config.logo_url && (
            <img src={config.logo_url} alt="Logo" className="h-16 w-auto object-contain shrink-0" />
          )}
          <div>
            {config.organizer && <div className="text-[9px] font-black tracking-[0.5em] text-zinc-600 uppercase mb-1">{config.organizer}</div>}
            <h1 className="text-4xl font-black tracking-tight text-white uppercase leading-none">{config.event_title}</h1>
            <p className="text-[10px] font-black tracking-[0.4em] text-zinc-600 uppercase mt-1.5">{config.event_subtitle}</p>
          </div>
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
