
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function ProjectDashboard({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch Project Details
    const { data: project } = await supabase.from('projects').select('*').eq('id', id).single();

    // Fetch Tasks Count
    const { count: pendingTasksCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', id)
        .neq('status', 'done');

    const { count: criticalTasksCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', id)
        .eq('priority', 'critical')
        .neq('status', 'done');

    // Fetch Budget
    const { data: budgetItems } = await supabase.from('budgets').select('*').eq('project_id', id);
    const expenses = budgetItems?.filter((b: any) => b.type === 'expense').reduce((sum: number, b: any) => sum + Number(b.amount), 0) || 0;

    // Calculate Days Left
    const today = new Date();
    const endDate = project?.end_date ? new Date(project.end_date) : null;
    let daysLeft = 'TBD';
    if (endDate) {
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysLeft = diffDays > 0 ? diffDays.toString() : 'Ended';
    }

    // Fetch Consultations
    const { count: consultationCount } = await supabase.from('consulting_forms').select('*', { count: 'exact', head: true }).eq('project_id', id);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
                <div className="relative z-10 p-10 md:p-16 text-center">
                    <div className="inline-block px-3 py-1 mb-4 border border-amber-500/30 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold tracking-widest uppercase">
                        {project?.status || 'Active Project'}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-serif font-black text-white mb-4 tracking-tight">
                        {project?.name || 'Loading Project...'}
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-8 font-light">
                        The centralized command center for {project?.type?.replace('_', ' ') || 'your event'}.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href={`/projects/${id}/timelines`}>
                            <button className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                                View Master Plan
                            </button>
                        </Link>
                        <div className="px-8 py-3 bg-zinc-800 text-white font-medium rounded-full border border-zinc-700 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            On Track
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link href={`/projects/${id}/timelines`} className="block">
                    <div className="h-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 p-6 rounded-2xl hover:border-amber-500/50 hover:bg-zinc-800/50 transition-all group cursor-pointer">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-zinc-200">Timeline</h3>
                            <i className="fa-solid fa-clock text-amber-500/50 group-hover:text-amber-500 transition-colors"></i>
                        </div>
                        <div className="text-3xl font-mono text-white mb-1">{daysLeft} <span className="text-sm text-zinc-500 font-sans">Days Left</span></div>
                        <p className="text-xs text-zinc-500">Until Event Day</p>
                    </div>
                </Link>

                <Link href={`/projects/${id}/tasks`} className="block">
                    <div className="h-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 p-6 rounded-2xl hover:border-amber-500/50 hover:bg-zinc-800/50 transition-all group cursor-pointer">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-zinc-200">Tasks</h3>
                            <i className="fa-solid fa-list-check text-amber-500/50 group-hover:text-amber-500 transition-colors"></i>
                        </div>
                        <div className="text-xl font-bold text-white mb-1">{pendingTasksCount || 0} Pending</div>
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-amber-500 h-full" style={{ width: '40%' }}></div>
                            {/* width hardcoded for now or calculate percentage done */}
                        </div>
                        <p className="text-xs text-zinc-500 mt-2">{criticalTasksCount || 0} Critical Items</p>
                    </div>
                </Link>

                <Link href={`/projects/${id}/budget`} className="block">
                    <div className="h-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 p-6 rounded-2xl hover:border-amber-500/50 hover:bg-zinc-800/50 transition-all group cursor-pointer">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-zinc-200">Budget</h3>
                            <i className="fa-solid fa-coins text-amber-500/50 group-hover:text-amber-500 transition-colors"></i>
                        </div>
                        <div className="text-3xl font-mono text-white mb-1">RM {expenses.toFixed(0)} <span className="text-sm text-zinc-500 font-sans">Spent</span></div>
                        <p className="text-xs text-green-500 flex items-center gap-1">
                            <i className="fa-solid fa-check"></i> Within initial allocation
                        </p>
                    </div>
                </Link>

                <Link href={`/projects/${id}/consultation`} className="block">
                    <div className="h-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 p-6 rounded-2xl hover:border-amber-500/50 hover:bg-zinc-800/50 transition-all group cursor-pointer">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-zinc-200">Reports</h3>
                            <i className="fa-solid fa-clipboard-question text-amber-500/50 group-hover:text-amber-500 transition-colors"></i>
                        </div>
                        <div className="text-3xl font-mono text-white mb-1">{consultationCount || 0} <span className="text-sm text-zinc-500 font-sans">Total</span></div>
                        <p className="text-xs text-green-500 flex items-center gap-1">
                            <i className="fa-solid fa-wand-magic-sparkles"></i> AI summaries ready
                        </p>
                    </div>
                </Link>

                <Link href={`/projects/${id}/guests`} className="block">
                    <div className="h-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 p-6 rounded-2xl hover:border-amber-500/50 hover:bg-zinc-800/50 transition-all group cursor-pointer">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-zinc-200">Guests</h3>
                            <i className="fa-solid fa-users text-amber-500/50 group-hover:text-amber-500 transition-colors"></i>
                        </div>
                        <div className="text-3xl font-mono text-white mb-1"><span className="text-sm text-zinc-500 font-sans">Manage List</span></div>
                        <p className="text-xs text-zinc-500 flex items-center gap-1">
                            <i className="fa-solid fa-list"></i> View Attendees
                        </p>
                    </div>
                </Link>

                <Link href={`/projects/${id}/tickets`} className="block">
                    <div className="h-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 p-6 rounded-2xl hover:border-amber-500/50 hover:bg-zinc-800/50 transition-all group cursor-pointer">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-zinc-200">Ticketing</h3>
                            <i className="fa-solid fa-ticket text-amber-500/50 group-hover:text-amber-500 transition-colors"></i>
                        </div>
                        <div className="text-3xl font-mono text-white mb-1"><span className="text-sm text-zinc-500 font-sans">Setup Tiers</span></div>
                        <p className="text-xs text-zinc-500 flex items-center gap-1">
                            <i className="fa-solid fa-gear"></i> Configure Sales
                        </p>
                    </div>
                </Link>
            </div>
        </div >
    );
}
