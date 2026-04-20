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
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8 print:hidden">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white mb-2">Project Timeline</h1>
                    <p className="text-zinc-400 font-medium">Key phases and milestones.</p>
                </div>
                <div className="flex gap-4">
                    <PrintReportButton title="Project Timeline" />
                    <AddTimelineButton projectId={id} isWedding={isWedding} />
                </div>
            </div>

            <div className="relative border-l-2 border-zinc-800 ml-4 md:ml-6 space-y-12 pb-12 print:border-black">
                {timelines?.map((phase, index) => (
                    <div key={phase.id} className={`${pageBreakIds.includes(phase.id) ? 'print:break-before-page pt-8' : ''}`}>
                      <div className="relative pl-8 md:pl-12 group">
                        {/* Dot */}
                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-zinc-900 border-2 ${theme.dot} group-hover:scale-125 transition-transform z-10 print:bg-white print:border-black`}></div>

                        <div className={`bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 p-6 rounded-2xl ${theme.border} transition-all cursor-pointer relative overflow-hidden print:bg-white print:border-zinc-200 print:shadow-none print:p-4 mb-4`}>
                            <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl text-zinc-700 pointer-events-none print:hidden">
                                {index + 1}
                            </div>

                            <DeleteTimelineButton id={phase.id} projectId={id} />

                            <h3 className={`text-xl font-bold text-white mb-2 ${theme.hover} transition-colors print:text-black`}>
                                {phase.name}
                            </h3>

                            <div className="flex flex-col sm:flex-row gap-4 text-sm text-zinc-400 mb-4 print:text-zinc-600">
                                <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-800 print:bg-white print:border-zinc-100">
                                    <i className="fa-regular fa-calendar-plus text-green-500"></i>
                                    <span>Start: {phase.start_date ? new Date(phase.start_date).toLocaleDateString() : 'TBD'}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-800 print:bg-white print:border-zinc-100">
                                    <i className="fa-regular fa-calendar-check text-red-500"></i>
                                    <span>End: {phase.end_date ? new Date(phase.end_date).toLocaleDateString() : 'TBD'}</span>
                                </div>
                            </div>
                        </div>
                      </div>
                      <PrintBreakTrigger id={phase.id} />
                    </div>
                ))}

                {(!timelines || timelines.length === 0) && (
                    <div className="pl-8 text-zinc-500 italic">No timeline phases defined.</div>
                )}
            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 15mm; }
                    html, body, main {
                        background: white !important;
                        color: black !important;
                    }
                    .print\\:hidden, nav, header, footer, button {
                        display: none !important;
                    }
                    .bg-zinc-900, .bg-zinc-900\\/50, .bg-zinc-800 {
                        background: transparent !important;
                        color: black !important;
                        border-color: #eee !important;
                    }
                    .text-white, .text-zinc-400, .text-zinc-500 {
                        color: black !important;
                    }
                    .print\\:break-before-page {
                        break-before: page !important;
                    }
                    .border-l-2 {
                        border-left-color: #000 !important;
                    }
                }
            `}</style>
        </div>
    );
}
