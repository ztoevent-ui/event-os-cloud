'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

const EVENT_TYPES = [
    { value: 'corporate', label: '🏢 Corporate Event', desc: 'General corporate functions & meetings' },
    { value: 'tournament', label: '🏆 Tournament / Sports', desc: 'Sports bracket, schedule & scoring' },
    { value: 'wedding', label: '💍 Wedding', desc: 'Guest lists, seating & ceremony planner' },
    { value: 'expo', label: '🎪 Expo / Exhibition', desc: 'Exhibitor management & floor plans' },
    { value: 'annual_dinner', label: '🥂 Annual Dinner', desc: 'Dinner banquet with tables & lucky draw' },
    { value: 'launching_ceremony', label: '🚀 Launching Ceremony', desc: 'Product & brand launch events' },
];

const STATUS_OPTIONS = ['planning', 'active', 'completed', 'on_hold'];

export default function ProjectSettingsPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const router = useRouter();

    const [project, setProject] = useState<any>(null);
    const [name, setName] = useState('');
    const [type, setType] = useState('corporate');
    const [status, setStatus] = useState('planning');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        supabase.from('projects').select('*').eq('id', id).single().then(({ data }) => {
            if (data) {
                setProject(data);
                setName(data.name || '');
                setType(data.type || 'corporate');
                setStatus(data.status || 'planning');
                setStartDate(data.start_date ? data.start_date.split('T')[0] : '');
                setEndDate(data.end_date ? data.end_date.split('T')[0] : '');
            }
            setLoading(false);
        });
    }, [id]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const { error } = await supabase.from('projects').update({
            name,
            type,
            status,
            start_date: startDate || null,
            end_date: endDate || null,
        }).eq('id', id);

        if (!error) {
            setSaved(true);
            setTimeout(() => {
                setSaved(false);
                router.refresh();
            }, 2000);
        }
        setSaving(false);
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <i className="fa-solid fa-spinner fa-spin text-3xl text-amber-500"></i>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in duration-500 space-y-8 py-4">
            <div>
                <h1 className="text-3xl font-serif font-bold text-white mb-2">Project Settings</h1>
                <p className="text-zinc-400">Configure the details and type for this event project.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Event Name */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Event Name</label>
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3.5 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                        placeholder="Event Name"
                    />
                </div>

                {/* Event Type */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Event Type</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {EVENT_TYPES.map(et => (
                            <button
                                key={et.value}
                                type="button"
                                onClick={() => setType(et.value)}
                                className={`text-left p-4 rounded-xl border-2 transition-all ${
                                    type === et.value 
                                        ? 'border-amber-500 bg-amber-500/10' 
                                        : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                                }`}
                            >
                                <div className="font-bold text-white text-sm mb-1">{et.label}</div>
                                <div className="text-zinc-500 text-xs">{et.desc}</div>
                                {type === et.value && (
                                    <div className="mt-2 flex items-center gap-1 text-amber-500 text-xs font-bold">
                                        <i className="fa-solid fa-check-circle"></i> Selected
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Status & Dates */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Status</label>
                        <div className="flex flex-wrap gap-3">
                            {STATUS_OPTIONS.map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setStatus(s)}
                                    className={`px-5 py-2 rounded-full font-bold text-sm capitalize transition-all border ${
                                        status === s
                                            ? s === 'active' ? 'bg-green-500 border-green-500 text-white'
                                            : s === 'completed' ? 'bg-zinc-500 border-zinc-400 text-white'
                                            : s === 'on_hold' ? 'bg-red-500 border-red-500 text-white'
                                            : 'bg-amber-500 border-amber-500 text-black'
                                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                    }`}
                                >
                                    {s.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                        saved
                            ? 'bg-green-500 text-white'
                            : 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 hover:scale-[1.01]'
                    }`}
                >
                    {saved ? (
                        <><i className="fa-solid fa-check-circle"></i> Changes Saved!</>
                    ) : saving ? (
                        <><i className="fa-solid fa-spinner fa-spin"></i> Saving...</>
                    ) : (
                        <><i className="fa-solid fa-floppy-disk"></i> Save Changes</>
                    )}
                </button>
            </form>
        </div>
    );
}
