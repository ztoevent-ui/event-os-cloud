'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AdminTable } from '@/components/bpo/admin-table';
import { MasterListPrint } from '@/components/bpo/master-list-print';
import { Lock, LogOut, Printer, Upload, RefreshCw, Layers } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import Swal from 'sweetalert2';

export default function BpoAdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRegistration, setSelectedRegistration] = useState<any>(null);

    const handleLogin = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        // For demo/simplicity, using 'bpo-demo-2026' as default if env not set
        const ADMIN_SECRET = 'bpo-demo-2026';
        if (password === ADMIN_SECRET) {
            setIsAuthenticated(true);
            localStorage.setItem('bpo_admin_token', password);
            fetchData(password);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Access Denied',
                text: 'Invalid Admin Secret Key',
                background: '#1a1a1a',
                color: '#fff',
            });
        }
    };

    const fetchData = async (token: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/bpo/registrations?secret=${token}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const result = await res.json();
            setData(result);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const savedToken = localStorage.getItem('bpo_admin_token');
        if (savedToken) {
            setPassword(savedToken);
            setIsAuthenticated(true);
            fetchData(savedToken);
        }
    }, []);

    const handleLogout = () => {
        setIsAuthenticated(false);
        setPassword('');
        localStorage.removeItem('bpo_admin_token');
    };

    const handleBatchRefund = () => {
        const unsuccessfulCount = data.filter((r: any) => r.registration_status === 'Unsuccessful').length;
        Swal.fire({
            title: 'Batch Refund Interface',
            text: `Found ${unsuccessfulCount} unsuccessful registrations. API Integration for refund gateway is pending.`,
            icon: 'info',
            background: '#1a1a1a',
            color: '#fff',
        });
    };

    const handleSortByDUPR = () => {
        const sorted = [...data].sort((a: any, b: any) => (b.dupr_rating || 0) - (a.dupr_rating || 0));
        setData(sorted);
    };

    if (!isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4 text-white">
                <div className="w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
                    <div className="text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
                            <Lock size={32} />
                        </div>
                        <h1 className="mt-6 text-2xl font-bold tracking-tight">BPO Admin Portal</h1>
                        <p className="mt-2 text-sm text-gray-400">Enter your secret key to access the dashboard</p>
                    </div>

                    <form onSubmit={handleLogin} className="mt-8 space-y-6">
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Admin Secret Key"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-lg tracking-widest outline-none transition focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                        />
                        <button
                            type="submit"
                            className="group relative flex w-full justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                            Access Dashboard
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: 'BPO-Master-List',
    });

    const handleSyncToSheets = async () => {
        Swal.fire({
            title: 'Export to Google Sheets?',
            text: "This will sync all current registrations to the master spreadsheet.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#1a1a1a',
            confirmButtonText: 'Yes, Export Now',
            background: '#121212',
            color: '#fff',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    setLoading(true);
                    const res = await fetch('/api/bpo/sync-sheets', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-admin-secret': password },
                        body: JSON.stringify(data)
                    });

                    if (res.ok) {
                        Swal.fire({
                            title: 'Success!',
                            text: 'Data successfully exported to Google Sheets.',
                            icon: 'success',
                            background: '#121212',
                            color: '#fff',
                        });
                    } else {
                        throw new Error('Sync failed');
                    }
                } catch (err) {
                    Swal.fire({
                        title: 'Error',
                        text: 'Failed to sync with Google Sheets. Check server logs.',
                        icon: 'error',
                        background: '#121212',
                        color: '#fff',
                    });
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] pb-12 text-white">
            {/* Hidden Print Content */}
            <div className="hidden">
                <MasterListPrint ref={printRef} data={data} />
            </div>
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                                <Lock size={20} />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold leading-none">BPO Admin</h1>
                                <p className="mt-1 text-xs text-blue-400">Master Control Dashboard</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSortByDUPR}
                                className="flex h-10 items-center justify-center rounded-xl bg-orange-500/10 px-4 text-sm font-medium text-orange-400 hover:bg-orange-500/20"
                            >
                                Sort DUPR
                            </button>
                            <button
                                onClick={handleBatchRefund}
                                className="flex h-10 items-center justify-center rounded-xl bg-pink-500/10 px-4 text-sm font-medium text-pink-400 hover:bg-pink-500/20"
                            >
                                Refund Flow
                            </button>
                            <button
                                onClick={() => fetchData(password)}
                                disabled={loading}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-50"
                            >
                                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20"
                            >
                                <LogOut size={16} />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Stats Summary (Optional) */}
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {[
                        { label: 'Total Teams', value: data.length, color: 'text-white' },
                        { label: 'Paid', value: data.filter((r: any) => r.payment_status === 'paid').length, color: 'text-green-400' },
                        { label: 'Pending', value: data.filter((r: any) => r.payment_status === 'pending').length, color: 'text-yellow-400' },
                    ].map((stat, i) => (
                        <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.03] p-6">
                            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{stat.label}</p>
                            <p className={`mt-2 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Data Table */}
                <AdminTable data={data} onRowClick={setSelectedRegistration} />

                {/* Print Master List Section */}
                <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] py-12 text-center transition hover:bg-white/[0.04]">
                        <Printer className="mb-4 h-12 w-12 text-blue-400" />
                        <h2 className="text-xl font-bold">Print Master List</h2>
                        <p className="mt-2 text-sm text-gray-400 max-w-xs">Generate a clean, ink-friendly version of all teams for the check-in counter.</p>
                        <button
                            onClick={() => handlePrint()}
                            className="mt-6 flex items-center gap-2 rounded-2xl bg-white px-8 py-3 text-sm font-bold text-black transition hover:scale-105 active:scale-95"
                        >
                            <Printer size={18} />
                            Generate & Print
                        </button>
                    </div>

                    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] py-12 text-center transition hover:bg-green-500/[0.02]">
                        <Layers className="mb-4 h-12 w-12 text-green-400" />
                        <h2 className="text-xl font-bold">Google Sheets Sync</h2>
                        <p className="mt-2 text-sm text-gray-400 max-w-xs">Push all registration data directly to the master Google Spreadsheet.</p>
                        <button
                            onClick={handleSyncToSheets}
                            className="mt-6 flex items-center gap-2 rounded-2xl bg-green-600 px-8 py-3 text-sm font-bold text-white transition hover:bg-green-500 hover:scale-105 active:scale-95"
                        >
                            <Upload size={18} />
                            One-Click Google Sync
                        </button>
                    </div>
                </div>
            </main>

            {/* Registration Detail Modal */}
            {selectedRegistration && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#121212] p-8 shadow-2xl">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">Registration Detail</h2>
                                <p className="text-blue-400 font-mono mt-1">{selectedRegistration.team_id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedRegistration(null)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-gray-400 hover:bg-white/10"
                            >
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>

                        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
                            {/* P1 Section */}
                            <div className="space-y-6 rounded-2xl bg-white/5 p-6 border border-white/5">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400">Player 1</h3>
                                {selectedRegistration.p1_profile_url && (
                                    <img src={selectedRegistration.p1_profile_url} alt="P1" className="h-32 w-32 rounded-xl object-cover bg-white/10" />
                                )}
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">DUPR ID & Full Name</p>
                                        <p className="text-blue-400 font-mono text-sm">{selectedRegistration.data?.p1_dupr_id || 'N/A'}</p>
                                        <p className="text-lg font-medium">{selectedRegistration.p1_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">IC No</p>
                                        <p className="font-medium">{selectedRegistration.p1_ic_no || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Phone & Team Email</p>
                                        <p className="font-medium">{selectedRegistration.p1_hp}</p>
                                        <p className="text-blue-400">{selectedRegistration.p1_email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* P2 Section */}
                            <div className="space-y-6 rounded-2xl bg-white/5 p-6 border border-white/5">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400">Player 2</h3>
                                {selectedRegistration.p2_profile_url && (
                                    <img src={selectedRegistration.p2_profile_url} alt="P2" className="h-32 w-32 rounded-xl object-cover bg-white/10" />
                                )}
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">DUPR ID & Full Name</p>
                                        <p className="text-blue-400 font-mono text-sm">{selectedRegistration.data?.p2_dupr_id || 'N/A'}</p>
                                        <p className="text-lg font-medium">{selectedRegistration.p2_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">IC No</p>
                                        <p className="font-medium">{selectedRegistration.p2_ic_no || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Phone</p>
                                        <p className="font-medium">{selectedRegistration.p2_hp}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={() => setSelectedRegistration(null)}
                                className="rounded-2xl bg-white/5 px-8 py-3 text-sm font-bold text-gray-400 hover:bg-white/10 hover:text-white"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
