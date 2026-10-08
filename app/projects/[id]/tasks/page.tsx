'use client';
import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PrintReportButton } from '../../components/ProjectModals';
import { quickCreateTask, toggleTaskStatus } from '../../actions';
import { useTransition } from 'react';
import { Check, Circle, Trash2, Calendar, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function TasksPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [tasks, setTasks] = useState<any[]>([]);
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskClientText, setNewTaskClientText] = useState('');
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        fetchData();
        
        const channel = supabase.channel('tasks_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${id}` }, () => {
                fetchData();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [id]);

    const fetchData = async () => {
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

    const handleCreateTask = async (title: string, assignee_type: 'team' | 'client') => {
        if (!title.trim()) return;
        
        // Optimistic UI update
        const tempId = `temp-${Date.now()}`;
        setTasks(prev => [{ id: tempId, project_id: id, title, status: 'todo', assignee_type, created_at: new Date().toISOString() }, ...prev]);
        
        if (assignee_type === 'team') setNewTaskText('');
        else setNewTaskClientText('');

        startTransition(async () => {
            await quickCreateTask(id, title, assignee_type);
        });
    };

    const handleToggleTask = async (taskId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'done' ? 'todo' : 'done';
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        startTransition(async () => {
            await toggleTaskStatus(taskId, currentStatus, id);
        });
    };
    
    const handleDeleteTask = async (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        startTransition(async () => {
            const formData = new FormData();
            formData.append('id', taskId);
            formData.append('project_id', id);
            const { deleteTask } = await import('../../actions');
            await deleteTask(formData);
        });
    }

    const generateMagicLink = async () => {
        toast.promise(
            async () => {
                const { data, error } = await supabase.from('project_share_links').insert({
                    project_id: id,
                    name: 'Client Portal'
                }).select().single();
                
                if (error) throw error;
                const url = `${window.location.origin}/share/wedding/${data.token}`;
                await navigator.clipboard.writeText(url);
                return url;
            },
            {
                loading: 'Generating Magic Link...',
                success: 'Magic link copied to clipboard!',
                error: 'Run SQL migration first (see supabase/migrations)'
            }
        );
    };

    if (loading) return <div className="p-20 text-center animate-pulse">Syncing To-Do List...</div>;

    const teamTasks = tasks.filter(t => t.assignee_type !== 'client');
    const clientTasks = tasks.filter(t => t.assignee_type === 'client');

    const TeamTodoList = () => (
        <div className="flex flex-col gap-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-ink mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" /> Team Operations
            </h2>
            
            {/* Input Row */}
            <div className="flex items-center gap-3 bg-canvas border border-ink/10 rounded-xl px-4 py-3 shadow-sm focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all">
                <Circle className="w-5 h-5 text-ink/20" />
                <input 
                    type="text" 
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTask(newTaskText, 'team')}
                    placeholder="New task for the team... (Press Enter to save)"
                    className="flex-1 bg-transparent border-none outline-none text-ink placeholder:text-ink/30 text-sm font-medium"
                />
            </div>

            {/* Todo List */}
            <div className="flex flex-col mt-2">
                {teamTasks.filter(t => t.status !== 'done').map(task => (
                    <div key={task.id} className="group flex items-center justify-between gap-3 px-4 py-3 border-b border-ink/5 hover:bg-ink/[0.02] transition-colors rounded-lg">
                        <div className="flex items-center gap-3 flex-1">
                            <button onClick={() => handleToggleTask(task.id, task.status)} className="text-ink/20 hover:text-accent transition-colors flex-shrink-0">
                                <Circle className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-medium text-ink">{task.title}</span>
                        </div>
                        <button onClick={() => handleDeleteTask(task.id)} className="text-ink/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                
                {/* Done List */}
                {teamTasks.filter(t => t.status === 'done').length > 0 && (
                    <div className="mt-6 flex flex-col opacity-60">
                        <div className="px-4 py-2 text-xs font-bold text-ink/40 uppercase tracking-wider">Completed</div>
                        {teamTasks.filter(t => t.status === 'done').map(task => (
                            <div key={task.id} className="group flex items-center justify-between gap-3 px-4 py-2 hover:bg-ink/[0.02] transition-colors rounded-lg">
                                <div className="flex items-center gap-3 flex-1 opacity-50">
                                    <button onClick={() => handleToggleTask(task.id, task.status)} className="text-emerald-500 hover:text-emerald-600 transition-colors flex-shrink-0">
                                        <Check className="w-5 h-5" />
                                    </button>
                                    <span className="text-sm font-medium text-ink line-through">{task.title}</span>
                                </div>
                                <button onClick={() => handleDeleteTask(task.id)} className="text-ink/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const ClientTodoList = () => (
        <div className="flex flex-col gap-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-ink mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" /> Client Checklist
                </div>
            </h2>
            
            {/* Input Row */}
            <div className="flex items-center gap-3 bg-canvas border border-ink/10 rounded-xl px-4 py-3 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                <Circle className="w-5 h-5 text-ink/20" />
                <input 
                    type="text" 
                    value={newTaskClientText}
                    onChange={(e) => setNewTaskClientText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTask(newTaskClientText, 'client')}
                    placeholder="New task for the couple... (Press Enter to save)"
                    className="flex-1 bg-transparent border-none outline-none text-ink placeholder:text-ink/30 text-sm font-medium"
                />
            </div>

            {/* Todo List */}
            <div className="flex flex-col mt-2">
                {clientTasks.filter(t => t.status !== 'done').map(task => (
                    <div key={task.id} className="group flex items-center justify-between gap-3 px-4 py-3 border-b border-ink/5 hover:bg-ink/[0.02] transition-colors rounded-lg">
                        <div className="flex items-center gap-3 flex-1">
                            <button onClick={() => handleToggleTask(task.id, task.status)} className="text-ink/20 hover:text-blue-500 transition-colors flex-shrink-0">
                                <Circle className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-medium text-ink">{task.title}</span>
                        </div>
                        <button onClick={() => handleDeleteTask(task.id)} className="text-ink/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                
                {/* Done List */}
                {clientTasks.filter(t => t.status === 'done').length > 0 && (
                    <div className="mt-6 flex flex-col opacity-60">
                        <div className="px-4 py-2 text-xs font-bold text-ink/40 uppercase tracking-wider">Completed</div>
                        {clientTasks.filter(t => t.status === 'done').map(task => (
                            <div key={task.id} className="group flex items-center justify-between gap-3 px-4 py-2 hover:bg-ink/[0.02] transition-colors rounded-lg">
                                <div className="flex items-center gap-3 flex-1 opacity-50">
                                    <button onClick={() => handleToggleTask(task.id, task.status)} className="text-blue-500 hover:text-blue-600 transition-colors flex-shrink-0">
                                        <Check className="w-5 h-5" />
                                    </button>
                                    <span className="text-sm font-medium text-ink line-through">{task.title}</span>
                                </div>
                                <button onClick={() => handleDeleteTask(task.id)} className="text-ink/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col flex-1 animate-in fade-in duration-700 max-w-6xl mx-auto w-full pb-32">
            {/* ── Page Header + Action Bar ── */}
            <div className="print:hidden flex flex-wrap items-end justify-between gap-8 mb-12">
                <div className="flex flex-col">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-accent mb-2">Operations Hub</p>
                    <h1 className="text-4xl md:text-5xl font-black text-ink uppercase tracking-tight leading-none font-display">
                        Action Items
                    </h1>
                </div>

                {/* Action Hub */}
                <div className="flex items-center gap-3">
                    <button 
                        onClick={generateMagicLink}
                        className="bg-canvas border border-ink/10 text-ink px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider hover:border-accent hover:text-accent transition-colors flex items-center gap-2"
                    >
                        <LinkIcon className="w-4 h-4" />
                        Share Portal Link
                    </button>
                    <PrintReportButton title="To-Do List" />
                </div>
            </div>

            {/* ── Lists ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 print:grid-cols-2">
                <TeamTodoList />
                <ClientTodoList />
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
