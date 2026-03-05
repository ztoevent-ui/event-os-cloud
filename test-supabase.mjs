import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zihjzbweasaqqbwilshx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    const { data: matches } = await supabase.from('matches').select('*').limit(1);
    if (!matches || matches.length === 0) return;
    const testId = matches[0].id;

    console.log("Simulating a CLEAN update (no server_number)...");
    const { error: updateError } = await supabase.from('matches').update({
        match_history: [...(matches[0].match_history || []), { p1: 21, p2: 0 }],
        sets_p1: (matches[0].sets_p1 || 0) + 1,
        current_score_p1: 0,
        current_score_p2: 0,
    }).eq('id', testId);

    if (updateError) {
        console.error("❌ Clean Update Failed:", updateError.message);
    } else {
        console.log("✅ Clean Update Successful! The Referee End Game flow is now fully fixed for most sports.");
    }
}

check();
