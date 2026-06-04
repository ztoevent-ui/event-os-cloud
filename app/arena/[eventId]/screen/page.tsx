'use client';

import React, { useEffect, useState, Suspense, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import dynamic from 'next/dynamic';
import type { ArenaMatch } from '@/lib/arena-types';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false }) as any;

type ScreenMode = 'SCORE' | 'ADS' | 'BRACKET' | 'YOUTUBE' | 'STANDBY';
type AutoPilotMode = 'AUTO' | 'MANUAL';

type MatchState = {
  eventId: string; sportType: string;
  teamA: { name: string; score: number };
  teamB: { name: string; score: number };
  currentSet: number; isPaused: boolean; announcement: string; timer?: number;
};

type BracketMatch = { id: string; round: number; team1: string; team2: string; winner: 1 | 2 | null; };
type BracketState = { id: string; teamCount: number; matches: Record<string, BracketMatch>; };

// ==========================================
// STANDBY SCREEN
// ==========================================
const StandbyView = () => (
  <motion.div key="standby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="flex-1 flex flex-col items-center justify-center w-full h-full z-10 relative">
    <div className="absolute inset-0 overflow-hidden">
      {/* Scan lines */}
      <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,86,179,0.03) 2px, rgba(0,86,179,0.03) 4px)' }} />
      {/* Moving sweep */}
      <motion.div className="absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-blue-600/5 to-transparent"
        animate={{ y: ['-10%', '110%'] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} />
    </div>
    <div className="relative z-10 text-center">
      <motion.div className="w-24 h-24 bg-[#0056B3]/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-[#0056B3]/30"
        animate={{ boxShadow: ['0 0 20px rgba(0,86,179,0.2)', '0 0 60px rgba(0,86,179,0.5)', '0 0 20px rgba(0,86,179,0.2)'] }}
        transition={{ duration: 3, repeat: Infinity }}>
        <i className="fa-solid fa-atom text-4xl text-[#4da3ff]" style={{ animation: 'spin 8s linear infinite' }} />
      </motion.div>
      <motion.div className="text-6xl font-black uppercase tracking-[0.3em] text-white italic mb-4"
        animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 3, repeat: Infinity }}>ZTO ARENA</motion.div>
      <div className="text-[#0056B3] text-[11px] font-black uppercase tracking-[0.6em] mt-2">Awaiting Broadcast Signal</div>
    </div>
  </motion.div>
);

// ==========================================
// SCOREBOARD
// ==========================================
const ScoreBoardView = ({ matchState, currentSport }: { matchState: MatchState; currentSport: string }) => (
  <motion.div key="scoreboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="flex-1 flex flex-col z-10 w-full h-full">
    <header className="h-40 flex items-center justify-center">
      <div className="bg-zinc-900/60 backdrop-blur-3xl border border-white/5 px-12 py-4 rounded-full flex items-center gap-10 shadow-2xl">
        <div className="flex flex-col items-center">
          <div className="text-amber-500 font-black text-3xl tracking-[0.3em] uppercase leading-none italic">ZTO ARENA</div>
          <div className="text-[10px] font-bold text-zinc-500 tracking-[0.5em] mt-2 ml-1 uppercase">{currentSport}</div>
        </div>
        <div className="w-px h-10 bg-white/10" />
        <div className="px-6 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <span className="text-amber-500 font-black text-2xl tabular-nums">SET {matchState.currentSet}</span>
        </div>
      </div>
    </header>
    <main className="flex-1 flex w-full relative">
      <div className="flex-1 flex flex-col items-center justify-center relative border-r border-white/5">
        <div className="absolute inset-0 bg-blue-600/5" />
        <motion.h2 className="z-10 text-[6vw] font-black uppercase text-blue-400 drop-shadow-[0_0_20px_rgba(37,99,235,0.6)] px-12 text-center truncate w-full">
          {matchState.teamA.name}
        </motion.h2>
        <div className="z-10 relative">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={matchState.teamA.score}
              initial={{ scale: 0.5, opacity: 0, y: -30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 1.5, opacity: 0, y: 30 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="text-[35vw] font-black leading-none tabular-nums text-white drop-shadow-[0_0_100px_rgba(37,99,235,0.5)]">
              {matchState.teamA.score}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className="absolute inset-0 bg-red-600/5" />
        <motion.h2 className="z-10 text-[6vw] font-black uppercase text-red-500 drop-shadow-[0_0_20px_rgba(220,38,38,0.6)] px-12 text-center truncate w-full">
          {matchState.teamB.name}
        </motion.h2>
        <div className="z-10 relative">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={matchState.teamB.score}
              initial={{ scale: 0.5, opacity: 0, y: -30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 1.5, opacity: 0, y: 30 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="text-[35vw] font-black leading-none tabular-nums text-white drop-shadow-[0_0_100px_rgba(220,38,38,0.5)]">
              {matchState.teamB.score}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  </motion.div>
);

// ==========================================
// BRACKET
// ==========================================
const BracketBoardView = ({ bracketState }: { bracketState: BracketState | null }) => {
  const totalRounds = useMemo(() => bracketState ? Math.ceil(Math.log2(bracketState.teamCount)) : 0, [bracketState]);
  if (!bracketState?.matches) return (
    <div className="flex-1 flex flex-col items-center justify-center z-10 p-24 w-full h-full">
      <i className="fa-solid fa-sitemap text-9xl text-blue-500/20 mb-8 animate-pulse" />
      <h2 className="text-4xl font-black text-white uppercase tracking-[0.4em] italic text-center">INITIALIZING BRACKET...</h2>
    </div>
  );
  return (
    <motion.div key="bracket-render" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex-1 flex flex-col items-center justify-center z-10 w-full h-full relative overflow-hidden">
      <div className="absolute top-16 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
        <h1 className="text-6xl font-black text-blue-500 uppercase tracking-widest italic drop-shadow-[0_0_30px_rgba(59,130,246,0.6)]">ZTO Open Cup Bracket</h1>
        <div className="text-sm font-black text-blue-300 tracking-[0.5em] uppercase mt-4">Automated Node Render &bull; {bracketState.teamCount} Teams</div>
      </div>
      <TransformWrapper initialScale={0.5} centerOnInit minScale={0.1} limitToBounds={false}>
        <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
          <div className="flex gap-48 p-96 min-w-[4000px] h-full items-center">
            {Array.from({ length: totalRounds }).map((_, rIdx) => {
              const round = rIdx + 1;
              const roundMatches = Object.values(bracketState.matches).filter(m => m.round === round);
              return (
                <div key={round} className="flex flex-col justify-around gap-16 h-full">
                  <div className="text-center font-black uppercase text-blue-500/40 tracking-[0.8em] text-2xl mb-12">ROUND {round}</div>
                  {roundMatches.map(m => (
                    <div key={m.id} className={`w-[450px] bg-zinc-900/80 backdrop-blur-xl border-2 rounded-3xl overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.5)] transition-all duration-500 ${round === totalRounds ? 'border-amber-500/80 scale-125' : 'border-white/5'}`}>
                      <div className={`flex items-center p-10 border-b-2 border-white/5 ${m.winner === 1 ? 'bg-blue-600/20' : ''}`}>
                        <div className={`flex-1 truncate text-4xl font-black ${m.winner === 1 ? 'text-blue-400' : m.team1 === 'BYE' ? 'text-zinc-700 italic' : 'text-zinc-400'}`}>{m.team1}</div>
                        {m.winner === 1 && <i className="fa-solid fa-caret-right text-blue-500 text-5xl ml-6" />}
                      </div>
                      <div className={`flex items-center p-10 ${m.winner === 2 ? 'bg-blue-600/20' : ''}`}>
                        <div className={`flex-1 truncate text-4xl font-black ${m.winner === 2 ? 'text-blue-400' : m.team2 === 'BYE' ? 'text-zinc-700 italic' : 'text-zinc-400'}`}>{m.team2}</div>
                        {m.winner === 2 && <i className="fa-solid fa-caret-right text-blue-500 text-5xl ml-6" />}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </motion.div>
  );
};

// ==========================================
// BADMINTON 5-COURT STANDBY VIEW
// ==========================================
interface Badminton5CourtProps {
  urlEventId: string;
  eventName: string;
}

function Badminton5CourtStandbyView({ urlEventId, eventName }: Badminton5CourtProps) {
  const [matches, setMatches] = useState<ArenaMatch[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadMatches = async () => {
    const { data } = await supabase
      .from('arena_matches')
      .select('*')
      .eq('tournament_id', urlEventId)
      .in('status', ['LIVE', 'PENDING'])
      .order('court_number', { ascending: true, nullsFirst: false });
    if (data) setMatches(data as ArenaMatch[]);
  };

  useEffect(() => {
    loadMatches();
    const ch = supabase.channel(`badminton-standby-matches-${urlEventId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'arena_matches', 
        filter: `tournament_id=eq.${urlEventId}` 
      }, () => {
        loadMatches();
      })
      .subscribe();
    channelRef.current = ch;
    return () => { 
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [urlEventId]);

  const courtsList = [1, 2, 3, 4, 5];

  const getServingBox = (match: ArenaMatch) => {
    const isTeamALeft = match.left_team ? match.left_team === 'A' : true;
    const isServerA = match.server === 'A';
    const serverScore = isServerA ? match.score_a : match.score_b;
    const isEven = serverScore % 2 === 0;
    const serverOnLeft = isServerA ? isTeamALeft : !isTeamALeft;
    if (serverOnLeft) {
      return { x: 8, y: isEven ? 40 : 10, width: 32, height: 30 };
    } else {
      return { x: 80, y: isEven ? 10 : 40, width: 32, height: 30 };
    }
  };

  const unassignedOrQueueMatches = matches.filter(
    m => m.status === 'PENDING' && (!m.court_number || m.court_number > 5)
  );

  return (
    <div className="w-full h-full flex flex-col relative select-none bg-[#030712] text-white">
      {/* Ambient background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#047857]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#0e7490]/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 px-8 py-4 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#0f766e]/10 border border-[#0f766e]/20 shadow-[0_0_15px_rgba(15,118,110,0.15)]">
            <i className="fa-solid fa-satellite text-[#22d3ee] text-lg animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-[0.2em] text-white leading-none">
              {eventName} <span className="text-[#059669]">LIVE</span>
            </h1>
            <p className="text-[8px] text-zinc-500 uppercase tracking-[0.3em] mt-1 font-black">
              Arena Display Console // 5 Courts Scoreboard
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl font-black text-[#22d3ee] tabular-nums tracking-widest leading-none">
            {currentTime.toLocaleTimeString('en-US', { hour12: false })}
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="flex-1 relative z-10 p-6 flex overflow-hidden min-h-0">
        <div className="grid grid-cols-5 gap-4 flex-1 h-full min-h-0">
          {courtsList.map((courtNum) => {
            const courtMatches = matches.filter(m => m.court_number === courtNum);
            const liveMatch = courtMatches.find(m => m.status === 'LIVE');
            const pendingMatch = !liveMatch ? courtMatches.find(m => m.status === 'PENDING') : null;

            if (liveMatch) {
              const servingBox = getServingBox(liveMatch);
              const isTeamALeft = liveMatch.left_team ? liveMatch.left_team === 'A' : true;
              return (
                <div key={`court-${courtNum}`} className="bg-gradient-to-b from-[#022c22]/90 via-[#021f18]/95 to-[#022c22]/90 border border-[#059669]/30 rounded-2xl p-4 flex flex-col justify-between shadow-[0_4px_30px_rgba(4,120,87,0.15)] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#059669]/50" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#059669]/50" />
                  
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="bg-[#059669] text-black font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                      COURT {courtNum}
                    </span>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded">
                      <span className="w-1 h-1 rounded-full bg-red-500 animate-ping" />
                      <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">LIVE</span>
                    </div>
                  </div>

                  <div className="text-center my-1.5">
                    <span className="text-[8px] font-black text-[#22d3ee]/80 uppercase tracking-widest bg-[#22d3ee]/10 px-1.5 py-0.5 rounded border border-[#22d3ee]/20">
                      {liveMatch.event_type || 'INDIVIDUAL'}
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col justify-center gap-2.5 my-1.5">
                    {/* Team A */}
                    <div className={`flex items-center justify-between p-2 rounded-lg border ${
                      liveMatch.server === 'A' ? 'bg-[#0f766e]/10 border-[#0f766e]/30' : 'bg-black/20 border-white/5'
                    }`}>
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          {liveMatch.server === 'A' && <span className="inline-block text-[#f59e0b] animate-bounce shrink-0 text-xs" style={{ transform: 'rotate(45deg)' }}>🏸</span>}
                          <span className={`text-[11px] font-black uppercase truncate tracking-wide ${liveMatch.server === 'A' ? 'text-white' : 'text-zinc-400'}`}>
                            {liveMatch.team_a_name}
                          </span>
                        </div>
                      </div>
                      <span className={`text-2xl font-black tabular-nums ${liveMatch.server === 'A' ? 'text-[#f59e0b]' : 'text-white'}`}>
                        {liveMatch.score_a}
                      </span>
                    </div>

                    {/* Team B */}
                    <div className={`flex items-center justify-between p-2 rounded-lg border ${
                      liveMatch.server === 'B' ? 'bg-[#0f766e]/10 border-[#0f766e]/30' : 'bg-black/20 border-white/5'
                    }`}>
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          {liveMatch.server === 'B' && <span className="inline-block text-[#f59e0b] animate-bounce shrink-0 text-xs" style={{ transform: 'rotate(45deg)' }}>🏸</span>}
                          <span className={`text-[11px] font-black uppercase truncate tracking-wide ${liveMatch.server === 'B' ? 'text-white' : 'text-zinc-400'}`}>
                            {liveMatch.team_b_name}
                          </span>
                        </div>
                      </div>
                      <span className={`text-2xl font-black tabular-nums ${liveMatch.server === 'B' ? 'text-[#f59e0b]' : 'text-white'}`}>
                        {liveMatch.score_b}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-2 mt-1 space-y-3">
                    <div className="flex flex-col items-center">
                      <div className="flex gap-1.5">
                        {liveMatch.sets_scores && liveMatch.sets_scores.slice(0, liveMatch.current_set - 1).map((set, idx) => (
                          <span key={idx} className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-[8px] font-black text-zinc-300">
                            S{idx + 1}: {set.a}-{set.b}
                          </span>
                        ))}
                        <span className="bg-[#059669]/10 border border-[#059669]/30 px-1.5 py-0.5 rounded text-[8px] font-black text-[#059669]">
                          Set {liveMatch.current_set}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center bg-black/40 rounded-lg p-1 border border-white/5">
                      <div className="relative scale-90">
                        <svg viewBox="0 0 120 80" className="w-28 h-18 opacity-80 select-none rounded border border-white/10">
                          <rect x="0" y="0" width="120" height="80" fill="#047857" opacity="0.35" />
                          <rect x="4" y="4" width="112" height="72" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.7" />
                          <line x1="4" y1="10" x2="116" y2="10" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.4" />
                          <line x1="4" y1="70" x2="116" y2="70" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.4" />
                          <line x1="60" y1="4" x2="60" y2="76" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="2 2" strokeOpacity="0.9" />
                          <line x1="40" y1="4" x2="40" y2="76" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.7" />
                          <line x1="80" y1="4" x2="80" y2="76" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.7" />
                          <line x1="12" y1="4" x2="12" y2="76" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.4" />
                          <line x1="108" y1="4" x2="108" y2="76" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.4" />
                          <line x1="4" y1="40" x2="40" y2="40" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.7" />
                          <line x1="80" y1="40" x2="116" y2="40" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.7" />
                          <rect x={servingBox.x} y={servingBox.y} width={servingBox.width} height={servingBox.height} fill="#f59e0b" opacity="0.3" className="animate-pulse" />
                        </svg>
                        <div className="absolute text-[8px] pointer-events-none transition-all duration-500 font-bold" style={{ left: `${servingBox.x + servingBox.width/2 - 4}px`, top: `${servingBox.y + servingBox.height/2 - 4}px` }}>🏸</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            if (pendingMatch) {
              return (
                <div key={`court-${courtNum}`} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="bg-zinc-800 text-zinc-400 font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                      COURT {courtNum}
                    </span>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded">
                      <i className="fa-solid fa-bullhorn text-amber-500 text-[8px] animate-pulse" />
                      <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">CALLING</span>
                    </div>
                  </div>

                  <div className="text-center my-3">
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">UP NEXT</span>
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <div className="bg-black/30 border border-white/5 p-2 rounded-xl text-center">
                      <div className="text-zinc-400 text-[10px] font-bold truncate">{pendingMatch.team_a_name}</div>
                      <div className="text-zinc-600 font-black text-[8px] my-1">VS</div>
                      <div className="text-zinc-400 text-[10px] font-bold truncate">{pendingMatch.team_b_name}</div>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-2 mt-2 text-center">
                    <div className="text-[#22d3ee] text-[8px] font-black uppercase tracking-widest">{pendingMatch.event_type || 'INDIVIDUAL'}</div>
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black">{pendingMatch.round_type}</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={`court-${courtNum}`} className="bg-[#050505] border border-white/5 rounded-2xl p-4 flex flex-col justify-between items-center text-center relative overflow-hidden">
                <div className="w-full border-b border-white/5 pb-2 flex justify-between items-center">
                  <span className="text-zinc-600 font-black text-[10px] uppercase tracking-wider">COURT {courtNum}</span>
                  <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">STANDBY</span>
                </div>
                <div className="my-auto py-6 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 bg-white/[0.01] border border-white/10 rounded-full flex items-center justify-center mb-2">
                    <i className="fa-solid fa-tower-observation text-zinc-700 text-sm" />
                  </div>
                  <span className="text-[9px] font-black text-zinc-600 tracking-widest uppercase">OPEN</span>
                </div>
                <div className="w-full border-t border-white/5 pt-2 mt-2">
                  <span className="text-[7px] text-zinc-700 uppercase tracking-[0.2em] font-black">ZTO ARENA OS</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Ticker */}
      <footer className="relative z-10 h-12 bg-[#090d16] border-t border-white/5 flex items-center overflow-hidden shrink-0">
        <div className="bg-[#059669] h-full flex items-center px-4 font-black text-black uppercase tracking-[0.2em] text-[8px] shrink-0 z-20 shadow-[10px_0_20px_rgba(0,0,0,0.3)]">
          QUEUE
        </div>
        <div className="flex-1 relative overflow-hidden flex items-center">
          {unassignedOrQueueMatches.length > 0 ? (
            <div className="flex whitespace-nowrap animate-[marquee_120s_linear_infinite]">
              {[...unassignedOrQueueMatches, ...unassignedOrQueueMatches].map((match, idx) => (
                <span key={`${match.id}-${idx}`} className="mx-8 text-zinc-300 font-bold text-[10px] flex items-center gap-2">
                  <span className="text-[#22d3ee] font-black uppercase text-[8px] bg-[#22d3ee]/10 px-1 py-0.5 rounded border border-[#22d3ee]/20">{match.event_type}</span>
                  <span className="uppercase text-white font-black">{match.team_a_name}</span>
                  <span className="text-zinc-600 text-[8px] font-black">VS</span>
                  <span className="uppercase text-white font-black">{match.team_b_name}</span>
                </span>
              ))}
            </div>
          ) : (
            <div className="px-6 text-zinc-500 font-black text-[8px] uppercase tracking-widest">
              No matches scheduled in queue.
            </div>
          )}
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}} />
    </div>
  );
}

// ==========================================
// MAIN SCREEN CONTENT
// ==========================================
function ArenaScreenContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const urlEventId = (params.eventId as string) || 'BINTULU_OPEN_2026';
  const sid = parseInt(searchParams.get('sid') || '0');

  const [screenMode, setScreenMode] = useState<ScreenMode>('STANDBY');
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [bracketState, setBracketState] = useState<BracketState | null>(null);
  const [activeAd, setActiveAd] = useState<any | null>(null);
  const [youtubeState, setYoutubeState] = useState<{url: string, playing: boolean} | null>(null);
  const [autoPilot, setAutoPilot] = useState<AutoPilotMode>('AUTO');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showLocate, setShowLocate] = useState(false);
  const [eventName, setEventName] = useState<string>(urlEventId);
  const [sportType, setSportType] = useState<string>('PICKLEBALL');
  const [screenDim, setScreenDim] = useState<{w: number, h: number} | null>(null);
  const manualOverrideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    supabase.from('arena_tournaments').select('name, sport_type, screen_config').eq('id', urlEventId).single()
      .then(({ data }) => { 
          if (data?.name) setEventName(data.name); 
          if (data?.sport_type) setSportType(data.sport_type);
          if (data?.screen_config && Array.isArray(data.screen_config)) {
              const myConf = data.screen_config.find((s:any) => s.id === sid);
              if (myConf) setScreenDim({ w: myConf.w, h: myConf.h });
          }
      });
  }, [urlEventId, sid]);

  const isTargeted = (targets: number[]) => sid === 0 || targets.includes(sid);

  // Manual override: MC broadcast takes control for 10 minutes, then AutoPilot resumes
  const applyManualOverride = (mode: ScreenMode) => {
    setAutoPilot('MANUAL');
    setScreenMode(mode);
    if (manualOverrideTimer.current) clearTimeout(manualOverrideTimer.current);
    manualOverrideTimer.current = setTimeout(() => {
      setAutoPilot('AUTO');
    }, 10 * 60 * 1000);
  };

  // AutoPilot: subscribe to DB and auto-switch scenes based on live match state
  useEffect(() => {
    const ch = supabase
      .channel(`screen-autopilot-${urlEventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'arena_matches' }, (payload) => {
        const m = payload.new as any;
        // Update matchState from DB for live matches
        if (m?.status === 'LIVE') {
          setMatchState(prev => ({
            eventId: urlEventId, sportType: prev?.sportType || 'SPORT',
            teamA: { name: m.team_a_name, score: m.score_a },
            teamB: { name: m.team_b_name, score: m.score_b },
            currentSet: m.current_set || 1, isPaused: false, announcement: '',
          }));
          // AutoPilot: switch to SCORE when live match detected
          if (autoPilot === 'AUTO') setScreenMode('SCORE');
        }
      })
      .subscribe();

    const configCh = supabase
      .channel(`screen-config-${urlEventId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'arena_tournaments', filter: `id=eq.${urlEventId}` }, (payload) => {
        const t = payload.new as any;
        if (t.screen_config && Array.isArray(t.screen_config)) {
            const myConf = t.screen_config.find((s:any) => s.id === sid);
            if (myConf) setScreenDim({ w: myConf.w, h: myConf.h });
        }
      })
      .subscribe();

    return () => { 
        supabase.removeChannel(ch); 
        supabase.removeChannel(configCh);
    };
  }, [urlEventId, autoPilot, sid]);

  // MC Broadcast channel (manual override)
  useEffect(() => {
    const channel = supabase.channel(`zto-arena-${urlEventId}`, { config: { broadcast: { ack: true } } });
    channel
      .on('broadcast', { event: 'match-update' }, (payload) => {
        if (!isTargeted(payload.payload.targets)) return;
        setMatchState(payload.payload);
        applyManualOverride('SCORE');
      })
      .on('broadcast', { event: 'bracket-update' }, (payload) => {
        if (!isTargeted(payload.payload.targets)) return;
        setBracketState(payload.payload);
        applyManualOverride('BRACKET');
      })
      .on('broadcast', { event: 'screen-mode' }, (payload) => {
        if (!isTargeted(payload.payload.targets)) return;
        applyManualOverride(payload.payload.mode as ScreenMode);
      })
      .on('broadcast', { event: 'ad-update' }, (payload) => {
        if (!isTargeted(payload.payload.targets)) return;
        setActiveAd(payload.payload.activeAd);
        applyManualOverride('ADS');
      })
      .on('broadcast', { event: 'youtube-update' }, (payload) => {
        if (!isTargeted(payload.payload.targets)) return;
        setYoutubeState({ url: payload.payload.url, playing: payload.payload.playing });
        applyManualOverride('YOUTUBE');
      })
      .on('broadcast', { event: 'screen-action' }, (payload) => {
        if (!isTargeted(payload.payload.targets)) return;
        const { action } = payload.payload;
        if (action === 'clear') {
            setScreenMode('STANDBY');
            setAutoPilot('AUTO');
        } else if (action === 'pause-youtube') {
            setYoutubeState(prev => prev ? { ...prev, playing: false } : null);
        } else if (action === 'play-youtube') {
            setYoutubeState(prev => prev ? { ...prev, playing: true } : null);
        } else if (action === 'locate') {
            setShowLocate(true);
            setTimeout(() => setShowLocate(false), 5000);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [urlEventId]);

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden flex flex-col relative select-none cursor-none items-center justify-center"
         onClick={() => setHasInteracted(true)}>
         
      <div 
         className="relative w-full h-full flex flex-col overflow-hidden bg-black shadow-[0_0_50px_rgba(0,0,0,1)]"
         style={screenDim ? { aspectRatio: `${screenDim.w} / ${screenDim.h}`, maxHeight: '100vh', maxWidth: '100vw' } : {}}
      >
        {/* Ambient background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(37,99,235,0.1),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(220,38,38,0.1),transparent_50%)]" />
        </div>

      <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
        {!hasInteracted && (
          <div className="px-3 py-1.5 bg-red-500/20 border border-red-500/50 rounded-full text-red-400 text-[9px] font-black uppercase tracking-widest animate-pulse pointer-events-none shadow-[0_0_10px_rgba(239,68,68,0.3)]">
            <i className="fa-solid fa-volume-xmark mr-2" />
            Click Anywhere to Enable Audio
          </div>
        )}
      </div>

      {/* AutoPilot indicator (top-right, subtle) */}
      <div className={`absolute top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${autoPilot === 'AUTO' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${autoPilot === 'AUTO' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
        {autoPilot === 'AUTO' ? 'AutoPilot' : 'Manual'}
      </div>

      <AnimatePresence>
        {showLocate && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
            <div className="bg-[#0056B3] text-white px-12 py-8 rounded-3xl font-black uppercase tracking-widest text-6xl shadow-[0_0_50px_rgba(0,86,179,0.8)] border border-blue-400 text-center">
              <div className="text-2xl text-blue-300 mb-2">{eventName}</div>
              <div>{sid === 0 ? 'MASTER SCREEN (0)' : `SCREEN ${sid}`}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {screenMode === 'STANDBY' && (
          sportType === 'BADMINTON' && (sid === 0 || isNaN(sid)) ? (
            <Badminton5CourtStandbyView key="badminton-5court" urlEventId={urlEventId} eventName={eventName} />
          ) : (
            <StandbyView key="standby" />
          )
        )}

        {screenMode === 'SCORE' && matchState && (
          <ScoreBoardView key="scoreboard" matchState={matchState} currentSport={matchState.sportType} />
        )}

        {screenMode === 'SCORE' && !matchState && (
          sportType === 'BADMINTON' && (sid === 0 || isNaN(sid)) ? (
            <Badminton5CourtStandbyView key="badminton-5court-no-match" urlEventId={urlEventId} eventName={eventName} />
          ) : (
            <StandbyView key="standby-no-match" />
          )
        )}

        {screenMode === 'ADS' && activeAd && (
          <motion.div key="ad-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col bg-black">
            {activeAd.isVideo ? (
              <video src={activeAd.url} className="w-full h-full object-cover" autoPlay loop muted={!hasInteracted} playsInline />
            ) : (
              <img src={activeAd.url} className="w-full h-full object-cover" alt="Ad" />
            )}
            <div className="absolute bottom-20 left-20">
              <h1 className="text-8xl font-black uppercase text-white drop-shadow-2xl">{activeAd.title}</h1>
            </div>
          </motion.div>
        )}

        {screenMode === 'BRACKET' && (
          <BracketBoardView key="bracket" bracketState={bracketState} />
        )}

        {screenMode === 'YOUTUBE' && youtubeState && (
          <motion.div key="youtube-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 bg-black flex items-center justify-center">
             <ReactPlayer 
                  url={youtubeState.url} 
                  playing={youtubeState.playing} 
                  volume={1} 
                  muted={!hasInteracted}
                  width="100%" 
                  height="100%" 
                  controls={true} 
                  config={{ youtube: { playerVars: { autoplay: 1 } } }}
              />
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

export default function ArenaScreenPage() {
  return (
    <Suspense fallback={<div className="bg-black min-h-screen" />}>
      <ArenaScreenContent />
    </Suspense>
  );
}
