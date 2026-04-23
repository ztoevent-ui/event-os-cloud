
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
            <div className="min-h-screen bg-[#080808] text-white selection:bg-[#0056B3] selection:text-white">
                <ProjectCommand
                    projectId={projectId}
                    projectName={project?.name || ''}
                    projectStatus={project?.status || 'PLANNING'}
                    isTournament={isTournament}
                />
                {/* pt-12 = 48px nav height */}
                <main className="pt-12 print:pt-0">
                    <div className="px-6 lg:px-10 py-7 max-w-[1440px] mx-auto pb-16 print:px-0 print:py-0">
                        {children}
                    </div>
                </main>
            </div>
        </PrintProvider>
    );
}
