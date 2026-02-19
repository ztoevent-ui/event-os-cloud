import React from 'react';
import { Player, Match, SponsorAd } from '@/lib/sports/types';
import { motion, AnimatePresence } from 'framer-motion';

// Update Props Interface
interface PickleballCardProps {
    match: Match;
    p1: Player | undefined;
    p2: Player | undefined;
    activeAd?: SponsorAd;
    logoUrl?: string;
    bgUrl?: string;
    now: Date;
    isGrid?: boolean; // NEW
}

export function PickleballCard({ match, p1, p2, activeAd, logoUrl, bgUrl, now, isGrid = false }: PickleballCardProps) {
    const isServingP1 = match.serving_player_id === p1?.id;
    const isServingP2 = match.serving_player_id === p2?.id;

    // Helper to format name with dynamic sizing
    const formatName = (name: string = 'TBD', alignment: 'left' | 'right' = 'left') => {
        const parts = name.split(' ');
        const lastName = parts[parts.length - 1];
        const firstNames = parts.slice(0, -1).join(' ');

        if (alignment === 'left') {
            return (
                <div className="flex flex-col items-center">
                    <span className={`${isGrid ? 'text-3xl' : 'text-4xl'} font-black uppercase tracking-widest leading-tight`}>{lastName}</span>
                    <span className={`${isGrid ? 'text-xl' : 'text-2xl'} font-medium text-white/80 leading-tight`}>{firstNames}</span>
                </div>
            );
        } else {
            return (
                <div className="flex flex-col items-center">
                    <span className={`${isGrid ? 'text-xl' : 'text-2xl'} font-medium text-white/80 leading-tight`}>{firstNames}</span>
                    <span className={`${isGrid ? 'text-3xl' : 'text-4xl'} font-black uppercase tracking-widest leading-tight`}>{lastName}</span>
                </div>
            );
        }
    };

    // Calculate historical set scores
    const setHistory = match.periods_scores || [];
    const currentSetNum = setHistory.length + 1;

    // Responsive Sizes based on Grid Mode
    const avatarSize = isGrid ? 'w-32 h-32' : 'w-64 h-64';
    const mainScoreSize = isGrid ? 'text-7xl lg:text-8xl' : 'text-[10rem]';
    const setPillSize = isGrid ? 'w-12 h-12 text-xl' : 'w-20 h-20 text-4xl';
    const containerPadding = isGrid ? 'px-8' : 'px-20';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-full h-full bg-black overflow-hidden flex flex-col items-center justify-center text-white font-sans"
        >
            {/* --- BACKGROUND LAYER --- */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 z-10"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_black_90%)] z-10"></div>
                <img
                    src={bgUrl || "https://images.unsplash.com/photo-1593344484962-796055d4a3a4?q=80&w=2600&auto=format&fit=crop"}
                    className="w-full h-full object-cover opacity-60 grayscale-[0.5]"
                    alt="Background"
                />
            </div>

            {/* --- ARENA CONTENT --- */}
            <div className={`relative z-20 w-full max-w-7xl flex items-center justify-between ${containerPadding}`}>

                {/* LEFT PLAYER */}
                <div className="flex flex-col items-center w-1/3">
                    <div className="relative mb-6 md:mb-10">
                        {/* Border Glow */}
                        <div className="absolute inset-[-10px] rounded-full bg-blue-500/30 blur-2xl animate-pulse"></div>

                        {/* Avatar Circle */}
                        <div className={`${avatarSize} rounded-full border-[6px] border-blue-500 p-2 relative z-10 bg-slate-900 overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.4)] transition-all duration-500`}>
                            <img
                                src={p1?.avatar_url || 'https://via.placeholder.com/400x400?text=P1'}
                                className="w-full h-full object-cover rounded-full"
                                alt="P1"
                            />
                        </div>

                        {/* Circular Flag Badge */}
                        <div className={`absolute bottom-2 left-2 ${isGrid ? 'w-10 h-10 border-2' : 'w-16 h-16 border-4'} rounded-full border-slate-950 bg-white overflow-hidden z-20 shadow-xl transition-all`}>
                            <img src={p1?.country_code || "https://flagcdn.com/us.svg"} className="w-full h-full object-cover scale-110" alt="P1 Flag" />
                        </div>

                        {/* Serving Indicator */}
                        <AnimatePresence>
                            {isServingP1 && (
                                <motion.div
                                    initial={{ scale: 0, rotate: -45 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    className={`absolute -top-4 -left-4 ${isGrid ? 'w-10 h-10' : 'w-16 h-16'} bg-white rounded-full flex items-center justify-center shadow-2xl z-20 border-2 border-blue-500`}
                                >
                                    <i className={`fa-solid fa-table-tennis-paddle-ball text-slate-900 ${isGrid ? 'text-lg' : 'text-3xl'}`}></i>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    {formatName(p1?.name || 'BEN JOHNS', 'left')}
                </div>

                {/* CENTER AREA: SCORES & TIMER */}
                <div className="flex flex-col items-center flex-1">
                    {/* Timer Area */}
                    <div className={`flex items-center gap-6 md:gap-12 mb-8 md:mb-16 ${isGrid ? 'scale-75' : 'scale-100'}`}>
                        <div className="flex items-center gap-4">
                            <i className="fa-regular fa-clock text-blue-400 text-3xl"></i>
                            <span className="text-4xl font-bold tabular-nums text-white">
                                {(() => {
                                    if (!match.started_at) return "00:00";
                                    const diff = Math.floor((now.getTime() - new Date(match.started_at).getTime()) / 1000);
                                    const m = Math.floor(diff / 60);
                                    const s = diff % 60;
                                    return `${m}:${s.toString().padStart(2, '0')}`;
                                })()}
                            </span>
                            {!isGrid && <span className="text-xs font-black uppercase tracking-widest text-white/40 ml-2">Match Duration</span>}
                        </div>
                        {!isGrid && <div className="w-[1px] h-8 bg-white/20"></div>}
                        {!isGrid && (
                            <div className="flex items-center gap-4">
                                <i className="fa-solid fa-earth-asia text-blue-400 text-3xl"></i>
                                <span className="text-4xl font-bold tabular-nums text-blue-400">
                                    {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </span>
                                <span className="text-xs font-black uppercase tracking-widest text-blue-400/40 ml-2">Local Time</span>
                            </div>
                        )}
                    </div>

                    {/* CURRENT SCORE BAR */}
                    <div className="flex flex-col items-center w-full max-w-md">
                        <div className="text-xl font-black uppercase tracking-[0.3em] text-white/80 mb-6">GAME {currentSetNum}</div>

                        <div className="flex items-center justify-between w-full mb-4 px-4 gap-4">
                            <span className={`${mainScoreSize} leading-none font-black drop-shadow-2xl transition-all duration-300`}>{match.current_score_p1}</span>
                            <div className="flex-1 px-4 lg:px-8">
                                <div className="h-4 lg:h-6 w-full rounded-full bg-white/10 overflow-hidden flex shadow-inner border border-white/5">
                                    <div
                                        className="h-full bg-blue-600 transition-all duration-500"
                                        style={{ width: `${(match.current_score_p1 / (Math.max(match.current_score_p1 + match.current_score_p2, 1))) * 100}%` }}
                                    ></div>
                                    <div
                                        className="h-full bg-green-500 transition-all duration-500"
                                        style={{ width: `${(match.current_score_p2 / (Math.max(match.current_score_p1 + match.current_score_p2, 1))) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                            <span className={`${mainScoreSize} leading-none font-black drop-shadow-2xl transition-all duration-300`}>{match.current_score_p2}</span>
                        </div>
                    </div>

                    {/* SET HISTORY PILLS */}
                    <div className={`flex gap-4 md:gap-12 mt-6 md:mt-12 ${isGrid ? 'scale-90' : 'scale-100'}`}>
                        {setHistory.map((set, idx) => (
                            <div key={idx} className="flex gap-2">
                                <div className={`${setPillSize} rounded-full flex items-center justify-center font-black border-2 ${set.p1 > set.p2 ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-700/50 border-white/10 text-white/50'}`}>
                                    {set.p1}
                                </div>
                                <div className={`${setPillSize} rounded-full flex items-center justify-center font-black border-2 ${set.p2 > set.p1 ? 'bg-green-600 border-green-400 text-white' : 'bg-slate-700/50 border-white/10 text-white/50'}`}>
                                    {set.p2}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* H2H Badge */}
                    <div className={`mt-8 md:mt-16 px-6 md:px-12 py-2 md:py-3 bg-blue-800 rounded-full font-black text-lg md:text-2xl tracking-widest shadow-xl cursor-default hover:scale-110 transition-transform uppercase ${isGrid ? 'scale-75 origin-top' : ''}`}>
                        Pickleball Tour
                    </div>
                </div>

                {/* RIGHT PLAYER */}
                <div className="flex flex-col items-center w-1/3">
                    <div className="relative mb-6 md:mb-10">
                        {/* Border Glow */}
                        <div className="absolute inset-[-10px] rounded-full bg-green-500/30 blur-2xl animate-pulse"></div>

                        {/* Avatar Circle */}
                        <div className={`${avatarSize} rounded-full border-[6px] border-green-500 p-2 relative z-10 bg-slate-900 overflow-hidden shadow-[0_0_40px_rgba(34,197,94,0.4)] transition-all duration-500`}>
                            <img
                                src={p2?.avatar_url || 'https://via.placeholder.com/400x400?text=P2'}
                                className="w-full h-full object-cover rounded-full"
                                alt="P2"
                            />
                        </div>

                        {/* Circular Flag Badge */}
                        <div className={`absolute bottom-2 left-2 ${isGrid ? 'w-10 h-10 border-2' : 'w-16 h-16 border-4'} rounded-full border-slate-950 bg-white overflow-hidden z-20 shadow-xl`}>
                            <img src={p2?.country_code || "https://flagcdn.com/ca.svg"} className="w-full h-full object-cover scale-110" alt="P2 Flag" />
                        </div>

                        {/* Serving Indicator */}
                        <AnimatePresence>
                            {isServingP2 && (
                                <motion.div
                                    initial={{ scale: 0, rotate: 45 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    className={`absolute -top-4 -left-4 ${isGrid ? 'w-10 h-10' : 'w-16 h-16'} bg-white rounded-full flex items-center justify-center shadow-2xl z-20 border-2 border-green-500`}
                                >
                                    <i className={`fa-solid fa-table-tennis-paddle-ball text-slate-900 ${isGrid ? 'text-lg' : 'text-3xl'}`}></i>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    {formatName(p2?.name || 'TYSON MCGUFFIN', 'right')}
                </div>
            </div>

            {/* --- AD BANNER / FOOTER (SUBTLE) --- */}
            <div className={`absolute bottom-8 left-0 right-0 ${isGrid ? 'px-8' : 'px-20'} flex justify-between items-end opacity-40`}>
                <div className="flex items-center gap-4">
                    <span className="font-bold text-xs">PPA OFFICIAL PARTNER</span>
                </div>
                {!isGrid && (
                    <div className="text-right">
                        {logoUrl ? (
                            <div className="flex flex-col items-end">
                                <img src={logoUrl} className="h-12 w-auto object-contain" alt="Tournament Logo" />
                                <div className="text-[8px] tracking-[0.4em] uppercase opacity-50 mt-1">Tournament Series</div>
                            </div>
                        ) : (
                            <>
                                <div className="text-blue-400 font-black italic text-2xl">ZTO ARENA</div>
                                <div className="text-[8px] tracking-[0.4em] uppercase opacity-50">Scoreboard System</div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default PickleballCard;
