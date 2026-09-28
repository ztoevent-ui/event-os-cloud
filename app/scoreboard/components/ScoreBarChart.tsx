"use client";
import { motion } from 'framer-motion';

interface Team {
  id: string;
  name: string;
  color_hex: string;
  score: number;
}

export function ScoreBarChart({ teams }: { teams: Team[] }) {
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const maxScore = Math.max(...teams.map(t => t.score), 1);

  return (
    <div className="w-full flex items-end justify-center gap-6 px-8" style={{ height: '340px' }}>
      {sorted.map((team, i) => {
        const heightPct = Math.max((team.score / maxScore) * 100, 2);
        const rank = i + 1;
        return (
          <div key={team.id} className="flex flex-col items-center flex-1 max-w-[220px]" style={{ height: '100%', justifyContent: 'flex-end' }}>
            {/* Score label above bar */}
            <motion.div
              layout
              className="text-3xl font-black mb-3 tabular-nums"
              style={{ color: team.color_hex, textShadow: `0 0 40px ${team.color_hex}80` }}
            >
              {team.score.toLocaleString()}
            </motion.div>

            {/* The bar */}
            <div className="relative w-full flex items-end" style={{ height: '260px' }}>
              <motion.div
                layout
                className="w-full rounded-t-2xl relative overflow-hidden"
                initial={{ height: '2%' }}
                animate={{ height: `${heightPct}%` }}
                transition={{ type: 'spring', stiffness: 60, damping: 20 }}
                style={{
                  background: `linear-gradient(180deg, ${team.color_hex} 0%, ${team.color_hex}55 100%)`,
                  boxShadow: `0 -12px 60px ${team.color_hex}50, inset 0 1px 0 ${team.color_hex}`,
                }}
              >
                {/* Shimmer effect */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, white 50%, transparent 100%)',
                    animation: 'shimmer 2.5s infinite',
                    backgroundSize: '200% 100%',
                  }}
                />
                {/* Rank badge inside bar top */}
                <div
                  className="absolute top-3 left-0 right-0 flex justify-center"
                >
                  <span
                    className="text-xs font-black px-2 py-0.5 rounded-full"
                    style={{ background: `${team.color_hex}40`, color: 'white', border: `1px solid ${team.color_hex}60` }}
                  >
                    #{rank}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Team name below */}
            <div className="mt-4 text-center">
              <div
                className="w-3 h-3 rounded-full mx-auto mb-2"
                style={{ background: team.color_hex, boxShadow: `0 0 12px ${team.color_hex}` }}
              />
              <div className="text-sm font-black tracking-widest uppercase text-white">
                {team.name}
              </div>
            </div>
          </div>
        );
      })}

      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
