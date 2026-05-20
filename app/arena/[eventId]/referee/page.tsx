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
type Phase = 'SELECT' | 'SCORING' | 'SIDE_SWITCH' | 'INTERVAL' | 'MATCH_END';

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
        .or(`id.eq.${eventId},event_id_slug.eq.${eventId}`)
        .single();

      if (!t) { setLoading(false); return; }

      const { data } = await supabase
        .from('arena_matches')
        .select(`
          *,
          clan_a:arena_clans!clan_a_id(short_name),
          clan_b:arena_clans!clan_b_id(short_name)
        `)
        .eq('tournament_id', t.id)
        .in('status', ['PENDING', 'LIVE'])
        .in('round_type', ['FINALS', 'THIRD_PLACE'])
        .order('bracket_match_id', { ascending: true }) // group by tie instance
        .order('created_at', { ascending: true })   // follow the creation order
        .order('court_number', { ascending: true });

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
        .or(`id.eq.${eventId},event_id_slug.eq.${eventId}`)
        .single();

    const { data: rule } = await supabase
      .from('arena_round_rules')
      .select('*')
      .eq('tournament_id', tData?.id)
      .eq('round_type', match.round_type)
      .single();

    // Reload match with updated fields and relationships
    const { data: updatedMatch } = await supabase
      .from('arena_matches')
      .select('*, clan_a:arena_clans!clan_a_id(short_name), clan_b:arena_clans!clan_b_id(short_name)')
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
    THIRD_PLACE: 'text-sky-400 border-sky-500/20',
    FINALS: 'text-yellow-400 border-yellow-500/20',
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative">
      <div className="absolute top-6 left-6 z-10">
        <Link href="/apps/zto-arena" className="flex items-center gap-2 text-xs font-black uppercase text-zinc-500 hover:text-white transition-colors tracking-widest bg-black/40 px-4 py-2 rounded-xl border border-white/10 hover:border-white/30 backdrop-blur-md">
          <i className="fa-solid fa-arrow-left" /> Back to Arena Hub
        </Link>
      </div>
      <div className="w-full max-w-lg">
        <div className="text-center mb-10 mt-12">
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
                    {match.round_type} {match.category_code ? `• ${match.category_code}` : ''} {match.court_number ? `• Court ${match.court_number}` : ''}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${match.status === 'LIVE' ? 'text-red-500' : 'text-zinc-600'}`}>
                    {match.status === 'LIVE' ? '🔴 LIVE' : 'PENDING'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-black text-white text-base flex-1 truncate">{(match as any).clan_a?.short_name || match.team_a_name || 'TBD'}</span>
                  <span className="text-zinc-600 font-black text-xs">VS</span>
                  <span className="font-black text-white text-base flex-1 truncate text-right">{(match as any).clan_b?.short_name || match.team_b_name || 'TBD'}</span>
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
  const [cd, setCd] = React.useState(3);
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    if (cd <= 0) { setReady(true); return; }
    const t = setTimeout(() => setCd(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cd]);
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
        onClick={ready ? onConfirm : undefined}
        disabled={!ready}
        className={`font-black text-xl uppercase tracking-widest px-16 py-6 rounded-3xl transition-all active:scale-95 ${
          ready
            ? 'bg-amber-500 text-black shadow-[0_0_40px_rgba(245,158,11,0.4)] hover:bg-amber-400 cursor-pointer'
            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
        }`}
      >
        {ready ? '✓ Confirmed — Sides Switched' : `Hold on… ${cd}`}
      </motion.button>
      {!ready && (
        <p className="mt-4 text-[10px] text-zinc-700 font-black uppercase tracking-widest">Anti-misfire lock · {cd}s</p>
      )}
    </motion.div>
  );
}

// ——————————————————————————————————————————————————
// INTERVAL MODAL (60s / 120s Breaks)
// ——————————————————————————————————————————————————
function IntervalModal({ title, duration, onSkip }: { title: string; duration: number; onSkip: () => void }) {
  const [timeLeft, setTimeLeft] = React.useState(duration);
  
  React.useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center text-center p-8 backdrop-blur-md"
    >
      <div className="w-20 h-20 bg-blue-600/20 rounded-3xl border border-blue-500/30 flex items-center justify-center mx-auto mb-6">
        <i className="fa-solid fa-stopwatch text-3xl text-blue-400 animate-pulse" />
      </div>
      <h1 className="text-3xl font-black uppercase tracking-widest text-white mb-2">{title}</h1>
      <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-8">BWF Standard Break</p>
      
      <div className="text-[120px] font-black leading-none text-white tabular-nums mb-12">
        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
      </div>

      <button
        onClick={onSkip}
        className="font-black text-xs uppercase tracking-widest px-10 py-4 rounded-2xl border border-white/20 text-zinc-400 hover:text-white hover:border-white/50 transition-all active:scale-95"
      >
        {timeLeft <= 0 ? 'Resume Match' : 'Skip & Resume →'}
      </button>
    </motion.div>
  );
}

// ——————————————————————————————————————————————————
// PENALTY / MATCH OPTIONS MODAL
// ——————————————————————————————————————————————————
function PenaltyModal({ 
  match, 
  onClose, 
  onIssueCard, 
  onWalkover 
}: { 
  match: ArenaMatch; 
  onClose: () => void;
  onIssueCard: (team: 'A' | 'B', color: 'YELLOW' | 'RED' | 'BLACK') => void;
  onWalkover: (winner: 'A' | 'B', reason: 'RETIRED' | 'WALKOVER') => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-end"
    >
      <div className="bg-zinc-950 border-t border-white/10 rounded-t-[40px] p-8 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-white uppercase tracking-widest">Match Actions</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 text-zinc-500 flex items-center justify-center">
            <i className="fa-solid fa-times" />
          </button>
        </div>

        {/* Penalty Cards */}
        <div className="mb-8">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Issue Penalty Card</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Team A Cards */}
            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4">
              <div className="text-xs font-bold text-white mb-3 truncate">{match.team_a_name}</div>
              <div className="flex gap-2">
                <button onClick={() => onIssueCard('A', 'YELLOW')} className="flex-1 py-2 bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 rounded-lg text-xs font-black uppercase">YEL</button>
                <button onClick={() => onIssueCard('A', 'RED')} className="flex-1 py-2 bg-red-500/20 text-red-500 border border-red-500/50 rounded-lg text-xs font-black uppercase">RED</button>
              </div>
            </div>
            {/* Team B Cards */}
            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4">
              <div className="text-xs font-bold text-white mb-3 truncate">{match.team_b_name}</div>
              <div className="flex gap-2">
                <button onClick={() => onIssueCard('B', 'YELLOW')} className="flex-1 py-2 bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 rounded-lg text-xs font-black uppercase">YEL</button>
                <button onClick={() => onIssueCard('B', 'RED')} className="flex-1 py-2 bg-red-500/20 text-red-500 border border-red-500/50 rounded-lg text-xs font-black uppercase">RED</button>
              </div>
            </div>
          </div>
          <p className="text-[9px] text-zinc-600 mt-2 uppercase tracking-widest text-center">Note: Red Card will automatically award +1 point to opponent</p>
        </div>

        {/* Walkover / Retirement */}
        <div>
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Abnormal Termination</h3>
          <div className="space-y-3">
            <button onClick={() => onWalkover('A', 'RETIRED')} className="w-full py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
              {match.team_b_name} Retires (Award Win to {match.team_a_name})
            </button>
            <button onClick={() => onWalkover('B', 'RETIRED')} className="w-full py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
              {match.team_a_name} Retires (Award Win to {match.team_b_name})
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ——————————————————————————————————————————————————
// MATCH END OVERLAY
// ——————————————————————————————————————————————————
function MatchEndOverlay({ 
  winner, 
  countdown, 
  isTieExperience, 
  nextInTie 
}: { 
  winner: string; 
  countdown: number;
  isTieExperience?: boolean;
  nextInTie?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center text-center px-12"
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
      <h1 className="text-3xl font-black text-zinc-400 uppercase tracking-widest mb-2">Match Winner</h1>
      <h2 className="text-6xl font-black text-white uppercase tracking-widest mb-8 max-w-lg">{winner}</h2>
      
      {isTieExperience && nextInTie && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-blue-600/10 border border-blue-500/20 rounded-3xl"
        >
          <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 italic">Corporate Full Session</div>
          <div className="text-xl font-bold text-white uppercase tracking-wide">Next Up: {nextInTie}</div>
        </motion.div>
      )}

      <p className="text-zinc-500 text-lg font-bold uppercase tracking-widest">
        {isTieExperience && nextInTie ? "Queuing next match in" : "Auto-submitting in"} <span className="text-emerald-400 font-black text-2xl">{countdown}</span>s
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
  const [tieContext, setTieContext] = useState<{ mode: string; nextLabel?: string } | null>(null);
  const [intervalState, setIntervalState] = useState<{ title: string; duration: number } | null>(null);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const channelRef = useRef<any>(null);
  const scoringFrozen = phase !== 'SCORING';

  // Score history stack for proper undo (max 10 steps)
  type ScoreSnapshot = Pick<ArenaMatch, 'score_a' | 'score_b' | 'server' | 'left_team' | 'sets_won_a' | 'sets_won_b' | 'current_set' | 'sets_scores'>;
  const [scoreHistory, setScoreHistory] = useState<ScoreSnapshot[]>([]);

  // Load Tie context for automatic queuing
  useEffect(() => {
    async function loadTie() {
      if (!match.tie_id) return;
      const { data: template } = await supabase
        .from('arena_tie_templates')
        .select('completion_mode, arena_tie_template_events(event_label, sequence_order)')
        .eq('id', match.tie_id)
        .single();
      
      if (template) {
        // Find next event label in sequence
        const currentSeq = (match as any).sequence_order || 0;
        const sortedEvents = (template as any).arena_tie_template_events.sort((a: any, b: any) => a.sequence_order - b.sequence_order);
        const nextEvent = sortedEvents.find((e: any) => e.sequence_order > currentSeq);
        setTieContext({
          mode: template.completion_mode,
          nextLabel: nextEvent?.event_label
        });
      }
    }
    loadTie();
  }, [match.tie_id]);

  // Online/offline detection + replay
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const replayed = await replayOfflineQueue(supabase);
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
    const payload = {
      score_a: updatedMatch.score_a,
      score_b: updatedMatch.score_b,
      server: updatedMatch.server,
      left_team: updatedMatch.left_team,
      sets_won_a: updatedMatch.sets_won_a,
      sets_won_b: updatedMatch.sets_won_b,
      current_set: updatedMatch.current_set,
      sets_scores: updatedMatch.sets_scores,
      status: updatedMatch.status,
      updated_at: new Date().toISOString(),
      ...extra,
    };

    if (!navigator.onLine) {
      enqueueOfflineRequest({ url: 'SUPABASE_UPDATE', method: updatedMatch.id, body: JSON.stringify(payload) });
      setOfflineCount((c) => c + 1);
      return;
    }

    try {
      const { error } = await supabase.from('arena_matches').update(payload).eq('id', updatedMatch.id);
      if (error) throw new Error(error.message);
    } catch {
      enqueueOfflineRequest({ url: 'SUPABASE_UPDATE', method: updatedMatch.id, body: JSON.stringify(payload) });
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

      // If no match winner, trigger 120s Set Interval
      setIntervalState({ title: `End of Set ${match.current_set}`, duration: 120 });
      setPhase('INTERVAL');
    }

    if (shouldSwitch && !setWinner) {
      updatedMatch = { ...updatedMatch, status: 'SIDE_SWITCH' };
      setMatch(updatedMatch);
      setPhase('SIDE_SWITCH');
      persistScore(updatedMatch, 'SIDE_SWITCH');
      return;
    }

    // Push snapshot BEFORE applying new score
    setScoreHistory(prev => [
      ...prev.slice(-9),
      { score_a: match.score_a, score_b: match.score_b, server: match.server, left_team: match.left_team, sets_won_a: match.sets_won_a, sets_won_b: match.sets_won_b, current_set: match.current_set, sets_scores: match.sets_scores },
    ]);
    // Check 11-point mid-set interval
    const isMidSetInterval = (newScoreA === 11 || newScoreB === 11) && match.score_a < 11 && match.score_b < 11;
    if (isMidSetInterval && !setWinner) {
      setIntervalState({ title: '11-Point Interval', duration: 60 });
      setPhase('INTERVAL');
    }

    setMatch(updatedMatch);
    persistScore(updatedMatch, scoringTeam === 'A' ? 'SCORE_A' : 'SCORE_B');
  }, [match, rule, scoringFrozen, persistScore]);

  const handleUndo = useCallback(() => {
    if (scoreHistory.length === 0) {
      alert('没有可以撤回的分数了！(No history to undo)');
      return;
    }
    const lastSnapshot = scoreHistory[scoreHistory.length - 1];
    const newHistory = scoreHistory.slice(0, -1);
    
    const updatedMatch: ArenaMatch = {
      ...match,
      score_a: lastSnapshot.score_a,
      score_b: lastSnapshot.score_b,
      server: lastSnapshot.server,
      left_team: lastSnapshot.left_team,
      sets_won_a: lastSnapshot.sets_won_a,
      sets_won_b: lastSnapshot.sets_won_b,
      current_set: lastSnapshot.current_set,
      sets_scores: lastSnapshot.sets_scores,
      status: 'LIVE' // in case we undo from a set win/interval
    };
    
    setScoreHistory(newHistory);
    setMatch(updatedMatch);
    persistScore(updatedMatch, 'UNDO_SCORE');
  }, [match, scoreHistory, persistScore]);

  const handleIssueCard = useCallback((team: 'A' | 'B', color: 'YELLOW' | 'RED' | 'BLACK') => {
    setShowPenaltyModal(false);
    if (color === 'RED') {
      // Red card gives 1 point to opponent
      handleScore(match.left_team === team ? 'RIGHT' : 'LEFT'); // Tap the opponent's side
    }
    // Just log it
    persistScore(match, 'PENALTY_CARD', { team, color });
  }, [match, handleScore, persistScore]);

  const handleWalkover = useCallback((winner: 'A' | 'B', reason: 'RETIRED' | 'WALKOVER') => {
    setShowPenaltyModal(false);
    const updatedMatch: ArenaMatch = { ...match, status: 'COMPLETED', winner };
    setMatch(updatedMatch);
    setWinnerName(winner === 'A' ? match.team_a_name : match.team_b_name);
    setPhase('MATCH_END');
    persistScore(updatedMatch, reason, { winner });
  }, [match, persistScore]);

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

  const handleSwapServer = useCallback(() => {
    if (match.score_a === 0 && match.score_b === 0) {
      const newServer = match.server === 'A' ? 'B' : 'A';
      const updatedMatch = { ...match, server: newServer };
      setMatch(updatedMatch);
      persistScore(updatedMatch, 'SWAP_SERVER');
    } else {
      alert("发球方只能在 0-0 时更改！(Can only swap server at 0-0)");
    }
  }, [match, persistScore]);

  const handleResetToPending = useCallback(async () => {
    if (!confirm("⚠️ 确定要重置并退出这场比赛吗？比分将清零并退回待开始状态！(Are you sure you want to reset this match?)")) return;
    try {
      await supabase.from('arena_matches').update({
        status: 'PENDING',
        score_a: 0,
        score_b: 0,
        sets_won_a: 0,
        sets_won_b: 0,
        current_set: 1,
        sets_scores: [],
        referee_name: null,
        referee_session: null
      }).eq('id', match.id);
      window.location.href = `/arena/${eventId}/referee`;
    } catch (e) {
      console.error(e);
    }
  }, [match.id, eventId]);

  // Determine left/right teams
  const leftTeamName = match.left_team === 'A' 
    ? (match as any).clan_a?.short_name || match.team_a_name 
    : (match as any).clan_b?.short_name || match.team_b_name;
    
  const rightTeamName = match.left_team === 'A' 
    ? (match as any).clan_b?.short_name || match.team_b_name 
    : (match as any).clan_a?.short_name || match.team_a_name;

  const leftScore = match.left_team === 'A' ? match.score_a : match.score_b;
  const rightScore = match.left_team === 'A' ? match.score_b : match.score_a;
  const leftSetsWon = match.left_team === 'A' ? match.sets_won_a : match.sets_won_b;
  const rightSetsWon = match.left_team === 'A' ? match.sets_won_b : match.sets_won_a;
  const isLeftServing = rule.scoring_type === 'SIDE_OUT'
    ? match.server === match.left_team
    : false;

  const roundColors: Record<string, string> = {
    GROUP: 'bg-emerald-500', KNOCKOUT: 'bg-amber-500', SEMIFINALS: 'bg-orange-500', THIRD_PLACE: 'bg-sky-500', FINALS: 'bg-yellow-500',
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col select-none overflow-hidden relative">
      <AnimatePresence>
        {phase === 'SIDE_SWITCH' && <SideSwitchModal onConfirm={handleSideSwitchConfirmed} />}
        {phase === 'INTERVAL' && intervalState && (
          <IntervalModal 
            title={intervalState.title} 
            duration={intervalState.duration} 
            onSkip={() => { setPhase('SCORING'); setIntervalState(null); }} 
          />
        )}
        {showPenaltyModal && (
          <PenaltyModal 
            match={match} 
            onClose={() => setShowPenaltyModal(false)} 
            onIssueCard={handleIssueCard}
            onWalkover={handleWalkover}
          />
        )}
        {phase === 'MATCH_END' && (
          <MatchEndOverlay 
            winner={winnerName} 
            countdown={countdown} 
            isTieExperience={tieContext?.mode === 'FULL'}
            nextInTie={tieContext?.nextLabel}
          />
        )}
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

      {/* MAIN SCORING AREA — Bold mobile-first split */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">

        {/* ── TOP / LEFT TEAM ── */}
        <button
          id="btn-score-left"
          disabled={scoringFrozen}
          onClick={() => handleScore('LEFT')}
          className="flex-1 relative flex flex-col items-center justify-center overflow-hidden disabled:opacity-40"
          style={{
            WebkitTapHighlightColor: 'transparent',
            background: 'linear-gradient(160deg, #0a1628 0%, #0d1f3c 100%)',
            borderBottom: '2px solid rgba(255,255,255,0.04)',
          }}
        >
          {/* Ambient glow on tap */}
          <div className="absolute inset-0 bg-blue-500/0 group-active:bg-blue-500/10 transition-colors pointer-events-none" />

          {/* SERVING badge — bold pill top-center */}
          {rule.scoring_type === 'SIDE_OUT' && isLeftServing && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1.5 rounded-full font-black text-[11px] uppercase tracking-widest shadow-lg"
              style={{ background: 'linear-gradient(90deg,#fff 0%,#ddd 100%)', color: '#000', boxShadow: '0 0 20px rgba(255,255,255,0.4)' }}>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Serving
            </div>
          )}

          {/* Sets won pips */}
          {rule.max_sets > 1 && (
            <div className="absolute top-3 right-4 flex gap-2">
              {Array.from({ length: rule.sets_to_win }).map((_, i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-full border-2 transition-all ${i < leftSetsWon ? 'bg-blue-400 border-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]' : 'border-zinc-700'}`} />
              ))}
            </div>
          )}

          {/* Team label */}
          <div className="text-blue-300/80 font-black text-sm md:text-base uppercase tracking-[0.2em] mb-1 pointer-events-none">
            {leftTeamName}
          </div>
          <div className="text-[10px] text-blue-500/50 font-black uppercase tracking-[0.3em] mb-3 pointer-events-none">
            {match.category_code}
          </div>

          {/* Giant score */}
          <div
            className="font-black leading-none tabular-nums pointer-events-none select-none"
            style={{ fontSize: 'clamp(72px, 18vh, 160px)', color: '#fff', textShadow: '0 0 60px rgba(96,165,250,0.3)' }}
          >
            {leftScore}
          </div>

          {/* Tap flash */}
          <div className="text-blue-400 text-xs font-black uppercase tracking-[0.3em] mt-3 opacity-0 active:opacity-100 transition-opacity pointer-events-none">
            +1 POINT
          </div>
        </button>

        {/* ── DIVIDER STRIP ── */}
        <div className="flex flex-row md:flex-col items-center justify-between shrink-0
                        h-9 md:h-auto w-full md:w-16
                        px-5 md:px-0 py-0 md:py-5
                        bg-black border-y md:border-y-0 md:border-x border-white/5 z-10">
          <span className="text-zinc-700 font-black text-[10px] uppercase tracking-widest">{rule.max_points}pt</span>
          <span className="text-zinc-600 font-black text-xs md:text-sm">VS</span>
          <span className="text-zinc-700 font-black text-[10px] uppercase tracking-widest">{rule.scoring_type === 'SIDE_OUT' ? '🏓' : '⚡'}</span>
        </div>

        {/* ── BOTTOM / RIGHT TEAM ── */}
        <button
          id="btn-score-right"
          disabled={scoringFrozen}
          onClick={() => handleScore('RIGHT')}
          className="flex-1 relative flex flex-col items-center justify-center overflow-hidden disabled:opacity-40"
          style={{
            WebkitTapHighlightColor: 'transparent',
            background: 'linear-gradient(160deg, #1a0808 0%, #2d0f0f 100%)',
          }}
        >
          <div className="absolute inset-0 bg-red-500/0 active:bg-red-500/10 transition-colors pointer-events-none" />

          {rule.scoring_type === 'SIDE_OUT' && !isLeftServing && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1.5 rounded-full font-black text-[11px] uppercase tracking-widest"
              style={{ background: 'linear-gradient(90deg,#fff 0%,#ddd 100%)', color: '#000', boxShadow: '0 0 20px rgba(255,255,255,0.4)' }}>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Serving
            </div>
          )}

          {rule.max_sets > 1 && (
            <div className="absolute top-3 left-4 flex gap-2">
              {Array.from({ length: rule.sets_to_win }).map((_, i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-full border-2 transition-all ${i < rightSetsWon ? 'bg-red-400 border-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]' : 'border-zinc-700'}`} />
              ))}
            </div>
          )}

          <div className="text-red-300/80 font-black text-sm md:text-base uppercase tracking-[0.2em] mb-1 pointer-events-none">
            {rightTeamName}
          </div>
          <div className="text-[10px] text-red-500/50 font-black uppercase tracking-[0.3em] mb-3 pointer-events-none">
            {match.category_code}
          </div>

          <div
            className="font-black leading-none tabular-nums pointer-events-none select-none"
            style={{ fontSize: 'clamp(72px, 18vh, 160px)', color: '#fff', textShadow: '0 0 60px rgba(248,113,113,0.3)' }}
          >
            {rightScore}
          </div>

          <div className="text-red-400 text-xs font-black uppercase tracking-[0.3em] mt-3 opacity-0 active:opacity-100 transition-opacity pointer-events-none">
            +1 POINT
          </div>
        </button>
      </div>

      {/* ═══════════════════════════════════════════
          BOTTOM CONTROL DOCK — Bold Mobile Design
          ═══════════════════════════════════════════ */}
      <div className="shrink-0 bg-black" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>

        {/* ── UNDO — Full-width primary CTA ── */}
        <button
          onClick={handleUndo}
          disabled={scoreHistory.length === 0}
          className="w-full flex items-center justify-center gap-3 transition-all active:scale-[0.97] disabled:opacity-25 disabled:cursor-not-allowed"
          style={{
            padding: '18px 24px',
            background: scoreHistory.length > 0
              ? 'linear-gradient(90deg, #7f1d1d 0%, #991b1b 50%, #7f1d1d 100%)'
              : '#111',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            boxShadow: scoreHistory.length > 0 ? 'inset 0 1px 0 rgba(255,100,100,0.15)' : 'none',
          }}
        >
          <i className="fa-solid fa-rotate-left" style={{ fontSize: 20, color: scoreHistory.length > 0 ? '#fca5a5' : '#444' }} />
          <div className="flex flex-col items-start">
            <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: scoreHistory.length > 0 ? '#fca5a5' : '#444' }}>
              减分 / Undo Last Point
            </span>
            {scoreHistory.length > 0 && (
              <span style={{ fontSize: 10, color: 'rgba(252,165,165,0.5)', fontWeight: 700, letterSpacing: '0.1em' }}>
                {scoreHistory.length} action{scoreHistory.length > 1 ? 's' : ''} in history
              </span>
            )}
          </div>
          {scoreHistory.length > 0 && (
            <span className="ml-auto" style={{ fontSize: 11, fontWeight: 900, color: 'rgba(252,165,165,0.5)', letterSpacing: '0.05em' }}>
              ↺
            </span>
          )}
        </button>

        {/* ── Secondary actions row ── */}
        <div className="grid grid-cols-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>

          {/* SWAP SERVER */}
          <button
            onClick={handleSwapServer}
            className="flex flex-col items-center justify-center gap-2 py-5 transition-all active:scale-95 active:bg-white/5"
            style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}
          >
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
              <i className="fa-solid fa-right-left" style={{ fontSize: 18, color: '#a5b4fc' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a5b4fc' }}>换发球</div>
              <div style={{ fontSize: 9, color: 'rgba(165,180,252,0.4)', fontWeight: 700, letterSpacing: '0.05em', textAlign: 'center' }}>Swap Server</div>
            </div>
          </button>

          {/* PENALTY / ACTIONS */}
          <button
            onClick={() => setShowPenaltyModal(true)}
            className="flex flex-col items-center justify-center gap-2 py-5 transition-all active:scale-95 active:bg-white/5"
          >
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)' }}>
              <i className="fa-solid fa-shield-halved" style={{ fontSize: 18, color: '#fde047' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#fde047' }}>罚牌 / 弃权</div>
              <div style={{ fontSize: 9, color: 'rgba(253,224,71,0.4)', fontWeight: 700, letterSpacing: '0.05em', textAlign: 'center' }}>Cards & Walkover</div>
            </div>
          </button>
        </div>

        {/* ── Footer: exit + live score + reset ── */}
        <div className="flex items-center justify-between px-5 py-3">
          <Link
            href={`/arena/${eventId}/referee`}
            className="flex items-center gap-2 transition-colors"
            style={{ color: '#52525b', fontSize: 11, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}
          >
            <i className="fa-solid fa-chevron-left" style={{ fontSize: 10 }} />
            Exit
          </Link>

          <div className="text-center">
            <div style={{ fontSize: 12, fontWeight: 900, color: '#fff', letterSpacing: '0.05em' }}>
              <span style={{ color: '#60a5fa' }}>{match.score_a}</span>
              <span style={{ color: '#3f3f46', margin: '0 6px' }}>:</span>
              <span style={{ color: '#f87171' }}>{match.score_b}</span>
            </div>
            {match.referee_name && (
              <div style={{ fontSize: 9, color: '#3f3f46', fontWeight: 700, marginTop: 2 }}>REF · {match.referee_name}</div>
            )}
          </div>

          <button
            onClick={handleResetToPending}
            className="flex items-center gap-2 transition-colors"
            style={{ color: '#3f3f46', fontSize: 11, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#3f3f46')}
          >
            <i className="fa-solid fa-power-off" style={{ fontSize: 10 }} />
            Reset
          </button>
        </div>
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

        const { data: t } = await supabase.from('arena_tournaments').select('id').or(`id.eq.${eventId},event_id_slug.eq.${eventId}`).single();
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
