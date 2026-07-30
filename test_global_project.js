const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('projects').select('*').eq('name', 'Global Company Operations').single();
  if (data) {
    console.log('Global project exists:', data.id);
  } else {
    const { data: newProj, error: insertError } = await supabase.from('projects').insert({
      name: 'Global Company Operations',
      type: 'corporate',
      status: 'active'
    }).select().single();
    if (insertError) console.log('Insert error:', insertError);
    else console.log('Created global project:', newProj.id);
  }
}
run();
