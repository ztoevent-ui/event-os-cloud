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
    glow: 'rgba(0,86,179,0.25)',
    bg: 'rgba(0,86,179,0.08)',
    border: 'rgba(0,86,179,0.2)',
    tag: 'CORE',
  },
  {
    id: 'arena',
    href: '/apps/zto-arena',
    icon: 'fa-solid fa-tablet-screen-button',
    label: 'ZTO Arena Hub',
    desc: 'Tournament orchestration & master controls',
    accent: '#F59E0B',
    glow: 'rgba(245,158,11,0.25)',
    bg: 'rgba(245,158,11,0.07)',
    border: 'rgba(245,158,11,0.2)',
    tag: 'ARENA',
  },
  {
    id: 'luckydraw',
    href: '/apps/lucky-draw',
    icon: 'fa-solid fa-gift',
    label: 'Lucky Draw',
    desc: 'Master control for spin wheel & draws',
    accent: '#A855F7',
    glow: 'rgba(168,85,247,0.25)',
    bg: 'rgba(168,85,247,0.07)',
    border: 'rgba(168,85,247,0.2)',
    tag: 'DISPLAY',
  },
  {
    id: 'arena-screen',
    href: '/apps/zto-arena/screen',
    icon: 'fa-solid fa-display',
    label: 'Arena Screen',
    desc: 'Live LAN sync scoreboard billboard',
    accent: '#06B6D4',
    glow: 'rgba(6,182,212,0.25)',
    bg: 'rgba(6,182,212,0.07)',
    border: 'rgba(6,182,212,0.2)',
    tag: 'DISPLAY',
  },
  {
    id: 'registration',
    href: '/admin/registration',
    icon: 'fa-solid fa-sliders',
    label: 'Registration Studio',
    desc: 'Form fields, branding, sponsors & T&C',
    accent: '#F97316',
    glow: 'rgba(249,115,22,0.25)',
    bg: 'rgba(249,115,22,0.07)',
    border: 'rgba(249,115,22,0.2)',
    tag: 'ADMIN',
  },
  {
    id: 'users',
    href: '/admin/users',
    icon: 'fa-solid fa-users-gear',
    label: 'User Management',
    desc: 'Add, edit & manage staff accounts',
    accent: '#8B5CF6',
    glow: 'rgba(139,92,246,0.25)',
    bg: 'rgba(139,92,246,0.07)',
    border: 'rgba(139,92,246,0.2)',
    tag: 'ADMIN',
  },
  {
    id: 'enquiries',
    href: '/consultations',
    icon: 'fa-solid fa-clipboard-question',
    label: 'Enquiries',
    desc: 'View received consultation leads',
    accent: '#10B981',
    glow: 'rgba(16,185,129,0.25)',
    bg: 'rgba(16,185,129,0.07)',
    border: 'rgba(16,185,129,0.2)',
    tag: 'ADMIN',
  },
];

const tagColors: Record<string, string> = {
  CORE: '#0077CC',
  ARENA: '#D97706',
  DISPLAY: '#0891B2',
  ADMIN: '#7C3AED',
};

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth?returnTo=/dashboard');
        return;
      }
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
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '3px solid rgba(0,86,179,0.2)',
            borderTopColor: '#0056B3',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>Loading...</p>
        </div>
      </div>
    );
  }

  const isAdmin = ['admin'].includes(profile?.role ?? '');
  const visibleTools = isAdmin ? tools : tools.filter(t => !['users', 'registration'].includes(t.id));

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .tool-card {
          position: relative;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          padding: 28px;
          cursor: pointer;
          transition: all 0.25s ease;
          text-decoration: none;
          display: block;
          overflow: hidden;
        }
        .tool-card:hover {
          transform: translateY(-4px);
          background: rgba(255,255,255,0.05);
        }
        .tool-card .glow-bg {
          position: absolute;
          bottom: -40px; right: -40px;
          width: 120px; height: 120px;
          border-radius: 50%;
          filter: blur(50px);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .tool-card:hover .glow-bg { opacity: 1; }

        .dash-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 1199px) {
          .dash-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 899px) {
          .dash-grid { grid-template-columns: repeat(2, 1fr); }
          .dash-header { padding: 20px 24px !important; }
          .dash-main { padding: 24px !important; }
        }
        @media (max-width: 599px) {
          .dash-grid { grid-template-columns: 1fr; }
          .tool-card { padding: 20px; }
          .dash-header { padding: 16px 20px !important; }
          .dash-main { padding: 16px !important; }
        }
      `}</style>

      {/* Header */}
      <header
        className="dash-header"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(5,5,5,0.9)',
          backdropFilter: 'blur(20px)',
          position: 'sticky', top: 0, zIndex: 50,
          padding: '18px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(0,86,179,0.4)', flexShrink: 0 }}>
            <img
              src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
              alt="ZTO"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px', lineHeight: 1.1 }}>
              ZTO Event <span style={{ color: '#0056B3' }}>OS</span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Operating System
            </div>
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* User info */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 10, padding: '8px 14px',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0056B3, #0077CC)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>
              {(profile?.display_name || 'S')[0].toUpperCase()}
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                {profile?.display_name || 'Staff'}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                {profile?.role || 'Staff'}
              </div>
            </div>
          </div>

          {/* Back to site */}
          <Link
            href="/"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 8, padding: '8px 14px',
              color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 500,
              textDecoration: 'none', transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
          >
            <i className="fa-solid fa-arrow-left" style={{ fontSize: 11 }} />
            Site
          </Link>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,50,50,0.06)',
              border: '1px solid rgba(255,50,50,0.15)',
              borderRadius: 8, padding: '8px 14px',
              color: 'rgba(255,100,100,0.7)', fontSize: 12, fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,50,50,0.12)'; e.currentTarget.style.color = '#ff6464'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,50,50,0.06)'; e.currentTarget.style.color = 'rgba(255,100,100,0.7)'; }}
          >
            <i className="fa-solid fa-right-from-bracket" style={{ fontSize: 11 }} />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="dash-main" style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 48px' }}>

        {/* Welcome */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,86,179,0.1)', border: '1px solid rgba(0,86,179,0.25)',
            borderRadius: 100, padding: '4px 14px',
            fontSize: 11, fontWeight: 700, color: '#6BB8FF',
            letterSpacing: '1.5px', textTransform: 'uppercase',
            marginBottom: 16,
          }}>
            <i className="fa-solid fa-circle" style={{ fontSize: 6, color: '#4ade80' }} />
            System Online
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.1, marginBottom: 8 }}>
            Welcome back, <span style={{ color: '#6BB8FF' }}>{profile?.display_name?.split(' ')[0] || 'Staff'}</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>
            Zero To One Event Operating System — select a tool to get started.
          </p>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: 32 }} />

        {/* Tools Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <i className="fa-solid fa-grid-2" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            All Tools
          </span>
        </div>

        {/* Tool Cards Grid */}
        <div className="dash-grid">
          {visibleTools.map((tool) => (
            <Link key={tool.id} href={tool.href} className="tool-card" style={{ borderColor: tool.border }}>
              {/* Glow bg on hover */}
              <div className="glow-bg" style={{ background: tool.glow }} />

              {/* Tag */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: `${tagColors[tool.tag]}22`,
                border: `1px solid ${tagColors[tool.tag]}44`,
                color: tagColors[tool.tag],
                borderRadius: 6,
                fontSize: 9, fontWeight: 800, letterSpacing: '1.5px',
                padding: '3px 8px',
                marginBottom: 20,
                textTransform: 'uppercase',
              }}>
                {tool.tag}
              </div>

              {/* Icon */}
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: tool.bg,
                border: `1px solid ${tool.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16, fontSize: 20, color: tool.accent,
                transition: 'transform 0.2s ease',
              }}>
                <i className={tool.icon} />
              </div>

              {/* Label & desc */}
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6, lineHeight: 1.2 }}>
                {tool.label}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                {tool.desc}
              </div>

              {/* Arrow */}
              <div style={{
                position: 'absolute', bottom: 22, right: 22,
                color: tool.accent, fontSize: 13, opacity: 0.6,
                transition: 'opacity 0.2s, transform 0.2s',
              }}>
                <i className="fa-solid fa-arrow-right" />
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 60,
          paddingTop: 24,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
            © {new Date().getFullYear()} Zero To One Event. Internal use only.
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
            Event OS v2
          </span>
        </div>
      </main>
    </div>
  );
}
