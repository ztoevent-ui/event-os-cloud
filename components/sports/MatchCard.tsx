import React from 'react';
import { Player, Match } from '@/lib/sports/types';
import { motion } from 'framer-motion';

interface MatchCardProps {
    match: Match;
    p1: Player | undefined;
    p2: Player | undefined;
}

export function MatchCard({ match, p1, p2 }: MatchCardProps) {
    const isServingP1 = match.serving_player_id === p1?.id;
    const isServingP2 = match.serving_player_id === p2?.id;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col bg-zto-dark/90 backdrop-blur-md rounded-2xl border border-zto-gold/20 shadow-[0_0_15px_rgba(212,175,55,0.1)] overflow-hidden h-full"
        >
            {/* Header: Court & Round */}
            <div className="bg-gradient-to-r from-zto-gold/10 to-transparent p-4 flex justify-between items-center border-b border-zto-gold/10">
                <span className="font-bold text-zto-gold tracking-widest uppercase text-sm animate-pulse">{match.court_id || 'Generating Court...'}</span>
                <span className="text-white/60 text-xs uppercase tracking-wider">{match.round_name}</span>
            </div>

            {/* Players & Scores */}
            <div className="flex flex-1 flex-col justify-center p-6 space-y-6">

                {/* Player 1 Row */}
                <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${isServingP1 ? 'border-zto-gold shadow-[0_0_10px_#D4AF37]' : 'border-white/20'}`}>
                            {p1?.avatar_url ? (
                                <img src={p1.avatar_url} alt={p1.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-white/10 flex items-center justify-center text-xl font-bold text-white/40">
                                    {p1?.name?.charAt(0) || '?'}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-2xl font-bold ${match.winner_id === p1?.id ? 'text-zto-gold' : 'text-white'}`}>{p1?.name || 'TBD'}</span>
                            {isServingP1 && <span className="text-xs text-zto-gold uppercase tracking-wider font-semibold">Serving</span>}
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-5xl font-black text-white font-mono tabular-nums">{match.current_score_p1}</span>
                        {match.sets_p1 > 0 && <span className="block text-sm text-zto-gold font-bold uppercase mt-1">Sets: {match.sets_p1}</span>}
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                {/* Player 2 Row */}
                <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${isServingP2 ? 'border-zto-gold shadow-[0_0_10px_#D4AF37]' : 'border-white/20'}`}>
                            {p2?.avatar_url ? (
                                <img src={p2.avatar_url} alt={p2.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-white/10 flex items-center justify-center text-xl font-bold text-white/40">
                                    {p2?.name?.charAt(0) || '?'}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-2xl font-bold ${match.winner_id === p2?.id ? 'text-zto-gold' : 'text-white'}`}>{p2?.name || 'TBD'}</span>
                            {isServingP2 && <span className="text-xs text-zto-gold uppercase tracking-wider font-semibold">Serving</span>}
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-5xl font-black text-white font-mono tabular-nums">{match.current_score_p2}</span>
                        {match.sets_p2 > 0 && <span className="block text-sm text-zto-gold font-bold uppercase mt-1">Sets: {match.sets_p2}</span>}
                    </div>
                </div>

            </div>

            {/* Footer Status */}
            <div className="bg-white/5 p-3 text-center border-t border-white/5">
                <span className={`text-xs uppercase font-bold tracking-widest ${match.status === 'ongoing' ? 'text-green-400 animate-pulse' : 'text-white/40'}`}>
                    {match.status}
                </span>
            </div>
        </motion.div>
    );
}
