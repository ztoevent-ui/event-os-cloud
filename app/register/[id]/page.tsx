import type { Metadata } from 'next';
import { RegistrationClient } from './RegistrationClient';
import { buildPortalMetadata, resolveProjectPortal } from './resolveEvent';

export const dynamic = 'force-dynamic';

type PageProps = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const resolved = await resolveProjectPortal(id);
    return buildPortalMetadata(resolved);
}

export default async function RegistrationPage({ params }: PageProps) {
    const { id } = await params;
    const resolved = await resolveProjectPortal(id);
    return (
        <RegistrationClient
            idOrSlug={resolved?.projectId || id}
            initialProject={resolved?.project}
            initialSettings={resolved?.settings}
        />
    );
}
