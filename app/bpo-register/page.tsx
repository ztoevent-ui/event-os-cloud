'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User, Phone, Mail, Award, Users, CreditCard, ChevronRight, CheckCircle, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';
import Link from 'next/link';

export default function BpoRegisterPage() {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        team_id: `TEAM-${Math.floor(Math.random() * 9000) + 1000}`,
        p1_name: '',
        p1_ic_no: '',
        p1_hp: '',
        p1_email: '',
        p2_name: '',
        p2_ic_no: '',
        p2_hp: '',
        p2_email: '',
        group_name: "Men's Open",
        dupr_rating: 0.00,
    });

    const groups = ["Men's Open", "Women's Open", "Mixed Open", "Veteran 50+", "Youth 18-"];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('bpo_registrations')
                .insert([formData]);

            if (error) throw error;

            setSubmitted(true);
            Swal.fire({
                icon: 'success',
                title: 'Registration Successful!',
                text: `Welcome, ${formData.team_id}!`,
                background: '#1a1a1a',
                color: '#fff',
                timer: 3000
            });
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Submission Failed',
                text: err.message,
                background: '#1a1a1a',
                color: '#fff',
            });
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
                <div className="w-full max-w-lg text-center space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="mx-auto w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 ring-4 ring-green-500/10">
                        <CheckCircle size={48} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">Registration Confirmed!</h1>
                        <p className="mt-4 text-gray-400">You are officially registered for the BPO Pickleball Open 2026. See you on the court!</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                        <p className="text-xs text-blue-400 uppercase tracking-widest font-bold">Your Unique ID</p>
                        <p className="mt-2 text-4xl font-black text-white font-mono tracking-tighter">{formData.team_id}</p>
                    </div>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition" />
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-500 selection:text-white">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest border border-blue-500/20 mb-6 animate-in slide-in-from-top duration-700">
                        BPO Pickleball Open 2026
                    </span>
                    <h1 className="text-5xl sm:text-7xl font-black italic tracking-tighter uppercase whitespace-pre-line leading-[0.9] text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/20 animate-in fade-in duration-1000">
                        OFFICIAL<br />REGISTRATION
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-12 animate-in fade-in slide-in-from-bottom duration-1000">
                    {/* Step 1: Group & Rating */}
                    <section className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 sm:p-12 backdrop-blur-3xl shadow-2xl relative overflow-hidden group hover:border-blue-500/30 transition-all duration-500">
                        <Award className="absolute -right-4 -top-4 w-32 h-32 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12" />
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-blue-600 text-sm italic flex items-center justify-center not-italic">01</span>
                            CATEGORY & LEVEL
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">COMPETITION GROUP</label>
                                <select
                                    name="group_name"
                                    value={formData.group_name}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition appearance-none cursor-pointer"
                                >
                                    {groups.map(g => <option key={g} value={g} className="bg-[#1a1a1a]">{g}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 text-right block">TEAM DUPR (AVERAGE)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="dupr_rating"
                                    value={formData.dupr_rating}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition text-right font-mono"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Step 2: Player Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Player 1 Card */}
                        <section className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-3xl shadow-2xl group hover:border-blue-500/30 transition-all duration-500">
                            <h2 className="text-xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-blue-600 text-sm flex items-center justify-center not-italic">02</span>
                                CAPTAIN (P1)
                            </h2>
                            <div className="space-y-6">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">
                                        <User size={10} /> Full Name
                                    </div>
                                    <input
                                        type="text" name="p1_name" required value={formData.p1_name} onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        placeholder="Enter name"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">
                                        <CreditCard size={10} /> IC No / Passport
                                    </div>
                                    <input
                                        type="text" name="p1_ic_no" required value={formData.p1_ic_no} onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        placeholder="000000-00-0000"
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">
                                            <Phone size={10} /> Contact No
                                        </div>
                                        <input
                                            type="tel" name="p1_hp" required value={formData.p1_hp} onChange={handleChange}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                            placeholder="+60..."
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">
                                            <Mail size={10} /> Email
                                        </div>
                                        <input
                                            type="email" name="p1_email" required value={formData.p1_email} onChange={handleChange}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                            placeholder="example@mail.com"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Player 2 Card */}
                        <section className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-3xl shadow-2xl group hover:border-blue-500/30 transition-all duration-500">
                            <h2 className="text-xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-gray-700 text-sm flex items-center justify-center not-italic">03</span>
                                PARTNER (P2)
                            </h2>
                            <div className="space-y-6">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">
                                        <User size={10} /> Full Name
                                    </div>
                                    <input
                                        type="text" name="p2_name" required value={formData.p2_name} onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        placeholder="Enter name"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">
                                        <CreditCard size={10} /> IC No / Passport
                                    </div>
                                    <input
                                        type="text" name="p2_ic_no" required value={formData.p2_ic_no} onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        placeholder="000000-00-0000"
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">
                                            <Phone size={10} /> Contact No
                                        </div>
                                        <input
                                            type="tel" name="p2_hp" required value={formData.p2_hp} onChange={handleChange}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                            placeholder="+60..."
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">
                                            <Mail size={10} /> Email
                                        </div>
                                        <input
                                            type="email" name="p2_email" required value={formData.p2_email} onChange={handleChange}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                            placeholder="example@mail.com"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Final Actions */}
                    <div className="flex flex-col items-center gap-6 pt-8">
                        <p className="text-gray-500 text-xs uppercase tracking-widest text-center max-w-sm">
                            By clicking below, you agree to our <span className="text-gray-300 underline underline-offset-4 cursor-pointer">tournament terms</span> and confirm that both players are fit to compete.
                        </p>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full sm:w-80 h-16 rounded-2xl bg-blue-600 overflow-hidden shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] transition-all duration-300 active:scale-95 disabled:opacity-50"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            <span className="relative flex items-center justify-center gap-3 text-lg font-black tracking-tighter italic uppercase">
                                {loading ? 'Processing...' : 'Complete Entry'}
                                <ChevronRight size={20} className="not-italic transition-transform group-hover:translate-x-1" />
                            </span>
                        </button>
                    </div>
                </form>

                {/* Footer Decor */}
                <div className="mt-24 pt-12 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                    <p>© 2026 EVENT OS - BPO DIVISION</p>
                    <div className="flex gap-4">
                        <Link href="/bpo-admin" className="hover:text-gray-400 transition">Admin Portal</Link>
                        <span>|</span>
                        <span className="hover:text-gray-400 transition cursor-pointer">Privacy Policy</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
