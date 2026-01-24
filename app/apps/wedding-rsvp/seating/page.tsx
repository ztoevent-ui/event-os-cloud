'use client';

export default function SeatingPage() {
    return (
        <div className="h-full flex flex-col">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Seating Plan</h1>
                    <p className="text-gray-500">Arrange tables and assign guests.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-500 mr-2">
                        <span className="font-bold text-gray-900">45</span> / 150 seated
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-white hover:border-gray-300 transition bg-white">
                        <i className="fa-solid fa-print text-gray-400"></i> Print Plan
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-pink-600 rounded-lg text-sm font-bold text-white hover:bg-pink-700 shadow-lg shadow-pink-200 transition">
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
                    <div className="grid grid-cols-3 gap-20 w-max mx-auto pt-20">
                        {/* Table 1 */}
                        <div className="relative w-48 h-48 bg-white rounded-full border-4 border-pink-200 shadow-lg flex items-center justify-center group cursor-pointer hover:border-pink-400 transition">
                            <div className="text-center">
                                <div className="text-2xl font-black text-gray-900">1</div>
                                <div className="text-xs text-gray-400">8/10 Seats</div>
                            </div>
                            {/* Seats around the table */}
                            {[...Array(8)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-8 h-8 bg-pink-100 rounded-full border-2 border-white shadow-sm"
                                    style={{
                                        top: '50%',
                                        left: '50%',
                                        transform: `translate(-50%, -50%) rotate(${i * 45}deg) translate(80px) rotate(-${i * 45}deg)`
                                    }}
                                    title="Occupied"
                                >
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="avatar" className="w-full h-full rounded-full" />
                                </div>
                            ))}
                            {[...Array(2)].map((_, i) => (
                                <div
                                    key={i + 8}
                                    className="absolute w-8 h-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-full"
                                    style={{
                                        top: '50%',
                                        left: '50%',
                                        transform: `translate(-50%, -50%) rotate(${(i + 8) * 45}deg) translate(80px) rotate(-${(i + 8) * 45}deg)`
                                    }}
                                    title="Empty"
                                ></div>
                            ))}
                        </div>

                        {/* Table 2 */}
                        <div className="relative w-48 h-48 bg-white rounded-full border-4 border-pink-200 shadow-lg flex items-center justify-center group cursor-pointer hover:border-pink-400 transition">
                            <div className="text-center">
                                <div className="text-2xl font-black text-gray-900">2</div>
                                <div className="text-xs text-gray-400">FAMILY</div>
                            </div>
                            {[...Array(10)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-8 h-8 bg-pink-100 rounded-full border-2 border-white shadow-sm"
                                    style={{
                                        top: '50%',
                                        left: '50%',
                                        transform: `translate(-50%, -50%) rotate(${i * 36}deg) translate(80px) rotate(-${i * 36}deg)`
                                    }}
                                >
                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-pink-500">
                                        {String.fromCharCode(65 + i)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Table 3 */}
                        <div className="relative w-48 h-48 bg-white rounded-full border-4 border-gray-200 shadow-lg flex items-center justify-center group cursor-pointer hover:border-blue-400 transition opacity-60">
                            <div className="text-center">
                                <div className="text-2xl font-black text-gray-300">3</div>
                                <div className="text-xs text-gray-400">Empty</div>
                            </div>
                        </div>

                        {/* Rectangular Table */}
                        <div className="col-span-3 flex justify-center mt-10">
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
