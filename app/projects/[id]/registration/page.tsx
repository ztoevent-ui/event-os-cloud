'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import Swal from 'sweetalert2';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageUploadField } from '@/app/components/ImageUploadField';

// ── Preset theme colors ──────────────────────────────────────
const THEME_PRESETS = [
    { label: 'Gold',    value: '#f59e0b' },
    { label: 'Emerald', value: '#10b981' },
    { label: 'Sky',     value: '#0ea5e9' },
    { label: 'Violet',  value: '#8b5cf6' },
    { label: 'Rose',    value: '#f43f5e' },
    { label: 'Orange',  value: '#f97316' },
    { label: 'Cyan',    value: '#06b6d4' },
    { label: 'Lime',    value: '#84cc16' },
];

// ── Slug slugify helper ───────────────────────────────────────
function toSlug(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
}

export default function RegistrationStudio() {
    const params = useParams();
    const projectId = params?.id as string;

    const [activeTab, setActiveTab] = useState<'settings' | 'tournament' | 'submissions'>('settings');
    const [isLoading, setIsLoading] = useState(true);
    const [slugTaken, setSlugTaken] = useState(false);
    const [slugChecking, setSlugChecking] = useState(false);
    const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [settings, setSettings] = useState<any>({
        slogan: '',
        logo_url: '',
        title_sponsor: '',
        title_sponsor_label: 'Title Sponsor / 冠名商',
        sponsors: [],
        co_organizers: [],
        template_type: 'guild_team_item',
        fields_config: {
            show_team_name: true,
            show_team_dupr_average: false,
            requires_gender: true,
            show_ic_passport: true,
            show_phone: true,
            show_email: true,
            show_dupr: false,
            show_medical: false,
            show_city_state: false,
            show_emergency_contact: false,
            show_work_school: false
        },
        medical_options: [
            'Heart Disease / Penyakit Jantung',
            'Asthma / Asma',
            'Diabetes / Kencing Manis',
            'High Blood Pressure / Darah Tinggi',
            'Epilepsy / Sawan',
            'Joint/Bone Injury / Kecederaan Sendi'
        ],
        // Tournament Page fields
        page_slug: '',
        theme_color: '#f59e0b',
        hero_banner_url: '',
        event_description: '',
        prize_pool: [],
        categories: [],
        rules: '',
        format_description: '',
        event_schedule: [],
        venue_name: '',
        venue_address: '',
        venue_map_url: '',
        social_links: { facebook: '', instagram: '', whatsapp: '' },
        reg_open_date: '',
        reg_close_date: '',
    });

    const [submissions, setSubmissions] = useState<any[]>([]);

    useEffect(() => {
        if (projectId) { loadSettings(); loadSubmissions(); }
    }, [projectId]);

    const loadSettings = async () => {
        try {
            const { data } = await supabase
                .from('tournament_settings')
                .select('*')
                .eq('project_id', projectId)
                .single();

            if (data) {
                setSettings({
                    ...settings,
                    ...data,
                    fields_config: data.fields_config || settings.fields_config,
                    medical_options: data.medical_options || settings.medical_options,
                    title_sponsor_label: data.title_sponsor_label || 'Title Sponsor / 冠名商',
                    prize_pool: data.prize_pool || [],
                    categories: data.categories || [],
                    event_schedule: data.event_schedule || [],
                    social_links: data.social_links || { facebook: '', instagram: '', whatsapp: '' },
                    theme_color: data.theme_color || '#f59e0b',
                });
            }
        } catch (e) {
            console.error('Error loading settings', e);
        } finally {
            setIsLoading(false);
        }
    };

    const loadSubmissions = async () => {
        const { data } = await supabase
            .from('tournament_registrations')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
        if (data) setSubmissions(data);
    };

    // ── Slug uniqueness check ─────────────────────────────────
    const checkSlug = async (slug: string) => {
        if (!slug) { setSlugTaken(false); return; }
        setSlugChecking(true);
        const { data } = await supabase
            .from('tournament_settings')
            .select('project_id')
            .eq('page_slug', slug)
            .neq('project_id', projectId)
            .maybeSingle();
        setSlugTaken(!!data);
        setSlugChecking(false);
    };

    const handleSlugChange = (raw: string) => {
        const slug = toSlug(raw);
        setSettings({ ...settings, page_slug: slug });
        if (slugTimer.current) clearTimeout(slugTimer.current);
        slugTimer.current = setTimeout(() => checkSlug(slug), 500);
    };

    // ── Save (both tabs share the same upsert) ────────────────
    const handleSave = async () => {
        if (slugTaken) { Swal.fire('Slug Taken', 'This URL slug is already used by another event. Choose a different one.', 'warning'); return; }
        try {
            const { error } = await supabase
                .from('tournament_settings')
                .upsert({
                    project_id: projectId,
                    slogan: settings.slogan,
                    logo_url: settings.logo_url,
                    title_sponsor: settings.title_sponsor,
                    title_sponsor_label: settings.title_sponsor_label,
                    sponsors: settings.sponsors,
                    co_organizers: settings.co_organizers,
                    template_type: settings.template_type,
                    fields_config: settings.fields_config,
                    medical_options: settings.medical_options,
                    // Tournament Page
                    page_slug: settings.page_slug || null,
                    theme_color: settings.theme_color,
                    hero_banner_url: settings.hero_banner_url || null,
                    event_description: settings.event_description || null,
                    prize_pool: settings.prize_pool,
                    categories: settings.categories,
                    rules: settings.rules || null,
                    format_description: settings.format_description || null,
                    event_schedule: settings.event_schedule,
                    venue_name: settings.venue_name || null,
                    venue_address: settings.venue_address || null,
                    venue_map_url: settings.venue_map_url || null,
                    social_links: settings.social_links,
                    reg_open_date: settings.reg_open_date || null,
                    reg_close_date: settings.reg_close_date || null,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'project_id' });

            if (error) throw error;
            Swal.fire({ title: 'Saved!', icon: 'success', timer: 1500, showConfirmButton: false, background: '#18181b', color: '#fff' });
        } catch (e: any) {
            Swal.fire('Error', e.message, 'error');
        }
    };

    const publicRegUrl = settings.page_slug
        ? `https://ztoevent.com/register/${settings.page_slug}`
        : projectId ? `https://ztoevent.com/register/${projectId}` : '';

    const publicPageUrl = settings.page_slug
        ? `https://ztoevent.com/t/${settings.page_slug}`
        : '';

    // ── Repeatable list helpers ───────────────────────────────
    const addRow = (field: string, template: object) =>
        setSettings({ ...settings, [field]: [...(settings[field] || []), template] });

    const updateRow = (field: string, idx: number, key: string, val: string) => {
        const arr = [...(settings[field] || [])];
        arr[idx] = { ...arr[idx], [key]: val };
        setSettings({ ...settings, [field]: arr });
    };

    const removeRow = (field: string, idx: number) => {
        const arr = [...(settings[field] || [])];
        arr.splice(idx, 1);
        setSettings({ ...settings, [field]: arr });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Registration Studio</h1>
                    <p className="text-zinc-500">Design your form, build your tournament page & manage submissions</p>
                </div>
            </div>

            {/* ── Tabs ──────────────────────────────────────────────── */}
            <div className="flex gap-1 border-b border-zinc-800 pb-0">
                {[
                    { id: 'settings',    label: 'Design & Settings',  icon: 'fa-sliders' },
                    { id: 'tournament',  label: 'Tournament Page',     icon: 'fa-globe' },
                    { id: 'submissions', label: `Registrations (${submissions.length})`, icon: 'fa-users' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`pb-3 px-5 font-bold text-xs tracking-widest uppercase transition-all flex items-center gap-2 border-b-2 ${
                            activeTab === tab.id
                                ? 'text-amber-500 border-amber-500'
                                : 'text-zinc-500 hover:text-white border-transparent'
                        }`}
                    >
                        <i className={`fa-solid ${tab.icon}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="h-64 flex items-center justify-center text-zinc-500">
                    <i className="fa-solid fa-circle-notch animate-spin mr-3" />Loading...
                </div>
            ) : activeTab === 'settings' ? (
                /* ═══════════════════════════════════════════════════════
                   TAB 1: DESIGN & SETTINGS (original)
                ════════════════════════════════════════════════════════ */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6 bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl shadow-xl">

                        {/* Template */}
                        <div>
                            <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">Registration Template</label>
                            <select
                                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 appearance-none font-bold"
                                value={settings.template_type}
                                onChange={e => setSettings({ ...settings, template_type: e.target.value })}
                            >
                                <option value="guild_team_item">公会团体项目战 (Guild Team Item Battle)</option>
                                <option value="guild_team_semi_free">公会团体半自由战 (Guild Team Semi-free Battle)</option>
                                <option value="business_pro_item">商业职业项目战 (Business Pro Item Battle)</option>
                            </select>
                        </div>

                        {/* Data Collection Fields */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-black tracking-widest uppercase text-zinc-400">Data Collection Fields</label>
                                <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Toggle ON / OFF</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 bg-black/50 p-5 rounded-2xl border border-zinc-800">
                                {[
                                    { key: 'show_team_name', label: 'Team Name' },
                                    { key: 'show_team_dupr_average', label: 'Team Average DUPR' },
                                    { key: 'requires_gender', label: 'Require Gender' },
                                    { key: 'show_ic_passport', label: 'IC / Passport' },
                                    { key: 'show_phone', label: 'Phone Number' },
                                    { key: 'show_email', label: 'Email Address' },
                                    { key: 'show_dupr', label: 'DUPR ID' },
                                    { key: 'show_city_state', label: 'City & State' },
                                    { key: 'show_work_school', label: 'Work / School' },
                                    { key: 'show_emergency_contact', label: 'Emergency Contact' },
                                    { key: 'show_medical', label: 'Medical History' },
                                ].map(field => (
                                    <label key={field.key} className="flex items-center gap-3 cursor-pointer group">
                                        <div
                                            onClick={() => setSettings({ ...settings, fields_config: { ...settings.fields_config, [field.key]: !settings.fields_config[field.key] } })}
                                            className={`w-5 h-5 rounded flex items-center justify-center transition-all ${settings.fields_config[field.key] ? 'bg-amber-500 border-amber-500' : 'bg-zinc-900 border-zinc-700'} border shrink-0`}
                                        >
                                            {settings.fields_config[field.key] && <i className="fa-solid fa-check text-black text-[10px]" />}
                                        </div>
                                        <span className={`text-xs transition-colors uppercase tracking-wider font-bold ${settings.fields_config[field.key] ? 'text-amber-500' : 'text-zinc-500 group-hover:text-zinc-400'}`}>{field.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <AnimatePresence>
                            {settings.fields_config.show_medical && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                    <div className="bg-zinc-950 border border-white/5 p-6 rounded-2xl">
                                        <div className="flex items-center justify-between mb-4">
                                            <label className="text-xs font-black tracking-widest uppercase text-amber-500">Medical Conditions List</label>
                                            <button onClick={() => setSettings({ ...settings, medical_options: [...settings.medical_options, 'New Condition'] })} className="px-3 py-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors">
                                                <i className="fa-solid fa-plus mr-2" />Add Option
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {settings.medical_options.map((opt: string, i: number) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <input value={opt} onChange={e => { const n = [...settings.medical_options]; n[i] = e.target.value; setSettings({ ...settings, medical_options: n }); }} className="flex-1 bg-black border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500" />
                                                    <button onClick={() => setSettings({ ...settings, medical_options: settings.medical_options.filter((_: any, idx: number) => idx !== i) })} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"><i className="fa-solid fa-minus" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Slogan */}
                        <div>
                            <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">Tournament Slogan / Name</label>
                            <input type="text" className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" value={settings.slogan || ''} onChange={e => setSettings({ ...settings, slogan: e.target.value })} placeholder="e.g. Bintulu Inter-Surname Clan Championship" />
                        </div>

                        {/* Logo */}
                        <div className="space-y-3">
                            <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">Tournament Logo URL</label>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 relative">
                                    <input type="text" className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 pr-12" value={settings.logo_url || ''} onChange={e => setSettings({ ...settings, logo_url: e.target.value })} placeholder="Enter URL or upload" />
                                    {settings.logo_url && <img src={settings.logo_url} alt="Logo" className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 object-contain rounded-md bg-white/5 p-1" />}
                                </div>
                                <div className="relative">
                                    <input type="file" accept=".png,.jpeg,.jpg" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={async (e) => {
                                        const file = e.target.files?.[0]; if (!file) return;
                                        Swal.fire({ title: 'Uploading...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                                        try {
                                            const formData = new FormData(); formData.append('file', file); formData.append('project_id', projectId);
                                            const { uploadLogoFile } = await import('@/app/actions/tournament-actions');
                                            const res = await uploadLogoFile(formData);
                                            if (res.success) { setSettings({ ...settings, logo_url: res.url }); Swal.close(); }
                                            else throw new Error(res.error || 'Upload failed');
                                        } catch (err: any) { Swal.fire('Upload Failed', err.message, 'error'); }
                                    }} />
                                    <button type="button" className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl transition-colors shrink-0">
                                        <i className="fa-solid fa-upload lg:mr-2" /><span className="hidden lg:inline">Upload</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Sponsor */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-zinc-800/50">
                            <div>
                                <label className="block text-[10px] font-black tracking-widest uppercase text-amber-500 mb-2">Label for Sponsor Field</label>
                                <input type="text" className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" value={settings.title_sponsor_label || ''} onChange={e => setSettings({ ...settings, title_sponsor_label: e.target.value })} placeholder="e.g. Official Sponsorship" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-400 mb-2">Sponsor Name / 赞助商名字</label>
                                <input type="text" className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" value={settings.title_sponsor || ''} onChange={e => setSettings({ ...settings, title_sponsor: e.target.value })} placeholder="Enter Name" />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-800 text-right">
                            <button onClick={handleSave} className="bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest px-8 py-3 rounded-xl transition-colors shadow-lg shadow-amber-500/20">
                                Save Settings
                            </button>
                        </div>
                    </div>

                    {/* QR + Link sidebar */}
                    <div className="space-y-6">
                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-xl text-center">
                            <h3 className="text-sm font-black tracking-widest uppercase text-zinc-400 mb-6">Scan to Register</h3>
                            <div className="bg-white p-4 rounded-2xl inline-block mx-auto mb-6">
                                <QRCodeSVG value={publicRegUrl || 'placeholder'} size={160} />
                            </div>
                            <div className="text-left space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-2">Registration URL</label>
                                    <div className="flex gap-2">
                                        <input type="text" readOnly value={publicRegUrl} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300" />
                                        <button onClick={() => { navigator.clipboard.writeText(publicRegUrl); Swal.fire({ title: 'Copied!', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, background: '#18181b', color: '#fff' }); }} className="bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg text-zinc-300">
                                            <i className="fa-solid fa-copy" />
                                        </button>
                                    </div>
                                </div>
                                {publicPageUrl && (
                                    <div>
                                        <label className="block text-[10px] font-black tracking-widest uppercase text-amber-500 mb-2">Tournament Info Page</label>
                                        <Link href={publicPageUrl} target="_blank" className="flex items-center gap-2 w-full bg-zinc-950 border border-amber-500/20 rounded-lg px-4 py-3 hover:bg-zinc-800 transition-colors group text-xs font-bold text-white">
                                            <i className="fa-solid fa-globe text-amber-500" />
                                            <span className="truncate flex-1">{publicPageUrl}</span>
                                            <i className="fa-solid fa-external-link text-zinc-500 group-hover:text-amber-500 transition-colors" />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            ) : activeTab === 'tournament' ? (
                /* ═══════════════════════════════════════════════════════
                   TAB 2: TOURNAMENT PAGE BUILDER
                ════════════════════════════════════════════════════════ */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">

                        {/* ── URL Slug ─────────────────────────────── */}
                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                            <label className="block text-xs font-black tracking-widest uppercase text-amber-500 mb-1">Public URL Slug</label>
                            <p className="text-zinc-500 text-xs mb-4">Short readable ID (max 10 chars). e.g. <span className="text-amber-400 font-bold">sipc2026</span> → ztoevent.com/t/sipc2026</p>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold pointer-events-none">ztoevent.com/t/</span>
                                <input
                                    type="text"
                                    className={`w-full bg-black border rounded-xl pl-[138px] pr-12 py-3 text-white font-bold focus:outline-none transition-colors ${slugTaken ? 'border-red-500' : settings.page_slug ? 'border-emerald-500/60' : 'border-zinc-800 focus:border-amber-500'}`}
                                    value={settings.page_slug || ''}
                                    onChange={e => handleSlugChange(e.target.value)}
                                    placeholder="sipc2026"
                                    maxLength={10}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold">
                                    {slugChecking ? <i className="fa-solid fa-circle-notch animate-spin text-zinc-500" /> :
                                     slugTaken ? <i className="fa-solid fa-xmark text-red-500" title="Slug taken" /> :
                                     settings.page_slug ? <i className="fa-solid fa-check text-emerald-500" title="Available" /> : null}
                                </span>
                            </div>
                            {slugTaken && <p className="text-red-400 text-xs mt-2 font-bold"><i className="fa-solid fa-triangle-exclamation mr-1" />This slug is already taken. Choose another.</p>}

                            {/* Registration date window */}
                            <div className="grid grid-cols-2 gap-4 mt-5">
                                <div>
                                    <label className="block text-[9px] font-black tracking-widest uppercase text-zinc-500 mb-2">Registration Opens</label>
                                    <input type="date" value={settings.reg_open_date?.split('T')[0] || ''} onChange={e => setSettings({ ...settings, reg_open_date: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500" />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black tracking-widest uppercase text-zinc-500 mb-2">Registration Closes</label>
                                    <input type="date" value={settings.reg_close_date?.split('T')[0] || ''} onChange={e => setSettings({ ...settings, reg_close_date: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500" />
                                </div>
                            </div>
                        </div>

                        {/* ── Theme Color ──────────────────────────── */}
                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                            <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-4">Page Theme Color</label>
                            <div className="flex flex-wrap gap-3 mb-4">
                                {THEME_PRESETS.map(p => (
                                    <button
                                        key={p.value}
                                        title={p.label}
                                        onClick={() => setSettings({ ...settings, theme_color: p.value })}
                                        className={`w-10 h-10 rounded-xl transition-all hover:scale-110 ${settings.theme_color === p.value ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110' : ''}`}
                                        style={{ backgroundColor: p.value }}
                                    />
                                ))}
                                <div className="relative">
                                    <input
                                        type="color"
                                        value={settings.theme_color || '#f59e0b'}
                                        onChange={e => setSettings({ ...settings, theme_color: e.target.value })}
                                        className="w-10 h-10 rounded-xl cursor-pointer opacity-0 absolute inset-0"
                                    />
                                    <div className="w-10 h-10 rounded-xl border-2 border-dashed border-zinc-600 flex items-center justify-center text-zinc-500 text-xs hover:border-white/40 transition-colors">
                                        <i className="fa-solid fa-plus" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: settings.theme_color }} />
                                <span className="text-zinc-400 font-mono text-sm">{settings.theme_color}</span>
                                <div className="flex-1 h-6 rounded-full" style={{ background: `linear-gradient(to right, ${settings.theme_color}20, ${settings.theme_color})` }} />
                            </div>
                        </div>

                        {/* ── Hero Banner ──────────────────────────── */}
                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                            <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">Hero Banner Image</label>
                            <p className="text-zinc-500 text-xs mb-4">Full-width background for the top of your tournament page. Recommended: 1920×1080px.</p>
                            <ImageUploadField
                                value={settings.hero_banner_url || ''}
                                onChange={v => setSettings({ ...settings, hero_banner_url: v })}
                                bucket="tournament-banners"
                                folder={projectId}
                                placeholder="https://... (paste URL or upload)"
                                preview="banner"
                            />
                        </div>

                        {/* ── Event Description ────────────────────── */}
                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                            <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">Event Description</label>
                            <textarea rows={4} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 resize-none text-sm leading-relaxed" value={settings.event_description || ''} onChange={e => setSettings({ ...settings, event_description: e.target.value })} placeholder="Describe your tournament — who it's for, what makes it special…" />
                        </div>

                        {/* ── Prize Pool ───────────────────────────── */}
                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-xs font-black tracking-widest uppercase text-zinc-400">Prize Pool</label>
                                <button onClick={() => addRow('prize_pool', { category: '', amount: '', currency: 'RM' })} className="px-3 py-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors">
                                    <i className="fa-solid fa-plus mr-1" />Add Category
                                </button>
                            </div>
                            <div className="space-y-3">
                                {settings.prize_pool.map((prize: any, i: number) => (
                                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                                        <input className="col-span-5 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" value={prize.category} onChange={e => updateRow('prize_pool', i, 'category', e.target.value)} placeholder="Category (e.g. Men's Doubles)" />
                                        <select className="col-span-2 bg-black border border-zinc-800 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-amber-500 appearance-none" value={prize.currency} onChange={e => updateRow('prize_pool', i, 'currency', e.target.value)}>
                                            <option value="RM">RM</option>
                                            <option value="USD">USD</option>
                                            <option value="SGD">SGD</option>
                                        </select>
                                        <input type="number" className="col-span-4 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" value={prize.amount} onChange={e => updateRow('prize_pool', i, 'amount', e.target.value)} placeholder="Amount" />
                                        <button onClick={() => removeRow('prize_pool', i)} className="col-span-1 w-8 h-9 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"><i className="fa-solid fa-minus text-xs" /></button>
                                    </div>
                                ))}
                                {settings.prize_pool.length === 0 && <p className="text-zinc-600 text-xs italic">No prize categories added yet.</p>}
                            </div>
                        </div>

                        {/* ── Categories / Divisions ───────────────── */}
                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-xs font-black tracking-widest uppercase text-zinc-400">Categories / Divisions</label>
                                <button onClick={() => addRow('categories', { name: '', description: '', open_to: '' })} className="px-3 py-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors">
                                    <i className="fa-solid fa-plus mr-1" />Add Category
                                </button>
                            </div>
                            <div className="space-y-4">
                                {settings.categories.map((cat: any, i: number) => (
                                    <div key={i} className="bg-black/50 border border-zinc-800 rounded-xl p-4 space-y-2">
                                        <div className="grid grid-cols-3 gap-2">
                                            <input className="col-span-2 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" value={cat.name} onChange={e => updateRow('categories', i, 'name', e.target.value)} placeholder="Category name (e.g. Men's Open)" />
                                            <input className="bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" value={cat.open_to} onChange={e => updateRow('categories', i, 'open_to', e.target.value)} placeholder="Open to (e.g. M)" />
                                        </div>
                                        <div className="flex gap-2">
                                            <input className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500" value={cat.description} onChange={e => updateRow('categories', i, 'description', e.target.value)} placeholder="Short description…" />
                                            <button onClick={() => removeRow('categories', i)} className="w-9 h-9 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors shrink-0"><i className="fa-solid fa-minus text-xs" /></button>
                                        </div>
                                    </div>
                                ))}
                                {settings.categories.length === 0 && <p className="text-zinc-600 text-xs italic">No categories added yet.</p>}
                            </div>
                        </div>

                        {/* ── Format & Rules ───────────────────────── */}
                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">Tournament Format</label>
                                    <textarea rows={6} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 resize-none text-sm leading-relaxed" value={settings.format_description || ''} onChange={e => setSettings({ ...settings, format_description: e.target.value })} placeholder="e.g. Group stage → Knockout. Each group has 4 teams. Top 2 advance…" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">Rules</label>
                                    <textarea rows={6} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 resize-none text-sm leading-relaxed" value={settings.rules || ''} onChange={e => setSettings({ ...settings, rules: e.target.value })} placeholder="List your tournament rules here…" />
                                </div>
                            </div>
                        </div>

                        {/* ── Schedule ─────────────────────────────── */}
                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-xs font-black tracking-widest uppercase text-zinc-400">Event Schedule</label>
                                <button onClick={() => addRow('event_schedule', { date: '', label: '', time_start: '', time_end: '', notes: '' })} className="px-3 py-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors">
                                    <i className="fa-solid fa-plus mr-1" />Add Day
                                </button>
                            </div>
                            <div className="space-y-4">
                                {settings.event_schedule.map((day: any, i: number) => (
                                    <div key={i} className="bg-black/50 border border-zinc-800 rounded-xl p-4 space-y-2">
                                        <div className="grid grid-cols-12 gap-2">
                                            <input type="date" className="col-span-3 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" value={day.date} onChange={e => updateRow('event_schedule', i, 'date', e.target.value)} />
                                            <input className="col-span-5 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" value={day.label} onChange={e => updateRow('event_schedule', i, 'label', e.target.value)} placeholder="Label (e.g. Group Stage)" />
                                            <input type="time" className="col-span-2 bg-black border border-zinc-800 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-amber-500" value={day.time_start} onChange={e => updateRow('event_schedule', i, 'time_start', e.target.value)} />
                                            <input type="time" className="col-span-2 bg-black border border-zinc-800 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-amber-500" value={day.time_end} onChange={e => updateRow('event_schedule', i, 'time_end', e.target.value)} />
                                        </div>
                                        <div className="flex gap-2">
                                            <input className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500" value={day.notes} onChange={e => updateRow('event_schedule', i, 'notes', e.target.value)} placeholder="Notes (optional)" />
                                            <button onClick={() => removeRow('event_schedule', i)} className="w-9 h-9 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors shrink-0"><i className="fa-solid fa-minus text-xs" /></button>
                                        </div>
                                    </div>
                                ))}
                                {settings.event_schedule.length === 0 && <p className="text-zinc-600 text-xs italic">No schedule days added yet.</p>}
                            </div>
                        </div>

                        {/* ── Venue ──────────────────────────────────── */}
                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                            <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-4">Venue</label>
                            <div className="space-y-3">
                                <input type="text" className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" value={settings.venue_name || ''} onChange={e => setSettings({ ...settings, venue_name: e.target.value })} placeholder="Venue Name (e.g. Parkcity Everly Hotel)" />
                                <textarea rows={2} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 resize-none text-sm" value={settings.venue_address || ''} onChange={e => setSettings({ ...settings, venue_address: e.target.value })} placeholder="Full address…" />
                                <input type="url" className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" value={settings.venue_map_url || ''} onChange={e => setSettings({ ...settings, venue_map_url: e.target.value })} placeholder="Google Maps link (https://maps.app.goo.gl/...)" />
                            </div>
                        </div>

                        {/* ── Social Links ────────────────────────── */}
                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                            <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-4">Social Links</label>
                            <div className="space-y-3">
                                {[
                                    { key: 'facebook', icon: 'fa-facebook', placeholder: 'https://facebook.com/...' },
                                    { key: 'instagram', icon: 'fa-instagram', placeholder: 'https://instagram.com/...' },
                                    { key: 'whatsapp', icon: 'fa-whatsapp', placeholder: 'Phone number e.g. 601134567890' },
                                ].map(s => (
                                    <div key={s.key} className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                                            <i className={`fa-brands ${s.icon} text-zinc-400`} />
                                        </div>
                                        <input
                                            type="text"
                                            className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                                            value={settings.social_links?.[s.key] || ''}
                                            onChange={e => setSettings({ ...settings, social_links: { ...settings.social_links, [s.key]: e.target.value } })}
                                            placeholder={s.placeholder}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="text-right pt-2">
                            <button onClick={handleSave} className="bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest px-10 py-3 rounded-xl transition-colors shadow-lg shadow-amber-500/20">
                                <i className="fa-solid fa-floppy-disk mr-2" />Save Tournament Page
                            </button>
                        </div>
                    </div>

                    {/* Preview sidebar */}
                    <div className="space-y-4">
                        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl sticky top-24">
                            <h3 className="text-xs font-black tracking-widest uppercase text-zinc-400 mb-4">Preview Links</h3>

                            {publicPageUrl ? (
                                <>
                                    <div className="mb-4">
                                        <div className="bg-white p-3 rounded-xl inline-block mx-auto w-full flex justify-center mb-3">
                                            <QRCodeSVG value={publicPageUrl} size={130} />
                                        </div>
                                        <Link href={publicPageUrl} target="_blank" className="flex items-center gap-2 w-full bg-black border border-amber-500/30 rounded-xl px-4 py-3 text-xs font-bold text-amber-400 hover:bg-zinc-900 transition-colors group">
                                            <i className="fa-solid fa-globe" />
                                            <span className="truncate flex-1">{publicPageUrl}</span>
                                            <i className="fa-solid fa-external-link text-zinc-600 group-hover:text-amber-500 transition-colors" />
                                        </Link>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black tracking-widest uppercase text-zinc-600 mb-2">Registration URL</p>
                                        <div className="flex gap-2">
                                            <div className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-[10px] text-zinc-400 truncate">{publicRegUrl}</div>
                                            <button onClick={() => { navigator.clipboard.writeText(publicRegUrl); Swal.fire({ title: 'Copied!', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, background: '#18181b', color: '#fff' }); }} className="bg-zinc-800 hover:bg-zinc-700 px-2 py-1.5 rounded-lg text-zinc-300">
                                                <i className="fa-solid fa-copy text-xs" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 text-zinc-600">
                                    <i className="fa-solid fa-link-slash text-2xl mb-3 block" />
                                    <p className="text-xs font-bold">Enter a slug above to generate your public links.</p>
                                </div>
                            )}

                            {/* Theme preview */}
                            <div className="mt-5 pt-5 border-t border-zinc-800">
                                <p className="text-[9px] font-black tracking-widest uppercase text-zinc-600 mb-3">Theme Preview</p>
                                <div className="rounded-xl overflow-hidden text-[10px]" style={{ background: '#0a0a0a' }}>
                                    <div className="h-1 w-full" style={{ background: settings.theme_color }} />
                                    <div className="p-3">
                                        <div className="font-black text-white text-xs mb-1">{settings.slogan || 'Tournament Name'}</div>
                                        <div className="font-bold" style={{ color: settings.theme_color }}>Prize Pool · Categories · Schedule</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            ) : (
                /* ═══════════════════════════════════════════════════════
                   TAB 3: REGISTRATIONS
                ════════════════════════════════════════════════════════ */
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto p-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-800 bg-black/50">
                                    <th className="px-6 py-4 text-[10px] font-black tracking-widest uppercase text-zinc-500">Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black tracking-widest uppercase text-zinc-500">Organization (公会)</th>
                                    <th className="px-6 py-4 text-[10px] font-black tracking-widest uppercase text-zinc-500">Captain</th>
                                    <th className="px-6 py-4 text-[10px] font-black tracking-widest uppercase text-zinc-500">Pairs</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-600 font-medium">No registrations received yet.</td></tr>
                                ) : (
                                    submissions.map(sub => (
                                        <tr key={sub.id} className="border-b border-zinc-800/50 hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 text-xs text-zinc-400">{new Date(sub.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-white">{sub.organization_name}</td>
                                            <td className="px-6 py-4"><div className="text-sm text-zinc-200">{sub.captain_name}</div><div className="text-xs text-zinc-500">{sub.captain_role}</div></td>
                                            <td className="px-6 py-4 text-sm text-zinc-400">{sub.players?.length / 2 || 0} Pairs</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
