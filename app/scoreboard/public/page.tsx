"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { supabase } from '@/lib/supabaseClient';
import { AnimatedNumber } from '../components/AnimatedNumber';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// ─── Mascot assignment ───────────────────────────────────────────────────────
const getMascot = (name: string, index: number): string => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('merah') || lower.includes('red')) return '🦁';
  if (lower.includes('biru') || lower.includes('blue')) return '🐉';
  if (lower.includes('hijau') || lower.includes('green')) return '🦅';
  if (lower.includes('kuning') || lower.includes('yellow')) return '🐯';
  const MASCOTS = ['🦁', '🐉', '🦅', '🐯', '🦊', '🐺', '🦈', '🦋'];
  return MASCOTS[index % MASCOTS.length];
};

// ─── Festive Bunting Garland ────────────────────────────────────────────────
function FestiveBunting() {
  const flags = [
    '#ef4444', '#3b82f6', '#eab308', '#22c55e',
    '#f97316', '#8b5cf6', '#ec4899', '#06b6d4',
    '#ef4444', '#3b82f6', '#eab308', '#22c55e'
  ];
  return (
    <div className="w-full overflow-hidden pointer-events-none select-none h-6 flex items-start justify-between relative px-1 shrink-0 z-20">
      <svg className="absolute top-0 left-0 w-full h-6" preserveAspectRatio="none" viewBox="0 0 100 20">
        <path d="M 0 2 Q 50 14 100 2" fill="none" stroke="#94a3b8" strokeWidth="0.8" opacity="0.4" />
      </svg>
      <div className="w-full flex justify-between items-start z-10">
        {flags.map((color, i) => (
          <div
            key={i}
            style={{
              width: 0,
              height: 0,
              borderLeft: '11px solid transparent',
              borderRight: '11px solid transparent',
              borderTop: `18px solid ${color}`,
              marginTop: i % 2 === 0 ? '1px' : '4px',
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.12))',
              transform: `rotate(${((i % 3) - 1) * 3}deg)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Floating Background Confetti ───────────────────────────────────────────
function BackgroundConfetti() {
  const particles = [
    { left: '6%', delay: 0, duration: 4.8, color: '#ef4444', size: 8 },
    { left: '20%', delay: 1.2, duration: 5.4, color: '#3b82f6', size: 9 },
    { left: '36%', delay: 0.6, duration: 4.5, color: '#eab308', size: 7 },
    { left: '52%', delay: 2.0, duration: 5.6, color: '#22c55e', size: 9 },
    { left: '68%', delay: 1.4, duration: 4.2, color: '#f97316', size: 8 },
    { left: '82%', delay: 0.8, duration: 5.1, color: '#8b5cf6', size: 10 },
    { left: '94%', delay: 2.3, duration: 4.7, color: '#ec4899', size: 7 },
  ];
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: p.left,
            top: -20,
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            borderRadius: 2,
            opacity: 0.5,
          }}
          animate={{
            y: ['0vh', '105vh'],
            rotate: [0, 360],
            x: [0, i % 2 === 0 ? 25 : -25],
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

// ─── Audio Chime (Carnival Major Arpeggio) ──────────────────────────────────
class FunChime {
  private ctx: AudioContext | null = null;
  play() {
    try {
      if (!this.ctx) {
        const C = window.AudioContext || (window as any).webkitAudioContext;
        if (!C) return;
        this.ctx = new C();
      }
      const ctx = this.ctx;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.07);
        gain.gain.setValueAtTime(0.0001, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.12, now + i * 0.07 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.32);
      });
    } catch {
      /* ignore audio context restrictions */
    }
  }
}
const funAudio = new FunChime();

// ─── Rank Badge Component ───────────────────────────────────────────────────
function RankPill({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 shadow-xs border border-yellow-300">
        ⭐ 1ST
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-slate-200 to-slate-300 text-slate-800 shadow-xs border border-slate-300">
        🥈 2ND
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-xs border border-amber-500">
        🥉 3RD
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
      4TH
    </span>
  );
}

// ─── Main Public Mobile Scoreboard ──────────────────────────────────────────
export default function PublicScoreboard() {
  const { data, mutate } = useSWR('/api/scoreboard', fetcher, {
    refreshInterval: 3000,
    revalidateOnFocus: true,
  });

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [copied, setCopied] = useState(false);

  // Track previous top leader to fire confetti on lead changes
  const prevLeaderIdRef = useRef<string | null>(null);
  const prevScoresHashRef = useRef<string>('');

  const teams = data?.teams || [];
  const scores = data?.scores || [];
  const categories = data?.categories || [];
  const config = data?.config || {};

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => b.score - a.score);
  }, [teams]);

  const leader = sortedTeams[0] || null;
  const maxScore = leader?.score ? Math.max(leader.score, 100) : 100;

  // Supabase Realtime subscriptions
  useEffect(() => {
    const chScores = supabase
      .channel('fun_public_scores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_scores' }, () => {
        mutate();
        setLastUpdated(new Date());
      })
      .subscribe();

    const chTeams = supabase
      .channel('fun_public_teams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        mutate();
        setLastUpdated(new Date());
      })
      .subscribe();

    const chConfig = supabase
      .channel('fun_public_config')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scoreboard_config' }, () => {
        mutate();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chScores);
      supabase.removeChannel(chTeams);
      supabase.removeChannel(chConfig);
    };
  }, [mutate]);

  // Handle score change sound & leader celebration
  useEffect(() => {
    if (!sortedTeams.length) return;
    const scoresHash = sortedTeams.map(t => `${t.id}:${t.score}`).join('|');
    if (prevScoresHashRef.current && prevScoresHashRef.current !== scoresHash) {
      if (soundEnabled) {
        funAudio.play();
      }
      setLastUpdated(new Date());

      // Check if leader changed
      const currentLeaderId = sortedTeams[0]?.id;
      if (prevLeaderIdRef.current && prevLeaderIdRef.current !== currentLeaderId) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.3 },
          colors: ['#ef4444', '#3b82f6', '#eab308', '#22c55e', '#ec4899'],
        });
      }
      prevLeaderIdRef.current = currentLeaderId;
    }
    prevScoresHashRef.current = scoresHash;
    if (!prevLeaderIdRef.current && sortedTeams[0]) {
      prevLeaderIdRef.current = sortedTeams[0].id;
    }
  }, [sortedTeams, soundEnabled]);

  const handleManualConfetti = () => {
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.25 },
      colors: ['#ef4444', '#3b82f6', '#eab308', '#22c55e', '#ec4899', '#06b6d4'],
    });
  };

  const handleCopyLink = () => {
    const url = typeof window !== 'undefined' ? window.location.href : 'https://ztoevent.com/scoreboard/public';
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const annActive = config.announcement_active === 'true';
  const annLines = (config.announcement_text || '').split('\n').filter(Boolean);

  const shareUrl = typeof window !== 'undefined' ? window.location.origin + '/scoreboard/public' : 'https://ztoevent.com/scoreboard/public';

  return (
    <div
      className="w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col relative select-none"
      style={{
        background: 'linear-gradient(160deg, #e0f2fe 0%, #f0fdf4 50%, #fef9c3 100%)',
        fontFamily: "var(--font-fredoka), 'Fredoka', 'Comic Sans MS', cursive, sans-serif",
      }}
    >
      {/* Background Floating Confetti */}
      <BackgroundConfetti />

      {/* ── TOP FESTIVE BUNTING ────────────────────────────────────────────── */}
      <FestiveBunting />

      {/* ── HEADER (Compact Mobile Banner) ─────────────────────────────────── */}
      <header className="relative z-10 shrink-0 px-3 pt-0.5 pb-1">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-2 mb-1">
          {/* Organizer + Event Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-sm border border-teal-200/80 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black tracking-wider text-teal-800 uppercase">
              {config.organizer || 'SHELL MDS'} · {config.event_title || 'FAMILY DAY 2026'}
            </span>
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-1.5">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(v => !v)}
              className={`h-7 px-2 flex items-center gap-1 rounded-full text-xs font-bold transition-all shadow-xs border ${
                soundEnabled
                  ? 'bg-amber-400 text-amber-950 border-amber-300'
                  : 'bg-white/90 text-slate-600 border-slate-200 hover:bg-white'
              }`}
              title={soundEnabled ? 'Mute Sound' : 'Enable Sound Chimes'}
            >
              <span>{soundEnabled ? '🔔' : '🔕'}</span>
            </button>

            {/* Confetti Blast */}
            <button
              onClick={handleManualConfetti}
              className="h-7 px-2.5 flex items-center gap-1 rounded-full bg-white/90 hover:bg-white text-xs font-bold text-pink-600 border border-pink-200 shadow-xs active:scale-95 transition-all"
              title="Blast Confetti"
            >
              <span>🎉</span>
            </button>

            {/* Share QR */}
            <button
              onClick={() => setShowQR(true)}
              className="h-7 px-2.5 flex items-center gap-1 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-black uppercase tracking-wider shadow-xs active:scale-95 transition-all"
            >
              <span>📱</span>
              <span className="text-[10px]">QR</span>
            </button>
          </div>
        </div>

        {/* Title & Leader Ribbon Card */}
        <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-700 rounded-2xl px-3 py-1.5 shadow-md border-2 border-teal-400/40 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-wide uppercase leading-tight drop-shadow-xs">
                HOUSE CUP LIVE
              </h1>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-400 text-emerald-950 text-[9px] font-black tracking-wider uppercase animate-pulse">
                LIVE
              </span>
            </div>
            {leader && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm">👑</span>
                <span className="text-xs font-black text-yellow-300 uppercase tracking-wide">
                  {leader.name} leading with {leader.score.toLocaleString()} pts!
                </span>
              </div>
            )}
          </div>

          <div className="text-right">
            <span className="text-[9px] font-black text-teal-200 uppercase tracking-widest block">
              TOTAL TEAMS
            </span>
            <span className="text-lg sm:text-xl font-black text-white tabular-nums">
              {sortedTeams.length} HOUSES
            </span>
          </div>
        </div>
      </header>

      {/* ── 4 HOUSE CARDS STACK (Fits exactly in 1 screen) ──────────────────── */}
      <main className="relative z-10 flex-1 min-h-0 flex flex-col justify-between gap-2 px-3 py-1 overflow-hidden">
        {sortedTeams.map((team, idx) => {
          const rank = idx + 1;
          const isLeader = rank === 1;
          const originalIdx = teams.findIndex((t: any) => t.id === team.id);
          const mascot = getMascot(team.name, originalIdx >= 0 ? originalIdx : idx);
          const percent = maxScore > 0 ? Math.min(100, Math.round((team.score / maxScore) * 100)) : 0;
          const gap = leader && leader.id !== team.id ? leader.score - team.score : 0;

          return (
            <motion.div
              key={team.id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24, delay: idx * 0.05 }}
              onClick={() => {
                setSelectedTeam(team);
                setShowBreakdown(true);
              }}
              className="flex-1 min-h-0 rounded-2xl bg-white/95 backdrop-blur-md px-3.5 py-2 flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition-all relative overflow-hidden"
              style={{
                border: `3.5px solid ${team.color_hex}`,
                boxShadow: `0 4px 16px ${team.color_hex}30, 0 1px 0 ${team.color_hex}`,
                background: `linear-gradient(135deg, #ffffff 75%, ${team.color_hex}10 100%)`,
              }}
            >
              {/* Left Column: Mascot Avatar & Rank */}
              <div className="flex flex-col items-center justify-center shrink-0 w-12 z-10">
                <div className="relative">
                  <span
                    className="text-4xl inline-block filter leading-none"
                    style={{ filter: `drop-shadow(0 3px 8px ${team.color_hex}60)` }}
                  >
                    {mascot}
                  </span>
                  {isLeader && (
                    <motion.span
                      animate={{ y: [0, -3, 0], scale: [1, 1.15, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute -top-2.5 -right-2 text-base pointer-events-none"
                      style={{ filter: 'drop-shadow(0 2px 5px rgba(255,200,0,0.9))' }}
                    >
                      👑
                    </motion.span>
                  )}
                </div>
                <div className="mt-1">
                  <RankPill rank={rank} />
                </div>
              </div>

              {/* Middle Column: House Name, Gap, Progress, Stars */}
              <div className="flex-1 min-w-0 flex flex-col justify-center z-10">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2
                    className="text-base sm:text-lg font-black uppercase tracking-wide truncate leading-tight"
                    style={{ color: team.color_hex }}
                  >
                    {team.name}
                  </h2>
                  {isLeader ? (
                    <span className="px-1.5 py-0.2 rounded-md bg-amber-400 text-amber-950 text-[9px] font-black uppercase tracking-wider">
                      LEADER
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">
                      -{gap} pts
                    </span>
                  )}
                </div>

                <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 mt-0.5">
                  {isLeader ? (
                    <span className="text-amber-600 font-black">★ Ranked 1st in House Cup</span>
                  ) : (
                    <span>Gap to leader: <strong className="text-slate-600">-{gap} pts</strong></span>
                  )}
                  <span className="text-slate-300">·</span>
                  <span className="text-teal-700 font-black">Details ›</span>
                </div>

                {/* Candy Rounded Progress Bar */}
                <div className="w-full mt-1.5">
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200/90 shadow-inner">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                      style={{
                        background: `linear-gradient(90deg, ${team.color_hex}99, ${team.color_hex})`,
                      }}
                    />
                  </div>
                </div>

                {/* Mini Star Rating Accents */}
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mt-0.5">
                  <span>{percent}% of leader</span>
                  <div className="flex gap-1" style={{ color: team.color_hex }}>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <span key={i} className="text-[11px] leading-none opacity-80">★</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Score Pod */}
              <div
                className="shrink-0 px-3.5 py-2.5 rounded-2xl flex flex-col items-center justify-center min-w-[88px] shadow-sm text-white z-10"
                style={{
                  background: team.color_hex,
                  boxShadow: `0 4px 14px ${team.color_hex}45`,
                }}
              >
                <div className="text-2xl sm:text-3xl font-black tabular-nums leading-none tracking-tight">
                  <AnimatedNumber value={team.score} />
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest text-white/90 mt-1">
                  POINTS
                </div>
              </div>
            </motion.div>
          );
        })}
      </main>

      {/* ── FOOTER STATUS BAR ──────────────────────────────────────────────── */}
      <footer className="relative z-10 shrink-0 px-3 py-1.5 bg-white/90 backdrop-blur-md border-t border-slate-200/90 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide">
            LIVE SYNC · {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setSelectedTeam(sortedTeams[0] || null);
              setShowBreakdown(true);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider transition-all"
          >
            📊 Breakdown
          </button>
          <button
            onClick={() => setShowQR(true)}
            className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-[10px] font-black uppercase tracking-wider transition-all border border-teal-200"
          >
            📱 Share QR
          </button>
        </div>
      </footer>

      {/* ── SHARE QR MODAL ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            key="qr-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQR(false)}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-5 pb-6 max-w-sm w-full text-center shadow-2xl border-4 border-yellow-400 relative overflow-hidden"
            >
              <button
                onClick={() => setShowQR(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-sm font-bold transition-all"
              >
                ✕
              </button>

              <div className="inline-block px-3 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-black uppercase tracking-wider mb-2">
                Spectator Live Board
              </div>

              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-1">
                Scan for Scores
              </h2>
              <p className="text-xs text-slate-500 font-medium mb-3">
                Scan with your phone camera to open the live house standings!
              </p>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner mb-3">
                <QRCodeSVG
                  value={shareUrl}
                  size={160}
                  level="H"
                  includeMargin={false}
                  fgColor="#09090b"
                  bgColor="#ffffff"
                />
              </div>

              <div className="bg-slate-100 rounded-xl p-2 text-[10px] font-mono text-teal-800 break-all mb-4 select-all">
                {shareUrl}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider transition-all"
                >
                  {copied ? '✓ Copied!' : 'Copy Link'}
                </button>
                <button
                  onClick={() => setShowQR(false)}
                  className="py-2.5 px-5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-xs uppercase tracking-wider transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── GAME BREAKDOWN MODAL ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showBreakdown && (
          <motion.div
            key="breakdown-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowBreakdown(false)}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl border-t-4 sm:border-4 border-teal-500 pb-8 sm:pb-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <h3 className="text-lg font-black uppercase text-slate-900 leading-tight">
                      Game Points Breakdown
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold">
                      Scores across all Family Day activities
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBreakdown(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-sm font-bold transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Team Selector Tabs */}
              <div className="grid grid-cols-4 gap-1.5 py-3">
                {sortedTeams.map(t => {
                  const isSelected = (selectedTeam?.id || sortedTeams[0]?.id) === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTeam(t)}
                      className="py-1.5 px-1 rounded-xl text-center transition-all flex flex-col items-center"
                      style={{
                        background: isSelected ? t.color_hex : `${t.color_hex}15`,
                        color: isSelected ? '#ffffff' : t.color_hex,
                        border: `2px solid ${t.color_hex}`,
                      }}
                    >
                      <span className="text-xs font-black uppercase truncate w-full">
                        {t.name.replace('RUMAH ', '')}
                      </span>
                      <span className="text-[11px] font-black tabular-nums">
                        {t.score}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Team Breakdown List */}
              {(() => {
                const active = selectedTeam || sortedTeams[0];
                if (!active) return null;
                const teamScores = scores.filter((s: any) => s.team_id === active.id);

                return (
                  <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
                    <div
                      className="p-3 rounded-2xl flex items-center justify-between"
                      style={{ background: `${active.color_hex}15`, border: `1.5px solid ${active.color_hex}40` }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getMascot(active.name, 0)}</span>
                        <div>
                          <div className="text-sm font-black uppercase" style={{ color: active.color_hex }}>
                            {active.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-bold">
                            Total: {teamScores.length} recorded events
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black tabular-nums" style={{ color: active.color_hex }}>
                          {active.score}
                        </div>
                        <div className="text-[9px] font-black uppercase text-slate-400">
                          TOTAL PTS
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider px-1 pt-2">
                      Event Scores
                    </div>

                    {categories.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400">
                        No game categories found.
                      </div>
                    ) : (
                      categories.map((cat: any) => {
                        const matchingScore = teamScores.find((s: any) => s.category_id === cat.id);
                        const points = matchingScore ? matchingScore.score : 0;
                        return (
                          <div
                            key={cat.id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80"
                          >
                            <div>
                              <div className="text-xs font-black uppercase text-slate-800">
                                {cat.event_name}
                              </div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase">
                                {cat.event_type || 'ACTIVITY'}
                              </div>
                            </div>
                            <div className="text-right">
                              <span
                                className={`text-base font-black tabular-nums ${
                                  points > 0 ? 'text-teal-700' : 'text-slate-300'
                                }`}
                              >
                                {points > 0 ? `+${points}` : '0'}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400 block -mt-0.5">
                                pts
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })()}

              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowBreakdown(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider transition-all"
                >
                  Close Breakdown
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BROADCAST ANNOUNCEMENT OVERLAY ─────────────────────────────────── */}
      <AnimatePresence>
        {annActive && config.announcement_text && (
          <motion.div
            key="announcement-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6"
            style={{ background: 'rgba(0, 30, 60, 0.94)', backdropFilter: 'blur(10px)' }}
          >
            <div className="text-5xl mb-4 animate-bounce">📢</div>
            <div className="text-center max-w-sm">
              <span className="inline-block px-3 py-1 rounded-full bg-yellow-400/20 border border-yellow-400 text-yellow-300 text-[10px] font-black uppercase tracking-widest mb-3">
                Live Announcement
              </span>
              {annLines.map((line: string, i: number) => (
                <div
                  key={i}
                  className={
                    i === 0
                      ? 'text-2xl font-black text-white uppercase tracking-wide leading-tight mb-2'
                      : 'text-sm font-bold text-yellow-200 uppercase tracking-wider'
                  }
                >
                  {line}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
