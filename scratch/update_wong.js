const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findClan() {
  const { data: clans, error } = await supabase
    .from('arena_clans')
    .select('*')
    .ilike('short_name', '%黄%');

  console.log("Clans:", clans);
  
  if (clans && clans.length > 0) {
    const wongId = clans[0].id;
    
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
          clan_a_id: wongId,
          team_a_name: clans[0].name
        })
        .eq('tournament_id', t.id)
        .eq('round_type', 'FINALS');
        
      if (!upErr) {
        console.log("Successfully set Wong Clan to FINALS slot A!");
      } else {
        console.error(upErr);
      }
    }
  }
}

findClan();
