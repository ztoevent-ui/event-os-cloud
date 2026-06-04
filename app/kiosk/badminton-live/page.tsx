'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { ArenaMatch } from '@/lib/arena-types';

export default function BadmintonKioskLivePage() {
  const [matches, setMatches] = useState<ArenaMatch[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const channelRef = useRef<any>(null);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Data fetch
  const loadMatches = async () => {
    const { data } = await supabase
      .from('arena_matches')
      .select('*')
      .in('status', ['LIVE', 'PENDING'])
      .order('court_number', { ascending: true, nullsFirst: false });
    if (data) setMatches(data as ArenaMatch[]);
  };

  useEffect(() => {
    loadMatches();
    const channel = supabase
      .channel('kiosk-badminton-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'arena_matches' }, loadMatches)
      .subscribe();
    channelRef.current = channel;
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  const courtsList = [1, 2, 3, 4, 5];

  return (
    <div className="w-screen h-screen flex flex-col select-none bg-[#030712] text-white overflow-hidden font-sans">

      {/* ── Ultra-thin header (2rem) ─────────────────────────────── */}
      <header
        className="flex justify-between items-center px-5 shrink-0 bg-black/60 border-b border-white/5"
        style={{ height: '2rem' }}
      >
        <span className="text-[10px] font-black tracking-widest text-[#059669] uppercase">
          ZTO ARENA · 5-COURT LIVE SCORES
        </span>
        <span className="text-[10px] font-black text-[#22d3ee] tabular-nums tracking-widest">
          {currentTime.toLocaleTimeString('en-US', { hour12: false })}
        </span>
      </header>

      {/* ── 5-court grid fills all remaining height ──────────────── */}
      <div className="flex-1 min-h-0 grid grid-cols-5 gap-1.5 p-1.5">
        {courtsList.map((courtNum) => {
          const courtMatches = matches.filter(m => m.court_number === courtNum);
          const liveMatch   = courtMatches.find(m => m.status === 'LIVE');
          const pendingMatch = !liveMatch ? courtMatches.find(m => m.status === 'PENDING') : null;

          /* ── LIVE ──────────────────────────────────────────────── */
          if (liveMatch) {
            const prevSets = liveMatch.sets_scores?.slice(0, (liveMatch.current_set ?? 1) - 1) ?? [];
            return (
              <div
                key={`court-${courtNum}`}
                className="bg-gradient-to-b from-[#011c14] to-[#030f09] border border-[#059669]/50 rounded-xl flex flex-col overflow-hidden"
              >
                {/* Badge strip */}
                <div
                  className="flex items-center justify-between px-3 bg-[#059669]/20 border-b border-[#059669]/30 shrink-0"
                  style={{ height: '2.2rem' }}
                >
                  <span className="bg-[#059669] text-black font-black text-[11px] px-2.5 py-0.5 rounded leading-none tracking-wider">
                    COURT {courtNum}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                      SET {liveMatch.current_set}
                    </span>
                  </div>
                </div>

                {/* Team A row – 50% of body height */}
                <div
                  className={`flex-1 flex items-center justify-between px-3 border-b border-white/5 min-h-0 ${
                    liveMatch.server === 'A' ? 'bg-[#059669]/10' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5 overflow-hidden">
                    {liveMatch.server === 'A' && (
                      <span
                        className="text-[#f59e0b] leading-none shrink-0"
                        style={{ fontSize: 'clamp(0.7rem, 1.5vw, 1.2rem)' }}
                      >🏸</span>
                    )}
                    <span
                      className={`font-black uppercase leading-tight truncate ${
                        liveMatch.server === 'A' ? 'text-white' : 'text-zinc-400'
                      }`}
                      style={{ fontSize: 'clamp(0.5rem, 1.1vw, 0.95rem)' }}
                    >
                      {liveMatch.team_a_name}
                    </span>
                  </div>
                  <span
                    className={`font-black tabular-nums leading-none ml-1 shrink-0 ${
                      liveMatch.server === 'A' ? 'text-[#f59e0b]' : 'text-white'
                    }`}
                    style={{
                      fontSize: 'clamp(3rem, 9vw, 9rem)',
                      textShadow: liveMatch.server === 'A'
                        ? '0 0 40px rgba(245,158,11,0.8)'
                        : '0 0 20px rgba(255,255,255,0.1)',
                    }}
                  >
                    {liveMatch.score_a}
                  </span>
                </div>

                {/* Team B row – 50% of body height */}
                <div
                  className={`flex-1 flex items-center justify-between px-3 min-h-0 ${
                    liveMatch.server === 'B' ? 'bg-[#059669]/10' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5 overflow-hidden">
                    {liveMatch.server === 'B' && (
                      <span
                        className="text-[#f59e0b] leading-none shrink-0"
                        style={{ fontSize: 'clamp(0.7rem, 1.5vw, 1.2rem)' }}
                      >🏸</span>
                    )}
                    <span
                      className={`font-black uppercase leading-tight truncate ${
                        liveMatch.server === 'B' ? 'text-white' : 'text-zinc-400'
                      }`}
                      style={{ fontSize: 'clamp(0.5rem, 1.1vw, 0.95rem)' }}
                    >
                      {liveMatch.team_b_name}
                    </span>
                  </div>
                  <span
                    className={`font-black tabular-nums leading-none ml-1 shrink-0 ${
                      liveMatch.server === 'B' ? 'text-[#f59e0b]' : 'text-white'
                    }`}
                    style={{
                      fontSize: 'clamp(3rem, 9vw, 9rem)',
                      textShadow: liveMatch.server === 'B'
                        ? '0 0 40px rgba(245,158,11,0.8)'
                        : '0 0 20px rgba(255,255,255,0.1)',
                    }}
                  >
                    {liveMatch.score_b}
                  </span>
                </div>

                {/* Previous sets footer – only when sets exist */}
                {prevSets.length > 0 && (
                  <div
                    className="flex items-center justify-center gap-1 px-2 border-t border-white/5 shrink-0 bg-black/30"
                    style={{ height: '1.8rem' }}
                  >
                    {prevSets.map((set, idx) => (
                      <span
                        key={idx}
                        className="bg-white/5 border border-white/10 px-1.5 rounded text-[10px] font-black text-zinc-300 leading-none py-0.5"
                      >
                        {set.a}–{set.b}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          /* ── CALLING / PENDING ─────────────────────────────────── */
          if (pendingMatch) {
            return (
              <div
                key={`court-${courtNum}`}
                className="bg-zinc-950 border border-zinc-800/60 rounded-xl flex flex-col overflow-hidden"
              >
                <div
                  className="flex items-center justify-between px-3 bg-zinc-900/60 border-b border-white/5 shrink-0"
                  style={{ height: '2.2rem' }}
                >
                  <span className="bg-zinc-700 text-zinc-300 font-black text-[11px] px-2.5 py-0.5 rounded leading-none tracking-wider">
                    COURT {courtNum}
                  </span>
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest animate-pulse">
                    CALLING
                  </span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-2 px-3 min-h-0">
                  <span
                    className="text-zinc-200 font-black text-center w-full truncate uppercase tracking-wide"
                    style={{ fontSize: 'clamp(0.7rem, 1.5vw, 1.2rem)' }}
                  >
                    {pendingMatch.team_a_name}
                  </span>
                  <span
                    className="text-zinc-600 font-black tracking-[0.4em]"
                    style={{ fontSize: 'clamp(0.5rem, 1vw, 0.8rem)' }}
                  >VS</span>
                  <span
                    className="text-zinc-200 font-black text-center w-full truncate uppercase tracking-wide"
                    style={{ fontSize: 'clamp(0.7rem, 1.5vw, 1.2rem)' }}
                  >
                    {pendingMatch.team_b_name}
                  </span>
                </div>
              </div>
            );
          }

          /* ── STANDBY ───────────────────────────────────────────── */
          return (
            <div
              key={`court-${courtNum}`}
              className="bg-[#050505] border border-white/5 rounded-xl flex flex-col overflow-hidden"
            >
              <div
                className="flex items-center justify-between px-3 border-b border-white/5 shrink-0"
                style={{ height: '2.2rem' }}
              >
                <span className="text-zinc-600 font-black text-[11px] tracking-wider">COURT {courtNum}</span>
                <span className="text-[10px] font-black text-zinc-700 tracking-widest">STANDBY</span>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <span
                  className="font-black text-zinc-800 tracking-widest uppercase"
                  style={{ fontSize: 'clamp(1rem, 2.5vw, 2rem)' }}
                >OPEN</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
