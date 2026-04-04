'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import type { ArenaMatch, MatchStatus, RoundType } from '@/lib/arena-types';

// ——————————————————————————————————————————————————
// TYPES & CONFIG
// ——————————————————————————————————————————————————
const STATUS_CONFIG: Record<MatchStatus, {
  label: string; dot: string; bg: string; border: string; text: string;
}> = {
  PENDING:     { label: 'Pending',     dot: 'bg-zinc-600',    bg: 'bg-zinc-900',     border: 'border-white/5',          text: 'text-zinc-400' },
  LIVE:        { label: 'LIVE',        dot: 'bg-emerald-400 animate-pulse', bg: 'bg-emerald-950/30', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  SIDE_SWITCH: { label: 'Switching',   dot: 'bg-amber-400 animate-bounce',  bg: 'bg-amber-950/20',   border: 'border-amber-500/20',  text: 'text-amber-400' },
  COMPLETED:   { label: 'Completed',   dot: 'bg-blue-400',    bg: 'bg-zinc-950',     border: 'border-blue-500/10',       text: 'text-blue-400' },
};

const ROUND_COLORS: Record<RoundType, string> = {
  GROUP:      'text-emerald-400',
  KNOCKOUT:   'text-amber-400',
  SEMIFINALS: 'text-orange-400',
  FINALS:     'text-yellow-400',
};

// ——————————————————————————————————————————————————
// MATCH CARD
// ——————————————————————————————————————————————————
function MatchCard({ match }: { match: ArenaMatch }) {
  const cfg = STATUS_CONFIG[match.status];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`${cfg.bg} border ${cfg.border} rounded-2xl p-4 relative overflow-hidden`}
    >
      {/* Status badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
          <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.text}`}>{cfg.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {match.court_number && (
            <span className="text-[9px] font-bold text-zinc-600 uppercase">Court {match.court_number}</span>
          )}
          <span className={`text-[9px] font-black uppercase tracking-widest ${ROUND_COLORS[match.round_type]}`}>
            {match.round_type}
          </span>
        </div>
      </div>

      {/* Score */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 text-right">
          <div className="text-xs text-zinc-400 font-bold truncate">{match.team_a_name}</div>
          {match.status !== 'PENDING' && (
            <div className={`text-3xl font-black tabular-nums ${match.winner === 'A' ? 'text-emerald-400' : 'text-white'}`}>
              {match.score_a}
            </div>
          )}
        </div>
        <div className="text-zinc-700 font-black text-xs px-1">—</div>
        <div className="flex-1 text-left">
          <div className="text-xs text-zinc-400 font-bold truncate">{match.team_b_name}</div>
          {match.status !== 'PENDING' && (
            <div className={`text-3xl font-black tabular-nums ${match.winner === 'B' ? 'text-emerald-400' : 'text-white'}`}>
              {match.score_b}
            </div>
          )}
        </div>
      </div>

      {/* Winner badge */}
      {match.status === 'COMPLETED' && match.winner && (
        <div className="mt-2 text-center">
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
            🏆 {match.winner === 'A' ? match.team_a_name : match.team_b_name}
          </span>
        </div>
      )}

      {/* Side switch indicator */}
      {match.status === 'SIDE_SWITCH' && (
        <div className="mt-2 text-center">
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest animate-pulse">
            ↔ Players Switching Sides
          </span>
        </div>
      )}

      {/* Referee */}
      {match.referee_name && (
        <div className="mt-2 text-[9px] text-zinc-700 font-bold">Ref: {match.referee_name}</div>
      )}
    </motion.div>
  );
}

// ——————————————————————————————————————————————————
// STATS ROW
// ——————————————————————————————————————————————————
function StatPill({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <div className={`flex flex-col items-center px-6 py-3 rounded-2xl border ${color}`}>
      <span className="text-2xl font-black text-white tabular-nums">{n}</span>
      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mt-0.5">{label}</span>
    </div>
  );
}

// ——————————————————————————————————————————————————
// DIRECTOR DASHBOARD
// ——————————————————————————————————————————————————
export default function DirectorDashboardPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [matches, setMatches] = useState<ArenaMatch[]>([]);
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const channelRef = useRef<any>(null);
  const tournamentIdRef = useRef<string | null>(null);

  const loadMatches = async (tId: string) => {
    const { data } = await supabase
      .from('arena_matches')
      .select('*')
      .eq('tournament_id', tId)
      .order('court_number', { ascending: true, nullsFirst: false });
    if (data) {
      setMatches(data as ArenaMatch[]);
      setLastUpdate(new Date());
    }
  };

  useEffect(() => {
    async function init() {
      const { data: t } = await supabase
        .from('arena_tournaments')
        .select('*')
        .or(`id.eq.${eventId},event_id_slug.eq.${eventId}`)
        .single();

      if (!t) { setLoading(false); return; }
      setTournament(t);
      tournamentIdRef.current = t.id;
      await loadMatches(t.id);
      setLoading(false);

      // Real-time subscription on arena_matches table
      const channel = supabase
        .channel(`director-${eventId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'arena_matches',
            filter: `tournament_id=eq.${t.id}`,
          },
          () => {
            if (tournamentIdRef.current) loadMatches(tournamentIdRef.current);
          }
        )
        .subscribe();

      channelRef.current = channel;
    }
    init();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [eventId]);

  // Group matches by status
  const live = matches.filter((m) => m.status === 'LIVE');
  const switching = matches.filter((m) => m.status === 'SIDE_SWITCH');
  const pending = matches.filter((m) => m.status === 'PENDING');
  const completed = matches.filter((m) => m.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <header className="z-20 bg-zinc-950 border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0">
        <div className="flex items-center gap-6">
          <Link
            href="/apps/zto-arena"
            className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-600 hover:text-white transition-colors tracking-widest group"
          >
            <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform" />
            Arena Hub
          </Link>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-rose-600/20 text-rose-400 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-chart-line text-sm" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest text-white">Director Dashboard</h1>
              <p className="text-[10px] text-zinc-600 font-bold">{tournament?.name || '...'} • Real-time</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-[9px] text-zinc-700 font-bold uppercase">
            Updated {lastUpdate.toLocaleTimeString()}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Live</span>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
        </div>
      ) : (
        <main className="p-6 max-w-7xl mx-auto">
          {/* Stats Row */}
          <div className="flex flex-wrap gap-3 mb-8">
            <StatPill n={live.length} label="Live" color="border-emerald-500/20 bg-emerald-950/20" />
            <StatPill n={switching.length} label="Switching" color="border-amber-500/20 bg-amber-950/20" />
            <StatPill n={pending.length} label="Pending" color="border-zinc-700 bg-zinc-900" />
            <StatPill n={completed.length} label="Done" color="border-blue-500/20 bg-blue-950/20" />
            <StatPill n={matches.length} label="Total" color="border-white/10 bg-zinc-900" />
          </div>

          {/* Four columns (or stacked on mobile) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* LIVE */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-[11px] font-black uppercase tracking-widest text-emerald-400">Live ({live.length})</h2>
              </div>
              <div className="space-y-3">
                <AnimatePresence>
                  {live.map((m) => <MatchCard key={m.id} match={m} />)}
                </AnimatePresence>
                {live.length === 0 && (
                  <div className="text-zinc-700 text-xs font-bold text-center py-8 border border-white/5 rounded-2xl">No live matches</div>
                )}
              </div>
            </div>

            {/* SIDE SWITCH */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-bounce" />
                <h2 className="text-[11px] font-black uppercase tracking-widest text-amber-400">Switching ({switching.length})</h2>
              </div>
              <div className="space-y-3">
                <AnimatePresence>
                  {switching.map((m) => <MatchCard key={m.id} match={m} />)}
                </AnimatePresence>
                {switching.length === 0 && (
                  <div className="text-zinc-700 text-xs font-bold text-center py-8 border border-white/5 rounded-2xl">No side switches pending</div>
                )}
              </div>
            </div>

            {/* PENDING */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Pending ({pending.length})</h2>
              </div>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                <AnimatePresence>
                  {pending.map((m) => (
                    <MatchCard key={m.id} match={m} />
                  ))}
                </AnimatePresence>
                {pending.length === 0 && (
                  <div className="text-zinc-700 text-xs font-bold text-center py-8 border border-white/5 rounded-2xl">No pending matches</div>
                )}
              </div>
            </div>

            {/* COMPLETED */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <h2 className="text-[11px] font-black uppercase tracking-widest text-blue-400">Completed ({completed.length})</h2>
              </div>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                <AnimatePresence>
                  {completed.map((m) => <MatchCard key={m.id} match={m} />)}
                </AnimatePresence>
                {completed.length === 0 && (
                  <div className="text-zinc-700 text-xs font-bold text-center py-8 border border-white/5 rounded-2xl">No completed matches</div>
                )}
              </div>
            </div>
          </div>

          {/* No matches at all */}
          {matches.length === 0 && (
            <div className="text-center py-24 text-zinc-700">
              <i className="fa-solid fa-calendar-xmark text-5xl mb-4 block" />
              <p className="font-bold text-sm">No matches configured yet.</p>
              <p className="text-xs mt-2">Set up matches in the Master Console → Bracket tab.</p>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
