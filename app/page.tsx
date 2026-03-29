'use client';

import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function Home() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        checkUser();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Hero Section */}
            <header className="bg-white border-b border-gray-100 py-6 px-4 md:px-8 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <img
                        src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
                        alt="ZTO Logo"
                        className="w-10 h-10 object-contain rounded-lg shadow-sm"
                    />
                    <span className="font-bold text-xl text-gray-900 tracking-tight">ZTO Event OS</span>
                </div>
                <div className="flex gap-4">
                    {!user ? (
                        <Link href="/auth" className="text-gray-600 hover:text-indigo-600 font-bold px-4 py-2 transition">
                            Login / Staff
                        </Link>
                    ) : (
                        <Link href="/account" className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-bold px-4 py-2 transition">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                                <i className="fa-solid fa-user"></i>
                            </div>
                            <span>Dashboard</span>
                        </Link>
                    )}
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 space-y-12">

                {/* 1. Admin Zone */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <i className="fa-solid fa-lock"></i>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900">Admin Console</h2>
                            <p className="text-gray-500 text-sm">Restricted access for staff and event managers.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
                        <Link href="/projects" className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-100 transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                                <i className="fa-solid fa-calendar-check"></i>
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 mb-2">Projects & Events</h3>
                            <p className="text-gray-400 text-sm">Manage projects, timelines, tasks & budgets.</p>
                        </Link>


                        <Link href="/apps/zto-arena" className="group bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-800 hover:shadow-xl hover:border-amber-500 transition-all hover:-translate-y-1 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><i className="fa-solid fa-gamepad text-6xl text-amber-500"></i></div>
                            <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                                <i className="fa-solid fa-tablet-screen-button"></i>
                            </div>
                            <h3 className="font-bold text-lg text-white mb-2">ZTO Arena Hub</h3>
                            <p className="text-zinc-400 text-sm">Tournament orchestration & master controls.</p>
                        </Link>

                        <Link href="/apps/lucky-draw" className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-purple-100 transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                                <i className="fa-solid fa-gift"></i>
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 mb-2">Lucky Draw</h3>
                            <p className="text-gray-400 text-sm">Master control for Lucky Draw & Spin Wheel.</p>
                        </Link>

                        <Link href="/consultations" className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-teal-100 transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                                <i className="fa-solid fa-clipboard-question"></i>
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 mb-2">Consultations</h3>
                            <p className="text-gray-400 text-sm">View received consultation forms & leads.</p>
                        </Link>
                    </div>
                </section>

                <hr className="border-gray-100" />

                {/* 2. Public Zone */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                            <i className="fa-solid fa-star"></i>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900">Featured Events</h2>
                            <p className="text-gray-500 text-sm">Active registrations and public portals.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Link href="/apps/ticketing/bpo-2026" className="flex items-center gap-6 bg-zinc-950 p-8 rounded-[2rem] border border-amber-500/30 hover:shadow-[0_0_50px_rgba(245,158,11,0.15)] transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity"><i className="fa-solid fa-trophy text-8xl text-amber-500"></i></div>
                            <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-black text-3xl shadow-xl">
                                <i className="fa-solid fa-id-card"></i>
                            </div>
                            <div>
                                <h3 className="font-black text-2xl text-white tracking-widest uppercase">BPO <span className="text-amber-500 italic">2026</span></h3>
                                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Official Registration Portal</p>
                            </div>
                        </Link>

                        <Link href="/public/consulting" className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                            <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center text-xl">
                                <i className="fa-solid fa-clipboard-question"></i>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Start Consultation</h3>
                                <p className="text-xs text-gray-400">Tell us about your dream event.</p>
                            </div>
                        </Link>
                    </div>
                </section>

                <hr className="border-gray-100" />

                {/* 3. Display Zone */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                            <i className="fa-solid fa-tv"></i>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900">Display Screens</h2>
                            <p className="text-gray-500 text-sm">Read-only views for events and projectors.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link href="/apps/lucky-draw" className="flex items-center gap-4 bg-gray-900 p-4 rounded-xl hover:bg-gray-800 border border-gray-800 shadow-lg text-white group transition">
                            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-yellow-500 group-hover:scale-110 transition text-xl">
                                <i className="fa-solid fa-gift"></i>
                            </div>
                            <div>
                                <div className="font-bold text-sm">Lucky Draw Display</div>
                                <div className="text-xs text-gray-400">Full-screen confetti layer.</div>
                            </div>
                        </Link>

                        <Link href="/apps/zto-arena/screen" className="flex items-center gap-4 bg-black p-4 rounded-xl hover:bg-zinc-900 border border-cyan-900/50 shadow-[0_0_15px_rgba(6,182,212,0.1)] text-white group transition">
                            <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400 group-hover:scale-110 transition text-xl">
                                <i className="fa-solid fa-display"></i>
                            </div>
                            <div>
                                <div className="font-bold text-sm text-cyan-50">ZTO Arena Screen</div>
                                <div className="text-xs text-cyan-500/70">Live LAN Sync Billboard.</div>
                            </div>
                        </Link>
                    </div>
                </section>

            </main>
        </div>
    );
}
