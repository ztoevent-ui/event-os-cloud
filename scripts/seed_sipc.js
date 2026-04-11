const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function generateFlexibleBracket(teamNames, eventId) {
    const count = teamNames.length;
    const matches = {};
    const rounds = Math.ceil(Math.log2(count));
    const totalSlots = Math.pow(2, rounds);
    
    // 1. Generate all matches bottom-up
    for (let r = rounds; r >= 1; r--) {
        const matchesInRound = Math.pow(2, rounds - r);
        for (let i = 1; i <= matchesInRound; i++) {
            const matchId = `R${r}-M${i}`;
            const nextMatchId = r < rounds ? `R${r + 1}-M${Math.ceil(i / 2)}` : undefined;
            const nextTeamSlot = r < rounds ? (i % 2 !== 0 ? 1 : 2) : undefined;
            
            matches[matchId] = {
                id: matchId,
                round: r,
                team1: 'TBD',
                team2: 'TBD',
                winner: null,
                nextMatchId,
                nextTeamSlot,
                eventId
            };
        }
    }

    const shuffled = [...teamNames].sort(() => 0.5 - Math.random());
    const round1Count = Math.pow(2, rounds - 1);
    for (let i = 1; i <= round1Count; i++) {
        const m = matches[`R1-M${i}`];
        const t1Idx = (i * 2) - 1;
        const t2Idx = i * 2;
        
        m.team1 = t1Idx <= count ? shuffled[t1Idx - 1] : 'BYE';
        m.team2 = t2Idx <= count ? shuffled[t2Idx - 1] : 'BYE';
        
        if (m.team2 === 'BYE' && m.team1 !== 'BYE') m.winner = 1;
        if (m.team1 === 'BYE' && m.team2 !== 'BYE') m.winner = 2;
    }

    return { id: eventId, teamCount: count, matches };
}

async function run() {
    console.log("Creating SIPC2026-Demo Tournament...");
    // 1. Create Tournament
    const { data: existing, error: findErr } = await supabase
        .from('arena_tournaments')
        .select('*')
        .eq('event_id_slug', 'SIPC2026-Demo')
        .single();
        
    let tournamentId;
    if (!existing) {
        const { data: newT, error: createErr } = await supabase
            .from('arena_tournaments')
            .insert({
                name: 'SIPC 2026 Demo Tournament',
                sport_type: 'PICKLEBALL',
                event_id_slug: 'SIPC2026-Demo',
                status: 'KNOCKOUT',
                format: 'SINGLES'
            })
            .select()
            .single();
            
        if (createErr) throw createErr;
        tournamentId = newT.id;
    } else {
        tournamentId = existing.id;
        // Clean up old matches to restart
        await supabase.from('arena_matches').delete().eq('tournament_id', tournamentId);
        await supabase.from('arena_individual_events').delete().eq('tournament_id', tournamentId);
    }
    console.log("Tournament ID:", tournamentId);

    // 2. Create Events
    const eventsToCreate = [
        { name: "Men's Doubles", gender: "MALE", type: "DOUBLES", max_entries: 32 },
        { name: "Mixed Doubles", gender: "MIXED", type: "MIXED_DOUBLES", max_entries: 16 },
        { name: "Women's Doubles", gender: "FEMALE", type: "DOUBLES", max_entries: 16 },
        { name: "Veteran", gender: "OPEN", type: "DOUBLES", max_entries: 8 }
    ];

    const { data: events, error: evtErr } = await supabase
        .from('arena_individual_events')
        .insert(eventsToCreate.map(e => ({ ...e, tournament_id: tournamentId })))
        .select();

    if (evtErr) throw evtErr;

    // 3. Round Rules (11 points, Best of 3)
    const { error: rrErr } = await supabase
        .from('arena_round_rules')
        .upsert([
            { tournament_id: tournamentId, round_type: 'KNOCKOUT', scoring_type: 'RALLY', max_points: 11, win_by: 2, sets_to_win: 2, max_sets: 3 },
            { tournament_id: tournamentId, round_type: 'SEMIFINALS', scoring_type: 'RALLY', max_points: 11, win_by: 2, sets_to_win: 2, max_sets: 3 },
            { tournament_id: tournamentId, round_type: 'FINALS', scoring_type: 'RALLY', max_points: 11, win_by: 2, sets_to_win: 2, max_sets: 3 }
        ], { onConflict: 'tournament_id, round_type' });
    if(rrErr) console.warn("Round Rules Warning:", rrErr);

    // 4. Create Teams & Brackets & Matches
    const dbMatches = [];
    const fullBracketJson = { events: {} };

    let courtIndex = 1;
    
    for (const evt of events) {
        console.log(`Generating Bracket for ${evt.name} (${evt.max_entries} teams)`);
        let catCode = evt.name === "Men's Doubles" ? "MD" : (evt.name === "Mixed Doubles" ? "XD" : (evt.name === "Women's Doubles" ? "WD" : "VET"));
        const teamNames = Array.from({length: evt.max_entries}).map((_, i) => catCode + ` Team ${i+1}`);
        const bracket = generateFlexibleBracket(teamNames, evt.id);
        fullBracketJson.events[evt.id] = bracket;

        const matchIdMap = {};
        for (const [key, m] of Object.entries(bracket.matches)) {
            matchIdMap[key] = uuidv4();
        }

        for (const [key, m] of Object.entries(bracket.matches)) {
            let court_number = null;
            if (m.round === 1 && m.team1 !== 'BYE' && m.team2 !== 'BYE') {
                court_number = courtIndex++;
                if (courtIndex > 10) courtIndex = 1;
            }
            
            let status = 'PENDING';
            if (m.winner !== null) {
                status = 'COMPLETED';
            } else if (court_number !== null) {
                status = 'LIVE';
            }

            dbMatches.push({
                id: matchIdMap[key],
                tournament_id: tournamentId,
                bracket_match_id: key,
                round_type: m.round === Math.log2(evt.max_entries) ? 'FINALS' : (m.round === Math.log2(evt.max_entries) -1 ? 'SEMIFINALS' : 'KNOCKOUT'),
                event_type: evt.id,
                court_number: court_number,
                team_a_name: m.team1,
                team_b_name: m.team2,
                score_a: 0,
                score_b: 0,
                current_set: 1,
                status: status,
                next_match_id: m.nextMatchId ? matchIdMap[m.nextMatchId] : null,
                next_team_slot: m.nextTeamSlot ? (m.nextTeamSlot === 1 ? 'A' : 'B') : null,
            });
        }
    }

    console.log(`Inserting ${dbMatches.length} Matches...`);
    
    for (let i = 0; i < dbMatches.length; i += 50) {
        const batch = dbMatches.slice(i, i + 50);
        const { error: insErr } = await supabase.from('arena_matches').insert(batch);
        if (insErr) {
            console.error("Match Insert Error:", insErr);
        }
    }
    
    await supabase.from('arena_tournaments').update({ bracket_json: fullBracketJson }).eq('id', tournamentId);
    
    console.log("Done seeding SIPC2026-Demo!");
}

run().catch(console.error);
