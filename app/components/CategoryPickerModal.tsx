'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CategoryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  {
    id: 'corporate_dinner',
    title: 'Corporate Dinner',
    cn: '公司晚宴 / 年度年会',
    desc: 'Annual Gala · Awards Night · LED Wall · Line Array Sound · Bilingual Emcee',
    icon: 'fa-solid fa-building',
    accentColor: '#0077CC',
    gradient: 'linear-gradient(135deg, rgba(0, 86, 179, 0.4), rgba(0, 119, 204, 0.15))',
    badge: 'Popular',
  },
  {
    id: 'wedding',
    title: 'Wedding',
    cn: '婚礼盛典 / 婚宴制作',
    desc: 'Ballroom Sound & Lights · Dreamy Low-Fog Dry Ice · Cold Sparks · Live Band',
    icon: 'fa-solid fa-heart',
    accentColor: '#ec4899',
    gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.35), rgba(168, 85, 247, 0.15))',
    badge: 'Trending',
  },
  {
    id: 'family_day',
    title: 'Family Day',
    cn: '企业家庭日 / 亲子嘉年华',
    desc: 'Giant Inflatables · Carnival Games · Telematch · Clown Magic · Food Trucks',
    icon: 'fa-solid fa-people-roof',
    accentColor: '#10b981',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(6, 182, 212, 0.15))',
    badge: 'Fun',
  },
  {
    id: 'festival_event',
    title: 'Festival Event',
    cn: '节庆活动 / 商业商场庆典',
    desc: 'CNY · Hari Raya · Christmas · Thematic Decor · Lion Dance · Cultural Shows',
    icon: 'fa-solid fa-champagne-glasses',
    accentColor: '#f59e0b',
    gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.35), rgba(239, 68, 68, 0.15))',
    badge: 'Festive',
  },
];

export default function CategoryPickerModal({ isOpen, onClose }: CategoryPickerModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleSelectCategory = (categoryId: string) => {
    onClose();
    router.push(`/public/enquiry?category=${categoryId}`);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 5, 5, 0.82)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 680,
          background: 'rgba(18, 20, 24, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 24,
          padding: 'clamp(24px, 4vw, 36px)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(0, 86, 179, 0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(229, 229, 229, 0.7)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(229, 229, 229, 0.7)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
          }}
        >
          <i className="fa-solid fa-xmark" style={{ fontSize: 16 }} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(0, 86, 179, 0.15)',
              border: '1px solid rgba(0, 86, 179, 0.35)',
              color: '#6BB8FF',
              padding: '6px 14px',
              borderRadius: 100,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            <i className="fa-solid fa-sparkles" />
            Start a Project Enquiry
          </div>

          <h2
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 'clamp(22px, 3.5vw, 28px)',
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '-0.8px',
              margin: '0 0 8px',
            }}
          >
            Select Your Event Category
          </h2>
          <p style={{ color: 'rgba(229, 229, 229, 0.6)', fontSize: 14, margin: 0 }}>
            请选择您要咨询的活动类型，我们将为您匹配专属的技术设备与策划方案：
          </p>
        </div>

        {/* Category Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id)}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 16,
                padding: '20px 18px',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = cat.gradient;
                e.currentTarget.style.borderColor = cat.accentColor;
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 12px 30px ${cat.accentColor}33`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: 'rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      color: cat.accentColor,
                    }}
                  >
                    <i className={cat.icon} />
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'rgba(229, 229, 229, 0.7)',
                    }}
                  >
                    {cat.badge}
                  </span>
                </div>

                <div style={{ fontSize: 17, fontWeight: 700, color: '#FFFFFF', marginBottom: 2 }}>
                  {cat.title}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#6BB8FF', marginBottom: 8 }}>
                  {cat.cn}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(229, 229, 229, 0.55)', lineHeight: 1.5 }}>
                  {cat.desc}
                </div>
              </div>

              <div
                style={{
                  marginTop: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: cat.accentColor,
                }}
              >
                <span>Enquire Now / 立即询价</span>
                <i className="fa-solid fa-arrow-right" style={{ fontSize: 10 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer link */}
        <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <Link
            href="/public/enquiry"
            onClick={onClose}
            style={{
              fontSize: 13,
              color: 'rgba(229, 229, 229, 0.6)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#fff')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'rgba(229, 229, 229, 0.6)')}
          >
            Not sure yet? View General Enquiry Form (直接前往完整表单) →
          </Link>
        </div>
      </div>
    </div>
  );
}
