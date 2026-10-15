import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const runtime = 'edge';
// In-built Next.js cache revalidation for edge caching (3 seconds)
export const revalidate = 3;

export async function GET() {
  const [
    { data: teams },
    { data: scores },
    { data: categories },
    { data: configRows }
  ] = await Promise.all([
    supabase.from('teams').select('*'),
    supabase.from('game_scores').select('id, team_id, category_id, score, created_at'),
    supabase.from('event_categories').select('id, event_name, event_type, status'),
    supabase.from('scoreboard_config').select('*'),
  ]);

  const results = (teams || []).map(t => {
    const tScores = (scores || []).filter(s => s.team_id === t.id);
    const total = tScores.reduce((sum, current) => sum + current.score, 0);
    return { ...t, score: total };
  });

  const config: Record<string, string> = {};
  if (configRows) {
    configRows.forEach(row => { config[row.key] = row.value; });
  }

  return NextResponse.json({
    teams: results,
    scores: scores || [],
    categories: categories || [],
    config,
    timestamp: Date.now(),
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=59'
    }
  });
}
