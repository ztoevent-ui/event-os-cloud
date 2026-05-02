'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

type BracketMatch = {
  id: string;
  round: number;
  team1: string;
  team2: string;
  winner: 1 | 2 | null;
  nextMatchId?: string;
  nextTeamSlot?: 1 | 2;
};

type BracketData = {
  id: string;
  teamCount: number;
  matches: Record<string, BracketMatch>;
};

function generateFlexibleBracket(count: number): BracketData {
    const matches: Record<string, BracketMatch> = {};
    const rounds = Math.ceil(Math.log2(count));
    
    for (let r = rounds; r >= 1; r--) {
        const matchesInRound = Math.pow(2, rounds - r);
        for (let i = 1; i <= matchesInRound; i++) {
            const matchId = `R${r}-M${i}`;
            const nextMatchId = r < rounds ? `R${r + 1}-M${Math.ceil(i / 2)}` : undefined;
            const nextTeamSlot = r < rounds ? (i % 2 !== 0 ? 1 : 2) : undefined;
            
            matches[matchId] = { id: matchId, round: r, team1: 'TBD', team2: 'TBD', winner: null, nextMatchId, nextTeamSlot };
        }
    }

    const round1Count = Math.pow(2, rounds - 1);
    for (let i = 1; i <= round1Count; i++) {
        const m = matches[`R1-M${i}`];
        const t1Idx = (i * 2) - 1;
        const t2Idx = i * 2;
        
        m.team1 = t1Idx <= count ? `Player ${t1Idx}` : 'BYE';
        m.team2 = t2Idx <= count ? `Player ${t2Idx}` : 'BYE';
        
        if (m.team2 === 'BYE' && m.team1 !== 'BYE') m.winner = 1;
        if (m.team1 === 'BYE' && m.team2 !== 'BYE') m.winner = 2;
    }

    return { id: 'universal-bracket', teamCount: count, matches };
}

export default function DrawsPage() {
    const params = useParams();
    const eventId = params.eventId as string;

    const [tournament, setTournament] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [activeEventId, setActiveEventId] = useState<string | null>(null);
    const [bracketData, setBracketData] = useState<BracketData | null>(null);
    const [drawSize, setDrawSize] = useState<number>(32);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        async function load() {
            const { data: t } = await supabase.from('arena_tournaments').select('*').or(`id.eq.${eventId},event_id_slug.eq.${eventId}`).single();
            if (!t) return;
            setTournament(t);

            const { data: evts } = await supabase.from('arena_individual_events').select('*').eq('tournament_id', t.id).order('created_at');
            if (evts && evts.length > 0) {
                setEvents(evts);
                setActiveEventId(evts[0].id);

                if (t.bracket_json && t.bracket_json.events && t.bracket_json.events[evts[0].id]) {
                    setBracketData(t.bracket_json.events[evts[0].id]);
                } else {
                    setBracketData(generateFlexibleBracket(32));
                }
            }
        }
        load();
    }, [eventId]);

    const handleEventSelect = (id: string) => {
        setActiveEventId(id);
        if (tournament?.bracket_json?.events?.[id]) {
            setBracketData(tournament.bracket_json.events[id]);
        } else {
            setBracketData(generateFlexibleBracket(drawSize));
        }
    };

    const handleGenerate = () => {
        if (![4, 8, 16, 32, 64, 128].includes(drawSize)) {
            alert('Draw size must be a power of 2');
            return;
        }
        setBracketData(generateFlexibleBracket(drawSize));
    };

    const handleSave = async () => {
        if (!tournament || !activeEventId || !bracketData) return;
        setSaving(true);
        
        const updatedBracketJson = {
            ...tournament.bracket_json,
            events: {
                ...(tournament.bracket_json?.events || {}),
                [activeEventId]: bracketData
            }
        };

        const { error } = await supabase.from('arena_tournaments').update({ bracket_json: updatedBracketJson }).eq('id', tournament.id);
        if (!error) {
            setTournament({ ...tournament, bracket_json: updatedBracketJson });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } else {
            alert('Save failed: ' + error.message);
        }
        setSaving(false);
    };

    const totalRounds = useMemo(() => bracketData ? Math.ceil(Math.log2(bracketData.teamCount)) : 0, [bracketData]);

    return (
        <div className="min-h-screen bg-black text-white font-sans flex flex-col">
            {/* Header */}
            <header className="bg-zinc-950 border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-6">
                    <Link href="/apps/zto-arena" className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-600 hover:text-white transition-colors tracking-widest group">
                        <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform" />
                        Arena Hub
                    </Link>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-sky-500/20 text-sky-400 rounded-lg flex items-center justify-center">
                            <i className="fa-solid fa-sitemap text-sm" />
                        </div>
                        <div>
                            <h1 className="text-sm font-black uppercase tracking-widest text-white">Draw & Seeding Engine</h1>
                            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{tournament?.name || 'Loading...'}</p>
                        </div>
                    </div>
                </div>

                <button onClick={handleSave} disabled={saving || !bracketData}
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg ${
                        saved ? 'bg-emerald-500 text-black shadow-[0_0_30px_rgba(16,185,129,0.4)]' : 'bg-sky-600 hover:bg-sky-500 text-white shadow-[0_0_20px_rgba(2,132,199,0.3)] disabled:opacity-50'
                    }`}>
                    <i className={`fa-solid ${saving ? 'fa-spinner fa-spin' : saved ? 'fa-check' : 'fa-floppy-disk'}`} />
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Bracket'}
                </button>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 bg-zinc-950 border-r border-white/5 flex flex-col">
                    <div className="p-4 border-b border-white/5">
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Select Event</h2>
                        <div className="space-y-2">
                            {events.map(evt => (
                                <button key={evt.id} onClick={() => handleEventSelect(evt.id)}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                                        activeEventId === evt.id ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-zinc-400 hover:bg-white/5 border border-transparent'
                                    }`}>
                                    {evt.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4">
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Bracket Generator</h2>
                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Draw Size</label>
                        <select value={drawSize} onChange={(e) => setDrawSize(parseInt(e.target.value))}
                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-xs focus:outline-none focus:border-sky-500 mb-4 cursor-pointer">
                            <option value={8}>8 Draw</option>
                            <option value={16}>16 Draw</option>
                            <option value={32}>32 Draw</option>
                            <option value={64}>64 Draw</option>
                            <option value={128}>128 Draw</option>
                        </select>
                        <button onClick={handleGenerate}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">
                            Generate Tree
                        </button>
                    </div>
                </div>

                {/* Bracket Canvas */}
                <div className="flex-1 overflow-auto bg-black p-8 relative">
                    {!bracketData ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                            <i className="fa-solid fa-sitemap text-4xl mb-4 opacity-50" />
                            <p className="font-bold text-sm uppercase tracking-widest">Select an event to view bracket</p>
                        </div>
                    ) : (
                        <div className="flex gap-16 min-w-max pb-16">
                            {Array.from({ length: totalRounds }).map((_, roundIdx) => {
                                const roundNumber = roundIdx + 1;
                                const matches = Object.values(bracketData.matches)
                                    .filter(m => m.round === roundNumber)
                                    .sort((a, b) => {
                                        const numA = parseInt(a.id.split('-M')[1]);
                                        const numB = parseInt(b.id.split('-M')[1]);
                                        return numA - numB;
                                    });

                                return (
                                    <div key={roundNumber} className="flex flex-col justify-around gap-4" style={{ minHeight: '100%' }}>
                                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center mb-6 sticky top-0 bg-black/80 backdrop-blur-sm py-2 z-10">
                                            {roundNumber === totalRounds ? 'Finals' : roundNumber === totalRounds - 1 ? 'Semi-Finals' : roundNumber === totalRounds - 2 ? 'Quarter-Finals' : `Round of ${Math.pow(2, totalRounds - roundNumber + 1)}`}
                                        </div>
                                        {matches.map((match) => (
                                            <div key={match.id} className="w-56 bg-zinc-900 border border-white/5 rounded-xl overflow-hidden relative shadow-lg">
                                                {/* Connecting Lines could go here via SVG */}
                                                <div className={`p-3 border-b border-white/5 flex items-center justify-between ${match.winner === 1 ? 'bg-sky-500/10' : ''}`}>
                                                    <input 
                                                        type="text" 
                                                        value={match.team1} 
                                                        onChange={(e) => {
                                                            const newBracket = {...bracketData};
                                                            newBracket.matches[match.id].team1 = e.target.value;
                                                            setBracketData(newBracket);
                                                        }}
                                                        className="bg-transparent border-none text-xs font-bold text-white w-full focus:outline-none"
                                                    />
                                                    {match.winner === 1 && <i className="fa-solid fa-check text-[10px] text-sky-400" />}
                                                </div>
                                                <div className={`p-3 flex items-center justify-between ${match.winner === 2 ? 'bg-sky-500/10' : ''}`}>
                                                    <input 
                                                        type="text" 
                                                        value={match.team2} 
                                                        onChange={(e) => {
                                                            const newBracket = {...bracketData};
                                                            newBracket.matches[match.id].team2 = e.target.value;
                                                            setBracketData(newBracket);
                                                        }}
                                                        className="bg-transparent border-none text-xs font-bold text-white w-full focus:outline-none"
                                                    />
                                                    {match.winner === 2 && <i className="fa-solid fa-check text-[10px] text-sky-400" />}
                                                </div>
                                                <div className="absolute -left-1 top-1/2 -translate-y-1/2 text-[8px] font-bold text-zinc-700 writing-mode-vertical rotate-180 ml-2">
                                                    {match.id}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
