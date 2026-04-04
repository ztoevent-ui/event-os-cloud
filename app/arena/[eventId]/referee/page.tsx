'use client';

import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import type { ArenaMatch, RoundRule, TeamSlot } from '@/lib/arena-types';
import {
  detectSetWinner,
  detectMatchWinner,
  checkMidSetSwitchPoint,
  handleSideOutScore,
  handleRallyScore,
  swapSides,
  advanceToNextSet,
  enqueueOfflineRequest,
  replayOfflineQueue,
} from '@/lib/arena-engine';

// ——————————————————————————————————————————————————
// TYPES
// ——————————————————————————————————————————————————
type Phase = 'SELECT' | 'SCORING' | 'SIDE_SWITCH' | 'MATCH_END';

// ——————————————————————————————————————————————————
// MATCH SELECTOR
// ——————————————————————————————————————————————————
function MatchSelector({
  eventId,
  onSelectMatch,
}: {
  eventId: string;
  onSelectMatch: (match: ArenaMatch, rule: RoundRule) => void;
}) {
  const [matches, setMatches] = useState<ArenaMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refereeName, setRefereeName] = useState('');

  useEffect(() => {
    async function load() {
      // Get tournament id from slug
      const { data: t } = await supabase
        .from('arena_tournaments')
        .select('id')
        .eq('event_id_slug', eventId)
        .single();

      if (!t) { setLoading(false); return; }

      const { data } = await supabase
        .from('arena_matches')
        .select('*')
        .eq('tournament_id', t.id)
        .in('status', ['PENDING', 'LIVE'])
        .order('court_number');

      setMatches((data as ArenaMatch[]) || []);
      setLoading(false);
    }
    load();
  }, [eventId]);

  const handleClaim = async (match: ArenaMatch) => {
    if (!refereeName.trim()) {
      alert('Enter your name first');
      return;
    }
    const session = crypto.randomUUID();

    // Claim match
    const { error } = await supabase
      .from('arena_matches')
      .update({ referee_name: refereeName, referee_session: session, status: 'LIVE' })
      .eq('id', match.id)
      .eq('status', 'PENDING'); // only claim if still pending

    if (error) { alert('Match already claimed or error: ' + error.message); return; }

    // Load round rule
    const { data: tData } = await supabase
      .from('arena_tournaments')
      .select('id')
      .eq('event_id_slug', eventId)
      .single();

    const { data: rule } = await supabase
      .from('arena_round_rules')
      .select('*')
      .eq('tournament_id', tData?.id)
      .eq('round_type', match.round_type)
      .single();

    // Reload match with updated fields
    const { data: updatedMatch } = await supabase
      .from('arena_matches')
      .select('*')
      .eq('id', match.id)
      .single();

    if (updatedMatch && rule) {
      onSelectMatch(updatedMatch as ArenaMatch, rule as RoundRule);
    }
  };

  const roundColors: Record<string, string> = {
    GROUP: 'text-emerald-400 border-emerald-500/20',
    KNOCKOUT: 'text-amber-400 border-amber-500/20',
    SEMIFINALS: 'text-orange-400 border-orange-500/20',
    FINALS: 'text-yellow-400 border-yellow-500/20',
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-[0_0_30px_rgba(37,99,235,0.4)]">
            <i className="fa-solid fa-user-tie" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-white">Referee Console</h1>
          <p className="text-zinc-500 text-sm mt-2 uppercase tracking-wider">Select your match to begin scoring</p>
        </div>

        {/* Referee Name */}
        <div className="mb-6">
          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Your Name</label>
          <input
            type="text"
            value={refereeName}
            onChange={(e) => setRefereeName(e.target.value)}
            placeholder="Referee name..."
            className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold text-base focus:outline-none focus:border-blue-500 transition-all placeholder-zinc-700"
          />
        </div>

        {loading ? (
          <div className="text-center text-zinc-600 py-12">
            <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs uppercase tracking-widest">Loading matches...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center text-zinc-600 py-12 border border-white/5 rounded-3xl">
            <i className="fa-solid fa-calendar-xmark text-4xl mb-4 block" />
            <p className="text-sm font-bold">No active matches found</p>
            <p className="text-xs mt-2 text-zinc-700">Contact the Master Console to assign matches.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => (
              <button
                key={match.id}
                onClick={() => handleClaim(match)}
                className="w-full bg-zinc-900 border border-white/5 hover:border-blue-500/30 rounded-2xl p-5 text-left transition-all group hover:bg-zinc-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest border rounded-lg px-2 py-1 ${roundColors[match.round_type] || 'text-zinc-400 border-white/10'}`}>
                    {match.round_type} {match.court_number ? `• Court ${match.court_number}` : ''}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${match.status === 'LIVE' ? 'text-red-500' : 'text-zinc-600'}`}>
                    {match.status === 'LIVE' ? '🔴 LIVE' : 'PENDING'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-black text-white text-base flex-1 truncate">{match.team_a_name}</span>
                  <span className="text-zinc-600 font-black text-xs">VS</span>
                  <span className="font-black text-white text-base flex-1 truncate text-right">{match.team_b_name}</span>
                </div>
                <div className="mt-3 text-[10px] font-black text-blue-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Tap to claim this match →
                </div>
              </button>
            ))}
          </div>
        )}

        <Link
          href="/apps/zto-arena"
          className="block text-center mt-8 text-zinc-600 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
        >
          ← Back to Arena Hub
        </Link>
      </div>
    </div>
  );
}

// ——————————————————————————————————————————————————
// SIDE SWITCH MODAL
// ——————————————————————————————————————————————————
function SideSwitchModal({ onConfirm }: { onConfirm: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center text-center p-8"
    >
      <motion.div
        initial={{ scale: 0.5, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="mb-8"
      >
        <div className="w-24 h-24 bg-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_60px_rgba(245,158,11,0.5)]">
          <i className="fa-solid fa-arrows-left-right text-4xl text-black" />
        </div>
        <h1 className="text-5xl font-black uppercase tracking-widest text-white mb-3">SWITCH SIDES</h1>
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Players change ends of court</p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={onConfirm}
        className="bg-amber-500 text-black font-black text-xl uppercase tracking-widest px-16 py-6 rounded-3xl shadow-[0_0_40px_rgba(245,158,11,0.4)] hover:bg-amber-400 transition-all active:scale-95"
      >
        ✓ Confirmed — Sides Switched
      </motion.button>
    </motion.div>
  );
}

// ——————————————————————————————————————————————————
// MATCH END OVERLAY
// ——————————————————————————————————————————————————
function MatchEndOverlay({ winner, countdown }: { winner: string; countdown: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center text-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <div className="w-28 h-28 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_80px_rgba(16,185,129,0.6)]">
          <i className="fa-solid fa-trophy text-5xl text-black" />
        </div>
      </motion.div>
      <h1 className="text-3xl font-black text-zinc-400 uppercase tracking-widest mb-2">Winner</h1>
      <h2 className="text-6xl font-black text-white uppercase tracking-widest mb-8 max-w-lg">{winner}</h2>
      <p className="text-zinc-500 text-lg font-bold uppercase tracking-widest">
        Auto-submitting in <span className="text-emerald-400 font-black text-2xl">{countdown}</span>s
      </p>
    </motion.div>
  );
}

// ——————————————————————————————————————————————————
// SCORING SCREEN
// ——————————————————————————————————————————————————
function ScoringScreen({
  initialMatch,
  rule,
  eventId,
}: {
  initialMatch: ArenaMatch;
  rule: RoundRule;
  eventId: string;
}) {
  const [match, setMatch] = useState<ArenaMatch>(initialMatch);
  const [phase, setPhase] = useState<Phase>('SCORING');
  const [winnerName, setWinnerName] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineCount, setOfflineCount] = useState(0);
  const channelRef = useRef<any>(null);
  const scoringFrozen = phase !== 'SCORING';

  // Online/offline detection + replay
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const replayed = await replayOfflineQueue();
      if (replayed > 0) console.log(`[Arena] Silently replayed ${replayed} offline events`);
      setOfflineCount(0);
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Realtime subscription for external updates (director override)
  useEffect(() => {
    const channel = supabase
      .channel(`match-${match.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'arena_matches', filter: `id=eq.${match.id}` },
        (payload) => {
          setMatch(payload.new as ArenaMatch);
        }
      )
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [match.id]);

  // Match end countdown
  useEffect(() => {
    if (phase !== 'MATCH_END') return;
    const iv = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(iv);
          submitMatchEnd();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [phase]);

  const persistScore = useCallback(async (updatedMatch: ArenaMatch, eventType: string, extra: Record<string, any> = {}) => {
    const body = JSON.stringify({
      match_id: updatedMatch.id,
      score_a: updatedMatch.score_a,
      score_b: updatedMatch.score_b,
      server: updatedMatch.server,
      left_team: updatedMatch.left_team,
      sets_won_a: updatedMatch.sets_won_a,
      sets_won_b: updatedMatch.sets_won_b,
      current_set: updatedMatch.current_set,
      sets_scores: updatedMatch.sets_scores,
      status: updatedMatch.status,
      ...extra,
    });

    const url = `/api/arena/score`;

    if (!navigator.onLine) {
      enqueueOfflineRequest({ url, method: 'POST', body });
      setOfflineCount((c) => c + 1);
      return;
    }

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
    } catch {
      enqueueOfflineRequest({ url, method: 'POST', body });
      setOfflineCount((c) => c + 1);
    }
  }, []);

  const handleScore = useCallback((tappedSide: 'LEFT' | 'RIGHT') => {
    if (scoringFrozen) return;

    // Map physical side to logical team
    const scoringTeam: TeamSlot = tappedSide === 'LEFT'
      ? match.left_team
      : (match.left_team === 'A' ? 'B' : 'A');

    let newScoreA = match.score_a;
    let newScoreB = match.score_b;
    let newServer = match.server;

    if (rule.scoring_type === 'SIDE_OUT') {
      const result = handleSideOutScore(match, scoringTeam);
      newScoreA = result.newScoreA;
      newScoreB = result.newScoreB;
      newServer = result.newServer;
    } else {
      const result = handleRallyScore(match, scoringTeam);
      newScoreA = result.newScoreA;
      newScoreB = result.newScoreB;
      newServer = result.newServer;
    }

    // Check mid-set side switch
    const shouldSwitch = checkMidSetSwitchPoint(newScoreA, newScoreB, rule);

    // Check set winner
    const setWinner = detectSetWinner(newScoreA, newScoreB, rule);

    let updatedMatch: ArenaMatch = { ...match, score_a: newScoreA, score_b: newScoreB, server: newServer };

    if (setWinner) {
      // Advance set
      const { setsWonA, setsWonB, newSetsScores, newCurrentSet } = advanceToNextSet(updatedMatch, rule, setWinner);
      updatedMatch = {
        ...updatedMatch,
        sets_won_a: setsWonA,
        sets_won_b: setsWonB,
        sets_scores: newSetsScores,
        current_set: newCurrentSet,
        score_a: 0,
        score_b: 0,
      };

      // Check match winner
      const matchWinner = detectMatchWinner(updatedMatch, rule);
      if (matchWinner) {
        updatedMatch = { ...updatedMatch, status: 'COMPLETED', winner: matchWinner };
        setMatch(updatedMatch);
        setWinnerName(matchWinner === 'A' ? match.team_a_name : match.team_b_name);
        setPhase('MATCH_END');
        persistScore(updatedMatch, 'MATCH_END', { winner: matchWinner });
        return;
      }
    }

    if (shouldSwitch && !setWinner) {
      updatedMatch = { ...updatedMatch, status: 'SIDE_SWITCH' };
      setMatch(updatedMatch);
      setPhase('SIDE_SWITCH');
      persistScore(updatedMatch, 'SIDE_SWITCH');
      return;
    }

    setMatch(updatedMatch);
    persistScore(updatedMatch, scoringTeam === 'A' ? 'SCORE_A' : 'SCORE_B');
  }, [match, rule, scoringFrozen, persistScore]);

  const handleSideSwitchConfirmed = useCallback(() => {
    const { leftTeam } = swapSides(match);
    const updatedMatch: ArenaMatch = { ...match, left_team: leftTeam, status: 'LIVE' };
    setMatch(updatedMatch);
    setPhase('SCORING');
    persistScore(updatedMatch, 'SIDE_SWITCH_CONFIRMED');
  }, [match, persistScore]);

  const submitMatchEnd = useCallback(async () => {
    try {
      await fetch('/api/arena/match-end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id, winnerId: match.winner, eventId }),
      });
    } catch {
      enqueueOfflineRequest({
        url: '/api/arena/match-end',
        method: 'POST',
        body: JSON.stringify({ matchId: match.id, winnerId: match.winner, eventId }),
      });
    }
    window.location.href = `/arena/${eventId}/referee`;
  }, [match.id, match.winner, eventId]);

  // Determine left/right teams
  const leftTeam = match.left_team === 'A' ? match.team_a_name : match.team_b_name;
  const rightTeam = match.left_team === 'A' ? match.team_b_name : match.team_a_name;
  const leftScore = match.left_team === 'A' ? match.score_a : match.score_b;
  const rightScore = match.left_team === 'A' ? match.score_b : match.score_a;
  const leftSetsWon = match.left_team === 'A' ? match.sets_won_a : match.sets_won_b;
  const rightSetsWon = match.left_team === 'A' ? match.sets_won_b : match.sets_won_a;
  const isLeftServing = rule.scoring_type === 'SIDE_OUT'
    ? match.server === match.left_team
    : false;

  const roundColors: Record<string, string> = {
    GROUP: 'bg-emerald-500', KNOCKOUT: 'bg-amber-500', SEMIFINALS: 'bg-orange-500', FINALS: 'bg-yellow-500',
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col select-none overflow-hidden relative">
      <AnimatePresence>
        {phase === 'SIDE_SWITCH' && <SideSwitchModal onConfirm={handleSideSwitchConfirmed} />}
        {phase === 'MATCH_END' && <MatchEndOverlay winner={winnerName} countdown={countdown} />}
      </AnimatePresence>

      {/* Header strip */}
      <div className="z-10 bg-black border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 ${roundColors[match.round_type] || 'bg-zinc-700'} text-black font-black text-[10px] uppercase tracking-widest rounded-lg`}>
            {match.round_type}
          </div>
          {match.court_number && (
            <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Court {match.court_number}</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* Offline indicator */}
          {offlineCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{offlineCount} queued</span>
            </div>
          )}
          <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
          <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">
            Set {match.current_set} of {rule.max_sets}
          </span>
          {/* Scoring type indicator */}
          <span className="text-[10px] text-zinc-700 font-black uppercase tracking-widest">
            {rule.scoring_type === 'RALLY' ? '⚡ Rally' : '🏓 Side-out'}
          </span>
        </div>
      </div>

      {/* SET HISTORY */}
      {match.sets_scores.length > 0 && (
        <div className="z-10 bg-zinc-900/60 px-4 py-2 flex gap-4 items-center border-b border-white/5">
          {match.sets_scores.map((s, i) => (
            <span key={i} className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              Set {i + 1}: <span className="text-white">{s.a}</span>–<span className="text-white">{s.b}</span>
            </span>
          ))}
        </div>
      )}

      {/* MAIN SCORING AREA — Two Half-Screen tap targets */}
      <div className="flex-1 flex">
        {/* LEFT SIDE */}
        <button
          id="btn-score-left"
          disabled={scoringFrozen}
          onClick={() => handleScore('LEFT')}
          className="flex-1 flex flex-col items-center justify-center gap-4 bg-blue-950/30 active:bg-blue-900/50 transition-colors border-r-4 border-white/5 relative group disabled:opacity-50"
        >
          {/* Server indicator */}
          {rule.scoring_type === 'SIDE_OUT' && isLeftServing && (
            <div className="absolute top-4 left-4 bg-white text-black px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg">
              <i className="fa-solid fa-circle-dot mr-1" /> Serving
            </div>
          )}
          {/* Sets won dots */}
          {rule.max_sets > 1 && (
            <div className="absolute top-4 right-4 flex gap-1.5">
              {Array.from({ length: rule.sets_to_win }).map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full border-2 ${i < leftSetsWon ? 'bg-blue-400 border-blue-400' : 'border-zinc-700'}`} />
              ))}
            </div>
          )}

          <div className="text-center pointer-events-none">
            <div className="text-blue-300 font-black text-base uppercase tracking-widest mb-2 max-w-[160px] line-clamp-2">{leftTeam}</div>
            <div className="text-[clamp(80px,20vw,160px)] font-black leading-none tabular-nums text-white">
              {leftScore}
            </div>
            <div className="text-blue-500/50 text-sm font-bold uppercase tracking-widest mt-2 opacity-0 group-active:opacity-100 transition-opacity">+1</div>
          </div>
        </button>

        {/* CENTRE STRIP */}
        <div className="w-20 flex flex-col items-center justify-between py-4 bg-zinc-950 border-x border-white/5 z-10">
          <div className="text-zinc-800 font-black text-[10px] uppercase tracking-widest writing-mode-vertical rotate-180">
            {rule.max_points} pts
          </div>
          <div className="text-center">
            <div className="text-zinc-700 font-black text-lg">VS</div>
            <div className="text-[10px] text-zinc-800 font-black mt-1">{rule.win_by > 1 ? `Win by ${rule.win_by}` : ''}</div>
          </div>
          <div className="text-zinc-800 font-black text-[10px] uppercase tracking-widest">
            {rule.scoring_type === 'RALLY' ? '⚡' : '🏓'}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <button
          id="btn-score-right"
          disabled={scoringFrozen}
          onClick={() => handleScore('RIGHT')}
          className="flex-1 flex flex-col items-center justify-center gap-4 bg-red-950/30 active:bg-red-900/50 transition-colors border-l-4 border-white/5 relative group disabled:opacity-50"
        >
          {/* Server indicator */}
          {rule.scoring_type === 'SIDE_OUT' && !isLeftServing && (
            <div className="absolute top-4 right-4 bg-white text-black px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg">
              <i className="fa-solid fa-circle-dot mr-1" /> Serving
            </div>
          )}
          {rule.max_sets > 1 && (
            <div className="absolute top-4 left-4 flex gap-1.5">
              {Array.from({ length: rule.sets_to_win }).map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full border-2 ${i < rightSetsWon ? 'bg-red-400 border-red-400' : 'border-zinc-700'}`} />
              ))}
            </div>
          )}

          <div className="text-center pointer-events-none">
            <div className="text-red-300 font-black text-base uppercase tracking-widest mb-2 max-w-[160px] line-clamp-2">{rightTeam}</div>
            <div className="text-[clamp(80px,20vw,160px)] font-black leading-none tabular-nums text-white">
              {rightScore}
            </div>
            <div className="text-red-500/50 text-sm font-bold uppercase tracking-widest mt-2 opacity-0 group-active:opacity-100 transition-opacity">+1</div>
          </div>
        </button>
      </div>

      {/* BOTTOM CONTROLS */}
      <div className="bg-black border-t border-white/5 px-4 py-3 flex items-center justify-between gap-4">
        <Link
          href={`/arena/${eventId}/referee`}
          className="text-zinc-700 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
        >
          ← Exit
        </Link>

        <div className="text-center">
          <div className="text-[10px] text-zinc-700 uppercase font-black tracking-widest">
            {match.team_a_name} {match.score_a} — {match.score_b} {match.team_b_name}
          </div>
          {match.referee_name && (
            <div className="text-[9px] text-zinc-800 font-bold mt-0.5">Ref: {match.referee_name}</div>
          )}
        </div>

        <button
          onClick={() => {
            // Undo: fetch and decrement — simplified visual undo
            // For production: integrate with score event log
            if (match.score_a > 0 || match.score_b > 0) {
              const newMatch = { ...match };
              if (newMatch.score_a >= newMatch.score_b && newMatch.score_a > 0) newMatch.score_a--;
              else if (newMatch.score_b > 0) newMatch.score_b--;
              setMatch(newMatch);
              persistScore(newMatch, 'UNDO');
            }
          }}
          className="text-zinc-700 hover:text-amber-500 text-[10px] font-black uppercase tracking-widest transition-colors"
        >
          Undo ↩
        </button>
      </div>
    </div>
  );
}

// ——————————————————————————————————————————————————
// ROOT COMPONENT
// ——————————————————————————————————————————————————
function RefereeContent() {
  const params = useParams();
  const eventId = (params.eventId as string) || '';
  const searchParams = useSearchParams();
  const matchIdParam = searchParams.get('matchId');

  const [phase, setPhase] = useState<'SELECT' | 'SCORING'>(matchIdParam ? 'SCORING' : 'SELECT');
  const [activeMatch, setActiveMatch] = useState<ArenaMatch | null>(null);
  const [activeRule, setActiveRule] = useState<RoundRule | null>(null);

  // If matchId param given, load directly (for bookmark-style access)
  useEffect(() => {
    if (matchIdParam) {
      async function directLoad() {
        const { data: match } = await supabase.from('arena_matches').select('*').eq('id', matchIdParam).single();
        if (!match) return;

        const { data: t } = await supabase.from('arena_tournaments').select('id').eq('event_id_slug', eventId).single();
        if (!t) return;

        const { data: rule } = await supabase.from('arena_round_rules').select('*').eq('tournament_id', t.id).eq('round_type', match.round_type).single();
        if (match && rule) {
          setActiveMatch(match as ArenaMatch);
          setActiveRule(rule as RoundRule);
          setPhase('SCORING');
        }
      }
      directLoad();
    }
  }, [matchIdParam, eventId]);

  if (phase === 'SELECT' || !activeMatch || !activeRule) {
    return (
      <MatchSelector
        eventId={eventId}
        onSelectMatch={(match, rule) => {
          setActiveMatch(match);
          setActiveRule(rule);
          setPhase('SCORING');
        }}
      />
    );
  }

  return <ScoringScreen initialMatch={activeMatch} rule={activeRule} eventId={eventId} />;
}

export default function RefereeConsolePage() {
  return (
    <Suspense fallback={<div className="bg-zinc-950 min-h-screen" />}>
      <RefereeContent />
    </Suspense>
  );
}
