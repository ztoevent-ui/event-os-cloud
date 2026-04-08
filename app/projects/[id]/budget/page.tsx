'use client';
import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AddBudgetButton, DeleteBudgetButton, PrintReportButton } from '../../components/ProjectModals';
import { PrintBreakTrigger } from '../../components/PrintBreakTrigger';
import { usePrint } from '../../components/PrintContext';

export default function BudgetPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [budgetItems, setBudgetItems] = useState<any[]>([]);
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { pageBreakIds } = usePrint();

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        const { data: projectData } = await supabase.from('projects').select('type').eq('id', id).single();
        setProject(projectData);

        const { data: budgetData } = await supabase
            .from('budgets')
            .select('*')
            .eq('project_id', id)
            .order('created_at', { ascending: false });
        
        setBudgetItems(budgetData || []);
        setLoading(false);
    };

    if (loading) return <div className="p-20 text-center animate-pulse">Syncing Treasury Data...</div>;

    const isWedding = project?.type === 'wedding' || project?.type === 'wedding_fair';
    const theme = isWedding ? {
        border: 'border-pink-500/30',
        primary: 'text-pink-500',
        hover: 'hover:text-pink-400'
    } : {
        border: 'border-amber-500/30',
        primary: 'text-amber-500',
        hover: 'hover:text-amber-400'
    };

    const expenses = budgetItems.filter(item => item.type === 'expense');
    const income = budgetItems.filter(item => item.type === 'income');

    const totalSpends = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalIncome = income.reduce((sum, item) => sum + Number(item.amount), 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Print Only Header */}
            <div className="hidden print:flex items-start border-b-2 border-zinc-900 pb-4 mb-8 relative">
                <div className="flex items-center gap-2 absolute left-0 top-0">
                    <img src="/zto-logo.png" alt="ZTO Logo" className="w-10 h-10 object-contain" />
                    <span className="font-bold text-lg text-zinc-700 tracking-tight">ZTO Event OS</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <img src="/bpo-2026-logo.png" alt="Event Logo" className="w-24 h-24 object-contain mb-2" />
                    <p className="text-xl font-black text-zinc-900 uppercase tracking-widest">Budget Report</p>
                </div>
            </div>

            <div className={`flex justify-between items-center bg-zinc-900 border ${theme.border} p-6 rounded-2xl shadow-sm print:hidden`}>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white mb-2">Budget Tracker</h1>
                    <p className="text-zinc-400 font-medium">Monitor expenses and adhere to financial goals.</p>
                </div>
                <div className="flex gap-4">
                    <PrintReportButton title="Budget Report" />
                    <AddBudgetButton projectId={id} isWedding={isWedding} />
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl print:bg-white print:border-zinc-300">
                    <h3 className="text-zinc-400 mb-2 font-bold text-xs uppercase tracking-widest print:text-zinc-500">Total Expenses</h3>
                    <div className="text-3xl font-mono text-white print:text-black">RM {totalSpends.toFixed(2)}</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl print:bg-white print:border-zinc-300">
                    <h3 className="text-zinc-400 mb-2 font-bold text-xs uppercase tracking-widest print:text-zinc-500">Projected Income</h3>
                    <div className="text-3xl font-mono text-green-400 print:text-black">RM {totalIncome.toFixed(2)}</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl print:bg-white print:border-zinc-300">
                    <h3 className="text-zinc-400 mb-2 font-bold text-xs uppercase tracking-widest print:text-zinc-500">Net Balance</h3>
                    <div className={`text-3xl font-mono ${totalIncome - totalSpends >= 0 ? 'text-blue-400' : 'text-red-400'} print:text-black`}>
                        RM {(totalIncome - totalSpends).toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Debit/Credit Columns */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden print:bg-white print:border-zinc-300">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center print:bg-white print:border-zinc-300">
                    <h3 className="text-xl font-bold text-white print:text-zinc-900">Transactions</h3>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{budgetItems?.length || 0} Records</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800 print:divide-zinc-300">
                    {/* Debit (Expenses) */}
                    <div className="p-4">
                        <h4 className="text-lg font-bold text-red-500 mb-2 print:text-red-700">Debit (Expenses)</h4>
                        {expenses.length === 0 && <div className="text-zinc-500">No expenses.</div>}
                        {expenses.map(item => (
                          <div key={item.id} className={pageBreakIds.includes(item.id) ? 'print:break-before-page' : ''}>
                             <div className="flex justify-between items-center py-2 border-b border-dashed border-zinc-700 print:border-zinc-300 last:border-b-0">
                                <div>
                                    <div className="font-bold text-zinc-200 print:text-zinc-900">{item.item}</div>
                                    <div className="text-xs text-zinc-500 print:text-zinc-500">{item.category}</div>
                                </div>
                                <div className="text-right flex items-center gap-4">
                                    <div>
                                        <div className="font-mono font-bold text-red-400 print:text-red-700">- RM {Number(item.amount).toFixed(2)}</div>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 print:bg-zinc-200 print:text-zinc-700">{item.status}</span>
                                    </div>
                                    <DeleteBudgetButton id={item.id} projectId={id} />
                                </div>
                             </div>
                             <PrintBreakTrigger id={item.id} />
                          </div>
                        ))}
                    </div>
                    {/* Credit (Income) */}
                    <div className="p-4">
                        <h4 className="text-lg font-bold text-green-500 mb-2 print:text-green-700">Credit (Income)</h4>
                        {income.length === 0 && <div className="text-zinc-500">No income.</div>}
                        {income.map(item => (
                          <div key={item.id} className={pageBreakIds.includes(item.id) ? 'print:break-before-page' : ''}>
                             <div className="flex justify-between items-center py-2 border-b border-dashed border-zinc-700 print:border-zinc-300 last:border-b-0">
                                <div>
                                    <div className="font-bold text-zinc-200 print:text-zinc-900">{item.item}</div>
                                    <div className="text-xs text-zinc-500 print:text-zinc-500">{item.category}</div>
                                </div>
                                <div className="text-right flex items-center gap-4">
                                    <div>
                                        <div className="font-mono font-bold text-green-400 print:text-green-700">+ RM {Number(item.amount).toFixed(2)}</div>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 print:bg-zinc-200 print:text-zinc-700">{item.status}</span>
                                    </div>
                                    <DeleteBudgetButton id={item.id} projectId={id} />
                                </div>
                             </div>
                             <PrintBreakTrigger id={item.id} />
                          </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page { margin: 15mm; }
                    html, body, main {
                        background: white !important;
                        color: black !important;
                    }
                    .print\\:hidden, nav, header, footer, button {
                        display: none !important;
                    }
                    .bg-zinc-900, .bg-zinc-900\\/50 {
                        background: transparent !important;
                        color: black !important;
                    }
                    .text-white, .text-zinc-200, .text-zinc-400 {
                        color: black !important;
                    }
                    .print\\:break-before-page {
                        break-before: page !important;
                    }
                }
            `}</style>

            {/* Print Footer */}
            <div className="hidden print:flex fixed bottom-0 left-0 right-0 py-4 border-t border-zinc-200 text-[10px] font-bold text-zinc-400 justify-between uppercase tracking-widest bg-white z-50">
                <div>ZTO Event OS - Budget Insights</div>
                <div>Generated: {new Date().toLocaleString()}</div>
            </div>
        </div>
    );
}
