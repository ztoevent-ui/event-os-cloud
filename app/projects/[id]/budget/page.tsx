
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { AddBudgetButton, DeleteBudgetButton } from '../../components/ProjectModals';

export default async function BudgetPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const { data: budgetItems, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

    // Calculate totals
    const expenses = budgetItems?.filter(item => item.type === 'expense') || [];
    const income = budgetItems?.filter(item => item.type === 'income') || [];

    const totalSpends = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalIncome = income.reduce((sum, item) => sum + Number(item.amount), 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white mb-2">Budget Tracker</h1>
                    <p className="text-zinc-400">Monitor expenses and adhere to financial goals.</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-full transition-all flex items-center gap-2 border border-zinc-700">
                        <i className="fa-solid fa-file-invoice-dollar"></i> Report
                    </button>
                    <AddBudgetButton projectId={id} />
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl">
                    Error loading budget: {error.message}
                </div>
            )}

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
                    <h3 className="text-zinc-400 mb-2">Total Expenses</h3>
                    <div className="text-3xl font-mono text-white">RM {totalSpends.toFixed(2)}</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
                    <h3 className="text-zinc-400 mb-2">Projected Income</h3>
                    <div className="text-3xl font-mono text-green-400">RM {totalIncome.toFixed(2)}</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
                    <h3 className="text-zinc-400 mb-2">Net Balance</h3>
                    <div className={`text-3xl font-mono ${totalIncome - totalSpends >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                        RM {(totalIncome - totalSpends).toFixed(2)}
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800">
                    <h3 className="text-xl font-bold text-white">Transactions</h3>
                </div>
                <div className="divide-y divide-zinc-800">
                    {budgetItems?.map((item) => (
                        <div key={item.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.type === 'expense' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                                    <i className={`fa-solid ${item.type === 'expense' ? 'fa-arrow-trend-down' : 'fa-arrow-trend-up'}`}></i>
                                </div>
                                <div>
                                    <h4 className="font-bold text-zinc-200 group-hover:text-amber-400 transition-colors">{item.item}</h4>
                                    <p className="text-xs text-zinc-500 uppercase tracking-wide">{item.category}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className={`font-mono font-bold ${item.type === 'expense' ? 'text-zinc-200' : 'text-green-400'}`}>
                                        {item.type === 'expense' ? '-' : '+'} RM {Number(item.amount).toFixed(2)}
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === 'actual' ? 'bg-green-900/30 text-green-500' : 'bg-zinc-800 text-zinc-500'}`}>
                                        {item.status}
                                    </span>
                                </div>
                                <DeleteBudgetButton id={item.id} projectId={id} />
                            </div>
                        </div>
                    ))}
                    {(!budgetItems || budgetItems.length === 0) && (
                        <div className="p-8 text-center text-zinc-500">No budget items found.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
