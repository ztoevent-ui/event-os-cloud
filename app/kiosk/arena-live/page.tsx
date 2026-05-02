'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import type { ArenaMatch } from '@/lib/arena-types';

// Aesthetic Colors
const CYBER_LIME = '#ccff00';
const SPACEX_DARK = '#050505';

export default function KioskArenaLivePage() {
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

        // Subscribing to ALL arena_matches that are LIVE or PENDING
        const channel = supabase.channel('kiosk-arena-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'arena_matches' }, () => {
                loadMatches();
            })
            .subscribe();

        channelRef.current = channel;
        return () => { supabase.removeChannel(channelRef.current); };
    }, []);

    const liveMatches = matches.filter(m => m.status === 'LIVE');
    const pendingMatches = matches.filter(m => m.status === 'PENDING').slice(0, 10); // Show next 10

    return (
        <div className="min-h-screen bg-[#050505] text-white font-['Urbanist'] overflow-hidden flex flex-col relative select-none">
            {/* SpaceX style grid background */}
            <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(204,255,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(204,255,0,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            {/* Header */}
            <header className="relative z-10 px-8 py-6 border-b border-white/5 flex items-center justify-between bg-black/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/20 shadow-[0_0_20px_rgba(204,255,0,0.15)]">
                        <i className="fa-solid fa-satellite-dish text-[#ccff00] text-xl animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-widest text-white leading-none">Live <span className="text-[#ccff00]">Arena</span></h1>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-[0.4em] mt-1 font-bold">Kiosk Sync Protocol // Online</p>
                    </div>
                </div>
                <div className="text-right flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-2xl font-black text-[#ccff00] tabular-nums tracking-widest">{currentTime.toLocaleTimeString('en-US', { hour12: false })}</div>
                        <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                    </div>
                </div>
            </header>

            {/* Main Content Grid */}
            <div className="flex-1 relative z-10 flex overflow-hidden">
                {/* Left: Active Courts */}
                <div className="flex-1 border-r border-white/5 p-8 flex flex-col h-full overflow-hidden">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-3 h-3 bg-[#ccff00] shadow-[0_0_15px_#ccff00] animate-pulse" />
                        <h2 className="text-lg font-black uppercase tracking-[0.3em] text-[#ccff00]">Active Courts</h2>
                    </div>

                    <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6 overflow-hidden relative">
                        <AnimatePresence>
                            {liveMatches.length === 0 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700">
                                    <i className="fa-solid fa-tower-observation text-6xl mb-4 opacity-50" />
                                    <div className="text-sm font-black uppercase tracking-widest">No Active Matches</div>
                                </motion.div>
                            )}
                            {liveMatches.map((match) => (
                                <motion.div key={match.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                    className="bg-[#ccff00]/[0.02] border border-[#ccff00]/20 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center">
                                    {/* Glowing corner accents */}
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#ccff00] opacity-50" />
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#ccff00] opacity-50" />
                                    
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="px-3 py-1 bg-[#ccff00] text-black font-black text-[10px] uppercase tracking-widest shadow-[0_0_15px_rgba(204,255,0,0.5)]">
                                            Court {match.court_number || '?'}
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-[#ccff00] opacity-70">
                                            {match.round_type}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 text-center">
                                            <div className="text-lg font-black uppercase tracking-tight text-white mb-2 truncate px-2">{match.team_a_name}</div>
                                            <div className="text-7xl font-black tabular-nums text-[#ccff00] drop-shadow-[0_0_15px_rgba(204,255,0,0.3)]">{match.score_a}</div>
                                        </div>
                                        <div className="text-zinc-600 font-black text-2xl px-2">VS</div>
                                        <div className="flex-1 text-center">
                                            <div className="text-lg font-black uppercase tracking-tight text-white mb-2 truncate px-2">{match.team_b_name}</div>
                                            <div className="text-7xl font-black tabular-nums text-[#ccff00] drop-shadow-[0_0_15px_rgba(204,255,0,0.3)]">{match.score_b}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-black text-[#ccff00]/50 uppercase tracking-[0.4em]">
                                        Set {match.current_set}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right: Up Next */}
                <div className="w-[450px] p-8 flex flex-col h-full bg-black/20">
                    <div className="flex items-center gap-3 mb-8">
                        <i className="fa-solid fa-hourglass-half text-zinc-500" />
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-400">Next to Court</h2>
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col gap-4">
                        <AnimatePresence>
                            {pendingMatches.length === 0 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center text-zinc-700 text-[10px] font-black uppercase tracking-widest">
                                    No Pending Matches
                                </motion.div>
                            )}
                            {pendingMatches.map((match, idx) => (
                                <motion.div key={match.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ delay: idx * 0.05 }}
                                    className="bg-white/[0.02] border border-white/10 p-4 rounded-xl flex items-center justify-between">
                                    <div className="flex-1 pr-4">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                                            {match.round_type} • {match.event_type || 'Event'}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-zinc-300 truncate max-w-[120px]">{match.team_a_name}</span>
                                            <span className="text-[9px] font-black text-zinc-700 mx-2">VS</span>
                                            <span className="text-xs font-bold text-zinc-300 truncate max-w-[120px]">{match.team_b_name}</span>
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 bg-white/5 border border-white/10 flex flex-col items-center justify-center shrink-0">
                                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">CRT</span>
                                        <span className="text-lg font-black text-white leading-none">{match.court_number || '-'}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Footer / Sponsor Ticker */}
            <footer className="relative z-10 h-16 bg-white flex items-center overflow-hidden">
                <div className="bg-[#ccff00] h-full flex items-center px-6 font-black text-black uppercase tracking-[0.3em] text-[10px] shrink-0 z-20 shadow-[10px_0_20px_rgba(0,0,0,0.2)]">
                    Official Partners
                </div>
                <div className="flex-1 relative overflow-hidden flex items-center group">
                    <div className="flex whitespace-nowrap animate-[marquee_20s_linear_infinite]">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <span key={i} className="mx-8 text-black font-black uppercase tracking-widest text-sm flex items-center gap-8 opacity-60">
                                <i className="fa-solid fa-bolt text-[#ccff00] drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
                                ZTO EVENT OS
                                <i className="fa-solid fa-bolt text-[#ccff00] drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
                                BINTULU PICKLEBALL OPEN 2026
                            </span>
                        ))}
                    </div>
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
