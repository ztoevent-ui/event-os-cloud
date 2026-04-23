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
            <div className="relative rounded-[2.5rem] overflow-hidden bg-[#050505] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] print:bg-white print:border-zinc-200">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-10 print:hidden"
                    style={{ backgroundImage: `url(${isWedding ? 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop'})` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/60 print:hidden"></div>

                <div className="relative z-10 p-10 md:p-12 lg:p-14 print:p-8">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12">
                        <div className="flex-1 min-w-0 relative z-20">
                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 mb-6 border ${theme.border} rounded-full ${theme.pill} ${theme.primary} text-xs font-black tracking-widest uppercase print:border-black print:text-black backdrop-blur-md shadow-[0_0_15px_rgba(0,86,179,0.4)]`}>
                                <span className={`w-2 h-2 ${theme.bg} rounded-full animate-[pulse_1.5s_ease-in-out_infinite] print:bg-black`}></span>
                                {project?.status || 'Active Operation'}
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tighter uppercase print:text-black break-words leading-tight">
                                {project?.name || 'ZTO Event'}
                            </h1>
                            <p className="text-base text-zinc-500 font-medium print:text-zinc-600 truncate tracking-wide">
                                Event ID: <span className="text-zinc-300 font-mono text-sm print:text-black">{id}</span>
                                {project?.type && <span> • {project.type.replace(/_/g, ' ')}</span>}
                            </p>
                        </div>

                        <div className="flex flex-col items-start lg:items-end shrink-0 relative z-10 print:mt-4">
                            <div className="text-zinc-500 text-xs font-black tracking-[0.2em] uppercase mb-2 print:text-zinc-500">Countdown</div>
                            <div className="text-6xl lg:text-7xl font-black text-white tabular-nums tracking-tighter print:text-black">
                                {daysLeft}<span className="text-xl text-zinc-500 ml-3 font-bold print:text-zinc-600 tracking-wider">DAYS</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 print:hidden relative z-20">
                        <Link href={`/projects/${id}/program`}>
                            <div className={`p-6 ${theme.bg} ${theme.hover} text-white font-black rounded-[1.5rem] transition-all flex items-center justify-between ${theme.shadow} border border-white/20 hover:scale-[1.02] active:scale-95`}>
                                <span className="uppercase tracking-widest text-sm">Run Live Program</span>
                                <i className="fa-solid fa-play text-lg"></i>
                            </div>
                        </Link>
                        <Link href={`/projects/${id}/schedule`}>
                            <div className="p-6 bg-white/5 hover:bg-white/10 backdrop-blur-md text-white font-black rounded-[1.5rem] transition-all border border-white/10 flex items-center justify-between hover:scale-[1.02] active:scale-95">
                                <span className="uppercase tracking-widest text-sm">Dispatch Schedule</span>
                                <i className="fa-solid fa-list-check text-lg text-[#0056B3]"></i>
                            </div>
                        </Link>
                        <Link href={`/projects/${id}/timelines`}>
                            <div className="p-6 bg-white/5 hover:bg-white/10 backdrop-blur-md text-white font-black rounded-[1.5rem] transition-all border border-white/10 flex items-center justify-between hover:scale-[1.02] active:scale-95">
                                <span className="uppercase tracking-widest text-sm">Full Timeline</span>
                                <i className="fa-solid fa-calendar-days text-lg text-[#0056B3]"></i>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Tasks */}
                <div className="bg-white/5 border border-white/10 p-10 rounded-[2rem] backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.3)] transition-all print:bg-white print:border-zinc-200 print:shadow-none">
                    <div className="flex items-center justify-between mb-8">
                        <div className={`w-14 h-14 ${theme.pill} rounded-2xl border border-[#0056B3]/20 flex items-center justify-center ${theme.primary} print:bg-zinc-100 print:text-black`}>
                            <i className="fa-solid fa-check-double text-2xl"></i>
                        </div>
                        <span className="text-xs font-black text-zinc-500 tracking-[0.2em] uppercase print:text-zinc-500">TASKS</span>
                    </div>
                    <div className="text-5xl font-black text-white mb-3 print:text-black">{stats.pendingTasks}</div>
                    <div className="text-xs font-black text-zinc-400 tracking-widest uppercase mb-4 print:text-zinc-600">Pending Actions</div>
                    <div className="text-xs font-mono text-[#0056B3] mt-2 print:text-black font-bold">{stats.criticalTasks} Critical</div>
                </div>

                {/* Budget */}
                <div className="bg-white/5 border border-white/10 p-10 rounded-[2rem] backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.3)] transition-all print:bg-white print:border-zinc-200 print:shadow-none">
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/80 print:bg-zinc-100 print:text-black">
                            <i className="fa-solid fa-receipt text-2xl"></i>
                        </div>
                        <span className="text-xs font-black text-zinc-500 tracking-[0.2em] uppercase print:text-zinc-500">BUDGET</span>
                    </div>
                    <div className="text-4xl font-black text-white mb-3 print:text-black tabular-nums tracking-tighter">RM {stats.expenses.toLocaleString()}</div>
                    <div className="text-xs font-black text-zinc-400 tracking-widest uppercase mb-4 print:text-zinc-600">Current Spend</div>
                </div>

                {/* Consultations */}
                <div className="bg-white/5 border border-white/10 p-10 rounded-[2rem] backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.3)] transition-all print:bg-white print:border-zinc-200 print:shadow-none">
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-14 h-14 bg-[#0056B3]/10 border border-[#0056B3]/20 rounded-2xl flex items-center justify-center text-[#0056B3] print:bg-zinc-100 print:text-black">
                            <i className="fa-solid fa-wand-magic-sparkles text-2xl"></i>
                        </div>
                        <span className="text-xs font-black text-zinc-500 tracking-[0.2em] uppercase print:text-zinc-500">REPORTS</span>
                    </div>
                    <div className="text-5xl font-black text-white mb-3 print:text-black">{stats.consultations}</div>
                    <div className="text-xs font-black text-zinc-400 tracking-widest uppercase mb-4 print:text-zinc-600">Client Submissions</div>
                </div>

                {/* Placeholder for Print info */}
                <div className="hidden print:block bg-white border border-zinc-200 p-10 rounded-[2rem]">
                     <div className="text-xs font-black text-zinc-400 tracking-widest uppercase mb-2">Generated On</div>
                     <div className="text-base font-bold text-black">{new Date().toLocaleString()}</div>
                     <div className="mt-4 pt-4 border-t border-zinc-100">
                        <div className="text-xs font-black text-zinc-400 tracking-widest uppercase mb-1">Official Project Report</div>
                        <div className="text-[10px] text-zinc-500 italic">ZTO Event OS • Powered by AI</div>
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
