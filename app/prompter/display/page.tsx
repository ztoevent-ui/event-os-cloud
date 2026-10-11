'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

export default function PrompterDisplay() {
    const [state, setState] = useState<any>(null);
    const [script, setScript] = useState<any>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number | null>(null);
    const scrollPosRef = useRef<number>(0);
    const scriptRef = useRef<any>(null);
    const stateRef = useRef<any>(null);

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
        setState((prev: any) => {
            const preservedBlackout = newState.is_blackout !== undefined ? newState.is_blackout : prev?.is_blackout;
            return {
                ...prev,
                ...newState,
                is_blackout: preservedBlackout,
            };
        });

        // If a script object was passed directly in the payload, use it immediately (0ms)
        if (incomingScript && incomingScript.id === newState.current_script_id) {
            setScript(incomingScript);
            return;
        }

        // If the script changed and is different from current, load it
        if (newState.current_script_id && (!scriptRef.current || scriptRef.current.id !== newState.current_script_id)) {
            const { data: sc } = await supabase
                .from('prompter_scripts')
                .select('*')
                .eq('id', newState.current_script_id)
                .single();
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
                    const { data: sc } = await supabase
                        .from('prompter_scripts')
                        .select('*')
                        .eq('id', st.current_script_id)
                        .single();
                    if (sc) setScript(sc);
                }
            }
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
            .subscribe();

        // Layer 4: Heartbeat polling fallback (every 2s) for complete disconnection recovery
        const poller = setInterval(async () => {
            const { data: st } = await supabase.from('prompter_state').select('*').eq('id', 1).single();
            if (st) {
                const curr = stateRef.current;
                if (
                    !curr ||
                    curr.current_index !== st.current_index ||
                    curr.current_script_id !== st.current_script_id ||
                    curr.is_playing !== st.is_playing ||
                    curr.mode !== st.mode ||
                    curr.theme !== st.theme
                ) {
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

    // Fullscreen toggle via 'F' shortcut or double-click (completely invisible)
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

    // Speech Mode Autoscroll via requestAnimationFrame
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

    // Speech Mode Line Jump
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

    // If Blackout is on, or no script, or waiting: 100% PURE VOID BLACK. Zero text, zero HUD, zero indicators.
    if (!state || !script || state.is_blackout) {
        return (
            <div 
                className="fixed inset-0 bg-black z-[9999] select-none cursor-none"
                style={{ cursor: 'none' }}
                onDoubleClick={toggleFullscreen}
            />
        );
    }

    // Theme Styles
    let bgStyle = "bg-black";
    if (state.theme === 'zto') bgStyle = "bg-gradient-to-br from-blue-950 via-black to-blue-900";
    if (state.theme === 'particles') bgStyle = "bg-black";

    return (
        <div 
            className={`fixed inset-0 ${bgStyle} text-white font-sans overflow-hidden select-none cursor-none z-[9999]`}
            style={{ cursor: 'none' }}
            onDoubleClick={toggleFullscreen}
        >
            {/* Particles Texture Overlay */}
            {state.theme === 'particles' && (
                <div 
                    className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" 
                    style={{ mixBlendMode: 'screen' }} 
                />
            )}

            {/* Mode: Lyric (Slide Mode) - PURE CENTRED TEXT ONLY */}
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

            {/* Mode: Speech (Autoscroll Mode) - PURE SCROLLING TEXT ONLY */}
            {state.mode === 'speech' && (
                <div className="absolute inset-0 flex justify-center select-none">
                    <div 
                        ref={containerRef}
                        className="w-full max-w-7xl h-full overflow-hidden relative pt-[50vh] pb-[50vh] px-12"
                        style={{ scrollBehavior: 'auto', scrollbarWidth: 'none' }}
                    >
                        <div className="flex flex-col gap-12">
                            {lines.map((line: string, i: number) => (
                                <div 
                                    key={i} 
                                    id={`display-line-${i}`}
                                    className="text-[4vw] md:text-[5vw] font-bold leading-normal text-center text-white/90 drop-shadow-lg transition-opacity duration-200"
                                    style={{ 
                                        fontFamily: "'Inter', 'Noto Sans SC', system-ui, sans-serif", 
                                        opacity: state.current_index === i ? 1 : 0.45 
                                    }}
                                >
                                    {line}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
