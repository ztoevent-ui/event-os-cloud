'use client';

import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { PrintReportButton } from '../components/ProjectModals';

const fmt = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

export default function ProjectDashboard({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<any>(null);
    const [stats, setStats] = useState({ pendingTasks: 0, criticalTasks: 0, doneTasks: 0, expenses: 0, consultations: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, [id]);

    const fetchData = async () => {
        setLoading(true);
        const { data: p } = await supabase.from('projects').select('*').eq('id', id).single();
        setProject(p);
        const [{ count: pending }, { count: critical }, { count: done }, { data: budgetItems }, { count: cons }] = await Promise.all([
            supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', id).neq('status', 'done'),
            supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', id).eq('priority', 'critical').neq('status', 'done'),
            supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', id).eq('status', 'done'),
            supabase.from('budgets').select('amount,type').eq('project_id', id),
            supabase.from('consulting_forms').select('*', { count: 'exact', head: true }).eq('project_id', id),
        ]);
        const exp = budgetItems?.filter((b: any) => b.type === 'expense').reduce((s: number, b: any) => s + Number(b.amount), 0) ?? 0;
        setStats({ pendingTasks: pending ?? 0, criticalTasks: critical ?? 0, doneTasks: done ?? 0, expenses: exp, consultations: cons ?? 0 });
        setLoading(false);
    };

    if (loading) return (
        <div className="flex items-center gap-3 justify-center h-52 text-zinc-600 text-sm">
            <span className="w-4 h-4 rounded-full border-2 border-zinc-700 border-t-[#0056B3] animate-spin" />
            Loading…
        </div>
    );

    const today = new Date();
    const endDate = project?.end_date ? new Date(project.end_date) : null;
    const diffMs = endDate ? endDate.getTime() - today.getTime() : null;
    const diffDays = diffMs != null ? Math.ceil(diffMs / 86400000) : null;
    const isEnded = diffDays != null && diffDays <= 0;
    const daysNum = diffDays != null && !isEnded ? diffDays : null;

    const totalTasks = stats.pendingTasks + stats.doneTasks;
    const doneRatio = totalTasks > 0 ? Math.round((stats.doneTasks / totalTasks) * 100) : 0;

    const MODULES = [
        { label: 'Tasks', icon: 'fa-check-double', href: `/projects/${id}/tasks`, desc: 'Deliverables & board', color: '#3b82f6' },
        { label: 'Timeline', icon: 'fa-timeline', href: `/projects/${id}/timelines`, desc: 'Milestones', color: '#8b5cf6' },
        { label: 'Schedule', icon: 'fa-calendar-days', href: `/projects/${id}/schedule`, desc: 'Day-of dispatch', color: '#0056B3' },
        { label: 'Live Program', icon: 'fa-list-ol', href: `/projects/${id}/program`, desc: 'Sequence & cues', color: '#10b981' },
        { label: 'Budget', icon: 'fa-file-invoice-dollar', href: `/projects/${id}/budget`, desc: 'P&L tracking', color: '#f59e0b' },
        { label: 'Vendors', icon: 'fa-truck-fast', href: `/projects/${id}/vendors`, desc: 'Supplier contacts', color: '#06b6d4' },
        { label: 'Venue Layout', icon: 'fa-map', href: `/projects/${id}/venue-layout`, desc: '2D floor plan', color: '#ec4899' },
        { label: '3D Stage', icon: 'fa-cube', href: `/projects/${id}/stage-layout`, desc: 'Stage visualizer', color: '#f97316' },
        { label: 'Registration', icon: 'fa-id-card', href: `/projects/${id}/registration`, desc: 'Participants', color: '#a855f7' },
        { label: 'Guests', icon: 'fa-users', href: `/projects/${id}/guests`, desc: 'Guest list', color: '#14b8a6' },
    ];

    return (
        <div className="space-y-7">

            {/* ── HERO ─────────────────────────────────────────────────── */}
            <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0d0d0d] print:bg-white print:border-zinc-200">
                {/* Ambient glow */}
                <div className="absolute top-0 left-1/4 w-96 h-40 bg-[#0056B3]/20 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-64 h-32 bg-[#0056B3]/10 rounded-full blur-[60px] pointer-events-none" />

                <div className="relative z-10 p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        {/* Left: project info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full border ${
                                    isEnded
                                        ? 'text-zinc-500 border-zinc-700 bg-zinc-800/60'
                                        : 'text-[#4da3ff] border-[#0056B3]/50 bg-[#0056B3]/10'
                                }`}>
                                    {!isEnded && <span className="w-1.5 h-1.5 rounded-full bg-[#4da3ff] animate-pulse" />}
                                    {project?.status || 'PLANNING'}
                                </span>
                                {project?.type && (
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 px-2 py-1 bg-white/[0.04] rounded-full border border-white/[0.06]">
                                        {project.type.replace(/_/g, ' ')}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight break-words mb-2 print:text-black">
                                {project?.name || 'Untitled Project'}
                            </h1>

                            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 font-mono">
                                {project?.start_date && <span>Start: <span className="text-zinc-300">{fmt(project.start_date)}</span></span>}
                                {project?.end_date && <span>End: <span className="text-zinc-300">{fmt(project.end_date)}</span></span>}
                                {project?.venue && <span>📍 <span className="text-zinc-300">{project.venue}</span></span>}
                            </div>
                        </div>

                        {/* Right: countdown + print btn */}
                        <div className="shrink-0 flex items-start gap-4 print:hidden">
                            {daysNum != null ? (
                                <div className="text-right">
                                    <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">T-Minus</div>
                                    <div className="text-5xl font-black tabular-nums text-white leading-none">{daysNum}</div>
                                    <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">days</div>
                                </div>
                            ) : isEnded ? (
                                <div className="text-right">
                                    <div className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mb-1">Status</div>
                                    <div className="text-lg font-black text-zinc-600">Ended</div>
                                </div>
                            ) : null}
                            <PrintReportButton title="Project Summary" />
                        </div>
                    </div>

                    {/* Progress bar */}
                    {totalTasks > 0 && (
                        <div className="mt-5 print:hidden">
                            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-widest">
                                <span>Task Progress</span>
                                <span className="text-zinc-300">{stats.doneTasks}/{totalTasks} done ({doneRatio}%)</span>
                            </div>
                            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#0056B3] rounded-full transition-all duration-700"
                                    style={{ width: `${doneRatio}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── STAT CARDS ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    {
                        label: 'Pending Tasks', value: stats.pendingTasks,
                        sub: stats.criticalTasks > 0 ? `${stats.criticalTasks} critical` : 'all clear',
                        icon: 'fa-check-double', iconColor: '#3b82f6',
                        href: `/projects/${id}/tasks`
                    },
                    {
                        label: 'Total Spend', value: `RM ${stats.expenses.toLocaleString()}`,
                        sub: 'expenses logged',
                        icon: 'fa-receipt', iconColor: '#10b981',
                        href: `/projects/${id}/budget`
                    },
                    {
                        label: 'Days Left', value: daysNum ?? (isEnded ? '—' : 'TBD'),
                        sub: isEnded ? 'event completed' : daysNum != null ? 'until event day' : 'date not set',
                        icon: 'fa-hourglass-half', iconColor: isEnded ? '#555' : '#f59e0b',
                        href: null
                    },
                    {
                        label: 'Enquiries', value: stats.consultations,
                        sub: 'forms received',
                        icon: 'fa-envelope', iconColor: '#a855f7',
                        href: null
                    },
                ].map(card => {
                    const inner = (
                        <div className="group bg-[#0d0d0d] border border-white/[0.07] rounded-2xl p-4 hover:border-white/[0.14] transition-all print:bg-white print:border-zinc-200 h-full">
                            <div className="flex items-center justify-between mb-3">
                                <i className={`fa-solid ${card.icon} text-sm`} style={{ color: card.iconColor }} />
                                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{card.label}</span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-black text-white tabular-nums leading-none print:text-black">{card.value}</div>
                            <div className="text-[11px] text-zinc-600 mt-1.5">{card.sub}</div>
                        </div>
                    );
                    return card.href ? (
                        <Link key={card.label} href={card.href} className="block h-full">{inner}</Link>
                    ) : (
                        <div key={card.label} className="h-full">{inner}</div>
                    );
                })}
            </div>

            {/* ── QUICK LAUNCH ───────────────────────────────────────── */}
            <div className="print:hidden">
                <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.18em] mb-3">Quick Launch</p>
                <div className="flex flex-wrap gap-2">
                    {[
                        { label: 'Live Program', icon: 'fa-play', href: `/projects/${id}/program`, primary: true },
                        { label: 'Schedule', icon: 'fa-list-check', href: `/projects/${id}/schedule`, primary: false },
                        { label: 'Tasks', icon: 'fa-check-double', href: `/projects/${id}/tasks`, primary: false },
                        { label: 'Timeline', icon: 'fa-timeline', href: `/projects/${id}/timelines`, primary: false },
                        { label: 'Budget', icon: 'fa-file-invoice-dollar', href: `/projects/${id}/budget`, primary: false },
                    ].map(btn => (
                        <Link key={btn.href} href={btn.href}>
                            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                                btn.primary
                                    ? 'bg-[#0056B3] border-[#0056B3]/80 text-white hover:bg-[#0047a0] shadow-[0_0_16px_rgba(0,86,179,0.35)]'
                                    : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.16]'
                            }`}>
                                <i className={`fa-solid ${btn.icon} text-xs`} />
                                {btn.label}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── MODULES GRID ───────────────────────────────────────── */}
            <div className="print:hidden">
                <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.18em] mb-3">All Modules</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {MODULES.map(mod => (
                        <Link key={mod.href} href={mod.href} className="group">
                            <div className="flex flex-col gap-2 bg-[#0d0d0d] hover:bg-[#141414] border border-white/[0.06] hover:border-white/[0.14] rounded-xl p-4 transition-all h-full">
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all"
                                    style={{ background: `${mod.color}18`, color: mod.color, border: `1px solid ${mod.color}30` }}
                                >
                                    <i className={`fa-solid ${mod.icon}`} />
                                </div>
                                <div>
                                    <div className="text-[13px] font-semibold text-zinc-200 group-hover:text-white leading-none mb-0.5 transition-colors">{mod.label}</div>
                                    <div className="text-[11px] text-zinc-700">{mod.desc}</div>
                                </div>
                            </div>
                        </Link>
                    ))}
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
