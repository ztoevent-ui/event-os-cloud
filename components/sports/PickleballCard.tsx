import React from 'react';
import { Player, Match, SponsorAd } from '@/lib/sports/types';
import { motion } from 'framer-motion';

interface PickleballCardProps {
    match: Match;
    p1: Player | undefined;
    p2: Player | undefined;
    activeAd?: SponsorAd;
}

export function PickleballCard({ match, p1, p2, activeAd }: PickleballCardProps) {
    const isServingP1 = match.serving_player_id === p1?.id;
    const isServingP2 = match.serving_player_id === p2?.id;

    // Pickleball Specific: "Game" terminology, distinct visual style (Blue/Green accents)
    // ZTO Branding remains but with a sport-specific flavor.

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-full h-[85vh] bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-blue-500/20 flex flex-col font-sans"
        >
            {/* ---------------- ZONE A: VISUALS (Top 65%) ---------------- */}
            <div className="h-[65%] flex relative">
                {/* Divide Line - Animated */}
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-blue-500/50 blur-sm z-10 animate-pulse"></div>

                {/* Left: Player 1 */}
                <div className="w-1/2 h-full relative overflow-hidden group">
                    <img
                        src={p1?.avatar_url || 'https://via.placeholder.com/400x800'}
                        alt="P1"
                        className="w-full h-full object-cover object-top filter contrast-125 brightness-75 group-hover:brightness-100 transition duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/40 via-transparent to-transparent"></div>
                    {/* Name overlay large */}
                    <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black/90 to-transparent">
                        <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                            {p1?.name}
                        </h2>
                        <div className="text-blue-400 font-bold tracking-widest text-sm mt-1 uppercase">USA / PHOENIX</div>
                    </div>
                </div>

                {/* Right: Player 2 */}
                <div className="w-1/2 h-full relative overflow-hidden group">
                    <img
                        src={p2?.avatar_url || 'https://via.placeholder.com/400x800'}
                        alt="P2"
                        className="w-full h-full object-cover object-top filter contrast-125 brightness-75 group-hover:brightness-100 transition duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tl from-green-900/40 via-transparent to-transparent"></div>
                    {/* Name overlay large */}
                    <div className="absolute bottom-0 right-0 w-full p-8 bg-gradient-to-t from-black/90 to-transparent text-right">
                        <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                            {p2?.name}
                        </h2>
                        <div className="text-green-400 font-bold tracking-widest text-sm mt-1 uppercase">USA / AUSTIN</div>
                    </div>
                </div>

                {/* Event Badge */}
                <div className="absolute top-6 left-6 flex gap-2">
                    <div className="bg-black/60 backdrop-blur border border-white/10 px-4 py-1.5 rounded-lg text-white font-bold text-xs uppercase tracking-widest">
                        PPA TOUR
                    </div>
                    <div className="bg-blue-600 px-4 py-1.5 rounded-lg text-white font-black text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(37,99,235,0.6)]">
                        {match.round_name}
                    </div>
                </div>
            </div>

            {/* ---------------- ZONE B: DASHBOARD (Bottom 35%) ---------------- */}
            <div className="h-[35%] bg-zinc-950 relative flex">

                {/* Center Score Module */}
                <div className="w-full h-full flex items-center justify-between px-12 relative z-20">

                    {/* P1 Score */}
                    <div className="flex flex-col items-center">
                        {isServingP1 && (
                            <div className="mb-2 bg-blue-500 text-white text-xs font-bold uppercase px-3 py-1 rounded-full animate-bounce">
                                <i className="fa-solid fa-table-tennis-paddle-ball mr-2"></i>Serving
                            </div>
                        )}
                        <div className={`text-[10rem] leading-none font-black tabular-nums tracking-tighter ${match.current_score_p1 > match.current_score_p2 ? 'text-blue-500 drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]' : 'text-zinc-700'}`}>
                            {match.current_score_p1}
                        </div>
                        <div className="flex gap-2 mt-2">
                            {Array.from({ length: match.sets_p1 }).map((_, i) => (
                                <div key={i} className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                            ))}
                        </div>
                    </div>

                    {/* Middle Info & Ad */}
                    <div className="flex flex-col items-center gap-6">
                        <div className="bg-zinc-900 border border-zinc-800 px-8 py-2 rounded-full">
                            <span className="text-zinc-400 text-sm font-bold uppercase tracking-widest">GAME {match.sets_p1 + match.sets_p2 + 1}</span>
                        </div>

                        {/* --- AD SLOT --- */}
                        <div className="w-[360px] h-[90px] bg-black rounded-xl border border-zinc-800 overflow-hidden relative shadow-inner">
                            {activeAd ? (
                                activeAd.type === 'video' ? (
                                    <video src={activeAd.url} autoPlay muted loop className="w-full h-full object-cover" />
                                ) : (
                                    <img src={activeAd.url} className="w-full h-full object-contain p-2" alt="Sponsor" />
                                )
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                                    <span className="text-zinc-600 font-bold italic">ZTO ADS</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* P2 Score */}
                    <div className="flex flex-col items-center">
                        {isServingP2 && (
                            <div className="mb-2 bg-green-500 text-white text-xs font-bold uppercase px-3 py-1 rounded-full animate-bounce">
                                <i className="fa-solid fa-table-tennis-paddle-ball mr-2"></i>Serving
                            </div>
                        )}
                        <div className={`text-[10rem] leading-none font-black tabular-nums tracking-tighter ${match.current_score_p2 > match.current_score_p1 ? 'text-green-500 drop-shadow-[0_0_20px_rgba(34,197,94,0.6)]' : 'text-zinc-700'}`}>
                            {match.current_score_p2}
                        </div>
                        <div className="flex gap-2 mt-2">
                            {Array.from({ length: match.sets_p2 }).map((_, i) => (
                                <div key={i} className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Background Grid */}
                <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            </div>
        </motion.div>
    );
}

export default PickleballCard;
