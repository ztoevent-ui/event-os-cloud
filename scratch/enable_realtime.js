const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function enableRealtime() {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      BEGIN;
      -- Check if table is already in publication, if not add it
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime' AND tablename = 'arena_matches'
        ) THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE arena_matches;
        END IF;
      END
      $$;
      COMMIT;
    `
  });

  if (error) {
    console.error("RPC Error:", error);
    // If we don't have exec_sql RPC, we might not be able to do this directly.
  } else {
    console.log("Successfully enabled Realtime for arena_matches!");
  }
}

enableRealtime();
