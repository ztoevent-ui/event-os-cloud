
import ConsultingForm from '../../projects/components/ConsultingForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Consultation | Event OS',
    description: 'Tell us about your dream wedding.',
};

export default async function PublicConsultationPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams;
    const projectId = typeof params.project_id === 'string' ? params.project_id : '';

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
                <h1 className="text-4xl font-serif text-zinc-900 mb-4">Event Consultation</h1>
                <p className="text-zinc-500 text-lg">Let's create something extraordinary together.</p>
            </div>
            <ConsultingForm projectId={projectId} />
        </div>
    );
}
