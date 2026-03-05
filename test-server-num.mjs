import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zihjzbweasaqqbwilshx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testUpdate() {
    const matchId = '7fc3331d-4c86-42ff-a484-767337a5775c';

    // Simulate update WITH server_number (which we suspect is missing)
    const updates = {
        server_number: 1
    };

    console.log('Sending updates with server_number:', updates);

    const { data: result, error: updateError } = await supabase
        .from('matches')
        .update(updates)
        .eq('id', matchId)
        .select();

    if (updateError) {
        console.error('UPDATE FAILED AS EXPECTED:', updateError.message);
    } else {
        console.log('UPDATE SUCCESSFUL (WEIRD):', result[0]);
    }
}

testUpdate();
