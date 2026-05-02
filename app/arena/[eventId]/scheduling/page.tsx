'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { ArenaMatch } from '@/lib/arena-types';

export default function SchedulingPage() {
    const params = useParams();
    const eventId = params.eventId as string;

    const [tournament, setTournament] = useState<any>(null);
    const [matches, setMatches] = useState<ArenaMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function load() {
            const { data: t } = await supabase.from('arena_tournaments').select('id, name, court_count').or(`id.eq.${eventId},event_id_slug.eq.${eventId}`).single();
            if (!t) return;
            setTournament(t);

            const { data: mData } = await supabase.from('arena_matches')
                .select('*')
                .eq('tournament_id', t.id)
                .order('created_at', { ascending: true });
            
            if (mData) setMatches(mData as ArenaMatch[]);
            setLoading(false);
        }
        load();
    }, [eventId]);

    const assignCourt = async (matchId: string, courtNumber: number | null) => {
        setSaving(true);
        // Optimistic update
        setMatches(prev => prev.map(m => m.id === matchId ? { ...m, court_number: courtNumber } : m));
        
        await supabase.from('arena_matches').update({ court_number: courtNumber }).eq('id', matchId);
        setSaving(false);
    };

    const courtCount = tournament?.court_count || 4;
    const courts = Array.from({ length: courtCount }).map((_, i) => i + 1);

    const unassignedMatches = matches.filter(m => !m.court_number && m.status !== 'COMPLETED');
    
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
                        <div className="w-8 h-8 bg-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center">
                            <i className="fa-solid fa-calendar-days text-sm" />
                        </div>
                        <div>
                            <h1 className="text-sm font-black uppercase tracking-widest text-white">Court Scheduling & Dispatch</h1>
                            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{tournament?.name || 'Loading...'}</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Unassigned Queue */}
                <div className="w-80 bg-zinc-950 border-r border-white/5 flex flex-col">
                    <div className="p-4 border-b border-white/5 bg-zinc-900/50">
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Match Pool</h2>
                        <div className="text-2xl font-black text-white">{unassignedMatches.length} <span className="text-xs text-zinc-600">Pending</span></div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {unassignedMatches.map(m => (
                            <div key={m.id} className="bg-black border border-white/10 rounded-xl p-3 shadow-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest bg-sky-500/10 px-2 py-0.5 rounded">{m.event_type || m.round_type}</span>
                                    <span className="text-[9px] font-bold text-zinc-600 uppercase">{m.bracket_match_id}</span>
                                </div>
                                <div className="text-xs font-bold text-white mb-1 truncate">{m.team_a_name}</div>
                                <div className="text-xs font-bold text-white truncate">{m.team_b_name}</div>
                                
                                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                                    {courts.map(c => (
                                        <button 
                                            key={c}
                                            onClick={() => assignCourt(m.id, c)}
                                            className="min-w-[40px] px-2 py-1 bg-zinc-800 hover:bg-amber-500 text-zinc-400 hover:text-black rounded text-[9px] font-black uppercase transition-colors"
                                        >
                                            C{c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {unassignedMatches.length === 0 && !loading && (
                            <div className="text-center text-zinc-600 py-10">
                                <i className="fa-solid fa-check-circle text-3xl mb-3 opacity-50" />
                                <p className="text-xs font-bold uppercase tracking-widest">All matches assigned</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Courts Grid */}
                <div className="flex-1 overflow-x-auto bg-[#0a0a0a] p-6 flex gap-6">
                    {courts.map(c => {
                        const courtMatches = matches.filter(m => m.court_number === c && m.status !== 'COMPLETED');
                        return (
                            <div key={c} className="w-80 flex-shrink-0 flex flex-col bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden">
                                <div className="bg-amber-500/10 border-b border-amber-500/20 p-4 flex justify-between items-center">
                                    <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest">Court {c}</h3>
                                    <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full">{courtMatches.length}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {courtMatches.map((m, idx) => (
                                        <div key={m.id} className={`border rounded-xl p-3 ${m.status === 'LIVE' ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'bg-black border-white/10'}`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${m.status === 'LIVE' ? 'bg-red-500 text-white animate-pulse' : 'bg-zinc-800 text-zinc-400'}`}>
                                                    {m.status === 'LIVE' ? 'LIVE NOW' : `Match ${idx + 1}`}
                                                </span>
                                                <button onClick={() => assignCourt(m.id, null)} className="text-zinc-600 hover:text-red-500">
                                                    <i className="fa-solid fa-times text-xs" />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="text-xs font-bold text-white truncate">{m.team_a_name}</div>
                                                    <div className="text-xs font-bold text-white truncate">{m.team_b_name}</div>
                                                </div>
                                                {m.status === 'LIVE' && (
                                                    <div className="text-right ml-3">
                                                        <div className="text-lg font-black text-red-400">{m.score_a} - {m.score_b}</div>
                                                    </div>
                                                )}
                                            </div>
                                            {m.referee_name && (
                                                <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2">
                                                    <i className="fa-solid fa-user-tie text-[9px] text-zinc-600" />
                                                    <span className="text-[9px] font-bold text-zinc-500 uppercase">{m.referee_name}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {courtMatches.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-zinc-700 py-10">
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Court is Empty</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
            `}</style>
        </div>
    );
}
