import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sortGroupStandings } from '@/lib/arena-engine';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * POST /api/arena/match-end
 * Called when a single match within a Tie (or standalone match) completes.
 *
 * Flow:
 *  1. Mark the match COMPLETED
 *  2. If the match has a tie_id — evaluate Tie completion using the per-stage
 *     completion_mode from arena_round_rules (EARLY | FULL)
 *  3. Advance winner to the next bracket slot (if applicable)
 *  4. Recalculate group standings
 *  5. Broadcast via Supabase Realtime
 */
export async function POST(req: NextRequest) {
  try {
    const { matchId, winnerId, eventId } = await req.json();

    if (!matchId || !winnerId) {
      return NextResponse.json({ error: 'matchId and winnerId required' }, { status: 400 });
    }

    // 1. Load the completed match
    const { data: match, error: matchErr } = await supabase
      .from('arena_matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchErr || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // 2. Mark match as COMPLETED
    await supabase
      .from('arena_matches')
      .update({ status: 'COMPLETED', winner: winnerId, updated_at: new Date().toISOString() })
      .eq('id', matchId);

    const winnerName = winnerId === 'A' ? match.team_a_name : match.team_b_name;

    // 3. Auto-progression — handle Tie-level settlement
    if (match.next_match_id && match.next_team_slot) {
      let shouldAdvance = true;
      let tieWinnerName = winnerName;

      if (match.tie_id) {
        // Load tie template (wins_required + total_matches)
        const { data: template } = await supabase
          .from('arena_tie_templates')
          .select('wins_required, total_matches')
          .eq('id', match.tie_id)
          .single();

        // Load per-stage completion_mode from round rules
        const { data: roundRule } = await supabase
          .from('arena_round_rules')
          .select('completion_mode')
          .eq('tournament_id', match.tournament_id)
          .eq('round_type', match.round_type)
          .single();

        if (template) {
          const completionMode: string = roundRule?.completion_mode ?? 'EARLY';

          // Collect all matches in this Tie instance (same teams + same bracket/group)
          let tieQuery = supabase
            .from('arena_matches')
            .select('winner, status')
            .eq('tournament_id', match.tournament_id)
            .eq('team_a_name', match.team_a_name)
            .eq('team_b_name', match.team_b_name);

          if (match.bracket_match_id) tieQuery = tieQuery.eq('bracket_match_id', match.bracket_match_id);
          if (match.group_id)         tieQuery = tieQuery.eq('group_id', match.group_id);

          const { data: tieMatches } = await tieQuery;

          if (tieMatches) {
            const winsA = tieMatches.filter(m => m.winner === 'A').length;
            const winsB = tieMatches.filter(m => m.winner === 'B').length;
            const completedCount = tieMatches.filter(m => m.status === 'COMPLETED').length;

            if (completionMode === 'FULL') {
              // ——— Experience Mode: every match in the Tie must be played ———
              if (completedCount < template.total_matches) {
                shouldAdvance = false;                   // not done yet
              } else {
                tieWinnerName = winsA > winsB ? match.team_a_name : match.team_b_name;
              }
            } else {
              // ——— Competitive Mode (EARLY): stop once wins_required is reached ———
              const decided = winsA >= template.wins_required || winsB >= template.wins_required;
              if (!decided) {
                shouldAdvance = false;
              } else {
                tieWinnerName = winsA >= template.wins_required ? match.team_a_name : match.team_b_name;
              }
            }
          }
        }
      }

      if (shouldAdvance) {
        const slotField = match.next_team_slot === 'A'
          ? { team_a_name: tieWinnerName }
          : { team_b_name: tieWinnerName };

        const { error: slotErr } = await supabase
          .from('arena_matches')
          .update({ ...slotField, updated_at: new Date().toISOString() })
          .eq('id', match.next_match_id);

        if (slotErr) console.error('[match-end] advance error:', slotErr);

        // Activate next match if both slots now filled
        const { data: nextMatch } = await supabase
          .from('arena_matches')
          .select('team_a_name, team_b_name')
          .eq('id', match.next_match_id)
          .single();

        if (nextMatch && nextMatch.team_a_name !== 'TBD' && nextMatch.team_b_name !== 'TBD') {
          await supabase
            .from('arena_matches')
            .update({ status: 'PENDING', updated_at: new Date().toISOString() })
            .eq('id', match.next_match_id);
        }
      }
    }

    // 4. Group standings recalculation
    if (match.round_type === 'GROUP' && match.group_id && match.tournament_id) {
      await recalculateGroupStandings(match.tournament_id, match.group_id);
    }

    // 5. Broadcast via Supabase Realtime
    try {
      const channel = supabase.channel(`zto-arena-${eventId}`);
      await channel.send({
        type: 'broadcast',
        event: 'match-end',
        payload: { matchId, winnerId, winnerName, nextMatchId: match.next_match_id },
      });
      supabase.removeChannel(channel);
    } catch (broadcastErr) {
      console.warn('[match-end] Broadcast skipped (non-fatal):', broadcastErr);
    }

    return NextResponse.json({ ok: true, winnerName, nextMatchId: match.next_match_id });
  } catch (err: any) {
    console.error('[match-end] Fatal:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ——————————————————————————————————————————————————
// GROUP STANDINGS RECALCULATOR
// ——————————————————————————————————————————————————
async function recalculateGroupStandings(tournamentId: string, groupId: string) {
  const { data: groupMatches } = await supabase
    .from('arena_matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .eq('group_id', groupId)
    .eq('status', 'COMPLETED');

  if (!groupMatches || groupMatches.length === 0) return;

  const standings: Record<string, {
    team_name: string; wins: number; losses: number; played: number;
    points_for: number; points_against: number; point_diff: number;
  }> = {};

  for (const m of groupMatches) {
    if (!standings[m.team_a_name]) standings[m.team_a_name] = { team_name: m.team_a_name, wins: 0, losses: 0, played: 0, points_for: 0, points_against: 0, point_diff: 0 };
    if (!standings[m.team_b_name]) standings[m.team_b_name] = { team_name: m.team_b_name, wins: 0, losses: 0, played: 0, points_for: 0, points_against: 0, point_diff: 0 };

    standings[m.team_a_name].played++;
    standings[m.team_b_name].played++;
    standings[m.team_a_name].points_for     += m.score_a;
    standings[m.team_a_name].points_against += m.score_b;
    standings[m.team_b_name].points_for     += m.score_b;
    standings[m.team_b_name].points_against += m.score_a;

    if (m.winner === 'A') { standings[m.team_a_name].wins++; standings[m.team_b_name].losses++; }
    else                  { standings[m.team_b_name].wins++; standings[m.team_a_name].losses++; }

    standings[m.team_a_name].point_diff = standings[m.team_a_name].points_for - standings[m.team_a_name].points_against;
    standings[m.team_b_name].point_diff = standings[m.team_b_name].points_for - standings[m.team_b_name].points_against;
  }

  const sorted = sortGroupStandings(Object.values(standings));
  const upserts = sorted.map((s, idx) => ({
    tournament_id: tournamentId, group_id: groupId, team_name: s.team_name,
    wins: s.wins, losses: s.losses, played: s.played,
    points_for: s.points_for, points_against: s.points_against,
    rank: idx + 1, updated_at: new Date().toISOString(),
  }));

  await supabase.from('arena_group_standings').upsert(upserts, { onConflict: 'tournament_id,group_id,team_name' });
}
