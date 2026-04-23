'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

    const links = [
        { href: `/projects/${projectId}`, label: 'Dashboard' },
        { href: `/projects/${projectId}/tasks`, label: 'Tasks' },
        { href: `/projects/${projectId}/timelines`, label: 'Timeline' },
        { href: `/projects/${projectId}/schedule`, label: 'Schedule' },
        { href: `/projects/${projectId}/program`, label: 'Program' },
        { href: `/projects/${projectId}/budget`, label: 'Budget' },
        { href: `/projects/${projectId}/vendors`, label: 'Vendors' },
        { href: `/projects/${projectId}/venue-layout`, label: 'Venue Layout' },
        { href: `/projects/${projectId}/stage-layout`, label: '3D Layout' },
        { href: `/projects/${projectId}/registration`, label: 'Registration' },
    ];

    if (isTournament) {
        links.push({ href: `/projects/${projectId}/registration#tournament`, label: 'Public Page' });
    }

    const basePath = `/projects/${projectId}`;

    return (
        <nav className="print:hidden fixed top-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-[#1c1c1c]">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center h-14 gap-2">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 mr-4 shrink-0">
                        <img
                            src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
                            alt="ZTO"
                            className="w-8 h-8 object-contain rounded-lg"
                        />
                        <span className="text-white font-black text-sm tracking-wide hidden lg:block">ZTO Event OS</span>
                    </Link>

                    {/* Nav links */}
                    <div className="flex items-center gap-0.5 flex-1 overflow-x-auto no-scrollbar">
                        {links.map((link) => {
                            const exactPath = link.href.split('#')[0];
                            const isActive =
                                link.href.endsWith(`/projects/${projectId}`)
                                    ? pathname === basePath
                                    : pathname.startsWith(exactPath) && exactPath !== basePath;

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                                        isActive
                                            ? 'bg-[#0056B3] text-white'
                                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                        <Link
                            href="/projects"
                            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-white transition-colors"
                        >
                            <i className="fa-solid fa-arrow-left text-[10px]" />
                            Back to Events
                        </Link>
                        <div className="w-7 h-7 rounded-full bg-[#0056B3]/20 border border-[#0056B3]/40 flex items-center justify-center text-[#4da3ff] text-[10px] font-black">
                            JD
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
