const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Typically they might need service_role for DDL, but let's try anon if it worked for ptw
);

// If there's a service role key in .env, we should use it for migrations. Let's try to find one just in case.
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  try {
    const sql = fs.readFileSync('supabase/migrations/20260817_booth_visitors.sql', 'utf8');
    
    // First try with admin
    let { error } = await adminSupabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.log('Admin RPC failed or not using service_role, trying anon...');
      const res = await supabase.rpc('exec_sql', { sql });
      error = res.error;
    }
    
    if (error) {
      console.log('RPC exec_sql failed:', error);
      console.log('Trying alternative: you might need to apply this manually.');
      // Check if table exists
      const { data, error: e2 } = await supabase.from('booth_visitors').select('id').limit(1);
      if (e2 && e2.code === '42P01') {
         console.log('❌ Table does not exist. Please apply manually.');
      } else {
         console.log('✅ Table seems to exist already!');
      }
    } else {
      console.log('✅ Migration applied successfully via RPC.');
    }
  } catch (err) {
    console.error('Script error:', err);
  }
}

run();
