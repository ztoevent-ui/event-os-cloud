"use client";
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/lib/supabaseClient';

// ─── Mascot assignment by index ───────────────────────────────────────────────
const MASCOTS = ['🦁', '🐉', '🦅', '🦊', '🐯', '🐺', '🦈', '🦋'];

// ─── Bunting triangle component ───────────────────────────────────────────────
const BUNTING_COLORS = ['#ef4444','#3b82f6','#eab308','#22c55e','#f97316','#8b5cf6','#ec4899','#14b8a6'];

function Bunting({ flip = false }: { flip?: boolean }) {
  const count = 10;
  return (
    <div className={`flex items-start gap-0 ${flip ? 'justify-end' : 'justify-start'}`} style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
      {/* String */}
      <svg width={count * 52 + 20} height={60} className="absolute top-0 left-0" style={{ pointerEvents: 'none' }}>
        <path
          d={`M 10,8 ${Array.from({ length: count }, (_, i) => `Q ${i * 52 + 36},32 ${i * 52 + 62},8`).join(' ')}`}
          fill="none" stroke="#999" strokeWidth="1.5" opacity="0.5"
        />
      </svg>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 10 : 6 }}>
          <div style={{
            width: 0, height: 0,
            borderLeft: '18px solid transparent',
            borderRight: '18px solid transparent',
            borderTop: `28px solid ${BUNTING_COLORS[i % BUNTING_COLORS.length]}`,
            marginTop: i % 2 === 0 ? 6 : 14,
            borderRadius: '2px',
          }} />
        </div>
      ))}
    </div>
  );
}

// ─── Confetti particle ────────────────────────────────────────────────────────
function Confetti() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 4,
    duration: 3 + Math.random() * 3,
    color: BUNTING_COLORS[i % BUNTING_COLORS.length],
    size: 6 + Math.random() * 8,
    shape: Math.random() > 0.5 ? 'circle' : 'rect',
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => (
        <motion.div key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: -20,
            width: p.size,
            height: p.shape === 'circle' ? p.size : p.size * 0.5,
            background: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : 2,
            opacity: 0.7,
          }}
          animate={{
            y: ['0vh', '105vh'],
            rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
            x: [0, (Math.random() - 0.5) * 80],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

// ─── Team Column Card ─────────────────────────────────────────────────────────
function TeamColumn({ team, rank, mascot, index }: { team: any; rank: number; mascot: string; index: number }) {
  const [displayScore, setDisplayScore] = useState(team.score);

  useEffect(() => {
    // Animate count-up when score changes
    const start = displayScore;
    const end = team.score;
    if (start === end) return;
    const diff = end - start;
    const steps = 30;
    const stepTime = 40;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDisplayScore(Math.round(start + (diff * step) / steps));
      if (step >= steps) clearInterval(timer);
    }, stepTime);
    return () => clearInterval(timer);
  }, [team.score]);

  const isLeader = rank === 1;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 24, delay: index * 0.08 }}
      className="flex flex-col items-center flex-1"
    >
      {/* Leader crown */}
      <AnimatePresence>
        {isLeader && (
          <motion.div
            key="crown"
            initial={{ opacity: 0, scale: 0, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0 }}
            className="text-4xl mb-1"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(255,200,0,0.8))' }}
          >
            👑
          </motion.div>
        )}
      </AnimatePresence>
      {!isLeader && <div className="mb-1" style={{ height: 44 }} />}

      {/* Mascot */}
      <motion.div
        animate={isLeader ? { scale: [1, 1.08, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2.5 }}
        className="text-7xl mb-3"
        style={{
          filter: `drop-shadow(0 4px 16px ${team.color_hex}60)`,
        }}
      >
        {mascot}
      </motion.div>

      {/* Team Name */}
      <div className="text-center mb-4">
        <div
          className="text-3xl font-black uppercase leading-tight"
          style={{ color: team.color_hex, textShadow: `0 2px 12px ${team.color_hex}50` }}
        >
          {team.name.split(' ').map((word: string, i: number) => (
            <div key={i}>{word}</div>
          ))}
        </div>
      </div>

      {/* Score box */}
      <div
        className="w-full rounded-3xl overflow-hidden shadow-2xl"
        style={{
          border: `4px solid ${team.color_hex}`,
          boxShadow: `0 8px 40px ${team.color_hex}40, 0 2px 0 ${team.color_hex}`,
        }}
      >
        {/* Score header */}
        <div className="py-3 text-center font-black text-xl text-white uppercase tracking-widest"
          style={{ background: team.color_hex }}>
          Score
        </div>

        {/* Score value */}
        <div
          className="py-8 flex flex-col items-center justify-center"
          style={{ background: `${team.color_hex}12` }}
        >
          <motion.div
            key={team.score}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="text-8xl font-black tabular-nums leading-none"
            style={{ color: team.color_hex, textShadow: `0 4px 20px ${team.color_hex}60` }}
          >
            {displayScore.toLocaleString()}
          </motion.div>
          <div className="text-sm font-black uppercase tracking-widest mt-2 opacity-50"
            style={{ color: team.color_hex }}>
            points
          </div>
        </div>

        {/* Rank badge at bottom */}
        <div className="py-3 text-center" style={{ background: `${team.color_hex}15` }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-black text-sm uppercase tracking-widest"
            style={{ background: team.color_hex, color: '#fff' }}>
            {['⭐', '🥈', '🥉', '4️⃣'][rank - 1] || rank} {rank === 1 ? 'LEADING!' : rank === 2 ? '2nd Place' : rank === 3 ? '3rd Place' : `${rank}th`}
          </div>
        </div>
      </div>

      {/* Stars decoration */}
      <div className="flex gap-2 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3 }}
            className="text-lg"
            style={{ color: team.color_hex }}
          >
            ★
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function BroadcastFun() {
  const [teams,        setTeams]        = useState<any[]>([]);
  const [scores,       setScores]       = useState<any[]>([]);
  const [config,       setConfig]       = useState<Record<string,string>>({
    event_title: 'Family Day 2026',
    organizer:   '',
    announcement_text: '',
    announcement_active: 'false',
  });
  const [tick,         setTick]         = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flash,        setFlash]        = useState(false);
  const [showQR,       setShowQR]       = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'q' || e.key === 'Q') setShowQR(prev => !prev);
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      if (e.key === 'Escape') setShowQR(false);
    };
    document.addEventListener('fullscreenchange', handler);
    window.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      window.removeEventListener('keydown', keyHandler);
    };
  }, [toggleFullscreen]);

  const fetchTeams  = async () => { const {data} = await supabase.from('teams').select('*');          if (data) setTeams(data); };
  const fetchScores = async () => {
    const {data} = await supabase.from('game_scores').select('*');
    if (data) { setScores(data); setFlash(true); setTimeout(()=>setFlash(false), 700); }
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
    const s1 = supabase.channel('fun_scores').on('postgres_changes',{event:'*',schema:'public',table:'game_scores'},fetchScores).subscribe();
    const s2 = supabase.channel('fun_teams').on('postgres_changes',{event:'UPDATE',schema:'public',table:'teams'},fetchTeams).subscribe();
    const s3 = supabase.channel('fun_config').on('postgres_changes',{event:'*',schema:'public',table:'scoreboard_config'},fetchConfig).subscribe();
    const clock = setInterval(()=>setTick(t=>t+1), 1000);
    document.body.style.overflow = 'hidden';
    document.body.style.background = '#f0f9ff';
    return () => {
      supabase.removeChannel(s1); supabase.removeChannel(s2); supabase.removeChannel(s3);
      clearInterval(clock);
      document.body.style.overflow = '';
      document.body.style.background = '';
    };
  }, []);

  const mergedTeams = teams.map(t => ({
    ...t,
    score: scores.filter(s=>s.team_id===t.id).reduce((sum,s)=>sum+s.score,0),
  }));
  const sorted = [...mergedTeams].sort((a,b)=>b.score-a.score);
  const annActive = config.announcement_active === 'true';
  const annLines  = (config.announcement_text||'').split('\n');

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-MY', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false });

  return (
    <div ref={containerRef}
      className="w-full h-full min-h-screen overflow-hidden flex flex-col relative"
      style={{ fontFamily:"'Inter', sans-serif", background:'linear-gradient(160deg, #e0f2fe 0%, #f0fdf4 50%, #fef9c3 100%)' }}>

      {/* Floating confetti */}
      <Confetti />

      {/* Fullscreen btn */}
      <button onClick={toggleFullscreen}
        className="fixed top-3 right-3 z-50 w-9 h-9 flex items-center justify-center rounded-xl bg-white/60 hover:bg-white/90 border border-black/10 text-gray-500 hover:text-gray-800 transition-all text-sm shadow-sm"
        style={{ backdropFilter:'blur(8px)' }}>
        {isFullscreen ? '⤡' : '⛶'}
      </button>

      {/* 1000 Attendees QR Code Toggle Button */}
      <button
        onClick={() => setShowQR(prev => !prev)}
        title="Scan QR Code (Press Q)"
        className="fixed top-3 right-14 z-50 h-9 px-3 flex items-center gap-1.5 rounded-xl bg-white/70 hover:bg-white/95 border border-black/10 text-zinc-700 hover:text-zinc-900 transition-all text-xs font-black shadow-sm"
        style={{ backdropFilter:'blur(8px)' }}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        <span className="text-[10px] uppercase tracking-wider hidden sm:inline">Scan QR (Q)</span>
      </button>

      {/* ── 1000 Attendees QR Code Broadcast Modal ──────────────────────────── */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            key="qr-overlay-fun"
            initial={{ opacity:0, scale:0.95 }}
            animate={{ opacity:1, scale:1 }}
            exit={{ opacity:0, scale:0.95 }}
            transition={{ duration:0.25 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center p-8 select-none"
            onClick={() => setShowQR(false)}>
            <div
              className="relative max-w-lg w-full bg-white rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl border-4 border-yellow-400"
              onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setShowQR(false)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center text-sm font-bold transition-all">
                ✕
              </button>
              <div className="px-3.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-600 text-xs font-black uppercase tracking-widest mb-3">
                ● 1,000 Spectators Live Sync · Scan for Scores
              </div>
              <h2 className="text-3xl font-black text-zinc-900 uppercase tracking-tight mb-1">
                {config.event_title || 'FAMILY DAY 2026'}
              </h2>
              <p className="text-xs text-zinc-500 font-bold mb-6">
                Point your mobile camera to scan and view real-time scores
              </p>
              <div className="p-6 bg-zinc-50 rounded-2xl shadow-inner border border-zinc-200">
                <QRCodeSVG
                  value={typeof window !== 'undefined' ? `${window.location.origin}/scoreboard/public` : '/scoreboard/public'}
                  size={290}
                  level="H"
                  includeMargin={false}
                  fgColor="#09090b"
                  bgColor="#ffffff"
                />
              </div>
              <div className="mt-5 px-4 py-1.5 rounded-xl bg-zinc-100 text-xs font-mono text-blue-600 font-bold">
                {typeof window !== 'undefined' ? `${window.location.origin}/scoreboard/public` : '/scoreboard/public'}
              </div>
              <div className="mt-3 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                Press ESC or Q to close
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Announcement Overlay ────────────────────────────────────────────── */}
      <AnimatePresence>
        {annActive && config.announcement_text && (
          <motion.div key="ann"
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            style={{ background:'rgba(0,30,60,0.93)', backdropFilter:'blur(10px)' }}>
            <motion.div animate={{scale:[1,1.08,1],opacity:[0.3,0.6,0.3]}} transition={{repeat:Infinity,duration:2.2}}
              className="absolute w-[500px] h-[500px] rounded-full border-4 border-yellow-400/30" />
            <div className="text-6xl mb-6 relative z-10">📢</div>
            <div className="relative z-10 text-center px-16 max-w-4xl">
              {annLines.map((line,i)=>(
                <motion.div key={i} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.12}}
                  className={i===0?"text-6xl font-black text-white uppercase tracking-wider leading-tight mb-4":"text-2xl font-bold text-yellow-300 uppercase tracking-widest"}>
                  {line}
                </motion.div>
              ))}
            </div>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5}}
              className="relative z-10 mt-10 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-[10px] font-black text-yellow-700 uppercase tracking-[0.5em]">Live Announcement</span>
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="relative z-10 shrink-0">
        {/* Bunting decoration */}
        <div className="absolute top-0 left-0 right-0 h-14 overflow-hidden flex items-start justify-between pointer-events-none">
          <Bunting />
          <div style={{ transform:'scaleX(-1)' }}><Bunting /></div>
        </div>

        {/* Title block */}
        <div className="pt-10 pb-4 px-8 flex flex-col items-center justify-center"
          style={{ background:'linear-gradient(180deg, #0d9488 0%, #0891b2 100%)' }}>
          
          {config.logo_url && (
            <img src={config.logo_url} alt="Logo" className="h-16 w-auto object-contain mb-3 drop-shadow-md" />
          )}

          <div className="text-[10px] font-black tracking-[0.5em] text-teal-200 uppercase mb-1">
            {config.organizer || ''}
          </div>
          <h1 className="text-5xl font-black text-white uppercase tracking-tight leading-none drop-shadow-lg text-center"
            style={{ textShadow:'0 3px 12px rgba(0,0,0,0.3)' }}>
            {config.event_title || 'Family Day'}
          </h1>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse" />
            <span className="text-sm font-black text-teal-200 uppercase tracking-[0.3em]">Live Scoreboard</span>
            <span className="text-teal-400/50">|</span>
            <span className="text-lg font-black tabular-nums tracking-widest text-white">{timeStr}</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse" />
          </div>
        </div>
      </div>

      {/* ── Team Columns ────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 px-12 py-4 overflow-hidden flex flex-col justify-center items-center w-full">
        <div className="w-full grid gap-8 items-end max-w-[1800px]" style={{ gridTemplateColumns: `repeat(${Math.max(1, sorted.length)}, 1fr)` }}>
          {sorted.map((team, idx) => {
            const originalIdx = mergedTeams.findIndex(t=>t.id===team.id);
            return (
              <TeamColumn
                key={team.id}
                team={team}
                rank={idx + 1}
                mascot={MASCOTS[originalIdx % MASCOTS.length]}
                index={idx}
              />
            );
          })}
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div className="relative z-10 shrink-0"
        style={{ background:'linear-gradient(180deg, #0891b2 0%, #0d9488 100%)' }}>
        <div className="flex items-center justify-between px-10 py-4">
          <div className="flex items-center gap-3">
            <motion.div animate={{rotate:[0,-10,10,-10,0]}} transition={{repeat:Infinity,duration:2.5}} className="text-4xl">
              🏆
            </motion.div>
            <div>
              <div className="text-[9px] font-black text-teal-300 uppercase tracking-widest">Family Day Challenge</div>
              <div className="text-lg font-black text-white uppercase tracking-wide">Who Will Win the House Cup?</div>
            </div>
          </div>

          {/* Mini legend */}
          <div className="flex items-center gap-5">
            {sorted.map(t=>(
              <div key={t.id} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background:t.color_hex }} />
                <span className="text-[10px] font-black text-white/70 uppercase tracking-wider">{t.name.split(' ')[0]}</span>
                <span className="text-sm font-black text-white tabular-nums">{t.score}</span>
              </div>
            ))}
          </div>

          <motion.div animate={{scale:[1,1.1,1]}} transition={{repeat:Infinity,duration:1.8}} className="text-4xl">
            🎉
          </motion.div>
        </div>
      </div>

      {/* Global styles for fun fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');
      `}</style>
    </div>
  );
}
