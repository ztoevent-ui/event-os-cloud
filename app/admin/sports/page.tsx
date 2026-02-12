'use client';

import React, { useState } from 'react';
import { useSportsState } from '@/lib/sports/useSportsState';
import { AdminCourt } from '@/components/sports/AdminCourt';
import { Match } from '@/lib/sports/types';

export default function SportsAdminPage() {
    const { matches, players, tournament, loading, updateScore } = useSportsState();
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

    const handleUpdate = (updates: Partial<Match>) => {
        if (selectedMatch) {
            updateScore(selectedMatch.id, updates);
            // Optimistic update locally? The realtime subscription should handle it, but for snappiness we could.
            // For now rely on subscription.
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Sports Data...</div>;

    if (!tournament) return (
        <div className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">No Active Tournament</h1>
            <p>Please initialize a tournament in Supabase manually for now.</p>
            {/* If I had run_command capability to seed, I would add a button here */}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-xl font-bold text-gray-800">ZTO Arena Admin <span className="text-gray-400 text-sm font-normal">| {tournament.name}</span></h1>
                <div className="flex gap-4">
                    {selectedMatch && (
                        <button
                            onClick={() => setSelectedMatch(null)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition"
                        >
                            Back to List
                        </button>
                    )}
                    <div className="w-8 h-8 rounded-full bg-yellow-400 text-yellow-900 border border-yellow-500 flex items-center justify-center font-bold">R</div>
                </div>
            </header>

            <main className="container mx-auto p-6">
                {selectedMatch ? (
                    <div className="max-w-md mx-auto">
                        <AdminCourt
                            match={selectedMatch}
                            p1={players[selectedMatch.player1_id || '']}
                            p2={players[selectedMatch.player2_id || '']}
                            onUpdateScore={handleUpdate}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {matches.map(m => (
                            <div
                                key={m.id}
                                onClick={() => setSelectedMatch(m)}
                                className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition cursor-pointer group"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-bold text-gray-500 uppercase text-xs tracking-wider">{m.court_id}</span>
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${m.status === 'ongoing' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {m.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex flex-col gap-1">
                                        <div className="font-bold text-gray-800">{players[m.player1_id || '']?.name || 'TBD'}</div>
                                        <div className="font-bold text-gray-800">{players[m.player2_id || '']?.name || 'TBD'}</div>
                                    </div>
                                    <div className="flex flex-col gap-1 text-right">
                                        <div className="font-mono font-bold text-2xl text-blue-600">{m.current_score_p1}</div>
                                        <div className="font-mono font-bold text-2xl text-red-600">{m.current_score_p2}</div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {matches.length === 0 && (
                            <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                                No matches scheduled yet.
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
