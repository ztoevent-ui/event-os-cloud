'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type User = {
    id: string;
    email: string;
    last_sign_in_at: string;
    raw_user_meta_data: {
        role?: 'admin' | 'client';
    };
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<'admin' | 'client'>('client');
    const [isCreating, setIsCreating] = useState(false);

    // Initial load check
    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth');
                return;
            }

            // Since we can't easily check 'admin' role on client without custom claims or separate table query safely immediately,
            // we will rely on middleware security, but here is a client-side check for UX.
            if (user.user_metadata?.role !== 'admin') {
                // Determine where to send non-admins
                if (user.user_metadata?.role === 'client') {
                    router.push('/apps/wedding-hub');
                } else {
                    router.push('/');
                }
                return;
            }
            setCurrentUser(user);
            fetchUsers();
        };

        checkAdmin();
    }, [router]);

    const fetchUsers = async () => {
        setLoading(true);
        // NOTE: In a real production app, Supabase Admin API should be called via a Server Action or API Route
        // because service_role key is needed to list *all* users.
        // HOWEVER, for this "demo" / "prototype" phase, if RLS is not strict on a custom 'profiles' table, we could fetch.
        // BUT Supabase Auth Listing is strictly Admin-only.

        // WORKAROUND: For this specific task without a backend API route setup yet, 
        // we will Mock this data or use a public 'profiles' table strategy if available.
        // Since we don't have a 'profiles' table yet, we can't list users client-side securely.

        // RECOMMENDATION: We need to creating a mock list for UI Development 
        // OR quick setup of a public profiles table trigger.

        // Let's Simulate for now to show the UI structure, assuming integration later.

        // Mock Data simulation
        setUsers([
            { id: '1', email: 'admin@eventos.com', last_sign_in_at: new Date().toISOString(), raw_user_meta_data: { role: 'admin' } },
            { id: '2', email: 'client@wedding.com', last_sign_in_at: new Date().toISOString(), raw_user_meta_data: { role: 'client' } },
            { id: '3', email: 'newuser@gmail.com', last_sign_in_at: new Date().toISOString(), raw_user_meta_data: {} },
        ]);
        setLoading(false);
    };

    const handleRoleUpdate = async (userId: string, newRole: 'admin' | 'client') => {
        if (!confirm(`Are you sure you want to promote this user to ${newRole}?`)) return;

        // Would normally call API endpoint here:
        // await fetch('/api/admin/set-role', { method: 'POST', body: JSON.stringify({ userId, role: newRole }) });

        // Optimistic UI Update
        setUsers(users.map(u => u.id === userId ? { ...u, raw_user_meta_data: { ...u.raw_user_meta_data, role: newRole } } : u));
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserEmail || !newUserPassword) return;

        setIsCreating(true);
        try {
            // Using standard signUp. Note: On browser client, standard signUp will log the current user out.
            // Ideally, you would create an API route using SUPABASE_SERVICE_ROLE_KEY to use supabase.auth.admin.createUser
            const { data, error } = await supabase.auth.signUp({
                email: newUserEmail,
                password: newUserPassword,
                options: {
                    data: {
                        role: newUserRole
                    }
                }
            });

            if (error) throw error;
            
            alert('User created successfully. They will need to verify their email.');
            
            // Add optimistic mockup to list
            if (data.user) {
                setUsers([...users, {
                    id: data.user.id,
                    email: data.user.email!,
                    last_sign_in_at: new Date().toISOString(),
                    raw_user_meta_data: { role: newUserRole }
                }]);
            }
            
            setShowAddModal(false);
            setNewUserEmail('');
            setNewUserPassword('');
        } catch (err: any) {
            alert('Error creating user: ' + err.message);
        } finally {
            setIsCreating(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Admin Panel...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">User Management</h1>
                        <p className="text-gray-500">Manage access and roles for Event OS users.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition"
                        >
                            + Add User
                        </button>
                        <button onClick={() => router.push('/')} className="text-sm font-bold text-gray-500 hover:text-gray-700">
                            Exit Admin
                        </button>
                    </div>
                </div>

                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                            <h2 className="text-xl font-bold mb-4">Add New User</h2>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input 
                                        type="email" 
                                        required
                                        value={newUserEmail}
                                        onChange={(e) => setNewUserEmail(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="user@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input 
                                        type="password" 
                                        required
                                        value={newUserPassword}
                                        onChange={(e) => setNewUserPassword(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="••••••••"
                                        minLength={6}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select 
                                        value={newUserRole}
                                        onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'client')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    >
                                        <option value="client">Client</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowAddModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                        disabled={isCreating}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg disabled:opacity-50"
                                        disabled={isCreating}
                                    >
                                        {isCreating ? 'Creating...' : 'Create User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Last Active</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                                {user.email[0].toUpperCase()}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{user.email}</div>
                                                <div className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.raw_user_meta_data.role === 'admin' ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                Admin
                                            </span>
                                        ) : user.raw_user_meta_data.role === 'client' ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-pink-100 text-pink-800">
                                                Client
                                            </span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(user.last_sign_in_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {user.raw_user_meta_data.role !== 'admin' && (
                                            <div className="flex justify-end gap-2">
                                                {user.raw_user_meta_data.role !== 'client' && (
                                                    <button
                                                        onClick={() => handleRoleUpdate(user.id, 'client')}
                                                        className="text-pink-600 hover:text-pink-900 font-bold hover:underline"
                                                    >
                                                        Set as Client
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleRoleUpdate(user.id, 'admin')}
                                                    className="text-purple-600 hover:text-purple-900 font-bold hover:underline"
                                                >
                                                    Make Admin
                                                </button>
                                            </div>
                                        )}
                                        {user.raw_user_meta_data.role === 'admin' && user.id !== currentUser?.id && (
                                            <span className="text-gray-400 italic">Protected</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
