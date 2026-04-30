const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://zihjzbweasaqqbwilshx.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4');
(async () => {
  const { data } = await supabase.from('profiles').select('id, email, display_name, role');
  console.log(data);
})();
