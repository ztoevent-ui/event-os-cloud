import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const { data: project } = await supabase.from('projects').select('type').eq('id', id).single();
    const isWedding = project?.type === 'wedding' || project?.type === 'wedding_fair';
    const theme = isWedding ? {
        border: 'border-pink-500/30',
        primaryBg: 'bg-pink-500',
        primaryHover: 'hover:bg-pink-400',
        primaryText: 'text-pink-500',
        shadow: 'shadow-pink-500/20',
        gradient: 'from-pink-500 to-pink-700',
        borderInner: 'border-pink-300'
    } : {
        border: 'border-amber-500/30',
        primaryBg: 'bg-amber-500',
        primaryHover: 'hover:bg-amber-400',
        primaryText: 'text-amber-500',
        shadow: 'shadow-amber-500/20',
        gradient: 'from-amber-500 to-amber-700',
        borderInner: 'border-amber-300'
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className={`flex justify-between items-center bg-zinc-900 border ${theme.border} p-6 rounded-2xl shadow-sm`}>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white mb-2">Team Collaboration</h1>
                    <p className="text-zinc-400 font-medium">Manage access and roles.</p>
                </div>
                <button className={`px-6 py-2.5 ${theme.primaryBg} ${theme.primaryHover} text-black font-bold rounded-full transition-all flex items-center gap-2 transform hover:scale-105 shadow-lg ${theme.shadow}`}>
                    <i className="fa-solid fa-user-plus"></i> Invite Member
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Mock Manager */}
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center gap-4 hover:border-zinc-700 transition-colors">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-xl font-bold text-black border-2 ${theme.borderInner}`}>
                        JD
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">John Doe</h3>
                        <p className={`${theme.primaryText} text-sm font-medium`}>Project Manager</p>
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
