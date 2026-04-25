'use client';

import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { PrintReportButton } from '../components/ProjectModals';
import MeetingNotesPanel from '../components/MeetingNotesPanel';

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
        <div className="flex flex-col gap-12 animate-in fade-in duration-700">
            {/* ── Strategic Hero Section ── */}
            <div className="relative rounded-[40px] border border-white/5 bg-white/[0.02] overflow-hidden p-10 lg:p-14 group">
                {/* Ambient Strategic Glow */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0056B3]/10 rounded-full blur-[120px] pointer-events-none group-hover:bg-[#0056B3]/15 transition-all duration-1000" />
                <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-white/[0.02] rounded-full blur-[80px] pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black tracking-[0.2em] text-white uppercase">
                                {project?.status || 'PLANNING'}
                            </span>
                            {isTournament && (
                                <span className="px-3 py-1 bg-[#0056B3]/10 border border-[#0056B3]/20 text-[#4da3ff] rounded-full text-[9px] font-black tracking-[0.2em] uppercase flex items-center gap-2">
                                    <i className="fa-solid fa-trophy text-[8px]" /> Tournament
                                </span>
                            )}
                            {project?.type === 'wedding' && (
                                <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full text-[9px] font-black tracking-[0.2em] uppercase flex items-center gap-2">
                                    <i className="fa-solid fa-rings-wedding text-[8px]" /> Wedding
                                </span>
                            )}
                        </div>
                        
                        <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-none mb-8 font-['Urbanist'] uppercase">
                            {project?.name || 'Untitled Project'}
                        </h1>

                        <div className="flex flex-wrap gap-8">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1">Location</span>
                                <span className="text-sm font-bold text-zinc-300">📍 {project?.venue || 'Virtual HQ'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1">Execution Period</span>
                                <span className="text-sm font-bold text-zinc-300">
                                    {fmt(project?.start_date)} — {fmt(project?.end_date)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Mission Countdown */}
                    <div className="shrink-0 flex items-center gap-10 bg-zinc-900 border border-white/5 p-8 rounded-[32px] shadow-2xl relative overflow-hidden group/countdown">
                        <div className="absolute inset-0 bg-[#0056B3]/[0.02] opacity-0 group-hover/countdown:opacity-100 transition-opacity" />
                        
                        {diffDays != null && !isEnded && (
                            <div className="text-right relative z-10">
                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-2">Operation T-Minus</p>
                                <div className="text-7xl font-black text-white tabular-nums leading-none tracking-tighter font-['Urbanist']">
                                    {diffDays}
                                </div>
                                <p className="text-[10px] font-black text-[#4da3ff] uppercase tracking-[0.3em] mt-2">Days Remaining</p>
                            </div>
                        )}
                        {isEnded && (
                            <div className="text-right relative z-10">
                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-2">Operation Status</p>
                                <div className="text-4xl font-black text-white uppercase tracking-tighter font-['Urbanist']">Complete</div>
                            </div>
                        )}
                        <div className="w-px h-20 bg-white/5 mx-2 relative z-10" />
                        <div className="relative z-10">
                            <PrintReportButton title="Project Summary" />
                        </div>
                    </div>
                </div>

                {/* Integration Progress */}
                {total > 0 && (
                    <div className="mt-12 pt-10 border-t border-white/5 relative z-10">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1">Operational Readiness</p>
                                <p className="text-2xl font-black text-white uppercase tracking-tight font-['Urbanist']">
                                    {progress}% Consolidated
                                </p>
                            </div>
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                                {stats.done} / {total} Units
                            </span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-[#0056B3] to-[#4da3ff] rounded-full shadow-[0_0_20px_rgba(0,86,179,0.5)] transition-all duration-1000 ease-out" 
                                style={{ width: `${progress}%` }} 
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* ── Key Performance Indicators ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Tactical Tasks', val: stats.pending, sub: stats.critical > 0 ? `${stats.critical} Critical Alerts` : 'Zero Impediments', icon: 'fa-check-double', color: '#4da3ff', href: `/projects/${id}/tasks` },
                    { label: 'Treasury Flow', val: `RM ${stats.expenses.toLocaleString()}`, sub: 'Capital Allocated', icon: 'fa-receipt', color: '#DEFF9A', href: `/projects/${id}/budget` },
                    { label: 'Strategic Delta', val: diffDays != null && !isEnded ? diffDays : isEnded ? '—' : 'TBD', sub: isEnded ? 'Mission Complete' : 'Cycle Time Remaining', icon: 'fa-hourglass-half', color: '#f59e0b', href: null },
                    { label: 'Network Enquiries', val: stats.enquiries, sub: 'Inbound Interest', icon: 'fa-envelope', color: '#a855f7', href: null },
                ].map(card => {
                    const content = (
                        <div className="bg-white/[0.03] border border-white/5 rounded-[32px] p-8 hover:border-[#0056B3]/40 transition-all group h-full relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                                <i className={`fa-solid ${card.icon} text-6xl`} />
                            </div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-2 h-2 rounded-full shadow-[0_0_10px_rgba(0,86,179,0.5)]" style={{ background: card.color }} />
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">{card.label}</span>
                            </div>
                            <div className="text-4xl font-black text-white tabular-nums tracking-tighter font-['Urbanist'] mb-2">{card.val}</div>
                            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{card.sub}</div>
                        </div>
                    );
                    return card.href 
                        ? <Link key={card.label} href={card.href} className="block">{content}</Link>
                        : <div key={card.label}>{content}</div>;
                })}
            </div>

            {/* ── Meeting Notes & Logs ── */}
            <div className="w-full">
                <MeetingNotesPanel project={project} />
            </div>

            {/* ── Mission Modules ── */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Mission Command Center</h2>
                    <span className="text-[9px] font-black bg-white/5 text-zinc-600 px-3 py-1 rounded-full border border-white/5 font-mono">
                        {MODULES.length}
                    </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {MODULES.map(mod => (
                        <Link key={mod.path} href={`/projects/${id}${mod.path}`} className="group">
                            <div className="relative h-full flex flex-col p-8 rounded-[32px] border border-white/5 bg-white/[0.03] transition-all duration-300 hover:border-[#0056B3]/60 hover:bg-[#0056B3]/[0.03] overflow-hidden">
                                {/* Strategic Overlay */}
                                <div className="absolute top-0 right-0 w-24 h-24 bg-[#0056B3]/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="mb-6 flex justify-between items-start">
                                    <div className="w-12 h-12 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center text-xl text-[#0056B3] group-hover:text-[#4da3ff] group-hover:scale-110 transition-all shadow-[0_0_20px_rgba(0,86,179,0.1)]">
                                        <i className={`fa-solid ${mod.icon}`} />
                                    </div>
                                    <span className="text-[8px] font-black px-2 py-0.5 bg-white/5 text-zinc-600 rounded border border-white/5 uppercase tracking-widest group-hover:text-zinc-400 group-hover:border-white/10 transition-colors">
                                        {mod.tag}
                                    </span>
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-sm font-black text-white uppercase tracking-tight font-['Urbanist'] mb-2 group-hover:text-[#4da3ff] transition-colors leading-tight">
                                        {mod.label}
                                    </h3>
                                    <p className="text-[10px] font-bold text-zinc-600 leading-relaxed group-hover:text-zinc-400 transition-colors uppercase tracking-widest">
                                        {mod.desc}
                                    </p>
                                </div>

                                <div className="mt-8 flex justify-end">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-700 group-hover:text-[#4da3ff] group-hover:bg-[#0056B3]/10 transition-all">
                                        <i className="fa-solid fa-chevron-right text-[10px]" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { size: A4 portrait; margin: 15mm; }
                    html, body, main { background: white !important; color: black !important; }
                    .print\\:hidden, nav, header, footer, button { display: none !important; }
                    .bg-white\\/\\[0\\.03\\], .bg-white\\/\\[0\\.02\\] { background: transparent !important; border: 1px solid #eee !important; border-radius: 12px !important; }
                    .text-white, .text-zinc-500, .text-zinc-600 { color: black !important; }
                }
            `}</style>
        </div>
    );
}
