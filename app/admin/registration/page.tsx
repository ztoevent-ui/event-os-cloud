'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { ImageUploadField } from '@/app/components/ImageUploadField';

/* ─────────────────────────────────────────────────────────────────
   REGISTRATION STUDIO — ZTO Event OS Admin
   Auth strategy: purely inline state machine, ZERO redirects.
   States: 'checking' | 'no-session' | 'no-admin' | 'ready'
───────────────────────────────────────────────────────────────── */

type AccessState = 'checking' | 'no-session' | 'no-admin' | 'ready';

type SponsorItem = { name: string; logo_url: string; tier?: string };
type OrgItem = { name: string; logo_url: string };
type RegConfig = {
  id: string;
  event_slug: string;
  event_name: string;
  event_subtitle: string;
  logo_url: string;
  background_url: string;
  primary_color: string;
  organizers: OrgItem[];
  co_organizers: OrgItem[];
  sponsors: SponsorItem[];
  terms_and_conditions: string;
  payment_enabled: boolean;
  payment_gateway: string;
  payment_amount: number;
  payment_currency: string;
};

export default function RegistrationStudioPage() {
  const [access, setAccess]       = useState<AccessState>('checking');
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [configs, setConfigs]     = useState<RegConfig[]>([]);
  const [selected, setSelected]   = useState<RegConfig | null>(null);
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

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
        setCurrentRole(role);

        if (role?.toLowerCase() !== 'admin') { setAccess('no-admin'); return; }
        setAccess('ready');
        loadConfigs();
      } catch {
        setAccess('no-session');
      }
    })();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    const { data } = await supabase.from('registration_config').select('*').order('created_at', { ascending: false });
    const list = (data ?? []) as RegConfig[];
    setConfigs(list);
    if (list.length > 0) setSelected(list[0]);
    setLoading(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upd = (field: string, val: any) => { if (!selected) return; setSelected({ ...selected, [field]: val }); };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase.from('registration_config').update({
      event_name: selected.event_name,
      event_subtitle: selected.event_subtitle,
      logo_url: selected.logo_url,
      background_url: selected.background_url,
      primary_color: selected.primary_color,
      organizers: selected.organizers,
      co_organizers: selected.co_organizers,
      sponsors: selected.sponsors,
      terms_and_conditions: selected.terms_and_conditions,
      payment_enabled: selected.payment_enabled,
      payment_gateway: selected.payment_gateway,
      payment_amount: selected.payment_amount,
      payment_currency: selected.payment_currency,
    }).eq('id', selected.id);
    setSaving(false);
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
  };

  const addOrg   = (f: 'organizers' | 'co_organizers') => upd(f, [...(selected?.[f] ?? []), { name: 'New Org', logo_url: '' }]);
  const removeOrg = (f: 'organizers' | 'co_organizers', i: number) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    upd(f, (selected?.[f] ?? []).filter((_: any, idx: number) => idx !== i));
  const editOrg  = (f: 'organizers' | 'co_organizers', i: number, k: string, v: string) => {
    const arr = [...(selected?.[f] ?? [])]; arr[i] = { ...arr[i], [k]: v }; upd(f, arr);
  };
  const addSponsor    = () => upd('sponsors', [...(selected?.sponsors ?? []), { name: 'Sponsor', logo_url: '', tier: 'bronze' }]);
  const removeSponsor = (i: number) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    upd('sponsors', (selected?.sponsors ?? []).filter((_: any, idx: number) => idx !== i));
  const editSponsor   = (i: number, k: string, v: string) => {
    const arr = [...(selected?.sponsors ?? [])]; arr[i] = { ...arr[i], [k]: v }; upd('sponsors', arr);
  };

  /* ── Render helpers ──────────────────────────────────────────── */
  const Spinner = () => (
    <div style={s.center}>
      <div style={s.spinner} />
      <style jsx>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (access === 'checking') return <Spinner />;

  if (access === 'no-session') return (
    <div style={s.center}>
      <div style={s.gate}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
        <h2 style={s.gateTitle}>Not Signed In</h2>
        <p style={s.gateDesc}>Please log in to access this module.</p>
        <Link href="/auth?returnTo=/admin/registration" style={s.gateBtn}>Sign In</Link>
      </div>
    </div>
  );

  if (access === 'no-admin') return (
    <div style={s.center}>
      <div style={s.gate}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <h2 style={s.gateTitle}>Access Denied</h2>
        <p style={s.gateDesc}>Admin role required.</p>
        <p style={s.gateDesc}>Your role: <strong style={{ color: '#DEFF9A' }}>{currentRole ?? 'none'}</strong></p>
        <p style={{ ...s.gateDesc, fontSize: 11, marginTop: 4 }}>Ask an admin to set your role to <code>admin</code> in the profiles table.</p>
        <Link href="/dashboard" style={s.gateBtn}>← Dashboard</Link>
      </div>
    </div>
  );

  if (loading) return <Spinner />;

  /* ── Main UI ─────────────────────────────────────────────────── */
  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/dashboard" style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            ← Dashboard
          </Link>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />
          <h1 style={{ fontSize: 16, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Registration Studio</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {saved && <span style={{ fontSize: 12, fontWeight: 700, color: '#DEFF9A' }}>✓ Saved</span>}
          <button onClick={save} disabled={saving} style={s.btnPrimary}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </header>

      {configs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 40px', color: 'rgba(255,255,255,0.3)', fontFamily: 'Urbanist, sans-serif' }}>
          No registration configs found.
        </div>
      ) : selected && (
        <main style={s.main}>
          {/* Config Selector */}
          {configs.length > 1 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
              {configs.map(c => (
                <button key={c.id} onClick={() => setSelected(c)}
                  style={{ ...s.btnGhost, ...(selected.id === c.id ? { background: '#0056B3', color: '#fff', border: '1px solid #0056B3' } : {}) }}>
                  {c.event_name}
                </button>
              ))}
            </div>
          )}

          {/* Branding */}
          <Sect icon="🎨" title="Event Branding">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <Field label="Event Name"><input style={s.inp} value={selected.event_name} onChange={e => upd('event_name', e.target.value)} placeholder="Event Name" /></Field>
              <Field label="Subtitle"><input style={s.inp} value={selected.event_subtitle ?? ''} onChange={e => upd('event_subtitle', e.target.value)} placeholder="Subtitle" /></Field>
            </div>
            <ImageUploadField label="Event Logo" value={selected.logo_url ?? ''} onChange={v => upd('logo_url', v)} bucket="logo" folder={selected.id} placeholder="URL or upload →" preview="thumbnail" />
            <div style={{ marginTop: 16 }}>
              <ImageUploadField label="Background / Banner" value={selected.background_url ?? ''} onChange={v => upd('background_url', v)} bucket="tournament-banners" folder={selected.id} placeholder="URL or upload →" preview="thumbnail" />
            </div>
            {selected.background_url && (
              <div style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden', height: 110, border: '1px solid rgba(255,255,255,0.07)' }}>
                <img src={selected.background_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </Sect>

          {/* Organizers */}
          <Sect icon="🏢" title="Organizers">
            {(selected.organizers ?? []).map((o, i) => (
              <OrgRow key={i} name={o.name} logoUrl={o.logo_url}
                onChangeName={v => editOrg('organizers', i, 'name', v)}
                onChangeLogo={v => editOrg('organizers', i, 'logo_url', v)}
                onRemove={() => removeOrg('organizers', i)}
                bucket="event-assets" folder={`organizers/${selected.id}`}
              />
            ))}
            <button onClick={() => addOrg('organizers')} style={{ ...s.btnGhost, width: '100%', marginTop: 8 }}>+ Add Organizer</button>
          </Sect>

          {/* Co-Organizers */}
          <Sect icon="🤝" title="Co-Organizers">
            {(selected.co_organizers ?? []).map((o, i) => (
              <OrgRow key={i} name={o.name} logoUrl={o.logo_url}
                onChangeName={v => editOrg('co_organizers', i, 'name', v)}
                onChangeLogo={v => editOrg('co_organizers', i, 'logo_url', v)}
                onRemove={() => removeOrg('co_organizers', i)}
                bucket="event-assets" folder={`co-organizers/${selected.id}`}
              />
            ))}
            <button onClick={() => addOrg('co_organizers')} style={{ ...s.btnGhost, width: '100%', marginTop: 8 }}>+ Add Co-Organizer</button>
          </Sect>

          {/* Sponsors */}
          <Sect icon="🏅" title="Sponsors">
            {(selected.sponsors ?? []).map((sp, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <select value={sp.tier ?? 'bronze'} onChange={e => editSponsor(i, 'tier', e.target.value)}
                    style={{ ...s.inp, width: 110, flexShrink: 0, background: '#0a0a0a' }}>
                    <option value="gold">🥇 Gold</option>
                    <option value="silver">🥈 Silver</option>
                    <option value="bronze">🥉 Bronze</option>
                  </select>
                  <input style={{ ...s.inp, flex: 1 }} value={sp.name} onChange={e => editSponsor(i, 'name', e.target.value)} placeholder="Sponsor Name" />
                  <button onClick={() => removeSponsor(i)} style={s.btnDanger}>✕</button>
                </div>
                <ImageUploadField label="Logo" value={sp.logo_url ?? ''} onChange={v => editSponsor(i, 'logo_url', v)} bucket="event-assets" folder={`sponsors/${selected.id}`} placeholder="Logo URL or upload" preview="thumbnail" />
              </div>
            ))}
            <button onClick={addSponsor} style={{ ...s.btnGhost, width: '100%', marginTop: 8 }}>+ Add Sponsor</button>
          </Sect>

          {/* Terms */}
          <Sect icon="📄" title="Terms & Conditions">
            <textarea rows={10} value={selected.terms_and_conditions ?? ''} onChange={e => upd('terms_and_conditions', e.target.value)}
              placeholder="Enter terms and conditions…"
              style={{ ...s.inp, resize: 'vertical', lineHeight: 1.7 }} />
          </Sect>

          {/* Payment */}
          <Sect icon="💳" title="Payment Gateway">
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 20 }}>
              <div onClick={() => upd('payment_enabled', !selected.payment_enabled)} style={{ width: 44, height: 24, borderRadius: 12, background: selected.payment_enabled ? '#0056B3' : 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.25s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 3, left: selected.payment_enabled ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.25s' }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Enable Online Payment</span>
            </label>
            {selected.payment_enabled && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <Field label="Gateway">
                  <select value={selected.payment_gateway ?? ''} onChange={e => upd('payment_gateway', e.target.value)} style={{ ...s.inp, background: '#0a0a0a' }}>
                    <option value="">Select…</option>
                    <option value="billplz">Billplz</option>
                    <option value="toyyibpay">ToyyibPay</option>
                    <option value="stripe">Stripe</option>
                    <option value="senangpay">SenangPay</option>
                  </select>
                </Field>
                <Field label="Amount"><input style={s.inp} type="number" value={selected.payment_amount ?? ''} onChange={e => upd('payment_amount', parseFloat(e.target.value) || 0)} placeholder="150.00" /></Field>
                <Field label="Currency"><input style={s.inp} value={selected.payment_currency ?? 'MYR'} onChange={e => upd('payment_currency', e.target.value)} /></Field>
              </div>
            )}
          </Sect>
        </main>
      )}
      <style jsx global>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────── */
function Sect({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,86,179,0.2)', borderRadius: 20, padding: 32, marginBottom: 20 }}>
      <h2 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Urbanist, sans-serif' }}>
        {icon} {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>{label}</label>
      {children}
    </div>
  );
}

function OrgRow({ name, logoUrl, onChangeName, onChangeLogo, onRemove, bucket, folder }: {
  name: string; logoUrl: string;
  onChangeName: (v: string) => void; onChangeLogo: (v: string) => void;
  onRemove: () => void; bucket: string; folder: string;
}) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <input style={{ ...s.inp, flex: 1 }} value={name} onChange={e => onChangeName(e.target.value)} placeholder="Organization Name" />
        <button onClick={onRemove} style={s.btnDanger}>✕</button>
      </div>
      <ImageUploadField label="Logo" value={logoUrl} onChange={onChangeLogo} bucket={bucket} folder={folder} placeholder="Logo URL or upload" preview="thumbnail" />
    </div>
  );
}

/* ── Shared styles ───────────────────────────────────────────────── */
const s: Record<string, React.CSSProperties> = {
  page:       { minHeight: '100vh', background: '#050505', color: '#E5E5E5', fontFamily: 'Urbanist, sans-serif' },
  header:     { position: 'sticky', top: 0, zIndex: 50, background: 'rgba(5,5,5,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 48px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  main:       { maxWidth: 960, margin: '0 auto', padding: '40px 40px 80px' },
  center:     { minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Urbanist, sans-serif' },
  gate:       { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,86,179,0.3)', borderRadius: 24, padding: 48, maxWidth: 400, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  gateTitle:  { fontSize: 22, fontWeight: 800, color: '#fff' },
  gateDesc:   { fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 },
  gateBtn:    { marginTop: 20, padding: '10px 28px', background: '#0056B3', color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 13, display: 'inline-block', boxShadow: '0 0 16px rgba(0,86,179,0.4)' },
  btnPrimary: { padding: '8px 20px', borderRadius: 12, background: '#0056B3', color: '#fff', border: 'none', fontFamily: 'Urbanist, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 0 16px rgba(0,86,179,0.4)' },
  btnGhost:   { padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Urbanist, sans-serif', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  btnDanger:  { padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', cursor: 'pointer', fontFamily: 'Urbanist, sans-serif', fontSize: 14 },
  inp:        { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontFamily: 'Urbanist, sans-serif', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  spinner:    { width: 36, height: 36, border: '2px solid rgba(0,86,179,0.15)', borderTopColor: '#0056B3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
};
