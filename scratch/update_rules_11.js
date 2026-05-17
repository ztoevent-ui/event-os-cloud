const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateRules() {
  const { data: t } = await supabase
    .from('arena_tournaments')
    .select('id')
    .or('id.eq.3fd90b1c-7e84-4480-83aa-d5905fe329bb,event_id_slug.eq.3fd90b1c-7e84-4480-83aa-d5905fe329bb')
    .single();

  if (!t) return;

  // Update FINALS and THIRD_PLACE round rules to 11 points
  const { error } = await supabase
    .from('arena_round_rules')
    .update({
      max_points: 11
    })
    .eq('tournament_id', t.id)
    .in('round_type', ['FINALS', 'THIRD_PLACE']);

  if (error) {
    console.error("Error updating rules:", error);
  } else {
    console.log("Successfully updated FINALS and THIRD_PLACE to 11 points!");
  }
}

updateRules();
