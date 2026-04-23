'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ProjectCommand({
    projectId,
    projectName,
    projectStatus,
    isTournament
}: {
    projectId: string;
    projectName: string;
    projectStatus: string;
    isTournament: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const links = [
        { href: `/projects/${projectId}`, label: 'Dashboard', icon: 'fa-table-columns' },
        { href: `/projects/${projectId}/tasks`, label: 'Tasks', icon: 'fa-check-double' },
        { href: `/projects/${projectId}/timelines`, label: 'Timeline', icon: 'fa-timeline' },
        { href: `/projects/${projectId}/schedule`, label: 'Schedule', icon: 'fa-calendar-days' },
        { href: `/projects/${projectId}/program`, label: 'Program', icon: 'fa-list-ol' },
        { href: `/projects/${projectId}/budget`, label: 'Budget', icon: 'fa-file-invoice-dollar' },
        { href: `/projects/${projectId}/vendors`, label: 'Vendors', icon: 'fa-truck-fast' },
        { href: `/projects/${projectId}/venue-layout`, label: 'Venue Layout', icon: 'fa-map' },
        { href: `/projects/${projectId}/stage-layout`, label: '3D Layout', icon: 'fa-cube' },
        { href: `/projects/${projectId}/registration`, label: 'Registration', icon: 'fa-id-card' }
    ];

    if (isTournament) {
        links.push({ href: `/projects/${projectId}/registration#tournament`, label: 'Tournament Page', icon: 'fa-globe' });
    }

    return (
        <>
            {/* Header Area */}
            <nav className="print:hidden fixed top-0 w-full z-40 bg-[#050505]/80 backdrop-blur-md border-b border-[#222]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-4">
                            <Link href="/projects" className="text-zinc-500 hover:text-white transition-colors">
                                <i className="fa-solid fa-arrow-left"></i>
                            </Link>
                            <h1 className="text-lg font-bold text-white tracking-wide font-sans truncate max-w-[200px] md:max-w-md">
                                {projectName || 'Project'}
                            </h1>
                            <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-[#0056B3]/20 text-[#0056B3] border border-[#0056B3]/30 shadow-[0_0_10px_rgba(0,86,179,0.2)] animate-pulse">
                                {projectStatus || 'PLANNING'}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <button className="w-8 h-8 rounded-full bg-[#0056B3]/20 border border-[#0056B3]/30 flex items-center justify-center text-[#0056B3] text-xs">
                                JD
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Floating Action Button (FAB) */}
            <button 
                onClick={() => setIsOpen(true)}
                className="print:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#0056B3] hover:bg-[#004494] text-white rounded-full shadow-[0_0_20px_rgba(0,86,179,0.4)] flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            >
                <i className="fa-solid fa-layer-group text-xl"></i>
            </button>

            {/* Drawer Backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Feature Drawer */}
            <div 
                className={`fixed top-0 right-0 h-full w-72 bg-[#0a0a0a] border-l border-[#222] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="p-6 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-bold text-white">Command Center</h2>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="text-zinc-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-colors"
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2">
                        {links.map((link) => {
                            const isActive = pathname === link.href || (link.href.includes('#') && pathname === link.href.split('#')[0]);
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                        isActive 
                                        ? 'bg-[#0056B3] text-white shadow-[0_0_15px_rgba(0,86,179,0.3)]' 
                                        : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    <i className={`fa-solid ${link.icon} w-5 text-center`}></i>
                                    <span className="font-medium text-sm">{link.label}</span>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}
