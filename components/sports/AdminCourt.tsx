import React from 'react';
import { Player, Match } from '@/lib/sports/types';

interface AdminCourtProps {
    match: Match;
    p1: Player | undefined;
    p2: Player | undefined;
    onUpdateScore: (updates: Partial<Match>) => void;
    sportType?: string;
}

export function AdminCourt({ match, p1, p2, onUpdateScore, sportType = 'badminton' }: AdminCourtProps) {

    const isNetSport = ['badminton', 'pickleball', 'tennis', 'table_tennis', 'volleyball'].includes(sportType);
    const isTimedSport = ['basketball', 'football'].includes(sportType);

    // Labels based on sport
    const collectionName = sportType === 'pickleball' || sportType === 'basketball' || sportType === 'volleyball' ? 'Game' : 'Set';

    const handleScore = (player: 1 | 2, delta: number) => {
        const current = player === 1 ? match.current_score_p1 : match.current_score_p2;
        const newScore = Math.max(0, current + delta);
        onUpdateScore({
            [player === 1 ? 'current_score_p1' : 'current_score_p2']: newScore
        });
    };

    const toggleServer = () => {
        onUpdateScore({ serving_player_id: match.serving_player_id === p1?.id ? p2?.id : p1?.id });
    };

    // --- NET SPORT LAYOUT (Realistic Court) ---
    if (isNetSport) {
        return (
            <div className="w-full bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <div className="text-white/50 font-bold uppercase tracking-widest text-sm">{match.round_name}</div>
                        <div className="text-4xl font-black text-white">{match.court_id || 'CENTER COURT'}</div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={toggleServer} className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-black uppercase tracking-wider rounded-lg shadow-lg">
                            <i className="fa-solid fa-arrow-right-arrow-left mr-2"></i> Swap Server
                        </button>
                    </div>
                </div>

                {/* VISUAL COURT */}
                <div className="relative w-full aspect-[2/1] bg-green-700 rounded-lg border-4 border-white shadow-inner overflow-hidden flex">
                    {/* Court Lines Overlay (Simple CSS representation) */}
                    <div className="absolute inset-x-0 top-1/2 h-2 bg-white/40 -translate-y-1/2"></div>
                    <div className="absolute inset-y-0 left-1/2 w-2 bg-white z-10 -translate-x-1/2 shadow-lg"></div>
                    <div className="absolute inset-8 border-2 border-white/50"></div>

                    {/* PLAYER 1 SIDE (Left) */}
                    <div className={`flex-1 relative flex flex-col items-center justify-center p-8 transition-colors ${match.serving_player_id === p1?.id ? 'bg-green-600/50' : ''}`}>
                        {match.serving_player_id === p1?.id && (
                            <div className="absolute top-4 left-4 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full shadow animate-bounce">
                                <i className="fa-solid fa-shuttlecock mr-1"></i> SERVING
                            </div>
                        )}

                        <h2 className="text-3xl md:text-5xl font-black text-white text-center drop-shadow-md mb-4">{p1?.name || 'Player 1'}</h2>

                        <div className="flex items-center gap-8">
                            <button
                                onClick={() => handleScore(1, -1)}
                                className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-2xl flex items-center justify-center backdrop-blur-sm transition"
                            >
                                -1
                            </button>
                            <div className="text-[8rem] leading-none font-black text-white drop-shadow-2xl font-mono tabular-nums">
                                {match.current_score_p1}
                            </div>
                            <button
                                onClick={() => handleScore(1, 1)}
                                className="w-20 h-20 rounded-full bg-white hover:bg-gray-100 text-green-800 font-bold text-4xl flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition"
                            >
                                +1
                            </button>
                        </div>

                        <div className="mt-8 flex items-center gap-4 bg-black/30 p-2 rounded-xl backdrop-blur-md">
                            <span className="text-white/60 font-bold uppercase text-xs px-2">Sets</span>
                            <button onClick={() => onUpdateScore({ sets_p1: Math.max(0, match.sets_p1 - 1) })} className="w-8 h-8 rounded bg-white/10 text-white hover:bg-white/20">-</button>
                            <span className="text-2xl font-bold text-white w-8 text-center">{match.sets_p1}</span>
                            <button onClick={() => onUpdateScore({ sets_p1: match.sets_p1 + 1 })} className="w-8 h-8 rounded bg-white/10 text-white hover:bg-white/20">+</button>
                        </div>
                    </div>

                    {/* PLAYER 2 SIDE (Right) */}
                    <div className={`flex-1 relative flex flex-col items-center justify-center p-8 transition-colors ${match.serving_player_id === p2?.id ? 'bg-green-600/50' : ''}`}>
                        {match.serving_player_id === p2?.id && (
                            <div className="absolute top-4 right-4 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full shadow animate-bounce">
                                <i className="fa-solid fa-shuttlecock mr-1"></i> SERVING
                            </div>
                        )}

                        <h2 className="text-3xl md:text-5xl font-black text-white text-center drop-shadow-md mb-4">{p2?.name || 'Player 2'}</h2>

                        <div className="flex items-center gap-8">
                            <button
                                onClick={() => handleScore(2, -1)}
                                className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-2xl flex items-center justify-center backdrop-blur-sm transition"
                            >
                                -1
                            </button>
                            <div className="text-[8rem] leading-none font-black text-white drop-shadow-2xl font-mono tabular-nums">
                                {match.current_score_p2}
                            </div>
                            <button
                                onClick={() => handleScore(2, 1)}
                                className="w-20 h-20 rounded-full bg-white hover:bg-gray-100 text-green-800 font-bold text-4xl flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition"
                            >
                                +1
                            </button>
                        </div>

                        <div className="mt-8 flex items-center gap-4 bg-black/30 p-2 rounded-xl backdrop-blur-md">
                            <span className="text-white/60 font-bold uppercase text-xs px-2">Sets</span>
                            <button onClick={() => onUpdateScore({ sets_p2: Math.max(0, match.sets_p2 - 1) })} className="w-8 h-8 rounded bg-white/10 text-white hover:bg-white/20">-</button>
                            <span className="text-2xl font-bold text-white w-8 text-center">{match.sets_p2}</span>
                            <button onClick={() => onUpdateScore({ sets_p2: match.sets_p2 + 1 })} className="w-8 h-8 rounded bg-white/10 text-white hover:bg-white/20">+</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- TIMED SPORT LAYOUT (Field/Timed) ---
    // --- TIMED SPORT LAYOUT (Field/Timed - Authentic) ---
    return (
        <div className="w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
            {/* Scoreboard Header */}
            <div className="bg-slate-950 p-6 flex justify-between items-center border-b border-white/5">
                <div className="flex flex-col">
                    <span className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em] mb-1">{match.round_name}</span>
                    <span className="text-white font-black text-2xl uppercase tracking-wider">{match.court_id || 'MAIN STADIUM'}</span>
                </div>

                {/* Main Clock */}
                <div className="flex flex-col items-center bg-black rounded-lg px-8 py-2 border-2 border-slate-800/50 shadow-inner">
                    <div className={`font-mono text-6xl font-black tabular-nums tracking-widest ${match.is_paused ? 'text-red-500' : 'text-green-500'}`}>
                        {Math.floor((match.timer_seconds || 0) / 60).toString().padStart(2, '0')}:{(match.timer_seconds || 0) % 60 < 10 ? '0' : ''}{(match.timer_seconds || 0) % 60}
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em] mb-1">Period</span>
                    <div className="flex items-center gap-4">
                        <button onClick={() => onUpdateScore({ current_period: Math.max(1, (match.current_period || 1) - 1) })} className="text-white/20 hover:text-white transition"><i className="fa-solid fa-chevron-left"></i></button>
                        <span className="text-white font-black text-4xl">{match.current_period || 1}</span>
                        <button onClick={() => onUpdateScore({ current_period: (match.current_period || 1) + 1 })} className="text-white/20 hover:text-white transition"><i className="fa-solid fa-chevron-right"></i></button>
                    </div>
                </div>
            </div>

            {/* Field Area */}
            <div className="relative w-full aspect-[21/9] bg-emerald-800 overflow-hidden">
                {/* Field Patterns */}
                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[length:10%_100%]"></div>

                {/* Center Circle */}
                <div className="absolute top-1/2 left-1/2 w-[20%] aspect-square border-4 border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute top-1/2 left-1/2 w-full h-[2px] bg-white/30 -translate-x-1/2 -translate-y-1/2"></div>

                {/* TEAMS LAYOUT */}
                <div className="absolute inset-0 flex">
                    {/* HOME (Left) */}
                    <div className="flex-1 flex flex-col items-center justify-center p-8 relative hover:bg-white/5 transition duration-500">
                        <div className="text-center z-10">
                            <h2 className="text-4xl md:text-6xl font-black text-white drop-shadow-lg mb-2 truncate max-w-md">{p1?.name || 'Home'}</h2>

                            <div className="flex items-center gap-6 justify-center my-6">
                                <button onClick={() => handleScore(1, -1)} className="w-16 h-16 rounded-xl bg-black/40 text-white hover:bg-black/60 font-bold text-2xl backdrop-blur transition">-1</button>
                                <div className="text-[10rem] leading-none font-black text-white drop-shadow-2xl tabular-nums">{match.current_score_p1}</div>
                                <button onClick={() => handleScore(1, 1)} className="w-20 h-20 rounded-xl bg-white text-emerald-900 hover:bg-gray-200 font-bold text-4xl shadow-xl transition">+1</button>
                            </div>
                        </div>
                    </div>

                    {/* AWAY (Right) */}
                    <div className="flex-1 flex flex-col items-center justify-center p-8 relative hover:bg-white/5 transition duration-500">
                        <div className="text-center z-10">
                            <h2 className="text-4xl md:text-6xl font-black text-white drop-shadow-lg mb-2 truncate max-w-md">{p2?.name || 'Away'}</h2>

                            <div className="flex items-center gap-6 justify-center my-6">
                                <button onClick={() => handleScore(2, -1)} className="w-16 h-16 rounded-xl bg-black/40 text-white hover:bg-black/60 font-bold text-2xl backdrop-blur transition">-1</button>
                                <div className="text-[10rem] leading-none font-black text-white drop-shadow-2xl tabular-nums">{match.current_score_p2}</div>
                                <button onClick={() => handleScore(2, 1)} className="w-20 h-20 rounded-xl bg-white text-emerald-900 hover:bg-gray-200 font-bold text-4xl shadow-xl transition">+1</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Clock Controls Overlay (Bottom Center) */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 bg-black/80 p-2 rounded-2xl backdrop-blur border border-white/10 z-20">
                    <button onClick={() => onUpdateScore({ is_paused: !match.is_paused })} className={`px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-lg shadow-lg transition ${match.is_paused ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}>
                        {match.is_paused ? 'START GAME' : 'STOP GAME'}
                    </button>
                    <div className="w-[1px] bg-white/20 mx-2 h-full"></div>
                    <button onClick={() => onUpdateScore({ timer_seconds: (match.timer_seconds || 0) + 60 })} className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold">+1m</button>
                    <button onClick={() => onUpdateScore({ timer_seconds: Math.max(0, (match.timer_seconds || 0) - 60) })} className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold">-1m</button>
                </div>
            </div>
        </div>
    );
}
