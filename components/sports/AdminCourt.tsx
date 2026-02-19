import React from 'react';
import { Player, Match } from '@/lib/sports/types';

interface AdminCourtProps {
    match: Match;
    p1: Player | undefined;
    p2: Player | undefined;
    onUpdateScore: (updates: Partial<Match>) => void;
    sportType?: string;
    now: Date;
}

// Configuration for Sport Themes
const COURT_THEMES: Record<string, { bg: string, accent: string, text: string, line: string, ground: string }> = {
    badminton: {
        bg: 'bg-green-800',
        ground: 'bg-green-700',
        accent: 'bg-green-600',
        text: 'text-white',
        line: 'bg-white'
    },
    pickleball: {
        bg: 'bg-blue-900',
        ground: 'bg-blue-600',
        accent: 'bg-blue-500',
        text: 'text-white',
        line: 'bg-white'
    },
    tennis: {
        bg: 'bg-emerald-800', // Distinct from badminton
        ground: 'bg-emerald-600',
        accent: 'bg-emerald-500',
        text: 'text-white',
        line: 'bg-white'
    },
    basketball: {
        bg: 'bg-slate-900',
        ground: 'bg-orange-100', // Wood floor approx
        accent: 'bg-orange-600',
        text: 'text-slate-900',
        line: 'bg-orange-800'
    },
    football: {
        bg: 'bg-slate-900',
        ground: 'bg-emerald-600', // Grass
        accent: 'bg-emerald-500',
        text: 'text-white',
        line: 'bg-white/80'
    }
};

export function AdminCourt({ match, p1, p2, onUpdateScore, sportType = 'badminton', now }: AdminCourtProps) {

    const normalizedSport = sportType.toLowerCase();
    const isNetSport = ['badminton', 'pickleball', 'tennis', 'table_tennis', 'volleyball'].includes(normalizedSport);

    // Get theme or default to badminton
    const theme = COURT_THEMES[normalizedSport] || COURT_THEMES['badminton'];

    const handleScore = (player: 1 | 2, delta: number) => {
        const current = player === 1 ? match.current_score_p1 : match.current_score_p2;
        const newScore = Math.max(0, current + delta);

        const updates: Partial<Match> = {
            [player === 1 ? 'current_score_p1' : 'current_score_p2']: newScore
        };

        // BWF Logic: Match starts when first point is awarded
        if (delta > 0 && !match.started_at) {
            updates.started_at = new Date().toISOString();
        }

        // Auto-serving logic for net sports: Point winner becomes the server
        if (delta > 0 && isNetSport) {
            const winnerId = player === 1 ? p1?.id : p2?.id;
            if (winnerId) {
                updates.serving_player_id = winnerId;
            }
        }

        onUpdateScore(updates);
    };

    const toggleServer = () => {
        onUpdateScore({ serving_player_id: match.serving_player_id === p1?.id ? p2?.id : p1?.id });
    };

    // --- NET SPORT LAYOUT (Responsive Court) ---
    if (isNetSport) {
        return (
            <div id="admin-court-container" className={`w-full min-h-[calc(100vh-140px)] ${theme.bg} p-4 md:p-6 rounded-xl md:rounded-3xl shadow-2xl border border-white/10 flex flex-col transition-all duration-300`}>
                {/* Header (Responsive Grid) */}
                <div className="flex flex-col lg:flex-row justify-between items-center mb-4 md:mb-8 gap-4">
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-8 w-full lg:w-auto">
                        <div className="text-center lg:text-left">
                            <div className="text-white/50 font-bold uppercase tracking-widest text-xs md:text-sm">{match.round_name}</div>
                            <div className="text-2xl md:text-4xl font-black text-white whitespace-nowrap">{match.court_id || 'CENTER COURT'}</div>
                        </div>
                        <div className="hidden lg:block h-12 md:h-16 w-[2px] bg-white/10"></div>
                        <div className="text-center lg:text-left">
                            <div className="text-white/50 font-bold uppercase tracking-widest text-xs md:text-sm">Duration</div>
                            <div className="text-2xl md:text-4xl font-black text-indigo-400 font-mono">
                                {(() => {
                                    if (!match.started_at) return "00:00";
                                    const diff = Math.floor((now.getTime() - new Date(match.started_at).getTime()) / 1000);
                                    const m = Math.floor(diff / 60);
                                    const s = diff % 60;
                                    return `${m}:${s.toString().padStart(2, '0')}`;
                                })()}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 md:gap-4 w-full lg:w-auto">
                        <button
                            onClick={() => {
                                const elem = document.getElementById('admin-court-container');
                                if (!document.fullscreenElement) {
                                    elem?.requestFullscreen().catch(err => {
                                        console.error(`Error attempting to enable fullscreen: ${err.message}`);
                                    });
                                } else {
                                    document.exitFullscreen();
                                }
                            }}
                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
                            title="Toggle Fullscreen"
                        >
                            <i className="fa-solid fa-expand"></i>
                        </button>
                        <button
                            onClick={() => {
                                if (confirm("Confirm end of this set? Current scores will be archived.")) {
                                    const h1 = match.current_score_p1;
                                    const h2 = match.current_score_p2;
                                    const winner = h1 > h2 ? 1 : 2;

                                    onUpdateScore({
                                        sets_p1: winner === 1 ? match.sets_p1 + 1 : match.sets_p1,
                                        sets_p2: winner === 2 ? match.sets_p2 + 1 : match.sets_p2,
                                        current_score_p1: 0,
                                        current_score_p2: 0,
                                        periods_scores: [...(match.periods_scores || []), { p1: h1, p2: h2 }],
                                        serving_player_id: winner === 1 ? p1?.id : p2?.id
                                    });
                                }
                            }}
                            className="flex-1 lg:flex-none px-3 md:px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm font-black uppercase tracking-wider rounded-lg shadow-lg whitespace-nowrap"
                        >
                            End Set
                        </button>
                        <button onClick={toggleServer} className="flex-1 lg:flex-none px-3 md:px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-black text-xs md:text-sm font-black uppercase tracking-wider rounded-lg shadow-lg whitespace-nowrap">
                            Swap Server
                        </button>
                    </div>
                </div>

                {/* VISUAL COURT */}
                {/* Responsive container: Vertical on mobile/iPad Portrait, Horizontal on Desktop/iPad Landscape */}
                <div className={`relative w-full flex-1 ${theme.ground} rounded-lg border-4 border-white/80 shadow-inner overflow-hidden flex flex-col lg:flex-row min-h-[400px]`}>

                    {/* Court Lines Overlay */}
                    <div className="absolute inset-x-0 top-1/2 h-1 md:h-2 bg-white/40 -translate-y-1/2 hidden lg:block"></div> {/* Horizontal Line (Desktop only) */}
                    <div className="absolute inset-y-0 left-1/2 w-1 md:w-2 bg-white z-10 -translate-x-1/2 shadow-lg hidden lg:block"></div> {/* Vertical Net (Desktop only) */}

                    {/* Mobile Divider */}
                    <div className="absolute top-1/2 left-0 right-0 h-2 bg-white/50 z-10 -translate-y-1/2 lg:hidden"></div>

                    {/* PLAYER 1 SIDE (Left/Top) */}
                    <div className={`flex-1 relative flex flex-col items-center justify-center p-4 md:p-8 transition-colors ${match.serving_player_id === p1?.id ? 'bg-black/20' : ''}`}>
                        {match.serving_player_id === p1?.id && (
                            <div className="absolute top-4 left-4 md:left-4 bg-yellow-400 text-black text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 rounded-full shadow animate-bounce z-20">
                                <i className="fa-solid fa-shuttlecock mr-1"></i> SERVE
                            </div>
                        )}

                        <h2 className="text-2xl md:text-5xl font-black text-white text-center drop-shadow-md mb-2 md:mb-4 truncate max-w-full px-2">{p1?.name || 'Player 1'}</h2>

                        <div className="flex items-center gap-4 md:gap-8">
                            <button
                                onClick={() => handleScore(1, -1)}
                                className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/20 hover:bg-black/30 text-white font-bold text-xl md:text-2xl flex items-center justify-center backdrop-blur-sm transition"
                            >
                                -
                            </button>
                            <div className="text-6xl md:text-[8rem] leading-none font-black text-white drop-shadow-2xl font-mono tabular-nums">
                                {match.current_score_p1}
                            </div>
                            <button
                                onClick={() => handleScore(1, 1)}
                                className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white hover:bg-gray-100 text-green-900 font-bold text-3xl md:text-4xl flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition"
                            >
                                +
                            </button>
                        </div>

                        <div className="mt-4 md:mt-8 flex items-center gap-2 md:gap-4 bg-black/30 p-2 rounded-xl backdrop-blur-md">
                            <span className="text-white/60 font-bold uppercase text-[10px] md:text-xs px-2">Sets</span>
                            <button onClick={() => onUpdateScore({ sets_p1: Math.max(0, match.sets_p1 - 1) })} className="w-6 h-6 md:w-8 md:h-8 rounded bg-white/10 text-white hover:bg-white/20 flex items-center justify-center">-</button>
                            <span className="text-xl md:text-2xl font-bold text-white w-6 md:w-8 text-center">{match.sets_p1}</span>
                            <button onClick={() => onUpdateScore({ sets_p1: match.sets_p1 + 1 })} className="w-6 h-6 md:w-8 md:h-8 rounded bg-white/10 text-white hover:bg-white/20 flex items-center justify-center">+</button>
                        </div>
                    </div>

                    {/* PLAYER 2 SIDE (Right/Bottom) */}
                    <div className={`flex-1 relative flex flex-col items-center justify-center p-4 md:p-8 transition-colors ${match.serving_player_id === p2?.id ? 'bg-black/20' : ''}`}>
                        {match.serving_player_id === p2?.id && (
                            <div className="absolute top-4 right-4 md:right-4 bg-yellow-400 text-black text-[10px] md:text-xs font-bold px-2 md:px-3 py-1 rounded-full shadow animate-bounce z-20">
                                <i className="fa-solid fa-shuttlecock mr-1"></i> SERVE
                            </div>
                        )}

                        <h2 className="text-2xl md:text-5xl font-black text-white text-center drop-shadow-md mb-2 md:mb-4 truncate max-w-full px-2">{p2?.name || 'Player 2'}</h2>

                        <div className="flex items-center gap-4 md:gap-8">
                            <button
                                onClick={() => handleScore(2, -1)}
                                className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/20 hover:bg-black/30 text-white font-bold text-xl md:text-2xl flex items-center justify-center backdrop-blur-sm transition"
                            >
                                -
                            </button>
                            <div className="text-6xl md:text-[8rem] leading-none font-black text-white drop-shadow-2xl font-mono tabular-nums">
                                {match.current_score_p2}
                            </div>
                            <button
                                onClick={() => handleScore(2, 1)}
                                className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white hover:bg-gray-100 text-green-900 font-bold text-3xl md:text-4xl flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition"
                            >
                                +
                            </button>
                        </div>

                        <div className="mt-4 md:mt-8 flex items-center gap-2 md:gap-4 bg-black/30 p-2 rounded-xl backdrop-blur-md">
                            <span className="text-white/60 font-bold uppercase text-[10px] md:text-xs px-2">Sets</span>
                            <button onClick={() => onUpdateScore({ sets_p2: Math.max(0, match.sets_p2 - 1) })} className="w-6 h-6 md:w-8 md:h-8 rounded bg-white/10 text-white hover:bg-white/20 flex items-center justify-center">-</button>
                            <span className="text-xl md:text-2xl font-bold text-white w-6 md:w-8 text-center">{match.sets_p2}</span>
                            <button onClick={() => onUpdateScore({ sets_p2: match.sets_p2 + 1 })} className="w-6 h-6 md:w-8 md:h-8 rounded bg-white/10 text-white hover:bg-white/20 flex items-center justify-center">+</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- TIMED SPORT LAYOUT (Field/Timed - Authentic) ---
    return (
        <div className="w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col min-h-screen md:min-h-0">
            {/* Scoreboard Header */}
            <div className="bg-slate-950 p-4 md:p-6 flex flex-col md:flex-row justify-between items-center border-b border-white/5 gap-4">
                <div className="flex flex-col text-center md:text-left">
                    <span className="text-gray-400 font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] mb-1">{match.round_name}</span>
                    <span className="text-white font-black text-xl md:text-2xl uppercase tracking-wider">{match.court_id || 'MAIN STADIUM'}</span>
                </div>

                {/* Main Clock */}
                <div className="flex flex-col items-center bg-black rounded-lg px-4 md:px-8 py-2 border-2 border-slate-800/50 shadow-inner">
                    <div className={`font-mono text-4xl md:text-6xl font-black tabular-nums tracking-widest ${match.is_paused ? 'text-red-500' : 'text-green-500'}`}>
                        {Math.floor((match.timer_seconds || 0) / 60).toString().padStart(2, '0')}:{(match.timer_seconds || 0) % 60 < 10 ? '0' : ''}{(match.timer_seconds || 0) % 60}
                    </div>
                </div>

                <div className="flex flex-col items-end w-full md:w-auto">
                    <div className="flex justify-between w-full md:w-auto items-center gap-4">
                        <button
                            onClick={() => {
                                if (confirm("Finish this match and record result?")) {
                                    const winnerId = match.current_score_p1 > match.current_score_p2 ? p1?.id : (match.current_score_p2 > match.current_score_p1 ? p2?.id : null);
                                    onUpdateScore({ status: 'completed', winner_id: winnerId || undefined });
                                }
                            }}
                            className="px-4 py-2 bg-white/10 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition border border-white/5"
                        >
                            End Game
                        </button>

                        <div className="flex items-center gap-2">
                            <button onClick={() => onUpdateScore({ current_period: Math.max(1, (match.current_period || 1) - 1) })} className="text-white/20 hover:text-white transition w-8 h-8 flex items-center justify-center bg-white/5 rounded"><i className="fa-solid fa-chevron-left"></i></button>
                            <div className="flex flex-col items-center">
                                <span className="text-[8px] uppercase font-bold text-gray-500">Period</span>
                                <span className="text-white font-black text-2xl">{match.current_period || 1}</span>
                            </div>
                            <button onClick={() => onUpdateScore({ current_period: (match.current_period || 1) + 1 })} className="text-white/20 hover:text-white transition w-8 h-8 flex items-center justify-center bg-white/5 rounded"><i className="fa-solid fa-chevron-right"></i></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Field Area */}
            {/* Aspect ratio tricks for responsive field */}
            <div className={`relative w-full flex-1 md:aspect-[21/9] ${theme.ground} overflow-hidden flex flex-col md:flex-row`}>
                {/* Field Patterns (Desktop only) */}
                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[length:10%_100%] pointer-events-none hidden md:block"></div>

                {/* Center Circle (Desktop only) */}
                <div className="absolute top-1/2 left-1/2 w-[20%] aspect-square border-4 border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden md:block"></div>
                <div className="absolute top-1/2 left-1/2 w-full h-[2px] bg-white/30 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden md:block"></div>

                {/* TEAMS LAYOUT */}

                {/* HOME (Left/Top) */}
                <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative hover:bg-white/5 transition duration-500 border-b md:border-b-0 border-white/10 md:border-r">
                    <div className="text-center z-10 w-full">
                        <h2 className="text-3xl md:text-6xl font-black text-slate-900 drop-shadow-sm mb-2 truncate px-2">{p1?.name || 'Home'}</h2>

                        <div className="flex items-center gap-4 md:gap-6 justify-center my-4 md:my-6">
                            <button onClick={() => handleScore(1, -1)} className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-black/20 text-white hover:bg-black/40 font-bold text-xl md:text-2xl backdrop-blur transition">-</button>
                            <div className="text-7xl md:text-[10rem] leading-none font-black text-slate-900/80 drop-shadow-sm tabular-nums">{match.current_score_p1}</div>
                            <button onClick={() => handleScore(1, 1)} className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-white text-emerald-900 hover:bg-gray-200 font-bold text-3xl md:text-4xl shadow-xl transition">+</button>
                        </div>
                    </div>
                </div>

                {/* AWAY (Right/Bottom) */}
                <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative hover:bg-white/5 transition duration-500">
                    <div className="text-center z-10 w-full">
                        <h2 className="text-3xl md:text-6xl font-black text-slate-900 drop-shadow-sm mb-2 truncate px-2">{p2?.name || 'Away'}</h2>

                        <div className="flex items-center gap-4 md:gap-6 justify-center my-4 md:my-6">
                            <button onClick={() => handleScore(2, -1)} className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-black/20 text-white hover:bg-black/40 font-bold text-xl md:text-2xl backdrop-blur transition">-</button>
                            <div className="text-7xl md:text-[10rem] leading-none font-black text-slate-900/80 drop-shadow-sm tabular-nums">{match.current_score_p2}</div>
                            <button onClick={() => handleScore(2, 1)} className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-white text-emerald-900 hover:bg-gray-200 font-bold text-3xl md:text-4xl shadow-xl transition">+</button>
                        </div>
                    </div>
                </div>

                {/* Clock Controls Overlay (Sticky Bottom-Center) */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 md:gap-4 bg-black/90 p-2 rounded-2xl backdrop-blur border border-white/10 z-20 shadow-2xl w-[90%] md:w-auto justify-center">
                    <button onClick={() => onUpdateScore({ is_paused: !match.is_paused })} className={`flex-1 md:flex-none px-4 md:px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-sm md:text-lg shadow-lg transition whitespace-nowrap ${match.is_paused ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}>
                        {match.is_paused ? 'START' : 'STOP'}
                    </button>
                    <div className="w-[1px] bg-white/20 mx-1 h-full hidden md:block"></div>
                    <button onClick={() => onUpdateScore({ timer_seconds: (match.timer_seconds || 0) + 60 })} className="px-3 md:px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold text-xs md:text-base">+1m</button>
                    <button onClick={() => onUpdateScore({ timer_seconds: Math.max(0, (match.timer_seconds || 0) - 60) })} className="px-3 md:px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold text-xs md:text-base">-1m</button>
                </div>
            </div>
        </div>
    );
}
