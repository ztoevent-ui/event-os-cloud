'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
    { label: 'Dashboard', path: '', icon: 'fa-solid fa-chart-line' },
    { label: 'Tasks', path: '/tasks', icon: 'fa-solid fa-list-check' },
    { label: 'Timeline', path: '/timelines', icon: 'fa-solid fa-clock' },
    { label: 'Schedule', path: '/schedule', icon: 'fa-solid fa-calendar-days' },
    { label: 'Tentative Program', path: '/program', icon: 'fa-solid fa-clipboard-list' },
    { label: 'Budget', path: '/budget', icon: 'fa-solid fa-wallet' },
    { label: 'Vendors', path: '/vendors', icon: 'fa-solid fa-truck-fast' },
    { label: 'Venue', path: '/venue-layout', icon: 'fa-solid fa-map-location-dot' },
    { label: '3D', path: '/stage-layout', icon: 'fa-solid fa-cube' },
    { label: 'Reg', path: '/registration', icon: 'fa-solid fa-users' },
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
        ? [...NAV_ITEMS, { label: 'Pub', path: '/registration#tournament', icon: 'fa-solid fa-globe' }]
        : NAV_ITEMS;

    return (
        <aside 
            className={`flex flex-col bg-[#050505] border-r border-white/[0.06] transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} shrink-0`}
            style={{ fontFamily: "'Urbanist', sans-serif" }}
        >
            {/* Header / Logo */}
            <div className="h-20 flex items-center px-6 border-b border-white/[0.06] justify-between">
                <Link href="/projects" className={`flex items-center gap-3 transition-opacity duration-300 ${collapsed ? 'w-full justify-center' : ''}`}>
                    <img
                        src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
                        alt="ZTO"
                        className="w-8 h-8 rounded-lg object-cover"
                    />
                    {!collapsed && <span className="text-white font-bold text-[16px] tracking-tight whitespace-nowrap">ZTO Event OS</span>}
                </Link>
            </div>

            {/* Toggle Button */}
            <div className="absolute top-6 -right-4 z-50">
                <button 
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-8 h-8 bg-[#0a0a0a] border border-white/[0.08] rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all shadow-lg"
                >
                    <i className={`fa-solid ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'} text-[10px]`}></i>
                </button>
            </div>

            {/* Context Info */}
            {!collapsed && (
                <div className="p-6 border-b border-white/[0.06]">
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Current Project</div>
                    <div className="text-sm font-bold text-white leading-tight truncate">{projectName}</div>
                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full border border-[#0056B3]/30 bg-[#0056B3]/10 text-[#6BB8FF] text-[10px] font-black uppercase tracking-widest">
                        {projectStatus}
                    </div>
                </div>
            )}

            {/* Nav Links */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
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
                            className={`flex items-center ${collapsed ? 'justify-center px-0 py-3' : 'px-4 py-3 gap-3'} rounded-xl transition-all duration-200 ${
                                isActive
                                    ? 'bg-[#0056B3] text-white shadow-[0_0_20px_rgba(0,86,179,0.3)]'
                                    : 'text-white/40 hover:text-white hover:bg-white/[0.04]'
                            }`}
                        >
                            <i className={`${item.icon} text-[14px] ${isActive ? 'text-white' : ''} ${collapsed ? '' : 'w-5 text-center'}`} />
                            {!collapsed && <span className="text-[13px] font-semibold whitespace-nowrap">{item.label}</span>}
                        </Link>
                    );
                })}
            </div>

            {/* Footer / Back */}
            <div className="p-4 border-t border-white/[0.06]">
                <Link
                    href="/projects"
                    className={`flex items-center ${collapsed ? 'justify-center px-0' : 'px-4 gap-3'} py-3 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all`}
                    title={collapsed ? "Exit to Projects" : undefined}
                >
                    <i className="fa-solid fa-arrow-right-from-bracket text-[14px] rotate-180" />
                    {!collapsed && <span className="text-[13px] font-semibold whitespace-nowrap">Exit to Projects</span>}
                </Link>
            </div>
        </aside>
    );
}
