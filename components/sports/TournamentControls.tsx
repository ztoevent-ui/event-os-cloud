'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

interface TournamentControlsProps {
    categories: { id: string; name: string }[];
}

export function TournamentControls({ categories }: TournamentControlsProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [query, setQuery] = useState(searchParams?.get('q') || '');
    const activeCategory = searchParams?.get('category') || (categories.length > 0 ? categories[0].id : '');

    const updateParams = (key: string, value: string) => {
        const currentParams = searchParams ? searchParams.toString() : '';
        const params = new URLSearchParams(currentParams);
        if (value) params.set(key, value);
        else params.delete(key);
        
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Category Selector */}
            {categories.length > 0 && (
                <div className="flex gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => updateParams('category', cat.id)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                activeCategory === cat.id
                                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                                    : 'text-zinc-500 hover:text-white'
                            }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Search Box */}
            <div className="relative flex-1">
                <i className={`fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-xs ${isPending ? 'text-amber-500 animate-spin' : 'text-zinc-500'}`} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        // Debounce could be added, but for simple use case:
                        const val = e.target.value;
                        setTimeout(() => {
                            if (val === e.target.value) updateParams('q', val);
                        }, 300);
                    }}
                    placeholder="Search teams or players..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                />
            </div>
        </div>
    );
}
