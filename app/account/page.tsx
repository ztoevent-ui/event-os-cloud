'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AccountPage() {
    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth');
            } else {
                setUser(user);
                setLoading(false);
            }
        };
        getUser();
    }, [router]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/auth');
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Account Management</h1>
                    <button
                        onClick={() => router.push('/')}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <i className="fa-solid fa-circle-info text-blue-400"></i>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-blue-700">
                                You are currently logged in as: <span className="font-bold">{user?.email}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-lg font-medium text-gray-900">Profile</h3>
                        <dl className="mt-2 text-sm text-gray-600">
                            <div className="flex justify-between py-2">
                                <dt>User ID</dt>
                                <dd className="font-mono text-xs">{user?.id}</dd>
                            </div>
                            <div className="flex justify-between py-2">
                                <dt>Last Sign In</dt>
                                <dd>{new Date(user?.last_sign_in_at).toLocaleString()}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                        <button
                            onClick={handleSignOut}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
