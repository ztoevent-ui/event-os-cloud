
import { createClient } from '@supabase/supabase-js';
import ConsultingForm from '../../components/ConsultingForm';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function ConsultationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch existing consultations for this project
    const { data: consultations, error } = await supabase
        .from('consulting_forms')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

    if (error) {
        return <div className="text-red-500">Error fetching consultations: {error.message}</div>;
    }

    if (!consultations || consultations.length === 0) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500 pb-20">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <h1 className="text-4xl font-serif text-zinc-900 mb-4">No Consultations Yet</h1>
                    <p className="text-zinc-500 text-lg">No consultation reports found for this project. You can add one manually below.</p>
                </div>
                <ConsultingForm projectId={id} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-end mb-8 border-b border-zinc-200 pb-4">
                <div>
                    <h1 className="text-3xl font-serif text-zinc-900 mb-2">Consultation Reports</h1>
                    <p className="text-zinc-500">AI-Powered summaries and client details.</p>
                </div>
                <Link
                    href={`/public/consulting?project_id=${id}`}
                    target="_blank"
                    className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black transition-colors flex items-center gap-2"
                >
                    <i className="fa-solid fa-arrow-up-right-from-square"></i> Public Form Link
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {consultations.map((c) => (
                    <div key={c.id} className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-serif font-bold text-zinc-900 flex items-center gap-2">
                                        {c.groom_name} <span className="text-amber-400 text-sm">&</span> {c.bride_name}
                                    </h3>
                                    <div className="flex gap-4 text-sm text-zinc-500 mt-1">
                                        <span><i className="fa-regular fa-calendar mr-1"></i> {c.wedding_date || 'No Date'}</span>
                                        <span><i className="fa-solid fa-location-dot mr-1"></i> {c.location || 'No Location'}</span>
                                        <span className="capitalize px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-100">{c.status || 'New'}</span>
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

            {/* Manual Add Button (opens modal or new page, currently just link or section) */}
            {/* For now we just list them, user can use the public link to simulate adding one */}
        </div>
    );
}
