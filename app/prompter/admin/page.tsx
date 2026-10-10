'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function PrompterAdmin() {
    const [scripts, setScripts] = useState<any[]>([]);
    const [state, setState] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [newTitle, setNewTitle] = useState('');
    const [newType, setNewType] = useState('lyric');
    const [newContent, setNewContent] = useState('');

    useEffect(() => {
        fetchData();

        const sub = supabase.channel('prompter_state_admin')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'prompter_state' }, payload => {
                if (payload.new.id === 1) setState(payload.new);
            })
            .subscribe();

        return () => { supabase.removeChannel(sub); };
    }, []);

    const fetchData = async () => {
        const { data: s } = await supabase.from('prompter_scripts').select('*').order('created_at', { ascending: false });
        setScripts(s || []);

        const { data: st } = await supabase.from('prompter_state').select('*').eq('id', 1).single();
        setState(st);
        setLoading(false);
    };

    const createScript = async () => {
        if (!newContent.trim()) {
            alert('Error: Content cannot be empty. Please paste your script/lyrics.');
            return;
        }
        const titleToSave = newTitle.trim() || `Untitled Script (${new Date().toLocaleTimeString()})`;
        const lines = newContent.split('\n').filter(l => l.trim() !== '');
        const { error } = await supabase.from('prompter_scripts').insert({
            title: titleToSave,
            type: newType,
            content: lines
        });
        if (error) {
            alert('Failed to save script: ' + error.message);
        } else {
            setNewTitle('');
            setNewContent('');
            fetchData();
        }
    };

    const activateScript = async (id: string, type: string) => {
        await supabase.from('prompter_state').update({
            current_script_id: id,
            mode: type,
            current_index: 0,
            is_playing: false
        }).eq('id', 1);
    };

    const prevLine = async () => {
        if (!state) return;
        const nextIdx = Math.max(0, state.current_index - 1);
        await supabase.from('prompter_state').update({ current_index: nextIdx }).eq('id', 1);
    };

    const nextLine = async () => {
        if (!state) return;
        await supabase.from('prompter_state').update({ current_index: state.current_index + 1 }).eq('id', 1);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (state?.mode === 'lyric') {
                if (e.key === 'ArrowLeft') prevLine();
                if (e.key === 'ArrowRight') nextLine();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [state]);

    // Auto-scroll to current lyric line
    useEffect(() => {
        if (state?.mode === 'lyric') {
            const activeEl = document.getElementById(`lyric-line-${state.current_index}`);
            if (activeEl) {
                activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [state?.current_index, state?.mode]);

    const togglePlay = async () => {
        if (!state) return;
        await supabase.from('prompter_state').update({ is_playing: !state.is_playing }).eq('id', 1);
    };

    const changeSpeed = async (val: number) => {
        if (!state) return;
        await supabase.from('prompter_state').update({ scroll_speed: val }).eq('id', 1);
    };

    const changeTheme = async (val: string) => {
        if (!state) return;
        await supabase.from('prompter_state').update({ theme: val }).eq('id', 1);
    };

    if (loading) return <div className="p-10 text-white">Loading...</div>;

    const currentScript = scripts.find(s => s.id === state?.current_script_id);

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans flex flex-col md:flex-row gap-8">
            {/* Sidebar: Library */}
            <div className="w-full md:w-1/3 flex flex-col gap-6">
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                    <h2 className="text-xl font-bold mb-4">Create New Script</h2>
                    <input className="w-full bg-zinc-800 text-white p-3 rounded-lg mb-3" placeholder="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                    <select className="w-full bg-zinc-800 text-white p-3 rounded-lg mb-3 outline-none" value={newType} onChange={e => setNewType(e.target.value)}>
                        <option value="lyric">Lyric (Slide Mode)</option>
                        <option value="speech">Speech (Scroll Mode)</option>
                    </select>
                    <textarea className="w-full bg-zinc-800 text-white p-3 rounded-lg mb-3 h-32" placeholder="Paste lyrics or speech here (separated by newlines)" value={newContent} onChange={e => setNewContent(e.target.value)} />
                    <button onClick={createScript} className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-3 rounded-lg transition-colors">Save Script</button>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex-1 overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4">Script Library</h2>
                    <div className="flex flex-col gap-3">
                        {scripts.map(s => (
                            <div key={s.id} className={`p-4 rounded-lg border cursor-pointer transition-colors ${state?.current_script_id === s.id ? 'bg-blue-600/20 border-blue-500' : 'bg-zinc-800 border-zinc-700 hover:border-zinc-500'}`} onClick={() => activateScript(s.id, s.type)}>
                                <div className="font-bold">{s.title}</div>
                                <div className="text-xs text-zinc-400 mt-1 uppercase tracking-wider">{s.type}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main: Operator Console */}
            <div className="w-full md:w-2/3 flex flex-col gap-6">
                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-black tracking-tight text-white">Prompter Console</h1>
                        <a href="/prompter/display" target="_blank" className="bg-zinc-800 px-4 py-2 rounded-lg font-bold hover:bg-zinc-700 transition">Open Display <i className="fa-solid fa-arrow-up-right-from-square ml-2" /></a>
                    </div>

                    <div className="flex gap-4 mb-8">
                        <div className="flex-1 bg-zinc-800 p-4 rounded-xl">
                            <div className="text-zinc-400 text-xs font-bold uppercase mb-1">Active Script</div>
                            <div className="text-xl font-bold">{currentScript ? currentScript.title : 'None Selected'}</div>
                        </div>
                        <div className="flex-1 bg-zinc-800 p-4 rounded-xl">
                            <div className="text-zinc-400 text-xs font-bold uppercase mb-1">Display Theme</div>
                            <select className="bg-transparent text-white font-bold text-xl outline-none w-full" value={state?.theme || 'dark'} onChange={e => changeTheme(e.target.value)}>
                                <option value="dark">High Contrast Dark</option>
                                <option value="particles">Particles</option>
                                <option value="zto">ZTO Royal Blue</option>
                            </select>
                        </div>
                    </div>

                    {state?.mode === 'lyric' && (
                        <div className="flex-1 flex flex-col gap-6 max-h-[65vh]">
                            <div className="flex-1 overflow-y-auto bg-zinc-950 p-4 rounded-3xl border border-zinc-800 shadow-inner flex flex-col gap-2 relative script-matrix-container">
                                {currentScript?.content.map((line: string, idx: number) => {
                                    const isActive = state.current_index === idx;
                                    return (
                                        <div 
                                            key={idx}
                                            id={`lyric-line-${idx}`}
                                            onClick={() => supabase.from('prompter_state').update({ current_index: idx }).eq('id', 1)}
                                            className={`p-4 rounded-xl cursor-pointer transition-all ${isActive ? 'bg-blue-600 text-white font-black text-2xl shadow-lg scale-[1.02] border border-blue-400' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800'}`}
                                        >
                                            <span className="opacity-40 text-sm mr-4">{idx + 1}</span>
                                            {line}
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <div className="flex gap-4">
                                <button onClick={prevLine} className="flex-1 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white font-black text-2xl py-6 rounded-2xl transition-all shadow-xl active:scale-95 flex flex-col items-center justify-center gap-1">
                                    <i className="fa-solid fa-chevron-left" />
                                    <span className="text-xs tracking-widest text-zinc-400">PREV (←)</span>
                                </button>
                                <button onClick={nextLine} className="flex-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black text-2xl py-6 rounded-2xl transition-all shadow-xl shadow-blue-900/50 active:scale-95 flex flex-col items-center justify-center gap-1">
                                    <i className="fa-solid fa-chevron-right" />
                                    <span className="text-xs tracking-widest text-blue-200">NEXT (→)</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {state?.mode === 'speech' && (
                        <div className="flex-1 flex flex-col gap-12 justify-center">
                            <button onClick={togglePlay} className={`w-full font-black text-5xl py-16 rounded-3xl transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-6 ${state.is_playing ? 'bg-red-600 hover:bg-red-500 shadow-red-900/50' : 'bg-green-600 hover:bg-green-500 shadow-green-900/50'}`}>
                                <i className={`fa-solid ${state.is_playing ? 'fa-pause' : 'fa-play'}`} />
                                {state.is_playing ? 'PAUSE' : 'PLAY'}
                            </button>

                            <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-3xl shadow-xl">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="font-bold text-zinc-400 tracking-widest">SCROLL SPEED</div>
                                    <div className="font-black text-3xl text-white">{state.scroll_speed.toFixed(1)}x</div>
                                </div>
                                <input 
                                    type="range" 
                                    min="0.5" max="5" step="0.1" 
                                    value={state.scroll_speed}
                                    onChange={e => changeSpeed(parseFloat(e.target.value))}
                                    className="w-full h-4 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                                <div className="flex justify-between mt-3 text-zinc-600 font-bold text-sm">
                                    <span>Slow</span>
                                    <span>Fast</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {!state?.mode && (
                        <div className="flex-1 flex items-center justify-center text-zinc-500 font-bold text-xl">
                            Select a script from the library to begin.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
