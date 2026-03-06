import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = request.headers.get('x-admin-secret');
        const registrations = await request.json();

        const ADMIN_SECRET = process.env.ADMIN_SECRET || 'bpo-demo-2026';

        if (secret !== ADMIN_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // GOOGLE AUTHENTICATION
        // Note: For this to work, you need:
        // 1. GOOGLE_SERVICE_ACCOUNT_EMAIL
        // 2. GOOGLE_PRIVATE_KEY (replace \n with actual newlines)
        // 3. GOOGLE_SHEET_ID

        const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        const sheetId = process.env.GOOGLE_SHEET_ID;

        if (!clientEmail || !privateKey || !sheetId) {
            console.warn('Google Sheets credentials not found. Returning success for demo purposes.');
            // For demo, we simulate success if env vars are missing
            return NextResponse.json({ success: true, message: 'Demo mode: Sync simulated.' });
        }

        const auth = new google.auth.JWT(
            clientEmail,
            undefined,
            privateKey,
            ['https://www.googleapis.com/auth/spreadsheets']
        );

        const sheets = google.sheets({ version: 'v4', auth });

        // Prepare headers and data
        const rows = [
            ['Team ID', 'P1 Name', 'P1 IC', 'P1 HP', 'P1 Email', 'P2 Name', 'P2 IC', 'P2 HP', 'P2 Email', 'Group', 'DUPR', 'Status', 'Timestamp'],
            ...registrations.map((r: any) => [
                r.team_id,
                r.p1_name,
                r.p1_ic_no,
                r.p1_hp,
                r.p1_email,
                r.p2_name,
                r.p2_ic_no,
                r.p2_hp,
                r.p2_email,
                r.group_name,
                r.dupr_rating,
                r.payment_status,
                r.created_at
            ])
        ];

        // Clear existing data and update
        await sheets.spreadsheets.values.clear({
            spreadsheetId: sheetId,
            range: 'Sheet1!A1:Z1000',
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: 'Sheet1!A1',
            valueInputOption: 'RAW',
            requestBody: { values: rows },
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Google Sheets Sync Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
