'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface HeaderProps {
    tournamentName: string;
    logoUrl?: string; // NEW
}

export function ZTOHeader({ tournamentName, logoUrl }: HeaderProps) {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-8 py-4 pointer-events-none bg-gradient-to-b from-black/80 to-transparent">
            {/* Left: Brand */}
            <div className="flex items-center gap-3">
                {logoUrl ? (
                    <img src={logoUrl} className="h-10 w-auto object-contain" alt="Tournament Logo" />
                ) : (
                    <div className="w-10 h-10 bg-zto-gold rounded flex items-center justify-center font-black text-black shadow-[0_0_15px_#D4AF37]">
                        ZTO
                    </div>
                )}
                <div className="flex flex-col">
                    <span className="text-zto-gold font-bold tracking-[0.2em] text-sm italic">ARENA</span>
                </div>
            </div>

            {/* Center: Tournament Name (Elegant) */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-1/2 -translate-x-1/2 text-center"
            >
                <div className="px-6 py-1 border border-zto-gold/30 bg-black/40 backdrop-blur rounded-full">
                    <span className="text-white font-medium text-lg tracking-wide uppercase">{tournamentName}</span>
                </div>
            </motion.div>

            {/* Right: Live Indicator */}
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-red-500 font-bold text-xs tracking-widest uppercase">Live</span>
            </div>
        </header>
    );
}
