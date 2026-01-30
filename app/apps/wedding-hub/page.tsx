'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function WeddingDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.replace('/auth');
            } else {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto">
            <header className="mb-10">
                <h1 className="text-3xl font-black text-gray-900 mb-2">Welcome Back, Sarah & James!</h1>
                <p className="text-gray-500">Here's what's happening with your wedding planning.</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl border border-pink-100 shadow-sm flex flex-col justify-between h-32">
                    <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Total Guests</div>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-black text-gray-900">156</span>
                        <span className="text-xs text-green-500 font-bold bg-green-50 px-2 py-1 rounded-full">+12 new</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-pink-100 shadow-sm flex flex-col justify-between h-32">
                    <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Confirmed (Yes)</div>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-black text-gray-900">89</span>
                        <span className="text-xs text-gray-400 font-normal">57%</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-pink-100 shadow-sm flex flex-col justify-between h-32">
                    <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Declined</div>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-black text-gray-900">4</span>
                        <span className="text-xs text-gray-400 font-normal">2%</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-pink-100 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-pink-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                    <div className="text-sm font-medium text-gray-400 uppercase tracking-wide relative z-10">Pending</div>
                    <div className="flex items-end justify-between relative z-10">
                        <span className="text-4xl font-black text-pink-500">63</span>
                        <i className="fa-solid fa-hourglass-half text-pink-200 text-xl"></i>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Section */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Quick Actions */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <a href="/apps/wedding-hub/guests" className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-4 group">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <i className="fa-solid fa-user-plus"></i>
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900">Add Guest</div>
                                    <div className="text-xs text-gray-500">Manually add invitee</div>
                                </div>
                            </a>
                            <a href="/apps/wedding-hub/design" className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-4 group">
                                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <i className="fa-solid fa-palette"></i>
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900">Edit Design</div>
                                    <div className="text-xs text-gray-500">Change theme & music</div>
                                </div>
                            </a>
                        </div>
                    </section>

                    {/* Recent RSVPs */}
                    <section className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                            <h2 className="font-bold text-gray-900">Recent RSVPs</h2>
                            <button className="text-sm text-pink-600 font-medium hover:text-pink-700">View All</button>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {[
                                { name: "Alice Johnson", status: "attending", time: "2 hours ago", guests: 2, table: "Unassigned" },
                                { name: "Michael Chen", status: "declined", time: "5 hours ago", guests: 0, table: "-" },
                                { name: "The Wilson Family", status: "attending", time: "1 day ago", guests: 4, table: "Unassigned" }
                            ].map((guest, i) => (
                                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${guest.status === 'attending' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {guest.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{guest.name}</div>
                                            <div className="text-xs text-gray-400">{guest.time}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${guest.status === 'attending' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {guest.status === 'attending' ? 'Attending' : 'Declined'}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {guest.guests > 0 ? `${guest.guests} guests` : ''}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Sidebar Widgets */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                            <i className="fa-solid fa-music text-6xl"></i>
                        </div>
                        <h3 className="font-bold text-lg mb-2 relative z-10">Background Music</h3>
                        <p className="text-indigo-100 text-sm mb-6 relative z-10">Customize the vibe for your guests when they visit your RSVP page.</p>
                        <a href="/apps/wedding-hub/design" className="inline-block bg-white text-indigo-600 text-sm font-bold px-4 py-2 rounded-lg hover:bg-indigo-50 transition relative z-10">
                            Upload MP3
                        </a>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900">Seating Status</h3>
                            <i className="fa-solid fa-chair text-gray-400"></i>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">Seated Guests</span>
                                    <span className="font-bold text-gray-900">45/89</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-pink-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6">
                            <a href="/apps/wedding-hub/seating" className="text-sm text-pink-600 font-bold hover:text-pink-700 flex items-center justify-center border border-pink-200 rounded-lg py-2 hover:bg-pink-50 transition">
                                Manage Seating
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
