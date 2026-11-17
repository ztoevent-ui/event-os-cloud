'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { HistoricalBudgetItem } from '../budgetUtils';

export function BudgetItemPicker({
    catalog,
    onSelect,
    label = 'Pick Past Item',
    compact = false,
    align = 'left',
}: {
    catalog: HistoricalBudgetItem[];
    onSelect: (item: HistoricalBudgetItem) => void;
    label?: string;
    compact?: boolean;
    align?: 'left' | 'right';
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('All');
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDocClick = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const categories = useMemo(() => {
        const set = new Set<string>();
        catalog.forEach(c => {
            if (c.category && c.category.trim()) set.add(c.category.trim());
        });
        return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
    }, [catalog]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return catalog.filter(item => {
            if (catFilter !== 'All' && item.category.trim() !== catFilter) return false;
            if (!q) return true;
            return (
                item.name.toLowerCase().includes(q) ||
                item.category.toLowerCase().includes(q)
            );
        });
    }, [catalog, search, catFilter]);

    const pick = (item: HistoricalBudgetItem) => {
        onSelect(item);
        setOpen(false);
        setSearch('');
    };

    return (
        <div ref={wrapRef} className="relative inline-block">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                title="Choose from previously used items"
                className={
                    compact
                        ? 'h-8 px-2.5 rounded-lg bg-ink/5 hover:bg-accent/20 border border-ink/10 hover:border-accent/40 text-zinc-300 hover:text-ink text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap'
                        : 'w-full justify-between px-3 py-2 rounded-xl bg-ink/5 hover:bg-accent/15 border border-ink/10 hover:border-accent/40 text-xs font-bold text-ink flex items-center gap-2 transition-colors cursor-pointer'
                }
            >
                <span className="flex items-center gap-1.5 truncate">
                    <i className="fa-solid fa-clock-rotate-left text-accent text-[11px]" />
                    <span>{label}</span>
                    {catalog.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-ink/10 text-[9px] font-mono text-zinc-400">
                            {catalog.length}
                        </span>
                    )}
                </span>
                <i className={`fa-solid fa-chevron-down text-[9px] text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div
                    className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-[min(360px,calc(100vw-2.5rem))] rounded-2xl bg-zinc-950 border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.85)] z-[80] overflow-hidden`}
                >
                    <div className="p-3 border-b border-white/10 space-y-2.5 bg-zinc-900/90">
                        <div className="relative">
                            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs" />
                            <input
                                type="text"
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search past items (e.g. Aircooler, Tent, Staff)..."
                                className="w-full bg-black/60 border border-white/15 rounded-xl pl-8 pr-7 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-accent"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs cursor-pointer"
                                >
                                    <i className="fa-solid fa-xmark" />
                                </button>
                            )}
                        </div>
                        {categories.length > 1 && (
                            <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCatFilter(cat)}
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors ${
                                            catFilter === cat
                                                ? 'bg-accent text-white'
                                                : 'bg-white/5 text-zinc-400 hover:text-white'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                        {filtered.length === 0 ? (
                            <div className="py-8 text-center text-[11px] text-zinc-500">
                                No matching past items
                            </div>
                        ) : (
                            filtered.map(item => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => pick(item)}
                                    className="w-full text-left px-3.5 py-2.5 hover:bg-white/[0.07] transition-colors flex items-center justify-between gap-3 cursor-pointer"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-bold text-white truncate">{item.name}</div>
                                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-zinc-500">
                                            {item.category && (
                                                <span className="uppercase font-bold tracking-wider text-zinc-400">{item.category}</span>
                                            )}
                                            {item.usageCount > 1 && (
                                                <span className="px-1.5 py-0.2 rounded bg-white/5 text-zinc-400 font-mono">
                                                    Used {item.usageCount}×
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-xs font-black font-mono text-emerald-400">
                                            RM {item.unitPrice.toFixed(2)}
                                        </div>
                                        {item.defaultQty > 1 && (
                                            <div className="text-[9px] font-mono text-zinc-500">
                                                last ×{item.defaultQty}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
