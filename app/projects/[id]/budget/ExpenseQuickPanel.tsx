'use client';

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BudgetItemPicker } from '../../components/BudgetItemPicker';
import { DeleteBudgetButton } from '../../components/ProjectModals';
import {
    formatBudgetItemName,
    parseBudgetItemMeta,
    round2,
    type HistoricalBudgetItem,
} from '../../budgetUtils';

export function QuickAddExpensePanel({
    projectId,
    catalog,
    onAdded,
    onClose,
}: {
    projectId: string;
    catalog: HistoricalBudgetItem[];
    onAdded: (createdRow: any) => void;
    onClose?: () => void;
}) {
    const [baseName, setBaseName] = useState('');
    const [category, setCategory] = useState('');
    const [qty, setQty] = useState('1');
    const [unitPrice, setUnitPrice] = useState('');
    const [saving, setSaving] = useState(false);
    const qtyRef = useRef<HTMLInputElement>(null);

    const qNum = parseFloat(qty) || 0;
    const uNum = parseFloat(unitPrice) || 0;
    const total = round2(qNum * uNum);

    const handlePickPast = (picked: HistoricalBudgetItem) => {
        setBaseName(picked.name);
        setCategory(picked.category || '');
        setQty(String(picked.defaultQty > 0 ? picked.defaultQty : 1));
        setUnitPrice(String(picked.unitPrice));
        setTimeout(() => qtyRef.current?.select(), 20);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!baseName.trim() || qNum <= 0) return;
        setSaving(true);
        const formattedName = formatBudgetItemName(baseName, qNum, uNum);
        const { data, error } = await supabase
            .from('budgets')
            .insert({
                project_id: projectId,
                item: formattedName,
                amount: total,
                type: 'expense',
                category: category.trim(),
                status: 'planned',
            })
            .select()
            .single();
        setSaving(false);
        if (error) {
            alert('Failed to add expense: ' + error.message);
            return;
        }
        onAdded(data);
        setBaseName('');
        setCategory('');
        setQty('1');
        setUnitPrice('');
    };

    return (
        <form
            onSubmit={handleAdd}
            className="rounded-2xl border border-red-500/25 bg-zinc-900/90 p-4 space-y-3 shadow-lg"
        >
            <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-red-400 flex items-center gap-1.5">
                    <i className="fa-solid fa-bolt" /> Quick Add Expense
                </div>
                <div className="flex items-center gap-2">
                    <BudgetItemPicker
                        catalog={catalog}
                        onSelect={handlePickPast}
                        label="Past Items"
                        compact
                        align="right"
                    />
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-zinc-500 hover:text-ink text-xs px-1.5 py-1 cursor-pointer"
                            title="Collapse"
                        >
                            <i className="fa-solid fa-xmark" />
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_0.9fr] gap-2">
                <input
                    value={baseName}
                    onChange={e => setBaseName(e.target.value)}
                    required
                    placeholder="Item name (or pick past item above)..."
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-ink placeholder:text-zinc-500 focus:outline-none focus:border-red-400/60"
                />
                <input
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    list="quick-exp-categories"
                    placeholder="Category (e.g. Staff)"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-ink placeholder:text-zinc-500 focus:outline-none focus:border-red-400/60"
                />
            </div>

            <div className="grid grid-cols-[0.7fr_1fr_auto] gap-2 items-end">
                <div>
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Qty</label>
                    <input
                        ref={qtyRef}
                        type="number"
                        step="any"
                        min="0.01"
                        value={qty}
                        onChange={e => setQty(e.target.value)}
                        required
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-ink focus:outline-none focus:border-red-400/60"
                    />
                </div>
                <div>
                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1">Unit Price (RM)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={unitPrice}
                        onChange={e => setUnitPrice(e.target.value)}
                        required
                        placeholder="0.00"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-ink focus:outline-none focus:border-red-400/60"
                    />
                </div>
                <button
                    type="submit"
                    disabled={saving || !baseName.trim()}
                    className="h-[34px] px-4 rounded-xl bg-red-500 hover:bg-red-400 text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap"
                >
                    {saving ? <i className="fa-solid fa-circle-notch fa-spin" /> : <i className="fa-solid fa-plus" />}
                    <span>RM {total.toFixed(2)}</span>
                </button>
            </div>
        </form>
    );
}

export function ExpenseQuickEditRow({
    item,
    projectId,
    catalog,
    onSaved,
    onDeleted,
}: {
    item: any;
    projectId: string;
    catalog: HistoricalBudgetItem[];
    onSaved: (updatedRow: any) => void;
    onDeleted: (deletedId: string) => void;
}) {
    const initial = parseBudgetItemMeta(item.item, item.amount);
    const [baseName, setBaseName] = useState(initial.baseName);
    const [category, setCategory] = useState(item.category || '');
    const [qty, setQty] = useState(String(initial.qty || 1));
    const [unitPrice, setUnitPrice] = useState(String(initial.unitPrice));
    const [status, setStatus] = useState(item.status || 'planned');
    const [saving, setSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);

    useEffect(() => {
        const next = parseBudgetItemMeta(item.item, item.amount);
        setBaseName(next.baseName);
        setCategory(item.category || '');
        setQty(String(next.qty || 1));
        setUnitPrice(String(next.unitPrice));
        setStatus(item.status || 'planned');
    }, [item.id, item.item, item.amount, item.category, item.status]);

    const qNum = parseFloat(qty) || 0;
    const uNum = parseFloat(unitPrice) || 0;
    const computedAmount = round2(qNum * uNum);
    const formattedItem = formatBudgetItemName(baseName, qNum, uNum);

    const isDirty =
        formattedItem !== (item.item || '').trim() ||
        Math.abs(computedAmount - Number(item.amount)) > 0.005 ||
        category.trim() !== (item.category || '').trim() ||
        status !== (item.status || 'planned');

    const saveRow = async (overrides?: { name?: string; cat?: string; q?: number; u?: number; st?: string }) => {
        const nextName = overrides?.name ?? baseName;
        const nextCat = overrides?.cat ?? category;
        const nextQ = overrides?.q ?? qNum;
        const nextU = overrides?.u ?? uNum;
        const nextSt = overrides?.st ?? status;

        if (!nextName.trim() || nextQ <= 0) return;

        const nextFormatted = formatBudgetItemName(nextName, nextQ, nextU);
        const nextAmount = round2(nextQ * nextU);

        setSaving(true);
        const { data, error } = await supabase
            .from('budgets')
            .update({
                item: nextFormatted,
                amount: nextAmount,
                category: nextCat.trim(),
                status: nextSt,
            })
            .eq('id', item.id)
            .select()
            .single();
        setSaving(false);

        if (error) {
            alert('Save failed: ' + error.message);
            return;
        }
        onSaved(data);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 1200);
    };

    const handlePickPast = (picked: HistoricalBudgetItem) => {
        const nextQ = qNum > 0 ? qNum : picked.defaultQty;
        const nextU = picked.unitPrice;
        const nextCat = picked.category || category;
        setBaseName(picked.name);
        setCategory(nextCat);
        setQty(String(nextQ));
        setUnitPrice(String(nextU));
        saveRow({ name: picked.name, cat: nextCat, q: nextQ, u: nextU });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (isDirty) saveRow();
        }
    };

    return (
        <div
            onBlur={e => {
                if (!e.currentTarget.contains(e.relatedTarget as Node) && isDirty && !saving) {
                    saveRow();
                }
            }}
            className={`rounded-2xl border p-3.5 space-y-2.5 transition-colors ${
                isDirty
                    ? 'bg-amber-500/[0.06] border-amber-500/40'
                    : justSaved
                        ? 'bg-emerald-500/[0.06] border-emerald-500/40'
                        : 'bg-ink/[0.03] border-ink/10'
            }`}
        >
            <div className="flex items-center gap-2">
                <input
                    value={baseName}
                    onChange={e => setBaseName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-bold text-ink focus:outline-none focus:border-accent"
                    placeholder="Item name"
                />
                <BudgetItemPicker
                    catalog={catalog}
                    onSelect={handlePickPast}
                    label="Swap"
                    compact
                    align="right"
                />
                <DeleteBudgetButton
                    id={item.id}
                    projectId={projectId}
                    onSuccess={() => onDeleted(item.id)}
                />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-[0.9fr_0.65fr_0.85fr_0.8fr_auto] gap-2 items-center">
                <div>
                    <label className="block text-[8px] font-bold uppercase text-zinc-500 mb-0.5">Category</label>
                    <input
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        onKeyDown={handleKeyDown}
                        list="quick-exp-categories"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-zinc-300 focus:outline-none focus:border-accent"
                        placeholder="Category"
                    />
                </div>
                <div>
                    <label className="block text-[8px] font-bold uppercase text-zinc-500 mb-0.5">Qty</label>
                    <input
                        type="number"
                        step="any"
                        min="0.01"
                        value={qty}
                        onChange={e => setQty(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs font-mono font-bold text-ink focus:outline-none focus:border-accent"
                    />
                </div>
                <div>
                    <label className="block text-[8px] font-bold uppercase text-zinc-500 mb-0.5">Unit (RM)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={unitPrice}
                        onChange={e => setUnitPrice(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs font-mono font-bold text-ink focus:outline-none focus:border-accent"
                    />
                </div>
                <div>
                    <label className="block text-[8px] font-bold uppercase text-zinc-500 mb-0.5">Status</label>
                    <select
                        value={status}
                        onChange={e => {
                            const next = e.target.value;
                            setStatus(next);
                            saveRow({ st: next });
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-1.5 py-1 text-[11px] font-bold text-zinc-300 focus:outline-none focus:border-accent"
                    >
                        <option value="planned">planned</option>
                        <option value="confirmed">confirmed</option>
                        <option value="paid">paid</option>
                        <option value="cancelled">cancelled</option>
                    </select>
                </div>
                <div className="col-span-2 sm:col-span-1 flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-3">
                    <span className="text-xs font-black font-mono text-red-400 whitespace-nowrap">
                        − RM {computedAmount.toFixed(2)}
                    </span>
                    {isDirty ? (
                        <button
                            type="button"
                            onClick={() => saveRow()}
                            disabled={saving}
                            className="h-7 px-2.5 rounded-lg bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                            {saving ? <i className="fa-solid fa-circle-notch fa-spin" /> : <i className="fa-solid fa-check" />}
                            Save
                        </button>
                    ) : justSaved ? (
                        <span className="text-[10px] font-black text-emerald-400 px-1.5">
                            <i className="fa-solid fa-check" /> Saved
                        </span>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
