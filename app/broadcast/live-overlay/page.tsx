'use client';

import React, { useEffect } from 'react';
import { useSportsState } from '@/lib/sports/useSportsState';
import Image from 'next/image';

export default function LiveOverlayPage() {
    const { matches, players, tournament } = useSportsState();

    // Force transparent background for OBS/vMix overlay
    useEffect(() => {
        document.documentElement.style.backgroundColor = 'transparent';
        document.body.style.backgroundColor = 'transparent';

        return () => {
            document.documentElement.style.backgroundColor = '';
            document.body.style.backgroundColor = '';
        };
    }, []);

    // Get the first ongoing match
    const activeMatch = matches.find(m => m.status === 'ongoing') || matches[0];
    const p1 = activeMatch && activeMatch.player1_id ? players[activeMatch.player1_id] : null;
    const p2 = activeMatch && activeMatch.player2_id ? players[activeMatch.player2_id] : null;

    const getScores = (playerKey: 'p1' | 'p2') => {
        if (!activeMatch) return ['0', '', '', ''];
        const setsWon = playerKey === 'p1' ? activeMatch.sets_p1 : activeMatch.sets_p2;
        const currentScore = playerKey === 'p1' ? activeMatch.current_score_p1 : activeMatch.current_score_p2;

        let boxes = [setsWon.toString(), '', '', ''];
        let nextGameIndex = 1;

        if (activeMatch.match_history && activeMatch.match_history.length > 0) {
            for (let i = 0; i < activeMatch.match_history.length; i++) {
                if (nextGameIndex <= 3) {
                    boxes[nextGameIndex] = activeMatch.match_history[i][playerKey].toString();
                    nextGameIndex++;
                }
            }
        }

        if (nextGameIndex <= 3) {
            boxes[nextGameIndex] = currentScore.toString();
        }
        return boxes;
    };

    const p1Scores = getScores('p1');
    const p2Scores = getScores('p2');

    return (
        <div style={{ width: '1920px', height: '1080px', position: 'relative', overflow: 'hidden' }} className="font-sans">

            {/* Top Left: Broadcast Scoreboard (Custom Design Match) */}
            {activeMatch && p1 && p2 && (
                <div className="absolute top-6 left-8 flex transform origin-top-left scale-[0.45]">

                    {/* Seamless White Frame Layout */}
                    <div className="flex items-center bg-white rounded-2xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] p-2 pr-3">

                        {/* Left: Sponsor Logo Box */}
                        <div className="w-[260px] flex items-center justify-center shrink-0 pr-4">
                            {(tournament?.config as any)?.broadcast_sponsor_url ? (
                                <img
                                    src={(tournament?.config as any).broadcast_sponsor_url}
                                    alt="Sponsor"
                                    className="max-h-[200px] w-full object-contain drop-shadow-md"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                            ) : (
                                <span className="font-black text-black tracking-tighter italic text-[12px] text-center w-full block">
                                    ZTO<br />EVENT OS
                                </span>
                            )}
                        </div>

                        {/* Right Group: Top Header + Main Scoreboard + Bottom Footer */}
                        <div className="flex flex-col w-[450px]">

                            {/* Header: Event Name */}
                            <div className="flex items-center justify-center w-full pb-3">
                                <span className="font-black text-black text-[15px] uppercase tracking-widest truncate text-center">
                                    {(tournament?.config as any)?.broadcast_top_text || tournament?.name || 'LIVE MATCH'}
                                </span>
                            </div>

                            {/* Main Scoreboard Body */}
                            <div className="flex flex-col bg-black w-full relative z-0 rounded overflow-hidden">
                                {/* Player 1 Row */}
                                <div className="flex items-center border-b border-white/20 h-[45px]">
                                    {/* Name Area */}
                                    <div className="flex-1 flex items-center px-4 justify-between h-full w-[258px] max-w-[258px]">
                                        <span className="font-bold text-white text-lg tracking-tight truncate pr-2">
                                            {p1.name}
                                        </span>
                                        {/* Server Indicator (Pickleball: Dots = Server Number) */}
                                        <div className="flex gap-1.5 min-w-[30px] justify-end shrink-0">
                                            {activeMatch.serving_player_id === p1.id && (
                                                <>
                                                    <div className="w-2.5 h-2.5 rounded-full bg-[#1db954] shadow-[0_0_8px_rgba(29,185,84,0.9)]"></div>
                                                    {tournament?.type === 'pickleball' && activeMatch.server_number === 2 && (
                                                        <div className="w-2.5 h-2.5 rounded-full bg-[#1db954] shadow-[0_0_8px_rgba(29,185,84,0.9)]"></div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Score Grid (4 Boxes) */}
                                    <div className="flex h-full font-mono font-bold text-white text-base md:text-lg shrink-0 w-[192px]">
                                        {p1Scores.map((score, idx) => (
                                            <div key={idx} className={`w-12 h-full flex items-center justify-center border-l ${idx === 0 ? 'border-white/40 bg-white/10' : 'border-white/20'}`}>
                                                {score}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Player 2 Row */}
                                <div className="flex items-center h-[45px]">
                                    {/* Name Area */}
                                    <div className="flex-1 flex items-center px-4 justify-between h-full w-[258px] max-w-[258px]">
                                        <span className="font-bold text-white text-lg tracking-tight truncate pr-2">
                                            {p2.name}
                                        </span>
                                        {/* Server Indicator (Pickleball: Dots = Server Number) */}
                                        <div className="flex gap-1.5 min-w-[30px] justify-end shrink-0">
                                            {activeMatch.serving_player_id === p2.id && (
                                                <>
                                                    <div className="w-2.5 h-2.5 rounded-full bg-[#1db954] shadow-[0_0_8px_rgba(29,185,84,0.9)]"></div>
                                                    {tournament?.type === 'pickleball' && activeMatch.server_number === 2 && (
                                                        <div className="w-2.5 h-2.5 rounded-full bg-[#1db954] shadow-[0_0_8px_rgba(29,185,84,0.9)]"></div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Score Grid (4 Boxes) */}
                                    <div className="flex h-full font-mono font-bold text-white text-base md:text-lg shrink-0 w-[192px]">
                                        {p2Scores.map((score, idx) => (
                                            <div key={idx} className={`w-12 h-full flex items-center justify-center border-l ${idx === 0 ? 'border-white/40 bg-white/10' : 'border-white/20'}`}>
                                                {score}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Footer */}
                            <div className="flex items-center justify-center w-full pt-3 pb-1">
                                <span className="font-black text-black text-[15px] uppercase tracking-widest truncate text-center">
                                    {(tournament?.config as any)?.broadcast_bottom_text || `${activeMatch.court_id} - ${activeMatch.round_name}`}
                                </span>
                            </div>

                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
