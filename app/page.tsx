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
                    </div>
                </section>

            </main>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h2 className="text-3xl font-black text-gray-900 mb-2">Command Center</h2>
          <p className="text-gray-500">Select a tool to launch.</p>
        </div>

        <div className="mb-12">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <i className="fa-solid fa-bolt"></i> Live Interaction
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/apps/lucky-draw"
              className="app-card bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group block"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                <i className="fa-solid fa-gift text-6xl text-red-500"></i>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600 text-xl mb-4 group-hover:bg-red-600 group-hover:text-white transition-colors">
                <i className="fa-solid fa-gift"></i>
              </div>
              <h4 className="text-lg font-bold text-gray-900">Lucky Draw Ultimate</h4>
              <p className="text-sm text-gray-500 mt-1">
                Full-screen lucky draw system with sound effects and confetti.
              </p>
              <div className="mt-4 flex items-center text-xs font-bold text-red-600">
                LAUNCH APP <i className="fa-solid fa-arrow-right ml-1"></i>
              </div>
            </Link>

            <Link
              href="/apps/spinning-wheel"
              className="app-card bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group block"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                <i className="fa-solid fa-circle-notch text-6xl text-emerald-500"></i>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 text-xl mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <i className="fa-solid fa-circle-notch"></i>
              </div>
              <h4 className="text-lg font-bold text-gray-900">Spinning Wheel Pro</h4>
              <p className="text-sm text-gray-500 mt-1">
                Canvas wheel + clean settings panel, Google Sheet/Excel import, big winner screen.
              </p>
              <div className="mt-4 flex items-center text-xs font-bold text-emerald-600">
                LAUNCH APP <i className="fa-solid fa-arrow-right ml-1"></i>
              </div>
            </Link>

            <Link
              href="/apps/zto-arena/master"
              className="app-card bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-[0_0_15px_rgba(0,0,0,0.5)] relative overflow-hidden group block"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                <i className="fa-solid fa-gamepad text-6xl text-amber-500"></i>
              </div>
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-500 text-xl mb-4 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                <i className="fa-solid fa-tablet-screen-button"></i>
              </div>
              <h4 className="text-lg font-bold text-white">ZTO Arena Master</h4>
              <p className="text-sm text-zinc-400 mt-1">
                iPad LAN-First Referee Console for Live Scoring & Overrides.
              </p>
              <div className="mt-4 flex items-center text-xs font-bold text-amber-500">
                ENTER CONSOLE <i className="fa-solid fa-arrow-right ml-1"></i>
              </div>
            </Link>

            <Link
              href="/apps/zto-arena/screen"
              className="app-card bg-black rounded-2xl p-6 border border-zinc-800 shadow-[0_0_15px_rgba(0,0,0,0.5)] relative overflow-hidden group block"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                <i className="fa-solid fa-tv text-6xl text-cyan-500"></i>
              </div>
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400 text-xl mb-4 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                <i className="fa-solid fa-display"></i>
              </div>
              <h4 className="text-lg font-bold text-white">ZTO Arena Display</h4>
              <p className="text-sm text-zinc-400 mt-1">
                Big Screen UI driven instantly by the Master Console.
              </p>
              <div className="mt-4 flex items-center text-xs font-bold text-cyan-400">
                LAUNCH SCREEN <i className="fa-solid fa-arrow-right ml-1"></i>
              </div>
            </Link>
          </div>
        </div>

        <div className="mb-12">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <i className="fa-solid fa-print"></i> Ticketing & Hardware
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="app-card disabled bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-gray-100 text-gray-400 text-[10px] font-bold px-2 py-1 rounded">
                DEV
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 text-xl mb-4">
                <i className="fa-solid fa-qrcode"></i>
              </div>
              <h4 className="text-lg font-bold text-gray-900">On-site Check-in</h4>
              <p className="text-sm text-gray-500 mt-1">
                QR scan check-in system linked to participant database.
              </p>
              <div className="mt-4 text-xs font-bold text-gray-300 flex items-center gap-1">
                <i className="fa-solid fa-lock"></i> COMING SOON
              </div>
            </div>

            <div className="app-card disabled bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-gray-100 text-gray-400 text-[10px] font-bold px-2 py-1 rounded">
                HARDWARE
              </div>
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-700 text-xl mb-4">
                <i className="fa-solid fa-id-card-clip"></i>
              </div>
              <h4 className="text-lg font-bold text-gray-900">Badge Auto-Print</h4>
              <p className="text-sm text-gray-500 mt-1">
                Auto-trigger thermal printers upon successful check-in.
              </p>
              <div className="mt-4 text-xs font-bold text-gray-300 flex items-center gap-1">
                <i className="fa-solid fa-lock"></i> COMING SOON
              </div>
            </div>

            <div className="app-card disabled bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-gray-100 text-gray-400 text-[10px] font-bold px-2 py-1 rounded">
                WEB
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 text-xl mb-4">
                <i className="fa-solid fa-ticket"></i>
              </div>
              <h4 className="text-lg font-bold text-gray-900">Ticket Sales</h4>
              <p className="text-sm text-gray-500 mt-1">
                Public facing website for selling event tickets.
              </p>
              <div className="mt-4 text-xs font-bold text-gray-300 flex items-center gap-1">
                <i className="fa-solid fa-lock"></i> COMING SOON
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <i className="fa-solid fa-layer-group"></i> Event Planning & Design
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="app-card disabled bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-gray-100 text-gray-400 text-[10px] font-bold px-2 py-1 rounded">
                DEV
              </div>
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 text-xl mb-4">
                <i className="fa-solid fa-cube"></i>
              </div>
              <h4 className="text-lg font-bold text-gray-900">3D Event Layout</h4>
              <p className="text-sm text-gray-500 mt-1">
                Design floor plans and outdoor setups in 3D.
              </p>
              <div className="mt-4 text-xs font-bold text-gray-300 flex items-center gap-1">
                <i className="fa-solid fa-lock"></i> COMING SOON
              </div>
            </div>

            <Link
              href="/apps/event-manager"
              className="app-card bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group block"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                <i className="fa-solid fa-calendar-check text-6xl text-blue-500"></i>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 text-xl mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <i className="fa-solid fa-calendar-check"></i>
              </div>
              <h4 className="text-lg font-bold text-gray-900">Event Manager</h4>
              <p className="text-sm text-gray-500 mt-1">
                Manage event schedules, tentative programs, and itineraries.
              </p>
              <div className="mt-4 flex items-center text-xs font-bold text-blue-600">
                LAUNCH APP <i className="fa-solid fa-arrow-right ml-1"></i>
              </div>
            </Link>
          </div>
        </div>

        <div className="mb-12">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <i className="fa-solid fa-rings-wedding"></i> Wedding Suite
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="app-card disabled bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center text-pink-500 text-xl mb-4">
                <i className="fa-solid fa-envelope-open-text"></i>
              </div>
              <h4 className="text-lg font-bold text-gray-900">Wedding RSVP</h4>
              <p className="text-sm text-gray-500 mt-1">
                Guest list management and attendance confirmation.
              </p>
              <div className="mt-4 text-xs font-bold text-gray-300 flex items-center gap-1">
                <i className="fa-solid fa-lock"></i> COMING SOON
              </div>
            </div>

            <div className="app-card disabled bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 text-xl mb-4">
                <i className="fa-solid fa-user-tie"></i>
              </div>
              <h4 className="text-lg font-bold text-gray-900">Butler Consulting Form</h4>
              <p className="text-sm text-gray-500 mt-1">
                Pre-event questionnaire for VIP wedding clients.
              </p>
              <div className="mt-4 text-xs font-bold text-gray-300 flex items-center gap-1">
                <i className="fa-solid fa-lock"></i> COMING SOON
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          &copy; 2025 EventOS System. All systems operational.
        </div>
      </footer>
    </div>
  );
}
