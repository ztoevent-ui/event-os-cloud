'use client';
import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AddTaskButton, PrintReportButton } from '../../components/ProjectModals';
import { TaskCard } from '../../components/ProjectModals';
import { PrintBreakTrigger } from '../../components/PrintBreakTrigger';
import { usePrint } from '../../components/PrintContext';

export default function TasksPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [tasks, setTasks] = useState<any[]>([]);
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

        const { data: tasksData } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', id)
            .order('created_at', { ascending: false });
        
        setTasks(tasksData || []);
        setLoading(false);
    };

    if (loading) return <div className="p-20 text-center animate-pulse">Syncing Task Board...</div>;

    const isWedding = project?.type === 'wedding' || project?.type === 'wedding_fair';
    const theme = isWedding ? {
        primary: 'text-pink-500',
        bg: 'bg-pink-500',
        hover: 'hover:bg-pink-400',
        border: 'border-pink-500/30'
    } : {
        primary: 'text-[#0056B3]',
        bg: 'bg-[#0056B3]',
        hover: 'hover:bg-[#0056B3]',
        border: 'border-[#0056B3]/30'
    };

    return (
        <div className="flex flex-col flex-1 animate-in fade-in duration-700">
            {/* ── Page Header + Action Bar ── */}
            <div className="print:hidden flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                <div className="flex flex-col">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0056B3] mb-2">Operations Hub</p>
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none font-['Urbanist']">
                        Strategic Tasks
                    </h1>
                </div>

                {/* Action Hub */}
                <div className="flex items-center gap-3">
                    <PrintReportButton title="Task Board" />
                    <AddTaskButton projectId={id} isWedding={isWedding} />
                </div>
            </div>

            {/* ── Kanban Board ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-2 print:gap-4 items-start">
                {['todo', 'in_progress', 'review', 'done'].map((status) => {
                    const statusTasks = tasks?.filter((t) => t.status === status) || [];

                    const statusConfig = {
                        todo: { icon: 'fa-circle', color: 'text-zinc-500', glow: 'shadow-none' },
                        in_progress: { icon: 'fa-spinner fa-spin', color: 'text-[#4da3ff]', glow: 'shadow-[0_0_15px_rgba(77,163,255,0.3)]' },
                        review: { icon: 'fa-eye', color: 'text-purple-500', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]' },
                        done: { icon: 'fa-check-circle', color: 'text-emerald-500', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]' }
                    };

                    const config = statusConfig[status as keyof typeof statusConfig];

                    return (
                        <div key={status} className="flex flex-col gap-6">
                            {/* Column Header */}
                            <div className="flex justify-between items-center px-2">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')} ${config.glow}`} />
                                    <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${config.color}`}>
                                        {status.replace('_', ' ')}
                                    </h3>
                                </div>
                                <span className="text-[9px] font-black bg-white/5 text-zinc-600 px-3 py-1 rounded-full border border-white/5 font-mono">
                                    {statusTasks.length}
                                </span>
                            </div>

                            {/* Task Column */}
                            <div className={`bg-white/[0.02] border border-white/5 rounded-[32px] p-4 flex flex-col gap-4 min-h-[600px] transition-all hover:bg-white/[0.03] print:bg-white print:border-zinc-200 print:min-h-0`}>
                                {statusTasks.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center opacity-10">
                                        <i className={`fa-solid ${config.icon} text-3xl mb-4`} />
                                        <p className="text-[8px] font-black uppercase tracking-widest">Queue Empty</p>
                                    </div>
                                ) : (
                                    statusTasks.map((task) => (
                                        <div key={task.id} className={`${pageBreakIds.includes(task.id) ? 'print:break-before-page' : ''} group`}>
                                            <TaskCard task={task} projectId={id} isWedding={isWedding} />
                                            <PrintBreakTrigger id={task.id} />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <style jsx global>{`
                @media print {
                    @page { size: A4 landscape; margin: 10mm; }
                    html, body, main { background: white !important; color: black !important; }
                    .print\\:hidden, nav, header, footer, button { display: none !important; }
                    .bg-white\\/\\[0\\.02\\], .bg-white\\/\\[0\\.03\\] { background: transparent !important; border: 1px solid #eee !important; border-radius: 12px !important; }
                    .text-white, .text-zinc-600 { color: black !important; }
                }
            `}</style>
        </div>
    );
}
