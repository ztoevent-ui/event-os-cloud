'use client';
import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AddTimelineButton, DeleteTimelineButton, PrintReportButton } from '../../components/ProjectModals';
import { PrintBreakTrigger } from '../../components/PrintBreakTrigger';
import { usePrint } from '../../components/PrintContext';

export default function TimelinesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [timelines, setTimelines] = useState<any[]>([]);
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { pageBreakIds } = usePrint();

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        const { data: projectData } = await supabase.from('projects').select('type').eq('id', id).single();
        setProject(projectData);

        const { data: timelineData } = await supabase
            .from('timelines')
            .select('*')
            .eq('project_id', id)
            .order('order_index', { ascending: true });
        
        setTimelines(timelineData || []);
        setLoading(false);
    };

    if (loading) return <div className="p-20 text-center animate-pulse">Syncing Project Roadmap...</div>;

    const isWedding = project?.type === 'wedding' || project?.type === 'wedding_fair';
    const theme = isWedding ? {
        dot: 'border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]',
        border: 'border-pink-500/30',
        hover: 'group-hover:text-pink-400',
        progress: 'from-pink-600 to-pink-400'
    } : {
        dot: 'border-[#0056B3]/30 shadow-[0_0_10px_rgba(245,158,11,0.5)]',
        border: 'border-[#0056B3]/30',
        hover: 'group-hover:text-[#0056B3]',
        progress: 'from-[#0056B3] to-blue-600'
    };

    return (
        <div className="flex flex-col flex-1 animate-in fade-in duration-700">
            {/* ── Page Header + Action Bar ── */}
            <div className="print:hidden flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                <div className="flex flex-col">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0056B3] mb-2">Project Roadmap</p>
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none font-['Urbanist']">
                        Strategic Timeline
                    </h1>
                </div>

                {/* Action Hub */}
                <div className="flex items-center gap-3">
                    <PrintReportButton title="Project Timeline" />
                    <AddTimelineButton projectId={id} isWedding={isWedding} />
                </div>
            </div>

            {/* ── Vertical Roadmap ── */}
            <div className="relative ml-4 md:ml-12 border-l-2 border-white/5 pb-20 print:border-black space-y-12">
                {timelines.length === 0 ? (
                    <div className="pl-12 py-12 text-zinc-700 italic text-sm tracking-widest uppercase">
                        No Strategic Phases Defined
                    </div>
                ) : (
                    timelines.map((phase, index) => (
                        <div key={phase.id} className={`relative pl-12 group ${pageBreakIds.includes(phase.id) ? 'print:break-before-page pt-8' : ''}`}>
                            {/* Roadmap Dot */}
                            <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-[#050505] border-2 border-[#0056B3]/40 shadow-[0_0_15px_rgba(0,86,179,0.3)] group-hover:border-[#0056B3] group-hover:scale-125 transition-all z-10" />

                            {/* Phase Card */}
                            <div className="bg-white/[0.03] border border-white/5 backdrop-blur-xl p-8 rounded-[32px] hover:border-[#0056B3]/40 hover:shadow-[0_8px_32px_rgba(0,86,179,0.15)] transition-all relative overflow-hidden group">
                                <div className="absolute -right-4 -bottom-8 font-black text-9xl text-white/[0.02] pointer-events-none group-hover:text-[#0056B3]/[0.03] transition-colors select-none">
                                    {index + 1}
                                </div>

                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-3">
                                            <span className="px-3 py-1 bg-[#0056B3]/10 border border-[#0056B3]/20 rounded-full text-[9px] font-black text-[#4da3ff] uppercase tracking-widest">
                                                Phase {index + 1}
                                            </span>
                                            {phase.end_date && new Date(phase.end_date) < new Date() && (
                                                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                                                    Completed
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tight font-['Urbanist'] group-hover:text-[#4da3ff] transition-colors">
                                            {phase.name}
                                        </h3>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="flex items-center gap-3 bg-zinc-900/50 border border-white/5 px-5 py-3 rounded-2xl group-hover:border-[#0056B3]/20 transition-all">
                                            <i className="fa-regular fa-calendar text-[#4da3ff] text-xs" />
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Start</span>
                                                <span className="text-xs font-bold text-zinc-300">
                                                    {phase.start_date ? new Date(phase.start_date).toLocaleDateString() : 'TBD'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-zinc-900/50 border border-white/5 px-5 py-3 rounded-2xl group-hover:border-[#0056B3]/20 transition-all">
                                            <i className="fa-regular fa-calendar-check text-[#DEFF9A] text-xs" />
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Completion</span>
                                                <span className="text-xs font-bold text-zinc-300">
                                                    {phase.end_date ? new Date(phase.end_date).toLocaleDateString() : 'TBD'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="print:hidden flex items-center gap-2">
                                        <DeleteTimelineButton id={phase.id} projectId={id} />
                                    </div>
                                </div>
                            </div>
                            <PrintBreakTrigger id={phase.id} />
                        </div>
                    ))
                )}
            </div>

            <style jsx global>{`
                @media print {
                    @page { size: A4 portrait; margin: 15mm; }
                    html, body, main { background: white !important; color: black !important; }
                    .print\\:hidden, nav, header, footer, button { display: none !important; }
                    .bg-white\\/\\[0\\.03\\] { background: transparent !important; border: 1px solid #eee !important; border-radius: 12px !important; }
                    .text-white, .text-zinc-600, .text-zinc-700 { color: black !important; }
                    .border-l-2 { border-left-color: #000 !important; }
                }
            `}</style>
        </div>
    );
}
