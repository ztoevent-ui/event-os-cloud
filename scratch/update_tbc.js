const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4'
);

async function main() {
  // We want to replace "Winner SF-1", "Loser SF-2", etc. with "TBC"
  // Let's just find all matches in SEMIFINALS, FINALS, THIRD_PLACE and update
  // any team_a_name or team_b_name that starts with "Winner" or "Loser".
  
  const { data: matches, error } = await supabase
    .from('arena_matches')
    .select('id, team_a_name, team_b_name')
    .in('round_type', ['FINALS', 'THIRD_PLACE']);

  if (error) {
    console.error(error);
    return;
  }

  for (const match of matches) {
    let updateData = {};
    if (match.team_a_name && (match.team_a_name.includes('Winner') || match.team_a_name.includes('Loser'))) {
      updateData.team_a_name = 'TBC';
    }
    if (match.team_b_name && (match.team_b_name.includes('Winner') || match.team_b_name.includes('Loser'))) {
      updateData.team_b_name = 'TBC';
    }

    if (Object.keys(updateData).length > 0) {
      const { error: upErr } = await supabase.from('arena_matches').update(updateData).eq('id', match.id);
      if (upErr) console.error("Error updating match", match.id, upErr);
      else console.log("Updated match", match.id, "to", updateData);
    }
  }
}
main();
