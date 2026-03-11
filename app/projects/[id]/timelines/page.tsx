
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { AddTimelineButton, TimelineCard } from '../../components/ProjectModals';

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
                    <TimelineCard key={phase.id} phase={phase} projectId={id} />
                ))}

                {(!timelines || timelines.length === 0) && (
                    <div className="pl-8 text-zinc-500 italic">No timeline phases defined.</div>
                )}
            </div>
        </div>
    );
}
