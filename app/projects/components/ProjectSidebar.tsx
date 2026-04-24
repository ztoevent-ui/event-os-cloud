'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

    const allItems = isTournament
        ? [...NAV_ITEMS, { label: 'Tournament Page', path: '/registration#tournament', icon: 'fa-solid fa-globe' }]
        : NAV_ITEMS;

    return (
        <aside
            style={{
                width: 280,
                minWidth: 280,
                maxWidth: 280,
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                background: '#050505',
                borderRight: '1px solid rgba(0,86,179,0.25)',
                fontFamily: "'Urbanist', sans-serif",
                overflow: 'hidden',
                flexShrink: 0,
            }}
        >
            {/* ── Header: Logo ── */}
            <div style={{
                height: 72,
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                flexShrink: 0,
            }}>
                <Link href="/projects" style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1, textDecoration: 'none' }}>
                    <img
                        src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
                        alt="ZTO"
                        style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                    />
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: '0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        ZTO Event OS
                    </span>
                </Link>
            </div>

            {/* ── Project Context ── */}
            <div style={{
                padding: '20px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                flexShrink: 0,
            }}>
                <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(0,86,179,0.8)', marginBottom: 6 }}>
                    Project Detail
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 12 }}>
                    {projectName}
                </div>
                <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '4px 12px', borderRadius: 999,
                    border: '1px solid rgba(0,86,179,0.4)',
                    background: 'rgba(0,86,179,0.15)',
                    color: '#6BB8FF',
                    fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                    {projectStatus}
                </span>
            </div>

            {/* ── Nav Links ── */}
            <nav style={{ flex: 1, overflowY: 'auto', padding: '20px 12px' }}>
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
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 14,
                                padding: '12px 16px',
                                borderRadius: 12,
                                marginBottom: 4,
                                textDecoration: 'none',
                                transition: 'all 0.15s',
                                background: isActive ? '#0056B3' : 'transparent',
                                color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                                boxShadow: isActive ? '0 0 16px rgba(0,86,179,0.4)' : 'none',
                            }}
                            className={!isActive ? 'hover-nav-item' : ''}
                        >
                            <i className={`${item.icon}`} style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }} />
                            <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* ── Footer: Exit ── */}
            <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <Link
                    href="/projects"
                    style={{
                        display: 'flex', alignItems: 'center',
                        gap: 14,
                        padding: '12px 16px', borderRadius: 12,
                        textDecoration: 'none', transition: 'all 0.15s',
                        color: 'rgba(255,255,255,0.3)',
                    }}
                    className="hover-nav-exit"
                >
                    <i className="fa-solid fa-right-from-bracket" style={{ fontSize: 15, width: 20, textAlign: 'center' }} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Exit to Projects</span>
                </Link>
            </div>

            <style jsx>{`
                .hover-nav-item:hover {
                    background: rgba(255,255,255,0.05) !important;
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
