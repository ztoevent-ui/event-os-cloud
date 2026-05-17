const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4'
);

async function main() {
  const { data, error } = await supabase
    .from('arena_tournaments')
    .select('id')
    .eq('event_id_slug', 'bintulu-pickleball-2026')
    .single();
    
  if (error || !data) {
    console.error("Could not find tournament.", error);
    return;
  }
  
  const tid = data.id;

  const rules = [
    { tournament_id: tid, round_type: 'SEMIFINALS',  scoring_type: 'SIDE_OUT', max_points: 11, win_by: 2, sets_to_win: 1, max_sets: 1, freeze_at: null },
    { tournament_id: tid, round_type: 'FINALS',      scoring_type: 'SIDE_OUT', max_points: 11, win_by: 2, sets_to_win: 1, max_sets: 1, freeze_at: null },
    { tournament_id: tid, round_type: 'THIRD_PLACE', scoring_type: 'SIDE_OUT', max_points: 11, win_by: 2, sets_to_win: 1, max_sets: 1, freeze_at: null },
  ];
  
  const { error: ruleErr } = await supabase.from('arena_round_rules').upsert(rules, { onConflict: 'tournament_id,round_type' });
  if (ruleErr) console.error("Rules Error:", ruleErr);
  else console.log("Rules set successfully!");

  // Now create the TBD Finals and 3rd Place matches
  const MATCH_CATEGORIES = [
    { code: 'MD1', sequence_order: 1 },
    { code: 'WD',  sequence_order: 2 },
    { code: 'XD',  sequence_order: 3 },
    { code: 'V',   sequence_order: 4 },
    { code: 'MD2', sequence_order: 5 },
  ];

  // We need the ID of a "TBD" clan, or we can just leave clan_a_id and clan_b_id as NULL and just set team_a_name and team_b_name
  const matchRows = [];
  
  // 3rd/4th Placing
  for (const cat of MATCH_CATEGORIES) {
    matchRows.push({
      tournament_id: tid,
      team_a_name: 'Loser SF-1',
      team_b_name: 'Loser SF-2',
      round_type: 'THIRD_PLACE',
      group_id: '3RD-PLACE',
      category_code: cat.code,
      event_type: cat.code,
      status: 'PENDING',
      bracket_match_id: `3RD-PLACE-${cat.code}`,
      current_set: 1,
      score_a: 0, score_b: 0,
    });
  }

  // Finals
  for (const cat of MATCH_CATEGORIES) {
    matchRows.push({
      tournament_id: tid,
      team_a_name: 'Winner SF-1',
      team_b_name: 'Winner SF-2',
      round_type: 'FINALS',
      group_id: 'FINALS',
      category_code: cat.code,
      event_type: cat.code,
      status: 'PENDING',
      bracket_match_id: `FINALS-${cat.code}`,
      current_set: 1,
      score_a: 0, score_b: 0,
    });
  }

  const { error: matchErr } = await supabase.from('arena_matches').insert(matchRows);
  if (matchErr) console.error("Match Error:", matchErr);
  else console.log("Finals matches created!");
}
main();
