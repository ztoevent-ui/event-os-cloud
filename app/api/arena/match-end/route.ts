import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sortGroupStandings } from '@/lib/arena-engine';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// POST /api/arena/match-end
// Called when a match completes:
// 1. Marks match as COMPLETED
// 2. Auto-advances winner to next bracket slot
// 3. Recalculates group standings if applicable
// 4. Broadcasts match-end event via Supabase channel
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

    // 2. Mark match as completed
    await supabase
      .from('arena_matches')
      .update({
        status: 'COMPLETED',
        winner: winnerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchId);

    const winnerName = winnerId === 'A' ? match.team_a_name : match.team_b_name;
    const loserName = winnerId === 'A' ? match.team_b_name : match.team_a_name;

    // 3. Auto-progression — handle Tie-level settlement if applicable
    if (match.next_match_id && match.next_team_slot) {
      let shouldAdvance = true;
      let tieWinnerName = winnerName;

      // If it's a Tie-team match, we need to check the Tie Template rules
      if (match.tie_id) {
        const { data: template } = await supabase
          .from('arena_tie_templates')
          .select('wins_required, total_matches, completion_mode')
          .eq('id', match.tie_id)
          .single();

        if (template) {
          // Identify all matches in this specific Tie instance
          // Grouped by bracket_match_id or group_id + team names
          const query = supabase
            .from('arena_matches')
            .select('winner, status')
            .eq('tournament_id', match.tournament_id)
            .eq('team_a_name', match.team_a_name)
            .eq('team_b_name', match.team_b_name);
          
          if (match.bracket_match_id) query.eq('bracket_match_id', match.bracket_match_id);
          if (match.group_id) query.eq('group_id', match.group_id);

          const { data: tieMatches } = await query;

          if (tieMatches) {
            const winsA = tieMatches.filter(m => m.winner === 'A').length;
            const winsB = tieMatches.filter(m => m.winner === 'B').length;
            const completedCount = tieMatches.filter(m => m.status === 'COMPLETED').length;
            const isTieWinnerDetermined = winsA >= template.wins_required || winsB >= template.wins_required;

            if (template.completion_mode === 'FULL') {
              // Experience Mode: All matches must be played
              if (completedCount < template.total_matches) {
                shouldAdvance = false;
              } else {
                tieWinnerName = winsA > winsB ? match.team_a_name : match.team_b_name;
              }
            } else {
              // Competitive Mode (EARLY): Stop when winner reached
              if (!isTieWinnerDetermined) {
                shouldAdvance = false;
              } else {
                tieWinnerName = winsA >= template.wins_required ? match.team_a_name : match.team_b_name;
              }
            }
          }
        }
      }

      if (shouldAdvance) {
        const updateField = match.next_team_slot === 'A'
          ? { team_a_name: tieWinnerName }
          : { team_b_name: tieWinnerName };

        const { error: slotErr } = await supabase
          .from('arena_matches')
          .update({ ...updateField, updated_at: new Date().toISOString() })
          .eq('id', match.next_match_id);

        if (slotErr) {
          console.error('[match-end] Failed to advance winner:', slotErr);
        }

        // Change next match status from PENDING → PENDING (it's now slotted)
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

    // 4. Group stage standings recalculation
    if (match.round_type === 'GROUP' && match.group_id && match.tournament_id) {
      await recalculateGroupStandings(match.tournament_id, match.group_id);
    }

    // 5. Broadcast via Supabase Realtime channel (ephemeral + DB realtime covers it)
    try {
      const channel = supabase.channel(`zto-arena-${eventId}`);
      await channel.send({
        type: 'broadcast',
        event: 'match-end',
        payload: {
          matchId,
          winnerId,
          winnerName,
          nextMatchId: match.next_match_id,
        },
      });
      supabase.removeChannel(channel);
    } catch (broadcastErr) {
      // Non-critical — DB realtime handles the screen updates
      console.warn('[match-end] Broadcast failed (non-critical):', broadcastErr);
    }

    return NextResponse.json({ ok: true, winnerName, nextMatchId: match.next_match_id });
  } catch (err: any) {
    console.error('[match-end] Fatal:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ——————————————————————————————————————————————————
// GROUP STANDINGS RECALCULATOR
// Weight: Wins → Head-to-head → Point differential
// ——————————————————————————————————————————————————
async function recalculateGroupStandings(tournamentId: string, groupId: string) {
  // Load all completed matches in this group
  const { data: groupMatches } = await supabase
    .from('arena_matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .eq('group_id', groupId)
    .eq('status', 'COMPLETED');

  if (!groupMatches || groupMatches.length === 0) return;

  // Build standings map
  const standings: Record<string, {
    team_name: string;
    wins: number;
    losses: number;
    played: number;
    points_for: number;
    points_against: number;
    point_diff: number;
  }> = {};

  for (const m of groupMatches) {
    if (!standings[m.team_a_name]) {
      standings[m.team_a_name] = { team_name: m.team_a_name, wins: 0, losses: 0, played: 0, points_for: 0, points_against: 0, point_diff: 0 };
    }
    if (!standings[m.team_b_name]) {
      standings[m.team_b_name] = { team_name: m.team_b_name, wins: 0, losses: 0, played: 0, points_for: 0, points_against: 0, point_diff: 0 };
    }

    standings[m.team_a_name].played++;
    standings[m.team_b_name].played++;
    standings[m.team_a_name].points_for += m.score_a;
    standings[m.team_a_name].points_against += m.score_b;
    standings[m.team_b_name].points_for += m.score_b;
    standings[m.team_b_name].points_against += m.score_a;

    if (m.winner === 'A') {
      standings[m.team_a_name].wins++;
      standings[m.team_b_name].losses++;
    } else {
      standings[m.team_b_name].wins++;
      standings[m.team_a_name].losses++;
    }

    // Update point diff
    standings[m.team_a_name].point_diff = standings[m.team_a_name].points_for - standings[m.team_a_name].points_against;
    standings[m.team_b_name].point_diff = standings[m.team_b_name].points_for - standings[m.team_b_name].points_against;
  }

  const sorted = sortGroupStandings(Object.values(standings));

  // Upsert standings
  const upserts = sorted.map((s, idx) => ({
    tournament_id: tournamentId,
    group_id: groupId,
    team_name: s.team_name,
    wins: s.wins,
    losses: s.losses,
    played: s.played,
    points_for: s.points_for,
    points_against: s.points_against,
    rank: idx + 1,
    updated_at: new Date().toISOString(),
  }));

  await supabase
    .from('arena_group_standings')
    .upsert(upserts, { onConflict: 'tournament_id,group_id,team_name' });
}
