
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { AddTaskButton, TaskCard } from '../../components/ProjectModals';

export default async function TasksPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white mb-2">Tasks</h1>
                    <p className="text-zinc-400">Manage project deliverables and track progress.</p>
                </div>
                <AddTaskButton projectId={id} />
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl">
                    Error loading tasks: {error.message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {['todo', 'in_progress', 'review', 'done'].map((status) => {
                    const statusTasks = tasks?.filter((t) => t.status === status) || [];

                    let statusColor = 'border-zinc-700';
                    let statusIcon = 'fa-circle';
                    let statusTitleColor = 'text-zinc-500';

                    if (status === 'todo') { statusIcon = 'fa-circle'; statusTitleColor = 'text-zinc-500'; }
                    if (status === 'in_progress') { statusIcon = 'fa-spinner fa-spin'; statusTitleColor = 'text-blue-500'; statusColor = 'border-blue-500/50'; }
                    if (status === 'review') { statusIcon = 'fa-eye'; statusTitleColor = 'text-purple-500'; statusColor = 'border-purple-500/50'; }
                    if (status === 'done') { statusIcon = 'fa-check-circle'; statusTitleColor = 'text-green-500'; statusColor = 'border-green-500/50'; }

                    return (
                        <div key={status} className={`bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 rounded-xl p-4 flex flex-col h-full min-h-[500px] ${status === 'todo' ? 'border-dashed' : ''}`}>
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <i className={`fa-solid ${statusIcon} ${statusTitleColor} text-sm`}></i>
                                    <h3 className={`font-bold ${statusTitleColor} uppercase tracking-wider text-sm`}>
                                        {status.replace('_', ' ')}
                                    </h3>
                                </div>
                                <span className="text-xs bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-full font-mono border border-zinc-700">
                                    {statusTasks.length}
                                </span>
                            </div>

                            <div className="space-y-4 flex-1">
                                {statusTasks.map((task) => (
                                    <TaskCard key={task.id} task={task} projectId={id} />
                                ))}

                                {statusTasks.length === 0 && (
                                    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800/50 rounded-xl text-zinc-600 text-sm gap-2 opacity-50">
                                        <i className="fa-regular fa-clipboard text-zinc-700 text-2xl"></i>
                                        <span>No tasks</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
