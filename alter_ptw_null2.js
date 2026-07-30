const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { error } = await supabase.rpc('exec_sql', { sql: 'ALTER TABLE ptw_documents ALTER COLUMN project_id DROP NOT NULL;' });
  if (error) console.log('RPC error:', error);
  else console.log('Success');
}
run();
