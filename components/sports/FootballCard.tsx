import React, { useEffect, useState } from 'react';
import { Player, Match, SponsorAd } from '@/lib/sports/types';
import { motion } from 'framer-motion';

interface FootballCardProps {
    match: Match;
    p1: Player | undefined;
    p2: Player | undefined;
    activeAd?: SponsorAd;
}

export function FootballCard({ match, p1, p2, activeAd }: FootballCardProps) {
    // -------------------------------------------------------------
    // Timer Logic (Count Up for Football)
    // -------------------------------------------------------------
    const [timeElapsed, setTimeElapsed] = useState(match.timer_seconds || 0);
    const isPaused = match.is_paused ?? true;

    // Auto-countup simulation if playing
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (!isPaused) {
            timer = setInterval(() => {
                setTimeElapsed(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isPaused]);

    // Format mm:ss
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Period Labels
    const getPeriodLabel = (period: number) => {
        if (period === 1) return '1ST HALF';
        if (period === 2) return '2ND HALF';
        if (period === 3) return 'ET 1';
        if (period === 4) return 'ET 2';
        return 'FT';
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-full h-[85vh] bg-emerald-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col font-sans border-4 border-white/10"
        >
            {/* Background Stadium Atmosphere */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-emerald-900/90 mix-blend-multiply"></div>
                {/* Grass Pattern */}
                <div className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #ffffff 20px, transparent 21px), repeating-linear-gradient(90deg, transparent, transparent 49px, #000 50px, transparent 51px)',
                        backgroundSize: '100px 100px'
                    }}>
                </div>
                {/* Center Circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vh] h-[40vh] border-4 border-white/10 rounded-full"></div>
            </div>

            {/* --- TOP SCOREBOARD BAR (Premier League Style) --- */}
            <div className="h-[20%] w-full flex items-center justify-center relative z-20 pt-8">
                <div className="flex items-stretch bg-white rounded-lg overflow-hidden shadow-2xl h-24 min-w-[800px]">

                    {/* Home Team */}
                    <div className="flex-1 flex items-center justify-end px-6 gap-4 bg-gradient-to-r from-gray-100 to-white">
                        <span className="text-3xl font-black uppercase text-gray-900 tracking-tighter">{p1?.name || 'HOME'}</span>
                        <div className="w-16 h-16 relative">
                            <img src={p1?.avatar_url || 'https://via.placeholder.com/100'} className="w-full h-full object-contain" alt="Home" />
                        </div>
                    </div>

                    {/* Score Box */}
                    <div className="w-32 bg-emerald-600 flex items-center justify-center text-white text-5xl font-black relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/10 transform skew-x-12"></div>
                        <span className="relative z-10">{match.current_score_p1} - {match.current_score_p2}</span>
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 flex items-center justify-start px-6 gap-4 bg-gradient-to-l from-gray-100 to-white">
                        <div className="w-16 h-16 relative">
                            <img src={p2?.avatar_url || 'https://via.placeholder.com/100'} className="w-full h-full object-contain" alt="Away" />
                        </div>
                        <span className="text-3xl font-black uppercase text-gray-900 tracking-tighter">{p2?.name || 'AWAY'}</span>
                    </div>
                </div>

                {/* Time Droplet */}
                <div className="absolute top-[85%] bg-black text-white px-6 py-1 rounded-b-lg font-mono font-bold text-xl tracking-widest shadow-lg border-t-2 border-emerald-500">
                    {formatTime(timeElapsed)}
                    <span className="text-emerald-500 ml-2 text-xs">{getPeriodLabel(match.current_period || 1)}</span>
                </div>
            </div>

            {/* --- MAIN ACTION AREA --- */}
            <div className="flex-1 relative z-10 flex items-end justify-between px-20 pb-12">
                {/* Team Colors / Kits Mockup (Left) */}
                <div className="relative group">
                    <div className="w-64 h-80 bg-gradient-to-t from-black/50 to-transparent rounded-t-3xl flex items-end justify-center pb-4 backdrop-blur-sm border border-white/10">
                        {/* Placeholder for Kit */}
                        <i className="fa-solid fa-shirt text-9xl text-white drop-shadow-xl opacity-80 group-hover:scale-110 transition duration-500"></i>
                    </div>
                    <div className="text-center mt-2">
                        <div className="text-white font-bold text-xl uppercase tracking-widest">{p1?.name}</div>
                        <div className="text-emerald-400 text-xs font-bold uppercase">Home Kit</div>
                    </div>
                </div>

                {/* Match Events / Feed (Center) */}
                <div className="flex-1 max-w-2xl mx-12 bg-black/40 backdrop-blur-md rounded-xl p-6 border border-white/5 h-64 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
                    <h3 className="text-white/50 font-bold uppercase text-xs tracking-widest mb-4">Live Match Feed</h3>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 text-white animate-pulse">
                            <span className="font-mono text-emerald-400 font-bold">{formatTime(timeElapsed)}</span>
                            <i className="fa-solid fa-futbol text-white"></i>
                            <span className="font-bold">Match is live!</span>
                        </div>
                        {match.timer_seconds && match.timer_seconds > 60 && (
                            <div className="flex items-center gap-4 text-white/80">
                                <span className="font-mono text-gray-400 font-bold">01:00</span>
                                <i className="fa-regular fa-flag text-yellow-500"></i>
                                <span>Kick off - First Half</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Team Colors / Kits Mockup (Right) */}
                <div className="relative group">
                    <div className="w-64 h-80 bg-gradient-to-t from-black/50 to-transparent rounded-t-3xl flex items-end justify-center pb-4 backdrop-blur-sm border border-white/10">
                        {/* Placeholder for Kit */}
                        <i className="fa-solid fa-shirt text-9xl text-blue-500 drop-shadow-xl opacity-80 group-hover:scale-110 transition duration-500"></i>
                    </div>
                    <div className="text-center mt-2">
                        <div className="text-white font-bold text-xl uppercase tracking-widest">{p2?.name}</div>
                        <div className="text-blue-400 text-xs font-bold uppercase">Away Kit</div>
                    </div>
                </div>
            </div>

            {/* --- AD BANNER (Floating) --- */}
            {activeAd && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[600px] h-[100px] bg-white rounded-full shadow-2xl flex items-center justify-center overflow-hidden border-4 border-emerald-900/50">
                    {activeAd.type === 'video' ? (
                        <video src={activeAd.url} autoPlay muted loop className="w-full h-full object-cover" />
                    ) : (
                        <img src={activeAd.url} className="w-full h-full object-contain p-4" alt="Ad" />
                    )}
                </div>
            )}
        </motion.div>
    );
}

export default FootballCard;
