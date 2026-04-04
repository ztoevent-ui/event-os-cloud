import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/arena/score
// Persists score state from referee iPad to DB + broadcasts to all screens
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      match_id,
      score_a,
      score_b,
      server,
      left_team,
      sets_won_a,
      sets_won_b,
      current_set,
      sets_scores,
      status,
    } = body;

    if (!match_id) {
      return NextResponse.json({ error: 'match_id required' }, { status: 400 });
    }

    // Update match record
    const { error } = await supabase
      .from('arena_matches')
      .update({
        score_a,
        score_b,
        server,
        left_team,
        sets_won_a,
        sets_won_b,
        current_set,
        sets_scores,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', match_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Supabase Realtime will automatically propagate the DB change to subscribers
    // No explicit broadcast needed — table subscriptions handle this

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
