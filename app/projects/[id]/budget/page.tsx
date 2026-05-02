'use client';
import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AddBudgetButton, DeleteBudgetButton, EditBudgetModal, PrintReportButton, CopyBudgetButton } from '../../components/ProjectModals';
import { PrintBreakTrigger } from '../../components/PrintBreakTrigger';
import { usePrint } from '../../components/PrintContext';

export default function BudgetPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [budgetItems, setBudgetItems] = useState<any[]>([]);
    const [project, setProject] = useState<any>(null);
    const [logoUrl, setLogoUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<any>(null);
    const { pageBreakIds, layoutType } = usePrint();

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        const { data: projectData } = await supabase.from('projects').select('type, name').eq('id', id).single();
        setProject(projectData);

        const { data: settingsData } = await supabase.from('tournament_settings').select('logo_url').eq('project_id', id).maybeSingle();
        if (settingsData?.logo_url) setLogoUrl(settingsData.logo_url);

        const { data: budgetData } = await supabase
            .from('budgets')
            .select('*')
            .eq('project_id', id)
            .order('type', { ascending: false })
            .order('category', { ascending: true })
            .order('created_at', { ascending: true });

        setBudgetItems(budgetData || []);
        setLoading(false);
    };

    if (loading) return (
        <div className="flex items-center gap-3 justify-center h-52 text-zinc-600 text-sm">
            <span className="w-4 h-4 rounded-full border-2 border-zinc-800 border-t-[#f59e0b] animate-spin" />
            Syncing Treasury Data…
        </div>
    );

    const expenses = budgetItems.filter(item => item.type === 'expense');
    const income   = budgetItems.filter(item => item.type === 'income');

    const totalSpends  = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalIncome  = income.reduce((sum, item) => sum + Number(item.amount), 0);
    const netBalance   = totalIncome - totalSpends;

    const statusColor: Record<string, string> = {
        paid:      '#22c55e',
        received:  '#22c55e',
        confirmed: '#0056B3',
        planned:   '#71717a',
        cancelled: '#ef4444',
    };

    return (
        <div className="flex flex-col flex-1 animate-in fade-in duration-700">

            {/* ── PRINT HEADER (hidden on screen) ── */}
            <div className="hidden print:block mb-4">
                <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                        <img src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG" alt="ZTO" crossOrigin="anonymous" className="w-7 h-7 object-contain" />
                        <span className="font-black text-[11px] text-black tracking-tight uppercase">ZTO Event OS</span>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-black text-black uppercase tracking-widest">Budget Report</p>
                        {project?.name && <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">{project.name}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                        {logoUrl && <img src={logoUrl} alt="Event Logo" crossOrigin="anonymous" className="h-8 w-auto object-contain" />}
                        <span className="text-[9px] text-zinc-400 font-bold">{new Date().toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                </div>

                {/* Summary row */}
                <div className="flex items-center gap-6 mb-4 bg-zinc-100 rounded px-4 py-2">
                    <div>
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Total Expenses</span>
                        <p className="text-sm font-black text-red-600 font-mono">RM {totalSpends.toFixed(2)}</p>
                    </div>
                    <div className="w-px h-8 bg-zinc-300" />
                    <div>
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Total Income</span>
                        <p className="text-sm font-black text-green-600 font-mono">RM {totalIncome.toFixed(2)}</p>
                    </div>
                    <div className="w-px h-8 bg-zinc-300" />
                    <div>
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Net Balance</span>
                        <p className={`text-sm font-black font-mono ${netBalance >= 0 ? 'text-green-700' : 'text-red-600'}`}>RM {netBalance.toFixed(2)}</p>
                    </div>
                    <div className="ml-auto text-[9px] text-zinc-400 font-bold">
                        {expenses.length} expense{expenses.length !== 1 ? 's' : ''} · {income.length} income record{income.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            {/* ── SCREEN HEADER ── */}
            <div className="print:hidden flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                <div className="flex flex-col">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0056B3] mb-2">Financial Hub</p>
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none font-['Urbanist']">
                        Budget Ledger
                    </h1>
                </div>

                {/* Stats + Actions */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-xl">
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Expenses</p>
                            <p className="text-lg font-black text-red-400 font-mono">RM {totalSpends.toFixed(2)}</p>
                        </div>
                        <div className="w-px h-8 bg-white/5" />
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Income</p>
                            <p className="text-lg font-black text-[#DEFF9A] font-mono">RM {totalIncome.toFixed(2)}</p>
                        </div>
                        <div className="w-px h-8 bg-white/5" />
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Net Balance</p>
                            <p className={`text-lg font-black font-mono ${netBalance >= 0 ? 'text-[#DEFF9A]' : 'text-red-500'}`}>
                                RM {netBalance.toFixed(2)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <PrintReportButton title="Budget Report" />
                        <CopyBudgetButton projectId={id} onSuccess={fetchData} />
                        <AddBudgetButton projectId={id} isWedding={false} onSuccess={fetchData} />
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════
                SCREEN VIEW — 2 column cards
            ══════════════════════════════════════════════ */}
            <div className={`${layoutType === 'table' ? 'print:hidden' : 'print:grid'} grid grid-cols-1 md:grid-cols-2 gap-8 items-start`}>

                {/* Expenses column */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                            <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">Debit / Expenses</h3>
                        </div>
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{expenses.length} records</span>
                    </div>

                    {expenses.length === 0 ? (
                        <div className="py-12 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center opacity-30">
                            <i className="fa-solid fa-receipt text-2xl mb-3" />
                            <p className="text-[9px] font-black uppercase tracking-widest">No expenses logged</p>
                        </div>
                    ) : (
                        expenses.map(item => (
                            <div
                                key={item.id}
                                onClick={() => setEditingItem(item)}
                                className="group relative bg-white/[0.03] border border-white/5 px-5 py-4 rounded-2xl hover:border-red-500/30 transition-all cursor-pointer"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h4 className="text-[13px] font-black text-white uppercase tracking-tight group-hover:text-red-400 transition-colors truncate">{item.item}</h4>
                                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">{item.category}</p>
                                    </div>
                                    <div className="text-right flex flex-col items-end shrink-0">
                                        <div className="text-sm font-black text-red-500 font-mono whitespace-nowrap">− RM {Number(item.amount).toFixed(2)}</div>
                                        <div className="mt-1.5 flex items-center gap-2">
                                            <span className="text-[8px] font-black px-2 py-0.5 rounded bg-white/5 text-zinc-600 uppercase tracking-tighter">{item.status}</span>
                                            <i className="fa-solid fa-pen-to-square text-[10px] text-zinc-700 group-hover:text-red-400 transition-colors" />
                                            <div onClick={e => e.stopPropagation()}>
                                                <DeleteBudgetButton id={item.id} projectId={id} onSuccess={fetchData} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <PrintBreakTrigger id={item.id} />
                            </div>
                        ))
                    )}

                    {expenses.length > 0 && (
                        <div className="flex justify-between items-center border-t border-white/5 pt-3 px-1">
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Total Expenses</span>
                            <span className="text-sm font-black text-red-500 font-mono">RM {totalSpends.toFixed(2)}</span>
                        </div>
                    )}
                </div>

                {/* Income column */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-[#DEFF9A] shadow-[0_0_10px_rgba(222,255,154,0.5)]" />
                            <h3 className="text-[10px] font-black text-[#DEFF9A] uppercase tracking-[0.3em]">Credit / Income</h3>
                        </div>
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{income.length} records</span>
                    </div>

                    {income.length === 0 ? (
                        <div className="py-12 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center opacity-30">
                            <i className="fa-solid fa-hand-holding-dollar text-2xl mb-3" />
                            <p className="text-[9px] font-black uppercase tracking-widest">No income logged</p>
                        </div>
                    ) : (
                        income.map(item => (
                            <div
                                key={item.id}
                                onClick={() => setEditingItem(item)}
                                className="group relative bg-white/[0.03] border border-white/5 px-5 py-4 rounded-2xl hover:border-[#DEFF9A]/30 transition-all cursor-pointer"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h4 className="text-[13px] font-black text-white uppercase tracking-tight group-hover:text-[#DEFF9A] transition-colors truncate">{item.item}</h4>
                                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">{item.category}</p>
                                    </div>
                                    <div className="text-right flex flex-col items-end shrink-0">
                                        <div className="text-sm font-black text-[#DEFF9A] font-mono whitespace-nowrap">+ RM {Number(item.amount).toFixed(2)}</div>
                                        <div className="mt-1.5 flex items-center gap-2">
                                            <span className="text-[8px] font-black px-2 py-0.5 rounded bg-white/5 text-zinc-600 uppercase tracking-tighter">{item.status}</span>
                                            <i className="fa-solid fa-pen-to-square text-[10px] text-zinc-700 group-hover:text-[#DEFF9A] transition-colors" />
                                            <div onClick={e => e.stopPropagation()}>
                                                <DeleteBudgetButton id={item.id} projectId={id} onSuccess={fetchData} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <PrintBreakTrigger id={item.id} />
                            </div>
                        ))
                    )}

                    {income.length > 0 && (
                        <div className="flex justify-between items-center border-t border-white/5 pt-3 px-1">
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Total Income</span>
                            <span className="text-sm font-black text-[#DEFF9A] font-mono">RM {totalIncome.toFixed(2)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════════════
                PRINT VIEW — compact table layout
                Expenses table FIRST (larger), then Income
            ══════════════════════════════════════════════ */}
            <div className={`hidden ${layoutType === 'table' ? 'print:block' : 'print:hidden'}`}>

                {/* EXPENSES TABLE */}
                {expenses.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <h2 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#dc2626' }}>Debit / Expenses — {expenses.length} records</h2>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9 }}>
                            <thead>
                                <tr style={{ background: '#f4f4f5', borderBottom: '1.5px solid #d4d4d8' }}>
                                    <th style={{ textAlign: 'left', padding: '5px 8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#52525b', fontSize: 8 }}>#</th>
                                    <th style={{ textAlign: 'left', padding: '5px 8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#52525b', fontSize: 8 }}>Item</th>
                                    <th style={{ textAlign: 'left', padding: '5px 8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#52525b', fontSize: 8 }}>Category</th>
                                    <th style={{ textAlign: 'left', padding: '5px 8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#52525b', fontSize: 8 }}>Status</th>
                                    <th style={{ textAlign: 'right', padding: '5px 8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#52525b', fontSize: 8 }}>Amount (RM)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((item, idx) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #e4e4e7', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                        <td style={{ padding: '4px 8px', color: '#a1a1aa', fontWeight: 700 }}>{idx + 1}</td>
                                        <td style={{ padding: '4px 8px', fontWeight: 800, color: '#18181b', textTransform: 'uppercase', letterSpacing: '0.02em', maxWidth: 200 }}>{item.item}</td>
                                        <td style={{ padding: '4px 8px', color: '#71717a', textTransform: 'uppercase', fontSize: 8 }}>{item.category || '—'}</td>
                                        <td style={{ padding: '4px 8px' }}>
                                            <span style={{ background: item.status === 'paid' ? '#dcfce7' : item.status === 'confirmed' ? '#dbeafe' : '#f4f4f5', color: item.status === 'paid' ? '#16a34a' : item.status === 'confirmed' ? '#1d4ed8' : '#71717a', padding: '1px 6px', borderRadius: 4, fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 900, color: '#dc2626', fontFamily: 'monospace' }}>{Number(item.amount).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ borderTop: '2px solid #d4d4d8', background: '#fef2f2' }}>
                                    <td colSpan={4} style={{ padding: '6px 8px', fontWeight: 900, textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.1em', color: '#dc2626' }}>Total Expenses</td>
                                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 900, color: '#dc2626', fontFamily: 'monospace', fontSize: 11 }}>RM {totalSpends.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                {/* INCOME TABLE */}
                {income.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <h2 style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#16a34a' }}>Credit / Income — {income.length} records</h2>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9 }}>
                            <thead>
                                <tr style={{ background: '#f0fdf4', borderBottom: '1.5px solid #bbf7d0' }}>
                                    <th style={{ textAlign: 'left', padding: '5px 8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#52525b', fontSize: 8 }}>#</th>
                                    <th style={{ textAlign: 'left', padding: '5px 8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#52525b', fontSize: 8 }}>Item</th>
                                    <th style={{ textAlign: 'left', padding: '5px 8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#52525b', fontSize: 8 }}>Category</th>
                                    <th style={{ textAlign: 'left', padding: '5px 8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#52525b', fontSize: 8 }}>Status</th>
                                    <th style={{ textAlign: 'right', padding: '5px 8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#52525b', fontSize: 8 }}>Amount (RM)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {income.map((item, idx) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #dcfce7', background: idx % 2 === 0 ? '#fff' : '#f0fdf4' }}>
                                        <td style={{ padding: '4px 8px', color: '#a1a1aa', fontWeight: 700 }}>{idx + 1}</td>
                                        <td style={{ padding: '4px 8px', fontWeight: 800, color: '#18181b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{item.item}</td>
                                        <td style={{ padding: '4px 8px', color: '#71717a', textTransform: 'uppercase', fontSize: 8 }}>{item.category || '—'}</td>
                                        <td style={{ padding: '4px 8px' }}>
                                            <span style={{ background: item.status === 'received' ? '#dcfce7' : item.status === 'confirmed' ? '#dbeafe' : '#f4f4f5', color: item.status === 'received' ? '#16a34a' : item.status === 'confirmed' ? '#1d4ed8' : '#71717a', padding: '1px 6px', borderRadius: 4, fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 900, color: '#16a34a', fontFamily: 'monospace' }}>{Number(item.amount).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ borderTop: '2px solid #bbf7d0', background: '#f0fdf4' }}>
                                    <td colSpan={4} style={{ padding: '6px 8px', fontWeight: 900, textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.1em', color: '#16a34a' }}>Total Income</td>
                                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 900, color: '#16a34a', fontFamily: 'monospace', fontSize: 11 }}>RM {totalIncome.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                {/* NET BALANCE */}
                <div style={{ marginTop: 12, padding: '8px 12px', background: netBalance >= 0 ? '#f0fdf4' : '#fef2f2', border: `1.5px solid ${netBalance >= 0 ? '#86efac' : '#fca5a5'}`, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: netBalance >= 0 ? '#15803d' : '#dc2626' }}>Net Balance</span>
                    <span style={{ fontWeight: 900, fontSize: 14, fontFamily: 'monospace', color: netBalance >= 0 ? '#15803d' : '#dc2626' }}>RM {netBalance.toFixed(2)}</span>
                </div>

                {/* Print footer */}
                <div style={{ marginTop: 20, paddingTop: 8, borderTop: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#a1a1aa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    <span>ZTO Event OS • Official Budget Report</span>
                    <span>Generated: {new Date().toLocaleString('en-MY')}</span>
                </div>
            </div>

            {/* Edit Modal */}
            <EditBudgetModal
                item={editingItem}
                projectId={id}
                isOpen={!!editingItem}
                onClose={() => setEditingItem(null)}
                onSuccess={fetchData}
            />

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page { size: A4 portrait; margin: 8mm 10mm; }
                    html, body, main { background: white !important; color: black !important; padding: 0 !important; margin: 0 !important; }
                    nav, header, footer, button, .print\\:hidden, [class*="print:hidden"], .zto-sidebar, .zto-action-bar { display: none !important; }
                    .zto-main { overflow: visible !important; height: auto !important; }
                    .print\\:block { display: block !important; }
                    .print\\:break-before-page { break-before: page !important; }
                    table { page-break-inside: auto; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                }
            `}</style>
        </div>
    );
}
