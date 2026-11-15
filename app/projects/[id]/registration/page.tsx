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

// ── Slug helper (up to 40 chars, allows a-z, 0-9, and hyphens) ──
function toSlug(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40);
}

export default function RegistrationStudio() {
    const params = useParams();
    const projectId = params?.id as string;

    const [activeTab, setActiveTab] = useState<'settings' | 'tournament' | 'submissions'>('settings');
    const [isLoading, setIsLoading] = useState(true);
    const [isLinking, setIsLinking] = useState(false);
    const [slugTaken, setSlugTaken] = useState(false);
    const [slugChecking, setSlugChecking] = useState(false);
    const [projectInfo, setProjectInfo] = useState<any>(null);
    const [origin, setOrigin] = useState('https://ztoevent.com');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSub, setSelectedSub] = useState<any | null>(null);
    const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { pageBreakIds, layoutType } = usePrint();

    const [settings, setSettings] = useState<any>({
        slogan: '',
        logo_url: '',
        title_sponsor: '',
        title_sponsor_label: 'Title Sponsor / 冠名商',
        sponsors: [],
        co_organizers: [],
        template_type: 'general_event',
        fields_config: {
            show_team_name: true,
            show_staff_id: false,
            show_category_select: false,
            allow_companions: true,
            show_tshirt_size: false,
            show_dietary: false,
            show_ic_passport: true,
            require_ic_upload: false,
            show_phone: true,
            show_email: true,
            requires_gender: false,
            show_payment_receipt: false,
            payment_instructions: '',
            show_remarks: true,
            show_team_dupr_average: false,
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
        // Tournament / Portal Page fields
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
        if (typeof window !== 'undefined') {
            setOrigin(window.location.origin);
        }
        if (projectId) {
            loadSettings();
            loadSubmissions();
        }
    }, [projectId]);

    const loadSettings = async () => {
        try {
            const [{ data: projData }, { data }] = await Promise.all([
                supabase.from('projects').select('*').eq('id', projectId).maybeSingle(),
                supabase.from('tournament_settings').select('*').eq('project_id', projectId).maybeSingle(),
            ]);

            if (projData) setProjectInfo(projData);

            const isTournamentProj = projData?.type === 'tournament' || projData?.type === 'sports';
            const defaultTemplate = isTournamentProj ? 'business_pro_item' : 'general_event';

            if (data) {
                setSettings((prev: any) => ({
                    ...prev,
                    ...data,
                    slogan: data.slogan || projData?.name || '',
                    venue_name: data.venue_name || projData?.venue || '',
                    template_type: data.template_type || defaultTemplate,
                    fields_config: {
                        ...prev.fields_config,
                        ...(data.fields_config || {}),
                    },
                    medical_options: data.medical_options || prev.medical_options,
                    title_sponsor_label: data.title_sponsor_label || 'Title Sponsor / 冠名商',
                    prize_pool: data.prize_pool || [],
                    categories: data.categories || [],
                    event_schedule: data.event_schedule || [],
                    social_links: data.social_links || { facebook: '', instagram: '', whatsapp: '' },
                    theme_color: data.theme_color || '#f59e0b',
                }));
            } else if (projData) {
                // Auto-populate defaults from Project so user can launch immediately!
                const autoSlug = toSlug(projData.name || '');
                setSettings((prev: any) => ({
                    ...prev,
                    slogan: projData.name || '',
                    venue_name: projData.venue || '',
                    page_slug: autoSlug,
                    template_type: defaultTemplate,
                }));
                if (autoSlug) checkSlug(autoSlug);
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
        slugTimer.current = setTimeout(() => checkSlug(slug), 400);
    };

    const autoGenerateSlug = () => {
        const base = settings.slogan || projectInfo?.name || '';
        if (!base) return;
        handleSlugChange(base);
    };

    // ── Save ──────────────────────────────────────────────────
    const handleSave = async () => {
        if (slugTaken) {
            Swal.fire('Slug Taken', 'This URL slug is already used by another event. Choose a different one.', 'warning');
            return;
        }
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
            Swal.fire({ title: 'Portal Saved & Live!', icon: 'success', timer: 1500, showConfirmButton: false, background: '#18181b', color: '#fff' });
        } catch (e: any) {
            Swal.fire('Error', e.message, 'error');
        }
    };

    const handleDeleteSubmission = async (subId: string) => {
        const res = await Swal.fire({
            title: 'Delete Registration?',
            text: 'This registration entry will be permanently removed.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Delete',
            background: '#18181b',
            color: '#fff',
        });
        if (!res.isConfirmed) return;
        const { error } = await supabase.from('tournament_registrations').delete().eq('id', subId);
        if (!error) {
            setSubmissions(prev => prev.filter(s => s.id !== subId));
            if (selectedSub?.id === subId) setSelectedSub(null);
        }
    };

    const handleExportCSV = () => {
        if (submissions.length === 0) return;
        const headers = [
            'Registration Date',
            'Organization / Club / Dept',
            'Primary Category',
            'Primary Name',
            'BIB Name / Role',
            'Phone',
            'Email',
            'IC / Passport',
            'Gender',
            'Blood Type',
            'T-Shirt Size',
            'Dietary',
            'Emergency Contact',
            'Total Pax / Runners',
            'Total Fee (RM)',
            'Participants Breakdown',
            'Remarks',
            'IC / Receipt URL'
        ];

        const escapeCsv = (val: any) => {
            const s = String(val ?? '').replace(/"/g, '""');
            return `"${s}"`;
        };

        const csvRows = [headers.map(escapeCsv).join(',')];

        for (const sub of submissions) {
            const d = sub.captain_details || {};
            const ec = d.emergency_contact || {};
            const players: any[] = Array.isArray(sub.players) ? sub.players : [];
            const breakdown = players
                .map((p, i) => `${i + 1}. ${p.name || ''} (${p.category || p.type || 'Participant'}${p.bib_name ? ` / BIB:${p.bib_name}` : ''}${p.tshirt_size ? ` / Size:${p.tshirt_size}` : ''}${p.gender ? ` / ${p.gender}` : ''}${p.dietary ? ` / ${p.dietary}` : ''})`)
                .join(' | ');

            const row = [
                new Date(sub.created_at).toLocaleString('en-MY'),
                sub.organization_name || '',
                sub.team_name || d.category || '',
                sub.captain_name || '',
                d.bib_name || sub.captain_role || d.staff_id || '',
                sub.captain_phone || '',
                sub.captain_email || '',
                sub.captain_ic || '',
                sub.captain_gender || '',
                d.blood_type || '',
                d.tshirt_size || '',
                d.dietary || '',
                ec.name ? `${ec.name} (${ec.relationship || 'Contact'}: ${ec.phone || ''})` : '',
                players.length || 1,
                d.total_fee_rm ? Number(d.total_fee_rm).toFixed(2) : '',
                breakdown,
                d.remarks || '',
                sub.captain_ic_url || d.payment_receipt_url || ''
            ];
            csvRows.push(row.map(escapeCsv).join(','));
        }

        const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${settings.page_slug || projectId}_registrations.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleLinkArena = async () => {
        const { value: tournamentId } = await Swal.fire({
            title: 'Link to Arena Tournament',
            input: 'text',
            inputLabel: 'Enter Tournament ID',
            inputValue: settings.linked_tournament_id || '',
            showCancelButton: true,
            background: '#18181b',
            color: 'var(--c-on-accent)',
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

    const publicRegPath = settings.page_slug
        ? `/register/${settings.page_slug}`
        : projectId ? `/register/${projectId}` : '';

    const publicRegUrl = publicRegPath ? `${origin}${publicRegPath}` : '';

    const publicPagePath = settings.fields_config?.short_slug
        ? `/${settings.fields_config.short_slug}`
        : settings.page_slug
          ? `/${settings.page_slug}`
          : '';
    const publicPageUrl = publicPagePath ? `${origin}${publicPagePath}` : '';

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

    const totalParticipantsCount = submissions.reduce((acc, sub) => {
        const pLen = Array.isArray(sub.players) ? sub.players.length : 0;
        return acc + (pLen > 0 ? pLen : 1);
    }, 0);

    const filteredSubmissions = submissions.filter(sub => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (sub.organization_name || '').toLowerCase().includes(q) ||
            (sub.captain_name || '').toLowerCase().includes(q) ||
            (sub.captain_phone || '').toLowerCase().includes(q) ||
            (sub.captain_ic || '').toLowerCase().includes(q)
        );
    });

    return (
        <div className="space-y-10">
            {/* Action Floating Group */}
            <div className="print:hidden fixed bottom-8 right-8 z-[9990] pointer-events-auto flex items-center gap-3 bg-canvas/90 backdrop-blur-xl border border-accent/40 p-2 rounded-2xl shadow-[0_8px_32px_rgb(var(--c-accent-rgb)/0.2)]">
                {activeTab === 'submissions' && (
                    <div className="px-2 border-r border-ink/10 mr-2 flex items-center gap-2">
                        <button
                            onClick={handleExportCSV}
                            disabled={submissions.length === 0}
                            className="h-10 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500/25 transition-all disabled:opacity-40 flex items-center gap-2"
                        >
                            <i className="fa-solid fa-file-csv" /> Export CSV
                        </button>
                        <PrintReportButton title="Registration Submissions" />
                    </div>
                )}
                <Link
                    href={publicRegPath || '#'}
                    target="_blank"
                    className="h-10 px-4 rounded-xl bg-ink/5 border border-ink/10 text-ink hover:bg-ink/10 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all"
                >
                    <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" /> Open Portal
                </Link>
                <button onClick={handleSave} className="btn-royal h-10 px-6 shadow-[0_0_15px_rgb(var(--c-accent-rgb)/0.3)]">
                    <i className="fa-solid fa-bolt text-[10px]" /> SAVE & PUBLISH PORTAL
                </button>
            </div>

            {/* Page Header */}
            <div className="print:hidden flex flex-wrap items-end justify-between gap-8 mb-8">
                <div className="flex flex-col">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-accent mb-2">Rapid Portal Launcher</p>
                    <h1 className="text-4xl md:text-5xl font-black text-ink uppercase tracking-tight leading-none font-display">
                        Registration Studio
                    </h1>
                    <p className="text-zinc-500 text-sm mt-3 font-medium tracking-wide">
                        Upload client banner, pick form fields & launch a shareable registration link in seconds
                    </p>
                </div>

                {/* ── Stats + Actions Hub ── */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="h-12 px-6 flex items-center gap-6 rounded-2xl bg-canvas border border-ink/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-2 shadow-[0_0_10px_rgb(var(--c-accent-2-rgb)/0.5)]" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Submissions</span>
                            <span className="text-xs font-black text-accent-2 font-mono ml-2">{submissions.length}</span>
                        </div>
                        <div className="w-px h-4 bg-ink/10" />
                        <div className="flex items-center gap-2">
                            <i className="fa-solid fa-users text-[10px] text-accent"></i>
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Total Pax</span>
                            <span className="text-xs font-black text-ink font-mono ml-2">{totalParticipantsCount}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSave}
                            className="h-12 px-6 rounded-2xl bg-accent text-white font-black text-xs tracking-widest uppercase shadow-[0_0_20px_rgb(var(--c-accent-rgb)/0.4)] hover:shadow-[0_0_30px_rgb(var(--c-accent-rgb)/0.8)] transition-all flex items-center gap-2.5 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <i className="fa-solid fa-bolt text-sm" /> Save & Publish
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Tabs ──────────────────────────────────────────────── */}
            <div className="print:hidden flex flex-wrap gap-2 border-b border-ink/5 pb-0 mb-8">
                {[
                    { id: 'settings',    label: '1. Quick Launch & Form Builder', icon: 'fa-rocket' },
                    { id: 'tournament',  label: '2. Schedule, Prizes, Venue & Rules',   icon: 'fa-globe' },
                    { id: 'submissions', label: `3. Submissions (${submissions.length})`, icon: 'fa-users' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`pb-4 px-6 font-black text-[10px] tracking-widest uppercase transition-all flex items-center gap-2.5 border-b-2 ${
                            activeTab === tab.id
                                ? 'text-accent border-accent'
                                : 'text-zinc-500 hover:text-ink border-transparent'
                        }`}
                    >
                        <i className={`fa-solid ${tab.icon} text-xs`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center text-zinc-500">
                    <i className="fa-solid fa-circle-notch animate-spin text-3xl mb-4 text-accent" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Loading Studio...</p>
                </div>
            ) : activeTab === 'settings' ? (
                /* ═══════════════════════════════════════════════════════
                   TAB 1: QUICK LAUNCH & FORM BUILDER
                ════════════════════════════════════════════════════════ */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* ── Card A: Rapid Branding & Banner Upload ── */}
                        <div className="bg-ink/[0.03] border border-ink/5 backdrop-blur-xl p-8 rounded-[32px] space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/5 pb-4">
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-ink flex items-center gap-2">
                                        <i className="fa-solid fa-image text-accent" /> Step 1: Event Title, Slug & Banner Design
                                    </h3>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        上传顾客提供的 Banner 设计图并确认标题，即可立即生成报名链接
                                    </p>
                                </div>
                                {projectInfo && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const slug = settings.page_slug || toSlug(projectInfo.name || '');
                                            setSettings({
                                                ...settings,
                                                slogan: projectInfo.name || settings.slogan,
                                                venue_name: projectInfo.venue || settings.venue_name,
                                                page_slug: slug,
                                            });
                                            if (slug) checkSlug(slug);
                                        }}
                                        className="px-3.5 py-2 rounded-xl bg-accent/10 border border-accent/20 text-accent-bright text-[10px] font-black uppercase tracking-widest hover:bg-accent/20 transition-all"
                                    >
                                        <i className="fa-solid fa-wand-magic-sparkles mr-1.5" /> Sync from Project
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-2">
                                        Event Title / Slogan *
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-black/40 border border-ink/5 rounded-2xl px-4 py-3.5 text-ink font-bold text-sm focus:outline-none focus:border-accent/40"
                                        value={settings.slogan || ''}
                                        onChange={e => setSettings({ ...settings, slogan: e.target.value })}
                                        placeholder="e.g. BIF Family Day 2026"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-[10px] font-black tracking-widest uppercase text-accent">
                                            Custom Portal URL Slug
                                        </label>
                                        <button
                                            type="button"
                                            onClick={autoGenerateSlug}
                                            className="text-[9px] font-black uppercase tracking-wider text-zinc-400 hover:text-white"
                                        >
                                            Auto-Generate
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 text-xs font-mono pointer-events-none">
                                            /register/
                                        </span>
                                        <input
                                            type="text"
                                            className={`w-full bg-black/40 border rounded-2xl pl-[84px] pr-10 py-3.5 text-ink font-mono font-bold text-xs focus:outline-none transition-all ${
                                                slugTaken ? 'border-red-500' : settings.page_slug ? 'border-accent/40' : 'border-ink/5 focus:border-accent/40'
                                            }`}
                                            value={settings.page_slug || ''}
                                            onChange={e => handleSlugChange(e.target.value)}
                                            placeholder="bif-family-day-2026"
                                            maxLength={40}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            {slugChecking ? <i className="fa-solid fa-circle-notch animate-spin text-zinc-500 text-xs" /> :
                                             slugTaken ? <i className="fa-solid fa-circle-xmark text-red-500 text-xs" /> :
                                             settings.page_slug ? <i className="fa-solid fa-circle-check text-emerald-500 text-xs" /> : null}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Hero Banner & Logo Upload */}
                            <ImageUploadField
                                label="Hero Banner / Event Poster (顾客 Banner 设计图)"
                                value={settings.hero_banner_url || ''}
                                onChange={v => setSettings({ ...settings, hero_banner_url: v })}
                                bucket="tournament-banners"
                                folder={projectId}
                                placeholder="Paste image URL or click Upload →"
                                preview="banner"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <ImageUploadField
                                    label="Event / Client Logo (Optional)"
                                    value={settings.logo_url || ''}
                                    onChange={v => setSettings({ ...settings, logo_url: v })}
                                    bucket="logo"
                                    folder={projectId}
                                    placeholder="Logo URL or upload"
                                    preview="thumbnail"
                                />

                                <div>
                                    <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-2">
                                        Theme Accent Color
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {THEME_PRESETS.map(p => (
                                            <button
                                                key={p.value}
                                                type="button"
                                                onClick={() => setSettings({ ...settings, theme_color: p.value })}
                                                className={`w-9 h-9 rounded-xl transition-all hover:scale-105 ${
                                                    settings.theme_color === p.value
                                                        ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-105'
                                                        : 'opacity-60 hover:opacity-100'
                                                }`}
                                                style={{ backgroundColor: p.value }}
                                                title={p.label}
                                            />
                                        ))}
                                        <div className="relative w-9 h-9 rounded-xl border border-dashed border-zinc-700 flex items-center justify-center text-zinc-500 cursor-pointer">
                                            <input
                                                type="color"
                                                value={settings.theme_color || '#f59e0b'}
                                                onChange={e => setSettings({ ...settings, theme_color: e.target.value })}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                            <i className="fa-solid fa-palette text-xs" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Card B: Template & Form Fields ── */}
                        <div className="bg-ink/[0.03] border border-ink/5 backdrop-blur-xl p-8 rounded-[32px] space-y-8">
                            <div>
                                <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-3">
                                    Step 2: Registration Mode / Template (报名模式)
                                </label>
                                <select
                                    className="w-full bg-black/40 border border-ink/5 rounded-2xl px-5 py-4 text-ink focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 font-bold text-sm appearance-none cursor-pointer"
                                    value={settings.template_type}
                                    onChange={e => setSettings({ ...settings, template_type: e.target.value })}
                                >
                                    <option value="general_event">🌟 通用活动 / 家庭日 / 晚宴 / 个人或携眷报名 (General Event / Family Day / RSVP)</option>
                                    <option value="business_pro_item">🏓 商业/公开双打赛 - 2人组队 (Doubles Tournament - Captain + Partner)</option>
                                    <option value="guild_team_item">🏆 公会团体项目战 - 5对双打 (Guild Team Item Battle - 5 Pairs)</option>
                                    <option value="guild_team_semi_free">🛡️ 公会团体半自由战 - 10主力+3替补 (Guild Team Semi-free Battle)</option>
                                </select>
                            </div>

                            {/* Data Collection Fields */}
                            <div>
                                <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-4">
                                    Step 3: Participant Data Fields (点击开关需要收集的资料)
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {[
                                        { key: 'info_only', label: 'ℹ️ Info-Only Landing Page (纯展示活动页 - 隐藏报名表格)' },
                                        { key: 'enable_run_module', label: '🏃 Enable Run Route & Aid Station Map (马拉松路线与补给站展示)' },
                                        { key: 'show_bib_name', label: '🎽 Custom Race BIB Name (号码布印名 + 预览)' },
                                        { key: 'show_blood_type', label: '🩸 Blood Type (血型选项 - 印于号码布)' },
                                        { key: 'show_team_name', label: 'Company / Dept / Running Club Name' },
                                        { key: 'show_staff_id', label: 'Staff ID / Role (工号 / 职位)' },
                                        { key: 'show_category_select', label: 'Category / Package Selection (组别选择)' },
                                        { key: 'allow_companions', label: 'Allow Family / Group Runners (允许添加同伴/家属)' },
                                        { key: 'show_phone', label: 'Phone / WhatsApp Number' },
                                        { key: 'show_email', label: 'Email Address' },
                                        { key: 'show_ic_passport', label: 'IC / Passport Number' },
                                        { key: 'require_ic_upload', label: 'Require IC Photo Upload (强制上传IC照片)' },
                                        { key: 'requires_gender', label: 'Gender (性别)' },
                                        { key: 'show_tshirt_size', label: 'Running Jersey / T-Shirt Size (衣服尺码 XS-3XL)' },
                                        { key: 'show_dietary', label: 'Dietary Preference (Halal / 素食)' },
                                        { key: 'show_remarks', label: 'Remarks / Special Requests (备注栏)' },
                                        { key: 'show_payment_receipt', label: 'Payment Receipt Upload (上传付款凭证)' },
                                        { key: 'show_emergency_contact', label: 'Emergency Contact (紧急联系人)' },
                                        { key: 'show_medical', label: 'Medical History (病史选项)' },
                                        { key: 'show_city_state', label: 'City & State (城市与州属)' },
                                        { key: 'show_work_school', label: 'Work / School (单位或学校)' },
                                        { key: 'show_dupr', label: 'DUPR ID (匹克球积分ID)' },
                                        { key: 'show_team_dupr_average', label: 'Team Average DUPR' },
                                    ].map(field => (
                                        <div
                                            key={field.key}
                                            onClick={() => setSettings({
                                                ...settings,
                                                fields_config: {
                                                    ...settings.fields_config,
                                                    [field.key]: !settings.fields_config[field.key]
                                                }
                                            })}
                                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                                                settings.fields_config[field.key]
                                                    ? 'bg-accent/10 border-accent/40'
                                                    : 'bg-black/20 border-ink/5 hover:border-ink/10'
                                            }`}
                                        >
                                            <span className={`text-[11px] font-black uppercase tracking-wider ${
                                                settings.fields_config[field.key] ? 'text-ink' : 'text-zinc-500 group-hover:text-zinc-400'
                                            }`}>
                                                {field.label}
                                            </span>
                                            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                                                settings.fields_config[field.key]
                                                    ? 'bg-accent border-accent text-white'
                                                    : 'border-ink/10 text-transparent'
                                            }`}>
                                                <i className="fa-solid fa-check text-[10px]" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Instructions when show_payment_receipt is enabled */}
                            <AnimatePresence>
                                {settings.fields_config.show_payment_receipt && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                        <div className="bg-black/20 border border-ink/5 p-6 rounded-2xl space-y-3">
                                            <label className="block text-[10px] font-black tracking-widest uppercase text-accent-bright">
                                                Bank Account & Payment Instructions (收款账户与报名费说明)
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={settings.fields_config.payment_instructions || ''}
                                                onChange={e => setSettings({
                                                    ...settings,
                                                    fields_config: { ...settings.fields_config, payment_instructions: e.target.value }
                                                })}
                                                placeholder="e.g. Registration Fee: RM 50 / Pax&#10;Bank: CIMB Bank 8011396433 (ZERO TO ONE EVENT PLT)"
                                                className="w-full bg-black/40 border border-ink/5 rounded-xl px-4 py-3 text-xs text-ink focus:outline-none focus:border-accent/40"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Categories Quick Editor */}
                            <div className="bg-black/20 border border-ink/5 p-6 rounded-2xl space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <label className="text-[10px] font-black tracking-widest uppercase text-accent-bright block">
                                            Event Categories / Packages & Fees (报名组别与费用)
                                        </label>
                                        <p className="text-[11px] text-zinc-500 mt-0.5">
                                            填入 Fee（如 RM 55）后，报名表会自动按人数与组别计算总应付金额（Total Payable）
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => addRow('categories', { name: '', short: '', distance_km: '', flag_off: '', cut_off: '', fee: '', open_to: '', description: '' })}
                                        className="px-3.5 py-2 bg-accent/10 text-accent-bright hover:bg-accent hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shrink-0"
                                    >
                                        <i className="fa-solid fa-plus mr-1.5" /> Add Category
                                    </button>
                                </div>

                                {(settings.categories || []).length === 0 ? (
                                    <p className="text-xs text-zinc-600 italic">No categories added yet (optional).</p>
                                ) : (
                                    <div className="space-y-3">
                                        {(settings.categories || []).map((cat: any, idx: number) => (
                                            <div key={idx} className="bg-black/30 p-3.5 rounded-xl border border-ink/5 space-y-2.5">
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                                                    <input
                                                        value={cat.name || ''}
                                                        onChange={e => updateRow('categories', idx, 'name', e.target.value)}
                                                        placeholder="Category Name (e.g. 5KM Coastal Fun Run)"
                                                        className="md:col-span-4 bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink font-bold"
                                                    />
                                                    <input
                                                        value={cat.fee || ''}
                                                        onChange={e => updateRow('categories', idx, 'fee', e.target.value)}
                                                        placeholder="Fee (e.g. RM 55)"
                                                        className="md:col-span-2 bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-emerald-400 font-bold"
                                                    />
                                                    <input
                                                        value={cat.open_to || ''}
                                                        onChange={e => updateRow('categories', idx, 'open_to', e.target.value)}
                                                        placeholder="Eligibility (e.g. Open Ages 7+)"
                                                        className="md:col-span-2 bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink"
                                                    />
                                                    <input
                                                        value={cat.description || ''}
                                                        onChange={e => updateRow('categories', idx, 'description', e.target.value)}
                                                        placeholder="Short description / note"
                                                        className="md:col-span-3 bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRow('categories', idx)}
                                                        className="md:col-span-1 h-9 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"
                                                    >
                                                        <i className="fa-solid fa-trash-can text-xs" />
                                                    </button>
                                                </div>
                                                {settings.fields_config.enable_run_module && (
                                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-2 border-t border-white/5">
                                                        <input
                                                            value={cat.short || ''}
                                                            onChange={e => updateRow('categories', idx, 'short', e.target.value)}
                                                            placeholder="Badge (e.g. 5KM)"
                                                            className="bg-black/50 border border-ink/5 rounded-lg px-3 py-1.5 text-[11px] text-cyan-300 font-bold"
                                                        />
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            value={cat.distance_km ?? ''}
                                                            onChange={e => updateRow('categories', idx, 'distance_km', e.target.value)}
                                                            placeholder="Distance KM (e.g. 5)"
                                                            className="bg-black/50 border border-ink/5 rounded-lg px-3 py-1.5 text-[11px] text-ink"
                                                        />
                                                        <input
                                                            value={cat.flag_off || ''}
                                                            onChange={e => updateRow('categories', idx, 'flag_off', e.target.value)}
                                                            placeholder="Flag-off (06:45 AM)"
                                                            className="bg-black/50 border border-ink/5 rounded-lg px-3 py-1.5 text-[11px] text-ink"
                                                        />
                                                        <input
                                                            value={cat.cut_off || ''}
                                                            onChange={e => updateRow('categories', idx, 'cut_off', e.target.value)}
                                                            placeholder="Cut-off (1.5 hrs)"
                                                            className="bg-black/50 border border-ink/5 rounded-lg px-3 py-1.5 text-[11px] text-ink"
                                                        />
                                                        <input
                                                            value={cat.color || ''}
                                                            onChange={e => updateRow('categories', idx, 'color', e.target.value)}
                                                            placeholder="Hex Color (#10b981)"
                                                            className="bg-black/50 border border-ink/5 rounded-lg px-3 py-1.5 text-[11px] text-ink font-mono"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Medical options */}
                            <AnimatePresence>
                                {settings.fields_config.show_medical && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                        <div className="bg-black/20 border border-ink/5 p-6 rounded-2xl">
                                            <div className="flex items-center justify-between mb-4">
                                                <label className="text-[9px] font-black tracking-widest uppercase text-accent-bright">Medical Conditions List</label>
                                                <button type="button" onClick={() => setSettings({ ...settings, medical_options: [...settings.medical_options, 'New Condition'] })} className="px-3 py-1.5 bg-accent/10 text-accent-bright hover:bg-accent hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors">
                                                    <i className="fa-solid fa-plus mr-2" />Add Option
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                {settings.medical_options.map((opt: string, i: number) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <input value={opt} onChange={e => { const n = [...settings.medical_options]; n[i] = e.target.value; setSettings({ ...settings, medical_options: n }); }} className="flex-1 bg-black/40 border border-ink/5 rounded-xl px-4 py-2.5 text-xs text-ink focus:outline-none focus:border-accent/40" />
                                                        <button type="button" onClick={() => setSettings({ ...settings, medical_options: settings.medical_options.filter((_: any, idx: number) => idx !== i) })} className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"><i className="fa-solid fa-minus" /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Sponsor Label & Name */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-ink/5">
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-2">Organizer / Sponsor Label</label>
                                    <input type="text" className="w-full bg-black/40 border border-ink/5 rounded-2xl px-4 py-3 text-ink text-xs focus:outline-none focus:border-accent/40" value={settings.title_sponsor_label || ''} onChange={e => setSettings({ ...settings, title_sponsor_label: e.target.value })} placeholder="e.g. Organized By / Title Sponsor" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-2">Organizer / Sponsor Name</label>
                                    <input type="text" className="w-full bg-black/40 border border-ink/5 rounded-2xl px-4 py-3 text-ink text-xs focus:outline-none focus:border-accent/40" value={settings.title_sponsor || ''} onChange={e => setSettings({ ...settings, title_sponsor: e.target.value })} placeholder="e.g. Bintulu Integrated Facility (BIF)" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* QR + Live Link Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-ink/[0.03] border border-ink/5 backdrop-blur-xl p-8 rounded-[32px] text-center shadow-xl sticky top-24">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest mb-4">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Ready to Share
                            </div>
                            <h3 className="text-xs font-black tracking-widest uppercase text-ink mb-6">Registration Portal QR</h3>
                            <div className="bg-white p-5 rounded-3xl inline-block mx-auto mb-6 shadow-2xl">
                                <QRCodeSVG value={publicRegUrl || 'https://ztoevent.com'} size={180} />
                            </div>
                            <div className="text-left space-y-4">
                                <div>
                                    <label className="block text-[9px] font-black tracking-widest uppercase text-zinc-500 mb-2">
                                        Direct Registration Portal Link
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={publicRegUrl}
                                            className="w-full bg-black/40 border border-ink/5 rounded-xl px-3.5 py-3 text-[11px] text-zinc-300 font-mono"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(publicRegUrl);
                                                Swal.fire({ title: 'Portal Link Copied!', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, background: '#18181b', color: '#fff' });
                                            }}
                                            className="h-11 w-11 bg-zinc-900 border border-ink/10 rounded-xl text-zinc-300 hover:text-white transition-colors flex items-center justify-center shrink-0"
                                            title="Copy Link"
                                        >
                                            <i className="fa-solid fa-copy" />
                                        </button>
                                    </div>
                                </div>

                                <Link
                                    href={publicRegPath || '#'}
                                    target="_blank"
                                    className="flex items-center justify-center gap-2.5 w-full bg-accent text-white rounded-2xl px-5 py-4 font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg"
                                >
                                    <i className="fa-solid fa-arrow-up-right-from-square" />
                                    Open One-Page Event Portal
                                </Link>

                                {publicPagePath && (
                                    <div className="flex items-center gap-3 w-full bg-ink/5 border border-ink/10 rounded-2xl px-4 py-3 text-left">
                                        <i className="fa-solid fa-bolt text-accent-bright text-sm" />
                                        <div className="flex-1 overflow-hidden">
                                            <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Short Direct URL (最简短链)</div>
                                            <div className="text-[11px] font-bold text-ink truncate font-mono">{publicPageUrl}</div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(publicPageUrl);
                                                Swal.fire({ title: 'Short URL Copied!', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, background: '#18181b', color: '#fff' });
                                            }}
                                            className="h-9 w-9 bg-zinc-900 border border-ink/10 rounded-xl text-zinc-300 hover:text-white transition-colors flex items-center justify-center shrink-0"
                                            title="Copy Short URL"
                                        >
                                            <i className="fa-solid fa-copy text-xs" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Arena Connection */}
                        <div className="bg-ink/[0.03] border border-ink/5 backdrop-blur-xl p-8 rounded-[32px]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center text-accent-bright">
                                    <i className="fa-solid fa-link" />
                                </div>
                                <h3 className="text-[10px] font-black tracking-widest uppercase text-ink">Arena Sync (Optional)</h3>
                            </div>

                            {settings.linked_tournament_id ? (
                                <div className="space-y-4">
                                    <div className="bg-accent/5 border border-accent/20 p-5 rounded-2xl">
                                        <div className="text-[9px] font-black uppercase text-accent-bright mb-2 tracking-[0.2em]">CONNECTED</div>
                                        <div className="text-[10px] text-zinc-400 font-mono truncate">{settings.linked_tournament_id}</div>
                                    </div>
                                    <button
                                        onClick={handleLinkArena}
                                        disabled={isLinking}
                                        className="w-full h-12 bg-zinc-900 border border-ink/5 text-zinc-500 hover:text-ink rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        Switch Connection
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleLinkArena}
                                    disabled={isLinking}
                                    className="w-full py-6 border-2 border-dashed border-ink/5 hover:border-accent/40 hover:bg-accent/5 text-zinc-600 hover:text-accent-bright rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-2"
                                >
                                    <i className="fa-solid fa-circle-plus text-xl" />
                                    {isLinking ? 'Linking...' : 'Link Arena Tournament'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

            ) : activeTab === 'tournament' ? (
                /* ═══════════════════════════════════════════════════════
                   TAB 2: EVENT INFO & LANDING PAGE BUILDER
                ════════════════════════════════════════════════════════ */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-ink/[0.03] border border-ink/5 backdrop-blur-xl p-8 rounded-[32px] space-y-8">
                            {/* Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-3">Registration Opens (Optional)</label>
                                    <input type="date" value={settings.reg_open_date?.split('T')[0] || ''} onChange={e => setSettings({ ...settings, reg_open_date: e.target.value })} className="w-full bg-black/40 border border-ink/5 rounded-2xl px-5 py-4 text-ink text-sm focus:outline-none focus:border-accent/40" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-3">Registration Closes / Deadline (Optional)</label>
                                    <input type="date" value={settings.reg_close_date?.split('T')[0] || ''} onChange={e => setSettings({ ...settings, reg_close_date: e.target.value })} className="w-full bg-black/40 border border-ink/5 rounded-2xl px-5 py-4 text-ink text-sm focus:outline-none focus:border-accent/40" />
                                </div>
                            </div>

                            {/* Venue & Contact Info */}
                            <div className="pt-6 border-t border-ink/5 space-y-5">
                                <h3 className="text-xs font-black uppercase tracking-widest text-accent">Venue & Contact Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-2">Venue Name</label>
                                        <input type="text" value={settings.venue_name || ''} onChange={e => setSettings({ ...settings, venue_name: e.target.value })} placeholder="e.g. BIF Kidurong Bintulu" className="w-full bg-black/40 border border-ink/5 rounded-2xl px-4 py-3 text-ink text-xs focus:outline-none focus:border-accent/40" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-2">Google Maps Link</label>
                                        <input type="text" value={settings.venue_map_url || ''} onChange={e => setSettings({ ...settings, venue_map_url: e.target.value })} placeholder="https://maps.app.goo.gl/..." className="w-full bg-black/40 border border-ink/5 rounded-2xl px-4 py-3 text-ink text-xs focus:outline-none focus:border-accent/40" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-2">Venue Full Address</label>
                                    <input type="text" value={settings.venue_address || ''} onChange={e => setSettings({ ...settings, venue_address: e.target.value })} placeholder="97000 Tanjung Kidurong, Bintulu, Sarawak" className="w-full bg-black/40 border border-ink/5 rounded-2xl px-4 py-3 text-ink text-xs focus:outline-none focus:border-accent/40" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-2">Organizer WhatsApp</label>
                                        <input type="text" value={settings.social_links?.whatsapp || ''} onChange={e => setSettings({ ...settings, social_links: { ...settings.social_links, whatsapp: e.target.value } })} placeholder="60105029356" className="w-full bg-black/40 border border-ink/5 rounded-2xl px-4 py-3 text-ink text-xs focus:outline-none focus:border-accent/40" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-2">Facebook URL</label>
                                        <input type="text" value={settings.social_links?.facebook || ''} onChange={e => setSettings({ ...settings, social_links: { ...settings.social_links, facebook: e.target.value } })} placeholder="https://facebook.com/..." className="w-full bg-black/40 border border-ink/5 rounded-2xl px-4 py-3 text-ink text-xs focus:outline-none focus:border-accent/40" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-2">Instagram URL</label>
                                        <input type="text" value={settings.social_links?.instagram || ''} onChange={e => setSettings({ ...settings, social_links: { ...settings.social_links, instagram: e.target.value } })} placeholder="https://instagram.com/..." className="w-full bg-black/40 border border-ink/5 rounded-2xl px-4 py-3 text-ink text-xs focus:outline-none focus:border-accent/40" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Event Details Content */}
                        <div className="bg-ink/[0.03] border border-ink/5 backdrop-blur-xl p-8 rounded-[32px] space-y-8">
                            <div>
                                <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-3">
                                    Event Description / Announcement (显示在报名页与宣传页)
                                </label>
                                <textarea rows={5} className="w-full bg-black/40 border border-ink/5 rounded-2xl px-5 py-4 text-ink focus:outline-none focus:border-accent/40 resize-none text-sm leading-relaxed" value={settings.event_description || ''} onChange={e => setSettings({ ...settings, event_description: e.target.value })} placeholder="Describe the event, schedule highlights, attire, or entitlements…" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-3">Rules / Terms & Conditions</label>
                                    <textarea rows={6} className="w-full bg-black/40 border border-ink/5 rounded-2xl px-5 py-4 text-ink focus:outline-none focus:border-accent/40 text-xs leading-relaxed" value={settings.rules || ''} onChange={e => setSettings({ ...settings, rules: e.target.value })} placeholder="Enter event rules or terms…" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-3">Format / Additional Notes</label>
                                    <textarea rows={6} className="w-full bg-black/40 border border-ink/5 rounded-2xl px-5 py-4 text-ink focus:outline-none focus:border-accent/40 text-xs leading-relaxed" value={settings.format_description || ''} onChange={e => setSettings({ ...settings, format_description: e.target.value })} placeholder="Explain format, agenda, or special notes…" />
                                </div>
                            </div>

                            {/* Event Schedule / Timeline */}
                            <div className="pt-6 border-t border-ink/5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-[10px] font-black tracking-widest uppercase text-zinc-500 block">
                                            Event Schedule / Program Flow (活动流程时间表)
                                        </label>
                                        <p className="text-[11px] text-zinc-600 mt-0.5">显示在报名页的 Schedule 区域</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => addRow('event_schedule', { time: '', label: '', notes: '', highlight: false })}
                                        className="px-3 py-1.5 bg-accent/10 text-accent-bright rounded-lg text-[10px] font-black uppercase tracking-widest"
                                    >
                                        + Add Time Slot
                                    </button>
                                </div>
                                {(settings.event_schedule || []).map((sch: any, idx: number) => (
                                    <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-black/30 p-3 rounded-xl border border-ink/5">
                                        <input
                                            value={sch.time || sch.time_start || ''}
                                            onChange={e => updateRow('event_schedule', idx, 'time', e.target.value)}
                                            placeholder="05:30 AM"
                                            className="md:col-span-2 bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink font-mono font-bold"
                                        />
                                        <input
                                            value={sch.label || sch.title || ''}
                                            onChange={e => updateRow('event_schedule', idx, 'label', e.target.value)}
                                            placeholder="Activity (e.g. Flag-Off: 21.1KM)"
                                            className="md:col-span-5 bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink font-bold"
                                        />
                                        <input
                                            value={sch.notes || sch.desc || ''}
                                            onChange={e => updateRow('event_schedule', idx, 'notes', e.target.value)}
                                            placeholder="Notes / Location"
                                            className="md:col-span-3 bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink"
                                        />
                                        <label className="md:col-span-1 flex items-center justify-center gap-1 text-[10px] font-bold text-zinc-400 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={!!sch.highlight}
                                                onChange={e => {
                                                    const arr = [...(settings.event_schedule || [])];
                                                    arr[idx] = { ...arr[idx], highlight: e.target.checked };
                                                    setSettings({ ...settings, event_schedule: arr });
                                                }}
                                            />
                                            Key
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => removeRow('event_schedule', idx)}
                                            className="md:col-span-1 h-9 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center"
                                        >
                                            <i className="fa-solid fa-trash-can text-xs" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Prize Pool (Optional) */}
                            <div className="pt-6 border-t border-ink/5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black tracking-widest uppercase text-zinc-500">Prize Pool / Lucky Draw Prizes (Optional)</label>
                                    <button type="button" onClick={() => addRow('prize_pool', { category: '', champion: '', runner_up: '', second_runner_up: '' })} className="px-3 py-1.5 bg-accent/10 text-accent-bright rounded-lg text-[10px] font-black uppercase tracking-widest">
                                        + Add Prize Row
                                    </button>
                                </div>
                                {(settings.prize_pool || []).map((p: any, idx: number) => (
                                    <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-black/30 p-2.5 rounded-xl border border-ink/5">
                                        <input value={p.category || ''} onChange={e => updateRow('prize_pool', idx, 'category', e.target.value)} placeholder="Category (e.g. 21.1KM Open)" className="md:col-span-5 bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink font-bold" />
                                        <input value={p.champion || (p.amount ? `${p.currency || 'RM'} ${p.amount}` : '')} onChange={e => updateRow('prize_pool', idx, 'champion', e.target.value)} placeholder="🥇 1st (RM 1,500)" className="md:col-span-2 bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-amber-400 font-mono" />
                                        <input value={p.runner_up || ''} onChange={e => updateRow('prize_pool', idx, 'runner_up', e.target.value)} placeholder="🥈 2nd (RM 1,000)" className="md:col-span-2 bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink font-mono" />
                                        <input value={p.second_runner_up || ''} onChange={e => updateRow('prize_pool', idx, 'second_runner_up', e.target.value)} placeholder="🥉 3rd (RM 600)" className="md:col-span-2 bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink font-mono" />
                                        <button type="button" onClick={() => removeRow('prize_pool', idx)} className="md:col-span-1 h-9 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center"><i className="fa-solid fa-trash-can text-xs" /></button>
                                    </div>
                                ))}
                            </div>

                            {/* Run Route, Water Stations, REPC & FAQ (when Running Event Showcase is ON) */}
                            {settings.fields_config?.enable_run_module && (() => {
                                const runCfg = settings.fields_config?.run_config || {};
                                const setRunCfg = (patch: any) => setSettings({
                                    ...settings,
                                    fields_config: { ...settings.fields_config, run_config: { ...runCfg, ...patch } }
                                });
                                const stations: any[] = Array.isArray(runCfg.stations) ? runCfg.stations : [];
                                const faqs: any[] = Array.isArray(runCfg.faq) ? runCfg.faq : [];
                                const repc = runCfg.repc || {};
                                const updateStation = (i: number, patch: any) => {
                                    const next = [...stations];
                                    next[i] = { ...next[i], ...patch };
                                    setRunCfg({ stations: next });
                                };
                                const updateFaq = (i: number, patch: any) => {
                                    const next = [...faqs];
                                    next[i] = { ...next[i], ...patch };
                                    setRunCfg({ faq: next });
                                };

                                return (
                                    <div className="pt-6 border-t border-cyan-500/20 space-y-6">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <label className="text-[10px] font-black tracking-widest uppercase text-cyan-400">Run Route, Water Stations, REPC & FAQ</label>
                                                <p className="text-[10px] text-zinc-500 mt-0.5">Powers the linear route map, aid station table, REPC panel, and FAQ accordion on the public portal.</p>
                                            </div>
                                        </div>

                                        {/* General Run Venue Logistics */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-black/30 p-4 rounded-2xl border border-ink/5">
                                            <div>
                                                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-1">City / Region Badge</label>
                                                <input value={runCfg.city || ''} onChange={e => setRunCfg({ city: e.target.value })} placeholder="Bintulu, Sarawak" className="w-full bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink" />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-1">External Route Map URL (Strava / GPX / GMaps)</label>
                                                <input value={runCfg.course_map_url || ''} onChange={e => setRunCfg({ course_map_url: e.target.value })} placeholder="https://www.google.com/maps/..." className="w-full bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink" />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Parking / Access Info</label>
                                                <input value={runCfg.parking || ''} onChange={e => setRunCfg({ parking: e.target.value })} placeholder="Free parking at Lasar Kenyalang..." className="w-full bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink" />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Finish Village Facilities (comma-separated)</label>
                                                <input
                                                    value={Array.isArray(runCfg.village_facilities) ? runCfg.village_facilities.join(', ') : (runCfg.village_facilities || '')}
                                                    onChange={e => setRunCfg({ village_facilities: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })}
                                                    placeholder="Finish Arch, Baggage Deposit, Medical Tent, Toilets"
                                                    className="w-full bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Route Mode</label>
                                                <select
                                                    value={runCfg.route_type || 'out_and_back'}
                                                    onChange={e => setRunCfg({ route_type: e.target.value })}
                                                    className="w-full bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink"
                                                >
                                                    <option value="out_and_back">Out &amp; Back Loop (折返环线 - Start &amp; Finish at same venue)</option>
                                                    <option value="point_to_point">Point-to-Point (单程点对点路线 - Start ➔ Separate Finish Point)</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Start / Assembly GPS (Lat, Lng — anchors interactive map)</label>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                    <input
                                                        type="number"
                                                        step="0.000001"
                                                        value={runCfg.start_point?.lat ?? ''}
                                                        onChange={e => setRunCfg({ start_point: { ...(runCfg.start_point || {}), lat: e.target.value ? parseFloat(e.target.value) : undefined } })}
                                                        placeholder="Lat (e.g. 3.175324)"
                                                        className="bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink font-mono"
                                                    />
                                                    <input
                                                        type="number"
                                                        step="0.000001"
                                                        value={runCfg.start_point?.lng ?? ''}
                                                        onChange={e => setRunCfg({ start_point: { ...(runCfg.start_point || {}), lng: e.target.value ? parseFloat(e.target.value) : undefined } })}
                                                        placeholder="Lng (e.g. 113.039563)"
                                                        className="bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink font-mono"
                                                    />
                                                    <input
                                                        value={runCfg.start_point?.name || ''}
                                                        onChange={e => setRunCfg({ start_point: { ...(runCfg.start_point || {}), name: e.target.value } })}
                                                        placeholder="Start Venue Label"
                                                        className="bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink"
                                                    />
                                                </div>
                                            </div>
                                            {(runCfg.route_type === 'point_to_point' || runCfg.finish_point?.lat) && (
                                                <div className="md:col-span-2">
                                                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Finish Point GPS (Point-to-Point End Venue)</label>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                        <input
                                                            type="number"
                                                            step="0.000001"
                                                            value={runCfg.finish_point?.lat ?? ''}
                                                            onChange={e => setRunCfg({ finish_point: { ...(runCfg.finish_point || {}), lat: e.target.value ? parseFloat(e.target.value) : undefined } })}
                                                            placeholder="Finish Lat"
                                                            className="bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink font-mono"
                                                        />
                                                        <input
                                                            type="number"
                                                            step="0.000001"
                                                            value={runCfg.finish_point?.lng ?? ''}
                                                            onChange={e => setRunCfg({ finish_point: { ...(runCfg.finish_point || {}), lng: e.target.value ? parseFloat(e.target.value) : undefined } })}
                                                            placeholder="Finish Lng"
                                                            className="bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink font-mono"
                                                        />
                                                        <input
                                                            value={runCfg.finish_point?.name || ''}
                                                            onChange={e => setRunCfg({ finish_point: { ...(runCfg.finish_point || {}), name: e.target.value } })}
                                                            placeholder="Finish Venue Label"
                                                            className="bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="md:col-span-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Finisher & Prize Note</label>
                                                <input value={runCfg.prize_note || ''} onChange={e => setRunCfg({ prize_note: e.target.value })} placeholder="All finishers within cut-off receive an official 3D medal & e-certificate." className="w-full bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink" />
                                            </div>
                                        </div>

                                        {/* REPC (Race Kit Collection) */}
                                        <div className="bg-black/30 p-4 rounded-2xl border border-ink/5 space-y-3">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-cyan-400 block">Race Entry Pack Collection (REPC)</label>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                <input value={repc.dates || ''} onChange={e => setRunCfg({ repc: { ...repc, dates: e.target.value } })} placeholder="Dates (e.g. 12–13 Feb 2027)" className="bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink" />
                                                <input value={repc.time || ''} onChange={e => setRunCfg({ repc: { ...repc, time: e.target.value } })} placeholder="Hours (10:00 AM – 8:00 PM)" className="bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink" />
                                                <input value={repc.venue || ''} onChange={e => setRunCfg({ repc: { ...repc, venue: e.target.value } })} placeholder="Venue (e.g. Parkcity Mall Bintulu)" className="bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                <textarea
                                                    rows={3}
                                                    value={Array.isArray(repc.bring) ? repc.bring.join('\n') : (repc.bring || '')}
                                                    onChange={e => setRunCfg({ repc: { ...repc, bring: e.target.value.split('\n').map((s: string) => s.trim()).filter(Boolean) } })}
                                                    placeholder="Items to bring (one per line)&#10;Original IC / Passport&#10;Confirmation screenshot"
                                                    className="bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink font-sans"
                                                />
                                                <textarea
                                                    rows={3}
                                                    value={repc.notes || ''}
                                                    onChange={e => setRunCfg({ repc: { ...repc, notes: e.target.value } })}
                                                    placeholder="Special notes (e.g. Outstation runner race-morning collection window)"
                                                    className="bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink font-sans"
                                                />
                                            </div>
                                        </div>

                                        {/* Water & Aid Stations */}
                                        <div className="space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[9px] font-black tracking-widest uppercase text-zinc-500">Out-and-Back Water & Aid Stations</label>
                                                <button
                                                    type="button"
                                                    onClick={() => setRunCfg({ stations: [...stations, { code: `WS${stations.length + 1}`, name: '', landmark: '', km: 2.5 * (stations.length + 1), supplies: ['Water'] }] })}
                                                    className="px-3 py-1.5 bg-cyan-500/15 text-cyan-400 rounded-lg text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    + Add Station
                                                </button>
                                            </div>
                                            {stations.map((st: any, idx: number) => (
                                                <div key={idx} className="space-y-2 bg-black/30 p-2.5 rounded-xl border border-ink/5">
                                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                                                        <input value={st.code || ''} onChange={e => updateStation(idx, { code: e.target.value })} placeholder="WS1" className="md:col-span-1 bg-black/50 border border-ink/5 rounded-lg px-2.5 py-2 text-xs text-cyan-400 font-black font-mono" />
                                                        <input type="number" step="0.05" value={st.km ?? ''} onChange={e => updateStation(idx, { km: parseFloat(e.target.value) || 0 })} placeholder="KM" className="md:col-span-2 bg-black/50 border border-ink/5 rounded-lg px-2.5 py-2 text-xs text-amber-400 font-mono" />
                                                        <input value={st.name || ''} onChange={e => updateStation(idx, { name: e.target.value })} placeholder="Station Name" className="md:col-span-3 bg-black/50 border border-ink/5 rounded-lg px-2.5 py-2 text-xs text-ink font-bold" />
                                                        <input value={st.landmark || ''} onChange={e => updateStation(idx, { landmark: e.target.value })} placeholder="Landmark / Junction" className="md:col-span-3 bg-black/50 border border-ink/5 rounded-lg px-2.5 py-2 text-xs text-zinc-400" />
                                                        <input
                                                            value={Array.isArray(st.supplies) ? st.supplies.join(', ') : (st.supplies || '')}
                                                            onChange={e => updateStation(idx, { supplies: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })}
                                                            placeholder="Water, 100PLUS, Timing Mat"
                                                            className="md:col-span-2 bg-black/50 border border-ink/5 rounded-lg px-2.5 py-2 text-xs text-ink"
                                                        />
                                                        <button type="button" onClick={() => setRunCfg({ stations: stations.filter((_: any, i: number) => i !== idx) })} className="md:col-span-1 h-9 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center"><i className="fa-solid fa-trash-can text-xs" /></button>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 pl-1">
                                                        <input type="number" step="0.000001" value={st.lat ?? ''} onChange={e => updateStation(idx, { lat: e.target.value ? parseFloat(e.target.value) : undefined })} placeholder="GPS Lat (optional)" className="bg-black/40 border border-ink/5 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-300 font-mono" />
                                                        <input type="number" step="0.000001" value={st.lng ?? ''} onChange={e => updateStation(idx, { lng: e.target.value ? parseFloat(e.target.value) : undefined })} placeholder="GPS Lng (optional)" className="bg-black/40 border border-ink/5 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-300 font-mono" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Event FAQ */}
                                        <div className="space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[9px] font-black tracking-widest uppercase text-zinc-500">Frequently Asked Questions (FAQ)</label>
                                                <button
                                                    type="button"
                                                    onClick={() => setRunCfg({ faq: [...faqs, { q: '', a: '' }] })}
                                                    className="px-3 py-1.5 bg-accent/10 text-accent-bright rounded-lg text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    + Add FAQ
                                                </button>
                                            </div>
                                            {faqs.map((item: any, idx: number) => (
                                                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start bg-black/30 p-2.5 rounded-xl border border-ink/5">
                                                    <input value={item.q || ''} onChange={e => updateFaq(idx, { q: e.target.value })} placeholder="Question" className="md:col-span-5 bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-ink font-bold" />
                                                    <input value={item.a || ''} onChange={e => updateFaq(idx, { a: e.target.value })} placeholder="Answer" className="md:col-span-6 bg-black/50 border border-ink/5 rounded-lg px-3 py-2 text-xs text-zinc-300" />
                                                    <button type="button" onClick={() => setRunCfg({ faq: faqs.filter((_: any, i: number) => i !== idx) })} className="md:col-span-1 h-9 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center"><i className="fa-solid fa-trash-can text-xs" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Preview sidebar */}
                    <div className="space-y-6">
                        <div className="bg-ink/[0.03] border border-ink/5 backdrop-blur-xl p-8 rounded-[32px] sticky top-24 shadow-xl">
                            <h3 className="text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-6">Unified Portal Link</h3>

                            <div className="space-y-6">
                                <div className="bg-white p-5 rounded-3xl inline-block mx-auto w-full flex justify-center shadow-2xl">
                                    <QRCodeSVG value={publicRegUrl || 'https://ztoevent.com'} size={160} />
                                </div>
                                <Link href={publicRegPath || '#'} target="_blank" className="flex items-center justify-center gap-3 w-full bg-accent text-white rounded-2xl px-6 py-4 font-black text-[10px] tracking-widest uppercase shadow-lg hover:scale-[1.02] transition-all">
                                    <i className="fa-solid fa-external-link" />
                                    Open All-in-One Event Portal
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

            ) : (
                /* ═══════════════════════════════════════════════════════
                   TAB 3: REGISTRATIONS & EXPORT
                ════════════════════════════════════════════════════════ */
                <div className="flex flex-col gap-6">
                    {/* Search & Export Toolbar */}
                    <div className="print:hidden flex flex-wrap items-center justify-between gap-4">
                        <div className="relative flex-1 min-w-[260px] max-w-md">
                            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search by name, organization, phone, or IC..."
                                className="w-full bg-black/40 border border-ink/10 rounded-2xl pl-10 pr-4 py-3 text-xs text-ink focus:outline-none focus:border-accent/40"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleExportCSV}
                                disabled={submissions.length === 0}
                                className="h-11 px-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-xs uppercase tracking-widest hover:bg-emerald-500/25 transition-all disabled:opacity-40 flex items-center gap-2"
                            >
                                <i className="fa-solid fa-file-excel" /> Export CSV / Excel
                            </button>
                            <PrintReportButton title="Registration Submissions" />
                        </div>
                    </div>

                    {filteredSubmissions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-ink/5 rounded-[32px] bg-ink/[0.02]">
                            <i className="fa-solid fa-users text-5xl text-zinc-800 mb-6" />
                            <h3 className="text-lg font-black text-zinc-600 uppercase tracking-widest">No Submissions Found</h3>
                            <p className="text-zinc-700 text-[10px] font-black uppercase mt-2 tracking-widest">
                                Share your portal link to start collecting registrations
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className={layoutType === 'table' ? 'print:hidden' : ''}>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filteredSubmissions.map(sub => {
                                        const details = sub.captain_details || {};
                                        const players: any[] = Array.isArray(sub.players) ? sub.players : [];
                                        const isGeneral = details.template === 'general_event';
                                        const paxCount = isGeneral ? (players.length || 1) : (players.length + 1);

                                        return (
                                            <div
                                                key={sub.id}
                                                onClick={() => setSelectedSub(sub)}
                                                className={`cursor-pointer bg-ink/[0.03] border border-ink/5 p-6 rounded-[24px] hover:border-accent/40 hover:shadow-[0_8px_32px_rgb(var(--c-accent-rgb)/0.15)] transition-all flex flex-col justify-between group ${
                                                    pageBreakIds.includes(sub.id) ? 'print:break-before-page' : ''
                                                }`}
                                            >
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-start">
                                                        <div className="px-3 py-1 bg-ink/5 border border-ink/10 rounded-full text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                                                            {new Date(sub.created_at).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {details.tshirt_size && (
                                                                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black uppercase">
                                                                    👕 {details.tshirt_size}
                                                                </span>
                                                            )}
                                                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent-bright opacity-60 group-hover:opacity-100 transition-opacity">
                                                                <i className="fa-solid fa-eye text-[10px]" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-1">
                                                            {sub.team_name || details.category || 'Registrant'}
                                                        </div>
                                                        <h4 className="text-lg font-black text-ink leading-tight uppercase font-display">
                                                            {sub.captain_name}
                                                        </h4>
                                                        {sub.organization_name && (
                                                            <p className="text-xs text-zinc-400 font-bold mt-1">{sub.organization_name}</p>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-4 py-3 border-y border-ink/5">
                                                        <div className="flex-1">
                                                            <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Phone / Contact</div>
                                                            <div className="text-xs font-bold text-zinc-300">{sub.captain_phone || sub.captain_email || '—'}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Total Pax</div>
                                                            <div className="text-xs font-black text-ink">{paxCount} Pax</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex items-center justify-between gap-3">
                                                    <span className="text-[10px] font-bold text-zinc-500 group-hover:text-accent-bright transition-colors">
                                                        Click to view full details →
                                                    </span>
                                                    <PrintBreakTrigger id={sub.id} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ── Compact Table (Print Only) ── */}
                            {layoutType === 'table' && (
                                <div className="hidden print:block w-full">
                                    <table className="w-full text-left text-[11px] border-collapse border border-black/20">
                                        <thead>
                                            <tr className="bg-black/5 border-b-2 border-black">
                                                <th className="py-2 px-3 font-black uppercase">Name</th>
                                                <th className="py-2 px-3 font-black uppercase">Organization / Category</th>
                                                <th className="py-2 px-3 font-black uppercase">Contact</th>
                                                <th className="py-2 px-3 font-black uppercase text-center">Pax</th>
                                                <th className="py-2 px-3 font-black uppercase">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredSubmissions.map((sub) => (
                                                <tr key={sub.id} className={`border-b border-black/20 ${pageBreakIds.includes(sub.id) ? 'print:break-before-page' : ''}`}>
                                                    <td className="py-2 px-3 font-bold">{sub.captain_name}</td>
                                                    <td className="py-2 px-3">{sub.organization_name}</td>
                                                    <td className="py-2 px-3">{sub.captain_phone}</td>
                                                    <td className="py-2 px-3 text-center font-bold">{sub.players?.length || 1}</td>
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

            {/* ── Submission Detail Modal ── */}
            {selectedSub && (
                <div
                    onClick={() => setSelectedSub(null)}
                    className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[88vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">
                                    Registration Details
                                </div>
                                <h3 className="text-2xl font-black text-white uppercase">{selectedSub.captain_name}</h3>
                                <p className="text-xs text-zinc-400 mt-1">{selectedSub.organization_name}</p>
                            </div>
                            <button
                                onClick={() => setSelectedSub(null)}
                                className="w-9 h-9 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
                            >
                                <i className="fa-solid fa-xmark" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-black/40 p-4 rounded-2xl border border-zinc-800 text-xs">
                            <div>
                                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Phone</span>
                                <span className="text-white font-bold">{selectedSub.captain_phone || '—'}</span>
                            </div>
                            <div>
                                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Email</span>
                                <span className="text-white font-bold break-all">{selectedSub.captain_email || '—'}</span>
                            </div>
                            <div>
                                <span className="text-zinc-500 block text-[10px] uppercase font-bold">IC / Passport</span>
                                <span className="text-white font-bold">{selectedSub.captain_ic || '—'}</span>
                            </div>
                            <div>
                                <span className="text-zinc-500 block text-[10px] uppercase font-bold">BIB Name / Role</span>
                                <span className="text-white font-bold">{selectedSub.captain_details?.bib_name || selectedSub.captain_role || selectedSub.captain_details?.staff_id || '—'}</span>
                            </div>
                            <div>
                                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Jersey / T-Shirt Size</span>
                                <span className="text-amber-400 font-bold">{selectedSub.captain_details?.tshirt_size || '—'}</span>
                            </div>
                            <div>
                                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Blood Type / Dietary</span>
                                <span className="text-white font-bold">{selectedSub.captain_details?.blood_type || selectedSub.captain_details?.dietary || '—'}</span>
                            </div>
                            {selectedSub.captain_details?.total_fee_rm > 0 && (
                                <div>
                                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Total Fee</span>
                                    <span className="text-emerald-400 font-black">RM {Number(selectedSub.captain_details.total_fee_rm).toFixed(2)}</span>
                                </div>
                            )}
                            {selectedSub.captain_details?.emergency_contact?.name && (
                                <div className="col-span-2">
                                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Emergency Contact</span>
                                    <span className="text-white font-bold">
                                        {selectedSub.captain_details.emergency_contact.name} ({selectedSub.captain_details.emergency_contact.relationship || 'Contact'}) — {selectedSub.captain_details.emergency_contact.phone || '—'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {selectedSub.captain_details?.remarks && (
                            <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800 text-xs">
                                <span className="text-zinc-500 block text-[10px] uppercase font-bold mb-1">Remarks / Notes</span>
                                <p className="text-zinc-200 whitespace-pre-line">{selectedSub.captain_details.remarks}</p>
                            </div>
                        )}

                        {(selectedSub.captain_ic_url || selectedSub.captain_details?.payment_receipt_url) && (
                            <div className="flex flex-wrap gap-3">
                                {selectedSub.captain_ic_url && (
                                    <a
                                        href={selectedSub.captain_ic_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-accent-bright hover:bg-white/10 flex items-center gap-2"
                                    >
                                        <i className="fa-solid fa-id-card" /> View Uploaded IC / Document ↗
                                    </a>
                                )}
                                {selectedSub.captain_details?.payment_receipt_url && (
                                    <a
                                        href={selectedSub.captain_details.payment_receipt_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-2"
                                    >
                                        <i className="fa-solid fa-receipt" /> View Payment Receipt ↗
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Participants / Players List */}
                        {Array.isArray(selectedSub.players) && selectedSub.players.length > 0 && (
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">
                                    Participant List ({selectedSub.players.length})
                                </h4>
                                <div className="space-y-2">
                                    {selectedSub.players.map((p: any, i: number) => (
                                        <div key={i} className="bg-black/40 border border-zinc-800 px-4 py-3 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                                            <div>
                                                <span className="text-zinc-500 font-mono mr-2">#{i + 1}</span>
                                                <span className="font-bold text-white">{p.name}</span>
                                                {p.category && <span className="ml-2 text-zinc-400">({p.category})</span>}
                                            </div>
                                            <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                                                {p.ic && <span>IC: {p.ic}</span>}
                                                {p.tshirt_size && <span className="text-amber-400 font-bold">Size: {p.tshirt_size}</span>}
                                                {p.dietary && <span>{p.dietary}</span>}
                                                {p.ic_url && (
                                                    <a href={p.ic_url} target="_blank" rel="noopener noreferrer" className="text-accent-bright underline">
                                                        IC Photo
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                            <button
                                type="button"
                                onClick={() => handleDeleteSubmission(selectedSub.id)}
                                className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white text-xs font-bold transition-colors flex items-center gap-2"
                            >
                                <i className="fa-solid fa-trash-can" /> Delete Entry
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedSub(null)}
                                className="px-6 py-2.5 rounded-xl bg-zinc-800 text-white text-xs font-bold hover:bg-zinc-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
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
