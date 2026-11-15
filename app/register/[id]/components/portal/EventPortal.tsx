'use client';

import React, { useEffect, useState } from 'react';
import { CourseSection, Station } from './CourseSection';

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
    const title: string = settings.slogan || project?.name || 'Event Registration';
    const isInfoOnly = regState === 'info_only';
    const fc = settings.fields_config || {};
    const run = fc.run_config || {};
    const categories: any[] = Array.isArray(settings.categories) ? settings.categories.filter((c: any) => c?.name) : [];
    const schedule = normalizeSchedule(settings.event_schedule);
    const prizes: any[] = Array.isArray(settings.prize_pool) ? settings.prize_pool.filter((p: any) => p?.category) : [];
    const social = settings.social_links || {};
    const venueName: string = settings.venue_name || project?.venue || '';
    const venueAddress: string = settings.venue_address || '';
    const mapQuery = venueAddress ? `${venueName} ${venueAddress}` : venueName;
    const fees = categories.map(c => parseFee(c.fee)).filter((n): n is number => n !== null && n > 0);
    const minFee = fees.length ? Math.min(...fees) : null;
    const stations: Station[] = Array.isArray(run.stations) ? run.stations : [];
    const hasCourse = !!fc.enable_run_module && stations.length > 0 && categories.some(c => Number(c.distance_km) > 0);
    const spotlight = run.spotlight;
    const posters: { label: string; lang?: string; url: string }[] = Array.isArray(run.posters) ? run.posters : [];
    const secondaryVenue = run.secondary_venue;
    const showCategoriesSection = run.show_categories !== false && categories.length > 0;
    const rules = splitLines(settings.rules);
    const notes = splitLines(settings.format_description);
    const faq: { q: string; a: string }[] = Array.isArray(run.faq) ? run.faq : [];
    const repc = run.repc;
    const sizeChart: any[] = Array.isArray(run.size_chart) && run.size_chart.length ? run.size_chart : DEFAULT_SIZE_CHART;
    const showSizeChart = !!fc.show_tshirt_size;
    const whatsapp = social.whatsapp ? `https://wa.me/${String(social.whatsapp).replace(/\D/g, '')}` : null;
    const hasPrizeTiers = prizes.some(p => p.champion || p.runner_up || p.second_runner_up);
    const hasInfo = rules.length > 0 || notes.length > 0 || faq.length > 0 || showSizeChart || posters.length > 0;

    const closeTs = settings.reg_close_date
        ? new Date(String(settings.reg_close_date).includes('T') ? settings.reg_close_date : `${settings.reg_close_date}T23:59:59`).getTime()
        : null;
    const daysLeft = closeTs !== null && !Number.isNaN(closeTs)
        ? Math.ceil((closeTs - Date.now()) / 86400000)
        : null;

    const [lightboxImg, setLightboxImg] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [activeSection, setActiveSection] = useState('overview');

    const navItems = [
        { id: 'overview', label: 'Overview', show: true },
        { id: 'spotlight', label: spotlight?.nav_label || 'Worship & Churches', show: !!spotlight },
        { id: 'categories', label: hasCourse ? 'Categories & Fees' : 'Categories', show: showCategoriesSection },
        { id: 'route', label: run.route_nav_label || (run.route_type === 'point_to_point' ? 'Parade Route' : 'Route & Water Stations'), show: hasCourse },
        { id: 'schedule', label: 'Schedule', show: schedule.length > 0 || !!repc },
        { id: 'prizes', label: 'Prizes', show: prizes.length > 0 },
        { id: 'info', label: run.info_nav_label || (isInfoOnly ? 'Posters & Guide' : 'Rules & FAQ'), show: hasInfo },
        { id: 'venue', label: 'Venue', show: !!venueName },
        { id: 'register', label: 'Register', show: !isInfoOnly },
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

    const statusPill =
        regState === 'info_only' ? (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {run.status_badge || 'Event Information · Free Admission'}
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

    const facts = [
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
                <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center gap-4">
                    <img
                        src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
                        alt="ZTO"
                        className="w-7 h-7 rounded object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-black text-white truncate uppercase tracking-wide">{title}</div>
                        <div className="text-[10px] text-zinc-500 truncate">
                            {[fmtDate(project?.start_date, false), venueName].filter(Boolean).join(' · ')}
                        </div>
                    </div>
                    {whatsapp && (
                        <a
                            href={whatsapp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20"
                        >
                            <i className="fa-brands fa-whatsapp" /> Enquiry
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
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider text-black hover:opacity-90"
                            style={{ backgroundColor: accent }}
                        >
                            <i className="fa-solid fa-route" /> {run.top_cta_label || (hasCourse ? 'Parade Route' : 'Schedule')}
                        </a>
                    )}
                </div>
            </div>

            {/* ── HERO ──────────────────────────────────────────── */}
            <header className="relative overflow-hidden">
                {settings.hero_banner_url && (
                    <div
                        className="absolute inset-0 bg-cover bg-center blur-3xl opacity-25 scale-110"
                        style={{ backgroundImage: `url(${settings.hero_banner_url})` }}
                    />
                )}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse at 50% 0%, ${accent}22, transparent 60%), linear-gradient(to bottom, transparent 40%, #07080b)` }}
                />

                <div className="relative max-w-6xl mx-auto px-4 md:px-6 pt-6 md:pt-8">
                    {settings.hero_banner_url && (
                        <button
                            type="button"
                            onClick={() => setLightboxImg(settings.hero_banner_url)}
                            className="block w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl cursor-zoom-in"
                        >
                            <img src={settings.hero_banner_url} alt={title} className="w-full h-auto max-h-[560px] object-cover" />
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
                            <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-[1.05]">{title}</h1>
                            {settings.title_sponsor && (
                                <p className="mt-3 text-sm text-zinc-400">
                                    <span className="font-bold" style={{ color: accent }}>{settings.title_sponsor_label || 'Organised by'}:</span>{' '}
                                    {settings.title_sponsor}
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
                                    <i className="fa-solid fa-route" /> Parade route
                                </a>
                            )}
                            {isInfoOnly && spotlight && (
                                <a
                                    href="#spotlight"
                                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold text-white border border-white/15 hover:bg-white/5"
                                >
                                    <i className="fa-solid fa-music" /> {spotlight.cta_label || 'United Worship'}
                                </a>
                            )}
                            {isInfoOnly && schedule.length > 0 && (
                                <a
                                    href="#schedule"
                                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold text-white border border-white/15 hover:bg-white/5"
                                >
                                    <i className="fa-regular fa-clock" /> Schedule
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
                <div className="space-y-16 min-w-0">
                    {/* Overview */}
                    <Section id="overview" eyebrow="About the event" title="Overview" accent={accent}>
                        {settings.event_description ? (
                            <p className="text-[15px] text-zinc-300 leading-relaxed whitespace-pre-line">{settings.event_description}</p>
                        ) : (
                            <p className="text-sm text-zinc-500">Event details will be announced soon.</p>
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

                    {/* Route & checkpoints / water stations */}
                    {hasCourse && (
                        <Section
                            id="route"
                            eyebrow={run.route_eyebrow || (run.route_type === 'point_to_point' ? 'Parade Route' : 'Course')}
                            title={run.route_title || (run.route_type === 'point_to_point' ? 'Parade route & checkpoints' : 'Route & water stations')}
                            sub={run.route_sub ?? (run.route_type === 'point_to_point'
                                ? 'Point-to-point route map with gathering points and major landmarks. Tap any checkpoint or open directions in Google Maps.'
                                : 'Out-and-back course. Every water station before the U-turn is passed twice.')}
                            accent={accent}
                        >
                            <CourseSection
                                categories={categories}
                                stations={stations}
                                villageFacilities={run.village_facilities}
                                accent={accent}
                                courseMapUrl={run.course_map_url}
                                startPoint={run.start_point}
                                endPoint={run.finish_point}
                                routeType={run.route_type}
                                checkpointLabel={run.checkpoint_label}
                                detailLabel={run.detail_label}
                                finishRowTitle={run.finish_row_title}
                                venueMapQuery={mapQuery}
                            />
                        </Section>
                    )}

                    {/* Schedule + REPC */}
                    {(schedule.length > 0 || repc) && (
                        <Section id="schedule" eyebrow="Plan your day" title={repc ? 'Race pack collection & race day' : 'Event schedule'} accent={accent}>
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
                                    <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
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
                    {venueName && (
                        <Section
                            id="venue"
                            eyebrow="Getting there"
                            title={secondaryVenue?.name ? 'Venues & parking' : 'Venue'}
                            accent={accent}
                        >
                            <div className="space-y-4">
                                <div className="rounded-3xl border border-white/10 bg-zinc-900/60 overflow-hidden grid md:grid-cols-[1fr_1.3fr]">
                                    <div className="p-6 flex flex-col">
                                        {run.primary_venue_badge && (
                                            <span
                                                className="inline-flex self-start items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-black mb-2"
                                                style={{ backgroundColor: accent }}
                                            >
                                                {run.primary_venue_badge}
                                            </span>
                                        )}
                                        <div className="text-lg font-black text-white">{venueName}</div>
                                        {venueAddress && <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">{venueAddress}</p>}
                                        {run.parking && <p className="text-xs text-zinc-500 mt-4"><i className="fa-solid fa-square-parking mr-1.5" style={{ color: accent }} />{run.parking}</p>}
                                        <div className="flex flex-wrap gap-2 mt-auto pt-6">
                                            <a
                                                href={settings.venue_map_url || (run.start_point ? `https://www.google.com/maps/search/?api=1&query=${run.start_point.lat},${run.start_point.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black text-black"
                                                style={{ backgroundColor: accent }}
                                            >
                                                <i className="fa-solid fa-map-location-dot" /> Google Maps
                                            </a>
                                            <a
                                                href={run.start_point ? `https://waze.com/ul?ll=${run.start_point.lat},${run.start_point.lng}&navigate=yes` : `https://waze.com/ul?q=${encodeURIComponent(mapQuery)}&navigate=yes`}
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
                                        src={`https://www.google.com/maps?q=${encodeURIComponent(run.start_point ? `${run.start_point.lat},${run.start_point.lng}` : mapQuery)}&z=16&output=embed`}
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
                                    {Array.isArray(run.quick_facts) && run.quick_facts.length > 0 && (
                                        <>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                                                At a glance
                                            </div>
                                            <ul className="divide-y divide-white/5 mb-5">
                                                {run.quick_facts.map((qf: any, i: number) => (
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
                                        <i className="fa-solid fa-route" /> {hasCourse ? 'View parade route' : 'View schedule'}
                                    </a>
                                    {spotlight && (
                                        <a
                                            href="#spotlight"
                                            className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold text-zinc-200 bg-white/5 border border-white/10 hover:bg-white/10"
                                        >
                                            <i className="fa-solid fa-music" style={{ color: accent }} /> {spotlight.cta_label || 'After-parade worship'}
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
                                        <i className="fa-brands fa-whatsapp" /> WhatsApp
                                    </a>
                                )}
                                <button
                                    type="button"
                                    onClick={copyLink}
                                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[11px] font-bold text-zinc-300 bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer ${whatsapp ? '' : 'col-span-2'}`}
                                >
                                    <i className={`fa-solid ${copied ? 'fa-check' : 'fa-link'}`} /> {copied ? 'Copied' : 'Copy link'}
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>
            </main>

            {/* ── FOOTER ───────────────────────────────────────── */}
            <footer className="border-t border-white/5 mt-6">
                <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
                    <div>© {new Date().getFullYear()} {title}{settings.title_sponsor ? ` · ${settings.title_sponsor}` : ''}</div>
                    <div className="flex items-center gap-4">
                        {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-white"><i className="fa-brands fa-facebook text-base" /></a>}
                        {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white"><i className="fa-brands fa-instagram text-base" /></a>}
                        {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-white"><i className="fa-brands fa-whatsapp text-base" /></a>}
                        <span className="text-zinc-600">Powered by ZTO Event OS</span>
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
                            {run.mobile_summary_title || (project?.start_date ? fmtDate(project.start_date) : title)}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">
                            {run.mobile_summary_sub || run.status_badge || 'Free Admission · No Registration Required'}
                        </div>
                    </div>
                    <a
                        href={hasCourse ? '#route' : '#schedule'}
                        className="px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-black shrink-0"
                        style={{ backgroundColor: accent }}
                    >
                        {hasCourse ? 'Parade route' : 'Schedule'}
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
