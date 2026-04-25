'use client';

import { createClient } from '@supabase/supabase-js';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { PrintReportButton } from '../../components/ProjectModals';
import { PrintBreakTrigger } from '../../components/PrintBreakTrigger';
import { usePrint } from '../../components/PrintContext';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function TicketManagerPage() {
    const { id } = useParams();
    const projectId = Array.isArray(id) ? id[0] : id;
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState<any>(null);
    const { pageBreakIds } = usePrint();

    const [formVisible, setFormVisible] = useState(false);
    const [formData, setFormData] = useState({ name: '', price: 0, description: '', quantity: 100, status: 'active' });

    useEffect(() => {
        fetchProjectData();
        fetchTickets();
    }, [projectId]);

    const fetchProjectData = async () => {
        const { data } = await supabase.from('projects').select('type').eq('id', projectId).single();
        setProject(data);
    };

    const isWedding = project?.type === 'wedding' || project?.type === 'wedding_fair';
    const theme = isWedding ? {
        primary: 'text-pink-500',
        bg: 'bg-pink-500',
        hoverBg: 'hover:bg-pink-600',
        border: 'border-pink-500/30',
        accentBg: 'bg-pink-500/10',
        accentText: 'text-pink-500',
        accentBorder: 'border-pink-500/20',
        ringClass: 'focus:ring-pink-500',
        shadow: 'shadow-pink-500/20'
    } : {
        primary: 'text-[#0056B3]',
        bg: 'bg-[#0056B3]',
        hoverBg: 'hover:bg-[#0056B3]',
        border: 'border-white/10',
        accentBg: 'bg-[#0056B3]/10',
        accentText: 'text-[#0056B3]',
        accentBorder: 'border-[#0056B3]/30',
        ringClass: 'focus:ring-[#0056B3]',
        shadow: 'shadow-blue-900/20'
    };

    const fetchTickets = async () => {
        const { data, error } = await supabase.from('tickets').select('*').eq('project_id', projectId).order('price', { ascending: true });
        if (error) console.error(error);
        setTickets(data || []);
        setLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.from('tickets').insert([{
                project_id: projectId,
                name: formData.name,
                price: formData.price,
                description: formData.description,
                quantity_total: formData.quantity,
                status: formData.status
            }]);

            if (error) throw error;

            Swal.fire('Success', 'Ticket Tier Created', 'success');
            setFormVisible(false);
            setFormData({ name: '', price: 0, description: '', quantity: 100, status: 'active' });
            fetchTickets();
        } catch (e: any) {
            Swal.fire('Error', e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (ticket: any) => {
        const newStatus = ticket.status === 'active' ? 'hidden' : 'active';
        await supabase.from('tickets').update({ status: newStatus }).eq('id', ticket.id);
        fetchTickets();
    };

    return (
        <div className="flex flex-col flex-1 animate-in fade-in duration-700">
            {/* ── Page Header + Action Bar ── */}
            <div className="print:hidden flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                <div className="flex flex-col">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0056B3] mb-2">Commerce Hub</p>
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none font-['Urbanist']">
                        Ticket Architecture
                    </h1>
                </div>

                {/* Action Hub */}
                <div className="flex flex-wrap items-center gap-3">
                    <PrintReportButton title="Ticket Tiers" />
                    <button
                        onClick={() => setFormVisible(!formVisible)}
                        className="h-11 px-8 rounded-xl bg-white text-black font-black text-[10px] tracking-widest uppercase hover:bg-zinc-200 transition-all flex items-center gap-2.5 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                        <i className="fa-solid fa-plus text-[10px]" /> New Tier
                    </button>
                    <a 
                        href={`/public/tickets/${projectId}`} 
                        target="_blank" 
                        className="h-11 px-8 rounded-xl bg-white/5 border border-white/10 text-white font-black text-[10px] tracking-widest uppercase hover:bg-white/10 transition-all flex items-center gap-2.5"
                    >
                        <i className="fa-solid fa-eye text-[10px]" /> Public Terminal
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* ── Ticket Tier Grid ── */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4 px-2">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Active Tiers</h2>
                        <span className="text-[9px] font-black bg-white/5 text-zinc-600 px-3 py-1 rounded-full border border-white/5 font-mono">
                            {tickets.length}
                        </span>
                    </div>

                    <div className="flex flex-col gap-6">
                        {loading && (
                            <div className="py-32 flex flex-col items-center justify-center opacity-30">
                                <i className="fa-solid fa-spinner fa-spin text-4xl mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing Tiers...</p>
                            </div>
                        )}

                        {!loading && tickets.length === 0 && (
                            <div className="py-32 border border-dashed border-white/5 rounded-[32px] bg-white/[0.02] flex flex-col items-center justify-center opacity-30">
                                <i className="fa-solid fa-ticket-alt text-4xl mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">No tiers configured</p>
                            </div>
                        )}

                        {tickets.map(t => (
                            <div key={t.id} className={`${pageBreakIds.includes(t.id) ? 'print:break-before-page' : ''}`}>
                                <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[32px] flex flex-col md:flex-row md:items-center justify-between gap-8 hover:border-[#0056B3]/40 transition-all group relative overflow-hidden print:bg-white print:border-zinc-200 print:text-black">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-4">
                                            <h3 className="text-2xl font-black text-white uppercase tracking-tight font-['Urbanist'] group-hover:text-[#4da3ff] transition-colors">{t.name}</h3>
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest border ${
                                                t.status === 'active' 
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                : 'bg-white/5 text-zinc-600 border-white/10'
                                            }`}>
                                                {t.status}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6 max-w-xl">
                                            {t.description || 'No tier description provided.'}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-6">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.3em] mb-1">Pricing</span>
                                                <span className="text-lg font-black text-white tabular-nums font-['Urbanist']">RM {Number(t.price).toFixed(2)}</span>
                                            </div>
                                            <div className="w-px h-8 bg-white/5" />
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.3em] mb-1">Utilization</span>
                                                <span className="text-lg font-black text-zinc-400 tabular-nums font-['Urbanist']">
                                                    <span className="text-white">{t.quantity_sold || 0}</span> / {t.quantity_total} Sold
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="shrink-0 flex items-center gap-3">
                                        <button onClick={() => toggleStatus(t)} className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-600 hover:text-[#4da3ff] hover:bg-[#0056B3]/10 transition-all print:hidden">
                                            <i className={`fa-solid ${t.status === 'active' ? 'fa-eye-slash' : 'fa-eye'}`} />
                                        </button>
                                        <button className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all print:hidden">
                                            <i className="fa-solid fa-trash-can" />
                                        </button>
                                    </div>
                                </div>
                                <PrintBreakTrigger id={t.id} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Configuration Console ── */}
                <div className={`lg:col-span-1 transition-all duration-500 print:hidden ${formVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12 pointer-events-none lg:opacity-100 lg:translate-x-0 lg:pointer-events-auto'}`}>
                    <div className="bg-white/[0.03] border border-white/5 p-10 rounded-[40px] shadow-2xl sticky top-8 group">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                            <i className="fa-solid fa-pen-nib text-8xl" />
                        </div>

                        <h3 className="text-2xl font-black text-white uppercase tracking-tight font-['Urbanist'] mb-10 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-[#0056B3] shadow-[0_0_10px_rgba(0,86,179,0.5)]" />
                            Tier Architect
                        </h3>

                        <form onSubmit={handleCreate} className="space-y-8 relative z-10">
                            <div>
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-3 block">Tier Designation</label>
                                <input 
                                    required 
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:border-[#0056B3]/40 focus:bg-white/[0.08] outline-none transition-all placeholder:text-zinc-800" 
                                    placeholder="e.g. VIP DIAMOND" 
                                    value={formData.name} 
                                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-3 block">Base Price (RM)</label>
                                    <input 
                                        required 
                                        type="number" 
                                        step="0.01" 
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:border-[#0056B3]/40 focus:bg-white/[0.08] outline-none transition-all font-mono" 
                                        value={formData.price} 
                                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-3 block">Inventory</label>
                                    <input 
                                        required 
                                        type="number" 
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:border-[#0056B3]/40 focus:bg-white/[0.08] outline-none transition-all font-mono" 
                                        value={formData.quantity} 
                                        onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-3 block">Tier Intelligence</label>
                                <textarea 
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:border-[#0056B3]/40 focus:bg-white/[0.08] outline-none transition-all h-32 resize-none placeholder:text-zinc-800" 
                                    placeholder="Define tier inclusions..." 
                                    value={formData.description} 
                                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading} 
                                className="w-full h-16 bg-[#0056B3] text-white font-black rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(0,86,179,0.3)] hover:shadow-[0_0_60px_rgba(0,86,179,0.5)] transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading ? 'Deploying...' : 'Initialize Tier'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { size: A4 portrait; margin: 15mm; }
                    html, body, main { background: white !important; color: black !important; }
                    .print\\:hidden, nav, header, footer, button { display: none !important; }
                    .bg-white\\/\\[0\\.03\\] { background: transparent !important; border: 1px solid #eee !important; border-radius: 12px !important; }
                    .text-white, .text-zinc-500, .text-zinc-600 { color: black !important; }
                }
            `}</style>
        </div>
    );
}
