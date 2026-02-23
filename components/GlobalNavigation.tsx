'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

export function GlobalNavigation() {
    const pathname = usePathname();
    const router = useRouter();

    // Global 'fn+backspace' (Delete) or Backspace to go back, ignoring inputs.
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                const tag = document.activeElement?.tagName.toLowerCase();
                const isEditable = document.activeElement?.getAttribute('contenteditable') === 'true';
                if (tag !== 'input' && tag !== 'textarea' && !isEditable) {
                    e.preventDefault();
                    router.back();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    // Don't show navigation on homepage, admin pages (their own headers), or display pages (big screens)
    if (pathname === '/' || pathname.startsWith('/admin') || pathname.startsWith('/display')) return null;

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
        </div>
    );
}
