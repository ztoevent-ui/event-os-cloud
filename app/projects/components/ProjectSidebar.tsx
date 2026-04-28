'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
    { label: 'Dashboard',         path: '',               icon: 'fa-solid fa-chart-line' },
    { label: 'Tasks',             path: '/tasks',         icon: 'fa-solid fa-list-check' },
    { label: 'Timeline',          path: '/timelines',     icon: 'fa-solid fa-clock' },
    { label: 'Schedule',          path: '/schedule',      icon: 'fa-solid fa-calendar-days' },
    { label: 'Tentative Program', path: '/program',       icon: 'fa-solid fa-clipboard-list' },
    { label: 'Budget',            path: '/budget',        icon: 'fa-solid fa-wallet' },
    { label: 'Vendors',           path: '/vendors',       icon: 'fa-solid fa-truck-fast' },
    { label: 'Venue',             path: '/venue-layout',  icon: 'fa-solid fa-map-location-dot' },
    { label: '3D Stage',          path: '/stage-layout',  icon: 'fa-solid fa-cube' },
    { label: 'Registration',      path: '/registration',  icon: 'fa-solid fa-users' },
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
        <aside className="zto-sidebar print:hidden">
            {/* ── Logo Header ── */}
            <div style={{
                height: 68,
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                flexShrink: 0,
                gap: 12,
            }}>
                <Link
                    href="/projects"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', flex: 1, minWidth: 0 }}
                >
                    <img
                        src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
                        alt="ZTO"
                        style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                    />
                    <span style={{
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 15,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
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
                <div className="zto-label" style={{ marginBottom: 8 }}>
                    Current Project
                </div>
                <div style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: 10,
                }}>
                    {projectName}
                </div>
                <span className="zto-badge zto-badge-lime">
                    <span className="zto-pulse-dot lime" />
                    {projectStatus}
                </span>
            </div>

            {/* ── Nav ── */}
            <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
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
                            className={`zto-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <i className={`${item.icon} zto-nav-icon`} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* ── Footer ── */}
            <div style={{
                padding: '12px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                flexShrink: 0,
            }}>
                <Link href="/projects" className="zto-nav-item" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    <i className="fa-solid fa-arrow-left zto-nav-icon" />
                    <span>Exit to Projects</span>
                </Link>
                <Link href="/dashboard" className="zto-nav-item" style={{ color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
                    <i className="fa-solid fa-house-chimney zto-nav-icon" />
                    <span>Master Console</span>
                </Link>
            </div>
        </aside>
    );
}
