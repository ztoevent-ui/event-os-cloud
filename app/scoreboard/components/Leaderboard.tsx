"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';

interface Team {
  id: string;
  name: string;
  color_hex: string;
  logo_url?: string;
  score: number;
}

const RANK_LABELS = ['1ST', '2ND', '3RD', '4TH'];
const RANK_SIZES = ['text-7xl', 'text-6xl', 'text-5xl', 'text-4xl'];
const RANK_CARD_H = ['h-36', 'h-32', 'h-28', 'h-24'];

export function Leaderboard({ teams, variant = 'public' }: { teams: Team[]; variant?: 'public' | 'broadcast' }) {
  const sorted = [...teams].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });

  if (variant === 'broadcast') {
    return (
      <div className="flex flex-col gap-3 w-full max-w-5xl mx-auto">
        <AnimatePresence>
          {sorted.map((team, index) => {
            const maxScore = Math.max(...teams.map(t => t.score), 1);
            const pct = teams.length > 0 ? Math.max((team.score / maxScore) * 100, 3) : 3;

            return (
              <motion.div
                key={team.id}
                layout
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30, delay: index * 0.05 }}
                className={`relative flex items-center overflow-hidden rounded-xl border ${RANK_CARD_H[index] || 'h-20'}`}
                style={{ borderColor: `${team.color_hex}25`, background: `linear-gradient(135deg, ${team.color_hex}0F 0%, transparent 100%)` }}
              >
                {/* Animated progress bar background */}
                <motion.div
                  className="absolute left-0 top-0 bottom-0 rounded-xl"
                  initial={{ width: '0%' }}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                  style={{ background: `linear-gradient(90deg, ${team.color_hex}30 0%, ${team.color_hex}06 100%)` }}
                />

                {/* Left accent bar */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl" style={{ background: team.color_hex }} />

                {/* Rank number */}
                <div className="relative z-10 w-20 text-center shrink-0">
                  <span className="text-xs font-black tracking-widest" style={{ color: `${team.color_hex}90` }}>
                    {RANK_LABELS[index] || `${index + 1}TH`}
                  </span>
                </div>

                {/* Team color dot + name */}
                <div className="relative z-10 flex items-center gap-4 flex-1 min-w-0 px-4">
                  <div
                    className="w-5 h-5 rounded-full shrink-0"
                    style={{ background: team.color_hex, boxShadow: `0 0 16px ${team.color_hex}` }}
                  />
                  <span className="text-2xl font-black tracking-widest text-white uppercase truncate">
                    {team.name}
                  </span>
                </div>

                {/* Score */}
                <div className={`relative z-10 pr-8 font-black tabular-nums ${RANK_SIZES[index] || 'text-3xl'}`} style={{ color: team.color_hex, textShadow: `0 0 40px ${team.color_hex}70` }}>
                  <AnimatedNumber value={team.score} />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  }

  // Public mobile variant
  return (
    <div className="flex flex-col gap-4 w-full max-w-xl mx-auto px-4">
      <AnimatePresence>
        {sorted.map((team, index) => (
          <motion.div
            key={team.id}
            layout
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30, delay: index * 0.06 }}
            className="relative flex items-center gap-5 p-5 rounded-2xl overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${team.color_hex}18 0%, #111111 100%)`,
              border: `1px solid ${team.color_hex}30`,
              boxShadow: `0 4px 32px ${team.color_hex}15`,
            }}
          >
            {/* Glow bg */}
            <div className="absolute right-0 top-0 bottom-0 w-32 opacity-10 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at right, ${team.color_hex}, transparent)` }} />

            {/* Rank badge */}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0"
              style={{ background: `${team.color_hex}20`, color: team.color_hex, border: `1px solid ${team.color_hex}30` }}>
              {index + 1}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <div className="font-black text-white text-base uppercase tracking-wider truncate">
                {team.name}
              </div>
              <div className="text-xs text-zinc-600 font-bold uppercase tracking-widest mt-0.5">Total Score</div>
            </div>

            {/* Score */}
            <div className="text-3xl font-black shrink-0" style={{ color: team.color_hex }}>
              <AnimatedNumber value={team.score} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
