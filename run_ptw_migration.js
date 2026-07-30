const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const sql = `
    CREATE TABLE IF NOT EXISTS ptw_documents (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      hash TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
      title TEXT NOT NULL DEFAULT 'Work Permit & Site Activity Notice',
      work_leader TEXT,
      work_leader_contact TEXT,
      selected_items JSONB NOT NULL DEFAULT '[]',
      risks JSONB NOT NULL DEFAULT '[]',
      notes TEXT,
      status TEXT DEFAULT 'draft',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      issued_at TIMESTAMPTZ
    );
  `;
  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    // Try direct insert to verify table exists by listing columns
    console.log('RPC not available, checking if table exists...');
    const { data, error: e2 } = await supabase.from('ptw_documents').select('id').limit(1);
    if (e2 && e2.code === '42P01') {
      console.log('Table does not exist yet. Please run the SQL migration manually in the Supabase dashboard.');
      console.log('SQL file: supabase/migrations/20260719_ptw_documents.sql');
    } else {
      console.log('Table already exists or was just created:', data ? 'OK' : 'unknown');
    }
  } else {
    console.log('Migration ran successfully.');
  }
}
run();
