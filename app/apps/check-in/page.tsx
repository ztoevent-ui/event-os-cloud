'use client';

import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

// 1. Setup Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function CheckInPage() {
    const [scanCode, setScanCode] = useState('');
    const [attendee, setAttendee] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [recentCheckins, setRecentCheckins] = useState<any[]>([]);

    useEffect(() => {
        fetchRecent();
    }, []);

    const fetchRecent = async () => {
        const { data } = await supabase
            .from('attendees')
            .select('*')
            .eq('checked_in', true)
            .order('checked_in_at', { ascending: false })
            .limit(5);
        if (data) setRecentCheckins(data);
    };

    const handleCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setAttendee(null);

        try {
            // Find attendee by code
            const { data, error } = await supabase
                .from('attendees')
                .select('*')
                .eq('ticket_code', scanCode.toUpperCase().trim()) // Normalize
                .single();

            if (error || !data) {
                Swal.fire('Error', 'Invalid Ticket Code', 'error');
                return;
            }

            if (data.checked_in) {
                Swal.fire('Warning', `Already Checked In! (${new Date(data.checked_in_at).toLocaleTimeString()})`, 'warning');
                setAttendee(data);
                return;
            }

            // Perform Check-in
            const { error: updateError } = await supabase
                .from('attendees')
                .update({ checked_in: true, checked_in_at: new Date().toISOString() })
                .eq('id', data.id);

            if (updateError) throw updateError;

            Swal.fire('Success', `Welcome, ${data.name}!`, 'success');
            setAttendee({ ...data, checked_in: true });
            setScanCode('');
            fetchRecent(); // Refresh list

        } catch (err: any) {
            console.error(err);
            Swal.fire('Error', 'Check-in failed.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-4 font-sans">
            <div className="max-w-md mx-auto space-y-8">
                <header className="flex items-center justify-between border-b border-white/20 pb-4">
                    <h1 className="text-xl font-bold uppercase tracking-widest text-green-400">
                        <i className="fa-solid fa-qrcode mr-2"></i> Fast Check-In
                    </h1>
                    <div className="text-xs text-gray-500">ADMIN MODE</div>
                </header>

                <div className="bg-white/10 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
                    <form onSubmit={handleCheckIn} className="space-y-4">
                        <label className="text-xs uppercase font-bold text-gray-400">Scan / Type Code</label>
                        <div className="flex gap-2">
                            <input
                                autoFocus
                                value={scanCode}
                                onChange={(e) => setScanCode(e.target.value)}
                                className="flex-1 bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-2xl font-mono text-center tracking-widest focus:ring-2 focus:ring-green-500 outline-none uppercase placeholder-gray-700"
                                placeholder="T-XXXXXX"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-green-500 text-black font-bold px-6 py-2 rounded-xl hover:bg-green-400 transition"
                            >
                                GO
                            </button>
                        </div>
                    </form>
                </div>

                {attendee && (
                    <div className="bg-green-900/30 border border-green-500/50 p-6 rounded-2xl text-center">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-black text-3xl">
                            <i className="fa-solid fa-check"></i>
                        </div>
                        <h2 className="text-2xl font-bold">{attendee.name}</h2>
                        <p className="text-green-300 font-mono text-sm">{attendee.ticket_code}</p>
                        <div className="mt-4 text-xs uppercase tracking-wide bg-black/30 inline-block px-3 py-1 rounded">Checked In</div>
                    </div>
                )}

                <div className="space-y-2">
                    <h3 className="text-gray-500 text-xs font-bold uppercase">Recent Check-ins</h3>
                    {recentCheckins.map((p) => (
                        <div key={p.id} className="bg-white/5 p-3 rounded-lg flex justify-between items-center text-sm border border-white/5">
                            <span className="font-bold">{p.name}</span>
                            <span className="text-gray-500 font-mono text-xs">{new Date(p.checked_in_at).toLocaleTimeString().slice(0, 5)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
