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
        border: 'border-[#0056B3]/30',
        hoverBorder: 'hover:border-[#0056B3]/30',
        primary: 'text-[#0056B3]',
        hover: 'group-hover:text-[#0056B3]'
    };

    return (
        <div className="flex flex-col flex-1 animate-in fade-in duration-700">
            {/* ── Page Header + Action Bar ── */}
            <div className="print:hidden flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                <div className="flex flex-col">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0056B3] mb-2">Supply Chain Hub</p>
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none font-['Urbanist']">
                        Vendor Registry
                    </h1>
                </div>

                {/* Action Hub */}
                <div className="flex items-center gap-3">
                    <PrintReportButton title="Vendor List" />
                    <AddVendorButton projectId={id} isWedding={isWedding} />
                </div>
            </div>

            {/* ── Vendor Card Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendors.length === 0 ? (
                    <div className="col-span-full py-32 border border-dashed border-white/5 rounded-[32px] bg-white/[0.02] flex flex-col items-center justify-center opacity-30">
                        <i className="fa-solid fa-store-slash text-4xl mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">No vendors registered</p>
                    </div>
                ) : (
                    vendors.map((vendor) => (
                        <div key={vendor.id} className={`${pageBreakIds.includes(vendor.id) ? 'print:break-before-page' : ''}`}>
                            <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[32px] hover:border-[#0056B3]/40 hover:shadow-[0_8px_32px_rgba(0,86,179,0.15)] transition-all group relative overflow-hidden h-full flex flex-col">
                                {/* Status Pill */}
                                <div className="absolute top-6 right-6 print:hidden">
                                    <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest border backdrop-blur-md ${
                                        vendor.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                        vendor.status === 'contacted' ? 'bg-[#0056B3]/10 text-[#4da3ff] border-[#0056B3]/20' :
                                        'bg-white/5 text-zinc-500 border-white/10'
                                    }`}>
                                        {vendor.status}
                                    </span>
                                </div>

                                <DeleteVendorButton id={vendor.id} projectId={id} />

                                <div className="mb-8">
                                    <div className="w-14 h-14 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center text-[#0056B3] text-xl mb-6 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(0,86,179,0.1)]">
                                        <i className="fa-solid fa-store" />
                                    </div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight font-['Urbanist'] group-hover:text-[#4da3ff] transition-colors leading-tight">
                                        {vendor.name}
                                    </h3>
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-2">{vendor.category}</p>
                                </div>

                                <div className="mt-auto space-y-4 pt-6 border-t border-white/5">
                                    {vendor.contact_person && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-600">
                                                <i className="fa-regular fa-user text-[10px]" />
                                            </div>
                                            <span className="text-xs font-bold text-zinc-400">{vendor.contact_person}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-600">
                                                <i className="fa-solid fa-phone text-[10px]" />
                                            </div>
                                            <span className="text-xs font-mono font-bold text-zinc-400">{vendor.phone || 'N/A'}</span>
                                        </div>
                                        {vendor.phone && (
                                            <a href={`https://wa.me/${vendor.phone.replace(/[^0-9]/g, '')}`} target="_blank" className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                                <i className="fa-brands fa-whatsapp text-sm" />
                                            </a>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-600">
                                                <i className="fa-solid fa-envelope text-[10px]" />
                                            </div>
                                            <span className="text-xs font-bold text-zinc-400 truncate max-w-[150px]">{vendor.email || 'N/A'}</span>
                                        </div>
                                        {vendor.email && (
                                            <a href={`mailto:${vendor.email}`} className="w-8 h-8 rounded-lg bg-[#0056B3]/10 border border-[#0056B3]/20 flex items-center justify-center text-[#4da3ff] hover:bg-[#0056B3] hover:text-white transition-all shadow-[0_0_15px_rgba(0,86,179,0.2)]">
                                                <i className="fa-solid fa-paper-plane text-[10px]" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <PrintBreakTrigger id={vendor.id} />
                        </div>
                    ))
                )}
            </div>

            <style jsx global>{`
                @media print {
                    @page { size: A4 portrait; margin: 15mm; }
                    html, body, main { background: white !important; color: black !important; }
                    .print\\:hidden, nav, header, footer, button { display: none !important; }
                    .bg-white\\/\\[0\\.03\\] { background: transparent !important; border: 1px solid #eee !important; border-radius: 12px !important; }
                    .text-white, .text-zinc-400, .text-zinc-500 { color: black !important; }
                }
            `}</style>
        </div>
    );
}
