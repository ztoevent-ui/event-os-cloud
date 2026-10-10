'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

export default function PrompterDisplay() {
    const [state, setState] = useState<any>(null);
    const [script, setScript] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const containerRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number>(null);
    const scrollPosRef = useRef<number>(0);

    // Fetch initial data
    useEffect(() => {
        const init = async () => {
            const { data: st } = await supabase.from('prompter_state').select('*').eq('id', 1).single();
            setState(st);
            if (st?.current_script_id) {
                const { data: sc } = await supabase.from('prompter_scripts').select('*').eq('id', st.current_script_id).single();
                setScript(sc);
            }
            setLoading(false);
        };
        init();
    }, []);

    // Listen for realtime state changes
    useEffect(() => {
        const sub = supabase.channel('prompter_state_display')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'prompter_state' }, async (payload) => {
                if (payload.new.id === 1) {
                    const newState = payload.new;
                    setState(newState);
                    // Fetch script if it changed
                    if (newState.current_script_id && (!script || script.id !== newState.current_script_id)) {
                        const { data: sc } = await supabase.from('prompter_scripts').select('*').eq('id', newState.current_script_id).single();
                        setScript(sc);
                        scrollPosRef.current = 0; // Reset scroll on new script
                    }
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(sub); };
    }, [script]);

    // Handle Speech Mode Scrolling via requestAnimationFrame for absolute smoothness
    useEffect(() => {
        if (state?.mode === 'speech' && state.is_playing) {
            let lastTime = performance.now();
            const animateScroll = (time: number) => {
                const delta = time - lastTime;
                lastTime = time;
                // Speed calculation: state.scroll_speed (0.5 to 5). 1x = 60 pixels per second.
                const speedPerMs = (state.scroll_speed * 60) / 1000;
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

    // Reset scroll position when switching to speech mode or script changes
    useEffect(() => {
        if (state?.mode === 'speech' && containerRef.current && scrollPosRef.current === 0) {
            containerRef.current.scrollTop = 0;
        }
    }, [state?.mode, script]);


    if (loading) return <div className="min-h-screen bg-black" />;
    if (!state || !script) return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white text-4xl font-black opacity-30 tracking-widest">
            WAITING FOR SCRIPT...
        </div>
    );

    // Theme Styles
    let bgStyle = "bg-black";
    if (state.theme === 'zto') bgStyle = "bg-gradient-to-br from-blue-950 via-black to-blue-900";
    if (state.theme === 'particles') bgStyle = "bg-black"; // Would typically overlay a canvas or CSS particle effect here

    return (
        <div className={`min-h-screen ${bgStyle} text-white font-sans overflow-hidden relative selection:bg-transparent cursor-none`}>
            
            {/* Particles placeholder if active */}
            {state.theme === 'particles' && (
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" style={{ mixBlendMode: 'screen' }} />
            )}

            {/* Mode: Lyric (PPT style) */}
            {state.mode === 'lyric' && (
                <div className="absolute inset-0 flex items-center justify-center p-12 md:p-24">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={state.current_index}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="text-[6vw] md:text-[8vw] font-black leading-tight text-center tracking-tight text-white drop-shadow-2xl"
                            style={{ fontFamily: "'Inter', 'Noto Sans', sans-serif" }}
                        >
                            {script.content[state.current_index] || ''}
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}

            {/* Mode: Speech (Continuous Scroll) */}
            {state.mode === 'speech' && (
                <div className="absolute inset-0 flex justify-center">
                    {/* Fixed focus box in center */}
                    <div className="absolute top-1/2 left-0 w-full h-[30vh] -translate-y-1/2 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent pointer-events-none border-y border-blue-500/20 z-10" />

                    <div 
                        ref={containerRef}
                        className="w-full max-w-7xl h-full overflow-hidden relative pt-[50vh] pb-[50vh] px-12"
                        style={{ scrollBehavior: 'auto' }}
                    >
                        <div className="flex flex-col gap-12">
                            {script.content.map((line: string, i: number) => {
                                // Simplified approach: rely on CSS for blur based on position would be ideal, 
                                // but for raw performance we just render the text. 
                                // To do intersection observer for blur is heavy, so we keep it simple & fast.
                                return (
                                    <div 
                                        key={i} 
                                        className="text-[4vw] md:text-[5vw] font-bold leading-normal text-center text-white/90 drop-shadow-lg"
                                        style={{ fontFamily: "'Inter', 'Noto Sans', sans-serif" }}
                                    >
                                        {line}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Status Indicator (Subtle) */}
            <div className="absolute top-6 right-8 flex items-center gap-3 opacity-20">
                <div className={`w-3 h-3 rounded-full ${state.is_playing ? 'bg-red-500 animate-pulse' : 'bg-zinc-500'}`} />
                <span className="text-sm font-bold uppercase tracking-widest">{state.mode}</span>
            </div>
        </div>
    );
}
