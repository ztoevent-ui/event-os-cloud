'use client';

import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ConsultationCard from '../components/ConsultationCard';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function GlobalConsultationsPage() {
    const [consultations, setConsultations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    useEffect(() => {
        fetchConsultations();
    }, []);

    const handleDelete = (id: string) => {
        setConsultations(prev => prev.filter(c => c.id !== id));
    };

    const handleUpdate = (updatedC: any) => {
        setConsultations(prev => prev.map(c => c.id === updatedC.id ? updatedC : c));
    };

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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {consultations.map((c: any) => (
                            <ConsultationCard
                                key={c.id}
                                consultation={c}
                                onDelete={handleDelete}
                                onUpdate={handleUpdate}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
