'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function PrompterAdmin() {
    const [scripts, setScripts] = useState<any[]>([]);
    const [state, setState] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [syncBadge, setSyncBadge] = useState<'connected' | 'syncing'>('connected');

    // UI View states
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'lyric' | 'speech'>('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingScriptId, setEditingScriptId] = useState<string | null>(null);

    // Form inputs for modal
    const [modalTitle, setModalTitle] = useState('');
    const [modalType, setModalType] = useState('lyric');
    const [modalContent, setModalContent] = useState('');

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

    // Clean database persister (only sends valid schema columns)
    const persistToDb = async (updates: any) => {
        const validKeys = ['current_script_id', 'mode', 'current_index', 'scroll_speed', 'theme', 'is_playing'];
        const payload: any = {};
        for (const key of validKeys) {
            if (updates[key] !== undefined) {
                payload[key] = updates[key];
            }
        }
        if (Object.keys(payload).length === 0) return;
        payload.updated_at = new Date().toISOString();
        const { error } = await supabase.from('prompter_state').update(payload).eq('id', 1);
        if (error) {
            console.error('Failed to update prompter_state:', error);
        }
    };

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

    const currentScript = useMemo(() => {
        return scripts.find(s => s.id === state?.current_script_id) || null;
    }, [scripts, state?.current_script_id]);

    const scriptLines = useMemo(() => {
        return getScriptLines(currentScript);
    }, [currentScript, getScriptLines]);

    // Filtered scripts for the setlist sidebar
    const filteredScripts = useMemo(() => {
        return scripts.filter(s => {
            if (filterType !== 'all' && s.type !== filterType) return false;
            if (searchQuery.trim() && !s.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });
    }, [scripts, filterType, searchQuery]);

    const activateScript = async (id: string, type: string, scriptObj?: any) => {
        const targetScript = scriptObj || scripts.find(s => s.id === id);
        const updates = { 
            current_script_id: id, 
            mode: type, 
            current_index: 0, 
            is_playing: false 
        };
        // Preserve existing blackout state
        const isBlackout = !!state?.is_blackout;
        const nextState = { ...state, ...updates, is_blackout: isBlackout };
        setState(nextState);
        broadcastSync(nextState, targetScript);
        await persistToDb(updates);
    };

    /**
     * Jump to line (Non-linear jump)
     * CRITICAL RULE: If Blackout is active, jumping to a line updates the CUE / PREVIEW in admin,
     * but does NOT project to the stage display! Stage display remains pitch black.
     */
    const jumpToLine = async (idx: number) => {
        if (!state) return;
        const isBlackout = !!state.is_blackout;
        const nextState = { ...state, current_index: idx, is_blackout: isBlackout };
        setState(nextState);
        broadcastSync(nextState, currentScript);
        await persistToDb({ current_index: idx });
    };

    const prevLine = useCallback(async () => {
        if (!state) return;
        const nextIdx = Math.max(0, (state.current_index || 0) - 1);
        const isBlackout = !!state.is_blackout;
        const nextState = { ...state, current_index: nextIdx, is_blackout: isBlackout };
        setState(nextState);
        broadcastSync(nextState, currentScript);
        await persistToDb({ current_index: nextIdx });
    }, [state, currentScript, broadcastSync]);

    const nextLine = useCallback(async () => {
        if (!state) return;
        const maxIdx = Math.max(0, scriptLines.length - 1);
        const nextIdx = Math.min(maxIdx, (state.current_index || 0) + 1);
        const isBlackout = !!state.is_blackout;
        const nextState = { ...state, current_index: nextIdx, is_blackout: isBlackout };
        setState(nextState);
        broadcastSync(nextState, currentScript);
        await persistToDb({ current_index: nextIdx });
    }, [state, scriptLines, currentScript, broadcastSync]);

    /**
     * Toggle Blackout
     * When toggling OFF, the currently cued/selected line is immediately pushed to the stage display!
     */
    const toggleBlackout = useCallback(async () => {
        if (!state) return;
        const nextBlackout = !state.is_blackout;
        const nextState = { ...state, is_blackout: nextBlackout };
        setState(nextState);
        broadcastSync(nextState, currentScript);
    }, [state, currentScript, broadcastSync]);

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
            } else if (e.key === 'Enter') {
                if (state?.is_blackout) {
                    e.preventDefault();
                    toggleBlackout();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [prevLine, nextLine, toggleBlackout, state?.is_blackout]);

    // Auto-scroll matrix to active lyric line
    useEffect(() => {
        if (state?.current_index !== undefined) {
            const activeEl = document.getElementById(`lyric-slide-${state.current_index}`);
            if (activeEl) {
                activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [state?.current_index]);

    const togglePlay = async () => {
        if (!state) return;
        const nextState = { ...state, is_playing: !state.is_playing };
        setState(nextState);
        broadcastSync(nextState, currentScript);
        await persistToDb({ is_playing: nextState.is_playing });
    };

    const changeSpeed = async (val: number) => {
        if (!state) return;
        const nextState = { ...state, scroll_speed: val };
        setState(nextState);
        broadcastSync(nextState, currentScript);
        await persistToDb({ scroll_speed: val });
    };

    const changeTheme = async (val: string) => {
        if (!state) return;
        const nextState = { ...state, theme: val };
        setState(nextState);
        broadcastSync(nextState, currentScript);
        await persistToDb({ theme: val });
    };

    // Modal Create / Edit Script Handlers
    const openCreateModal = () => {
        setEditingScriptId(null);
        setModalTitle('');
        setModalType('lyric');
        setModalContent('');
        setIsCreateModalOpen(true);
    };

    const openEditModal = (s: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingScriptId(s.id);
        setModalTitle(s.title);
        setModalType(s.type);
        setModalContent(getScriptLines(s).join('\n'));
        setIsCreateModalOpen(true);
    };

    const saveModalScript = async () => {
        if (!modalContent.trim()) {
            alert('Script content cannot be empty.');
            return;
        }
        const lines = modalContent.split('\n').filter(l => l.trim() !== '');
        const titleToSave = modalTitle.trim() || `Untitled Script (${new Date().toLocaleTimeString()})`;

        if (editingScriptId) {
            // Update existing
            const { error } = await supabase
                .from('prompter_scripts')
                .update({ title: titleToSave, type: modalType, content: lines })
                .eq('id', editingScriptId);
            if (error) alert('Failed to update script: ' + error.message);
            else {
                setIsCreateModalOpen(false);
                await fetchData();
            }
        } else {
            // Create new
            const { data, error } = await supabase
                .from('prompter_scripts')
                .insert({ title: titleToSave, type: modalType, content: lines })
                .select()
                .single();
            if (error) alert('Failed to create script: ' + error.message);
            else {
                setIsCreateModalOpen(false);
                await fetchData();
                if (data) activateScript(data.id, data.type, data);
            }
        }
    };

    const deleteScript = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this script?')) return;
        await supabase.from('prompter_scripts').delete().eq('id', id);
        fetchData();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#090a0f] text-white flex flex-col items-center justify-center font-mono gap-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-zinc-400 text-sm tracking-widest uppercase">Initializing Prompter Engine...</span>
            </div>
        );
    }

    const isBlackoutActive = !!state?.is_blackout;
    const currentLineIndex = state?.current_index || 0;
    const onAirText = scriptLines[currentLineIndex] || '';
    const nextLineText = scriptLines[currentLineIndex + 1] || '— [END OF SCRIPT] —';

    return (
        <div className="h-screen bg-[#090a0f] text-zinc-100 flex flex-col font-sans select-none overflow-hidden">
            {/* Top Command Bar */}
            <header className="h-14 bg-[#12141c] border-b border-zinc-800/80 px-4 sm:px-6 flex items-center justify-between z-20 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                        <span className="font-black text-lg tracking-tight text-white font-mono">ZTO PROMPTER</span>
                    </div>
                    <span className="text-xs bg-blue-950 text-blue-400 border border-blue-800/60 px-2 py-0.5 rounded font-mono font-bold">
                        STAGE 2.0
                    </span>
                    <div className="hidden md:flex items-center gap-2 bg-[#1a1d27] px-3 py-1 rounded-full border border-zinc-800 text-xs font-mono">
                        <span className={`w-2 h-2 rounded-full ${syncBadge === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                        <span className="text-zinc-300">0ms Realtime Link</span>
                    </div>
                </div>

                {/* Center Status Banner */}
                <div className="hidden lg:flex items-center gap-4">
                    {currentScript ? (
                        <div className="flex items-center gap-2 bg-[#1a1d27] border border-zinc-800 px-3.5 py-1 rounded-xl text-xs">
                            <span className="text-zinc-400 uppercase font-mono tracking-wider">Loaded:</span>
                            <span className="font-bold text-white max-w-[200px] truncate">{currentScript.title}</span>
                            <span className="text-blue-400 font-mono font-bold">({currentLineIndex + 1}/{scriptLines.length})</span>
                        </div>
                    ) : (
                        <span className="text-xs text-zinc-500 font-mono">NO SCRIPT ACTIVE</span>
                    )}

                    {isBlackoutActive && (
                        <div className="flex items-center gap-2 bg-red-950/90 border border-red-600 text-red-200 px-3.5 py-1 rounded-xl text-xs font-mono font-bold animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.4)]">
                            <i className="fa-solid fa-triangle-exclamation text-red-400" />
                            <span>STAGE BLACKOUT ON AIR</span>
                        </div>
                    )}
                </div>

                {/* Right Action Deck */}
                <div className="flex items-center gap-3">
                    {/* Blackout Button */}
                    <button
                        onClick={toggleBlackout}
                        title="Toggle Stage Blackout (B)"
                        className={`px-4 py-1.5 rounded-xl font-bold text-xs tracking-wider transition-all flex items-center gap-2 border font-mono ${
                            isBlackoutActive
                                ? 'bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse'
                                : 'bg-[#1a1d27] hover:bg-red-950/40 text-zinc-300 border-zinc-700 hover:border-red-600/60'
                        }`}
                    >
                        <i className={`fa-solid ${isBlackoutActive ? 'fa-eye' : 'fa-eye-slash'} text-xs`} />
                        <span>{isBlackoutActive ? 'UNBLANK [B]' : 'BLACKOUT [B]'}</span>
                    </button>

                    <a
                        href="/prompter/display"
                        target="_blank"
                        rel="noreferrer"
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-zinc-700"
                    >
                        <span>Stage Display</span>
                        <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" />
                    </a>

                    <button
                        onClick={openCreateModal}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-900/40 active:scale-95"
                    >
                        <i className="fa-solid fa-plus text-[10px]" />
                        <span>New Script</span>
                    </button>
                </div>
            </header>

            {/* Main 3-Column Studio Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* COLUMN 1: Script Library & Setlist */}
                <aside className="w-72 sm:w-80 bg-[#0d0e14] border-r border-zinc-800/80 flex flex-col shrink-0">
                    {/* Library Header */}
                    <div className="p-3 border-b border-zinc-800/60 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
                                <i className="fa-solid fa-layer-group text-blue-500" />
                                Setlist Library
                            </span>
                            <span className="text-[11px] font-mono bg-zinc-800/90 text-zinc-400 px-2 py-0.5 rounded-full">
                                {filteredScripts.length}
                            </span>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                            <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-zinc-500 text-xs" />
                            <input
                                type="text"
                                placeholder="Search setlist..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-[#151821] text-zinc-200 text-xs pl-8 pr-3 py-1.5 rounded-lg border border-zinc-800 focus:border-blue-500 outline-none placeholder:text-zinc-600"
                            />
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex gap-1 bg-[#151821] p-1 rounded-lg border border-zinc-800/60 text-[11px] font-mono">
                            {(['all', 'lyric', 'speech'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setFilterType(tab)}
                                    className={`flex-1 py-1 rounded text-center uppercase font-bold transition ${
                                        filterType === tab
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Script Cards List */}
                    <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2">
                        {filteredScripts.length === 0 ? (
                            <div className="h-40 flex flex-col items-center justify-center text-zinc-600 text-xs font-mono text-center p-4">
                                <i className="fa-regular fa-folder-open text-2xl mb-2 opacity-50" />
                                No scripts found.
                            </div>
                        ) : (
                            filteredScripts.map(s => {
                                const isCurrent = state?.current_script_id === s.id;
                                const count = getScriptLines(s).length;
                                return (
                                    <div
                                        key={s.id}
                                        onClick={() => activateScript(s.id, s.type, s)}
                                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                                            isCurrent
                                                ? 'bg-blue-600/15 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.2)] text-white'
                                                : 'bg-[#131620] border-zinc-800/80 hover:border-zinc-700 hover:bg-[#181b28] text-zinc-300'
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0 pr-2">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                {isCurrent && (
                                                    <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_6px_#60a5fa] shrink-0 animate-pulse" />
                                                )}
                                                <span className="font-bold text-xs truncate leading-snug">{s.title}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                                                <span className={`uppercase font-bold px-1.5 py-0.5 rounded ${s.type === 'lyric' ? 'bg-blue-950 text-blue-400' : 'bg-emerald-950 text-emerald-400'}`}>
                                                    {s.type}
                                                </span>
                                                <span>{count} slides</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                                            <button
                                                onClick={(e) => openEditModal(s, e)}
                                                title="Edit script"
                                                className="p-1.5 text-zinc-500 hover:text-blue-400 transition"
                                            >
                                                <i className="fa-solid fa-pen text-[11px]" />
                                            </button>
                                            <button
                                                onClick={(e) => deleteScript(s.id, e)}
                                                title="Delete script"
                                                className="p-1.5 text-zinc-500 hover:text-red-400 transition"
                                            >
                                                <i className="fa-solid fa-trash-can text-[11px]" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </aside>

                {/* COLUMN 2: Script Matrix (Center Cue Deck) */}
                <main className="flex-1 bg-[#090a0f] flex flex-col overflow-hidden">
                    {/* Matrix Subheader */}
                    <div className="h-12 bg-[#10121a] border-b border-zinc-800/80 px-4 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-bold tracking-wider text-zinc-400 uppercase">
                                SLIDE MATRIX
                            </span>
                            <span className="text-xs font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-bold">
                                {scriptLines.length} CUES
                            </span>
                        </div>

                        {/* View Mode Controls */}
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1 bg-[#1a1d27] p-1 rounded-lg border border-zinc-800 text-xs">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    title="Grid View (Slide Matrix)"
                                    className={`px-2.5 py-1 rounded font-mono text-[11px] font-bold flex items-center gap-1.5 transition ${
                                        viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                                >
                                    <i className="fa-solid fa-grip" />
                                    <span>Grid</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    title="List View (Teleprompter Feed)"
                                    className={`px-2.5 py-1 rounded font-mono text-[11px] font-bold flex items-center gap-1.5 transition ${
                                        viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                                >
                                    <i className="fa-solid fa-list" />
                                    <span>List</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Blackout Notice Banner */}
                    {isBlackoutActive && (
                        <div className="bg-amber-950/60 border-b border-amber-800/80 px-4 py-2 flex items-center justify-between text-xs font-mono text-amber-200">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                                <span>STAGE BLACKOUT IS ACTIVE — Selecting any slide prepares the <strong>PREVIEW</strong>. Screen stays black until you unblank.</span>
                            </div>
                            <button
                                onClick={toggleBlackout}
                                className="bg-amber-500 hover:bg-amber-400 text-black px-3 py-0.5 rounded font-bold uppercase transition"
                            >
                                Take Live Now (B)
                            </button>
                        </div>
                    )}

                    {/* Matrix Content Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                        {!currentScript ? (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-600 font-mono text-sm gap-2">
                                <i className="fa-regular fa-clone text-4xl mb-2 opacity-40" />
                                <span>SELECT A SCRIPT FROM THE SETLIST TO BEGIN</span>
                            </div>
                        ) : scriptLines.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-600 font-mono text-sm gap-2">
                                <span>Script has no content. Click edit to add lines.</span>
                            </div>
                        ) : viewMode === 'grid' ? (
                            /* GRID VIEW: Professional ProPresenter slide layout */
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                                {scriptLines.map((line, idx) => {
                                    const isCurrent = currentLineIndex === idx;
                                    return (
                                        <div
                                            key={idx}
                                            id={`lyric-slide-${idx}`}
                                            onClick={() => jumpToLine(idx)}
                                            className={`p-4 rounded-xl cursor-pointer transition-all flex flex-col justify-between min-h-[110px] relative border group ${
                                                isCurrent
                                                    ? isBlackoutActive
                                                        ? 'bg-amber-950/40 border-amber-500 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                                                        : 'bg-blue-600/20 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-[1.01]'
                                                    : 'bg-[#12141c] border-zinc-800/80 hover:border-zinc-600 hover:bg-[#181a24] text-zinc-300'
                                            }`}
                                        >
                                            {/* Slide Top Ribbon */}
                                            <div className="flex justify-between items-center mb-2">
                                                <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold ${
                                                    isCurrent
                                                        ? isBlackoutActive ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white'
                                                        : 'bg-[#1c1f2e] text-zinc-500 group-hover:text-zinc-300'
                                                }`}>
                                                    #{idx + 1}
                                                </span>

                                                {isCurrent && (
                                                    <span className={`text-[10px] font-mono tracking-widest font-black uppercase px-2 py-0.5 rounded ${
                                                        isBlackoutActive ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                                    }`}>
                                                        {isBlackoutActive ? 'CUED (PREVIEW)' : 'ON AIR'}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Slide Text */}
                                            <div className={`text-base font-bold leading-relaxed line-clamp-3 ${isCurrent ? 'text-white' : 'text-zinc-300'}`}>
                                                {line}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* LIST VIEW: Clean vertical teleprompter rows */
                            <div className="flex flex-col gap-2 max-w-4xl mx-auto">
                                {scriptLines.map((line, idx) => {
                                    const isCurrent = currentLineIndex === idx;
                                    return (
                                        <div
                                            key={idx}
                                            id={`lyric-slide-${idx}`}
                                            onClick={() => jumpToLine(idx)}
                                            className={`p-3.5 rounded-xl cursor-pointer transition-all flex items-center gap-4 border ${
                                                isCurrent
                                                    ? isBlackoutActive
                                                        ? 'bg-amber-950/40 border-amber-500 text-amber-100 shadow-lg shadow-amber-950 scale-[1.01]'
                                                        : 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-950 scale-[1.01]'
                                                    : 'bg-[#12141c] border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-[#181a24]'
                                            }`}
                                        >
                                            <span className={`font-mono text-xs px-2.5 py-1 rounded font-bold shrink-0 ${
                                                isCurrent ? 'bg-black/30 text-white' : 'bg-[#1c1f2e] text-zinc-500'
                                            }`}>
                                                {idx + 1}
                                            </span>
                                            <span className="flex-1 font-bold text-sm sm:text-base leading-snug">
                                                {line}
                                            </span>
                                            {isCurrent && (
                                                <span className={`text-[10px] font-mono tracking-widest font-black uppercase px-2 py-0.5 rounded shrink-0 ${
                                                    isBlackoutActive ? 'bg-amber-500 text-black' : 'bg-white text-blue-900'
                                                }`}>
                                                    {isBlackoutActive ? 'CUED' : 'ON AIR'}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </main>

                {/* COLUMN 3: Dual Confidence Monitors (PVW / PGM) & Master Desk */}
                <aside className="w-80 sm:w-96 bg-[#0e1017] border-l border-zinc-800/80 flex flex-col shrink-0 overflow-y-auto">
                    {/* Monitors Section */}
                    <div className="p-4 border-b border-zinc-800/60 flex flex-col gap-4">
                        {/* PGM: Stage Output Monitor */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-xs font-mono">
                                <span className="font-bold uppercase flex items-center gap-1.5 text-zinc-300">
                                    <span className={`w-2 h-2 rounded-full ${isBlackoutActive ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                                    PGM · STAGE OUTPUT
                                </span>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                    isBlackoutActive ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                }`}>
                                    {isBlackoutActive ? 'BLACKOUT' : 'ON AIR'}
                                </span>
                            </div>

                            {/* 16:9 Aspect Ratio Display Bezel */}
                            <div className="w-full aspect-video bg-black rounded-xl border border-zinc-700/80 shadow-2xl relative overflow-hidden flex items-center justify-center p-4 select-none">
                                {isBlackoutActive ? (
                                    <div className="text-center font-mono">
                                        <div className="text-red-500 font-black text-sm tracking-widest mb-1">
                                            [ STAGE BLACKOUT ]
                                        </div>
                                        <div className="text-zinc-600 text-[10px]">OUTPUT IS 100% BLACK</div>
                                    </div>
                                ) : (
                                    <div className="text-center font-bold text-white text-sm sm:text-base leading-snug drop-shadow-md">
                                        {onAirText || <span className="opacity-30 font-mono text-xs">BLANK</span>}
                                    </div>
                                )}

                                {/* Bottom corner indicator */}
                                <div className="absolute bottom-2 right-2 text-[9px] font-mono text-zinc-600 bg-black/60 px-1.5 py-0.5 rounded">
                                    STAGE #{currentLineIndex + 1}
                                </div>
                            </div>
                        </div>

                        {/* PVW: Preview / Next Cue Monitor */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-xs font-mono">
                                <span className="font-bold uppercase flex items-center gap-1.5 text-zinc-300">
                                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                                    PVW · PREVIEW / CUE
                                </span>
                                <span className="text-[10px] font-black uppercase bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded">
                                    {isBlackoutActive ? 'READY FOR AIR' : 'NEXT SLIDE'}
                                </span>
                            </div>

                            {/* 16:9 Bezel */}
                            <div className="w-full aspect-video bg-[#151722] rounded-xl border border-dashed border-amber-700/60 shadow-lg relative overflow-hidden flex items-center justify-center p-4 select-none">
                                <div className="text-center font-bold text-amber-100 text-sm sm:text-base leading-snug">
                                    {isBlackoutActive ? onAirText : nextLineText}
                                </div>

                                <div className="absolute bottom-2 right-2 text-[9px] font-mono text-amber-500/80 bg-black/60 px-1.5 py-0.5 rounded">
                                    {isBlackoutActive ? `CUED #${currentLineIndex + 1}` : `NEXT #${currentLineIndex + 2}`}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Master Operations Deck */}
                    <div className="p-4 flex flex-col gap-4 flex-1">
                        {/* If Blackout is on, provide a massive TAKE TO AIR button */}
                        {isBlackoutActive && (
                            <button
                                onClick={toggleBlackout}
                                className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-black text-sm py-3.5 rounded-xl uppercase tracking-wider transition shadow-lg shadow-amber-950 flex items-center justify-center gap-2 font-mono"
                            >
                                <i className="fa-solid fa-play" />
                                <span>TAKE PREVIEW TO AIR (Enter)</span>
                            </button>
                        )}

                        {/* Mode Specific Controls */}
                        {state?.mode === 'lyric' && (
                            <div className="flex flex-col gap-2.5">
                                <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                                    Navigation Controls
                                </div>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <button
                                        onClick={prevLine}
                                        className="bg-[#1a1d27] hover:bg-zinc-800 active:bg-zinc-700 text-white font-black py-4 rounded-xl border border-zinc-700/80 transition flex flex-col items-center justify-center gap-1 shadow-md active:scale-95"
                                    >
                                        <i className="fa-solid fa-chevron-left text-lg" />
                                        <span className="text-[10px] font-mono text-zinc-400 tracking-wider">PREV (←)</span>
                                    </button>

                                    <button
                                        onClick={nextLine}
                                        className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black py-4 rounded-xl border border-blue-400 transition flex flex-col items-center justify-center gap-1 shadow-lg shadow-blue-950 active:scale-95"
                                    >
                                        <i className="fa-solid fa-chevron-right text-lg" />
                                        <span className="text-[10px] font-mono text-blue-200 tracking-wider">NEXT (→ / Space)</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {state?.mode === 'speech' && (
                            <div className="flex flex-col gap-3">
                                <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                                    Autoscroll Controls
                                </div>
                                <button
                                    onClick={togglePlay}
                                    className={`w-full font-black text-sm py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 font-mono ${
                                        state.is_playing
                                            ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-950'
                                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
                                    }`}
                                >
                                    <i className={`fa-solid ${state.is_playing ? 'fa-pause' : 'fa-play'}`} />
                                    <span>{state.is_playing ? 'PAUSE SCROLL' : 'START SCROLL'}</span>
                                </button>

                                <div className="bg-[#151821] p-3 rounded-xl border border-zinc-800 flex flex-col gap-2">
                                    <div className="flex justify-between items-center text-xs font-mono">
                                        <span className="text-zinc-400 font-bold">SCROLL SPEED</span>
                                        <span className="text-blue-400 font-bold">{((state.scroll_speed || 1.0)).toFixed(1)}x</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="5"
                                        step="0.1"
                                        value={state.scroll_speed || 1.0}
                                        onChange={e => changeSpeed(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                    <div className="flex justify-between gap-1 text-[10px] font-mono text-zinc-500">
                                        {[1.0, 1.5, 2.0, 3.0].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => changeSpeed(s)}
                                                className={`px-2 py-0.5 rounded border ${
                                                    Math.abs((state.scroll_speed || 1.0) - s) < 0.05
                                                        ? 'bg-blue-600 text-white border-blue-500'
                                                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                                                }`}
                                            >
                                                {s}x
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Theme & Stage Setting */}
                        <div className="bg-[#151821] p-3 rounded-xl border border-zinc-800 flex flex-col gap-2 mt-auto">
                            <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                                Stage Display Theme
                            </span>
                            <select
                                className="w-full bg-[#1b1f2b] text-white font-bold text-xs p-2.5 rounded-lg border border-zinc-700 outline-none cursor-pointer"
                                value={state?.theme || 'dark'}
                                onChange={e => changeTheme(e.target.value)}
                            >
                                <option value="dark">High Contrast Dark (Pure Black)</option>
                                <option value="zto">ZTO Royal Blue (Concert Stage)</option>
                                <option value="particles">Particles Stardust (Cinematic)</option>
                            </select>
                        </div>
                    </div>
                </aside>
            </div>

            {/* CREATE / EDIT SCRIPT MODAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#141620] border border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <i className="fa-solid fa-file-pen text-blue-500" />
                                {editingScriptId ? 'Edit Script' : 'Create New Script'}
                            </h2>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="text-zinc-500 hover:text-white transition p-1"
                            >
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>

                        <div>
                            <label className="text-xs font-mono font-bold text-zinc-400 uppercase mb-1 block">Title</label>
                            <input
                                className="w-full bg-[#1a1d28] border border-zinc-700 text-white p-2.5 rounded-lg text-sm outline-none focus:border-blue-500"
                                placeholder="e.g. 这是我们的敬拜 / Keynote Speech"
                                value={modalTitle}
                                onChange={e => setModalTitle(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-mono font-bold text-zinc-400 uppercase mb-1 block">Mode</label>
                            <select
                                className="w-full bg-[#1a1d28] border border-zinc-700 text-white p-2.5 rounded-lg text-sm outline-none focus:border-blue-500"
                                value={modalType}
                                onChange={e => setModalType(e.target.value)}
                            >
                                <option value="lyric">Lyric Mode (PPT Slide By Slide / 逐句翻页)</option>
                                <option value="speech">Speech Mode (Continuous Autoscroll / 平滑滚动)</option>
                            </select>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-mono font-bold text-zinc-400 uppercase">
                                    Script Content (One line per slide)
                                </label>
                                <span className="text-[11px] font-mono text-zinc-500">
                                    {modalContent.split('\n').filter(l => l.trim() !== '').length} lines
                                </span>
                            </div>
                            <textarea
                                className="w-full bg-[#1a1d28] border border-zinc-700 text-white p-3 rounded-lg text-xs font-mono h-48 outline-none focus:border-blue-500"
                                placeholder="Paste lyrics or teleprompter speech here...&#10;Each line will become a single slide."
                                value={modalContent}
                                onChange={e => setModalContent(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveModalScript}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition shadow-lg shadow-blue-900/40"
                            >
                                {editingScriptId ? 'Save Changes' : 'Save & Activate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
