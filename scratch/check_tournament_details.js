const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseKey);

const tournamentId = '6074fc17-909a-4bdc-99d1-c028bf2fa068';

async function checkTournament() {
  const { data, error } = await supabase
    .from('arena_tournaments')
    .select('*')
    .eq('id', tournamentId)
    .single();

  if (error) {
    console.error('Error fetching tournament:', error);
    return;
  }
  
  console.log('Tournament Details:', JSON.stringify(data, null, 2));
}

checkTournament();
