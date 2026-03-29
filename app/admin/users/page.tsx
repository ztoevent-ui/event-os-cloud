'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type Profile = {
    id: string;
    email: string;
    role: 'admin' | 'client' | 'staff';
    last_sign_in_at: string;
    created_at: string;
};

export default function AdminUsersPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [dbError, setDbError] = useState<string | null>(null);

    // Initial load check
    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth');
                return;
            }

            // Verify admin status against the public.profiles table securely
            const { data: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            // If they can't be fetched or aren't admin, kick them out
            if (!profileError || profileError.role !== 'admin') {
                if (profileError?.role === 'client') {
                    router.push('/apps/wedding-hub');
                } else {
                    router.push('/');
                }
                return;
            }
            
            setCurrentUser(user);
            fetchProfiles();
        };

        checkAdmin();
    }, [router]);

    const fetchProfiles = async () => {
        setLoading(true);
        setDbError(null);
        
        // Fetch all users from the public.profiles table
        // This relies on RLS allowing Admins to SELECT all profiles
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching profiles:", error);
            setDbError(`Database Error: ${error.message}. Please ensure you ran 'setup_user_profiles.sql' in Supabase.`);
        } else {
            setProfiles(data || []);
        }
        
        setLoading(false);
    };

    const handleRoleUpdate = async (userId: string, newRole: 'admin' | 'client') => {
        if (!confirm(`Are you sure you want to promote this user to ${newRole}?`)) return;

        // Optimistic UI Update base state
        const originalProfiles = [...profiles];
        setProfiles(profiles.map(p => p.id === userId ? { ...p, role: newRole } : p));

        // Call Supabase Database to update the profile
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) {
            alert(`Failed to update role: ${error.message}`);
            // Revert on failure
            setProfiles(originalProfiles);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="text-gray-500 font-bold uppercase tracking-widest text-sm">Authenticating Admin Node...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">User Management</h1>
                        <p className="text-gray-500 mt-1">Manage access and roles for Event OS users via synchronous DB.</p>
                    </div>
                    <button onClick={() => router.push('/')} className="px-6 py-2 bg-white shadow-sm border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all flex items-center gap-2">
                        <i className="fa-solid fa-house"></i> Exit Admin
                    </button>
                </div>

                {dbError && (
                    <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4">
                        <i className="fa-solid fa-triangle-exclamation text-2xl text-red-500 mt-1"></i>
                        <div>
                            <h3 className="font-black text-red-900 text-lg">System Initialization Required</h3>
                            <p className="text-red-700 mt-1">{dbError}</p>
                            <p className="text-sm text-red-600 font-bold mt-2">Action: Go to Supabase SQL Editor and run the provided `setup_user_profiles.sql` script to create the synchronization tables.</p>
                        </div>
                    </div>
                )}

                {!dbError && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">User Details</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">System Role</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Joined / Active</th>
                                <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-widest">Command</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {profiles.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-gray-400 font-bold italic tracking-wide">
                                        No profiles found. (If you just generated the table, run the backfill query).
                                    </td>
                                </tr>
                            )}
                            {profiles.map((profile) => (
                                <tr key={profile.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg">
                                                {profile.email ? profile.email[0].toUpperCase() : '?'}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-bold text-gray-900">{profile.email}</div>
                                                <div className="text-[10px] uppercase font-black tracking-widest text-gray-400 mt-0.5">ID: {profile.id.slice(0, 8)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        {profile.role === 'admin' ? (
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-black uppercase tracking-widest rounded-md bg-purple-100 text-purple-700 border border-purple-200">
                                                Admin
                                            </span>
                                        ) : profile.role === 'client' ? (
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-black uppercase tracking-widest rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                Client
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-black uppercase tracking-widest rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                                                {profile.role}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">
                                            Active: {profile.last_sign_in_at ? new Date(profile.last_sign_in_at).toLocaleDateString() : 'Never'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                        {profile.role !== 'admin' && (
                                            <div className="flex justify-end gap-3">
                                                {profile.role !== 'client' && (
                                                    <button
                                                        onClick={() => handleRoleUpdate(profile.id, 'client')}
                                                        className="text-emerald-600 hover:text-emerald-900 font-black uppercase tracking-widest text-[10px] px-3 py-1.5 rounded-md hover:bg-emerald-50 transition-colors"
                                                    >
                                                        Set Client
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleRoleUpdate(profile.id, 'admin')}
                                                    className="text-purple-600 hover:text-purple-900 font-black uppercase tracking-widest text-[10px] px-3 py-1.5 rounded-md hover:bg-purple-50 border border-transparent hover:border-purple-200 transition-colors"
                                                >
                                                    Promote to Admin
                                                </button>
                                            </div>
                                        )}
                                        {profile.role === 'admin' && profile.id !== currentUser?.id && (
                                            <div className="flex justify-end gap-3">
                                                 <span className="text-gray-400 italic font-bold text-xs flex items-center gap-2">
                                                     <i className="fa-solid fa-shield-halved"></i> Verified
                                                 </span>
                                                 <button
                                                    onClick={() => handleRoleUpdate(profile.id, 'client')}
                                                    className="text-red-500 hover:text-red-700 font-black uppercase tracking-widest text-[10px] px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors border border-transparent hover:border-red-200"
                                                >
                                                    Demote
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                )}
            </div>
        </div>
    );
}

