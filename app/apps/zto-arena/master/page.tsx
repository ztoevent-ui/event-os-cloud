'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

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
    
    // Create LAN-first Realtime Channel Isolation based on event_id
    const channel = client.channel(`zto-arena-${matchState.eventId}`, {
      config: {
        broadcast: { ack: true },
      },
    });

    channel
      .on('broadcast', { event: 'match-update' }, (payload) => {
        // Master usually only SENDS, but can receive if multiple iPads are synced
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
    
    // Auto-clear announcement after a few seconds
    setTimeout(() => {
      broadcastUpdate({ ...newState, announcement: '' });
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden flex flex-col p-4 select-none">
      {/* App Header */}
      <header className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-2xl mb-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-700 transition">
            <i className="fa-solid fa-arrow-left"></i>
          </Link>
          <div>
            <h1 className="text-xl font-black text-amber-500 uppercase tracking-widest">Master Console</h1>
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-bold tracking-widest">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              {isConnected ? 'LIVE SYNC ENABLED' : 'OFFLINE'} | EVENT: {matchState.eventId}
            </div>
          </div>
        </div>

        <button 
          onClick={() => setLocked(!locked)}
          className={`px-6 py-3 rounded-xl font-black text-sm uppercase flex items-center gap-2 transition-all ${locked ? 'bg-red-600 text-white shadow-[0_0_15px_#dc2626]' : 'bg-zinc-800 text-amber-500 hover:bg-zinc-700'}`}
        >
          <i className={`fa-solid ${locked ? 'fa-lock' : 'fa-lock-open'}`}></i>
          {locked ? 'Screen Locked' : 'Lock iPad'}
        </button>
      </header>

      {/* Main Controls Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* TEAM A */}
        <div className={`flex flex-col rounded-3xl p-6 border-2 transition-all duration-300 ${locked ? 'opacity-50 pointer-events-none border-zinc-800 bg-zinc-900/50' : 'border-blue-600 bg-blue-900/20'}`}>
          <div className="flex justify-between items-center mb-6">
            <input 
              className="bg-transparent border-none text-3xl font-black uppercase text-blue-400 focus:outline-none w-1/2"
              value={matchState.teamA.name}
              onChange={(e) => broadcastUpdate({ ...matchState, teamA: { ...matchState.teamA, name: e.target.value } })}
              disabled={locked}
            />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-[180px] font-black tabular-nums leading-none text-white drop-shadow-[0_0_30px_rgba(37,99,235,0.8)]">
              {matchState.teamA.score}
            </div>
            <div className="flex gap-4 mt-8 w-full px-8">
              <button onClick={() => updateScore('A', -1)} className="flex-1 py-6 rounded-2xl bg-white/10 hover:bg-white/20 text-4xl font-black text-white active:scale-95 transition backdrop-blur-sm">-</button>
              <button onClick={() => updateScore('A', 1)} className="flex-[2] py-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-4xl font-black text-white active:scale-95 shadow-[0_0_30px_rgba(37,99,235,0.5)] transition">+</button>
            </div>
          </div>
        </div>

        {/* TEAM B */}
        <div className={`flex flex-col rounded-3xl p-6 border-2 transition-all duration-300 ${locked ? 'opacity-50 pointer-events-none border-zinc-800 bg-zinc-900/50' : 'border-red-600 bg-red-900/20'}`}>
          <div className="flex justify-between items-center mb-6">
            <input 
              className="bg-transparent border-none text-3xl font-black uppercase text-red-400 focus:outline-none w-1/2 text-right float-right"
              dir="rtl"
              value={matchState.teamB.name}
              onChange={(e) => broadcastUpdate({ ...matchState, teamB: { ...matchState.teamB, name: e.target.value } })}
              disabled={locked}
            />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-[180px] font-black tabular-nums leading-none text-white drop-shadow-[0_0_30px_rgba(220,38,38,0.8)]">
              {matchState.teamB.score}
            </div>
            <div className="flex gap-4 mt-8 w-full px-8 reverse">
              <button onClick={() => updateScore('B', 1)} className="flex-[2] py-6 rounded-2xl bg-red-600 hover:bg-red-500 text-4xl font-black text-white active:scale-95 shadow-[0_0_30px_rgba(220,38,38,0.5)] transition">+</button>
              <button onClick={() => updateScore('B', -1)} className="flex-1 py-6 rounded-2xl bg-white/10 hover:bg-white/20 text-4xl font-black text-white active:scale-95 transition backdrop-blur-sm">-</button>
            </div>
          </div>
        </div>

        {/* Overrides & Automations Panel */}
        <div className="col-span-1 lg:col-span-2 bg-zinc-900 rounded-3xl p-6 border border-zinc-800 flex gap-4">
          <div className="flex-1">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Big Screen Animation Triggers</h3>
            <div className="flex gap-3">
              <button onClick={() => triggerAnnouncement('MATCH POINT')} disabled={locked} className="px-6 py-4 bg-zinc-800 hover:bg-amber-500 hover:text-black rounded-xl font-bold uppercase tracking-wider text-sm transition">
                Match Point
              </button>
              <button onClick={() => triggerAnnouncement('TIMEOUT')} disabled={locked} className="px-6 py-4 bg-zinc-800 hover:bg-amber-500 hover:text-black rounded-xl font-bold uppercase tracking-wider text-sm transition">
                Time Out
              </button>
              <button onClick={() => triggerAnnouncement('WINNER')} disabled={locked} className="px-6 py-4 bg-zinc-800 hover:bg-amber-500 hover:text-black rounded-xl font-bold uppercase tracking-wider text-sm transition">
                Winner
              </button>
            </div>
          </div>

          <div className="w-px bg-zinc-800 mx-4"></div>

          <div>
             <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Game Control</h3>
             <div className="flex items-center gap-3">
                <button 
                  onClick={() => broadcastUpdate({ ...matchState, teamA: { ...matchState.teamA, score: 0 }, teamB: { ...matchState.teamB, score: 0 } })} 
                  disabled={locked} 
                  className="px-6 py-4 bg-red-950/30 text-red-500 hover:bg-red-900 hover:text-white rounded-xl font-bold uppercase tracking-wider text-sm transition"
                >
                  <i className="fa-solid fa-rotate-right mr-2"></i> Reset Match
                </button>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
