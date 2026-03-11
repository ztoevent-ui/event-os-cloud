'use client';

import React from 'react';

interface Registration {
    team_id: string;
    p1_name: string;
    p2_name: string;
    group_name: string;
    dupr_rating: number;
    payment_status: string;
    created_at: string;
}

export const MasterListPrint = React.forwardRef<HTMLDivElement, { data: Registration[] }>(({ data }, ref) => {
    return (
        <div ref={ref} className="p-8 bg-white text-black font-sans print:p-0">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold uppercase tracking-widest">BPO Pickleball Open 2026</h1>
                <h2 className="text-xl mt-2">Team Master List (Check-in Counter Copy)</h2>
                <div className="mt-4 border-b-2 border-black w-32 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Generated on: {new Date().toLocaleString()}</p>
            </div>

            <table className="w-full border-collapse border border-black text-sm">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-black p-2 text-left">Team ID</th>
                        <th className="border border-black p-2 text-left">Players Details</th>
                        <th className="border border-black p-2 text-left">Hometown</th>
                        <th className="border border-black p-2 text-left text-red-600">Medical / Alert</th>
                        <th className="border border-black p-2 text-center">DUPR</th>
                        <th className="border border-black p-2 text-center">Status</th>
                        <th className="border border-black p-2 text-center">Check-in</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, i) => {
                        const p1Medical = (row as any).data?.p1_medical_history || [];
                        const p2Medical = (row as any).data?.p2_medical_history || [];
                        const hasMedical = p1Medical.length > 0 || p2Medical.length > 0;
                        
                        return (
                            <tr key={i} className={hasMedical ? 'bg-red-50' : ''}>
                                <td className="border border-black p-2 font-mono font-bold">{row.team_id}</td>
                                <td className="border border-black p-2">
                                    <div className="font-bold">P1: {row.p1_name}</div>
                                    <div className="text-xs text-gray-500">P2: {row.p2_name}</div>
                                </td>
                                <td className="border border-black p-2 text-xs">
                                    <div>P1: {(row as any).data?.p1_hometown || '-'}</div>
                                    <div>P2: {(row as any).data?.p2_hometown || '-'}</div>
                                </td>
                                <td className="border border-black p-2 text-xs">
                                    {p1Medical.length > 0 && <div className="text-red-600 font-bold">P1: {p1Medical.join(', ')}</div>}
                                    {p2Medical.length > 0 && <div className="text-red-600 font-bold">P2: {p2Medical.join(', ')}</div>}
                                    {!hasMedical && <span className="text-gray-400 italic">No health issues</span>}
                                </td>
                                <td className="border border-black p-2 text-center">{Number(row.dupr_rating).toFixed(2)}</td>
                                <td className="border border-black p-2 text-center uppercase font-bold text-xs">{row.payment_status}</td>
                                <td className="border border-black p-2 w-20">
                                    <div className="h-6 border border-gray-400 rounded"></div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div className="mt-12 flex justify-between text-xs text-gray-500">
                <p>© 2026 Event OS - BPO Admin</p>
                <p>Page ____ of ____</p>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 15mm;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
});

MasterListPrint.displayName = 'MasterListPrint';
