'use client';
import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AddBudgetButton, DeleteBudgetButton, PrintReportButton, CopyBudgetButton } from '../../components/ProjectModals';
import { PrintBreakTrigger } from '../../components/PrintBreakTrigger';
import { usePrint } from '../../components/PrintContext';

export default function BudgetPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [budgetItems, setBudgetItems] = useState<any[]>([]);
    const [project, setProject] = useState<any>(null);
    const [logoUrl, setLogoUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);
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
        <div className="space-y-5 animate-in fade-in duration-500">
            {/* Print Only Header */}
            <div className="hidden print:flex items-center justify-between border-b-2 border-zinc-200 pb-6 print:pb-2 mb-8 print:mb-2 relative">
                <div className="flex items-center gap-3">
                    <img src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG" alt="ZTO Logo" crossOrigin="anonymous" className="w-8 h-8 object-contain" />
                    <span className="font-black text-sm text-zinc-900 tracking-tighter uppercase">ZTO Event OS</span>
                </div>
                <p className="text-lg font-black text-zinc-900 uppercase tracking-[0.2em]">Budget Report</p>
                <div>
                    {logoUrl ? (
                        <img src={logoUrl} alt="Event Logo" crossOrigin="anonymous" className="w-10 h-10 object-contain" />
                    ) : (
                        <div className="w-10 h-10 bg-zinc-100 rounded-lg border border-zinc-200 flex items-center justify-center text-[6px] text-zinc-400 font-bold uppercase text-center p-1">Logo</div>
                    )}
                </div>
            </div>

            {/* Page Header */}
            <div className="print:hidden flex items-center justify-between bg-[#0d0d0d] border border-white/[0.07] px-6 py-4 rounded-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-xl flex items-center justify-center text-[#f59e0b]">
                        <i className="fa-solid fa-file-invoice-dollar" />
                    </div>
                    <div>
                        <h1 className="text-base font-black text-white tracking-tight">Budget Tracker</h1>
                        <p className="text-[11px] text-zinc-600">Monitor expenses and financial goals</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <PrintReportButton title="Budget Report" />
                    <CopyBudgetButton projectId={id} />
                    <AddBudgetButton projectId={id} isWedding={isWedding} />
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 print:flex print:flex-row print:w-full gap-4 print:gap-2">
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 print:p-2 rounded-2xl print:bg-white print:border-zinc-200 shadow-sm transition-all print:w-1/3 print:shrink-0">
                    <h3 className="text-zinc-400 mb-2 font-black text-[10px] print:text-[7px] uppercase tracking-widest print:text-zinc-500">Total Expenses</h3>
                    <div className="text-3xl print:text-base font-mono font-black text-white print:text-red-600">RM {totalSpends.toFixed(2)}</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 print:p-2 rounded-2xl print:bg-white print:border-zinc-200 shadow-sm transition-all print:w-1/3 print:shrink-0">
                    <h3 className="text-zinc-400 mb-2 font-black text-[10px] print:text-[7px] uppercase tracking-widest print:text-zinc-500">Projected Income</h3>
                    <div className="text-3xl print:text-base font-mono font-black text-green-400 print:text-emerald-600">RM {totalIncome.toFixed(2)}</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 print:p-2 rounded-2xl print:bg-white print:border-zinc-200 shadow-sm transition-all print:w-1/3 print:shrink-0">
                    <h3 className="text-zinc-400 mb-2 font-black text-[10px] print:text-[7px] uppercase tracking-widest print:text-zinc-500">Net Balance</h3>
                    <div className={`text-3xl print:text-base font-mono font-black ${totalIncome - totalSpends >= 0 ? 'text-blue-400 print:text-blue-600' : 'text-red-400 print:text-red-600'}`}>
                        RM {(totalIncome - totalSpends).toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Debit/Credit Columns - Forced Side-by-Side in Print */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden print:bg-white print:border-zinc-200 print:rounded-2xl">
                <div className="p-6 print:p-2 border-b border-zinc-800 print:border-zinc-200 flex justify-between items-center bg-black/20 print:bg-zinc-50">
                    <h3 className="text-xl print:text-[10px] font-black text-white uppercase italic tracking-tight print:text-zinc-900 print:not-italic">Transactional Ledger</h3>
                    <span className="text-[10px] print:text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em]">{budgetItems?.length || 0} Records</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 print:flex print:flex-row print:w-full print:items-start divide-y md:divide-y-0 md:divide-x print:divide-y-0 print:divide-x divide-zinc-800 print:divide-zinc-200">
                    {/* Debit (Expenses) */}
                    <div className="p-6 print:p-2 print:w-1/2 print:shrink-0">
                        <div className="flex items-center gap-2 mb-6 print:mb-2 border-b border-dashed border-red-500/20 print:pb-1">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse print:hidden"></div>
                            <h4 className="text-xs print:text-[8px] font-black text-red-500 uppercase tracking-[0.3em] print:text-red-700">Debit (Expenses)</h4>
                        </div>
                        {expenses.length === 0 && <div className="text-zinc-500 text-xs italic py-8 text-center uppercase tracking-widest print:py-2">No expenses recorded</div>}
                        <div className="space-y-4 print:space-y-0.5">
                            {expenses.map(item => (
                            <div key={item.id} className={pageBreakIds.includes(item.id) ? 'print:break-before-page pt-4 border-t border-zinc-200 mt-4' : ''}>
                                <div className="flex justify-between items-center py-3 print:py-0.5 border-b border-zinc-800/50 print:border-zinc-100 last:border-b-0 group">
                                    <div className="flex-1">
                                        <div className="font-bold text-zinc-100 print:text-zinc-900 text-sm print:text-[8px] leading-tight">{item.item}</div>
                                        <div className="text-[10px] print:text-[6px] text-zinc-500 font-bold uppercase tracking-widest mt-1 print:mt-0">{item.category}</div>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div className="flex flex-col items-end">
                                            <div className="font-mono font-black text-red-400 print:text-red-700 text-sm print:text-[8px]">- RM {Number(item.amount).toFixed(2)}</div>
                                            <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-500 uppercase tracking-tighter mt-1 print:hidden">{item.status}</span>
                                        </div>
                                        <div className="print:hidden">
                                            <DeleteBudgetButton id={item.id} projectId={id} />
                                        </div>
                                    </div>
                                </div>
                                <PrintBreakTrigger id={item.id} />
                            </div>
                            ))}
                        </div>
                    </div>

                    {/* Credit (Income) */}
                    <div className="p-6 print:p-2 print:w-1/2 print:shrink-0">
                        <div className="flex items-center gap-2 mb-6 print:mb-2 border-b border-dashed border-green-500/20 print:pb-1">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse print:hidden"></div>
                            <h4 className="text-xs print:text-[8px] font-black text-green-500 uppercase tracking-[0.3em] print:text-emerald-700">Credit (Income)</h4>
                        </div>
                        {income.length === 0 && <div className="text-zinc-500 text-xs italic py-8 text-center uppercase tracking-widest print:py-2">No income recorded</div>}
                        <div className="space-y-4 print:space-y-0.5">
                            {income.map(item => (
                            <div key={item.id} className={pageBreakIds.includes(item.id) ? 'print:break-before-page pt-4 border-t border-zinc-200 mt-4' : ''}>
                                <div className="flex justify-between items-center py-3 print:py-0.5 border-b border-zinc-800/50 print:border-zinc-100 last:border-b-0 group">
                                    <div className="flex-1">
                                        <div className="font-bold text-zinc-100 print:text-zinc-900 text-sm print:text-[8px] leading-tight">{item.item}</div>
                                        <div className="text-[10px] print:text-[6px] text-zinc-500 font-bold uppercase tracking-widest mt-1 print:mt-0">{item.category}</div>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div className="flex flex-col items-end">
                                            <div className="font-mono font-black text-green-400 print:text-emerald-700 text-sm print:text-[8px]">+ RM {Number(item.amount).toFixed(2)}</div>
                                            <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-500 uppercase tracking-tighter mt-1 print:hidden">{item.status}</span>
                                        </div>
                                        <div className="print:hidden">
                                            <DeleteBudgetButton id={item.id} projectId={id} />
                                        </div>
                                    </div>
                                </div>
                                <PrintBreakTrigger id={item.id} />
                            </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page { 
                        size: A4 portrait;
                        margin: 10mm;
                    }
                    html, body, main {
                        background: white !important;
                        color: black !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .print\\:hidden, nav, header, footer, button {
                        display: none !important;
                    }
                    .bg-zinc-900, .bg-zinc-900\\/50, .bg-black\\/20 {
                        background: transparent !important;
                        color: black !important;
                    }
                    .text-white, .text-zinc-100, .text-zinc-200, .text-zinc-400, .text-zinc-500 {
                        color: black !important;
                    }
                    .border-zinc-800, .border-zinc-900, .border-zinc-800\\/50 {
                        border-color: #eee !important;
                    }
                    .shadow-sm, .shadow-2xl {
                        box-shadow: none !important;
                    }
                    .rounded-3xl, .rounded-2xl {
                        border-radius: 8px !important;
                    }
                    .print\\:break-before-page {
                        break-before: page !important;
                    }
                }
            `}</style>

            {/* Print Footer */}
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
