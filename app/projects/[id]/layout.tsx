
import { ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PrintProvider } from '../components/PrintContext';
import ProjectCommand from '../components/ProjectCommand';

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
            <div className="min-h-screen bg-[#050505] text-white selection:bg-[#0056B3] selection:text-white" style={{ fontFamily: "'Inter', 'Urbanist', sans-serif" }}>
                <ProjectCommand
                    projectId={projectId}
                    projectName={project?.name || ''}
                    projectStatus={project?.status || 'PLANNING'}
                    isTournament={isTournament}
                />

                {/* Main Content — offset: top 14 (56px top bar) + left 14 (56px sidebar icon rail) */}
                <main className="pt-14 pl-14 print:pt-0 print:pl-0 min-h-screen">
                    <div className="px-6 py-8 print:px-0 print:py-0 max-w-[1400px] mx-auto pb-16">
                        {children}
                    </div>
                </main>
            </div>
        </PrintProvider>
    );
}
