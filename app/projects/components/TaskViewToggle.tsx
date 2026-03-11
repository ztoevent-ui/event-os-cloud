'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function TaskViewToggle() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const view = searchParams?.get('view') || 'board';

    const setView = (newView: 'board' | 'list') => {
        const params = new URLSearchParams(searchParams?.toString());
        params.set('view', newView);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex bg-zinc-800/50 p-1 rounded-xl border border-zinc-700">
            <button
                onClick={() => setView('board')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    view === 'board' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
                <i className="fa-solid fa-table-cells-large"></i>
                Board
            </button>
            <button
                onClick={() => setView('list')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    view === 'list' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
                <i className="fa-solid fa-list-ul"></i>
                List
            </button>
        </div>
    );
}
