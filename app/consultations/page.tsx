'use client';

import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function GlobalConsultationsPage() {
    const [consultations, setConsultations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchConsultations = async () => {
            try {
                // Fetch ALL consultations, regardless of project
                const { data, error } = await supabase
                    .from('consulting_forms')
                    .select(`
                        *,
                        projects (name)
                    `)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setConsultations(data || []);
            } catch (err: any) {
                console.error("Error fetching consultations:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchConsultations();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 py-6 px-4 md:px-8 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <Link href="/" className="flex items-center gap-3 group">
                        <img
                            src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
                            alt="ZTO Logo"
                            className="w-10 h-10 object-contain rounded-lg shadow-sm"
                        />
                        <span className="font-bold text-xl text-gray-900 tracking-tight">ZTO Event OS</span>
                    </Link>
                </div>
                <div className="flex gap-4">
                    <Link href="/" className="text-gray-600 hover:text-indigo-600 font-bold px-4 py-2 transition">
                        Exit
                    </Link>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8">
                <div className="flex justify-between items-end mb-8 border-b border-zinc-200 pb-4">
                    <div>
                        <h1 className="text-3xl font-serif text-zinc-900 mb-2">All Consultation Reports</h1>
                        <p className="text-zinc-500">Global view of all submitted consultations and AI summaries.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <i className="fa-solid fa-spinner fa-spin text-4xl text-indigo-500 mb-4"></i>
                        <p className="text-zinc-500">Loading reports...</p>
                    </div>
                ) : error ? (
                    <div className="text-red-500 p-8 bg-white rounded-xl border border-red-100 text-center">
                        <i className="fa-solid fa-triangle-exclamation text-2xl mb-2"></i>
                        <p>Error fetching consultations: {error}</p>
                    </div>
                ) : !consultations || consultations.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-zinc-100">
                        <i className="fa-solid fa-folder-open text-4xl text-zinc-300 mb-4"></i>
                        <h3 className="text-xl font-bold text-zinc-700">No Consultations Found</h3>
                        <p className="text-zinc-500">Consultation forms submitted will appear here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {consultations.map((c: any) => (
                            <div key={c.id} className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden hover:shadow-md transition-shadow">
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
                                                <span className={`capitalize px-2 py-0.5 rounded-full text-xs font-semibold border ${c.status === 'new' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-700 border-gray-100'
                                                    }`}>{c.status || 'New'}</span>
                                            </div>
                                        </div>
                                        <div className="text-right text-sm text-zinc-400">
                                            Submitted: {new Date(c.created_at).toLocaleDateString()}
                                        </div>
                                    </div>

                                    {/* AI Summary Section */}
                                    <div className="bg-gradient-to-r from-amber-50 to-white p-4 rounded-lg border border-amber-100 mb-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                                            <i className="fa-solid fa-wand-magic-sparkles text-6xl text-amber-500"></i>
                                        </div>
                                        <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <i className="fa-solid fa-wand-magic-sparkles"></i> AI Client Profile
                                        </h4>
                                        <p className="text-zinc-800 text-sm leading-relaxed italic font-serif">
                                            "{c.ai_summary || 'Analysis pending...'}"
                                        </p>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm border-t border-zinc-50 pt-4">
                                        <div>
                                            <h5 className="font-semibold text-zinc-900 mb-2">Contact Info</h5>
                                            <p className="text-zinc-600 mb-1"><i className="fa-solid fa-phone w-4 text-zinc-400"></i> {c.contact_phone}</p>
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
                                        <div className="mt-4 pt-4 border-t border-zinc-100">
                                            <h5 className="font-semibold text-zinc-900 mb-2 text-xs uppercase tracking-wide">Already Booked Services</h5>
                                            <div className="flex flex-wrap gap-2">
                                                {c.booked_vendors.map((v: any, idx: number) => (
                                                    <span key={idx} className="bg-zinc-50 text-zinc-600 px-3 py-1 rounded-md text-xs border border-zinc-200">
                                                        {v.service}: <strong>{v.name || 'Unknown'}</strong>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
