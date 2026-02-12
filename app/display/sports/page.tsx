'use client';

import React, { useEffect, useState } from 'react';
import { ZTOHeader } from '@/components/sports/ZTOHeader';
import { MatchCard } from '@/components/sports/MatchCard';
import { useSportsState } from '@/lib/sports/useSportsState';
import { WinnerReveal } from '@/components/sports/WinnerReveal';
import { motion, AnimatePresence } from 'framer-motion';

export default function SportsDisplayPage() {
    const { matches, players, tournament, ads, loading } = useSportsState();
    const [viewMode, setViewMode] = useState<'grid' | 'portrait'>('grid');
    const [currentAdIndex, setCurrentAdIndex] = useState(0);

    // Filter active matches
    const activeMatches = matches.filter(m => m.status === 'ongoing' || m.status === 'scheduled');
    const isTop4 = activeMatches.some(m => ['sf', 'final'].includes(m.round_name.toLowerCase()));

    // Cycle Ads
    useEffect(() => {
        if (ads && ads.length > 1) {
            const timer = setInterval(() => {
                setCurrentAdIndex(prev => (prev + 1) % ads.length);
            }, 10000); // 10s per ad
            return () => clearInterval(timer);
        }
    }, [ads]);

    // Check for Winner
    const finalMatch = matches.find(m => m.round_name.toLowerCase() === 'final' && m.status === 'completed');
    const champion = finalMatch?.winner_id ? players[finalMatch.winner_id] : null;

    // Auto-switch mode based on active matches count and round
    useEffect(() => {
        if (activeMatches.length === 1 || (isTop4 && activeMatches.length <= 2)) {
            setViewMode('portrait');
        } else {
            setViewMode('grid');
        }
    }, [activeMatches.length, isTop4]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zto-dark text-zto-gold animate-pulse">
                <span className="text-2xl font-bold tracking-widest uppercase">Initializing ZTO Arena...</span>
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-zto-dark text-white p-8">
                <h1 className="text-4xl font-bold text-zto-gold mb-4">No Active Tournament</h1>
                <p className="text-white/60">Please create a tournament in the Admin Console.</p>
            </div>
        );
    }

    if (champion) {
        return <WinnerReveal winner={champion} tournamentName={tournament.name} />;
    }


    return (
        <main className="min-h-screen bg-zto-dark text-white overflow-hidden relative">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zto-gold/5 via-zto-dark to-black -z-10 animate-pulse"></div>

            <ZTOHeader tournamentName={tournament.name} />

            <div className={`container mx-auto px-4 py-24 flex gap-8 h-screen`}>
                <div className="flex-1 overflow-y-auto pb-20">
                    <AnimatePresence mode="wait">
                        {activeMatches.length === 0 ? (
                            <motion.div
                                key="waiting"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center w-full py-20"
                            >
                                <h2 className="text-3xl font-bold text-white/40 uppercase tracking-widest">Waiting for next match...</h2>
                                <div className="mt-8 animate-bounce text-zto-gold text-2xl">⚡</div>
                            </motion.div>
                        ) : (
                            <div className={`grid gap-8 ${viewMode === 'portrait' ? 'grid-cols-1 w-full max-w-4xl mx-auto' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                                {activeMatches.map((match) => (
                                    <MatchCard
                                        key={match.id}
                                        match={match}
                                        p1={players[match.player1_id || '']}
                                        p2={players[match.player2_id || '']}
                                    />
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Sidebar Ads & QR */}
                {ads && ads.length > 0 && viewMode !== 'portrait' && (
                    <div className="hidden xl:flex flex-col w-80 gap-6 pt-20 sticky top-0 h-screen">
                        <div className="bg-zto-dark/80 backdrop-blur rounded-xl border border-zto-gold/20 p-4 shadow-lg overflow-hidden relative aspect-[9/16]">
                            {ads[currentAdIndex]?.type === 'video' ? (
                                <video
                                    src={ads[currentAdIndex].url} autoPlay muted loop
                                    className="w-full h-full object-cover rounded-lg"
                                />
                            ) : (
                                <img
                                    src={ads[currentAdIndex]?.url || 'https://via.placeholder.com/300x600?text=Sponsor+Ad'}
                                    alt="Sponsor"
                                    className="w-full h-full object-cover rounded-lg"
                                />
                            )}
                            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                Ad {currentAdIndex + 1}/{ads.length}
                            </div>
                        </div>

                        {/* QR Code */}
                        <div className="bg-white p-4 rounded-xl shadow-lg flex flex-col items-center text-center">
                            <h3 className="text-zto-dark font-bold uppercase text-sm mb-2">Scan for Stats</h3>
                            <div className="w-32 h-32 bg-gray-200 mb-2 flex items-center justify-center">
                                {/* Placeholder QR */}
                                <span className="text-4xl">📱</span>
                            </div>
                            <p className="text-xs text-gray-500">Get your personal match report.</p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
