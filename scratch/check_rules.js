const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRules() {
  const { data: t } = await supabase
    .from('arena_tournaments')
    .select('id')
    .or('id.eq.3fd90b1c-7e84-4480-83aa-d5905fe329bb,event_id_slug.eq.3fd90b1c-7e84-4480-83aa-d5905fe329bb')
    .single();

  const { data: rules, error } = await supabase
    .from('arena_round_rules')
    .select('*')
    .eq('tournament_id', t.id);

  console.log("Current Rules:", rules);
}

checkRules();
