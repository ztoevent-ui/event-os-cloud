'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSportsState } from '@/lib/sports/useSportsState';
import { AdminCourt } from '@/components/sports/AdminCourt';
import { Match, CategoryConfig, Team } from '@/lib/sports/types';
import { SPORTS_ASSETS } from '@/lib/sports/assets';

// Asset Picker Component (Same as before)
function AssetPicker({ onSelect, onClose }: { onSelect: (url: string) => void, onClose: () => void }) {
    const [tab, setTab] = useState<'states' | 'football_clubs' | 'countries' | 'upload'>('states');
    const [manualUrl, setManualUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const res = await fetch('/api/upload-local', {
                method: 'POST',
                headers: {
                    'x-file-name': encodeURIComponent(file.name),
                    'content-type': file.type || 'application/octet-stream'
                },
                body: file
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Upload failed');
            }

            const data = await res.json();
            if (data.url) {
                setManualUrl(data.url);
                onSelect(data.url);
                onClose();
            }
        } catch (error: any) {
            console.error('Upload Error:', error);
            alert('Failed to upload file. ' + error.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-black text-gray-800 uppercase tracking-tighter">Select or Upload Asset</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark"></i></button>
                </div>

                <div className="flex border-b border-gray-200">
                    {[
                        { id: 'states', label: 'States' },
                        { id: 'football_clubs', label: 'Clubs' },
                        { id: 'countries', label: 'Countries' },
                        { id: 'upload', label: 'Upload / URL' },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id as any)}
                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest ${tab === t.id ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    {tab === 'upload' ? (
                        <div className="flex flex-col items-center justify-center p-4 h-full min-h-[300px] gap-6">
                            <i className="fa-solid fa-cloud-arrow-up text-5xl text-gray-200"></i>
                            <div className="w-full max-w-md space-y-4">

                                {/* Local Upload Zone */}
                                <div className="text-center p-6 border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-2xl hover:bg-indigo-50 hover:border-indigo-400 transition cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <input
                                        type="file"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept="image/*,video/mp4,video/webm"
                                    />
                                    <div className="flex flex-col items-center gap-2">
                                        {uploading ? (
                                            <i className="fa-solid fa-spinner fa-spin text-3xl text-indigo-500"></i>
                                        ) : (
                                            <i className="fa-solid fa-arrow-up-from-bracket text-3xl text-indigo-500"></i>
                                        )}
                                        <h4 className="font-bold text-gray-800 uppercase tracking-widest text-sm mt-2">{uploading ? 'Uploading...' : 'Click to Upload Local File'}</h4>
                                        <p className="text-[10px] text-gray-500 uppercase">.MP4, .JPG, .PNG fully supported</p>
                                    </div>
                                </div>

                                <div className="relative flex items-center py-2">
                                    <div className="flex-grow border-t border-gray-200"></div>
                                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase">Or Paste Link</span>
                                    <div className="flex-grow border-t border-gray-200"></div>
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        className="flex-1 border border-gray-300 rounded-xl p-3 text-sm font-medium focus:border-indigo-500 outline-none"
                                        placeholder="https://example.com/file.mp4"
                                        value={manualUrl}
                                        onChange={e => setManualUrl(e.target.value)}
                                    />
                                    <button
                                        onClick={() => { if (manualUrl) { onSelect(manualUrl); onClose(); } }}
                                        className="bg-indigo-600 hover:bg-indigo-700 transition text-white px-6 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20"
                                    >
                                        Use
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
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
                    )}
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
    const { now, matches, players, tournament, allTournaments, switchTournament, loading, updateScore, createTournament, endCurrentTournament, ads, addAd, deleteAd, toggleAd, createMatch, deleteMatch, updatePlayer, updateTournament } = useSportsState();
    const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
    const selectedMatch = matches.find(m => m.id === selectedMatchId);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [showAdManager, setShowAdManager] = useState(false);
    const [showMatchMaker, setShowMatchMaker] = useState(false);
    const [showPlayerManager, setShowPlayerManager] = useState(false);
    const [showSettings, setShowSettings] = useState(false); // NEW STATE
    const [showRefereeSelector, setShowRefereeSelector] = useState(false);
    const [editingMatch, setEditingMatch] = useState<Match | null>(null);

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
        if (selectedMatchId) {
            updateScore(selectedMatchId, updates);
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
            {/* SETTINGS MODAL */}
            {
                showSettings && (
                    <SettingsManager
                        tournament={tournament}
                        onUpdate={updateTournament}
                        onClose={() => setShowSettings(false)}
                    />
                )
            }

            <header className="bg-white border-b border-gray-200 px-4 md:px-6 pl-16 md:pl-24 py-4 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center justify-between w-full md:w-auto gap-4">
                    <Link href="/" className="flex items-center gap-3 group hover:opacity-80 transition-all active:scale-95">
                        <img
                            src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
                            alt="ZTO Logo"
                            className="w-10 h-10 object-contain rounded-lg shadow-sm"
                        />
                        <h1 className="text-xl font-bold text-gray-800 whitespace-nowrap">ZTO Arena</h1>
                    </Link>

                    {/* TOURNAMENT SELECTOR */}
                    <div className="relative group">
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-bold text-indigo-600 hover:bg-gray-200 transition">
                            <span className="truncate max-w-[150px] md:max-w-[200px]">{tournament.name}</span>
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

                <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 w-full md:w-auto">
                    <button
                        onClick={() => setShowMatchMaker(true)}
                        className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
                    >
                        <i className="fa-solid fa-plus"></i> <span className="hidden sm:inline">New Match</span><span className="sm:hidden">Match</span>
                    </button>

                    <button
                        onClick={() => setShowAdManager(true)}
                        className="flex-1 md:flex-none bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        <i className="fa-solid fa-rectangle-ad"></i> <span className="hidden sm:inline">Sponsors</span><span className="sm:hidden">Ads</span>
                    </button>

                    <button
                        onClick={() => setShowPlayerManager(true)}
                        className="flex-1 md:flex-none bg-orange-100 hover:bg-orange-200 text-orange-800 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        <i className="fa-solid fa-users"></i> <span className="hidden sm:inline">Players</span>
                    </button>

                    <a
                        href={`/arena/${tournament.id}/admin`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm whitespace-nowrap border border-red-500 animate-pulse"
                    >
                        <i className="fa-solid fa-satellite-dish"></i> Master Console
                    </a>

                    <button
                        onClick={() => setShowSettings(true)}
                        className="flex-1 md:flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        <i className="fa-solid fa-gear"></i>
                    </button>

                    {selectedMatchId && (
                        <button
                            onClick={() => setSelectedMatchId(null)}
                            className="flex-1 md:flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition whitespace-nowrap"
                        >
                            Back
                        </button>
                    )}

                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to end this tournament?')) endCurrentTournament();
                        }}
                        className="ml-2 text-red-500 hover:text-red-700 text-[10px] md:text-xs font-bold uppercase whitespace-nowrap"
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
                            now={now}
                            onClose={() => setSelectedMatchId(null)}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {/* THE MASTER CONSOLE CARD */}
                        <a
                            href={`/arena/${tournament.id}/admin`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-zinc-900 overflow-hidden rounded-xl border border-red-500/30 hover:shadow-[0_0_30px_rgba(239,68,68,0.2)] hover:border-red-500 transition-all group flex flex-col justify-between"
                        >
                            <div className="p-6 relative z-10">
                                <h3 className="font-black text-xl text-white uppercase tracking-wider flex items-center gap-2 mb-2">
                                    <i className="fa-solid fa-tower-broadcast text-red-500 animate-pulse"></i>
                                    Master Console <span className="text-[10px] ml-1 bg-red-600 text-white px-2 py-0.5 rounded-full">中控室</span>
                                </h3>
                                <p className="text-gray-400 text-sm mb-4">Live broadcast control center. Select what displays on the big screen, trigger specific court cameras, and force UI locks.</p>

                                <div className="text-xs font-bold text-red-400 mt-auto uppercase tracking-widest flex items-center gap-2 group-hover:text-red-300">
                                    Launch Sandbox <i className="fa-solid fa-arrow-right"></i>
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-gradient-to-r from-red-600 to-red-900 mt-auto"></div>
                        </a>

                        {/* THE REFEREE CONSOLE CARD */}
                        <button
                            onClick={() => setShowRefereeSelector(true)}
                            className="bg-white overflow-hidden rounded-xl border border-zinc-200 hover:shadow-lg hover:border-green-400 transition-all group flex flex-col justify-between text-left"
                        >
                            <div className="p-6 relative z-10 w-full">
                                <h3 className="font-black text-xl text-gray-800 uppercase tracking-wider flex items-center gap-2 mb-2">
                                    <i className="fa-solid fa-clipboard-user text-green-500 group-hover:animate-bounce"></i>
                                    Referee Admin <span className="text-[10px] ml-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full">裁判入口</span>
                                </h3>
                                <p className="text-gray-500 text-sm mb-4">Select a match to start umpiring. Update scores, modify info, and manage match state.</p>

                                <div className="text-xs font-bold text-green-600 mt-auto uppercase tracking-widest flex items-center gap-2 group-hover:text-green-500 cursor-pointer">
                                    Open Match List <i className="fa-solid fa-arrow-right"></i>
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-gradient-to-r from-green-400 to-green-600 mt-auto"></div>
                        </button>

                    </div>
                )}
            </main>

            {/* REFEREE MATCH SELECTOR MODAL */}
            {
                showRefereeSelector && (
                    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-gray-50 w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] animate-fade-in-up">
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-3xl pb-4">
                                <h3 className="font-black text-2xl text-gray-900 flex items-center gap-3 uppercase tracking-tighter">
                                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-xl">
                                        <i className="fa-solid fa-table-tennis-paddle-ball"></i>
                                    </div>
                                    Select Match to Umpire
                                </h3>
                                <button onClick={() => setShowRefereeSelector(false)} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition">
                                    <i className="fa-solid fa-xmark text-lg"></i>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {matches.length === 0 && (
                                        <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed border-gray-300">
                                            <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-3xl mb-4"><i className="fa-solid fa-clipboard-list"></i></div>
                                            <h3 className="text-lg font-bold text-gray-800">No Matches Scheduled</h3>
                                            <p className="text-gray-500 max-w-sm mt-2 text-sm">
                                                Use the 'Match Maker' on to schedule games before umpiring.
                                            </p>
                                        </div>
                                    )}
                                    {matches.map(m => (
                                        <div key={m.id} className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-green-400 hover:shadow-xl transition-all relative group flex flex-col text-left">
                                            <div className="flex-1 cursor-pointer" onClick={() => { setSelectedMatchId(m.id); setShowRefereeSelector(false); }}>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className="font-bold text-indigo-700 uppercase text-[10px] tracking-widest bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded shadow-sm">{m.court_id}</span>
                                                        {m.round_name && <span className="font-bold text-gray-400 uppercase text-[9px] tracking-wider">{m.round_name}</span>}
                                                    </div>
                                                    <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest ${m.status === 'ongoing' ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500'}`}>
                                                        {m.status}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center mt-2 group-hover:-translate-y-1 transition-transform">
                                                    <div className="flex flex-col gap-1.5 w-3/4 pr-2">
                                                        <div className="font-bold text-sm text-gray-800 truncate">{players[m.player1_id || '']?.name || 'Player 1 TBA'}</div>
                                                        <div className="font-bold text-sm text-gray-800 truncate">{players[m.player2_id || '']?.name || 'Player 2 TBA'}</div>
                                                    </div>
                                                    <div className="flex flex-col gap-1.5 text-right w-1/4">
                                                        <div className="font-mono font-black text-xl text-blue-600 bg-blue-50 px-2 rounded">{m.current_score_p1}</div>
                                                        <div className="font-mono font-black text-xl text-red-600 bg-red-50 px-2 rounded">{m.current_score_p2}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition shadow-lg rounded-lg bg-white border border-gray-100 p-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingMatch(m); }}
                                                    className="w-8 h-8 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded flex items-center justify-center text-gray-500 transition"
                                                    title="Edit Match Info"
                                                >
                                                    <i className="fa-solid fa-pen text-xs"></i>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm('Delete this match permanently?')) deleteMatch(m.id);
                                                    }}
                                                    className="w-8 h-8 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded flex items-center justify-center text-gray-500 transition"
                                                    title="Delete Match"
                                                >
                                                    <i className="fa-solid fa-trash text-xs"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* EDIT MATCH MODAL */}
            {
                editingMatch && (
                    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden p-6 animate-fade-in-up border border-white/20">
                            <h3 className="font-black text-xl text-gray-900 mb-6 uppercase tracking-tight flex items-center gap-2">
                                <i className="fa-solid fa-pen-to-square text-blue-500"></i> Edit Match Info
                            </h3>

                            <div className="space-y-4 mb-8">
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest text-gray-400 mb-1.5 uppercase ml-1">Court / Table / Location</label>
                                    <input
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 font-bold text-sm text-gray-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
                                        defaultValue={editingMatch.court_id || ''}
                                        id="edit-match-court"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest text-gray-400 mb-1.5 uppercase ml-1">Round Name</label>
                                    <input
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 font-bold text-sm text-gray-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
                                        defaultValue={editingMatch.round_name || ''}
                                        id="edit-match-round"
                                        placeholder="e.g. Final, Semi-Final"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button onClick={() => setEditingMatch(null)} className="px-5 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl text-sm transition">Cancel</button>
                                <button
                                    onClick={() => {
                                        const courtValue = (document.getElementById('edit-match-court') as HTMLInputElement).value;
                                        const roundValue = (document.getElementById('edit-match-round') as HTMLInputElement).value;
                                        updateScore(editingMatch.id, { court_id: courtValue, round_name: roundValue });
                                        setEditingMatch(null);
                                    }}
                                    className="px-6 py-3 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl text-sm shadow-lg shadow-blue-500/30 transition shadow-sm active:scale-95 flex items-center gap-2"
                                >
                                    <i className="fa-solid fa-check"></i> Save Details
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

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
                                <AdManager
                                    ads={ads}
                                    onAdd={addAd}
                                    onDelete={deleteAd}
                                    onToggle={toggleAd}
                                />
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

            {/* PLAYER MANAGER MODAL */}
            {
                showPlayerManager && (
                    <PlayerManager
                        players={players}
                        onUpdate={updatePlayer}
                        onClose={() => setShowPlayerManager(false)}
                    />
                )
            }

        </div >
    );
}

// MATCH MAKER COMPONENT
function MatchMaker({ players, tournament, onClose, onCreate }: any) {
    const playerList = Object.values(players) as any[];
    const [p1, setP1] = useState('');
    const [p2, setP2] = useState('');
    const [court, setCourt] = useState('Court 1');
    const [round, setRound] = useState('Round 1');

    // Filtering
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = tournament.config?.categories || [];

    const filteredPlayers = playerList.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        // Category filtering is tricky since 'players' table doesn't have category, 
        // but we can try to match from roster config if available
        if (selectedCategory === 'all') return matchesSearch;

        // Find if this player belongs to the category in the config
        const teamInConfig = tournament.config?.teams?.find((t: any) => t.name === p.name);
        return matchesSearch && teamInConfig?.category === selectedCategory;
    });

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
            <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
                <div className="bg-indigo-900 p-8 flex justify-between items-center text-white">
                    <div className="flex items-center gap-4">
                        <img
                            src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
                            alt="ZTO Logo"
                            className="w-12 h-12 object-contain rounded-xl shadow-2xl border border-white/10"
                        />
                        <div>
                            <h3 className="font-black text-2xl uppercase tracking-tighter">Match Maker</h3>
                            <p className="text-white/50 text-xs font-bold uppercase tracking-widest mt-1">Schedule New Matchup</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* LEFT: Configuration & Selection */}
                    <div className="flex-1 p-8 overflow-y-auto border-r border-gray-100 space-y-8">

                        {/* 1. Category & Search */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">1. Select Players</h4>
                                <div className="flex gap-2">
                                    <select
                                        className="bg-gray-100 border-none rounded-lg px-3 py-1.5 text-xs font-bold text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={selectedCategory}
                                        onChange={e => setSelectedCategory(e.target.value)}
                                    >
                                        <option value="all">All Categories</option>
                                        {categories.map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="relative">
                                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                <input
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition outline-none"
                                    placeholder="Search by name..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
                                {filteredPlayers.length === 0 && (
                                    <div className="col-span-full py-8 text-center text-gray-400 text-sm">No players found matching your criteria.</div>
                                )}
                                {filteredPlayers.map((p: any) => (
                                    <div
                                        key={p.id}
                                        className="flex flex-col gap-2"
                                    >
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setP1(p.id)}
                                                className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all ${p1 === p.id ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-lg scale-[1.02]' : 'border-gray-100 hover:border-blue-200 text-gray-600'}`}
                                            >
                                                P1
                                            </button>
                                            <button
                                                onClick={() => setP2(p.id)}
                                                className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all ${p2 === p.id ? 'border-red-600 bg-red-50 text-red-700 shadow-lg scale-[1.02]' : 'border-gray-100 hover:border-red-200 text-gray-600'}`}
                                            >
                                                P2
                                            </button>
                                        </div>
                                        <div className="text-[10px] uppercase font-bold text-gray-400 text-center truncate">{p.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. Venue & Round */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">2. Match Info</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 ml-1">Court / Table</label>
                                    <input
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition outline-none"
                                        value={court}
                                        onChange={e => setCourt(e.target.value)}
                                        placeholder="e.g. Court 1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 ml-1">Round Name</label>
                                    <input
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition outline-none"
                                        value={round}
                                        onChange={e => setRound(e.target.value)}
                                        placeholder="e.g. Final"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Preview */}
                    <div className="w-full md:w-[320px] bg-gray-50 p-8 flex flex-col justify-center gap-6 items-center border-t md:border-t-0 md:border-l border-gray-200">
                        <div className="text-center">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Preview</h4>

                            <div className="relative space-y-8">
                                <div className="z-10 relative">
                                    <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center text-2xl font-black transition-all duration-300 ${p1 ? 'bg-blue-600 border-white text-white shadow-xl scale-110' : 'bg-gray-200 border-gray-300 text-gray-400 border-dashed'}`}>
                                        {p1 ? players[p1]?.name.charAt(0) : '?'}
                                    </div>
                                    <div className="mt-2 font-black text-gray-800 uppercase text-xs truncate max-w-[120px]">{p1 ? players[p1]?.name : 'PLAYER 1'}</div>
                                </div>

                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-black text-gray-200 italic">VS</div>

                                <div className="z-10 relative">
                                    <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center text-2xl font-black transition-all duration-300 ${p2 ? 'bg-red-600 border-white text-white shadow-xl scale-110' : 'bg-gray-200 border-gray-300 text-gray-400 border-dashed'}`}>
                                        {p2 ? players[p2]?.name.charAt(0) : '?'}
                                    </div>
                                    <div className="mt-2 font-black text-gray-800 uppercase text-xs truncate max-w-[120px]">{p2 ? players[p2]?.name : 'PLAYER 2'}</div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!p1 || !p2}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:grayscale text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all mt-4"
                        >
                            Create Match
                        </button>
                    </div>
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
    const [showPicker, setShowPicker] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleAdd = () => {
        if (!newAd.url) return;
        onAdd(newAd);
        setNewAd({ ...newAd, url: '' }); // Reset URL
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Vercel Serverless Platform Size Limit Check
        const MAX_SIZE = 4.5 * 1024 * 1024; // 4.5MB
        if (file.size > MAX_SIZE) {
            alert("⚠️ CLOUD CAPACITY LIMIT EXCEEDED ⚠️\n\nThe selected file (" + (file.size / 1024 / 1024).toFixed(2) + " MB) is too large for direct cloud upload (Limit: 4.5MB).\n\n► Vercel Solution:\nPlease upload this large video to YouTube (as 'Unlisted') or Google Drive, then copy-paste the URL directly into the text box above.\n\nThe ZTO Event OS Engine fully supports and optimizes ultra-HD 4K streaming directly from YouTube/Drive URLs!");
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setUploading(true);
        try {
            const res = await fetch('/api/upload-local', {
                method: 'POST',
                headers: {
                    'x-file-name': encodeURIComponent(file.name),
                    'content-type': file.type || 'application/octet-stream'
                },
                body: file
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Upload failed');
            }

            const data = await res.json();
            if (data.url) {
                setNewAd(prev => ({ ...prev, url: data.url }));
            }
        } catch (error: any) {
            console.error('Upload Error:', error);
            alert('Failed to upload file. ' + error.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
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
                    <div className="md:col-span-12 lg:col-span-5">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Asset URL</label>
                        <div className="flex gap-2">
                            <input
                                className="flex-1 border border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Paste link or upload below..."
                                value={newAd.url}
                                onChange={e => setNewAd({ ...newAd, url: e.target.value })}
                            />
                            {/* Hidden file input */}
                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept={newAd.type === 'video' ? 'video/mp4,video/webm' : 'image/*'}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="bg-purple-100 hover:bg-purple-200 border border-purple-200 text-purple-700 px-4 font-bold text-[10px] uppercase rounded-lg transition flex items-center gap-1.5"
                                title="Upload Local File"
                            >
                                {uploading ? <i className="fa-solid fa-spinner fa-spin text-sm"></i> : <i className="fa-solid fa-arrow-up-from-bracket text-sm"></i>}
                                <span className="hidden lg:inline">Upload</span>
                            </button>
                            <button
                                onClick={() => setShowPicker(true)}
                                className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 px-3 rounded-lg transition"
                                title="Pick from Library"
                            >
                                <i className="fa-solid fa-images"></i>
                            </button>
                        </div>
                    </div>

                    {showPicker && (
                        <AssetPicker
                            onSelect={(url) => setNewAd({ ...newAd, url })}
                            onClose={() => setShowPicker(false)}
                        />
                    )}
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

// PLAYER MANAGER COMPONENT
function PlayerManager({ players, onUpdate, onClose }: { players: Record<string, any>, onUpdate: (id: string, updates: any) => void, onClose: () => void }) {
    const playerList = Object.values(players);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: '', avatar_url: '', country_code: '' });
    const [activePicker, setActivePicker] = useState<'avatar' | 'flag' | null>(null);

    const startEdit = (p: any) => {
        setEditingId(p.id);
        setEditForm({
            name: p.name,
            avatar_url: p.avatar_url || '',
            country_code: p.country_code || ''
        });
    };

    const handleSave = () => {
        if (!editingId) return;
        onUpdate(editingId, editForm);
        setEditingId(null);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="font-black text-xl text-gray-800 flex items-center gap-2 uppercase tracking-tighter">
                            <i className="fa-solid fa-users text-orange-600"></i> Roster Management
                        </h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Edit Player Profiles & Avatars</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition text-gray-400">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {playerList.map(p => (
                            <div key={p.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:border-orange-300 transition">
                                <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                                    <img src={p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random`} className="w-full h-full object-cover" alt={p.name} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-black text-gray-800 uppercase tracking-tighter truncate">{p.name}</div>
                                    <div className="text-[10px] text-gray-400 font-bold uppercase truncate">{p.avatar_url ? 'Custom Avatar Linked' : 'Default Placeholder'}</div>
                                </div>
                                <button
                                    onClick={() => startEdit(p)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-orange-600 hover:text-white rounded-lg text-xs font-black uppercase transition"
                                >
                                    Edit
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {editingId && (
                    <div className="p-6 border-t border-gray-200 bg-white shadow-2xl space-y-4 animate-slide-up">
                        <div className="flex justify-between items-center">
                            <h4 className="font-black text-gray-800 uppercase tracking-tighter">Editing Profile</h4>
                            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark"></i></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Display Name</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm font-bold"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Avatar Image URL</label>
                                <div className="flex gap-2">
                                    <input
                                        className="flex-1 border border-gray-300 rounded-lg p-3 text-sm font-medium"
                                        placeholder="Paste URL or Pick..."
                                        value={editForm.avatar_url}
                                        onChange={e => setEditForm({ ...editForm, avatar_url: e.target.value })}
                                    />
                                    <button
                                        onClick={() => setActivePicker('avatar')}
                                        className="bg-indigo-600 text-white px-4 rounded-lg hover:bg-indigo-700 transition"
                                    >
                                        <i className="fa-solid fa-images"></i>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Nationality / Flag</label>
                                <div className="flex gap-2">
                                    <div className="w-12 h-10 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                                        {editForm.country_code ? (
                                            <img src={editForm.country_code} className="w-full h-full object-cover" />
                                        ) : (
                                            <i className="fa-solid fa-flag text-gray-300"></i>
                                        )}
                                    </div>
                                    <input
                                        className="flex-1 border border-gray-300 rounded-lg p-3 text-sm font-medium"
                                        placeholder="Flag URL..."
                                        value={editForm.country_code}
                                        onChange={e => setEditForm({ ...editForm, country_code: e.target.value })}
                                    />
                                    <button
                                        onClick={() => setActivePicker('flag')}
                                        className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 transition"
                                    >
                                        <i className="fa-solid fa-flag"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <button onClick={() => setEditingId(null)} className="px-6 py-2 text-sm font-bold text-gray-500">Cancel</button>
                            <button onClick={handleSave} className="px-8 py-2 bg-green-600 text-white rounded-lg font-black uppercase shadow-lg shadow-green-500/20">Save Profile</button>
                        </div>
                    </div>
                )}

                {activePicker && (
                    <AssetPicker
                        onSelect={(url) => setEditForm({ ...editForm, [activePicker === 'avatar' ? 'avatar_url' : 'country_code']: url })}
                        onClose={() => setActivePicker(null)}
                    />
                )}
            </div>
        </div>
    );
}

// SETTINGS MANAGER COMPONENT
function SettingsManager({ tournament, onUpdate, onClose }: { tournament: any, onUpdate: (updates: any) => void, onClose: () => void }) {
    const [name, setName] = useState(tournament.name);
    const [logoUrl, setLogoUrl] = useState(tournament.config?.logo_url || '');
    const [bgUrl, setBgUrl] = useState(tournament.config?.bg_url || '');
    const [activePicker, setActivePicker] = useState<'logo' | 'bg' | null>(null);

    const handleSave = () => {
        onUpdate({
            name,
            config: {
                ...tournament.config,
                logo_url: logoUrl,
                bg_url: bgUrl
            }
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="font-black text-xl text-gray-800 flex items-center gap-2 uppercase tracking-tighter">
                            <i className="fa-solid fa-gear text-gray-600"></i> Event Settings
                        </h3>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition text-gray-400">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Tournament Name</label>
                        <input
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm font-bold"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Tournament Logo</label>
                        <div className="flex gap-4 items-center mb-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                                {logoUrl ? (
                                    <img src={logoUrl} className="w-full h-full object-contain" />
                                ) : (
                                    <i className="fa-solid fa-image text-gray-300 text-xl"></i>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="flex gap-2">
                                    <input
                                        className="flex-1 border border-gray-300 rounded-lg p-3 text-sm"
                                        placeholder="Logo URL..."
                                        value={logoUrl}
                                        onChange={e => setLogoUrl(e.target.value)}
                                    />
                                    <button
                                        onClick={() => setActivePicker('logo')}
                                        className="bg-indigo-600 text-white px-4 rounded-lg hover:bg-indigo-700 transition"
                                    >
                                        <i className="fa-solid fa-images"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Background Image</label>
                        <div className="flex gap-4 items-center mb-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                                {bgUrl ? (
                                    <img src={bgUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <i className="fa-solid fa-mountain-sun text-gray-300 text-xl"></i>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="flex gap-2">
                                    <input
                                        className="flex-1 border border-gray-300 rounded-lg p-3 text-sm"
                                        placeholder="Background URL..."
                                        value={bgUrl}
                                        onChange={e => setBgUrl(e.target.value)}
                                    />
                                    <button
                                        onClick={() => setActivePicker('bg')}
                                        className="bg-purple-600 text-white px-4 rounded-lg hover:bg-purple-700 transition"
                                    >
                                        <i className="fa-solid fa-image"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-gray-500">Cancel</button>
                    <button onClick={handleSave} className="px-8 py-2 bg-indigo-600 text-white rounded-lg font-black uppercase shadow-lg shadow-indigo-500/20">Save Settings</button>
                </div>

                {activePicker && (
                    <AssetPicker
                        onSelect={(url) => activePicker === 'logo' ? setLogoUrl(url) : setBgUrl(url)}
                        onClose={() => setActivePicker(null)}
                    />
                )}
            </div>
        </div>
    );
}
