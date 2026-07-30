const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('ptw_documents').insert({
    title: 'Test Global PTW',
    selected_items: [],
    risks: [],
    status: 'draft'
  }).select();
  console.log('Error:', error);
  console.log('Data:', data);
}
run();
