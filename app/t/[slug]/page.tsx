import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { data } = await supabase
        .from('tournament_settings')
        .select('slogan, event_description, logo_url, hero_banner_url')
        .eq('page_slug', slug)
        .single();

    return {
        title: data?.slogan ? `${data.slogan} | ZTO Event` : 'Tournament | ZTO Event',
        description: data?.event_description || 'Official tournament information and registration.',
        openGraph: {
            images: data?.hero_banner_url ? [data.hero_banner_url] : [],
        },
    };
}

export default async function TournamentPublicPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const { data: ts } = await supabase
        .from('tournament_settings')
        .select(`
            *,
            projects!inner(id, name, start_date, end_date, venue, type)
        `)
        .eq('page_slug', slug)
        .single();

    if (!ts) notFound();

    const project = (ts as any).projects;
    const themeColor = ts.theme_color || '#f59e0b';
    const prizePool: any[] = ts.prize_pool || [];
    const categories: any[] = ts.categories || [];
    const schedule: any[] = ts.event_schedule || [];
    const social: any = ts.social_links || {};
    const regUrl = ts.page_slug ? `https://ztoevent.com/register/${ts.page_slug}` : `https://ztoevent.com/register/${project?.id}`;

    // Format dates for display
    const formatDate = (d: string | null) => {
        if (!d) return '';
        return new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const formatScheduleDate = (d: string) => {
        return new Date(d).toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    return (
        <div
            className="min-h-screen bg-[#0a0a0a] text-white font-sans"
            style={{ '--accent': themeColor } as React.CSSProperties}
        >
            <style>{`
                :root { --accent: ${themeColor}; }
                .accent-text { color: ${themeColor}; }
                .accent-bg { background-color: ${themeColor}; }
                .accent-border { border-color: ${themeColor}; }
                .accent-bg-faint { background-color: ${themeColor}18; }
                .accent-ring { box-shadow: 0 0 0 2px ${themeColor}40; }
                .accent-glow { box-shadow: 0 0 40px ${themeColor}30; }
                .gradient-overlay { background: linear-gradient(to bottom, #0a0a0a20 0%, #0a0a0a90 60%, #0a0a0a 100%); }
                .hero-inner { background: linear-gradient(135deg, #0a0a0a 0%, ${themeColor}12 100%); }
                .schedule-line::before { content: ''; position: absolute; left: 11px; top: 24px; bottom: -16px; width: 2px; background: linear-gradient(to bottom, ${themeColor}, transparent); }
                @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
                .fade-up { animation: fadeUp 0.6s ease forwards; }
                .glass { background: rgba(255,255,255,0.04); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); }
            `}</style>

            {/* ── HERO ─────────────────────────────── */}
            <section className="relative min-h-[90vh] flex flex-col justify-end overflow-hidden">
                {/* Background */}
                {ts.hero_banner_url ? (
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${ts.hero_banner_url})` }}
                    />
                ) : (
                    <div className="absolute inset-0 hero-inner" />
                )}
                <div className="gradient-overlay absolute inset-0" />

                {/* Decorative accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 accent-bg opacity-80" />

                {/* Nav bar */}
                <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 md:px-16 h-20">
                    <div className="flex items-center gap-3">
                        <img
                            src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
                            alt="ZTO"
                            className="w-9 h-9 rounded-lg object-contain"
                        />
                        <span className="text-white font-black text-sm tracking-wider uppercase opacity-70">ZTO Event</span>
                    </div>
                    <a
                        href={regUrl}
                        className="hidden md:inline-flex items-center gap-2 accent-bg text-black font-black text-xs uppercase tracking-widest px-5 py-2.5 rounded-full hover:opacity-90 transition-all hover:scale-105"
                    >
                        <i className="fa-solid fa-pen-to-square" />
                        Register Now
                    </a>
                </nav>

                {/* Hero Content */}
                <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-16 pb-20 pt-32">
                    {ts.logo_url && (
                        <img
                            src={ts.logo_url}
                            alt="Tournament Logo"
                            className="w-24 h-24 md:w-32 md:h-32 object-contain mb-8 rounded-2xl bg-white/5 p-2 fade-up accent-ring"
                        />
                    )}
                    <div
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase mb-5 fade-up accent-bg-faint accent-text accent-border border"
                        style={{ animationDelay: '0.1s' }}
                    >
                        <i className="fa-solid fa-trophy" />
                        Official Tournament
                    </div>
                    <h1
                        className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none mb-4 fade-up"
                        style={{ animationDelay: '0.15s' }}
                    >
                        {ts.slogan || project?.name}
                    </h1>

                    <div
                        className="flex flex-wrap items-center gap-6 mt-6 text-sm text-white/60 fade-up"
                        style={{ animationDelay: '0.25s' }}
                    >
                        {(project?.start_date || project?.end_date) && (
                            <div className="flex items-center gap-2">
                                <i className="fa-regular fa-calendar accent-text" />
                                <span>{formatDate(project.start_date)}{project.end_date && project.end_date !== project.start_date ? ` – ${formatDate(project.end_date)}` : ''}</span>
                            </div>
                        )}
                        {(ts.venue_name || project?.venue) && (
                            <div className="flex items-center gap-2">
                                <i className="fa-solid fa-location-dot accent-text" />
                                <span>{ts.venue_name || project?.venue}</span>
                            </div>
                        )}
                    </div>

                    {ts.title_sponsor && (
                        <div className="mt-6 text-sm text-white/50 fade-up" style={{ animationDelay: '0.3s' }}>
                            <span className="accent-text font-bold uppercase tracking-widest text-xs">{ts.title_sponsor_label || 'Title Sponsor'}</span>
                            <span className="text-white font-bold ml-2">{ts.title_sponsor}</span>
                        </div>
                    )}
                </div>
            </section>

            {/* ── PRIZE POOL ────────────────────────── */}
            {prizePool.length > 0 && (
                <section className="py-20 px-6 md:px-16 max-w-6xl mx-auto">
                    <div className="flex items-end gap-4 mb-10">
                        <div>
                            <p className="accent-text text-xs font-black tracking-[0.2em] uppercase mb-1">Prize Pool</p>
                            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">Money & Glory</h2>
                        </div>
                        <div className="flex-1 h-px bg-white/5 mb-3" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {prizePool.map((prize: any, i: number) => (
                            <div key={i} className="glass rounded-2xl p-5 hover:accent-glow transition-all group">
                                <div className="text-white/40 text-xs font-black uppercase tracking-widest mb-2 group-hover:accent-text transition-colors">{prize.category}</div>
                                <div className="text-2xl font-black accent-text">
                                    {prize.currency || 'RM'}{Number(prize.amount || 0).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── CATEGORIES / DIVISIONS ────────────── */}
            {categories.length > 0 && (
                <section className="py-20 px-6 md:px-16 max-w-6xl mx-auto">
                    <div className="flex items-end gap-4 mb-10">
                        <div>
                            <p className="accent-text text-xs font-black tracking-[0.2em] uppercase mb-1">Divisions</p>
                            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">Categories</h2>
                        </div>
                        <div className="flex-1 h-px bg-white/5 mb-3" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {categories.map((cat: any, i: number) => (
                            <div key={i} className="glass rounded-2xl p-6 hover:accent-glow transition-all border border-white/5 hover:border-white/10 group">
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-black text-lg uppercase group-hover:accent-text transition-colors">{cat.name}</h3>
                                    {cat.open_to && (
                                        <span className="text-[9px] accent-bg-faint accent-text px-2 py-1 rounded-full font-black uppercase tracking-widest shrink-0 ml-2">
                                            {cat.open_to}
                                        </span>
                                    )}
                                </div>
                                {cat.description && <p className="text-white/50 text-sm leading-relaxed">{cat.description}</p>}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── FORMAT & RULES ────────────────────── */}
            {(ts.format_description || ts.rules) && (
                <section className="py-20 px-6 md:px-16 max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {ts.format_description && (
                            <div>
                                <p className="accent-text text-xs font-black tracking-[0.2em] uppercase mb-2">Tournament Format</p>
                                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-6">How It Works</h2>
                                <div className="glass rounded-2xl p-6">
                                    <p className="text-white/70 leading-relaxed whitespace-pre-line">{ts.format_description}</p>
                                </div>
                            </div>
                        )}
                        {ts.rules && (
                            <div>
                                <p className="accent-text text-xs font-black tracking-[0.2em] uppercase mb-2">Tournament Rules</p>
                                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-6">The Rules</h2>
                                <div className="glass rounded-2xl p-6">
                                    <p className="text-white/70 leading-relaxed whitespace-pre-line">{ts.rules}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* ── SCHEDULE ──────────────────────────── */}
            {schedule.length > 0 && (
                <section className="py-20 px-6 md:px-16 max-w-6xl mx-auto">
                    <div className="flex items-end gap-4 mb-10">
                        <div>
                            <p className="accent-text text-xs font-black tracking-[0.2em] uppercase mb-1">Schedule</p>
                            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">Event Timeline</h2>
                        </div>
                        <div className="flex-1 h-px bg-white/5 mb-3" />
                    </div>
                    <div className="space-y-4">
                        {schedule.map((day: any, i: number) => (
                            <div key={i} className="relative flex gap-6 items-start schedule-line last:before:hidden">
                                <div className="shrink-0 w-6 h-6 rounded-full accent-bg flex items-center justify-center text-black font-black text-xs mt-1 z-10">
                                    {i + 1}
                                </div>
                                <div className="glass rounded-2xl p-5 flex-1 hover:accent-glow transition-all">
                                    <div className="flex flex-wrap gap-4 justify-between">
                                        <div>
                                            <div className="font-black text-lg">{day.label}</div>
                                            {day.date && <div className="text-white/40 text-xs mt-1 font-bold uppercase tracking-widest">{formatScheduleDate(day.date)}</div>}
                                        </div>
                                        {(day.time_start || day.time_end) && (
                                            <div className="accent-text font-black text-sm">
                                                {day.time_start}{day.time_end ? ` – ${day.time_end}` : ''}
                                            </div>
                                        )}
                                    </div>
                                    {day.notes && <p className="text-white/50 text-sm mt-3">{day.notes}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── REGISTRATION CTA ──────────────────── */}
            <section className="py-24 px-6 md:px-16">
                <div className="max-w-3xl mx-auto text-center glass rounded-3xl p-12 accent-glow">
                    <div className="accent-text text-xs font-black tracking-[0.2em] uppercase mb-3">Ready to Compete?</div>
                    <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-4">Join The Battle</h2>
                    <p className="text-white/50 mb-8">
                        {ts.event_description
                            ? ts.event_description.slice(0, 120) + (ts.event_description.length > 120 ? '…' : '')
                            : 'Secure your spot in this prestigious tournament.'}
                    </p>
                    {ts.reg_open_date && new Date(ts.reg_open_date) > new Date() ? (
                        <div className="inline-flex items-center gap-2 glass px-6 py-4 rounded-full text-white/50 font-bold text-sm">
                            <i className="fa-regular fa-clock accent-text" />
                            Registration opens {formatDate(ts.reg_open_date)}
                        </div>
                    ) : ts.reg_close_date && new Date(ts.reg_close_date) < new Date() ? (
                        <div className="inline-flex items-center gap-2 glass px-6 py-4 rounded-full text-white/50 font-bold text-sm">
                            <i className="fa-solid fa-lock accent-text" />
                            Registration has closed
                        </div>
                    ) : (
                        <a
                            href={regUrl}
                            className="inline-flex items-center gap-3 accent-bg text-black font-black uppercase tracking-widest px-10 py-4 rounded-full hover:opacity-90 transition-all hover:scale-105 text-base shadow-2xl"
                        >
                            <i className="fa-solid fa-pen-to-square" />
                            Register Now
                        </a>
                    )}
                    <div className="mt-6 text-white/30 text-xs font-bold">
                        {regUrl}
                    </div>
                </div>
            </section>

            {/* ── VENUE ─────────────────────────────── */}
            {(ts.venue_name || ts.venue_address) && (
                <section className="py-20 px-6 md:px-16 max-w-6xl mx-auto">
                    <div className="flex items-end gap-4 mb-10">
                        <div>
                            <p className="accent-text text-xs font-black tracking-[0.2em] uppercase mb-1">Location</p>
                            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">Venue</h2>
                        </div>
                        <div className="flex-1 h-px bg-white/5 mb-3" />
                    </div>
                    <div className="glass rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-start">
                        <div className="flex-1">
                            <h3 className="text-2xl font-black mb-2">{ts.venue_name}</h3>
                            {ts.venue_address && <p className="text-white/50 leading-relaxed">{ts.venue_address}</p>}
                        </div>
                        {ts.venue_map_url && (
                            <a
                                href={ts.venue_map_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 accent-bg-faint accent-text accent-border border px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:accent-bg hover:text-black transition-all shrink-0"
                            >
                                <i className="fa-solid fa-map-location-dot" />
                                Open in Maps
                            </a>
                        )}
                    </div>
                </section>
            )}

            {/* ── SPONSORS ──────────────────────────── */}
            {(ts.sponsors?.length > 0 || ts.co_organizers?.length > 0) && (
                <section className="py-16 px-6 md:px-16 max-w-6xl mx-auto border-t border-white/5">
                    <div className="text-center mb-8">
                        <p className="text-white/30 text-xs font-black tracking-[0.2em] uppercase">Organised by</p>
                    </div>
                    <div className="flex flex-wrap justify-center items-center gap-6">
                        {[...(ts.co_organizers || []), ...(ts.sponsors || [])].map((s: string, i: number) => (
                            <div key={i} className="glass px-5 py-3 rounded-xl text-white/60 font-bold text-sm">
                                {s}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── SOCIAL / FOOTER ───────────────────── */}
            <footer className="border-t border-white/5 py-12 px-6 md:px-16">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <img
                            src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
                            alt="ZTO"
                            className="w-8 h-8 rounded-lg object-contain opacity-40"
                        />
                        <span className="text-white/30 font-black text-xs uppercase tracking-widest">ZTO Event OS</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {social.facebook && (
                            <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:accent-text transition-colors">
                                <i className="fa-brands fa-facebook text-lg" />
                            </a>
                        )}
                        {social.instagram && (
                            <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:accent-text transition-colors">
                                <i className="fa-brands fa-instagram text-lg" />
                            </a>
                        )}
                        {social.whatsapp && (
                            <a href={`https://wa.me/${social.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:accent-text transition-colors">
                                <i className="fa-brands fa-whatsapp text-lg" />
                            </a>
                        )}
                    </div>
                    <p className="text-white/20 text-xs">
                        {ts.slogan || project?.name} &copy; {new Date().getFullYear()}
                    </p>
                </div>
            </footer>
        </div>
    );
}
