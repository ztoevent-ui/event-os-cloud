import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zihjzbweasaqqbwilshx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkColumns() {
    const { data, error } = await supabase.from('matches').select('*').limit(1);
    if (error) {
        console.error('Error fetching match:', error);
        return;
    }
    if (data && data.length > 0) {
        console.log('Columns in matches table:', Object.keys(data[0]));
    } else {
        console.log('No matches found to check columns.');
    }
}

checkColumns();
