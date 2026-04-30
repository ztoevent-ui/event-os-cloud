const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://zihjzbweasaqqbwilshx.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4');

// I will login with admin email to test the RLS
// Wait, I don't have the password.
// Let's use the service role key if it's available, but it's not.
