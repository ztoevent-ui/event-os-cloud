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

    // Commercial Break Toggle
    const [isCommercialBreak, setIsCommercialBreak] = useState(true);
    const playerRef = React.useRef<any>(null);

    // Initialize YouTube API
    useEffect(() => {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        (window as any).onYouTubeIframeAPIReady = () => {
            console.log('YT API Ready');
        };
    }, []);

    // Handle Volume Fading
    const fadeAudio = (targetVolume: number, duration: number, callback?: () => void) => {
        if (!playerRef.current || typeof playerRef.current.getVolume !== 'function') {
            callback?.();
            return;
        }

        const startVolume = playerRef.current.getVolume();
        const steps = 20;
        const stepTime = duration / steps;
        const volumeStep = (targetVolume - startVolume) / steps;

        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            const newVolume = startVolume + (volumeStep * currentStep);
            playerRef.current.setVolume(Math.max(0, Math.min(100, newVolume)));

            if (currentStep >= steps) {
                clearInterval(interval);
                callback?.();
            }
        }, stepTime);
    };

    const toggleAdBreak = () => {
        if (isCommercialBreak) {
            // Fade out then close - Sped up to 500ms
            fadeAudio(0, 500, () => setIsCommercialBreak(false));
        } else {
            setIsCommercialBreak(true);
        }
    };

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'b') toggleAdBreak();
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isCommercialBreak]);

    // Setup Player when overlay mounts
    useEffect(() => {
        if (isCommercialBreak && (window as any).YT) {
            const initPlayer = () => {
                playerRef.current = new (window as any).YT.Player('youtube-player', {
                    videoId: 't7xDdQ0fxUI',
                    playerVars: {
                        autoplay: 1,
                        controls: 0,
                        mute: 0,
                        loop: 1,
                        playlist: 't7xDdQ0fxUI',
                        showinfo: 0,
                        rel: 0,
                        iv_load_policy: 3
                    },
                    events: {
                        onReady: (event: any) => {
                            event.target.setVolume(0);
                            event.target.playVideo();
                            // Smooth fade in - Sped up to 1000ms
                            setTimeout(() => fadeAudio(100, 1000), 500);
                        },
                        onStateChange: (event: any) => {
                            if (event.data === (window as any).YT.PlayerState.ENDED) {
                                event.target.playVideo(); // Force loop
                            }
                        }
                    }
                });
            };

            // Small delay to ensure div is in DOM
            const timeout = setTimeout(initPlayer, 100);
            return () => {
                clearTimeout(timeout);
                if (playerRef.current) playerRef.current.destroy();
            };
        }
    }, [isCommercialBreak]);

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
        <main className="min-h-screen bg-black text-white overflow-hidden relative selection:bg-zto-gold selection:text-black">
            {/* Ambient Background - More Subtle */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zto-gold/10 via-black to-black -z-10"></div>

            <ZTOHeader tournamentName={tournament.name} />

            <div className="container mx-auto px-4 pt-32 pb-12 flex flex-col items-center justify-center min-h-screen">
                <AnimatePresence mode="wait">
                    {activeMatches.length === 0 ? (
                        <motion.div
                            key="waiting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center w-full py-20"
                        >
                            <h2 className="text-3xl font-bold text-white/20 uppercase tracking-widest">Next Match Starting Soon</h2>
                            <p className="mt-4 text-zto-gold animate-pulse text-sm uppercase tracking-widest">Commercial Break in Progress...</p>
                        </motion.div>
                    ) : (
                        <div className="w-full max-w-[1600px] mx-auto relative z-10">
                            {activeMatches.map((match) => (
                                <div key={match.id} className="relative w-full">
                                    <MatchCard
                                        match={match}
                                        p1={players[match.player1_id || '']}
                                        p2={players[match.player2_id || '']}
                                        activeAd={ads[currentAdIndex]}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* --- FULL SCREEN COMMERCIAL BREAK OVERLAY --- */}
            <AnimatePresence>
                {isCommercialBreak && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
                    >
                        {/* YouTube IFrame API Container */}
                        <div className="relative w-full h-full max-w-none max-h-none bg-black overflow-hidden">
                            <div
                                id="youtube-player"
                                className="absolute top-1/2 left-1/2 w-[110vw] h-[110vh] -translate-x-1/2 -translate-y-1/2 pointer-events-none border-none scale-100"
                            ></div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
