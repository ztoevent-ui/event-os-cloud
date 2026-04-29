'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { ImageUploadField } from '@/app/components/ImageUploadField';

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

type AuthState = 'loading' | 'denied' | 'ok';

export default function RegistrationAdminPage() {
    const [auth, setAuth] = useState<AuthState>('loading');
    const [configs, setConfigs] = useState<RegConfig[]>([]);
    const [selected, setSelected] = useState<RegConfig | null>(null);
    const [dataLoading, setDataLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // ── Auth check (NO redirect — shows Access Denied inline) ─────────────────
    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setAuth('denied'); return; }
            const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
            if (prof?.role?.toLowerCase() !== 'admin') { setAuth('denied'); return; }
            setAuth('ok');
            loadConfigs();
        })();
    }, []);

    const loadConfigs = async () => {
        setDataLoading(true);
        const { data } = await supabase.from('registration_config').select('*').order('created_at', { ascending: false });
        const list = data || [];
        setConfigs(list);
        if (list.length > 0) setSelected(list[0]);
        setDataLoading(false);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update = (field: string, value: any) => {
        if (!selected) return;
        setSelected({ ...selected, [field]: value });
    };

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
        if (!error) {
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        }
    };

    const addOrgItem = (field: 'organizers' | 'co_organizers') => {
        if (!selected) return;
        update(field, [...(selected[field] || []), { name: 'New Org', logo_url: '' }]);
    };

    const removeOrgItem = (field: 'organizers' | 'co_organizers', i: number) => {
        if (!selected) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        update(field, selected[field].filter((_: any, idx: number) => idx !== i));
    };

    const updateOrgItem = (field: 'organizers' | 'co_organizers', i: number, key: string, val: string) => {
        if (!selected) return;
        const arr = [...selected[field]];
        arr[i] = { ...arr[i], [key]: val };
        update(field, arr);
    };

    const addSponsor = () => {
        if (!selected) return;
        update('sponsors', [...(selected.sponsors || []), { name: 'New Sponsor', logo_url: '', tier: 'bronze' }]);
    };

    const removeSponsor = (i: number) => {
        if (!selected) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        update('sponsors', selected.sponsors.filter((_: any, idx: number) => idx !== i));
    };

    const updateSponsor = (i: number, key: string, val: string) => {
        if (!selected) return;
        const arr = [...selected.sponsors];
        arr[i] = { ...arr[i], [key]: val };
        update('sponsors', arr);
    };

    // ── Auth states ───────────────────────────────────────────────────────────
    if (auth === 'loading') return (
        <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 40, height: 40, border: '2px solid rgba(0,86,179,0.2)', borderTopColor: '#0056B3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (auth === 'denied') return (
        <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Urbanist, sans-serif', gap: 20 }}>
            <div style={{ fontSize: 48 }}>🔒</div>
            <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 24, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Access Denied</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Admin privileges required.</p>
            <Link href="/dashboard" style={{ marginTop: 16, padding: '10px 24px', background: '#0056B3', color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
                ← Back to Dashboard
            </Link>
        </div>
    );

    if (dataLoading) return (
        <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 40, height: 40, border: '2px solid rgba(0,86,179,0.2)', borderTopColor: '#0056B3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    // ── Main UI ───────────────────────────────────────────────────────────────
    const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontFamily: 'Urbanist, sans-serif', fontSize: 14, outline: 'none' };
    const lbl: React.CSSProperties = { display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 8 };

    return (
        <div style={{ minHeight: '100vh', background: '#050505', color: '#E5E5E5', fontFamily: 'Urbanist, sans-serif' }}>
            {/* Header */}
            <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(5,5,5,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 48px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <Link href="/dashboard" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                        ← Dashboard
                    </Link>
                    <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />
                    <h1 style={{ fontSize: 16, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Registration Studio</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {saved && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#DEFF9A', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DEFF9A', boxShadow: '0 0 8px #DEFF9A' }} />
                            Saved
                        </span>
                    )}
                    <button onClick={save} disabled={saving} className="zto-btn zto-btn-primary" style={{ padding: '8px 20px' }}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </header>

            {configs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 40px', color: 'rgba(255,255,255,0.3)' }}>
                    No registration configurations found in database.
                </div>
            ) : selected && (
                <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px 40px 80px' }}>

                    {/* Config Selector */}
                    {configs.length > 1 && (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
                            {configs.map(c => (
                                <button key={c.id} onClick={() => setSelected(c)}
                                    className={selected.id === c.id ? 'zto-btn zto-btn-primary' : 'zto-btn zto-btn-ghost'}
                                    style={{ padding: '6px 16px', fontSize: 12 }}>
                                    {c.event_name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Section: Event Branding */}
                    <Section title="Event Branding" icon="🎨">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <label style={lbl}>Event Name</label>
                                <input style={inp} value={selected.event_name} onChange={e => update('event_name', e.target.value)} placeholder="Event Name" />
                            </div>
                            <div>
                                <label style={lbl}>Subtitle</label>
                                <input style={inp} value={selected.event_subtitle || ''} onChange={e => update('event_subtitle', e.target.value)} placeholder="Subtitle" />
                            </div>
                        </div>
                        <div style={{ marginTop: 16 }}>
                            <ImageUploadField label="Event Logo" value={selected.logo_url || ''} onChange={v => update('logo_url', v)} bucket="logo" folder={selected.id} placeholder="URL or upload →" preview="thumbnail" />
                        </div>
                        <div style={{ marginTop: 16 }}>
                            <ImageUploadField label="Background / Banner" value={selected.background_url || ''} onChange={v => update('background_url', v)} bucket="tournament-banners" folder={selected.id} placeholder="URL or upload →" preview="thumbnail" />
                        </div>
                        {selected.background_url && (
                            <div style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden', height: 120, border: '1px solid rgba(255,255,255,0.08)' }}>
                                <img src={selected.background_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        )}
                    </Section>

                    {/* Section: Organizers */}
                    <Section title="Organizers" icon="🏢">
                        {(selected.organizers || []).map((o, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                                    <input style={{ ...inp, flex: 1 }} value={o.name} onChange={e => updateOrgItem('organizers', i, 'name', e.target.value)} placeholder="Organization Name" />
                                    <button onClick={() => removeOrgItem('organizers', i)} style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', cursor: 'pointer', fontFamily: 'Urbanist' }}>✕</button>
                                </div>
                                <ImageUploadField label="Logo" value={o.logo_url || ''} onChange={v => updateOrgItem('organizers', i, 'logo_url', v)} bucket="event-assets" folder={`organizers/${selected.id}`} placeholder="Logo URL or upload" preview="thumbnail" />
                            </div>
                        ))}
                        <button onClick={() => addOrgItem('organizers')} className="zto-btn zto-btn-ghost" style={{ width: '100%', marginTop: 4 }}>+ Add Organizer</button>
                    </Section>

                    {/* Section: Co-Organizers */}
                    <Section title="Co-Organizers" icon="🤝">
                        {(selected.co_organizers || []).map((o, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                                    <input style={{ ...inp, flex: 1 }} value={o.name} onChange={e => updateOrgItem('co_organizers', i, 'name', e.target.value)} placeholder="Organization Name" />
                                    <button onClick={() => removeOrgItem('co_organizers', i)} style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', cursor: 'pointer', fontFamily: 'Urbanist' }}>✕</button>
                                </div>
                                <ImageUploadField label="Logo" value={o.logo_url || ''} onChange={v => updateOrgItem('co_organizers', i, 'logo_url', v)} bucket="event-assets" folder={`co-organizers/${selected.id}`} placeholder="Logo URL or upload" preview="thumbnail" />
                            </div>
                        ))}
                        <button onClick={() => addOrgItem('co_organizers')} className="zto-btn zto-btn-ghost" style={{ width: '100%', marginTop: 4 }}>+ Add Co-Organizer</button>
                    </Section>

                    {/* Section: Sponsors */}
                    <Section title="Sponsors" icon="🏅">
                        {(selected.sponsors || []).map((s, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                                    <select value={s.tier || 'bronze'} onChange={e => updateSponsor(i, 'tier', e.target.value)} style={{ ...inp, width: 110, flexShrink: 0, background: '#0a0a0a' }}>
                                        <option value="gold">🥇 Gold</option>
                                        <option value="silver">🥈 Silver</option>
                                        <option value="bronze">🥉 Bronze</option>
                                    </select>
                                    <input style={{ ...inp, flex: 1 }} value={s.name} onChange={e => updateSponsor(i, 'name', e.target.value)} placeholder="Sponsor Name" />
                                    <button onClick={() => removeSponsor(i)} style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', cursor: 'pointer', fontFamily: 'Urbanist' }}>✕</button>
                                </div>
                                <ImageUploadField label="Sponsor Logo" value={s.logo_url || ''} onChange={v => updateSponsor(i, 'logo_url', v)} bucket="event-assets" folder={`sponsors/${selected.id}`} placeholder="Logo URL or upload" preview="thumbnail" />
                            </div>
                        ))}
                        <button onClick={addSponsor} className="zto-btn zto-btn-ghost" style={{ width: '100%', marginTop: 4 }}>+ Add Sponsor</button>
                    </Section>

                    {/* Section: Terms */}
                    <Section title="Terms & Conditions" icon="📄">
                        <textarea
                            value={selected.terms_and_conditions || ''}
                            onChange={e => update('terms_and_conditions', e.target.value)}
                            rows={10}
                            placeholder="Enter your terms and conditions..."
                            style={{ ...inp, resize: 'vertical', lineHeight: 1.7 }}
                        />
                    </Section>

                    {/* Section: Payment */}
                    <Section title="Payment Gateway" icon="💳">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 20 }}>
                            <div
                                onClick={() => update('payment_enabled', !selected.payment_enabled)}
                                style={{ width: 44, height: 24, borderRadius: 12, background: selected.payment_enabled ? '#0056B3' : 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'all 0.25s', flexShrink: 0 }}
                            >
                                <div style={{ position: 'absolute', top: 2, left: selected.payment_enabled ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.25s' }} />
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Enable Online Payment</span>
                        </label>
                        {selected.payment_enabled && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                                <div>
                                    <label style={lbl}>Gateway</label>
                                    <select value={selected.payment_gateway || ''} onChange={e => update('payment_gateway', e.target.value)} style={{ ...inp, background: '#0a0a0a' }}>
                                        <option value="">Select...</option>
                                        <option value="billplz">Billplz</option>
                                        <option value="toyyibpay">ToyyibPay</option>
                                        <option value="stripe">Stripe</option>
                                        <option value="senangpay">SenangPay</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={lbl}>Amount</label>
                                    <input style={inp} type="number" value={selected.payment_amount || ''} onChange={e => update('payment_amount', parseFloat(e.target.value) || 0)} placeholder="150.00" />
                                </div>
                                <div>
                                    <label style={lbl}>Currency</label>
                                    <input style={inp} value={selected.payment_currency || 'MYR'} onChange={e => update('payment_currency', e.target.value)} />
                                </div>
                            </div>
                        )}
                    </Section>

                </main>
            )}

            <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
    return (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,86,179,0.2)', borderRadius: 20, padding: 32, marginBottom: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Urbanist' }}>
                <span>{icon}</span> {title}
            </h2>
            {children}
        </div>
    );
}
