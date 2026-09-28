import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const runtime = 'edge';
// In-built Next.js cache revalidation for edge caching (3 seconds)
export const revalidate = 3;

export async function GET() {
  const { data: teams } = await supabase.from('teams').select('*');
  const { data: scores } = await supabase.from('game_scores').select('*');
  
  const results = (teams || []).map(t => {
    const tScores = (scores || []).filter(s => s.team_id === t.id);
    const total = tScores.reduce((sum, current) => sum + current.score, 0);
    return { ...t, score: total };
  });
  
  return NextResponse.json({ teams: results }, {
    headers: {
      'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=59'
    }
  });
}
