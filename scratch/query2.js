const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://zihjzbweasaqqbwilshx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const eventId = '0258E48E-29C7-49B1-94E0-DFA5DAAAE169';
  const { data, error } = await supabase.from('arena_tournaments').select('id, name, bracket_json, screen_config').eq('id', eventId).single();
  console.log("Single query:", data, error);
}
check();
