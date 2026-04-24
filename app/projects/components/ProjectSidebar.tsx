'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
    { label: 'Dashboard',          path: '',                    icon: 'fa-solid fa-chart-line' },
    { label: 'Tasks',              path: '/tasks',              icon: 'fa-solid fa-list-check' },
    { label: 'Timeline',           path: '/timelines',          icon: 'fa-solid fa-clock' },
    { label: 'Schedule',           path: '/schedule',           icon: 'fa-solid fa-calendar-days' },
    { label: 'Tentative Program',  path: '/program',            icon: 'fa-solid fa-clipboard-list' },
    { label: 'Budget',             path: '/budget',             icon: 'fa-solid fa-wallet' },
    { label: 'Vendors',            path: '/vendors',            icon: 'fa-solid fa-truck-fast' },
    { label: 'Venue',              path: '/venue-layout',       icon: 'fa-solid fa-map-location-dot' },
    { label: '3D Stage',           path: '/stage-layout',       icon: 'fa-solid fa-cube' },
    { label: 'Registration',       path: '/registration',       icon: 'fa-solid fa-users' },
];

export default function ProjectSidebar({
    projectId,
    projectName,
    projectStatus,
    isTournament,
}: {
    projectId: string;
    projectName: string;
    projectStatus: string;
    isTournament: boolean;
}) {
    const pathname = usePathname();
    const base = `/projects/${projectId}`;
    const [collapsed, setCollapsed] = useState(false);

    const allItems = isTournament
        ? [...NAV_ITEMS, { label: 'Tournament Page', path: '/registration#tournament', icon: 'fa-solid fa-globe' }]
        : NAV_ITEMS;

    const sidebarWidth = collapsed ? 72 : 256;

    return (
        /*
          The sidebar is a plain block element.
          Its parent in layout.tsx is a flex container,
          so it participates in normal flow — no absolute/relative tricks.
        */
        <aside
            style={{
                width: sidebarWidth,
                minWidth: sidebarWidth,
                maxWidth: sidebarWidth,
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                background: '#050505',
                borderRight: '1px solid rgba(0,86,179,0.25)',
                transition: 'width 0.25s ease, min-width 0.25s ease, max-width 0.25s ease',
                fontFamily: "'Urbanist', sans-serif",
                overflow: 'hidden',
            }}
        >
            {/* ── Header: Logo + Collapse ── */}
            <div style={{
                height: 72,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: collapsed ? '0 16px' : '0 20px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                flexShrink: 0,
            }}>
                <Link href="/projects" style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1, textDecoration: 'none' }}>
                    <img
                        src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
                        alt="ZTO"
                        style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                    />
                    {!collapsed && (
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: '0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            ZTO Event OS
                        </span>
                    )}
                </Link>

                {/* Collapse button — inline-block, NO absolute positioning */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(0,86,179,0.3)',
                        color: 'rgba(255,255,255,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', flexShrink: 0, marginLeft: collapsed ? 'auto' : 8,
                        transition: 'all 0.2s',
                    }}
                >
                    <i className={`fa-solid ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`} style={{ fontSize: 9 }} />
                </button>
            </div>

            {/* ── Project Context ── */}
            {!collapsed && (
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    flexShrink: 0,
                }}>
                    <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>
                        Current Project
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 8 }}>
                        {projectName}
                    </div>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '3px 10px', borderRadius: 999,
                        border: '1px solid rgba(0,86,179,0.35)',
                        background: 'rgba(0,86,179,0.12)',
                        color: '#6BB8FF',
                        fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
                    }}>
                        {projectStatus}
                    </span>
                </div>
            )}

            {/* ── Nav Links ── */}
            <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 10px' }}>
                {allItems.map(item => {
                    const href = `${base}${item.path}`;
                    const exactPath = href.split('#')[0];
                    const isActive = item.path === ''
                        ? pathname === base
                        : pathname.startsWith(exactPath) && exactPath !== base;

                    return (
                        <Link
                            key={href}
                            href={href}
                            title={collapsed ? item.label : undefined}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: collapsed ? 0 : 12,
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                padding: '10px 12px',
                                borderRadius: 10,
                                marginBottom: 2,
                                textDecoration: 'none',
                                transition: 'all 0.15s',
                                background: isActive ? '#0056B3' : 'transparent',
                                color: isActive ? '#fff' : 'rgba(255,255,255,0.38)',
                                boxShadow: isActive ? '0 0 16px rgba(0,86,179,0.35)' : 'none',
                            }}
                            className={!isActive ? 'hover-nav-item' : ''}
                        >
                            <i className={`${item.icon}`} style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }} />
                            {!collapsed && (
                                <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    {item.label}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* ── Footer: Exit ── */}
            <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <Link
                    href="/projects"
                    title={collapsed ? 'Exit to Projects' : undefined}
                    style={{
                        display: 'flex', alignItems: 'center',
                        gap: collapsed ? 0 : 12,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        padding: '10px 12px', borderRadius: 10,
                        textDecoration: 'none', transition: 'all 0.15s',
                        color: 'rgba(255,255,255,0.25)',
                    }}
                    className="hover-nav-exit"
                >
                    <i className="fa-solid fa-right-from-bracket" style={{ fontSize: 14, width: 18, textAlign: 'center' }} />
                    {!collapsed && <span style={{ fontSize: 13, fontWeight: 600 }}>Exit to Projects</span>}
                </Link>
            </div>

            <style jsx>{`
                .hover-nav-item:hover {
                    background: rgba(255,255,255,0.04) !important;
                    color: #fff !important;
                }
                .hover-nav-exit:hover {
                    background: rgba(239,68,68,0.1) !important;
                    color: #f87171 !important;
                }
            `}</style>
        </aside>
    );
}
