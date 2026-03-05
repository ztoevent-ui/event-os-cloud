import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zihjzbweasaqqbwilshx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTourney() {
    const { data: tourney, error } = await supabase
        .from('tournaments')
        .select('id, name, type')
        .eq('id', '9fe1b18e-a14e-46cc-b9d8-f8a4fd1a3c37')
        .single();

    console.log('Tournament Details:', tourney);
}

checkTourney();
