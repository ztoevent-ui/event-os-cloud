'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import type { ArenaMatch } from '@/lib/arena-types';

// Aesthetic Colors
const TOURNAMENT_GREEN = '#022c22'; // Emerald baseline
const LIGHT_COURT_GREEN = '#0f766e'; // Teal/green highlight
const ACCENT_GOLD = '#f59e0b'; // Server highlight
const CYBER_CYAN = '#22d3ee'; // Info highlight

export default function BadmintonKioskLivePage() {
    const [matches, setMatches] = useState<ArenaMatch[]>([]);
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const channelRef = useRef<any>(null);

    // Refresh current time for the clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Load matches
    const loadMatches = async () => {
        const { data } = await supabase
            .from('arena_matches')
            .select('*')
            .in('status', ['LIVE', 'PENDING'])
            .order('court_number', { ascending: true, nullsFirst: false });
        if (data) setMatches(data as ArenaMatch[]);
    };

    useEffect(() => {
        loadMatches();

        // Subscribe to real-time changes
        const channel = supabase.channel('kiosk-badminton-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'arena_matches' }, () => {
                loadMatches();
            })
            .subscribe();

        channelRef.current = channel;
        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, []);

    // Define fixed 5 courts
    const courtsList = [1, 2, 3, 4, 5];

    // Helper: Determine serving box coordinate on SVG (width 120, height 80)
    // Left side: Even = bottom-left (Y: 40-70), Odd = top-left (Y: 10-40)
    // Right side: Even = top-right (Y: 10-40), Odd = bottom-right (Y: 40-70)
    const getServingBox = (match: ArenaMatch) => {
        const isTeamALeft = match.left_team ? match.left_team === 'A' : true;
        const isServerA = match.server === 'A';
        const serverScore = isServerA ? match.score_a : match.score_b;
        const isEven = serverScore % 2 === 0;
        
        const serverOnLeft = isServerA ? isTeamALeft : !isTeamALeft;
        
        if (serverOnLeft) {
            // Left side
            return {
                x: 8,
                y: isEven ? 40 : 10,
                width: 32,
                height: 30
            };
        } else {
            // Right side
            return {
                x: 80,
                y: isEven ? 10 : 40,
                width: 32,
                height: 30
            };
        }
    };

    // Helper to extract matches for ticker (matches not assigned to 1-5, or general list of pending)
    const unassignedOrQueueMatches = matches.filter(
        m => m.status === 'PENDING' && (!m.court_number || m.court_number > 5)
    );

    return (
        <div className="min-h-screen bg-[#030712] text-white font-sans overflow-hidden flex flex-col relative select-none">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-35">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#047857]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#0e7490]/10 rounded-full blur-[120px]" />
                <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
            </div>

            {/* Header */}
            <header className="relative z-10 px-8 py-5 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#0f766e]/10 border border-[#0f766e]/20 shadow-[0_0_20px_rgba(15,118,110,0.15)]">
                        <i className="fa-solid fa-satellite text-[#22d3ee] text-xl animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-white leading-none">
                            ZTO <span className="text-[#059669]">BADMINTON</span> LIVE
                        </h1>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-[0.3em] mt-1.5 font-black">
                            Arena Operations Screen // 5 Courts Master Console
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-2xl font-black text-[#22d3ee] tabular-nums tracking-widest leading-none">
                            {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                        </div>
                        <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mt-1">
                            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </div>
                    </div>
                </div>
            </header>

            {/* 5-Court Fixed Grid */}
            <main className="flex-1 relative z-10 p-6 flex flex-col overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 flex-1 h-full min-h-0 overflow-y-auto lg:overflow-visible">
                    {courtsList.map((courtNum) => {
                        // Find matches assigned to this court
                        const courtMatches = matches.filter(m => m.court_number === courtNum);
                        const liveMatch = courtMatches.find(m => m.status === 'LIVE');
                        // If no live match, pick the first pending match assigned to this court
                        const pendingMatch = !liveMatch ? courtMatches.find(m => m.status === 'PENDING') : null;

                        // Render card based on status
                        if (liveMatch) {
                            const servingBox = getServingBox(liveMatch);
                            const isTeamALeft = liveMatch.left_team ? liveMatch.left_team === 'A' : true;
                            
                            return (
                                <motion.div 
                                    key={`court-${courtNum}`}
                                    layout
                                    className="bg-gradient-to-b from-[#022c22]/90 via-[#021f18]/95 to-[#022c22]/90 border border-[#059669]/30 rounded-2xl p-5 flex flex-col justify-between shadow-[0_4px_30px_rgba(4,120,87,0.15)] relative overflow-hidden"
                                >
                                    {/* Glowing Court Accents */}
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#059669]/50" />
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#059669]/50" />
                                    
                                    {/* Court Header */}
                                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                        <span className="bg-[#059669] text-black font-black text-[11px] px-3 py-1 rounded uppercase tracking-wider shadow-[0_0_15px_rgba(5,150,105,0.4)]">
                                            COURT {courtNum}
                                        </span>
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                                            <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">LIVE</span>
                                        </div>
                                    </div>

                                    {/* Category / Event Type */}
                                    <div className="text-center my-3">
                                        <span className="text-[10px] font-black text-[#22d3ee]/80 uppercase tracking-widest bg-[#22d3ee]/10 px-2 py-0.5 rounded border border-[#22d3ee]/20">
                                            {liveMatch.event_type || 'INDIVIDUAL'} • {liveMatch.round_type}
                                        </span>
                                    </div>

                                    {/* Teams & Scores (Vertical Layout for Badminton) */}
                                    <div className="flex-1 flex flex-col justify-center gap-4 my-2">
                                        {/* Team A */}
                                        <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                            liveMatch.server === 'A' 
                                                ? 'bg-[#0f766e]/10 border-[#0f766e]/30 shadow-[inset_0_0_15px_rgba(15,118,110,0.15)]' 
                                                : 'bg-black/20 border-white/5'
                                        }`}>
                                            <div className="flex-1 min-w-0 pr-3">
                                                <div className="flex items-center gap-2">
                                                    {liveMatch.server === 'A' && (
                                                        <span className="inline-block text-[#f59e0b] animate-bounce shrink-0 text-sm" style={{ transform: 'rotate(45deg)' }}>🏸</span>
                                                    )}
                                                    <span className={`text-xs font-black uppercase truncate tracking-wide ${liveMatch.server === 'A' ? 'text-white' : 'text-zinc-400'}`}>
                                                        {liveMatch.team_a_name}
                                                    </span>
                                                </div>
                                                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block mt-0.5">
                                                    {isTeamALeft ? 'Left End' : 'Right End'}
                                                </span>
                                            </div>
                                            <span className={`text-4xl font-black tabular-nums ${liveMatch.server === 'A' ? 'text-[#f59e0b] drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'text-white'}`}>
                                                {liveMatch.score_a}
                                            </span>
                                        </div>

                                        {/* Team B */}
                                        <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                            liveMatch.server === 'B' 
                                                ? 'bg-[#0f766e]/10 border-[#0f766e]/30 shadow-[inset_0_0_15px_rgba(15,118,110,0.15)]' 
                                                : 'bg-black/20 border-white/5'
                                        }`}>
                                            <div className="flex-1 min-w-0 pr-3">
                                                <div className="flex items-center gap-2">
                                                    {liveMatch.server === 'B' && (
                                                        <span className="inline-block text-[#f59e0b] animate-bounce shrink-0 text-sm" style={{ transform: 'rotate(45deg)' }}>🏸</span>
                                                    )}
                                                    <span className={`text-xs font-black uppercase truncate tracking-wide ${liveMatch.server === 'B' ? 'text-white' : 'text-zinc-400'}`}>
                                                        {liveMatch.team_b_name}
                                                    </span>
                                                </div>
                                                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block mt-0.5">
                                                    {!isTeamALeft ? 'Left End' : 'Right End'}
                                                </span>
                                            </div>
                                            <span className={`text-4xl font-black tabular-nums ${liveMatch.server === 'B' ? 'text-[#f59e0b] drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'text-white'}`}>
                                                {liveMatch.score_b}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Set Score History & Court View Container */}
                                    <div className="border-t border-white/5 pt-4 mt-2 space-y-4">
                                        {/* Completed Sets Scores */}
                                        <div className="flex flex-col items-center">
                                            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider mb-1.5">Set Score Logs</span>
                                            <div className="flex gap-2">
                                                {liveMatch.sets_scores && liveMatch.sets_scores.slice(0, liveMatch.current_set - 1).map((set, idx) => (
                                                    <span key={idx} className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[9px] font-black text-zinc-300">
                                                        S{idx + 1}: {set.a}-{set.b}
                                                    </span>
                                                ))}
                                                <span className="bg-[#059669]/10 border border-[#059669]/30 px-2 py-0.5 rounded text-[9px] font-black text-[#059669]">
                                                    Set {liveMatch.current_set} (Active)
                                                </span>
                                            </div>
                                        </div>

                                        {/* Small Badminton Court Graphic */}
                                        <div className="flex flex-col items-center justify-center bg-black/40 rounded-xl p-2 border border-white/5">
                                            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Court Position Map</span>
                                            <div className="relative">
                                                <svg viewBox="0 0 120 80" className="w-32 h-20 opacity-80 select-none rounded border border-white/10">
                                                    {/* Background Mat */}
                                                    <rect x="0" y="0" width="120" height="80" fill="#047857" opacity="0.35" />
                                                    
                                                    {/* Outer border */}
                                                    <rect x="4" y="4" width="112" height="72" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.7" />
                                                    
                                                    {/* Singles sidelines (inner) */}
                                                    <line x1="4" y1="10" x2="116" y2="10" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.4" />
                                                    <line x1="4" y1="70" x2="116" y2="70" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.4" />
                                                    
                                                    {/* Net Center */}
                                                    <line x1="60" y1="4" x2="60" y2="76" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="2 2" strokeOpacity="0.9" />
                                                    
                                                    {/* Short service lines */}
                                                    <line x1="40" y1="4" x2="40" y2="76" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.7" />
                                                    <line x1="80" y1="4" x2="80" y2="76" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.7" />
                                                    
                                                    {/* Long service lines for doubles */}
                                                    <line x1="12" y1="4" x2="12" y2="76" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.4" />
                                                    <line x1="108" y1="4" x2="108" y2="76" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.4" />
                                                    
                                                    {/* Center lines */}
                                                    <line x1="4" y1="40" x2="40" y2="40" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.7" />
                                                    <line x1="80" y1="40" x2="116" y2="40" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.7" />

                                                    {/* Glow Serving Quadrant */}
                                                    <rect 
                                                        x={servingBox.x} 
                                                        y={servingBox.y} 
                                                        width={servingBox.width} 
                                                        height={servingBox.height} 
                                                        fill="#f59e0b" 
                                                        opacity="0.3" 
                                                        className="animate-pulse"
                                                    />
                                                </svg>
                                                {/* Shuttlecock Overlay indicator */}
                                                <div 
                                                    className="absolute text-[8px] pointer-events-none transition-all duration-500 font-bold"
                                                    style={{ 
                                                        left: `${servingBox.x + servingBox.width/2 - 4}px`, 
                                                        top: `${servingBox.y + servingBox.height/2 - 4}px` 
                                                    }}
                                                >
                                                    🏸
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        }

                        if (pendingMatch) {
                            return (
                                <motion.div 
                                    key={`court-${courtNum}`}
                                    layout
                                    className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                        <span className="bg-zinc-800 text-zinc-400 font-black text-[11px] px-3 py-1 rounded uppercase tracking-wider">
                                            COURT {courtNum}
                                        </span>
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded">
                                            <i className="fa-solid fa-bullhorn text-amber-500 text-[10px] animate-pulse" />
                                            <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">CALLING</span>
                                        </div>
                                    </div>

                                    <div className="text-center my-4">
                                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                                            UP NEXT AT COURT
                                        </span>
                                    </div>

                                    <div className="flex-1 flex flex-col justify-center gap-3">
                                        <div className="bg-black/30 border border-white/5 p-3 rounded-xl">
                                            <div className="text-zinc-400 text-xs font-bold text-center truncate">{pendingMatch.team_a_name}</div>
                                            <div className="text-zinc-600 font-black text-[9px] text-center my-1.5">VS</div>
                                            <div className="text-zinc-400 text-xs font-bold text-center truncate">{pendingMatch.team_b_name}</div>
                                        </div>
                                    </div>

                                    <div className="border-t border-white/5 pt-4 mt-3 text-center">
                                        <div className="text-[#22d3ee] text-[9px] font-black uppercase tracking-widest mb-1.5">
                                            {pendingMatch.event_type || 'INDIVIDUAL'}
                                        </div>
                                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">
                                            {pendingMatch.round_type}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        }

                        // Standby Court
                        return (
                            <motion.div 
                                key={`court-${courtNum}`}
                                layout
                                className="bg-[#050505] border border-white/5 rounded-2xl p-5 flex flex-col justify-between items-center text-center relative overflow-hidden"
                            >
                                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff, #fff 1px, transparent 1px, transparent 10px)', backgroundSize: '15px 15px' }} />
                                
                                <div className="w-full border-b border-white/5 pb-3 flex justify-between items-center relative z-10">
                                    <span className="text-zinc-600 font-black text-[11px] uppercase tracking-wider">
                                        COURT {courtNum}
                                    </span>
                                    <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">STANDBY</span>
                                </div>

                                <div className="my-auto py-8 relative z-10 flex flex-col items-center justify-center">
                                    <div className="w-12 h-12 bg-white/[0.02] border border-white/10 rounded-full flex items-center justify-center mb-4">
                                        <i className="fa-solid fa-tower-observation text-zinc-700 text-lg" />
                                    </div>
                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">COURT OPEN</span>
                                    <span className="text-[8px] text-zinc-800 uppercase tracking-[0.2em] font-black mt-1">Awaiting Scheduler</span>
                                </div>

                                <div className="w-full border-t border-white/5 pt-3 mt-3 relative z-10">
                                    <span className="text-[8px] text-zinc-700 uppercase tracking-[0.3em] font-black">ZTO ARENA OS</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </main>

            {/* Bottom Marquee / Queue Ticker */}
            <footer className="relative z-10 h-16 bg-[#090d16] border-t border-white/5 flex items-center overflow-hidden">
                <div className="bg-[#059669] h-full flex items-center px-6 font-black text-black uppercase tracking-[0.2em] text-[10px] shrink-0 z-20 shadow-[10px_0_20px_rgba(0,0,0,0.3)]">
                    UPCOMING MATCHES
                </div>
                
                <div className="flex-1 relative overflow-hidden flex items-center">
                    {unassignedOrQueueMatches.length > 0 ? (
                        <div className="flex whitespace-nowrap animate-[marquee_120s_linear_infinite]">
                            {/* Duplicate twice for seamless scrolling */}
                            {[...unassignedOrQueueMatches, ...unassignedOrQueueMatches].map((match, idx) => (
                                <span key={`${match.id}-${idx}`} className="mx-12 text-zinc-300 font-bold text-xs flex items-center gap-4">
                                    <span className="text-[#22d3ee] font-black uppercase text-[9px] bg-[#22d3ee]/10 px-1.5 py-0.5 rounded border border-[#22d3ee]/20">
                                        {match.event_type || 'MATCH'}
                                    </span>
                                    <span className="uppercase text-white font-black">{match.team_a_name}</span>
                                    <span className="text-zinc-600 text-[9px] font-black">VS</span>
                                    <span className="uppercase text-white font-black">{match.team_b_name}</span>
                                    <i className="fa-solid fa-arrow-right-long text-zinc-700 ml-2" />
                                </span>
                            ))}
                        </div>
                    ) : (
                        <div className="px-8 text-zinc-500 font-black text-[9px] uppercase tracking-widest">
                            No other matches currently scheduled in queue. All active games dispatched.
                        </div>
                    )}
                </div>
            </footer>

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}} />
        </div>
    );
}
