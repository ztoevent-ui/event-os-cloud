
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

    const { data: project } = await supabase.from('projects').select('name, type, status').eq('id', projectId).single();
    const isTournament = project?.type === 'sports' || project?.type === 'tournament';

    return (
        <PrintProvider>
            {/*
              ┌──────────────────────────────────────────────────────┐
              │  Root flex container — full viewport, no overflow     │
              │  Sidebar: fixed-width, never shrinks                  │
              │  Main: flex-1, clips horizontal overflow              │
              └──────────────────────────────────────────────────────┘
            */}
            <div
                className="print:block"
                style={{
                    display: 'flex',
                    height: '100vh',
                    width: '100vw',
                    overflow: 'hidden',
                    background: '#050505',
                    color: '#E5E5E5',
                    fontFamily: "'Urbanist', sans-serif",
                }}
            >
                {/* ── Sidebar ── */}
                <div className="print:hidden" style={{ flexShrink: 0 }}>
                    <ProjectSidebar
                        projectId={projectId}
                        projectName={project?.name || ''}
                        projectStatus={project?.status || 'PLANNING'}
                        isTournament={isTournament}
                    />
                </div>

                {/* ── Main Content ── */}
                <main
                    style={{
                        flex: 1,
                        overflowX: 'hidden',
                        overflowY: 'auto',
                        minWidth: 0,        /* prevents flex child from overflowing */
                        background: '#050505',
                        position: 'relative',
                    }}
                    className="print:overflow-visible print:flex-none print:w-full"
                >
                    {/* ENFORCED ANTIGRAVITY CONTAINER */}
                    <div style={{
                        maxWidth: 1400,
                        margin: '0 auto',
                        padding: '2.5rem',
                        width: '100%',
                        minHeight: '100%',
                    }}>
                        {children}
                    </div>
                </main>
            </div>
        </PrintProvider>
    );
}
