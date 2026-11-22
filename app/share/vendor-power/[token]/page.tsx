import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resolveVendorPowerByToken } from '@/app/projects/vendorPower';
import { VendorPowerForm } from './VendorPowerForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ token: string }>;
}): Promise<Metadata> {
    const { token } = await params;
    const resolved = await resolveVendorPowerByToken(token);
    const name = resolved?.project?.name;
    return {
        title: name ? `${name} · Vendor Power & Equipment Form` : 'Vendor Equipment & Electrical Declaration',
        description: name
            ? `Declare booth electrical appliances (Watts / Amps) & upload nameplate photos for ${name}.`
            : 'Public vendor equipment & power load declaration powered by ZTO Event OS.',
    };
}

export default async function ShareVendorPowerPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    const resolved = await resolveVendorPowerByToken(token);
    if (!resolved) notFound();

    return <VendorPowerForm project={resolved.project} config={resolved.config} />;
}
