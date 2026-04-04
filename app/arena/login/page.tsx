'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

function RefereeLoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length < 6) return;
        
        setLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('referee_access_codes')
                .select('*')
                .eq('code', code.toUpperCase())
                .eq('is_active', true)
                .single();

            if (fetchError || !data) {
                setError('Invalid or expired code. Please check with the master console.');
            } else {
                // Successful verification
                // In a real app, we'd set a secure cookie or local storage token
                // For this V1, we'll redirect directly to the referee page
                router.push(`/arena/${data.event_id}/referee`);
            }
        } catch (err) {
            setError('System error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)] pointer-events-none"></div>
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-zinc-900/60 backdrop-blur-3xl border border-white/5 p-12 rounded-[3.5rem] shadow-[0_0_80px_rgba(0,0,0,0.5)] relative z-10"
            >
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-20 h-20 bg-blue-600/10 text-blue-500 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-[0_0_50px_rgba(37,99,235,0.2)]">
                        <i className="fa-solid fa-barcode"></i>
                    </div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-2">Referee Portal</h1>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Enter your quick access code</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="relative">
                        <input 
                            autoFocus
                            type="text" 
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            className={`w-full bg-black/80 border-2 rounded-3xl px-8 py-6 text-4xl font-black text-center tracking-[0.5em] transition-all focus:outline-none ${
                                error ? 'border-red-500 text-red-500' : 'border-white/10 focus:border-blue-500 text-white'
                            }`}
                            placeholder="000000"
                        />
                        <AnimatePresence>
                            {error && (
                                <motion.p 
                                    initial={{ opacity: 0, y: -10 }} 
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute -bottom-10 left-0 right-0 text-center text-red-500 text-[10px] font-black uppercase tracking-widest"
                                >
                                    {error}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="pt-6">
                        <button 
                            type="submit"
                            disabled={code.length < 6 || loading}
                            className="w-full py-6 bg-blue-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black rounded-3xl text-xs uppercase tracking-[0.3em] transition-all transform hover:scale-[1.02] shadow-2xl shadow-blue-600/20"
                        >
                            {loading ? 'Verifying Signal...' : 'Establish Link'}
                        </button>
                    </div>
                </form>

                <div className="mt-12 pt-8 border-t border-white/5 text-center">
                    <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest">
                        ZTO Event OS &bull; Tournament Layer V2.1
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

export default function RefereeLoginPage() {
    return (
        <Suspense fallback={<div className="bg-black min-h-screen"></div>}>
            <RefereeLoginContent />
        </Suspense>
    );
}
