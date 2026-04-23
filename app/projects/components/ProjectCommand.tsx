'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SIDEBAR_LINKS = [
    { label: 'Dashboard', icon: 'fa-table-columns', path: '' },
    { label: 'Tasks', icon: 'fa-check-double', path: '/tasks' },
    { label: 'Timeline', icon: 'fa-timeline', path: '/timelines' },
    { label: 'Schedule', icon: 'fa-calendar-days', path: '/schedule' },
    { label: 'Program', icon: 'fa-list-ol', path: '/program' },
    { label: 'Budget', icon: 'fa-file-invoice-dollar', path: '/budget' },
    { label: 'Vendors', icon: 'fa-truck-fast', path: '/vendors' },
    { label: 'Venue Layout', icon: 'fa-map', path: '/venue-layout' },
    { label: '3D Layout', icon: 'fa-cube', path: '/stage-layout' },
    { label: 'Registration', icon: 'fa-id-card', path: '/registration' },
];

export default function ProjectCommand({
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
    const [expanded, setExpanded] = useState(false);
    const pathname = usePathname();

    const links = SIDEBAR_LINKS.map(l => ({
        ...l,
        href: `/projects/${projectId}${l.path}`,
    }));

    if (isTournament) {
        links.push({
            label: 'Tournament Page',
            icon: 'fa-globe',
            path: '/registration#tournament',
            href: `/projects/${projectId}/registration#tournament`,
        });
    }

    const statusColor =
        projectStatus?.toLowerCase() === 'completed' || projectStatus?.toLowerCase() === 'ended'
            ? 'text-zinc-400 bg-zinc-800/60 border-zinc-700/50'
            : 'text-[#4da3ff] bg-[#0056B3]/15 border-[#0056B3]/35 shadow-[0_0_12px_rgba(0,86,179,0.25)]';

    return (
        <>
            {/* ── Top Bar ───────────────────────────────────────────────── */}
            <nav className="print:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[#050505]/90 backdrop-blur-md border-b border-[#1a1a1a] flex items-center px-4 gap-4">
                {/* back arrow */}
                <Link
                    href="/projects"
                    className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/6 border border-transparent hover:border-[#2a2a2a] transition-all shrink-0"
                >
                    <i className="fa-solid fa-arrow-left text-sm" />
                </Link>

                {/* divider */}
                <div className="h-5 w-px bg-[#2a2a2a] shrink-0" />

                {/* project name */}
                <h1 className="text-sm font-bold text-white tracking-wide truncate flex-1 min-w-0">
                    {projectName || 'Project'}
                </h1>

                {/* status pill */}
                <span className={`shrink-0 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] rounded-full border ${statusColor} transition-all`}>
                    {/* pulse dot for active */}
                    {projectStatus?.toLowerCase() !== 'completed' && projectStatus?.toLowerCase() !== 'ended' && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#0056B3] mr-1.5 animate-pulse" />
                    )}
                    {projectStatus || 'PLANNING'}
                </span>

                {/* avatar placeholder */}
                <div className="w-7 h-7 rounded-full bg-[#0056B3]/20 border border-[#0056B3]/30 flex items-center justify-center text-[#4da3ff] text-[10px] font-black shrink-0">
                    ZTO
                </div>
            </nav>

            {/* ── Sidebar ───────────────────────────────────────────────── */}
            <aside
                onMouseEnter={() => setExpanded(true)}
                onMouseLeave={() => setExpanded(false)}
                className={`print:hidden fixed left-0 top-14 bottom-0 z-30 flex flex-col bg-[#060606]/95 backdrop-blur-xl border-r border-[#1a1a1a] transition-[width] duration-200 ease-in-out overflow-hidden ${expanded ? 'w-52' : 'w-14'}`}
            >
                {/* nav items */}
                <div className="flex-1 py-3 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
                    {links.map((link) => {
                        const exactPath = link.href.split('#')[0];
                        const basePath = `/projects/${projectId}`;
                        const isActive =
                            link.path === ''
                                ? pathname === basePath
                                : pathname.startsWith(exactPath) && exactPath !== basePath;

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                title={!expanded ? link.label : undefined}
                                className={`group relative flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                                    isActive
                                        ? 'bg-[#0056B3] text-white shadow-[0_0_18px_rgba(0,86,179,0.35)]'
                                        : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200'
                                }`}
                            >
                                {/* active indicator bar */}
                                {isActive && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r-full" />
                                )}
                                <i className={`fa-solid ${link.icon} text-sm w-4 text-center shrink-0`} />
                                <span className={`text-sm font-semibold whitespace-nowrap transition-opacity duration-150 ${expanded ? 'opacity-100' : 'opacity-0'}`}>
                                    {link.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>

                {/* bottom: back to dashboard */}
                <div className="border-t border-[#1a1a1a] py-3 mx-2">
                    <Link
                        href="/dashboard"
                        title={!expanded ? 'Dashboard' : undefined}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-600 hover:bg-white/5 hover:text-zinc-300 transition-all"
                    >
                        <i className="fa-solid fa-gauge-high text-sm w-4 text-center shrink-0" />
                        <span className={`text-sm font-semibold whitespace-nowrap transition-opacity duration-150 ${expanded ? 'opacity-100' : 'opacity-0'}`}>
                            Main Dashboard
                        </span>
                    </Link>
                </div>
            </aside>
        </>
    );
}
