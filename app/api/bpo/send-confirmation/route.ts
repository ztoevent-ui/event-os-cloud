import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const payload = await req.json();

        // In a real production scenario, you would integrate Resend, SendGrid, etc. here.
        // For example:
        // await resend.emails.send({
        //     from: 'ZTO Arena <noreply@ztoevent.com>',
        //     to: payload.p1_email,
        //     subject: 'Registration Confirmed: Sakura Bintulu Pickleball Open 2026',
        //     html: `<p>Payment Received. Status: Pending Confirmation.</p><p>Registration is an application. Slots are confirmed based on Team DUPR Ranking. Unsuccessful entries will receive a 100% refund after May 22, 2026.</p>`
        // });

        console.log(`[Email Mock] Sent confirmation email to ${payload.p1_email} and ${payload.p2_email}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
