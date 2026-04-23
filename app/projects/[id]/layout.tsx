
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
            <div className={`min-h-screen bg-[#050505] text-white font-sans selection:bg-[#0056B3] selection:text-white`}>
                <ProjectCommand 
                    projectId={projectId} 
                    projectName={project?.name || ''} 
                    projectStatus={project?.status || 'PLANNING'} 
                    isTournament={isTournament} 
                />

                {/* Main Content */}
                <main className="pt-20 print:pt-0 px-4 sm:px-6 print:px-0 lg:px-8 print:max-w-none mx-auto pb-12 print:pb-0">
                    {children}
                </main>
            </div>
        </PrintProvider>
    );
}
