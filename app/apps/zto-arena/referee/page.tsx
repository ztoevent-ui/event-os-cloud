'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

type MatchState = {
  eventId: string;
  sportType: string;
  teamA: { name: string; score: number };
  teamB: { name: string; score: number };
  currentSet: number;
  isPaused: boolean;
  announcement: string;
};

function RefereeScreenContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId') || 'BINTULU_OPEN_2026';
  const sportType = searchParams.get('sport') || 'PICKLEBALL';
  
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const channel = supabase.channel(`zto-arena-${eventId}`, {
      config: { broadcast: { ack: true } },
    });

    channel
      .on('broadcast', { event: 'match-update' }, (payload) => {
        setMatchState(payload.payload);
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  if (!matchState) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-8"></div>
        <h2 className="text-2xl font-black text-white uppercase tracking-widest animate-pulse">Awaiting Match Data</h2>
        <p className="text-zinc-500 mt-4 text-sm font-bold uppercase tracking-wider">Connect Master Console to begin ({eventId})</p>
        <Link href="/apps/zto-arena" className="mt-12 text-blue-500 hover:text-blue-400 font-bold uppercase text-xs tracking-[0.2em] border-b border-blue-500/20 pb-1">
          Exit to Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      <header className="z-10 bg-black border-b-2 border-white/5 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-blue-600 text-black font-black text-sm skew-x-[-12deg]">REFEREE</div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black tracking-widest text-zinc-400 leading-none">ID: {eventId}</h1>
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mt-1">{matchState.sportType || sportType}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500 animate-pulse'}`}></div>
          <span className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">{isConnected ? 'Link Stable' : 'Sync Lost'}</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-6">
        <div className="flex-1 grid grid-cols-2 gap-6">
          <div className="bg-zinc-900 border-l-8 border-blue-600 rounded-3xl p-8 flex flex-col justify-center items-center relative overflow-hidden">
             <div className="absolute top-6 left-6 text-[10px] font-black text-zinc-700 uppercase tracking-widest">Home Team</div>
             <h2 className="text-4xl font-black uppercase mb-4 text-blue-400 truncate w-full text-center">{matchState.teamA.name}</h2>
             <AnimatePresence mode="popLayout">
                <motion.div 
                    key={matchState.teamA.score}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-[180px] font-black leading-none tabular-nums"
                >
                    {matchState.teamA.score}
                </motion.div>
             </AnimatePresence>
          </div>

          <div className="bg-zinc-900 border-r-8 border-red-600 rounded-3xl p-8 flex flex-col justify-center items-center relative overflow-hidden">
             <div className="absolute top-6 right-6 text-[10px] font-black text-zinc-700 uppercase tracking-widest text-right">Visitor</div>
             <h2 className="text-4xl font-black uppercase mb-4 text-red-500 truncate w-full text-center">{matchState.teamB.name}</h2>
             <AnimatePresence mode="popLayout">
                <motion.div 
                    key={matchState.teamB.score}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-[180px] font-black leading-none tabular-nums"
                >
                    {matchState.teamB.score}
                </motion.div>
             </AnimatePresence>
          </div>
        </div>

        <div className="mt-6 flex gap-6 h-32">
            <div className="flex-[2] bg-zinc-900 rounded-3xl flex items-center justify-center gap-12 border-t border-white/5">
                {[1, 2, 3, 4, 5].map(set => (
                    <div key={set} className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">
                            {matchState.sportType === 'BASKETBALL' || matchState.sportType === 'FUTSAL' ? `Q${set}` : `Set ${set}`}
                        </span>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl border-2 transition-all ${matchState.currentSet === set ? 'bg-amber-500 border-amber-400 text-black scale-110 shadow-lg' : 'bg-transparent border-zinc-800 text-zinc-700'}`}>
                            {set}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex-1 bg-amber-500/10 border-2 border-amber-500/20 rounded-3xl flex flex-col justify-center px-10">
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Status</span>
                <div className="text-2xl font-black uppercase text-white tracking-widest italic">
                    {matchState.isPaused ? 'Match Paused' : 'In Progress'}
                </div>
            </div>
        </div>
      </main>
      
      <AnimatePresence>
        {matchState.announcement && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-10 left-10 right-10 z-50 bg-white p-6 rounded-2xl shadow-[0_0_50px_rgba(255,255,255,0.2)] flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
                <i className="fa-solid fa-bullhorn text-black text-4xl"></i>
                <div className="text-black">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-40 leading-none mb-1">Incoming Signal</div>
                    <div className="text-3xl font-black uppercase tracking-tighter leading-none">{matchState.announcement}</div>
                </div>
            </div>
            <div className="h-2 w-32 bg-zinc-100 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 4 }}
                    className="h-full bg-blue-600"
                ></motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RefereeScreenPage() {
    return (
        <Suspense fallback={<div className="bg-black min-h-screen"></div>}>
            <RefereeScreenContent />
        </Suspense>
    );
}

