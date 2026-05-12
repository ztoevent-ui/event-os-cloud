const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const eventId = '0258E48E-29C7-49B1-94E0-DFA5DAAAE169';
  console.log("Checking ID:", eventId);
  const { data, error } = await supabase.from('arena_tournaments').select('id, name, event_id_slug').eq('id', eventId).single();
  console.log("Result using id=eq.UUID:", data, error);
  
  const { data: data2, error: err2 } = await supabase.from('arena_tournaments').select('id, name, event_id_slug').eq('event_id_slug', eventId).single();
  console.log("Result using slug=eq.UUID:", data2, err2);
  
  const { data: data3 } = await supabase.from('arena_tournaments').select('id, name, event_id_slug');
  console.log("All tournaments:", data3);
}
check();
