'use client';

import React, { useEffect, useState } from 'react';
import { CourseSection, Station } from './CourseSection';
import {
    LANG_META,
    PORTAL_UI,
    fmtDateByLang,
    normalizeLang,
    type PortalLang,
} from './portalI18n';

export type RegState = 'open' | 'not_open' | 'closed' | 'info_only';

type Props = {
    project: any;
    settings: any;
    regState: RegState;
    children: React.ReactNode; // registration form
};

const DEFAULT_SIZE_CHART = [
    { size: 'XS', chest: '36"', length: '25"' },
    { size: 'S', chest: '38"', length: '26"' },
    { size: 'M', chest: '40"', length: '27"' },
    { size: 'L', chest: '42"', length: '28"' },
    { size: 'XL', chest: '44"', length: '29"' },
    { size: '2XL', chest: '46"', length: '30"' },
    { size: '3XL', chest: '48"', length: '31"' },
    { size: 'Kids S', chest: '28"', length: '19"' },
    { size: 'Kids M', chest: '30"', length: '20.5"' },
    { size: 'Kids L', chest: '32"', length: '22"' },
    { size: 'Kids XL', chest: '34"', length: '23.5"' },
];

// ── helpers ─────────────────────────────────────────────────────
export function parseFee(v: any): number | null {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return v;
    const m = String(v).match(/(\d+(?:\.\d{1,2})?)/);
    return m ? parseFloat(m[1]) : null;
}

function fmtDate(d?: string | null, withWeekday = true) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-MY', {
        ...(withWeekday ? { weekday: 'short' as const } : {}),
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function fmtTime(t?: string) {
    if (!t) return '';
    if (/am|pm/i.test(t)) return t.toUpperCase();
    const m = t.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return t;
    let h = parseInt(m[1], 10);
    const ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m[2]} ${ap}`;
}

function splitLines(s?: string | null): string[] {
    if (!s) return [];
    return s
        .split('\n')
        .map(l => l.replace(/^\s*(\d+[.)]|[-•*])\s*/, '').trim())
        .filter(Boolean);
}

function normalizeSchedule(raw: any): { date?: string; time: string; label: string; notes?: string; highlight?: boolean }[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((it: any) => ({
            date: it.date || undefined,
            time: it.time
                ? fmtTime(it.time)
                : [fmtTime(it.time_start), fmtTime(it.time_end)].filter(Boolean).join(' – '),
            label: it.label || it.title || '',
            notes: it.notes || it.desc || undefined,
            highlight: !!it.highlight,
        }))
        .filter(it => it.label);
}

// ── component ───────────────────────────────────────────────────
export function EventPortal({ project, settings, regState, children }: Props) {
    const accent: string = settings.theme_color || '#f59e0b';
    const isInfoOnly = regState === 'info_only';
    const fc = settings.fields_config || {};
    const run = fc.run_config || {};

    const supportedLangs: PortalLang[] = (Array.isArray(run.languages) ? run.languages : []).filter(
        (l: string): l is PortalLang => l === 'zh' || l === 'en' || l === 'bm'
    );
    const hasMultiLang = supportedLangs.length > 1;
    const [lang, setLang] = useState<PortalLang>(() =>
        normalizeLang(run.default_language, supportedLangs, 'en')
    );

    const schedulePosters: { lang: string; lang_code?: string; label: string; url: string }[] = Array.isArray(run.schedule_posters)
        ? run.schedule_posters
        : [];
    const defaultPosterIdx = Math.max(
        0,
        schedulePosters.findIndex(sp => sp.lang_code === lang)
    );
    const [lightboxImg, setLightboxImg] = useState<string | null>(null);
    const [activePosterIdx, setActivePosterIdx] = useState(defaultPosterIdx);
    const [scheduleMode, setScheduleMode] = useState<'poster' | 'timeline'>(() =>
        schedulePosters.length > 0 && (schedulePosters.some(sp => sp.lang_code === lang) || !hasMultiLang)
            ? 'poster'
            : 'timeline'
    );
    const [copied, setCopied] = useState(false);
    const [activeSection, setActiveSection] = useState('overview');

    const applyLangSelection = (next: PortalLang, syncUrl = true) => {
        setLang(next);
        const matchIdx = schedulePosters.findIndex(sp => sp.lang_code === next);
        if (matchIdx >= 0) {
            setActivePosterIdx(matchIdx);
            setScheduleMode('poster');
        } else if (hasMultiLang) {
            setScheduleMode('timeline');
        }
        if (syncUrl && typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('lang', next);
            window.history.replaceState(null, '', url.toString());
        }
    };

    useEffect(() => {
        if (!hasMultiLang || typeof window === 'undefined') return;
        const param = new URLSearchParams(window.location.search).get('lang');
        if (param) {
            const parsed = normalizeLang(param, supportedLangs, lang);
            if (parsed !== lang) applyLangSelection(parsed, false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const ui = PORTAL_UI[hasMultiLang ? lang : 'en'];
    const L = (hasMultiLang && run.i18n && run.i18n[lang]) || {};

    const heroBannerUrl: string | null = L.hero_banner_url || settings.hero_banner_url || null;
    const title: string = L.slogan || settings.slogan || project?.name || 'Event Registration';
    const titleSponsorLabel: string | undefined = L.title_sponsor_label || settings.title_sponsor_label;
    const titleSponsor: string | undefined = L.title_sponsor || settings.title_sponsor;
    const eventDesc: string | undefined = L.event_description !== undefined ? L.event_description : settings.event_description;

    const categories: any[] = Array.isArray(settings.categories) ? settings.categories.filter((c: any) => c?.name) : [];
    const schedule = normalizeSchedule(Array.isArray(L.event_schedule) ? L.event_schedule : settings.event_schedule);
    const prizes: any[] = Array.isArray(settings.prize_pool) ? settings.prize_pool.filter((p: any) => p?.category) : [];
    const social = settings.social_links || {};
    const venueName: string = L.venue_name || settings.venue_name || project?.venue || '';
    const venueAddress: string = L.venue_address || settings.venue_address || '';
    const mapQuery = venueAddress ? `${venueName} ${venueAddress}` : venueName;
    const fees = categories.map(c => parseFee(c.fee)).filter((n): n is number => n !== null && n > 0);
    const minFee = fees.length ? Math.min(...fees) : null;
    const stations: Station[] = Array.isArray(L.stations)
        ? L.stations
        : Array.isArray(run.stations)
            ? run.stations
            : [];
    const hasCourse = !!fc.enable_run_module && stations.length > 0 && categories.some(c => Number(c.distance_km) > 0);
    const spotlight = L.spotlight ? { ...(run.spotlight || {}), ...L.spotlight } : run.spotlight;
    const storyCards: any[] = Array.isArray(L.story_cards)
        ? L.story_cards
        : Array.isArray(run.story_cards)
            ? run.story_cards
            : [];
    const quickTips: { icon?: string; title: string; detail?: string; color?: string }[] = Array.isArray(L.quick_tips)
        ? L.quick_tips
        : Array.isArray(run.quick_tips)
            ? run.quick_tips
            : [];
    const posters: { label: string; lang?: string; url: string }[] = Array.isArray(L.posters)
        ? L.posters
        : Array.isArray(run.posters)
            ? run.posters
            : [];
    const secondaryVenue = L.secondary_venue ? { ...(run.secondary_venue || {}), ...L.secondary_venue } : run.secondary_venue;
    const unifiedRouteVenue = !!run.unified_route_venue;
    const scheduleIncludesTips = !!run.schedule_includes_tips;
    const showCategoriesSection = run.show_categories !== false && categories.length > 0;
    const rules = splitLines(settings.rules);
    const notes = splitLines(settings.format_description);
    const faq: { q: string; a: string }[] = Array.isArray(L.faq) ? L.faq : Array.isArray(run.faq) ? run.faq : [];
    const repc = run.repc;
    const sizeChart: any[] = Array.isArray(run.size_chart) && run.size_chart.length ? run.size_chart : DEFAULT_SIZE_CHART;
    const showSizeChart = !!fc.show_tshirt_size;
    const whatsapp = social.whatsapp ? `https://wa.me/${String(social.whatsapp).replace(/\D/g, '')}` : null;
    const hasPrizeTiers = prizes.some(p => p.champion || p.runner_up || p.second_runner_up);
    const hasInfo = !scheduleIncludesTips && (rules.length > 0 || notes.length > 0 || faq.length > 0 || showSizeChart || posters.length > 0 || quickTips.length > 0);

    const startPoint = L.start_point ? { ...(run.start_point || {}), ...L.start_point } : run.start_point;
    const finishPoint = L.finish_point ? { ...(run.finish_point || {}), ...L.finish_point } : run.finish_point;
    const parkingNote = L.parking !== undefined ? L.parking : run.parking;
    const primaryVenueBadge = L.primary_venue_badge !== undefined ? L.primary_venue_badge : run.primary_venue_badge;
    const villageFacilities = Array.isArray(L.village_facilities) ? L.village_facilities : run.village_facilities;
    const quickFacts = Array.isArray(L.quick_facts) ? L.quick_facts : run.quick_facts;

    const closeTs = settings.reg_close_date
        ? new Date(String(settings.reg_close_date).includes('T') ? settings.reg_close_date : `${settings.reg_close_date}T23:59:59`).getTime()
        : null;
    const daysLeft = closeTs !== null && !Number.isNaN(closeTs)
        ? Math.ceil((closeTs - Date.now()) / 86400000)
        : null;

    const routeNavFallback = unifiedRouteVenue
        ? ui.nav.routeVenue
        : run.route_type === 'point_to_point'
            ? ui.nav.route
            : 'Route & Water Stations';

    const navItems = [
        { id: 'overview', label: L.overview_nav_label || ui.nav.overview, show: true },
        { id: 'spotlight', label: spotlight?.nav_label || ui.nav.spotlight, show: !!spotlight },
        { id: 'categories', label: hasCourse ? 'Categories & Fees' : ui.nav.categories, show: showCategoriesSection },
        { id: 'route', label: L.route_nav_label || run.route_nav_label || routeNavFallback, show: hasCourse },
        { id: 'schedule', label: L.schedule_nav_label || ui.nav.schedule, show: schedule.length > 0 || !!repc || schedulePosters.length > 0 },
        { id: 'prizes', label: ui.nav.prizes, show: prizes.length > 0 },
        { id: 'info', label: L.info_nav_label || run.info_nav_label || (isInfoOnly ? ui.nav.info : 'Rules & FAQ'), show: hasInfo },
        { id: 'venue', label: ui.nav.venue, show: !!venueName && !unifiedRouteVenue },
        { id: 'register', label: ui.nav.register, show: !isInfoOnly },
    ].filter(n => n.show);

    useEffect(() => {
        const obs = new IntersectionObserver(
            entries => {
                entries.forEach(e => {
                    if (e.isIntersecting) setActiveSection(e.target.id);
                });
            },
            { rootMargin: '-35% 0px -60% 0px' }
        );
        navItems.forEach(n => {
            const el = document.getElementById(n.id);
            if (el) obs.observe(el);
        });
        return () => obs.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navItems.length]);

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
    };

    const pickCategoryAndScroll = (categoryName: string) => {
        window.dispatchEvent(new CustomEvent('zto:select-category', { detail: categoryName }));
        const el = document.getElementById('register');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const highlights: { icon?: string; label: string; detail?: string }[] = Array.isArray(run.highlights) ? run.highlights : [];

    const activeDateStr = fmtDateByLang(project?.start_date, hasMultiLang ? lang : 'en', true);
    const activeDateShort = fmtDateByLang(project?.start_date, hasMultiLang ? lang : 'en', false);

    const statusPill =
        regState === 'info_only' ? (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {L.status_badge || run.status_badge || 'Event Information · Free Admission'}
            </span>
        ) : regState === 'open' ? (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Registration open{daysLeft !== null && daysLeft >= 0 ? ` · ${daysLeft} days left` : ''}
            </span>
        ) : regState === 'not_open' ? (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-black uppercase tracking-wider">
                <i className="fa-regular fa-clock" /> Opens {fmtDate(settings.reg_open_date, false)}
            </span>
        ) : (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-black uppercase tracking-wider">
                <i className="fa-solid fa-lock" /> Registration closed
            </span>
        );

    const defaultFacts = [
        project?.start_date && {
            icon: 'fa-regular fa-calendar',
            label: 'Event date',
            value: fmtDate(project.start_date) + (project.end_date && project.end_date !== project.start_date ? ` – ${fmtDate(project.end_date)}` : ''),
            sub: run.time_summary || (categories.map(c => c.flag_off).filter(Boolean).length
                ? `First flag-off ${[...categories.map(c => c.flag_off).filter(Boolean)].sort((a, b) => toMin(a) - toMin(b))[0]}`
                : undefined),
        },
        venueName && { icon: 'fa-solid fa-location-dot', label: run.start_label || 'Venue', value: venueName, sub: run.city || undefined },
        run.finish_venue && {
            icon: 'fa-solid fa-flag-checkered',
            label: 'Finish point',
            value: run.finish_venue,
            sub: run.finish_note || undefined,
        },
        showCategoriesSection && {
            icon: hasCourse ? 'fa-solid fa-person-running' : 'fa-solid fa-layer-group',
            label: 'Categories',
            value: categories.map(c => c.short || c.name).join(' · '),
            sub: `${categories.length} categories`,
        },
        minFee !== null
            ? { icon: 'fa-solid fa-ticket', label: 'Entry fee', value: `From RM ${minFee}`, sub: fees.length > 1 ? `Up to RM ${Math.max(...fees)}` : undefined }
            : run.admission_label
                ? { icon: 'fa-solid fa-ticket', label: 'Admission', value: run.admission_label, sub: run.admission_sub || undefined }
                : null,
        run.after_event_fact && {
            icon: run.after_event_fact.icon || 'fa-solid fa-hands-praying',
            label: run.after_event_fact.label || 'After parade',
            value: run.after_event_fact.value,
            sub: run.after_event_fact.sub || undefined,
        },
        !isInfoOnly && settings.reg_close_date && {
            icon: 'fa-solid fa-hourglass-half',
            label: 'Registration closes',
            value: fmtDate(settings.reg_close_date, false),
            sub: regState === 'open' && daysLeft !== null ? `${daysLeft} days left` : undefined,
        },
    ].filter(Boolean) as { icon: string; label: string; value: string; sub?: string }[];

    const facts: { icon: string; label: string; value: string; sub?: string }[] = Array.isArray(L.facts) && L.facts.length > 0
        ? L.facts
        : defaultFacts;

    const factsGridCols =
        facts.length >= 5
            ? 'lg:grid-cols-5'
            : facts.length === 4
                ? 'lg:grid-cols-4'
                : facts.length === 3
                    ? 'lg:grid-cols-3'
                    : facts.length === 2
                        ? 'lg:grid-cols-2'
                        : 'lg:grid-cols-1';

    return (
        <div className="min-h-screen w-full overflow-x-clip bg-[#07080b] text-zinc-300 font-sans pb-24 lg:pb-0" style={{ ['--accent' as any]: accent }}>
            {/* ── TOP BAR ───────────────────────────────────────── */}
            <div className="sticky top-0 z-50 bg-black/85 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center gap-3 md:gap-4">
                    <img
                        src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
                        alt="ZTO"
                        className="w-7 h-7 rounded object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-black text-white truncate uppercase tracking-wide">{title}</div>
                        <div className="text-[10px] text-zinc-500 truncate">
                            {[activeDateShort, venueName].filter(Boolean).join(' · ')}
                        </div>
                    </div>
                    {hasMultiLang && (
                        <div className="inline-flex items-center p-0.5 rounded-xl bg-zinc-900 border border-white/15 shrink-0" role="group" aria-label="Language">
                            {supportedLangs.map(code => {
                                const active = lang === code;
                                return (
                                    <button
                                        key={code}
                                        type="button"
                                        onClick={() => applyLangSelection(code)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black tracking-wide transition-colors cursor-pointer ${
                                            active ? 'text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                                        }`}
                                        style={active ? { backgroundColor: accent } : undefined}
                                    >
                                        {LANG_META[code].short}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    {whatsapp && (
                        <a
                            href={whatsapp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20"
                        >
                            <i className="fa-brands fa-whatsapp" /> {ui.enquiry}
                        </a>
                    )}
                    {regState === 'open' && (
                        <a
                            href="#register"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider text-black hover:opacity-90"
                            style={{ backgroundColor: accent }}
                        >
                            Register
                        </a>
                    )}
                    {isInfoOnly && (
                        <a
                            href={hasCourse ? '#route' : '#schedule'}
                            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider text-black hover:opacity-90 shrink-0"
                            style={{ backgroundColor: accent }}
                        >
                            <i className="fa-solid fa-route" /> {L.top_cta_label || run.top_cta_label || (hasCourse ? ui.viewRoute : ui.viewSchedule)}
                        </a>
                    )}
                </div>
            </div>

            {/* ── HERO ──────────────────────────────────────────── */}
            <header className="relative overflow-hidden">
                {heroBannerUrl && (
                    <div
                        className="absolute inset-0 bg-cover bg-center blur-3xl opacity-25 scale-110"
                        style={{ backgroundImage: `url(${heroBannerUrl})` }}
                    />
                )}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse at 50% 0%, ${accent}22, transparent 60%), linear-gradient(to bottom, transparent 40%, #07080b)` }}
                />

                <div className="relative max-w-6xl mx-auto px-4 md:px-6 pt-6 md:pt-8">
                    {heroBannerUrl && (
                        <button
                            type="button"
                            onClick={() => setLightboxImg(heroBannerUrl)}
                            className="block w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl cursor-zoom-in"
                        >
                            <img key={heroBannerUrl} src={heroBannerUrl} alt={title} className="w-full h-auto max-h-[560px] object-cover" />
                        </button>
                    )}

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-8 pb-8">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                {statusPill}
                                {settings.logo_url && (
                                    <img src={settings.logo_url} alt="logo" className="h-7 w-auto rounded bg-white/5 p-0.5" />
                                )}
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-[1.08]">{title}</h1>
                            {titleSponsor && (
                                <p className="mt-3 text-sm text-zinc-300">
                                    {titleSponsorLabel && (
                                        <span className="font-bold mr-1.5" style={{ color: accent }}>{titleSponsorLabel}:</span>
                                    )}
                                    {titleSponsor}
                                </p>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-3 shrink-0">
                            {regState === 'open' && (
                                <a
                                    href="#register"
                                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-black uppercase tracking-wider text-black hover:opacity-90 shadow-lg"
                                    style={{ backgroundColor: accent, boxShadow: `0 10px 30px ${accent}40` }}
                                >
                                    <i className="fa-solid fa-pen-to-square" /> Register now
                                </a>
                            )}
                            {isInfoOnly && hasCourse && (
                                <a
                                    href="#route"
                                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-black uppercase tracking-wider text-black hover:opacity-90 shadow-lg"
                                    style={{ backgroundColor: accent, boxShadow: `0 10px 30px ${accent}40` }}
                                >
                                    <i className="fa-solid fa-route" /> {L.hero_primary_cta || ui.viewRoute}
                                </a>
                            )}
                            {isInfoOnly && spotlight && (
                                <a
                                    href="#spotlight"
                                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold text-white border border-white/15 hover:bg-white/5"
                                >
                                    <i className="fa-solid fa-music" /> {spotlight.cta_label || ui.unitedWorship}
                                </a>
                            )}
                            {!isInfoOnly && hasCourse && (
                                <a
                                    href="#route"
                                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold text-white border border-white/15 hover:bg-white/5"
                                >
                                    <i className="fa-solid fa-route" /> View route
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Key facts */}
                    {facts.length > 0 && (
                        <div className={`grid grid-cols-2 ${factsGridCols} gap-px rounded-2xl overflow-hidden border border-white/10 bg-white/10`}>
                            {facts.map((f, i) => (
                                <div key={i} className={`bg-zinc-950/95 p-4 md:p-5 ${i === facts.length - 1 && facts.length % 2 === 1 ? 'col-span-2 lg:col-span-1' : ''}`}>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                        <i className={`${f.icon} text-[11px]`} style={{ color: accent }} />
                                        {f.label}
                                    </div>
                                    <div className="mt-1.5 text-sm md:text-[15px] font-black text-white leading-snug">{f.value}</div>
                                    {f.sub && <div className="text-[11px] text-zinc-500 mt-0.5">{f.sub}</div>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </header>

            {/* ── SECTION NAV ───────────────────────────────────── */}
            <nav className="sticky top-14 z-40 mt-8 bg-[#07080b]/90 backdrop-blur-xl border-y border-white/5">
                <div className="max-w-6xl mx-auto px-4 md:px-6 flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                    {navItems.map(n => {
                        const active = activeSection === n.id;
                        return (
                            <a
                                key={n.id}
                                href={`#${n.id}`}
                                className={`whitespace-nowrap px-3.5 py-3.5 text-[11px] font-black uppercase tracking-wider border-b-2 transition-colors ${active ? 'text-white' : 'text-zinc-500 border-transparent hover:text-zinc-300'
                                    }`}
                                style={active ? { borderColor: accent } : undefined}
                            >
                                {n.label}
                            </a>
                        );
                    })}
                </div>
            </nav>

            {/* ── MAIN ──────────────────────────────────────────── */}
            <main className="max-w-6xl mx-auto px-4 md:px-6 py-10 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_320px] gap-10">
                <div className="space-y-14 min-w-0">
                    {/* Overview */}
                    <Section
                        id="overview"
                        eyebrow={L.overview_eyebrow || run.overview_eyebrow || 'About the event'}
                        title={L.overview_title || run.overview_title || ui.nav.overview}
                        sub={L.overview_sub !== undefined ? L.overview_sub : (run.overview_sub || undefined)}
                        accent={accent}
                    >
                        {eventDesc && (
                            <p className="text-[15px] text-zinc-300 leading-relaxed whitespace-pre-line">{eventDesc}</p>
                        )}
                        {!eventDesc && storyCards.length === 0 && (
                            <p className="text-sm text-zinc-500">{ui.overviewFallback}</p>
                        )}
                        {storyCards.length > 0 && (
                            <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-4 ${eventDesc ? 'mt-6' : ''}`}>
                                {storyCards.map((card, i) => (
                                    <div
                                        key={i}
                                        className="group rounded-3xl border border-white/10 bg-zinc-900/70 overflow-hidden flex flex-col hover:border-white/20 transition-all"
                                    >
                                        {card.image && (
                                            <button
                                                type="button"
                                                onClick={() => setLightboxImg(card.image)}
                                                className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950 cursor-zoom-in text-left"
                                            >
                                                <img
                                                    src={card.image}
                                                    alt={card.title}
                                                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                                                {card.badge && (
                                                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                                                        <span className="text-[11px] font-bold text-zinc-100 drop-shadow truncate">
                                                            {card.badge}
                                                        </span>
                                                    </div>
                                                )}
                                            </button>
                                        )}
                                        <div className="p-4 md:p-5 flex-1 flex flex-col">
                                            {(card.step || card.time) && (
                                                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                                                    {card.step && (
                                                        <span
                                                            className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-black"
                                                            style={{ backgroundColor: accent }}
                                                        >
                                                            {card.step}
                                                        </span>
                                                    )}
                                                    {card.time && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-800 text-zinc-200 border border-white/10">
                                                            {card.time}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex items-start gap-2.5">
                                                {card.icon && (
                                                    <span
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs mt-0.5 bg-white/5"
                                                        style={{ color: accent }}
                                                    >
                                                        <i className={card.icon} />
                                                    </span>
                                                )}
                                                <div className="min-w-0">
                                                    <div className="text-sm font-black text-white leading-snug">{card.title}</div>
                                                    {card.subtitle && (
                                                        <div className="text-xs text-zinc-400 mt-1 leading-snug">{card.subtitle}</div>
                                                    )}
                                                </div>
                                            </div>
                                            {card.anchor && card.cta && (
                                                <a
                                                    href={card.anchor}
                                                    className="mt-4 pt-3 border-t border-white/5 inline-flex items-center justify-between text-[11px] font-black uppercase tracking-wider hover:opacity-80 transition-opacity"
                                                    style={{ color: accent }}
                                                >
                                                    <span>{card.cta}</span>
                                                    <i className="fa-solid fa-arrow-right text-[10px]" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {highlights.length > 0 && (
                            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                                {highlights.map((h, i) => (
                                    <div key={i} className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
                                        {h.icon && <i className={`${h.icon} text-sm mb-2`} style={{ color: accent }} />}
                                        <div className="text-xs font-black text-white">{h.label}</div>
                                        {h.detail && <div className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{h.detail}</div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>

                    {/* Spotlight: Post-Parade Finale & Churches */}
                    {spotlight && (
                        <Section
                            id="spotlight"
                            eyebrow={spotlight.eyebrow || 'Featured Program Highlight'}
                            title={spotlight.title || 'Post-Parade United Celebration'}
                            sub={spotlight.subtitle || undefined}
                            accent={accent}
                        >
                            <div
                                className="rounded-3xl border border-white/15 bg-zinc-900/70 overflow-hidden"
                                style={{ boxShadow: `0 20px 60px ${accent}14` }}
                            >
                                {spotlight.hero_image ? (
                                    <button
                                        type="button"
                                        onClick={() => setLightboxImg(spotlight.hero_image)}
                                        className="relative w-full h-56 md:h-64 overflow-hidden bg-black text-left block cursor-zoom-in group border-b border-white/10"
                                    >
                                        <img
                                            src={spotlight.hero_image}
                                            alt={spotlight.venue || spotlight.title}
                                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 opacity-85"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/45 to-black/20" />
                                        <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
                                            <div className="flex flex-wrap items-center gap-2 mb-2.5">
                                                {spotlight.badge && (
                                                    <span
                                                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-black"
                                                        style={{ backgroundColor: accent }}
                                                    >
                                                        <i className="fa-solid fa-music" /> {spotlight.badge}
                                                    </span>
                                                )}
                                                {spotlight.time && (
                                                    <span className="text-xs font-mono font-bold text-amber-200 bg-black/70 border border-white/15 px-3 py-1 rounded-full backdrop-blur-sm">
                                                        <i className="fa-regular fa-clock mr-1.5" style={{ color: accent }} />
                                                        {spotlight.time}
                                                    </span>
                                                )}
                                            </div>
                                            {spotlight.venue && (
                                                <div className="flex items-center gap-2.5 text-lg md:text-2xl font-black text-white">
                                                    <i className="fa-solid fa-church text-base shrink-0" style={{ color: accent }} />
                                                    <span>{spotlight.venue}</span>
                                                </div>
                                            )}
                                            {spotlight.venue_note && (
                                                <p className="text-xs md:text-[13px] text-zinc-200 mt-1 max-w-2xl">{spotlight.venue_note}</p>
                                            )}
                                        </div>
                                    </button>
                                ) : (
                                    <div
                                        className="p-6 md:p-7 border-b border-white/10"
                                        style={{ background: `linear-gradient(135deg, ${accent}22, rgba(24,24,27,0.4) 60%)` }}
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            {spotlight.badge && (
                                                <span
                                                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-black"
                                                    style={{ backgroundColor: accent }}
                                                >
                                                    <i className="fa-solid fa-music" /> {spotlight.badge}
                                                </span>
                                            )}
                                            {spotlight.time && (
                                                <span className="text-xs font-mono font-bold text-amber-200 bg-black/40 border border-white/10 px-3 py-1 rounded-lg">
                                                    <i className="fa-regular fa-clock mr-1.5" style={{ color: accent }} />
                                                    {spotlight.time}
                                                </span>
                                            )}
                                        </div>
                                        {spotlight.venue && (
                                            <div className="mt-4 flex items-start gap-3">
                                                <i className="fa-solid fa-church mt-1 text-base shrink-0" style={{ color: accent }} />
                                                <div>
                                                    <div className="text-lg md:text-xl font-black text-white">{spotlight.venue}</div>
                                                    {spotlight.venue_note && (
                                                        <p className="text-[13px] text-zinc-300 mt-1.5 leading-relaxed">{spotlight.venue_note}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {Array.isArray(spotlight.churches) && spotlight.churches.length > 0 && (
                                    <div className="p-6 md:p-7">
                                        <div className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-4">
                                            {spotlight.highlight_note || 'Co-led by participating denominations & worship teams'}
                                        </div>
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            {spotlight.churches.map((ch: any, idx: number) => {
                                                const cColor = ch.color || accent;
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="rounded-2xl border border-white/10 bg-black/45 p-4 flex items-start gap-3.5"
                                                    >
                                                        <span
                                                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-black text-black"
                                                            style={{ backgroundColor: cColor }}
                                                        >
                                                            <i className={ch.icon || 'fa-solid fa-place-of-worship'} />
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="text-sm font-black text-white leading-snug">{ch.name}</span>
                                                                {ch.badge && (
                                                                    <span
                                                                        className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10"
                                                                        style={{ color: cColor }}
                                                                    >
                                                                        {ch.badge}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {ch.name_zh && <div className="text-xs font-semibold text-zinc-300 mt-0.5">{ch.name_zh}</div>}
                                                            {ch.role && <div className="text-[11px] text-zinc-400 mt-1 leading-snug">{ch.role}</div>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Section>
                    )}

                    {/* Categories */}
                    {showCategoriesSection && (
                        <Section
                            id="categories"
                            eyebrow="Choose your challenge"
                            title={hasCourse ? 'Categories, fees & runner kit' : 'Categories & packages'}
                            accent={accent}
                        >
                            <div className={`grid gap-4 ${categories.length >= 3 ? 'md:grid-cols-3' : categories.length === 2 ? 'md:grid-cols-2' : ''}`}>
                                {categories.map((c, i) => {
                                    const color = c.color || accent;
                                    const ents: string[] = Array.isArray(c.entitlements) ? c.entitlements : [];
                                    return (
                                        <div key={i} className="rounded-3xl border border-white/10 bg-zinc-900/60 overflow-hidden flex flex-col">
                                            <div className="h-1.5" style={{ background: color }} />
                                            <div className="p-5 md:p-6 flex-1 flex flex-col">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="text-2xl md:text-3xl font-black text-white leading-none">{c.short || c.name}</div>
                                                        {(c.subtitle || (c.short && c.name)) && (
                                                            <div className="text-sm font-bold text-zinc-300 mt-1.5">{c.subtitle || c.name}</div>
                                                        )}
                                                        {c.name_zh && <div className="text-xs text-zinc-500">{c.name_zh}</div>}
                                                    </div>
                                                    {c.fee && (
                                                        <div className="text-right shrink-0">
                                                            <div className="text-xl font-black" style={{ color }}>{c.fee}</div>
                                                            <div className="text-[10px] text-zinc-500 uppercase font-bold">per runner</div>
                                                        </div>
                                                    )}
                                                </div>

                                                {(c.flag_off || c.cut_off || c.open_to) && (
                                                    <div className="grid grid-cols-2 gap-2 mt-5 text-xs">
                                                        {c.flag_off && <Meta label="Flag-off" value={c.flag_off} />}
                                                        {c.cut_off && <Meta label="Cut-off" value={c.cut_off} />}
                                                        {c.open_to && <Meta label="Eligibility" value={c.open_to} wide />}
                                                    </div>
                                                )}

                                                {ents.length > 0 ? (
                                                    <ul className="mt-5 pt-5 border-t border-white/5 space-y-2 text-[13px] text-zinc-300 flex-1">
                                                        {ents.map((e, j) => (
                                                            <li key={j} className="flex items-start gap-2.5">
                                                                <i className="fa-solid fa-check mt-1 text-[10px]" style={{ color }} />
                                                                <span>{e}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    c.description && <p className="mt-4 text-[13px] text-zinc-400 leading-relaxed flex-1">{c.description}</p>
                                                )}

                                                {regState === 'open' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => pickCategoryAndScroll(c.name)}
                                                        className="mt-5 w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-black transition-opacity hover:opacity-90 cursor-pointer flex items-center justify-center gap-2"
                                                        style={{ backgroundColor: color }}
                                                    >
                                                        <span>Register {c.short || 'now'}</span>
                                                        <i className="fa-solid fa-arrow-down text-[10px]" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Section>
                    )}

                    {/* Route & checkpoints / unified venues */}
                    {hasCourse && (
                        <Section
                            id="route"
                            eyebrow={L.route_eyebrow || run.route_eyebrow || (run.route_type === 'point_to_point' ? 'Parade Route' : 'Course')}
                            title={L.route_title || run.route_title || (run.route_type === 'point_to_point' ? 'Parade route & checkpoints' : 'Route & water stations')}
                            sub={L.route_sub !== undefined
                                ? L.route_sub
                                : (run.route_sub ?? (run.route_type === 'point_to_point'
                                    ? 'Point-to-point route map with gathering points and major landmarks.'
                                    : 'Out-and-back course. Every water station before the U-turn is passed twice.'))}
                            accent={accent}
                        >
                            {unifiedRouteVenue && venueName && (
                                <div className={`grid gap-4 mb-5 ${secondaryVenue?.name ? 'md:grid-cols-2' : ''}`}>
                                    <VenueNavCard
                                        badge={primaryVenueBadge}
                                        badgeTone="emerald"
                                        name={venueName}
                                        address={venueAddress}
                                        note={parkingNote}
                                        noteIcon="fa-solid fa-square-parking"
                                        lat={startPoint?.lat}
                                        lng={startPoint?.lng}
                                        mapUrl={settings.venue_map_url}
                                        query={mapQuery}
                                        googleLabel={ui.googleMaps}
                                        wazeLabel={ui.waze}
                                        accent={accent}
                                    />
                                    {secondaryVenue?.name && (
                                        <VenueNavCard
                                            badge={secondaryVenue.badge}
                                            badgeTone="rose"
                                            name={secondaryVenue.name}
                                            address={secondaryVenue.address}
                                            note={secondaryVenue.note}
                                            noteIcon="fa-solid fa-flag-checkered"
                                            lat={secondaryVenue.lat}
                                            lng={secondaryVenue.lng}
                                            mapUrl={secondaryVenue.map_url}
                                            query={secondaryVenue.query || secondaryVenue.name}
                                            googleLabel={ui.googleMaps}
                                            wazeLabel={ui.waze}
                                            accent={accent}
                                        />
                                    )}
                                </div>
                            )}

                            <CourseSection
                                categories={categories}
                                stations={stations}
                                villageFacilities={villageFacilities}
                                accent={accent}
                                courseMapUrl={run.course_map_url}
                                startPoint={startPoint}
                                endPoint={finishPoint}
                                routeType={run.route_type}
                                checkpointLabel={L.checkpoint_label || run.checkpoint_label}
                                detailLabel={L.detail_label || run.detail_label}
                                finishRowTitle={L.finish_row_title || run.finish_row_title}
                                venueMapQuery={mapQuery}
                                hideLinearBar={!!run.hide_linear_bar}
                                uiLabels={hasMultiLang ? ui.course : undefined}
                                localizedCatShort={L.course_short}
                                localizedCatSummary={L.course_summary}
                            />
                        </Section>
                    )}

                    {/* Schedule + REPC (+ unified Quick Tips when scheduleIncludesTips) */}
                    {(schedule.length > 0 || repc || schedulePosters.length > 0) && (
                        <Section
                            id="schedule"
                            eyebrow={L.schedule_eyebrow || run.schedule_eyebrow || 'Plan your day'}
                            title={repc ? 'Race pack collection & race day' : (L.schedule_title || run.schedule_title || 'Program schedule')}
                            sub={L.schedule_sub !== undefined ? L.schedule_sub : (run.schedule_sub || undefined)}
                            accent={accent}
                        >
                            {schedulePosters.length > 0 && scheduleIncludesTips ? (
                                <div className="space-y-4">
                                    <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-4 md:p-5">
                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                            <div className="flex flex-wrap items-center gap-1.5 bg-black/50 p-1 rounded-xl border border-white/10">
                                                {schedulePosters.map((sp, idx) => {
                                                    const isActive = scheduleMode === 'poster' && activePosterIdx === idx;
                                                    return (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => {
                                                                setScheduleMode('poster');
                                                                setActivePosterIdx(idx);
                                                            }}
                                                            className={`px-3 py-1.5 rounded-lg text-[11px] font-black tracking-wide cursor-pointer transition-colors ${
                                                                isActive ? 'text-black' : 'text-zinc-400 hover:text-white'
                                                            }`}
                                                            style={isActive ? { backgroundColor: accent } : undefined}
                                                        >
                                                            {sp.lang}
                                                        </button>
                                                    );
                                                })}
                                                {schedule.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setScheduleMode('timeline')}
                                                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black tracking-wide cursor-pointer transition-colors ${
                                                            scheduleMode === 'timeline' ? 'text-black' : 'text-zinc-400 hover:text-white'
                                                        }`}
                                                        style={scheduleMode === 'timeline' ? { backgroundColor: accent } : undefined}
                                                    >
                                                        {ui.timelineModeBtn}
                                                    </button>
                                                )}
                                            </div>
                                            {scheduleMode === 'poster' && (
                                                <span className="text-[11px] text-zinc-400">
                                                    <i className="fa-solid fa-magnifying-glass-plus mr-1" style={{ color: accent }} />
                                                    {ui.tapToZoom}
                                                </span>
                                            )}
                                        </div>

                                        {scheduleMode === 'poster' && schedulePosters[activePosterIdx] ? (
                                            <div className="space-y-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setLightboxImg(schedulePosters[activePosterIdx].url)}
                                                    className="w-full rounded-2xl overflow-hidden border border-white/10 bg-black cursor-zoom-in block"
                                                >
                                                    <img
                                                        src={schedulePosters[activePosterIdx].url}
                                                        alt={schedulePosters[activePosterIdx].label}
                                                        className="w-full h-auto max-h-[520px] object-contain mx-auto"
                                                    />
                                                </button>
                                                {L.poster_after_note && (
                                                    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3 flex items-center gap-3">
                                                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-black text-black shrink-0" style={{ backgroundColor: accent }}>
                                                            ~8:00 PM+
                                                        </span>
                                                        <span className="text-xs md:text-[13px] font-bold text-amber-100 leading-snug">
                                                            {L.poster_after_note}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="grid sm:grid-cols-2 gap-2.5">
                                                {schedule.map((s, i) => (
                                                    <div
                                                        key={i}
                                                        className={`rounded-2xl border p-3.5 flex items-start gap-3 ${s.highlight ? 'border-amber-500/30 bg-amber-500/[0.06]' : 'border-white/10 bg-black/35'
                                                            }`}
                                                    >
                                                        <span
                                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-black shrink-0 ${s.highlight ? 'text-black' : 'bg-white/5 text-zinc-300'
                                                                }`}
                                                            style={s.highlight ? { backgroundColor: accent } : undefined}
                                                        >
                                                            {s.time}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <div className="text-xs md:text-[13px] font-bold text-white leading-snug">{s.label}</div>
                                                            {s.notes && <div className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{s.notes}</div>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {quickTips.length > 0 && (
                                        <QuickTipsGrid tips={quickTips} accent={accent} columns={2} />
                                    )}
                                </div>
                            ) : (
                                <>
                                    {schedulePosters.length > 0 && (
                                        <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-4 md:p-5 mb-5">
                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                                <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-xl border border-white/10">
                                                    {schedulePosters.map((sp, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => setActivePosterIdx(idx)}
                                                            className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider cursor-pointer transition-colors ${
                                                                activePosterIdx === idx ? 'text-black' : 'text-zinc-400 hover:text-white'
                                                            }`}
                                                            style={activePosterIdx === idx ? { backgroundColor: accent } : undefined}
                                                        >
                                                            {sp.lang}
                                                        </button>
                                                    ))}
                                                </div>
                                                <span className="text-[11px] text-zinc-400">
                                                    <i className="fa-solid fa-magnifying-glass-plus mr-1" style={{ color: accent }} />
                                                    {ui.tapToZoom}
                                                </span>
                                            </div>
                                            {schedulePosters[activePosterIdx] && (
                                                <button
                                                    type="button"
                                                    onClick={() => setLightboxImg(schedulePosters[activePosterIdx].url)}
                                                    className="w-full rounded-2xl overflow-hidden border border-white/10 bg-black cursor-zoom-in block"
                                                >
                                                    <img
                                                        src={schedulePosters[activePosterIdx].url}
                                                        alt={schedulePosters[activePosterIdx].label}
                                                        className="w-full h-auto max-h-[500px] object-contain mx-auto"
                                                    />
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    <div className={`grid gap-5 ${repc && schedule.length ? 'md:grid-cols-[1fr_1.15fr]' : ''}`}>
                                        {repc && (
                                            <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-black" style={{ backgroundColor: accent }}>
                                                        <i className="fa-solid fa-box-open" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Before race day</div>
                                                        <div className="text-base font-black text-white">Race pack collection</div>
                                                    </div>
                                                </div>
                                                <dl className="space-y-3 text-sm">
                                                    {repc.dates && <Row icon="fa-regular fa-calendar" label="Date" value={repc.dates} accent={accent} />}
                                                    {repc.time && <Row icon="fa-regular fa-clock" label="Time" value={repc.time} accent={accent} />}
                                                    {repc.venue && <Row icon="fa-solid fa-location-dot" label="Venue" value={repc.venue} accent={accent} />}
                                                </dl>
                                                {Array.isArray(repc.bring) && repc.bring.length > 0 && (
                                                    <div className="pt-4 border-t border-white/5">
                                                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Please bring</div>
                                                        <ul className="space-y-1.5 text-[13px] text-zinc-300">
                                                            {repc.bring.map((b: string, i: number) => (
                                                                <li key={i} className="flex gap-2"><i className="fa-solid fa-check mt-1 text-[10px]" style={{ color: accent }} />{b}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {repc.notes && <p className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">{repc.notes}</p>}
                                            </div>
                                        )}

                                        {schedule.length > 0 && (
                                            <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5 md:p-6">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                                                    {project?.start_date ? fmtDate(project.start_date) : 'Event day'}
                                                </div>
                                                <div className="text-base font-black text-white mb-5">{run.schedule_title || (isInfoOnly ? 'Program schedule' : 'Race day schedule')}</div>
                                                <ol className="relative">
                                                    {schedule.map((s, i) => (
                                                        <li key={i} className="relative flex gap-4 pb-4 last:pb-0">
                                                            {i < schedule.length - 1 && <span className="absolute left-[76px] top-4 bottom-0 w-px bg-white/10" />}
                                                            <span className={`w-[64px] shrink-0 text-right font-mono text-xs font-black pt-0.5 ${s.highlight ? '' : 'text-zinc-400'}`} style={s.highlight ? { color: accent } : undefined}>
                                                                {s.time}
                                                            </span>
                                                            <span
                                                                className="relative z-10 mt-1.5 w-[9px] h-[9px] rounded-full shrink-0 ring-4 ring-zinc-900"
                                                                style={{ backgroundColor: s.highlight ? accent : '#52525b' }}
                                                            />
                                                            <div className="min-w-0">
                                                                {s.date && s.date !== project?.start_date && (
                                                                    <div className="text-[10px] font-bold text-zinc-500 uppercase">{fmtDate(s.date)}</div>
                                                                )}
                                                                <div className={`text-sm ${s.highlight ? 'font-black text-white' : 'font-semibold text-zinc-200'}`}>{s.label}</div>
                                                                {s.notes && <div className="text-xs text-zinc-500">{s.notes}</div>}
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ol>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </Section>
                    )}

                    {/* Prizes */}
                    {prizes.length > 0 && (
                        <Section id="prizes" eyebrow="Rewards" title="Prizes" accent={accent}>
                            <div className="rounded-3xl border border-white/10 bg-zinc-900/60 overflow-x-auto">
                                <table className="w-full text-xs sm:text-sm">
                                    <thead>
                                        <tr className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-black/40">
                                            <th className="text-left px-3.5 sm:px-5 py-3">Category</th>
                                            {hasPrizeTiers ? (
                                                <>
                                                    <th className="text-right px-2.5 sm:px-4 py-3 whitespace-nowrap">🥇 1st</th>
                                                    <th className="text-right px-2.5 sm:px-4 py-3 whitespace-nowrap">🥈 2nd</th>
                                                    <th className="text-right px-3.5 sm:px-5 py-3 whitespace-nowrap">🥉 3rd</th>
                                                </>
                                            ) : (
                                                <th className="text-right px-5 py-3">Prize</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {prizes.map((p, i) => (
                                            <tr key={i} className="border-t border-white/5">
                                                <td className="px-3.5 sm:px-5 py-3.5 font-bold text-white">{p.category}</td>
                                                {hasPrizeTiers ? (
                                                    <>
                                                        <td className="px-2.5 sm:px-4 py-3.5 text-right font-black whitespace-nowrap" style={{ color: accent }}>{p.champion || '–'}</td>
                                                        <td className="px-2.5 sm:px-4 py-3.5 text-right font-bold text-zinc-200 whitespace-nowrap">{p.runner_up || '–'}</td>
                                                        <td className="px-3.5 sm:px-5 py-3.5 text-right font-bold text-zinc-400 whitespace-nowrap">{p.second_runner_up || '–'}</td>
                                                    </>
                                                ) : (
                                                    <td className="px-5 py-3.5 text-right font-black whitespace-nowrap" style={{ color: accent }}>
                                                        {p.currency || 'RM'} {Number(p.amount || 0).toLocaleString()}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {run.prize_note && <p className="text-xs text-zinc-500 mt-3"><i className="fa-solid fa-medal mr-1.5" style={{ color: accent }} />{run.prize_note}</p>}
                        </Section>
                    )}

                    {/* Rules, posters, size chart, FAQ */}
                    {hasInfo && (
                        <Section
                            id="info"
                            eyebrow={run.info_eyebrow || 'Good to know'}
                            title={run.info_title || (isInfoOnly ? 'Official posters, advisories & FAQ' : 'Rules, sizes & FAQ')}
                            accent={accent}
                        >
                            <div className="space-y-4">
                                {quickTips.length > 0 && (
                                    <QuickTipsGrid tips={quickTips} accent={accent} columns={3} />
                                )}

                                {posters.length > 0 && (
                                    <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
                                        <div className="flex items-center justify-between gap-2 mb-4">
                                            <div className="text-sm font-black text-white">
                                                <i className="fa-regular fa-images mr-2" style={{ color: accent }} />
                                                {run.posters_title || 'Official Program Posters (Tap to enlarge)'}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">EN / 中文</span>
                                        </div>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            {posters.map((p, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setLightboxImg(p.url)}
                                                    className="group text-left rounded-2xl overflow-hidden border border-white/10 bg-black/40 hover:border-white/25 transition-all cursor-zoom-in"
                                                >
                                                    <div className="aspect-video w-full overflow-hidden bg-zinc-950 p-1.5 flex items-center justify-center">
                                                        <img
                                                            src={p.url}
                                                            alt={p.label}
                                                            className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-300"
                                                        />
                                                    </div>
                                                    <div className="px-4 py-3 flex items-center justify-between gap-2">
                                                        <span className="text-xs font-bold text-white">{p.label}</span>
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 group-hover:text-white flex items-center gap-1">
                                                            <i className="fa-solid fa-magnifying-glass-plus" /> View
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(rules.length > 0 || notes.length > 0) && (
                                    <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
                                        <div className="text-sm font-black text-white mb-4">{run.rules_title || (isInfoOnly ? 'Parade guidelines & advisories' : 'Race rules')}</div>
                                        <ol className="space-y-2.5 text-[13px] text-zinc-300">
                                            {[...rules, ...notes].map((r, i) => (
                                                <li key={i} className="flex gap-3">
                                                    <span className="w-5 h-5 shrink-0 rounded-md bg-white/5 text-[10px] font-black flex items-center justify-center" style={{ color: accent }}>{i + 1}</span>
                                                    <span className="leading-relaxed">{r}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                )}

                                {showSizeChart && (
                                    <Accordion title="Jersey size chart" icon="fa-shirt" accent={accent} defaultOpen={true}>
                                        <p className="text-xs text-zinc-500 mb-3">Unisex regular fit, measured flat (±0.5&quot;).</p>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                            {sizeChart.map((s: any) => (
                                                <div key={s.size} className="rounded-xl bg-black/40 border border-white/5 p-2.5 text-center">
                                                    <div className="text-xs font-black" style={{ color: accent }}>{s.size}</div>
                                                    <div className="text-[10px] text-zinc-400 mt-1">Chest {s.chest}</div>
                                                    <div className="text-[10px] text-zinc-500">Length {s.length}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </Accordion>
                                )}

                                {faq.map((f, i) => (
                                    <Accordion key={i} title={f.q} icon="fa-circle-question" accent={accent}>
                                        <p className="text-[13px] text-zinc-300 leading-relaxed">{f.a}</p>
                                    </Accordion>
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* Venue */}
                    {venueName && !unifiedRouteVenue && (
                        <Section
                            id="venue"
                            eyebrow="Getting there"
                            title={secondaryVenue?.name ? 'Venues & parking' : 'Venue'}
                            accent={accent}
                        >
                            <div className="space-y-4">
                                <div className="rounded-3xl border border-white/10 bg-zinc-900/60 overflow-hidden grid md:grid-cols-[1fr_1.3fr]">
                                    <div className="p-6 flex flex-col">
                                        {primaryVenueBadge && (
                                            <span
                                                className="inline-flex self-start items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-black mb-2"
                                                style={{ backgroundColor: accent }}
                                            >
                                                {primaryVenueBadge}
                                            </span>
                                        )}
                                        <div className="text-lg font-black text-white">{venueName}</div>
                                        {venueAddress && <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">{venueAddress}</p>}
                                        {parkingNote && <p className="text-xs text-zinc-500 mt-4"><i className="fa-solid fa-square-parking mr-1.5" style={{ color: accent }} />{parkingNote}</p>}
                                        <div className="flex flex-wrap gap-2 mt-auto pt-6">
                                            <a
                                                href={settings.venue_map_url || (startPoint ? `https://www.google.com/maps/search/?api=1&query=${startPoint.lat},${startPoint.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black text-black"
                                                style={{ backgroundColor: accent }}
                                            >
                                                <i className="fa-solid fa-map-location-dot" /> Google Maps
                                            </a>
                                            <a
                                                href={startPoint ? `https://waze.com/ul?ll=${startPoint.lat},${startPoint.lng}&navigate=yes` : `https://waze.com/ul?q=${encodeURIComponent(mapQuery)}&navigate=yes`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-white border border-white/15 hover:bg-white/5"
                                            >
                                                <i className="fa-brands fa-waze" /> Waze
                                            </a>
                                        </div>
                                    </div>
                                    <iframe
                                        title="Venue map"
                                        src={`https://www.google.com/maps?q=${encodeURIComponent(startPoint ? `${startPoint.lat},${startPoint.lng}` : mapQuery)}&z=16&output=embed`}
                                        loading="lazy"
                                        className="w-full h-64 md:h-full min-h-[260px] border-0 grayscale-[35%]"
                                    />
                                </div>

                                {secondaryVenue?.name && (
                                    <div className="rounded-3xl border border-white/10 bg-zinc-900/60 overflow-hidden grid md:grid-cols-[1fr_1.3fr]">
                                        <div className="p-6 flex flex-col">
                                            {secondaryVenue.badge && (
                                                <span className="inline-flex self-start items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/15 border border-rose-500/30 text-rose-300 mb-2">
                                                    {secondaryVenue.badge}
                                                </span>
                                            )}
                                            <div className="text-lg font-black text-white">{secondaryVenue.name}</div>
                                            {secondaryVenue.address && <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">{secondaryVenue.address}</p>}
                                            {secondaryVenue.note && <p className="text-xs text-zinc-500 mt-4"><i className="fa-solid fa-circle-info mr-1.5" style={{ color: accent }} />{secondaryVenue.note}</p>}
                                            <div className="flex flex-wrap gap-2 mt-auto pt-6">
                                                <a
                                                    href={secondaryVenue.map_url || (typeof secondaryVenue.lat === 'number' ? `https://www.google.com/maps/search/?api=1&query=${secondaryVenue.lat},${secondaryVenue.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(secondaryVenue.query || secondaryVenue.name)}`)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black text-black"
                                                    style={{ backgroundColor: accent }}
                                                >
                                                    <i className="fa-solid fa-map-location-dot" /> Google Maps
                                                </a>
                                                <a
                                                    href={typeof secondaryVenue.lat === 'number' ? `https://waze.com/ul?ll=${secondaryVenue.lat},${secondaryVenue.lng}&navigate=yes` : `https://waze.com/ul?q=${encodeURIComponent(secondaryVenue.query || secondaryVenue.name)}&navigate=yes`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-white border border-white/15 hover:bg-white/5"
                                                >
                                                    <i className="fa-brands fa-waze" /> Waze
                                                </a>
                                            </div>
                                        </div>
                                        <iframe
                                            title="Secondary venue map"
                                            src={`https://www.google.com/maps?q=${encodeURIComponent(typeof secondaryVenue.lat === 'number' ? `${secondaryVenue.lat},${secondaryVenue.lng}` : (secondaryVenue.query || secondaryVenue.name))}&z=16&output=embed`}
                                            loading="lazy"
                                            className="w-full h-64 md:h-full min-h-[260px] border-0 grayscale-[35%]"
                                        />
                                    </div>
                                )}
                            </div>
                        </Section>
                    )}

                    {/* Register */}
                    {!isInfoOnly && (
                        <Section id="register" eyebrow="Secure your slot" title="Registration form" accent={accent}>
                            {regState === 'open' ? (
                                children
                            ) : (
                                <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-10 text-center">
                                    <i className={`text-4xl mb-4 ${regState === 'closed' ? 'fa-solid fa-lock text-rose-400' : 'fa-regular fa-clock text-amber-400'}`} />
                                    <div className="text-xl font-black text-white">
                                        {regState === 'closed' ? 'Registration has closed' : `Registration opens ${fmtDate(settings.reg_open_date)}`}
                                    </div>
                                    {whatsapp && (
                                        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-5 text-sm font-bold text-emerald-400">
                                            <i className="fa-brands fa-whatsapp" /> Contact the organiser
                                        </a>
                                    )}
                                </div>
                            )}
                        </Section>
                    )}
                </div>

                {/* ── STICKY SUMMARY (desktop) ─────────────────── */}
                <aside className="hidden lg:block">
                    <div className="sticky top-32 space-y-4">
                        <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-6">
                            <div className="mb-4">{statusPill}</div>
                            {isInfoOnly ? (
                                <>
                                    {Array.isArray(quickFacts) && quickFacts.length > 0 && (
                                        <>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                                                {ui.atAGlance}
                                            </div>
                                            <ul className="divide-y divide-white/5 mb-5">
                                                {quickFacts.map((qf: any, i: number) => (
                                                    <li key={i} className="flex items-start justify-between gap-3 py-2.5 text-xs">
                                                        <span className="text-zinc-400 font-bold shrink-0">{qf.label}</span>
                                                        <span className="font-black text-white text-right">{qf.value}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </>
                                    )}
                                    <a
                                        href={hasCourse ? '#route' : '#schedule'}
                                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-wider text-black hover:opacity-90"
                                        style={{ backgroundColor: accent }}
                                    >
                                        <i className="fa-solid fa-route" /> {hasCourse ? ui.viewRoute : ui.viewSchedule}
                                    </a>
                                    {spotlight && (
                                        <a
                                            href="#spotlight"
                                            className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold text-zinc-200 bg-white/5 border border-white/10 hover:bg-white/10"
                                        >
                                            <i className="fa-solid fa-music" style={{ color: accent }} /> {spotlight.cta_label || ui.unitedWorship}
                                        </a>
                                    )}
                                </>
                            ) : (
                                <>
                                    {categories.length > 0 && (
                                        <>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                                                {fees.length ? 'Entry fees' : 'Categories'}
                                            </div>
                                            <ul className="divide-y divide-white/5 mb-5">
                                                {categories.map((c, i) => (
                                                    <li key={i}>
                                                        <button
                                                            type="button"
                                                            disabled={regState !== 'open'}
                                                            onClick={() => pickCategoryAndScroll(c.name)}
                                                            className={`w-full flex items-center justify-between gap-3 py-2.5 text-sm text-left transition-colors ${regState === 'open' ? 'hover:text-white cursor-pointer' : ''}`}
                                                        >
                                                            <span className="flex items-center gap-2 min-w-0">
                                                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color || accent }} />
                                                                <span className="font-bold text-zinc-200 truncate">{c.short ? `${c.short} ${c.subtitle || ''}` : c.name}</span>
                                                            </span>
                                                            {c.fee && <span className="font-black text-white shrink-0">{c.fee}</span>}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </>
                                    )}
                                    {regState === 'open' ? (
                                        <a
                                            href="#register"
                                            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-wider text-black hover:opacity-90"
                                            style={{ backgroundColor: accent }}
                                        >
                                            <i className="fa-solid fa-pen-to-square" /> Register now
                                        </a>
                                    ) : (
                                        <div className="text-center text-xs text-zinc-500 py-2">Registration is not available</div>
                                    )}
                                    {settings.reg_close_date && regState === 'open' && (
                                        <p className="text-[11px] text-zinc-500 text-center mt-2.5">Closes {fmtDate(settings.reg_close_date)}</p>
                                    )}
                                </>
                            )}
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {whatsapp && (
                                    <a
                                        href={whatsapp}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                                    >
                                        <i className="fa-brands fa-whatsapp" /> {ui.whatsapp}
                                    </a>
                                )}
                                <button
                                    type="button"
                                    onClick={copyLink}
                                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[11px] font-bold text-zinc-300 bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer ${whatsapp ? '' : 'col-span-2'}`}
                                >
                                    <i className={`fa-solid ${copied ? 'fa-check' : 'fa-link'}`} /> {copied ? ui.copied : ui.copyLink}
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>
            </main>

            {/* ── FOOTER ───────────────────────────────────────── */}
            <footer className="border-t border-white/5 mt-6">
                <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
                    <div>© {new Date().getFullYear()} {title}{titleSponsor ? ` · ${titleSponsor}` : ''}</div>
                    <div className="flex items-center gap-4">
                        {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-white"><i className="fa-brands fa-facebook text-base" /></a>}
                        {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white"><i className="fa-brands fa-instagram text-base" /></a>}
                        {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-white"><i className="fa-brands fa-whatsapp text-base" /></a>}
                        <span className="text-zinc-600">{ui.poweredBy}</span>
                    </div>
                </div>
            </footer>

            {/* ── MOBILE STICKY CTA ────────────────────────────── */}
            {regState === 'open' && (
                <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-black/90 backdrop-blur-xl border-t border-white/10 px-4 py-3 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="text-sm font-black text-white truncate">
                            {minFee !== null ? `From RM ${minFee}` : title}
                        </div>
                        {settings.reg_close_date && (
                            <div className="text-[11px] text-zinc-500 truncate">Closes {fmtDate(settings.reg_close_date, false)}</div>
                        )}
                    </div>
                    <a
                        href="#register"
                        className="px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wider text-black shrink-0"
                        style={{ backgroundColor: accent }}
                    >
                        Register now
                    </a>
                </div>
            )}
            {isInfoOnly && (
                <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-black/90 backdrop-blur-xl border-t border-white/10 px-4 py-3 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="text-sm font-black text-white truncate">
                            {L.mobile_summary_title || run.mobile_summary_title || activeDateStr || title}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">
                            {L.mobile_summary_sub || run.mobile_summary_sub || L.status_badge || run.status_badge || 'Free Admission · No Registration Required'}
                        </div>
                    </div>
                    <a
                        href={hasCourse ? '#route' : '#schedule'}
                        className="px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-black shrink-0"
                        style={{ backgroundColor: accent }}
                    >
                        {L.top_cta_label || (hasCourse ? ui.viewRoute : ui.viewSchedule)}
                    </a>
                </div>
            )}

            {/* ── BANNER / POSTER LIGHTBOX ─────────────────────── */}
            {lightboxImg && (
                <div
                    onClick={() => setLightboxImg(null)}
                    className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
                >
                    <button
                        type="button"
                        onClick={() => setLightboxImg(null)}
                        className="fixed top-5 right-5 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                    <img src={lightboxImg} alt={title} className="max-w-full max-h-[90vh] object-contain rounded-xl" />
                </div>
            )}
        </div>
    );
}

// ── small building blocks ──────────────────────────────────────
function toMin(t: string) {
    const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!m) return 9999;
    let h = parseInt(m[1], 10) % 12;
    if (m[3]?.toUpperCase() === 'PM') h += 12;
    return h * 60 + parseInt(m[2], 10);
}

function Section({
    id,
    eyebrow,
    title,
    sub,
    accent,
    children,
}: {
    id: string;
    eyebrow: string;
    title: string;
    sub?: string;
    accent: string;
    children: React.ReactNode;
}) {
    return (
        <section id={id} className="scroll-mt-32">
            <div className="mb-6">
                <div className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: accent }}>{eyebrow}</div>
                <h2 className="text-2xl md:text-[28px] font-black text-white tracking-tight mt-1">{title}</h2>
                {sub && <p className="text-sm text-zinc-500 mt-1.5">{sub}</p>}
            </div>
            {children}
        </section>
    );
}

function Meta({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
    return (
        <div className={`rounded-xl bg-black/40 border border-white/5 px-3 py-2 ${wide ? 'col-span-2' : ''}`}>
            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{label}</div>
            <div className="font-bold text-zinc-200 mt-0.5">{value}</div>
        </div>
    );
}

function Row({ icon, label, value, accent }: { icon: string; label: string; value: string; accent: string }) {
    return (
        <div className="flex gap-3">
            <i className={`${icon} mt-1 w-4 text-center text-xs`} style={{ color: accent }} />
            <div>
                <dt className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</dt>
                <dd className="font-bold text-zinc-200">{value}</dd>
            </div>
        </div>
    );
}

function Accordion({
    title,
    icon,
    accent,
    defaultOpen = false,
    children,
}: {
    title: string;
    icon: string;
    accent: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}) {
    return (
        <details open={defaultOpen} className="group rounded-2xl border border-white/10 bg-zinc-900/60 overflow-hidden">
            <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer list-none text-sm font-bold text-white hover:bg-white/[0.02]">
                <i className={`fa-solid ${icon} text-xs`} style={{ color: accent }} />
                <span className="flex-1">{title}</span>
                <i className="fa-solid fa-chevron-down text-[10px] text-zinc-500 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="px-5 pb-5">{children}</div>
        </details>
    );
}

function QuickTipsGrid({
    tips,
    accent,
    columns = 2,
}: {
    tips: { icon?: string; title: string; detail?: string; color?: string }[];
    accent: string;
    columns?: 2 | 3;
}) {
    return (
        <div className={`grid sm:grid-cols-2 ${columns === 3 ? 'lg:grid-cols-3' : ''} gap-3`}>
            {tips.map((tip, idx) => {
                const tColor = tip.color || accent;
                return (
                    <div key={idx} className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 flex items-start gap-3">
                        <span
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm text-black"
                            style={{ backgroundColor: tColor }}
                        >
                            <i className={tip.icon || 'fa-solid fa-circle-info'} />
                        </span>
                        <div className="min-w-0">
                            <div className="text-xs font-black text-white leading-snug">{tip.title}</div>
                            {tip.detail && <div className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{tip.detail}</div>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function VenueNavCard({
    badge,
    badgeTone,
    name,
    address,
    note,
    noteIcon,
    lat,
    lng,
    mapUrl,
    query,
    googleLabel,
    wazeLabel,
    accent,
}: {
    badge?: string;
    badgeTone: 'emerald' | 'rose';
    name: string;
    address?: string;
    note?: string;
    noteIcon: string;
    lat?: number;
    lng?: number;
    mapUrl?: string;
    query: string;
    googleLabel: string;
    wazeLabel: string;
    accent: string;
}) {
    const hasCoords = typeof lat === 'number' && typeof lng === 'number';
    const googleHref = mapUrl || (hasCoords ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
    const wazeHref = hasCoords ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes` : `https://waze.com/ul?q=${encodeURIComponent(query)}&navigate=yes`;
    return (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/65 p-5 flex flex-col">
            {badge && (
                <span
                    className={`inline-flex self-start items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-2.5 ${
                        badgeTone === 'emerald'
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    }`}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${badgeTone === 'emerald' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    {badge}
                </span>
            )}
            <div className="text-base font-black text-white leading-snug">{name}</div>
            {address && <div className="text-xs text-zinc-400 mt-1 leading-relaxed">{address}</div>}
            {note && (
                <p className="text-[11px] text-zinc-400 mt-3 leading-relaxed">
                    <i className={`${noteIcon} mr-1.5`} style={{ color: accent }} />
                    {note}
                </p>
            )}
            <div className="flex flex-wrap gap-2 mt-auto pt-4">
                <a
                    href={googleHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-black text-black hover:opacity-90"
                    style={{ backgroundColor: accent }}
                >
                    <i className="fa-solid fa-map-location-dot" /> {googleLabel}
                </a>
                <a
                    href={wazeHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-bold text-white border border-white/15 hover:bg-white/5"
                >
                    <i className="fa-brands fa-waze" /> {wazeLabel}
                </a>
            </div>
        </div>
    );
}
