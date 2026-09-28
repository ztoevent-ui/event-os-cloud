// run_meeting_sessions_migration.js
// Usage: node run_meeting_sessions_migration.js
// Requires: NEXT_PUBLIC_SUPABASE_URL and a service_role key hardcoded or
//           supplied via SUPABASE_SERVICE_ROLE_KEY env var.
//
// To get your service_role key:
//   Supabase Dashboard → Project Settings → API → service_role (secret)

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://zihjzbweasaqqbwilshx.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY env var.');
    console.error('   Run: SUPABASE_SERVICE_ROLE_KEY="eyJ..." node run_meeting_sessions_migration.js');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
});

const sql = fs.readFileSync(
    path.join(__dirname, 'supabase/migrations/20260916_meeting_sessions.sql'),
    'utf8'
);

console.log('🚀 Running meeting_sessions migration...');

const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(() => ({ error: null }));

// Fallback: try direct query endpoint
const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ sql_query: sql }),
});

if (resp.ok || error === null) {
    console.log('✅ Migration complete! Table meeting_sessions created.');
} else {
    const body = await resp.text();
    console.warn('⚠️  RPC exec_sql not available — paste the SQL manually in Supabase SQL Editor:');
    console.warn('   https://supabase.com/dashboard/project/zihjzbweasaqqbwilshx/sql/new');
    console.log('\n📋 SQL to paste:\n');
    console.log(sql);
}
