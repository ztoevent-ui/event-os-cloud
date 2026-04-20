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
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className={`flex justify-between items-center bg-zinc-900 border ${theme.border} p-6 rounded-2xl shadow-sm print:hidden`}>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white mb-2">Tasks</h1>
                    <p className="text-zinc-400 font-medium">Manage project deliverables and track progress.</p>
                </div>
                <div className="flex gap-4">
                    <PrintReportButton title="Task Board" />
                    <AddTaskButton projectId={id} isWedding={isWedding} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-2 print:gap-4">
                {['todo', 'in_progress', 'review', 'done'].map((status) => {
                    const statusTasks = tasks?.filter((t) => t.status === status) || [];

                    let statusIcon = 'fa-circle';
                    let statusTitleColor = 'text-zinc-500';

                    if (status === 'todo') { statusIcon = 'fa-circle'; statusTitleColor = 'text-zinc-500'; }
                    if (status === 'in_progress') { statusIcon = 'fa-spinner fa-spin'; statusTitleColor = 'text-blue-500'; }
                    if (status === 'review') { statusIcon = 'fa-eye'; statusTitleColor = 'text-purple-500'; }
                    if (status === 'done') { statusIcon = 'fa-check-circle'; statusTitleColor = 'text-green-500'; }

                    return (
                        <div key={status} className={`bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 rounded-xl p-4 flex flex-col h-full min-h-[500px] ${status === 'todo' ? 'border-dashed' : ''} print:bg-white print:border-zinc-200 print:min-h-0 print:break-inside-avoid print:mb-4`}>
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <i className={`fa-solid ${statusIcon} ${statusTitleColor} text-sm`}></i>
                                    <h3 className={`font-bold ${statusTitleColor} uppercase tracking-wider text-sm print:text-black`}>
                                        {status.replace('_', ' ')}
                                    </h3>
                                </div>
                                <span className="text-xs bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-full font-mono border border-zinc-700 print:text-black print:bg-white print:border-zinc-200">
                                    {statusTasks.length}
                                </span>
                            </div>

                            <div className="space-y-4 flex-1">
                                {statusTasks.map((task) => (
                                    <div key={task.id} className={pageBreakIds.includes(task.id) ? 'print:break-before-page' : ''}>
                                        <TaskCard task={task} projectId={id} isWedding={isWedding} />
                                        <PrintBreakTrigger id={task.id} />
                                    </div>
                                ))}

                                {statusTasks.length === 0 && (
                                    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800/50 rounded-xl text-zinc-600 text-sm gap-2 opacity-50 print:hidden">
                                        <i className="fa-regular fa-clipboard text-zinc-700 text-2xl"></i>
                                        <span>No tasks</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
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
                    .bg-zinc-900, .bg-zinc-900\\/40, .bg-zinc-800 {
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
                }
            `}</style>
        </div>
    );
}
