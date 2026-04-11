'use client';

import React, { useEffect, useState, useRef, Suspense, useMemo } from 'react';
import { useParams } from 'next/navigation';
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
  const params = useParams();
  const eventId = (params.eventId as string) || 'BINTULU_OPEN_2026';
  
  const [activeTab, setActiveTab] = useState<'SCORE' | 'ADS' | 'BRACKET' | 'GROUPS' | 'MUSIC' | 'SCHEDULING' | 'JUDGING'>('BRACKET');
  const [screenMode, setScreenMode] = useState<ScreenMode>('SCORE');
  const [teamInputCount, setTeamInputCount] = useState(8);

  const [matchState, setMatchState] = useState<MatchState>({
    eventId, sportType: 'PICKLEBALL', teamA: { name: 'Player A', score: 0 }, teamB: { name: 'Player B', score: 0 }, currentSet: 1, isPaused: false, announcement: '',
  });

  // Scheduling & Judging State
  const [dispatchQueue, setDispatchQueue] = useState<{ id: string, name: string, status: string, scoreA: number, scoreB: number, teamA?: string, teamB?: string }[]>([]);
  const [judgingApprovals, setJudgingApprovals] = useState<{ id: string, name: string, status: string }[]>([]);

  const [bracketState, setBracketState] = useState<BracketData>(() => generateFlexibleBracket(8));
  const [bracketVersion, setBracketVersion] = useState(0); // For forcing component reset
  const [activeAdId, setActiveAdId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [locked, setLocked] = useState(false);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    async function loadRealData() {
        if (!eventId) return;
        const { data: t } = await supabase.from('arena_tournaments').select('id, bracket_json').eq('event_id_slug', eventId).single();
        if (t) {
            if (t.bracket_json && t.bracket_json.events) {
                const firstEvt = Object.keys(t.bracket_json.events)[0];
                if (firstEvt) setBracketState(t.bracket_json.events[firstEvt]);
            }
            const { data: matches } = await supabase.from('arena_matches').select('*').eq('tournament_id', t.id).order('court_number');
            if (matches) {
                const live = matches.filter((m: any) => m.status === 'LIVE' || m.status === 'PENDING').map((m: any) => ({
                    id: m.id,
                    name: `Court ${m.court_number || '?'} - ${m.round_type}`,
                    status: m.status,
                    scoreA: m.score_a,
                    scoreB: m.score_b,
                    teamA: m.team_a_name,
                    teamB: m.team_b_name,
                }));
                setDispatchQueue(live);
            }
        }
    }
    loadRealData();
  }, [eventId]);

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
      const count = Number(teamInputCount);
      if (isNaN(count) || count < 2) return;
      
      const newBracket = generateFlexibleBracket(count);
      broadcastBracketUpdate(newBracket);
      setBracketVersion(prev => prev + 1); // Force-reset viewport
      
      // Visual Feedback
      import('sweetalert2').then((Swal) => {
          Swal.default.fire({
              title: 'Bracket Initialized!',
              text: `Generated ${count}-team tournament tree. Viewport reset.`,
              icon: 'success',
              toast: true,
              position: 'top-end',
              timer: 3000,
              showConfirmButton: false,
              background: '#18181b',
              color: '#fff'
          });
      });
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

  // Scheduling & Judging Logic
  const handleScoreUpdate = (id: string, team: 'A' | 'B', inc: number) => {
      setDispatchQueue(prev => prev.map(m => {
          if (m.id !== id) return m;
          const scoreA = team === 'A' ? m.scoreA + inc : m.scoreA;
          const scoreB = team === 'B' ? m.scoreB + inc : m.scoreB;
          
          // Best of 5 Early Stop Logic (3 wins)
          let newStatus = m.status;
          if (scoreA >= 3 || scoreB >= 3) {
              newStatus = `early_stop_winner_${scoreA >= 3 ? 'A' : 'B'}`;
          }
          
          return { ...m, scoreA, scoreB, status: newStatus };
      }));
  };

  const drawRandomLots = () => {
      const approved = judgingApprovals.filter(j => j.status === 'approved');
      if (approved.length < 2) return alert('Need at least 2 approved teams/players to draw lots.');
      setTeamInputCount(approved.length);
      const newBracket = generateFlexibleBracket(approved.length);
      
      // Assign randomly
      const shuffled = [...approved].sort(() => 0.5 - Math.random());
      let pIdx = 0;
      Object.values(newBracket.matches).forEach(m => {
          if (m.round === 1) {
              if (m.team1 !== 'BYE' && pIdx < shuffled.length) m.team1 = shuffled[pIdx++].name;
              if (m.team2 !== 'BYE' && pIdx < shuffled.length) m.team2 = shuffled[pIdx++].name;
          }
      });
      broadcastBracketUpdate(newBracket);
      setActiveTab('BRACKET');
  };

  const totalRounds = Math.ceil(Math.log2(bracketState.teamCount));

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden flex flex-col select-none relative">
      <header className="z-20 bg-zinc-950 border-b border-white/10 px-6 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-6">
          <Link href={`/arena/${eventId}`} className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-600 hover:text-white transition-colors tracking-widest">
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
              { id: 'SCHEDULING', label: '调度 (Dispatch)', icon: 'fa-calendar-check' },
              { id: 'JUDGING', label: '评审室 (Judging)', icon: 'fa-gavel' },
              { id: 'ADS', label: 'Media', icon: 'fa-film' },
          ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-4 pb-4 border-b-2 transition-all ${activeTab === tab.id ? 'border-amber-500 text-amber-500' : 'border-transparent text-zinc-500'}`}>
                  <i className={`fa-solid ${tab.icon}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
              </button>
          ))}
      </div>

      <main className="flex-1 overflow-hidden flex flex-col relative">
        {activeTab === 'SCORE' && (
            <div className="p-8 flex flex-col gap-6 flex-1 overflow-y-auto w-full max-w-5xl mx-auto">
                <h2 className="text-2xl font-black uppercase tracking-widest text-emerald-500 italic mb-4">Scoreboard Display Controller</h2>
                
                <div className="flex gap-12">
                   <div className="flex-1 bg-zinc-900 border border-white/10 p-6 rounded-2xl">
                       <h3 className="text-zinc-500 font-bold uppercase text-[10px] mb-4 tracking-widest">TEAM A</h3>
                       <input className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-amber-500" value={matchState.teamA.name} onChange={(e) => setMatchState({...matchState, teamA: {...matchState.teamA, name: e.target.value}})} placeholder="Team A Name" />
                       <div className="flex items-center gap-4 mt-6 justify-center">
                           <button onClick={() => setMatchState({...matchState, teamA: {...matchState.teamA, score: Math.max(0, matchState.teamA.score - 1)}})} className="w-12 h-12 bg-zinc-800 rounded-xl font-black hover:bg-zinc-700 transition-colors">-</button>
                           <div className="text-5xl font-black tabular-nums w-20 text-center">{matchState.teamA.score}</div>
                           <button onClick={() => setMatchState({...matchState, teamA: {...matchState.teamA, score: matchState.teamA.score + 1}})} className="w-12 h-12 bg-zinc-800 rounded-xl font-black hover:bg-zinc-700 transition-colors">+</button>
                       </div>
                   </div>
                   
                   <div className="flex-1 bg-zinc-900 border border-white/10 p-6 rounded-2xl">
                       <h3 className="text-zinc-500 font-bold uppercase text-[10px] mb-4 tracking-widest">TEAM B</h3>
                       <input className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-amber-500" value={matchState.teamB.name} onChange={(e) => setMatchState({...matchState, teamB: {...matchState.teamB, name: e.target.value}})} placeholder="Team B Name" />
                       <div className="flex items-center gap-4 mt-6 justify-center">
                           <button onClick={() => setMatchState({...matchState, teamB: {...matchState.teamB, score: Math.max(0, matchState.teamB.score - 1)}})} className="w-12 h-12 bg-zinc-800 rounded-xl font-black hover:bg-zinc-700 transition-colors">-</button>
                           <div className="text-5xl font-black tabular-nums w-20 text-center">{matchState.teamB.score}</div>
                           <button onClick={() => setMatchState({...matchState, teamB: {...matchState.teamB, score: matchState.teamB.score + 1}})} className="w-12 h-12 bg-zinc-800 rounded-xl font-black hover:bg-zinc-700 transition-colors">+</button>
                       </div>
                   </div>
                </div>

                <div className="flex justify-between items-center bg-zinc-900 border border-white/10 p-6 rounded-2xl mt-4 shadow-xl">
                    <div className="flex items-center gap-4">
                       <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">SET NUMBER:</span>
                       <input type="number" min="1" className="w-20 bg-black border border-white/10 rounded-lg p-2 text-white font-black text-center focus:outline-none focus:border-amber-500" value={matchState.currentSet} onChange={(e) => setMatchState({...matchState, currentSet: parseInt(e.target.value) || 1})} />
                    </div>
                    
                    <button onClick={() => {
                         channelRef.current?.send({ type: 'broadcast', event: 'match-update', payload: matchState });
                         import('sweetalert2').then((Swal) => {
                             Swal.default.fire({ title: 'Synced!', icon: 'success', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false, background: '#18181b', color: '#fff' });
                         });
                    }} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(5,150,105,0.4)] transition-all">
                        <i className="fa-solid fa-satellite-dish mr-2"></i> PUSH TO PUBLIC SCREEN
                    </button>
                </div>
            </div>
        )}

        {activeTab === 'ADS' && (
            <div className="p-8 flex flex-col gap-6 flex-1 overflow-y-auto w-full max-w-5xl mx-auto">
                <h2 className="text-2xl font-black uppercase tracking-widest text-fuchsia-500 italic mb-4">Media & BGM Controller</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl shadow-xl">
                        <h3 className="text-white font-black uppercase tracking-widest mb-2 flex items-center gap-2"><i className="fa-solid fa-tv text-fuchsia-500"></i> Video & Ads Display</h3>
                        <p className="text-zinc-500 text-xs mb-6">Pushes a media element to the Public Screen when Active Mode = ADS.</p>

                        <div className="space-y-4">
                            {[
                                {id: 'sponsor1', title: 'Main Sponsor Video Ad', url: 'https://images.unsplash.com/photo-1622279457486-62dcc4aab31b?q=80&w=3000&auto=format&fit=crop'},
                                {id: 'zto_promo', title: 'ZTO Event OS Reel', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=3000&auto=format&fit=crop'},
                                {id: 'stats_ad', title: 'Live Analytics Sponsor', url: 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=3000&auto=format&fit=crop'},
                            ].map(ad => (
                                <div key={ad.id} className="flex items-center justify-between bg-black p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                    <span className="font-bold text-sm tracking-wide">{ad.title}</span>
                                    <button onClick={() => {
                                        setActiveAdId(ad.id);
                                        channelRef.current?.send({ type: 'broadcast', event: 'ad-update', payload: { activeAd: ad } });
                                    }} className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeAdId === ad.id ? 'bg-fuchsia-500 text-white shadow-[0_0_15px_rgba(217,70,239,0.5)]' : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'}`}>
                                        Push Ad
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl shadow-xl">
                        <h3 className="text-white font-black uppercase tracking-widest mb-2 flex items-center gap-2"><i className="fa-solid fa-music text-blue-500"></i> Arena BGM (Background Music)</h3>
                        <p className="text-zinc-500 text-xs mb-6">Triggers stadium audio tracks synced to the public screens & court speakers.</p>

                        <div className="space-y-4">
                            {[
                                {id: 'walkin', title: 'Walk-int Anthem (Epic)'},
                                {id: 'suspense', title: 'Match Point Suspense'},
                                {id: 'winner', title: 'Winner Celebration BGM'},
                            ].map(track => (
                                <div key={track.id} className="flex items-center justify-between bg-black p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                    <span className="font-bold text-sm tracking-wide">{track.title}</span>
                                    <button onClick={() => {
                                         import('sweetalert2').then((Swal) => {
                                             Swal.default.fire({ title: 'BGM Triggered: ' + track.title, icon: 'info', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false, background: '#18181b', color: '#fff' });
                                         });
                                    }} className="px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest bg-zinc-800 text-zinc-400 hover:text-white hover:bg-blue-600 transition-colors">
                                        <i className="fa-solid fa-play mr-2"></i> Play
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

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
                        key={bracketVersion}
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

        {activeTab === 'SCHEDULING' && (
            <div className="p-8 flex-1 overflow-y-auto bg-zinc-950">
                <h2 className="text-2xl font-black uppercase tracking-widest text-blue-500 italic mb-6">Semi-auto Dispatch (建议分派)</h2>
                
                <div className="space-y-4">
                    {dispatchQueue.map(m => (
                        <div key={m.id} className="bg-zinc-900 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold">{m.name}</h3>
                                <p className="text-xs text-zinc-500 mt-1 uppercase">Status: 
                                    <span className={`ml-2 font-black ${m.status.includes('early_stop') ? 'text-red-500' : 'text-amber-500'}`}>
                                        {m.status.replace(/_/g, ' ').toUpperCase()}
                                    </span>
                                </p>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <span className="block text-[10px] font-black text-zinc-500 mb-1">{m.teamA || 'TEAM A'}</span>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => handleScoreUpdate(m.id, 'A', -1)} className="w-8 h-8 rounded bg-zinc-800 text-white">-</button>
                                        <span className="text-2xl font-black w-8">{m.scoreA}</span>
                                        <button onClick={() => handleScoreUpdate(m.id, 'A', 1)} className="w-8 h-8 rounded bg-zinc-800 text-white">+</button>
                                    </div>
                                </div>
                                <div className="text-center font-black text-xl px-4 text-zinc-600">VS</div>
                                <div className="text-center">
                                    <span className="block text-[10px] font-black text-zinc-500 mb-1">{m.teamB || 'TEAM B'}</span>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => handleScoreUpdate(m.id, 'B', -1)} className="w-8 h-8 rounded bg-zinc-800 text-white">-</button>
                                        <span className="text-2xl font-black w-8">{m.scoreB}</span>
                                        <button onClick={() => handleScoreUpdate(m.id, 'B', 1)} className="w-8 h-8 rounded bg-zinc-800 text-white">+</button>
                                    </div>
                                </div>
                                <div className="pl-6 border-l border-white/10">
                                    <button 
                                        onClick={() => setDispatchQueue(prev => prev.map(x => x.id === m.id ? { ...x, status: 'dispatched_to_court' } : x))}
                                        disabled={m.status.includes('early_stop')}
                                        className="bg-blue-600 disabled:opacity-50 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase"
                                    >
                                        {m.status === 'suggested' ? 'Confirm Dispatch' : 'Active'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'JUDGING' && (
            <div className="p-8 flex-1 overflow-y-auto bg-zinc-950">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-widest text-purple-500 italic">Judging Room (评审室)</h2>
                        <p className="text-zinc-500 text-xs mt-1 uppercase tracking-widest">Auto Approval & One-Click Lot Drawing</p>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setJudgingApprovals(prev => prev.map(p => ({...p, status: 'approved'})))} 
                            className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase"
                        >
                            Approve All
                        </button>
                        <button 
                            onClick={drawRandomLots} 
                            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-purple-500/20"
                        >
                            <i className="fa-solid fa-dice mr-2"></i> Random Draw Bracket
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {judgingApprovals.map(p => (
                        <div key={p.id} className="bg-zinc-900 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                            <span className="font-bold">{p.name}</span>
                            <button 
                                onClick={() => setJudgingApprovals(prev => prev.map(x => x.id === p.id ? { ...x, status: x.status === 'approved' ? 'pending' : 'approved' } : x))}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase ${p.status === 'approved' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}
                            >
                                {p.status}
                            </button>
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
