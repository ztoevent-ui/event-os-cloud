import React from 'react';
import { Match, Player, Tournament } from '@/lib/sports/types';
import { motion } from 'framer-motion';

interface MatchListDisplayProps {
    matches: Match[];
    players: Record<string, Player>;
    tournament: Tournament;
}

export function MatchListDisplay({ matches, players, tournament }: MatchListDisplayProps) {
    // Determine category based on player names or we could add category string. 
    // Since types don't have category on match, we'll guesstimate or just show the player names.
    // If player name has '/', it's double/mixed. If not, it's singles.
    const getCategory = (p1Name: string, p2Name: string) => {
        if (!p1Name || !p2Name) return 'Unknown';
        if (p1Name.includes('/') && p2Name.includes('/')) return 'Doubles/Mixed';
        return 'Singles';
    };

    return (
        <div className="w-full h-full p-8 overflow-y-auto bg-black/50 backdrop-blur-md rounded-3xl border border-white/10">
            <h2 className="text-4xl font-black text-white mb-8 tracking-tighter uppercase text-center">Match List</h2>
            <div className="w-full">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/20 text-white/50 text-sm uppercase tracking-widest">
                            <th className="p-4 font-normal">Status</th>
                            <th className="p-4 font-normal">Category</th>
                            <th className="p-4 font-normal">Round</th>
                            <th className="p-4 font-normal text-right">Player 1</th>
                            <th className="p-4 font-normal text-center">Score</th>
                            <th className="p-4 font-normal">Player 2</th>
                        </tr>
                    </thead>
                    <tbody>
                        {matches.map((match, i) => {
                            const p1 = players[match.player1_id || '']?.name || 'TBD';
                            const p2 = players[match.player2_id || '']?.name || 'TBD';
                            const category = getCategory(p1, p2);
                            const isActive = match.status === 'ongoing';

                            return (
                                <motion.tr
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    key={match.id}
                                    className={`border-b border-white/5 hover:bg-white/5 transition-colors ${isActive ? 'bg-indigo-900/20' : ''}`}
                                >
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/50'}`}>
                                            {match.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-white/70 font-bold">{category}</td>
                                    <td className="p-4 text-white/70">{match.round_name}</td>
                                    <td className="p-4 text-right font-bold text-white text-lg">{p1}</td>
                                    <td className="p-4 text-center">
                                        <div className="inline-block bg-zinc-900 px-4 py-2 rounded-lg border border-white/10">
                                            <span className="text-zto-gold font-bold text-xl">{match.sets_p1} - {match.sets_p2}</span>
                                            <div className="text-xs text-white/50 mt-1">({match.current_score_p1} - {match.current_score_p2})</div>
                                        </div>
                                    </td>
                                    <td className="p-4 font-bold text-white text-lg">{p2}</td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
                {matches.length === 0 && (
                    <div className="text-center py-20 text-white/40">No matches found.</div>
                )}
            </div>
        </div>
    );
}
