
import { ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PrintProvider } from '../components/PrintContext';
import ProjectSidebar from '../components/ProjectSidebar';

export default async function ProjectLayout({
    children,
    params
}: {
    children: ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id: projectId } = await params;

    const { data: project } = await supabase
        .from('projects')
        .select('name, type, status')
        .eq('id', projectId)
        .single();

    const isTournament = project?.type === 'sports' || project?.type === 'tournament';

    return (
        <PrintProvider>
            {/*
              ┌─────────────────────────────────────────────────────────────┐
              │  zto-shell: full-viewport flex row                          │
              │  zto-sidebar: 280px, fixed-width, never shrinks             │
              │  zto-main: flex:1, scrollable, min-width:0                  │
              │  zto-guardrail: max-width 1400px centered safe-zone         │
              └─────────────────────────────────────────────────────────────┘
            */}
            <div className="zto-shell print:block">
                {/* Layer 1 — Sidebar */}
                <ProjectSidebar
                    projectId={projectId}
                    projectName={project?.name || ''}
                    projectStatus={project?.status || 'PLANNING'}
                    isTournament={isTournament}
                />

                {/* Layer 2 — Main Canvas */}
                <main className="zto-main print:overflow-visible print:flex-none print:w-full">
                    {/* Layer 3 — Central Guardrail */}
                    <div className="zto-guardrail page-transition">
                        {children}
                    </div>
                </main>
            </div>
        </PrintProvider>
    );
}
