import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const [
      { data: teams, error: errTeams },
      { data: scores, error: errScores },
      { data: categories, error: errCategories },
      { data: configRows, error: errConfig }
    ] = await Promise.all([
      supabase.from('teams').select('*'),
      supabase.from('game_scores').select('id, team_id, category_id, score, created_at'),
      supabase.from('event_categories').select('id, event_name, event_type, status'),
      supabase.from('scoreboard_config').select('*'),
    ]);

    if (errTeams) console.error('Error fetching teams:', errTeams);

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
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error: any) {
    console.error('Scoreboard API error:', error);
    return NextResponse.json({
      teams: [],
      scores: [],
      categories: [],
      config: {},
      error: error?.message || 'Internal error',
      timestamp: Date.now(),
    }, { status: 500 });
  }
}
