
import { ReactNode } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { PrintProvider } from '../components/PrintContext';

export default async function ProjectLayout({
    children,
    params
}: {
    children: ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id: projectId } = await params;
    
    const { data: project } = await supabase.from('projects').select('type').eq('id', projectId).single();
    const isWedding = project?.type === 'wedding' || project?.type === 'wedding_fair';
    const isTournament = project?.type === 'sports' || project?.type === 'tournament';
    
    // Theme configs - Forced Global Aesthetic
    const theme = {
        primary: 'text-[#0056B3]',
        border: 'border-[#0056B3]/30',
        bgPill: 'bg-[#0056B3]/30',
        textPill: 'text-[#0056B3]',
        accent: 'blue',
        selection: 'selection:bg-[#0056B3] selection:text-white',
        navBorder: 'border-[#222]',
        navLinkHover: 'hover:text-[#0056B3]',
        navLinkActive: 'bg-[#0056B3]'
    };

    return (
        <PrintProvider>
            <div className={`min-h-screen bg-[#050505] text-white font-sans ${theme.selection}`}>
            {/* Navigation Bar */}
            <nav className={`print:hidden fixed top-0 w-full z-50 bg-black/90 backdrop-blur-md border-b ${theme.navBorder}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex-shrink-0 flex items-center gap-3">
                            <Link href="/" className="flex items-center gap-3 group">
                                <img
                                    src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
                                    alt="ZTO Logo"
                                    className="w-10 h-10 object-contain rounded-lg shadow-sm"
                                />
                                <span className={`font-serif text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/50`}>
                                    ZTO Event OS
                                </span>
                            </Link>
                        </div>
                        <div className="hidden md:flex flex-wrap items-center gap-x-6 gap-y-2 max-w-full">
                            <NavLink href={`/projects/${projectId}`} theme={theme}>Dashboard</NavLink>
                            <NavLink href={`/projects/${projectId}/tasks`} theme={theme}>Tasks</NavLink>
                            <NavLink href={`/projects/${projectId}/timelines`} theme={theme}>Timeline</NavLink>
                            <NavLink href={`/projects/${projectId}/schedule`} theme={theme}>Schedule</NavLink>
                            <NavLink href={`/projects/${projectId}/program`} theme={theme}>Program</NavLink>
                            <NavLink href={`/projects/${projectId}/budget`} theme={theme}>Budget</NavLink>
                            <NavLink href={`/projects/${projectId}/vendors`} theme={theme}>Vendors</NavLink>
                            <NavLink href={`/projects/${projectId}/venue-layout`} theme={theme}>Venue Layout</NavLink>
                            <NavLink href={`/projects/${projectId}/stage-layout`} theme={theme}>
                                <i className="fa-solid fa-cube mr-1 text-[10px]" />3D Layout
                            </NavLink>
                            <NavLink href={`/projects/${projectId}/registration`} theme={theme}>Registration</NavLink>
                            {isTournament && (
                                <NavLink href={`/projects/${projectId}/registration#tournament`} theme={theme}>
                                    <i className="fa-solid fa-globe mr-1 text-[10px]" />Page
                                </NavLink>
                            )}
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
            <main className="pt-20 print:pt-0 px-4 sm:px-6 print:px-0 lg:px-8 print:max-w-none mx-auto pb-12 print:pb-0">
                {children}
            </main>
        </div>
    </PrintProvider>
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
