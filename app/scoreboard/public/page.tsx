"use client";
import useSWR from 'swr';
import { Leaderboard } from '../components/Leaderboard';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PublicScoreboard() {
  const { data, error, isLoading } = useSWR('/api/scoreboard', fetcher, {
    refreshInterval: 3000,
    revalidateOnFocus: true,
  });

  return (
    <div className="min-h-screen bg-[#080808] text-white selection:bg-white/20" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Ambient glow top */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(ellipse at top, #3b82f620 0%, transparent 70%)' }} />

      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-[#080808]/80 border-b border-white/[0.05] px-6 py-5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black tracking-[0.4em] text-zinc-600 uppercase mb-0.5">Shell MDS Sarawak</p>
            <h1 className="text-lg font-black text-white uppercase tracking-tight">Family Day 2026</h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Live</span>
          </div>
        </div>
      </div>

      <main className="max-w-xl mx-auto pt-8 pb-28 px-0">
        {/* Section label */}
        <div className="px-6 mb-6 flex items-center justify-between">
          <p className="text-[9px] font-black tracking-[0.4em] text-zinc-600 uppercase">Team Rankings</p>
          <p className="text-[9px] text-zinc-700 font-bold">Refreshes every 3s</p>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-4 px-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="mx-4 p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-center">
            <div className="text-2xl mb-2">⚠️</div>
            <p className="text-xs font-black text-red-400 uppercase tracking-widest">Connection Error</p>
            <p className="text-[10px] text-zinc-600 mt-1">Retrying automatically...</p>
          </div>
        )}

        {data && <Leaderboard teams={data.teams} variant="public" />}

        {/* Mini bar chart for mobile */}
        {data && (
          <div className="mt-10 px-4">
            <p className="text-[9px] font-black tracking-[0.4em] text-zinc-700 uppercase mb-5">Score Overview</p>
            <div className="flex flex-col gap-3">
              {[...data.teams].sort((a: any, b: any) => b.score - a.score).map((team: any) => {
                const maxScore = Math.max(...data.teams.map((t: any) => t.score), 1);
                const pct = Math.max((team.score / maxScore) * 100, 2);
                return (
                  <div key={team.id} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: team.color_hex }} />
                    <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${team.color_hex}, ${team.color_hex}80)` }}
                      />
                    </div>
                    <span className="text-[10px] font-black text-zinc-400 tabular-nums w-12 text-right">
                      {team.score.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Sticky footer bar */}
      <div className="fixed bottom-0 inset-x-0 bg-[#080808]/90 backdrop-blur-xl border-t border-white/[0.05] py-4 text-center">
        <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Powered by Event OS</p>
      </div>
    </div>
  );
}
