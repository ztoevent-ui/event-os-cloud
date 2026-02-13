'use client';

import React, { useState } from 'react';
import { useSportsState } from '@/lib/sports/useSportsState';
import { AdminCourt } from '@/components/sports/AdminCourt';
import { Match, CategoryConfig, Team } from '@/lib/sports/types';
import { SPORTS_ASSETS } from '@/lib/sports/assets';

// Asset Picker Component (Same as before)
function AssetPicker({ onSelect, onClose }: { onSelect: (url: string) => void, onClose: () => void }) {
    const [tab, setTab] = useState<'states' | 'football_clubs' | 'countries'>('states');

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800">Select Asset</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark"></i></button>
                </div>

                <div className="flex border-b border-gray-200">
                    {[
                        { id: 'states', label: 'Malaysia States' },
                        { id: 'football_clubs', label: 'MY Football' },
                        { id: 'countries', label: 'International' },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id as any)}
                            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide ${tab === t.id ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 bg-gray-50/50">
                    {SPORTS_ASSETS[tab].map((asset, idx) => (
                        <button
                            key={idx}
                            onClick={() => { onSelect(asset.url); onClose(); }}
                            className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition group flex flex-col items-center gap-2"
                        >
                            <div className="w-16 h-12 flex items-center justify-center">
                                <img src={asset.url} className="max-w-full max-h-full object-contain group-hover:scale-110 transition" alt={asset.name} />
                            </div>
                            <span className="text-[10px] font-bold text-center text-gray-600 leading-tight group-hover:text-indigo-600">{asset.name.replace('Flag of ', '')}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Sport Presets
const PRESETS: Record<string, { defaultName: string }> = {
    badminton: { defaultName: 'ZTO Badminton Open' },
    pickleball: { defaultName: 'PPA Grand Slam' },
    basketball: { defaultName: 'NBA Finals 2026' },
    football: { defaultName: 'Premier League' },
    tennis: { defaultName: 'Wimbledon Final' }
};

const CATEGORIES = [
    { id: 'ms', name: "Men's Singles" },
    { id: 'ws', name: "Women's Singles" },
    { id: 'md', name: "Men's Doubles" },
    { id: 'wd', name: "Women's Doubles" },
    { id: 'xd', name: "Mixed Doubles" },
];

export default function SportsAdminPage() {
    const { matches, players, tournament, allTournaments, switchTournament, loading, updateScore, createTournament, endCurrentTournament, ads, addAd, deleteAd, toggleAd, createMatch, deleteMatch } = useSportsState();
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [showAdManager, setShowAdManager] = useState(false);
    const [showMatchMaker, setShowMatchMaker] = useState(false);

    // Wizard State
    const [configResult, setConfigResult] = useState<{ sport: string } | null>(null);
    const [step, setStep] = useState(1);

    // Form Data
    const [basicInfo, setBasicInfo] = useState({ name: '', location: '', date: '', courts: '1-10' });
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [rosters, setRosters] = useState<Record<string, string>>({}); // categoryId -> Text Area Content

    // Step 1: Start
    const startConfig = (sportId: string) => {
        const preset = PRESETS[sportId];
        setConfigResult({ sport: sportId });
        setBasicInfo({
            name: preset?.defaultName || 'Tournament',
            location: 'Kuala Lumpur',
            date: new Date().toISOString().split('T')[0],
            courts: '1-10'
        });
        setStep(1);
        setSelectedCategories(['ms']);
        setRosters({});
    };

    // Wizard Actions
    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handleLaunch = () => {
        if (!configResult) return;

        // Parse Rosters
        const teams: Team[] = [];
        selectedCategories.forEach(catId => {
            const raw = rosters[catId] || '';
            const lines = raw.split('\n').filter(l => l.trim().length > 0);

            lines.forEach((line, idx) => {
                const ps = line.includes('/') ? line.split('/').map(s => s.trim()) : [line.trim()];
                teams.push({
                    name: line.trim(),
                    category: catId,
                    players: ps
                });
            });
        });

        const categoriesConfig: CategoryConfig[] = selectedCategories.map(cid => ({
            id: cid,
            name: CATEGORIES.find(c => c.id === cid)?.name || cid,
            team_count: teams.filter(t => t.category === cid).length
        }));

        createTournament({
            name: basicInfo.name,
            type: configResult.sport,
            config: {
                categories: categoriesConfig,
                teams: teams,
                location: basicInfo.location,
                date: basicInfo.date,
                courts: basicInfo.courts
            }
        });

        setConfigResult(null);
        setIsCreatingNew(false);
    };

    const handleUpdate = (updates: Partial<Match>) => {
        if (selectedMatch) {
            updateScore(selectedMatch.id, updates);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Sports Data...</div>;

    // --- VIEW 1: TOURNAMENT CREATION WIZARD ---
    if (isCreatingNew || !tournament) {
        if (configResult) {
            return (
                <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
                    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col animate-fade-in-up">
                        {/* Header */}
                        <div className="bg-indigo-900 p-6 flex justify-between items-center text-white">
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-wider">{configResult.sport} Setup</h2>
                                <p className="text-white/60 text-sm">Step {step} of 3</p>
                            </div>
                            <button onClick={() => setConfigResult(null)} className="text-white/40 hover:text-white"><i className="fa-solid fa-xmark text-xl"></i></button>
                        </div>

                        {/* Content */}
                        <div className="p-8 min-h-[400px]">

                            {/* STEP 1: BASIC INFO */}
                            {step === 1 && (
                                <div className="space-y-6 max-w-lg mx-auto">
                                    <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Event Details</h3>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Tournament Name</label>
                                        <input
                                            className="w-full border border-gray-300 rounded-lg p-3 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={basicInfo.name}
                                            onChange={e => setBasicInfo({ ...basicInfo, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Venue</label>
                                            <input
                                                className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={basicInfo.location}
                                                onChange={e => setBasicInfo({ ...basicInfo, location: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Date</label>
                                            <input
                                                type="date"
                                                className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={basicInfo.date}
                                                onChange={e => setBasicInfo({ ...basicInfo, date: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Court Numbering</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { id: '1-10', label: '1 - 10' },
                                                { id: '1-30', label: '1 - 30' },
                                                { id: 'A-Z', label: 'A - Z' },
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setBasicInfo({ ...basicInfo, courts: opt.id })}
                                                    className={`py-2 px-3 rounded-lg text-sm font-bold border transition ${basicInfo.courts === opt.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: CATEGORIES */}
                            {step === 2 && (
                                <div className="space-y-6 max-w-2xl mx-auto">
                                    <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Select Categories</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => {
                                                    if (selectedCategories.includes(cat.id)) {
                                                        setSelectedCategories(selectedCategories.filter(c => c !== cat.id));
                                                    } else {
                                                        setSelectedCategories([...selectedCategories, cat.id]);
                                                    }
                                                }}
                                                className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all ${selectedCategories.includes(cat.id) ? 'border-indigo-600 bg-indigo-50 text-indigo-800' : 'border-gray-200 hover:border-indigo-300 text-gray-600'}`}
                                            >
                                                <span className="font-bold">{cat.name}</span>
                                                {selectedCategories.includes(cat.id) && <i className="fa-solid fa-check-circle text-indigo-600 text-xl"></i>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: ROSTER */}
                            {step === 3 && (
                                <div className="h-full flex flex-col">
                                    <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Register Players</h3>
                                    <p className="text-sm text-gray-500 mb-4">Select a category tab and paste player names (one per line). For doubles, use "Name 1 / Name 2".</p>

                                    <div className="flex gap-2 mb-0 overflow-x-auto border-b border-gray-200">
                                        {selectedCategories.map(catId => {
                                            const catName = CATEGORIES.find(c => c.id === catId)?.name;
                                            return (
                                                <button
                                                    key={catId}
                                                    onClick={() => { /* Tabs handled locally in RosterInput for now */ }}
                                                    className="px-4 py-2 font-bold text-sm text-gray-700 bg-gray-100 rounded-t-lg hover:bg-gray-200 border border-transparent focus:bg-white focus:border-gray-300 focus:border-b-white focus:mb-[-1px] relative z-10"
                                                >
                                                    {catName}
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {/* Tabs Implementation */}
                                    <RosterInput
                                        categories={selectedCategories}
                                        rosters={rosters}
                                        setRosters={setRosters}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Footer / Nav */}
                        <div className="bg-gray-50 p-6 flex justify-between items-center border-t border-gray-200">
                            {step > 1 ? (
                                <button onClick={handleBack} className="px-6 py-2 rounded-lg text-gray-600 font-bold hover:bg-gray-200">Back</button>
                            ) : <div></div>}

                            {step < 3 ? (
                                <button onClick={handleNext} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/30">Next Step</button>
                            ) : (
                                <button onClick={handleLaunch} className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-500/30">Launch Tournament</button>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        // Mode B: Sport Selection
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 relative">
                {allTournaments.length > 0 && (
                    <button
                        onClick={() => setIsCreatingNew(false)}
                        className="absolute top-8 left-8 text-gray-500 hover:text-gray-900 flex items-center gap-2"
                    >
                        <i className="fa-solid fa-arrow-left"></i> Back to Dashboard
                    </button>
                )}
                <h1 className="text-4xl font-black text-gray-900 mb-2">Create New Tournament</h1>
                <p className="text-gray-500 mb-8">Select a sport to launch a new event</p>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full max-w-6xl">
                    {(
                        [
                            { id: 'badminton', icon: 'fa-shuttlecock', name: 'Badminton', color: 'bg-yellow-500' },
                            { id: 'pickleball', icon: 'fa-table-tennis-paddle-ball', name: 'Pickleball', color: 'bg-blue-600' },
                            { id: 'basketball', icon: 'fa-basketball', name: 'Basketball', color: 'bg-orange-600' },
                            { id: 'football', icon: 'fa-futbol', name: 'Football', color: 'bg-emerald-600' },
                            { id: 'tennis', icon: 'fa-baseball', name: 'Tennis', color: 'bg-green-700' },
                        ] as const
                    ).map((sport) => (
                        <button
                            key={sport.id}
                            onClick={() => startConfig(sport.id)}
                            className="group relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all text-left"
                        >
                            <div className={`w-12 h-12 ${sport.color} text-white rounded-xl flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                <i className={`fa-solid ${sport.icon}`}></i>
                            </div>
                            <h3 className="font-bold text-lg text-gray-900">{sport.name}</h3>
                            <p className="text-xs text-gray-400 mt-1">Click to Configure</p>
                            <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-500/10 rounded-2xl pointer-events-none"></div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // --- VIEW 2: ACTIVE TOURNAMENT DASHBOARD ---
    if (!tournament) return null; // Safe guard

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-800">ZTO Arena Admin</h1>

                    {/* TOURNAMENT SELECTOR */}
                    <div className="relative group">
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-bold text-indigo-600 hover:bg-gray-200 transition">
                            <span className="truncate max-w-[200px]">{tournament.name}</span>
                            <i className="fa-solid fa-chevron-down text-xs"></i>
                        </button>

                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden hidden group-hover:block z-50">
                            <div className="p-2 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">Switch Event</div>
                            <div className="max-h-64 overflow-y-auto">
                                {allTournaments.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => switchTournament(t.id)}
                                        className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 flex justify-between items-center ${t.id === tournament.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'}`}
                                    >
                                        <span className="truncate">{t.name}</span>
                                        {t.id === tournament.id && <i className="fa-solid fa-check text-indigo-600"></i>}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => { setIsCreatingNew(true); setConfigResult(null); }}
                                className="w-full text-left px-4 py-3 text-sm font-bold text-indigo-600 hover:bg-indigo-50 border-t border-gray-100 flex items-center gap-2"
                            >
                                <i className="fa-solid fa-plus"></i> Create New
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => setShowMatchMaker(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 shadow-sm"
                    >
                        <i className="fa-solid fa-plus"></i> New Match
                    </button>

                    <button
                        onClick={() => setShowAdManager(true)}
                        className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2"
                    >
                        <i className="fa-solid fa-rectangle-ad"></i> Sponsors
                    </button>

                    {selectedMatch && (
                        <button
                            onClick={() => setSelectedMatch(null)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition"
                        >
                            Back to List
                        </button>
                    )}
                    <div className="w-8 h-8 rounded-full bg-yellow-400 text-yellow-900 border border-yellow-500 flex items-center justify-center font-bold" title="Reset/End">!</div>
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to end this tournament?')) endCurrentTournament();
                        }}
                        className="text-red-500 hover:text-red-700 text-xs font-bold uppercase"
                    >
                        End Event
                    </button>
                </div>
            </header >

            <main className="container mx-auto p-6">
                {selectedMatch ? (
                    <div className="w-full max-w-7xl mx-auto">
                        <AdminCourt
                            match={selectedMatch}
                            p1={players[selectedMatch.player1_id || '']}
                            p2={players[selectedMatch.player2_id || '']}
                            onUpdateScore={handleUpdate}
                            sportType={tournament.type}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {matches.map(m => (
                            <div
                                key={m.id}
                                className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition group relative"
                            >
                                <div onClick={() => setSelectedMatch(m)} className="cursor-pointer">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="font-bold text-gray-500 uppercase text-xs tracking-wider">{m.court_id}</span>
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${m.status === 'ongoing' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {m.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col gap-1">
                                            <div className="font-bold text-gray-800">{players[m.player1_id || '']?.name || 'TBD'}</div>
                                            <div className="font-bold text-gray-800">{players[m.player2_id || '']?.name || 'TBD'}</div>
                                        </div>
                                        <div className="flex flex-col gap-1 text-right">
                                            <div className="font-mono font-bold text-2xl text-blue-600">{m.current_score_p1}</div>
                                            <div className="font-mono font-bold text-2xl text-red-600">{m.current_score_p2}</div>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm('Delete this match?')) deleteMatch(m.id);
                                    }}
                                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                >
                                    <i className="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        ))}

                        {matches.length === 0 && (
                            <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                                <div className="mb-4 text-4xl text-gray-200"><i className="fa-solid fa-clipboard-list"></i></div>
                                <h3 className="text-lg font-bold text-gray-600">No Matches Scheduled</h3>
                                <p className="text-gray-400 max-w-sm mx-auto mt-2">
                                    Use the 'Match Maker' to create matchups from your registered roster of {tournament.config.teams?.length || 0} teams.
                                </p>
                                <button
                                    onClick={() => setShowMatchMaker(true)}
                                    className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow hover:bg-indigo-700"
                                >
                                    Open Match Maker
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* AD MANAGER MODAL */}
            {
                showAdManager && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <i className="fa-solid fa-rectangle-ad text-purple-600"></i> Sponsor & Ad Manager
                                </h3>
                                <button onClick={() => setShowAdManager(false)} className="text-gray-400 hover:text-gray-600">
                                    <i className="fa-solid fa-xmark text-xl"></i>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-0">
                                <AdManager ads={ads} onAdd={addAd} onDelete={deleteAd} onToggle={toggleAd} />
                            </div>
                        </div>
                    </div>
                )
            }

            {/* MATCH MAKER MODAL */}
            {
                showMatchMaker && (
                    <MatchMaker
                        players={players}
                        tournament={tournament}
                        onClose={() => setShowMatchMaker(false)}
                        onCreate={createMatch}
                    />
                )
            }
        </div >
    );
}

// MATCH MAKER COMPONENT
function MatchMaker({ players, tournament, onClose, onCreate }: any) {
    const playerList = Object.values(players);
    const [p1, setP1] = useState('');
    const [p2, setP2] = useState('');
    const [court, setCourt] = useState('Court 1');
    const [round, setRound] = useState('Round 1');

    const handleSubmit = () => {
        if (!p1 || !p2) return alert("Select 2 players");
        onCreate({
            player1_id: p1,
            player2_id: p2,
            court_id: court,
            round_name: round,
            tournament_id: tournament.id
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                <div className="bg-indigo-900 p-6 flex justify-between items-center text-white">
                    <h3 className="font-bold text-xl uppercase tracking-wider">Match Maker</h3>
                    <button onClick={onClose} className="text-white/40 hover:text-white"><i className="fa-solid fa-xmark text-xl"></i></button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Player 1</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg p-3 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                value={p1}
                                onChange={e => setP1(e.target.value)}
                            >
                                <option value="">Select Player</option>
                                {playerList.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Player 2</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg p-3 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                value={p2}
                                onChange={e => setP2(e.target.value)}
                            >
                                <option value="">Select Player</option>
                                {playerList.map((p: any) => (
                                    <option key={p.id} value={p.id} disabled={p.id === p1}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Court</label>
                            <input
                                className="w-full border border-gray-300 rounded-lg p-3 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                value={court}
                                onChange={e => setCourt(e.target.value)}
                                placeholder="e.g. Court 1"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Round</label>
                            <input
                                className="w-full border border-gray-300 rounded-lg p-3 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                value={round}
                                onChange={e => setRound(e.target.value)}
                                placeholder="e.g. Final"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={!p1 || !p2}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider shadow-lg shadow-indigo-500/30 transition"
                    >
                        Create Match
                    </button>
                </div>
            </div>
        </div>
    );
}

// Subcomponent for Roster Input
function RosterInput({ categories, rosters, setRosters }: any) {
    const [activeTab, setActiveTab] = useState(categories[0]);

    return (
        <div className="flex-1 flex flex-col">
            <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
                {categories.map((catId: string) => {
                    const catName = CATEGORIES.find(c => c.id === catId)?.name || catId;
                    const count = (rosters[catId] || '').split('\n').filter((l: string) => l.trim().length > 0).length;
                    return (
                        <button
                            key={catId}
                            onClick={() => setActiveTab(catId)}
                            className={`px-4 py-3 font-bold text-sm border-b-2 transition whitespace-nowrap ${activeTab === catId ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        >
                            {catName}
                            <span className="ml-2 px-2 py-0.5 bg-white rounded-full text-xs border shadow-sm">{count}</span>
                        </button>
                    )
                })}
            </div>
            <div className="flex-1 p-4 bg-gray-50 border border-t-0 border-gray-200 rounded-b-xl flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Input List</span>
                    <span className="text-xs text-gray-400">One entry per line</span>
                </div>
                <textarea
                    className="flex-1 w-full border border-gray-300 rounded-lg p-4 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    placeholder="Enter names here..."
                    value={rosters[activeTab] || ''}
                    onChange={e => setRosters({ ...rosters, [activeTab]: e.target.value })}
                />
            </div>
        </div>
    );
}

function AdManager({ ads, onAdd, onDelete, onToggle }: { ads: any[], onAdd: (ad: any) => void, onDelete: (id: string) => void, onToggle: (id: string, s: boolean) => void }) {
    const [newAd, setNewAd] = useState({ type: 'image', url: '', duration: 10, display_location: 'fullscreen' });

    const handleAdd = () => {
        if (!newAd.url) return;
        onAdd(newAd);
        setNewAd({ ...newAd, url: '' }); // Reset URL
    };

    return (
        <div className="flex flex-col h-full">
            {/* List */}
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50 space-y-3">
                {ads.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <i className="fa-solid fa-film text-4xl mb-4 text-gray-200"></i>
                        <p>No active advertisements.</p>
                    </div>
                )}
                {ads.map(ad => (
                    <div key={ad.id} className={`bg-white p-4 rounded-xl border shadow-sm flex gap-4 items-center group transition ${ad.is_active ? 'border-green-500 bg-green-50/50' : 'border-gray-200'}`}>
                        <div className="w-24 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-100 relative">
                            {ad.type === 'image' ? (
                                <img src={ad.url} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-gray-400"><i className="fa-solid fa-video text-2xl"></i></div>
                            )}
                            <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 rounded">{ad.type.toUpperCase()}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-800 truncate">{ad.url}</div>
                            <div className="flex gap-2 text-xs text-gray-500 mt-1">
                                <span className={`px-2 py-0.5 rounded font-bold uppercase ${ad.display_location === 'fullscreen' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'}`}>{ad.display_location}</span>
                                <span>{ad.duration}s duration</span>
                            </div>
                        </div>
                        <div className="flex gap-3 items-center">
                            {ad.display_location === 'fullscreen' ? (
                                <button
                                    onClick={() => onToggle(ad.id, ad.is_active)}
                                    className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-sm ${ad.is_active ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' : 'bg-green-600 text-white hover:bg-green-700'}`}
                                >
                                    {ad.is_active ? 'STOP LIVE' : 'PLAY NOW'}
                                </button>
                            ) : (
                                <button
                                    onClick={() => onToggle(ad.id, ad.is_active)}
                                    className={`w-10 h-6 rounded-full transition relative ${ad.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow absolute top-1 transition-all ${ad.is_active ? 'left-5' : 'left-1'}`} />
                                </button>
                            )}

                            <button onClick={() => onDelete(ad.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition">
                                <i className="fa-solid fa-trash text-sm"></i>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input */}
            <div className="bg-white p-6 border-t border-gray-200 shadow-up">
                <h4 className="font-bold text-gray-800 mb-4">Add New Advertisement</h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500"
                            value={newAd.type}
                            onChange={e => setNewAd({ ...newAd, type: e.target.value })}
                        >
                            <option value="image">Image (Poster)</option>
                            <option value="video">Video (Commercial)</option>
                        </select>
                    </div>
                    <div className="md:col-span-5">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Asset URL</label>
                        <input
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="https://example.com/ad.mp4"
                            value={newAd.url}
                            onChange={e => setNewAd({ ...newAd, url: e.target.value })}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500"
                            value={newAd.display_location}
                            onChange={e => setNewAd({ ...newAd, display_location: e.target.value })}
                        >
                            <option value="fullscreen">Fullscreen</option>
                            <option value="sidebar">Sidebar</option>
                            <option value="banner">Banner</option>
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Secs</label>
                        <input
                            type="number"
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500 text-center"
                            value={newAd.duration}
                            onChange={e => setNewAd({ ...newAd, duration: parseInt(e.target.value) })}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <button
                            onClick={handleAdd}
                            disabled={!newAd.url}
                            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 text-white font-bold p-3 rounded-lg shadow-lg shadow-purple-500/30 transition"
                        >
                            <i className="fa-solid fa-plus mr-2"></i> Add Ad
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
