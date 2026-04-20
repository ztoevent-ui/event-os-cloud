import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, company, email, phone, category, notes } = body;

        // 1. Insert into Supabase Table public_enquiries
        const { error: dbError } = await supabase
            .from('public_enquiries')
            .insert([{ contact_name: name, company_name: company, email, phone, event_category: category, notes }]);
            
        if (dbError) {
            console.error('DB Insert Error:', dbError);
            // We log the error but still try to send the email so the lead is never lost
        }

        // 2. Send email via Nodemailer using Gmail SMTP
        // Note: For Gmail, use an App Password, not the regular account password.
        if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_PASS
                }
            });

            const mailOptions = {
                from: process.env.GMAIL_USER,
                to: 'z.t.o.event@gmail.com', // Always dispatch here, as requested by the client
                subject: `New Event Consultation: ${category} from ${name}`,
                text: `
A new consultation enquiry has been submitted on the ZTO Event OS website.

--- Contact Details ---
Name: ${name}
Company: ${company}
Email: ${email}
Phone: ${phone}

--- Event Details ---
Event Type: ${category}
Notes / Requirements:
${notes}

-----------------------
Please log in to Event OS or reply directly to the customer at ${email}.
                `,
                replyTo: email, // So when ZTO hits 'reply' in Gmail, it goes directly to the customer
            };

            await transporter.sendMail(mailOptions);
        } else {
            console.warn("GMAIL_USER or GMAIL_PASS not found. Email bypassed.");
        }

        return NextResponse.json({ success: true, message: 'Enquiry submitted successfully' });

    } catch (error: any) {
        console.error('Enquiry Submission Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
