'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function WeddingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const navItems = [
        { name: 'Dashboard', href: '/apps/wedding-hub', icon: 'fa-solid fa-chart-pie' },
        { name: 'Guest List', href: '/apps/wedding-hub/guests', icon: 'fa-solid fa-users' },
        { name: 'Seating Chart', href: '/apps/wedding-hub/seating', icon: 'fa-solid fa-chair' },
        { name: 'Design Invitation', href: '/apps/wedding-hub/design', icon: 'fa-solid fa-wand-magic-sparkles' },
        { name: 'Butler Schedule', href: '/apps/wedding-hub/schedule', icon: 'fa-solid fa-clipboard-list' },
    ];

    const [isClientMode, setIsClientMode] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setIsClientMode(params.get('role') === 'client');
    }, []);

    return (
        <div className="min-h-screen bg-pink-50/30 flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-pink-100 flex flex-col fixed h-full z-10 hidden md:flex">
                {!isClientMode && (
                    <div className="h-16 flex items-center px-6 border-b border-pink-100">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 bg-pink-100 text-pink-500 rounded-lg flex items-center justify-center group-hover:bg-pink-500 group-hover:text-white transition-colors">
                                <i className="fa-solid fa-arrow-left"></i>
                            </div>
                            <span className="font-bold text-gray-800">Back to Hub</span>
                        </Link>
                    </div>
                )}
                {isClientMode && (
                    <div className="h-16 flex items-center px-6 border-b border-pink-100">
                        <span className="font-black text-xl italic text-pink-500 tracking-wider font-serif">Sarah & James</span>
                    </div>
                )}

                <div className="p-6">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-pink-200">
                            <img
                                src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=100&h=100"
                                alt="Couple"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm">Sarah & James</h3>
                            <p className="text-xs text-pink-500">24 Oct 2026</p>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                        ? 'bg-pink-50 text-pink-600'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <i className={`${item.icon} w-5 text-center`}></i>
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-6 border-t border-pink-100">
                    <div className="bg-gradient-to-br from-pink-500 to-rose-400 rounded-xl p-4 text-white shadow-lg shadow-pink-200">
                        <p className="text-xs font-medium opacity-90 mb-1">Days to go</p>
                        <div className="text-2xl font-black">274 Days</div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-8">
                {children}
            </main>
        </div>
    );
}
