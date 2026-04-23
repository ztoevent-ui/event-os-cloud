'use client';

import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { PrintReportButton } from '../components/ProjectModals';

const fmt = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

const MODULES = [
    { label: 'Tasks', icon: 'fa-check-double', path: '/tasks', desc: 'Deliverables & board', color: '#3b82f6', tag: 'EXEC' },
    { label: 'Timeline', icon: 'fa-timeline', path: '/timelines', desc: 'Project milestones', color: '#8b5cf6', tag: 'PLAN' },
    { label: 'Schedule', icon: 'fa-calendar-days', path: '/schedule', desc: 'Day-of dispatch cues', color: '#0056B3', tag: 'OPS' },
    { label: 'Live Program', icon: 'fa-list-ol', path: '/program', desc: 'Sequence & production cues', color: '#10b981', tag: 'LIVE' },
    { label: 'Budget', icon: 'fa-file-invoice-dollar', path: '/budget', desc: 'P&L & expense tracking', color: '#f59e0b', tag: 'FIN' },
    { label: 'Vendors', icon: 'fa-truck-fast', path: '/vendors', desc: 'Supplier contacts', color: '#06b6d4', tag: 'OPS' },
    { label: 'Venue Layout', icon: 'fa-map', path: '/venue-layout', desc: '2D floor plan', color: '#ec4899', tag: 'SPACE' },
    { label: '3D Stage', icon: 'fa-cube', path: '/stage-layout', desc: 'Stage visualizer', color: '#f97316', tag: 'SPACE' },
    { label: 'Registration', icon: 'fa-id-card', path: '/registration', desc: 'Participant management', color: '#a855f7', tag: 'REG' },
    { label: 'Guests', icon: 'fa-users', path: '/guests', desc: 'Guest list & seating', color: '#14b8a6', tag: 'REG' },
];

export default function ProjectDashboard({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<any>(null);
    const [stats, setStats] = useState({ pending: 0, critical: 0, done: 0, expenses: 0, enquiries: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, [id]);

    const fetchData = async () => {
        setLoading(true);
        const { data: p } = await supabase.from('projects').select('*').eq('id', id).single();
        setProject(p);
        const [{ count: pending }, { count: critical }, { count: done }, { data: budgetItems }, { count: enquiries }] = await Promise.all([
            supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', id).neq('status', 'done'),
            supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', id).eq('priority', 'critical').neq('status', 'done'),
            supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', id).eq('status', 'done'),
            supabase.from('budgets').select('amount,type').eq('project_id', id),
            supabase.from('consulting_forms').select('*', { count: 'exact', head: true }).eq('project_id', id),
        ]);
        const exp = budgetItems?.filter((b: any) => b.type === 'expense').reduce((s: number, b: any) => s + Number(b.amount), 0) ?? 0;
        setStats({ pending: pending ?? 0, critical: critical ?? 0, done: done ?? 0, expenses: exp, enquiries: enquiries ?? 0 });
        setLoading(false);
    };

    if (loading) return (
        <div className="flex items-center gap-3 justify-center" style={{ height: 'calc(100vh - 48px)' }}>
            <span className="w-5 h-5 rounded-full border-2 border-zinc-800 border-t-[#0056B3] animate-spin" />
            <span className="text-zinc-600 text-sm">Loading…</span>
        </div>
    );

    const today = new Date();
    const endDate = project?.end_date ? new Date(project.end_date) : null;
    const diffDays = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / 86400000) : null;
    const isEnded = diffDays != null && diffDays <= 0;
    const total = stats.pending + stats.done;
    const progress = total > 0 ? Math.round((stats.done / total) * 100) : 0;
    const isTournament = project?.type === 'tournament';

    return (
        <div className="flex flex-col gap-10">
            {/* ──────────── SPACIOUS HERO SECTION ──────────── */}
            <div className="relative rounded-3xl border border-white/[0.07] bg-[#0d0d0d] overflow-hidden">
                {/* subtle glow */}
                <div className="absolute -top-10 left-20 w-[400px] h-[400px] bg-[#0056B3]/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-8 lg:p-10">
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="px-2.5 py-1 rounded bg-zinc-800 text-[10px] font-black tracking-widest text-white uppercase shadow-sm">
                                {project?.status || 'PLANNING'}
                            </span>
                            {isTournament && (
                                <span className="px-2.5 py-1 rounded border border-[#0056B3]/40 text-[#0056B3] bg-[#0056B3]/10 text-[10px] font-black tracking-widest uppercase shadow-sm flex items-center gap-1.5">
                                    <i className="fa-solid fa-trophy text-[9px]" /> TOURNAMENT
                                </span>
                            )}
                            {project?.type === 'wedding' && (
                                <span className="px-2.5 py-1 rounded border border-rose-500/40 text-rose-500 bg-rose-500/10 text-[10px] font-black tracking-widest uppercase shadow-sm flex items-center gap-1.5">
                                    <i className="fa-solid fa-rings-wedding text-[9px]" /> WEDDING
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.1] break-words mb-4">
                            {project?.name || 'Untitled Project'}
                        </h1>
                        <div className="flex flex-wrap gap-5 text-[12px] text-zinc-400 font-mono">
                            {project?.start_date && <span>START <span className="text-white ml-1">{fmt(project.start_date)}</span></span>}
                            {project?.end_date && <span>END <span className="text-white ml-1">{fmt(project.end_date)}</span></span>}
                            {project?.venue && <span>📍 <span className="text-white ml-1">{project.venue}</span></span>}
                        </div>
                    </div>

                    {/* Right: countdown + print */}
                    <div className="flex items-center gap-8 shrink-0 print:hidden bg-black/40 p-6 rounded-2xl border border-white/[0.05]">
                        {diffDays != null && !isEnded && (
                            <div className="text-right">
                                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">T-Minus</div>
                                <div className="text-6xl font-black text-white tabular-nums leading-none tracking-tighter">{diffDays}</div>
                                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-1">days to go</div>
                            </div>
                        )}
                        {isEnded && <div className="text-2xl font-black text-zinc-600 uppercase tracking-widest">Ended</div>}
                        <div className="h-16 w-px bg-white/[0.06] mx-2" />
                        <PrintReportButton title="Project Summary" />
                    </div>
                </div>

                {/* Progress bar */}
                {total > 0 && (
                    <div className="relative z-10 px-6 pb-4 print:hidden">
                        <div className="flex justify-between text-[9px] font-bold text-zinc-700 uppercase tracking-widest mb-1">
                            <span>Task Progress</span>
                            <span className="text-zinc-500">{stats.done}/{total} ({progress}%)</span>
                        </div>
                        <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                            <div className="h-full bg-[#0056B3] rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )}
            </div>

            {/* ──────────── 4 STAT CHIPS (1 row) ──────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:gap-2">
                {[
                    { label: 'Pending Tasks', val: stats.pending, sub: stats.critical > 0 ? `${stats.critical} critical` : 'all clear', icon: 'fa-check-double', c: '#3b82f6', href: `/projects/${id}/tasks` },
                    { label: 'Total Spend', val: `RM ${stats.expenses.toLocaleString()}`, sub: 'expenses logged', icon: 'fa-receipt', c: '#10b981', href: `/projects/${id}/budget` },
                    { label: 'Days Left', val: diffDays != null && !isEnded ? diffDays : isEnded ? '—' : 'TBD', sub: isEnded ? 'event ended' : diffDays != null ? 'until event day' : 'date not set', icon: 'fa-hourglass-half', c: isEnded ? '#555' : '#f59e0b', href: null },
                    { label: 'Enquiries', val: stats.enquiries, sub: 'forms received', icon: 'fa-envelope', c: '#a855f7', href: null },
                ].map(card => {
                    const el = (
                        <div className="group bg-[#0d0d0d] border border-white/[0.06] hover:border-white/[0.14] rounded-xl px-5 py-4 transition-all h-full print:bg-white print:border-zinc-200">
                            <div className="flex items-center justify-between mb-3">
                                <i className={`fa-solid ${card.icon} text-sm`} style={{ color: card.c }} />
                                <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">{card.label}</span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-black text-white tabular-nums leading-none print:text-black">{card.val}</div>
                            <div className="text-[10px] text-zinc-600 mt-1">{card.sub}</div>
                        </div>
                    );
                    return card.href
                        ? <Link key={card.label} href={card.href} className="block h-full">{el}</Link>
                        : <div key={card.label} className="h-full">{el}</div>;
                })}
            </div>

            {/* ──────────── ALL MODULES (bold card grid) ───────────────── */}
            <div className="print:hidden">
                <div className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.18em] mb-3">All Modules</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {MODULES.map(mod => {
                        const tagColor = mod.color;
                        return (
                            <Link key={mod.path} href={`/projects/${id}${mod.path}`} className="group block">
                                <div
                                    className="relative h-full flex flex-col p-6 rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer"
                                    style={{
                                        background: '#0d0d0d',
                                        borderColor: 'rgba(255,255,255,0.07)',
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLDivElement).style.borderColor = `${mod.color}55`;
                                        (e.currentTarget as HTMLDivElement).style.background = `${mod.color}08`;
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)';
                                        (e.currentTarget as HTMLDivElement).style.background = '#0d0d0d';
                                    }}
                                >
                                    {/* ambient glow corner */}
                                    <div className="absolute bottom-0 right-0 w-20 h-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none blur-2xl"
                                        style={{ background: mod.color }} />

                                    {/* Tag */}
                                    <div className="mb-5">
                                        <span
                                            className="text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-sm"
                                            style={{ color: mod.color, background: `${mod.color}18`, border: `1px solid ${mod.color}30` }}
                                        >
                                            {mod.tag}
                                        </span>
                                    </div>

                                    {/* Icon */}
                                    <div
                                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-5 transition-transform group-hover:scale-110"
                                        style={{ background: `${mod.color}18`, color: mod.color, border: `1px solid ${mod.color}30` }}
                                    >
                                        <i className={`fa-solid ${mod.icon}`} />
                                    </div>

                                    {/* Text */}
                                    <div className="flex-1">
                                        <div className="text-[14px] font-bold text-white leading-snug mb-1.5 group-hover:text-white transition-colors">{mod.label}</div>
                                        <div className="text-[11px] text-zinc-500 leading-snug">{mod.desc}</div>
                                    </div>

                                    {/* Arrow */}
                                    <div className="mt-5 flex justify-end">
                                        <span className="text-zinc-600 group-hover:text-zinc-300 transition-colors text-base">→</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 15mm; }
                    html, body, main { background: white !important; color: black !important; }
                    .print\\:hidden, nav, header, footer, button { display: none !important; }
                }
            `}</style>
        </div>
    );
}
