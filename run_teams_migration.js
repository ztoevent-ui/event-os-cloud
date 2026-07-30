import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { error } = await supabase.rpc('exec_sql', { sql: "ALTER TABLE ptw_documents ADD COLUMN IF NOT EXISTS teams JSONB NOT NULL DEFAULT '[]';" });
  if (error) {
    console.log("RPC exec_sql failed, trying direct query if possible, or please run in Supabase UI:", error);
  } else {
    console.log("Migration successful");
  }
}
run();
