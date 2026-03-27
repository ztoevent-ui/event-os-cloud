
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { motion } from 'framer-motion';

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
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-1000">
            {/* Hero Section: Command Center */}
            <div className="relative rounded-[2.5rem] overflow-hidden bg-[#050505] border border-white/5 shadow-2xl group">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity duration-1000"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60"></div>
                
                <div className="relative z-10 p-12 md:p-20">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 border border-amber-500/30 rounded-full bg-amber-500/5 text-amber-500 text-[10px] font-black tracking-[0.2em] uppercase">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                                {project?.status || 'Active Operation'}
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tighter uppercase italic">
                                {project?.name || 'ZTO Event'}
                            </h1>
                            <p className="text-lg text-zinc-500 max-w-xl font-medium tracking-wide">
                                Event ID: <span className="text-zinc-300 font-mono">{id}</span> • {project?.type?.replace('_', ' ') || 'Special Project'}
                            </p>
                        </div>
                        
                        <div className="flex flex-col items-end">
                            <div className="text-zinc-600 text-[10px] font-black tracking-[0.3em] uppercase mb-2">Countdown</div>
                            <div className="text-6xl font-black text-white tabular-nums tracking-tighter">
                                {daysLeft}<span className="text-xl text-zinc-500 ml-2 italic">DAYS</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
                        <Link href={`/projects/${id}/program`} className="flex-1">
                            <div className="group/btn relative px-8 py-5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-2xl transition-all transform hover:scale-[1.02] shadow-[0_0_30px_rgba(245,158,11,0.2)] flex items-center justify-between">
                                <span className="uppercase tracking-widest text-xs">Run Live Program</span>
                                <i className="fa-solid fa-play text-sm group-hover/btn:translate-x-1 transition-transform"></i>
                            </div>
                        </Link>
                        <Link href={`/projects/${id}/schedule`} className="flex-1">
                            <div className="group/btn relative px-8 py-5 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-2xl transition-all transform hover:scale-[1.02] border border-white/5 flex items-center justify-between">
                                <span className="uppercase tracking-widest text-xs">Dispatch Schedule</span>
                                <i className="fa-solid fa-list-check text-sm group-hover/btn:translate-x-1 transition-transform"></i>
                            </div>
                        </Link>
                        <Link href={`/projects/${id}/timelines`} className="flex-1">
                            <div className="group/btn relative px-8 py-5 bg-zinc-900/50 hover:bg-zinc-800/50 text-zinc-400 hover:text-white font-black rounded-2xl transition-all transform hover:scale-[1.02] border border-white/5 backdrop-blur-md flex items-center justify-between">
                                <span className="uppercase tracking-widest text-xs">Full Timeline</span>
                                <i className="fa-solid fa-calendar-days text-sm group-hover/btn:translate-x-1 transition-transform"></i>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Tasks */}
                <Link href={`/projects/${id}/tasks`} className="group relative bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/5 p-8 rounded-3xl hover:border-amber-500/30 transition-all">
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                            <i className="fa-solid fa-check-double text-xl"></i>
                        </div>
                        <span className="text-[10px] font-black text-zinc-600 tracking-widest">TASKS</span>
                    </div>
                    <div className="text-4xl font-black text-white mb-2">{pendingTasksCount || 0}</div>
                    <div className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-4">Pending Actions</div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '40%' }}
                            className="bg-amber-500 h-full shadow-[0_0_10px_#f59e0b]"
                        ></motion.div>
                    </div>
                </Link>

                {/* Budget */}
                <Link href={`/projects/${id}/budget`} className="group relative bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/5 p-8 rounded-3xl hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                            <i className="fa-solid fa-receipt text-xl"></i>
                        </div>
                        <span className="text-[10px] font-black text-zinc-600 tracking-widest">BUDGET</span>
                    </div>
                    <div className="text-3xl font-black text-white mb-2">RM {expenses.toLocaleString()}</div>
                    <div className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-4">Current Expenditure</div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500">
                        <i className="fa-solid fa-arrow-trend-down"></i> -12.4% vs Initial Est.
                    </div>
                </Link>

                {/* Consultations */}
                <Link href={`/projects/${id}/consultation`} className="group relative bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/5 p-8 rounded-3xl hover:border-cyan-500/30 transition-all">
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-500">
                            <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
                        </div>
                        <span className="text-[10px] font-black text-zinc-600 tracking-widest">REPORTS</span>
                    </div>
                    <div className="text-4xl font-black text-white mb-2">{consultationCount || 0}</div>
                    <div className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-4">AI Ready Summaries</div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-cyan-500">
                        <span className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_10px_#06b6d4]"></span> PRE-MEETING SYNCED
                    </div>
                </Link>

                {/* More Tools Dropdown-ish style */}
                <div className="grid grid-cols-2 gap-4">
                    <Link href={`/projects/${id}/guests`} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 transition-colors group/mini">
                         <i className="fa-solid fa-users text-zinc-500 group-hover/mini:text-white transition-colors"></i>
                         <span className="text-[9px] font-black tracking-widest uppercase text-zinc-600 group-hover/mini:text-zinc-400">Guests</span>
                    </Link>
                    <Link href={`/projects/${id}/tickets`} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 transition-colors group/mini">
                         <i className="fa-solid fa-ticket text-zinc-500 group-hover/mini:text-white transition-colors"></i>
                         <span className="text-[9px] font-black tracking-widest uppercase text-zinc-600 group-hover/mini:text-zinc-400">Tickets</span>
                    </Link>
                    <Link href={`/projects/${id}/vendors`} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 transition-colors group/mini">
                         <i className="fa-solid fa-handshake-angle text-zinc-500 group-hover/mini:text-white transition-colors"></i>
                         <span className="text-[9px] font-black tracking-widest uppercase text-zinc-600 group-hover/mini:text-zinc-400">Vendors</span>
                    </Link>
                    <Link href={`/projects/${id}/team`} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 transition-colors group/mini">
                         <i className="fa-solid fa-user-group text-zinc-500 group-hover/mini:text-white transition-colors"></i>
                         <span className="text-[9px] font-black tracking-widest uppercase text-zinc-600 group-hover/mini:text-zinc-400">Internal</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
