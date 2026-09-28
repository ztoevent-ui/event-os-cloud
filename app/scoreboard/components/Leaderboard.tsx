"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';

export function Leaderboard({ teams }: { teams: any[] }) {
  // Sort by score desc, then by id to ensure stable sort when scores tie
  const sorted = [...teams].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });
  
  return (
    <div className="flex flex-col gap-5 w-full max-w-4xl mx-auto p-4">
      {/* framer-motion layout animations for smooth vertical reordering */}
      <AnimatePresence>
        {sorted.map((team, index) => (
          <motion.div
            key={team.id}
            layout
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="flex items-center justify-between p-6 rounded-2xl backdrop-blur-xl shadow-2xl border transition-all duration-300"
            style={{
               backgroundColor: `${team.color_hex}1A`, // ~10% opacity for glassmorphism
               borderColor: `${team.color_hex}40`,
               boxShadow: `0 8px 32px 0 ${team.color_hex}20`
            }}
          >
            <div className="flex items-center gap-8">
              <div 
                className="text-5xl font-black italic w-12 text-center" 
                style={{ color: team.color_hex, opacity: 0.8 }}
              >
                {index + 1}
              </div>
              <div className="flex items-center gap-4">
                {team.logo_url && (
                  <img src={team.logo_url} alt={team.name} className="w-12 h-12 object-contain" />
                )}
                <h2 className="text-4xl font-bold text-white tracking-widest uppercase">
                  {team.name}
                </h2>
              </div>
            </div>
            <div className="text-6xl font-black tracking-tighter" style={{ 
               color: team.color_hex,
               textShadow: `0 0 30px ${team.color_hex}80` 
            }}>
              <AnimatedNumber value={team.score || 0} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
