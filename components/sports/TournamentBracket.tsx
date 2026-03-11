'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Match, Player, Tournament } from '@/lib/sports/types';

interface TournamentBracketProps {
    matches: Match[];
    players: Record<string, Player>;
    tournament: Tournament;
    searchQuery?: string;
}

export function TournamentBracket({ matches, players, tournament, searchQuery = '' }: TournamentBracketProps) {
    // 1. Group and Order Rounds (L-to-R)
    const roundMapping: Record<string, string> = {
        'R64': 'Round of 64',
        'R32': 'Round of 32',
        'R16': 'Round of 16',
        'QF': 'Quarter Finals',
        'SF': 'Semi Finals',
        'Final': 'Final'
    };

    const orderedRoundKeys = ['R64', 'R32', 'R16', 'QF', 'SF', 'Final'];
    
    // The provided `updateParams` function and related hooks (searchParams, startTransition, router, pathname)
    // are not defined within this component's scope. Assuming this was intended for a different component
    // or requires additional context/imports not provided in the snippet.
    // For the purpose of this edit, I will not include the `updateParams` function as it would cause errors.

    const bracketData = useMemo(() => {
        const grouped: Record<string, Match[]> = {};
        orderedRoundKeys.forEach(k => grouped[k] = []);

        matches.forEach(m => {
            let rKey = '';
            const rName = m.round_name.toUpperCase();
            if (rName.includes('R64')) rKey = 'R64';
            else if (rName.includes('R32')) rKey = 'R32';
            else if (rName.includes('R16') || rName === 'ROUND OF 16') rKey = 'R16';
            else if (rName.includes('QF') || rName === 'QUARTER FINALS') rKey = 'QF';
            else if (rName.includes('SF') || rName === 'SEMI FINALS') rKey = 'SF';
            else if (rName.includes('FINAL')) rKey = 'Final';

            if (rKey && grouped[rKey]) grouped[rKey].push(m);
        });

        // Filter out empty rounds from the tail, but keep them if they are in the middle (though logically they shouldn't be)
        const firstActive = orderedRoundKeys.findIndex(k => grouped[k].length > 0);
        const lastActive = [...orderedRoundKeys].reverse().findIndex(k => grouped[k].length > 0);
        const actualLastIndex = lastActive === -1 ? orderedRoundKeys.length - 1 : (orderedRoundKeys.length - 1 - lastActive);
        
        const activeRounds = orderedRoundKeys.slice(Math.max(0, firstActive), actualLastIndex + 1);
        
        return { grouped, activeRounds };
    }, [matches]);

    // 2. Interaction State (Pan & Zoom)
    const [zoom, setZoom] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

    // 3. Render Match Card
    const MatchCard = ({ match, isHighlighted }: { match: Match, isHighlighted: boolean }) => {
        const p1 = match.player1_id ? players[match.player1_id] : null;
        const p2 = match.player2_id ? players[match.player2_id] : null;

        const isP1Winner = match.status === 'completed' && match.winner_id === match.player1_id;
        const isP2Winner = match.status === 'completed' && match.winner_id === match.player2_id;

        return (
            <div className={`w-64 bg-zinc-900 border-2 rounded-xl overflow-hidden shadow-lg transition-all ${
                isHighlighted ? 'border-amber-500 ring-4 ring-amber-500/20 scale-105 z-20' : 'border-zinc-800'
            }`}>
                {/* Status Bar */}
                <div className={`h-1 w-full ${
                    match.status === 'ongoing' ? 'bg-green-500 animate-pulse' : 
                    match.status === 'completed' ? 'bg-zinc-700' : 'bg-zinc-800'
                }`} />
                
                <div className="p-3 space-y-2">
                    {/* Player 1 */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700 overflow-hidden">
                                {p1?.avatar_url || p1?.country_code ? (
                                    <img src={p1.avatar_url || p1.country_code} className="w-full h-full object-cover" />
                                ) : <span className="text-[10px] text-zinc-500">P1</span>}
                            </div>
                            <span className={`text-sm truncate ${isP1Winner ? 'text-white font-bold' : 'text-zinc-400'}`}>
                                {p1?.name || (match.round_name === 'R64' ? 'TBD' : 'Wait...')}
                            </span>
                        </div>
                        {match.status !== 'scheduled' && (
                            <span className={`text-sm font-black ${isP1Winner ? 'text-amber-500' : 'text-zinc-500'}`}>{match.sets_p1}</span>
                        )}
                    </div>

                    {/* Player 2 */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700 overflow-hidden">
                                {p2?.avatar_url || p2?.country_code ? (
                                    <img src={p2.avatar_url || p2.country_code} className="w-full h-full object-cover" />
                                ) : <span className="text-[10px] text-zinc-500">P2</span>}
                            </div>
                            <span className={`text-sm truncate ${isP2Winner ? 'text-white font-bold' : 'text-zinc-400'}`}>
                                {p2?.name || (match.round_name === 'R64' ? 'TBD' : 'Wait...')}
                            </span>
                        </div>
                        {match.status !== 'scheduled' && (
                            <span className={`text-sm font-black ${isP2Winner ? 'text-amber-500' : 'text-zinc-500'}`}>{match.sets_p2}</span>
                        )}
                    </div>
                </div>

                {/* Match Info Footer */}
                <div className="bg-black/50 px-3 py-1.5 flex justify-between items-center border-t border-zinc-800">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        {match.court_id ? `Court ${match.court_id}` : 'TBA'}
                    </span>
                    <span className={`text-[10px] font-bold uppercase ${
                        match.status === 'ongoing' ? 'text-green-500' : 'text-zinc-600'
                    }`}>
                        {match.status}
                    </span>
                </div>
            </div>
        );
    };

    // 4. Draw SVG Connections (Simplified for performance)
    const renderConnections = () => {
        const rounds = bracketData.activeRounds;
        return (
            <svg className="absolute inset-0 pointer-events-none z-0 overflow-visible" 
                 width="100%" height="100%">
                <defs>
                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3f3f46" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
                    </linearGradient>
                </defs>
                {/* 
                  Note: In a production app, we would use refs to get exact match card centers.
                  For this demo, we'll use a reliable CSS-connector pattern instead as it's more 
                  robust for panning/zooming than raw SVG coords without a heavy resize observer.
                */}
            </svg>
        );
    };

    return (
        <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center overflow-hidden relative group">
            {/* Toolbar */}
            <div className="absolute top-4 right-4 z-50 flex gap-2">
                <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center hover:bg-zinc-800 transition-colors">
                    <i className="fa-solid fa-minus" />
                </button>
                <div className="w-16 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center text-xs font-bold">
                    {Math.round(zoom * 100)}%
                </div>
                <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center hover:bg-zinc-800 transition-colors">
                    <i className="fa-solid fa-plus" />
                </button>
                <button onClick={() => setZoom(1)} className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center hover:bg-zinc-800 transition-colors">
                    <i className="fa-solid fa-expand" />
                </button>
            </div>

            {/* Instruction Overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-zinc-800 text-[10px] text-zinc-500 font-bold uppercase tracking-widest pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                DRAG TO PAN · MOUSE WHEEL TO SCROLL
            </div>

            {/* Draggable Viewport */}
            <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing">
                <motion.div
                    drag
                    dragConstraints={containerRef}
                    dragElastic={0}
                    style={{ scale: zoom }}
                    className="flex p-40 items-start gap-32 origin-center"
                >
                    {bracketData.activeRounds.map((rKey, roundIdx) => {
                        const roundMatches = bracketData.grouped[rKey];
                        const isLastRound = roundIdx === bracketData.activeRounds.length - 1;

                        return (
                            <div key={rKey} className="flex flex-col justify-around h-full gap-20">
                                <div className="text-center space-y-1 mb-8">
                                    <h3 className="text-zinc-600 font-black text-xs uppercase tracking-[0.3em]">{rKey}</h3>
                                    <h4 className="text-zinc-400 text-[10px] font-bold uppercase">{roundMapping[rKey]}</h4>
                                </div>
                                
                                <div className="flex flex-col gap-12 justify-center">
                                    {roundMatches.map(m => {
                                        const isMatchHighlighted = searchQuery !== '' && (
                                            (players[m.player1_id || '']?.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                            (players[m.player2_id || '']?.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                        );

                                        return (
                                            <div key={m.id} className="relative">
                                                <MatchCard match={m} isHighlighted={!!isMatchHighlighted} />
                                                
                                                {/* Connection Lines (Conceptual) */}
                                                {!isLastRound && (
                                                    <div className="absolute top-1/2 -right-32 w-32 h-px bg-zinc-800 z-0">
                                                        <div className="absolute top-1/2 right-0 w-2 h-2 rounded-full bg-zinc-800 -translate-y-1/2" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                    
                    {/* Winner Podium (If final is completed) */}
                    {bracketData.grouped['Final']?.[0]?.status === 'completed' && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center gap-6 pl-20"
                        >
                            <div className="w-32 h-32 rounded-full bg-amber-500/10 border-4 border-amber-500 flex items-center justify-center text-4xl shadow-[0_0_50px_rgba(245,158,11,0.3)]">
                                🏆
                            </div>
                            <div className="text-center">
                                <h2 className="text-amber-500 font-black text-2xl tracking-tighter uppercase">Champion</h2>
                                <p className="text-white text-xl font-bold">
                                    {players[bracketData.grouped['Final'][0].winner_id!]?.name}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
