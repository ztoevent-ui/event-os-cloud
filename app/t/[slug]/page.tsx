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
        openGraph: { images: data?.hero_banner_url ? [data.hero_banner_url] : [] },
    };
}

export default async function TournamentPublicPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const { data: ts } = await supabase
        .from('tournament_settings')
        .select(`*, projects!inner(id, name, start_date, end_date, venue, type)`)
        .eq('page_slug', slug)
        .single();

    if (!ts) notFound();

    const project = (ts as any).projects;
    const accent = ts.theme_color || '#1a6db5';
    const prizePool: any[] = ts.prize_pool || [];
    const categories: any[] = ts.categories || [];
    const schedule: any[] = ts.event_schedule || [];
    const social: any = ts.social_links || {};
    const regUrl = ts.page_slug ? `https://ztoevent.com/register/${ts.page_slug}` : `https://ztoevent.com/register/${project?.id}`;

    const formatDate = (d: string | null) => {
        if (!d) return '';
        return new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' });
    };
    const formatShortDate = (d: string) =>
        new Date(d).toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    const isRegOpen = (!ts.reg_open_date || new Date(ts.reg_open_date) <= new Date())
        && (!ts.reg_close_date || new Date(ts.reg_close_date) >= new Date());

    return (
        <div className="min-h-screen bg-white font-sans" style={{ '--accent': accent } as React.CSSProperties}>
            <style>{`
                :root { --accent: ${accent}; }
                * { box-sizing: border-box; }
                .accent   { color: ${accent}; }
                .accent-bg { background-color: ${accent}; }
                .accent-border { border-color: ${accent}; }
                .accent-bg-soft { background-color: ${accent}18; }
                .hero-overlay { background: linear-gradient(to right, rgba(5,10,30,0.88) 40%, rgba(5,10,30,0.45) 100%); }
                .hero-overlay-mobile { background: linear-gradient(to bottom, rgba(5,10,30,0.55) 0%, rgba(5,10,30,0.82) 100%); }
                .section-divider { border-top: 4px solid ${accent}; }
                .prize-table th { background: #0d1b2a; color: #fff; }
                .prize-table tr:nth-child(even) td { background: #f4f7fb; }
                .prize-table tr:hover td { background: ${accent}12; }
                .tab-active { border-bottom: 3px solid ${accent}; color: ${accent}; font-weight: 900; }
                .tab-btn:hover { color: ${accent}; }
                @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
                .fade-up { animation: fadeUp .5s ease forwards; }
                .card-shadow { box-shadow: 0 2px 16px rgba(0,0,0,0.09); }
                .section-label { font-size: 11px; font-weight: 900; letter-spacing: .18em; text-transform: uppercase; color: ${accent}; }
                .section-title { font-size: clamp(1.6rem,4vw,2.5rem); font-weight: 900; color: #0d1b2a; text-transform: uppercase; letter-spacing: -.02em; }
                .reg-btn { background: ${accent}; color: #fff; font-weight: 900; text-transform: uppercase; letter-spacing: .12em; padding: 14px 36px; border-radius: 6px; transition: opacity .2s, transform .2s; display: inline-flex; align-items: center; gap: 10px; }
                .reg-btn:hover { opacity: .88; transform: translateY(-2px); }
                .hero-gradient { background: linear-gradient(135deg, #061224 0%, #0d2145 60%, #1a3a6b 100%); }
            `}</style>

            {/* ── STICKY TOP NAV ─────────────────────────────────────────── */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG" alt="ZTO" className="w-8 h-8 rounded object-contain" />
                        <span className="font-black text-[#0d1b2a] text-sm tracking-widest uppercase">ZTO Event</span>
                    </div>
                    {isRegOpen ? (
                        <a href={regUrl} className="reg-btn text-sm" style={{ padding: '10px 24px' }}>
                            <i className="fa-solid fa-pen-to-square" /> Register Now
                        </a>
                    ) : (
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Registration Closed</span>
                    )}
                </div>
            </header>

            {/* ── HERO SECTION ───────────────────────────────────────────── */}
            <section className="relative min-h-[480px] md:min-h-[560px] flex flex-col justify-end overflow-hidden">
                {/* Background */}
                {ts.hero_banner_url ? (
                    <>
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${ts.hero_banner_url})` }} />
                        <div className="hero-overlay absolute inset-0" />
                    </>
                ) : (
                    <div className="hero-gradient absolute inset-0">
                        {/* Decorative abstract lines */}
                        <div className="absolute inset-0 overflow-hidden opacity-10">
                            <div style={{ position:'absolute', top:'20%', left:'-10%', width:'60%', height:'200%', background: accent, transform:'rotate(-35deg)', borderRadius:'40px' }} />
                            <div style={{ position:'absolute', top:'10%', left:'30%', width:'40%', height:'150%', background: accent, transform:'rotate(-35deg)', borderRadius:'40px', opacity:'.4' }} />
                        </div>
                    </div>
                )}

                {/* Hero content */}
                <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pb-20 pt-12 w-full">
                    <div className="flex flex-col md:flex-row items-start md:items-end gap-6 md:gap-12">
                        {/* Logo */}
                        {ts.logo_url && (
                            <img src={ts.logo_url} alt="Logo" className="w-36 h-36 md:w-44 md:h-44 object-contain rounded-2xl shrink-0 drop-shadow-2xl fade-up" style={{ background:'rgba(255,255,255,0.06)', padding:'10px' }} />
                        )}

                        {/* Info */}
                        <div className="text-white fade-up" style={{ animationDelay:'.1s' }}>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-4" style={{ background:`${accent}30`, color: accent, border:`1px solid ${accent}60` }}>
                                <i className="fa-solid fa-trophy" /> Official Tournament
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-4" style={{ textShadow:'0 2px 20px rgba(0,0,0,0.5)' }}>
                                {ts.slogan || project?.name}
                            </h1>
                            <div className="flex flex-wrap gap-5 text-sm text-white/80 mt-2">
                                {(project?.start_date || project?.end_date) && (
                                    <div className="flex items-center gap-2 font-semibold">
                                        <i className="fa-regular fa-calendar" style={{ color: accent }} />
                                        {formatDate(project.start_date)}{project.end_date && project.end_date !== project.start_date ? ` – ${formatDate(project.end_date)}` : ''}
                                    </div>
                                )}
                                {(ts.venue_name || project?.venue) && (
                                    <div className="flex items-center gap-2 font-semibold">
                                        <i className="fa-solid fa-location-dot" style={{ color: accent }} />
                                        {ts.venue_name || project?.venue}
                                    </div>
                                )}
                            </div>
                            {ts.title_sponsor && (
                                <div className="mt-4 text-sm">
                                    <span className="font-black uppercase tracking-widest text-xs" style={{ color: accent }}>{ts.title_sponsor_label || 'Title Sponsor'} / 冠名商 </span>
                                    <span className="font-bold text-white">{ts.title_sponsor}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Accent bottom bar */}
                <div className="absolute bottom-0 left-0 right-0 z-20">
                    <div className="h-1 w-full" style={{ background: accent }} />
                </div>
            </section>

            {/* ── TAB NAV ────────────────────────────────────────────────── */}
            <nav className="bg-white border-b border-gray-200 sticky top-16 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 md:px-8 flex overflow-x-auto gap-0 scrollbar-hide">
                    {[
                        { id: 'about', label: 'About', icon: 'fa-circle-info', show: !!ts.event_description },
                        { id: 'prize-pool', label: 'Prize Pool', icon: 'fa-trophy', show: prizePool.length > 0 },
                        { id: 'categories', label: 'Categories', icon: 'fa-layer-group', show: categories.length > 0 },
                        { id: 'format', label: 'Format & Rules', icon: 'fa-book', show: !!(ts.format_description || ts.rules) },
                        { id: 'schedule', label: 'Schedule', icon: 'fa-calendar-days', show: schedule.length > 0 },
                        { id: 'venue', label: 'Venue', icon: 'fa-location-dot', show: !!(ts.venue_name || ts.venue_address) },
                        { id: 'register', label: 'Register', icon: 'fa-pen-to-square', show: true },
                    ].filter(t => t.show).map(tab => (
                        <a
                            key={tab.id}
                            href={`#${tab.id}`}
                            className="tab-btn flex items-center gap-2 px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-500 whitespace-nowrap transition-colors border-b-3 border-transparent hover:no-underline"
                        >
                            <i className={`fa-solid ${tab.icon} text-xs`} />
                            {tab.label}
                        </a>
                    ))}
                </div>
            </nav>

            {/* ── CONTENT AREA ───────────────────────────────────────────── */}
            <main className="max-w-7xl mx-auto px-4 md:px-8">

                {/* ── ABOUT ─────────────────────────────────────────── */}
                {ts.event_description && (
                    <section id="about" className="py-16 border-b border-gray-100">
                        <div className="section-label mb-2">About</div>
                        <h2 className="section-title mb-6">Tournament Overview</h2>
                        <div className="max-w-3xl">
                            <p className="text-gray-600 text-lg leading-relaxed">{ts.event_description}</p>
                        </div>
                    </section>
                )}

                {/* ── PRIZE POOL ─────────────────────────────────────── */}
                {prizePool.length > 0 && (
                    <section id="prize-pool" className="py-16 border-b border-gray-100">
                        <div className="section-label mb-2">Prize Money</div>
                        <h2 className="section-title mb-2">
                            Prize Pool
                            {prizePool.length > 0 && (
                                <span className="ml-4 text-2xl md:text-3xl" style={{ color: accent }}>
                                    — {prizePool[0]?.currency || 'RM'}{prizePool.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0).toLocaleString()}
                                </span>
                            )}
                        </h2>
                        <p className="text-gray-400 text-sm mb-8 font-semibold uppercase tracking-wider">Total prize distribution across all categories</p>

                        <div className="overflow-x-auto rounded-xl border border-gray-200 card-shadow">
                            <table className="w-full prize-table text-sm">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-black tracking-widest uppercase">Category / 组别</th>
                                        <th className="px-6 py-4 text-right text-xs font-black tracking-widest uppercase">Prize Money</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {prizePool.map((prize: any, i: number) => (
                                        <tr key={i} className="transition-colors">
                                            <td className="px-6 py-4 font-black text-[#0d1b2a] uppercase tracking-wide">{prize.category}</td>
                                            <td className="px-6 py-4 text-right font-black text-xl" style={{ color: accent }}>
                                                {prize.currency || 'RM'} {Number(prize.amount || 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* ── CATEGORIES ─────────────────────────────────────── */}
                {categories.length > 0 && (
                    <section id="categories" className="py-16 border-b border-gray-100">
                        <div className="section-label mb-2">Divisions</div>
                        <h2 className="section-title mb-8">Categories</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {categories.map((cat: any, i: number) => (
                                <div key={i} className="rounded-xl border border-gray-200 p-6 card-shadow hover:border-gray-300 transition-all group">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-black mr-3 shrink-0 accent-bg text-sm">
                                            {i + 1}
                                        </div>
                                        {cat.open_to && (
                                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full accent-bg-soft accent border border-current shrink-0">
                                                {cat.open_to}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-black text-lg text-[#0d1b2a] uppercase mb-2 group-hover:accent transition-colors">{cat.name}</h3>
                                    {cat.description && <p className="text-gray-500 text-sm leading-relaxed">{cat.description}</p>}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── FORMAT & RULES ─────────────────────────────────── */}
                {(ts.format_description || ts.rules) && (
                    <section id="format" className="py-16 border-b border-gray-100">
                        <div className="section-label mb-2">Regulations</div>
                        <h2 className="section-title mb-8">Format &amp; Rules</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {ts.format_description && (
                                <div className="rounded-xl border border-gray-200 p-7 card-shadow">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-9 h-9 rounded-lg accent-bg flex items-center justify-center text-white"><i className="fa-solid fa-sitemap" /></div>
                                        <h3 className="font-black text-[#0d1b2a] uppercase tracking-wide text-sm">Tournament Format</h3>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">{ts.format_description}</p>
                                </div>
                            )}
                            {ts.rules && (
                                <div className="rounded-xl border border-gray-200 p-7 card-shadow">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-9 h-9 rounded-lg accent-bg flex items-center justify-center text-white"><i className="fa-solid fa-scale-balanced" /></div>
                                        <h3 className="font-black text-[#0d1b2a] uppercase tracking-wide text-sm">Rules</h3>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">{ts.rules}</p>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ── SCHEDULE ───────────────────────────────────────── */}
                {schedule.length > 0 && (
                    <section id="schedule" className="py-16 border-b border-gray-100">
                        <div className="section-label mb-2">Event Schedule</div>
                        <h2 className="section-title mb-8">Tournament Timeline</h2>
                        <div className="space-y-0">
                            {schedule.map((day: any, i: number) => (
                                <div key={i} className="flex gap-0 group">
                                    {/* Left: date column */}
                                    <div className="w-36 shrink-0 py-6 pr-6 text-right">
                                        {day.date && (
                                            <>
                                                <div className="font-black text-[#0d1b2a] text-sm">{new Date(day.date).toLocaleDateString('en-MY', { day:'numeric', month:'short' })}</div>
                                                <div className="text-gray-400 text-xs font-bold uppercase">{new Date(day.date).toLocaleDateString('en-MY', { weekday:'short' })}</div>
                                            </>
                                        )}
                                        {(day.time_start || day.time_end) && (
                                            <div className="text-xs font-bold mt-1" style={{ color: accent }}>
                                                {day.time_start}{day.time_end ? `–${day.time_end}` : ''}
                                            </div>
                                        )}
                                    </div>

                                    {/* Center: timeline dot + line */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-4 h-4 rounded-full accent-bg shrink-0 mt-7 z-10 ring-4 ring-white" />
                                        {i < schedule.length - 1 && <div className="w-0.5 flex-1 mt-1 mb-0" style={{ background:`${accent}30` }} />}
                                    </div>

                                    {/* Right: content */}
                                    <div className="flex-1 pl-6 py-6">
                                        <div className="rounded-xl border border-gray-200 p-5 card-shadow group-hover:border-gray-300 transition-all">
                                            <h3 className="font-black text-[#0d1b2a] text-base uppercase">{day.label}</h3>
                                            {day.notes && <p className="text-gray-500 text-sm mt-1">{day.notes}</p>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── VENUE ──────────────────────────────────────────── */}
                {(ts.venue_name || ts.venue_address) && (
                    <section id="venue" className="py-16 border-b border-gray-100">
                        <div className="section-label mb-2">Location</div>
                        <h2 className="section-title mb-8">Venue</h2>
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1 rounded-xl border border-gray-200 p-8 card-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl accent-bg flex items-center justify-center text-white">
                                        <i className="fa-solid fa-location-dot" />
                                    </div>
                                    <h3 className="font-black text-xl text-[#0d1b2a]">{ts.venue_name}</h3>
                                </div>
                                {ts.venue_address && <p className="text-gray-500 leading-relaxed">{ts.venue_address}</p>}
                                {ts.venue_map_url && (
                                    <a href={ts.venue_map_url} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 mt-5 font-black text-xs uppercase tracking-widest px-5 py-2.5 rounded-lg transition-all hover:opacity-80"
                                        style={{ background: accent, color: '#fff' }}>
                                        <i className="fa-solid fa-map-location-dot" /> Open in Google Maps
                                    </a>
                                )}
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {/* ── REGISTRATION CTA ───────────────────────────────────────── */}
            <section id="register" className="py-24 px-4 md:px-8" style={{ background: `linear-gradient(135deg, #0d1b2a 0%, #1a3a6b 100%)` }}>
                <div className="max-w-3xl mx-auto text-center">
                    {ts.logo_url && (
                        <img src={ts.logo_url} alt="Logo" className="w-20 h-20 object-contain mx-auto mb-6 rounded-xl" style={{ background:'rgba(255,255,255,0.08)', padding:'8px' }} />
                    )}
                    <div className="section-divider w-16 mx-auto mb-8" />
                    <div className="text-xs font-black tracking-widest uppercase mb-3 text-white/50">Ready to Compete?</div>
                    <h2 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tight mb-3">
                        {ts.slogan || project?.name}
                    </h2>
                    {(project?.start_date) && (
                        <p className="text-white/50 font-semibold mb-8">{formatDate(project.start_date)}{project.end_date && project.end_date !== project.start_date ? ` – ${formatDate(project.end_date)}` : ''}</p>
                    )}

                    {!isRegOpen && ts.reg_open_date && new Date(ts.reg_open_date) > new Date() ? (
                        <div className="inline-flex items-center gap-2 px-6 py-4 rounded-lg text-white/60 font-bold text-sm border border-white/10">
                            <i className="fa-regular fa-clock" style={{ color: accent }} />
                            Registration opens {formatDate(ts.reg_open_date)}
                        </div>
                    ) : !isRegOpen && ts.reg_close_date && new Date(ts.reg_close_date) < new Date() ? (
                        <div className="inline-flex items-center gap-2 px-6 py-4 rounded-lg text-white/60 font-bold text-sm border border-white/10">
                            <i className="fa-solid fa-lock" style={{ color: accent }} />
                            Registration has closed
                        </div>
                    ) : (
                        <a href={regUrl} className="reg-btn text-base mx-auto">
                            <i className="fa-solid fa-pen-to-square" /> Register Now
                        </a>
                    )}
                </div>
            </section>

            {/* ── FOOTER ─────────────────────────────────────────────────── */}
            <footer className="bg-[#0d1b2a] border-t border-white/5 py-10 px-4 md:px-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <img src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG" alt="ZTO" className="w-7 h-7 rounded object-contain opacity-40" />
                        <span className="text-white/30 font-black text-xs uppercase tracking-widest">ZTO Event OS</span>
                    </div>
                    <div className="flex items-center gap-5">
                        {social.facebook && (
                            <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white transition-colors">
                                <i className="fa-brands fa-facebook text-lg" />
                            </a>
                        )}
                        {social.instagram && (
                            <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white transition-colors">
                                <i className="fa-brands fa-instagram text-lg" />
                            </a>
                        )}
                        {social.whatsapp && (
                            <a href={`https://wa.me/${social.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white transition-colors">
                                <i className="fa-brands fa-whatsapp text-lg" />
                            </a>
                        )}
                    </div>
                    <p className="text-white/20 text-xs">© {new Date().getFullYear()} {ts.slogan || project?.name}</p>
                </div>
            </footer>
        </div>
    );
}
