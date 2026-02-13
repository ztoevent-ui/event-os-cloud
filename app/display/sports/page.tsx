'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { ZTOHeader } from '@/components/sports/ZTOHeader';
import { MatchCard } from '@/components/sports/MatchCard';
import { useSportsState } from '@/lib/sports/useSportsState';
import { WinnerReveal } from '@/components/sports/WinnerReveal';
import { motion, AnimatePresence } from 'framer-motion';

import { useSearchParams } from 'next/navigation';

function SportsDisplayContent() {
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('id');

    const { matches, players, tournament, allTournaments, switchTournament, ads, loading } = useSportsState(tournamentId); // Pass ID to hook
    const [viewMode, setViewMode] = useState<'grid' | 'portrait'>('grid');
    const [currentAdIndex, setCurrentAdIndex] = useState(0);
    // No more local selector needed if we rely on URL, but we can keep a fallback if no ID provided.
    const [showSelector, setShowSelector] = useState(!tournamentId);

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

    // Commercial Break Logic derived from Active Ads
    // Commercial Break Logic
    // Support Playlist: Multiple active ads rotate
    const activeFullscreenAds = ads.filter(a => a.is_active && a.display_location === 'fullscreen');
    const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);

    // Derived current ad (preserves existing variable name for compatibility)
    const activeFullscreenAd = activeFullscreenAds.length > 0
        ? activeFullscreenAds[currentPlaylistIndex % activeFullscreenAds.length]
        : undefined;

    const playerRef = React.useRef<any>(null);

    // Initialize YouTube API always
    useEffect(() => {
        if (!(window as any).YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }
    }, []);

    // Also support manual override via 'B' key for local testing or emergency
    const [manualAdBreak, setManualAdBreak] = useState(false);
    const [hiddenLocally, setHiddenLocally] = useState(false); // New: Force close state

    const showAdOverlay = (activeFullscreenAds.length > 0 || manualAdBreak) && !hiddenLocally;
    const adToDisplay = activeFullscreenAd || { type: 'video', url: 'https://www.youtube.com/watch?v=t7xDdQ0fxUI', duration: 30 }; // Fallback Demo Ad

    useEffect(() => {
        // Reset local hide when admin status changes (new ad starts)
        if (activeFullscreenAds.length > 0) {
            setHiddenLocally(false);
            // Reset index if only 1 ad or new set
            if (activeFullscreenAds.length === 1) setCurrentPlaylistIndex(0);
        }
    }, [activeFullscreenAds.length]);

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();

            if (key === 'b') {
                console.log('User pressed B');
                // Intelligent Toggle
                if (showAdOverlay) {
                    setHiddenLocally(true);
                    setManualAdBreak(false);
                } else {
                    setManualAdBreak(true);
                    setHiddenLocally(false);
                }
            }

            if (key === 'm') {
                console.log('User pressed M');
                if (playerRef.current && typeof playerRef.current.isMuted === 'function') {
                    if (playerRef.current.isMuted()) {
                        playerRef.current.unMute();
                    } else {
                        playerRef.current.mute();
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [showAdOverlay]); // Depend on current state

    // ... (rest of Youtube logic uses showAdOverlay) ...

    // ... (Inside Return JSX) ...
    // Setup YouTube Player when overlay mounts
    useEffect(() => {
        if (showAdOverlay && adToDisplay.type === 'video' && (adToDisplay.url.includes('youtu'))) {

            // EXTRACT VIDEO ID - Robust Logic
            let videoId = 't7xDdQ0fxUI';
            const url = adToDisplay.url;

            if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1]?.split('?')[0];
            } else if (url.includes('v=')) {
                videoId = url.split('v=')[1]?.split('&')[0];
            } else if (url.includes('/embed/')) {
                videoId = url.split('/embed/')[1]?.split('?')[0];
            }

            // Fallback for clean ID
            if (!videoId || videoId.length < 5) videoId = 't7xDdQ0fxUI';

            const initPlayer = () => {
                if (!(window as any).YT) return; // Wait for API

                if (playerRef.current) {
                    try { playerRef.current.destroy(); } catch (e) { /* ignore */ }
                }

                playerRef.current = new (window as any).YT.Player('youtube-player', {
                    videoId: videoId,
                    playerVars: {
                        autoplay: 1,
                        controls: 0,
                        mute: 1, // Start muted to allow autoplay
                        showinfo: 0,
                        rel: 0,
                        iv_load_policy: 3,
                        modestbranding: 1
                    },
                    events: {
                        onReady: (event: any) => {
                            event.target.playVideo();
                            // REMOVED auto-unmute: This trigger browser autoplay block policies which pause the video.
                            // The video will play MUTED. To get sound, the user must interact with the page once.
                        },
                        onStateChange: (event: any) => {
                            const playerState = event.data;
                            const YT = (window as any).YT;

                            // ENDED -> Playlist Increment or Loop
                            if (playerState === YT.PlayerState.ENDED) {
                                if (activeFullscreenAds.length > 1) {
                                    // Move to next ad in playlist
                                    setCurrentPlaylistIndex(prev => (prev + 1) % activeFullscreenAds.length);
                                } else {
                                    // Only 1 ad? Loop it.
                                    event.target.seekTo(0);
                                    event.target.playVideo();
                                }
                            }

                            // PAUSED -> Force Play (Fix for unexpected pausing)
                            if (playerState === YT.PlayerState.PAUSED) {
                                console.log('Video paused unexpectedly - forcing play');
                                event.target.playVideo();
                            }
                        }
                    }
                });
            };

            // Poll for API ready
            const checkAPI = setInterval(() => {
                if ((window as any).YT && (window as any).YT.Player) {
                    clearInterval(checkAPI);
                    initPlayer();
                }
            }, 100);

            return () => {
                clearInterval(checkAPI);
                if (playerRef.current) {
                    try { playerRef.current.destroy(); } catch (e) { /* ignore */ }
                }
            };
        }
    }, [showAdOverlay, adToDisplay]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zto-dark text-zto-gold animate-pulse">
                <span className="text-2xl font-bold tracking-widest uppercase">Initializing ZTO Arena...</span>
            </div>
        );
    }

    if (!tournament || showSelector) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-black to-black"></div>

                <div className="relative z-10 max-w-4xl w-full text-center">
                    <h1 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase">Live Events</h1>
                    <p className="text-white/40 mb-12 text-lg">Select a broadcast to display</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allTournaments.map(t => (
                            <button
                                key={t.id}
                                onClick={() => {
                                    // Navigate to URL with ID
                                    window.location.href = `/display/sports?id=${t.id}`;
                                }}
                                className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 p-6 rounded-2xl transition-all duration-300 backdrop-blur-sm text-left relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition"></div>
                                <h3 className="font-bold text-xl mb-2 group-hover:text-indigo-400 transition">{t.name}</h3>
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    {t.type}
                                </div>
                            </button>
                        ))}
                    </div>

                    {allTournaments.length === 0 && (
                        <div className="p-8 border border-white/10 rounded-xl bg-white/5 text-white/40">
                            No active broadcasts found. Check Admin Console.
                        </div>
                    )}
                </div>
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
                                        sportType={tournament.type}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* --- FULL SCREEN COMMERCIAL BREAK OVERLAY --- */}
            <AnimatePresence>
                {showAdOverlay && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black flex items-center justify-center cursor-pointer"
                        onClick={() => {
                            // User Interaction enables sound AND ensures focus for 'B' key
                            window.focus();
                            if (playerRef.current && typeof playerRef.current.unMute === 'function') {
                                playerRef.current.unMute();
                                playerRef.current.setVolume(100);
                                console.log('User clicked - Unmuting');
                            }
                        }}
                    >


                        {/* Sound Hint */}
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/50 text-sm animate-pulse pointer-events-none z-[1001] bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
                            Click or press 'M' to toggle sound
                        </div>




                        {/* Dynamic Content: YouTube OR Image OR Direct Video */}
                        {adToDisplay.type === 'video' ? (
                            adToDisplay.url.includes('youtu') ? (
                                <div className="relative w-full h-full max-w-none max-h-none bg-black overflow-hidden flex items-center justify-center">
                                    <div id="youtube-player" className="absolute top-1/2 left-1/2 w-[110vw] h-[110vh] -translate-x-1/2 -translate-y-1/2 pointer-events-none border-none scale-100" />
                                </div>
                            ) : (
                                <video
                                    src={adToDisplay.url}
                                    autoPlay
                                    loop
                                    muted={false}
                                    className="w-full h-full object-cover"
                                />
                            )
                        ) : (
                            <img
                                src={adToDisplay.url}
                                className="w-full h-full object-contain bg-black"
                                alt="Commercial"
                            />
                        )}

                        {/* Overlay Label */}
                        <div className="absolute top-8 right-8 bg-black/50 backdrop-blur text-white px-4 py-2 rounded-full text-xs font-bold border border-white/10 uppercase tracking-widest">
                            Ad Break • {adToDisplay.duration}s
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}

export default function SportsDisplayPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Experience...</div>}>
            <SportsDisplayContent />
        </Suspense>
    );
}
