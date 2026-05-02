'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import Swal from 'sweetalert2';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageUploadField } from '@/app/components/ImageUploadField';
import { PrintReportButton } from '../../components/ProjectModals';
import { PrintBreakTrigger } from '../../components/PrintBreakTrigger';
import { usePrint } from '../../components/PrintContext';

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
    const [isLinking, setIsLinking] = useState(false);
    const [slugTaken, setSlugTaken] = useState(false);
    const [slugChecking, setSlugChecking] = useState(false);
    const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { pageBreakIds, layoutType } = usePrint();

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

    const handleLinkArena = async () => {
        const { value: tournamentId } = await Swal.fire({
            title: 'Link to Arena Tournament',
            input: 'text',
            inputLabel: 'Enter Tournament ID',
            inputValue: settings.linked_tournament_id || '',
            showCancelButton: true,
            background: '#18181b',
            color: '#fff',
            confirmButtonColor: '#f59e0b',
            inputPlaceholder: '00000000-0000-0000-0000-000000000000'
        });

        if (tournamentId) {
            setIsLinking(true);
            try {
                const { linkTournamentToProject } = await import('@/app/actions/tournament-actions');
                const res = await linkTournamentToProject(tournamentId, projectId);
                if (res.success) {
                    setSettings({ ...settings, linked_tournament_id: tournamentId });
                    Swal.fire('Linked!', 'Tournament successfully associated with this project.', 'success');
                } else {
                    Swal.fire('Failed', res.error, 'error');
                }
            } catch (e: any) {
                Swal.fire('Error', e.message, 'error');
            } finally {
                setIsLinking(false);
            }
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
        <div className="space-y-10">
            {/* Action Floating Group */}
            <div className="print:hidden fixed top-6 right-8 z-[9999] pointer-events-auto flex items-center gap-3 bg-[#050505]/90 backdrop-blur-xl border border-[#0056B3]/40 p-2 rounded-2xl shadow-[0_8px_32px_rgba(0,86,179,0.2)]">
                {activeTab === 'submissions' && (
                    <div className="px-2 border-r border-white/10 mr-2">
                        <PrintReportButton title="Registration Submissions" />
                    </div>
                )}
                <button onClick={handleSave} className="btn-royal h-10 px-6 shadow-[0_0_15px_rgba(0,86,179,0.3)]">
                    <i className="fa-solid fa-save text-[10px]" /> SAVE SETTINGS
                </button>
            </div>

            {/* Page Header */}
            <div className="print:hidden flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                <div className="flex flex-col">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0056B3] mb-2">Project Registration</p>
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none font-['Urbanist']">
                        Registration Studio
                    </h1>
                    <p className="text-zinc-500 text-sm mt-3 font-medium tracking-wide">Design your form, build tournament page & manage submissions</p>
                </div>

                {/* ── Stats + Actions Hub ── */}
                <div className="flex flex-wrap items-center gap-4">
                    {/* Premium Stats Pill */}
                    <div className="h-12 px-6 flex items-center gap-6 rounded-2xl bg-[#050505] border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#DEFF9A] shadow-[0_0_10px_rgba(222,255,154,0.5)]" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Total Teams</span>
                            <span className="text-xs font-black text-[#DEFF9A] font-mono ml-2">{submissions.length}</span>
                        </div>
                        <div className="w-px h-4 bg-white/10" />
                        <div className="flex items-center gap-2">
                            <i className="fa-solid fa-users text-[10px] text-[#0056B3]"></i>
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Total Players</span>
                            <span className="text-xs font-black text-white font-mono ml-2">
                                {submissions.reduce((acc, sub) => acc + (sub.players?.length || 0), 0)}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={handleSave} className="h-12 px-6 rounded-2xl bg-[#0056B3] text-white font-black text-xs tracking-widest uppercase shadow-[0_0_20px_rgba(0,86,179,0.4)] hover:shadow-[0_0_30px_rgba(0,86,179,0.8)] transition-all flex items-center gap-2.5 hover:-translate-y-0.5 active:translate-y-0">
                            <i className="fa-solid fa-save text-lg" /> Save
                        </button>
                        {activeTab === 'submissions' && (
                            <PrintReportButton title="Registration Submissions" />
                        )}
                    </div>
                </div>
            </div>

            {/* ── Tabs ──────────────────────────────────────────────── */}
            <div className="flex gap-2 border-b border-white/5 pb-0 mb-8">
                {[
                    { id: 'settings',    label: 'Design & Settings',  icon: 'fa-sliders' },
                    { id: 'tournament',  label: 'Tournament Page',     icon: 'fa-globe' },
                    { id: 'submissions', label: `Registrations (${submissions.length})`, icon: 'fa-users' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`pb-4 px-6 font-black text-[10px] tracking-widest uppercase transition-all flex items-center gap-2.5 border-b-2 ${
                            activeTab === tab.id
                                ? 'text-[#0056B3] border-[#0056B3]'
                                : 'text-zinc-500 hover:text-white border-transparent'
                        }`}
                    >
                        <i className={`fa-solid ${tab.icon} text-xs`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center text-zinc-500">
                    <i className="fa-solid fa-circle-notch animate-spin text-3xl mb-4 text-[#0056B3]" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Loading Studio...</p>
                </div>
            ) : activeTab === 'settings' ? (
                /* ═══════════════════════════════════════════════════════
                   TAB 1: DESIGN & SETTINGS
                ════════════════════════════════════════════════════════ */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white/[0.03] border border-white/5 backdrop-blur-xl p-8 rounded-[32px] space-y-8">
                            {/* Template */}
                            <div>
                                <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-3">Registration Template</label>
                                <select
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#0056B3]/50 focus:ring-1 focus:ring-[#0056B3]/30 font-bold text-sm appearance-none cursor-pointer"
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
                                <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-4">Data Collection Fields</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                        <div 
                                            key={field.key} 
                                            onClick={() => setSettings({ ...settings, fields_config: { ...settings.fields_config, [field.key]: !settings.fields_config[field.key] } })}
                                            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${settings.fields_config[field.key] ? 'bg-[#0056B3]/5 border-[#0056B3]/30' : 'bg-black/20 border-white/5 hover:border-white/10'}`}
                                        >
                                            <span className={`text-[11px] font-black uppercase tracking-wider ${settings.fields_config[field.key] ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-400'}`}>{field.label}</span>
                                            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${settings.fields_config[field.key] ? 'bg-[#0056B3] border-[#0056B3] text-white' : 'border-white/10 text-transparent'}`}>
                                                <i className="fa-solid fa-check text-[10px]" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Medical options - same logic just cleaner UI */}
                            <AnimatePresence>
                                {settings.fields_config.show_medical && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                        <div className="bg-black/20 border border-white/5 p-6 rounded-2xl">
                                            <div className="flex items-center justify-between mb-4">
                                                <label className="text-[9px] font-black tracking-widest uppercase text-[#4da3ff]">Medical Conditions List</label>
                                                <button onClick={() => setSettings({ ...settings, medical_options: [...settings.medical_options, 'New Condition'] })} className="px-3 py-1.5 bg-[#0056B3]/10 text-[#4da3ff] hover:bg-[#0056B3] hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors">
                                                    <i className="fa-solid fa-plus mr-2" />Add Option
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                {settings.medical_options.map((opt: string, i: number) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <input value={opt} onChange={e => { const n = [...settings.medical_options]; n[i] = e.target.value; setSettings({ ...settings, medical_options: n }); }} className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#0056B3]/40" />
                                                        <button onClick={() => setSettings({ ...settings, medical_options: settings.medical_options.filter((_: any, idx: number) => idx !== i) })} className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"><i className="fa-solid fa-minus" /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Slogan & Branding */}
                            <div className="space-y-6 pt-4 border-t border-white/5">
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-3">Tournament Slogan / Name</label>
                                    <input type="text" className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold text-sm focus:outline-none focus:border-[#0056B3]/40" value={settings.slogan || ''} onChange={e => setSettings({ ...settings, slogan: e.target.value })} placeholder="e.g. Bintulu Inter-Surname Clan Championship" />
                                </div>

                                <ImageUploadField
                                    label="Tournament Logo"
                                    value={settings.logo_url || ''}
                                    onChange={v => setSettings({ ...settings, logo_url: v })}
                                    bucket="logo"
                                    folder={projectId}
                                    placeholder="Enter URL or upload"
                                    preview="thumbnail"
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-2">Sponsor Label</label>
                                        <input type="text" className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-white text-xs focus:outline-none focus:border-[#0056B3]/40" value={settings.title_sponsor_label || ''} onChange={e => setSettings({ ...settings, title_sponsor_label: e.target.value })} placeholder="e.g. Official Sponsorship" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-2">Sponsor Name</label>
                                        <input type="text" className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-white text-xs focus:outline-none focus:border-[#0056B3]/40" value={settings.title_sponsor || ''} onChange={e => setSettings({ ...settings, title_sponsor: e.target.value })} placeholder="Enter Name" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* QR + Link sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white/[0.03] border border-white/5 backdrop-blur-xl p-8 rounded-[32px] text-center shadow-xl">
                            <h3 className="text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-8">Scan to Register</h3>
                            <div className="bg-white p-5 rounded-3xl inline-block mx-auto mb-8 shadow-2xl">
                                <QRCodeSVG value={publicRegUrl || 'placeholder'} size={180} />
                            </div>
                            <div className="text-left space-y-5">
                                <div>
                                    <label className="block text-[9px] font-black tracking-widest uppercase text-zinc-600 mb-2">Registration URL</label>
                                    <div className="flex gap-2">
                                        <input type="text" readOnly value={publicRegUrl} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[10px] text-zinc-400 font-mono" />
                                        <button onClick={() => { navigator.clipboard.writeText(publicRegUrl); Swal.fire({ title: 'Copied!', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, background: '#18181b', color: '#fff' }); }} className="h-11 w-11 bg-zinc-900 border border-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors flex items-center justify-center shrink-0">
                                            <i className="fa-solid fa-copy" />
                                        </button>
                                    </div>
                                </div>
                                {publicPageUrl && (
                                    <Link href={publicPageUrl} target="_blank" className="flex items-center gap-3 w-full bg-[#0056B3]/5 border border-[#0056B3]/20 rounded-2xl px-5 py-4 hover:bg-[#0056B3]/10 transition-all group">
                                        <i className="fa-solid fa-globe text-[#4da3ff] text-base" />
                                        <div className="flex-1 overflow-hidden">
                                            <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Info Page</div>
                                            <div className="text-[11px] font-bold text-white truncate">{publicPageUrl}</div>
                                        </div>
                                        <i className="fa-solid fa-external-link text-zinc-600 group-hover:text-[#4da3ff] transition-colors" />
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Arena Connection */}
                        <div className="bg-white/[0.03] border border-white/5 backdrop-blur-xl p-8 rounded-[32px]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-[#0056B3]/10 border border-[#0056B3]/20 rounded-xl flex items-center justify-center text-[#4da3ff]">
                                    <i className="fa-solid fa-link" />
                                </div>
                                <h3 className="text-[10px] font-black tracking-widest uppercase text-white">Arena Sync</h3>
                            </div>
                            
                            {settings.linked_tournament_id ? (
                                <div className="space-y-4">
                                    <div className="bg-[#0056B3]/5 border border-[#0056B3]/20 p-5 rounded-2xl">
                                        <div className="text-[9px] font-black uppercase text-[#4da3ff] mb-2 tracking-[0.2em]">CONNECTED</div>
                                        <div className="text-[10px] text-zinc-400 font-mono truncate">{settings.linked_tournament_id}</div>
                                    </div>
                                    <button 
                                        onClick={handleLinkArena}
                                        disabled={isLinking}
                                        className="w-full h-12 bg-zinc-900 border border-white/5 text-zinc-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        Switch Connection
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={handleLinkArena}
                                    disabled={isLinking}
                                    className="w-full py-8 border-2 border-dashed border-white/5 hover:border-[#0056B3]/40 hover:bg-[#0056B3]/5 text-zinc-600 hover:text-[#4da3ff] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-3"
                                >
                                    <i className="fa-solid fa-circle-plus text-2xl" />
                                    {isLinking ? 'Linking...' : 'Link Arena Tournament'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

            ) : activeTab === 'tournament' ? (
                /* ═══════════════════════════════════════════════════════
                   TAB 2: TOURNAMENT PAGE BUILDER
                ════════════════════════════════════════════════════════ */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white/[0.03] border border-white/5 backdrop-blur-xl p-8 rounded-[32px] space-y-10">
                            {/* URL Slug */}
                            <div>
                                <label className="block text-[10px] font-black tracking-widest uppercase text-[#0056B3] mb-2">Public URL Slug</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 text-sm font-bold pointer-events-none">ztoevent.com/t/</span>
                                    <input
                                        type="text"
                                        className={`w-full bg-black/40 border rounded-2xl pl-[138px] pr-12 py-4 text-white font-black text-sm focus:outline-none transition-all ${slugTaken ? 'border-red-500' : settings.page_slug ? 'border-[#0056B3]/40' : 'border-white/5 focus:border-[#0056B3]/40'}`}
                                        value={settings.page_slug || ''}
                                        onChange={e => handleSlugChange(e.target.value)}
                                        placeholder="sipc2026"
                                        maxLength={10}
                                    />
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                        {slugChecking ? <i className="fa-solid fa-circle-notch animate-spin text-zinc-500" /> :
                                         slugTaken ? <i className="fa-solid fa-circle-xmark text-red-500" /> :
                                         settings.page_slug ? <i className="fa-solid fa-circle-check text-emerald-500" /> : null}
                                    </div>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-3">Registration Opens</label>
                                    <input type="date" value={settings.reg_open_date?.split('T')[0] || ''} onChange={e => setSettings({ ...settings, reg_open_date: e.target.value })} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-[#0056B3]/40" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-3">Registration Closes</label>
                                    <input type="date" value={settings.reg_close_date?.split('T')[0] || ''} onChange={e => setSettings({ ...settings, reg_close_date: e.target.value })} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-[#0056B3]/40" />
                                </div>
                            </div>

                            {/* Theme & Banner */}
                            <div className="space-y-6 pt-10 border-t border-white/5">
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-4">Branding Theme Color</label>
                                    <div className="flex flex-wrap gap-3">
                                        {THEME_PRESETS.map(p => (
                                            <button key={p.value} onClick={() => setSettings({ ...settings, theme_color: p.value })} className={`w-11 h-11 rounded-xl transition-all hover:scale-110 ${settings.theme_color === p.value ? 'ring-2 ring-white ring-offset-4 ring-offset-black scale-110' : 'opacity-60 hover:opacity-100'}`} style={{ backgroundColor: p.value }} />
                                        ))}
                                        <div className="relative w-11 h-11 rounded-xl border-2 border-dashed border-zinc-800 flex items-center justify-center text-zinc-600 hover:border-white/20 transition-all cursor-pointer">
                                            <input type="color" value={settings.theme_color || '#0056B3'} onChange={e => setSettings({ ...settings, theme_color: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            <i className="fa-solid fa-plus text-xs" />
                                        </div>
                                    </div>
                                </div>

                                <ImageUploadField
                                    label="Hero Banner Image"
                                    value={settings.hero_banner_url || ''}
                                    onChange={v => setSettings({ ...settings, hero_banner_url: v })}
                                    bucket="tournament-banners"
                                    folder={projectId}
                                    placeholder="Upload high-res banner (1920x1080)"
                                    preview="banner"
                                />
                            </div>
                        </div>

                        {/* Event Details Content */}
                        <div className="bg-white/[0.03] border border-white/5 backdrop-blur-xl p-8 rounded-[32px] space-y-8">
                            <div>
                                <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-4">Event Description</label>
                                <textarea rows={6} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#0056B3]/40 resize-none text-sm leading-relaxed" value={settings.event_description || ''} onChange={e => setSettings({ ...settings, event_description: e.target.value })} placeholder="Describe your tournament — mission, vibe, expectations…" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-4">Rules & Regulations</label>
                                    <textarea rows={8} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#0056B3]/40 text-xs leading-relaxed" value={settings.rules || ''} onChange={e => setSettings({ ...settings, rules: e.target.value })} placeholder="Enter formal rules list…" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-4">Tournament Format</label>
                                    <textarea rows={8} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#0056B3]/40 text-xs leading-relaxed" value={settings.format_description || ''} onChange={e => setSettings({ ...settings, format_description: e.target.value })} placeholder="Explain stages, groups, scoring…" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white/[0.03] border border-white/5 backdrop-blur-xl p-8 rounded-[32px] sticky top-24 shadow-xl">
                            <h3 className="text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-8">Page Preview</h3>

                            {publicPageUrl ? (
                                <div className="space-y-8">
                                    <div className="bg-white p-5 rounded-3xl inline-block mx-auto w-full flex justify-center shadow-2xl">
                                        <QRCodeSVG value={publicPageUrl} size={160} />
                                    </div>
                                    <Link href={publicPageUrl} target="_blank" className="flex items-center gap-3 w-full bg-[#0056B3] text-white rounded-2xl px-6 py-4 font-black text-[10px] tracking-widest uppercase shadow-lg shadow-blue-900/20 hover:scale-[1.02] transition-all">
                                        <i className="fa-solid fa-external-link" />
                                        Launch Public Page
                                    </Link>
                                    <div className="pt-8 border-t border-white/5">
                                        <p className="text-[9px] font-black tracking-widest uppercase text-zinc-600 mb-4">Registration Link</p>
                                        <div className="flex gap-2">
                                            <div className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[10px] text-zinc-400 truncate font-mono">{publicRegUrl}</div>
                                            <button onClick={() => { navigator.clipboard.writeText(publicRegUrl); Swal.fire({ title: 'Copied!', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, background: '#18181b', color: '#fff' }); }} className="h-11 w-11 bg-zinc-900 border border-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors flex items-center justify-center shrink-0">
                                                <i className="fa-solid fa-copy" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-zinc-700">
                                    <i className="fa-solid fa-link-slash text-3xl mb-4 block opacity-20" />
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-loose">Enter a URL slug<br/>to activate preview</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            ) : (
                /* ═══════════════════════════════════════════════════════
                   TAB 3: REGISTRATIONS (Card Grid Refactor)
                ════════════════════════════════════════════════════════ */
                <div className="flex flex-col gap-4">
                    {submissions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-[32px] bg-white/[0.02]">
                            <i className="fa-solid fa-users text-5xl text-zinc-800 mb-6" />
                            <h3 className="text-lg font-black text-zinc-600 uppercase tracking-widest">No Submissions Yet</h3>
                            <p className="text-zinc-700 text-[10px] font-black uppercase mt-2 tracking-widest">Waiting for participants to sign up...</p>
                        </div>
                    ) : (
                        <>
                        <div className={layoutType === 'table' ? 'print:hidden' : ''}>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {submissions.map(sub => (
                                <div 
                                    key={sub.id} 
                                    className={`bg-white/[0.03] border border-white/5 p-6 rounded-[24px] hover:border-[#0056B3]/40 hover:shadow-[0_8px_32px_rgba(0,86,179,0.15)] transition-all flex flex-col justify-between group ${pageBreakIds.includes(sub.id) ? 'print:break-before-page' : ''}`}
                                >
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                                                {new Date(sub.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-[#0056B3]/10 flex items-center justify-center text-[#4da3ff] opacity-0 group-hover:opacity-100 transition-opacity">
                                                <i className="fa-solid fa-chevron-right text-[10px]" />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <div className="text-[10px] font-black text-[#0056B3] uppercase tracking-[0.2em] mb-1">Organization</div>
                                            <h4 className="text-lg font-black text-white leading-tight uppercase font-['Urbanist']">
                                                {sub.organization_name}
                                            </h4>
                                        </div>

                                        <div className="flex items-center gap-4 py-4 border-y border-white/5">
                                            <div className="flex-1">
                                                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Captain</div>
                                                <div className="text-xs font-bold text-zinc-300">{sub.captain_name}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Pairs</div>
                                                <div className="text-xs font-bold text-white">{(sub.players?.length / 2) || 0}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center gap-3">
                                        <div className="flex-1 flex -space-x-2">
                                            {[...Array(Math.min(4, Math.floor(sub.players?.length / 2 || 0)))].map((_, i) => (
                                                <div key={i} className="w-7 h-7 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[9px] font-black text-zinc-500">
                                                    P{i+1}
                                                </div>
                                            ))}
                                            {(sub.players?.length / 2) > 4 && (
                                                <div className="w-7 h-7 rounded-full border-2 border-zinc-900 bg-[#0056B3]/20 flex items-center justify-center text-[9px] font-black text-[#4da3ff]">
                                                    +{(sub.players?.length / 2) - 4}
                                                </div>
                                            )}
                                        </div>
                                        <PrintBreakTrigger id={sub.id} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        </div>

                        {/* ── Compact Table (Print Only) ── */}
                        {layoutType === 'table' && (
                            <div className="hidden print:block w-full">
                                <table className="w-full text-left text-[11px] border-collapse border border-black/20">
                                    <thead>
                                        <tr className="bg-black/5 border-b-2 border-black">
                                            <th className="py-2 px-3 font-black uppercase">Organization</th>
                                            <th className="py-2 px-3 font-black uppercase">Captain</th>
                                            <th className="py-2 px-3 font-black uppercase">Contact</th>
                                            <th className="py-2 px-3 font-black uppercase text-center">Players</th>
                                            <th className="py-2 px-3 font-black uppercase">Registration Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {submissions.map((sub, idx) => (
                                            <tr key={sub.id} className={`border-b border-black/20 ${pageBreakIds.includes(sub.id) ? 'print:break-before-page' : ''}`}>
                                                <td className="py-2 px-3 font-bold">{sub.organization_name}</td>
                                                <td className="py-2 px-3 font-bold">{sub.captain_name}</td>
                                                <td className="py-2 px-3">{sub.captain_phone}</td>
                                                <td className="py-2 px-3 text-center font-bold">{sub.players?.length || 0}</td>
                                                <td className="py-2 px-3">{new Date(sub.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        </>
                    )}
                </div>
            )}

            <style jsx global>{`
                @media print {
                    @page { margin: 15mm; }
                    html, body, main {
                        background: white !important;
                        color: black !important;
                    }
                    .print\\:hidden, nav, header, footer, button, .flex.gap-1.border-b {
                        display: none !important;
                    }
                    .bg-zinc-900, .bg-black\\/50, .bg-zinc-950 {
                        background: transparent !important;
                        border-color: #eee !important;
                    }
                    .text-white, .text-zinc-200, .text-zinc-400, .text-zinc-500 {
                        color: black !important;
                    }
                    .print\\:break-before-page {
                        break-before: page !important;
                    }
                }
            `}</style>
        </div>
    );
}
