'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface HeaderProps {
    tournamentName: string;
}

export function ZTOHeader({ tournamentName }: HeaderProps) {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex justify-center items-center py-4 pointer-events-none">
            <div className="relative">
                <motion.h1
                    className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 animate-flow drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    ZTO ARENA <span className="mx-2 text-white/50">-</span> <span className="text-white drop-shadow-md">{tournamentName}</span>
                </motion.h1>
                <div className="absolute inset-0 blur-xl opacity-30 bg-gold-gradient rounded-full -z-10 animate-pulse"></div>
            </div>
        </header>
    );
}
