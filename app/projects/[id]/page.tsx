'use client';

import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { PrintReportButton } from '../components/ProjectModals';

export default function ProjectDashboard({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<any>(null);
    const [stats, setStats] = useState<any>({
        pendingTasks: 0,
        criticalTasks: 0,
        expenses: 0,
        consultations: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        const { data: projectData } = await supabase.from('projects').select('*').eq('id', id).single();
        setProject(projectData);

        const { count: pending } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', id)
            .neq('status', 'done');

        const { count: critical } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', id)
            .eq('priority', 'critical')
            .neq('status', 'done');

        const { data: budgetItems } = await supabase.from('budgets').select('*').eq('project_id', id);
        const exp = budgetItems?.filter((b: any) => b.type === 'expense').reduce((sum: number, b: any) => sum + Number(b.amount), 0) || 0;

        const { count: cons } = await supabase
            .from('consulting_forms')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', id);

        setStats({
            pendingTasks: pending || 0,
            criticalTasks: critical || 0,
            expenses: exp,
            consultations: cons || 0
        });
        setLoading(false);
    };

    if (loading) return <div className="p-20 text-center animate-pulse">Synchronizing Project Data...</div>;

    const isWedding = project?.type === 'wedding' || project?.type === 'wedding_fair';
    // Forced Royal Blue aesthetic per user request
    const theme = {
        primary: 'text-[#0056B3]',
        bg: 'bg-[#0056B3]',
        hover: 'hover:bg-[#003d82]',
        pill: 'bg-[#0056B3]/10',
        border: 'border-[#0056B3]/30',
        shadow: 'shadow-[0_0_25px_rgba(0,86,179,0.3)]'
    };
    
    const today = new Date();
    const endDate = project?.end_date ? new Date(project.end_date) : null;
    let daysLeft = 'TBD';
    if (endDate) {
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysLeft = diffDays > 0 ? diffDays.toString() : 'Ended';
    }

    return (
        <div className="space-y-8 pb-16">
            <div className="flex justify-end print:hidden">
                <PrintReportButton title="Project Summary" />
            </div>

            {/* Hero Banner */}
            <div className="relative rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl print:bg-white print:border-zinc-200">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-15 print:hidden"
                    style={{ backgroundImage: `url(${isWedding ? 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop'})` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 print:hidden"></div>

                <div className="relative z-10 p-10 md:p-16 print:p-8">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8">
                        <div className="max-w-3xl min-w-0">
                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 mb-5 border ${theme.border} rounded-full ${theme.pill} ${theme.primary} text-[10px] font-black tracking-[0.2em] uppercase print:border-black print:text-black`}>
                                <span className={`w-1.5 h-1.5 ${theme.bg} rounded-full animate-pulse print:bg-black`}></span>
                                {project?.status || 'Active Operation'}
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-3 tracking-tighter uppercase italic print:text-black print:not-italic break-words">
                                {project?.name || 'ZTO Event'}
                            </h1>
                            <p className="text-base text-zinc-500 font-medium print:text-zinc-600 truncate">
                                Event ID: <span className="text-zinc-300 font-mono text-sm print:text-black">{id}</span>
                                {project?.type && <span> • {project.type.replace(/_/g, ' ')}</span>}
                            </p>
                        </div>

                        <div className="flex flex-col items-end shrink-0 print:items-start print:mt-4">
                            <div className="text-zinc-600 text-[10px] font-black tracking-[0.3em] uppercase mb-1 print:text-zinc-500">Countdown</div>
                            <div className="text-5xl font-black text-white tabular-nums tracking-tighter print:text-black">
                                {daysLeft}<span className="text-xl text-zinc-500 ml-2 italic font-medium print:text-zinc-600">DAYS</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10 print:hidden">
                        <Link href={`/projects/${id}/program`}>
                            <div className={`px-8 py-4 ${theme.bg} ${theme.hover} text-black font-black rounded-2xl transition-all flex items-center justify-between ${theme.shadow}`}>
                                <span className="uppercase tracking-widest text-xs">Run Live Program</span>
                                <i className="fa-solid fa-play text-sm"></i>
                            </div>
                        </Link>
                        <Link href={`/projects/${id}/schedule`}>
                            <div className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-2xl transition-all border border-white/5 flex items-center justify-between">
                                <span className="uppercase tracking-widest text-xs">Dispatch Schedule</span>
                                <i className="fa-solid fa-list-check text-sm"></i>
                            </div>
                        </Link>
                        <Link href={`/projects/${id}/timelines`}>
                            <div className="px-8 py-4 bg-zinc-900/50 hover:bg-zinc-800/50 text-zinc-400 hover:text-white font-black rounded-2xl transition-all border border-white/5 flex items-center justify-between">
                                <span className="uppercase tracking-widest text-xs">Full Timeline</span>
                                <i className="fa-solid fa-calendar-days text-sm"></i>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Tasks */}
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.3)] transition-all print:bg-white print:border-zinc-200 print:shadow-none">
                    <div className="flex items-center justify-between mb-6">
                        <div className={`w-12 h-12 ${theme.pill} rounded-2xl border border-[#0056B3]/20 flex items-center justify-center ${theme.primary} print:bg-zinc-100 print:text-black`}>
                            <i className="fa-solid fa-check-double text-xl"></i>
                        </div>
                        <span className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase print:text-zinc-500">TASKS</span>
                    </div>
                    <div className="text-4xl font-black text-white mb-2 print:text-black">{stats.pendingTasks}</div>
                    <div className="text-[10px] font-black text-zinc-400 tracking-widest uppercase mb-4 print:text-zinc-600">Pending Actions</div>
                    <div className="text-[10px] font-mono text-[#0056B3] mt-2 print:text-black">{stats.criticalTasks} Critical</div>
                </div>

                {/* Budget */}
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.3)] transition-all print:bg-white print:border-zinc-200 print:shadow-none">
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/80 print:bg-zinc-100 print:text-black">
                            <i className="fa-solid fa-receipt text-xl"></i>
                        </div>
                        <span className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase print:text-zinc-500">BUDGET</span>
                    </div>
                    <div className="text-3xl font-black text-white mb-2 print:text-black">RM {stats.expenses.toLocaleString()}</div>
                    <div className="text-[10px] font-black text-zinc-400 tracking-widest uppercase mb-4 print:text-zinc-600">Current Spend</div>
                </div>

                {/* Consultations */}
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.3)] transition-all print:bg-white print:border-zinc-200 print:shadow-none">
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 bg-[#0056B3]/10 border border-[#0056B3]/20 rounded-2xl flex items-center justify-center text-[#0056B3] print:bg-zinc-100 print:text-black">
                            <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
                        </div>
                        <span className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase print:text-zinc-500">REPORTS</span>
                    </div>
                    <div className="text-4xl font-black text-white mb-2 print:text-black">{stats.consultations}</div>
                    <div className="text-[10px] font-black text-zinc-400 tracking-widest uppercase mb-4 print:text-zinc-600">Client Submissions</div>
                </div>

                {/* Placeholder for Print info */}
                <div className="hidden print:block bg-white border border-zinc-200 p-8 rounded-3xl">
                     <div className="text-[10px] font-black text-zinc-400 tracking-widest uppercase mb-2">Generated On</div>
                     <div className="text-sm font-bold text-black">{new Date().toLocaleString()}</div>
                     <div className="mt-4 pt-4 border-t border-zinc-100">
                        <div className="text-[10px] font-black text-zinc-400 tracking-widest uppercase mb-1">Official Project Report</div>
                        <div className="text-[8px] text-zinc-500 italic">ZTO Event OS • Powered by AI</div>
                     </div>
                </div>
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
                    .bg-zinc-900, .bg-zinc-900\\/50 {
                        background: transparent !important;
                    }
                }
            `}</style>
        </div>
    );
}
