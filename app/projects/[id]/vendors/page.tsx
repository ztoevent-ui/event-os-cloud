'use client';
import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AddVendorButton, DeleteVendorButton, PrintReportButton, EditVendorModal } from '../../components/ProjectModals';
import { PrintBreakTrigger } from '../../components/PrintBreakTrigger';
import { usePrint } from '../../components/PrintContext';

export default function VendorsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [vendors, setVendors] = useState<any[]>([]);
    const [editingVendor, setEditingVendor] = useState<any>(null);
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'name' | 'category' | 'status'>('name');
    const [searchQuery, setSearchQuery] = useState('');
    const { pageBreakIds, layoutType } = usePrint();

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

    const filteredVendors = vendors
        .filter(v => 
            v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (v.category || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'category') return (a.category || '').localeCompare(b.category || '');
            if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '');
            return 0;
        });

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

                {/* ── Stats + Actions Hub ── */}
                <div className="flex flex-wrap items-center gap-4">
                    {/* Premium Stats Pill */}
                    <div className="h-12 px-6 flex items-center gap-6 rounded-2xl bg-[#050505] border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#DEFF9A] shadow-[0_0_10px_rgba(222,255,154,0.5)]" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Total Vendors</span>
                            <span className="text-xs font-black text-[#DEFF9A] font-mono ml-2">{vendors.length}</span>
                        </div>
                        <div className="w-px h-4 bg-white/10" />
                        <div className="flex items-center gap-2">
                            <i className="fa-solid fa-check-circle text-[10px] text-emerald-500"></i>
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Confirmed</span>
                            <span className="text-xs font-black text-white font-mono ml-2">
                                {vendors.filter(v => v.status === 'confirmed').length}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <PrintReportButton title="Vendor List" />
                        <AddVendorButton projectId={id} isWedding={isWedding} />
                    </div>
                </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="print:hidden flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"></i>
                    <input
                        type="text"
                        placeholder="Search vendors by name or category..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-[#050505] border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-[#0056B3] focus:ring-1 focus:ring-[#0056B3] transition-all"
                    />
                </div>
                <div className="flex gap-4">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-[#050505] border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-[#0056B3] appearance-none"
                        style={{ WebkitAppearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%23fff\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right .5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                    >
                        <option value="name">Sort by Name</option>
                        <option value="category">Sort by Category</option>
                        <option value="status">Sort by Status</option>
                    </select>
                    <div className="flex bg-[#050505] border border-white/10 rounded-2xl p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-zinc-600 hover:text-white'}`}
                        >
                            <i className="fa-solid fa-border-all"></i>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-zinc-600 hover:text-white'}`}
                        >
                            <i className="fa-solid fa-list"></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Vendor Card Grid / List ── */}
            <div className={layoutType === 'table' ? 'print:hidden' : ''}>
                {filteredVendors.length === 0 ? (
                    <div className="col-span-full py-32 border border-dashed border-white/5 rounded-[32px] bg-white/[0.02] flex flex-col items-center justify-center opacity-30">
                        <i className="fa-solid fa-store-slash text-4xl mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">No vendors found</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredVendors.map((vendor) => (
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
                                <button
                                    onClick={() => setEditingVendor(vendor)}
                                    className="absolute top-4 right-28 print:hidden text-zinc-600 hover:text-[#0056B3] transition-colors bg-zinc-900 rounded-full w-8 h-8 flex items-center justify-center border border-zinc-700"
                                    title="Edit"
                                >
                                    <i className="fa-solid fa-pen text-xs"></i>
                                </button>

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
                        ))}
                    </div>
                ) : (
                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                <tr>
                                    <th className="px-6 py-4 border-b border-white/5">Vendor</th>
                                    <th className="px-6 py-4 border-b border-white/5">Category</th>
                                    <th className="px-6 py-4 border-b border-white/5">Contact</th>
                                    <th className="px-6 py-4 border-b border-white/5">Status</th>
                                    <th className="px-6 py-4 border-b border-white/5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredVendors.map(vendor => (
                                    <tr key={vendor.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-[#0056B3]">
                                                    <i className="fa-solid fa-store text-xs" />
                                                </div>
                                                <span className="font-bold text-white font-['Urbanist'] tracking-tight">{vendor.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-zinc-400">{vendor.category}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-zinc-400 space-y-1">
                                            {vendor.contact_person && <div><i className="fa-regular fa-user mr-2 text-zinc-600"/>{vendor.contact_person}</div>}
                                            {vendor.phone && <div><i className="fa-solid fa-phone mr-2 text-zinc-600"/>{vendor.phone}</div>}
                                            {vendor.email && <div><i className="fa-regular fa-envelope mr-2 text-zinc-600"/>{vendor.email}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border backdrop-blur-md ${
                                                vendor.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                vendor.status === 'contacted' ? 'bg-[#0056B3]/10 text-[#4da3ff] border-[#0056B3]/20' :
                                                'bg-white/5 text-zinc-500 border-white/10'
                                            }`}>
                                                {vendor.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setEditingVendor(vendor)} className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 text-zinc-500 hover:text-[#0056B3] hover:border-[#0056B3]/50 transition-colors flex items-center justify-center">
                                                <i className="fa-solid fa-pen text-[10px]" />
                                            </button>
                                            <DeleteVendorButton id={vendor.id} projectId={id} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <EditVendorModal
                vendor={editingVendor}
                projectId={id}
                isOpen={!!editingVendor}
                onClose={() => setEditingVendor(null)}
                onSuccess={() => fetchData()}
            />

            {/* ── Compact Table (Print Only) ── */}
            {layoutType === 'table' && (
                <div className="hidden print:block w-full mt-4">
                    <table className="w-full text-left text-[11px] border-collapse border border-black/20">
                        <thead>
                            <tr className="bg-black/5 border-b-2 border-black">
                                <th className="py-2 px-3 font-black uppercase w-[25%]">Vendor Name</th>
                                <th className="py-2 px-3 font-black uppercase w-[15%]">Category</th>
                                <th className="py-2 px-3 font-black uppercase w-[20%]">Contact Person</th>
                                <th className="py-2 px-3 font-black uppercase w-[25%]">Contact Info</th>
                                <th className="py-2 px-3 font-black uppercase text-center w-[15%]">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendors.map((vendor, idx) => (
                                <tr key={vendor.id} className={`border-b border-black/20 ${pageBreakIds.includes(vendor.id) ? 'print:break-before-page' : ''}`}>
                                    <td className="py-2 px-3 font-bold">{vendor.name}</td>
                                    <td className="py-2 px-3">{vendor.category}</td>
                                    <td className="py-2 px-3">{vendor.contact_person || '-'}</td>
                                    <td className="py-2 px-3">
                                        {vendor.phone && <div>{vendor.phone}</div>}
                                        {vendor.email && <div className="text-black/70">{vendor.email}</div>}
                                    </td>
                                    <td className="py-2 px-3 text-center uppercase font-bold text-[9px] tracking-widest">
                                        {vendor.status}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <style jsx global>{`
                @media print {
                    html, body, main { background: white !important; color: black !important; }
                    .print\\:hidden, nav, header, footer, button { display: none !important; }
                    .bg-white\\/\\[0\\.03\\] { background: transparent !important; border: 1px solid #eee !important; border-radius: 12px !important; }
                    .text-white, .text-zinc-400, .text-zinc-500 { color: black !important; }
                }
            `}</style>
        </div>
    );
}
