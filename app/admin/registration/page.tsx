'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Swal from 'sweetalert2';
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

export default function RegistrationAdminPage() {
    const router = useRouter();
    const [configs, setConfigs] = useState<RegConfig[]>([]);
    const [selected, setSelected] = useState<RegConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

    // ── Admin guard ──────────────────────────────────────────────────────────
    useEffect(() => {
        const guard = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.replace('/auth?returnTo=/admin/registration'); return; }
            const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
            // Case-insensitive check — accepts 'admin', 'Admin', 'ADMIN'
            if (prof?.role?.toLowerCase() !== 'admin') {
                router.replace('/dashboard');
                return;
            }
            setAuthChecked(true);
            fetchConfigs();
        };
        guard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchConfigs = async () => {
        const { data } = await supabase.from('registration_config').select('*').order('created_at', { ascending: false });
        setConfigs(data || []);
        if (data && data.length > 0 && !selected) setSelected(data[0]);
        setLoading(false);
    };

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
        if (error) {
            Swal.fire({ title: 'Error', text: error.message, icon: 'error', background: '#18181b', color: '#fff' });
        } else {
            Swal.fire({ title: 'Saved!', icon: 'success', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false, background: '#18181b', color: '#fff' });
        }
    };

    const addOrgItem = (field: 'organizers' | 'co_organizers') => {
        if (!selected) return;
        update(field, [...(selected[field] || []), { name: 'New Organization', logo_url: '' }]);
    };

    const removeOrgItem = (field: 'organizers' | 'co_organizers', index: number) => {
        if (!selected) return;
        update(field, selected[field].filter((_: any, i: number) => i !== index));
    };

    const updateOrgItem = (field: 'organizers' | 'co_organizers', index: number, key: string, value: string) => {
        if (!selected) return;
        const items = [...selected[field]];
        items[index] = { ...items[index], [key]: value };
        update(field, items);
    };

    const addSponsor = () => {
        if (!selected) return;
        update('sponsors', [...(selected.sponsors || []), { name: 'New Sponsor', logo_url: '', tier: 'bronze' }]);
    };

    const removeSponsor = (index: number) => {
        if (!selected) return;
        update('sponsors', selected.sponsors.filter((_: any, i: number) => i !== index));
    };

    const updateSponsor = (index: number, key: string, value: string) => {
        if (!selected) return;
        const items = [...selected.sponsors];
        items[index] = { ...items[index], [key]: value };
        update('sponsors', items);
    };

    if (!authChecked || loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="w-12 h-12 border-2 border-[#0056B3]/30 border-t-[#0056B3] rounded-full animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans">
            <header className="bg-[#050505]/90 border-b border-[#222] px-8 py-5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-white transition-colors"><i className="fa-solid fa-arrow-left mr-2" />Dashboard</Link>
                    <div className="w-px h-6 bg-white/10" />
                    <h1 className="text-xl font-black uppercase tracking-widest">Registration Studio</h1>
                </div>
                <div className="flex items-center gap-4">
                    {selected && (
                        <Link href={`/apps/ticketing/${selected.event_slug}`} target="_blank" className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                            <i className="fa-solid fa-external-link mr-2" />Preview Form
                        </Link>
                    )}
                    <button onClick={save} disabled={saving} className="px-6 py-2 bg-[#0056B3] text-white rounded-xl font-black uppercase tracking-widest hover:bg-[#003d82] shadow-[0_0_15px_rgba(0,86,179,0.3)] transition-all disabled:opacity-50 text-sm">
                        {saving ? <><i className="fa-solid fa-spinner fa-spin mr-2" />Saving...</> : <><i className="fa-solid fa-save mr-2" />Save Changes</>}
                    </button>
                </div>
            </header>

            {selected && (
                <main className="max-w-5xl mx-auto px-8 py-10 space-y-10">
                    {/* Event Selector */}
                    <div className="flex gap-3">
                        {configs.map(c => (
                            <button key={c.id} onClick={() => setSelected(c)} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selected.id === c.id ? 'bg-[#0056B3] text-white shadow-[0_0_15px_rgba(0,86,179,0.3)]' : 'bg-[#0a0a0a] text-zinc-500 border border-[#222] hover:border-[#0056B3]/50'}`}>
                                {c.event_name}
                            </button>
                        ))}
                    </div>

                    {/* Basic Info */}
                    <Section title="Event Branding" icon="fa-paint-brush">
                        <div className="grid grid-cols-2 gap-5">
                            <AdminField label="Event Name" value={selected.event_name} onChange={v => update('event_name', v)} />
                            <AdminField label="Subtitle" value={selected.event_subtitle || ''} onChange={v => update('event_subtitle', v)} />

                            {/* Event Logo — with upload */}
                            <ImageUploadField
                                label="Event Logo"
                                value={selected.logo_url || ''}
                                onChange={v => update('logo_url', v)}
                                bucket="logo"
                                folder={selected.id || 'events'}
                                placeholder="https://... or upload →"
                                preview="thumbnail"
                            />

                            {/* Background Image — with upload */}
                            <ImageUploadField
                                label="Background / Banner Image"
                                value={selected.background_url || ''}
                                onChange={v => update('background_url', v)}
                                bucket="tournament-banners"
                                folder={selected.id || 'events'}
                                placeholder="https://... or upload →"
                                preview="thumbnail"
                            />

                            <div>
                                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Primary Color</label>
                                <div className="flex items-center gap-3">
                                    <input type="color" value={selected.primary_color || '#f59e0b'} onChange={e => update('primary_color', e.target.value)} className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
                                    <input type="text" value={selected.primary_color || ''} onChange={e => update('primary_color', e.target.value)} className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm font-mono focus:outline-none focus:border-amber-500" />
                                </div>
                            </div>
                        </div>

                        {/* Banner preview if URL set */}
                        {selected.background_url && (
                            <div className="mt-4 rounded-2xl overflow-hidden h-40 border border-zinc-800">
                                <img src={selected.background_url} alt="Background preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </Section>

                    {/* Organizers */}
                    <Section title="Organizers" icon="fa-building">
                        <OrgList items={selected.organizers || []} onAdd={() => addOrgItem('organizers')} onRemove={(i) => removeOrgItem('organizers', i)} onUpdate={(i, k, v) => updateOrgItem('organizers', i, k, v)} bucket="event-assets" folderPrefix={`organizers/${selected.id}`} />
                    </Section>

                    {/* Co-Organizers */}
                    <Section title="Co-Organizers" icon="fa-handshake">
                        <OrgList items={selected.co_organizers || []} onAdd={() => addOrgItem('co_organizers')} onRemove={(i) => removeOrgItem('co_organizers', i)} onUpdate={(i, k, v) => updateOrgItem('co_organizers', i, k, v)} bucket="event-assets" folderPrefix={`co-organizers/${selected.id}`} />
                    </Section>

                    {/* Sponsors */}
                    <Section title="Sponsors" icon="fa-medal">
                        {(selected.sponsors || []).map((s: SponsorItem, i: number) => (
                            <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 mb-3 space-y-3">
                                <div className="flex items-center gap-3">
                                    <select value={s.tier || 'bronze'} onChange={e => updateSponsor(i, 'tier', e.target.value)} className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white appearance-none cursor-pointer w-28">
                                        <option value="gold">🥇 Gold</option>
                                        <option value="silver">🥈 Silver</option>
                                        <option value="bronze">🥉 Bronze</option>
                                    </select>
                                    <input value={s.name} onChange={e => updateSponsor(i, 'name', e.target.value)} className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="Sponsor Name" />
                                    <button onClick={() => removeSponsor(i)} className="text-red-500 hover:text-red-400 p-2 shrink-0"><i className="fa-solid fa-trash" /></button>
                                </div>
                                <ImageUploadField
                                    value={s.logo_url || ''}
                                    onChange={v => updateSponsor(i, 'logo_url', v)}
                                    bucket="event-assets"
                                    folder={`sponsors/${selected.id || 'events'}`}
                                    placeholder="Sponsor logo URL or upload →"
                                    preview="thumbnail"
                                    label="Sponsor Logo"
                                />
                            </div>
                        ))}
                        <button onClick={addSponsor} className="mt-2 px-4 py-2 border border-dashed border-white/10 rounded-xl text-zinc-500 text-xs font-black uppercase tracking-widest hover:border-amber-500 hover:text-amber-500 transition-all w-full">+ Add Sponsor</button>
                    </Section>

                    {/* Terms & Conditions */}
                    <Section title="Terms & Conditions" icon="fa-file-contract">
                        <textarea value={selected.terms_and_conditions || ''} onChange={e => update('terms_and_conditions', e.target.value)} rows={10} className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-5 text-sm text-zinc-300 font-mono leading-relaxed focus:outline-none focus:border-amber-500 resize-y" placeholder="Enter your terms and conditions..." />
                    </Section>

                    {/* Payment */}
                    <Section title="Payment Gateway" icon="fa-credit-card">
                        <div className="flex items-center gap-4 mb-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div onClick={() => update('payment_enabled', !selected.payment_enabled)} className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${selected.payment_enabled ? 'bg-amber-500 border-amber-500' : 'border-zinc-700'}`}>
                                    {selected.payment_enabled && <i className="fa-solid fa-check text-black text-sm" />}
                                </div>
                                <span className="text-sm font-bold text-zinc-300">Enable Online Payment</span>
                            </label>
                        </div>
                        {selected.payment_enabled && (
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Gateway</label>
                                    <select value={selected.payment_gateway || ''} onChange={e => update('payment_gateway', e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white font-bold appearance-none cursor-pointer">
                                        <option value="">Select...</option>
                                        <option value="billplz">Billplz</option>
                                        <option value="toyyibpay">ToyyibPay</option>
                                        <option value="stripe">Stripe</option>
                                        <option value="senangpay">SenangPay</option>
                                    </select>
                                </div>
                                <AdminField label="Amount" value={String(selected.payment_amount || '')} onChange={v => update('payment_amount', parseFloat(v) || 0)} placeholder="e.g. 150.00" />
                                <AdminField label="Currency" value={selected.payment_currency || 'MYR'} onChange={v => update('payment_currency', v)} />
                            </div>
                        )}
                    </Section>
                </main>
            )}
        </div>
    );
}

// --- HELPER COMPONENTS ---

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
    return (
        <div className="bg-white/[0.03] border border-[#0056B3]/20 rounded-[2rem] p-10">
            <h2 className="text-lg font-black uppercase tracking-widest mb-8 flex items-center gap-3">
                <i className={`fa-solid ${icon} text-[#0056B3]`} />
                {title}
            </h2>
            {children}
        </div>
    );
}

function AdminField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">{label}</label>
            <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-[#0056B3] focus:ring-1 focus:ring-[#0056B3]/50 transition-all placeholder:text-zinc-700" />
        </div>
    );
}

function OrgList({ items, onAdd, onRemove, onUpdate, bucket, folderPrefix }: {
    items: OrgItem[];
    onAdd: () => void;
    onRemove: (i: number) => void;
    onUpdate: (i: number, key: string, value: string) => void;
    bucket?: string;
    folderPrefix?: string;
}) {
    return (
        <div>
            {items.map((item: OrgItem, i: number) => (
                <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 mb-3 space-y-3">
                    <div className="flex items-center gap-3">
                        <input value={item.name} onChange={e => onUpdate(i, 'name', e.target.value)} className="flex-1 bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#0056B3]" placeholder="Organization Name" />
                        <button onClick={() => onRemove(i)} className="text-red-500 hover:text-red-400 p-2 shrink-0"><i className="fa-solid fa-trash" /></button>
                    </div>
                    <ImageUploadField
                        value={item.logo_url || ''}
                        onChange={v => onUpdate(i, 'logo_url', v)}
                        bucket={bucket || 'event-assets'}
                        folder={folderPrefix || 'organizers'}
                        placeholder="Logo URL or upload →"
                        preview="thumbnail"
                        label="Logo"
                    />
                </div>
            ))}
            <button onClick={onAdd} className="mt-2 px-4 py-2 border border-dashed border-[#0056B3]/30 rounded-xl text-zinc-500 text-xs font-black uppercase tracking-widest hover:border-[#0056B3] hover:text-[#0056B3] transition-all w-full">+ Add</button>
        </div>
    );
}
