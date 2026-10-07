import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * ZTO Photobooth — remove.bg proxy
 *
 * GET  → { configured: boolean }   (kiosk decides whether to use cloud or on-device cutout)
 * POST → multipart { image: File, event_id: string }  →  image/png cut-out
 *
 * Keeps REMOVE_BG_API_KEY server-side. Requests are only accepted for events
 * that actually have a photobooth template, to limit credit abuse.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 4 * 1024 * 1024;

export async function GET() {
    return NextResponse.json({ configured: !!process.env.REMOVE_BG_API_KEY });
}

export async function POST(req: Request) {
    const key = process.env.REMOVE_BG_API_KEY;
    if (!key) return NextResponse.json({ error: 'remove.bg not configured' }, { status: 501 });

    let form: FormData;
    try { form = await req.formData(); } catch { return NextResponse.json({ error: 'Invalid form data' }, { status: 400 }); }

    const image = form.get('image');
    const eventId = String(form.get('event_id') || '');
    if (!(image instanceof Blob)) return NextResponse.json({ error: 'Missing image' }, { status: 400 });
    if (image.size > MAX_BYTES) return NextResponse.json({ error: 'Image too large' }, { status: 413 });
    if (!/^[0-9a-f-]{36}$/i.test(eventId)) return NextResponse.json({ error: 'Invalid event' }, { status: 400 });

    const { data: tpl } = await supabase.from('photobooth_templates').select('id').eq('event_id', eventId).maybeSingle();
    if (!tpl) return NextResponse.json({ error: 'No photobooth template for event' }, { status: 403 });

    const upstream = new FormData();
    upstream.append('image_file', image, 'capture.jpg');
    upstream.append('size', 'auto');
    upstream.append('type', 'person');
    upstream.append('format', 'png');

    const r = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: { 'X-Api-Key': key },
        body: upstream,
        cache: 'no-store',
    });

    if (!r.ok) {
        const detail = await r.text().catch(() => '');
        console.error('[remove-bg] upstream error', r.status, detail.slice(0, 300));
        return NextResponse.json({ error: 'remove.bg failed', status: r.status }, { status: 502 });
    }

    return new NextResponse(r.body, {
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
    });
}
