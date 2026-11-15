import type { Metadata } from 'next';
import { supabase } from '@/lib/supabaseClient';

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeSlugKey(value: string): string {
    return decodeURIComponent(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

export function normalizePortalSettings(projData: any, tsData: any) {
    if (!tsData && !projData) return null;
    const isTournamentProj = projData?.type === 'tournament' || projData?.type === 'sports';
    const defaultTemplate = isTournamentProj ? 'business_pro_item' : 'general_event';
    return {
        ...(tsData || {}),
        slogan: tsData?.slogan || projData?.name || 'Event Registration',
        theme_color: tsData?.theme_color || '#f59e0b',
        template_type: tsData?.template_type || defaultTemplate,
        venue_name: tsData?.venue_name || projData?.venue || '',
        fields_config: {
            show_team_name: true,
            show_phone: true,
            show_email: true,
            show_ic_passport: true,
            requires_gender: false,
            show_tshirt_size: false,
            show_dietary: false,
            allow_companions: false,
            ...(tsData?.fields_config || {}),
        },
    };
}

export type ResolvedPortal = {
    projectId: string;
    project: any;
    settings: any;
};

export async function resolveProjectIdBySlug(idOrSlug: string): Promise<string | null> {
    const clean = decodeURIComponent(idOrSlug || '').trim();
    if (!clean) return null;
    if (UUID_REGEX.test(clean)) return clean;

    const lowerClean = clean.toLowerCase();
    const { data: exact } = await supabase
        .from('tournament_settings')
        .select('project_id')
        .eq('page_slug', lowerClean)
        .maybeSingle();

    if (exact?.project_id) return exact.project_id;

    // Fallback: support root vanity slugs without hyphens (e.g. christmasparadebintulu2026)
    // and optional fields_config.short_slug aliases.
    const compact = normalizeSlugKey(clean);
    if (!compact) return null;

    const { data: candidates } = await supabase
        .from('tournament_settings')
        .select('project_id, page_slug, fields_config');

    const matched = (candidates || []).find((row: any) => {
        const shortSlug = row?.fields_config?.short_slug;
        if (typeof shortSlug === 'string' && normalizeSlugKey(shortSlug) === compact) return true;
        if (typeof row?.page_slug === 'string' && normalizeSlugKey(row.page_slug) === compact) return true;
        return false;
    });

    if (matched?.project_id) return matched.project_id;

    // Also allow matching projects.slug directly if tournament_settings had no page_slug match
    const { data: projSlugRows } = await supabase
        .from('projects')
        .select('id, slug')
        .not('slug', 'is', null);

    const projMatch = (projSlugRows || []).find(
        (p: any) => typeof p?.slug === 'string' && normalizeSlugKey(p.slug) === compact
    );
    return projMatch?.id || null;
}

export async function resolveProjectPortal(idOrSlug: string): Promise<ResolvedPortal | null> {
    const projectId = await resolveProjectIdBySlug(idOrSlug);
    if (!projectId) return null;

    const [{ data: projData }, { data: tsData }] = await Promise.all([
        supabase.from('projects').select('*').eq('id', projectId).maybeSingle(),
        supabase.from('tournament_settings').select('*').eq('project_id', projectId).maybeSingle(),
    ]);

    const settings = normalizePortalSettings(projData, tsData);
    if (!settings) return null;

    return {
        projectId,
        project: projData || null,
        settings,
    };
}

export function buildPortalMetadata(resolved: ResolvedPortal | null): Metadata {
    if (!resolved) {
        return { title: 'Event Not Found' };
    }
    const { project, settings } = resolved;
    const title = settings.slogan || project?.name || 'Event Portal';
    const rawDesc = String(settings.event_description || '').replace(/\s+/g, ' ').trim();
    const description = rawDesc ? rawDesc.slice(0, 180) : `${title} — Official Event Information & Portal`;
    const banner = settings.hero_banner_url || undefined;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            ...(banner ? { images: [{ url: banner, alt: title }] } : {}),
        },
        twitter: {
            card: banner ? 'summary_large_image' : 'summary',
            title,
            description,
            ...(banner ? { images: [banner] } : {}),
        },
    };
}
