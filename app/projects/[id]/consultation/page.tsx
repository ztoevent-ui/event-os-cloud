'use client';
import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ConsultingForm from '../../components/ConsultingForm';
import ConsultationList from '../../components/ConsultationList';
import Link from 'next/link';
import { PrintReportButton } from '../../components/ProjectModals';

export default function ConsultationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<any>(null);
    const [consultations, setConsultations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        const { data: projectData } = await supabase.from('projects').select('type').eq('id', id).single();
        setProject(projectData);

        const { data: consultationsData } = await supabase
            .from('consulting_forms')
            .select('*')
            .eq('project_id', id)
            .order('created_at', { ascending: false });
        
        setConsultations(consultationsData || []);
        setLoading(false);
    };

    if (loading) return <div className="p-20 text-center animate-pulse">Syncing Consultation Archive...</div>;

    const isWedding = project?.type === 'wedding' || project?.type === 'wedding_fair';
    const theme = isWedding ? {
        border: 'border-pink-500/30',
        primary: 'bg-pink-500 hover:bg-pink-400 text-black',
        text: 'text-pink-500'
    } : {
        border: 'border-white/10',
        primary: 'bg-white hover:bg-zinc-200 text-black',
        text: 'text-white'
    };

    if (!consultations || consultations.length === 0) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500 pb-20">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <h1 className="text-4xl font-serif text-white mb-4">No Consultations Yet</h1>
                    <p className="text-zinc-500 text-lg">No consultation reports found for this project. You can add one manually below.</p>
                </div>
                <ConsultingForm projectId={id} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
            <div className={`flex justify-between items-end mb-8 border-b ${theme.border} pb-4 print:hidden`}>
                <div>
                    <h1 className="text-3xl font-serif text-white mb-2">Consultation Reports</h1>
                    <p className="text-zinc-400 font-medium">AI-Powered summaries and client details.</p>
                </div>
                <div className="flex gap-4">
                    <PrintReportButton title="Consultations" />
                    <Link
                        href={`/public/consulting?project_id=${id}`}
                        target="_blank"
                        className={`${theme.primary} px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg`}
                    >
                        <i className="fa-solid fa-arrow-up-right-from-square"></i> Public Link
                    </Link>
                </div>
            </div>

            <ConsultationList initialConsultations={consultations} />

            <style jsx global>{`
                @media print {
                    @page { margin: 15mm; }
                    html, body, main {
                        background: white !important;
                        color: black !important;
                    }
                    .print\\:hidden, nav, header, footer, button {
                        display: none !important;
                    }
                    .bg-zinc-900, .bg-zinc-800 {
                        background: transparent !important;
                        color: black !important;
                    }
                    .text-white, .text-zinc-400, .text-zinc-500 {
                        color: black !important;
                    }
                    .print\\:break-before-page {
                        break-before: page !important;
                    }
                }
            `}</style>
        </div>
    );
}
