const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBPORegistrations() {
  const { data, error } = await supabase
    .from('bpo_registrations')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Error fetching BPO registrations:', error);
    return;
  }
  
  console.log(`Found ${data.length} sample registrations in bpo_registrations`);
  if (data.length > 0) {
    console.log('Sample registration:', JSON.stringify(data[0], null, 2));
  }
}

checkBPORegistrations();
