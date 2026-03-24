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

export default function BigScreenPage() {
  const [matchState, setMatchState] = useState<MatchState>(initialState);
  const [isConnected, setIsConnected] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  useEffect(() => {
    const client = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Subscribe to Event ID channel
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
          setTimeout(() => setShowAnnouncement(false), 3500);
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
      
      {/* Hidden Dev Back Button (Hover top left to see) */}
      <Link href="/" className="absolute top-4 left-4 z-50 w-12 h-12 bg-black/10 hover:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-800 hover:text-white transition opacity-0 hover:opacity-100">
        <i className="fa-solid fa-arrow-left"></i>
      </Link>

      {/* Screen Header */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black to-transparent z-10 flex items-start justify-center pt-8 pointer-events-none">
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 px-8 py-3 rounded-full flex items-center gap-6 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
          <div className="text-amber-500 font-black text-2xl tracking-[0.2em] uppercase">ZTO ARENA</div>
          <div className="w-px h-6 bg-zinc-700"></div>
          <div className="text-zinc-300 font-bold tracking-widest text-lg">{matchState.eventId.replace(/_/g, ' ')}</div>
          <div className="w-px h-6 bg-zinc-700"></div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse' : 'bg-red-500'}`}></span>
            <span className="text-zinc-500 text-sm font-bold tracking-widest">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
          </div>
        </div>
      </div>

      {/* Main Score Display Split */}
      <main className="flex-1 flex w-full">
        {/* TEAM A Left Side */}
        <div className="flex-1 bg-gradient-to-br from-blue-950 to-black border-r border-zinc-800 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.15)_0%,transparent_70%)]"></div>
          <div className="z-10 text-center mb-12">
            <h2 className="text-[5vw] font-black uppercase tracking-wider text-blue-400 drop-shadow-[0_0_15px_rgba(37,99,235,0.8)] px-12 truncate max-w-[45vw]">
              {matchState.teamA.name}
            </h2>
          </div>
          <div className="z-10 text-[35vw] font-black leading-none tabular-nums tracking-tighter drop-shadow-[0_0_80px_rgba(37,99,235,0.6)]">
            {matchState.teamA.score}
          </div>
        </div>

        {/* TEAM B Right Side */}
        <div className="flex-1 bg-gradient-to-bl from-red-950 to-black flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.15)_0%,transparent_70%)]"></div>
          <div className="z-10 text-center mb-12">
            <h2 className="text-[5vw] font-black uppercase tracking-wider text-red-400 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] px-12 truncate max-w-[45vw]" dir="rtl">
              {matchState.teamB.name}
            </h2>
          </div>
          <div className="z-10 text-[35vw] font-black leading-none tabular-nums tracking-tighter drop-shadow-[0_0_80px_rgba(220,38,38,0.6)]">
            {matchState.teamB.score}
          </div>
        </div>
      </main>

      {/* Announcement Overlay */}
      <div className={`absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-500 ${showAnnouncement ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-110'}`}>
        <div className="text-center">
          <div className="text-[12vw] font-black uppercase tracking-widest text-amber-500 drop-shadow-[0_0_50px_rgba(245,158,11,0.8)] scale-y-[1.2] leading-none mb-8">
            {matchState.announcement}
          </div>
          
          {/* Confetti or decorative elements for WINNER */}
          {matchState.announcement === 'WINNER' && (
            <div className="text-6xl animate-bounce mt-12 text-zinc-300 tracking-widest font-black uppercase">
              {matchState.teamA.score > matchState.teamB.score ? matchState.teamA.name : (matchState.teamB.score > matchState.teamA.score ? matchState.teamB.name : 'TIE')}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
