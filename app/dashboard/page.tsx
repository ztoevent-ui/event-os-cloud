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
    accent: '#F59E0B',
    tag: 'ARENA',
  },
  {
    id: 'luckydraw',
    href: '/apps/lucky-draw',
    icon: 'fa-solid fa-gift',
    label: 'Lucky Draw',
    desc: 'Master control for spin wheel & draws',
    accent: '#A855F7',
    tag: 'DISPLAY',
  },
  {
    id: 'arena-screen',
    href: '/apps/zto-arena/screen',
    icon: 'fa-solid fa-display',
    label: 'Arena Screen',
    desc: 'Live LAN sync scoreboard billboard',
    accent: '#06B6D4',
    tag: 'DISPLAY',
  },
  {
    id: 'registration',
    href: '/admin/registration',
    icon: 'fa-solid fa-sliders',
    label: 'Registration Studio',
    desc: 'Form fields, branding, sponsors & T&C',
    accent: '#F97316',
    tag: 'ADMIN',
  },
  {
    id: 'users',
    href: '/admin/users',
    icon: 'fa-solid fa-users-gear',
    label: 'User Management',
    desc: 'Add, edit & manage staff accounts',
    accent: '#8B5CF6',
    tag: 'ADMIN',
  },
  {
    id: 'enquiries',
    href: '/consultations',
    icon: 'fa-solid fa-clipboard-question',
    label: 'Enquiries',
    desc: 'View received consultation leads',
    accent: '#10B981',
    tag: 'ADMIN',
  },
];

const tagColors: Record<string, string> = {
  CORE: '#0056B3',
  ARENA: '#F59E0B',
  DISPLAY: '#A855F7',
  ADMIN: '#10B981',
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
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-2 border-[#0056B3]/30 border-t-[#0056B3] rounded-none animate-spin mb-4" />
          <p className="text-[#0056B3] font-black uppercase tracking-[0.2em] text-xs">Initializing OS...</p>
        </div>
      </div>
    );
  }

  const isAdmin = ['admin'].includes(profile?.role ?? '');
  const visibleTools = isAdmin ? tools : tools.filter(t => !['users', 'registration'].includes(t.id));

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#0056B3] selection:text-white page-transition">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#050505]/90 backdrop-blur-xl border-b border-white/5 px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border border-[#0056B3]/40 bg-[#0056B3]/10 flex items-center justify-center overflow-hidden rounded-none shadow-[0_0_15px_rgba(0,86,179,0.2)]">
            <img
              src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
              alt="ZTO"
              className="w-full h-full object-cover mix-blend-screen"
            />
          </div>
          <div>
            <div className="font-black text-lg tracking-tight uppercase">
              ZTO Event <span className="text-[#0056B3]">OS</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase">
              Operating System
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-none">
            <div className="w-6 h-6 bg-gradient-to-br from-[#0056B3] to-[#003d82] flex items-center justify-center text-xs font-bold rounded-none">
              {(profile?.display_name || 'S')[0].toUpperCase()}
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                {profile?.display_name || 'Staff'}
              </div>
              <div className="text-[9px] text-[#0056B3] font-black tracking-[0.1em] uppercase">
                {profile?.role || 'Staff'}
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all uppercase tracking-widest rounded-none"
          >
            <i className="fa-solid fa-arrow-left text-[10px]" /> Site
          </Link>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-500/20 hover:border-red-500/40 transition-all uppercase tracking-widest rounded-none"
          >
            <i className="fa-solid fa-power-off text-[10px]" /> Exit
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12 lg:py-20">
        
        {/* Welcome Section */}
        <div className="mb-16 relative">
          <div className="absolute top-0 left-0 w-32 h-32 bg-[#0056B3] blur-[120px] opacity-30 rounded-full pointer-events-none" />
          <div className="inline-flex items-center gap-2 bg-[#0056B3]/10 border border-[#0056B3]/30 px-3 py-1.5 text-[10px] font-black text-[#6BB8FF] uppercase tracking-[0.2em] mb-6 rounded-none">
            <i className="fa-solid fa-circle text-[6px] text-green-500 animate-pulse" />
            System Online
          </div>
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tight mb-4 text-white">
            Master <span className="text-[#0056B3]">Console</span>
          </h1>
          <p className="text-zinc-500 text-sm font-mono max-w-xl">
            Select an operational module to proceed. Ensure all actions comply with ZTO Event OS protocol.
          </p>
        </div>

        {/* Tools Section */}
        <div className="flex items-center gap-3 mb-8">
          <i className="fa-solid fa-server text-zinc-600 text-sm" />
          <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Available Nodes</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleTools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="group relative block zto-card hover:border-[#0056B3]/80 transition-all duration-300 hover:bg-[#050505] hover:-translate-y-1 overflow-hidden"
            >
              {/* Hover Glow */}
              <div 
                className="absolute -bottom-20 -right-20 w-40 h-40 blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                style={{ backgroundColor: tool.accent }}
              />

              <div className="flex justify-between items-start mb-12">
                <div 
                  className="w-14 h-14 flex items-center justify-center text-xl border transition-all duration-300 rounded-none group-hover:scale-110"
                  style={{ 
                    backgroundColor: `${tool.accent}15`, 
                    color: tool.accent,
                    borderColor: `${tool.accent}30` 
                  }}
                >
                  <i className={tool.icon} />
                </div>
                
                <div 
                  className="px-2 py-1 border text-[9px] font-black uppercase tracking-[0.2em] rounded-none transition-all"
                  style={{
                    backgroundColor: `${tagColors[tool.tag]}10`,
                    borderColor: `${tagColors[tool.tag]}30`,
                    color: tagColors[tool.tag]
                  }}
                >
                  {tool.tag}
                </div>
              </div>

              <h3 className="zto-card-title text-xl mb-3 group-hover:text-[#4da3ff] transition-colors tracking-wide uppercase">
                {tool.label}
              </h3>
              <p className="zto-card-desc text-xs leading-relaxed group-hover:text-white transition-colors">
                {tool.desc}
              </p>

              {/* Enter Action */}
              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] group-hover:text-[#0056B3] transition-colors">
                  Access Node
                </span>
                <i className="fa-solid fa-arrow-right text-zinc-600 group-hover:text-[#0056B3] group-hover:translate-x-1 transition-all text-xs" />
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
            © {new Date().getFullYear()} ZTO. Internal Network.
          </p>
          <div className="flex gap-4">
            <span className="w-1.5 h-1.5 bg-zinc-700 rounded-none" />
            <span className="w-1.5 h-1.5 bg-zinc-700 rounded-none" />
            <span className="w-1.5 h-1.5 bg-[#0056B3] rounded-none animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}

