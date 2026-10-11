'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function PrompterAdmin() {
    const [scripts, setScripts] = useState<any[]>([]);
    const [state, setState] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [syncBadge, setSyncBadge] = useState<'connected' | 'syncing'>('connected');

    const [newTitle, setNewTitle] = useState('');
    const [newType, setNewType] = useState('lyric');
    const [newContent, setNewContent] = useState('');

    const realtimeChannelRef = useRef<any>(null);
    const stateRef = useRef<any>(null);
    const scriptsRef = useRef<any[]>([]);

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    useEffect(() => {
        scriptsRef.current = scripts;
    }, [scripts]);

    const getScriptLines = useCallback((sc: any): string[] => {
        if (!sc || !sc.content) return [];
        if (Array.isArray(sc.content)) return sc.content;
        if (typeof sc.content === 'string') {
            try {
                const parsed = JSON.parse(sc.content);
                if (Array.isArray(parsed)) return parsed;
            } catch {
                return sc.content.split('\n').filter((l: string) => l.trim() !== '');
            }
        }
        return [];
    }, []);

    // Broadcast synchronization to all Display screens (0ms Local + Cloud)
    const broadcastSync = useCallback((nextState: any, targetScript?: any) => {
        setSyncBadge('syncing');
        setTimeout(() => setSyncBadge('connected'), 200);

        // 1. HTML5 BroadcastChannel (0ms, same machine / dual-monitor)
        try {
            if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
                const bc = new BroadcastChannel('zto_prompter_sync');
                bc.postMessage({ type: 'SYNC_STATE', state: nextState, script: targetScript, time: Date.now() });
                bc.close();
            }
        } catch (e) {
            console.warn('BroadcastChannel error:', e);
        }

        // 2. LocalStorage storage event (0ms cross-window fallback)
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem(
                    'zto_prompter_sync_state',
                    JSON.stringify({ state: nextState, script: targetScript, time: Date.now() })
                );
            }
        } catch (e) {
            console.warn('LocalStorage sync error:', e);
        }

        // 3. Supabase Realtime WebSocket Broadcast (10ms, remote devices)
        try {
            if (realtimeChannelRef.current) {
                realtimeChannelRef.current.send({
                    type: 'broadcast',
                    event: 'SYNC_STATE',
                    payload: { state: nextState, script: targetScript, time: Date.now() }
                });
            }
        } catch (e) {
            console.warn('Supabase broadcast error:', e);
        }
    }, []);

    const fetchData = useCallback(async () => {
        const { data: s } = await supabase
            .from('prompter_scripts')
            .select('*')
            .order('created_at', { ascending: false });
        setScripts(s || []);

        const { data: st } = await supabase.from('prompter_state').select('*').eq('id', 1).single();
        setState(st);
        setLoading(false);
    }, []);

    // Setup Realtime Channel once on mount
    useEffect(() => {
        fetchData();

        const channel = supabase.channel('zto_prompter_live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'prompter_state' }, payload => {
                const newRow = payload.new as any;
                if (Number(newRow?.id) === 1) {
                    setState((prev: any) => ({ ...prev, ...newRow }));
                }
            })
            .subscribe((status) => {
                console.log('[Prompter Admin] Realtime status:', status);
            });

        realtimeChannelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchData]);

    const getCurrentScript = useCallback(() => {
        return scripts.find(s => s.id === state?.current_script_id) || null;
    }, [scripts, state?.current_script_id]);

    const createScript = async () => {
        if (!newContent.trim()) {
            alert('Error: Content cannot be empty. Please paste your script/lyrics.');
            return;
        }
        const titleToSave = newTitle.trim() || `Untitled Script (${new Date().toLocaleTimeString()})`;
        const lines = newContent.split('\n').filter(l => l.trim() !== '');
        const { data, error } = await supabase
            .from('prompter_scripts')
            .insert({
                title: titleToSave,
                type: newType,
                content: lines
            })
            .select()
            .single();

        if (error) {
            alert('Failed to save script: ' + error.message);
        } else {
            setNewTitle('');
            setNewContent('');
            await fetchData();
            if (data) {
                activateScript(data.id, data.type, data);
            }
        }
    };

    const deleteScript = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this script?')) return;
        await supabase.from('prompter_scripts').delete().eq('id', id);
        fetchData();
    };

    const activateScript = async (id: string, type: string, scriptObj?: any) => {
        const targetScript = scriptObj || scripts.find(s => s.id === id);
        const updates = { 
            current_script_id: id, 
            mode: type, 
            current_index: 0, 
            is_playing: false,
            is_blackout: false 
        };
        const nextState = { ...state, ...updates };
        setState(nextState);
        broadcastSync(nextState, targetScript);
        await supabase.from('prompter_state').update(updates).eq('id', 1);
    };

    const jumpToLine = async (idx: number) => {
        if (!state) return;
        const currentScript = getCurrentScript();
        const nextState = { ...state, current_index: idx, is_blackout: false };
        setState(nextState);
        broadcastSync(nextState, currentScript);
        await supabase.from('prompter_state').update({ current_index: idx, is_blackout: false }).eq('id', 1);
    };

    const prevLine = useCallback(async () => {
        if (!state) return;
        const currentScript = getCurrentScript();
        const nextIdx = Math.max(0, (state.current_index || 0) - 1);
        const nextState = { ...state, current_index: nextIdx, is_blackout: false };
        setState(nextState);
        broadcastSync(nextState, currentScript);
        await supabase.from('prompter_state').update({ current_index: nextIdx, is_blackout: false }).eq('id', 1);
    }, [state, getCurrentScript, broadcastSync]);

    const nextLine = useCallback(async () => {
        if (!state) return;
        const currentScript = getCurrentScript();
        const lines = getScriptLines(currentScript);
        const maxIdx = Math.max(0, lines.length - 1);
        const nextIdx = Math.min(maxIdx, (state.current_index || 0) + 1);
        const nextState = { ...state, current_index: nextIdx, is_blackout: false };
        setState(nextState);
        broadcastSync(nextState, currentScript);
        await supabase.from('prompter_state').update({ current_index: nextIdx, is_blackout: false }).eq('id', 1);
    }, [state, getCurrentScript, getScriptLines, broadcastSync]);

    const toggleBlackout = async () => {
        if (!state) return;
        const currentScript = getCurrentScript();
        const nextState = { ...state, is_blackout: !state.is_blackout };
        setState(nextState);
        broadcastSync(nextState, currentScript);
        await supabase.from('prompter_state').update({ is_blackout: nextState.is_blackout }).eq('id', 1);
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevLine();
            } else if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                nextLine();
            } else if (e.key === 'b' || e.key === 'B') {
                e.preventDefault();
                toggleBlackout();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [prevLine, nextLine, state?.is_blackout]);

    // Auto-scroll matrix to active lyric line
    useEffect(() => {
        if (state?.current_index !== undefined) {
            const activeEl = document.getElementById(`lyric-line-${state.current_index}`);
            if (activeEl) {
                activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [state?.current_index]);

    const togglePlay = async () => {
        if (!state) return;
        const currentScript = getCurrentScript();
        const nextState = { ...state, is_playing: !state.is_playing };
        setState(nextState);
        broadcastSync(nextState, currentScript);
        await supabase.from('prompter_state').update({ is_playing: nextState.is_playing }).eq('id', 1);
    };

    const changeSpeed = async (val: number) => {
        if (!state) return;
        const currentScript = getCurrentScript();
        const nextState = { ...state, scroll_speed: val };
        setState(nextState);
        broadcastSync(nextState, currentScript);
        await supabase.from('prompter_state').update({ scroll_speed: val }).eq('id', 1);
    };

    const changeTheme = async (val: string) => {
        if (!state) return;
        const currentScript = getCurrentScript();
        const nextState = { ...state, theme: val };
        setState(nextState);
        broadcastSync(nextState, currentScript);
        await supabase.from('prompter_state').update({ theme: val }).eq('id', 1);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
                Loading Prompter Console...
            </div>
        );
    }

    const currentScript = getCurrentScript();
    const scriptLines = getScriptLines(currentScript);

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-10 font-sans flex flex-col md:flex-row gap-8">
            {/* Sidebar: Library */}
            <div className="w-full md:w-1/3 flex flex-col gap-6">
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <i className="fa-solid fa-plus-circle text-blue-500" />
                        Create New Script
                    </h2>
                    <input 
                        className="w-full bg-zinc-800 text-white p-3 rounded-lg mb-3 border border-zinc-700 focus:border-blue-500 outline-none" 
                        placeholder="Script Title (e.g., 这是我们的敬拜)" 
                        value={newTitle} 
                        onChange={e => setNewTitle(e.target.value)} 
                    />
                    <select 
                        className="w-full bg-zinc-800 text-white p-3 rounded-lg mb-3 border border-zinc-700 focus:border-blue-500 outline-none" 
                        value={newType} 
                        onChange={e => setNewType(e.target.value)}
                    >
                        <option value="lyric">Lyric (Slide Mode - 逐句翻页)</option>
                        <option value="speech">Speech (Scroll Mode - 平滑滚动)</option>
                    </select>
                    <textarea 
                        className="w-full bg-zinc-800 text-white p-3 rounded-lg mb-3 h-32 border border-zinc-700 focus:border-blue-500 outline-none text-sm font-mono" 
                        placeholder="Paste lyrics or speech here (separated by newlines)..." 
                        value={newContent} 
                        onChange={e => setNewContent(e.target.value)} 
                    />
                    <button 
                        onClick={createScript} 
                        className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-3 rounded-lg transition-colors shadow-lg shadow-blue-900/30 active:scale-98"
                    >
                        Save & Activate Script
                    </button>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex-1 flex flex-col shadow-xl overflow-hidden min-h-[300px]">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <i className="fa-solid fa-book-open text-zinc-400" />
                            Script Library
                        </h2>
                        <span className="text-xs bg-zinc-800 px-2.5 py-1 rounded-full text-zinc-400 font-mono">
                            {scripts.length} Scripts
                        </span>
                    </div>

                    <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1">
                        {scripts.map(s => {
                            const isCurrent = state?.current_script_id === s.id;
                            const linesCount = getScriptLines(s).length;
                            return (
                                <div 
                                    key={s.id} 
                                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                                        isCurrent 
                                            ? 'bg-blue-600/20 border-blue-500 shadow-md shadow-blue-950' 
                                            : 'bg-zinc-800/80 border-zinc-700/60 hover:border-zinc-500 hover:bg-zinc-800'
                                    }`} 
                                    onClick={() => activateScript(s.id, s.type, s)}
                                >
                                    <div className="flex-1 min-w-0 pr-3">
                                        <div className="font-bold truncate text-white flex items-center gap-2">
                                            {isCurrent && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
                                            {s.title}
                                        </div>
                                        <div className="text-xs text-zinc-400 mt-1 uppercase tracking-wider flex items-center gap-2 font-mono">
                                            <span className="bg-zinc-900 px-2 py-0.5 rounded">{s.type}</span>
                                            <span>{linesCount} lines</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => deleteScript(s.id, e)}
                                        title="Delete Script"
                                        className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-400 transition"
                                    >
                                        <i className="fa-solid fa-trash-can text-sm" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main: Operator Console */}
            <div className="w-full md:w-2/3 flex flex-col gap-6">
                <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl flex-1 flex flex-col shadow-2xl">
                    {/* Header */}
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                                Prompter Console
                            </h1>
                            <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1 rounded-full border border-zinc-800 text-xs font-mono">
                                <span className={`w-2 h-2 rounded-full ${syncBadge === 'connected' ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
                                <span className="text-zinc-300">0ms Dual-Link</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleBlackout}
                                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                                    state?.is_blackout 
                                        ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-900' 
                                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                                }`}
                                title="Emergency Black Screen (B)"
                            >
                                <i className="fa-solid fa-eye-slash" />
                                {state?.is_blackout ? 'BLACKOUT ON' : 'BLACKOUT'}
                            </button>

                            <a 
                                href="/prompter/display" 
                                target="_blank" 
                                rel="noreferrer"
                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-sm transition shadow-lg shadow-blue-900/40 flex items-center gap-2"
                            >
                                <span>Open Display</span>
                                <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
                            </a>
                        </div>
                    </div>

                    {/* Metadata Strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                            <div className="text-zinc-500 text-xs font-bold uppercase mb-1">Active Script</div>
                            <div className="text-lg font-bold text-white truncate">
                                {currentScript ? currentScript.title : 'None Selected'}
                            </div>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                            <div className="text-zinc-500 text-xs font-bold uppercase mb-1">Display Mode</div>
                            <div className="text-lg font-bold text-blue-400 uppercase font-mono">
                                {state?.mode || 'lyric'} Mode
                            </div>
                        </div>

                        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                            <div className="text-zinc-500 text-xs font-bold uppercase mb-1">Theme</div>
                            <select 
                                className="bg-transparent text-white font-bold text-base outline-none w-full cursor-pointer" 
                                value={state?.theme || 'dark'} 
                                onChange={e => changeTheme(e.target.value)}
                            >
                                <option value="dark" className="bg-zinc-900">High Contrast Dark</option>
                                <option value="zto" className="bg-zinc-900">ZTO Royal Blue</option>
                                <option value="particles" className="bg-zinc-900">Particles Stardust</option>
                            </select>
                        </div>
                    </div>

                    {/* Global Script Matrix (Non-linear Jumps) */}
                    <div className="flex-1 flex flex-col min-h-[300px] max-h-[45vh] mb-6">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                                SCRIPT MATRIX (CLICK TO JUMP)
                            </div>
                            <div className="text-xs font-mono text-zinc-500">
                                Line <span className="text-blue-400 font-bold">{((state?.current_index || 0) + 1)}</span> / {scriptLines.length}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-zinc-950 p-3 rounded-2xl border border-zinc-800/80 shadow-inner flex flex-col gap-2">
                            {scriptLines.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-zinc-600 font-mono text-sm">
                                    No content in current script.
                                </div>
                            ) : (
                                scriptLines.map((line: string, idx: number) => {
                                    const isActive = state?.current_index === idx;
                                    return (
                                        <div 
                                            key={idx}
                                            id={`lyric-line-${idx}`}
                                            onClick={() => jumpToLine(idx)}
                                            className={`p-3.5 rounded-xl cursor-pointer transition-all flex items-start gap-3 select-none ${
                                                isActive 
                                                    ? 'bg-blue-600 text-white font-black text-xl shadow-lg shadow-blue-900/60 scale-[1.01] border border-blue-400' 
                                                    : 'bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-800/60'
                                            }`}
                                        >
                                            <span className={`text-xs font-mono px-2 py-0.5 rounded mt-0.5 ${isActive ? 'bg-blue-800 text-blue-200' : 'bg-zinc-800 text-zinc-500'}`}>
                                                {idx + 1}
                                            </span>
                                            <span className="flex-1 leading-relaxed">
                                                {line}
                                            </span>
                                            {isActive && (
                                                <span className="text-xs font-mono tracking-widest uppercase bg-blue-700/80 px-2 py-0.5 rounded text-blue-100 self-center">
                                                    ON AIR
                                                </span>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Operational Controls */}
                    {state?.mode === 'lyric' && (
                        <div className="flex gap-4">
                            <button 
                                onClick={prevLine} 
                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white font-black text-xl py-5 rounded-2xl transition-all shadow-xl active:scale-98 flex flex-col items-center justify-center gap-1 border border-zinc-700"
                            >
                                <i className="fa-solid fa-chevron-left text-2xl" />
                                <span className="text-xs tracking-widest text-zinc-400 font-mono">PREV (←)</span>
                            </button>
                            <button 
                                onClick={nextLine} 
                                className="flex-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black text-xl py-5 rounded-2xl transition-all shadow-xl shadow-blue-900/50 active:scale-98 flex flex-col items-center justify-center gap-1 border border-blue-400"
                            >
                                <i className="fa-solid fa-chevron-right text-2xl" />
                                <span className="text-xs tracking-widest text-blue-200 font-mono">NEXT (→ / Space)</span>
                            </button>
                        </div>
                    )}

                    {state?.mode === 'speech' && (
                        <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                            <button 
                                onClick={togglePlay} 
                                className={`flex-1 font-black text-2xl py-5 rounded-2xl transition-all shadow-xl active:scale-98 flex items-center justify-center gap-3 ${
                                    state.is_playing 
                                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/40' 
                                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
                                }`}
                            >
                                <i className={`fa-solid ${state.is_playing ? 'fa-pause' : 'fa-play'}`} />
                                <span>{state.is_playing ? 'PAUSE SCROLL' : 'START SCROLL'}</span>
                            </button>

                            <div className="flex-1 bg-zinc-950 border border-zinc-800 p-4 rounded-2xl shadow-xl flex flex-col justify-center">
                                <div className="flex justify-between items-center mb-2 font-mono">
                                    <span className="font-bold text-zinc-400 text-xs tracking-wider">SCROLL SPEED</span>
                                    <span className="font-black text-xl text-blue-400">{((state.scroll_speed || 1.0)).toFixed(1)}x</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0.5" 
                                    max="5" 
                                    step="0.1" 
                                    value={state.scroll_speed || 1.0}
                                    onChange={e => changeSpeed(parseFloat(e.target.value))}
                                    className="w-full h-2.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>
                        </div>
                    )}

                    {!state?.mode && (
                        <div className="p-8 text-center text-zinc-500 font-bold">
                            Select a script from the library to begin.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
