
import { ReactNode } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default async function ProjectLayout({
    children,
    params
}: {
    children: ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const projectId = id;

    const { data: project } = await supabase.from('projects').select('type').eq('id', projectId).single();
    const isWedding = project?.type === 'wedding' || project?.type === 'wedding_fair';
    
    // Theme configs
    const theme = isWedding ? {
        primary: 'text-pink-500',
        border: 'border-pink-900/30',
        bgPill: 'bg-pink-900/30',
        textPill: 'text-pink-500',
        accent: 'pink',
        selection: 'selection:bg-pink-500',
        navBorder: 'border-pink-900/30',
        navLinkHover: 'hover:text-pink-400',
        navLinkActive: 'bg-pink-500'
    } : {
        primary: 'text-amber-500',
        border: 'border-amber-900/30',
        bgPill: 'bg-amber-900/30',
        textPill: 'text-amber-500',
        accent: 'amber',
        selection: 'selection:bg-amber-500',
        navBorder: 'border-amber-900/30',
        navLinkHover: 'hover:text-amber-400',
        navLinkActive: 'bg-amber-500'
    };

    return (
        <div className={`min-h-screen bg-black ${theme.primary} font-sans ${theme.selection} selection:text-black`}>
            {/* Navigation Bar */}
            <nav className={`fixed top-0 w-full z-50 bg-black/90 backdrop-blur-md border-b ${theme.navBorder}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex-shrink-0 flex items-center gap-3">
                            <Link href="/" className="flex items-center gap-3 group">
                                <img
                                    src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
                                    alt="ZTO Logo"
                                    className="w-10 h-10 object-contain rounded-lg shadow-sm"
                                />
                                <span className={`font-serif text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r ${isWedding ? 'from-pink-200 via-pink-400 to-pink-200' : 'from-amber-200 via-amber-400 to-amber-200'}`}>
                                    ZTO Event OS
                                </span>
                            </Link>
                        </div>
                        <div className="hidden md:flex space-x-6">
                            <NavLink href={`/projects/${projectId}`} theme={theme}>Dashboard</NavLink>
                            <NavLink href={`/projects/${projectId}/tasks`} theme={theme}>Tasks</NavLink>
                            <NavLink href={`/projects/${projectId}/timelines`} theme={theme}>Timeline</NavLink>
                            <NavLink href={`/projects/${projectId}/schedule`} theme={theme}>Schedule</NavLink>
                            <NavLink href={`/projects/${projectId}/program`} theme={theme}>Program</NavLink>
                            <NavLink href={`/projects/${projectId}/budget`} theme={theme}>Budget</NavLink>
                            <NavLink href={`/projects/${projectId}/vendors`} theme={theme}>Vendors</NavLink>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/projects" className="text-xs font-bold text-zinc-500 hover:text-white transition-colors flex items-center gap-2">
                                <i className="fa-solid fa-arrow-left text-[10px]"></i>
                                Back to Events
                            </Link>
                            <button className={`w-8 h-8 rounded-full ${theme.bgPill} border ${theme.border} flex items-center justify-center ${theme.textPill} text-xs`}>
                                JD
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-12">
                {children}
            </main>
        </div>
    );
}

function NavLink({ href, children, theme }: { href: string; children: ReactNode; theme: any }) {
    return (
        <Link
            href={href}
            className={`text-sm font-medium text-zinc-400 ${theme.navLinkHover} transition-colors relative group py-2`}
        >
            {children}
            <span className={`absolute bottom-0 left-0 w-0 h-0.5 ${theme.navLinkActive} transition-all group-hover:w-full opacity-80`}></span>
        </Link>
    );
}
