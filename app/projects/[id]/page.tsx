
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function ProjectDashboard({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const { data: project } = await supabase.from('projects').select('*').eq('id', id).single();
    const isWedding = project?.type === 'wedding' || project?.type === 'wedding_fair';
    const theme = isWedding ? {
        primary: 'text-pink-500',
        bg: 'bg-pink-500',
        hover: 'hover:bg-pink-400',
        pill: 'bg-pink-500/5',
        border: 'border-pink-500/30',
        shadow: 'shadow-[0_0_25px_rgba(236,72,153,0.2)]'
    } : {
        primary: 'text-amber-500',
        bg: 'bg-amber-500',
        hover: 'hover:bg-amber-400',
        pill: 'bg-amber-500/5',
        border: 'border-amber-500/30',
        shadow: 'shadow-[0_0_25px_rgba(245,158,11,0.2)]'
    };
    
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

    const { data: budgetItems } = await supabase.from('budgets').select('*').eq('project_id', id);
    const expenses = budgetItems?.filter((b: any) => b.type === 'expense').reduce((sum: number, b: any) => sum + Number(b.amount), 0) || 0;

    const today = new Date();
    const endDate = project?.end_date ? new Date(project.end_date) : null;
    let daysLeft = 'TBD';
    if (endDate) {
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysLeft = diffDays > 0 ? diffDays.toString() : 'Ended';
    }

    const { count: consultationCount } = await supabase
        .from('consulting_forms')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', id);

    return (
        <div className="space-y-8 pb-16">
            {/* Hero Banner */}
            <div className="relative rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-15"
                    style={{ backgroundImage: `url(${isWedding ? 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop' : 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop'})` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60"></div>

                <div className="relative z-10 p-10 md:p-16">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                        <div>
                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 mb-5 border ${theme.border} rounded-full ${theme.pill} ${theme.primary} text-[10px] font-black tracking-[0.2em] uppercase`}>
                                <span className={`w-1.5 h-1.5 ${theme.bg} rounded-full animate-pulse`}></span>
                                {project?.status || 'Active Operation'}
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white mb-3 tracking-tighter uppercase italic">
                                {project?.name || 'ZTO Event'}
                            </h1>
                            <p className="text-base text-zinc-500 font-medium">
                                Event ID: <span className="text-zinc-300 font-mono text-sm">{id}</span>
                                {project?.type && <span> • {project.type.replace(/_/g, ' ')}</span>}
                            </p>
                        </div>

                        <div className="flex flex-col items-end shrink-0">
                            <div className="text-zinc-600 text-[10px] font-black tracking-[0.3em] uppercase mb-1">Countdown</div>
                            <div className="text-5xl font-black text-white tabular-nums tracking-tighter">
                                {daysLeft}<span className="text-xl text-zinc-500 ml-2 italic font-medium">DAYS</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
                        <Link href={`/projects/${id}/program`}>
                            <div className={`px-8 py-4 ${theme.bg} ${theme.hover} text-black font-black rounded-2xl transition-all flex items-center justify-between ${theme.shadow}`}>
                                <span className="uppercase tracking-widest text-xs">Run Live Program</span>
                                <i className="fa-solid fa-play text-sm"></i>
                            </div>
                        </Link>
                        <Link href={`/projects/${id}/schedule`}>
                            <div className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-2xl transition-all border border-white/5 flex items-center justify-between">
                                <span className="uppercase tracking-widest text-xs">Dispatch Schedule</span>
                                <i className="fa-solid fa-list-check text-sm"></i>
                            </div>
                        </Link>
                        <Link href={`/projects/${id}/timelines`}>
                            <div className="px-8 py-4 bg-zinc-900/50 hover:bg-zinc-800/50 text-zinc-400 hover:text-white font-black rounded-2xl transition-all border border-white/5 flex items-center justify-between">
                                <span className="uppercase tracking-widest text-xs">Full Timeline</span>
                                <i className="fa-solid fa-calendar-days text-sm"></i>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Tasks */}
                <Link href={`/projects/${id}/tasks`} className="block group">
                    <div className={`h-full bg-zinc-900/50 border border-white/5 p-8 rounded-3xl ${isWedding ? 'hover:border-pink-500/30' : 'hover:border-amber-500/30'} transition-all cursor-pointer`}>
                        <div className="flex items-center justify-between mb-6">
                            <div className={`w-12 h-12 ${theme.pill} rounded-xl flex items-center justify-center ${theme.primary}`}>
                                <i className="fa-solid fa-check-double text-xl"></i>
                            </div>
                            <span className="text-[10px] font-black text-zinc-600 tracking-widest">TASKS</span>
                        </div>
                        <div className="text-4xl font-black text-white mb-1">{pendingTasksCount || 0}</div>
                        <div className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-4">Pending Actions</div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div className={`${theme.bg} h-full w-2/5`}></div>
                        </div>
                        <div className="text-[10px] text-zinc-600 mt-2">{criticalTasksCount || 0} Critical Items</div>
                    </div>
                </Link>

                {/* Budget */}
                <Link href={`/projects/${id}/budget`} className="block group">
                    <div className="h-full bg-zinc-900/50 border border-white/5 p-8 rounded-3xl hover:border-emerald-500/30 transition-all cursor-pointer">
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                                <i className="fa-solid fa-receipt text-xl"></i>
                            </div>
                            <span className="text-[10px] font-black text-zinc-600 tracking-widest">BUDGET</span>
                        </div>
                        <div className="text-3xl font-black text-white mb-1">RM {expenses.toLocaleString()}</div>
                        <div className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-4">Current Spend</div>
                        <div className="text-[10px] font-black text-emerald-500">
                            <i className="fa-solid fa-check mr-1"></i> Within Allocation
                        </div>
                    </div>
                </Link>

                {/* Consultations */}
                <Link href={`/projects/${id}/consultation`} className="block group">
                    <div className={`h-full bg-zinc-900/50 border border-white/5 p-8 rounded-3xl ${isWedding ? 'hover:border-pink-500/30' : 'hover:border-cyan-500/30'} transition-all cursor-pointer`}>
                        <div className="flex items-center justify-between mb-6">
                            <div className={`w-12 h-12 ${isWedding ? 'bg-pink-500/10 text-pink-500' : 'bg-cyan-500/10 text-cyan-500'} rounded-xl flex items-center justify-center`}>
                                <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
                            </div>
                            <span className="text-[10px] font-black text-zinc-600 tracking-widest">REPORTS</span>
                        </div>
                        <div className="text-4xl font-black text-white mb-1">{consultationCount || 0}</div>
                        <div className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-4">Client Submissions</div>
                        <div className={`text-[10px] font-black ${isWedding ? 'text-pink-500' : 'text-cyan-500'}`}>
                            <span className={`inline-block w-2 h-2 ${isWedding ? 'bg-pink-500' : 'bg-cyan-500'} rounded-full mr-2`}></span>AI Summaries Ready
                        </div>
                    </div>
                </Link>

                {/* Quick Links 2x2 */}
                <div className="grid grid-cols-2 gap-4">
                    <Link href={`/projects/${id}/guests`} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 p-4 transition-colors min-h-[80px]">
                        <i className="fa-solid fa-users text-zinc-500 text-lg"></i>
                        <span className="text-[9px] font-black tracking-widest uppercase text-zinc-600">Guests</span>
                    </Link>
                    <Link href={`/projects/${id}/tickets`} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 p-4 transition-colors min-h-[80px]">
                        <i className="fa-solid fa-ticket text-zinc-500 text-lg"></i>
                        <span className="text-[9px] font-black tracking-widest uppercase text-zinc-600">Tickets</span>
                    </Link>
                    <Link href={`/projects/${id}/vendors`} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 p-4 transition-colors min-h-[80px]">
                        <i className="fa-solid fa-handshake-angle text-zinc-500 text-lg"></i>
                        <span className="text-[9px] font-black tracking-widest uppercase text-zinc-600">Vendors</span>
                    </Link>
                    <Link href={`/projects/${id}/team`} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 p-4 transition-colors min-h-[80px]">
                        <i className="fa-solid fa-user-group text-zinc-500 text-lg"></i>
                        <span className="text-[9px] font-black tracking-widest uppercase text-zinc-600">Team</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
