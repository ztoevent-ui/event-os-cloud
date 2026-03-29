'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
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

export type BracketNode = {
  id: string;
  team1: string;
  team2: string;
  winner: 1 | 2 | null;
  nextMatchId?: string;
  nextTeamSlot?: 1 | 2;
};

export type BracketState = {
  id: string;
  matches: Record<string, BracketNode>;
};

const initialBracket: BracketState = {
  id: 'arena-draw',
  matches: {
    'qf1': { id: 'qf1', team1: 'Team Alpha', team2: 'Team Bravo', winner: null, nextMatchId: 'sf1', nextTeamSlot: 1 },
    'qf2': { id: 'qf2', team1: 'Team Charlie', team2: 'Team Delta', winner: null, nextMatchId: 'sf1', nextTeamSlot: 2 },
    'qf3': { id: 'qf3', team1: 'Team Echo', team2: 'Team Foxtrot', winner: null, nextMatchId: 'sf2', nextTeamSlot: 1 },
    'qf4': { id: 'qf4', team1: 'Team Golf', team2: 'Team Hotel', winner: null, nextMatchId: 'sf2', nextTeamSlot: 2 },
    'sf1': { id: 'sf1', team1: 'TBD', team2: 'TBD', winner: null, nextMatchId: 'f1', nextTeamSlot: 1 },
    'sf2': { id: 'sf2', team1: 'TBD', team2: 'TBD', winner: null, nextMatchId: 'f1', nextTeamSlot: 2 },
    'f1':  { id: 'f1', team1: 'TBD', team2: 'TBD', winner: null }
  }
};

const defaultAds = [
  { id: 'ad-1', title: 'Platinum Sponsor', url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1000', category: 'Main' },
  { id: 'ad-2', title: 'Main Event Partner', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1000', category: 'Main' },
];

function MasterConsoleContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId') || 'BINTULU_OPEN_2026';
  const sportType = searchParams.get('sport') || 'PICKLEBALL';
  
  const [activeTab, setActiveTab] = useState<'SCORE' | 'ADS' | 'BRACKET' | 'MUSIC'>('BRACKET'); // Defaulting to BRACKET for dev focus
  const [screenMode, setScreenMode] = useState<ScreenMode>('SCORE');

  const [matchState, setMatchState] = useState<MatchState>({
    eventId, sportType, teamA: { name: 'Player A', score: 0 }, teamB: { name: 'Player B', score: 0 }, currentSet: 1, isPaused: false, announcement: '',
  });

  const [bracketState, setBracketState] = useState<BracketState>(initialBracket);
  const [activeAdId, setActiveAdId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [locked, setLocked] = useState(false);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const channel = supabase.channel(`zto-arena-${eventId}`, { config: { broadcast: { ack: true } } });

    channel
      .on('broadcast', { event: 'match-update' }, (payload) => setMatchState(payload.payload))
      .on('broadcast', { event: 'screen-mode' }, (payload) => setScreenMode(payload.payload.mode))
      .on('broadcast', { event: 'bracket-update' }, (payload) => setBracketState(payload.payload))
      .on('broadcast', { event: 'ad-update' }, (payload) => setActiveAdId(payload.payload.activeAd?.id || null))
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  const broadcastScreenMode = async (mode: ScreenMode) => {
    setScreenMode(mode);
    if (channelRef.current && isConnected) {
      await channelRef.current.send({ type: 'broadcast', event: 'screen-mode', payload: { mode } });
    }
  };

  const broadcastMatchUpdate = async (newState: MatchState) => {
    setMatchState(newState);
    if (channelRef.current && isConnected) {
      await channelRef.current.send({ type: 'broadcast', event: 'match-update', payload: newState });
    }
  };

  const broadcastBracketUpdate = async (newState: BracketState) => {
    setBracketState(newState);
    if (channelRef.current && isConnected) {
      await channelRef.current.send({ type: 'broadcast', event: 'bracket-update', payload: newState });
    }
  };

  const broadcastAd = async (ad: any | null) => {
    setActiveAdId(ad?.id || null);
    if (channelRef.current && isConnected) {
      await channelRef.current.send({ type: 'broadcast', event: 'ad-update', payload: { activeAd: ad } });
      if (ad && screenMode !== 'ADS') broadcastScreenMode('ADS');
    }
  };

  // Bracket Logic Engine
  const advanceBracketWinner = (matchId: string, winnerSlot: 1 | 2 | null) => {
    const newState = { ...bracketState, matches: { ...bracketState.matches } };
    const match = newState.matches[matchId];
    
    // Update local winner
    newState.matches[matchId] = { ...match, winner: winnerSlot };

    // Push to next match if applicable
    if (match.nextMatchId && match.nextTeamSlot) {
      const nextMatch = newState.matches[match.nextMatchId];
      const advancingTeamName = winnerSlot === 1 ? match.team1 : winnerSlot === 2 ? match.team2 : 'TBD';
      
      newState.matches[match.nextMatchId] = {
        ...nextMatch,
        team1: match.nextTeamSlot === 1 ? advancingTeamName : nextMatch.team1,
        team2: match.nextTeamSlot === 2 ? advancingTeamName : nextMatch.team2,
        // Reset the winner of the next match if we changed the participants
        winner: null, 
      };

      // If we cascaded a reset, we ideally clear the chain down. For simplicity, just reset the immediate next.
      // E.g. If Semifinal gets a new team, clear Semifinal winner, which means Final doesn't have them yet.
    }
    broadcastBracketUpdate(newState);
  };

  const updateBracketTeamName = (matchId: string, slot: 1 | 2, newName: string) => {
    const newState = { ...bracketState, matches: { ...bracketState.matches } };
    const match = newState.matches[matchId];
    newState.matches[matchId] = {
      ...match,
      [slot === 1 ? 'team1' : 'team2']: newName,
    };
    broadcastBracketUpdate(newState);
  };


  const updateScore = (team: 'A' | 'B', change: number) => {
    if (locked) return;
    const newState = { ...matchState };
    if (team === 'A') newState.teamA.score = Math.max(0, newState.teamA.score + change);
    else newState.teamB.score = Math.max(0, newState.teamB.score + change);
    broadcastMatchUpdate(newState);
  };

  const triggerAnnouncement = (type: string) => {
    if (locked) return;
    const newState = { ...matchState, announcement: type };
    broadcastMatchUpdate(newState);
    if (screenMode !== 'SCORE') broadcastScreenMode('SCORE');
    setTimeout(() => {
      setMatchState(prev => {
        const resetState = { ...prev, announcement: '' };
        if (channelRef.current && isConnected) {
          channelRef.current.send({ type: 'broadcast', event: 'match-update', payload: resetState });
        }
        return resetState;
      });
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden flex flex-col select-none relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.05),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.05),transparent_40%)] pointer-events-none"></div>

      <header className="z-20 bg-zinc-950 border-b border-white/10 px-6 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-6">
          <Link href="/apps/zto-arena" className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-600 hover:text-white transition-colors tracking-widest group">
            <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform"></i> Hub
          </Link>
          <div className="w-px h-6 bg-white/10"></div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-500 text-black rounded-xl flex items-center justify-center text-xl shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <i className="fa-solid fa-gamepad"></i>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-widest uppercase italic hidden md:block leading-none">Omnibus Console</h1>
              <p className="text-[9px] font-black tracking-[0.2em] text-zinc-500 uppercase mt-1">Node: {eventId}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
            <div className="flex items-center gap-4 bg-zinc-900 border border-white/5 rounded-full p-1.5 shadow-inner">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-3">Screen Out:</span>
                <button onClick={() => broadcastScreenMode('SCORE')} className={`px-4 py-2 rounded-full text-[10px] font-black tracking-[0.2em] uppercase transition-all ${screenMode === 'SCORE' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'text-zinc-500 hover:text-white'}`}>Score</button>
                <button onClick={() => broadcastScreenMode('ADS')} className={`px-4 py-2 rounded-full text-[10px] font-black tracking-[0.2em] uppercase transition-all ${screenMode === 'ADS' ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-zinc-500 hover:text-white'}`}>Ads</button>
                <button onClick={() => broadcastScreenMode('BRACKET')} className={`px-4 py-2 rounded-full text-[10px] font-black tracking-[0.2em] uppercase transition-all ${screenMode === 'BRACKET' ? 'bg-blue-500 text-black shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'text-zinc-500 hover:text-white'}`}>Bracket</button>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
          <button 
            onClick={() => setLocked(!locked)}
            className={`h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all border ${locked ? 'bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'}`}
          >
            <i className={`fa-solid ${locked ? 'fa-lock' : 'fa-lock-open'}`}></i>
            {locked ? 'Pad Locked' : 'Guard iPad'}
          </button>
        </div>
      </header>

      {/* Internal Tabs for Control Context */}
      <div className="bg-zinc-900/40 border-b border-white/5 px-8 pt-4 flex gap-6 z-10 transition-colors">
          {[
              { id: 'SCORE', label: 'Live Scoring', icon: 'fa-stopwatch' },
              { id: 'ADS', label: 'Media & Ads', icon: 'fa-rectangle-ad' },
              { id: 'BRACKET', label: 'Match Bracket', icon: 'fa-sitemap' },
              { id: 'MUSIC', label: 'Audio FX', icon: 'fa-music' },
          ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 pb-4 border-b-2 transition-all ${activeTab === tab.id ? 'border-amber-500 text-amber-500' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              >
                  <i className={`fa-solid ${tab.icon}`}></i>
                  <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
              </button>
          ))}
      </div>

      <main className="flex-1 p-6 z-10 overflow-y-auto">
        {/* --- SCORE TAB (Collapsed for brevity here, assumed intact from previous steps) --- */}
        {activeTab === 'SCORE' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="col-span-1 lg:col-span-2 bg-zinc-900/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white/5 flex flex-wrap items-center justify-between gap-6">
                    <div className="flex gap-4">
                        <button onClick={() => broadcastMatchUpdate({ ...matchState, isPaused: !matchState.isPaused })} className="h-12 px-8 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-colors bg-white/5 border border-white/10 text-zinc-400 hover:text-white">
                        <i className={`fa-solid ${matchState.isPaused ? 'fa-play' : 'fa-pause'}`}></i> {matchState.isPaused ? 'Resume Match' : 'Pause'}
                        </button>
                    </div>
                </div>
                <div className="relative flex flex-col rounded-[2rem] p-8 border-t border-white/10 overflow-hidden min-h-[400px] bg-gradient-to-br from-blue-900/40 to-black">
                    <input className="bg-transparent border-none text-4xl font-black uppercase text-blue-400 focus:outline-none w-full placeholder-blue-900" value={matchState.teamA.name} onChange={(e) => broadcastMatchUpdate({ ...matchState, teamA: { ...matchState.teamA, name: e.target.value } })} />
                    <div className="text-[150px] font-black tabular-nums text-white text-center w-full mt-4">{matchState.teamA.score}</div>
                    <div className="flex gap-4 mt-auto w-full z-10">
                        <button onClick={() => updateScore('A', -1)} className="flex-1 py-6 rounded-2xl bg-white/5 text-4xl font-black transition">-</button>
                        <button onClick={() => updateScore('A', 1)} className="flex-[2] py-6 rounded-2xl bg-blue-600 text-4xl font-bold transition">+</button>
                    </div>
                </div>
                <div className="relative flex flex-col rounded-[2rem] p-8 border-t border-white/10 overflow-hidden min-h-[400px] bg-gradient-to-br from-red-900/40 to-black">
                    <input className="bg-transparent border-none text-4xl font-black uppercase text-red-500 focus:outline-none w-full text-right placeholder-red-900" value={matchState.teamB.name} onChange={(e) => broadcastMatchUpdate({ ...matchState, teamB: { ...matchState.teamB, name: e.target.value } })} />
                    <div className="text-[150px] font-black tabular-nums text-white text-center w-full mt-4">{matchState.teamB.score}</div>
                    <div className="flex gap-4 mt-auto w-full z-10">
                        <button onClick={() => updateScore('B', 1)} className="flex-[2] py-6 rounded-2xl bg-red-600 text-4xl font-bold transition">+</button>
                        <button onClick={() => updateScore('B', -1)} className="flex-1 py-6 rounded-2xl bg-white/5 text-4xl font-black transition">-</button>
                    </div>
                </div>
                <div className="col-span-1 lg:col-span-2 bg-zinc-900/60 rounded-[2rem] p-6 border border-white/5 flex gap-3">
                    {['MATCH POINT', 'TIMEOUT', 'WINNER'].map(type => (
                        <button key={type} onClick={() => triggerAnnouncement(type)} className="px-6 py-4 rounded-xl font-black text-[11px] bg-white/5 text-zinc-400 hover:text-white border border-white/5 tracking-widest">{type}</button>
                    ))}
                </div>
            </div>
        )}

        {/* --- BRACKET TAB: The Draw Editor --- */}
        {activeTab === 'BRACKET' && (
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between bg-blue-950/20 border border-blue-500/20 rounded-2xl p-6">
                    <div>
                        <h2 className="text-xl font-black text-blue-500 uppercase tracking-widest italic">Bracket Editor</h2>
                        <p className="text-zinc-500 text-sm mt-1">Assign winners below to advance them automatically. Sends live payload to Screen.</p>
                    </div>
                    <button onClick={() => broadcastScreenMode('BRACKET')} className="h-10 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all">
                        Force Screen To Bracket
                    </button>
                </div>

                <div className="flex justify-between gap-8 py-8 px-4 overflow-x-auto min-w-[800px]">
                    {/* Column 1: Quarterfinals */}
                    <div className="flex flex-col justify-around gap-6 flex-1">
                        <div className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-4 text-center">Quarterfinals</div>
                        {['qf1', 'qf2', 'qf3', 'qf4'].map(matchId => {
                            const match = bracketState.matches[matchId];
                            return (
                                <div key={matchId} className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden flex flex-col">
                                    <div className="flex items-center border-b border-white/5">
                                        <button onClick={() => advanceBracketWinner(matchId, 1)} className={`w-8 h-8 flex items-center justify-center border-r border-white/5 hover:bg-white/10 transition-colors ${match.winner === 1 ? 'bg-blue-600 text-white' : 'text-zinc-600'}`}>
                                            <i className="fa-solid fa-check text-xs"></i>
                                        </button>
                                        <input className="flex-1 bg-transparent border-none text-sm font-bold p-3 focus:outline-none focus:bg-white/5 text-white" value={match.team1} onChange={e => updateBracketTeamName(matchId, 1, e.target.value)} />
                                    </div>
                                    <div className="flex items-center">
                                        <button onClick={() => advanceBracketWinner(matchId, 2)} className={`w-8 h-8 flex items-center justify-center border-r border-white/5 hover:bg-white/10 transition-colors ${match.winner === 2 ? 'bg-blue-600 text-white' : 'text-zinc-600'}`}>
                                            <i className="fa-solid fa-check text-xs"></i>
                                        </button>
                                        <input className="flex-1 bg-transparent border-none text-sm font-bold p-3 focus:outline-none focus:bg-white/5 text-white" value={match.team2} onChange={e => updateBracketTeamName(matchId, 2, e.target.value)} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Column 2: Semifinals */}
                    <div className="flex flex-col justify-around gap-6 flex-1 py-12">
                         <div className="text-[10px] font-black uppercase text-blue-500 tracking-[0.3em] mb-4 text-center">Semifinals</div>
                         {['sf1', 'sf2'].map(matchId => {
                            const match = bracketState.matches[matchId];
                            return (
                                <div key={matchId} className="bg-zinc-900 border border-blue-500/30 rounded-xl overflow-hidden flex flex-col shadow-[0_0_15px_rgba(37,99,235,0.1)] relative">
                                    <div className="flex items-center border-b border-white/5">
                                        <button onClick={() => advanceBracketWinner(matchId, 1)} className={`w-10 h-10 flex items-center justify-center border-r border-white/5 hover:bg-white/10 transition-colors ${match.winner === 1 ? 'bg-blue-500 text-black shadow-[inset_0_0_10px_rgba(255,255,255,0.5)]' : 'text-zinc-600'}`}>
                                            <i className="fa-solid fa-check text-sm"></i>
                                        </button>
                                        <input className="flex-1 bg-transparent border-none text-base font-black p-4 focus:outline-none focus:bg-white/5 text-blue-100" value={match.team1} onChange={e => updateBracketTeamName(matchId, 1, e.target.value)} />
                                    </div>
                                    <div className="flex items-center">
                                        <button onClick={() => advanceBracketWinner(matchId, 2)} className={`w-10 h-10 flex items-center justify-center border-r border-white/5 hover:bg-white/10 transition-colors ${match.winner === 2 ? 'bg-blue-500 text-black shadow-[inset_0_0_10px_rgba(255,255,255,0.5)]' : 'text-zinc-600'}`}>
                                            <i className="fa-solid fa-check text-sm"></i>
                                        </button>
                                        <input className="flex-1 bg-transparent border-none text-base font-black p-4 focus:outline-none focus:bg-white/5 text-blue-100" value={match.team2} onChange={e => updateBracketTeamName(matchId, 2, e.target.value)} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Column 3: Finals */}
                    <div className="flex flex-col justify-center flex-1 py-12">
                         <div className="text-[12px] font-black uppercase text-amber-500 tracking-[0.4em] mb-6 text-center italic drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">Championship</div>
                         {['f1'].map(matchId => {
                            const match = bracketState.matches[matchId];
                            return (
                                <div key={matchId} className="bg-zinc-900 border-2 border-amber-500/60 rounded-xl overflow-hidden flex flex-col shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                                    <div className="flex items-center border-b border-white/10 text-xl font-black text-amber-50 p-6">
                                        <button onClick={() => advanceBracketWinner(matchId, 1)} className={`w-12 h-12 flex items-center justify-center rounded-lg mr-4 border border-white/10 hover:bg-white/10 transition-all ${match.winner === 1 ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.6)]' : 'text-zinc-600'}`}>
                                            <i className="fa-solid fa-trophy text-lg"></i>
                                        </button>
                                        <div className="flex-1 truncate drop-shadow-md">{match.team1}</div>
                                    </div>
                                    <div className="flex items-center text-xl font-black text-amber-50 p-6">
                                        <button onClick={() => advanceBracketWinner(matchId, 2)} className={`w-12 h-12 flex items-center justify-center rounded-lg mr-4 border border-white/10 hover:bg-white/10 transition-all ${match.winner === 2 ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.6)]' : 'text-zinc-600'}`}>
                                            <i className="fa-solid fa-trophy text-lg"></i>
                                        </button>
                                        <div className="flex-1 truncate drop-shadow-md">{match.team2}</div>
                                    </div>
                                </div>
                            )
                        })}
                        
                        {/* Winner Reveal */}
                        <AnimatePresence>
                           {(bracketState.matches['f1'].winner !== null) && (
                               <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-8 text-center bg-amber-500/20 border border-amber-500/50 p-6 rounded-2xl backdrop-blur-xl">
                                   <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Grand Champion</div>
                                   <div className="text-3xl font-black text-white italic drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]">
                                       {bracketState.matches['f1'].winner === 1 ? bracketState.matches['f1'].team1 : bracketState.matches['f1'].team2}
                                   </div>
                               </motion.div>
                           )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        )}

        {/* --- ADS TAB --- */}
        {activeTab === 'ADS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-6 mb-2 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-emerald-500 uppercase tracking-widest italic">Ads Media Engine</h2>
                    </div>
                </div>
                {defaultAds.map((ad) => (
                    <motion.div 
                    key={ad.id}
                    whileHover={{ y: -5 }}
                    className={`group relative aspect-video rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${activeAdId === ad.id ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'border-white/5 hover:border-white/20'}`}
                    onClick={() => broadcastAd(ad)}
                    >
                    <img src={ad.url} alt={ad.title} className="w-full h-full object-cover opacity-60" />
                    </motion.div>
                ))}
            </div>
        )}

        {/* --- MUSIC TAB --- */}
        {activeTab === 'MUSIC' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
               {['Walkout Anthem (Team A)', 'Walkout Anthem (Team B)', 'Tension Drone', 'Victory Fanfare', 'Match Point Heartbeat'].map((track, i) => (
                   <div key={track} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
                       <div className="text-[10px] uppercase text-violet-500">Track 0{i+1}</div>
                       <h3 className="font-bold text-white leading-tight">{track}</h3>
                   </div>
               ))}
            </div>
        )}
      </main>
    </div>
  );
}

export default function MasterConsolePage() {
    return (
        <Suspense fallback={<div className="bg-black min-h-screen"></div>}>
            <MasterConsoleContent />
        </Suspense>
    );
}

