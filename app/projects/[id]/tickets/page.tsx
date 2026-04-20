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
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className={`bg-zinc-900 border ${theme.border} p-6 rounded-2xl shadow-sm flex justify-between items-center`}>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white mb-2 tracking-tight">Ticket Manager</h1>
                    <p className="text-zinc-400 font-medium">Configure ticket tiers and pricing.</p>
                </div>
                <div className="flex gap-4">
                    <PrintReportButton title="Ticket Tiers" />
                    <button
                        onClick={() => setFormVisible(!formVisible)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider text-black ${theme.bg} ${theme.hoverBg} transition shadow-lg print:hidden`}
                    >
                        <i className="fa-solid fa-plus mr-2"></i> New Tier
                    </button>
                    <a href={`/public/tickets/${projectId}`} target="_blank" className={`px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider ${theme.accentText} ${theme.accentBg} ${theme.accentBorder} border hover:bg-white/5 transition print:hidden`}>
                        <i className="fa-solid fa-eye mr-2"></i> Public Page
                    </a>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                    {loading && <p className="text-center py-10 opacity-50 text-zinc-500 italic">Gathering ticket data...</p>}

                    {!loading && tickets.length === 0 && (
                        <div className="bg-zinc-900 p-10 rounded-2xl border-2 border-dashed border-zinc-800 text-center">
                            <i className="fa-solid fa-ticket text-4xl text-zinc-700 mb-4"></i>
                            <h3 className="font-bold text-white">No Tickets Configured</h3>
                            <p className="text-sm text-zinc-500">Create a ticket tier to start selling.</p>
                        </div>
                    )}

                    {tickets.map(t => (
                        <div key={t.id} className={`${pageBreakIds.includes(t.id) ? 'print:break-before-page' : ''}`}>
                            <div className={`bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-800 flex justify-between items-center group hover:border-zinc-700 transition print:bg-white print:border-zinc-200 print:text-black print:shadow-none print:p-4 mb-4`}>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-bold text-white print:text-black">{t.name}</h3>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${t.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'} print:text-black print:border-zinc-200`}>{t.status}</span>
                                    </div>
                                    <p className="text-zinc-500 text-sm mt-1 print:text-zinc-600">{t.description}</p>
                                    <div className="flex items-center gap-4 mt-3 text-sm">
                                        <span className={`font-mono font-bold ${theme.accentText} ${theme.accentBg} border ${theme.accentBorder} px-2 py-1 rounded-lg print:text-black print:bg-white print:border-zinc-200`}>RM {Number(t.price).toFixed(2)}</span>
                                        <span className="text-zinc-500 font-mono text-xs print:text-black">Sold: <span className="text-white font-bold print:text-black">{t.quantity_sold || 0}</span> / {t.quantity_total}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-50 group-hover:opacity-100 transition print:hidden">
                                    <button onClick={() => toggleStatus(t)} className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors" title="Toggle Status">
                                        <i className={`fa-solid ${t.status === 'active' ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                            </div>
                            <PrintBreakTrigger id={t.id} />
                        </div>
                    ))}
                </div>

                {/* Form */}
                <div className={`lg:col-span-1 transition-all duration-300 print:hidden ${formVisible ? 'opacity-100 translate-x-0' : 'opacity-50 translate-x-10 pointer-events-none lg:opacity-100 lg:translate-x-0 lg:pointer-events-auto'}`}>
                    <div className="bg-zinc-900 p-6 rounded-2xl shadow-xl border border-zinc-800 sticky top-8">
                        <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                            <i className={`fa-solid fa-pen-nib ${theme.primary}`}></i> Configure Ticket
                        </h3>
                        <form onSubmit={handleCreate} className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Ticket Name</label>
                                <input required className={`w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white outline-none focus:ring-1 ${theme.ringClass} focus:border-transparent transition-all placeholder-zinc-700`} placeholder="e.g. Early Bird" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Price (RM)</label>
                                <input required type="number" step="0.01" className={`w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white outline-none focus:ring-1 ${theme.ringClass} focus:border-transparent transition-all font-mono`} value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Total Quantity</label>
                                <input required type="number" className={`w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white outline-none focus:ring-1 ${theme.ringClass} focus:border-transparent transition-all font-mono`} value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Description</label>
                                <textarea className={`w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white outline-none focus:ring-1 ${theme.ringClass} focus:border-transparent transition-all h-24 resize-none placeholder-zinc-700`} placeholder="What's included?" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <button type="submit" disabled={loading} className={`w-full py-3.5 ${theme.bg} ${theme.hoverBg} text-black rounded-xl font-black uppercase tracking-widest transition-all shadow-lg ${theme.shadow} mt-2 disabled:opacity-50 disabled:cursor-not-allowed`}>
                                {loading ? 'Saving...' : 'Create Ticket'}
                            </button>
                        </form>
                    </div>
                </div>
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
                    .bg-zinc-900, .bg-zinc-800, .bg-zinc-950 {
                        background: transparent !important;
                        color: black !important;
                        border-color: #eee !important;
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
