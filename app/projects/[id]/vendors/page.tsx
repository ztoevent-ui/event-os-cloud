'use client';
import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AddVendorButton, DeleteVendorButton, PrintReportButton } from '../../components/ProjectModals';
import { PrintBreakTrigger } from '../../components/PrintBreakTrigger';
import { usePrint } from '../../components/PrintContext';

export default function VendorsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [vendors, setVendors] = useState<any[]>([]);
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { pageBreakIds } = usePrint();

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        const { data: projectData } = await supabase.from('projects').select('type').eq('id', id).single();
        setProject(projectData);

        const { data: vendorsData } = await supabase
            .from('vendors')
            .select('*')
            .eq('project_id', id)
            .order('name', { ascending: true });
        
        setVendors(vendorsData || []);
        setLoading(false);
    };

    if (loading) return <div className="p-20 text-center animate-pulse">Syncing Vendor Directory...</div>;

    const isWedding = project?.type === 'wedding' || project?.type === 'wedding_fair';
    const theme = isWedding ? {
        border: 'border-pink-500/30',
        hoverBorder: 'hover:border-pink-500/50',
        primary: 'text-pink-500',
        hover: 'group-hover:text-pink-400'
    } : {
        border: 'border-amber-500/30',
        hoverBorder: 'hover:border-amber-500/50',
        primary: 'text-amber-500',
        hover: 'group-hover:text-amber-400'
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className={`flex justify-between items-center bg-zinc-900 border ${theme.border} p-6 rounded-2xl shadow-sm print:hidden`}>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white mb-2">Vendor Management</h1>
                    <p className="text-zinc-400 font-medium">Track contracts and contact details.</p>
                </div>
                <div className="flex gap-4">
                    <PrintReportButton title="Vendor List" />
                    <AddVendorButton projectId={id} isWedding={isWedding} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendors?.map((vendor) => (
                    <div key={vendor.id} className={`${pageBreakIds.includes(vendor.id) ? 'print:break-before-page' : ''}`}>
                      <div className={`bg-zinc-900 border border-zinc-800 p-6 rounded-2xl ${theme.hoverBorder} transition-all group relative overflow-hidden print:bg-white print:border-zinc-200 print:shadow-none print:p-4`}>
                        <div className="absolute top-4 right-4 print:hidden">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide border ${vendor.status === 'confirmed' ? 'bg-green-900/20 text-green-500 border-green-500/30' :
                                vendor.status === 'contacted' ? 'bg-blue-900/20 text-blue-500 border-blue-500/30' :
                                    'bg-zinc-800 text-zinc-500 border-zinc-700'
                                }`}>
                                {vendor.status}
                            </span>
                        </div>

                        <DeleteVendorButton id={vendor.id} projectId={id} />

                        <div className="mb-4">
                            <div className={`w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center ${theme.primary} text-xl border border-zinc-700 mb-4 group-hover:scale-110 transition-transform print:hidden`}>
                                <i className="fa-solid fa-store"></i>
                            </div>
                            <h3 className={`text-xl font-bold text-white ${theme.hover} transition-colors print:text-black`}>{vendor.name}</h3>
                            <p className="text-sm text-zinc-400 uppercase tracking-wide font-mono mt-1 print:text-zinc-500">{vendor.category}</p>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-zinc-800 print:border-zinc-100">
                            {vendor.contact_person && (
                                <div className="flex items-center gap-2 text-sm text-zinc-400 print:text-zinc-700">
                                    <i className="fa-regular fa-user w-4 text-center"></i>
                                    <span>{vendor.contact_person}</span>
                                </div>
                            )}
                            {vendor.phone && (
                                <div className="flex items-center justify-between gap-2 text-sm text-zinc-400 print:text-zinc-700">
                                    <div className="flex items-center gap-2">
                                        <i className="fa-solid fa-phone w-4 text-center"></i>
                                        <span>{vendor.phone}</span>
                                    </div>
                                    <a href={`https://wa.me/${vendor.phone.replace(/[^0-9]/g, '')}`} target="_blank" className="text-green-500 hover:text-green-400 print:hidden">
                                        <i className="fa-brands fa-whatsapp text-lg"></i>
                                    </a>
                                </div>
                            )}
                            {vendor.email && (
                                <div className="flex items-center justify-between gap-2 text-sm text-zinc-400 print:text-zinc-700">
                                    <div className="flex items-center gap-2">
                                        <i className="fa-solid fa-envelope w-4 text-center"></i>
                                        <span>{vendor.email}</span>
                                    </div>
                                    <a href={`mailto:${vendor.email}`} className="text-blue-500 hover:text-blue-400 print:hidden">
                                        <i className="fa-solid fa-paper-plane"></i>
                                    </a>
                                </div>
                            )}
                        </div>
                      </div>
                      <PrintBreakTrigger id={vendor.id} />
                    </div>
                ))}
            </div>

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
                    .text-white, .text-zinc-200, .text-zinc-400 {
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
