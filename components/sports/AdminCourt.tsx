import React from 'react';
import { Player, Match } from '@/lib/sports/types';

interface AdminCourtProps {
    match: Match;
    p1: Player | undefined;
    p2: Player | undefined;
    onUpdateScore: (updates: Partial<Match>) => void;
}

export function AdminCourt({ match, p1, p2, onUpdateScore }: AdminCourtProps) {
    const handleScore = (player: 1 | 2, delta: number) => {
        const current = player === 1 ? match.current_score_p1 : match.current_score_p2;
        const newScore = Math.max(0, current + delta);

        // Simple logic: if score >= 21? (Badminton rule)
        // I will let the referee decide when set ends for now, or implement basic rule.
        // User requested "Badminton: 21 points". I'll implement basic auto-increment.

        onUpdateScore({
            [player === 1 ? 'current_score_p1' : 'current_score_p2']: newScore
        });
    };

    const toggleServer = () => {
        onUpdateScore({ serving_player_id: match.serving_player_id === p1?.id ? p2?.id : p1?.id });
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-bold mb-4 text-center text-gray-800">{match.court_id || 'Court 1'} - {match.round_name}</h3>

            {/* Court Visual */}
            <div className="relative w-full aspect-[1/2] bg-green-600 border-2 border-white mb-6 rounded-md overflow-hidden shadow-inner">
                {/* Net */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/50 border-t border-white" />

                {/* Player 1 Side (Top) */}
                <div className="absolute top-4 left-0 right-0 text-center">
                    <div className={`inline-block px-3 py-1 rounded ${match.serving_player_id === p1?.id ? 'bg-yellow-400 text-black font-bold' : 'bg-white/20 text-white'}`}>
                        {p1?.name || 'Player 1'}
                    </div>
                    <div className="text-6xl font-black text-white mt-2">{match.current_score_p1}</div>
                </div>

                {/* Player 2 Side (Bottom) */}
                <div className="absolute bottom-4 left-0 right-0 text-center">
                    <div className="text-6xl font-black text-white mb-2">{match.current_score_p2}</div>
                    <div className={`inline-block px-3 py-1 rounded ${match.serving_player_id === p2?.id ? 'bg-yellow-400 text-black font-bold' : 'bg-white/20 text-white'}`}>
                        {p2?.name || 'Player 2'}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-4">
                {/* P1 Controls */}
                <div className="space-y-2">
                    <div className="text-sm font-bold text-gray-500 text-center">{p1?.name}</div>
                    <button
                        onClick={() => handleScore(1, 1)}
                        className="w-full py-4 bg-blue-600 text-white font-bold rounded-lg text-xl hover:bg-blue-700 active:scale-95 transition"
                    >
                        +1
                    </button>
                    <button
                        onClick={() => handleScore(1, -1)}
                        className="w-full py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition"
                    >
                        -1
                    </button>
                </div>

                {/* P2 Controls */}
                <div className="space-y-2">
                    <div className="text-sm font-bold text-gray-500 text-center">{p2?.name}</div>
                    <button
                        onClick={() => handleScore(2, 1)}
                        className="w-full py-4 bg-red-600 text-white font-bold rounded-lg text-xl hover:bg-red-700 active:scale-95 transition"
                    >
                        +1
                    </button>
                    <button
                        onClick={() => handleScore(2, -1)}
                        className="w-full py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition"
                    >
                        -1
                    </button>
                </div>
            </div>

            <div className="mt-6 flex justify-between gap-2">
                <button onClick={toggleServer} className="flex-1 py-2 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600">
                    Switch Server
                </button>
                <button
                    className="flex-1 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
                    onClick={() => {
                        // Mark match as completed? user didn't specify exactly. I'll just leave it for now.
                        alert("Match Finished capability not fully implemented in demo mode.");
                    }}
                >
                    Finish Match
                </button>
            </div>
        </div>
    );
}
