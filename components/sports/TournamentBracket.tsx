import React, { useEffect, useRef, useState } from 'react';
import { Match, Player, Tournament } from '@/lib/sports/types';
import { motion } from 'framer-motion';

interface TournamentBracketProps {
    matches: Match[];
    players: Record<string, Player>;
    tournament: Tournament;
}

export function TournamentBracket({ matches, players, tournament }: TournamentBracketProps) {
    // 1. Fit to screen logic
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const calculateScale = () => {
            if (!containerRef.current) return;
            const parent = containerRef.current.parentElement;
            if (!parent) return;

            // Target dimensions of the inner bracket content
            const TARGET_WIDTH = 1500;
            const TARGET_HEIGHT = 900;

            const parentWidth = parent.clientWidth;
            const parentHeight = parent.clientHeight;

            const scaleX = parentWidth / TARGET_WIDTH;
            const scaleY = parentHeight / TARGET_HEIGHT;

            // Use the smaller scale to ensure it fits entirely within the parent without scrolling
            let newScale = Math.min(scaleX, scaleY) * 0.95; // 0.95 adds a little padding

            // Don't scale up too much if it's on a giant screen
            if (newScale > 1.2) newScale = 1.2;

            setScale(newScale);
        };

        calculateScale();
        window.addEventListener('resize', calculateScale);
        return () => window.removeEventListener('resize', calculateScale);
    }, []);

    // 2. Group matches by round for bracket
    // Supported standard rounds: 'R16', 'QF', 'SF', 'Final'
    const groupedMatches: Record<string, Match[]> = {};

    matches.forEach(m => {
        let rName = m.round_name.toUpperCase();
        if (rName.includes('R16') || rName === 'ROUND OF 16') rName = 'R16';
        else if (rName.includes('QF') || rName === 'QUARTER FINALS') rName = 'QF';
        else if (rName.includes('SF') || rName === 'SEMI FINALS') rName = 'SF';
        else if (rName.includes('FINAL')) rName = 'Final';

        if (!groupedMatches[rName]) groupedMatches[rName] = [];
        groupedMatches[rName].push(m);
    });

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

    const BracketMatchNode = ({ match, label }: { match?: Match, label?: string }) => {
        return (
            <div className="relative w-64 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] border-2 border-red-600/20 overflow-hidden flex flex-col z-10 transition-transform hover:scale-105">
                {getPlayerRow(match?.player1_id || null)}
                {getPlayerRow(match?.player2_id || null)}

                {/* Status / Score Overlay */}
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

    // Assuming a 16 player bracket layout (like the uploaded image)
    const renderSide = (sideIndex: 'left' | 'right') => {
        // Find R16, QF, SF matches for this side
        // If it's left side, we take the first half of the array. If right, second half.
        // Or if data is insufficient, just render placeholders.
        const matchesR16 = (groupedMatches['R16'] || []).slice(sideIndex === 'left' ? 0 : 4, sideIndex === 'left' ? 4 : 8);
        const matchesQF = (groupedMatches['QF'] || []).slice(sideIndex === 'left' ? 0 : 2, sideIndex === 'left' ? 2 : 4);
        const matchSF = (groupedMatches['SF'] || [])[sideIndex === 'left' ? 0 : 1];

        // Pad with nulls up to the required amount (4 R16, 2 QF, 1 SF per side)
        const paddedR16 = [...matchesR16, ...Array(Math.max(0, 4 - matchesR16.length)).fill(undefined)];
        const paddedQF = [...matchesQF, ...Array(Math.max(0, 2 - matchesQF.length)).fill(undefined)];

        return (
            <div className={`flex ${sideIndex === 'left' ? 'flex-row' : 'flex-row-reverse'} items-center h-full gap-16`}>
                {/* R16 */}
                <div className="flex flex-col justify-between h-full py-8 gap-8">
                    {paddedR16.map((m, i) => (
                        <div key={i} className="relative">
                            <BracketMatchNode match={m} />
                            {/* Connector line out */}
                            <div className={`absolute top-1/2 ${sideIndex === 'left' ? '-right-16' : '-left-16'} w-16 h-[2px] bg-red-500/50`} />
                        </div>
                    ))}
                </div>

                {/* QF */}
                <div className="flex flex-col justify-around h-full gap-32">
                    {paddedQF.map((m, i) => (
                        <div key={i} className="relative">
                            <BracketMatchNode match={m} />
                            {/* Connector line in (vertical bridge) */}
                            <div className={`absolute border-t-2 border-b-2 ${sideIndex === 'left' ? 'border-l-2 rounded-l-lg border-r-0' : 'border-r-2 rounded-r-lg border-l-0'} border-red-500/50`}
                                style={{
                                    height: 'calc(100% + 4.5rem)',
                                    top: '-2.25rem',
                                    [sideIndex === 'left' ? 'left' : 'right']: '-2rem',
                                    width: '2rem'
                                }}
                            />
                            {/* Connector line out */}
                            <div className={`absolute top-1/2 ${sideIndex === 'left' ? '-right-16' : '-left-16'} w-16 h-[2px] bg-red-500/50`} />
                        </div>
                    ))}
                </div>

                {/* SF */}
                <div className="flex flex-col justify-center h-full">
                    <div className="relative">
                        <BracketMatchNode match={matchSF} />
                        {/* Connector line in */}
                        <div className={`absolute border-t-2 border-b-2 ${sideIndex === 'left' ? 'border-l-2 rounded-l-lg border-r-0' : 'border-r-2 rounded-r-lg border-l-0'} border-red-500/50`}
                            style={{
                                height: 'calc(100% + 18rem)',
                                top: '-9rem',
                                [sideIndex === 'left' ? 'left' : 'right']: '-2rem',
                                width: '2rem'
                            }}
                        />
                        {/* Connector line into Final */}
                        <div className={`absolute top-1/2 ${sideIndex === 'left' ? '-right-16' : '-left-16'} w-16 h-[2px] bg-red-500`} />
                    </div>
                </div>
            </div>
        );
    };

    const finalMatch = (groupedMatches['Final'] || [])[0];

    return (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden bg-[#f7ebe6] rounded-3xl shadow-2xl relative font-sans">
            {/* Scale Box */}
            <div
                style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                    width: '1500px',
                    height: '900px'
                }}
                className="flex flex-col items-center justify-start relative"
            >
                {/* Header section like the image */}
                <div className="w-full h-32 bg-white flex flex-col justify-center items-center relative border-b-4 border-[#dc3137] shrink-0">
                    <h1 className="text-4xl font-black text-[#dc3137] tracking-widest uppercase mb-2">
                        {tournament.name || "YONEX Taipei Open 2025"}
                    </h1>
                    <h2 className="text-2xl font-bold text-[#b5262a] italic">
                        TOURNAMENT BRACKET
                    </h2>
                    {/* Decorative bands */}
                    <div className="flex w-full absolute bottom-[-4px] left-0 h-1">
                        <div className="w-1/3 bg-[#f07b38]"></div>
                        <div className="w-1/3 bg-[#69c6ba]"></div>
                        <div className="w-1/3 bg-[#5abdc7]"></div>
                    </div>
                </div>

                {/* Main Bracket Area */}
                <div className="flex-1 w-full flex items-stretch justify-center p-8 relative">
                    <div className="w-full h-full flex items-center justify-between relative px-12 pb-12">

                        {/* Left Side (R16, QF, SF) */}
                        {renderSide('left')}

                        {/* Center Final + Champion Text */}
                        <div className="flex flex-col items-center justify-center flex-shrink-0 z-20 mx-8 mt-24">
                            <div className="bg-[#dc3137]/10 p-4 rounded-full border border-[#dc3137]/30 mb-8 backdrop-blur-sm">
                                <h3 className="text-2xl font-black text-[#dc3137] tracking-[0.5em] writing-vertical-rl rotate-180 uppercase" style={{ writingMode: 'vertical-rl' }}>
                                    C H A M P I O N
                                </h3>
                            </div>
                            <div className="relative">
                                <BracketMatchNode match={finalMatch} label="FINAL" />
                            </div>
                        </div>

                        {/* Right Side (R16, QF, SF) */}
                        {renderSide('right')}

                    </div>
                </div>
            </div>

            {/* Ambient Background Grid/Rays (optional flavor) */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#dc3137]/5 to-transparent pointer-events-none"></div>
        </div>
    );
}
