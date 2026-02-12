'use client';

import { createClient } from '@supabase/supabase-js';
import { useState } from 'react';
import Swal from 'sweetalert2';

// 1. Setup Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 2. Main Registration Component
export default function TicketRegistrationPage() {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Generate a random ticket code (e.g., "T-A1B2C3")
            const ticketCode = `T-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            const { data, error } = await supabase
                .from('attendees')
                .insert([
                    { name, phone, ticket_code: ticketCode, checked_in: false }
                ])
                .select()
                .single();

            if (error) {
                Swal.fire('Error', `Registration failed: ${error.message}`, 'error');
                return;
            }

            // Success, display QR Code logic here or simple code
            setQrCode(ticketCode);
            Swal.fire('Registered!', `Your Ticket Code is: ${ticketCode}`, 'success');

        } catch (err: any) {
            Swal.fire('Error', `Something went wrong: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (qrCode) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-md w-full text-center">
                    <div className="bg-green-100 text-green-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <i className="fa-solid fa-check text-2xl"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Successful!</h2>
                    <p className="text-gray-500 mb-6">Screenshot this page or save your code.</p>

                    <div className="bg-gray-100 p-6 rounded-xl border-dashed border-2 border-gray-300 mb-6">
                        <div className="font-mono text-3xl font-black text-gray-900 tracking-wider">
                            {qrCode}
                        </div>
                        <p className="text-xs text-gray-400 mt-2 uppercase tracking-wide">Your Ticket Code</p>
                    </div>

                    <button
                        onClick={() => { setQrCode(null); setName(''); setPhone(''); }}
                        className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition text-sm uppercase tracking-wide"
                    >
                        Register Another
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white text-center">
                    <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Event Registration</h1>
                    <p className="opacity-80 text-sm">Join us for the Lucky Draw event!</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Your Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                            placeholder="e.g. John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Phone Number</label>
                        <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                            placeholder="e.g. +60123456789"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 active:scale-95 transition shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Registering...' : 'Get Ticket'}
                    </button>
                </form>
            </div>
        </div>
    );
}
