'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type TieTemplate = {
    id: string;
    name: string;
    wins_required: number;
    total_matches: number;
    events: { sequence_order: number; event_type: string; event_label: string }[];
};

export default function LineupsPage() {
    const params = useParams();
    const eventId = params.eventId as string;

    const [tournament, setTournament] = useState<any>(null);
    const [tieTemplate, setTieTemplate] = useState<TieTemplate | null>(null);
    const [lineups, setLineups] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [teamName, setTeamName] = useState('My Team');
    
    // Hardcoded roster for demo purposes
    const availablePlayers = ['Lee Chong Wei', 'Lin Dan', 'Taufik Hidayat', 'Peter Gade', 'Viktor Axelsen', 'Kento Momota'];

    useEffect(() => {
        async function load() {
            const { data: t } = await supabase.from('arena_tournaments').select('*').or(`id.eq.${eventId},event_id_slug.eq.${eventId}`).single();
            if (!t) return;
            setTournament(t);

            if (t.format === 'TIE_TEAM') {
                const { data: tmpl } = await supabase.from('arena_tie_templates').select('*, events:arena_tie_template_events(*)').eq('tournament_id', t.id).single();
                if (tmpl) {
                    setTieTemplate({
                        ...tmpl,
                        events: tmpl.events.sort((a: any, b: any) => a.sequence_order - b.sequence_order)
                    });
                }
            }
        }
        load();
    }, [eventId]);

    const handleSave = async () => {
        setSaving(true);
        // In a real implementation, this would save to a `arena_tie_lineups` table
        // For now, we simulate saving
        await new Promise(r => setTimeout(r, 1000));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        setSaving(false);
    };

    if (tournament && tournament.format !== 'TIE_TEAM') {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center">
                <i className="fa-solid fa-ban text-4xl text-zinc-600 mb-4" />
                <h1 className="text-2xl font-black uppercase tracking-widest text-zinc-400">Not a Team Tie Format</h1>
                <p className="text-zinc-500 mt-2">Lineup submission is only available for Thomas/Uber Cup style team tournaments.</p>
                <Link href={`/arena/${eventId}`} className="mt-6 text-sky-400 font-bold uppercase text-xs tracking-widest hover:underline">Return to Hub</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans flex flex-col">
            <header className="bg-zinc-950 border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-6">
                    <Link href="/apps/zto-arena" className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-600 hover:text-white transition-colors tracking-widest group">
                        <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform" />
                        Arena Hub
                    </Link>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-violet-500/20 text-violet-400 rounded-lg flex items-center justify-center">
                            <i className="fa-solid fa-clipboard-user text-sm" />
                        </div>
                        <div>
                            <h1 className="text-sm font-black uppercase tracking-widest text-white">Lineup Submission Portal</h1>
                            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{tournament?.name || 'Loading...'}</p>
                        </div>
                    </div>
                </div>

                <button onClick={handleSave} disabled={saving || !tieTemplate}
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg ${
                        saved ? 'bg-emerald-500 text-black shadow-[0_0_30px_rgba(16,185,129,0.4)]' : 'bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] disabled:opacity-50'
                    }`}>
                    <i className={`fa-solid ${saving ? 'fa-spinner fa-spin' : saved ? 'fa-check' : 'fa-paper-plane'}`} />
                    {saving ? 'Submitting...' : saved ? 'Submitted!' : 'Submit Lineup'}
                </button>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full p-8">
                <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-white/5 pb-8">
                        <div>
                            <h2 className="text-3xl font-black uppercase tracking-widest text-white mb-2">Team Roster Declaration</h2>
                            <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest">Format: {tieTemplate?.name || 'Loading...'}</p>
                        </div>
                        <div className="w-full md:w-64">
                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Representing Team</label>
                            <input 
                                type="text" 
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-violet-500 transition-all"
                            />
                        </div>
                    </div>

                    {!tieTemplate ? (
                        <div className="text-center py-20 text-zinc-600">
                            <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-4" />
                            <p className="font-bold uppercase tracking-widest text-xs">Loading Tie Configuration...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-12 gap-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest px-4 mb-2">
                                <div className="col-span-1">Order</div>
                                <div className="col-span-3">Event</div>
                                <div className="col-span-8">Player Selection</div>
                            </div>
                            
                            {tieTemplate.events.map((evt, idx) => {
                                const isDoubles = evt.event_type.includes('D') || evt.event_type === 'CUSTOM';
                                
                                return (
                                    <div key={idx} className="grid grid-cols-12 gap-4 items-center bg-black/40 border border-white/5 rounded-2xl p-4 transition-all hover:border-violet-500/30">
                                        <div className="col-span-1 flex items-center justify-center">
                                            <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 font-black text-xs flex items-center justify-center">
                                                {evt.sequence_order}
                                            </div>
                                        </div>
                                        <div className="col-span-3">
                                            <div className="text-sm font-black text-white uppercase tracking-wider">{evt.event_label}</div>
                                            <div className="text-[9px] font-bold text-violet-400 uppercase tracking-widest mt-1">{evt.event_type}</div>
                                        </div>
                                        <div className="col-span-8 grid gap-3">
                                            <select 
                                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-violet-500 transition-all cursor-pointer"
                                                value={lineups[`${idx}-1`] || ''}
                                                onChange={(e) => setLineups(p => ({ ...p, [`${idx}-1`]: e.target.value }))}
                                            >
                                                <option value="" disabled>Select Player...</option>
                                                {availablePlayers.map(p => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </select>

                                            {isDoubles && (
                                                <select 
                                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-violet-500 transition-all cursor-pointer"
                                                    value={lineups[`${idx}-2`] || ''}
                                                    onChange={(e) => setLineups(p => ({ ...p, [`${idx}-2`]: e.target.value }))}
                                                >
                                                    <option value="" disabled>Select Partner...</option>
                                                    {availablePlayers.map(p => (
                                                        <option key={p} value={p}>{p}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                    <p>Submitting this lineup constitutes an official declaration under BWF tournament regulations.</p>
                    <p className="mt-1 text-red-500/80">Lineups are locked 2 hours prior to the Tie commencement.</p>
                </div>
            </main>
        </div>
    );
}
