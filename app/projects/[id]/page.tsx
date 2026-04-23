'use client';

import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { PrintReportButton } from '../components/ProjectModals';

const fmt = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function ProjectDashboard({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<any>(null);
    const [stats, setStats] = useState<any>({ pendingTasks: 0, criticalTasks: 0, expenses: 0, consultations: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, [id]);

    const fetchData = async () => {
        setLoading(true);
        const { data: p } = await supabase.from('projects').select('*').eq('id', id).single();
        setProject(p);

        const [{ count: pending }, { count: critical }, { data: budgetItems }, { count: cons }] = await Promise.all([
            supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', id).neq('status', 'done'),
            supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', id).eq('priority', 'critical').neq('status', 'done'),
            supabase.from('budgets').select('amount,type').eq('project_id', id),
            supabase.from('consulting_forms').select('*', { count: 'exact', head: true }).eq('project_id', id),
        ]);

        const exp = budgetItems?.filter((b: any) => b.type === 'expense').reduce((s: number, b: any) => s + Number(b.amount), 0) ?? 0;
        setStats({ pendingTasks: pending ?? 0, criticalTasks: critical ?? 0, expenses: exp, consultations: cons ?? 0 });
        setLoading(false);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">
            <span className="animate-pulse">Loading project data…</span>
        </div>
    );

    const today = new Date();
    const endDate = project?.end_date ? new Date(project.end_date) : null;
    const diffDays = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / 86400000) : null;
    const daysLabel = diffDays == null ? 'TBD' : diffDays > 0 ? `${diffDays}` : 'Ended';
    const isEnded = diffDays != null && diffDays <= 0;

    const SHORTCUTS = [
        { label: 'Live Program', icon: 'fa-play', href: `/projects/${id}/program`, accent: '#0056B3' },
        { label: 'Schedule', icon: 'fa-list-check', href: `/projects/${id}/schedule`, accent: '#ffffff20' },
        { label: 'Timeline', icon: 'fa-calendar-days', href: `/projects/${id}/timelines`, accent: '#ffffff20' },
        { label: 'Budget', icon: 'fa-file-invoice-dollar', href: `/projects/${id}/budget`, accent: '#ffffff20' },
        { label: 'Tasks', icon: 'fa-check-double', href: `/projects/${id}/tasks`, accent: '#ffffff20' },
    ];

    return (
        <div className="space-y-6">

            {/* ── Project Header ─────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/[0.07] print:pb-3">
                <div className="min-w-0">
                    {/* status pill */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                            isEnded
                                ? 'text-zinc-500 border-zinc-700 bg-zinc-800/50'
                                : 'text-[#4da3ff] border-[#0056B3]/40 bg-[#0056B3]/10'
                        }`}>
                            {!isEnded && <span className="w-1.5 h-1.5 rounded-full bg-[#0056B3] animate-pulse" />}
                            {project?.status || 'PLANNING'}
                        </span>
                        <span className="text-zinc-600 text-xs">
                            {project?.type?.replace(/_/g, ' ')}
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none break-words print:text-black">
                        {project?.name || 'Untitled Project'}
                    </h1>
                    {(project?.start_date || project?.end_date) && (
                        <p className="text-xs text-zinc-500 mt-2 font-mono">
                            {fmt(project?.start_date)} → {fmt(project?.end_date)}
                            {project?.venue && <span className="ml-3">📍 {project.venue}</span>}
                        </p>
                    )}
                </div>
                <div className="shrink-0 text-right print:hidden">
                    <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-0.5">Countdown</div>
                    <div className={`text-4xl font-black tabular-nums tracking-tighter ${isEnded ? 'text-zinc-600' : 'text-white'}`}>
                        {daysLabel}
                        {!isEnded && diffDays != null && <span className="text-sm font-bold text-zinc-500 ml-1">days</span>}
                    </div>
                    <PrintReportButton title="Project Summary" />
                </div>
            </div>

            {/* ── Stat Cards ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: 'Pending Tasks', value: stats.pendingTasks, sub: `${stats.criticalTasks} critical`, icon: 'fa-check-double', color: '#0056B3' },
                    { label: 'Total Spend', value: `RM ${stats.expenses.toLocaleString()}`, sub: 'expenses logged', icon: 'fa-receipt', color: '#10b981' },
                    { label: 'Days Left', value: daysLabel, sub: isEnded ? 'event ended' : 'until event', icon: 'fa-clock', color: isEnded ? '#666' : '#f59e0b' },
                    { label: 'Enquiries', value: stats.consultations, sub: 'received', icon: 'fa-envelope', color: '#a855f7' },
                ].map(card => (
                    <div key={card.label} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 print:bg-white print:border-zinc-200">
                        <div className="flex items-center justify-between mb-3">
                            <i className={`fa-solid ${card.icon} text-sm`} style={{ color: card.color }} />
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{card.label}</span>
                        </div>
                        <div className="text-2xl font-black text-white tabular-nums leading-none print:text-black">{card.value}</div>
                        <div className="text-[11px] text-zinc-600 mt-1">{card.sub}</div>
                    </div>
                ))}
            </div>

            {/* ── Quick Access ───────────────────────────────────────── */}
            <div className="print:hidden">
                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Quick Access</div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {SHORTCUTS.map((s, i) => (
                        <Link key={s.href} href={s.href}>
                            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-95 ${
                                i === 0
                                    ? 'bg-[#0056B3] border-[#0056B3]/80 text-white hover:bg-[#0047a0]'
                                    : 'bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                            }`}>
                                <i className={`fa-solid ${s.icon} text-sm`} />
                                <span className="text-[13px] font-semibold">{s.label}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── Module Grid ────────────────────────────────────────── */}
            <div className="print:hidden">
                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">All Modules</div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {[
                        { label: 'Tasks', icon: 'fa-check-double', href: `/projects/${id}/tasks`, desc: 'Manage deliverables' },
                        { label: 'Timeline', icon: 'fa-timeline', href: `/projects/${id}/timelines`, desc: 'Project milestones' },
                        { label: 'Schedule', icon: 'fa-calendar-days', href: `/projects/${id}/schedule`, desc: 'Day-of dispatch' },
                        { label: 'Live Program', icon: 'fa-list-ol', href: `/projects/${id}/program`, desc: 'Sequence & cues' },
                        { label: 'Budget', icon: 'fa-file-invoice-dollar', href: `/projects/${id}/budget`, desc: 'P&L tracking' },
                        { label: 'Vendors', icon: 'fa-truck-fast', href: `/projects/${id}/vendors`, desc: 'Supplier contacts' },
                        { label: 'Venue Layout', icon: 'fa-map', href: `/projects/${id}/venue-layout`, desc: '2D floor plan' },
                        { label: '3D Stage', icon: 'fa-cube', href: `/projects/${id}/stage-layout`, desc: '3D visualizer' },
                        { label: 'Registration', icon: 'fa-id-card', href: `/projects/${id}/registration`, desc: 'Participants' },
                        { label: 'Guests', icon: 'fa-users', href: `/projects/${id}/guests`, desc: 'Guest list' },
                    ].map(mod => (
                        <Link key={mod.href} href={mod.href}>
                            <div className="group flex items-start gap-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-[#0056B3]/40 rounded-xl p-3.5 transition-all">
                                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-[#4da3ff] group-hover:bg-[#0056B3]/10 group-hover:border-[#0056B3]/30 transition-all shrink-0">
                                    <i className={`fa-solid ${mod.icon} text-sm`} />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[13px] font-semibold text-zinc-200 group-hover:text-white leading-none mb-0.5">{mod.label}</div>
                                    <div className="text-[11px] text-zinc-600">{mod.desc}</div>
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
