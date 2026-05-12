const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://zihjzbweasaqqbwilshx.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4');

async function check() {
  const { data, error } = await supabase.from('arena_tournaments').select('id, name, bracket_json').limit(1);
  console.log("bracket_json query:", error ? error.message : "Success");
}
check();
