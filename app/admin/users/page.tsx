'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

/* ─────────────────────────────────────────────────────────────────
   USER MANAGEMENT — ZTO Event OS Admin
   Auth strategy: purely inline state machine, ZERO redirects.
   States: 'checking' | 'no-session' | 'no-admin' | 'ready'
───────────────────────────────────────────────────────────────── */

type AccessState = 'checking' | 'no-session' | 'no-admin' | 'ready';

type Profile = {
  id: string;
  display_name: string | null;
  full_name: string | null;
  email: string | null;
  role: string | null;
  user_type: string | null;
  created_at: string;
};

const ROLES = ['staff', 'PROJECT_MANAGER', 'REFEREE', 'client', 'admin'];

export default function UserManagementPage() {
  const [access, setAccess] = useState<AccessState>('checking');
  const [currentRole, setCurrentRole] = useState<string | null>(null); // for debug
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [modal, setModal] = useState<null | 'add' | Profile>(null);
  const [form, setForm] = useState({ display_name: '', email: '', password: '', role: 'staff' });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  /* ── Auth Check ──────────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setAccess('no-session'); return; }

        const { data: prof } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        const role = prof?.role ?? null;
        setCurrentRole(role); // store for debug display

        if (role?.toLowerCase() !== 'admin') {
          setAccess('no-admin');
          return;
        }
        setAccess('ready');
        loadProfiles();
      } catch {
        setAccess('no-session');
      }
    })();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, full_name, email, role, user_type, created_at')
      .order('created_at', { ascending: false });
    setProfiles(data ?? []);
    setLoading(false);
  };

  const openAdd = () => {
    setForm({ display_name: '', email: '', password: '', role: 'staff' });
    setNotice('');
    setModal('add');
  };

  const openEdit = (p: Profile) => {
    setForm({ display_name: p.display_name ?? '', email: p.email ?? '', password: '', role: p.role ?? 'staff' });
    setNotice('');
    setModal(p);
  };

  const handleSave = async () => {
    setSaving(true);
    setNotice('');

    if (modal === 'add') {
      if (!form.email || !form.password) { setNotice('Email + Password required'); setSaving(false); return; }
      const { data: created, error: signUpErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.display_name } },
      });
      if (signUpErr) { setNotice('Error: ' + signUpErr.message); setSaving(false); return; }
      if (created.user) {
        await supabase.from('profiles').upsert(
          { id: created.user.id, display_name: form.display_name || null, role: form.role },
          { onConflict: 'id' }
        );
      }
      setNotice('✓ User created — confirmation email sent');
    } else {
      const target = modal as Profile;
      const { error } = await supabase.from('profiles').update({
        display_name: form.display_name || null,
        role: form.role,
      }).eq('id', target.id);
      if (error) { setNotice('Error: ' + error.message); setSaving(false); return; }
      setNotice('✓ Saved');
    }

    setSaving(false);
    await loadProfiles();
    setTimeout(() => setModal(null), 900);
  };

  /* ── Render helpers ──────────────────────────────────────────── */
  const Spinner = () => (
    <div style={styles.center}>
      <div style={styles.spinner} />
      <style jsx>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (access === 'checking') return <Spinner />;

  if (access === 'no-session') return (
    <div style={styles.center}>
      <div style={styles.gate}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
        <h2 style={styles.gateTitle}>Not Signed In</h2>
        <p style={styles.gateDesc}>Please log in to access this module.</p>
        <Link href="/auth?returnTo=/admin/users" style={styles.gateBtn}>Sign In</Link>
      </div>
    </div>
  );

  if (access === 'no-admin') return (
    <div style={styles.center}>
      <div style={styles.gate}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <h2 style={styles.gateTitle}>Access Denied</h2>
        <p style={styles.gateDesc}>Admin role required. Your current role: <strong style={{ color: '#DEFF9A' }}>{currentRole ?? 'none'}</strong></p>
        <p style={{ ...styles.gateDesc, marginTop: 6, fontSize: 11 }}>Ask an existing admin to update your role in the profiles table.</p>
        <Link href="/dashboard" style={styles.gateBtn}>← Dashboard</Link>
      </div>
    </div>
  );

  /* ── Main Page ───────────────────────────────────────────────── */
  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <div style={styles.label}>Admin Panel</div>
          <h1 style={styles.h1}>User Management</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/dashboard" style={{ ...styles.btnGhost, textDecoration: 'none' }}>← Dashboard</Link>
          <button onClick={openAdd} style={styles.btnPrimary}>+ Add User</button>
        </div>
      </header>

      {/* Table */}
      <main style={styles.main}>
        {loading ? <Spinner /> : (
          <div style={styles.tableWrap}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
                  {['User', 'Role', 'Type', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={{ ...styles.th, textAlign: h === 'Actions' ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profiles.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>No profiles found.</td></tr>
                )}
                {profiles.map(p => {
                  const isAdmin = p.role?.toLowerCase() === 'admin';
                  const initials = (p.display_name ?? p.full_name ?? p.email ?? '?')[0].toUpperCase();
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ ...styles.avatar, background: isAdmin ? '#7c3aed' : '#0056B3' }}>{initials}</div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{p.display_name ?? p.full_name ?? '—'}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{p.email ?? `${p.id.slice(0, 12)}…`}</div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          padding: '4px 12px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                          background: isAdmin ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.04)',
                          border: isAdmin ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(255,255,255,0.08)',
                          color: isAdmin ? '#c084fc' : 'rgba(255,255,255,0.45)',
                        }}>
                          {p.role ?? 'none'}
                        </span>
                      </td>
                      <td style={{ ...styles.td, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{p.user_type ?? '—'}</td>
                      <td style={{ ...styles.td, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                        {p.created_at ? new Date(p.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <button onClick={() => openEdit(p)} style={styles.btnSm}>Edit</button>
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
      {modal !== null && (
        <div style={styles.overlay}>
          <div onClick={() => setModal(null)} style={styles.backdrop} />
          <div style={styles.modalCard}>
            <button onClick={() => setModal(null)} style={styles.modalClose}>×</button>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
              {modal === 'add' ? 'Add New User' : `Edit: ${(modal as Profile).display_name ?? (modal as Profile).email ?? 'User'}`}
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {modal === 'add' ? 'Create a new staff account.' : 'Update name and role.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <FieldRow label="Display Name">
                <input value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })} placeholder="Name" style={styles.inp} />
              </FieldRow>

              {modal === 'add' && (
                <>
                  <FieldRow label="Email *">
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="user@email.com" style={styles.inp} />
                  </FieldRow>
                  <FieldRow label="Password *">
                    <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" style={styles.inp} />
                  </FieldRow>
                </>
              )}

              <FieldRow label="Role">
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ ...styles.inp, background: '#0a0a0a' }}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </FieldRow>

              {notice && (
                <div style={{
                  padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  background: notice.startsWith('✓') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  border: notice.startsWith('✓') ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(239,68,68,0.25)',
                  color: notice.startsWith('✓') ? '#6ee7b7' : '#f87171',
                }}>
                  {notice}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button onClick={() => setModal(null)} style={{ ...styles.btnGhost, flex: 1 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ ...styles.btnPrimary, flex: 2, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving…' : modal === 'add' ? 'Create User' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page:    { minHeight: '100vh', background: '#050505', color: '#E5E5E5', fontFamily: 'Urbanist, sans-serif' },
  header:  { maxWidth: 1200, margin: '0 auto', padding: '40px 40px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 32 },
  main:    { maxWidth: 1200, margin: '0 auto', padding: '0 40px 80px' },
  label:   { fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 6 },
  h1:      { fontSize: 26, fontWeight: 800, color: '#fff' },
  center:  { minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Urbanist, sans-serif' },
  gate:    { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,86,179,0.3)', borderRadius: 24, padding: 48, maxWidth: 400, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  gateTitle: { fontSize: 22, fontWeight: 800, color: '#fff' },
  gateDesc:  { fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 },
  gateBtn:   { marginTop: 20, padding: '10px 28px', background: '#0056B3', color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 13, display: 'inline-block', boxShadow: '0 0 16px rgba(0,86,179,0.4)' },
  tableWrap: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,86,179,0.2)', borderRadius: 20, overflow: 'hidden' },
  th:        { padding: '14px 20px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)' },
  td:        { padding: '14px 20px', verticalAlign: 'middle' },
  avatar:    { width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 },
  btnPrimary: { padding: '9px 20px', borderRadius: 12, background: '#0056B3', color: '#fff', border: 'none', fontFamily: 'Urbanist, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 0 16px rgba(0,86,179,0.4)' },
  btnGhost:   { padding: '9px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Urbanist, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' },
  btnSm:      { padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontFamily: 'Urbanist, sans-serif', fontWeight: 700, fontSize: 11, cursor: 'pointer' },
  overlay:    { position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  backdrop:   { position: 'absolute', inset: 0, background: 'rgba(5,5,5,0.88)', backdropFilter: 'blur(8px)' },
  modalCard:  { position: 'relative', background: 'rgba(10,10,10,0.98)', border: '1px solid rgba(0,86,179,0.3)', borderRadius: 24, padding: 40, width: '100%', maxWidth: 460, zIndex: 10 },
  modalClose: { position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 22, cursor: 'pointer', lineHeight: 1 },
  inp:        { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontFamily: 'Urbanist, sans-serif', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  spinner:    { width: 36, height: 36, border: '2px solid rgba(0,86,179,0.15)', borderTopColor: '#0056B3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
};
