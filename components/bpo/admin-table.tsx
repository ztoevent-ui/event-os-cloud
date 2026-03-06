'use client';

import React, { useMemo, useState } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
    createColumnHelper,
} from '@tanstack/react-table';
import { Search, ChevronRight, Eye, Printer, FileDown, RefreshCw } from 'lucide-react';
import Papa from 'papaparse';

interface Registration {
    id: string;
    team_id: string;
    p1_name: string;
    p1_ic_no: string;
    p1_hp: string;
    p1_email: string;
    p1_profile_url: string;
    p2_name: string;
    p2_ic_no: string;
    p2_hp: string;
    p2_email: string;
    p2_profile_url: string;
    group_name: string;
    dupr_rating: number;
    payment_status: string;
    created_at: string;
}

const columnHelper = createColumnHelper<Registration>();

export function AdminTable({ data, onRowClick }: { data: Registration[], onRowClick: (row: Registration) => void }) {
    const [globalFilter, setGlobalFilter] = useState('');

    const columns = useMemo(() => [
        columnHelper.accessor('team_id', {
            header: 'Team ID',
            cell: info => <span className="font-mono text-xs font-bold text-blue-400">{info.getValue()}</span>,
        }),
        columnHelper.accessor('p1_name', {
            header: 'Player 1',
            cell: info => <div className="font-medium text-white">{info.getValue()}</div>,
        }),
        columnHelper.accessor('p2_name', {
            header: 'Player 2',
            cell: info => <div className="font-medium text-white">{info.getValue()}</div>,
        }),
        columnHelper.accessor('group_name', {
            header: 'Group',
            cell: info => (
                <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20">
                    {info.getValue()}
                </span>
            ),
        }),
        columnHelper.accessor('dupr_rating', {
            header: 'DUPR',
            cell: info => <span className="text-gray-300">{Number(info.getValue()).toFixed(2)}</span>,
        }),
        columnHelper.accessor('payment_status', {
            header: 'Payment',
            cell: info => {
                const status = info.getValue().toLowerCase();
                const colors: Record<string, string> = {
                    paid: 'bg-green-500/10 text-green-400 ring-green-500/20',
                    pending: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',
                    failed: 'bg-red-500/10 text-red-400 ring-red-500/20',
                };
                return (
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${colors[status] || 'bg-gray-500/10 text-gray-400 ring-gray-500/20'}`}>
                        {info.getValue()}
                    </span>
                );
            },
        }),
        columnHelper.accessor('created_at', {
            header: 'Date',
            cell: info => <span className="text-gray-400">{new Date(info.getValue()).toLocaleDateString()}</span>,
        }),
        columnHelper.display({
            id: 'actions',
            cell: info => (
                <button
                    onClick={() => onRowClick(info.row.original)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                >
                    <Eye size={16} />
                </button>
            ),
        }),
    ], [onRowClick]);

    const table = useReactTable({
        data,
        columns,
        state: {
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const exportToCSV = () => {
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `bpo-registrations-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search registrations..."
                        value={globalFilter ?? ''}
                        onChange={e => setGlobalFilter(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white"
                    >
                        <FileDown size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-gray-300">
                        <thead>
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id} className="border-b border-white/10 bg-white/5">
                                    {headerGroup.headers.map(header => (
                                        <th key={header.id} className="px-6 py-4 font-semibold text-gray-100">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.map(row => (
                                <tr
                                    key={row.id}
                                    className="group border-b border-white/5 transition-colors hover:bg-white/[0.02]"
                                >
                                    {row.getVisibleCells().map(cell => (
                                        <th key={cell.id} className="px-6 py-3 font-normal">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
                    <div className="text-xs text-gray-400">
                        Showing {table.getPaginationRowModel().rows.length} of {data.length} results
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="rounded-lg bg-white/5 px-3 py-1 text-xs font-semibold text-gray-300 transition hover:bg-white/10 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="rounded-lg bg-white/5 px-3 py-1 text-xs font-semibold text-gray-300 transition hover:bg-white/10 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
