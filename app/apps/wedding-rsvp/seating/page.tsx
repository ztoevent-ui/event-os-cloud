'use client';

import { useState, useRef, useEffect } from 'react';

// Types
type Guest = {
    id: number;
    name: string;
    tableId: number | null; // null = unseated
    tableIndex?: number; // seat index
};

type Table = {
    id: number;
    x: number;
    y: number;
    name: string;
    seats: number;
    type: 'round' | 'rect';
};

export default function SeatingPage() {
    const [floorPlan, setFloorPlan] = useState<string | null>(null);
    const [tables, setTables] = useState<Table[]>([]);
    const [guests, setGuests] = useState<Guest[]>([
        { id: 1, name: 'Alice Johnson', tableId: null },
        { id: 2, name: 'Bob Smith', tableId: null },
        { id: 3, name: 'Charlie Davis', tableId: null },
        { id: 4, name: 'Diana Evans', tableId: null },
        { id: 5, name: 'Ethan Hunt', tableId: null },
        { id: 6, name: 'Fiona Gallagher', tableId: null },
        { id: 7, name: 'George Martin', tableId: null },
        { id: 8, name: 'Hannah Montana', tableId: null },
        { id: 9, name: 'Ian Malcolm', tableId: null },
        { id: 10, name: 'Jack Sparrow', tableId: null },
    ]);
    const [draggedGuest, setDraggedGuest] = useState<Guest | null>(null);
    const [isScanning, setIsScanning] = useState(false);

    // --- Actions ---

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setFloorPlan(ev.target?.result as string);
                setTables([]); // Clear existing if new map
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleAIScan = () => {
        if (!floorPlan) return;
        setIsScanning(true);
        // Simulate Scan Delay
        setTimeout(() => {
            setIsScanning(false);
            setTables([
                { id: 1, x: 200, y: 200, name: 'Table 1', seats: 10, type: 'round' },
                { id: 2, x: 500, y: 200, name: 'Table 2', seats: 10, type: 'round' },
                { id: 3, x: 350, y: 450, name: 'Head Table', seats: 6, type: 'rect' },
            ]);
        }, 1500);
    };

    const handleDropOnTable = (tableId: number, seatIndex: number) => {
        if (!draggedGuest) return;

        // Check if seat is occupied
        const isOccupied = guests.find(g => g.tableId === tableId && g.tableIndex === seatIndex);
        if (isOccupied) {
            // Swap or Error? Let's just swap for now or do nothing if simple
            // alert('Seat occupied!'); return;
            // Simple swap:
            setGuests(guests.map(g => {
                if (g.id === isOccupied.id) return { ...g, tableId: draggedGuest.tableId, tableIndex: draggedGuest.tableIndex };
                if (g.id === draggedGuest.id) return { ...g, tableId: tableId, tableIndex: seatIndex };
                return g;
            }));
        } else {
            // Assign
            setGuests(guests.map(g =>
                g.id === draggedGuest.id
                    ? { ...g, tableId: tableId, tableIndex: seatIndex }
                    : g
            ));
        }
        setDraggedGuest(null);
    };

    const handleDropOnList = () => {
        if (!draggedGuest) return;
        setGuests(guests.map(g =>
            g.id === draggedGuest.id
                ? { ...g, tableId: null, tableIndex: undefined }
                : g
        ));
        setDraggedGuest(null);
    };

    const handleTableDrag = (id: number, dx: number, dy: number) => {
        // This needs more complex mouse tracking logic which is hard to do perfectly in this snippet without dnd-kit
        // For now, I will omit table dragging logic to focus on Guest Dragging as requested ("drag name to another pos")
        // But I'll simulate "AI detected it" so the tables are fixed positions for now.
    }

    // --- Renderers ---

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <header className="flex items-center justify-between gap-4 mb-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Smart Seating</h1>
                    <p className="text-gray-500">Upload floor plan, scan tables, and drag & drop guests.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => alert('Saved!')} className="px-6 py-2 bg-pink-600 text-white font-bold rounded-lg shadow hover:bg-pink-700">Save Plan</button>
                </div>
            </header>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Sidebar: Unseated Guests */}
                <div
                    className="w-64 bg-white rounded-xl border border-gray-200 flex flex-col shadow-sm shrink-0"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDropOnList}
                >
                    <div className="p-4 border-b border-gray-100 font-bold text-gray-700">
                        Unseated Guests ({guests.filter(g => g.tableId === null).length})
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {guests.filter(g => g.tableId === null).map(guest => (
                            <div
                                key={guest.id}
                                draggable
                                onDragStart={() => setDraggedGuest(guest)}
                                className="p-3 bg-gray-50 border border-gray-100 rounded-lg cursor-grab active:cursor-grabbing hover:bg-pink-50 hover:border-pink-200 transition flex items-center gap-2 group"
                            >
                                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-xs text-gray-600">
                                    {guest.name[0]}
                                </div>
                                <span className="text-sm font-medium text-gray-700">{guest.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Canvas */}
                <div className="flex-1 bg-gray-100 rounded-xl border border-gray-200 relative overflow-hidden flex items-center justify-center shadow-inner select-none">

                    {!floorPlan ? (
                        <div className="text-center p-10 bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md">
                            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                                <i className="fa-solid fa-cloud-arrow-up"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Floor Plan</h3>
                            <p className="text-gray-500 mb-6 text-sm">Upload a photo or diagram of your venue layout to get started.</p>
                            <label className="block w-full cursor-pointer">
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                <span className="block w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition">
                                    Choose Image
                                </span>
                            </label>
                        </div>
                    ) : (
                        <>
                            {/* Background Image */}
                            <img src={floorPlan} alt="Floor Plan" className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-50" />

                            {/* Scan Button Overlay */}
                            {tables.length === 0 && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                                    <button
                                        onClick={handleAIScan}
                                        disabled={isScanning}
                                        className="px-6 py-3 bg-black text-white rounded-full font-bold shadow-xl hover:scale-105 transition flex items-center gap-2"
                                    >
                                        {isScanning ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                                        {isScanning ? 'Scanning Layout...' : 'AI Scan Tables'}
                                    </button>
                                </div>
                            )}

                            {/* Tables Layer */}
                            {tables.map(table => (
                                <div
                                    key={table.id}
                                    className="absolute"
                                    style={{
                                        left: table.x,
                                        top: table.y,
                                        width: table.type === 'rect' ? 200 : 150,
                                        height: table.type === 'rect' ? 100 : 150,
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                >
                                    {/* Table Shape */}
                                    <div className={`w-full h-full bg-white/90 backdrop-blur border-2 border-gray-800 shadow-lg flex items-center justify-center relative ${table.type === 'round' ? 'rounded-full' : 'rounded-lg'}`}>
                                        <div className="text-center">
                                            <div className="font-black text-gray-900">{table.name}</div>
                                            <div className="text-[10px] text-gray-500">{table.seats} seats</div>
                                        </div>

                                        {/* Seats */}
                                        {[...Array(table.seats)].map((_, i) => {
                                            // Calculate Position
                                            let style: React.CSSProperties = {};
                                            if (table.type === 'round') {
                                                const angle = (i * (360 / table.seats)) * (Math.PI / 180);
                                                const radius = 90; // distance from center
                                                style = {
                                                    left: `calc(50% + ${Math.cos(angle) * radius}px)`,
                                                    top: `calc(50% + ${Math.sin(angle) * radius}px)`,
                                                };
                                            } else {
                                                // Simple Rect layout (top/bottom)
                                                const side = i < table.seats / 2 ? 'top' : 'bottom';
                                                const pos = i % (table.seats / 2);
                                                style = {
                                                    [side]: '-40px',
                                                    left: `${(pos + 1) * (100 / ((table.seats / 2) + 1))}%`,
                                                };
                                            }

                                            const seatedGuest = guests.find(g => g.tableId === table.id && g.tableIndex === i);

                                            return (
                                                <div
                                                    key={i}
                                                    className={`absolute w-12 h-12 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all ${seatedGuest
                                                            ? 'bg-pink-100 border-pink-500 shadow-md scale-110 z-10'
                                                            : 'bg-white border-dashed border-gray-300 hover:border-blue-400'
                                                        }`}
                                                    style={style}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => {
                                                        e.stopPropagation();
                                                        handleDropOnTable(table.id, i);
                                                    }}
                                                >
                                                    {seatedGuest ? (
                                                        <div
                                                            draggable
                                                            onDragStart={(e) => {
                                                                e.stopPropagation();
                                                                setDraggedGuest(seatedGuest);
                                                            }}
                                                            className="w-full h-full rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                                                            title={seatedGuest.name}
                                                        >
                                                            <div className="font-bold text-pink-600 text-xs text-center leading-none px-1 overflow-hidden">
                                                                {seatedGuest.name.split(' ')[0]}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-gray-300 text-[10px]">{i + 1}</div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}
