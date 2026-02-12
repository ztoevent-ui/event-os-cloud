import React from 'react';
import { Player, Match, SponsorAd } from '@/lib/sports/types';
import { motion } from 'framer-motion';

interface MatchCardProps {
    match: Match;
    p1: Player | undefined;
    p2: Player | undefined;
    activeAd?: SponsorAd;
}

export function MatchCard({ match, p1, p2, activeAd }: MatchCardProps) {
    const isServingP1 = match.serving_player_id === p1?.id;
    const isServingP2 = match.serving_player_id === p2?.id;

    // Enhanced Professional "TV Broadcast" Style Card
    // Professional "Split Zone" Layout (Top: Visuals, Bottom: Data)
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-full h-[85vh] bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col font-sans"
        >
            {/* ---------------- ZONE A: VISUALS (Top 70%) ---------------- */}
            <div className="h-[70%] flex relative">
                {/* Divide Line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent z-10"></div>

                {/* Left: Player 1 Image */}
                <div className="w-1/2 h-full relative overflow-hidden">
                    <img
                        src={p1?.avatar_url || 'https://via.placeholder.com/400x800'}
                        alt="P1"
                        className="w-full h-full object-cover object-top hover:scale-105 transition duration-1000 ease-in-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                </div>

                {/* Right: Player 2 Image */}
                <div className="w-1/2 h-full relative overflow-hidden">
                    <img
                        src={p2?.avatar_url || 'https://via.placeholder.com/400x800'}
                        alt="P2"
                        className="w-full h-full object-cover object-top hover:scale-105 transition duration-1000 ease-in-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                </div>

                {/* Round Badge (Floating Top Center) */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur border border-white/10 px-6 py-2 rounded-full z-20 shadow-xl">
                    <span className="text-zto-gold font-bold tracking-[0.3em] text-sm uppercase">{match.round_name}</span>
                </div>
            </div>

            {/* ---------------- ZONE B: DATA DASHBOARD (Bottom 35%) ---------------- */}
            <div className="h-[35%] bg-zinc-950 border-t-4 border-zto-gold flex relative z-30 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
                {/* Background Texture */}
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:4px_4px]"></div>

                {/* Left: P1 Info (Symmetrical) */}
                <div className="flex-1 flex flex-col items-center justify-start pt-10 border-r border-white/5 relative h-full">
                    {isServingP1 && <div className="mb-4 text-black bg-zto-gold px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest animate-pulse shadow-lg shadow-zto-gold/50">Serving</div>}
                    <h2 className="text-3xl xl:text-5xl font-black text-white uppercase italic tracking-tighter text-center leading-none drop-shadow-lg">
                        {p1?.name?.split(' ')[0]}<br />
                        <span className="text-white/40 text-2xl xl:text-4xl">{p1?.name?.split(' ').slice(1).join(' ')}</span>
                    </h2>
                    <div className="mt-4 text-white/20 font-bold text-sm tracking-widest">MALAYSIA</div>
                </div>

                {/* Center: THE SCOREBOARD + PRIME AD SLOT */}
                <div className="w-[40%] flex flex-col items-center relative h-full bg-white/5 backdrop-blur-sm pt-6 px-4">
                    {/* Scores */}
                    <div className="flex items-center gap-8 mb-2">
                        <div className={`text-6xl xl:text-8xl font-black tabular-nums tracking-tighter leading-none ${match.current_score_p1 > match.current_score_p2 ? 'text-white scale-110' : 'text-zinc-600'}`}>
                            {match.current_score_p1}
                        </div>
                        <div className="h-16 w-px bg-white/10"></div>
                        <div className={`text-6xl xl:text-8xl font-black tabular-nums tracking-tighter leading-none ${match.current_score_p2 > match.current_score_p1 ? 'text-white scale-110' : 'text-zinc-600'}`}>
                            {match.current_score_p2}
                        </div>
                    </div>

                    {/* Sets Info Line */}
                    <div className="flex items-center gap-4 w-full justify-center mb-4">
                        <span className="text-zto-gold font-bold text-xs uppercase">Set: {match.sets_p1}</span>
                        <span className="bg-green-500/10 text-green-500 px-2 py-0.5 rounded text-[10px] tracking-widest border border-green-500/20">{match.status}</span>
                        <span className="text-zto-gold font-bold text-xs uppercase">Set: {match.sets_p2}</span>
                    </div>

                    {/* --- CENTER PRIME AD SLOT --- */}
                    <div className="w-full max-w-[300px] h-[80px] bg-black rounded-lg border border-white/10 overflow-hidden relative shadow-inner group">
                        {activeAd ? (
                            activeAd.type === 'video' ? (
                                <video src={activeAd.url} autoPlay muted loop className="w-full h-full object-cover opacity-90" />
                            ) : (
                                <img src={activeAd.url} className="w-full h-full object-contain p-2 bg-white/5" alt="Sponsor" />
                            )
                        ) : (
                            <div className="w-full h-full bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 animate-flow flex items-center justify-center">
                                <span className="text-white font-black italic tracking-tighter text-xl drop-shadow-lg">ZTO <span className="text-yellow-400">ARENA</span></span>
                            </div>
                        )}
                        <div className="absolute top-1 right-1 px-1 rounded bg-black/50 text-[8px] text-white/30 uppercase tracking-widest font-bold">Ad</div>
                    </div>
                </div>

                {/* Right: P2 Info (Symmetrical) */}
                <div className="flex-1 flex flex-col items-center justify-start pt-10 border-l border-white/5 relative h-full">
                    {isServingP2 && <div className="mb-4 text-black bg-zto-gold px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest animate-pulse shadow-lg shadow-zto-gold/50">Serving</div>}
                    <h2 className="text-3xl xl:text-5xl font-black text-white uppercase italic tracking-tighter text-center leading-none drop-shadow-lg">
                        {p2?.name?.split(' ')[0]}<br />
                        <span className="text-white/40 text-2xl xl:text-4xl">{p2?.name?.split(' ').slice(1).join(' ')}</span>
                    </h2>
                    <div className="mt-4 text-white/20 font-bold text-sm tracking-widest">CHINA</div>
                </div>

                {/* --- BOTTOM TICKER BAR --- */}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-black border-t border-white/10 flex items-center overflow-hidden">
                    <div className="whitespace-nowrap animate-[flow_20s_linear_infinite] flex items-center gap-8 pl-4">
                        <span className="text-zto-gold text-xs font-bold uppercase tracking-widest">OFFICIAL SPONSORS:</span>
                        <span className="text-white/50 text-xs uppercase tracking-wider">VICTOR</span>
                        <span className="text-zto-gold text-xs">•</span>
                        <span className="text-white/50 text-xs uppercase tracking-wider">LI-NING</span>
                        <span className="text-zto-gold text-xs">•</span>
                        <span className="text-white/50 text-xs uppercase tracking-wider">YONEX</span>
                        <span className="text-zto-gold text-xs">•</span>
                        <span className="text-white/50 text-xs uppercase tracking-wider">100PLUS</span>
                        <span className="text-zto-gold text-xs">•</span>
                        <span className="text-white/50 text-xs uppercase tracking-wider">MAYBANK</span>
                        <span className="text-zto-gold text-xs ml-8 font-bold uppercase tracking-widest">NEXT MATCH:</span>
                        <span className="text-white/50 text-xs uppercase tracking-wider">MD FINAL 20:00PM</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
