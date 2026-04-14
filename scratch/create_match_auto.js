const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: tournaments, error: tErr } = await supabase
    .from('arena_tournaments')
    .select('id, name, event_id_slug')
    .or('event_id_slug.ilike.%BPO%,name.ilike.%Bintulu%')
    .order('created_at', { ascending: false });

  if (tErr) {
    console.error('Error fetching tournaments:', tErr);
    return;
  }

  if (tournaments.length === 0) {
    console.log('No tournament found.');
    return;
  }

  const target = tournaments[0];
  console.log('Using tournament:', target.name, '(', target.id, ')');

  const { data: match, error: mErr } = await supabase
    .from('arena_matches')
    .insert([{
      tournament_id: target.id,
      team_a_name: 'Tony (Bintulu)',
      team_b_name: 'Antigravity (AI)',
      round_type: 'GROUP',
      status: 'PENDING',
      event_type: 'MS',
      current_set: 1,
      score_a: 0,
      score_b: 0,
      sets_won_a: 0,
      sets_won_b: 0,
      sets_scores: []
    }])
    .select()
    .single();

  if (mErr) {
    console.error('Error creating match:', mErr);
    return;
  }

  console.log('Match created successfully!');
  console.log('Match ID:', match.id);
  console.log('Referee URL:', `https://ztoevent.com/arena/${target.id}/referee?matchId=${match.id}`);
}

run();
