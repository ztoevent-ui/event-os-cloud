'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { ImageUploadField } from '@/app/components/ImageUploadField';

type Profile = {
    id: string;
    email?: string;
    full_name?: string;
    display_name?: string;
    avatar_url?: string;
    role: string;
    user_type: 'permanent' | 'temporary';
    active_from: string | null;
    active_until: string | null;
    last_sign_in_at?: string;
    created_at: string;
};

function getAccessStatus(p: Profile): 'permanent' | 'active' | 'pending' | 'expired' {
    if (p.user_type !== 'temporary') return 'permanent';
    const now = new Date();
    if (p.active_from && now < new Date(p.active_from)) return 'pending';
    if (p.active_until && now > new Date(p.active_until)) return 'expired';
    return 'active';
}

const STATUS_STYLES = {
    permanent: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    active:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    pending:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
    expired:   'bg-red-500/10 text-red-400 border-red-500/20',
};

const STATUS_ICONS = {
    permanent: 'fa-shield-halved',
    active:    'fa-circle-check',
    pending:   'fa-clock',
    expired:   'fa-lock',
};

export default function AdminUsersPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [dbError, setDbError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState<Profile | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const router = useRouter();

    // Form state for add/edit modal
    const [form, setForm] = useState({
        display_name: '',
        full_name: '',
        email: '',
        password: '',
        role: 'REFEREE',
        user_type: 'permanent' as 'permanent' | 'temporary',
        active_from: '',
        active_until: '',
        avatar_url: '',
    });

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/auth?returnTo=/admin/users'); return; }

            const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
            if (!prof || prof.role !== 'admin') {
                router.push(prof?.role === 'client' ? '/apps/wedding-hub' : '/');
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
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            setDbError(`Database Error: ${error.message}`);
        } else {
            setProfiles(data || []);
        }
        setLoading(false);
    };

    const openAddModal = () => {
        setEditTarget(null);
        setForm({ display_name: '', full_name: '', email: '', password: '', role: 'REFEREE', user_type: 'permanent', active_from: '', active_until: '', avatar_url: '' });
        setShowModal(true);
    };

    const openEditModal = (p: Profile) => {
        setEditTarget(p);
        setForm({
            display_name: p.display_name || '',
            full_name: p.full_name || '',
            email: p.email || '',
            password: '',
            role: p.role,
            user_type: p.user_type || 'permanent',
            active_from: p.active_from ? p.active_from.split('T')[0] : '',
            active_until: p.active_until ? p.active_until.split('T')[0] : '',
            avatar_url: p.avatar_url || '',
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!editTarget && (!form.email || !form.password)) {
            Swal.fire('Missing Fields', 'Email and password are required for new users.', 'warning');
            return;
        }

        Swal.fire({ title: 'Saving...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        try {
            if (editTarget) {
                // Edit existing profile
                const { error } = await supabase.from('profiles').update({
                    display_name: form.display_name || null,
                    full_name: form.full_name || null,
                    role: form.role,
                    user_type: form.user_type,
                    active_from: form.user_type === 'temporary' && form.active_from ? form.active_from : null,
                    active_until: form.user_type === 'temporary' && form.active_until ? form.active_until : null,
                    avatar_url: form.avatar_url || null,
                    updated_at: new Date().toISOString(),
                }).eq('id', editTarget.id);

                if (error) throw error;
                Swal.fire({ title: 'Updated!', icon: 'success', timer: 1500, showConfirmButton: false, background: '#18181b', color: '#fff' });
            } else {
                // Create new user via admin API (server action pattern using supabase admin)
                // For now, use standard signup + profile update
                const { data: newUser, error: signupError } = await supabase.auth.signUp({
                    email: form.email,
                    password: form.password,
                    options: {
                        data: { full_name: form.display_name || form.full_name, avatar_url: form.avatar_url || null }
                    }
                });

                if (signupError) throw signupError;
                if (!newUser.user) throw new Error('User creation failed');

                // Update profile with role & temp user settings
                await supabase.from('profiles').upsert({
                    id: newUser.user.id,
                    display_name: form.display_name || null,
                    full_name: form.full_name || null,
                    role: form.role,
                    user_type: form.user_type,
                    active_from: form.user_type === 'temporary' && form.active_from ? form.active_from : null,
                    active_until: form.user_type === 'temporary' && form.active_until ? form.active_until : null,
                    avatar_url: form.avatar_url || null,
                }, { onConflict: 'id' });

                Swal.fire({ title: 'User Created!', text: 'A confirmation email has been sent.', icon: 'success', background: '#18181b', color: '#fff', confirmButtonColor: '#f59e0b' });
            }

            setShowModal(false);
            fetchProfiles();
        } catch (err: any) {
            Swal.fire('Error', err.message, 'error');
        }
    };

    const handleRoleUpdate = async (userId: string, newRole: 'admin' | 'client' | 'REFEREE') => {
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
        if (error) {
            Swal.fire('Error', error.message, 'error');
        } else {
            setProfiles(p => p.map(x => x.id === userId ? { ...x, role: newRole } : x));
        }
    };

    const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] flex-col gap-4">
            <div className="w-10 h-10 border-2 border-white/10 border-t-amber-500 rounded-full animate-spin" />
            <div className="text-white/30 font-black uppercase tracking-widest text-xs">Loading Users...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans p-6 md:p-10">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex items-start justify-between mb-10">
                    <div>
                        <div className="text-amber-500 text-xs font-black tracking-[0.2em] uppercase mb-1">Admin Panel</div>
                        <h1 className="text-3xl font-black tracking-tight">User Management</h1>
                        <p className="text-white/30 text-sm mt-1">Manage permanent staff & temporary event users</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push('/')}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white/50 hover:text-white hover:border-white/20 transition-all flex items-center gap-2"
                        >
                            <i className="fa-solid fa-house" /> Home
                        </button>
                        <button
                            onClick={openAddModal}
                            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-sm uppercase tracking-widest rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/20 flex items-center gap-2"
                        >
                            <i className="fa-solid fa-user-plus" /> Add User
                        </button>
                    </div>
                </div>

                {dbError && (
                    <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4">
                        <i className="fa-solid fa-triangle-exclamation text-2xl text-red-400 mt-1" />
                        <div>
                            <h3 className="font-black text-red-300 text-lg">Setup Required</h3>
                            <p className="text-red-400/80 mt-1 text-sm">{dbError}</p>
                        </div>
                    </div>
                )}

                {/* Users Table */}
                {!dbError && (
                    <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-black/20">
                                    <th className="px-6 py-4 text-[10px] font-black tracking-widest uppercase text-white/30">User</th>
                                    <th className="px-6 py-4 text-[10px] font-black tracking-widest uppercase text-white/30">Role</th>
                                    <th className="px-6 py-4 text-[10px] font-black tracking-widest uppercase text-white/30">Access Type</th>
                                    <th className="px-6 py-4 text-[10px] font-black tracking-widest uppercase text-white/30">Validity Window</th>
                                    <th className="px-6 py-4 text-[10px] font-black tracking-widest uppercase text-white/30 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {profiles.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center text-white/20 font-bold italic">
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                                {profiles.map((profile) => {
                                    const status = getAccessStatus(profile);
                                    return (
                                        <tr key={profile.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                            {/* User */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {profile.avatar_url ? (
                                                        <img src={profile.avatar_url} alt="Avatar" className="w-9 h-9 rounded-xl object-cover shrink-0 border border-white/10" />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-sm shrink-0">
                                                            {(profile.display_name || profile.full_name || profile.email || '?')[0].toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="text-sm font-bold text-white">
                                                            {profile.display_name || profile.full_name || '—'}
                                                        </div>
                                                        <div className="text-xs text-white/30">{profile.email || `ID: ${profile.id.slice(0, 8)}…`}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Role */}
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                    profile.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                    profile.role === 'client' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    'bg-white/5 text-white/40 border-white/10'
                                                }`}>
                                                    {profile.role}
                                                </span>
                                            </td>

                                            {/* Access Type + Status */}
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${STATUS_STYLES[status]}`}>
                                                    <i className={`fa-solid ${STATUS_ICONS[status]}`} />
                                                    {status}
                                                </span>
                                            </td>

                                            {/* Validity Window */}
                                            <td className="px-6 py-4">
                                                {profile.user_type === 'temporary' ? (
                                                    <div className="text-xs text-white/40 space-y-0.5">
                                                        <div><span className="text-white/20 font-bold uppercase tracking-widest text-[9px] mr-1">From</span>{fmtDate(profile.active_from)}</div>
                                                        <div><span className="text-white/20 font-bold uppercase tracking-widest text-[9px] mr-1">Until</span>{fmtDate(profile.active_until)}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-white/20 text-xs font-bold">No expiry</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(profile)}
                                                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-all"
                                                    >
                                                        <i className="fa-solid fa-pen mr-1" />Edit
                                                    </button>
                                                    {profile.role !== 'admin' && profile.id !== currentUser?.id && (
                                                        <button
                                                            onClick={() => handleRoleUpdate(profile.id, 'admin')}
                                                            className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest text-purple-400 transition-all"
                                                        >
                                                            Promote
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Add / Edit Modal ─────────────────── */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative bg-[#111] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-8 z-10">
                        <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 text-white/30 hover:text-white transition">
                            <i className="fa-solid fa-xmark text-xl" />
                        </button>

                        <h2 className="text-xl font-black text-white mb-1">{editTarget ? 'Edit User' : 'Add New User'}</h2>
                        <p className="text-white/30 text-sm mb-6">{editTarget ? 'Update access settings and role.' : 'Create a permanent or temporary user account.'}</p>

                        <div className="space-y-4">
                            {/* Avatar */}
                            <div>
                                <ImageUploadField
                                    label="Profile Avatar"
                                    value={form.avatar_url}
                                    onChange={v => setForm({ ...form, avatar_url: v })}
                                    bucket="user-avatars"
                                    folder="profiles"
                                    placeholder="Avatar URL or upload →"
                                />
                            </div>

                            {/* Display Name */}
                            <div>
                                <label className="block text-[10px] font-black tracking-widest uppercase text-white/40 mb-2">Display Name</label>
                                <input
                                    type="text"
                                    value={form.display_name}
                                    onChange={e => setForm({ ...form, display_name: e.target.value })}
                                    placeholder="e.g. Ahmad Faiz"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/60 placeholder-white/20 transition-colors"
                                />
                            </div>

                            {/* Email + Password (new user only) */}
                            {!editTarget && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-black tracking-widest uppercase text-white/40 mb-2">Email *</label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={e => setForm({ ...form, email: e.target.value })}
                                            placeholder="user@email.com"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/60 placeholder-white/20 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black tracking-widest uppercase text-white/40 mb-2">Password *</label>
                                        <input
                                            type="password"
                                            value={form.password}
                                            onChange={e => setForm({ ...form, password: e.target.value })}
                                            placeholder="Min. 6 chars"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/60 placeholder-white/20 transition-colors"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Role */}
                            <div>
                                <label className="block text-[10px] font-black tracking-widest uppercase text-white/40 mb-2">System Role</label>
                                <select
                                    value={form.role}
                                    onChange={e => setForm({ ...form, role: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/60 transition-colors appearance-none"
                                >
                                    <option value="REFEREE">Referee / Staff</option>
                                    <option value="PROJECT_MANAGER">Project Manager</option>
                                    <option value="client">Client</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            {/* User Type toggle */}
                            <div>
                                <label className="block text-[10px] font-black tracking-widest uppercase text-white/40 mb-3">Account Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {(['permanent', 'temporary'] as const).map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setForm({ ...form, user_type: type })}
                                            className={`py-3 rounded-xl border font-black text-xs uppercase tracking-widest transition-all ${
                                                form.user_type === type
                                                    ? 'bg-amber-500 text-black border-amber-500'
                                                    : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
                                            }`}
                                        >
                                            <i className={`fa-solid ${type === 'permanent' ? 'fa-shield-halved' : 'fa-clock'} mr-2`} />
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Temporary: date window */}
                            {form.user_type === 'temporary' && (
                                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-3">
                                    <div className="text-[10px] font-black tracking-widest uppercase text-amber-500 mb-1">Access Window</div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[9px] font-black tracking-widest uppercase text-white/30 mb-1.5">Active From</label>
                                            <input
                                                type="date"
                                                value={form.active_from}
                                                onChange={e => setForm({ ...form, active_from: e.target.value })}
                                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500/60 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black tracking-widest uppercase text-white/30 mb-1.5">Active Until</label>
                                            <input
                                                type="date"
                                                value={form.active_until}
                                                onChange={e => setForm({ ...form, active_until: e.target.value })}
                                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-amber-500/60 transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-white/30 text-[10px]">
                                        e.g. Set <strong className="text-amber-500">From</strong> to 2 weeks before event, <strong className="text-amber-500">Until</strong> to 2 days after. Login will be blocked outside this window.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-7">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-3 bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl text-sm font-bold text-white/50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-sm uppercase tracking-widest rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/20"
                            >
                                {editTarget ? 'Save Changes' : 'Create User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
