import React, { useEffect, useRef, useState } from 'react';
import { Match, Player, Tournament } from '@/lib/sports/types';

interface TournamentBracketProps {
    matches: Match[];
    players: Record<string, Player>;
    tournament: Tournament;
}

export function TournamentBracket({ matches, players, tournament }: TournamentBracketProps) {
    // 1. Group matches by standard rounds
    const roundOrder = ['Final', 'SF', 'QF', 'R16', 'R32', 'R64'];
    const groupedMatches: Record<string, Match[]> = {
        'Final': [], 'SF': [], 'QF': [], 'R16': [], 'R32': [], 'R64': []
    };

    matches.forEach(m => {
        let rName = m.round_name.toUpperCase();
        if (rName.includes('R64')) rName = 'R64';
        else if (rName.includes('R32')) rName = 'R32';
        else if (rName.includes('R16') || rName === 'ROUND OF 16') rName = 'R16';
        else if (rName.includes('QF') || rName === 'QUARTER FINALS') rName = 'QF';
        else if (rName.includes('SF') || rName === 'SEMI FINALS') rName = 'SF';
        else if (rName.includes('FINAL')) rName = 'Final';
        else return; // Ignore unknown rounds

        if (groupedMatches[rName]) {
            groupedMatches[rName].push(m);
        }
    });

    // Determine the deepest active round to dynamically size the bracket
    let maxIndex = -1;
    roundOrder.forEach((r, i) => {
        if (groupedMatches[r].length > 0) maxIndex = Math.max(maxIndex, i);
    });

    // Always show at least down to QF (index 2)
    if (maxIndex < 2) maxIndex = 2;

    const activeSideRounds = roundOrder.slice(1, maxIndex + 1).reverse();

    // 2. Dynamic dimensions & Scaling
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    const TARGET_WIDTH = 400 + (activeSideRounds.length * 320) * 2;
    const maxSideSlots = Math.pow(2, maxIndex - 1);
    const TARGET_HEIGHT = Math.max(900, maxSideSlots * 120 + 200);

    useEffect(() => {
        const calculateScale = () => {
            if (!containerRef.current) return;
            const parent = containerRef.current.parentElement;
            if (!parent) return;

            const scaleX = parent.clientWidth / TARGET_WIDTH;
            const scaleY = parent.clientHeight / TARGET_HEIGHT;
            let newScale = Math.min(scaleX, scaleY) * 0.95;
            if (newScale > 1.1) newScale = 1.1;

            setScale(newScale);
        };

        calculateScale();
        setTimeout(calculateScale, 100);
        window.addEventListener('resize', calculateScale);
        return () => window.removeEventListener('resize', calculateScale);
    }, [TARGET_WIDTH, TARGET_HEIGHT]);

    const getPlayerRow = (pId: string | null) => {
        const player = pId ? players[pId] : null;
        return (
            <div className={`flex items-center gap-3 p-2 bg-white ${player ? 'text-black font-bold' : 'text-zinc-400'} border-b border-gray-200 last:border-b-0`}>
                <div className="w-8 h-8 bg-zinc-200 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-300">
                    {player?.avatar_url || player?.country_code ? (
                        <img src={player.avatar_url || player.country_code} alt="flag" className="w-full h-full object-cover" />
                    ) : (
                        <i className="fa-solid fa-user text-gray-400 text-xs text-center"></i>
                    )}
                </div>
                <span className="truncate">{player ? player.name : 'TBD'}</span>
            </div>
        );
    };

    const BracketMatchNode = ({ match, isFinal = false }: { match?: Match, isFinal?: boolean }) => {
        return (
            <div className={`relative bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] border-2 border-red-600/20 overflow-hidden flex flex-col z-10 transition-transform hover:scale-105 ${isFinal ? 'w-72 border-zto-gold/50 shadow-zto-gold/20 shadow-2xl scale-110' : 'w-64'}`}>
                {getPlayerRow(match?.player1_id || null)}
                {getPlayerRow(match?.player2_id || null)}

                {match && match.status !== 'scheduled' && (
                    <div className="absolute inset-y-0 right-0 w-16 bg-red-600 flex flex-col items-center justify-center text-white font-black text-sm border-l border-red-700">
                        <div>{match.sets_p1}</div>
                        <div className="w-8 h-[1px] bg-white/30 my-1"></div>
                        <div>{match.sets_p2}</div>
                    </div>
                )}
            </div>
        );
    };

    const renderSide = (sideIndex: 'left' | 'right') => {
        return (
            <div className={`flex ${sideIndex === 'left' ? 'flex-row' : 'flex-row-reverse'} items-center h-full gap-16`}>
                {activeSideRounds.map((roundName, colIndex) => {
                    const depth = activeSideRounds.length - 1 - colIndex;
                    const totalSlots = Math.pow(2, depth);
                    const expectedTotalMatches = Math.pow(2, depth + 1);

                    const roundMatches = groupedMatches[roundName] || [];
                    const paddedMatches = [...roundMatches, ...Array(Math.max(0, expectedTotalMatches - roundMatches.length)).fill(undefined)];
                    const sideMatches = sideIndex === 'left'
                        ? paddedMatches.slice(0, totalSlots)
                        : paddedMatches.slice(totalSlots, totalSlots * 2);

                    return (
                        <div key={roundName} className="flex flex-col justify-around h-full relative" style={{ width: '256px' }}>
                            {sideMatches.map((m, i) => (
                                <div key={i} className="relative w-full flex items-center justify-center -z-1" style={{ height: `${100 / totalSlots}%` }}>

                                    <div className="z-10 relative">
                                        <BracketMatchNode match={m} />

                                        <div
                                            className={`absolute top-1/2 ${sideIndex === 'left' ? '-right-10' : '-left-10'} w-10 h-[2px] bg-[#dc3137]/60 pointer-events-none -z-10`}
                                        />
                                    </div>

                                    {colIndex > 0 && (
                                        <div
                                            className={`absolute top-[25%] ${sideIndex === 'left' ? '-left-10' : '-right-10'} w-10 h-[50%] border-t-2 border-b-2 ${sideIndex === 'left' ? 'border-l-2 rounded-l-lg border-r-0' : 'border-r-2 rounded-r-lg border-l-0'} border-[#dc3137]/60 pointer-events-none -z-20`}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        );
    };

    const finalMatch = groupedMatches['Final'][0];

    return (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden bg-[#f7ebe6] rounded-3xl shadow-2xl relative font-sans">
            <div
                style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                    width: `${TARGET_WIDTH}px`,
                    height: `${TARGET_HEIGHT}px`
                }}
                className="flex flex-col items-center justify-start relative transition-transform duration-500 ease-out"
            >
                <div className="w-full h-32 bg-white flex flex-col justify-center items-center relative border-b-4 border-[#dc3137] shrink-0 z-50">
                    <h1 className="text-4xl font-black text-[#dc3137] tracking-widest uppercase mb-2">
                        {tournament.name || "YONEX Taipei Open 2025"}
                    </h1>
                    <h2 className="text-2xl font-bold text-[#b5262a] italic">
                        TOURNAMENT BRACKET
                    </h2>
                    <div className="flex w-full absolute bottom-[-4px] left-0 h-1">
                        <div className="w-1/3 bg-[#f07b38]"></div>
                        <div className="w-1/3 bg-[#69c6ba]"></div>
                        <div className="w-1/3 bg-[#5abdc7]"></div>
                    </div>
                </div>

                <div className="flex-1 w-full flex items-stretch justify-center pt-16 pb-8 relative z-10">
                    <div className="h-full flex items-center justify-between relative px-8">
                        {renderSide('left')}

                        <div className="flex flex-col items-center justify-center flex-shrink-0 z-20 mx-16 mt-20 relative">
                            <div className="bg-[#dc3137]/10 p-4 rounded-full border border-[#dc3137]/30 mb-8 backdrop-blur-sm shadow-xl">
                                <h3 className="text-2xl font-black text-[#dc3137] tracking-[0.5em] rotate-180 uppercase" style={{ writingMode: 'vertical-rl' }}>
                                    C H A M P I O N
                                </h3>
                            </div>
                            <div className="relative z-10">
                                <BracketMatchNode match={finalMatch} isFinal />

                                <div className="absolute top-1/2 -left-6 w-6 h-[2px] bg-[#dc3137]/60 pointer-events-none -z-10" />
                                <div className="absolute top-1/2 -right-6 w-6 h-[2px] bg-[#dc3137]/60 pointer-events-none -z-10" />
                            </div>
                        </div>

                        {renderSide('right')}
                    </div>
                </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#dc3137]/10 to-transparent pointer-events-none z-0"></div>
        </div>
    );
}
