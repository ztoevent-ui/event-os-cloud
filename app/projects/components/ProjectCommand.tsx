'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
    { label: 'Dashboard', path: '' },
    { label: 'Tasks', path: '/tasks' },
    { label: 'Timeline', path: '/timelines' },
    { label: 'Schedule', path: '/schedule' },
    { label: 'Tentative Program', path: '/program' },
    { label: 'Budget', path: '/budget' },
    { label: 'Vendors', path: '/vendors' },
    { label: 'Venue', path: '/venue-layout' },
    { label: '3D', path: '/stage-layout' },
    { label: 'Reg', path: '/registration' },
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
    const pathname = usePathname();
    const base = `/projects/${projectId}`;

    const allItems = isTournament
        ? [...NAV_ITEMS, { label: 'Pub', path: '/registration#tournament' }]
        : NAV_ITEMS;

    return (
        <>
            <style>{`
                .zto-nav::-webkit-scrollbar { display: none; }
                .zto-nav { scrollbar-width: none; }
            `}</style>
            <nav className="print:hidden fixed top-0 left-0 right-0 z-50 h-12 flex items-center bg-[#0a0a0a] border-b border-white/[0.06]" style={{ fontFamily: "'Urbanist','Inter',sans-serif" }}>
                <div className="flex items-center h-full w-full px-3 gap-1 overflow-hidden">

                    {/* Logo */}
                    <Link href="/" className="shrink-0 flex items-center gap-2 mr-2 pr-3 border-r border-white/10">
                        <img
                            src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
                            alt="ZTO"
                            className="w-6 h-6 rounded object-cover"
                        />
                        <span className="text-white/80 font-bold text-[13px] tracking-tight hidden sm:block">ZTO</span>
                    </Link>

                    {/* Nav tabs — scrollable, no scrollbar */}
                    <div className="zto-nav flex items-center gap-0.5 flex-1 overflow-x-auto">
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
                                    className={`shrink-0 px-3 py-1 rounded-md text-[13px] font-semibold transition-all whitespace-nowrap ${
                                        isActive
                                            ? 'bg-[#0056B3] text-white'
                                            : 'text-white/45 hover:text-white/80 hover:bg-white/5'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right */}
                    <div className="shrink-0 flex items-center gap-3 ml-2 pl-3 border-l border-white/10">
                        <Link
                            href="/projects"
                            className="flex items-center gap-1.5 text-[12px] font-medium text-white/35 hover:text-white/70 transition-colors whitespace-nowrap"
                        >
                            <i className="fa-solid fa-arrow-left text-[10px]" />
                            Back to Events
                        </Link>
                        <div className="w-6 h-6 rounded-full bg-[#0056B3] flex items-center justify-center text-white text-[10px] font-black">
                            JD
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
}
