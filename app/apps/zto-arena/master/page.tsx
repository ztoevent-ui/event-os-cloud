'use client';

import React, { useEffect, useState, useRef, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

// --- TYPES & INTERFACES ---

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

export type BracketMatch = {
  id: string;
  round: number;
  team1: string;
  team2: string;
  winner: 1 | 2 | null;
  nextMatchId?: string;
  nextTeamSlot?: 1 | 2;
};

export type BracketData = {
  id: string;
  teamCount: number;
  matches: Record<string, BracketMatch>;
};

// --- BRACKET GENERATOR LOGIC ---

function generateFlexibleBracket(count: number): BracketData {
    const matches: Record<string, BracketMatch> = {};
    const rounds = Math.ceil(Math.log2(count));
    const totalSlots = Math.pow(2, rounds);
    
    // 1. Generate all matches bottom-up
    // Final is Round (rounds), SF is (rounds-1), QF is (rounds-2)...
    // We'll name them by round and index: e.g. R4-M1 is the Final for a 16-team (4 round) tourney.
    
    for (let r = rounds; r >= 1; r--) {
        const matchesInRound = Math.pow(2, rounds - r);
        for (let i = 1; i <= matchesInRound; i++) {
            const matchId = `R${r}-M${i}`;
            const nextMatchId = r < rounds ? `R${r + 1}-M${Math.ceil(i / 2)}` : undefined;
            const nextTeamSlot = r < rounds ? (i % 2 !== 0 ? 1 : 2) : undefined;
            
            matches[matchId] = {
                id: matchId,
                round: r,
                team1: 'TBD',
                team2: 'TBD',
                winner: null,
                nextMatchId,
                nextTeamSlot
            };
        }
    }

    // 2. Populate Round 1 with teams or Byes
    // For N=300, we have rounds=9 (512 slots). 
    // This logic is simplified for now: just fill Round 1 up to 'count' teams.
    const round1Count = Math.pow(2, rounds - 1);
    for (let i = 1; i <= round1Count; i++) {
        const m = matches[`R1-M${i}`];
        const t1Idx = (i * 2) - 1;
        const t2Idx = i * 2;
        
        m.team1 = t1Idx <= count ? `Team ${t1Idx}` : 'BYE';
        m.team2 = t2Idx <= count ? `Team ${t2Idx}` : 'BYE';
        
        // Auto-advance BYEs
        if (m.team2 === 'BYE' && m.team1 !== 'BYE') m.winner = 1;
        if (m.team1 === 'BYE' && m.team2 !== 'BYE') m.winner = 2;
    }

    return { id: 'universal-bracket', teamCount: count, matches };
}

// --- MAIN COMPONENTS ---

function MasterConsoleContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId') || 'BINTULU_OPEN_2026';
  
  const [activeTab, setActiveTab] = useState<'SCORE' | 'ADS' | 'BRACKET' | 'GROUPS' | 'MUSIC'>('BRACKET');
  const [screenMode, setScreenMode] = useState<ScreenMode>('SCORE');
  const [teamInputCount, setTeamInputCount] = useState(8);

  const [matchState, setMatchState] = useState<MatchState>({
    eventId, sportType: 'PICKLEBALL', teamA: { name: 'Player A', score: 0 }, teamB: { name: 'Player B', score: 0 }, currentSet: 1, isPaused: false, announcement: '',
  });

  const [bracketState, setBracketState] = useState<BracketData>(() => generateFlexibleBracket(8));
  const [activeAdId, setActiveAdId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [locked, setLocked] = useState(false);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const channel = supabase.channel(`zto-arena-${eventId}`, { config: { broadcast: { ack: true } } });
    channel
      .on('broadcast', { event: 'screen-mode' }, (payload) => setScreenMode(payload.payload.mode))
      .on('broadcast', { event: 'bracket-update' }, (payload) => setBracketState(payload.payload))
      .subscribe((status) => setIsConnected(status === 'SUBSCRIBED'));
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  const broadcastBracketUpdate = async (newState: BracketData) => {
    setBracketState(newState);
    if (channelRef.current && isConnected) {
      await channelRef.current.send({ type: 'broadcast', event: 'bracket-update', payload: newState });
    }
  };

  const handleRegenBracket = () => {
      broadcastBracketUpdate(generateFlexibleBracket(teamInputCount));
  };

  const advanceWinner = (matchId: string, winnerSlot: 1 | 2) => {
      const newState = { ...bracketState, matches: { ...bracketState.matches } };
      const cur = newState.matches[matchId];
      cur.winner = winnerSlot;

      if (cur.nextMatchId && cur.nextTeamSlot) {
          const next = newState.matches[cur.nextMatchId];
          const name = winnerSlot === 1 ? cur.team1 : cur.team2;
          if (cur.nextTeamSlot === 1) next.team1 = name;
          else next.team2 = name;
          next.winner = null;
      }
      broadcastBracketUpdate(newState);
  };

  const updateMatchTeamName = (matchId: string, slot: 1 | 2, name: string) => {
      const newState = { ...bracketState, matches: { ...bracketState.matches } };
      newState.matches[matchId][slot === 1 ? 'team1' : 'team2'] = name;
      broadcastBracketUpdate(newState);
  };

  const totalRounds = Math.ceil(Math.log2(bracketState.teamCount));

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden flex flex-col select-none relative">
      <header className="z-20 bg-zinc-950 border-b border-white/10 px-6 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-6">
          <Link href="/apps/zto-arena" className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-600 hover:text-white transition-colors tracking-widest">
            <i className="fa-solid fa-arrow-left"></i> Hub
          </Link>
          <div className="w-px h-6 bg-white/10" />
          <h1 className="text-xl font-black uppercase italic tracking-widest">ZTO PRO Console</h1>
        </div>

        <div className="flex items-center gap-4">
             <div className="flex bg-zinc-900 rounded-xl p-1 border border-white/5">
                {['SCORE', 'ADS', 'BRACKET'].map(m => (
                    <button key={m} onClick={() => {
                        setScreenMode(m as any);
                        channelRef.current.send({ type: 'broadcast', event: 'screen-mode', payload: { mode: m } });
                    }} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${screenMode === m ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-white'}`}>{m}</button>
                ))}
             </div>
        </div>
      </header>

      {/* TABS */}
      <div className="bg-zinc-900/40 border-b border-white/5 px-8 pt-4 flex gap-6 z-10">
          {[
              { id: 'SCORE', label: 'Score', icon: 'fa-stopwatch' },
              { id: 'BRACKET', label: 'Pro Bracket', icon: 'fa-sitemap' },
              { id: 'GROUPS', label: 'Group Stage', icon: 'fa-users' },
              { id: 'ADS', label: 'Media', icon: 'fa-film' },
          ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-4 pb-4 border-b-2 transition-all ${activeTab === tab.id ? 'border-amber-500 text-amber-500' : 'border-transparent text-zinc-500'}`}>
                  <i className={`fa-solid ${tab.icon}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
              </button>
          ))}
      </div>

      <main className="flex-1 overflow-hidden flex flex-col relative">
        {activeTab === 'BRACKET' && (
            <div className="flex-1 flex flex-col">
                {/* Control Toolstrip */}
                <div className="p-4 bg-zinc-900/80 border-b border-white/5 flex items-center justify-between z-20">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Team Count:</span>
                        <input 
                            type="number" 
                            className="w-20 bg-black border border-white/10 rounded-lg px-3 py-1 text-amber-500 font-bold focus:outline-none focus:border-amber-500" 
                            value={teamInputCount} 
                            onChange={(e) => setTeamInputCount(parseInt(e.target.value) || 0)} 
                        />
                        <button onClick={handleRegenBracket} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20">Init Universal Bracket</button>
                    </div>
                    <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                        Hint: Use Mouse Scroll to Zoom • Drag to Pan the Tree
                    </div>
                </div>

                {/* ZOOMABLE VIEWPORT */}
                <div className="flex-1 bg-zinc-950 relative overflow-hidden">
                    <TransformWrapper 
                        initialScale={0.6} 
                        centerOnInit 
                        minScale={0.1} 
                        limitToBounds={false}
                    >
                        <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                            <div className="flex gap-24 p-48 min-w-[3000px] h-full items-center">
                                {Array.from({ length: totalRounds }).map((_, rIdx) => {
                                    const round = rIdx + 1;
                                    const roundMatches = Object.values(bracketState.matches).filter(m => m.round === round);
                                    return (
                                        <div key={round} className="flex flex-col justify-around gap-8 h-full">
                                            <div className="text-center font-black uppercase text-zinc-700 tracking-[0.5em] text-[10px] mb-8">Round {round}</div>
                                            {roundMatches.map(m => (
                                                <div key={m.id} className="w-64 bg-zinc-900 border border-white/5 rounded-xl overflow-hidden shadow-2xl relative">
                                                    {[1, 2].map(slot => (
                                                        <div key={slot} className={`flex items-center group ${slot === 1 ? 'border-b border-white/5' : ''}`}>
                                                            <button 
                                                                onClick={() => advanceWinner(m.id, slot as any)}
                                                                className={`w-10 h-10 flex items-center justify-center border-r border-white/5 hover:bg-white/10 transition-all ${m.winner === slot ? 'bg-amber-500 text-black' : 'text-zinc-600'}`}
                                                            >
                                                                <i className="fa-solid fa-check text-xs" />
                                                            </button>
                                                            <input 
                                                                className={`flex-1 bg-transparent p-3 text-xs font-bold focus:outline-none ${m[slot === 1 ? 'team1' : 'team2'] === 'BYE' ? 'text-zinc-700 italic' : 'text-white'}`}
                                                                value={m[slot === 1 ? 'team1' : 'team2']}
                                                                onChange={(e) => updateMatchTeamName(m.id, slot as any, e.target.value)}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    )
                                })}
                            </div>
                        </TransformComponent>
                    </TransformWrapper>
                </div>
            </div>
        )}

        {activeTab === 'GROUPS' && (
            <div className="p-8 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-widest text-amber-500 italic">Group Stage Manager</h2>
                        <p className="text-zinc-500 text-xs mt-1 uppercase tracking-widest">Divide teams into pools & calculate standings</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20">
                            Seed into Bracket
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-zinc-900 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                                <i className="fa-solid fa-gear text-zinc-500 cursor-pointer hover:text-white" />
                            </div>
                            <h3 className="text-amber-500 font-black text-sm uppercase tracking-widest mb-4">Group {String.fromCharCode(65 + i)}</h3>
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-white/5">
                                        <th className="pb-2">Team</th>
                                        <th className="pb-2 text-center">W</th>
                                        <th className="pb-2 text-center">L</th>
                                        <th className="pb-2 text-right">PTS</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {[1, 2, 3, 4].map(t => (
                                        <tr key={t} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="py-3 font-bold text-zinc-300">Team {i * 4 + t}</td>
                                            <td className="py-3 text-center text-emerald-500 font-black">2</td>
                                            <td className="py-3 text-center text-red-500 font-black">1</td>
                                            <td className="py-3 text-right font-black text-white">6</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </main>
    </div>
  );
}

export default function MasterConsolePage() {
    return (
        <Suspense fallback={<div className="bg-black min-h-screen" />}>
            <MasterConsoleContent />
        </Suspense>
    );
}
