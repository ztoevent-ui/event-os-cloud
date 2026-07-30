const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('ptw_documents').select('*').limit(1);
  if (error) console.log('Error:', error.code, error.message);
  else console.log('Table OK, rows:', data.length);
}
run();
