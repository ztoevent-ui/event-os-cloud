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
        const {
            name,
            company = '',
            email,
            phone,
            category,
            categoryLabel,
            eventDate = '',
            budgetRange = '',
            venue = '',
            notes = '',
            categoryDetails = {}
        } = body;

        // Build formatted details for notes and email
        const detailLines: string[] = [];
        if (eventDate) detailLines.push(`Target Event Date: ${eventDate}`);
        if (budgetRange) detailLines.push(`Estimated Budget: ${budgetRange}`);
        if (venue) detailLines.push(`Venue / Location: ${venue}`);

        // Category-specific details
        if (categoryDetails && typeof categoryDetails === 'object') {
            detailLines.push('--- Category Specific Requirements ---');
            for (const [key, val] of Object.entries(categoryDetails)) {
                if (val !== undefined && val !== null && val !== '') {
                    const formattedKey = key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase())
                        .replace(/_/g, ' ');
                    
                    if (Array.isArray(val)) {
                        detailLines.push(`${formattedKey}: ${val.join(', ')}`);
                    } else {
                        detailLines.push(`${formattedKey}: ${val}`);
                    }
                }
            }
        }

        if (notes) {
            detailLines.push('--- Additional Customer Notes ---');
            detailLines.push(notes);
        }

        const consolidatedNotes = detailLines.join('\n');
        const displayCategory = categoryLabel || category || 'General Enquiry';
        const companyOrName = company || name;

        // 1. Insert into Supabase Table public_enquiries
        const { error: dbError } = await supabase
            .from('public_enquiries')
            .insert([{
                contact_name: name,
                company_name: companyOrName,
                email,
                phone,
                event_category: displayCategory,
                notes: consolidatedNotes
            }]);
            
        if (dbError) {
            console.error('DB Insert Error:', dbError);
            // We log the error but still try to send the email so the lead is never lost
        }

        // 2. Send email via Nodemailer using Gmail SMTP
        if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_PASS
                }
            });

            const emailSubject = `[New Enquiry] ${displayCategory} - ${name} (${companyOrName})`;
            
            // Format HTML table for structured look
            const detailsHtml = detailLines.map(line => {
                if (line.startsWith('---')) {
                    return `<tr style="background:#f1f5f9;"><td colspan="2" style="padding:10px 14px;font-weight:bold;color:#0056B3;">${line.replace(/---/g, '').trim()}</td></tr>`;
                }
                const parts = line.split(': ');
                if (parts.length >= 2) {
                    const k = parts[0];
                    const v = parts.slice(1).join(': ');
                    return `<tr><td style="padding:8px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;width:35%;color:#475569;">${k}</td><td style="padding:8px 14px;border-bottom:1px solid #e2e8f0;color:#0f172a;">${v}</td></tr>`;
                }
                return `<tr><td colspan="2" style="padding:8px 14px;border-bottom:1px solid #e2e8f0;color:#334155;">${line}</td></tr>`;
            }).join('');

            const mailHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #0056B3, #0077CC); padding: 24px 32px; color: #ffffff;">
                    <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.85;">Zero To One Event OS</div>
                    <h2 style="margin: 6px 0 0; font-size: 22px; font-weight: 800;">New ${displayCategory} Consultation</h2>
                </div>
                
                <div style="padding: 24px 32px;">
                    <h3 style="font-size: 15px; color: #1e293b; margin-top: 0; margin-bottom: 12px; border-bottom: 2px solid #0056B3; padding-bottom: 6px;">Client Contact Information</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
                        <tr><td style="padding:8px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;width:35%;color:#475569;">Client Name</td><td style="padding:8px 14px;border-bottom:1px solid #e2e8f0;font-weight:bold;color:#0056B3;">${name}</td></tr>
                        <tr><td style="padding:8px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">Company / Org</td><td style="padding:8px 14px;border-bottom:1px solid #e2e8f0;color:#0f172a;">${company || '—'}</td></tr>
                        <tr><td style="padding:8px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">Phone / WhatsApp</td><td style="padding:8px 14px;border-bottom:1px solid #e2e8f0;color:#0f172a;"><a href="https://wa.me/${phone.replace(/[^0-9]/g, '')}" style="color:#0056B3;text-decoration:none;font-weight:bold;">${phone} (Chat on WhatsApp)</a></td></tr>
                        <tr><td style="padding:8px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#475569;">Email Address</td><td style="padding:8px 14px;border-bottom:1px solid #e2e8f0;color:#0f172a;"><a href="mailto:${email}" style="color:#0056B3;text-decoration:none;">${email}</a></td></tr>
                    </table>

                    <h3 style="font-size: 15px; color: #1e293b; margin-top: 0; margin-bottom: 12px; border-bottom: 2px solid #0056B3; padding-bottom: 6px;">Event & Scope Details</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px; background: #fafafa; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
                        ${detailsHtml}
                    </table>

                    <div style="margin-top: 28px; padding: 14px 20px; background: #f0f7ff; border-radius: 8px; border-left: 4px solid #0056B3; font-size: 13px; color: #1e3a8a;">
                        <strong>Next Action:</strong> Reply directly to this email to contact <strong>${name}</strong>, or click the WhatsApp link above to open a direct chat.
                    </div>
                </div>
            </div>
            `;

            const mailOptions = {
                from: process.env.GMAIL_USER,
                to: 'z.t.o.event@gmail.com',
                subject: emailSubject,
                text: `
New Event Consultation: ${displayCategory}
From: ${name} (${company || 'Personal'})
Phone: ${phone}
Email: ${email}

Details:
${consolidatedNotes}
                `,
                html: mailHtml,
                replyTo: email,
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
