const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function linkTournament() {
    const tournamentId = '6074fc17-909a-4bdc-99d1-c028bf2fa068';
    const projectId = '6c3c5ee9-43c3-424a-ae94-399081e6df9a';

    console.log(`Linking tournament ${tournamentId} to project ${projectId}...`);

    const { data, error } = await supabase
        .from('arena_tournaments')
        .update({ linked_project_id: projectId })
        .eq('id', tournamentId)
        .select();

    if (error) {
        console.error('Error linking tournament:', error);
    } else {
        console.log('Successfully linked tournament:', data);
    }
}

linkTournament();
