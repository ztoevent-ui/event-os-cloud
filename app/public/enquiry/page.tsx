'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// Event Categories Configuration
const CATEGORIES = [
  {
    id: 'corporate_dinner',
    title: 'Corporate Dinner',
    subtitle: '公司晚宴 / 年会盛典',
    desc: 'Annual Gala · Awards Night · VIP Experience',
    icon: 'fa-solid fa-building',
    tag: 'Corporate',
    accentColor: '#0077CC',
  },
  {
    id: 'wedding',
    title: 'Wedding',
    subtitle: '梦幻婚礼盛典',
    desc: 'Grand Ballroom AV · Dry Ice Clouds · Live Band',
    icon: 'fa-solid fa-heart',
    tag: 'Wedding',
    accentColor: '#ec4899',
  },
  {
    id: 'family_day',
    title: 'Family Day',
    subtitle: '企业家庭日 / 嘉年华',
    desc: 'Inflatables · Carnival Games · Team Building',
    icon: 'fa-solid fa-people-roof',
    tag: 'Community',
    accentColor: '#10b981',
  },
  {
    id: 'festival_event',
    title: 'Festival Event',
    subtitle: '节庆活动 / 商业庆典',
    desc: 'CNY · Raya · Christmas · Mall Decor & Shows',
    icon: 'fa-solid fa-champagne-glasses',
    tag: 'Festival',
    accentColor: '#f59e0b',
  },
];

function EnquiryFormContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'corporate_dinner';

  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Sync category from URL if present
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat && CATEGORIES.some(c => c.id === cat)) {
      setActiveCategory(cat);
    }
  }, [searchParams]);

  // General Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [venueStatus, setVenueStatus] = useState('need_recommendation');
  const [venueName, setVenueName] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');

  // Corporate Dinner specific
  const [companyName, setCompanyName] = useState('');
  const [corpPax, setCorpPax] = useState('');
  const [dinnerTheme, setDinnerTheme] = useState('');
  const [corpEquipNeeds, setCorpEquipNeeds] = useState<string[]>([]);
  const [corpTalentNeeds, setCorpTalentNeeds] = useState<string[]>([]);

  // Wedding specific
  const [groomName, setGroomName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [weddingType, setWeddingType] = useState('dinner_banquet');
  const [weddingTables, setWeddingTables] = useState('');
  const [weddingPackageChoice, setWeddingPackageChoice] = useState('package_b');
  const [interestedVideoGuestbook, setInterestedVideoGuestbook] = useState(false);
  const [weddingStyle, setWeddingStyle] = useState('');
  const [weddingServices, setWeddingServices] = useState<string[]>([]);
  const [weddingNotes, setWeddingNotes] = useState('');

  // Family Day specific
  const [familyOrgName, setFamilyOrgName] = useState('');
  const [familyTotalPax, setFamilyTotalPax] = useState('');
  const [familyKidsRatio, setFamilyKidsRatio] = useState('');
  const [familyVenuePref, setFamilyVenuePref] = useState('outdoor_park');
  const [familyActivities, setFamilyActivities] = useState<string[]>([]);
  const [familyCatering, setFamilyCatering] = useState<string[]>([]);

  // Festival Event specific
  const [festivalType, setFestivalType] = useState('cny');
  const [festivalVenueType, setFestivalVenueType] = useState('mall_atrium');
  const [festivalFootfall, setFestivalFootfall] = useState('2000_5000');
  const [festivalElements, setFestivalElements] = useState<string[]>([]);

  // Toggle helper for multi-select chips
  const toggleSelection = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const currentCategoryObj = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Assemble category specific payload
    let categoryDetails: Record<string, any> = {};
    let resolvedCompany = '';

    if (activeCategory === 'corporate_dinner') {
      resolvedCompany = companyName;
      categoryDetails = {
        companyName,
        expectedPaxOrTables: corpPax,
        dinnerTheme,
        equipmentNeeds: corpEquipNeeds,
        talentAndPrograms: corpTalentNeeds,
      };
    } else if (activeCategory === 'wedding') {
      resolvedCompany = `${groomName || 'Groom'} & ${brideName || 'Bride'}`;
      categoryDetails = {
        groomName,
        brideName,
        weddingType,
        estimatedTables: weddingTables,
        weddingPackageChoice,
        interestedVideoGuestbook,
        weddingStyle,
        weddingServicesNeeded: weddingServices,
        specialVibeOrSongs: weddingNotes,
      };
    } else if (activeCategory === 'family_day') {
      resolvedCompany = familyOrgName;
      categoryDetails = {
        organizationName: familyOrgName,
        totalExpectedPax: familyTotalPax,
        kidsEstimatedRatio: familyKidsRatio,
        venueEnvironmentPreference: familyVenuePref,
        carnivalAndGameNeeds: familyActivities,
        cateringAndCanopyNeeds: familyCatering,
      };
    } else if (activeCategory === 'festival_event') {
      resolvedCompany = companyName || name;
      categoryDetails = {
        festivalThemeType: festivalType,
        hostingEnvironment: festivalVenueType,
        expectedFootfallScale: festivalFootfall,
        festivalCustomElements: festivalElements,
      };
    }

    const payload = {
      name,
      company: resolvedCompany,
      email,
      phone,
      category: activeCategory,
      categoryLabel: currentCategoryObj.title,
      eventDate,
      budgetRange,
      venue: venueStatus === 'confirmed' ? venueName : (venueStatus === 'candidate' ? `Shortlisted: ${venueName}` : 'Needs Venue Recommendation from ZTO'),
      notes: generalNotes,
      categoryDetails,
    };

    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!result.success) {
        alert('There was an error submitting the form: ' + (result.error || 'Unknown error'));
      } else {
        setSubmitted(true);
        // Fire Google Ads Conversion Tracking
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'ads_conversion_Contact_Us_1', {});
        }
      }
    } catch (err: any) {
      alert('Network error. Please try again or message us directly via WhatsApp.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hi Zero To One Event, I would like to enquire about my ${currentCategoryObj.title}!\n\nName: ${name || 'Customer'}\nDate: ${eventDate || 'TBD'}\nContact: ${phone || '—'}`
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#050505',
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Background glow effects */}
      <div
        style={{
          position: 'absolute',
          top: -150,
          left: -100,
          width: 500,
          height: 500,
          background: 'rgba(0, 86, 179, 0.18)',
          filter: 'blur(120px)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -150,
          right: -100,
          width: 600,
          height: 600,
          background: 'rgba(0, 119, 204, 0.12)',
          filter: 'blur(140px)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      {/* Header bar */}
      <div
        style={{
          padding: '24px clamp(20px, 4vw, 48px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 10,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            color: '#6BB8FF',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
            transition: 'all 0.2s',
          }}
        >
          <i className="fa-solid fa-arrow-left" />
          <span>Back to Home</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
            alt="ZTO Logo"
            style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', border: '1px solid rgba(0,86,179,0.4)' }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.3px', color: '#fff' }}>
            Zero To One <span style={{ color: '#0077CC' }}>Event</span>
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(20px, 4vw, 48px) clamp(16px, 3vw, 24px)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 820,
            background: 'rgba(18, 20, 24, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 24,
            padding: 'clamp(24px, 4vw, 48px)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          }}
        >
          {submitted ? (
            /* Submission Success State */
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  boxShadow: '0 0 40px rgba(16,185,129,0.3)',
                }}
              >
                <i className="fa-solid fa-check" style={{ fontSize: 36, color: '#34d399' }} />
              </div>
              <h2
                style={{
                  fontWeight: 800,
                  fontSize: 'clamp(24px, 4vw, 32px)',
                  marginBottom: 12,
                  letterSpacing: '-0.8px',
                  background: 'linear-gradient(90deg, #FFFFFF, #6BB8FF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Enquiry Received / 咨询已收到
              </h2>
              <p
                style={{
                  color: 'rgba(229,229,229,0.7)',
                  lineHeight: 1.7,
                  fontSize: 15,
                  maxWidth: 540,
                  margin: '0 auto 28px',
                }}
              >
                Thank you, <strong>{name}</strong>! Your {currentCategoryObj.title} consultation request has been dispatched to our production directors. We will formulate a tailored technical & production proposal for you within 24 hours.
              </p>

              {/* Direct WhatsApp Call to Action */}
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a
                  href={`https://wa.me/601110515155?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    background: '#25D366',
                    color: '#fff',
                    padding: '14px 28px',
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 8px 24px rgba(37,211,102,0.35)',
                    transition: 'all 0.2s',
                  }}
                >
                  <i className="fa-brands fa-whatsapp" style={{ fontSize: 20 }} />
                  <span>Chat on WhatsApp Directly</span>
                </a>

                <button
                  onClick={() => setSubmitted(false)}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    padding: '14px 24px',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Submit Another Event
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Form Header */}
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(0,86,179,0.15)',
                    border: '1px solid rgba(0,86,179,0.35)',
                    color: '#6BB8FF',
                    padding: '6px 16px',
                    borderRadius: 100,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    marginBottom: 14,
                  }}
                >
                  <i className="fa-solid fa-sparkles" style={{ fontSize: 10 }} />
                  Start a Project & Technical Scope
                </div>
                <h1
                  style={{
                    fontWeight: 800,
                    fontSize: 'clamp(26px, 4vw, 36px)',
                    letterSpacing: '-1px',
                    margin: '0 0 10px',
                    color: '#FFFFFF',
                  }}
                >
                  Tell Us About Your Event
                </h1>
                <p style={{ color: 'rgba(229,229,229,0.6)', fontSize: 14, maxWidth: 540, margin: '0 auto' }}>
                  Select your event category below. We provide tailored hardware solutions, production staging, and program management.
                </p>
              </div>

              {/* 4 CATEGORY SELECTION CARDS */}
              <div style={{ marginBottom: 32 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'rgba(229,229,229,0.85)',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0077CC' }} />
                  Step 1: Choose Your Event Category (选择活动类别)
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                    gap: 12,
                  }}
                >
                  {CATEGORIES.map(cat => {
                    const isSelected = activeCategory === cat.id;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        style={{
                          background: isSelected
                            ? `linear-gradient(135deg, rgba(0,86,179,0.35), rgba(0,119,204,0.15))`
                            : 'rgba(255,255,255,0.03)',
                          border: isSelected
                            ? `2px solid #0077CC`
                            : '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 14,
                          padding: '16px 14px',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: isSelected ? '0 0 25px rgba(0,119,204,0.35)' : 'none',
                        }}
                      >
                        {isSelected && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              background: '#0077CC',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                              color: '#fff',
                            }}
                          >
                            <i className="fa-solid fa-check" />
                          </div>
                        )}

                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: isSelected ? '#0077CC' : 'rgba(255,255,255,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isSelected ? '#fff' : '#6BB8FF',
                            fontSize: 16,
                          }}
                        >
                          <i className={cat.icon} />
                        </div>

                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', marginBottom: 2 }}>
                            {cat.title}
                          </div>
                          <div style={{ fontSize: 11, color: isSelected ? '#6BB8FF' : 'rgba(229,229,229,0.5)', fontWeight: 500 }}>
                            {cat.subtitle}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* FORM FIELDS */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                
                {/* ── PART 1: Category-Specific Dynamic Section ── */}
                <div
                  style={{
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid rgba(0, 119, 204, 0.25)',
                    borderRadius: 18,
                    padding: '24px clamp(16px, 3vw, 24px)',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#6BB8FF',
                      marginBottom: 18,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                    }}
                  >
                    <i className={currentCategoryObj.icon} />
                    Step 2: Specific Requirements for {currentCategoryObj.title}
                  </div>

                  {/* 1. CORPORATE DINNER FIELDS */}
                  {activeCategory === 'corporate_dinner' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                        <div>
                          <label style={labelStyle}>Company Name / 企业名称 *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Petronas / Isuzu Motors"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Expected Attendance / 预估桌数或人数 *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 35 Tables / ~350 Pax"
                            value={corpPax}
                            onChange={(e) => setCorpPax(e.target.value)}
                            style={inputStyle}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={labelStyle}>Dinner Theme & Ambience / 晚宴主题风格</label>
                        <input
                          type="text"
                          placeholder="e.g. Black & Gold Gala, Hollywood Oscars, Futuristic Cyber, Retro 80s"
                          value={dinnerTheme}
                          onChange={(e) => setDinnerTheme(e.target.value)}
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Hardware & Technical Needs / 核心技术设备需求 (多选)</label>
                        <div style={chipContainerStyle}>
                          {[
                            'P3.91/P2.6 LED Video Wall 大屏幕',
                            'Concert-Grade Line Array Sound 顶级音响',
                            'Intelligent Moving Heads & Stage Lighting 舞台灯光秀',
                            'Stage Platform & Aluminum Truss 舞台搭设与桁架',
                            'Safe Indoor Cold Sparks & Low-Fog Dry Ice 室内冷烟花与干冰',
                            'Live Camera Feed & Video Switcher 现场双机位摄像转播',
                          ].map(item => (
                            <button
                              type="button"
                              key={item}
                              onClick={() => toggleSelection(corpEquipNeeds, setCorpEquipNeeds, item)}
                              style={chipStyle(corpEquipNeeds.includes(item))}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label style={labelStyle}>Talent & Entertainment Needs / 演艺节目与配套 (多选)</label>
                        <div style={chipContainerStyle}>
                          {[
                            'Professional Bilingual Emcee 双语金牌司仪',
                            'Live Band (Pop/Jazz/Rock) 现场乐队',
                            'Opening Dance / LED Drum Show 开场震撼光影秀',
                            'Digital Lucky Draw System 数字化大屏互动抽奖',
                            'Photobooth & Media Backdrop 拍照打卡墙',
                            'Event Director & Stage Management 现场总导演控场',
                          ].map(item => (
                            <button
                              type="button"
                              key={item}
                              onClick={() => toggleSelection(corpTalentNeeds, setCorpTalentNeeds, item)}
                              style={chipStyle(corpTalentNeeds.includes(item))}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. WEDDING FIELDS */}
                  {activeCategory === 'wedding' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                        <div>
                          <label style={labelStyle}>Groom&apos;s Name / 新郎姓名 *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Jason Tan"
                            value={groomName}
                            onChange={(e) => setGroomName(e.target.value)}
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Bride&apos;s Name / 新娘姓名 *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Emily Wong"
                            value={brideName}
                            onChange={(e) => setBrideName(e.target.value)}
                            style={inputStyle}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                        <div>
                          <label style={labelStyle}>Reception Type / 婚宴形式</label>
                          <select
                            value={weddingType}
                            onChange={(e) => setWeddingType(e.target.value)}
                            style={inputStyle}
                          >
                            <option value="dinner_banquet" style={{ background: '#121418' }}>Evening Dinner Banquet (晚宴盛典)</option>
                            <option value="lunch_reception" style={{ background: '#121418' }}>Lunch Reception (午宴)</option>
                            <option value="lawn_garden" style={{ background: '#121418' }}>Lawn / Garden Outdoor Wedding (户外草坪婚礼)</option>
                            <option value="rom_ceremony" style={{ background: '#121418' }}>ROM / Church Solemnization (注册仪式)</option>
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>Estimated Tables / 预计桌数 *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 25 Tables / 45 Tables"
                            value={weddingTables}
                            onChange={(e) => setWeddingTables(e.target.value)}
                            style={inputStyle}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={labelStyle}>Interested Wedding Package / 意向官方配套 (匹配 2026/2027 官方手册)</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 12 }}>
                          {[
                            { id: 'package_a', title: '🌸 Package A — RM 9,888', desc: '迎宾/主桌花艺 + 拱门 + 8组路引花柱 + 16x10ft布幔打卡墙 + 3人管家团队 (晚宴) + 鲜花手捧花 + 4朵胸花' },
                            { id: 'package_b', title: '🌿 Package B — RM 12,888', desc: '全套花艺 + 舞台两侧美陈 + 16x9ft硬板打卡墙 + 早晚双场管家 + 鲜花手捧花 + 8朵胸花 + 婚车扎花' },
                            { id: 'package_c', title: '👑 Package C — RM 16,888', desc: '7尺3D立体花艺拱门 + 发光路引 + 3组精美相框画廊 + 定制硬板打卡墙 + 控场管家 + 12朵胸花 + 婚车扎花' },
                            { id: 'custom', title: '✨ Custom AV & Production', desc: '全案高级定制 / 根据场地规模与预算专属策划' },
                          ].map(pkg => (
                            <div
                              key={pkg.id}
                              onClick={() => {
                                setWeddingPackageChoice(pkg.id);
                                if (pkg.id === 'package_a') setBudgetRange('RM 10,000 - RM 15,000');
                                else if (pkg.id === 'package_b') setBudgetRange('RM 15,000 - RM 25,000');
                                else if (pkg.id === 'package_c') setBudgetRange('RM 15,000 - RM 25,000');
                              }}
                              style={{
                                padding: '12px 14px',
                                borderRadius: 10,
                                background: weddingPackageChoice === pkg.id ? 'rgba(236,72,153,0.18)' : 'rgba(255,255,255,0.03)',
                                border: weddingPackageChoice === pkg.id ? '2px solid #ec4899' : '1px solid rgba(255,255,255,0.08)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                            >
                              <div style={{ fontSize: 13, fontWeight: 700, color: weddingPackageChoice === pkg.id ? '#ec4899' : '#fff' }}>
                                {pkg.title}
                              </div>
                              <div style={{ fontSize: 11, color: 'rgba(229,229,229,0.5)', marginTop: 4, lineHeight: 1.4 }}>
                                {pkg.desc}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Special Add-on checkbox */}
                        {(weddingPackageChoice === 'package_b' || weddingPackageChoice === 'package_c') && (
                          <div
                            onClick={() => setInterestedVideoGuestbook(!interestedVideoGuestbook)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              borderRadius: 10,
                              background: 'rgba(245, 158, 11, 0.08)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              cursor: 'pointer',
                              marginBottom: 14,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <input
                                type="checkbox"
                                checked={interestedVideoGuestbook}
                                onChange={(e) => setInterestedVideoGuestbook(e.target.checked)}
                                style={{ width: 16, height: 16, accentColor: '#f59e0b' }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#fbbf24' }}>
                                加购 Special Add-On: Video Guestbook (复古视频/语音留言机 — 现场特惠 RM {weddingPackageChoice === 'package_c' ? '788' : '888'})
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label style={labelStyle}>Wedding Aesthetic & Theme / 婚礼风格偏好</label>
                        <input
                          type="text"
                          placeholder="e.g. Romantic Starry Night, Champagne Luxury, Modern Minimalist, Traditional Oriental"
                          value={weddingStyle}
                          onChange={(e) => setWeddingStyle(e.target.value)}
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Services & Special FX Needed / 所需服务与特效 (多选)</label>
                        <div style={chipContainerStyle}>
                          {[
                            'Dreamy Low-Fog Dry Ice (进场梦幻干冰云海)',
                            'Indoor Safe Cold Spark Fountains (浪漫冷烟花秀)',
                            'Wedding Bilingual Emcee (资深婚礼双语司仪)',
                            'Acoustic Live Band 现场乐队 (2-4人声乐演奏)',
                            'Ballroom Sound & Mood Lighting 宴会厅顶级音响灯光',
                            'P2.6 LED Backdrop & Live Feed 超清大屏与现场转播',
                            'Sound Engineer & Lighting Operator 现场专业调音灯光师',
                            'Full Wedding Planning & Coordination 婚礼全程策划统筹',
                          ].map(item => (
                            <button
                              type="button"
                              key={item}
                              onClick={() => toggleSelection(weddingServices, setWeddingServices, item)}
                              style={chipStyle(weddingServices.includes(item))}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. FAMILY DAY FIELDS */}
                  {activeCategory === 'family_day' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                        <div>
                          <label style={labelStyle}>Organization / 企业机构名称 *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Shell Bintulu / Sarawak Energy"
                            value={familyOrgName}
                            onChange={(e) => setFamilyOrgName(e.target.value)}
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Total Expected Pax / 预计总人数 *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 400 Pax (Adults & Children)"
                            value={familyTotalPax}
                            onChange={(e) => setFamilyTotalPax(e.target.value)}
                            style={inputStyle}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                        <div>
                          <label style={labelStyle}>Venue Preference / 场地环境偏好</label>
                          <select
                            value={familyVenuePref}
                            onChange={(e) => setFamilyVenuePref(e.target.value)}
                            style={inputStyle}
                          >
                            <option value="outdoor_park" style={{ background: '#121418' }}>Outdoor Grass Park (户外公园草坪)</option>
                            <option value="indoor_sports" style={{ background: '#121418' }}>Indoor Sports Complex (室内大型体育馆)</option>
                            <option value="beach_resort" style={{ background: '#121418' }}>Beach / Resort (海滩 / 度假村)</option>
                            <option value="company_site" style={{ background: '#121418' }}>Company Compound / Plant (企业厂区园区)</option>
                            <option value="need_zto_advice" style={{ background: '#121418' }}>Needs ZTO Venue Recommendation (请推荐场地)</option>
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>Kids Ratio / 儿童预计占比或年龄段</label>
                          <input
                            type="text"
                            placeholder="e.g. ~35% kids under 12 years old"
                            value={familyKidsRatio}
                            onChange={(e) => setFamilyKidsRatio(e.target.value)}
                            style={inputStyle}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={labelStyle}>Carnival & Interactive Activities / 亲子娱乐与嘉年华互动 (多选)</label>
                        <div style={chipContainerStyle}>
                          {[
                            'Giant Inflatable Castle 巨型充气城堡与闯关',
                            'Classic Carnival Game Booths 嘉年华趣味游戏摊位',
                            'Teambuilding & Telematch 亲子趣味运动会/破冰',
                            'Clown Balloonist & Magic Show 滑稽小丑气球与魔术',
                            'Face Painting & DIY Art Booths 面部彩绘与手工工作坊',
                            'Outdoor Sound System & Fun Emcee 户外音响与互动主持',
                          ].map(item => (
                            <button
                              type="button"
                              key={item}
                              onClick={() => toggleSelection(familyActivities, setFamilyActivities, item)}
                              style={chipStyle(familyActivities.includes(item))}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label style={labelStyle}>Catering & Facility Equipment / 餐饮与遮阳防雨配套 (多选)</label>
                        <div style={chipContainerStyle}>
                          {[
                            'Food Trucks / Street Food Market 特色餐车市集',
                            'On-Site BBQ & Whole Lamb Roast 现烤BBQ / 烤全羊',
                            'Buffet Catering 自助餐配套',
                            'Heavy Duty Marquee Canopy & Mist Fans 防雨大篷与降温水雾扇',
                            'Custom Family Day Goodie Bags & T-Shirts 定制伴手礼与文化衫',
                          ].map(item => (
                            <button
                              type="button"
                              key={item}
                              onClick={() => toggleSelection(familyCatering, setFamilyCatering, item)}
                              style={chipStyle(familyCatering.includes(item))}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. FESTIVAL EVENT FIELDS */}
                  {activeCategory === 'festival_event' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                        <div>
                          <label style={labelStyle}>Festival Type / 节庆类型 *</label>
                          <select
                            value={festivalType}
                            onChange={(e) => setFestivalType(e.target.value)}
                            style={inputStyle}
                          >
                            <option value="cny" style={{ background: '#121418' }}>Chinese New Year (农历新年新春庆典)</option>
                            <option value="hari_raya" style={{ background: '#121418' }}>Hari Raya Aidilfitri (开斋节盛会)</option>
                            <option value="christmas_countdown" style={{ background: '#121418' }}>Christmas & New Year Countdown (圣诞跨年倒数)</option>
                            <option value="mid_autumn" style={{ background: '#121418' }}>Mid-Autumn Mooncake Festival (中秋游园会)</option>
                            <option value="deepavali" style={{ background: '#121418' }}>Deepavali Celebration (屠妖节)</option>
                            <option value="anniversary" style={{ background: '#121418' }}>Brand / City Anniversary Gala (品牌/市镇周年庆典)</option>
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>Hosting Environment / 举办场景</label>
                          <select
                            value={festivalVenueType}
                            onChange={(e) => setFestivalVenueType(e.target.value)}
                            style={inputStyle}
                          >
                            <option value="mall_atrium" style={{ background: '#121418' }}>Shopping Mall Atrium (商场中庭美陈)</option>
                            <option value="public_plaza" style={{ background: '#121418' }}>Public Town Plaza / Street (城市公共广场/市集)</option>
                            <option value="corporate_campus" style={{ background: '#121418' }}>Corporate Campus / HQ (企业园区总部)</option>
                            <option value="community_hall" style={{ background: '#121418' }}>Community Center (社区文化中心)</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                        <div>
                          <label style={labelStyle}>Expected Footfall / 预计客流规模</label>
                          <select
                            value={festivalFootfall}
                            onChange={(e) => setFestivalFootfall(e.target.value)}
                            style={inputStyle}
                          >
                            <option value="under_1000" style={{ background: '#121418' }}>Under 1,000 visitors (1,000人以下)</option>
                            <option value="1000_3000" style={{ background: '#121418' }}>1,000 - 3,000 visitors</option>
                            <option value="3000_10000" style={{ background: '#121418' }}>3,000 - 10,000 visitors (大型客流)</option>
                            <option value="10000_plus" style={{ background: '#121418' }}>10,000+ Massive Crowd (超大型公众盛会)</option>
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>Company / Organizer Name (主办单位)</label>
                          <input
                            type="text"
                            placeholder="e.g. Parkcity Mall / City Council"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            style={inputStyle}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={labelStyle}>Festive Custom Elements / 节庆定制要素 (多选)</label>
                        <div style={chipContainerStyle}>
                          {[
                            'Large Thematic Photo Installation & Decor 节庆大型打卡美陈装置',
                            'Lion & Dragon Dance / High Pole Troupe 高桩舞狮与舞龙团',
                            'Mascot Walkabout & Giveaway 财神爷/圣诞老人巡游派糖',
                            'Cultural & Flea Market Booths 民俗手工艺集市摊位',
                            'Thematic Cultural Stage Performances 节日主题文艺汇演',
                            'Outdoor Heavy Duty Truss Structure 户外防雨铝合金大桁架',
                            'Crowd Control Barriers & Security 人流疏导安全护栏',
                          ].map(item => (
                            <button
                              type="button"
                              key={item}
                              onClick={() => toggleSelection(festivalElements, setFestivalElements, item)}
                              style={chipStyle(festivalElements.includes(item))}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── PART 2: General Contact & Key Date Details ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'rgba(229,229,229,0.85)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6BB8FF' }} />
                    Step 3: Contact & Event Schedule (联络人与档期资料)
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    <div>
                      <label style={labelStyle}>Your Name / 您的姓名 *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alex Tan"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Phone / WhatsApp 号码 *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +60 12 345 6789"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    <div>
                      <label style={labelStyle}>Email Address / 电子邮箱 *</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. alex@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Target Event Date / 预计活动日期 *</label>
                      <input
                        type="date"
                        required
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    <div>
                      <label style={labelStyle}>Estimated Budget Range / 预估预算区间</label>
                      <select
                        value={budgetRange}
                        onChange={(e) => setBudgetRange(e.target.value)}
                        style={inputStyle}
                      >
                        <option value="" style={{ background: '#121418' }}>Select budget expectation</option>
                        <option value="below_15k" style={{ background: '#121418' }}>Below RM 15,000</option>
                        <option value="15k_30k" style={{ background: '#121418' }}>RM 15,000 - RM 30,000</option>
                        <option value="30k_60k" style={{ background: '#121418' }}>RM 30,000 - RM 60,000</option>
                        <option value="60k_100k" style={{ background: '#121418' }}>RM 60,000 - RM 100,000</option>
                        <option value="100k_above" style={{ background: '#121418' }}>RM 100,000+ (Grand Production)</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Venue Status / 活动场地情况</label>
                      <select
                        value={venueStatus}
                        onChange={(e) => setVenueStatus(e.target.value)}
                        style={inputStyle}
                      >
                        <option value="confirmed" style={{ background: '#121418' }}>Venue Confirmed (已确定场地)</option>
                        <option value="candidate" style={{ background: '#121418' }}>Shortlisted Venues (已有候选场地)</option>
                        <option value="need_recommendation" style={{ background: '#121418' }}>Need ZTO Recommendation (需要场地推荐)</option>
                      </select>
                    </div>
                  </div>

                  {venueStatus !== 'need_recommendation' && (
                    <div>
                      <label style={labelStyle}>Venue Name & City / 场地名称与地点</label>
                      <input
                        type="text"
                        placeholder="e.g. Parkcity Everly Hotel Bintulu, Ballroom 1"
                        value={venueName}
                        onChange={(e) => setVenueName(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  )}

                  <div>
                    <label style={labelStyle}>Additional Notes / 补充说明与特别需求</label>
                    <textarea
                      rows={3}
                      placeholder="Any specific requests, timeline constraints, or special highlights you would like our production team to know..."
                      value={generalNotes}
                      onChange={(e) => setGeneralNotes(e.target.value)}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    background: 'linear-gradient(135deg, #0056B3, #0077CC)',
                    color: '#fff',
                    border: 'none',
                    padding: '18px 28px',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 8px 30px rgba(0,86,179,0.4)',
                    marginTop: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    transition: 'all 0.2s ease',
                    opacity: isSubmitting ? 0.75 : 1,
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" />
                      <span>Sending Request to ZTO Production Team...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane" />
                      <span>Submit {currentCategoryObj.title} Enquiry / 提交活动询价</span>
                    </>
                  )}
                </button>

                <div style={{ textAlign: 'center', color: 'rgba(229,229,229,0.45)', fontSize: 12 }}>
                  <i className="fa-solid fa-shield-halved" style={{ marginRight: 6 }} />
                  Your information is kept strictly confidential. ZTO Event production team responds within 24 hours.
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Styling Constants
const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'rgba(229,229,229,0.85)',
  marginBottom: 6,
  display: 'block',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(0,0,0,0.45)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  padding: '12px 14px',
  color: '#fff',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.2s',
  fontFamily: 'inherit',
};

const chipContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 6,
};

const chipStyle = (isSelected: boolean): React.CSSProperties => ({
  background: isSelected ? 'rgba(0, 119, 204, 0.28)' : 'rgba(255,255,255,0.04)',
  border: isSelected ? '1px solid #0077CC' : '1px solid rgba(255,255,255,0.1)',
  color: isSelected ? '#FFFFFF' : 'rgba(229,229,229,0.7)',
  padding: '8px 14px',
  borderRadius: 100,
  fontSize: 12,
  fontWeight: isSelected ? 600 : 500,
  cursor: 'pointer',
  transition: 'all 0.2s',
  display: 'inline-flex',
  alignItems: 'center',
});

export default function EnquiryPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6BB8FF' }}>
          Loading Enquiry Form...
        </div>
      }
    >
      <EnquiryFormContent />
    </Suspense>
  );
}
