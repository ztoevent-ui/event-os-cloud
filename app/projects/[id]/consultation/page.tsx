
import { createClient } from '@supabase/supabase-js';
import ConsultingForm from '../../components/ConsultingForm';
import ConsultationList from '../../components/ConsultationList';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function ConsultationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch existing consultations for this project
    const { data: consultations, error } = await supabase
        .from('consulting_forms')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

    if (error) {
        return <div className="text-red-500">Error fetching consultations: {error.message}</div>;
    }

    if (!consultations || consultations.length === 0) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500 pb-20">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <h1 className="text-4xl font-serif text-zinc-900 mb-4">No Consultations Yet</h1>
                    <p className="text-zinc-500 text-lg">No consultation reports found for this project. You can add one manually below.</p>
                </div>
                <ConsultingForm projectId={id} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-end mb-8 border-b border-zinc-200 pb-4">
                <div>
                    <h1 className="text-3xl font-serif text-zinc-900 mb-2">Consultation Reports</h1>
                    <p className="text-zinc-500">AI-Powered summaries and client details.</p>
                </div>
                <Link
                    href={`/public/consulting?project_id=${id}`}
                    target="_blank"
                    className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black transition-colors flex items-center gap-2"
                >
                    <i className="fa-solid fa-arrow-up-right-from-square"></i> Public Form Link
                </Link>
            </div>

            <ConsultationList initialConsultations={consultations} />

            {/* Manual Add Button (opens modal or new page, currently just link or section) */}
            {/* For now we just list them, user can use the public link to simulate adding one */}
        </div>
    );
}
