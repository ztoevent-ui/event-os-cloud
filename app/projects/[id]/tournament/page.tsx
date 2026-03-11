import { createClient } from '@supabase/supabase-js';
import { TournamentBracket } from '../../../../components/sports/TournamentBracket';
import { Match, Player, Tournament } from '../../../../lib/sports/types';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; // fallback empty or import from lib
import { supabase } from '@/lib/supabaseClient';

export default async function ProjectTournamentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch the overarching project
    const { data: project } = await supabase.from('projects').select('*').eq('id', id).single();

    if (project?.type !== 'tournament') {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <i className="fa-solid fa-triangle-exclamation text-4xl text-amber-500 mb-4"></i>
                <h2 className="text-xl font-bold text-white mb-2">Not a Tournament</h2>
                <p className="text-zinc-400 max-w-md text-center">
                    This project is configured as a {project?.type || 'standard event'}. The bracket view is only available for tournament projects.
                </p>
                <Link href={`/projects/${id}`} className="mt-6 px-6 py-2 bg-amber-500 text-black font-bold rounded-full hover:bg-amber-400 transition">
                    Return to Dashboard
                </Link>
            </div>
        );
    }

    // Try to find an existing tournament record for this project
    const { data: tournament } = await supabase
        .from('tournaments')
        .select('*')
        .eq('project_id', id)
        .single();
    
    // Server Action to link tournament
    async function linkTournament(tournamentId: string) {
        'use server'
        const { error } = await supabase
            .from('tournaments')
            .update({ project_id: id })
            .eq('id', tournamentId);
            
        if (error) {
            console.error('Error linking tournament:', error);
        }
    }

    if (!tournament) {
        // Fetch unlinked tournaments
        const { data: unlinkedTournaments } = await supabase
            .from('tournaments')
            .select('*')
            .is('project_id', null)
            .order('created_at', { ascending: false });

        return (
            <div className="space-y-8 animate-in fade-in duration-500 min-h-[80vh]">
                <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-sm shrink-0">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-white mb-2">Tournament Selection</h1>
                        <p className="text-zinc-400">Link an existing tournament configuration to this project.</p>
                    </div>
                    <button className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full transition-all flex items-center gap-2">
                        <i className="fa-solid fa-plus"></i> Create New Bracket
                    </button>
                </div>

                {unlinkedTournaments && unlinkedTournaments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {unlinkedTournaments.map((t: Tournament) => (
                            <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col hover:border-amber-500/50 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl mb-4">
                                    <i className={`fa-solid ${
                                        t.type === 'badminton' ? 'fa-table-tennis-paddle-ball' : 
                                        t.type === 'football' ? 'fa-futbol' : 'fa-trophy'
                                    }`}></i>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{t.name}</h3>
                                <p className="text-zinc-500 text-sm capitalize mb-6">{t.type} Tournament</p>
                                
                                <form action={linkTournament.bind(null, t.id)} className="mt-auto">
                                    <button type="submit" className="w-full py-2.5 bg-zinc-800 hover:bg-amber-500 hover:text-black text-white font-bold rounded-xl transition-all border border-zinc-700 hover:border-amber-500">
                                        Link to Project
                                    </button>
                                </form>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-800 rounded-2xl text-center px-4">
                        <i className="fa-solid fa-folder-open text-4xl text-zinc-600 mb-4"></i>
                        <h2 className="text-xl font-bold text-white mb-2">No Standalone Tournaments</h2>
                        <p className="text-zinc-500 max-w-md">
                            There are no available unlinked tournaments in the database. You will need to generate a new bracket tree for this project.
                        </p>
                    </div>
                )}
            </div>
        );
    }
    
    // An active tournament is now successfully linked and loaded.
    const activeTournament = tournament;

    // Fetch players and matches for the tournament
    const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .eq('tournament_id', activeTournament.id);
        
    const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .eq('tournament_id', activeTournament.id);

    const matchArray: Match[] = matchesData || [];
    const playerRecord: Record<string, Player> = {};
    if (playersData) {
        playersData.forEach((p: Player) => {
            playerRecord[p.id] = p;
        });
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col min-h-[80vh]">
            <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-sm shrink-0">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white mb-2">Tournament Brackets</h1>
                    <p className="text-zinc-400">View and manage the match progression tree.</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-full transition-all flex items-center gap-2 border border-zinc-700">
                        <i className="fa-solid fa-pen-to-square"></i> Edit Bracket
                    </button>
                    <button className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full transition-all flex items-center gap-2 transform hover:scale-105 shadow-lg shadow-amber-500/20">
                        <i className="fa-solid fa-play"></i> Start Next Match
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden min-h-[600px] relative">
                <TournamentBracket 
                    tournament={activeTournament as Tournament} 
                    matches={matchArray} 
                    players={playerRecord} 
                />
            </div>
        </div>
    );
}
