'use client';

import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Profile = {
    display_name: string | null;
    role: string | null;
};

const tools = [
    {
        id: 'projects',
        href: '/projects',
        icon: 'fa-solid fa-calendar-check',
        label: 'Event Manager',
        desc: 'Projects, timelines, budgets & tasks',
        accent: '#0056B3',
        tag: 'CORE',
    },
    {
        id: 'arena',
        href: '/apps/zto-arena',
        icon: 'fa-solid fa-tablet-screen-button',
        label: 'ZTO Arena Hub',
        desc: 'Tournament orchestration & master controls',
        accent: '#4da3ff',
        tag: 'ARENA',
    },
    {
        id: 'luckydraw',
        href: '/apps/lucky-draw',
        icon: 'fa-solid fa-gift',
        label: 'Lucky Draw',
        desc: 'Master control for spin wheel & draws',
        accent: '#a855f7',
        tag: 'DISPLAY',
    },
    {
        id: 'arena-screen',
        href: '/apps/zto-arena/screen',
        icon: 'fa-solid fa-display',
        label: 'Arena Screen',
        desc: 'Live LAN sync scoreboard billboard',
        accent: '#06b6d4',
        tag: 'DISPLAY',
    },
    {
        id: 'registration',
        href: '/admin/registration',
        icon: 'fa-solid fa-sliders',
        label: 'Registration Studio',
        desc: 'Form fields, branding, sponsors & T&C',
        accent: '#0056B3',
        tag: 'ADMIN',
    },
    {
        id: 'users',
        href: '/admin/users',
        icon: 'fa-solid fa-users-gear',
        label: 'User Management',
        desc: 'Add, edit & manage staff accounts',
        accent: '#8b5cf6',
        tag: 'ADMIN',
    },
    {
        id: 'enquiries',
        href: '/consultations',
        icon: 'fa-solid fa-clipboard-question',
        label: 'Enquiries',
        desc: 'View received consultation leads',
        accent: '#10b981',
        tag: 'ADMIN',
    },
];

const tagColors: Record<string, string> = {
    CORE:    '#0056B3',
    ARENA:   '#4da3ff',
    DISPLAY: '#8b5cf6',
    ADMIN:   '#10b981',
};

export default function Dashboard() {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.replace('/auth?returnTo=/dashboard'); return; }
            const { data: prof } = await supabase
                .from('profiles')
                .select('display_name, role')
                .eq('id', user.id)
                .maybeSingle();
            setProfile(prof);
            setLoading(false);
        };
        init();
    }, [router]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.replace('/');
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    <div style={{
                        width: 44, height: 44,
                        border: '2px solid rgba(0,86,179,0.2)',
                        borderTopColor: '#0056B3',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                    <p style={{ color: '#0056B3', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'Urbanist, sans-serif' }}>
                        Initializing OS...
                    </p>
                </div>
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const isAdmin = profile?.role?.toLowerCase() === 'admin';
    const visibleTools = isAdmin ? tools : tools.filter(t => !['users', 'registration'].includes(t.id));

    return (
        <div className="page-transition" style={{
            minHeight: '100vh',
            background: '#050505',
            color: '#E5E5E5',
            fontFamily: 'Urbanist, sans-serif',
        }}>
            {/* ── Top Nav Bar ── */}
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 50,
                background: 'rgba(5,5,5,0.92)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                padding: '0 48px',
                height: 68,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                        width: 36, height: 36,
                        borderRadius: 10,
                        border: '1px solid rgba(0,86,179,0.4)',
                        overflow: 'hidden',
                        flexShrink: 0,
                    }}>
                        <img
                            src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
                            alt="ZTO"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.01em', color: '#fff' }}>
                            ZTO Event <span style={{ color: '#0056B3' }}>OS</span>
                        </div>
                        <div className="zto-label" style={{ marginTop: 1 }}>Master Console</div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* User chip */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 12, padding: '6px 14px',
                    }}>
                        <div style={{
                            width: 28, height: 28,
                            background: '#0056B3',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0,
                        }}>
                            {(profile?.display_name || 'S')[0].toUpperCase()}
                        </div>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{profile?.display_name || 'Staff'}</div>
                            <div style={{ fontSize: 9, color: '#0056B3', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{profile?.role || 'Staff'}</div>
                        </div>
                    </div>

                    <Link href="/" className="zto-btn zto-btn-ghost" style={{ textDecoration: 'none', fontSize: 11 }}>
                        <i className="fa-solid fa-arrow-left" /> Site
                    </Link>

                    <button onClick={handleSignOut} className="zto-btn zto-btn-danger" style={{ fontSize: 11 }}>
                        <i className="fa-solid fa-power-off" /> Exit
                    </button>
                </div>
            </header>

            {/* ── Main Canvas with Guardrail ── */}
            <main style={{ maxWidth: 1400, margin: '0 auto', padding: '60px 40px 80px' }}>

                {/* Hero */}
                <div style={{ marginBottom: 56, position: 'relative' }}>
                    <div style={{
                        position: 'absolute', top: -40, left: -40,
                        width: 240, height: 240,
                        background: '#0056B3',
                        filter: 'blur(120px)',
                        opacity: 0.12,
                        borderRadius: '50%',
                        pointerEvents: 'none',
                    }} />

                    <div className="zto-badge zto-badge-blue" style={{ marginBottom: 20 }}>
                        <span className="zto-pulse-dot blue" />
                        System Online
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                        fontWeight: 800,
                        color: '#fff',
                        textTransform: 'uppercase',
                        letterSpacing: '-0.02em',
                        lineHeight: 1,
                        marginBottom: 16,
                    }}>
                        Master <span style={{ color: '#0056B3' }}>Console</span>
                    </h1>
                    <p className="zto-desc">
                        Select an operational module to proceed. All actions are logged and audited.
                    </p>
                </div>

                {/* Section Label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                    <i className="fa-solid fa-server" style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }} />
                    <span className="zto-label">Available Nodes</span>
                    <span style={{
                        fontSize: 9, fontWeight: 700,
                        background: 'rgba(0,86,179,0.12)',
                        border: '1px solid rgba(0,86,179,0.25)',
                        color: '#6BB8FF',
                        padding: '2px 8px',
                        borderRadius: 999,
                    }}>
                        {visibleTools.length}
                    </span>
                </div>

                {/* Tool Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 20,
                }}>
                    {visibleTools.map(tool => (
                        <Link
                            key={tool.id}
                            href={tool.href}
                            style={{ textDecoration: 'none', display: 'block' }}
                            className="group"
                        >
                            <div className="zto-card" style={{
                                padding: 32,
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                                    (e.currentTarget as HTMLDivElement).style.borderColor = `${tool.accent}80`;
                                    (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 40px -10px ${tool.accent}40`;
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLDivElement).style.transform = '';
                                    (e.currentTarget as HTMLDivElement).style.borderColor = '';
                                    (e.currentTarget as HTMLDivElement).style.boxShadow = '';
                                }}
                            >
                                {/* Top row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
                                    <div style={{
                                        width: 48, height: 48,
                                        borderRadius: 14,
                                        background: `${tool.accent}12`,
                                        border: `1px solid ${tool.accent}30`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 18, color: tool.accent,
                                    }}>
                                        <i className={tool.icon} />
                                    </div>
                                    <span style={{
                                        fontSize: 9, fontWeight: 700,
                                        letterSpacing: '0.14em',
                                        textTransform: 'uppercase',
                                        padding: '3px 10px',
                                        borderRadius: 999,
                                        background: `${tagColors[tool.tag]}10`,
                                        border: `1px solid ${tagColors[tool.tag]}30`,
                                        color: tagColors[tool.tag],
                                    }}>
                                        {tool.tag}
                                    </span>
                                </div>

                                {/* Label */}
                                <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                                    {tool.label}
                                </div>
                                <div className="zto-desc" style={{ fontSize: 13, flex: 1 }}>
                                    {tool.desc}
                                </div>

                                {/* Footer */}
                                <div style={{
                                    marginTop: 28,
                                    paddingTop: 20,
                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}>
                                    <span className="zto-label">Access Node</span>
                                    <i className="fa-solid fa-arrow-right" style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }} />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Footer */}
                <div style={{
                    marginTop: 80,
                    paddingTop: 24,
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <span className="zto-label">© {new Date().getFullYear()} ZTO. Internal Network.</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                        <span className="zto-pulse-dot blue" />
                    </div>
                </div>
            </main>
        </div>
    );
}
