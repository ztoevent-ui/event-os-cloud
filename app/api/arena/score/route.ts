import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
