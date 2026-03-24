'use client';

import { createClient } from '@supabase/supabase-js';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function TicketManagerPage() {
    const { id } = useParams();
    const projectId = Array.isArray(id) ? id[0] : id;
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [formVisible, setFormVisible] = useState(false);
    const [formData, setFormData] = useState({ name: '', price: 0, description: '', quantity: 100, status: 'active' });

    useEffect(() => {
        fetchTickets();
    }, [projectId]);

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
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <header className="max-w-7xl mx-auto mb-10 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Ticket Manager</h1>
                    <p className="text-gray-500 mt-1">Configure ticket tiers and pricing.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setFormVisible(!formVisible)}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition"
                    >
                        <i className="fa-solid fa-plus mr-2"></i> New Ticket Tier
                    </button>
                    <a href={`/public/tickets/${projectId}`} target="_blank" className="px-5 py-2.5 rounded-xl text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition">
                        <i className="fa-solid fa-eye mr-2"></i> View Public Page
                    </a>
                </div>
            </header>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                    {loading && <p className="text-center py-10 opacity-50">Loading tiers...</p>}

                    {!loading && tickets.length === 0 && (
                        <div className="bg-white p-10 rounded-2xl border-2 border-dashed border-gray-200 text-center">
                            <i className="fa-solid fa-ticket text-4xl text-gray-300 mb-4"></i>
                            <h3 className="font-bold text-gray-900">No Tickets Configured</h3>
                            <p className="text-sm text-gray-500">Create a ticket tier to start selling.</p>
                        </div>
                    )}

                    {tickets.map(t => (
                        <div key={t.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center group hover:border-indigo-200 transition">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-bold text-gray-900">{t.name}</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{t.status}</span>
                                </div>
                                <p className="text-gray-500 text-sm mt-1">{t.description}</p>
                                <div className="flex items-center gap-4 mt-3 text-sm">
                                    <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">RM {Number(t.price).toFixed(2)}</span>
                                    <span className="text-gray-400">Sold: {t.quantity_sold || 0} / {t.quantity_total}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                <button onClick={() => toggleStatus(t)} className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600" title="Toggle Status">
                                    <i className={`fa-solid ${t.status === 'active' ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                                {/* Edit & Delete could be added here */}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Form */}
                <div className={`lg:col-span-1 transition-all duration-300 ${formVisible ? 'opacity-100 translate-x-0' : 'opacity-50 translate-x-10 pointer-events-none lg:opacity-100 lg:translate-x-0 lg:pointer-events-auto'}`}>
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-100 sticky top-8">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <i className="fa-solid fa-pen-nib text-indigo-500"></i> Configure Ticket
                        </h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Ticket Name</label>
                                <input required className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Early Bird" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Price (RM)</label>
                                <input required type="number" step="0.01" className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Total Quantity</label>
                                <input required type="number" className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Description</label>
                                <textarea className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none" placeholder="What's included?" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:opacity-70">
                                {loading ? 'Saving...' : 'Create Ticket'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
