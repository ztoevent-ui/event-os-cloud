import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import React from 'react';
import { Check, Circle } from 'lucide-react';

export default async function WeddingPortalPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;

    // 1. Fetch Magic Link Token
    const { data: linkInfo, error: linkError } = await supabase
        .from('project_share_links')
        .select('project_id, name, scopes')
        .eq('token', token)
        .single();

    if (linkError || !linkInfo) {
        return <div className="p-20 text-center text-ink/50">Invalid or expired magic link.</div>;
    }

    // 2. Fetch Project & Data
    const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', linkInfo.project_id)
        .single();

    if (!project) notFound();

    const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', project.id)
        .eq('assignee_type', 'client')
        .order('created_at', { ascending: false });

    return (
        <div className="min-h-screen bg-canvas text-ink font-sans" data-theme="wedding">
            <div className="max-w-3xl mx-auto p-8 md:p-16">
                <header className="mb-16 text-center">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-accent mb-2">{linkInfo.name}</p>
                    <h1 className="text-4xl font-black uppercase tracking-tight font-display">{project.name}</h1>
                </header>

                <div className="bg-ink/[0.02] border border-ink/5 rounded-3xl p-8">
                    <h2 className="text-sm font-black uppercase tracking-widest text-ink mb-6 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent" /> Your Checklist
                    </h2>

                    <div className="flex flex-col gap-2">
                        {tasks?.length === 0 ? (
                            <p className="text-ink/50 text-sm">No tasks assigned to you right now. Sit back and relax!</p>
                        ) : (
                            tasks?.map(task => (
                                <div key={task.id} className="flex items-center gap-4 p-4 bg-canvas border border-ink/5 rounded-xl shadow-sm">
                                    <div className={task.status === 'done' ? "text-emerald-500" : "text-ink/20"}>
                                        {task.status === 'done' ? <Check className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                    </div>
                                    <span className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-ink/50' : 'text-ink'}`}>
                                        {task.title}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
