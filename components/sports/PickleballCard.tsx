import React from 'react';
import { Player, Match, SponsorAd } from '@/lib/sports/types';
import { motion, AnimatePresence } from 'framer-motion';

// Update Props Interface
interface PickleballCardProps {
    match: Match;
    p1: Player | undefined;
    p2: Player | undefined;
    activeAd?: SponsorAd;
    logoUrl?: string;
    bgUrl?: string;
    now: Date;
    isGrid?: boolean; // NEW
}

export function PickleballCard({ match, p1, p2, activeAd, logoUrl, bgUrl, now, isGrid = false }: PickleballCardProps) {
    // --- Logic & State ---
    const setHistory = match.periods_scores || [];
    const currentSetNum = setHistory.length + 1;
    const isSwapSides = (match.sets_p1 + match.sets_p2) % 2 === 1;

    // Transition Logic
    const [showTransition, setShowTransition] = React.useState(false);
    const prevSetNumRef = React.useRef(currentSetNum);

    React.useEffect(() => {
        if (currentSetNum > prevSetNumRef.current) {
            setShowTransition(true);
            const timer = setTimeout(() => setShowTransition(false), 3500);
            return () => clearTimeout(timer);
        }
        prevSetNumRef.current = currentSetNum;
    }, [currentSetNum]);

    // Derived Data for Transition
    const lastSet = setHistory.length > 0 ? setHistory[setHistory.length - 1] : null;
    const lastSetWinner = lastSet ? (lastSet.p1 > lastSet.p2 ? p1 : p2) : null;

    // Helper for Player Rendering
    const PlayerDisplay = ({ player, color, align }: { player: Player | undefined, color: 'blue' | 'green', align: 'left' | 'right' }) => {
        const isServing = match.serving_player_id === player?.id;
        const borderColor = color === 'blue' ? 'border-blue-500' : 'border-green-500';
        const shadowColor = color === 'blue' ? 'rgba(59,130,246,0.4)' : 'rgba(34,197,94,0.4)';
        const glowColor = color === 'blue' ? 'bg-blue-500/30' : 'bg-green-500/30';

        // Dynamic Sizes
        const avatarStyle = isGrid ? 'w-24 h-24 lg:w-28 lg:h-28' : 'w-48 md:w-64 h-48 md:h-64';
        const flagStyle = isGrid ? 'w-8 h-8 border-2' : 'w-12 h-12 md:w-16 md:h-16 border-2 md:border-4';
        const paddleStyle = isGrid ? 'w-8 h-8' : 'w-12 h-12 md:w-16 md:h-16';
        const paddleIconSize = isGrid ? 'text-sm' : 'text-xl md:text-3xl';

        // Name Formatting
        const parts = (player?.name || 'TBD').split(' ');
        const lastName = parts[parts.length - 1];
        const firstNames = parts.slice(0, -1).join(' ');

        return (
            <div className={`flex flex-col items-center w-1/3`}>
                <div className={`relative ${isGrid ? 'mb-4' : 'mb-6 md:mb-10'}`}>
                    {/* Glow */}
                    <div className={`absolute inset-[-10px] rounded-full ${glowColor} blur-2xl animate-pulse`}></div>

                    {/* Avatar */}
                    <div className={`${avatarStyle} rounded-full border-[4px] md:border-[6px] ${borderColor} p-1 md:p-2 relative z-10 bg-slate-900 overflow-hidden shadow-[0_0_40px_${shadowColor}] transition-all duration-500`}>
                        <img
                            src={player?.avatar_url || `https://via.placeholder.com/400x400?text=${player?.name?.charAt(0) || 'P'}`}
                            className="w-full h-full object-cover rounded-full"
                            alt={player?.name}
                        />
                    </div>

                    {/* Flag */}
                    <div className={`absolute bottom-0 ${align === 'left' ? 'left-0 md:left-2' : 'right-0 md:right-2'} md:bottom-2 ${flagStyle} rounded-full border-slate-950 bg-white overflow-hidden z-20 shadow-xl`}>
                        <img src={player?.country_code || "https://flagcdn.com/us.svg"} className="w-full h-full object-cover scale-110" alt="Flag" />
                    </div>

                    {/* Serving Badge */}
                    <AnimatePresence>
                        {isServing && (
                            <motion.div
                                initial={{ scale: 0, rotate: align === 'left' ? -45 : 45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className={`absolute -top-2 ${align === 'left' ? '-left-2 md:-left-4' : '-right-2 md:-right-4'} md:-top-4 ${paddleStyle} bg-white rounded-full flex items-center justify-center shadow-2xl z-20 border-2 ${borderColor}`}
                            >
                                <i className={`fa-solid fa-table-tennis-paddle-ball text-slate-900 ${paddleIconSize}`}></i>
                                {/* Optional: Show Server Number if we want on display? User didn't explicitly ask for it on Display, only Call. */}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Name Block */}
                <div className="flex flex-col items-center">
                    {align === 'left' ? (
                        <>
                            <span className={`${isGrid ? 'text-3xl' : 'text-4xl'} font-black uppercase tracking-widest leading-tight`}>{lastName}
                                {isSwapSides && <span className="block text-[8px] opacity-50 tracking-normal">(SWAP)</span>}
                            </span>
                            <span className={`${isGrid ? 'text-xl' : 'text-2xl'} font-medium text-white/80 leading-tight`}>{firstNames}</span>
                        </>
                    ) : (
                        <>
                            <span className={`${isGrid ? 'text-xl' : 'text-2xl'} font-medium text-white/80 leading-tight`}>{firstNames}</span>
                            <span className={`${isGrid ? 'text-3xl' : 'text-4xl'} font-black uppercase tracking-widest leading-tight`}>{lastName}
                                {isSwapSides && <span className="block text-[8px] opacity-50 tracking-normal">(SWAP)</span>}
                            </span>
                        </>
                    )}
                </div>
            </div>
        );
    };

    // Styling Constants
    const mainScoreSize = isGrid ? 'text-6xl lg:text-7xl' : 'text-8xl md:text-[10rem]';
    const setPillSize = isGrid ? 'w-8 h-8 text-sm lg:w-10 lg:h-10 lg:text-base' : 'w-16 h-16 md:w-20 md:h-20 text-2xl md:text-4xl';
    const containerPadding = isGrid ? 'px-4 lg:px-8' : 'px-8 md:px-20';
    const badgeClass = isGrid ? 'mt-4 px-4 py-1 text-xs font-black' : 'mt-8 md:mt-16 px-6 md:px-12 py-2 md:py-3 text-lg md:text-2xl';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-full h-full bg-black overflow-hidden flex flex-col items-center justify-center text-white font-sans"
        >
            {/* --- GAME TRANSITION OVERLAY --- */}
            <AnimatePresence>
                {showTransition && lastSet && !match.winner_id && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center text-center p-8"
                    >
                        <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-widest mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            Game {setHistory.length} Complete
                        </h2>
                        <div className="text-6xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400 mb-8 animate-pulse">
                            {lastSetWinner?.name || 'TBD'} WINS
                        </div>
                        <div className="text-2xl md:text-4xl font-bold text-white/60">
                            Final Score: {lastSet.p1}-{lastSet.p2}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- MATCH END OVERLAY (Retire, Walkover, or Complete) --- */}
            <AnimatePresence>
                {(match.status === 'retired' || match.status === 'walkover' || match.status === 'completed') && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-[110] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-8"
                    >
                        <h2 className={`text-5xl md:text-7xl font-black uppercase tracking-widest mb-8 animate-pulse ${match.status === 'completed' ? 'text-indigo-400' : 'text-red-500'}`}>
                            {match.status === 'retired' ? 'MATCH RETIRED' : (match.status === 'walkover' ? 'WALKOVER' : 'MATCH COMPLETE')}
                        </h2>

                        <div className="text-6xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-4 uppercase">
                            {(match.winner_id === p1?.id ? p1?.name : p2?.name) || 'WINNER'} WINS
                        </div>

                        <div className="text-3xl md:text-5xl font-bold text-white/60 uppercase tracking-widest">
                            {match.status === 'retired' && '(Won by RET)'}
                            {match.status === 'walkover' && '(Won by WO)'}
                            {match.status === 'completed' && `${match.sets_p1} - ${match.sets_p2}`}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- BACKGROUND LAYER --- */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 z-10"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_black_90%)] z-10"></div>
                <img
                    src={bgUrl || "https://images.unsplash.com/photo-1593344484962-796055d4a3a4?q=80&w=2600&auto=format&fit=crop"}
                    className="w-full h-full object-cover opacity-60 grayscale-[0.5]"
                    alt="Background"
                />
            </div>

            {/* --- ARENA CONTENT --- */}
            <div className={`relative z-20 w-full max-w-7xl flex items-center justify-between ${containerPadding}`}>

                {/* LEFT SLOT */}
                {/* Normal: P1 (Blue). Swap: P2 (Green) */}
                <PlayerDisplay
                    player={isSwapSides ? p2 : p1}
                    color={isSwapSides ? 'green' : 'blue'}
                    align="left"
                />

                {/* CENTER AREA: SCORES & TIMER */}
                <div className="flex flex-col items-center flex-1">
                    {/* Timer Area */}
                    <div className={`flex items-center gap-6 md:gap-12 mb-4 md:mb-16 ${isGrid ? 'scale-90 mb-2' : 'scale-100'}`}>
                        <div className="flex items-center gap-2 md:gap-4">
                            <i className={`fa-regular fa-clock text-blue-400 ${isGrid ? 'text-xl' : 'text-3xl'}`}></i>
                            <span className={`${isGrid ? 'text-2xl' : 'text-4xl'} font-bold tabular-nums text-white`}>
                                {(() => {
                                    if (!match.started_at) return "00:00";
                                    const diff = Math.floor((now.getTime() - new Date(match.started_at).getTime()) / 1000);
                                    const m = Math.floor(diff / 60);
                                    const s = diff % 60;
                                    return `${m}:${s.toString().padStart(2, '0')}`;
                                })()}
                            </span>
                        </div>
                    </div>

                    {/* CURRENT SCORE BAR */}
                    <div className="flex flex-col items-center w-full max-w-md">
                        <div className={`${isGrid ? 'text-sm mb-2' : 'text-xl mb-6'} font-black uppercase tracking-[0.3em] text-white/80`}>
                            {match.round_name || 'TOURNAMENT'} • GAME {currentSetNum}
                        </div>

                        <div className="flex items-center justify-between w-full mb-2 md:mb-4 px-2 md:px-4 gap-2 md:gap-4">
                            {/* Left Score: P1 score normally. If Swap -> P2 Score? */}
                            {/* Visually, the Left Score should correspond to the Left Player. */}
                            {/* If Swapped, Left Player is P2. So Left Score should be P2 Score. */}
                            <span className={`${mainScoreSize} leading-none font-black drop-shadow-2xl transition-all duration-300`}>
                                {isSwapSides ? match.current_score_p2 : match.current_score_p1}
                            </span>

                            <div className="flex-1 px-2 lg:px-8">
                                <div className={`${isGrid ? 'h-3' : 'h-4 lg:h-6'} w-full rounded-full bg-white/10 overflow-hidden flex shadow-inner border border-white/5`}>
                                    {/* Progress Bar: Needs to adhere to Left/Right logic */}
                                    <div
                                        className={`h-full ${isSwapSides ? 'bg-green-500' : 'bg-blue-600'} transition-all duration-500`}
                                        style={{ width: `${((isSwapSides ? match.current_score_p2 : match.current_score_p1) / (Math.max(match.current_score_p1 + match.current_score_p2, 1))) * 100}%` }}
                                    ></div>
                                    <div
                                        className={`h-full ${isSwapSides ? 'bg-blue-600' : 'bg-green-500'} transition-all duration-500`}
                                        style={{ width: `${((isSwapSides ? match.current_score_p1 : match.current_score_p2) / (Math.max(match.current_score_p1 + match.current_score_p2, 1))) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            <span className={`${mainScoreSize} leading-none font-black drop-shadow-2xl transition-all duration-300`}>
                                {isSwapSides ? match.current_score_p1 : match.current_score_p2}
                            </span>
                        </div>
                    </div>

                    {/* SET HISTORY PILLS */}
                    <div className={`flex gap-2 md:gap-12 mt-2 md:mt-12 ${isGrid ? 'mt-2' : ''}`}>
                        {setHistory.map((set, idx) => (
                            <div key={idx} className="flex gap-1 md:gap-2">
                                {/* P1 Score / P2 Score? Or Left/Right? */}
                                {/* History usually keeps P1/P2 fixed order or aligned to names. */}
                                {/* Let's keep P1/P2 fixed order in pills to match official stat sheet, but maybe confusing visually if players swapped? */}
                                {/* Actually, standard scoreboards often keep P1 Left, P2 Right and just update scores. */}
                                {/* But user explicitly asked for "Physical Position Swap". */}
                                {/* If physical swap, then "Left" pill should be P2's score in that set? */}
                                {/* No, Set History usually stays strictly "P1 vs P2". */}
                                {/* I will keep Fixed P1/P2 order for history to be consistent with data, but maybe color code them? */}
                                {/* Current impl: P1 is always Blue logic. */}
                                <div className={`${setPillSize} rounded-full flex items-center justify-center font-black border md:border-2 ${set.p1 > set.p2 ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-700/50 border-white/10 text-white/50'}`}>
                                    {set.p1}
                                </div>
                                <div className={`${setPillSize} rounded-full flex items-center justify-center font-black border md:border-2 ${set.p2 > set.p1 ? 'bg-green-600 border-green-400 text-white' : 'bg-slate-700/50 border-white/10 text-white/50'}`}>
                                    {set.p2}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* H2H Badge */}
                    <div className={`${badgeClass} bg-blue-800 rounded-full shadow-xl cursor-default uppercase whitespace-nowrap`}>
                        Pickleball Tour
                    </div>
                </div>

                {/* RIGHT SLOT */}
                {/* Normal: P2 (Green). Swap: P1 (Blue) */}
                <PlayerDisplay
                    player={isSwapSides ? p1 : p2}
                    color={isSwapSides ? 'blue' : 'green'}
                    align="right"
                />

            </div>

            {/* --- AD BANNER / FOOTER (SUBTLE) --- */}
            <div className={`absolute bottom-2 md:bottom-8 left-0 right-0 ${isGrid ? 'px-4' : 'px-20'} flex justify-between items-end opacity-40`}>
                <div className="flex items-center gap-4">
                    <span className={`font-bold ${isGrid ? 'text-[0.6rem]' : 'text-xs'}`}>PPA OFFICIAL PARTNER</span>
                </div>
                {!isGrid && (
                    <div className="text-right">
                        <div className="text-blue-400 font-black italic text-2xl">ZTO ARENA</div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default PickleballCard;
