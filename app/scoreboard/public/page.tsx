"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { supabase } from '@/lib/supabaseClient';
import { AnimatedNumber } from '../components/AnimatedNumber';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// House mascot mapping (Corporate Sports Day Houses)
const TEAM_MASCOTS: Record<string, string> = {
  'RUMAH MERAH': '🦁',
  'RED TITANS': '🦁',
  'RUMAH BIRU': '🐉',
  'BLUE DRAGONS': '🐉',
  'RUMAH KUNING': '🐯',
  'YELLOW LIONS': '🐯',
  'RUMAH HIJAU': '🦅',
  'GREEN VIPERS': '🦅',
};

const DEFAULT_MASCOTS = ['🦁', '🐉', '🐯', '🦅', '🐺', '🦈'];

// Web Audio API Sound Synthesizer (No external MP3 file download required)
class SportsAudio {
  private ctx: AudioContext | null = null;

  private getContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    return this.ctx;
  }

  playScoreChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      // High-end sports chime chord
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);

        gain.gain.setValueAtTime(0.001, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.2, now + i * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.38);
      });
    } catch {
      // Audio playback suspended by browser policy before tap
    }
  }
}

const audio = new SportsAudio();

export default function PublicScoreboard() {
  const { data, mutate, isValidating } = useSWR('/api/scoreboard', fetcher, {
    refreshInterval: 3000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 1500,
  });

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [lastTotalScore, setLastTotalScore] = useState<number | null>(null);

  const config = data?.config || {
    organizer: 'Shell MDS',
    event_title: 'Family Day 2026',
    announcement_text: '',
    announcement_active: 'false',
  };

  const teams = useMemo(() => data?.teams || [], [data?.teams]);
  const categories = useMemo(() => data?.categories || [], [data?.categories]);
  const scores = useMemo(() => data?.scores || [], [data?.scores]);

  // Ranked teams
  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name);
    });
  }, [teams]);

  const maxScore = useMemo(() => {
    return Math.max(...teams.map((t: any) => t.score || 0), 1);
  }, [teams]);

  const totalScoreAll = useMemo(() => {
    return teams.reduce((acc: number, t: any) => acc + (t.score || 0), 0);
  }, [teams]);

  const leader = sortedTeams[0];
  const secondPlace = sortedTeams[1];
  const leaderMargin = (leader?.score || 0) - (secondPlace?.score || 0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, []);

  // Supabase real-time push channel
  useEffect(() => {
    const channel = supabase.channel('mobile_public_board')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_scores' }, () => mutate())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => mutate())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scoreboard_config' }, () => mutate())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mutate]);

  // Audio & confetti on score update
  useEffect(() => {
    if (totalScoreAll > 0) {
      if (lastTotalScore !== null && totalScoreAll > lastTotalScore) {
        if (soundEnabled) audio.playScoreChime();
        triggerConfetti(leader?.color_hex);
      }
      setLastTotalScore(totalScoreAll);
    }
  }, [totalScoreAll, soundEnabled, leader?.color_hex, lastTotalScore]);

  const triggerConfetti = (color?: string) => {
    try {
      confetti({
        particleCount: 45,
        spread: 65,
        origin: { y: 0.28 },
        colors: color ? [color, '#fbbf24', '#ffffff', '#ef4444'] : ['#ef4444', '#3b82f6', '#eab308', '#22c55e'],
      });
    } catch {
      // ignore
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const annActive = config.announcement_active === 'true' && config.announcement_text?.trim();

  return (
    <div
      className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] bg-[#07070a] text-white flex flex-col justify-between overflow-hidden select-none"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Hide developer overlay icons */}
      <style jsx global>{`
        aside[id="__next-build-watcher"],
        [data-nextjs-toast],
        nextjs-portal {
          display: none !important;
        }
      `}</style>

      {/* Ambient Radial Spotlight */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[380px] h-[220px] pointer-events-none opacity-20 blur-3xl transition-all duration-1000"
        style={{
          background: leader
            ? `radial-gradient(circle, ${leader.color_hex}50 0%, transparent 70%)`
            : 'radial-gradient(circle, #3b82f640 0%, transparent 70%)',
        }}
      />

      {/* ── 1. Top Event Header (Ultra-Clean Corporate Sports Styling) ──── */}
      <header className="shrink-0 z-20 px-3.5 pt-[calc(0.55rem+env(safe-area-inset-top,0px))] pb-2 bg-[#09090e]/95 backdrop-blur-md border-b border-white/[0.08]">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Shell MDS Event Crest */}
          <div className="flex items-center gap-2.5 min-w-0">
            {config.logo_url ? (
              <img src={config.logo_url} alt="Event Logo" className="w-8 h-8 object-contain shrink-0 rounded" />
            ) : (
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md border"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 50%, #f59e0b 100%)',
                  borderColor: 'rgba(251, 191, 36, 0.4)',
                }}
              >
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3L12 16.1l-4.8 2.5.9-5.3-3.8-3.7 5.3-.8L12 2z" />
                </svg>
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-[9px] font-black tracking-[0.25em] text-amber-400 uppercase truncate">
                  {config.organizer || 'SHELL MDS'}
                </span>
                <span className="inline-block w-1 h-1 rounded-full bg-zinc-600" />
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">ANNUAL GAMES</span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-white uppercase tracking-tight truncate leading-tight mt-0.5">
                {config.event_title || 'Family Day 2026'}
              </h1>
            </div>
          </div>

          {/* Right: Guest Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Live Indicator Badge */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">LIVE</span>
            </div>

            {/* Sound Toggle Button */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) audio.playScoreChime();
              }}
              title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all border ${
                soundEnabled
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              {soundEnabled ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M5.586 15H2V9h3.586l5-5v16l-5-5zm12.707-8.707l-8 8m0-8l8 8" />
                </svg>
              )}
            </button>

            {/* Confetti Celebration Button */}
            <button
              onClick={() => triggerConfetti(leader?.color_hex)}
              title="Celebrate"
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-amber-300 transition-all active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </button>

            {/* QR Code Share Button */}
            <button
              onClick={() => setShowQRModal(true)}
              title="Share QR Code"
              className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/40 text-[10px] font-black tracking-wider flex items-center gap-1 shadow-sm shadow-blue-500/25 transition-all active:scale-95"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span>QR</span>
            </button>
          </div>
        </div>

        {/* Announcement Banner (if active) */}
        {annActive && (
          <div className="mt-2 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/10 border border-amber-500/30 flex items-center gap-2 overflow-hidden shadow-sm">
            <span className="text-amber-400 font-black text-xs shrink-0">ANNOUNCEMENT</span>
            <div className="text-[10px] font-bold text-amber-100 tracking-wide truncate">
              {config.announcement_text}
            </div>
          </div>
        )}
      </header>

      {/* ── 2. Top Standings Ribbon (One-Line Summary) ────────────────── */}
      <div className="shrink-0 px-3.5 py-1 bg-gradient-to-r from-white/[0.04] via-white/[0.06] to-white/[0.02] border-b border-white/[0.05] flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">LEADER:</span>
          <span className="font-black uppercase tracking-wider truncate" style={{ color: leader?.color_hex || '#fff' }}>
            {leader?.name || 'Awaiting Results'}
          </span>
          {leaderMargin > 0 && (
            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-[9px] font-extrabold text-amber-300">
              +{leaderMargin} PTS
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 text-zinc-400 text-[9px] font-bold">
          <span>POOL: {totalScoreAll} PTS</span>
          <span className="text-zinc-600">|</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${isValidating ? 'animate-spin' : ''}`} />
            LIVE SYNC
          </span>
        </div>
      </div>

      {/* ── 3. Four Team Score Cards (100% Fit in Single Screen) ──────── */}
      <main className="flex-1 min-h-0 flex flex-col justify-between p-2.5 sm:p-3 gap-2 overflow-hidden">
        {teams.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 mb-3 animate-pulse">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Connecting to Live Arena...</p>
            <p className="text-[10px] text-zinc-500 mt-1">Real-time edge synchronization for 1,000 spectators</p>
          </div>
        ) : (
          sortedTeams.map((team: any, index: number) => {
            const pct = Math.max((team.score / maxScore) * 100, 3);
            const mascot = TEAM_MASCOTS[team.name.toUpperCase()] || DEFAULT_MASCOTS[index % DEFAULT_MASCOTS.length];
            const isFirst = index === 0;
            const diffFromLeader = isFirst ? 0 : team.score - leader.score;

            const rankBadges = [
              { label: '1ST', bg: 'from-amber-400 via-amber-500 to-yellow-600', text: '#000' },
              { label: '2ND', bg: 'from-slate-200 via-zinc-300 to-slate-400', text: '#000' },
              { label: '3RD', bg: 'from-amber-700 via-amber-600 to-orange-800', text: '#fff' },
              { label: '4TH', bg: 'from-zinc-700 via-zinc-800 to-zinc-900', text: '#94a3b8' },
            ];
            const badge = rankBadges[index] || { label: `${index + 1}TH`, bg: 'from-zinc-800 to-zinc-900', text: '#94a3b8' };

            return (
              <motion.div
                key={team.id}
                layout
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                onClick={() => setShowBreakdown(true)}
                className="relative flex-1 min-h-0 w-full rounded-2xl border flex flex-col justify-between overflow-hidden shadow-lg transition-transform active:scale-[0.99] cursor-pointer"
                style={{
                  borderColor: isFirst ? `${team.color_hex}70` : `${team.color_hex}35`,
                  background: `linear-gradient(135deg, ${team.color_hex}16 0%, #0d0e14 70%, #09090d 100%)`,
                  boxShadow: isFirst ? `0 0 28px ${team.color_hex}25` : undefined,
                }}
              >
                {/* Team Accent Glow */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-36 pointer-events-none opacity-20"
                  style={{ background: `radial-gradient(circle at right, ${team.color_hex}, transparent 75%)` }}
                />

                {/* Left Accent Bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
                  style={{ background: team.color_hex }}
                />

                {/* Card Body */}
                <div className="relative z-10 flex-1 flex items-center justify-between px-3.5 sm:px-4 py-1.5 sm:py-2">
                  {/* Left: Rank + Mascot + Team Name */}
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    {/* Rank Badge */}
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm shrink-0 shadow-md bg-gradient-to-br ${badge.bg}`}
                      style={{ color: badge.text }}
                    >
                      {badge.label}
                    </div>

                    {/* Team Mascot & Name */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base sm:text-lg shrink-0">{mascot}</span>
                        <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider truncate">
                          {team.name}
                        </h2>
                      </div>

                      {/* Lead / Trailing Status */}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isFirst ? (
                          <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">
                            CURRENT LEADER
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                            TRAILING BY {Math.abs(diffFromLeader)} PTS
                          </span>
                        )}
                        <span className="text-[8px] text-zinc-600">·</span>
                        <span className="text-[9px] text-zinc-400 font-medium">
                          {Math.round((team.score / Math.max(totalScoreAll, 1)) * 100)}% SHARE
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Big Animated Score Number */}
                  <div className="text-right shrink-0 pl-2">
                    <div
                      className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight leading-none"
                      style={{
                        color: team.color_hex,
                        textShadow: `0 0 20px ${team.color_hex}40`,
                      }}
                    >
                      <AnimatedNumber value={team.score} />
                    </div>
                    <span className="text-[9px] font-black text-zinc-400 tracking-widest uppercase">
                      POINTS
                    </span>
                  </div>
                </div>

                {/* Integrated Progress Bar (Visual Comparison on Same Screen) */}
                <div className="relative z-10 px-3.5 sm:px-4 pb-2">
                  <div className="w-full h-1.5 sm:h-2 bg-white/[0.08] rounded-full overflow-hidden flex items-center p-0.5">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ type: 'spring', stiffness: 60, damping: 15 }}
                      style={{
                        background: `linear-gradient(90deg, ${team.color_hex}, ${team.color_hex}dd)`,
                        boxShadow: `0 0 10px ${team.color_hex}60`,
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </main>

      {/* ── 4. Bottom Control Bar ────────────────────────────────────────── */}
      <footer className="shrink-0 z-20 px-3.5 pt-2 pb-[calc(0.55rem+env(safe-area-inset-bottom,0px))] bg-[#09090d]/95 backdrop-blur-md border-t border-white/[0.08] flex items-center justify-between gap-2">
        {/* Spectator connection indicator */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest truncate">
            1,000 SPECTATORS ONLINE
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Category Breakdown Button */}
          <button
            onClick={() => setShowBreakdown(true)}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Breakdown</span>
          </button>

          {/* Share QR Code Button */}
          <button
            onClick={() => setShowQRModal(true)}
            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span>Share QR</span>
          </button>

          {/* Instant Manual Refresh Button */}
          <button
            onClick={() => mutate()}
            title="Refresh Scoreboard"
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-xs text-zinc-400 active:scale-90 transition-all"
          >
            <svg className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin text-blue-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </footer>

      {/* ── 5. Modal: Share QR Code with Teammates ──────────────────────── */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs bg-[#111218] border border-white/15 rounded-3xl p-5 flex flex-col items-center text-center shadow-2xl relative"
            >
              <button
                onClick={() => setShowQRModal(false)}
                className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white flex items-center justify-center text-xs font-bold transition-all"
              >
                ✕
              </button>

              <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>

              <h3 className="text-sm font-black text-white uppercase tracking-tight">
                Scan for Live Scores
              </h3>
              <p className="text-[10px] text-zinc-400 mt-0.5 mb-4">
                Point your phone camera to view real-time scores
              </p>

              {/* High Contrast QR Code */}
              <div className="p-3 bg-white rounded-2xl shadow-xl mb-4 border-2 border-white/90">
                <QRCodeSVG
                  value={shareUrl || (typeof window !== 'undefined' ? window.location.href : '')}
                  size={180}
                  level="H"
                  includeMargin={false}
                  fgColor="#09090b"
                  bgColor="#ffffff"
                />
              </div>

              <div className="w-full space-y-2">
                <button
                  onClick={handleCopy}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-600/30 active:scale-95"
                >
                  {copied ? '✓ Link Copied!' : 'Copy Scoreboard Link'}
                </button>

                <Link
                  href="/scoreboard/qr"
                  className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                >
                  <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Open Printable QR Poster</span>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 6. Bottom Sheet: Category Breakdown Drawer ──────────────────── */}
      <AnimatePresence>
        {showBreakdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end"
            onClick={() => setShowBreakdown(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-h-[75vh] bg-[#101117] border-t border-white/15 rounded-t-3xl p-5 flex flex-col overflow-hidden"
            >
              {/* Drag Handle */}
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">
                    Event Category Breakdown
                  </h3>
                  <p className="text-[10px] text-zinc-400">Points awarded per competition round</p>
                </div>
                <button
                  onClick={() => setShowBreakdown(false)}
                  className="px-3 py-1 rounded-lg bg-white/10 text-xs font-bold text-zinc-300 hover:text-white"
                >
                  Close
                </button>
              </div>

              {/* Competition Categories List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {categories.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">No competition results recorded yet</p>
                ) : (
                  categories.map((cat: any) => {
                    const catScores = scores.filter((s: any) => s.category_id === cat.id);
                    return (
                      <div
                        key={cat.id}
                        className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-white tracking-wide">
                            {cat.event_name}
                          </span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 font-bold uppercase">
                            ROUND {cat.event_type}
                          </span>
                        </div>

                        {/* Team points in this category */}
                        <div className="grid grid-cols-2 gap-2">
                          {teams.map((t: any) => {
                            const teamCatScores = catScores.filter((s: any) => s.team_id === t.id);
                            const catTotal = teamCatScores.reduce((sum: number, s: any) => sum + s.score, 0);
                            return (
                              <div
                                key={t.id}
                                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs"
                                style={{
                                  borderColor: `${t.color_hex}30`,
                                  background: `${t.color_hex}10`,
                                }}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ background: t.color_hex }}
                                  />
                                  <span className="text-[10px] font-bold text-zinc-200 truncate">
                                    {t.name}
                                  </span>
                                </div>
                                <span
                                  className="font-black text-xs tabular-nums shrink-0"
                                  style={{ color: t.color_hex }}
                                >
                                  +{catTotal}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
