const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findClans() {
  const { data: hiiClan } = await supabase.from('arena_clans').select('*').ilike('short_name', '%许%').single();
  const { data: gohClan } = await supabase.from('arena_clans').select('*').ilike('short_name', '%吴%').single();

  if (hiiClan && gohClan) {
    // Get the tournament
    const { data: t } = await supabase
      .from('arena_tournaments')
      .select('id')
      .or('id.eq.3fd90b1c-7e84-4480-83aa-d5905fe329bb,event_id_slug.eq.3fd90b1c-7e84-4480-83aa-d5905fe329bb')
      .single();

    if (t) {
      const { error: upErr } = await supabase
        .from('arena_matches')
        .update({
          clan_a_id: hiiClan.id,
          team_a_name: hiiClan.name,
          clan_b_id: gohClan.id,
          team_b_name: gohClan.name
        })
        .eq('tournament_id', t.id)
        .eq('round_type', 'THIRD_PLACE');
        
      if (!upErr) {
        console.log("Successfully set Hii and Goh Clans to THIRD_PLACE matches!");
      } else {
        console.error(upErr);
      }
    }
  }
}

findClans();
