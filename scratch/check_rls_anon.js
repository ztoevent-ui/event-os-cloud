const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const { data, error } = await supabase.from('arena_matches').select('*').limit(1);
  console.log("Select check:", error || "Success");
  
  if (data && data.length > 0) {
    const { error: updateError } = await supabase.from('arena_matches').update({ status: data[0].status }).eq('id', data[0].id);
    console.log("Update check:", updateError || "Success");
  }
}
main();
