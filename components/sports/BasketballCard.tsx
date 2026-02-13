import React, { useEffect, useState } from 'react';
import { Player, Match, SponsorAd } from '@/lib/sports/types';
import { motion } from 'framer-motion';

interface BasketballCardProps {
    match: Match;
    p1: Player | undefined;
    p2: Player | undefined;
    activeAd?: SponsorAd;
}

export function BasketballCard({ match, p1, p2, activeAd }: BasketballCardProps) {
    // -------------------------------------------------------------
    // Timer Logic
    // -------------------------------------------------------------
    const [timeLeft, setTimeLeft] = useState(match.timer_seconds || 720); // Default 12 min
    const isPaused = match.is_paused ?? true;

    // Auto-countdown simulation if playing
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (!isPaused && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => Math.max(0, prev - 1));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isPaused, timeLeft]);

    // Format mm:ss
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Period Labels (Q1, Q2, H1, etc.)
    const periodLabel = `Q${match.current_period || 1}`;

    // -------------------------------------------------------------
    // Visuals: NBA / ESPN Style (High Contrast, Bold Fonts)
    // -------------------------------------------------------------

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-full h-[85vh] bg-black text-white rounded-3xl overflow-hidden shadow-2xl flex flex-col font-sans border-4 border-orange-600/20"
        >
            {/* --- TOP HEADER (Scoreboard) --- */}
            <div className="h-[25%] bg-zinc-900 border-b border-white/10 flex items-center justify-between px-12 relative z-20">
                {/* Home Team */}
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-orange-600 p-1 overflow-hidden shadow-lg shadow-orange-600/20 border border-white/20">
                        <img src={p1?.avatar_url || 'https://via.placeholder.com/100'} className="w-full h-full object-cover rounded-full" alt="Home" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter text-white">{p1?.name || 'HOME'}</h2>
                        <div className="text-orange-500 font-bold tracking-widest text-sm">HOME</div>
                    </div>
                </div>

                {/* Score & Timer Center */}
                <div className="flex bg-black px-12 py-4 rounded-xl border border-white/10 shadow-2xl items-center gap-12">
                    <div className="text-8xl font-black text-orange-500 tabular-nums leading-none tracking-tighter drop-shadow-[0_0_10px_rgba(234,88,12,0.8)]">
                        {match.current_score_p1}
                    </div>

                    <div className="flex flex-col items-center">
                        <div className={`text-5xl font-mono font-bold tracking-widest ${isPaused ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
                            {formatTime(timeLeft)}
                        </div>
                        <div className="text-white/40 font-bold uppercase tracking-widest text-sm mt-2">{periodLabel}</div>
                    </div>

                    <div className="text-8xl font-black text-white tabular-nums leading-none tracking-tighter">
                        {match.current_score_p2}
                    </div>
                </div>

                {/* Away Team */}
                <div className="flex items-center gap-6 text-right">
                    <div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter text-white">{p2?.name || 'AWAY'}</h2>
                        <div className="text-blue-500 font-bold tracking-widest text-sm">AWAY</div>
                    </div>
                    <div className="w-24 h-24 rounded-full bg-blue-600 p-1 overflow-hidden shadow-lg shadow-blue-600/20 border border-white/20">
                        <img src={p2?.avatar_url || 'https://via.placeholder.com/100'} className="w-full h-full object-cover rounded-full" alt="Away" />
                    </div>
                </div>
            </div>

            {/* --- MAIN STAGE (Players / Action) --- */}
            <div className="flex-1 relative bg-gradient-to-br from-zinc-900 via-black to-zinc-900 overflow-hidden flex items-end justify-center">
                {/* Court Graphic Floor */}
                <div className="absolute inset-0 opacity-20 transform perspective-1000 rotate-x-60 scale-150 origin-bottom"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(90deg, transparent 0, transparent 49%, #fff 50%, transparent 51%), repeating-linear-gradient(180deg, #333 0, #333 49%, #444 50%, #333 51%)',
                        backgroundSize: '100px 100px'
                    }}>
                </div>

                {/* Hero Images Facing Off */}
                <div className="absolute bottom-0 left-[15%] h-[90%] w-[40%]">
                    <img src={p1?.avatar_url} className="w-full h-full object-contain object-bottom drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] mask-linear-fade" alt="" />
                </div>
                <div className="absolute bottom-0 right-[15%] h-[90%] w-[40%] transform scale-x-[-1]">
                    <img src={p2?.avatar_url} className="w-full h-full object-contain object-bottom drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] mask-linear-fade" alt="" />
                </div>

                {/* VS Overlay */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <span className="text-[200px] font-black text-white/5 italic tracking-tighter select-none">VS</span>
                </div>
            </div>

            {/* --- BOTTOM TICKER / AD --- */}
            <div className="h-[15%] bg-black border-t border-white/10 flex items-center justify-between px-8 relative z-20">
                {/* Stats */}
                <div className="flex gap-8 text-white/60 text-sm font-bold uppercase tracking-widest">
                    <span>Fouls: {match.sets_p1} - {match.sets_p2}</span>
                    <span>Timeouts: 3 - 2</span>
                </div>

                {activeAd && (
                    <div className="h-full py-2 flex-1 flex justify-center">
                        <div className="h-full aspect-[4/1] bg-white rounded flex items-center justify-center overflow-hidden">
                            {activeAd.type === 'video' ? (
                                <video src={activeAd.url} autoPlay muted loop className="w-full h-full object-cover" />
                            ) : (
                                <img src={activeAd.url} className="w-full h-full object-contain p-2" alt="Ad" />
                            )}
                        </div>
                    </div>
                )}

                {/* Branding */}
                <div className="text-right">
                    <div className="text-orange-500 font-black italic text-xl">ZTO BALL</div>
                    <div className="text-white/20 text-xs uppercase tracking-wider">Official Timing</div>
                </div>
            </div>
        </motion.div>
    );
}

export default BasketballCard;
