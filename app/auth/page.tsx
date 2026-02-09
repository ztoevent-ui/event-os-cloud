'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [isResetPassword, setIsResetPassword] = useState(false);
    const [message, setMessage] = useState('');
    const router = useRouter();

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
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        // Optional: We can calculate default role here or let admin assign it later.
                        // For now, new signups have NO role until approved.
                    }
                });
                if (error) throw error;
                setMessage('Check your email for the confirmation link!');
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;

                // Role Based Redirection
                const role = data.user?.user_metadata?.role;
                if (role === 'admin') {
                    router.push('/admin/users');
                } else if (role === 'client') {
                    router.push('/apps/wedding-hub');
                } else {
                    // Default fallback or pending state
                    router.push('/');
                }
            }
        } catch (error: Error | any) {
            console.error(error);
            setMessage(error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-black text-gray-900">Event<span className="text-blue-600">OS</span></h1>
                    <h2 className="mt-6 text-2xl font-bold text-gray-900">
                        {isResetPassword ? 'Reset Password' : (isSignUp ? 'Create your account' : 'Sign in to your account')}
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleAuth}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                type="email"
                                required
                                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${isResetPassword ? 'rounded-md' : 'rounded-t-md'} focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        {!isResetPassword && (
                            <div>
                                <input
                                    type="password"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    {message && (
                        <div className={`text-sm text-center ${message.includes('Check') ? 'text-green-600' : 'text-red-500'}`}>
                            {message}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70"
                        >
                            {loading ? 'Processing...' : (isResetPassword ? 'Send Reset Link' : (isSignUp ? 'Sign Up' : 'Sign In'))}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-4">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-sm text-blue-600 hover:text-blue-500"
                    >
                        {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                    </button>
                    {!isSignUp && !isResetPassword && (
                        <button
                            onClick={() => { setIsResetPassword(true); setMessage(''); }}
                            className="block w-full text-sm text-gray-500 hover:text-gray-700 mt-2"
                        >
                            Forgot your password?
                        </button>
                    )}
                    {isResetPassword && (
                        <button
                            onClick={() => { setIsResetPassword(false); setMessage(''); }}
                            className="block w-full text-sm text-gray-500 hover:text-gray-700 mt-2"
                        >
                            Back to Sign In
                        </button>
                    )}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <a
                            href="https://www.ztoevent.com/"
                            className="text-xs text-gray-400 hover:text-gray-600 block w-full"
                        >
                            <i className="fa-solid fa-globe mr-1"></i> Visit ZTO Event
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
