/**
 * SEED: 2026第一届民都鲁省姓氏匹克球锦标赛 (黄守光杯)
 * Run: npx ts-node scripts/seed-miri-pickleball.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Set this to your existing tournament UUID, or null to auto-create ─────────
const TARGET_TOURNAMENT_ID: string | null = null;

// ── Tournament ────────────────────────────────────────────────────────────────
const TOURNAMENT = {
  name: 'Bintulu Interclan pickleball championship 2026',
  status: 'GROUP_STAGE',
  format: 'TIE_TEAM',
  current_round: 'GROUP',
};

// ── Match categories — Tie order: MD1 → WD → XD → V → MD2 ───────────────────
const MATCH_CATEGORIES = [
  { code: 'MD1', label_en: "Men's Doubles 1",  label_zh: '男双一', sequence_order: 1, gender: 'MALE',    players_per_side: 2 },
  { code: 'WD',  label_en: "Women's Doubles",  label_zh: '女双',   sequence_order: 2, gender: 'FEMALE',  players_per_side: 2 },
  { code: 'XD',  label_en: 'Mixed Doubles',    label_zh: '混双',   sequence_order: 3, gender: 'MIXED',   players_per_side: 2 },
  { code: 'V',   label_en: 'Veterans Doubles', label_zh: '元老双打', sequence_order: 4, gender: 'MIXED', players_per_side: 2 },
  { code: 'MD2', label_en: "Men's Doubles 2",  label_zh: '男双二', sequence_order: 5, gender: 'MALE',    players_per_side: 2 },
] as const;

// ── 9 Real Clans — replace players[] with actual athlete names ────────────────
const CLANS = [
  {
    name: '陈氏公会', short_name: 'Chan',
    primary_color: '#B22222', secondary_color: '#FFD700',
    players: [
      { name: 'Chan A (MD1)', categories: ['MD1'] },
      { name: 'Chan B (MD1)', categories: ['MD1'] },
      { name: 'Chan C (WD)',  categories: ['WD']  },
      { name: 'Chan D (WD)',  categories: ['WD']  },
      { name: 'Chan E (XD)',  categories: ['XD']  },
      { name: 'Chan F (XD)',  categories: ['XD']  },
      { name: 'Chan G (V)',   categories: ['V']   },
      { name: 'Chan H (V)',   categories: ['V']   },
      { name: 'Chan I (MD2)', categories: ['MD2'] },
      { name: 'Chan J (MD2)', categories: ['MD2'] },
    ],
  },
  {
    name: '林氏公会', short_name: 'Lim',
    primary_color: '#006400', secondary_color: '#98FB98',
    players: [
      { name: 'Lim A (MD1)', categories: ['MD1'] },
      { name: 'Lim B (MD1)', categories: ['MD1'] },
      { name: 'Lim C (WD)',  categories: ['WD']  },
      { name: 'Lim D (WD)',  categories: ['WD']  },
      { name: 'Lim E (XD)',  categories: ['XD']  },
      { name: 'Lim F (XD)',  categories: ['XD']  },
      { name: 'Lim G (V)',   categories: ['V']   },
      { name: 'Lim H (V)',   categories: ['V']   },
      { name: 'Lim I (MD2)', categories: ['MD2'] },
      { name: 'Lim J (MD2)', categories: ['MD2'] },
    ],
  },
  {
    name: '李氏公会', short_name: 'Lee',
    primary_color: '#00008B', secondary_color: '#ADD8E6',
    players: [
      { name: 'Lee A (MD1)', categories: ['MD1'] },
      { name: 'Lee B (MD1)', categories: ['MD1'] },
      { name: 'Lee C (WD)',  categories: ['WD']  },
      { name: 'Lee D (WD)',  categories: ['WD']  },
      { name: 'Lee E (XD)',  categories: ['XD']  },
      { name: 'Lee F (XD)',  categories: ['XD']  },
      { name: 'Lee G (V)',   categories: ['V']   },
      { name: 'Lee H (V)',   categories: ['V']   },
      { name: 'Lee I (MD2)', categories: ['MD2'] },
      { name: 'Lee J (MD2)', categories: ['MD2'] },
    ],
  },
  {
    name: '黄氏公会', short_name: 'Wong',
    primary_color: '#DAA520', secondary_color: '#FFFACD',
    players: [
      { name: 'Wong A (MD1)', categories: ['MD1'] },
      { name: 'Wong B (MD1)', categories: ['MD1'] },
      { name: 'Wong C (WD)',  categories: ['WD']  },
      { name: 'Wong D (WD)',  categories: ['WD']  },
      { name: 'Wong E (XD)',  categories: ['XD']  },
      { name: 'Wong F (XD)',  categories: ['XD']  },
      { name: 'Wong G (V)',   categories: ['V']   },
      { name: 'Wong H (V)',   categories: ['V']   },
      { name: 'Wong I (MD2)', categories: ['MD2'] },
      { name: 'Wong J (MD2)', categories: ['MD2'] },
    ],
  },
  {
    name: '许氏公会', short_name: 'Koh',
    primary_color: '#784212', secondary_color: '#D7BEA8',
    players: [
      { name: 'Koh A (MD1)', categories: ['MD1'] },
      { name: 'Koh B (MD1)', categories: ['MD1'] },
      { name: 'Koh C (WD)',  categories: ['WD']  },
      { name: 'Koh D (WD)',  categories: ['WD']  },
      { name: 'Koh E (XD)',  categories: ['XD']  },
      { name: 'Koh F (XD)',  categories: ['XD']  },
      { name: 'Koh G (V)',   categories: ['V']   },
      { name: 'Koh H (V)',   categories: ['V']   },
      { name: 'Koh I (MD2)', categories: ['MD2'] },
      { name: 'Koh J (MD2)', categories: ['MD2'] },
    ],
  },
  {
    name: '六桂堂', short_name: 'LGT',
    primary_color: '#6C0BA9', secondary_color: '#E8BCFF',
    players: [
      { name: 'LGT A (MD1)', categories: ['MD1'] },
      { name: 'LGT B (MD1)', categories: ['MD1'] },
      { name: 'LGT C (WD)',  categories: ['WD']  },
      { name: 'LGT D (WD)',  categories: ['WD']  },
      { name: 'LGT E (XD)',  categories: ['XD']  },
      { name: 'LGT F (XD)',  categories: ['XD']  },
      { name: 'LGT G (V)',   categories: ['V']   },
      { name: 'LGT H (V)',   categories: ['V']   },
      { name: 'LGT I (MD2)', categories: ['MD2'] },
      { name: 'LGT J (MD2)', categories: ['MD2'] },
    ],
  },
  {
    name: '张氏公会', short_name: 'Cheong',
    primary_color: '#FF6B00', secondary_color: '#FFE4B5',
    players: [
      { name: 'Cheong A (MD1)', categories: ['MD1'] },
      { name: 'Cheong B (MD1)', categories: ['MD1'] },
      { name: 'Cheong C (WD)',  categories: ['WD']  },
      { name: 'Cheong D (WD)',  categories: ['WD']  },
      { name: 'Cheong E (XD)',  categories: ['XD']  },
      { name: 'Cheong F (XD)',  categories: ['XD']  },
      { name: 'Cheong G (V)',   categories: ['V']   },
      { name: 'Cheong H (V)',   categories: ['V']   },
      { name: 'Cheong I (MD2)', categories: ['MD2'] },
      { name: 'Cheong J (MD2)', categories: ['MD2'] },
    ],
  },
  {
    name: '郑氏公会', short_name: 'Teh',
    primary_color: '#C0392B', secondary_color: '#F1948A',
    players: [
      { name: 'Teh A (MD1)', categories: ['MD1'] },
      { name: 'Teh B (MD1)', categories: ['MD1'] },
      { name: 'Teh C (WD)',  categories: ['WD']  },
      { name: 'Teh D (WD)',  categories: ['WD']  },
      { name: 'Teh E (XD)',  categories: ['XD']  },
      { name: 'Teh F (XD)',  categories: ['XD']  },
      { name: 'Teh G (V)',   categories: ['V']   },
      { name: 'Teh H (V)',   categories: ['V']   },
      { name: 'Teh I (MD2)', categories: ['MD2'] },
      { name: 'Teh J (MD2)', categories: ['MD2'] },
    ],
  },
  {
    name: '吴氏公会', short_name: 'Goh',
    primary_color: '#117A65', secondary_color: '#76D7C4',
    players: [
      { name: 'Goh A (MD1)', categories: ['MD1'] },
      { name: 'Goh B (MD1)', categories: ['MD1'] },
      { name: 'Goh C (WD)',  categories: ['WD']  },
      { name: 'Goh D (WD)',  categories: ['WD']  },
      { name: 'Goh E (XD)',  categories: ['XD']  },
      { name: 'Goh F (XD)',  categories: ['XD']  },
      { name: 'Goh G (V)',   categories: ['V']   },
      { name: 'Goh H (V)',   categories: ['V']   },
      { name: 'Goh I (MD2)', categories: ['MD2'] },
      { name: 'Goh J (MD2)', categories: ['MD2'] },
    ],
  },
];

// ── Day 1 Group-Stage Ties ────────────────────────────────────────────────────
// Group A: 陈氏, 林氏, 李氏, 黄氏  (round-robin → top 2 advance)
// Group B: 许氏, 六桂堂, 张氏, 郑氏, 吴氏 (round-robin → top 2 advance)
// Each Tie = 5 individual matches (MD1, WD, XD, V, MD2); first clan to win 3 wins the Tie.
// Scoring: Rally Scoring 21分制; switch sides when either team hits 11.
//
// Courts used per Tie (simultaneous):
//   Slot A (15 min): MD1 + WD + XD on 3 courts at once
//   Slot B (15 min): V  + MD2 on 2 courts at once
//   → Full Tie completes in 30 min

const DAY1_TIES = [
  // ── Group A ────────────────────────────────────────────────────
  // Tie A-1 @ Courts 7+1+2 → 1400-1430
  { group: 'A', clanA: 'Chan', clanB: 'Lim',  startTime: '14:00', courts: '7, 1, 2' },
  // Tie B-1 @ Courts 4+5+6 → 1400-1430 (simultaneous)
  { group: 'B', clanA: 'Koh',  clanB: 'LGT',  startTime: '14:00', courts: '4, 5, 6' },

  // Tie A-2 @ Courts 7+1+2 → 1430-1500
  { group: 'A', clanA: 'Lee',  clanB: 'Wong', startTime: '14:30', courts: '7, 1, 2' },
  // Tie B-2 @ Courts 4+5+6 → 1430-1500
  { group: 'B', clanA: 'Cheong', clanB: 'Teh', startTime: '14:30', courts: '4, 5, 6' },

  // Tie A-3 @ Courts 7+1+2 → 1500-1530
  { group: 'A', clanA: 'Chan', clanB: 'Lee',  startTime: '15:00', courts: '7, 1, 2' },
  // Tie B-3 @ Courts 4+5+6 → 1500-1530
  { group: 'B', clanA: 'Goh',  clanB: 'Koh',  startTime: '15:00', courts: '4, 5, 6' },

  // 1530-1545: break / court changeover

  // Tie A-4 → 1545-1615
  { group: 'A', clanA: 'Lim',  clanB: 'Wong', startTime: '15:45', courts: '7, 1, 2' },
  // Tie B-4 → 1545-1615
  { group: 'B', clanA: 'LGT',  clanB: 'Teh',  startTime: '15:45', courts: '4, 5, 6' },

  // Tie A-5 → 1615-1645
  { group: 'A', clanA: 'Chan', clanB: 'Wong', startTime: '16:15', courts: '7, 1, 2' },
  // Tie B-5 → 1615-1645
  { group: 'B', clanA: 'Cheong', clanB: 'Goh', startTime: '16:15', courts: '4, 5, 6' },

  // Tie A-6 → 1645-1715
  { group: 'A', clanA: 'Lim',  clanB: 'Lee',  startTime: '16:45', courts: '7, 1, 2' },
  // Tie B-6 → 1645-1715
  { group: 'B', clanA: 'Koh',  clanB: 'Teh',  startTime: '16:45', courts: '4, 5, 6' },

  // Tie B-7 → 1715-1745
  { group: 'B', clanA: 'LGT',  clanB: 'Goh',  startTime: '17:15', courts: '4, 5, 6' },

  // Tie B-8 → 1715-1745 (Court 1 available after Group A finishes)
  { group: 'B', clanA: 'Cheong', clanB: 'Koh', startTime: '17:15', courts: '7, 1, 2' },

  // Tie B-9 → 1745-1800 (extra match if needed)
  { group: 'B', clanA: 'Teh',  clanB: 'Goh',  startTime: '17:45', courts: '4, 5, 6' },

  // Tie B-10 → 1745-1800
  { group: 'B', clanA: 'LGT',  clanB: 'Cheong', startTime: '17:45', courts: '7, 1, 2' },
];

// ── Day 2 Structure (TBD after Day 1 results) ────────────────────────────────
// 半决赛 (1300-1420): A1 vs B2 | B1 vs A2
// 季军赛 (1430-1630): Semi-final losers
// 决赛   (1430-1630): Semi-final winners
// Each Day 2 match is also a 5-event Tie (MD1, WD, XD, V, MD2), BO5

// ── Helpers ───────────────────────────────────────────────────────────────────
async function getOrCreateTournament(): Promise<string> {
  if (TARGET_TOURNAMENT_ID) {
    console.log(`[SEED] Using existing tournament: ${TARGET_TOURNAMENT_ID}`);
    return TARGET_TOURNAMENT_ID;
  }
  const { data, error } = await supabase
    .from('arena_tournaments')
    .insert(TOURNAMENT)
    .select('id')
    .single();
  if (error) throw new Error(`Failed to create tournament: ${error.message}`);
  console.log(`[SEED] ✅ Tournament created: ${data.id}`);
  return data.id;
}

async function seedCategories(tid: string) {
  const rows = MATCH_CATEGORIES.map(c => ({ ...c, tournament_id: tid }));
  const { error } = await supabase.from('arena_match_categories').upsert(rows, { onConflict: 'tournament_id,code' });
  if (error) throw new Error(error.message);
  console.log(`[SEED] ✅ 5 categories seeded (MD1, WD, XD, V, MD2)`);
}

async function seedClans(tid: string): Promise<Record<string, string>> {
  const idMap: Record<string, string> = {};
  for (const clan of CLANS) {
    const { data, error } = await supabase
      .from('arena_clans')
      .upsert({ tournament_id: tid, ...clan }, { onConflict: 'tournament_id,short_name' })
      .select('id, short_name')
      .single();
    if (error) { console.error(`  ❌ ${clan.name}: ${error.message}`); continue; }
    idMap[data.short_name] = data.id;
    console.log(`[SEED]   ✅ ${clan.name}`);
  }
  return idMap;
}

async function seedRoundRules(tid: string) {
  // Rally Scoring 21分制, win by 2, side switch at 11 (freeze_at = null for group)
  const rules = [
    { tournament_id: tid, round_type: 'GROUP',      scoring_type: 'RALLY', max_points: 21, win_by: 2, sets_to_win: 1, max_sets: 1, freeze_at: null },
    { tournament_id: tid, round_type: 'KNOCKOUT',   scoring_type: 'RALLY', max_points: 21, win_by: 2, sets_to_win: 1, max_sets: 1, freeze_at: null },
    { tournament_id: tid, round_type: 'SEMIFINALS', scoring_type: 'RALLY', max_points: 21, win_by: 2, sets_to_win: 1, max_sets: 1, freeze_at: null },
    { tournament_id: tid, round_type: 'FINALS',     scoring_type: 'RALLY', max_points: 21, win_by: 2, sets_to_win: 1, max_sets: 1, freeze_at: null },
  ];
  const { error } = await supabase.from('arena_round_rules').upsert(rules, { onConflict: 'tournament_id,round_type' });
  if (error) throw new Error(error.message);
  console.log(`[SEED] ✅ Round rules: Rally 21pts, side-switch@11, win-by-2`);
}

async function seedTieTemplate(tid: string) {
  const { data: tie, error } = await supabase
    .from('arena_tie_templates')
    .upsert({ tournament_id: tid, name: '姓氏杯 Tie — 5 Events', wins_required: 3, total_matches: 5 }, { onConflict: 'tournament_id,name' })
    .select('id').single();
  if (error) { console.error(`  ❌ Tie template: ${error.message}`); return; }

  const events = MATCH_CATEGORIES.map(c => ({
    template_id: tie.id,
    sequence_order: c.sequence_order,
    event_type: c.code,
    event_label: `${c.label_zh} (${c.code})`,
  }));
  await supabase.from('arena_tie_template_events').upsert(events, { onConflict: 'template_id,sequence_order' });
  console.log(`[SEED] ✅ Tie template: MD1 → WD → XD → V → MD2 (first to 3 wins)`);
}

async function seedDay1Matches(tid: string, clanIds: Record<string, string>) {
  console.log(`[SEED] Seeding Day 1 group-stage matches...`);
  const matchRows: object[] = [];

  for (const tie of DAY1_TIES) {
    const clanAId = clanIds[tie.clanA];
    const clanBId = clanIds[tie.clanB];
    if (!clanAId || !clanBId) {
      console.warn(`  ⚠️  Missing clan IDs for ${tie.clanA} vs ${tie.clanB}`);
      continue;
    }
    // Each Tie creates 5 individual arena_matches (one per category)
    for (const cat of MATCH_CATEGORIES) {
      matchRows.push({
        tournament_id: tid,
        clan_a_id: clanAId,
        clan_b_id: clanBId,
        team_a_name: tie.clanA,
        team_b_name: tie.clanB,
        round_type: 'GROUP',
        group_id: tie.group,
        category_code: cat.code,
        event_type: cat.code,
        status: 'PENDING',
        bracket_match_id: `${tie.group}-${tie.clanA}v${tie.clanB}-${cat.code}`,
        sets_scores: [],
        current_set: 1,
        score_a: 0, score_b: 0,
        sets_won_a: 0, sets_won_b: 0,
      });
    }
  }

  const { error } = await supabase.from('arena_matches').insert(matchRows);
  if (error) throw new Error(`Failed to seed matches: ${error.message}`);
  console.log(`[SEED] ✅ ${matchRows.length} individual match records created (${DAY1_TIES.length} ties × 5 categories)`);
}

async function seedGroupStandings(tid: string, clanIds: Record<string, string>) {
  const groupA = ['Chan', 'Lim', 'Lee', 'Wong'];
  const groupB = ['Koh', 'LGT', 'Cheong', 'Teh', 'Goh'];
  const rows: object[] = [];
  for (const sn of groupA) {
    if (!clanIds[sn]) continue;
    rows.push({ tournament_id: tid, group_id: 'A', team_name: sn, team_id: clanIds[sn] });
  }
  for (const sn of groupB) {
    if (!clanIds[sn]) continue;
    rows.push({ tournament_id: tid, group_id: 'B', team_name: sn, team_id: clanIds[sn] });
  }
  const { error } = await supabase.from('arena_group_standings').upsert(rows, { onConflict: 'tournament_id,group_id,team_name' });
  if (error) throw new Error(`Failed to seed standings: ${error.message}`);
  console.log(`[SEED] ✅ Group standings initialized — A: 4 clans | B: 5 clans`);
}

async function seedLiveControls(tid: string) {
  await supabase.from('arena_live_controls').upsert(
    { tournament_id: tid, command: 'RESET', preset_name: 'MIRI_PB_2026' },
    { onConflict: 'tournament_id' }
  );
  console.log(`[SEED] ✅ arena_live_controls initialized`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🏸 Bintulu Interclan pickleball championship 2026');
  console.log('='.repeat(56));
  console.log('⚠️  IMPORTANT: Replace placeholder player names in CLANS array!');
  console.log('='.repeat(56));

  try {
    const tid = await getOrCreateTournament();
    await seedCategories(tid);
    console.log(`[SEED] Seeding 9 clans...`);
    const clanIds = await seedClans(tid);
    await seedRoundRules(tid);
    await seedTieTemplate(tid);
    await seedDay1Matches(tid, clanIds);
    await seedGroupStandings(tid, clanIds);
    await seedLiveControls(tid);

    console.log('\n' + '='.repeat(56));
    console.log('🎉 Seed complete!');
    console.log(`   Tournament ID  : ${tid}`);
    console.log(`   Groups         : A (4 clans) | B (5 clans)`);
    console.log(`   Day 1 Ties     : ${DAY1_TIES.length} ties × 5 categories`);
    console.log(`   Day 2 (Day 1 results needed for Semi/Final seeding)`);
    console.log(`   Match Overlay  : /arena/${tid}/match-overlay`);
    console.log('='.repeat(56) + '\n');
  } catch (err) {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  }
}

main();
