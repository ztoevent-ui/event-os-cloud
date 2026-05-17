const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4'
);

async function main() {
  const updates = [
    { old: 'Wong', newShort: '黄氏' },
    { old: 'Koh', newShort: '许氏' },
    { old: 'Chan', newShort: '陈氏' },
    { old: 'Goh', newShort: '吴氏' },
  ];

  for (const u of updates) {
    const { data, error } = await supabase
      .from('arena_clans')
      .update({ short_name: u.newShort })
      .eq('short_name', u.old);
    
    if (error) console.error("Error updating", u.old, error);
    else console.log("Updated", u.old, "to", u.newShort);
  }
}
main();
