'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const projectCategories = [
  {
    id: 'isuzu-mega-roadshow',
    name: 'Isuzu Mega Roadshow 2025',
    items: [
      { id: 'i1', tag: 'Activation', src: '/projects/Isuzu Mega Roadshow 2025/IMG_4282 2.JPG', size: 'tall' },
      { id: 'i2', tag: 'Activation', src: '/projects/Isuzu Mega Roadshow 2025/IMG_4306 2.JPG', size: 'normal' },
      { id: 'i3', tag: 'Activation', src: '/projects/Isuzu Mega Roadshow 2025/IMG_4263 2.JPG', size: 'wide' },
      { id: 'i4', tag: 'Activation', src: '/projects/Isuzu Mega Roadshow 2025/IMG_4258 2.JPG', size: 'tall' },
      { id: 'i5', tag: 'Activation', src: '/projects/Isuzu Mega Roadshow 2025/IMG_4313 2.JPG', size: 'normal' },
      { id: 'i6', tag: 'Activation', src: '/projects/Isuzu Mega Roadshow 2025/IMG_4274 2.JPG', size: 'wide' },
      { id: 'i7', tag: 'Activation', src: '/projects/Isuzu Mega Roadshow 2025/IMG_4290 2.JPG', size: 'tall' },
      { id: 'i8', tag: 'Activation', src: '/projects/Isuzu Mega Roadshow 2025/IMG_4312 2.JPG', size: 'normal' },
    ]
  },
  {
    id: 'sakura-ferralloys',
    name: 'Sakura Ferralloys Ground Breaking',
    items: [
      { id: 's1', tag: 'Ceremony', src: '/projects/Sakura Ferralloys Ground Breaking/IMG_3998.JPG', size: 'wide' },
      { id: 's2', tag: 'Structure', src: '/projects/Sakura Ferralloys Ground Breaking/IMG_4006.JPG', size: 'tall' },
      { id: 's3', tag: 'Setup', src: '/projects/Sakura Ferralloys Ground Breaking/IMG_4011.JPG', size: 'normal' },
      { id: 's4', tag: 'Ceremony', src: '/projects/Sakura Ferralloys Ground Breaking/IMG_3949.JPG', size: 'wide' },
      { id: 's5', tag: 'Ceremony', src: '/projects/Sakura Ferralloys Ground Breaking/IMG_4003.JPG', size: 'tall' },
      { id: 's6', tag: 'Setup', src: '/projects/Sakura Ferralloys Ground Breaking/IMG_3997.JPG', size: 'normal' },
    ]
  },
  {
    id: 'wedding-annual-dinner',
    name: 'Wedding & Annual Dinner',
    items: [
      { id: 'w1', tag: 'Wedding', src: '/projects/Wedding and Annual Dinner/TKWedding_P4-72.JPG', size: 'tall' },
      { id: 'w2', tag: 'Annual Dinner', src: '/projects/Wedding and Annual Dinner/unnamed.jpg', size: 'wide' },
    ]
  },
  {
    id: 'bif-bcot',
    name: 'BIF/BCOT Turnaround Village 2025',
    items: [] // Placeholder
  },
  {
    id: 'traffic-game',
    name: 'Traffic Game 2025',
    items: [] // Placeholder
  },
  {
    id: 'petronas-langkawi',
    name: 'Petronas Langkawi Le Tour De 2025',
    items: [] // Placeholder
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
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
        background: scrolled
          ? 'rgba(5, 5, 5, 0.85)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled
          ? '1px solid rgba(0, 86, 179, 0.2)'
          : '1px solid transparent',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid rgba(0,86,179,0.4)',
            flexShrink: 0,
          }}
        >
          <img
            src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
            alt="ZTO Logo"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: 18,
            color: '#fff',
            letterSpacing: '-0.5px',
          }}
        >
          Zero To One <span style={{ color: '#0056B3' }}>Event</span>
        </span>
      </div>

      {/* Nav Links */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
        }}
      >
        {[
          { label: 'Identity', href: '#identity' },
          { label: 'Memoirs', href: '#memoirs' },
          { label: 'Services', href: '#services' },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            id={`nav-link-${item.label.toLowerCase()}`}
            style={{
              color: 'rgba(229,229,229,0.7)',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: 14,
              textDecoration: 'none',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.color = '#fff')
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.color =
                'rgba(229,229,229,0.7)')
            }
          >
            {item.label}
          </a>
        ))}
        <a
          id="nav-cta-start-project"
          href="/public/consulting"
          style={{
            background: 'linear-gradient(135deg, #0056B3, #0077CC)',
            color: '#fff',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: 13,
            padding: '10px 22px',
            borderRadius: 8,
            textDecoration: 'none',
            letterSpacing: '0.3px',
            boxShadow: '0 0 20px rgba(0,86,179,0.35)',
            transition: 'box-shadow 0.2s, transform 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.boxShadow =
              '0 0 35px rgba(0,86,179,0.6)';
            (e.target as HTMLElement).style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.boxShadow =
              '0 0 20px rgba(0,86,179,0.35)';
            (e.target as HTMLElement).style.transform = 'translateY(0)';
          }}
        >
          Start a Project
        </a>
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------
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
        {/* Gradient overlay on top of video */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            background:
              'linear-gradient(to bottom, rgba(5,5,5,0.55) 0%, rgba(5,5,5,0.3) 40%, rgba(5,5,5,0.7) 100%)',
          }}
        />
        {/* Blue radial glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            background:
              'radial-gradient(ellipse 80% 60% at 50% 60%, rgba(0,86,179,0.08) 0%, transparent 70%)',
          }}
        />
        {/* Placeholder cinematic bg (replaced by actual video embed below) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            background:
              'linear-gradient(135deg, #050505 0%, #080d14 40%, #050e1a 100%)',
          }}
        />
        {/* Grid lines atmosphere */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            backgroundImage:
              'linear-gradient(rgba(0,86,179,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,86,179,0.04) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
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
        {/* Badge */}
        <div
          className="hero-badge"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(0,86,179,0.12)',
            border: '1px solid rgba(0,86,179,0.35)',
            borderRadius: 100,
            padding: '8px 20px',
            marginBottom: 32,
            backdropFilter: 'blur(12px)',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#0077CC',
              boxShadow: '0 0 8px #0077CC',
              display: 'inline-block',
              animation: 'pulse-dot 2s ease-in-out infinite',
            }}
          />
          <span
            style={{
              color: '#6BB8FF',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              fontSize: 12,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
            }}
          >
            Sarawak&apos;s Premier Event Production House
          </span>
        </div>

        {/* Headline */}
        <h1
          className="hero-headline"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(36px, 6vw, 72px)',
            lineHeight: 1.1,
            color: '#FFFFFF',
            letterSpacing: '-2px',
            marginBottom: 24,
          }}
        >
          Premier Event Management
          <br />
          <span
            style={{
              background: 'linear-gradient(90deg, #0056B3, #2196F3, #0099FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            & Technical Production
          </span>
          <br />
          in Sarawak.
        </h1>

        {/* Sub-headline */}
        <p
          className="hero-sub"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: 'clamp(15px, 2vw, 19px)',
            lineHeight: 1.7,
            color: 'rgba(229,229,229,0.65)',
            maxWidth: 680,
            margin: '0 auto 48px',
          }}
        >
          From Bintulu to the whole of Sarawak. We don&apos;t just plan events —
          we engineer experiences with state-of-the-art equipment and the{' '}
          <span style={{ color: '#6BB8FF', fontWeight: 500 }}>
            ZTO Arena OS
          </span>
          .
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
            href="/public/consulting"
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
            href="#memoirs"
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
              砂拉越活动管理
              <br />
              <span style={{ color: 'rgba(229,229,229,0.4)', fontWeight: 400, fontSize: '0.65em', letterSpacing: '-0.5px' }}>
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
              href="/public/consulting"
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
// Project Memoirs — Categorized Grid With Tabs
// ---------------------------------------------------------------------------
function MemoirsSection() {
  const [activeTab, setActiveTab] = useState(projectCategories[0].id);
  const activeProjects = projectCategories.find(c => c.id === activeTab)?.items || [];

  return (
    <section
      id="memoirs"
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
                Project Memoirs
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
              columns: '3 300px',
              columnGap: 16,
              minHeight: 400, // Reduces jumpiness when switching tabs
            }}
          >
            {activeProjects.map((project, i) => (
              <div
                key={`${activeTab}-${project.id}`} // Force re-mount on tab switch for animation
                id={`memoir-card-${project.id}`}
                style={{
                  breakInside: 'avoid',
                  marginBottom: 16,
                  position: 'relative',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.07)',
                  cursor: 'pointer',
                  display: 'block',
                  animation: \`fadeInUp 0.6s ease \${i * 0.1}s both\`,
                }}
                className="memoir-card"
              >
                <div
                  style={{
                    aspectRatio:
                      project.size === 'tall'
                        ? '4/5'
                        : project.size === 'wide'
                        ? '16/9'
                        : '1/1',
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  {project.src.toLowerCase().match(/\.(mp4|mov|webm)$/) ? (
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
                      alt={project.name}
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
                      {project.name}
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
            href="/public/consulting"
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

        {/* Staff Console — discreet link */}
        <Link
          href="/auth"
          id="footer-staff-console"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'rgba(229,229,229,0.2)',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: 11,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            textDecoration: 'none',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color =
              'rgba(107,184,255,0.7)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color =
              'rgba(229,229,229,0.2)';
          }}
        >
          <i
            className="fa-solid fa-terminal"
            style={{ fontSize: 10 }}
          />
          Staff Console
        </Link>
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
