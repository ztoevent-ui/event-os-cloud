'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

const SUPABASE_URL = 'https://zihjzbweasaqqbwilshx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';

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

export default function MasterConsolePage() {
  const [matchState, setMatchState] = useState<MatchState>(initialState);
  const [isConnected, setIsConnected] = useState(false);
  const [locked, setLocked] = useState(false);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const client = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    const channel = client.channel(`zto-arena-${matchState.eventId}`, {
      config: {
        broadcast: { ack: true },
      },
    });

    channel
      .on('broadcast', { event: 'match-update' }, (payload) => {
        setMatchState(payload.payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setIsConnected(true);
        else setIsConnected(false);
      });

    channelRef.current = channel;

    return () => {
      client.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchState.eventId]);

  const broadcastUpdate = async (newState: MatchState) => {
    setMatchState(newState);
    if (channelRef.current && isConnected) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'match-update',
        payload: newState,
      });
    }
  };

  const updateScore = (team: 'A' | 'B', change: number) => {
    if (locked) return;
    const newState = { ...matchState };
    if (team === 'A') {
      newState.teamA.score = Math.max(0, newState.teamA.score + change);
    } else {
      newState.teamB.score = Math.max(0, newState.teamB.score + change);
    }
    broadcastUpdate(newState);
  };

  const triggerAnnouncement = (type: string) => {
    if (locked) return;
    const newState = { ...matchState, announcement: type };
    broadcastUpdate(newState);
    
    setTimeout(() => {
      setMatchState(prev => {
        const resetState = { ...prev, announcement: '' };
        if (channelRef.current && isConnected) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'match-update',
            payload: resetState,
          });
        }
        return resetState;
      });
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden flex flex-col select-none relative">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.1),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.1),transparent_40%)] pointer-events-none"></div>

      <header className="z-10 bg-zinc-900/40 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10">
            <i className="fa-solid fa-arrow-left text-zinc-400"></i>
          </Link>
          <div>
            <h1 className="text-xl font-black text-amber-500 uppercase tracking-[0.2em] leading-none">Arena Master</h1>
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 tracking-[0.1em] mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              {isConnected ? 'NODE CONNECTED' : 'DISCONNECTED'} • ID: {matchState.eventId}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-zinc-900/80 p-1 rounded-xl border border-white/5">
             {[1, 2, 3].map((set) => (
               <button 
                 key={set}
                 onClick={() => !locked && broadcastUpdate({ ...matchState, currentSet: set })}
                 className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${matchState.currentSet === set ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 SET {set}
               </button>
             ))}
          </div>
          <button 
            onClick={() => setLocked(!locked)}
            className={`h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all border ${locked ? 'bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'}`}
          >
            <i className={`fa-solid ${locked ? 'fa-lock' : 'fa-lock-open'}`}></i>
            {locked ? 'Screen Locked' : 'Guard iPad'}
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 z-10">
        {/* TEAM A */}
        <div className={`relative flex flex-col rounded-[2rem] p-8 border-t border-white/10 transition-all duration-500 overflow-hidden ${locked ? 'bg-zinc-900/30' : 'bg-gradient-to-br from-blue-900/40 to-black'}`}>
          <div className="absolute inset-0 bg-blue-500/5 mix-blend-overlay"></div>
          <div className="flex justify-between items-start z-10">
            <input 
              className="bg-transparent border-none text-4xl font-black uppercase text-blue-400 focus:outline-none w-full placeholder-blue-900"
              value={matchState.teamA.name}
              onChange={(e) => broadcastUpdate({ ...matchState, teamA: { ...matchState.teamA, name: e.target.value } })}
              disabled={locked}
            />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center z-10">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div 
                key={matchState.teamA.score}
                initial={{ y: 20, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -20, opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="text-[200px] font-black leading-none tabular-nums text-white drop-shadow-[0_0_50px_rgba(37,99,235,0.4)]"
              >
                {matchState.teamA.score}
              </motion.div>
            </AnimatePresence>
            <div className="flex gap-4 mt-8 w-full max-w-sm">
              <button onClick={() => updateScore('A', -1)} className="flex-1 py-8 rounded-2xl bg-white/5 hover:bg-white/10 text-4xl font-black text-zinc-500 transition active:scale-95 border border-white/5">-</button>
              <button onClick={() => updateScore('A', 1)} className="flex-[2] py-8 rounded-2xl bg-blue-600 hover:bg-blue-500 text-4xl font-bold text-white shadow-xl shadow-blue-900/50 transition active:scale-95">+</button>
            </div>
          </div>
        </div>

        {/* TEAM B */}
        <div className={`relative flex flex-col rounded-[2rem] p-8 border-t border-white/10 transition-all duration-500 overflow-hidden ${locked ? 'bg-zinc-900/30' : 'bg-gradient-to-br from-red-900/40 to-black'}`}>
          <div className="absolute inset-0 bg-red-500/5 mix-blend-overlay"></div>
          <div className="flex justify-end items-start z-10 text-right">
            <input 
              className="bg-transparent border-none text-4xl font-black uppercase text-red-500 focus:outline-none w-full text-right placeholder-red-900"
              value={matchState.teamB.name}
              onChange={(e) => broadcastUpdate({ ...matchState, teamB: { ...matchState.teamB, name: e.target.value } })}
              disabled={locked}
            />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center z-10">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div 
                key={matchState.teamB.score}
                initial={{ y: 20, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -20, opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="text-[200px] font-black leading-none tabular-nums text-white drop-shadow-[0_0_50px_rgba(220,38,38,0.4)]"
              >
                {matchState.teamB.score}
              </motion.div>
            </AnimatePresence>
            <div className="flex gap-4 mt-8 w-full max-w-sm">
               <button onClick={() => updateScore('B', 1)} className="flex-[2] py-8 rounded-2xl bg-red-600 hover:bg-red-500 text-4xl font-bold text-white shadow-xl shadow-red-900/50 transition active:scale-95">+</button>
               <button onClick={() => updateScore('B', -1)} className="flex-1 py-8 rounded-2xl bg-white/5 hover:bg-white/10 text-4xl font-black text-zinc-500 transition active:scale-95 border border-white/5">-</button>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="col-span-1 lg:col-span-2 bg-zinc-900/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white/5 flex flex-wrap items-center justify-between gap-6">
          <div className="flex-1 min-w-[300px]">
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block mb-4">Production Cues</span>
            <div className="flex gap-3">
              {['MATCH POINT', 'TIMEOUT', 'WINNER'].map(type => (
                <button 
                  key={type}
                  onClick={() => triggerAnnouncement(type)} 
                  disabled={locked} 
                  className={`px-6 py-4 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all border ${matchState.announcement === type ? 'bg-amber-500 border-amber-400 text-black shadow-lg shadow-amber-500/40 scale-105' : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
             <button 
               onClick={() => broadcastUpdate({ ...matchState, isPaused: !matchState.isPaused })}
               disabled={locked}
               className={`h-14 px-8 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-colors ${matchState.isPaused ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
             >
               <i className={`fa-solid ${matchState.isPaused ? 'fa-play' : 'fa-pause'}`}></i>
               {matchState.isPaused ? 'Resume Match' : 'Pause'}
             </button>
             <button 
               onClick={() => {
                 if (confirm('Reset scores to 0?')) {
                   broadcastUpdate({ ...matchState, teamA: { ...matchState.teamA, score: 0 }, teamB: { ...matchState.teamB, score: 0 }, announcement: '' });
                 }
               }} 
               disabled={locked} 
               className="h-14 px-8 bg-zinc-800 text-red-500 hover:bg-red-600 hover:text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition flex items-center gap-2"
             >
               <i className="fa-solid fa-rotate-right"></i> Reset
             </button>
          </div>
        </div>
      </main>
    </div>
  );
}
