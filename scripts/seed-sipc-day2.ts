/**
 * SEED: Bintulu Interclan pickleball championship 2026 - Day 2 (Semi-Finals & Finals)
 * Run: npx ts-node scripts/seed-sipc-day2.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
// Use service role key (bypasses RLS) for seeding
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';

const supabase = createClient(supabaseUrl, supabaseKey);

// ── Match categories — Tie order: MD1 → WD → XD → V → MD2 ───────────────────
const MATCH_CATEGORIES = [
  { code: 'MD1', sequence_order: 1 },
  { code: 'WD',  sequence_order: 2 },
  { code: 'XD',  sequence_order: 3 },
  { code: 'V',   sequence_order: 4 },
  { code: 'MD2', sequence_order: 5 },
] as const;

// ── Day 2 Semi-Finals Matches ────────────────────────────────────────────────
// Tie 1: Wong (黄氏) vs Koh (许氏)
// Tie 2: Chan (陈氏) vs Goh (吴氏)
const SEMIFINALS = [
  { clanA: 'Wong', clanB: 'Koh' },
  { clanA: 'Chan', clanB: 'Goh' }
];

async function getTournamentId(): Promise<string> {
  const { data, error } = await supabase
    .from('arena_tournaments')
    .select('id')
    .eq('name', 'Bintulu Interclan pickleball championship 2026')
    .single();
    
  if (error || !data) {
    throw new Error('Could not find tournament "Bintulu Interclan pickleball championship 2026". Did you run the Day 1 seed script?');
  }
  return data.id;
}

async function updateRoundRules(tid: string) {
  // Classic 11分 Side Out 制 for Semi-finals and Finals
  const rules = [
    { tournament_id: tid, round_type: 'SEMIFINALS', scoring_type: 'SIDE_OUT', max_points: 11, win_by: 2, sets_to_win: 1, max_sets: 1, freeze_at: null },
    { tournament_id: tid, round_type: 'FINALS',     scoring_type: 'SIDE_OUT', max_points: 11, win_by: 2, sets_to_win: 1, max_sets: 1, freeze_at: null },
  ];
  const { error } = await supabase.from('arena_round_rules').upsert(rules, { onConflict: 'tournament_id,round_type' });
  if (error) throw new Error(`Failed to update round rules: ${error.message}`);
  console.log(`[SEED] ✅ Round rules updated: SEMIFINALS and FINALS are now 11-point SIDE_OUT`);
}

async function updateClanLogos(tid: string) {
  const logosToUpdate = [
    { short_name: 'Wong', logo_url: '/logos/wong.jpg' },
    { short_name: 'Koh',  logo_url: '/logos/koh.jpg' },
    { short_name: 'Chan', logo_url: '/logos/chan.jpg' },
    { short_name: 'Goh',  logo_url: '/logos/goh.jpg' },
  ];

  for (const clan of logosToUpdate) {
    const { error } = await supabase
      .from('arena_clans')
      .update({ logo_url: clan.logo_url })
      .eq('tournament_id', tid)
      .eq('short_name', clan.short_name);
      
    if (error) {
      console.error(`  ❌ Failed to update logo for ${clan.short_name}: ${error.message}`);
    } else {
      console.log(`[SEED] ✅ Logo updated for ${clan.short_name} -> ${clan.logo_url}`);
    }
  }
}

async function getClanIds(tid: string): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('arena_clans')
    .select('id, short_name')
    .eq('tournament_id', tid);
    
  if (error) throw new Error(`Failed to fetch clans: ${error.message}`);
  
  const map: Record<string, string> = {};
  for (const c of data) map[c.short_name] = c.id;
  return map;
}

async function seedSemiFinalMatches(tid: string, clanIds: Record<string, string>) {
  console.log(`[SEED] Seeding Day 2 Semi-Final matches...`);
  const matchRows: object[] = [];

  for (let i = 0; i < SEMIFINALS.length; i++) {
    const tie = SEMIFINALS[i];
    const clanAId = clanIds[tie.clanA];
    const clanBId = clanIds[tie.clanB];
    
    if (!clanAId || !clanBId) {
      console.warn(`  ⚠️  Missing clan IDs for ${tie.clanA} vs ${tie.clanB}`);
      continue;
    }

    const matchGroupLabel = `SF-${i + 1}`;

    // Each Tie creates 5 individual arena_matches
    for (const cat of MATCH_CATEGORIES) {
      matchRows.push({
        tournament_id: tid,
        clan_a_id: clanAId,
        clan_b_id: clanBId,
        team_a_name: tie.clanA,
        team_b_name: tie.clanB,
        round_type: 'SEMIFINALS',
        group_id: matchGroupLabel,
        category_code: cat.code,
        event_type: cat.code,
        status: 'PENDING',
        bracket_match_id: `${matchGroupLabel}-${tie.clanA}v${tie.clanB}-${cat.code}`,
        sets_scores: [],
        current_set: 1,
        score_a: 0, score_b: 0,
        sets_won_a: 0, sets_won_b: 0,
      });
    }
  }

  const { error } = await supabase.from('arena_matches').insert(matchRows);
  if (error) throw new Error(`Failed to seed semi-final matches: ${error.message}`);
  console.log(`[SEED] ✅ ${matchRows.length} Semi-Final match records created`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🏆 Bintulu Interclan pickleball championship 2026 - DAY 2');
  console.log('='.repeat(65));
  
  try {
    const tid = await getTournamentId();
    console.log(`[SEED] Found tournament ID: ${tid}`);
    
    await updateRoundRules(tid);
    await updateClanLogos(tid);
    
    const clanIds = await getClanIds(tid);
    await seedSemiFinalMatches(tid, clanIds);

    console.log('\n' + '='.repeat(65));
    console.log('🎉 Day 2 Seed complete!');
    console.log(`   Semi-finals generated successfully.`);
    console.log(`   Make sure your logos are placed in public/logos/ folder:`);
    console.log(`     - public/logos/wong.jpg`);
    console.log(`     - public/logos/koh.jpg`);
    console.log(`     - public/logos/chan.jpg`);
    console.log(`     - public/logos/goh.jpg`);
    console.log('='.repeat(65) + '\n');
  } catch (err) {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  }
}

main();
