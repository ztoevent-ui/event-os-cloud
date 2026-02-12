
export default function TeamPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white mb-2">Team Collaboration</h1>
                    <p className="text-zinc-400">Manage access and roles.</p>
                </div>
                <button className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full transition-all flex items-center gap-2 transform hover:scale-105 shadow-lg shadow-amber-500/20">
                    <i className="fa-solid fa-user-plus"></i> Invite Member
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Mock Manager */}
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-xl font-bold text-black border-2 border-amber-300">
                        JD
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">John Doe</h3>
                        <p className="text-amber-500 text-sm font-medium">Project Manager</p>
                        <span className="text-xs text-zinc-500 mt-1 block">Full Access</span>
                    </div>
                </div>

                {/* Mock Staff */}
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center gap-4 opacity-75">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-xl font-bold text-zinc-400 border border-zinc-700">
                        JS
                    </div>
                    <div>
                        <h3 className="font-bold text-zinc-300 text-lg">Jane Smith</h3>
                        <p className="text-zinc-500 text-sm font-medium">Coordinator</p>
                        <span className="text-xs text-zinc-600 mt-1 block">Staff Access</span>
                    </div>
                </div>
            </div>

            <div className="p-8 text-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-2xl mt-8">
                Team management integration with Auth users coming soon.
            </div>
        </div>
    );
}
