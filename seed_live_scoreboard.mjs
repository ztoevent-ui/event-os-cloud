import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// We use the public ANON key since the RLS policies in the SQL script allow all access
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env var.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
});

async function run() {
    console.log('⚠️  Notice: Since you do not have the Service Role Key in .env.local, please make sure you have MANUALLY executed the SQL migration in your Supabase SQL Editor:');
    console.log('   🔗 https://supabase.com/dashboard/project/zihjzbweasaqqbwilshx/sql/new');
    console.log('   📁 File: supabase/migrations/20260928_live_scoreboard.sql\n');
    console.log('--------------------------------------------------');

    // Seed Teams
    const teams = [
        { name: 'RED TITANS', color_hex: '#ef4444' }, // Tailwind red-500
        { name: 'BLUE DRAGONS', color_hex: '#3b82f6' }, // blue-500
        { name: 'YELLOW LIONS', color_hex: '#eab308' }, // yellow-500
        { name: 'GREEN VIPERS', color_hex: '#22c55e' }, // green-500
    ];

    console.log('🌱 Seeding teams...');
    for (const t of teams) {
        const { error } = await supabase.from('teams').insert([t]).select();
        if (error) {
            if (error.code !== '23505') console.error(`❌ Error seeding team ${t.name}:`, error.message);
        } else {
            console.log(`   ✅ Inserted team: ${t.name}`);
        }
    }

    // Seed Categories
    const categories = [
        { event_name: 'Main Stage Props (A)', event_type: 'A' },
        { event_name: 'Team Relay (B)', event_type: 'B_team' },
        { event_name: '100m Sprint (B)', event_type: 'B_ind' },
        { event_name: 'Tug of War (C)', event_type: 'C' },
    ];
    
    console.log('🌱 Seeding categories...');
    for (const c of categories) {
        const { error } = await supabase.from('event_categories').insert([c]);
        if (error) {
            console.error(`❌ Error seeding category ${c.event_name}:`, error.message);
        } else {
             console.log(`   ✅ Inserted category: ${c.event_name}`);
        }
    }
    
    console.log('\n🎉 Seeding complete! You can now start Next.js and open /scoreboard/broadcast');
}

run();
