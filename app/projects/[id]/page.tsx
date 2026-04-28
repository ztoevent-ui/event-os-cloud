'use client';

import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { PrintReportButton } from '../components/ProjectModals';
import MeetingNotesPanel from '../components/MeetingNotesPanel';

const fmt = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

const MODULES = [
    { label: 'Tasks',          icon: 'fa-check-double',          path: '/tasks',          desc: 'Deliverables & board',        color: '#3b82f6', tag: 'EXEC' },
    { label: 'Timeline',       icon: 'fa-timeline',              path: '/timelines',      desc: 'Project milestones',          color: '#8b5cf6', tag: 'PLAN' },
    { label: 'Schedule',       icon: 'fa-calendar-days',         path: '/schedule',       desc: 'Day-of dispatch cues',        color: '#0056B3', tag: 'OPS'  },
    { label: 'Live Program',   icon: 'fa-list-ol',               path: '/program',        desc: 'Sequence & production cues',  color: '#10b981', tag: 'LIVE' },
    { label: 'Budget',         icon: 'fa-file-invoice-dollar',   path: '/budget',         desc: 'P&L & expense tracking',     color: '#DEFF9A', tag: 'FIN'  },
    { label: 'Vendors',        icon: 'fa-truck-fast',            path: '/vendors',        desc: 'Supplier contacts',           color: '#06b6d4', tag: 'OPS'  },
    { label: 'Venue Layout',   icon: 'fa-map',                   path: '/venue-layout',   desc: '2D floor plan',              color: '#ec4899', tag: 'SPACE'},
    { label: '3D Stage',       icon: 'fa-cube',                  path: '/stage-layout',   desc: 'Stage visualizer',           color: '#4da3ff', tag: 'SPACE'},
    { label: 'Registration',   icon: 'fa-id-card',               path: '/registration',   desc: 'Participant management',     color: '#a855f7', tag: 'REG'  },
    { label: 'Guests',         icon: 'fa-users',                 path: '/guests',         desc: 'Guest list & seating',       color: '#14b8a6', tag: 'REG'  },
];

export default function ProjectDashboard({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [project, setProject] = useState<any>(null);
    const [stats, setStats] = useState({ pending: 0, critical: 0, done: 0, expenses: 0, enquiries: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, [id]);

    const fetchData = async () => {
        setLoading(true);
        const { data: p } = await supabase.from('projects').select('*').eq('id', id).single();
        setProject(p);
        const [
            { count: pending },
            { count: critical },
            { count: done },
            { data: budgetItems },
            { count: enquiries }
        ] = await Promise.all([
            supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', id).neq('status', 'done'),
            supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', id).eq('priority', 'critical').neq('status', 'done'),
            supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', id).eq('status', 'done'),
            supabase.from('budgets').select('amount,type').eq('project_id', id),
            supabase.from('consulting_forms').select('*', { count: 'exact', head: true }).eq('project_id', id),
        ]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const exp = budgetItems?.filter((b: any) => b.type === 'expense').reduce((s: number, b: any) => s + Number(b.amount), 0) ?? 0;
        setStats({ pending: pending ?? 0, critical: critical ?? 0, done: done ?? 0, expenses: exp, enquiries: enquiries ?? 0 });
        setLoading(false);
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}>
            <div style={{
                width: 32, height: 32,
                border: '2px solid rgba(0,86,179,0.15)',
                borderTopColor: '#0056B3',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading...</span>
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    const today = new Date();
    const endDate = project?.end_date ? new Date(project.end_date) : null;
    const diffDays = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / 86400000) : null;
    const isEnded = diffDays != null && diffDays <= 0;
    const total = stats.pending + stats.done;
    const progress = total > 0 ? Math.round((stats.done / total) * 100) : 0;

    const kpis = [
        {
            label: 'Tactical Tasks',
            val: stats.pending,
            sub: stats.critical > 0 ? `${stats.critical} Critical` : 'All Clear',
            icon: 'fa-check-double',
            color: '#4da3ff',
            href: `/projects/${id}/tasks`,
        },
        {
            label: 'Treasury Flow',
            val: `RM ${stats.expenses.toLocaleString()}`,
            sub: 'Capital Allocated',
            icon: 'fa-receipt',
            color: '#DEFF9A',
            href: `/projects/${id}/budget`,
        },
        {
            label: 'Days Remaining',
            val: diffDays != null && !isEnded ? diffDays : isEnded ? '—' : 'TBD',
            sub: isEnded ? 'Mission Complete' : 'Cycle Time',
            icon: 'fa-hourglass-half',
            color: '#4da3ff',
            href: null,
        },
        {
            label: 'Enquiries',
            val: stats.enquiries,
            sub: 'Inbound Leads',
            icon: 'fa-envelope',
            color: '#a855f7',
            href: null,
        },
    ];

    return (
        <div className="page-transition" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

            {/* ── Hero Card ── */}
            <div className="zto-card" style={{ position: 'relative', overflow: 'hidden' }}>
                {/* Background glow */}
                <div style={{
                    position: 'absolute', top: -60, right: -60,
                    width: 300, height: 300,
                    background: '#0056B3', filter: 'blur(100px)', opacity: 0.08,
                    borderRadius: '50%', pointerEvents: 'none',
                }} />

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24, position: 'relative' }}>
                    <span className="zto-badge zto-badge-lime">
                        <span className="zto-pulse-dot lime" />
                        {project?.status || 'PLANNING'}
                    </span>
                    {project?.type === 'wedding' && (
                        <span className="zto-badge" style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.25)', color: '#ec4899' }}>
                            <i className="fa-solid fa-rings-wedding" style={{ fontSize: 8 }} /> Wedding
                        </span>
                    )}
                    {(project?.type === 'sports' || project?.type === 'tournament') && (
                        <span className="zto-badge zto-badge-blue">
                            <i className="fa-solid fa-trophy" style={{ fontSize: 8 }} /> Tournament
                        </span>
                    )}
                </div>

                <h1 style={{
                    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                    fontWeight: 800,
                    color: '#fff',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                    textTransform: 'uppercase',
                    marginBottom: 24,
                    position: 'relative',
                }}>
                    {project?.name || 'Untitled Project'}
                </h1>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, marginBottom: 32, position: 'relative' }}>
                    {project?.venue && (
                        <div>
                            <div className="zto-label" style={{ marginBottom: 4 }}>Location</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                                📍 {project.venue}
                            </div>
                        </div>
                    )}
                    <div>
                        <div className="zto-label" style={{ marginBottom: 4 }}>Execution Period</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                            {fmt(project?.start_date)} — {fmt(project?.end_date)}
                        </div>
                    </div>
                    {diffDays != null && !isEnded && (
                        <div>
                            <div className="zto-label" style={{ marginBottom: 4 }}>T-Minus</div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: '#DEFF9A', lineHeight: 1 }}>
                                {diffDays} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>DAYS</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                {total > 0 && (
                    <div style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                            <div className="zto-label">Operational Readiness</div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#DEFF9A' }}>{progress}% — {stats.done}/{total} Tasks</span>
                        </div>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${progress}%`,
                                background: 'linear-gradient(90deg, #0056B3, #4da3ff)',
                                borderRadius: 999,
                                boxShadow: '0 0 16px rgba(0,86,179,0.5)',
                                transition: 'width 1s ease-out',
                            }} />
                        </div>
                    </div>
                )}

                {/* Print button */}
                <div style={{ position: 'absolute', top: 48, right: 48 }}>
                    <PrintReportButton title="Project Summary" />
                </div>
            </div>

            {/* ── KPI Row ── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 16,
            }}>
                {kpis.map(card => {
                    const inner = (
                        <div className="zto-card zto-card-sm" key={card.label} style={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            cursor: card.href ? 'pointer' : 'default',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: card.color, boxShadow: `0 0 8px ${card.color}`, flexShrink: 0 }} />
                                <span className="zto-label">{card.label}</span>
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1, marginBottom: 6, letterSpacing: '-0.02em' }}>
                                {card.val}
                            </div>
                            <div className="zto-desc" style={{ fontSize: 11, marginTop: 'auto' }}>{card.sub}</div>
                        </div>
                    );
                    return card.href
                        ? <Link key={card.label} href={card.href} style={{ textDecoration: 'none' }}>{inner}</Link>
                        : <div key={card.label}>{inner}</div>;
                })}
            </div>

            {/* ── Meeting Notes ── */}
            <div>
                <MeetingNotesPanel project={project} />
            </div>

            {/* ── Mission Modules ── */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <h2 className="zto-label">Mission Command Center</h2>
                    <span style={{
                        fontSize: 9, fontWeight: 700,
                        background: 'rgba(0,86,179,0.1)', border: '1px solid rgba(0,86,179,0.25)',
                        color: '#6BB8FF', padding: '2px 8px', borderRadius: 999,
                    }}>{MODULES.length}</span>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 14,
                }}>
                    {MODULES.map(mod => (
                        <Link key={mod.path} href={`/projects/${id}${mod.path}`} style={{ textDecoration: 'none' }}>
                            <div className="zto-card zto-card-sm" style={{
                                display: 'flex', flexDirection: 'column', cursor: 'pointer',
                                height: '100%', transition: 'all 0.25s ease',
                            }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                                    (e.currentTarget as HTMLDivElement).style.borderColor = `${mod.color}50`;
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLDivElement).style.transform = '';
                                    (e.currentTarget as HTMLDivElement).style.borderColor = '';
                                }}
                            >
                                <div style={{
                                    width: 40, height: 40, borderRadius: 12,
                                    background: `${mod.color}10`,
                                    border: `1px solid ${mod.color}25`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 16, color: mod.color,
                                    marginBottom: 16,
                                }}>
                                    <i className={`fa-solid ${mod.icon}`} />
                                </div>

                                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{mod.label}</div>
                                <div className="zto-desc" style={{ fontSize: 11 }}>{mod.desc}</div>

                                <div style={{ marginTop: 'auto', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{
                                        fontSize: 8, fontWeight: 700,
                                        padding: '2px 7px', borderRadius: 999,
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        color: 'rgba(255,255,255,0.3)',
                                        textTransform: 'uppercase', letterSpacing: '0.1em',
                                    }}>
                                        {mod.tag}
                                    </span>
                                    <i className="fa-solid fa-chevron-right" style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }} />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { size: A4 portrait; margin: 15mm; }
                    html, body { background: white !important; color: black !important; }
                    .print\\:hidden, nav, header, footer, button { display: none !important; }
                }
            `}</style>
        </div>
    );
}
