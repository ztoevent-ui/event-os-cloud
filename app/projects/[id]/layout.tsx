
import { ReactNode } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; // Use the actual key if needed, or import from lib
// We will import it from lib to avoid duplicate env setup issues:
import { supabase } from '@/lib/supabaseClient';

export default async function ProjectLayout({
    children,
    params
}: {
    children: ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const projectId = id || '1';

    const { data: project } = await supabase.from('projects').select('type').eq('id', projectId).single();
    const isTournament = project?.type === 'tournament';

    return (
        <div className="min-h-screen bg-black text-amber-500 font-sans selection:bg-amber-500 selection:text-black">
            {/* Navigation Bar */}
            <nav className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-amber-900/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex-shrink-0 flex items-center gap-3">
                            <Link href="/" className="flex items-center gap-3 group">
                                <img
                                    src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
                                    alt="ZTO Logo"
                                    className="w-10 h-10 object-contain rounded-lg shadow-sm"
                                />
                                <span className="font-serif text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200">
                                    ZTO Event OS
                                </span>
                            </Link>
                        </div>
                        <div className="hidden md:flex space-x-8">
                            <NavLink href={`/projects/${projectId}`}>Dashboard</NavLink>
                            {isTournament && <NavLink href={`/projects/${projectId}/tournament`}>Tournament</NavLink>}
                            <NavLink href={`/projects/${projectId}/tasks`}>Tasks</NavLink>
                            <NavLink href={`/projects/${projectId}/timelines`}>Timeline</NavLink>
                            <NavLink href={`/projects/${projectId}/budget`}>Budget</NavLink>
                            <NavLink href={`/projects/${projectId}/vendors`}>Vendors</NavLink>
                            <NavLink href={`/projects/${projectId}/team`}>Team</NavLink>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/" className="text-xs font-medium text-gray-500 hover:text-white transition-colors">
                                Exit to Projects
                            </Link>
                            <button className="w-8 h-8 rounded-full bg-amber-900/30 border border-amber-600/30 flex items-center justify-center text-amber-500 text-xs text-bold" title="Tony Wong - Tournament Director">
                                TW
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

function NavLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <Link
            href={href}
            className="text-sm font-medium text-gray-400 hover:text-amber-400 transition-colors relative group py-2"
        >
            {children}
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-500 transition-all group-hover:w-full opacity-80"></span>
        </Link>
    );
}
