'use client';

import React, { useEffect, useState, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

type ScreenMode = 'SCORE' | 'ADS' | 'BRACKET';

type MatchState = {
  eventId: string;
  sportType: string;
  teamA: { name: string; score: number };
  teamB: { name: string; score: number };
  currentSet: number;
  isPaused: boolean;
  announcement: string;
  timer?: number;
};

type BracketMatch = {
  id: string;
  round: number;
  team1: string;
  team2: string;
  winner: 1 | 2 | null;
};

type BracketState = {
  id: string;
  teamCount: number;
  matches: Record<string, BracketMatch>;
};

// ==========================================
// 1. SCOREBOARD COMPONENT
// ==========================================
const ScoreBoardView = ({ matchState, urlEventId, currentSport, isConnected }: any) => {
  return (
    <motion.div key="scoreboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col z-10 w-full h-full">
      <header className="h-40 flex items-center justify-center relative">
        <div className="bg-zinc-900/60 backdrop-blur-3xl border border-white/5 px-12 py-4 rounded-full flex items-center gap-10 shadow-2xl">
          <div className="flex flex-col items-center">
             <div className="text-amber-500 font-black text-3xl tracking-[0.3em] uppercase leading-none italic">ZTO ARENA</div>
             <div className="text-[10px] font-bold text-zinc-500 tracking-[0.5em] mt-2 ml-1 text-center uppercase tracking-widest">{currentSport}</div>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="px-6 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
             <span className="text-amber-500 font-black text-2xl tabular-nums">
              SET {matchState.currentSet}
             </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex w-full relative">
         <div className="flex-1 flex flex-col items-center justify-center relative border-r border-white/5">
            <div className="absolute inset-0 bg-blue-600/5 opacity-50"></div>
            <motion.h2 className="z-10 text-[6vw] font-black uppercase text-blue-400 drop-shadow-[0_0_20px_rgba(37,99,235,0.6)] px-12 text-center truncate w-full">
               {matchState.teamA.name}
            </motion.h2>
            <div className="z-10 relative">
                 <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div key={matchState.teamA.score} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }} className="text-[35vw] font-black leading-none tabular-nums text-white drop-shadow-[0_0_100px_rgba(37,99,235,0.5)]">
                      {matchState.teamA.score}
                    </motion.div>
                 </AnimatePresence>
            </div>
         </div>
         <div className="flex-1 flex flex-col items-center justify-center relative">
            <div className="absolute inset-0 bg-red-600/5 opacity-50"></div>
            <motion.h2 className="z-10 text-[6vw] font-black uppercase text-red-500 drop-shadow-[0_0_20px_rgba(220,38,38,0.6)] px-12 text-center truncate w-full">
               {matchState.teamB.name}
            </motion.h2>
            <div className="z-10 relative">
                 <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div key={matchState.teamB.score} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }} className="text-[35vw] font-black leading-none tabular-nums text-white drop-shadow-[0_0_100px_rgba(220,38,38,0.5)]">
                      {matchState.teamB.score}
                    </motion.div>
                 </AnimatePresence>
            </div>
         </div>
      </main>
    </motion.div>
  );
};

// ==========================================
// 2. PRO BRACKET COMPONENT
// ==========================================
const BracketBoardView = ({ bracketState }: { bracketState: BracketState | null }) => {
    const totalRounds = useMemo(() => {
        if (!bracketState) return 0;
        return Math.ceil(Math.log2(bracketState.teamCount));
    }, [bracketState]);

    if (!bracketState || !bracketState.matches) {
       return (
            <div className="flex-1 flex flex-col items-center justify-center z-10 p-24 w-full h-full">
                <i className="fa-solid fa-sitemap text-9xl text-blue-500/20 mb-8 animate-pulse" />
                <h2 className="text-4xl font-black text-white uppercase tracking-[0.4em] italic drop-shadow-md text-center">INITIALIZING PRO BRACKET...</h2>
            </div>
       );
    }

    return (
        <motion.div key="bracket-render" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center z-10 w-full h-full relative overflow-hidden">
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
                                            <div className={`flex items-center p-10 border-b-2 border-white/5 transition-all ${m.winner === 1 ? 'bg-blue-600/20' : ''}`}>
                                                <div className={`flex-1 truncate text-4xl font-black ${m.winner === 1 ? 'text-blue-400' : m.team1 === 'BYE' ? 'text-zinc-700 italic' : 'text-zinc-400'}`}>{m.team1}</div>
                                                {m.winner === 1 && <i className="fa-solid fa-caret-right text-blue-500 text-5xl ml-6" />}
                                            </div>
                                            <div className={`flex items-center p-10 transition-all ${m.winner === 2 ? 'bg-blue-600/20' : ''}`}>
                                                <div className={`flex-1 truncate text-4xl font-black ${m.winner === 2 ? 'text-blue-400' : m.team2 === 'BYE' ? 'text-zinc-700 italic' : 'text-zinc-400'}`}>{m.team2}</div>
                                                {m.winner === 2 && <i className="fa-solid fa-caret-right text-blue-500 text-5xl ml-6" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        })}
                    </div>
                </TransformComponent>
            </TransformWrapper>
        </motion.div>
    );
};

function ArenaScreenContent() {
  const searchParams = useSearchParams();
  const urlEventId = searchParams.get('eventId') || 'BINTULU_OPEN_2026';

  const [screenMode, setScreenMode] = useState<ScreenMode>('SCORE');
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [bracketState, setBracketState] = useState<BracketState | null>(null);
  const [activeAd, setActiveAd] = useState<any | null>(null);

  useEffect(() => {
    const channel = supabase.channel(`zto-arena-${urlEventId}`, { config: { broadcast: { ack: true } } });
    channel
      .on('broadcast', { event: 'match-update' }, (payload) => setMatchState(payload.payload))
      .on('broadcast', { event: 'bracket-update' }, (payload) => setBracketState(payload.payload))
      .on('broadcast', { event: 'screen-mode' }, (payload) => setScreenMode(payload.payload.mode))
      .on('broadcast', { event: 'ad-update' }, (payload) => setActiveAd(payload.payload.activeAd))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [urlEventId]);

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden flex flex-col relative select-none cursor-none group">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(37,99,235,0.1),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(220,38,38,0.1),transparent_50% )]" />
        <div className="absolute inset-0 backdrop-blur-[100px]" />
      </div>

      <AnimatePresence mode="wait">
        {screenMode === 'SCORE' && matchState && (
            <ScoreBoardView matchState={matchState} urlEventId={urlEventId} currentSport={matchState.sportType} isConnected={true} />
        )}

        {screenMode === 'ADS' && activeAd && (
          <motion.div key="ad-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-10 flex flex-col bg-black">
            <img src={activeAd.url} className="w-full h-full object-cover" />
            <div className="absolute bottom-20 left-20">
                <h1 className="text-8xl font-black uppercase text-white drop-shadow-2xl">{activeAd.title}</h1>
            </div>
          </motion.div>
        )}

        {screenMode === 'BRACKET' && (
             <BracketBoardView bracketState={bracketState} />
        )}
      </AnimatePresence>
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
