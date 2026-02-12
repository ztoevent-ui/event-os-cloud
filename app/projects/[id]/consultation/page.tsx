
import { createClient } from '@supabase/supabase-js';
import ConsultingForm from '../../components/ConsultingForm';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function ConsultationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch existing consultation (if any) to check status or redirect?
    // For now, allow multiple submissions or assume one per project context for staff entry

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="text-center max-w-2xl mx-auto mb-12">
                <h1 className="text-4xl font-serif text-zinc-900 mb-4">Plan Your Big Day</h1>
                <p className="text-zinc-500 text-lg">Tell us about your dream wedding. Our AI-powered system will help us understand your vision instantly.</p>
            </div>

            <ConsultingForm projectId={id} />
        </div>
    );
}
