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
    const { pageBreakIds } = usePrint();

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        const { data: projectData } = await supabase.from('projects').select('type').eq('id', id).single();
        setProject(projectData);

        const { data: settingsData } = await supabase.from('tournament_settings').select('logo_url').eq('project_id', id).single();
        if (settingsData?.logo_url) setLogoUrl(settingsData.logo_url);

        const { data: budgetData } = await supabase
            .from('budgets')
            .select('*')
            .eq('project_id', id)
            .order('created_at', { ascending: false });
        
        setBudgetItems(budgetData || []);
        setLoading(false);
    };

    if (loading) return (
        <div className="flex items-center gap-3 justify-center h-52 text-zinc-600 text-sm">
            <span className="w-4 h-4 rounded-full border-2 border-zinc-800 border-t-[#f59e0b] animate-spin" />
            Syncing Treasury Data…
        </div>
    );

    const isWedding = project?.type === 'wedding' || project?.type === 'wedding_fair';
    const theme = isWedding ? {
        border: 'border-pink-500/30',
        primary: 'text-pink-500',
        hover: 'hover:text-pink-400'
    } : {
        border: 'border-[#0056B3]/30',
        primary: 'text-[#0056B3]',
        hover: 'hover:text-[#0056B3]'
    };

    const expenses = budgetItems.filter(item => item.type === 'expense');
    const income = budgetItems.filter(item => item.type === 'income');

    const totalSpends = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalIncome = income.reduce((sum, item) => sum + Number(item.amount), 0);

    return (
        <div className="flex flex-col flex-1 animate-in fade-in duration-700">
            {/* ── Print Only Header ── */}
            <div className="hidden print:flex items-center justify-between border-b-2 border-zinc-200 pb-2 mb-4 relative">
                <div className="flex items-center gap-3">
                    <img src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG" alt="ZTO Logo" crossOrigin="anonymous" className="w-6 h-6 object-contain" />
                    <span className="font-black text-[10px] text-zinc-900 tracking-tighter uppercase">ZTO Event OS</span>
                </div>
                <p className="text-sm font-black text-zinc-900 uppercase tracking-[0.2em]">Budget Report</p>
                <div>
                    {logoUrl && <img src={logoUrl} alt="Event Logo" crossOrigin="anonymous" className="w-8 h-8 object-contain" />}
                </div>
            </div>

            {/* ── Page Header + Action Bar ── */}
            <div className="print:hidden flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                <div className="flex flex-col">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0056B3] mb-2">Financial Hub</p>
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none font-['Urbanist']">
                        Budget Ledger
                    </h1>
                </div>

                {/* Action Hub */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-xl">
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Expenses</p>
                            <p className="text-lg font-black text-white font-mono">RM {totalSpends.toFixed(2)}</p>
                        </div>
                        <div className="w-px h-8 bg-white/5" />
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">Net Balance</p>
                            <p className={`text-lg font-black font-mono ${(totalIncome - totalSpends) >= 0 ? 'text-[#DEFF9A]' : 'text-red-500'}`}>
                                RM {(totalIncome - totalSpends).toFixed(2)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <PrintReportButton title="Budget Report" />
                        <CopyBudgetButton projectId={id} onSuccess={fetchData} />
                        <AddBudgetButton projectId={id} isWedding={isWedding} onSuccess={fetchData} />
                    </div>
                </div>
            </div>

            {/* ── Transactional Ledger ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Debit (Expenses) */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                            <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">Debit / Expenses</h3>
                        </div>
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{expenses.length} Records</span>
                    </div>

                    <div className="flex flex-col gap-3">
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
                                    className={`group relative bg-white/[0.03] border border-white/5 p-5 rounded-2xl hover:border-red-500/30 transition-all cursor-pointer ${pageBreakIds.includes(item.id) ? 'print:break-before-page pt-4 border-t border-zinc-200 mt-4' : ''}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h4 className="text-[13px] font-black text-white uppercase tracking-tight group-hover:text-red-400 transition-colors">{item.item}</h4>
                                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">{item.category}</p>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <div className="text-sm font-black text-red-500 font-mono">- RM {Number(item.amount).toFixed(2)}</div>
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="text-[8px] font-black px-2 py-0.5 rounded bg-white/5 text-zinc-600 uppercase tracking-tighter">{item.status}</span>
                                                <i className="fa-solid fa-pen-to-square text-[10px] text-zinc-700 group-hover:text-red-400 transition-colors print:hidden" />
                                                <div className="print:hidden" onClick={e => e.stopPropagation()}>
                                                    <DeleteBudgetButton id={item.id} projectId={id} onSuccess={fetchData} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <PrintBreakTrigger id={item.id} />
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Credit (Income) */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-[#DEFF9A] shadow-[0_0_10px_rgba(222,255,154,0.5)]" />
                            <h3 className="text-[10px] font-black text-[#DEFF9A] uppercase tracking-[0.3em]">Credit / Income</h3>
                        </div>
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{income.length} Records</span>
                    </div>

                    <div className="flex flex-col gap-3">
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
                                    className={`group relative bg-white/[0.03] border border-white/5 p-5 rounded-2xl hover:border-[#DEFF9A]/30 transition-all cursor-pointer ${pageBreakIds.includes(item.id) ? 'print:break-before-page pt-4 border-t border-zinc-200 mt-4' : ''}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h4 className="text-[13px] font-black text-white uppercase tracking-tight group-hover:text-[#DEFF9A] transition-colors">{item.item}</h4>
                                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">{item.category}</p>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <div className="text-sm font-black text-[#DEFF9A] font-mono">+ RM {Number(item.amount).toFixed(2)}</div>
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="text-[8px] font-black px-2 py-0.5 rounded bg-white/5 text-zinc-600 uppercase tracking-tighter">{item.status}</span>
                                                <i className="fa-solid fa-pen-to-square text-[10px] text-zinc-700 group-hover:text-[#DEFF9A] transition-colors print:hidden" />
                                                <div className="print:hidden" onClick={e => e.stopPropagation()}>
                                                    <DeleteBudgetButton id={item.id} projectId={id} onSuccess={fetchData} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <PrintBreakTrigger id={item.id} />
                                </div>
                            ))
                        )}
                    </div>
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
                    @page { size: A4 portrait; margin: 10mm; }
                    html, body, main { background: white !important; color: black !important; padding: 0 !important; margin: 0 !important; }
                    .print\\:hidden, nav, header, footer, button { display: none !important; }
                    .bg-white\\/\\[0\\.03\\] { background: transparent !important; border: 1px solid #eee !important; }
                    .text-white, .text-zinc-500, .text-zinc-600 { color: black !important; }
                    .print\\:break-before-page { break-before: page !important; }
                }
            `}</style>

            {/* ── Print Footer ── */}
            <div className="hidden print:flex fixed bottom-0 left-0 right-0 py-2 border-t border-zinc-200 text-[8px] font-black text-zinc-400 justify-between uppercase tracking-widest bg-white z-50">
                <div className="flex items-center gap-2">
                    <img src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG" alt="ZTO" className="w-4 h-4 grayscale" />
                    <span>ZTO Event OS • Official Budget Insights</span>
                </div>
                <div>Project ID: {id.slice(0, 8)} • Generated: {new Date().toLocaleString()}</div>
            </div>
        </div>
    );
}
