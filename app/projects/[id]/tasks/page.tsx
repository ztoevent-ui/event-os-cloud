
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { AddTaskButton } from '../../components/ProjectModals';

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
                                    <div key={task.id} className="bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 p-4 rounded-xl transition-all group cursor-pointer shadow-sm hover:shadow-md relative overflow-hidden">

                                        {/* Priority Indicator */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.priority === 'critical' ? 'bg-red-500' :
                                            task.priority === 'high' ? 'bg-amber-500' :
                                                task.priority === 'medium' ? 'bg-blue-500' : 'bg-zinc-600'
                                            }`}></div>

                                        <div className="ml-3">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-[10px] uppercase font-bold tracking-wider ${task.access_level === 'admin' ? 'text-red-400 bg-red-900/20 px-1.5 py-0.5 rounded' :
                                                    'text-zinc-500'
                                                    }`}>
                                                    {task.access_level === 'admin' ? 'Admin Only' : ''}
                                                </span>
                                                {task.priority === 'critical' && <i className="fa-solid fa-fire text-red-500 animate-pulse text-xs" title="Critical"></i>}
                                            </div>

                                            <h4 className="font-medium text-zinc-100 mb-2 group-hover:text-amber-400 transition-colors leading-snug">
                                                {task.title}
                                            </h4>

                                            {task.description && (
                                                <p className="text-xs text-zinc-500 line-clamp-2 mb-4 font-light">
                                                    {task.description}
                                                </p>
                                            )}

                                            <div className="flex justify-between items-center text-xs text-zinc-600 border-t border-zinc-800 pt-3 mt-1">
                                                <div className="flex items-center gap-1.5">
                                                    <i className="fa-regular fa-calendar text-zinc-500"></i>
                                                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                                                </div>
                                                {task.ai_suggestions && typeof task.ai_suggestions === 'object' && Object.keys(task.ai_suggestions).length > 0 && (
                                                    <i className="fa-solid fa-wand-magic-sparkles text-purple-500" title="AI Suggestion Available"></i>
                                                )}
                                            </div>
                                        </div>
                                    </div>
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
