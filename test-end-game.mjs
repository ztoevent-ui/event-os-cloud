import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zihjzbweasaqqbwilshx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testUpdate() {
    // 1. Get an ongoing match
    const { data: matches, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'ongoing')
        .limit(1);

    if (fetchError || !matches || matches.length === 0) {
        console.error('No ongoing match found to test:', fetchError);
        return;
    }

    const match = matches[0];
    console.log('Testing update on match:', match.id);

    // 2. Simulate handleGameEnd updates
    const updates = {
        sets_p1: (match.sets_p1 || 0) + 1,
        sets_p2: (match.sets_p2 || 0),
        current_score_p1: 0,
        current_score_p2: 0,
        match_history: [...(match.match_history || []), { p1: 21, p2: 19 }],
        status: 'ongoing'
    };

    console.log('Sending updates:', updates);

    const { data: result, error: updateError } = await supabase
        .from('matches')
        .update(updates)
        .eq('id', match.id)
        .select();

    if (updateError) {
        console.error('UPDATE FAILED:', updateError.message, updateError.details, updateError.hint);
    } else {
        console.log('UPDATE SUCCESSFUL:', result[0]);
    }
}

testUpdate();
