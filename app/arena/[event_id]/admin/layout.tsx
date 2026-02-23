import React from 'react';
import Link from 'next/link';

export default async function AdminSandboxLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ event_id: string }>;
}) {
    const { event_id } = await params;
    return (
        <div className="admin-sandbox bg-black min-h-screen text-white font-sans selection:bg-[#d4f933] selection:text-black flex flex-col">
            <header className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-950/50 backdrop-blur-md">
                <Link href="/" className="flex items-center gap-3 group hover:opacity-80 transition-all active:scale-95">
                    <img
                        src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
                        alt="ZTO Logo"
                        className="w-10 h-10 object-contain rounded-lg shadow-lg border border-white/10"
                    />
                    <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                        <span>ZTO Arena <span className="text-gray-500 font-normal">|</span></span>
                        <span className="text-[#d4f933]" id="master-console-tournament-name">{event_id}</span>
                    </h1>
                </Link>
                <div className="flex items-center gap-2 text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    SANDBOX SECURED
                </div>
            </header>
            <main className="p-8 flex-1 flex flex-col">{children}</main>
        </div>
    );
}
