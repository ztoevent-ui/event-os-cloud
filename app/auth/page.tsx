'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

function AuthContent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [isResetPassword, setIsResetPassword] = useState(false);
    const [message, setMessage] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnTo = searchParams.get('returnTo') || null;

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            if (isResetPassword) {
                const origin = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : 'https://www.ztoevent.com';
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${origin}/auth/update-password`,
                });
                if (error) throw error;
                setMessage('Check your email for the password reset link!');
            } else if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setMessage('Check your email for the confirmation link!');
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;

                // ── Temporary user validity check ──────────────────────────
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role, user_type, active_from, active_until, display_name')
                    .eq('id', data.user.id)
                    .maybeSingle();

                if (profile?.user_type === 'temporary') {
                    const now = new Date();
                    const from = profile.active_from ? new Date(profile.active_from) : null;
                    const until = profile.active_until ? new Date(profile.active_until) : null;

                    if (from && now < from) {
                        await supabase.auth.signOut();
                        const openDate = from.toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' });
                        setMessage(`Access not yet available. Your account opens on ${openDate}.`);
                        setLoading(false);
                        return;
                    }

                    if (until && now > until) {
                        await supabase.auth.signOut();
                        const closeDate = until.toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' });
                        setMessage(`Your access expired on ${closeDate}. The event has ended.`);
                        setLoading(false);
                        return;
                    }
                }
                // ──────────────────────────────────────────────────────────

                // If redirected here from a protected page, go back there
                if (returnTo) {
                    window.location.replace(returnTo);
                    return;
                }

                // Role-based default destination
                const role = profile?.role ?? data.user?.user_metadata?.role ?? '';
                if (role === 'client') {
                    window.location.replace('/apps/wedding-hub');
                } else {
                    // admin + all others go to home (Arena Hub visible from there)
                    window.location.replace('/');
                }
                // Do NOT set loading = false — keep spinner until page unloads
                return;
            }
        } catch (error: Error | any) {
            console.error(error);
            setMessage(error.message || 'An error occurred');
            setLoading(false);
        }
    };

    const isError = message && !message.includes('Check');

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Logo */}
                <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <img
                            src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
                            alt="ZTO Logo"
                            className="w-12 h-12 object-contain rounded-xl"
                        />
                        <div className="text-left">
                            <div className="text-white font-black text-xl tracking-wider">ZTO Event</div>
                            <div className="text-white/30 text-xs font-bold uppercase tracking-widest">Operating System</div>
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">
                        {isResetPassword ? 'Reset Password' : (isSignUp ? 'Create Account' : 'Sign In')}
                    </h2>
                    <p className="text-white/30 text-sm mt-1">
                        {isResetPassword ? 'Enter your email to receive a reset link' : (isSignUp ? 'Get started with ZTO Event OS' : 'Access your event dashboard')}
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                    <form className="space-y-5" onSubmit={handleAuth}>
                        <div>
                            <label className="block text-[10px] font-black tracking-widest uppercase text-white/40 mb-2">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-amber-500/60 focus:bg-white/8 transition-all text-sm"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {!isResetPassword && (
                            <div>
                                <label className="block text-[10px] font-black tracking-widest uppercase text-white/40 mb-2">Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-amber-500/60 transition-all text-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        )}

                        {message && (
                            <div className={`text-sm text-center rounded-xl px-4 py-3 font-medium ${isError ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                <i className={`fa-solid ${isError ? 'fa-triangle-exclamation' : 'fa-circle-check'} mr-2`} />
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-black font-black text-sm uppercase tracking-widest rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 shadow-lg shadow-amber-500/20"
                        >
                            {loading
                                ? <><i className="fa-solid fa-circle-notch animate-spin mr-2" />Processing...</>
                                : isResetPassword ? 'Send Reset Link'
                                : isSignUp ? 'Create Account'
                                : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 space-y-3 text-center">
                        {!isResetPassword && (
                            <button
                                onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
                                className="text-sm text-white/40 hover:text-white/70 transition-colors"
                            >
                                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                            </button>
                        )}
                        {!isSignUp && !isResetPassword && (
                            <button
                                onClick={() => { setIsResetPassword(true); setMessage(''); }}
                                className="block w-full text-sm text-white/30 hover:text-white/50 transition-colors"
                            >
                                Forgot your password?
                            </button>
                        )}
                        {isResetPassword && (
                            <button
                                onClick={() => { setIsResetPassword(false); setMessage(''); }}
                                className="block w-full text-sm text-white/30 hover:text-white/50 transition-colors"
                            >
                                Back to Sign In
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
            <AuthContent />
        </Suspense>
    );
}
