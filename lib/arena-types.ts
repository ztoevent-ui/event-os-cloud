// =====================================================
// ZTO Arena — Shared TypeScript Types
// lib/arena-types.ts
// =====================================================

export type ScoringType = 'RALLY' | 'SIDE_OUT';
export type MatchStatus = 'PENDING' | 'LIVE' | 'SIDE_SWITCH' | 'COMPLETED';
export type RoundType = 'GROUP' | 'KNOCKOUT' | 'SEMIFINALS' | 'THIRD_PLACE' | 'FINALS';
export type TeamSlot = 'A' | 'B';
export type CompletionMode = 'EARLY' | 'FULL';
export type TournamentStatus = 'SETUP' | 'REGISTRATION' | 'GROUP_STAGE' | 'KNOCKOUT' | 'COMPLETED';
export type TournamentFormat = 'SINGLES' | 'TIE_TEAM' | 'INDIVIDUAL';

export interface RoundRule {
  id: string;
  tournament_id: string;
  round_type: RoundType;
  scoring_type: ScoringType;
  max_points: number;
  win_by: number;
  sets_to_win: number;
  max_sets: number;
  freeze_at: number | null;
  completion_mode: CompletionMode; // EARLY = stop at wins_required, FULL = play all
}

export interface TieTemplateEvent {
  id: string;
  template_id: string;
  sequence_order: number;
  event_type: string; // 'MD1', 'WD', 'MXD', etc.
  event_label: string;
}

export interface TieTemplate {
  id: string;
  tournament_id: string;
  name: string;
  wins_required: number;
  total_matches: number;
  events?: TieTemplateEvent[];
}

export interface SetScore {
  a: number;
  b: number;
}

export interface ArenaMatch {
  id: string;
  tournament_id: string;
  bracket_match_id: string | null;
  tie_id: string | null;
  event_type: string | null;
  round_type: RoundType;
  group_id: string | null;
  court_number: number | null;

  team_a_name: string;
  team_b_name: string;
  team_a_id: string | null;
  team_b_id: string | null;

  sets_scores: SetScore[];
  current_set: number;
  score_a: number;
  score_b: number;
  sets_won_a: number;
  sets_won_b: number;

  server: TeamSlot;
  left_team: TeamSlot; // which team is physically on the left side

  status: MatchStatus;
  winner: TeamSlot | null;

  next_match_id: string | null;
  next_team_slot: TeamSlot | null;

  referee_name: string | null;
  referee_session: string | null;

  created_at: string;
  updated_at: string;
}

export interface GroupStanding {
  id: string;
  tournament_id: string;
  group_id: string;
  team_name: string;
  team_id: string | null;
  played: number;
  wins: number;
  losses: number;
  points_for: number;
  points_against: number;
  point_diff: number;
  rank: number;
}

export interface ArenaTournament {
  id: string;
  name: string;
  sport_type: string;
  event_id_slug: string;
  status: TournamentStatus;
  current_round: RoundType;
  bracket_json: Record<string, any>;
  format: TournamentFormat;
  has_third_place: boolean;
  linked_project_id: string | null;
  created_at: string;
  updated_at: string;
}

// Scoring engine types
export interface ScoringState {
  match: ArenaMatch;
  rule: RoundRule;
  sideSwitchTriggered: boolean;
  matchOver: boolean;
  winnerSlot: TeamSlot | null;
  countdownSeconds: number;
}

export interface ScoreEvent {
  match_id: string;
  tournament_id: string;
  event_type: 'SCORE_A' | 'SCORE_B' | 'UNDO' | 'SIDE_SWITCH_CONFIRMED' | 'MATCH_END';
  payload: Record<string, any>;
  referee_session: string;
  client_timestamp: string;
}

// Offline queue item
export interface OfflineQueueItem {
  id: string;
  endpoint: string;
  method: string;
  body: string;
  timestamp: number;
}

// Director dashboard summary
export interface MatchSummary {
  id: string;
  court_number: number | null;
  team_a_name: string;
  team_b_name: string;
  score_a: number;
  score_b: number;
  round_type: RoundType;
  status: MatchStatus;
  pending_blocker?: string; // which match ID it's waiting on
}
