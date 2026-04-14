const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseKey);

const projectId = '6c3c5ee9-43c3-424a-ae94-399081e6df9a'; // BPO 2026 project

async function checkRegistrations() {
  // Check the table name for registrations. Usually 'project_registrations' or similar.
  // I saw earlier 'arena_tournaments' has a 'linked_project_id'.
  
  const { data, error } = await supabase
    .from('project_registrations')
    .select('*')
    .eq('project_id', projectId);

  if (error) {
    console.error('Error fetching registrations:', error);
    return;
  }
  
  console.log(`Found ${data.length} registrations for project ${projectId}`);
  if (data.length > 0) {
    console.log('Sample registration:', JSON.stringify(data[0], null, 2));
  }
}

checkRegistrations();
