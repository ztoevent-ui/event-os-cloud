'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

export function GlobalNavigation() {
    const pathname = usePathname();
    const router = useRouter();

    // Don't show navigation on homepage or admin pages (which have their own headers)
    if (pathname === '/' || pathname.startsWith('/admin')) return null;

    return (
        <div className="fixed top-4 left-4 z-[9999] flex items-center gap-3 transition-opacity duration-300 opacity-60 hover:opacity-100 group">
            {/* Logo -> Home */}
            <Link
                href="/"
                title="Back to Homepage"
                className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 hover:bg-black/80 hover:scale-105 transition shadow-lg shrink-0 overflow-hidden"
            >
                <img
                    src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
                    alt="Home"
                    className="w-full h-full object-cover"
                />
            </Link>

            {/* Back Button */}
            <button
                onClick={() => router.back()}
                title="Go Back"
                className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-white font-bold text-xs uppercase hover:bg-black/80 hover:scale-105 transition border border-white/10 shadow-lg flex items-center gap-2"
            >
                <i className="fa-solid fa-chevron-left"></i>
                <span>Back</span>
            </button>
        </div>
    );
}
