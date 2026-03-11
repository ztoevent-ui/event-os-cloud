
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { AddTaskButton, TaskCard, TaskRow } from '../../components/ProjectModals';
import { CalendarSyncButton } from '../../components/CalendarSync';
import { TaskViewToggle } from '../../components/TaskViewToggle';

export default async function TasksPage({ 
    params,
    searchParams 
}: { 
    params: Promise<{ id: string }>,
    searchParams: Promise<{ view?: string }>
}) {
    const { id } = await params;
    const { view = 'board' } = await searchParams;

    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-6 animate-in fade-in duration-500 min-h-screen pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white mb-1">Project Tasks</h1>
                    <p className="text-zinc-500 text-sm">Organize work, track progress, and hit milestones.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <TaskViewToggle />
                    <div className="h-8 w-px bg-zinc-800 mx-1 hidden md:block"></div>
                    <CalendarSyncButton projectId={id} />
                    <AddTaskButton projectId={id} />
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl flex items-center gap-3">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    Error loading tasks: {error.message}
                </div>
            )}

            {view === 'board' ? (
                /* KANBAN BOARD VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {['todo', 'in_progress', 'review', 'done'].map((status) => {
                        const statusTasks = tasks?.filter((t) => t.status === status) || [];

                        let statusColor = 'border-zinc-700';
                        let statusIcon = 'fa-circle';
                        let statusTitleColor = 'text-zinc-500';

                        if (status === 'todo') { statusIcon = 'fa-circle-dot'; statusTitleColor = 'text-zinc-500'; }
                        if (status === 'in_progress') { statusIcon = 'fa-spinner fa-spin'; statusTitleColor = 'text-blue-500'; statusColor = 'border-blue-500/50'; }
                        if (status === 'review') { statusIcon = 'fa-magnifying-glass'; statusTitleColor = 'text-purple-500'; statusColor = 'border-purple-500/50'; }
                        if (status === 'done') { statusIcon = 'fa-circle-check'; statusTitleColor = 'text-green-500'; statusColor = 'border-green-500/50'; }

                        return (
                            <div key={status} className={`bg-zinc-900/30 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-4 flex flex-col h-full min-h-[500px] transition-all hover:bg-zinc-900/40`}>
                                <div className="flex justify-between items-center mb-5 pb-3 border-b border-zinc-800/50">
                                    <div className="flex items-center gap-2.5">
                                        <i className={`fa-solid ${statusIcon} ${statusTitleColor} text-xs`}></i>
                                        <h3 className={`font-black ${statusTitleColor} uppercase tracking-tighter text-xs`}>
                                            {status.replace('_', ' ')}
                                        </h3>
                                    </div>
                                    <span className="text-[10px] bg-zinc-800/50 text-zinc-500 px-2 py-0.5 rounded-full font-mono border border-zinc-800">
                                        {statusTasks.length}
                                    </span>
                                </div>

                                <div className="space-y-3 flex-1">
                                    {statusTasks.map((task) => (
                                        <TaskCard key={task.id} task={task} projectId={id} />
                                    ))}

                                    {statusTasks.length === 0 && (
                                        <div className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800/30 rounded-xl text-zinc-700 text-[10px] gap-2">
                                            <i className="fa-solid fa-inbox text-lg opacity-20"></i>
                                            <span>EMPTY</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* COMPACT LIST VIEW */
                <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-2xl p-6">
                    <div className="flex items-center gap-4 px-4 py-2 border-b border-zinc-800/50 text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">
                        <div className="w-5 shrink-0">PRI</div>
                        <div className="flex-1">Task Title</div>
                        <div className="w-20 shrink-0 text-center">Status</div>
                        <div className="w-24 shrink-0 text-right">Due Date</div>
                        <div className="w-6 shrink-0"></div>
                    </div>
                    
                    <div className="space-y-1">
                        {tasks && tasks.length > 0 ? (
                            tasks.map((task) => (
                                <TaskRow key={task.id} task={task} projectId={id} />
                            ))
                        ) : (
                            <div className="py-20 text-center">
                                <i className="fa-solid fa-clipboard-list text-4xl text-zinc-800 mb-4"></i>
                                <p className="text-zinc-500">No tasks found for this project.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
