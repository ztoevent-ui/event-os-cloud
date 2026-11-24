'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

interface GlobalTask {
    id: string;
    project_id: string | null;
    title: string;
    description?: string | null;
    status: string;
    priority: TaskPriority | string | null;
    due_date?: string | null;
    assignee_type?: string | null;
    created_at?: string;
}

interface ProjectOption {
    id: string;
    name: string;
    status?: string;
    start_date?: string | null;
}

const PRIORITY_BADGE: Record<string, { label: string; cls: string }> = {
    critical: { label: 'Critical', cls: 'bg-rose-500/15 border-rose-500/35 text-rose-300' },
    high: { label: 'High', cls: 'bg-amber-500/15 border-amber-500/35 text-amber-300' },
    medium: { label: 'Medium', cls: 'bg-sky-500/15 border-sky-500/30 text-sky-300' },
    low: { label: 'Low', cls: 'bg-zinc-500/15 border-zinc-500/30 text-zinc-300' },
};

const PRIORITY_RANK: Record<string, number> = {
    critical: 1,
    high: 2,
    medium: 3,
    low: 4,
};

/**
 * Global To-Do & Master Action Items Console across company operations and all events.
 */
export default function GlobalTasksPage() {
    const [tasks, setTasks] = useState<GlobalTask[]>([]);
    const [projects, setProjects] = useState<ProjectOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [filterScope, setFilterScope] = useState<'PENDING' | 'ALL' | 'GENERAL' | 'PROJECTS' | 'DONE'>('PENDING');
    const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // New Task Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [projectId, setProjectId] = useState<string>('');
    const [priority, setPriority] = useState<TaskPriority>('high');
    const [dueDate, setDueDate] = useState('');

    const fetchAll = async () => {
        setLoading(true);
        const [{ data: projData }, { data: taskData }] = await Promise.all([
            supabase.from('projects').select('id, name, status, start_date').order('start_date', { ascending: false }),
            supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        ]);
        setProjects(projData || []);
        setTasks(taskData || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const projectMap = useMemo(() => {
        const map: Record<string, ProjectOption> = {};
        for (const p of projects) map[p.id] = p;
        return map;
    }, [projects]);

    const addTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        setSaving(true);
        try {
            const { data, error } = await supabase
                .from('tasks')
                .insert({
                    project_id: projectId || null,
                    title: title.trim(),
                    description: description.trim() || '',
                    status: 'todo',
                    priority,
                    due_date: dueDate ? `${dueDate}T00:00:00Z` : null,
                    access_level: 'staff',
                    assignee_type: 'team',
                })
                .select('*')
                .single();

            if (error) {
                alert('Failed to add task: ' + error.message);
                return;
            }
            if (data) setTasks(prev => [data, ...prev]);
            setTitle('');
            setDescription('');
            setDueDate('');
        } finally {
            setSaving(false);
        }
    };

    const toggleDone = async (task: GlobalTask) => {
        const nextStatus = task.status === 'done' ? 'todo' : 'done';
        setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, status: nextStatus } : t)));
        await supabase.from('tasks').update({ status: nextStatus }).eq('id', task.id);
    };

    const updateTaskPriority = async (task: GlobalTask, nextPriority: TaskPriority) => {
        setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, priority: nextPriority } : t)));
        await supabase.from('tasks').update({ priority: nextPriority }).eq('id', task.id);
    };

    const removeTask = async (task: GlobalTask) => {
        if (!confirm(`Delete task "${task.title}"?`)) return;
        setTasks(prev => prev.filter(t => t.id !== task.id));
        await supabase.from('tasks').delete().eq('id', task.id);
    };

    const filteredTasks = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return tasks
            .filter(t => {
                if (filterScope === 'PENDING' && t.status === 'done') return false;
                if (filterScope === 'DONE' && t.status !== 'done') return false;
                if (filterScope === 'GENERAL' && t.project_id) return false;
                if (filterScope === 'PROJECTS' && !t.project_id) return false;

                if (selectedProjectFilter === '__GENERAL__' && t.project_id) return false;
                if (selectedProjectFilter !== 'ALL' && selectedProjectFilter !== '__GENERAL__' && t.project_id !== selectedProjectFilter) {
                    return false;
                }

                if (q) {
                    const pName = t.project_id ? (projectMap[t.project_id]?.name || '').toLowerCase() : 'general company';
                    const hay = `${t.title} ${t.description || ''} ${pName}`.toLowerCase();
                    if (!hay.includes(q)) return false;
                }
                return true;
            })
            .sort((a, b) => {
                const doneDiff = (a.status === 'done' ? 1 : 0) - (b.status === 'done' ? 1 : 0);
                if (doneDiff !== 0) return doneDiff;
                const pDiff = (PRIORITY_RANK[a.priority || 'medium'] ?? 3) - (PRIORITY_RANK[b.priority || 'medium'] ?? 3);
                if (pDiff !== 0) return pDiff;
                return (b.created_at || '').localeCompare(a.created_at || '');
            });
    }, [tasks, filterScope, selectedProjectFilter, searchQuery, projectMap]);

    const counts = useMemo(() => {
        const pending = tasks.filter(t => t.status !== 'done');
        return {
            pending: pending.length,
            urgent: pending.filter(t => t.priority === 'critical' || t.priority === 'high').length,
            generalPending: pending.filter(t => !t.project_id).length,
            done: tasks.filter(t => t.status === 'done').length,
        };
    }, [tasks]);

    return (
        <div className="page-transition min-h-screen bg-[var(--c-canvas,#09090b)] text-ink">
            {/* Header */}
            <header className="print:hidden max-w-6xl mx-auto px-4 sm:px-8 pt-8 pb-6 border-b border-ink/10 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="zto-label mb-1">Internal Operations</div>
                    <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-ink">
                        Global To-Do &amp; Action Items
                    </h1>
                    <p className="text-xs text-zinc-400 mt-1">
                        Company-wide purchases, vehicle maintenance &amp; cross-project follow-ups synced across ZTO Event OS.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="zto-btn zto-btn-ghost text-xs"
                    >
                        <i className="fa-solid fa-print mr-1.5" /> Print List
                    </button>
                    <Link href="/projects/calendar" className="zto-btn zto-btn-ghost text-xs no-underline">
                        <i className="fa-solid fa-calendar-days mr-1.5" /> Global Calendar
                    </Link>
                    <Link href="/projects" className="zto-btn zto-btn-ghost text-xs no-underline">
                        <i className="fa-solid fa-arrow-left mr-1.5" /> Back to Projects
                    </Link>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6">
                {/* Summary Strip */}
                <div className="print:hidden grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-2xl border border-ink/10 bg-ink/[0.03] p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Pending Tasks</div>
                        <div className="text-2xl font-black font-mono text-amber-400 mt-1">{counts.pending}</div>
                    </div>
                    <div className="rounded-2xl border border-ink/10 bg-ink/[0.03] p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Critical / High</div>
                        <div className="text-2xl font-black font-mono text-rose-400 mt-1">{counts.urgent}</div>
                    </div>
                    <div className="rounded-2xl border border-ink/10 bg-ink/[0.03] p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Company / Non-Event</div>
                        <div className="text-2xl font-black font-mono text-sky-400 mt-1">{counts.generalPending}</div>
                    </div>
                    <div className="rounded-2xl border border-ink/10 bg-ink/[0.03] p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Completed</div>
                        <div className="text-2xl font-black font-mono text-emerald-400 mt-1">{counts.done}</div>
                    </div>
                </div>

                {/* Add New Task Card */}
                <form
                    onSubmit={addTask}
                    className="print:hidden rounded-3xl border border-ink/10 bg-canvas p-5 space-y-3 shadow-lg"
                >
                    <div className="text-xs font-black uppercase tracking-wider text-ink flex items-center gap-2">
                        <i className="fa-solid fa-plus-circle text-amber-400" /> Add Action Item
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Task title (e.g. Order D-Max left headlight / Submit BIF safety list)..."
                            required
                            className="md:col-span-5 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:border-accent"
                        />
                        <select
                            value={projectId}
                            onChange={e => setProjectId(e.target.value)}
                            className="md:col-span-3 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-ink focus:outline-none focus:border-accent"
                        >
                            <option value="">Company / General (No Project)</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                        <select
                            value={priority}
                            onChange={e => setPriority(e.target.value as TaskPriority)}
                            className="md:col-span-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-ink focus:outline-none focus:border-accent"
                        >
                            <option value="critical">Priority: Critical</option>
                            <option value="high">Priority: High</option>
                            <option value="medium">Priority: Medium</option>
                            <option value="low">Priority: Low</option>
                        </select>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                            className="md:col-span-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-ink focus:outline-none focus:border-accent"
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Optional notes, PIC, supplier or remarks..."
                            className="flex-1 min-w-[220px] bg-black/30 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-accent"
                        />
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save To-Do'}
                        </button>
                    </div>
                </form>

                {/* Filter Bar */}
                <div className="print:hidden flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-ink/[0.02] p-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {(['PENDING', 'ALL', 'GENERAL', 'PROJECTS', 'DONE'] as const).map(f => (
                            <button
                                key={f}
                                type="button"
                                onClick={() => setFilterScope(f)}
                                className={`px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border cursor-pointer transition-colors ${
                                    filterScope === f
                                        ? 'bg-accent border-accent text-white'
                                        : 'bg-black/30 border-white/10 text-zinc-400 hover:text-white'
                                }`}
                            >
                                {f === 'PENDING' && `Active (${counts.pending})`}
                                {f === 'ALL' && `All (${tasks.length})`}
                                {f === 'GENERAL' && 'Company / General'}
                                {f === 'PROJECTS' && 'Event-Linked'}
                                {f === 'DONE' && `Completed (${counts.done})`}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={selectedProjectFilter}
                            onChange={e => setSelectedProjectFilter(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-300"
                        >
                            <option value="ALL">All Projects &amp; Company</option>
                            <option value="__GENERAL__">Company / General Only</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search tasks..."
                            className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-ink w-48 focus:outline-none focus:border-accent"
                        />
                    </div>
                </div>

                {/* Task Rows */}
                <div className="rounded-3xl border border-ink/10 bg-canvas overflow-hidden shadow-lg">
                    <div className="hidden print:block p-4 border-b-2 border-black">
                        <h2 className="text-lg font-black uppercase">ZTO Event OS — Global To-Do &amp; Action Items</h2>
                    </div>

                    {loading ? (
                        <div className="py-16 text-center text-xs text-zinc-400 animate-pulse">Loading action items...</div>
                    ) : filteredTasks.length === 0 ? (
                        <div className="py-16 text-center text-xs text-zinc-500">No tasks match the current filters.</div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {filteredTasks.map(task => {
                                const isDone = task.status === 'done';
                                const proj = task.project_id ? projectMap[task.project_id] : null;
                                const badge = PRIORITY_BADGE[task.priority || 'medium'] || PRIORITY_BADGE.medium;
                                const dueStr = task.due_date ? task.due_date.slice(0, 10) : '';
                                return (
                                    <div
                                        key={task.id}
                                        className={`px-4 sm:px-6 py-4 flex flex-wrap sm:flex-nowrap items-start justify-between gap-4 hover:bg-white/[0.02] transition-colors ${
                                            isDone ? 'opacity-50' : ''
                                        }`}
                                    >
                                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                            <button
                                                type="button"
                                                onClick={() => toggleDone(task)}
                                                className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                                                    isDone
                                                        ? 'bg-emerald-500 border-emerald-500 text-black'
                                                        : 'border-zinc-600 hover:border-amber-400 text-transparent'
                                                }`}
                                                title={isDone ? 'Mark Pending' : 'Mark Done'}
                                            >
                                                <i className="fa-solid fa-check text-[11px]" />
                                            </button>

                                            <div className="min-w-0 flex-1 space-y-1">
                                                <div className={`text-sm font-bold leading-snug ${isDone ? 'line-through text-zinc-400' : 'text-ink'}`}>
                                                    {task.title}
                                                </div>
                                                {task.description && (
                                                    <div className="text-xs text-zinc-400 whitespace-pre-line">{task.description}</div>
                                                )}
                                                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                                    {proj ? (
                                                        <Link
                                                            href={`/projects/${proj.id}/tasks`}
                                                            className="px-2 py-0.5 rounded-md bg-accent/15 border border-accent/30 text-[10px] font-bold text-accent-bright no-underline hover:underline"
                                                        >
                                                            {proj.name}
                                                        </Link>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-300">
                                                            Company / General
                                                        </span>
                                                    )}
                                                    {dueStr && (
                                                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-[10px] font-mono font-bold text-amber-300">
                                                            Due: {dueStr}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="print:hidden flex items-center gap-2 shrink-0 ml-9 sm:ml-0">
                                            <select
                                                value={task.priority || 'medium'}
                                                onChange={e => updateTaskPriority(task, e.target.value as TaskPriority)}
                                                className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase border cursor-pointer focus:outline-none ${badge.cls}`}
                                            >
                                                <option value="critical">Critical</option>
                                                <option value="high">High</option>
                                                <option value="medium">Medium</option>
                                                <option value="low">Low</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => removeTask(task)}
                                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 flex items-center justify-center cursor-pointer"
                                                title="Delete Task"
                                            >
                                                <i className="fa-solid fa-trash text-xs" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
