
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
            <div className="flex h-screen bg-[#050505] text-white overflow-hidden selection:bg-[#0056B3] selection:text-white" style={{ fontFamily: "'Urbanist', sans-serif" }}>
                <div className="print:hidden relative z-50">
                    <ProjectSidebar
                        projectId={projectId}
                        projectName={project?.name || ''}
                        projectStatus={project?.status || 'PLANNING'}
                        isTournament={isTournament}
                    />
                </div>
                
                <main className="flex-1 overflow-y-auto bg-[#050505] relative z-10 p-6 lg:p-10 print:p-0 print:overflow-visible">
                    <div className="max-w-[1600px] mx-auto pb-24">
                        {children}
                    </div>
                </main>
            </div>
        </PrintProvider>
    );
}
