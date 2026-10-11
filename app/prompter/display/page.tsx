'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

export default function PrompterDisplay() {
    const [state, setState] = useState<any>(null);
    const [script, setScript] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showHud, setShowHud] = useState(false);
    const [syncBadge, setSyncBadge] = useState<'live' | 'syncing'>('live');

    const containerRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number | null>(null);
    const scrollPosRef = useRef<number>(0);
    const scriptRef = useRef<any>(null);
    const stateRef = useRef<any>(null);
    const hudTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Keep stateRef and scriptRef synced for callbacks
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    useEffect(() => {
        scriptRef.current = script;
    }, [script]);

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

    // Unified state applicator: handles state from any sync channel
    const applyIncomingState = useCallback(async (newState: any, incomingScript?: any) => {
        if (!newState) return;
        setSyncBadge('syncing');
        setState((prev: any) => ({ ...prev, ...newState }));
        setTimeout(() => setSyncBadge('live'), 200);

        // If a script object was passed directly in the payload, use it immediately (0ms)
        if (incomingScript && incomingScript.id === newState.current_script_id) {
            setScript(incomingScript);
            return;
        }

        // If the script changed and is different from current, load it
        if (newState.current_script_id && (!scriptRef.current || scriptRef.current.id !== newState.current_script_id)) {
            const { data: sc } = await supabase.from('prompter_scripts').select('*').eq('id', newState.current_script_id).single();
            if (sc) {
                setScript(sc);
                scrollPosRef.current = 0;
            }
        }
    }, []);

    // Initial load
    useEffect(() => {
        const init = async () => {
            // First check localStorage for instant cached state
            try {
                const cached = localStorage.getItem('zto_prompter_sync_state');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (parsed?.state) {
                        setState(parsed.state);
                        if (parsed.script) setScript(parsed.script);
                    }
                }
            } catch {}

            // Then fetch from database
            const { data: st } = await supabase.from('prompter_state').select('*').eq('id', 1).single();
            if (st) {
                setState(st);
                if (st.current_script_id) {
                    const { data: sc } = await supabase.from('prompter_scripts').select('*').eq('id', st.current_script_id).single();
                    if (sc) setScript(sc);
                }
            }
            setLoading(false);
        };
        init();
    }, []);

    // Quad-Layer Resilient Synchronization
    useEffect(() => {
        // Layer 1: HTML5 BroadcastChannel for 0ms same-machine sync (Operator + Display)
        let bc: BroadcastChannel | null = null;
        try {
            if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
                bc = new BroadcastChannel('zto_prompter_sync');
                bc.onmessage = (e) => {
                    if (e.data?.type === 'SYNC_STATE' && e.data?.state) {
                        applyIncomingState(e.data.state, e.data.script);
                    }
                };
            }
        } catch (err) {
            console.warn('BroadcastChannel error:', err);
        }

        // Layer 2: LocalStorage storage event (Cross-window 0ms fallback)
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'zto_prompter_sync_state' && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    if (parsed?.state) {
                        applyIncomingState(parsed.state, parsed.script);
                    }
                } catch {}
            }
        };
        window.addEventListener('storage', handleStorage);

        // Layer 3: Supabase Unified Realtime Channel (Broadcast + Postgres Changes)
        const channel = supabase.channel('zto_prompter_live')
            .on('broadcast', { event: 'SYNC_STATE' }, (payload) => {
                if (payload?.payload?.state) {
                    applyIncomingState(payload.payload.state, payload.payload.script);
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'prompter_state' }, (payload) => {
                const newRow = payload.new as any;
                if (Number(newRow?.id) === 1) {
                    applyIncomingState(newRow);
                }
            })
            .subscribe((status) => {
                console.log('[Prompter Display] Realtime Status:', status);
            });

        // Layer 4: Heartbeat polling fallback (every 2s) for complete disconnection recovery
        const poller = setInterval(async () => {
            const { data: st } = await supabase.from('prompter_state').select('*').eq('id', 1).single();
            if (st) {
                // If index or script or playing changed, apply
                const curr = stateRef.current;
                if (!curr || curr.current_index !== st.current_index || curr.current_script_id !== st.current_script_id || curr.is_playing !== st.is_playing || curr.mode !== st.mode || curr.theme !== st.theme) {
                    applyIncomingState(st);
                }
            }
        }, 2000);

        return () => {
            if (bc) bc.close();
            window.removeEventListener('storage', handleStorage);
            supabase.removeChannel(channel);
            clearInterval(poller);
        };
    }, [applyIncomingState]);

    // Handle mouse movement for subtle HUD fade-in
    const handleMouseMove = () => {
        setShowHud(true);
        if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
        hudTimeoutRef.current = setTimeout(() => setShowHud(false), 3000);
    };

    // Toggle fullscreen on double click or shortcut
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'f' || e.key === 'F') {
                toggleFullscreen();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Handle Speech Mode Scrolling via requestAnimationFrame
    useEffect(() => {
        if (state?.mode === 'speech' && state.is_playing) {
            let lastTime = performance.now();
            const animateScroll = (time: number) => {
                const delta = time - lastTime;
                lastTime = time;
                const speed = state.scroll_speed || 1.0;
                const speedPerMs = (speed * 60) / 1000;
                scrollPosRef.current += delta * speedPerMs;

                if (containerRef.current) {
                    containerRef.current.scrollTop = scrollPosRef.current;
                }

                requestRef.current = requestAnimationFrame(animateScroll);
            };
            requestRef.current = requestAnimationFrame(animateScroll);
        }

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [state?.mode, state?.is_playing, state?.scroll_speed]);

    // Handle Jumps in Speech Mode
    useEffect(() => {
        if (state?.mode === 'speech' && containerRef.current) {
            if (state.current_index === 0 && scrollPosRef.current === 0) {
                containerRef.current.scrollTop = 0;
            } else if (state.current_index >= 0) {
                const targetLine = document.getElementById(`display-line-${state.current_index}`);
                if (targetLine) {
                    const containerHalfHeight = containerRef.current.clientHeight / 2;
                    const lineTop = targetLine.offsetTop;
                    const lineHeight = targetLine.clientHeight;
                    const targetScroll = lineTop - containerHalfHeight + (lineHeight / 2);
                    scrollPosRef.current = Math.max(0, targetScroll);
                    containerRef.current.scrollTop = scrollPosRef.current;
                }
            }
        }
    }, [state?.mode, state?.current_index]);

    const lines = getScriptLines(script);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-zinc-600 font-mono text-xl">
                CONNECTING ENGINE...
            </div>
        );
    }

    if (!state || !script) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-8 cursor-default">
                <div className="text-4xl md:text-5xl font-black text-zinc-600 tracking-widest uppercase mb-4">
                    WAITING FOR SCRIPT
                </div>
                <div className="text-zinc-500 text-sm font-mono tracking-wider">
                    Please select or activate a script in the Operator Console
                </div>
            </div>
        );
    }

    // Safety Blackout Check
    if (state.is_blackout) {
        return (
            <div className="min-h-screen bg-black select-none cursor-none" onMouseMove={handleMouseMove} onDoubleClick={toggleFullscreen}>
                {showHud && (
                    <div className="absolute top-6 right-6 flex items-center gap-2 bg-red-950/80 border border-red-800 text-red-300 px-4 py-2 rounded-full font-mono text-xs backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        STAGE BLACKOUT ACTIVE
                    </div>
                )}
            </div>
        );
    }

    // Theme Styles
    let bgStyle = "bg-black";
    if (state.theme === 'zto') bgStyle = "bg-gradient-to-br from-blue-950 via-black to-blue-900";
    if (state.theme === 'particles') bgStyle = "bg-black";

    return (
        <div 
            className={`min-h-screen ${bgStyle} text-white font-sans overflow-hidden relative selection:bg-transparent cursor-none`}
            onMouseMove={handleMouseMove}
            onDoubleClick={toggleFullscreen}
        >
            {/* Particles Texture Overlay */}
            {state.theme === 'particles' && (
                <div 
                    className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" 
                    style={{ mixBlendMode: 'screen' }} 
                />
            )}

            {/* Mode: Lyric (PPT style) with ultra-responsive 0.15s crossfade */}
            {state.mode === 'lyric' && (
                <div className="absolute inset-0 flex items-center justify-center p-8 md:p-20 select-none">
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            key={state.current_index}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="text-[6.5vw] md:text-[8vw] font-black leading-tight text-center tracking-tight text-white drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] max-w-7xl px-8"
                            style={{ fontFamily: "'Inter', 'Noto Sans SC', system-ui, sans-serif" }}
                        >
                            {lines[state.current_index] || ''}
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}

            {/* Mode: Speech (Continuous Scroll) */}
            {state.mode === 'speech' && (
                <div className="absolute inset-0 flex justify-center select-none">
                    {/* Fixed focus box in center */}
                    <div className="absolute top-1/2 left-0 w-full h-[32vh] -translate-y-1/2 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent pointer-events-none border-y border-blue-500/20 z-10" />

                    <div 
                        ref={containerRef}
                        className="w-full max-w-7xl h-full overflow-hidden relative pt-[50vh] pb-[50vh] px-12"
                        style={{ scrollBehavior: 'auto' }}
                    >
                        <div className="flex flex-col gap-12">
                            {lines.map((line: string, i: number) => (
                                <div 
                                    key={i} 
                                    id={`display-line-${i}`}
                                    className="text-[4vw] md:text-[5vw] font-bold leading-normal text-center text-white/90 drop-shadow-lg transition-opacity duration-200"
                                    style={{ 
                                        fontFamily: "'Inter', 'Noto Sans SC', system-ui, sans-serif", 
                                        opacity: state.current_index === i ? 1 : 0.5 
                                    }}
                                >
                                    {line}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Subtle HUD for Stage Techs (Visible on mouse move) */}
            <div 
                className={`fixed top-6 right-6 flex items-center gap-3 transition-opacity duration-500 z-50 ${showHud ? 'opacity-90' : 'opacity-0 pointer-events-none'}`}
            >
                <div className="bg-zinc-950/80 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-full font-mono text-xs flex items-center gap-2 backdrop-blur-md shadow-2xl">
                    <span className={`w-2 h-2 rounded-full ${syncBadge === 'live' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    <span>0ms SYNC</span>
                    <span className="text-zinc-600">|</span>
                    <span className="text-zinc-400 uppercase">{state.mode}</span>
                    <span className="text-zinc-600">|</span>
                    <span className="text-blue-400 font-bold">{state.current_index + 1} / {lines.length}</span>
                </div>

                <button 
                    onClick={toggleFullscreen}
                    title="Toggle Fullscreen (F)"
                    className="bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 text-white p-2.5 rounded-full transition backdrop-blur-md"
                >
                    <i className="fa-solid fa-expand text-xs" />
                </button>
            </div>
        </div>
    );
}
