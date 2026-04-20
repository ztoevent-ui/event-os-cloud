const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zihjzbweasaqqbwilshx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4'
);

async function createProject() {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: 'Kemena Pacific Hospital Rename Ceremony',
      type: 'corporate',
      status: 'planning',
      venue: 'Kemena Pacific Hospital, Bintulu',
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating project:', error.message);
    return;
  }

  console.log('✅ Project created successfully!');
  console.log('   ID   :', data.id);
  console.log('   Name :', data.name);
  console.log('   URL  : https://ztoevent.com/projects/' + data.id);
}

createProject();
