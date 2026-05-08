'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import equipmentData from '../config/equipment.json';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const projectCategories = [
  {
    id: 'kemena-pacific-hospital-rename-ceremony',
    name: 'Kemena Pacific Hospital Rename Ceremony',
    items: [
      { id: 'k1', tag: 'Ceremony', src: '/projects/kemena-pacific-hospital-rename-ceremony/photos/img_01.jpg', size: 'wide' },
      { id: 'k2', tag: 'Ceremony', src: '/projects/kemena-pacific-hospital-rename-ceremony/photos/img_02.jpg', size: 'tall' },
      { id: 'k3', tag: 'Ceremony', src: '/projects/kemena-pacific-hospital-rename-ceremony/photos/img_03.jpg', size: 'normal' },
      { id: 'k4', tag: 'Ceremony', src: '/projects/kemena-pacific-hospital-rename-ceremony/photos/img_04.jpg', size: 'wide' },
    ]
  },
  {
    id: 'isuzu-mega-roadshow',
    name: 'Isuzu Mega Roadshow 2025',
    items: [
      { id: 'i1', tag: 'Activation', src: '/projects/isuzu-mega-roadshow/img_4282-2.jpg', size: 'tall' },
      { id: 'i2', tag: 'Activation', src: '/projects/isuzu-mega-roadshow/img_4306-2.jpg', size: 'normal' },
      { id: 'i3', tag: 'Activation', src: '/projects/isuzu-mega-roadshow/img_4263-2.jpg', size: 'wide' },
      { id: 'i4', tag: 'Activation', src: '/projects/isuzu-mega-roadshow/img_4258-2.jpg', size: 'tall' },
      { id: 'i5', tag: 'Activation', src: '/projects/isuzu-mega-roadshow/img_4313-2.jpg', size: 'normal' },
      { id: 'i6', tag: 'Activation', src: '/projects/isuzu-mega-roadshow/img_4274-2.jpg', size: 'wide' },
      { id: 'i7', tag: 'Activation', src: '/projects/isuzu-mega-roadshow/img_4290-2.jpg', size: 'tall' },
      { id: 'i8', tag: 'Activation', src: '/projects/isuzu-mega-roadshow/img_4312-2.jpg', size: 'normal' },
      { id: 'i9', tag: 'Activation', src: '/projects/isuzu-mega-roadshow/WhatsApp Image 2026-04-12 at 1.04.00 PM.jpeg', size: 'wide' },
    ]
  },
  {
    id: 'sakura-ferralloys',
    name: 'Sakura Ferralloys Ground Breaking',
    items: [
      { id: 's1', tag: 'Ceremony', src: '/projects/sakura-ferralloys/img_3998.jpg', size: 'wide' },
      { id: 's2', tag: 'Structure', src: '/projects/sakura-ferralloys/img_4006.jpg', size: 'tall' },
      { id: 's3', tag: 'Setup', src: '/projects/sakura-ferralloys/img_4011.jpg', size: 'normal' },
      { id: 's4', tag: 'Ceremony', src: '/projects/sakura-ferralloys/img_3949.jpg', size: 'wide' },
      { id: 's5', tag: 'Ceremony', src: '/projects/sakura-ferralloys/img_4003.jpg', size: 'tall' },
      { id: 's6', tag: 'Setup', src: '/projects/sakura-ferralloys/img_3997.jpg', size: 'normal' },
      { id: 's7', tag: 'Video', src: '/projects/sakura-ferralloys/IMG_3934.MOV', size: 'wide' },
    ]
  },
  {
    id: 'wedding-annual-dinner',
    name: 'Wedding & Annual Dinner',
    items: [
      { id: 'w1',  tag: 'Wedding',       src: '/projects/wedding-annual-dinner/tkwedding_p4-72.jpg',                            size: 'wide' },
      { id: 'w2',  tag: 'Wedding',       src: '/projects/wedding-annual-dinner/TKWedding_P4-75.JPG',                            size: 'tall' },
      { id: 'w3',  tag: 'Wedding',       src: '/projects/wedding-annual-dinner/TKWedding_P4-77.JPG',                            size: 'normal' },
      { id: 'w4',  tag: 'Wedding',       src: '/projects/wedding-annual-dinner/TKWedding_P4-79.JPG',                            size: 'wide' },
      { id: 'w5',  tag: 'Annual Dinner', src: '/projects/wedding-annual-dinner/unnamed.jpg',                                    size: 'tall' },
      { id: 'w6',  tag: 'Annual Dinner', src: '/projects/wedding-annual-dinner/DSC01416.JPEG',                                  size: 'normal' },
      { id: 'w7',  tag: 'Annual Dinner', src: '/projects/wedding-annual-dinner/IMG_1100.JPG',                                   size: 'wide' },
      { id: 'w8',  tag: 'Annual Dinner', src: '/projects/wedding-annual-dinner/IMG_1482.JPG',                                   size: 'tall' },
      { id: 'w9',  tag: 'Event',         src: '/projects/wedding-annual-dinner/01489155-0833-4e6c-82a5-558cb41a97d6.JPG',       size: 'normal' },
      { id: 'w10', tag: 'Event',         src: '/projects/wedding-annual-dinner/0c234c78-dc3a-459b-aee1-7a5cceaf993a.JPG',       size: 'wide' },
      { id: 'w11', tag: 'Event',         src: '/projects/wedding-annual-dinner/2aa7d8013856c53520e5fad619737b28.JPG',            size: 'tall' },
      { id: 'w12', tag: 'Event',         src: '/projects/wedding-annual-dinner/3332616a-4290-4548-8521-5ad5f6360699.JPG',       size: 'normal' },
      { id: 'w13', tag: 'Event',         src: '/projects/wedding-annual-dinner/56d9fe89-c537-474b-9489-9de451a13f31.JPG',       size: 'wide' },
      { id: 'w14', tag: 'Event',         src: '/projects/wedding-annual-dinner/93f7f215-0a1d-4b03-8b25-759d6e7ec32f.JPG',       size: 'tall' },
      { id: 'w15', tag: 'Event',         src: '/projects/wedding-annual-dinner/a2e58c70-5f29-48f8-b8a6-ab80b7efd083.JPG',       size: 'normal' },
      { id: 'w16', tag: 'Event',         src: '/projects/wedding-annual-dinner/f12091cc6ec06585df3bad0baa412f3e.JPG',            size: 'wide' },
    ]
  },
  {
    id: 'bif-bcot',
    name: 'BIF/BCOT Turnaround Village 2025',
    items: [
      { id: 'b1', tag: 'Event', src: '/projects/bif-bcot/0AF92F02-527C-4C21-834E-6A9AFE52E1DE.JPG', size: 'wide' },
      { id: 'b2', tag: 'Event', src: '/projects/bif-bcot/3DD2B4D8-055C-4418-B85B-12D860EA4547.JPG', size: 'tall' },
      { id: 'b3', tag: 'Event', src: '/projects/bif-bcot/5C25E6FC-13F3-4D5E-8728-DEBB5F38D464.JPG', size: 'normal' },
      { id: 'b4', tag: 'Event', src: '/projects/bif-bcot/620E535E-B75F-4DF6-9521-C692B7209B2E.JPG', size: 'wide' },
      { id: 'b5', tag: 'Event', src: '/projects/bif-bcot/7F89FB72-5C1E-468C-A89B-1B4A3EBB51D0.JPG', size: 'tall' },
      { id: 'b6', tag: 'Video', src: '/projects/bif-bcot/8BDCA4B2-784B-4CCA-89F2-906BD3506445.MP4', size: 'normal' },
      { id: 'b7', tag: 'Event', src: '/projects/bif-bcot/C2E3D4B4-1230-44DD-A1BD-BE0B84913096.JPG', size: 'wide' },
      { id: 'b8', tag: 'Event', src: '/projects/bif-bcot/C55318FA-AF56-4862-9CD1-5097392835C2 2.JPG', size: 'tall' },
      { id: 'b9', tag: 'Video', src: '/projects/bif-bcot/IMG_0436.MOV', size: 'normal' },
      { id: 'b10', tag: 'Event', src: '/projects/bif-bcot/IMG_0704.jpg', size: 'wide' },
      { id: 'b11', tag: 'Event', src: '/projects/bif-bcot/IMG_0730 2.JPG', size: 'tall' },
      { id: 'b12', tag: 'Event', src: '/projects/bif-bcot/IMG_0833.JPG', size: 'normal' },
      { id: 'b13', tag: 'Event', src: '/projects/bif-bcot/IMG_0835.JPG', size: 'wide' },
      { id: 'b14', tag: 'Video', src: '/projects/bif-bcot/IMG_0953.MOV', size: 'tall' },
      { id: 'b15', tag: 'Event', src: '/projects/bif-bcot/IMG_1061 2.JPG', size: 'normal' },
      { id: 'b16', tag: 'Video', src: '/projects/bif-bcot/IMG_1062 2.MOV', size: 'wide' },
      { id: 'b17', tag: 'Video', src: '/projects/bif-bcot/IMG_1062.MOV', size: 'tall' },
      { id: 'b18', tag: 'Event', src: '/projects/bif-bcot/IMG_1391.JPG', size: 'normal' },
      { id: 'b19', tag: 'Event', src: '/projects/bif-bcot/IMG_1396.JPG', size: 'wide' },
      { id: 'b20', tag: 'Event', src: '/projects/bif-bcot/IMG_1402.JPG', size: 'tall' },
      { id: 'b21', tag: 'Event', src: '/projects/bif-bcot/IMG_1404.JPG', size: 'normal' },
      { id: 'b22', tag: 'Event', src: '/projects/bif-bcot/IMG_1407 2.JPG', size: 'wide' },
      { id: 'b23', tag: 'Event', src: '/projects/bif-bcot/IMG_1407.JPG', size: 'tall' },
      { id: 'b24', tag: 'Event', src: '/projects/bif-bcot/IMG_1439.JPG', size: 'normal' },
      { id: 'b25', tag: 'Event', src: '/projects/bif-bcot/IMG_1443.JPG', size: 'wide' },
      { id: 'b26', tag: 'Video', src: '/projects/bif-bcot/IMG_1447.mov', size: 'tall' },
      { id: 'b27', tag: 'Event', src: '/projects/bif-bcot/IMG_2155 2.JPG', size: 'normal' },
      { id: 'b28', tag: 'Event', src: '/projects/bif-bcot/IMG_2182.JPG', size: 'wide' },
      { id: 'b29', tag: 'Event', src: '/projects/bif-bcot/IMG_2184.JPG', size: 'tall' },
      { id: 'b30', tag: 'Event', src: '/projects/bif-bcot/IMG_2327.JPG', size: 'normal' },
      { id: 'b31', tag: 'Event', src: '/projects/bif-bcot/IMG_2328.JPG', size: 'wide' },
      { id: 'b32', tag: 'Event', src: '/projects/bif-bcot/IMG_2335.JPG', size: 'tall' },
      { id: 'b33', tag: 'Event', src: '/projects/bif-bcot/IMG_2338.JPG', size: 'normal' },
      { id: 'b34', tag: 'Event', src: '/projects/bif-bcot/IMG_2339.JPG', size: 'wide' },
      { id: 'b35', tag: 'Event', src: '/projects/bif-bcot/IMG_2340.JPG', size: 'tall' },
      { id: 'b36', tag: 'Event', src: '/projects/bif-bcot/IMG_2342.JPG', size: 'normal' },
      { id: 'b37', tag: 'Event', src: '/projects/bif-bcot/IMG_2347.JPG', size: 'wide' },
      { id: 'b38', tag: 'Event', src: '/projects/bif-bcot/IMG_2353.JPG', size: 'tall' },
      { id: 'b39', tag: 'Event', src: '/projects/bif-bcot/IMG_3918 2.JPG', size: 'normal' },
      { id: 'b40', tag: 'Event', src: '/projects/bif-bcot/IMG_3918.JPG', size: 'wide' },
      { id: 'b41', tag: 'Video', src: '/projects/bif-bcot/IMG_3924.MOV', size: 'tall' },
      { id: 'b42', tag: 'Video', src: '/projects/bif-bcot/IMG_3925.MOV', size: 'normal' },
      { id: 'b43', tag: 'Video', src: '/projects/bif-bcot/IMG_3926.MOV', size: 'wide' },
      { id: 'b44', tag: 'Video', src: '/projects/bif-bcot/IMG_3927.MOV', size: 'tall' },
      { id: 'b45', tag: 'Event', src: '/projects/bif-bcot/fc0949d7-f6ed-4fde-847d-1d4bc5a13884.JPG', size: 'normal' }
    ]
  },
  {
    id: 'traffic-game',
    name: 'Traffic Game 2025',
    items: [
      { id: 't1', tag: 'Activation', src: '/projects/traffic-game/581811683_1388918333244676_7664203200529167992_n.jpg', size: 'wide' },
      { id: 't2', tag: 'Activation', src: '/projects/traffic-game/582554008_1388918346578008_6998829879180142040_n.jpg', size: 'tall' },
      { id: 't3', tag: 'Activation', src: '/projects/traffic-game/583737698_1375055787963389_4407051469548078496_n.jpg', size: 'normal' },
      { id: 't4', tag: 'Activation', src: '/projects/traffic-game/584721713_1375054944630140_6761082482398155776_n.jpg', size: 'wide' },
      { id: 't5', tag: 'Activation', src: '/projects/traffic-game/583799810_1375084601293841_1669587957117965103_n.jpg', size: 'tall' },
      { id: 't6', tag: 'Activation', src: '/projects/traffic-game/584305898_1375054857963482_732061316833505127_n.jpg', size: 'normal' },
      { id: 't7', tag: 'Activation', src: '/projects/traffic-game/582473709_1375056061296695_5142125461435085132_n.jpg', size: 'wide' },
      { id: 't8', tag: 'Activation', src: '/projects/traffic-game/583264126_1375055847963383_2672852954096988043_n.jpg', size: 'tall' },
      { id: 't9', tag: 'Activation', src: '/projects/traffic-game/583610918_1375055907963377_5018647555033455712_n.jpg', size: 'normal' },
      { id: 't10', tag: 'Activation', src: '/projects/traffic-game/583839511_1375055197963448_5887674135412951933_n.jpg', size: 'wide' },
      { id: 't11', tag: 'Activation', src: '/projects/traffic-game/585286965_1375084281293873_3879138848518003013_n.jpg', size: 'tall' },
      { id: 't12', tag: 'Activation', src: '/projects/traffic-game/584300962_1375055651296736_2847499902045087735_n.jpg', size: 'normal' },
    ]
  },
  {
    id: 'petronas-langkawi',
    name: 'Petronas Langkawi Le Tour De 2025',
    items: [
      { id: 'l1', tag: 'Motorsport', src: '/projects/petronas-langkawi/01-8.webp', size: 'wide' },
      { id: 'l2', tag: 'Motorsport', src: '/projects/petronas-langkawi/02-10.webp', size: 'tall' },
      { id: 'l3', tag: 'Motorsport', src: '/projects/petronas-langkawi/08-5.webp', size: 'normal' },
      { id: 'l4', tag: 'Motorsport', src: '/projects/petronas-langkawi/10-6.webp', size: 'wide' },
      { id: 'l5', tag: 'Motorsport', src: '/projects/petronas-langkawi/21-5.webp', size: 'tall' },
      { id: 'l6', tag: 'Motorsport', src: '/projects/petronas-langkawi/26-5.webp', size: 'normal' },
    ]
  },
  {
    id: 'midea-malaysia-launch',
    name: 'Midea Malaysia 18Outlets Launching Ceremony',
    items: [
      { id: 'm1', tag: 'Live Stream', src: 'https://youtu.be/yEjsN9evB7k', size: 'full' },
      { id: 'm2', tag: 'Event', src: '/projects/MIDEA 2025 18 Outlet Launching/Live 1.jpg', size: 'wide' },
      { id: 'm3', tag: 'Event', src: '/projects/MIDEA 2025 18 Outlet Launching/live 2.jpg', size: 'normal' }
    ]
  }
];

const services = [
  {
    icon: '📋',
    title: 'Professional Event Planning',
    subtitle: 'Full-Cycle Strategy & Production',
    description:
      'From concept development to on-ground execution, we architect every detail — logistics, vendor coordination, timeline management, and post-event reporting.',
    accent: '#0056B3',
    glowColor: 'rgba(0, 86, 179, 0.25)',
  },
  {
    icon: '🔊',
    title: 'High-End Equipment Supply',
    subtitle: 'Audio · LED · Lighting · 3D Visuals',
    description:
      'State-of-the-art line-array sound systems, P2.6 LED walls, intelligent moving heads, haze machines, and full 3D visual design — all owned and operated by our crew.',
    accent: '#0077CC',
    glowColor: 'rgba(0, 119, 204, 0.25)',
  },
  {
    icon: '🏟️',
    title: 'ZTO Arena Tech',
    subtitle: 'Proprietary Real-Time Tournament OS',
    description:
      'Our in-house built tournament management system powers live scoring, multi-screen broadcasting, registration automation, and referee consoles across all venues.',
    accent: '#0099FF',
    glowColor: 'rgba(0, 153, 255, 0.25)',
  },
];

const stats = [
  { value: '150+', label: 'Events Produced' },
  { value: '8+', label: 'Years in Sarawak' },
  { value: 'MW-Class', label: 'Sound Capability' },
  { value: '24/7', label: 'On-Ground Support' },
];

// ---------------------------------------------------------------------------
// Scroll Animation Hook
// ---------------------------------------------------------------------------
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

// ---------------------------------------------------------------------------
// Section Wrapper with Reveal Animation
// ---------------------------------------------------------------------------
function RevealSection({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Nav
// ---------------------------------------------------------------------------
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);


  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .nav-links { display: none !important; }
          .nav-hamburger { display: flex !important; }
          #main-nav { padding: 14px 20px !important; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          #main-nav { padding: 14px 28px !important; }
          .nav-links { gap: 20px !important; }
          .nav-links a { font-size: 12px !important; }
        }
        .mobile-menu-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(5,5,5,0.97);
          backdrop-filter: blur(20px);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 40px;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* Mobile overlay menu */}
      {menuOpen && (
        <div className="mobile-menu-overlay">
          <button
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'absolute', top: 20, right: 20,
              background: 'none', border: 'none', color: '#fff',
              fontSize: 24, cursor: 'pointer', padding: 8,
            }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <img
              src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
              alt="ZTO Logo"
              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(0,86,179,0.4)' }}
            />
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 20, color: '#fff' }}>
              Zero To One <span style={{ color: '#0056B3' }}>Event</span>
            </span>
          </div>
          {[
            { label: 'Identity', href: '#identity' },
            { label: 'Memories', href: '#memories' },
            { label: 'Services', href: '#services' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              style={{
                color: 'rgba(229,229,229,0.85)',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: 22,
                textDecoration: 'none',
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
            >
              {item.label}
            </a>
          ))}
          <a
            href="/public/enquiry"
            onClick={() => setMenuOpen(false)}
            style={{
              marginTop: 8,
              background: 'linear-gradient(135deg, #0056B3, #0077CC)',
              color: '#fff',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: 16,
              padding: '14px 36px',
              borderRadius: 10,
              textDecoration: 'none',
              boxShadow: '0 0 30px rgba(0,86,179,0.5)',
            }}
          >
            Start a Project
          </a>
          <Link
            href="/auth"
            onClick={() => setMenuOpen(false)}
            style={{
              marginTop: 0,
              color: 'rgba(229,229,229,0.5)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: 14,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <i className="fa-solid fa-terminal" />
            Staff Login
          </Link>
        </div>
      )}

      <nav
        id="main-nav"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '16px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.4s ease',
          background: scrolled ? 'rgba(5, 5, 5, 0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(24px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(0, 86, 179, 0.2)' : '1px solid transparent',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(0,86,179,0.4)', flexShrink: 0 }}>
            <img
              src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
              alt="ZTO Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 17, color: '#fff', letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>
            Zero To One <span style={{ color: '#0056B3' }}>Event</span>
          </span>
        </div>

        {/* Desktop Nav Links */}
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          {[
            { label: 'Identity', href: '#identity' },
            { label: 'Memories', href: '#memories' },
            { label: 'Services', href: '#services' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              id={`nav-link-${item.label.toLowerCase()}`}
              style={{ color: 'rgba(229,229,229,0.7)', fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 13, textDecoration: 'none', letterSpacing: '0.5px', textTransform: 'uppercase', transition: 'color 0.2s', whiteSpace: 'nowrap' }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#fff')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'rgba(229,229,229,0.7)')}
            >
              {item.label}
            </a>
          ))}
          <a
            id="nav-cta-start-project"
            href="/public/enquiry"
            style={{ background: 'linear-gradient(135deg, #0056B3, #0077CC)', color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, padding: '9px 20px', borderRadius: 8, textDecoration: 'none', whiteSpace: 'nowrap', boxShadow: '0 0 20px rgba(0,86,179,0.35)', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseEnter={(e) => { (e.currentTarget.style.boxShadow = '0 0 35px rgba(0,86,179,0.6)'); (e.currentTarget.style.transform = 'translateY(-1px)'); }}
            onMouseLeave={(e) => { (e.currentTarget.style.boxShadow = '0 0 20px rgba(0,86,179,0.35)'); (e.currentTarget.style.transform = 'translateY(0)'); }}
          >
            Start a Project
          </a>

          {/* Staff Login — direct link */}
          <Link
            href="/auth"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(229,229,229,0.8)',
              width: 36,
              height: 36,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              textDecoration: 'none',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0,86,179,0.2)';
              e.currentTarget.style.borderColor = 'rgba(0,86,179,0.5)';
              e.currentTarget.style.color = '#6BB8FF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = 'rgba(229,229,229,0.8)';
            }}
            title="Staff Login"
          >
            <i className="fa-solid fa-terminal" style={{ fontSize: 13 }} />
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen(true)}
          style={{ display: 'none', background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', padding: '8px 12px', cursor: 'pointer', fontSize: 16, alignItems: 'center', justifyContent: 'center' }}
        >
          <i className="fa-solid fa-bars" />
        </button>
      </nav>
    </>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------
function HeroVideo() {
  const [currentClip, setCurrentClip] = useState(0);
  const clips = [
    "/assets/video/hero-corporate.mp4/clip_1_202604251238.mp4",
    "/assets/video/hero-corporate.mp4/clip_2_202604251238.mp4",
    "/assets/video/hero-corporate.mp4/clip_3_202604251238.mp4",
    "/assets/video/hero-corporate.mp4/clip_4_202604251238.mp4",
    "/assets/video/hero-corporate.mp4/clip_5_202604251238.mp4",
    "/assets/video/hero-corporate.mp4/clip_6_202604251238.mp4"
  ];

  return (
    <video
      key={currentClip}
      src={clips[currentClip]}
      autoPlay
      muted
      playsInline
      onEnded={() => setCurrentClip((prev) => (prev + 1) % clips.length)}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        zIndex: -1,
      }}
    />
  );
}

function Hero() {
  return (
    <section
      id="hero"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#050505',
      }}
    >
      {/* Video BG */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
        }}
      >
        <HeroVideo />
        {/* Gradient overlay on top of video */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.4))',
          }}
        />
        {/* Blue radial glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            background:
              'radial-gradient(ellipse 80% 60% at 50% 60%, rgba(0,86,179,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        {/* Grid lines atmosphere */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            backgroundImage:
              'linear-gradient(rgba(0,86,179,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,86,179,0.04) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          padding: '0 24px',
          maxWidth: 900,
        }}
      >
        <style>{`
          @media (max-width: 767px) {
            .hero-headline { font-size: 32px !important; letter-spacing: -1px !important; }
            .hero-sub { font-size: 14px !important; }
          }
          @media (min-width: 768px) and (max-width: 1023px) {
            .hero-headline { font-size: clamp(30px, 4.5vw, 52px) !important; letter-spacing: -1.5px !important; }
          }
        `}</style>

        {/* Headline */}
        <h1
          className="hero-headline"
          style={{
            fontFamily: "'Urbanist', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(32px, 4.5vw, 62px)',
            lineHeight: 1.12,
            color: '#FFFFFF',
            letterSpacing: '-2px',
            marginBottom: 20,
            textTransform: 'uppercase',
          }}
        >
          EMPOWERING EVENTS ACROSS SARAWAK
        </h1>

        {/* Sub-headline */}
        <p
          className="hero-sub"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: 'clamp(14px, 1.6vw, 17px)',
            lineHeight: 1.75,
            color: 'rgba(229,229,229,0.65)',
            maxWidth: 580,
            margin: '0 auto 44px',
          }}
        >
          From Bintulu to the whole of Sarawak — we engineer experiences
          with state-of-the-art equipment and the{' '}
          <span style={{ color: '#6BB8FF', fontWeight: 500 }}>ZTO Arena OS</span>.
        </p>

        {/* CTAs */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <a
            id="hero-cta-consult"
            href="/public/enquiry"
            style={{
              background: 'linear-gradient(135deg, #0056B3, #0077CC)',
              color: '#fff',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: 15,
              padding: '16px 36px',
              borderRadius: 10,
              textDecoration: 'none',
              letterSpacing: '0.2px',
              boxShadow:
                '0 0 40px rgba(0,86,179,0.45), 0 4px 20px rgba(0,0,0,0.4)',
              transition: 'all 0.25s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform =
                'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.boxShadow =
                '0 0 60px rgba(0,86,179,0.65), 0 8px 30px rgba(0,0,0,0.5)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow =
                '0 0 40px rgba(0,86,179,0.45), 0 4px 20px rgba(0,0,0,0.4)';
            }}
          >
            <i className="fa-solid fa-paper-plane" style={{ fontSize: 13 }} />
            Start a Consultation
          </a>
          <a
            id="hero-cta-projects"
            href="#memories"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#E5E5E5',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: 15,
              padding: '16px 36px',
              borderRadius: 10,
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(12px)',
              transition: 'all 0.25s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                'rgba(255,255,255,0.1)';
              (e.currentTarget as HTMLElement).style.borderColor =
                'rgba(255,255,255,0.25)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                'rgba(255,255,255,0.05)';
              (e.currentTarget as HTMLElement).style.borderColor =
                'rgba(255,255,255,0.12)';
            }}
          >
            <i className="fa-solid fa-images" style={{ fontSize: 13 }} />
            View Our Work
          </a>
        </div>

        {/* Scroll indicator */}
        <div
          style={{
            marginTop: 80,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            opacity: 0.4,
          }}
        >
          <div
            style={{
              width: 1,
              height: 50,
              background:
                'linear-gradient(to bottom, transparent, rgba(0,86,179,0.8))',
              animation: 'scroll-line 2s ease-in-out infinite',
            }}
          />
          <span
            style={{
              color: '#6BB8FF',
              fontSize: 10,
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            Scroll
          </span>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Stats Bar
// ---------------------------------------------------------------------------
function StatsBar() {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      style={{
        background: 'rgba(0,86,179,0.06)',
        borderTop: '1px solid rgba(0,86,179,0.15)',
        borderBottom: '1px solid rgba(0,86,179,0.15)',
        padding: '32px 48px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 24,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
      }}
    >
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          style={{
            textAlign: 'center',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: `opacity 0.6s ease ${i * 100}ms, transform 0.6s ease ${i * 100}ms`,
          }}
        >
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 800,
              fontSize: 32,
              color: '#FFFFFF',
              letterSpacing: '-1px',
              background: 'linear-gradient(90deg, #FFFFFF, #6BB8FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {stat.value}
          </div>
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: 12,
              color: 'rgba(229,229,229,0.45)',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              marginTop: 4,
            }}
          >
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Identity Section
// ---------------------------------------------------------------------------
function IdentitySection() {
  return (
    <section
      id="identity"
      style={{
        padding: 'clamp(80px, 10vw, 140px) clamp(24px, 8vw, 120px)',
        maxWidth: 1280,
        margin: '0 auto',
      }}
    >
      <RevealSection>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 80,
            alignItems: 'center',
          }}
          className="identity-grid"
        >
          {/* Left */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(0,86,179,0.1)',
                border: '1px solid rgba(0,86,179,0.25)',
                borderRadius: 100,
                padding: '6px 16px',
                marginBottom: 24,
              }}
            >
              <span
                style={{
                  color: '#6BB8FF',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: 11,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                }}
              >
                Our Identity
              </span>
            </div>

            <h2
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 800,
                fontSize: 'clamp(28px, 4vw, 50px)',
                color: '#FFFFFF',
                lineHeight: 1.15,
                letterSpacing: '-1.5px',
                marginBottom: 24,
              }}
            >
              <span style={{ color: 'rgba(229,229,229,0.6)', fontWeight: 400, fontSize: '0.65em', letterSpacing: '-0.5px' }}>
                Sarawak&apos;s Trusted
              </span>
              <br />
              Event & Equipment Experts
            </h2>

            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 16,
                lineHeight: 1.8,
                color: 'rgba(229,229,229,0.55)',
                marginBottom: 32,
              }}
            >
              Headquartered in{' '}
              <span style={{ color: '#E5E5E5', fontWeight: 600 }}>
                Bintulu, Sarawak
              </span>
              , ZTO operates as the state&apos;s most technically capable
              event production company — servicing clients from Miri to Kuching
              with unmatched on-ground execution.
            </p>

            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 15,
                lineHeight: 1.8,
                color: 'rgba(229,229,229,0.45)',
                marginBottom: 40,
              }}
            >
              When international agencies partner with a Sarawak-based
              production house, they choose ZTO. Because we don&apos;t just{' '}
              <em>rent equipment</em> — we deliver a complete technical
              production operation backed by our proprietary Arena OS.
            </p>

            <a
              id="identity-cta-consult"
              href="/public/enquiry"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                color: '#6BB8FF',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
                borderBottom: '1px solid rgba(107,184,255,0.3)',
                paddingBottom: 2,
                transition: 'color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#fff';
                (e.currentTarget as HTMLElement).style.borderColor =
                  'rgba(255,255,255,0.6)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#6BB8FF';
                (e.currentTarget as HTMLElement).style.borderColor =
                  'rgba(107,184,255,0.3)';
              }}
            >
              Discuss Your Event
              <i
                className="fa-solid fa-arrow-right"
                style={{ fontSize: 12 }}
              />
            </a>
          </div>

          {/* Right — feature pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              {
                icon: 'fa-location-dot',
                label: 'Bintulu HQ',
                desc: 'Total coverage across all of Sarawak',
              },
              {
                icon: 'fa-truck-fast',
                label: 'Rapid Deployment',
                desc: 'Our equipment and crew reach any venue in Sarawak within 24 hours',
              },
              {
                icon: 'fa-shield-halved',
                label: 'Production Guarantee',
                desc: 'Redundant systems and backup equipment on every major event',
              },
              {
                icon: 'fa-microchip',
                label: 'Proprietary Technology',
                desc: 'ZTO Arena OS — the only locally-built tournament management system in Sarawak',
              },
              {
                icon: 'fa-people-group',
                label: 'The ZTO Crew',
                desc: 'Trained sound engineers, lighting techs, and event managers — all in-house',
              },
            ].map((feat, i) => (
              <div
                key={feat.label}
                id={`identity-feature-${i}`}
                style={{
                  display: 'flex',
                  gap: 16,
                  padding: '20px 24px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 14,
                  backdropFilter: 'blur(10px)',
                  transition: 'border-color 0.3s, background 0.3s',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    'rgba(0,86,179,0.4)';
                  (e.currentTarget as HTMLElement).style.background =
                    'rgba(0,86,179,0.06)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    'rgba(255,255,255,0.07)';
                  (e.currentTarget as HTMLElement).style.background =
                    'rgba(255,255,255,0.03)';
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(0,86,179,0.15)',
                    border: '1px solid rgba(0,86,179,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <i
                    className={`fa-solid ${feat.icon}`}
                    style={{ color: '#6BB8FF', fontSize: 15 }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 700,
                      fontSize: 14,
                      color: '#E5E5E5',
                      marginBottom: 4,
                    }}
                  >
                    {feat.label}
                  </div>
                  <div
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 13,
                      color: 'rgba(229,229,229,0.45)',
                      lineHeight: 1.5,
                    }}
                  >
                    {feat.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Project Memories — Categorized Grid With Tabs
// ---------------------------------------------------------------------------
function MemoirsSection() {
  const [activeTab, setActiveTab] = useState(projectCategories[0].id);
  const activeProjects = projectCategories.find(c => c.id === activeTab)?.items || [];

  return (
    <section
      id="memories"
      style={{
        padding: 'clamp(80px, 10vw, 120px) clamp(24px, 5vw, 80px)',
        background: 'rgba(0,86,179,0.03)',
        borderTop: '1px solid rgba(0,86,179,0.1)',
        borderBottom: '1px solid rgba(0,86,179,0.1)',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Header */}
        <RevealSection>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(0,86,179,0.1)',
                border: '1px solid rgba(0,86,179,0.25)',
                borderRadius: 100,
                padding: '6px 16px',
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  color: '#6BB8FF',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: 11,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                }}
              >
                Project Memories
              </span>
            </div>
            <h2
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 800,
                fontSize: 'clamp(28px, 4.5vw, 56px)',
                color: '#FFFFFF',
                letterSpacing: '-2px',
                marginBottom: 16,
              }}
            >
              Evidence of Excellence
            </h2>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 16,
                color: 'rgba(229,229,229,0.45)',
                maxWidth: 540,
                margin: '0 auto',
                lineHeight: 1.7,
              }}
            >
              A curated archive of large-scale, high-tech productions. Organized by category to showcase our diverse capability.
            </p>
          </div>
        </RevealSection>

        {/* Category Tabs */}
        <RevealSection delay={100}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
            {projectCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                style={{
                  padding: '10px 24px',
                  borderRadius: 100,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: activeTab === cat.id ? '#0056B3' : 'rgba(255,255,255,0.05)',
                  color: activeTab === cat.id ? '#FFFFFF' : 'rgba(229,229,229,0.6)',
                  border: activeTab === cat.id ? '1px solid #0077CC' : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: activeTab === cat.id ? '0 0 20px rgba(0,86,179,0.4)' : 'none',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== cat.id) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)';
                    (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== cat.id) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                    (e.currentTarget as HTMLElement).style.color = 'rgba(229,229,229,0.6)';
                  }
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </RevealSection>

        {/* Masonry Grid */}
        <RevealSection delay={200}>
          <div
            id="memoirs-grid"
            style={{
              columns: activeProjects.length === 1 ? '1' : '3 300px',
              columnGap: 16,
              minHeight: activeProjects.length === 1 ? 0 : 400,
            }}
          >
            {activeProjects.map((project, i) => (
              <div
                key={`${activeTab}-${project.id}`} // Force re-mount on tab switch for animation
                id={`memoir-card-${project.id}`}
                style={{
                  breakInside: 'avoid',
                  columnSpan: project.size === 'full' ? 'all' : 'none',
                  WebkitColumnSpan: project.size === 'full' ? 'all' : 'none',
                  marginBottom: 16,
                  position: 'relative',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.07)',
                  cursor: 'pointer',
                  display: 'block',
                  animation: `fadeInUp 0.6s ease ${i * 0.1}s both`,
                }}
                className="memoir-card"
              >
                <div
                  style={{
                    aspectRatio:
                      project.size === 'full'
                        ? '21/9'
                        : project.size === 'tall'
                        ? '4/5'
                        : project.size === 'wide'
                        ? '16/9'
                        : '1/1',
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  {project.src.includes('youtube.com') || project.src.includes('youtu.be') ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${project.src.split('/').pop()?.split('?')[0]}?autoplay=1&mute=1&loop=1&playlist=${project.src.split('/').pop()?.split('?')[0]}&controls=1`}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        pointerEvents: 'auto'
                      }}
                      allow="autoplay; encrypted-media"
                      title={project.tag}
                    />
                  ) : project.src.toLowerCase().match(/\.(mp4|mov|webm)$/) ? (
                    <video
                      src={project.src}
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        transition: 'transform 0.6s ease',
                      }}
                      className="memoir-img"
                    />
                  ) : (
                    <img
                      src={project.src}
                      alt={project.tag}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        transition: 'transform 0.6s ease',
                      }}
                      className="memoir-img"
                    />
                  )}

                  {/* Hover overlay */}
                  <div
                    className="memoir-overlay"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(to top, rgba(5,5,5,0.92) 0%, rgba(5,5,5,0.2) 60%, transparent 100%)',
                      opacity: 0,
                      transition: 'opacity 0.4s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      padding: '24px 20px',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'rgba(0,86,179,0.3)',
                        border: '1px solid rgba(0,86,179,0.4)',
                        borderRadius: 100,
                        padding: '4px 12px',
                        marginBottom: 10,
                        width: 'fit-content',
                      }}
                    >
                      <span
                        style={{
                          color: '#6BB8FF',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 600,
                          fontSize: 10,
                          letterSpacing: '1px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {project.tag}
                      </span>
                    </div>
                    <h3
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 700,
                        fontSize: 15,
                        color: '#FFFFFF',
                        margin: 0,
                        letterSpacing: '-0.3px',
                        lineHeight: 1.3,
                      }}
                    >
                      {project.tag}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Core Services
// ---------------------------------------------------------------------------
function ServicesSection() {
  return (
    <section
      id="services"
      style={{
        padding: 'clamp(80px, 10vw, 140px) clamp(24px, 8vw, 120px)',
        maxWidth: 1280,
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <RevealSection>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(0,86,179,0.1)',
              border: '1px solid rgba(0,86,179,0.25)',
              borderRadius: 100,
              padding: '6px 16px',
              marginBottom: 20,
            }}
          >
            <span
              style={{
                color: '#6BB8FF',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: 11,
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
            >
              Core Services
            </span>
          </div>
          <h2
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(28px, 4.5vw, 56px)',
              color: '#FFFFFF',
              letterSpacing: '-2px',
              marginBottom: 16,
            }}
          >
            What We Engineer
          </h2>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 16,
              color: 'rgba(229,229,229,0.45)',
              maxWidth: 520,
              margin: '0 auto',
              lineHeight: 1.7,
            }}
          >
            Three pillars of capability. One team. Zero compromise.
          </p>
        </div>
      </RevealSection>

      {/* Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
        }}
      >
        {services.map((svc, i) => (
          <RevealSection key={svc.title} delay={i * 120}>
            <div
              id={`service-card-${i}`}
              style={{
                padding: '40px 36px',
                borderRadius: 20,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px)',
                position: 'relative',
                overflow: 'hidden',
                transition:
                  'border-color 0.4s ease, box-shadow 0.4s ease, transform 0.3s ease',
                height: '100%',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = 'rgba(0,86,179,0.45)';
                el.style.boxShadow = `0 0 60px ${svc.glowColor}, 0 20px 60px rgba(0,0,0,0.4)`;
                el.style.transform = 'translateY(-6px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = 'rgba(255,255,255,0.08)';
                el.style.boxShadow = 'none';
                el.style.transform = 'translateY(0)';
              }}
            >
              {/* Corner glow */}
              <div
                style={{
                  position: 'absolute',
                  top: -40,
                  right: -40,
                  width: 140,
                  height: 140,
                  borderRadius: '50%',
                  background: svc.glowColor,
                  filter: 'blur(40px)',
                  pointerEvents: 'none',
                }}
              />

              {/* Icon */}
              <div
                style={{
                  fontSize: 36,
                  marginBottom: 24,
                  display: 'block',
                }}
              >
                {svc.icon}
              </div>

              {/* Subtitle */}
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                  fontSize: 11,
                  color: '#6BB8FF',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                {svc.subtitle}
              </div>

              {/* Title */}
              <h3
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: 22,
                  color: '#FFFFFF',
                  letterSpacing: '-0.5px',
                  marginBottom: 16,
                  lineHeight: 1.2,
                }}
              >
                {svc.title}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 14,
                  lineHeight: 1.8,
                  color: 'rgba(229,229,229,0.5)',
                }}
              >
                {svc.description}
              </p>

              {/* Bottom accent line */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: `linear-gradient(90deg, transparent, ${svc.accent}, transparent)`,
                  opacity: 0.5,
                }}
              />
            </div>
          </RevealSection>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Equipment Rental & Supply
// ---------------------------------------------------------------------------
function EquipmentSection() {
  return (
    <section
      id="equipment"
      style={{
        padding: 'clamp(80px, 10vw, 140px) clamp(24px, 8vw, 120px)',
        maxWidth: 1280,
        margin: '0 auto',
      }}
    >
      <RevealSection>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(0,86,179,0.1)',
              border: '1px solid rgba(0,86,179,0.25)',
              borderRadius: 100,
              padding: '6px 16px',
              marginBottom: 20,
            }}
          >
            <span
              style={{
                color: '#6BB8FF',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: 11,
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
            >
              Our Inventory
            </span>
          </div>
          <h2
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(28px, 4.5vw, 56px)',
              color: '#FFFFFF',
              letterSpacing: '-2px',
              marginBottom: 16,
            }}
          >
            Equipment Rental & Supply
          </h2>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 16,
              color: 'rgba(229,229,229,0.45)',
              maxWidth: 600,
              margin: '0 auto',
              lineHeight: 1.7,
            }}
          >
            High-performance gear for high-stakes events. From massive LED walls to concert-grade audio, we supply the best hardware in Sarawak.
          </p>
        </div>
      </RevealSection>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
        }}
      >
        {equipmentData.map((item, i) => (
          <RevealSection key={item.id} delay={i * 100}>
            <div
              className="equipment-card"
              style={{
                background: '#050505',
                border: '1px solid #0056B3',
                borderRadius: 20,
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                transition: 'all 0.3s ease',
              }}
            >
              {/* Image Container with Zoom */}
              <div
                style={{
                  height: 220,
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.02)',
                  borderBottom: '1px solid rgba(0,86,179,0.3)',
                }}
              >
                {/* Fallback pattern if image is broken/missing since we just created JSON */}
                <div style={{
                     position: 'absolute', inset: 0,
                     backgroundImage: 'linear-gradient(rgba(0,86,179,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,86,179,0.05) 1px, transparent 1px)',
                     backgroundSize: '20px 20px', zIndex: 0
                }} />
                
                {item.image_path.toLowerCase().match(/\.(mp4|mov|webm)$/) ? (
                  <video
                    src={encodeURI(item.image_path)}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="equip-img"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      position: 'relative',
                      zIndex: 1,
                      transition: 'transform 0.5s ease',
                    }}
                  />
                ) : (
                  <img
                    src={encodeURI(item.image_path)}
                    alt={item.name}
                    className="equip-img"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      position: 'relative',
                      zIndex: 1,
                      transition: 'transform 0.5s ease',
                    }}
                    onError={(e) => {
                       (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div
                  style={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    zIndex: 2,
                    background: 'rgba(0,86,179,0.8)',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  {item.category}
                </div>
              </div>

              {/* Specs Container */}
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: 18,
                    color: '#FFFFFF',
                    marginBottom: 12,
                    lineHeight: 1.3,
                  }}
                >
                  {item.name}
                </h3>
                <p
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 13,
                    color: 'rgba(229,229,229,0.5)',
                    lineHeight: 1.6,
                    marginBottom: 24,
                    flex: 1,
                  }}
                >
                  {item.specifications}
                </p>

                <a
                  href="/public/enquiry"
                  className="equip-cta"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    background: 'rgba(0,86,179,0.1)',
                    border: '1px solid rgba(0,86,179,0.4)',
                    color: '#6BB8FF',
                    padding: '12px',
                    borderRadius: 8,
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: 13,
                    textDecoration: 'none',
                    transition: 'all 0.25s',
                  }}
                >
                  Consult Details / 咨询详情
                  <i className="fa-solid fa-arrow-right" style={{ fontSize: 11 }} />
                </a>
              </div>
            </div>
          </RevealSection>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// CTA Band
// ---------------------------------------------------------------------------
function CTABand() {
  return (
    <RevealSection>
      <div
        style={{
          margin: '0 clamp(24px, 5vw, 80px) 120px',
          padding: 'clamp(48px, 6vw, 80px) clamp(32px, 6vw, 80px)',
          borderRadius: 24,
          background:
            'linear-gradient(135deg, rgba(0,56,113,0.6) 0%, rgba(0,86,179,0.3) 50%, rgba(0,30,60,0.6) 100%)',
          border: '1px solid rgba(0,86,179,0.3)',
          backdropFilter: 'blur(20px)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* bg glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 70% 80% at 50% -20%, rgba(0,86,179,0.2) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(24px, 4vw, 48px)',
              color: '#FFFFFF',
              letterSpacing: '-1.5px',
              marginBottom: 16,
            }}
          >
            Ready to Build Something Unforgettable?
          </h2>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 16,
              color: 'rgba(229,229,229,0.55)',
              marginBottom: 40,
              maxWidth: 480,
              margin: '0 auto 40px',
              lineHeight: 1.7,
            }}
          >
            Talk to our team. We&apos;ll scope your event, match the right
            equipment, and give you a production plan within 48 hours.
          </p>
          <a
            id="band-cta-consult"
            href="/public/enquiry"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: '#FFFFFF',
              color: '#050505',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontSize: 15,
              padding: '16px 40px',
              borderRadius: 10,
              textDecoration: 'none',
              letterSpacing: '-0.2px',
              boxShadow: '0 4px 30px rgba(0,0,0,0.4)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform =
                'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.boxShadow =
                '0 8px 40px rgba(0,0,0,0.5)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow =
                '0 4px 30px rgba(0,0,0,0.4)';
            }}
          >
            <i className="fa-solid fa-bolt" style={{ fontSize: 13 }} />
            Let&apos;s Make It Happen
          </a>
        </div>
      </div>
    </RevealSection>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
function Footer() {
  return (
    <footer
      id="footer"
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: 'clamp(40px, 5vw, 60px) clamp(24px, 8vw, 120px)',
        background: '#050505',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 24,
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 7,
              overflow: 'hidden',
              border: '1px solid rgba(0,86,179,0.3)',
              flexShrink: 0,
            }}
          >
            <img
              src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
              alt="ZTO Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div>
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: 14,
                color: '#E5E5E5',
              }}
            >
              ZTO Event OS
            </div>
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                color: 'rgba(229,229,229,0.35)',
                letterSpacing: '0.5px',
              }}
            >
              Bintulu, Sarawak · Since 2018
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 12,
            color: 'rgba(229,229,229,0.25)',
          }}
        >
          © {new Date().getFullYear()} ZTO. All rights reserved.
        </div>

        {/* Staff Login — moved to nav */}
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------
export default function Home() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#050505',
        color: '#E5E5E5',
        overflowX: 'hidden',
      }}
    >
      <Nav />
      <Hero />
      <StatsBar />
      <IdentitySection />
      <MemoirsSection />
      <EquipmentSection />
      <ServicesSection />
      <CTABand />
      <Footer />

      {/* Memoir card hover CSS injected inline */}
      <style>{`
        .memoir-card:hover .memoir-img {
          transform: scale(1.08);
        }
        .memoir-card:hover .memoir-overlay {
          opacity: 1 !important;
        }
        .memoir-card:hover {
          border-color: rgba(0, 86, 179, 0.4) !important;
        }
        
        /* Equipment Cards Hover Logic */
        .equipment-card:hover {
          box-shadow: 0 0 40px rgba(0,86,179,0.35);
          transform: translateY(-4px);
        }
        .equipment-card:hover .equip-img {
          transform: scale(1.05); /* Smoothly zoom 5% */
        }
        .equipment-card:hover .equip-cta {
          background: #0056B3 !important;
          color: #fff !important;
        }

        @media (max-width: 768px) {
          #memoirs-grid {
            columns: 2 160px !important;
          }
          .identity-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
        @media (max-width: 480px) {
          #memoirs-grid {
            columns: 1 !important;
          }
          nav > div:last-child a[href="/public/consulting"] {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
