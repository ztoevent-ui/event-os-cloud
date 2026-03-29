'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

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
             <div className="text-[10px] font-bold text-zinc-500 tracking-[0.5em] mt-2 ml-1 text-center">{currentSport} DISCIPLINE</div>
          </div>
          <div className="w-px h-10 bg-white/10"></div>
          <div className="flex flex-col">
             <div className="text-white font-black tracking-widest text-xl uppercase leading-none">{urlEventId}</div>
             <div className="flex items-center gap-2 mt-2">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse' : 'bg-red-500'}`}></span>
                <span className="text-zinc-500 text-[10px] font-black tracking-widest uppercase">{isConnected ? 'LIVE SYNCED' : 'OFFLINE'}</span>
             </div>
          </div>
          <div className="w-px h-10 bg-white/10"></div>
          <div className="px-6 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
             <span className="text-amber-500 font-black text-2xl tabular-nums tracking-tighter">
              {currentSport === 'BASKETBALL' || currentSport === 'FUTSAL' ? `Q${matchState.currentSet}` : `SET ${matchState.currentSet}`}
             </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex w-full relative">
         {(currentSport === 'BASKETBALL' || currentSport === 'FUTSAL') && (
           <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div className="bg-zinc-900/80 backdrop-blur-xl border-x-4 border-amber-500 px-12 py-6 rounded-2xl flex flex-col items-center">
                  <div className="text-[8vw] font-black tabular-nums text-amber-500 leading-none drop-shadow-[0_0_50px_rgba(245,158,11,0.5)]">
                    {matchState.timer || '12:00'}
                  </div>
                  <div className="text-xs font-black text-zinc-500 tracking-[0.4em] uppercase mt-2">Game Clock</div>
              </div>
           </div>
         )}
         <div className="flex-1 flex flex-col items-center justify-center relative border-r border-white/5">
            <div className="absolute inset-0 bg-blue-600/5 opacity-50"></div>
            <motion.h2 initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="z-10 text-[6vw] font-black uppercase text-blue-400 drop-shadow-[0_0_20px_rgba(37,99,235,0.6)] px-12 text-center truncate w-full">
               {matchState.teamA.name}
            </motion.h2>
            <div className="z-10 relative">
                 <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div key={matchState.teamA.score} initial={{ scale: 0.5, opacity: 0, filter: 'blur(20px)' }} animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }} exit={{ scale: 1.5, opacity: 0, filter: 'blur(20px)' }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="text-[35vw] font-black leading-none tabular-nums text-white drop-shadow-[0_0_100px_rgba(37,99,235,0.5)]">
                      {matchState.teamA.score}
                    </motion.div>
                 </AnimatePresence>
            </div>
         </div>
         <div className="flex-1 flex flex-col items-center justify-center relative">
            <div className="absolute inset-0 bg-red-600/5 opacity-50"></div>
            <motion.h2 initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="z-10 text-[6vw] font-black uppercase text-red-500 drop-shadow-[0_0_20px_rgba(220,38,38,0.6)] px-12 text-center truncate w-full">
               {matchState.teamB.name}
            </motion.h2>
            <div className="z-10 relative">
                 <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div key={matchState.teamB.score} initial={{ scale: 0.5, opacity: 0, filter: 'blur(20px)' }} animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }} exit={{ scale: 1.5, opacity: 0, filter: 'blur(20px)' }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="text-[35vw] font-black leading-none tabular-nums text-white drop-shadow-[0_0_100px_rgba(220,38,38,0.5)]">
                      {matchState.teamB.score}
                    </motion.div>
                 </AnimatePresence>
            </div>
         </div>
      </main>

      <footer className="h-24 flex justify-between items-center px-16 bg-zinc-900/40 border-t border-white/5 w-full">
        <div className="text-[10px] font-black tracking-[0.4em] text-zinc-600 uppercase italic">ZTO ARENA PROTOCOL • {currentSport} ENGINE</div>
        <div className="text-[10px] font-bold text-zinc-800 uppercase tracking-[0.6em]">Automated Scoring System • Realtime Node Layer</div>
      </footer>
    </motion.div>
  );
};

function ArenaScreenContent() {
  const searchParams = useSearchParams();
  const urlEventId = searchParams.get('eventId') || 'BINTULU_OPEN_2026';
  const urlSportType = searchParams.get('sport') || 'PICKLEBALL';

  const [screenMode, setScreenMode] = useState<ScreenMode>('SCORE');
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [activeAd, setActiveAd] = useState<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const channel = supabase.channel(`zto-arena-${urlEventId}`, {
      config: { broadcast: { ack: true } },
    });

    channel
      .on('broadcast', { event: 'match-update' }, (payload) => {
        setMatchState(payload.payload);
      })
      .on('broadcast', { event: 'screen-mode' }, (payload) => {
        setScreenMode(payload.payload.mode);
      })
      .on('broadcast', { event: 'ad-update' }, (payload) => {
        setActiveAd(payload.payload.activeAd);
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => { supabase.removeChannel(channel); };
  }, [urlEventId]);

  const currentSport = matchState?.sportType || urlSportType;

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden flex flex-col relative select-none cursor-none group">
      {/* Floating Back Button (Subtle) */}
      <Link 
        href="/apps/zto-arena" 
        className="absolute top-8 left-8 z-[200] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-black/50 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase text-zinc-500 hover:text-white hover:border-amber-500/50 tracking-[0.3em] cursor-pointer"
      >
        <i className="fa-solid fa-arrow-left"></i>
        Exit to Hub
      </Link>
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(37,99,235,0.1),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(220,38,38,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 backdrop-blur-[100px]"></div>
      </div>

      <AnimatePresence mode="wait">
        {screenMode === 'SCORE' && matchState && (
            <ScoreBoardView matchState={matchState} urlEventId={urlEventId} currentSport={currentSport} isConnected={isConnected} />
        )}

        {screenMode === 'ADS' && activeAd && (
          <motion.div 
            key="ad-screen"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black"
          >
            <img src={activeAd.url} alt={activeAd.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-20 left-20 right-20">
                <span className="text-xl font-black text-emerald-500 uppercase tracking-[0.4em] mb-4 block italic">{activeAd.category}</span>
                <h1 className="text-8xl font-black text-white uppercase tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] leading-none">{activeAd.title}</h1>
            </div>
          </motion.div>
        )}

        {screenMode === 'ADS' && !activeAd && (
            <motion.div key="ad-idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center z-10 text-zinc-500 font-black tracking-[0.5em] text-2xl uppercase italic">
               Awaiting Media Ingestion...
            </motion.div>
        )}

        {screenMode === 'BRACKET' && (
             <motion.div key="bracket-screen" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="flex-1 flex flex-col items-center justify-center z-10 p-24 w-full h-full">
                <div className="flex flex-col items-center justify-center w-full h-full border border-zinc-800/50 bg-zinc-950/20 backdrop-blur-md rounded-[3rem]">
                    <i className="fa-solid fa-sitemap text-9xl text-blue-500/20 mb-8 drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]"></i>
                    <h2 className="text-4xl font-black text-blue-500 uppercase tracking-[0.4em] italic drop-shadow-md">Tournament Bracket</h2>
                    <p className="text-zinc-500 font-bold uppercase tracking-[0.5em] mt-6 bg-zinc-900/50 px-8 py-3 rounded-full border border-white/5 text-sm">Rendering Live Tree Data...</p>
                </div>
             </motion.div>
        )}

        {!matchState && screenMode === 'SCORE' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center z-10 w-full h-full">
             <div className="w-24 h-24 border-4 border-zinc-900 border-t-amber-500 rounded-full animate-spin mb-8"></div>
             <div className="text-zinc-700 font-black text-4xl animate-pulse uppercase tracking-[0.2em]">Awaiting Master Sync...</div>
             <div className="text-[10px] font-bold text-zinc-800 mt-6 tracking-[0.5em] uppercase italic">Node ID: {urlEventId}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {matchState?.announcement && screenMode === 'SCORE' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-2xl">
            <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 2, opacity: 0 }} className="text-center">
              <div className="text-[15vw] font-black uppercase tracking-[0.1em] text-amber-500 drop-shadow-[0_0_100px_rgba(245,158,11,1)] leading-none italic skew-x-[-10deg]">
                {matchState.announcement}
              </div>
              {matchState.announcement === 'WINNER' && (
                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="text-6xl mt-12 text-white font-black uppercase tracking-[0.5em] bg-white/10 px-12 py-4 rounded-2xl border border-white/20 inline-block">
                  {matchState.teamA.score > matchState.teamB.score ? matchState.teamA.name : (matchState.teamB.score > matchState.teamA.score ? matchState.teamB.name : 'TIE')}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}

        {screenMode === 'SCORE' && matchState?.isPaused && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-amber-500/10 backdrop-blur-sm z-[90] flex items-center justify-center pointer-events-none">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-amber-500 text-black px-24 py-6 rounded-full font-black text-6xl uppercase tracking-[0.2em] italic shadow-[0_0_100px_rgba(245,158,11,0.5)]">
                  TIMEOUT
              </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ArenaScreenPage() {
    return (
        <Suspense fallback={<div className="bg-black min-h-screen"></div>}>
            <ArenaScreenContent />
        </Suspense>
    );
}
