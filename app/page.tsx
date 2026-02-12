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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Link href="/projects" className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-100 transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                                <i className="fa-solid fa-calendar-check"></i>
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 mb-2">Event Manager</h3>
                            <p className="text-gray-400 text-sm">Manage projects, timelines, tasks & budgets.</p>
                        </Link>

                        <Link href="/apps/check-in" className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-100 transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                                <i className="fa-solid fa-id-card"></i>
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 mb-2">On-site Check-in</h3>
                            <p className="text-gray-400 text-sm">Verify guests via QR and print badges instantly.</p>
                        </Link>

                        <Link href="/apps/lucky-draw" className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-100 transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                                <i className="fa-solid fa-gamepad"></i>
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 mb-2">Lucky Draw</h3>
                            <p className="text-gray-400 text-sm">Master control for Lucky Draw & Spin Wheel.</p>
                        </Link>

                        <Link href="/consultations" className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-100 transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                                <i className="fa-solid fa-clipboard-question"></i>
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 mb-2">Consultations</h3>
                            <p className="text-gray-400 text-sm">View all submitted consultation forms and AI summaries.</p>
                        </Link>

                        <Link href="/admin/sports" className="group bg-zinc-900 text-white p-6 rounded-2xl shadow-lg border border-yellow-600/30 hover:shadow-2xl hover:border-yellow-500 transition-all hover:-translate-y-1 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-bl-full"></div>
                            <div className="w-12 h-12 bg-yellow-400/10 text-yellow-400 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform border border-yellow-400/20">
                                <i className="fa-solid fa-medal animate-bounce"></i>
                            </div>
                            <h3 className="font-bold text-lg text-yellow-500 mb-2">ZTO Arena <span className="text-xs bg-yellow-500 text-black px-1.5 py-0.5 rounded ml-1 font-black">NEW</span></h3>
                            <p className="text-gray-400 text-sm">Professional Tournament Referee Console.</p>
                        </Link>
                    </div>
                </section>

                <hr className="border-gray-100" />

                {/* 2. Public Zone */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <i className="fa-solid fa-users"></i>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900">Public Services</h2>
                            <p className="text-gray-500 text-sm">Accessible to guests and clients.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Link href="/apps/ticketing/registration" className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                                <i className="fa-solid fa-ticket"></i>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Ticket Purchase</h3>
                                <p className="text-xs text-gray-400">Buy tickets with Guest Checkout.</p>
                            </div>
                        </Link>

                        <Link href="/public/consulting" className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                            <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link href="/apps/lucky-draw" className="block text-center bg-gray-900 p-4 rounded-xl hover:bg-gray-800 transition text-white">
                            <i className="fa-solid fa-gift text-2xl mb-2 text-yellow-400"></i>
                            <div className="font-bold text-sm">Lucky Draw Screen</div>
                        </Link>

                        <Link href="/display/layout/demo" className="block text-center bg-gray-900 p-4 rounded-xl hover:bg-gray-800 transition text-white">
                            <i className="fa-solid fa-layer-group text-2xl mb-2 text-blue-400"></i>
                            <div className="font-bold text-sm">3D Layout Viewer</div>
                        </Link>

                        <Link href="/display/sports" className="block text-center bg-zinc-900 p-4 rounded-xl hover:bg-black transition text-white border border-yellow-600/50 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                            <i className="fa-solid fa-trophy text-2xl mb-2 text-yellow-500 animate-pulse"></i>
                            <div className="font-bold text-sm text-yellow-500">ZTO Arena Live</div>
                        </Link>
                    </div>
                </section>

            </main>
        </div>
    );
}
