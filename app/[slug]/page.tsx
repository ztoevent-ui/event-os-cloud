import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RegistrationClient } from '../register/[id]/RegistrationClient';
import { buildPortalMetadata, resolveProjectPortal } from '../register/[id]/resolveEvent';

export const dynamic = 'force-dynamic';

type PageProps = {
    params: Promise<{ slug: string }>;
};

async function resolveRootSlug(slug: string) {
    if (!slug || slug.includes('.') || slug.startsWith('_')) return null;
    return resolveProjectPortal(slug);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const resolved = await resolveRootSlug(slug);
    return buildPortalMetadata(resolved);
}

export default async function ShortVanityEventPage({ params }: PageProps) {
    const { slug } = await params;
    const resolved = await resolveRootSlug(slug);
    if (!resolved) notFound();

    return (
        <RegistrationClient
            idOrSlug={resolved.projectId}
            initialProject={resolved.project}
            initialSettings={resolved.settings}
        />
    );
}
