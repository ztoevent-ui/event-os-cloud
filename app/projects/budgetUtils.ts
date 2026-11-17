import { supabase } from '@/lib/supabaseClient';

export type BudgetItemMeta = {
    baseName: string;
    qty: number;
    unitPrice: number;
    hasQtyMeta: boolean;
};

export type HistoricalBudgetItem = {
    key: string;
    name: string;
    category: string;
    unitPrice: number;
    defaultQty: number;
    lastAmount: number;
    usageCount: number;
    lastUsedAt: string;
};

export const DEFAULT_BUDGET_CATEGORIES = [
    'Equipment',
    'Venue',
    'Staff',
    'Vehicle',
    'Transport',
    'Logistics',
    'F&B',
    'Decor',
    'Marketing',
    'Sponsorship',
    'Other',
];

export function round2(n: number): number {
    if (!Number.isFinite(n)) return 0;
    return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function fmtMoneyNum(n: number): string {
    const r = round2(n);
    return Number.isInteger(r) ? String(r) : r.toFixed(2);
}

/**
 * Extracts clean item name, quantity, and unit price from a `budgets.item` string
 * and its numeric `amount`.
 */
export function parseBudgetItemMeta(rawItem: string | null | undefined, amount: number | string | null | undefined): BudgetItemMeta {
    const text = (rawItem || '').trim();
    const total = Number(amount) || 0;

    // 1. Canonical format stored by this UI: "Item Name (14 × RM 120)" or "(14 x RM 120.50)"
    const canonical = text.match(/^(.*?)\s*\((\d+(?:\.\d+)?)\s*[×xX]\s*RM\s*(-?\d+(?:,\d{3})*(?:\.\d+)?)\)\s*$/);
    if (canonical) {
        const qty = Number(canonical[2]);
        const unitPrice = Number(canonical[3].replace(/,/g, ''));
        if (qty > 0 && Number.isFinite(unitPrice)) {
            return {
                baseName: canonical[1].trim() || text,
                qty,
                unitPrice,
                hasQtyMeta: true,
            };
        }
    }

    // 2. Legacy patterns commonly used across existing records:
    //    "(x20)", "- 14 Set", "*100pcs", "*3pcs", "x2"
    const parenX = text.match(/^(.*?)\s*\([x×*](\d+)\)\s*$/i);
    if (parenX) {
        const qty = Number(parenX[2]);
        if (qty > 0) {
            return {
                baseName: parenX[1].trim() || text,
                qty,
                unitPrice: round2(total / qty),
                hasQtyMeta: true,
            };
        }
    }

    const setMatch = text.match(/^(.*?)\s*-\s*(\d+)\s*Sets?\s*$/i);
    if (setMatch) {
        const qty = Number(setMatch[2]);
        if (qty > 0) {
            return {
                baseName: setMatch[1].trim() || text,
                qty,
                unitPrice: round2(total / qty),
                hasQtyMeta: true,
            };
        }
    }

    const pcsMatch = text.match(/^(.*?)\s*\*(\d+)\s*pcs?\s*$/i);
    if (pcsMatch) {
        const qty = Number(pcsMatch[2]);
        if (qty > 0) {
            return {
                baseName: pcsMatch[1].trim() || text,
                qty,
                unitPrice: round2(total / qty),
                hasQtyMeta: true,
            };
        }
    }

    const tailX = text.match(/^(.*?)\s+x(\d+)\s*$/i);
    if (tailX) {
        const qty = Number(tailX[2]);
        if (qty > 0) {
            return {
                baseName: tailX[1].trim() || text,
                qty,
                unitPrice: round2(total / qty),
                hasQtyMeta: true,
            };
        }
    }

    return {
        baseName: text,
        qty: 1,
        unitPrice: round2(total),
        hasQtyMeta: false,
    };
}

/**
 * Formats base item name + qty + unit price back into `budgets.item` cleanly.
 * Omits "(1 × RM ...)" when qty === 1 so single items remain clean.
 */
export function formatBudgetItemName(rawBaseName: string, qty: number, unitPrice: number): string {
    const clean = rawBaseName
        .replace(/\s*\(\d+(?:\.\d+)?\s*[×xX]\s*RM\s*-?\d+(?:,\d{3})*(?:\.\d+)?\)\s*$/, '')
        .trim();
    if (!clean) return '';
    if (!Number.isFinite(qty) || qty <= 0 || Math.abs(qty - 1) < 1e-6) {
        return clean;
    }
    const qStr = Number.isInteger(qty) ? String(qty) : String(round2(qty));
    return `${clean} (${qStr} × RM ${fmtMoneyNum(unitPrice)})`;
}

/**
 * Deduplicates historical `budgets` rows across all projects for quick reuse.
 * Keeps the most recent unit price, qty, and category while ranking frequent items first.
 */
export function buildHistoricalCatalog(rows: any[], filterType: 'expense' | 'income' = 'expense'): HistoricalBudgetItem[] {
    const sorted = [...(rows || [])]
        .filter(r => r?.type === filterType && r?.item)
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    const map = new Map<string, HistoricalBudgetItem>();
    for (const row of sorted) {
        const meta = parseBudgetItemMeta(row.item, row.amount);
        const name = meta.baseName.trim();
        if (!name) continue;
        const key = name.toLowerCase();
        const existing = map.get(key);
        if (!existing) {
            map.set(key, {
                key,
                name,
                category: row.category || '',
                unitPrice: meta.unitPrice,
                defaultQty: meta.qty > 0 ? meta.qty : 1,
                lastAmount: round2(Number(row.amount) || 0),
                usageCount: 1,
                lastUsedAt: row.created_at || '',
            });
        } else {
            existing.usageCount += 1;
        }
    }

    return Array.from(map.values()).sort((a, b) => {
        if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount;
        return new Date(b.lastUsedAt || 0).getTime() - new Date(a.lastUsedAt || 0).getTime();
    });
}

export async function fetchAllBudgetHistory(): Promise<any[]> {
    const { data, error } = await supabase
        .from('budgets')
        .select('item, amount, type, category, created_at')
        .order('created_at', { ascending: false })
        .limit(1000);
    if (error) {
        console.error('Failed to fetch historical budget items:', error);
        return [];
    }
    return data || [];
}
