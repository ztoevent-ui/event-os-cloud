
export default async function ProjectDashboard({ params }: { params: { id: string } }) {
    // Mock data simulation based on ID
    // In real implementation: const project = await supabase.from('projects').select('*').eq('id', params.id).single();

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
                <div className="relative z-10 p-10 md:p-16 text-center">
                    <div className="inline-block px-3 py-1 mb-4 border border-amber-500/30 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold tracking-widest uppercase">
                        Active Project
                    </div>
                    <h1 className="text-4xl md:text-6xl font-serif font-black text-white mb-4 tracking-tight">
                        Destined <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-600">Bintulu</span> 2026
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-8 font-light">
                        The centralized command center for the Wedding Expo.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                            View Master Plan
                        </button>
                        <div className="px-8 py-3 bg-zinc-800 text-white font-medium rounded-full border border-zinc-700 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            On Track
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 p-6 rounded-2xl hover:border-amber-900/50 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-zinc-200">Timeline</h3>
                        <i className="fa-solid fa-clock text-amber-500/50 group-hover:text-amber-500 transition-colors"></i>
                    </div>
                    <div className="text-3xl font-mono text-white mb-1">142 <span className="text-sm text-zinc-500 font-sans">Days Left</span></div>
                    <p className="text-xs text-zinc-500">Phase 1: Concept & Setup</p>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 p-6 rounded-2xl hover:border-amber-900/50 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-zinc-200">Tasks</h3>
                        <i className="fa-solid fa-list-check text-amber-500/50 group-hover:text-amber-500 transition-colors"></i>
                    </div>
                    <div className="text-xl font-bold text-white mb-1">12 Pending</div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-amber-500 h-full w-1/3"></div>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">4 Critical Items</p>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 p-6 rounded-2xl hover:border-amber-900/50 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-zinc-200">Budget</h3>
                        <i className="fa-solid fa-coins text-amber-500/50 group-hover:text-amber-500 transition-colors"></i>
                    </div>
                    <div className="text-3xl font-mono text-white mb-1">RM 45k <span className="text-sm text-zinc-500 font-sans">Spent</span></div>
                    <p className="text-xs text-green-500 flex items-center gap-1">
                        <i className="fa-solid fa-check"></i> Within initial allocation
                    </p>
                </div>
            </div>
        </div>
    );
}
