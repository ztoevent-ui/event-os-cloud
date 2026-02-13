import React from 'react';
import { Player, Match, SponsorAd } from '@/lib/sports/types';
import { motion } from 'framer-motion';

interface TennisCardProps {
    match: Match;
    p1: Player | undefined;
    p2: Player | undefined;
    activeAd?: SponsorAd;
}

export function TennisCard({ match, p1, p2, activeAd }: TennisCardProps) {
    const isServingP1 = match.serving_player_id === p1?.id;
    const isServingP2 = match.serving_player_id === p2?.id;

    // -------------------------------------------------------------
    // Tennis Scoring Logic Helper
    // -------------------------------------------------------------
    const getTennisScore = (p1Points: number, p2Points: number) => {
        // Standard game points
        const pointsMap = [0, 15, 30, 40];

        // Deuce / Advantage Logic
        if (p1Points >= 3 && p2Points >= 3) {
            if (p1Points === p2Points) return { s1: '40', s2: '40', label: 'DEUCE' };
            if (p1Points > p2Points) return { s1: 'Ad', s2: '40', label: 'ADV P1' };
            return { s1: '40', s2: 'Ad', label: 'ADV P2' };
        }

        // Standard
        return {
            s1: pointsMap[p1Points] || pointsMap[3],
            s2: pointsMap[p2Points] || pointsMap[3],
            label: null
        };
    };

    const { s1, s2, label } = getTennisScore(match.current_score_p1, match.current_score_p2);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-full h-[85vh] bg-[#1a472a] rounded-3xl overflow-hidden shadow-2xl flex flex-col font-sans border-4 border-[#2d6a4f]"
        >
            {/* Background: Wimbledon Green */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a472a] to-[#0f2e1b]"></div>

            {/* Texture: Tennis Ball Fuzz or Court Lines */}
            <div className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
                    backgroundSize: '10px 10px'
                }}
            ></div>

            {/* --- HEADER: Tournament Info --- */}
            <div className="relative z-10 w-full text-center pt-8 pb-4">
                <div className="inline-block bg-white/90 px-8 py-2 rounded-sm shadow-lg border-b-4 border-purple-900">
                    <span className="text-purple-900 font-bold uppercase tracking-[0.2em] text-sm">ZTO GRAND SLAM • FINAL</span>
                </div>
            </div>

            {/* --- MAIN SPLIT LAYOUT --- */}
            <div className="flex-1 flex relative z-10">

                {/* PLAYER 1 (Left) */}
                <div className="flex-1 flex flex-col items-center justify-center relative">
                    <div className="w-64 h-64 rounded-full overflow-hidden border-8 border-white/10 shadow-2xl relative mb-8">
                        <img src={p1?.avatar_url} className="w-full h-full object-cover" alt="P1" />
                        {isServingP1 && (
                            <div className="absolute inset-0 bg-yellow-400/20 animate-pulse border-4 border-yellow-400 rounded-full"></div>
                        )}
                    </div>
                    <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-2">{p1?.name}</h2>
                    <div className="flex items-center gap-2">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b9/Flag_of_Australia.svg" className="w-8 h-6 object-cover shadow-sm" alt="Flag" />
                        <span className="text-white/60 font-bold tracking-widest text-sm">AUS</span>
                    </div>

                    {isServingP1 && (
                        <div className="mt-8 bg-yellow-400 text-black px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest animate-bounce">
                            • SERVING •
                        </div>
                    )}
                </div>

                {/* CENTER SCOREBOARD (Vertical Strip) */}
                <div className="w-64 h-full bg-black/20 backdrop-blur-sm border-x border-white/10 flex flex-col pt-12">
                    {/* SETS HISTORY */}
                    <div className="flex justify-center gap-4 mb-8 text-white/50 font-bold text-xl font-mono">
                        <div className="flex flex-col items-center">
                            <span className="text-xs uppercase tracking-widest mb-1">Sets</span>
                            <div className="flex gap-4">
                                <span className={match.sets_p1 > match.sets_p2 ? 'text-white' : ''}>{match.sets_p1}</span>
                                <span className="text-white/20">-</span>
                                <span className={match.sets_p2 > match.sets_p1 ? 'text-white' : ''}>{match.sets_p2}</span>
                            </div>
                        </div>
                    </div>

                    {/* CURRENT GAME POINTS */}
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <div className="text-8xl font-black text-yellow-400 tabular-nums leading-none drop-shadow-lg scale-125">
                            {s1}
                        </div>
                        <div className="w-12 h-px bg-white/20"></div>
                        <div className="text-8xl font-black text-white tabular-nums leading-none drop-shadow-lg">
                            {s2}
                        </div>
                        {label && (
                            <div className="mt-4 bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-widest rounded animate-pulse">
                                {label}
                            </div>
                        )}
                    </div>
                </div>

                {/* PLAYER 2 (Right) */}
                <div className="flex-1 flex flex-col items-center justify-center relative">
                    <div className="w-64 h-64 rounded-full overflow-hidden border-8 border-white/10 shadow-2xl relative mb-8">
                        <img src={p2?.avatar_url} className="w-full h-full object-cover" alt="P2" />
                        {isServingP2 && (
                            <div className="absolute inset-0 bg-yellow-400/20 animate-pulse border-4 border-yellow-400 rounded-full"></div>
                        )}
                    </div>
                    <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-2">{p2?.name}</h2>
                    <div className="flex items-center gap-2">
                        <img src="https://upload.wikimedia.org/wikipedia/en/9/9e/Flag_of_Japan.svg" className="w-8 h-6 object-cover shadow-sm border border-white/10" alt="Flag" />
                        <span className="text-white/60 font-bold tracking-widest text-sm">JPN</span>
                    </div>

                    {isServingP2 && (
                        <div className="mt-8 bg-yellow-400 text-black px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest animate-bounce">
                            • SERVING •
                        </div>
                    )}
                </div>

            </div>

            {/* --- FOOTER: SPONSORS (Purple/Green Theme) --- */}
            <div className="h-24 bg-purple-900 border-t-4 border-white/20 flex items-center justify-between px-12 relative z-20">
                <div className="flex items-center gap-8 opacity-50 grayscale hover:grayscale-0 transition duration-500">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg" className="h-8 brightness-200" alt="Nike" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg" className="h-6 brightness-200" alt="Samsung" />
                </div>

                {activeAd && (
                    <div className="h-full py-2 w-[300px]">
                        {activeAd.type === 'video' ? (
                            <video src={activeAd.url} autoPlay muted loop className="w-full h-full object-cover rounded-lg border border-white/20" />
                        ) : (
                            <img src={activeAd.url} className="w-full h-full object-contain bg-white rounded-lg p-2" alt="Ad" />
                        )}
                    </div>
                )}

                <div className="text-right">
                    <span className="text-white/40 text-xs font-bold uppercase tracking-widest block">Official Time</span>
                    <span className="text-white font-mono text-xl">16:42 PM</span>
                </div>
            </div>

        </motion.div>
    );
}
