
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { AddTimelineButton, DeleteTimelineButton } from '../../components/ProjectModals';

export default async function TimelinesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const { data: timelines, error } = await supabase
        .from('timelines')
        .select('*')
        .eq('project_id', id)
        .order('order_index', { ascending: true });

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white mb-2">Project Timeline</h1>
                    <p className="text-zinc-400">Key phases and milestones.</p>
                </div>
                <AddTimelineButton projectId={id} />
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl">
                    Error loading timeline: {error.message}
                </div>
            )}

            <div className="relative border-l-2 border-zinc-800 ml-4 md:ml-6 space-y-12 pb-12">
                {timelines?.map((phase, index) => (
                    <div key={phase.id} className="relative pl-8 md:pl-12 group">
                        {/* Dot */}
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-zinc-900 border-2 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] group-hover:scale-125 transition-transform z-10"></div>

                        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 p-6 rounded-2xl hover:border-amber-500/30 transition-all cursor-pointer relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl text-zinc-700 pointer-events-none">
                                {index + 1}
                            </div>

                            <DeleteTimelineButton id={phase.id} projectId={id} />

                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                                {phase.name}
                            </h3>

                            <div className="flex flex-col sm:flex-row gap-4 text-sm text-zinc-400 mb-4">
                                <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-800">
                                    <i className="fa-regular fa-calendar-plus text-green-500"></i>
                                    <span>Start: {phase.start_date ? String(phase.start_date).split('T')[0] : 'TBD'}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-800">
                                    <i className="fa-regular fa-calendar-check text-red-500"></i>
                                    <span>End: {phase.end_date ? String(phase.end_date).split('T')[0] : 'TBD'}</span>
                                </div>
                            </div>

                            {/* Progress bar simulation (could be calculated from tasks later) */}
                            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-gradient-to-r from-amber-600 to-amber-400 h-full w-[20%]"></div>
                            </div>
                            <div className="text-xs text-right mt-1 text-zinc-500">20% Complete</div>
                        </div>
                    </div>
                ))}

                {(!timelines || timelines.length === 0) && (
                    <div className="pl-8 text-zinc-500 italic">No timeline phases defined.</div>
                )}
            </div>
        </div>
    );
}
