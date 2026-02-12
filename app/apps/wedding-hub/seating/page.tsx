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

    // New State for Table Editing
    const [tableSize, setTableSize] = useState(150);
    const [isDraggingTable, setIsDraggingTable] = useState<number | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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

    // Table Dragging Handlers
    const handleTableMouseDown = (e: React.MouseEvent, table: Table) => {
        e.stopPropagation(); // Stop bubbling to canvas
        e.preventDefault(); // Prevent default drag behavior if any
        setIsDraggingTable(table.id);
        // Calculate offset to prevent snapping to center
        // We need the table's current visual rect usually, but here we can just do mouse vs center
        // table.x/y is the center point.
        setDragOffset({
            x: e.clientX - table.x,
            y: e.clientY - table.y
        });
    };

    // Global Mouse Move for Table Dragging
    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (isDraggingTable !== null) {
            e.preventDefault();
            // Get the bounding rect of the container to make coordinates relative? 
            // For simplicity, we used absolute dragging in the previous step, but we need to account for layout structure
            // However, our table.x/y seems to be based on offset from container if we were using offsetLeft/Top.
            // But here we are using clientX/Y structure in state which might be messy if window scrolls.
            // Let's assume the container is relative and we track delta or absolute position relative to it.

            // To make it robust:
            // We just update the state based on the delta from the mouse movement would be better, 
            // BUT given the implementation, let's just use the clientX/Y - offset approach, 
            // assuming the 'dragOffset' captured the initial difference correctly.
            // NOTE: If the user scrolls, this might break without a ref to the container. 
            // Let's use a Ref for the container to correct the coordinates.
        }
    };

    // Better Approach: Use direct calculation relative to container
    const containerRef = useRef<HTMLDivElement>(null);

    const onMouseMove = (e: React.MouseEvent) => {
        if (isDraggingTable !== null && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within the element.
            const y = e.clientY - rect.top;  // y position within the element.

            // We want the table center to follow the mouse, but keeping the initial click offset
            // Adjust logic:
            // On MouseDown: offset = mouseX - tableX
            // On MouseMove: newTableX = mouseX - offset

            // Wait, the previous logic: offset = clientX - table.x (where table.x is relative to container?)
            // No, table.x is CSS "left". 

            // Let's strictly use coordinates relative to the container.
            // mouseX relative to container = e.clientX - rect.left

            setTables(prev => prev.map(t => {
                if (t.id === isDraggingTable) {
                    return {
                        ...t,
                        x: x, // Simply snap center to mouse for smoother feel now, or use offset if needed
                        y: y
                    };
                }
                return t;
            }));
        }
    };

    const handleCanvasMouseUp = () => {
        setIsDraggingTable(null);
    };

    const handleAddTable = () => {
        const newId = tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1;
        // Add to center of view (approximate)
        setTables([...tables, {
            id: newId,
            x: 400,
            y: 300,
            name: `Table ${newId}`,
            seats: 10,
            type: 'round'
        }]);
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
            // Swap
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

    return (
        <div
            className="h-full flex flex-col overflow-hidden"
            onMouseMove={onMouseMove}
            onMouseUp={handleCanvasMouseUp}
        >
            <header className="flex items-center justify-between gap-4 mb-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Smart Seating</h1>
                    <p className="text-gray-500">Upload floor plan, scan tables, and drag & drop guests.</p>
                </div>
                <div className="flex bg-white p-2 rounded-xl border border-gray-200 gap-4 items-center shadow-sm">
                    <div className="flex items-center gap-2 px-2 border-r border-gray-200 pr-4">
                        <span className="text-xs font-bold text-gray-500"><i className="fa-solid fa-expand"></i> Table Size</span>
                        <input
                            type="range"
                            min="50"
                            max="300"
                            value={tableSize}
                            onChange={(e) => setTableSize(Number(e.target.value))}
                            className="w-32 accent-pink-600 cursor-pointer"
                        />
                    </div>
                    <button onClick={handleAddTable} className="px-4 py-2 bg-gray-100 text-gray-900 font-bold rounded-lg hover:bg-gray-200 transition text-sm flex items-center gap-2">
                        <i className="fa-solid fa-plus"></i> Add Table
                    </button>
                    <button onClick={() => alert('Saved!')} className="px-6 py-2 bg-pink-600 text-white font-bold rounded-lg shadow hover:bg-pink-700 transition text-sm">
                        Save Plan
                    </button>
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
                <div
                    ref={containerRef}
                    className="flex-1 bg-gray-100 rounded-xl border border-gray-200 relative overflow-hidden flex items-center justify-center shadow-inner select-none"
                >

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

                            {/* DEMO BYPASS */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => {
                                        // High quality SVG Floorplan Data URI
                                        const svg = `data:image/svg+xml,%3Csvg width='800' height='600' viewBox='0 0 800 600' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='800' height='600' fill='%23f8fafc'/%3E%3C!-- Walls --%3E%3Cpath d='M50,50 L750,50 L750,550 L50,550 Z' fill='none' stroke='%23334155' stroke-width='8'/%3E%3C!-- Entrance --%3E%3Cpath d='M350,550 L450,550' stroke='%23f8fafc' stroke-width='12'/%3E%3Ctext x='400' y='580' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%2364748b' font-weight='bold'%3EENTRANCE%3C/text%3E%3C!-- Stage --%3E%3Crect x='300' y='50' width='200' height='80' fill='%23e2e8f0' stroke='%2394a3b8' stroke-width='2'/%3E%3Ctext x='400' y='100' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b' font-weight='bold' letter-spacing='2'%3ESTAGE%3C/text%3E%3C!-- Dance Floor --%3E%3Crect x='300' y='200' width='200' height='200' fill='%23f1f5f9' stroke='%23cbd5e1' stroke-dasharray='5,5'/%3E%3Ctext x='400' y='305' text-anchor='middle' font-family='sans-serif' font-size='12' fill='%2394a3b8'%3EDANCE FLOOR%3C/text%3E%3C!-- Decor Plants --%3E%3Ccircle cx='60' cy='60' r='15' fill='%23bbf7d0' stroke='%2386efac'/%3E%3Ccircle cx='740' cy='60' r='15' fill='%23bbf7d0' stroke='%2386efac'/%3E%3Ccircle cx='60' cy='540' r='15' fill='%23bbf7d0' stroke='%2386efac'/%3E%3Ccircle cx='740' cy='540' r='15' fill='%23bbf7d0' stroke='%2386efac'/%3E%3C/svg%3E`;
                                        setFloorPlan(svg);

                                        setIsScanning(true);
                                        // Simulate AI Scan
                                        setTimeout(() => {
                                            setIsScanning(false);
                                            // Perfect coordinates for this specific SVG layout
                                            setTables([
                                                // Left Side - Group 1
                                                { id: 1, x: 150, y: 200, name: 'T1', seats: 10, type: 'round' },
                                                { id: 2, x: 150, y: 350, name: 'T2', seats: 10, type: 'round' },
                                                { id: 3, x: 150, y: 500, name: 'T3', seats: 10, type: 'round' },

                                                // Right Side - Group 2
                                                { id: 4, x: 650, y: 200, name: 'T4', seats: 10, type: 'round' },
                                                { id: 5, x: 650, y: 350, name: 'T5', seats: 10, type: 'round' },
                                                { id: 6, x: 650, y: 500, name: 'T6', seats: 10, type: 'round' },

                                                // VIP / Head Tables near Dance Floor
                                                { id: 7, x: 250, y: 450, name: 'VIP 1', seats: 8, type: 'round' },
                                                { id: 8, x: 550, y: 450, name: 'VIP 2', seats: 8, type: 'round' },
                                            ]);
                                        }, 1200);
                                    }}
                                    className="text-xs text-gray-400 hover:text-gray-600"
                                >
                                    Use Demo Floor Plan
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 w-full h-full relative overflow-hidden">
                            {/* Background Image */}
                            <img src={floorPlan} alt="Floor Plan" className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-50" />

                            {/* Tables Layer */}
                            {tables.map(table => (
                                <div
                                    key={table.id}
                                    className="absolute cursor-move"
                                    onMouseDown={(e) => handleTableMouseDown(e, table)}
                                    style={{
                                        left: `${table.x}px`,
                                        top: `${table.y}px`,
                                        width: `${tableSize}px`, // Use global scale
                                        height: `${tableSize}px`,
                                        transform: 'translate(-50%, -50%)',
                                        zIndex: isDraggingTable === table.id ? 50 : 10
                                    }}
                                >
                                    {/* Table Shape */}
                                    <div className={`w-full h-full bg-white/80 backdrop-blur-sm border-2 border-gray-800 shadow-lg flex items-center justify-center relative rounded-full group hover:border-pink-500`}>
                                        <div className="text-center pointer-events-none">
                                            <div className="font-black text-gray-900 text-xs md:text-sm">{table.name}</div>
                                            <div className="text-[10px] text-gray-500">{table.seats} seats</div>
                                        </div>

                                        {/* Delete Button */}
                                        <button
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={() => setTables(tables.filter(t => t.id !== table.id))}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition z-50 hover:bg-red-700"
                                            title="Remove Table"
                                        >
                                            <i className="fa-solid fa-xmark text-xs"></i>
                                        </button>

                                        {/* Seats */}
                                        {[...Array(table.seats)].map((_, i) => {
                                            const angle = (i * (360 / table.seats)) * (Math.PI / 180);
                                            const radius = (tableSize / 2) + 15; // slightly outside
                                            const style = {
                                                left: `calc(50% + ${Math.cos(angle) * radius}px)`,
                                                top: `calc(50% + ${Math.sin(angle) * radius}px)`,
                                            };

                                            const seatedGuest = guests.find(g => g.tableId === table.id && g.tableIndex === i);

                                            return (
                                                <div
                                                    key={i}
                                                    className={`absolute w-8 h-8 rounded-full border transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all ${seatedGuest
                                                        ? 'bg-pink-100 border-pink-500 shadow-sm z-20 hover:scale-125'
                                                        : 'bg-white/80 border-dashed border-gray-400 hover:border-blue-500 hover:bg-blue-50'
                                                        }`}
                                                    style={style}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => {
                                                        e.stopPropagation();
                                                        handleDropOnTable(table.id, i);
                                                    }}
                                                >
                                                    {seatedGuest && (
                                                        <div
                                                            draggable
                                                            onDragStart={(e) => {
                                                                e.stopPropagation();
                                                                setDraggedGuest(seatedGuest);
                                                            }}
                                                            className="w-full h-full rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing font-bold text-[10px] text-pink-700"
                                                            title={seatedGuest.name}
                                                        >
                                                            {seatedGuest.name.slice(0, 1)}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
