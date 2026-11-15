'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

import { GuildTeamItemForm } from './components/GuildTeamItemForm';
import { GuildTeamSemiFreeForm } from './components/GuildTeamSemiFreeForm';
import { BusinessProItemForm } from './components/BusinessProItemForm';
import { GeneralEventForm } from './components/GeneralEventForm';
import { RunEventShowcase } from './components/RunEventShowcase';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function RegistrationPage() {
    const params = useParams();
    const router = useRouter();
    const rawId = params?.id as string;

    const [settings, setSettings] = useState<any>(null);
    const [project, setProject] = useState<any>(null);
    const [resolvedProjectId, setResolvedProjectId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [successSummary, setSuccessSummary] = useState<any>(null);
    const [showFullBanner, setShowFullBanner] = useState(false);

    useEffect(() => {
        if (rawId) resolveAndLoad(rawId);
    }, [rawId]);

    const resolveAndLoad = async (idOrSlug: string) => {
        let projectId = idOrSlug;

        // If it's not a UUID, look up by page_slug in tournament_settings
        if (!UUID_REGEX.test(idOrSlug)) {
            const { data: slugData } = await supabase
                .from('tournament_settings')
                .select('project_id')
                .eq('page_slug', idOrSlug)
                .maybeSingle();

            if (!slugData) {
                setIsLoading(false);
                return;
            }
            projectId = slugData.project_id;
        }

        setResolvedProjectId(projectId);

        const [{ data: projData }, { data: tsData }] = await Promise.all([
            supabase.from('projects').select('*').eq('id', projectId).maybeSingle(),
            supabase.from('tournament_settings').select('*').eq('project_id', projectId).maybeSingle(),
        ]);

        if (projData) setProject(projData);

        if (tsData || projData) {
            const isTournamentProj = projData?.type === 'tournament' || projData?.type === 'sports';
            const defaultTemplate = isTournamentProj ? 'business_pro_item' : 'general_event';
            const config = {
                ...(tsData || {}),
                slogan: tsData?.slogan || projData?.name || 'Event Registration',
                theme_color: tsData?.theme_color || '#f59e0b',
                template_type: tsData?.template_type || defaultTemplate,
                venue_name: tsData?.venue_name || projData?.venue || '',
                fields_config: {
                    show_team_name: true,
                    show_phone: true,
                    show_email: true,
                    show_ic_passport: true,
                    requires_gender: false,
                    show_tshirt_size: false,
                    show_dietary: false,
                    allow_companions: false,
                    ...(tsData?.fields_config || {}),
                },
            };
            setSettings(config);
        }

        setIsLoading(false);
    };

    const formatDate = (d?: string | null) => {
        if (!d) return '';
        return new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex justify-center items-center text-zinc-400 font-bold text-sm">
                <i className="fa-solid fa-circle-notch fa-spin mr-3 text-amber-500 text-lg" />
                Loading Registration Portal...
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="min-h-screen bg-black flex flex-col justify-center items-center text-zinc-400 p-6 text-center">
                <i className="fa-solid fa-link-slash text-4xl text-zinc-700 mb-4" />
                <div className="text-xl font-black text-white uppercase tracking-wider mb-2">Registration Portal Not Found</div>
                <p className="text-xs text-zinc-500">Please check the link provided by the event organizer.</p>
            </div>
        );
    }

    const accent = settings.theme_color || '#f59e0b';
    const now = new Date();

    if (settings.reg_open_date && now < new Date(settings.reg_open_date)) {
        const openDate = formatDate(settings.reg_open_date);
        return (
            <div className="min-h-screen bg-black flex flex-col justify-center items-center text-zinc-300 p-6">
                <div className="text-center bg-zinc-900 border border-zinc-800 p-10 rounded-3xl shadow-2xl max-w-lg w-full">
                    <i className="fa-regular fa-calendar text-5xl mb-6" style={{ color: accent }} />
                    <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-3">Registration Not Yet Open</h2>
                    <p className="text-zinc-400 text-sm">
                        Registration for <span className="text-white font-bold">{settings.slogan}</span> will open on{' '}
                        <span className="text-white font-bold">{openDate}</span>.
                    </p>
                    {settings.page_slug && (
                        <button
                            onClick={() => router.push(`/t/${settings.page_slug}`)}
                            className="mt-8 px-6 py-2.5 border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-xs uppercase tracking-widest font-black"
                        >
                            View Event Info Page
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (settings.reg_close_date && now > new Date(settings.reg_close_date + 'T23:59:59')) {
        return (
            <div className="min-h-screen bg-black flex flex-col justify-center items-center text-zinc-300 p-6">
                <div className="text-center bg-zinc-900 border border-zinc-800 p-10 rounded-3xl shadow-2xl max-w-lg w-full">
                    <i className="fa-solid fa-lock text-5xl text-red-500/80 mb-6" />
                    <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-3">Registration Closed</h2>
                    <p className="text-zinc-400 text-sm">The registration window for this event has ended.</p>
                    {settings.page_slug && (
                        <button
                            onClick={() => router.push(`/t/${settings.page_slug}`)}
                            className="mt-8 px-6 py-2.5 border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-xs uppercase tracking-widest font-black"
                        >
                            View Event Info Page
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-black flex justify-center items-center text-zinc-300 p-6">
                <div className="text-center bg-zinc-900 border border-zinc-800 p-8 md:p-10 rounded-3xl shadow-2xl max-w-lg w-full">
                    <div
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={{ backgroundColor: `${accent}20`, color: accent }}
                    >
                        <i className="fa-solid fa-check text-4xl" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider mb-3">Registration Confirmed!</h2>
                    <p className="text-zinc-400 text-sm mb-6">
                        Thank you for registering for <span className="text-white font-bold">{settings.slogan}</span>.
                    </p>

                    {successSummary && (
                        <div className="bg-black/50 border border-zinc-800 rounded-2xl p-5 mb-6 text-left space-y-2.5 text-xs">
                            <div className="flex justify-between">
                                <span className="text-zinc-500 uppercase font-bold">Participant</span>
                                <span className="text-white font-bold">{successSummary.name}</span>
                            </div>
                            {successSummary.bibName && (
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 uppercase font-bold">Race BIB Name</span>
                                    <span className="font-black tracking-widest" style={{ color: accent }}>{successSummary.bibName}</span>
                                </div>
                            )}
                            {successSummary.organization && (
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 uppercase font-bold">Club / Organization</span>
                                    <span className="text-zinc-300 font-bold">{successSummary.organization}</span>
                                </div>
                            )}
                            {successSummary.category && (
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 uppercase font-bold">Category</span>
                                    <span className="font-bold" style={{ color: accent }}>{successSummary.category}</span>
                                </div>
                            )}
                            {successSummary.tshirtSize && (
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 uppercase font-bold">Jersey Size</span>
                                    <span className="text-white font-bold">{successSummary.tshirtSize}</span>
                                </div>
                            )}
                            {successSummary.totalPax && (
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 uppercase font-bold">Total Pax</span>
                                    <span className="text-white font-bold">{successSummary.totalPax} Pax</span>
                                </div>
                            )}
                            {typeof successSummary.totalFee === 'number' && successSummary.totalFee > 0 && (
                                <div className="flex justify-between pt-2 border-t border-zinc-800">
                                    <span className="text-zinc-400 uppercase font-black">Total Fee</span>
                                    <span className="font-black text-sm" style={{ color: accent }}>RM {successSummary.totalFee.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <p className="text-[11px] text-zinc-500 mb-6">
                        You may screenshot this confirmation page for your reference.
                    </p>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full px-8 py-4 text-black font-black uppercase tracking-widest rounded-xl transition-opacity hover:opacity-90 text-xs cursor-pointer"
                        style={{ backgroundColor: accent }}
                    >
                        Submit Another Registration
                    </button>
                </div>
            </div>
        );
    }

    const social = settings.social_links || {};

    return (
        <div className="min-h-screen bg-[#070709] font-sans text-zinc-300 pb-20">
            {/* ── Top Bar ── */}
            <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <img
                            src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
                            alt="ZTO"
                            className="w-6 h-6 rounded object-cover"
                        />
                        <span className="text-[11px] font-black tracking-widest uppercase text-zinc-400">
                            ZTO Event Portal
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        {settings.page_slug && (
                            <a
                                href={`/t/${settings.page_slug}`}
                                className="text-[11px] font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
                            >
                                <i className="fa-solid fa-circle-info text-[10px]" style={{ color: accent }} />
                                Event Info Page
                            </a>
                        )}
                        {social.whatsapp && (
                            <a
                                href={`https://wa.me/${social.whatsapp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                            >
                                <i className="fa-brands fa-whatsapp" />
                                Contact Us
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Hero Banner Header ── */}
            <header className="relative w-full overflow-hidden bg-zinc-950 border-b border-zinc-800/80 shadow-2xl">
                {settings.hero_banner_url ? (
                    <div className="relative w-full">
                        {/* Blurred ambient backdrop + crisp banner */}
                        <div
                            className="absolute inset-0 bg-cover bg-center blur-2xl opacity-35 scale-110"
                            style={{ backgroundImage: `url(${settings.hero_banner_url})` }}
                        />
                        <div className="relative z-10 max-w-4xl mx-auto pt-6 px-4 sm:px-6">
                            <div
                                onClick={() => setShowFullBanner(true)}
                                className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-black/60 cursor-pointer group"
                            >
                                <img
                                    src={settings.hero_banner_url}
                                    alt={settings.slogan}
                                    className="w-full max-h-[420px] object-cover group-hover:scale-[1.01] transition-transform duration-300"
                                />
                                <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-white/15 flex items-center gap-1.5">
                                    <i className="fa-solid fa-magnifying-glass-plus text-[10px]" style={{ color: accent }} />
                                    Tap to view full banner
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div
                        className="absolute inset-0 opacity-15 pointer-events-none"
                        style={{ background: `radial-gradient(circle at 50% 0%, ${accent}, transparent 70%)` }}
                    />
                )}

                <div className="relative z-20 max-w-3xl mx-auto px-6 pt-10 pb-14 text-center">
                    {settings.logo_url && (
                        <img
                            src={settings.logo_url}
                            alt="Event Logo"
                            className="w-24 h-24 md:w-28 md:h-28 object-contain mx-auto mb-5 drop-shadow-2xl rounded-2xl bg-white/5 p-2 border border-white/10"
                        />
                    )}
                    <div
                        className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full text-[10px] font-black tracking-[0.2em] uppercase border"
                        style={{ backgroundColor: `${accent}15`, color: accent, borderColor: `${accent}40` }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accent }} />
                        Official Registration Portal
                    </div>

                    <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight uppercase drop-shadow-lg">
                        {settings.slogan || project?.name || 'Event Registration'}
                    </h1>

                    {settings.title_sponsor && (
                        <div className="mt-2 mb-4 font-bold tracking-widest text-xs uppercase" style={{ color: accent }}>
                            {settings.title_sponsor_label || 'Title Sponsor'}:{' '}
                            <span className="text-white">{settings.title_sponsor}</span>
                        </div>
                    )}

                    {/* Event Date & Venue Pills */}
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                        {(project?.start_date || project?.end_date) && (
                            <div className="inline-flex items-center gap-2 bg-white/[0.05] border border-white/10 px-4 py-2 rounded-xl text-xs font-bold text-zinc-200">
                                <i className="fa-regular fa-calendar" style={{ color: accent }} />
                                {formatDate(project.start_date)}
                                {project.end_date && project.end_date !== project.start_date
                                    ? ` – ${formatDate(project.end_date)}`
                                    : ''}
                            </div>
                        )}
                        {(settings.venue_name || project?.venue) && (
                            <div className="inline-flex items-center gap-2 bg-white/[0.05] border border-white/10 px-4 py-2 rounded-xl text-xs font-bold text-zinc-200">
                                <i className="fa-solid fa-location-dot" style={{ color: accent }} />
                                <span>{settings.venue_name || project?.venue}</span>
                                {settings.venue_map_url && (
                                    <a
                                        href={settings.venue_map_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-1 underline text-[11px]"
                                        style={{ color: accent }}
                                    >
                                        Map ↗
                                    </a>
                                )}
                            </div>
                        )}
                        {settings.reg_close_date && (
                            <div className="inline-flex items-center gap-2 bg-white/[0.05] border border-white/10 px-4 py-2 rounded-xl text-xs font-bold text-zinc-400">
                                <i className="fa-regular fa-clock" style={{ color: accent }} />
                                Closes: {formatDate(settings.reg_close_date)}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Full Banner Lightbox Modal */}
            {showFullBanner && settings.hero_banner_url && (
                <div
                    onClick={() => setShowFullBanner(false)}
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
                >
                    <button
                        onClick={() => setShowFullBanner(false)}
                        className="fixed top-5 right-5 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                    <img
                        src={settings.hero_banner_url}
                        alt={settings.slogan}
                        className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
                    />
                </div>
            )}

            <main className="max-w-3xl mx-auto px-4 sm:px-6 -mt-6 relative z-30 space-y-6">
                {/* ── Event Overview / Rules Summary Card (if filled) ── */}
                {(settings.event_description || settings.rules || settings.format_description) && (
                    <div className="bg-zinc-900/95 border border-zinc-800 p-6 md:p-8 rounded-3xl shadow-xl space-y-4">
                        <div className="flex items-center gap-2.5 text-xs font-black uppercase tracking-widest" style={{ color: accent }}>
                            <i className="fa-solid fa-bullhorn" />
                            Event Information & Details
                        </div>
                        {settings.event_description && (
                            <p className="text-sm text-zinc-300 whitespace-pre-line leading-relaxed">
                                {settings.event_description}
                            </p>
                        )}
                        {(settings.rules || settings.format_description) && (
                            <details className="group pt-2 border-t border-zinc-800/80">
                                <summary className="cursor-pointer text-xs font-bold text-zinc-400 hover:text-white flex items-center justify-between py-1">
                                    <span>View Rules, Format & Terms</span>
                                    <i className="fa-solid fa-chevron-down text-[10px] group-open:rotate-180 transition-transform" />
                                </summary>
                                <div className="mt-3 space-y-3 text-xs text-zinc-400 whitespace-pre-line leading-relaxed bg-black/40 p-4 rounded-2xl border border-zinc-800">
                                    {settings.format_description && <div>{settings.format_description}</div>}
                                    {settings.rules && <div>{settings.rules}</div>}
                                </div>
                            </details>
                        )}
                    </div>
                )}

                {/* ── Interactive Run / Marathon Route, Aid Stations & Entitlements Showcase ── */}
                {settings.fields_config?.enable_run_module && (
                    <RunEventShowcase config={settings} />
                )}

                {/* ── Registration Form Templates ── */}
                {settings.template_type === 'general_event' && (
                    <GeneralEventForm
                        projectId={resolvedProjectId!}
                        config={settings}
                        onSuccess={(summary) => {
                            setSuccessSummary(summary);
                            setIsSuccess(true);
                        }}
                    />
                )}
                {settings.template_type === 'guild_team_item' && (
                    <GuildTeamItemForm projectId={resolvedProjectId!} config={settings} onSuccess={() => setIsSuccess(true)} />
                )}
                {settings.template_type === 'guild_team_semi_free' && (
                    <GuildTeamSemiFreeForm projectId={resolvedProjectId!} config={settings} onSuccess={() => setIsSuccess(true)} />
                )}
                {settings.template_type === 'business_pro_item' && (
                    <BusinessProItemForm projectId={resolvedProjectId!} config={settings} onSuccess={() => setIsSuccess(true)} />
                )}
            </main>
        </div>
    );
}
