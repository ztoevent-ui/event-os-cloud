'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User, Phone, Mail, Award, Users, CreditCard, ChevronRight, CheckCircle, ArrowLeft, Ticket, Sparkles } from 'lucide-react';
import Swal from 'sweetalert2';
import Link from 'next/link';
import confetti from 'canvas-confetti';

export default function BpoRegisterPage() {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    useEffect(() => {
        if (submitted) {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
                confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
            }, 250);
        }
    }, [submitted]);

    const [files, setFiles] = useState<{ p1_photo: File | null, p2_photo: File | null, dupr_screenshot: File | null }>({
        p1_photo: null, p2_photo: null, dupr_screenshot: null
    });
    const [formData, setFormData] = useState({
        team_id: `TEAM-${Math.floor(Math.random() * 9000) + 1000}`,
        p1_dupr_id: '',
        p1_name: '',
        p1_ic_no: '',
        p1_hp: '',
        p1_email: '',
        p2_dupr_id: '',
        p2_name: '',
        p2_ic_no: '',
        p2_hp: '',
        group_name: "Men's Doubles",
        dupr_rating: 0.00,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        if (e.target.files && e.target.files[0]) {
            setFiles(prev => ({ ...prev, [field]: e.target.files![0] }));
        }
    };

    const compressToWebP = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = event => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0);
                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob); else reject(new Error('Canvas empty'));
                    }, 'image/webp', 0.8);
                };
            };
            reader.onerror = error => reject(error);
        });
    };

    const uploadFile = async (file: File, path: string) => {
        const webpBlob = await compressToWebP(file);
        const webpFile = new File([webpBlob], `${path}.webp`, { type: 'image/webp' });
        const { data, error } = await supabase.storage.from('public_assets').upload(`bpo_2026/${webpFile.name}`, webpFile, { upsert: true });
        if (error) throw error;
        const { data: publicUrl } = supabase.storage.from('public_assets').getPublicUrl(`bpo_2026/${webpFile.name}`);
        return publicUrl.publicUrl;
    };

    const groups = ["Men's Doubles", "Women's Doubles", "Mixed Doubles"];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const now = new Date();
        const startDate = new Date('2026-05-01T00:00:00+08:00');
        const endDate = new Date('2026-05-15T23:59:59+08:00');

        if (now < startDate || now > endDate) {
            Swal.fire({
                icon: 'error',
                title: 'Registration Closed',
                text: 'The registration window is only open from May 1 to May 15, 2026.',
                background: '#1a1a1a',
                color: '#fff',
            });
            return;
        }

        if (!termsAccepted) {
            Swal.fire('Error', 'Please accept the Terms & Conditions.', 'error');
            return;
        }

        setLoading(true);

        try {
            let p1_photo_url = '';
            let p2_photo_url = '';
            let dupr_url = '';

            if (files.p1_photo) p1_photo_url = await uploadFile(files.p1_photo, `${formData.team_id}_p1_photo`);
            if (files.p2_photo) p2_photo_url = await uploadFile(files.p2_photo, `${formData.team_id}_p2_photo`);
            if (files.dupr_screenshot) dupr_url = await uploadFile(files.dupr_screenshot, `${formData.team_id}_dupr`);

            const payload = {
                team_id: formData.team_id,
                p1_name: formData.p1_name,
                p1_ic_no: formData.p1_ic_no,
                p1_hp: formData.p1_hp,
                p1_email: formData.p1_email,
                p1_profile_url: p1_photo_url,
                p2_name: formData.p2_name,
                p2_ic_no: formData.p2_ic_no,
                p2_hp: formData.p2_hp,
                p2_profile_url: p2_photo_url,
                group_name: formData.group_name,
                dupr_rating: formData.dupr_rating,
                registration_status: 'Pending_Verification',
                profile_photo_url: p1_photo_url,
                dupr_screenshot_url: dupr_url,
                data: {
                    p1_dupr_id: formData.p1_dupr_id,
                    p2_dupr_id: formData.p2_dupr_id
                }
            };

            const { error } = await supabase
                .from('bpo_registrations')
                .insert([payload]);

            if (error) throw error;

            await fetch('/api/bpo/send-confirmation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(e => console.error("Email API Error", e));

            setSubmitted(true);
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
            <div className="min-h-screen bg-[#040B16] flex items-center justify-center p-4 relative overflow-hidden font-sans">
                {/* Background ambient lighting */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/20 blur-[150px] rounded-full pointer-events-none" />

                <div className="w-full max-w-2xl text-center space-y-10 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">

                    {/* Logo & Small Success Icon */}
                    <div className="space-y-6 flex flex-col items-center">
                        <div className="flex justify-center">
                            <img
                                src="/bpo_logo.png"
                                alt="Sakura BPO 2026"
                                className="h-48 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] animate-pulse"
                            />
                        </div>

                        <div className="relative mx-auto w-16 h-16 flex items-center justify-center group">
                            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-md group-hover:bg-green-500/30 transition-all duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-green-500 to-emerald-400 rounded-full opacity-20 animate-pulse" />
                            <div className="relative bg-white/[0.05] border border-white/10 w-full h-full rounded-full flex items-center justify-center backdrop-blur-md shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                                <Sparkles className="absolute -top-1 -right-1 text-yellow-400 w-4 h-4 animate-bounce" />
                                <CheckCircle size={32} className="text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                            </div>
                        </div>
                    </div>

                    {/* Typography */}
                    <div className="space-y-4 mt-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300 uppercase tracking-widest backdrop-blur-md">
                            <Ticket size={14} className="text-blue-400" />
                            Application Received
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase whitespace-pre-line leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-2xl">
                            YOU'RE 1 STEP CLOSER <br /> TO THE CHAMPION.
                        </h1>
                        <p className="mt-4 text-lg text-gray-400 max-w-lg mx-auto leading-relaxed">
                            Your payment has been securely processed. <strong className="text-white font-semibold">Status: Pending Confirmation.</strong> Final entry results and brackets will be announced starting <span className="text-blue-400 font-bold">May 22, 2026</span>.
                        </p>
                    </div>

                    {/* ID Card */}
                    <div className="relative mx-auto max-w-sm group perspective-1000">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                        <div className="relative bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl overflow-hidden">
                            {/* Card sheen */}
                            <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] group-hover:left-[200%] transition-all duration-1500 ease-in-out" />

                            <p className="text-xs text-gray-500 uppercase tracking-[0.3em] font-black mb-2 flex items-center justify-center gap-2">
                                <Award size={12} className="text-orange-500" />
                                Official Team ID
                            </p>
                            <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500 font-mono tracking-tighter drop-shadow-lg">
                                {formData.team_id}
                            </p>

                            <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                                <span>BPO 2026</span>
                                <span>{formData.group_name}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-8 flex justify-center">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-all hover:scale-105 active:scale-95 group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Return to Homepage
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#040B16] text-white py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-orange-500 selection:text-white">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16 relative">
                    {/* Optional glow effect behind text */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/20 blur-[100px] rounded-full pointer-events-none" />
                    <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 text-gray-300 text-xs font-bold uppercase tracking-widest border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)] mb-6 animate-in slide-in-from-top duration-700 relative z-10">
                        BPO Pickleball Open 2026
                    </span>
                    <h1 className="text-5xl sm:text-7xl font-black italic tracking-tighter uppercase whitespace-pre-line leading-[0.9] text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/20 animate-in fade-in duration-1000">
                        OFFICIAL<br />REGISTRATION
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-12 animate-in fade-in slide-in-from-bottom duration-1000">
                    {/* Step 1: Group & Rating */}
                    <section className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 sm:p-12 backdrop-blur-3xl shadow-2xl relative overflow-hidden group hover:border-orange-500/40 transition-all duration-500">
                        <Award className="absolute -right-4 -top-4 w-32 h-32 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12" />
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3 relative z-10">
                            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.4)] text-sm italic flex items-center justify-center not-italic">01</span>
                            CATEGORY & LEVEL
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">COMPETITION GROUP</label>
                                <select
                                    name="group_name"
                                    value={formData.group_name}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 outline-none focus:border-green-400/50 focus:ring-1 focus:ring-green-400/50 transition appearance-none cursor-pointer"
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
                                    required
                                    value={formData.dupr_rating}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 outline-none focus:border-green-400/50 focus:ring-1 focus:ring-green-400/50 transition text-right font-mono"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div className="mt-8 space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 block text-center">Team DUPR Screenshot</label>
                            <input
                                type="file" accept="image/*" required onChange={e => handleFileChange(e, 'dupr_screenshot')}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-center text-sm text-gray-400 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600 cursor-pointer max-w-sm mx-auto block"
                            />
                            <p className="text-center text-[10px] text-gray-500 mt-2">Required for Verification</p>
                        </div>
                    </section>

                    {/* Step 2: Player Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Player 1 Card */}
                        <section className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-3xl shadow-2xl group hover:border-orange-500/40 transition-all duration-500">
                            <h2 className="text-xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.4)] text-sm flex items-center justify-center not-italic">02</span>
                                CAPTAIN (P1)
                            </h2>
                            <div className="space-y-6">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">
                                        <Award size={10} /> DUPR ID
                                    </div>
                                    <input
                                        type="text" name="p1_dupr_id" required value={formData.p1_dupr_id} onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition"
                                        placeholder="Enter DUPR ID"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">
                                        <User size={10} /> Full Name
                                    </div>
                                    <input
                                        type="text" name="p1_name" required value={formData.p1_name} onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition"
                                        placeholder="Enter name"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">
                                        <CreditCard size={10} /> IC No / Passport
                                    </div>
                                    <input
                                        type="text" name="p1_ic_no" required value={formData.p1_ic_no} onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition"
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
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition"
                                            placeholder="+60..."
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">
                                            <Mail size={10} /> Team Contact Email
                                        </div>
                                        <input
                                            type="email" name="p1_email" required value={formData.p1_email} onChange={handleChange}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition"
                                            placeholder="example@mail.com"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">
                                            <User size={10} /> Profile Photo (P1)
                                        </div>
                                        <input
                                            type="file" accept="image/*" required onChange={e => handleFileChange(e, 'p1_photo')}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-gray-400 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Player 2 Card */}
                        <section className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-3xl shadow-2xl group hover:border-orange-500/40 transition-all duration-500">
                            <h2 className="text-xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-pink-700 shadow-[0_0_10px_rgba(236,72,153,0.4)] text-sm flex items-center justify-center not-italic">03</span>
                                PARTNER (P2)
                            </h2>
                            <div className="space-y-6">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">
                                        <Award size={10} /> DUPR ID
                                    </div>
                                    <input
                                        type="text" name="p2_dupr_id" required value={formData.p2_dupr_id} onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition"
                                        placeholder="Enter DUPR ID"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">
                                        <User size={10} /> Full Name
                                    </div>
                                    <input
                                        type="text" name="p2_name" required value={formData.p2_name} onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition"
                                        placeholder="Enter name"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">
                                        <CreditCard size={10} /> IC No / Passport
                                    </div>
                                    <input
                                        type="text" name="p2_ic_no" required value={formData.p2_ic_no} onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition"
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
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition"
                                            placeholder="+60..."
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">
                                            <User size={10} /> Profile Photo (P2)
                                        </div>
                                        <input
                                            type="file" accept="image/*" required onChange={e => handleFileChange(e, 'p2_photo')}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-gray-400 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Final Actions */}
                    <div className="flex flex-col items-center gap-6 pt-8">
                        <div className="bg-white/5 border border-orange-500/20 rounded-xl p-6 max-w-2xl w-full">
                            <label className="flex items-start gap-4 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    required
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="mt-1 w-5 h-5 rounded border-gray-600 text-orange-500 focus:ring-orange-500 bg-black/20"
                                />
                                <span className="text-gray-300 text-sm leading-relaxed group-hover:text-white transition">
                                    Registration is an application. Slots are confirmed based on Team DUPR Ranking. Unsuccessful entries will receive a <strong className="text-orange-400">100% refund after May 22, 2026</strong>.
                                </span>
                            </label>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full sm:w-80 h-16 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 overflow-hidden shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_40px_rgba(249,115,22,0.6)] hover:from-orange-400 hover:to-orange-500 transition-all duration-300 active:scale-95 disabled:opacity-50"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
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
