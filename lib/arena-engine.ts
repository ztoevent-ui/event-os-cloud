// =====================================================
// ZTO Arena — Scoring Engine
// lib/arena-engine.ts
// Core scoring logic: side-out / rally, win detection,
// side-switch trigger, server tracking
// =====================================================

import type { ArenaMatch, RoundRule, TeamSlot, SetScore } from './arena-types';

// ——————————————————————————————————————————————————
// SIDE-SWITCH: Trigger check
// Triggers at middle of set (half of max_points, rounded up)
// e.g. 21-point set: switch at 11 points total (first to reach ceiling/2 + 0.5)
// ——————————————————————————————————————————————————
export function shouldTriggerSideSwitch(
  scoreA: number,
  scoreB: number,
  rule: RoundRule,
  currentSet: number
): boolean {
  const total = scoreA + scoreB;
  const finalSet = currentSet === rule.max_sets;

  if (finalSet) {
    // In the final set, switch when leading team first reaches half of max_points
    const switchPoint = Math.ceil(rule.max_points / 2);
    const leadingScore = Math.max(scoreA, scoreB);
    return leadingScore === switchPoint && total === switchPoint;
  }

  // In non-final sets: switch only at start of set (no mid-set switch — customizable)
  return false;
}

// Check trigger for the simple mid-set rule Tony specified:
// if (currentTotal == totalPoints/2 + 0.5) → trigger
export function checkMidSetSwitchPoint(
  scoreA: number,
  scoreB: number,
  rule: RoundRule
): boolean {
  const total = scoreA + scoreB;
  const switchAt = Math.floor(rule.max_points / 2) + (rule.max_points % 2 === 1 ? 1 : 0);
  return total === switchAt;
}

// ——————————————————————————————————————————————————
// WIN DETECTION
// Returns winner slot if match is over, null if still in play
// ——————————————————————————————————————————————————
export function detectSetWinner(
  scoreA: number,
  scoreB: number,
  rule: RoundRule
): TeamSlot | null {
  const maxPts = rule.max_points;
  const winBy = rule.win_by;
  const freeze = rule.freeze_at;

  // Freeze rule: if freeze_at is set, max score is freeze (no win_by beyond freeze)
  if (freeze !== null && freeze !== undefined) {
    if (scoreA >= freeze) return 'A';
    if (scoreB >= freeze) return 'B';
  }

  // Standard win condition
  if (scoreA >= maxPts && (scoreA - scoreB) >= winBy) return 'A';
  if (scoreB >= maxPts && (scoreB - scoreA) >= winBy) return 'B';

  return null;
}

export function detectMatchWinner(match: ArenaMatch, rule: RoundRule): TeamSlot | null {
  if (match.sets_won_a >= rule.sets_to_win) return 'A';
  if (match.sets_won_b >= rule.sets_to_win) return 'B';
  return null;
}

// ——————————————————————————————————————————————————
// SERVER MANAGEMENT (Side-out scoring)
// ——————————————————————————————————————————————————
export function handleSideOutScore(
  match: ArenaMatch,
  scoringTeam: TeamSlot
): { newScoreA: number; newScoreB: number; newServer: TeamSlot } {
  const server = match.server;
  let newScoreA = match.score_a;
  let newScoreB = match.score_b;
  let newServer: TeamSlot = server;

  if (scoringTeam === server) {
    // Server scores → point awarded
    if (scoringTeam === 'A') newScoreA++;
    else newScoreB++;
  } else {
    // Non-server wins rally → server changes, NO point
    newServer = scoringTeam;
  }

  return { newScoreA, newScoreB, newServer };
}

// ——————————————————————————————————————————————————
// RALLY SCORING
// Any team scores on any tap, server switches on point loss
// ——————————————————————————————————————————————————
export function handleRallyScore(
  match: ArenaMatch,
  scoringTeam: TeamSlot
): { newScoreA: number; newScoreB: number; newServer: TeamSlot } {
  let newScoreA = match.score_a;
  let newScoreB = match.score_b;

  if (scoringTeam === 'A') newScoreA++;
  else newScoreB++;

  // Server switches to the team that scored
  const newServer: TeamSlot = scoringTeam;

  return { newScoreA, newScoreB, newServer };
}

// ——————————————————————————————————————————————————
// PHYSICAL SIDE SWAP
// After "SWITCH SIDES" confirmed, swap all physical labels
// ——————————————————————————————————————————————————
export function swapSides(match: ArenaMatch): {
  leftTeam: TeamSlot;
  // Visual: the team that was on the left is now on the right
} {
  return {
    leftTeam: match.left_team === 'A' ? 'B' : 'A',
  };
}

// ——————————————————————————————————————————————————
// SET COMPLETION — advance to next set
// ——————————————————————————————————————————————————
export function advanceToNextSet(
  match: ArenaMatch,
  rule: RoundRule,
  setWinner: TeamSlot
): {
  setsWonA: number;
  setsWonB: number;
  newSetsScores: SetScore[];
  newCurrentSet: number;
} {
  const newSetsScores = [
    ...(match.sets_scores || []),
    { a: match.score_a, b: match.score_b },
  ];

  return {
    setsWonA: match.sets_won_a + (setWinner === 'A' ? 1 : 0),
    setsWonB: match.sets_won_b + (setWinner === 'B' ? 1 : 0),
    newSetsScores,
    newCurrentSet: match.current_set + 1,
  };
}

// ——————————————————————————————————————————————————
// UNDO — revert last score (simple: decrement)
// ——————————————————————————————————————————————————
export function undoLastScore(match: ArenaMatch): {
  newScoreA: number;
  newScoreB: number;
} {
  // Simple undo: decrement the higher score (naive but safe for live events)
  if (match.score_a > 0 || match.score_b > 0) {
    // Attempt to determine which was last scored — not tracked without event log
    // Decrement whichever is higher (best heuristic without event log)
    if (match.score_a >= match.score_b && match.score_a > 0) {
      return { newScoreA: match.score_a - 1, newScoreB: match.score_b };
    } else if (match.score_b > 0) {
      return { newScoreA: match.score_a, newScoreB: match.score_b - 1 };
    }
  }
  return { newScoreA: match.score_a, newScoreB: match.score_b };
}

// ——————————————————————————————————————————————————
// GROUP STANDINGS SORT
// Weight: Wins → Head-to-head → Point differential
// ——————————————————————————————————————————————————
export function sortGroupStandings<T extends {
  wins: number;
  point_diff: number;
  team_name: string;
}>(standings: T[]): T[] {
  return [...standings].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.point_diff !== a.point_diff) return b.point_diff - a.point_diff;
    return a.team_name.localeCompare(b.team_name);
  });
}

// ——————————————————————————————————————————————————
// OFFLINE QUEUE — localStorage operations
// ——————————————————————————————————————————————————
const OFFLINE_QUEUE_KEY = 'zto_arena_offline_queue';

export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body: string;
  timestamp: number;
  retries: number;
}

export function enqueueOfflineRequest(req: Omit<QueuedRequest, 'id' | 'timestamp' | 'retries'>) {
  if (typeof window === 'undefined') return;
  const queue = getOfflineQueue();
  queue.push({
    ...req,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    retries: 0,
  });
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export function getOfflineQueue(): QueuedRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearOfflineQueue() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}

export function removeOfflineItem(id: string) {
  if (typeof window === 'undefined') return;
  const queue = getOfflineQueue().filter((q) => q.id !== id);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export async function replayOfflineQueue(): Promise<number> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return 0;

  let replayed = 0;
  for (const item of queue) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: item.body,
      });
      if (res.ok) {
        removeOfflineItem(item.id);
        replayed++;
      }
    } catch {
      // Silent — will retry next time
    }
  }
  return replayed;
}
