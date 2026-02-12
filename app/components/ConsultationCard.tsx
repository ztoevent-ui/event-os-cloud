'use client';

import { createClient } from '@supabase/supabase-js';
import { useState } from 'react';
import Link from 'next/link';
import { getAiSummaryAction } from '../projects/consultation-actions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ConsultationCardProps {
    consultation: any;
    onDelete: (id: string) => void;
    onUpdate: (updatedConsultation: any) => void;
}

export default function ConsultationCard({ consultation: c, onDelete, onUpdate }: ConsultationCardProps) {
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this consultation report? This action cannot be undone.')) return;
        setActionLoading(true);
        try {
            const { error } = await supabase.from('consulting_forms').delete().eq('id', c.id);
            if (error) throw error;
            onDelete(c.id);
        } catch (err: any) {
            alert('Failed to delete: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleRead = async () => {
        const newStatus = c.status === 'new' ? 'reviewed' : 'new';
        setActionLoading(true);
        try {
            const { error } = await supabase.from('consulting_forms').update({ status: newStatus }).eq('id', c.id);
            if (error) throw error;
            onUpdate({ ...c, status: newStatus });
        } catch (err: any) {
            alert('Failed to update status: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRegenerateAi = async () => {
        setActionLoading(true);
        try {
            const summary = await getAiSummaryAction(c.love_story || '', c.important_notes || '');
            if (!summary) throw new Error("AI returned empty summary");

            const { error } = await supabase.from('consulting_forms').update({ ai_summary: summary }).eq('id', c.id);
            if (error) throw error;

            onUpdate({ ...c, ai_summary: summary });
            alert('AI Summary Regenerated Successfully!');
        } catch (err: any) {
            alert('Failed to regenerate AI: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Consultation Report - ${c.groom_name} & ${c.bride_name}</title>
                        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
                        <style>
                            body { font-family: 'Times New Roman', serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; }
                            h1 { border-bottom: 2px solid #D4AF37; padding-bottom: 15px; margin-bottom: 30px; font-size: 28px; }
                            .section { margin-bottom: 30px; page-break-inside: avoid; }
                            .section h3 { font-size: 16px; text-transform: uppercase; letter-spacing: 1px; color: #D4AF37; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px; }
                            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                            .field { margin-bottom: 8px; font-size: 14px; }
                            .label { font-weight: bold; color: #666; width: 120px; display: inline-block; }
                            .ai-box { background: #fffbf0; border: 1px solid #faeccb; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
                            .ai-title { font-weight: bold; color: #b78a08; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; font-size: 14px; }
                            .vendor-item { padding: 10px; border: 1px solid #eee; border-radius: 4px; margin-bottom: 10px; background: #fafafa; }
                            .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; border: 1px solid #ccc; }
                            @media print {
                                body { padding: 0; }
                                .no-print { display: none; }
                            }
                        </style>
                    </head>
                    <body>
                        <div style="text-align: right; margin-bottom: 40px;">
                            <img src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG" style="height: 50px;" />
                        </div>
                        <h1>Event Consultation Report</h1>
                        
                        <div class="grid-2 section">
                            <div>
                                <div class="field"><span class="label">Clients:</span> <strong>${c.groom_name} & ${c.bride_name}</strong></div>
                                <div class="field"><span class="label">Date:</span> ${c.wedding_date || 'TBA'}</div>
                                <div class="field"><span class="label">Location:</span> ${c.location || '-'}</div>
                            </div>
                             <div>
                                <div class="field"><span class="label">Guests:</span> ${c.guest_count || '-'} (Est.)</div>
                                <div class="field"><span class="label">Budget:</span> ${c.budget_range || '-'}</div>
                                <div class="field"><span class="label">Submitted:</span> ${new Date(c.created_at).toLocaleDateString()}</div>
                            </div>
                        </div>

                        ${c.ai_summary ? `
                        <div class="ai-box">
                            <div class="ai-title"><i class="fa-solid fa-wand-magic-sparkles"></i> AI Client Analysis</div>
                            <div style="font-style: italic; line-height: 1.6;">"${c.ai_summary}"</div>
                        </div>` : ''}

                        <div class="section">
                            <h3>Contact Information</h3>
                            <div class="grid-2">
                                <div class="field"><span class="label">Phone:</span> ${c.contact_phone} (${c.contact_time || 'anytime'})</div>
                                <div class="field"><span class="label">Email:</span> ${c.contact_email || '-'}</div>
                            </div>
                        </div>

                        <div class="section">
                            <h3>Event Vision</h3>
                            <div class="field"><span class="label">Theme:</span> ${c.wedding_theme || 'Not decided'}</div>
                            <div class="field" style="margin-top: 10px;">
                                <span class="label" style="display:block; margin-bottom:5px;">Love Story / Vibe:</span>
                                <div style="background: #f9f9f9; padding: 10px; border-radius: 4px;">${c.love_story || '-'}</div>
                            </div>
                             <div class="field" style="margin-top: 10px;">
                                <span class="label" style="display:block; margin-bottom:5px;">Important Notes:</span>
                                <div style="background: #f9f9f9; padding: 10px; border-radius: 4px;">${c.important_notes || '-'}</div>
                            </div>
                        </div>

                        <div class="section">
                            <h3>Booked Vendors</h3>
                            ${c.booked_vendors && c.booked_vendors.length > 0 ?
                    c.booked_vendors.map((v: any) => `
                                    <div class="vendor-item">
                                        <div style="font-weight: bold; margin-bottom: 4px;">${v.service}</div>
                                        <div style="display: grid; grid-template-columns: 1fr 1fr; font-size: 13px; color: #555;">
                                            <div>Name: ${v.name || 'Unknown'}</div>
                                            <div>Contact: ${v.contact || '-'} (${v.phone || '-'})</div>
                                        </div>
                                    </div>
                                `).join('')
                    : '<p style="color: #999; font-style: italic;">No vendors booked yet.</p>'}
                        </div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
            }, 500);
        }
    };

    return (
        <div className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all ${c.status === 'reviewed' ? 'border-green-200 bg-green-50/10' : 'border-zinc-100'
            }`}>
            {/* Action Bar */}
            <div className="bg-zinc-50 border-b border-zinc-100 px-6 py-3 flex justify-between items-center text-xs">
                <div className="flex gap-2">
                    <button
                        onClick={handleToggleRead}
                        disabled={actionLoading}
                        className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-2 ${c.status === 'reviewed'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                            }`}>
                        {actionLoading ? <i className="fa-solid fa-spinner fa-spin"></i> :
                            c.status === 'reviewed' ? <i className="fa-solid fa-check-circle"></i> : <i className="fa-regular fa-circle"></i>
                        }
                        {c.status === 'reviewed' ? 'Reviewed' : 'Mark as Read'}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-3 py-1.5 rounded-md bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-indigo-600 font-medium transition flex items-center gap-2"
                    >
                        <i className="fa-solid fa-print"></i> Print
                    </button>
                </div>
                <div>
                    <button
                        onClick={handleDelete}
                        disabled={actionLoading}
                        className="text-zinc-400 hover:text-red-500 transition px-2 py-1"
                        title="Delete permanently"
                    >
                        {actionLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-trash"></i>}
                    </button>
                </div>
            </div>

            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-serif font-bold text-zinc-900 flex items-center gap-2">
                            {c.groom_name} <span className="text-amber-400 text-sm">&</span> {c.bride_name}
                        </h3>
                        <div className="flex gap-4 text-sm text-zinc-500 mt-1 items-center">
                            {c.projects?.name && (
                                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                                    {c.projects.name}
                                </span>
                            )}
                            {!c.projects?.name && (
                                <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                                    General Inquiry
                                </span>
                            )}
                            <span><i className="fa-regular fa-calendar mr-1"></i> {c.wedding_date || 'No Date'}</span>
                            <span><i className="fa-solid fa-location-dot mr-1"></i> {c.location || 'No Location'}</span>
                        </div>
                    </div>
                    <div className="text-right text-sm text-zinc-400">
                        Submitted: {new Date(c.created_at).toLocaleDateString()}
                    </div>
                </div>

                {/* AI Summary Section */}
                <div className="bg-gradient-to-r from-amber-50 to-white p-4 rounded-lg border border-amber-100 mb-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                        <i className="fa-solid fa-wand-magic-sparkles text-6xl text-amber-500"></i>
                    </div>
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-2">
                            <i className="fa-solid fa-wand-magic-sparkles"></i> AI Client Profile
                        </h4>
                        <button
                            onClick={handleRegenerateAi}
                            disabled={actionLoading}
                            className="text-xs text-amber-600/50 hover:text-amber-600 bg-white/50 hover:bg-white px-2 py-1 rounded transition border border-amber-100"
                        >
                            {actionLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-arrows-rotate"></i>} Regenerate
                        </button>
                    </div>
                    <p className="text-zinc-800 text-sm leading-relaxed italic font-serif">
                        "{c.ai_summary || 'Analysis pending...'}"
                    </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm border-t border-zinc-50 pt-4">
                    <div>
                        <h5 className="font-semibold text-zinc-900 mb-2">Contact Info</h5>
                        <p className="text-zinc-600 mb-1"><i className="fa-solid fa-phone w-4 text-zinc-400"></i> {c.contact_phone} <span className="text-zinc-400 text-xs">({c.contact_time})</span></p>
                        <p className="text-zinc-600"><i className="fa-solid fa-envelope w-4 text-zinc-400"></i> {c.contact_email || 'No Email'}</p>
                    </div>

                    <div>
                        <h5 className="font-semibold text-zinc-900 mb-2">Event Details</h5>
                        <p className="text-zinc-600 mb-1"><strong>Guests:</strong> {c.guest_count || '?'}</p>
                        <p className="text-zinc-600"><strong>Budget:</strong> {c.budget_range || '?'}</p>
                    </div>

                    <div>
                        <h5 className="font-semibold text-zinc-900 mb-2">Key Notes</h5>
                        <p className="text-zinc-600 line-clamp-2">{c.important_notes || 'None'}</p>
                    </div>
                </div>

                {/* Booked Vendors if any */}
                {c.booked_vendors && Array.isArray(c.booked_vendors) && c.booked_vendors.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-100 bg-zinc-50/50 -mx-6 -mb-6 px-6 pb-6">
                        <h5 className="font-semibold text-zinc-900 mb-3 text-xs uppercase tracking-wide pt-4">Already Booked Services</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {c.booked_vendors.map((v: any, idx: number) => (
                                <div key={idx} className="bg-white px-3 py-2 rounded-md text-xs border border-zinc-200 shadow-sm">
                                    <div className="font-bold text-zinc-700 mb-1">{v.service}</div>
                                    <div className="text-zinc-600 truncate">{v.name || 'Unknown'}</div>
                                    {(v.contact || v.phone) && (
                                        <div className="text-zinc-400 mt-1 flex gap-2">
                                            {v.contact && <span><i className="fa-regular fa-user"></i> {v.contact}</span>}
                                            {v.phone && <span><i className="fa-solid fa-phone"></i> {v.phone}</span>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
