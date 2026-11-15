import type { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Share-preview metadata (WhatsApp / Facebook) for the single event page.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const query = supabase.from('tournament_settings').select('slogan, event_description, hero_banner_url');
    const { data } = await (UUID_REGEX.test(id) ? query.eq('project_id', id) : query.eq('page_slug', id)).maybeSingle();

    const title = data?.slogan ? `${data.slogan} | Registration` : 'Event Registration | ZTO Event';
    const description = data?.event_description?.slice(0, 180) || 'Official event information and registration.';
    return {
        title,
        description,
        openGraph: { title, description, images: data?.hero_banner_url ? [data.hero_banner_url] : [] },
    };
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
    return children;
}
