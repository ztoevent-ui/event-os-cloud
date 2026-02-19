import React from 'react';
import { Player, Match, SponsorAd } from '@/lib/sports/types';
import { motion, AnimatePresence } from 'framer-motion';

interface MatchCardProps {
    match: Match;
    p1: Player | undefined;
    p2: Player | undefined;
    activeAd?: SponsorAd;
    logoUrl?: string; // NEW
    bgUrl?: string; // NEW
    now: Date;
}

export function BadmintonCard({ match, p1, p2, activeAd, logoUrl, bgUrl, now }: MatchCardProps) {
    const isServingP1 = match.serving_player_id === p1?.id;
    const isServingP2 = match.serving_player_id === p2?.id;

    // Helper to format name as per screenshot (split rows)
    const formatName = (name: string = 'TBD', alignment: 'left' | 'right' = 'left') => {
        const parts = name.split(' ');
        const lastName = parts[parts.length - 1];
        const firstNames = parts.slice(0, -1).join(' ');

        if (alignment === 'left') {
            return (
                <div className="flex flex-col items-center">
                    <span className="text-4xl font-black uppercase tracking-widest leading-tight">{lastName}</span>
                    <span className="text-2xl font-medium text-white/80 leading-tight">{firstNames}</span>
                </div>
            );
        } else {
            return (
                <div className="flex flex-col items-center">
                    <span className="text-2xl font-medium text-white/80 leading-tight">{firstNames}</span>
                    <span className="text-4xl font-black uppercase tracking-widest leading-tight">{lastName}</span>
                </div>
            );
        }
    };

    // Calculate historical set scores
    const setHistory = match.periods_scores || [];
    const currentSetNum = setHistory.length + 1;

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
                    src={bgUrl || "https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=2600&auto=format&fit=crop"}
                    className="w-full h-full object-cover opacity-60 grayscale-[0.5]"
                    alt="Background"
                />
            </div>

            {/* --- ARENA CONTENT --- */}
            <div className="relative z-20 w-full max-w-7xl flex items-center justify-between px-20">

                {/* LEFT PLAYER: CHEAH */}
                <div className="flex flex-col items-center w-1/3">
                    <div className="relative mb-10">
                        {/* Border Glow */}
                        <div className="absolute inset-[-10px] rounded-full bg-orange-500/30 blur-2xl animate-pulse"></div>

                        {/* Avatar Circle */}
                        <div className="w-64 h-64 rounded-full border-[6px] border-[#fbb312] p-2 relative z-10 bg-slate-900 overflow-hidden shadow-[0_0_40px_rgba(251,179,18,0.4)]">
                            <img
                                src={p1?.avatar_url || 'https://via.placeholder.com/400x400?text=P1'}
                                className="w-full h-full object-cover rounded-full"
                                alt="P1"
                            />
                        </div>

                        {/* Circular Flag Badge */}
                        <div className="absolute bottom-2 left-2 w-16 h-16 rounded-full border-4 border-slate-950 bg-white overflow-hidden z-20 shadow-xl">
                            <img src={p1?.country_code || "https://flagcdn.com/my.svg"} className="w-full h-full object-cover scale-110" alt="P1 Flag" />
                        </div>

                        {/* Serving Indicator (Shuttlecock) */}
                        <AnimatePresence>
                            {isServingP1 && (
                                <motion.div
                                    initial={{ scale: 0, rotate: -45 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    className="absolute -top-4 -left-4 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl z-20 border-2 border-orange-500"
                                >
                                    <i className="fa-solid fa-shuttlecock text-slate-900 text-3xl"></i>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    {formatName(p1?.name || 'CHEAH Liek Hou', 'left')}
                </div>

                {/* CENTER AREA: SCORES & TIMER */}
                <div className="flex flex-col items-center flex-1">
                    {/* Timer Area */}
                    <div className="flex items-center gap-12 mb-16">
                        <div className="flex items-center gap-4">
                            <i className="fa-regular fa-clock text-white text-3xl"></i>
                            <span className="text-4xl font-bold tabular-nums text-white">
                                {(() => {
                                    if (!match.started_at) return "00:00";
                                    const diff = Math.floor((now.getTime() - new Date(match.started_at).getTime()) / 1000);
                                    const m = Math.floor(diff / 60);
                                    const s = diff % 60;
                                    return `${m}:${s.toString().padStart(2, '0')}`;
                                })()}
                            </span>
                            <span className="text-xs font-black uppercase tracking-widest text-white/40 ml-2">Match Duration</span>
                        </div>
                        <div className="w-[1px] h-8 bg-white/20"></div>
                        <div className="flex items-center gap-4">
                            <i className="fa-solid fa-earth-asia text-zto-gold text-3xl"></i>
                            <span className="text-4xl font-bold tabular-nums text-zto-gold">
                                {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </span>
                            <span className="text-xs font-black uppercase tracking-widest text-zto-gold/40 ml-2">Local Time</span>
                        </div>
                    </div>

                    {/* CURRENT SCORE BAR */}
                    <div className="flex flex-col items-center w-full max-w-md">
                        <div className="text-xl font-black uppercase tracking-[0.3em] text-white/80 mb-6">GAME {currentSetNum}</div>

                        <div className="flex items-center justify-between w-full mb-4 px-4">
                            <span className="text-[10rem] leading-none font-black drop-shadow-2xl">{match.current_score_p1}</span>
                            <div className="flex-1 px-8">
                                <div className="h-6 w-full rounded-full bg-white/10 overflow-hidden flex shadow-inner border border-white/5">
                                    <div
                                        className="h-full bg-orange-500 transition-all duration-500"
                                        style={{ width: `${(match.current_score_p1 / (Math.max(match.current_score_p1 + match.current_score_p2, 1))) * 100}%` }}
                                    ></div>
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-500"
                                        style={{ width: `${(match.current_score_p2 / (Math.max(match.current_score_p1 + match.current_score_p2, 1))) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                            <span className="text-[10rem] leading-none font-black drop-shadow-2xl">{match.current_score_p2}</span>
                        </div>
                    </div>

                    {/* SET HISTORY PILLS */}
                    <div className="flex gap-12 mt-12">
                        {setHistory.map((set, idx) => (
                            <div key={idx} className="flex gap-4">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl font-black border-2 ${set.p1 > set.p2 ? 'bg-orange-500 border-orange-400 text-white shadow-[0_0_20px_rgba(249,115,22,0.5)]' : 'bg-slate-700/50 border-white/10 text-white/50'}`}>
                                    {set.p1}
                                </div>
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl font-black border-2 ${set.p2 > set.p1 ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-slate-700/50 border-white/10 text-white/50'}`}>
                                    {set.p2}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* H2H Badge */}
                    <div className="mt-16 px-12 py-3 bg-red-600 rounded-full font-black text-2xl tracking-widest shadow-xl cursor-default hover:scale-110 transition-transform">
                        H2H
                    </div>
                </div>

                {/* RIGHT PLAYER: IMAI */}
                <div className="flex flex-col items-center w-1/3">
                    <div className="relative mb-10">
                        {/* Border Glow */}
                        <div className="absolute inset-[-10px] rounded-full bg-blue-500/30 blur-2xl animate-pulse"></div>

                        {/* Avatar Circle */}
                        <div className="w-64 h-64 rounded-full border-[6px] border-[#3b82f6] p-2 relative z-10 bg-slate-900 overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.4)]">
                            <img
                                src={p2?.avatar_url || 'https://via.placeholder.com/400x400?text=P2'}
                                className="w-full h-full object-cover rounded-full scale-110 object-top"
                                alt="P2"
                            />
                        </div>

                        {/* Circular Flag Badge */}
                        <div className="absolute bottom-2 left-2 w-16 h-16 rounded-full border-4 border-slate-950 bg-white overflow-hidden z-20 shadow-xl">
                            <img src={p2?.country_code || "https://flagcdn.com/jp.svg"} className="w-full h-full object-cover scale-110" alt="P2 Flag" />
                        </div>

                        {/* Serving Indicator (Shuttlecock) */}
                        <AnimatePresence>
                            {isServingP2 && (
                                <motion.div
                                    initial={{ scale: 0, rotate: 45 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    className="absolute -top-4 -left-4 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl z-20 border-2 border-blue-500"
                                >
                                    <i className="fa-solid fa-shuttlecock text-slate-900 text-3xl"></i>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Net/Grip Icon (Visual only) */}
                        <div className="absolute -top-2 -right-2 w-16 h-16 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center z-10">
                            <i className="fa-solid fa-table-cells text-white/20 text-3xl"></i>
                        </div>
                    </div>
                    {formatName(p2?.name || 'Taiyo IMAI', 'right')}
                </div>
            </div>

            {/* --- AD BANNER / FOOTER (SUBTLE) --- */}
            <div className="absolute bottom-8 left-0 right-0 px-20 flex justify-between items-end opacity-40">
                <div className="flex items-center gap-4">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/1/1a/HSBC_logo_%282018%29.svg" className="h-4 grayscale invert" alt="HSBC" />
                    <span className="font-bold text-xs">OFFICIAL PARTNER</span>
                </div>
                <div className="text-right">
                    {logoUrl ? (
                        <div className="flex flex-col items-end">
                            <img src={logoUrl} className="h-12 w-auto object-contain" alt="Tournament Logo" />
                            <div className="text-[8px] tracking-[0.4em] uppercase opacity-50 mt-1">Tournament Series</div>
                        </div>
                    ) : (
                        <>
                            <div className="text-zto-gold font-black italic text-2xl">ZTO ARENA</div>
                            <div className="text-[8px] tracking-[0.4em] uppercase opacity-50">Scoreboard System</div>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

