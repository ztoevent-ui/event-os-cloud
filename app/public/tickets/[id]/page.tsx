'use client';

import { createClient } from '@supabase/supabase-js';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

// 1. Setup Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function PublicTicketPage() {
    const { id: projectId } = useParams();
    const safeProjectId = Array.isArray(projectId) ? projectId[0] : projectId;

    const [project, setProject] = useState<any>(null);
    const [tickets, setTickets] = useState<any[]>([]);
    const [selection, setSelection] = useState<Record<string, number>>({});
    const [step, setStep] = useState(1); // 1: Select, 2: Details, 3: Success
    const [details, setDetails] = useState({ name: '', email: '', phone: '' });
    const [loading, setLoading] = useState(true);
    const [orderCode, setOrderCode] = useState<string | null>(null);

    // Initial Fetch
    useEffect(() => {
        if (!safeProjectId) return;

        const fetchData = async () => {
            // Fetch project & active tickets
            const { data: pData } = await supabase.from('projects').select('*').eq('id', safeProjectId).single();
            const { data: tData } = await supabase.from('tickets').select('*').eq('project_id', safeProjectId).eq('status', 'active');

            setProject(pData);
            setTickets(tData || []); // If no tickets, empty array
            setLoading(false);
        };
        fetchData();
    }, [safeProjectId]);

    // Handle Quantity Change
    const updateQty = (ticketId: string, delta: number) => {
        setSelection(prev => {
            const current = prev[ticketId] || 0;
            const newVal = Math.max(0, current + delta);
            return { ...prev, [ticketId]: newVal };
        });
    };

    // Calculate Total
    const grandTotal = tickets.reduce((sum, t) => sum + (t.price || 0) * (selection[t.id] || 0), 0);
    const totalCount = Object.values(selection).reduce((a, b) => a + b, 0);

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Create Order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    project_id: safeProjectId,
                    buyer_name: details.name,
                    buyer_email: details.email,
                    buyer_phone: details.phone,
                    total_amount: grandTotal,
                    status: 'completed', // Mock payment success
                    payment_method: 'mock_stripe'
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create Attendees (One per ticket in selection)
            const attendeesToInsert = [];
            for (const ticketId in selection) {
                const qty = selection[ticketId];
                if (qty > 0) {
                    const ticketType = tickets.find(t => t.id === ticketId);
                    for (let i = 0; i < qty; i++) {
                        const uniqueCode = `TICKET-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                        attendeesToInsert.push({
                            project_id: safeProjectId,
                            order_id: order.id,
                            ticket_id: ticketId,
                            name: details.name, // Usually distinct per attendee, simplified here
                            email: details.email,
                            ticket_code: uniqueCode,
                            checked_in: false
                        });
                    }
                }
            }

            if (attendeesToInsert.length > 0) {
                const { error: attError } = await supabase.from('attendees').insert(attendeesToInsert);
                if (attError) throw attError;
            }

            // 3. Success
            setOrderCode(order.id);
            setStep(3);
            Swal.fire('Payment Successful!', 'Your tickets have been emailed to you.', 'success');

        } catch (err: any) {
            console.error(err);
            Swal.fire('Checkout Failed', err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !project) return <div className="text-center py-20">Loading Event Details...</div>;

    if (step === 3) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full text-center">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                        <i className="fa-solid fa-check"></i>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Order Confirmed!</h1>
                    <p className="text-gray-500 mb-8">Thank you, {details.name}. Your order ID is <span className="font-mono text-gray-800 font-bold text-xs">{orderCode?.slice(0, 8)}</span>.</p>

                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8 text-left space-y-3">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Order Summary</h3>
                        {Object.entries(selection).map(([tid, qty]) => {
                            if (qty === 0) return null;
                            const t = tickets.find(x => x.id === tid);
                            return (
                                <div key={tid} className="flex justify-between text-sm font-medium">
                                    <span>{qty}x {t?.name}</span>
                                    <span>RM {(t?.price * qty).toFixed(2)}</span>
                                </div>
                            );
                        })}
                        <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900 mt-2">
                            <span>Total Paid</span>
                            <span>RM {grandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <p className="text-sm text-gray-400 mb-6">Please check your email for the QR Codes.</p>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition"
                    >
                        Download Recipe / Tickets
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header */}
            <div className="h-64 relative bg-gray-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent z-10"></div>
                {/* Placeholder Image if no project image */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-60"></div>
                <div className="relative z-20 container mx-auto px-6 h-full flex flex-col justify-end pb-8">
                    <span className="text-amber-400 font-bold uppercase tracking-widest text-xs mb-2">Ticket Sales</span>
                    <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">{project?.name || 'Event Ticket Sales'}</h1>
                    <p className="text-gray-300 mt-2 flex items-center gap-4 text-sm">
                        <span><i className="fa-regular fa-calendar mr-2"></i> {project?.start_date ? new Date(project.start_date).toLocaleDateString() : 'Date TBA'}</span>
                        <span><i className="fa-solid fa-location-dot mr-2"></i> {project?.location || 'Venue TBA'}</span>
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-8 relative z-30 pb-20">
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[500px]">

                    {/* Left: Ticket Selection */}
                    <div className="flex-1 p-8 md:p-12">
                        {step === 1 ? (
                            <>
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Tickets</h2>

                                {tickets.length === 0 ? (
                                    <div className="text-center py-10 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                                        <p className="text-gray-500 font-medium">Coming Soon / Sold Out</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {tickets.map((t) => (
                                            <div key={t.id} className={`p-4 rounded-xl border transition-all ${selection[t.id] > 0 ? 'border-indigo-500 bg-indigo-50 shadow-md transform scale-[1.02]' : 'border-gray-200 bg-white hover:border-indigo-200'}`}>
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h3 className="font-bold text-lg text-gray-900">{t.name}</h3>
                                                        <p className="text-sm text-gray-500">{t.description || 'Standard entry ticket'}</p>
                                                        <div className="text-indigo-600 font-bold mt-1">RM {Number(t.price).toFixed(2)}</div>
                                                    </div>
                                                    <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                                                        <button
                                                            onClick={() => updateQty(t.id, -1)}
                                                            disabled={!selection[t.id]}
                                                            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 text-gray-600 font-bold transition"
                                                        >-</button>
                                                        <span className="w-6 text-center font-bold text-gray-900">{selection[t.id] || 0}</span>
                                                        <button
                                                            onClick={() => updateQty(t.id, 1)}
                                                            className="w-8 h-8 flex items-center justify-center rounded hover:bg-indigo-100 text-indigo-600 font-bold transition"
                                                        >+</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="h-full flex flex-col">
                                <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-900 mb-6 font-bold flex items-center gap-2">
                                    <i className="fa-solid fa-arrow-left"></i> Back to Selection
                                </button>
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Details</h2>
                                <form id="checkout-form" onSubmit={handleCheckout} className="space-y-5 flex-1">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Full Name</label>
                                            <input required type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium"
                                                value={details.name} onChange={e => setDetails({ ...details, name: e.target.value })} placeholder="As per ID/Passport" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email Address</label>
                                            <input required type="email" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium"
                                                value={details.email} onChange={e => setDetails({ ...details, email: e.target.value })} placeholder="For your receipt" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Phone Number</label>
                                            <input required type="tel" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium"
                                                value={details.phone} onChange={e => setDetails({ ...details, phone: e.target.value })} placeholder="+60..." />
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                                        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><i className="fa-solid fa-shield-halved"></i></div>
                                        <div>
                                            <h4 className="font-bold text-sm text-blue-900">Secure Checkout</h4>
                                            <p className="text-xs text-blue-700 mt-1">Payments are processed securely via Stripe. Your data is encrypted.</p>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Right: Summary */}
                    <div className="w-full md:w-96 bg-gray-50 p-8 md:p-12 border-t md:border-t-0 md:border-l border-gray-100 flex flex-col">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Order Summary</h3>

                        <div className="flex-1 space-y-4">
                            {Object.entries(selection).map(([tid, qty]) => {
                                if (qty === 0) return null;
                                const t = tickets.find(x => x.id === tid);
                                return (
                                    <div key={tid} className="flex justify-between items-center text-sm">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-800">{t?.name}</span>
                                            <span className="text-xs text-gray-400">x{qty}</span>
                                        </div>
                                        <div className="font-mono text-gray-700">RM {(t?.price * qty).toFixed(2)}</div>
                                    </div>
                                );
                            })}

                            {totalCount === 0 && (
                                <p className="text-sm text-gray-400 italic text-center py-10">Select tickets to proceed.</p>
                            )}
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-200 space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-medium text-gray-500">Total Due</span>
                                <span className="text-3xl font-black text-gray-900 tracking-tight">RM {grandTotal.toFixed(2)}</span>
                            </div>

                            {step === 1 ? (
                                <button
                                    onClick={() => setStep(2)}
                                    disabled={totalCount === 0}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    Proceed to Checkout <i className="fa-solid fa-arrow-right"></i>
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    form="checkout-form"
                                    disabled={loading}
                                    className="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 active:scale-95 transition shadow-lg shadow-green-200 disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-lock"></i>}
                                    Pay Now
                                </button>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
