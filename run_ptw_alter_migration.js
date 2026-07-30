const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const sql = `
    ALTER TABLE ptw_documents
    ADD COLUMN IF NOT EXISTS client_name TEXT,
    ADD COLUMN IF NOT EXISTS client_signature TEXT,
    ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;
  `;
  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    console.error('Error running migration via rpc:', error);
  } else {
    console.log('Migration to add signature columns ran successfully.');
  }
}
run();
