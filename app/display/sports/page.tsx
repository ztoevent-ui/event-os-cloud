'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { ZTOHeader } from '@/components/sports/ZTOHeader';
import { MatchCard } from '@/components/sports/MatchCard';
import { useSportsState } from '@/lib/sports/useSportsState';
import { WinnerReveal } from '@/components/sports/WinnerReveal';
import { MatchListDisplay } from '@/components/sports/MatchListDisplay';
import { TournamentBracket } from '@/components/sports/TournamentBracket';
import { motion, AnimatePresence } from 'framer-motion';

import { useSearchParams } from 'next/navigation';

function SportsDisplayContent() {
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('id');

    const { now, matches, players, tournament, allTournaments, switchTournament, ads, loading } = useSportsState(tournamentId); // Pass ID to hook
    const [viewMode, setViewMode] = useState<'grid' | 'portrait'>('grid');
    const [displayMode, setDisplayMode] = useState<'current_matches' | 'match_list' | 'tournament_bracket'>('current_matches');
    const [currentAdIndex, setCurrentAdIndex] = useState(0);
    // No more local selector needed if we rely on URL, but we can keep a fallback if no ID provided.
    const [showSelector, setShowSelector] = useState(!tournamentId);

    // Filter active matches (including recently retired/walkover for transition)
    const activeMatches = matches.filter(m =>
        m.status === 'ongoing' ||
        m.status === 'scheduled' ||
        m.status === 'retired' ||
        m.status === 'walkover'
    );
    const isTop4 = activeMatches.some(m => ['sf', 'final'].includes(m.round_name.toLowerCase()));

    // --- Court Selection Logic (Per Device) ---
    const [selectedCourts, setSelectedCourts] = useState<string[]>([]);
    const [showCourtSelector, setShowCourtSelector] = useState(false);

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('zto_selected_courts');
        if (saved) {
            try {
                setSelectedCourts(JSON.parse(saved));
            } catch (e) { console.error("Failed to parse saved courts", e); }
        }
    }, []);

    // Save to local storage on change
    useEffect(() => {
        if (selectedCourts.length > 0) {
            localStorage.setItem('zto_selected_courts', JSON.stringify(selectedCourts));
        } else {
            // If empty, remove to revert to 'Show All' default behavior
            localStorage.removeItem('zto_selected_courts');
        }
    }, [selectedCourts]);

    // Auto-Show Court Selector if Multiple Matches on Load (Once per session/refresh)
    const hasAutoOpenedRef = React.useRef(false);
    useEffect(() => {
        if (!loading && activeMatches.length > 1 && !hasAutoOpenedRef.current) {
            // Check if we have a specific *valid* selection in local storage?
            // User feedback suggests they want to choose every time they enter a specialized display view.
            // So we force open it once per page load.
            setShowCourtSelector(true);
            hasAutoOpenedRef.current = true;
        }
    }, [loading, activeMatches.length]);

    // Apply Filter: If selected courts exist, show only them. Else show all.
    const filteredMatches = selectedCourts.length > 0
        ? activeMatches.filter(m => selectedCourts.includes(m.id))
        : activeMatches;

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
    const [dismissedLocally, setDismissedLocally] = useState(false); // Changed to 'dismissed' for clearer intent

    const showAdOverlay = (manualAdBreak || (activeFullscreenAds.length > 0 && !dismissedLocally));
    const adToDisplay = activeFullscreenAd;

    // Reset dismissal when ad list changes (new commercial break starting)
    const isFirstAdLoad = React.useRef(true);
    useEffect(() => {
        if (activeFullscreenAds.length > 0) {
            if (isFirstAdLoad.current) {
                // Suppress ad on initial load/refresh as per user request
                setDismissedLocally(true);
                isFirstAdLoad.current = false;
            } else {
                // New ad break started while already viewing
                setDismissedLocally(false);
            }
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
                    setDismissedLocally(true);
                    setManualAdBreak(false);
                    // Advance playlist when manually closing so next time it's fresh
                    if (activeFullscreenAds.length > 1) {
                        setCurrentPlaylistIndex(prev => (prev + 1) % activeFullscreenAds.length);
                    }
                } else {
                    setManualAdBreak(true);
                    setDismissedLocally(false);
                }
            }

            if (key === 'm') {
                if (playerRef.current && typeof playerRef.current.mute === 'function') {
                    // Simple toggle if API allows, but YT API is simpler:
                    if (playerRef.current.isMuted()) playerRef.current.unMute();
                    else playerRef.current.mute();
                }
            }

            if (key === 'v') {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch((err: any) => {
                        console.error(`Error attempting to enable fullscreen: ${err.message}`);
                    });
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
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
        if (showAdOverlay && adToDisplay?.type === 'video' && adToDisplay?.url?.includes('youtu')) {

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
    }, [showAdOverlay, adToDisplay?.url]);

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
        <main className="h-screen bg-black text-white overflow-hidden relative selection:bg-zto-gold selection:text-black">
            {/* Ambient Background - More Subtle */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zto-gold/10 via-black to-black -z-10"></div>

            {/* Display Mode Selector (Floating Top Left) */}
            <div className="fixed top-6 left-6 z-50 group">
                <select
                    value={displayMode}
                    onChange={(e) => setDisplayMode(e.target.value as any)}
                    className="bg-black/40 border border-white/20 text-white/50 text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-xl backdrop-blur-md outline-none hover:border-zto-gold transition-colors focus:text-white cursor-pointer appearance-none opacity-20 group-hover:opacity-100"
                >
                    <option value="current_matches">Live Courts</option>
                    <option value="match_list">Match List</option>
                    <option value="tournament_bracket">Bracket</option>
                </select>
                <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-white/50 text-xs pointer-events-none opacity-20 group-hover:opacity-100"></i>
            </div>

            {/* Court Selector Button (Floating Bottom Right) */}
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => setShowCourtSelector(true)}
                    className="w-12 h-12 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full flex items-center justify-center shadow-lg border border-white/10 transition-transform hover:scale-110"
                    title="Select Courts"
                >
                    <i className="fa-solid fa-table-cells"></i>
                </button>
            </div>

            <ZTOHeader tournamentName={tournament.name} logoUrl={tournament.config?.logo_url} />

            <div className={`w-full h-full flex flex-col items-center pt-24 pb-8 px-4 overflow-y-auto ${activeMatches.length === 0 ? 'justify-center' : ''}`}>
                <AnimatePresence mode="wait">
                    {displayMode === 'match_list' ? (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-6xl mx-auto h-[80vh]"
                        >
                            <MatchListDisplay matches={matches} players={players} tournament={tournament} />
                        </motion.div>
                    ) : displayMode === 'tournament_bracket' ? (
                        <motion.div
                            key="bracket"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-[1600px] mx-auto h-[85vh]"
                        >
                            <TournamentBracket matches={matches} players={players} tournament={tournament} />
                        </motion.div>
                    ) : activeMatches.length === 0 ? (
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
                        <div className={`w-full max-w-[2400px] mx-auto relative z-10 grid gap-6
                            ${filteredMatches.length === 1 ? 'grid-cols-1 h-[80vh]' : ''}
                            ${filteredMatches.length === 2 ? 'grid-cols-1 xl:grid-cols-2 h-auto xl:h-[80vh]' : ''}
                            ${filteredMatches.length >= 3 && filteredMatches.length <= 4 ? 'grid-cols-1 lg:grid-cols-2 h-auto' : ''}
                            ${filteredMatches.length >= 5 && filteredMatches.length <= 6 ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 h-auto' : ''}
                            ${filteredMatches.length >= 7 ? 'grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 h-auto' : ''}
                        `}>
                            {filteredMatches.map((match) => (
                                <div key={match.id} className={`relative w-full rounded-3xl overflow-hidden shadow-2xl border border-white/5 ${filteredMatches.length > 2 ? 'aspect-[16/9]' : 'h-full min-h-[500px]'}`}>
                                    <MatchCard
                                        match={match}
                                        p1={players[match.player1_id || '']}
                                        p2={players[match.player2_id || '']}
                                        activeAd={ads[currentAdIndex]}
                                        sportType={tournament.type}
                                        logoUrl={tournament.config?.logo_url}
                                        bgUrl={tournament.config?.bg_url}
                                        now={now}
                                        isGrid={filteredMatches.length > 1}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* --- COURT SELECTOR MODAL --- */}
            <AnimatePresence>
                {showCourtSelector && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setShowCourtSelector(false)}
                    >
                        <div
                            className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white uppercase tracking-wider">Select Courts to Display</h3>
                                <button onClick={() => setShowCourtSelector(false)} className="text-white/50 hover:text-white transition">
                                    <i className="fa-solid fa-xmark text-2xl"></i>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto mb-6">
                                {activeMatches.map(match => {
                                    const isSelected = selectedCourts.includes(match.id);
                                    return (
                                        <button
                                            key={match.id}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedCourts(prev => prev.filter(id => id !== match.id));
                                                } else {
                                                    if (selectedCourts.length >= 6 && !isSelected) {
                                                        alert("Maximum 6 courts can be displayed at once.");
                                                        return;
                                                    }
                                                    setSelectedCourts(prev => [...prev, match.id]);
                                                }
                                            }}
                                            className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${isSelected ? 'bg-indigo-600/20 border-indigo-500' : 'bg-zinc-800/50 border-white/5 hover:bg-zinc-800'}`}
                                        >
                                            <div className={`w-6 h-6 rounded border flex items-center justify-center transition ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-white/20'}`}>
                                                {isSelected && <i className="fa-solid fa-check text-white text-xs"></i>}
                                            </div>
                                            <div className="text-left">
                                                <div className="text-xs font-bold text-white/50 uppercase tracking-wider">{match.court_id || 'Main Court'}</div>
                                                <div className="text-sm font-bold text-white">
                                                    {players[match.player1_id || '']?.name || 'Home'} vs {players[match.player2_id || '']?.name || 'Away'}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                                <button
                                    onClick={() => setSelectedCourts([])}
                                    className="px-4 py-2 text-white/50 hover:text-white font-bold text-sm uppercase transition"
                                >
                                    Clear All
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedCourts(activeMatches.map(m => m.id).slice(0, 6));
                                    }}
                                    className="px-4 py-2 text-white/50 hover:text-white font-bold text-sm uppercase transition"
                                >
                                    Select All (Max 6)
                                </button>
                                <button
                                    onClick={() => setShowCourtSelector(false)}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-wider rounded-lg shadow-lg"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- FULL SCREEN COMMERCIAL BREAK OVERLAY --- */}
            <AnimatePresence>
                {showAdOverlay && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className="fixed inset-0 z-[1000] bg-black overflow-hidden flex flex-col items-center justify-center text-white font-sans"
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
                        {!adToDisplay ? (
                            <div className="text-xl font-bold text-white/50">Waiting for ad content...</div>
                        ) : adToDisplay.type === 'video' ? (
                            adToDisplay.url.includes('youtu') ? (
                                <div key={adToDisplay.url} className="relative w-full h-full max-w-none max-h-none bg-black overflow-hidden flex items-center justify-center">
                                    <div id="youtube-player" className="absolute top-1/2 left-1/2 w-[110vw] h-[110vh] -translate-x-1/2 -translate-y-1/2 pointer-events-none border-none scale-100" />
                                </div>
                            ) : (
                                <video
                                    src={adToDisplay.url}
                                    autoPlay
                                    loop
                                    muted={true}
                                    playsInline
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
