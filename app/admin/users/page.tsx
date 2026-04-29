'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

type Profile = {
    id: string;
    email?: string;
    display_name?: string;
    full_name?: string;
    avatar_url?: string;
    role: string;
    user_type?: string;
    active_from?: string | null;
    active_until?: string | null;
    created_at: string;
};

type AuthState = 'loading' | 'denied' | 'ok';

export default function AdminUsersPage() {
    const [auth, setAuth] = useState<AuthState>('loading');
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [dataLoading, setDataLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editTarget, setEditTarget] = useState<Profile | null>(null);
    const [form, setForm] = useState({ display_name: '', email: '', password: '', role: 'staff', user_type: 'permanent' });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setAuth('denied'); return; }
            const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
            if (!prof || prof.role?.toLowerCase() !== 'admin') { setAuth('denied'); return; }
            setAuth('ok');
            loadProfiles();
        })();
    }, []);

    const loadProfiles = async () => {
        setDataLoading(true);
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        setProfiles(data || []);
        setDataLoading(false);
    };

    const openAdd = () => {
        setEditTarget(null);
        setForm({ display_name: '', email: '', password: '', role: 'staff', user_type: 'permanent' });
        setMsg('');
        setShowModal(true);
    };

    const openEdit = (p: Profile) => {
        setEditTarget(p);
        setForm({ display_name: p.display_name || p.full_name || '', email: p.email || '', password: '', role: p.role || 'staff', user_type: p.user_type || 'permanent' });
        setMsg('');
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setMsg('');
        try {
            if (editTarget) {
                const { error } = await supabase.from('profiles').update({
                    display_name: form.display_name || null,
                    role: form.role,
                    user_type: form.user_type,
                    updated_at: new Date().toISOString(),
                }).eq('id', editTarget.id);
                if (error) throw error;
                setMsg('✓ Updated successfully');
                loadProfiles();
                setTimeout(() => setShowModal(false), 800);
            } else {
                if (!form.email || !form.password) { setMsg('Email and password required'); setSaving(false); return; }
                const { data: newUser, error: signupErr } = await supabase.auth.signUp({
                    email: form.email,
                    password: form.password,
                    options: { data: { full_name: form.display_name } },
                });
                if (signupErr) throw signupErr;
                if (newUser.user) {
                    await supabase.from('profiles').upsert({
                        id: newUser.user.id,
                        display_name: form.display_name || null,
                        role: form.role,
                        user_type: form.user_type,
                    }, { onConflict: 'id' });
                }
                setMsg('✓ User created — confirmation email sent');
                loadProfiles();
                setTimeout(() => setShowModal(false), 1200);
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            setMsg('✗ ' + e.message);
        }
        setSaving(false);
    };

    const promoteToAdmin = async (id: string) => {
        await supabase.from('profiles').update({ role: 'admin' }).eq('id', id);
        loadProfiles();
    };

    const demote = async (id: string) => {
        await supabase.from('profiles').update({ role: 'staff' }).eq('id', id);
        loadProfiles();
    };

    // ── Auth States ───────────────────────────────────────────────────────────
    if (auth === 'loading') return (
        <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 40, height: 40, border: '2px solid rgba(0,86,179,0.2)', borderTopColor: '#0056B3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (auth === 'denied') return (
        <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Urbanist, sans-serif', gap: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🔒</div>
            <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 24, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Access Denied</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>You need Admin privileges to access this module.</p>
            <Link href="/dashboard" style={{ marginTop: 16, padding: '10px 24px', background: '#0056B3', color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
                ← Back to Dashboard
            </Link>
        </div>
    );

    // ── Main UI ───────────────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', background: '#050505', color: '#E5E5E5', fontFamily: 'Urbanist, sans-serif' }}>
            {/* Header */}
            <header style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 40px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Admin Panel</div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>User Management</h1>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <Link href="/dashboard" className="zto-btn zto-btn-ghost" style={{ textDecoration: 'none', padding: '8px 18px' }}>
                        ← Dashboard
                    </Link>
                    <button onClick={openAdd} className="zto-btn zto-btn-primary" style={{ padding: '8px 18px' }}>
                        + Add User
                    </button>
                </div>
            </header>

            {/* Table */}
            <main style={{ maxWidth: 1200, margin: '32px auto 80px', padding: '0 40px' }}>
                {dataLoading ? (
                    <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>Loading...</div>
                ) : (
                    <div className="zto-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Urbanist, sans-serif' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
                                    {['User', 'Role', 'Type', 'Created', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '14px 20px', textAlign: h === 'Actions' ? 'right' : 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {profiles.length === 0 && (
                                    <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>No users found.</td></tr>
                                )}
                                {profiles.map(p => {
                                    const isAdmin = p.role?.toLowerCase() === 'admin';
                                    return (
                                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <td style={{ padding: '14px 20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 34, height: 34, borderRadius: 10, background: '#0056B3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                                                        {(p.display_name || p.full_name || p.email || '?')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{p.display_name || p.full_name || '—'}</div>
                                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{p.email || p.id.slice(0, 12) + '…'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 20px' }}>
                                                <span style={{
                                                    padding: '4px 12px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                                                    background: isAdmin ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.04)',
                                                    border: isAdmin ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(255,255,255,0.08)',
                                                    color: isAdmin ? '#c084fc' : 'rgba(255,255,255,0.4)',
                                                }}>
                                                    {p.role || 'staff'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 20px', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{p.user_type || 'permanent'}</td>
                                            <td style={{ padding: '14px 20px', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                                                {p.created_at ? new Date(p.created_at).toLocaleDateString('en-MY') : '—'}
                                            </td>
                                            <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                    <button onClick={() => openEdit(p)} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Urbanist' }}>
                                                        Edit
                                                    </button>
                                                    {!isAdmin && (
                                                        <button onClick={() => promoteToAdmin(p.id)} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', color: '#c084fc', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Urbanist' }}>
                                                            → Admin
                                                        </button>
                                                    )}
                                                    {isAdmin && (
                                                        <button onClick={() => demote(p.id)} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Urbanist' }}>
                                                            Demote
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
            </main>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div onClick={() => setShowModal(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(8px)' }} />
                    <div className="zto-card page-transition" style={{ position: 'relative', width: '100%', maxWidth: 460, zIndex: 10 }}>
                        <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 20 }}>×</button>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{editTarget ? 'Edit User' : 'Add New User'}</h2>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                            {editTarget ? 'Update display name and role.' : 'Create a new staff account.'}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>Display Name</label>
                                <input value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })} placeholder="e.g. Ahmad Faiz" className="zto-input" />
                            </div>
                            {!editTarget && (
                                <>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>Email *</label>
                                        <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="user@email.com" className="zto-input" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>Password *</label>
                                        <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 characters" className="zto-input" />
                                    </div>
                                </>
                            )}
                            <div>
                                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>Role</label>
                                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="zto-select" style={{ background: '#0a0a0a' }}>
                                    <option value="staff">Staff</option>
                                    <option value="REFEREE">Referee</option>
                                    <option value="PROJECT_MANAGER">Project Manager</option>
                                    <option value="client">Client</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            {msg && (
                                <div style={{ padding: '10px 14px', borderRadius: 10, background: msg.startsWith('✓') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: msg.startsWith('✓') ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(239,68,68,0.25)', color: msg.startsWith('✓') ? '#6ee7b7' : '#f87171', fontSize: 13, fontWeight: 600 }}>
                                    {msg}
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                            <button onClick={() => setShowModal(false)} className="zto-btn zto-btn-ghost" style={{ flex: 1 }}>Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="zto-btn zto-btn-primary" style={{ flex: 2 }}>
                                {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Create User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
