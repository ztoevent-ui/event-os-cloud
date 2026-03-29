'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function BPORegistrationPage() {
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        role: 'Guest' as any,
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [successData, setSuccessData] = useState<any>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('tickets')
                .insert([{
                    event_id: 'BPO_2026',
                    attendee_name: formData.name,
                    attendee_company: formData.company,
                    attendee_role: formData.role,
                    status: 'issued'
                }])
                .select()
                .single();

            if (error) throw error;
            setSuccessData(data);
            
            // Auto-scroll to success
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err: any) {
            import('sweetalert2').then(Swal => {
                Swal.default.fire('Error', err.message, 'error');
            });
        } finally {
            setLoading(false);
        }
    };

    if (successData) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.1),transparent_70%)]">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-zinc-900 border border-amber-500/30 rounded-[2.5rem] p-12 text-center shadow-[0_0_100px_rgba(245,158,11,0.1)]">
                    <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                        <i className="fa-solid fa-check text-black text-3xl" />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Registration Confirmed</h2>
                    <p className="text-zinc-400 text-sm mb-8">Welcome to BPO 2026, <span className="text-amber-500 font-bold">{successData.attendee_name}</span>. Your digital pass is active.</p>
                    
                    <div className="bg-black/50 border border-white/5 rounded-2xl p-6 mb-8">
                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-2">Ticket ID</div>
                        <div className="text-white font-mono text-xs break-all opacity-60">{successData.id}</div>
                    </div>

                    <button onClick={() => setSuccessData(null)} className="w-full py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest hover:bg-amber-500 transition-all active:scale-95">Register Another</button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-amber-500 selection:text-black overflow-x-hidden">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 blur-[150px] rounded-full opacity-30" />
            </div>

            <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-20 min-h-screen flex flex-col md:flex-row gap-20 items-center">
                <div className="flex-1">
                    <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                        <span className="inline-block px-4 py-1 bg-amber-500 text-black text-[10px] font-black uppercase tracking-[0.4em] rounded-full mb-6">Open Registration</span>
                        <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-8">
                            BPO <span className="text-amber-500 italic">2026</span>
                        </h1>
                        <p className="text-zinc-400 text-lg max-w-lg leading-relaxed">
                            Join the most prestigious Pickleball tournament in Borneo. Secure your spot as a player or guest today.
                        </p>
                        
                        <div className="mt-12 flex gap-12">
                             <div className="flex flex-col">
                                <span className="text-2xl font-black text-white">480+</span>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Attendees</span>
                             </div>
                             <div className="flex flex-col">
                                <span className="text-2xl font-black text-white">RM 50k</span>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Prize Pool</span>
                             </div>
                        </div>
                    </motion.div>
                </div>

                <div className="w-full max-w-md">
                    <motion.form 
                        initial={{ y: 50, opacity: 0 }} 
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        onSubmit={handleSubmit}
                        className="bg-zinc-900/80 backdrop-blur-3xl border border-white/5 p-10 rounded-[3rem] shadow-2xl relative"
                    >
                        <h3 className="text-xl font-black uppercase tracking-widest mb-10 text-center">Registration Form</h3>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-3 ml-2">Full Name</label>
                                <input 
                                    required 
                                    className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-amber-500 transition-all font-bold placeholder:text-zinc-700" 
                                    placeholder="Enter your name"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-3 ml-2">Role</label>
                                    <select 
                                        className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-amber-500 transition-all font-bold appearance-none cursor-pointer"
                                        value={formData.role}
                                        onChange={e => setFormData({...formData, role: e.target.value})}
                                    >
                                        <option value="Guest">Guest</option>
                                        <option value="VIP">VIP</option>
                                        <option value="Media">Media</option>
                                        <option value="Speaker">Speaker</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-3 ml-2">Company</label>
                                    <input 
                                        className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-amber-500 transition-all font-bold placeholder:text-zinc-700" 
                                        placeholder="Optional"
                                        value={formData.company}
                                        onChange={e => setFormData({...formData, company: e.target.value})}
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full py-5 bg-amber-500 text-black rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 active:scale-95 disabled:opacity-50 mt-4"
                            >
                                {loading ? 'Processing...' : 'Register Now'}
                            </button>
                        </div>

                        <div className="mt-8 text-center">
                            <Link href="/" className="text-[9px] font-black text-zinc-600 uppercase tracking-widest hover:text-white transition-colors">Return to Homepage</Link>
                        </div>
                    </motion.form>
                </div>
            </div>
        </div>
    );
}
