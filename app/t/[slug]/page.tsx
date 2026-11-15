import { redirect } from 'next/navigation';

// The landing page and registration form are now one page: /register/[slug].
// Keep /t/[slug] working for links/QR codes already shared.
export default async function TournamentPublicPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    redirect(`/register/${slug}`);
}
