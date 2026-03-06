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
                        <th className="border border-black p-2 text-left">Player 1 Name</th>
                        <th className="border border-black p-2 text-left">Player 2 Name</th>
                        <th className="border border-black p-2 text-left">Group</th>
                        <th className="border border-black p-2 text-center">DUPR</th>
                        <th className="border border-black p-2 text-center">Status</th>
                        <th className="border border-black p-2 text-center">Check-in</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, i) => (
                        <tr key={i}>
                            <td className="border border-black p-2 font-mono font-bold">{row.team_id}</td>
                            <td className="border border-black p-2">{row.p1_name}</td>
                            <td className="border border-black p-2">{row.p2_name}</td>
                            <td className="border border-black p-2">{row.group_name}</td>
                            <td className="border border-black p-2 text-center">{Number(row.dupr_rating).toFixed(2)}</td>
                            <td className="border border-black p-2 text-center uppercase font-bold text-xs">{row.payment_status}</td>
                            <td className="border border-black p-2 w-24">
                                <div className="h-6 border border-gray-400 rounded"></div>
                            </td>
                        </tr>
                    ))}
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
