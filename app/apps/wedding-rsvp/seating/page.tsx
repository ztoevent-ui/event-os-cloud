'use client';

import { useState } from 'react';

type Table = {
    id: number;
    name: string;
    seats: number;
    occupied: number;
    type: 'round' | 'rect';
    guests: string[];
};

export default function SeatingPage() {
    const [tables, setTables] = useState<Table[]>([
        { id: 1, name: 'Table 1', seats: 10, occupied: 8, type: 'round', guests: [] },
        { id: 2, name: 'Table 2', seats: 10, occupied: 10, type: 'round', guests: [] },
        { id: 3, name: 'Table 3', seats: 10, occupied: 0, type: 'round', guests: [] }
    ]);

    const handleAddTable = () => {
        const newId = tables.length + 1;
        setTables([...tables, {
            id: newId,
            name: `Table ${newId}`,
            seats: 10,
            occupied: 0,
            type: 'round',
            guests: []
        }]);
    };

    const handleRemoveTable = (id: number) => {
        if (window.confirm('Delete this table?')) {
            setTables(tables.filter(t => t.id !== id));
        }
    };

    return (
        <div className="h-full flex flex-col">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Seating Plan</h1>
                    <p className="text-gray-500">Arrange tables and assign guests.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-500 mr-2">
                        <span className="font-bold text-gray-900">{tables.reduce((acc, t) => acc + t.occupied, 0)}</span> / {tables.reduce((acc, t) => acc + t.seats, 0)} seats
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-white hover:border-gray-300 transition bg-white">
                        <i className="fa-solid fa-print text-gray-400"></i> Print Plan
                    </button>
                    <button
                        onClick={handleAddTable}
                        className="flex items-center gap-2 px-4 py-2 bg-pink-600 rounded-lg text-sm font-bold text-white hover:bg-pink-700 shadow-lg shadow-pink-200 transition"
                    >
                        <i className="fa-solid fa-plus"></i> Add Table
                    </button>
                </div>
            </header>

            <div className="flex-1 bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden relative shadow-inner">
                {/* Floor Pattern */}
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                {/* Stage */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-24 bg-gray-800 text-white flex items-center justify-center rounded-b-3xl shadow-xl z-0">
                    <span className="font-bold tracking-[0.5em] text-sm">STAGE & BAND</span>
                </div>

                {/* Tables */}
                <div className="absolute inset-0 p-20 overflow-auto">
                    <div className="flex flex-wrap gap-20 justify-center pt-20">
                        {tables.map((table) => (
                            <div key={table.id} className="relative group">
                                {/* Remove Button (visible on hover) */}
                                <button
                                    onClick={() => handleRemoveTable(table.id)}
                                    className="absolute -top-4 -right-4 w-8 h-8 bg-white text-red-500 rounded-full shadow-md z-10 opacity-0 group-hover:opacity-100 transition flex items-center justify-center hover:bg-red-50"
                                >
                                    <i className="fa-solid fa-trash text-xs"></i>
                                </button>

                                <div className={`relative w-48 h-48 bg-white rounded-full border-4 shadow-lg flex items-center justify-center cursor-move transition ${table.occupied === 0 ? 'border-gray-200' : 'border-pink-200 hover:border-pink-400'
                                    }`}>
                                    <div className="text-center">
                                        <div className={`text-2xl font-black ${table.occupied === 0 ? 'text-gray-300' : 'text-gray-900'}`}>{table.id}</div>
                                        <div className="text-xs text-gray-400">{table.occupied}/{table.seats} Seats</div>
                                    </div>

                                    {/* Seats wrapper */}
                                    {[...Array(table.seats)].map((_, i) => {
                                        const isOccupied = i < table.occupied;
                                        return (
                                            <div
                                                key={i}
                                                className={`absolute w-8 h-8 rounded-full border-2 shadow-sm flex items-center justify-center transition-all ${isOccupied ? 'bg-pink-100 border-white' : 'bg-gray-50 border-gray-200 border-dashed'
                                                    }`}
                                                style={{
                                                    top: '50%',
                                                    left: '50%',
                                                    transform: `translate(-50%, -50%) rotate(${i * (360 / table.seats)}deg) translate(80px) rotate(-${i * (360 / table.seats)}deg)`
                                                }}
                                            >
                                                {isOccupied && (
                                                    <div className="text-[10px] font-bold text-pink-500">
                                                        {String.fromCharCode(65 + i)}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Rectangular Table (Head Table) - Static for now */}
                        <div className="w-full flex justify-center mt-10">
                            <div className="relative w-96 h-32 bg-white rounded-xl border-4 border-purple-200 shadow-lg flex items-center justify-center group">
                                <div className="text-center">
                                    <div className="text-sm font-black text-purple-900 uppercase tracking-widest">Head Table</div>
                                </div>
                                {/* Top Seats */}
                                {[...Array(4)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute w-10 h-10 bg-purple-100 rounded-full border-2 border-white shadow-sm"
                                        style={{
                                            top: '-20px',
                                            left: `${20 + (i * 20)}%`
                                        }}
                                    >
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=VIP${i}`} alt="avatar" className="w-full h-full rounded-full" />
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
