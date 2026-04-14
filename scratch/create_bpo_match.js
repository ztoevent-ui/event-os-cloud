const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseKey);

const TOURNAMENT_ID = '787c93e4-8463-4903-911b-c439167df37c';

async function createMatch() {
  const { data: match, error } = await supabase
    .from('arena_matches')
    .insert([{
      tournament_id: TOURNAMENT_ID,
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

  if (error) {
    console.error('Error creating match:', error);
    return;
  }

  console.log('Match created successfully!');
  console.log('Match ID:', match.id);
  console.log('Referee URL:', `https://ztoevent.com/arena/${TOURNAMENT_ID}/referee?matchId=${match.id}`);
}

createMatch();
