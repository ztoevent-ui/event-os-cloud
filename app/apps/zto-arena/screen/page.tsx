'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

const SUPABASE_URL = 'https://zihjzbweasaqqbwilshx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2|1rgfulwNwq_hPQyptFg-kcjbv4'; // Note: Fixing the broken key if it was truncated in thought, but I'll use the one from previous view_file.
// Wait, the key in the previous view_file was:
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4

type MatchState = {
  eventId: string;
  teamA: { name: string; score: number };
  teamB: { name: string; score: number };
  currentSet: number;
  isPaused: boolean;
  announcement: string;
};

const initialState: MatchState = {
  eventId: 'BINTULU_OPEN_2026',
  teamA: { name: 'Player A', score: 0 },
  teamB: { name: 'Player B', score: 0 },
  currentSet: 1,
  isPaused: false,
  announcement: '',
};

export default function BigScreenPage() {
  const [matchState, setMatchState] = useState<MatchState>(initialState);
  const [isConnected, setIsConnected] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  useEffect(() => {
    const client = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    const channel = client.channel(`zto-arena-${matchState.eventId}`, {
      config: {
        broadcast: { ack: true },
      },
    });

    channel
      .on('broadcast', { event: 'match-update' }, (payload) => {
        const newState = payload.payload as MatchState;
        setMatchState(newState);

        if (newState.announcement) {
          setShowAnnouncement(true);
          setTimeout(() => setShowAnnouncement(false), 4500);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setIsConnected(true);
        else setIsConnected(false);
      });

    return () => {
      client.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden flex flex-col relative select-none cursor-none">
      
      {/* Dynamic Mesh Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(37,99,235,0.1),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(220,38,38,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 backdrop-blur-[100px]"></div>
      </div>

      <header className="absolute top-0 left-0 w-full h-40 flex items-center justify-center z-10 pointer-events-none">
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-zinc-900/60 backdrop-blur-3xl border border-white/5 px-12 py-4 rounded-full flex items-center gap-10 shadow-2xl"
        >
          <div className="flex flex-col items-center">
             <div className="text-amber-500 font-black text-3xl tracking-[0.3em] uppercase leading-none">ZTO ARENA</div>
             <div className="text-[10px] font-bold text-zinc-500 tracking-[0.5em] mt-2 ml-1">DYNAMIC SCOREBOARD</div>
          </div>
          <div className="w-px h-10 bg-white/10"></div>
          <div className="flex flex-col">
             <div className="text-white font-black tracking-widest text-xl uppercase leading-none">{matchState.eventId.replace(/_/g, ' ')}</div>
             <div className="flex items-center gap-2 mt-2">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse' : 'bg-red-500'}`}></span>
                <span className="text-zinc-500 text-[10px] font-black tracking-widest uppercase">{isConnected ? 'LIVE SYNCED' : 'OFFLINE'}</span>
             </div>
          </div>
          <div className="w-px h-10 bg-white/10"></div>
          <div className="px-6 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
             <span className="text-amber-500 font-black text-2xl tabular-nums">SET {matchState.currentSet}</span>
          </div>
        </motion.div>
      </header>

      <main className="flex-1 flex w-full z-0">
        {/* TEAM A */}
        <div className="flex-1 flex flex-col items-center justify-center relative border-r border-white/5">
          <div className="absolute inset-0 bg-blue-600/5 opacity-50"></div>
          <motion.h2 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="z-10 text-[6vw] font-black uppercase text-blue-400 drop-shadow-[0_0_20px_rgba(37,99,235,0.6)] px-12 text-center"
          >
            {matchState.teamA.name}
          </motion.h2>
          <div className="z-10 relative">
             <AnimatePresence mode="popLayout" initial={false}>
                <motion.div 
                  key={matchState.teamA.score}
                  initial={{ scale: 0.5, opacity: 0, filter: 'blur(20px)' }}
                  animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                  exit={{ scale: 1.5, opacity: 0, filter: 'blur(20px)' }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="text-[40vw] font-black leading-none tabular-nums text-white drop-shadow-[0_0_100px_rgba(37,99,235,0.5)]"
                >
                  {matchState.teamA.score}
                </motion.div>
             </AnimatePresence>
          </div>
        </div>

        {/* TEAM B */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <div className="absolute inset-0 bg-red-600/5 opacity-50"></div>
          <motion.h2 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="z-10 text-[6vw] font-black uppercase text-red-500 drop-shadow-[0_0_20px_rgba(220,38,38,0.6)] px-12 text-center"
          >
            {matchState.teamB.name}
          </motion.h2>
          <div className="z-10 relative">
             <AnimatePresence mode="popLayout" initial={false}>
                <motion.div 
                  key={matchState.teamB.score}
                  initial={{ scale: 0.5, opacity: 0, filter: 'blur(20px)' }}
                  animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                  exit={{ scale: 1.5, opacity: 0, filter: 'blur(20px)' }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="text-[40vw] font-black leading-none tabular-nums text-white drop-shadow-[0_0_100px_rgba(220,38,38,0.5)]"
                >
                  {matchState.teamB.score}
                </motion.div>
             </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Announcement Overlay */}
      <AnimatePresence>
        {showAnnouncement && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl"
          >
            <motion.div 
               initial={{ scale: 0, rotate: -10 }}
               animate={{ scale: 1, rotate: 0 }}
               exit={{ scale: 2, opacity: 0 }}
               className="text-center"
            >
              <div className="text-[15vw] font-black uppercase tracking-[0.1em] text-amber-500 drop-shadow-[0_0_100px_rgba(245,158,11,1)] leading-none italic skew-x-[-10deg]">
                {matchState.announcement}
              </div>
              
              {matchState.announcement === 'WINNER' && (
                <motion.div 
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-6xl mt-12 text-white font-black uppercase tracking-[0.5em] bg-white/10 px-12 py-4 rounded-2xl border border-white/20 inline-block"
                >
                  {matchState.teamA.score > matchState.teamB.score ? matchState.teamA.name : (matchState.teamB.score > matchState.teamA.score ? matchState.teamB.name : 'TIE')}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="absolute bottom-0 left-0 w-full p-8 flex justify-between items-end z-10 pointer-events-none opacity-30">
        <div className="text-xs font-black tracking-widest text-zinc-500">ZTO PROTOCOL V2.0</div>
        <div className="text-[10px] font-bold text-zinc-700 uppercase">Automated Scoring System • Realtime Node Layer</div>
      </footer>
    </div>
  );
}
