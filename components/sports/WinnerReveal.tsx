'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Player } from '@/lib/sports/types';

interface WinnerRevealProps {
    winner: Player;
    tournamentName: string;
}

export function WinnerReveal({ winner, tournamentName }: WinnerRevealProps) {
    useEffect(() => {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl">
            <h2 className="text-4xl text-zto-gold font-bold uppercase tracking-widest mb-8 animate-bounce">
                {tournamentName} Champion
            </h2>

            <div className="relative">
                <div className="w-64 h-64 rounded-full border-4 border-zto-gold shadow-[0_0_50px_#D4AF37] overflow-hidden mb-8">
                    {winner.avatar_url ? (
                        <img src={winner.avatar_url} alt={winner.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-zto-gold flex items-center justify-center text-6xl font-black text-black">
                            {winner.name.charAt(0)}
                        </div>
                    )}
                </div>
                <div className="absolute -inset-4 bg-gradient-to-t from-zto-gold/50 to-transparent blur-xl rounded-full -z-10 animate-pulse"></div>
            </div>

            <h1 className="text-8xl font-black text-white drop-shadow-[0_4px_0_#D4AF37] mb-4">
                {winner.name}
            </h1>
        </div>
    );
}
