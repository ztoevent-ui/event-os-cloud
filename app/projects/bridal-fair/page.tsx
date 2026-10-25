'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// Company Profile Information
const COMPANY_INFO = {
  name: 'ZERO TO ONE EVENT PLT',
  brand: 'ZTO Event / Arena OS',
  tagline: 'Leading Event Production & AV Hardware Integrator',
  regNo: 'LLP0028723-LGN / SSM',
  email: 'z.t.o.event@gmail.com',
  phone: '+60 11-1051 5155',
  website: 'https://ztoevent.com',
  address: 'Bintulu Headquarters, Sarawak, Malaysia',
  logoUrl: 'https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG',
};

// Preset Wedding Packages for Bridal Fair
const PRESET_PACKAGES = [
  {
    id: 'royal_luxury',
    name: '💎 Royal Luxury AV & FX Grand Production',
    price: 15800,
    fairDiscount: 2000,
    depositSuggestion: 3000,
    inclusions: [
      'P2.6 Ultra-HD Curved LED Video Wall (6m x 3.5m) + Live Video Feed',
      '3-Way Active Concert Line Array Audio System (Up to 100 tables)',
      '16x Moving Heads (Spot & Beam) + Wireless Battery Venue Wash Lights',
      'Low-Fog Dry Ice 云海特效 (Double March-In 双次进场梦幻仙境)',
      '4x Safe Indoor Cold Spark Fountains (室内安全浪漫冷烟花喷泉)',
      'Senior Bilingual Wedding Emcee (资深金牌婚礼双语司仪)',
      '4-Piece Acoustic Live Band (流行/爵士四重奏现场乐队)',
      'Dedicated On-Site Sound Engineer & Lighting Director (现场控台团队)',
      '3D Virtual Stage Simulation & Production Cue Sheet (3D舞台预演与督导)',
    ],
  },
  {
    id: 'signature_elegance',
    name: '🌟 Signature Elegance Wedding Package',
    price: 9800,
    fairDiscount: 1000,
    depositSuggestion: 2000,
    inclusions: [
      'P2.9 High-Definition LED Backdrop Screen (4m x 2.5m)',
      'Full Concert Audio Sound System & Wireless Microphones (Up to 60 tables)',
      '8x Intelligent Moving Beam Lights + Warm Face Wash Lighting',
      'Low-Fog Dry Ice Machine for 1st March-In (第一次浪漫进场干冰云海)',
      'Professional Bilingual Wedding Emcee (资深婚礼司仪)',
      '2-Piece Acoustic Live Band (双人流行声乐现场乐队)',
      'Dedicated Audio & Lighting Operating Crew (专业调音灯光师)',
      'Full Audio-Visual Day-Of Management (活动全程技术执行)',
    ],
  },
  {
    id: 'essential_sound',
    name: '🎵 Essential Audio & Lighting Package',
    price: 5800,
    fairDiscount: 500,
    depositSuggestion: 1500,
    inclusions: [
      'Professional Digital PA Sound System & Shure Wireless Mics',
      'Stage Front Warm Spotlights & Ballroom Mood Ambience Wash',
      '2x High-Power Follow Spotlights for Grand Entrance (追光灯)',
      'Live Sound Engineer & Technician On-Site (现场调音师)',
      'Wireless Background Music & Audio Playback System',
    ],
  },
];

export default function BridalFairBookingPage() {
  const router = useRouter();

  // Form State
  const [groomName, setGroomName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [sessionTime, setSessionTime] = useState('Dinner Banquet (晚宴)');
  const [venue, setVenue] = useState('');
  const [tables, setTables] = useState('');

  // Package & Pricing State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('signature_elegance');
  const [packageName, setPackageName] = useState(PRESET_PACKAGES[1].name);
  const [packageItems, setPackageItems] = useState<string[]>(PRESET_PACKAGES[1].inclusions);
  const [newItemText, setNewItemText] = useState('');
  const [packagePrice, setPackagePrice] = useState<number>(PRESET_PACKAGES[1].price);
  const [fairDiscount, setFairDiscount] = useState<number>(PRESET_PACKAGES[1].fairDiscount);
  const [depositPaid, setDepositPaid] = useState<number>(PRESET_PACKAGES[1].depositSuggestion);
  const [paymentMethod, setPaymentMethod] = useState('DuitNow QR Instant Transfer');
  const [consultantName, setConsultantName] = useState('');
  const [customRemarks, setCustomRemarks] = useState('');

  // Receipt Upload State
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Digital Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // UI & Flow State
  const [isSaving, setIsSaving] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [orderRefNo, setOrderRefNo] = useState('');
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Calculate totals
  const totalAmount = Math.max(0, packagePrice - fairDiscount);
  const balanceRemaining = Math.max(0, totalAmount - depositPaid);

  // Auto-generate reference number on load
  useEffect(() => {
    const today = new Date();
    const yymm = today.getFullYear().toString().slice(2) + String(today.getMonth() + 1).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    setOrderRefNo(`ZTO-BF-${yymm}-${rand}`);
  }, []);

  // Handle Preset Select
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = PRESET_PACKAGES.find(p => p.id === presetId);
    if (preset) {
      setPackageName(preset.name);
      setPackageItems([...preset.inclusions]);
      setPackagePrice(preset.price);
      setFairDiscount(preset.fairDiscount);
      setDepositPaid(preset.depositSuggestion);
    }
  };

  // Add Item to Package
  const handleAddItem = () => {
    if (newItemText.trim()) {
      setPackageItems([...packageItems, newItemText.trim()]);
      setNewItemText('');
    }
  };

  // Remove Item from Package
  const handleRemoveItem = (index: number) => {
    setPackageItems(packageItems.filter((_, i) => i !== index));
  };

  // Handle Receipt Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setReceiptImage(uploadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Signature Canvas Helpers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasSignature(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0056B3';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Confirm Booking & Sync to Event Management (projects + budgets table)
  const handleConfirmAndSync = async () => {
    if (!groomName.trim() || !brideName.trim()) {
      alert('请输入新郎与新娘姓名 (Please enter Groom and Bride names)');
      return;
    }
    if (!weddingDate) {
      alert('请选择婚礼日期 (Please select Wedding Date)');
      return;
    }
    if (!phone) {
      alert('请输入联系电话/WhatsApp (Please enter contact phone)');
      return;
    }

    setIsSaving(true);

    try {
      const projectName = `${groomName.trim()} & ${brideName.trim()} Wedding Banquet`;

      // 1. Insert into Supabase `projects` table
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: projectName,
          type: 'wedding',
          venue: venue || null,
          start_date: weddingDate,
          end_date: weddingDate,
          status: 'confirmed',
        })
        .select()
        .single();

      if (projectError) {
        console.error('Project Insert Error:', projectError);
        alert('建立活动档案遇到提示: ' + projectError.message);
      } else if (newProject) {
        setCreatedProjectId(newProject.id);

        // 2. Insert into `budgets` table as Confirmed Income
        if (depositPaid > 0) {
          await supabase.from('budgets').insert({
            project_id: newProject.id,
            type: 'income',
            category: 'Wedding Package Deposit',
            item: `[Bridal Fair Deposit] ${orderRefNo} - ${packageName}`,
            amount: depositPaid,
            status: 'confirmed',
          });
        }
      }

      setBookingConfirmed(true);
    } catch (err: any) {
      console.error(err);
      alert('Error saving booking: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // PDF Export
  const handleExportPDF = async () => {
    const element = printAreaRef.current;
    if (!element) return;

    try {
      // Dynamic import html2pdf
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `${orderRefNo}_${groomName}_${brideName}_Booking_Summary.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      await html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error('PDF Export Error:', error);
      window.print();
    }
  };

  // Print Action
  const handlePrint = () => {
    window.print();
  };

  // Send WhatsApp to Client
  const handleSendWhatsApp = () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `🎉 恭喜 ${groomName} & ${brideName}！感谢您在婚博会现场签约 Zero To One Event！\n\n` +
      `📋 签约单据编号：${orderRefNo}\n` +
      `📅 婚礼日期：${weddingDate} (${sessionTime})\n` +
      `🏛️ 宴会场地：${venue || '待定'}\n` +
      `💎 签约配套：${packageName}\n` +
      `💰 协议总额：RM ${totalAmount.toLocaleString()}\n` +
      `💳 已收定金：RM ${depositPaid.toLocaleString()} (${paymentMethod})\n` +
      `💵 待付尾款：RM ${balanceRemaining.toLocaleString()}\n\n` +
      `我们已在 Event OS 为您的盛大婚礼建立专属项目档案，期待与您携手打造毕生难忘的婚礼舞台与影音视听体验！✨`
    );
    window.open(`https://wa.me/${cleanPhone.startsWith('60') ? cleanPhone : '60' + cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#090A0D',
        color: '#E5E7EB',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* Top Navbar */}
      <header
        style={{
          background: 'rgba(15, 17, 23, 0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '14px clamp(16px, 4vw, 36px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(16px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link
            href="/projects"
            style={{
              color: '#6BB8FF',
              textDecoration: 'none',
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 600,
            }}
          >
            <i className="fa-solid fa-arrow-left" />
            <span>Event Management</span>
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                background: 'rgba(236,72,153,0.15)',
                color: '#ec4899',
                padding: '4px 10px',
                borderRadius: 100,
                fontSize: 11,
                fontWeight: 700,
                border: '1px solid rgba(236,72,153,0.3)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              <i className="fa-solid fa-heart" style={{ marginRight: 4 }} />
              Bridal Fair On-Site Sign-Up
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
              现场签约与即时建档开单
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'rgba(229,229,229,0.6)' }}>
            Doc Ref: <strong style={{ color: '#6BB8FF' }}>{orderRefNo}</strong>
          </span>
          {createdProjectId && (
            <Link
              href={`/projects/${createdProjectId}`}
              style={{
                background: '#0056B3',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                padding: '6px 14px',
                borderRadius: 8,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <i className="fa-solid fa-chart-line" />
              Open In Event Dashboard
            </Link>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main style={{ padding: 'clamp(20px, 4vw, 40px) clamp(16px, 3vw, 28px)', maxWidth: 1200, margin: '0 auto' }}>
        
        {/* Toggle View: Input Wizard vs Confirmed Summary */}
        {!bookingConfirmed ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
            
            {/* LEFT COLUMN: Input Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* STEP 1: Couple & Wedding Details */}
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>
                  <div style={stepBadgeStyle}>1</div>
                  <div>
                    <h2 style={panelTitleStyle}>Couple & Wedding Info / 新人与婚礼档案</h2>
                    <p style={panelDescStyle}>填写新郎新娘信息与大喜日子档期</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Groom&apos;s Name / 新郎姓名 *</label>
                    <input
                      type="text"
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
                      placeholder="e.g. Emily Wong"
                      value={brideName}
                      onChange={(e) => setBrideName(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
                  <div>
                    <label style={labelStyle}>Phone / WhatsApp 电话 *</label>
                    <input
                      type="tel"
                      placeholder="+60 12 345 6789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Email Address / 电子邮箱</label>
                    <input
                      type="email"
                      placeholder="couple@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14, marginTop: 14 }}>
                  <div>
                    <label style={labelStyle}>Wedding Date / 婚礼日期 *</label>
                    <input
                      type="date"
                      value={weddingDate}
                      onChange={(e) => setWeddingDate(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Session / 宴会时段</label>
                    <select
                      value={sessionTime}
                      onChange={(e) => setSessionTime(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="Dinner Banquet (晚宴)" style={{ background: '#121418' }}>Dinner Banquet (晚宴)</option>
                      <option value="Lunch Reception (午宴)" style={{ background: '#121418' }}>Lunch Reception (午宴)</option>
                      <option value="All Day Wedding (全天婚礼)" style={{ background: '#121418' }}>All Day Wedding (全天)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginTop: 14 }}>
                  <div>
                    <label style={labelStyle}>Ballroom / Hotel 场地与酒店</label>
                    <input
                      type="text"
                      placeholder="e.g. Parkcity Everly Hotel, Grand Ballroom"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Estimated Tables / 预估桌数</label>
                    <input
                      type="text"
                      placeholder="e.g. 35 Tables"
                      value={tables}
                      onChange={(e) => setTables(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* STEP 2: Package & Inclusions */}
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>
                  <div style={stepBadgeStyle}>2</div>
                  <div>
                    <h2 style={panelTitleStyle}>Wedding Package & Scope / 签约配套与项目</h2>
                    <p style={panelDescStyle}>选择婚博会预设套餐或自定义配置服务</p>
                  </div>
                </div>

                {/* Preset Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {PRESET_PACKAGES.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 12,
                        background: selectedPresetId === preset.id ? 'rgba(0,86,179,0.25)' : 'rgba(255,255,255,0.03)',
                        border: selectedPresetId === preset.id ? '1.5px solid #0077CC' : '1px solid rgba(255,255,255,0.08)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{preset.name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(229,229,229,0.5)', marginTop: 2 }}>
                          原价: RM {preset.price.toLocaleString()} | 展会特惠: -RM {preset.fairDiscount.toLocaleString()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#6BB8FF' }}>
                          RM {(preset.price - preset.fairDiscount).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Package Inclusions List */}
                <div style={{ marginTop: 14 }}>
                  <label style={labelStyle}>Package Inclusions Checklist / 配套所含服务明细</label>
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '10px 14px',
                      maxHeight: 180,
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    {packageItems.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 12,
                          color: '#E5E7EB',
                          padding: '4px 0',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <i className="fa-solid fa-check text-xs" style={{ color: '#10b981' }} />
                          <span>{item}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255,255,255,0.3)',
                            cursor: 'pointer',
                            padding: '2px 6px',
                          }}
                        >
                          <i className="fa-solid fa-xmark text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Custom Item */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input
                      type="text"
                      placeholder="Add custom item (e.g. 进场干冰多加一次 / 双人提琴演奏)"
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem())}
                      style={{ ...inputStyle, padding: '8px 12px', fontSize: 12 }}
                    />
                    <button
                      type="button"
                      onClick={handleAddItem}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        padding: '0 14px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Deposit, Receipt Upload, Signature & Confirm */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* STEP 3: Financials & Deposit */}
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>
                  <div style={stepBadgeStyle}>3</div>
                  <div>
                    <h2 style={panelTitleStyle}>Deposit & Payment / 定金还了多少</h2>
                    <p style={panelDescStyle}>记录现场实付定金与自动计算待付尾款</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Package Original Price (原价)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: 12, color: 'rgba(229,229,229,0.5)', fontSize: 13 }}>RM</span>
                      <input
                        type="number"
                        value={packagePrice}
                        onChange={(e) => setPackagePrice(Number(e.target.value))}
                        style={{ ...inputStyle, paddingLeft: 42 }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Fair Special Rebate (展会特惠扣减)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: 12, color: 'rgba(229,229,229,0.5)', fontSize: 13 }}>-RM</span>
                      <input
                        type="number"
                        value={fairDiscount}
                        onChange={(e) => setFairDiscount(Number(e.target.value))}
                        style={{ ...inputStyle, paddingLeft: 46, color: '#f87171' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Final Total Amount Display */}
                <div
                  style={{
                    margin: '16px 0',
                    background: 'rgba(0,86,179,0.15)',
                    border: '1px solid rgba(0,86,179,0.3)',
                    borderRadius: 12,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#6BB8FF' }}>
                    Final Agreed Contract Total (协议总额)
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>
                    RM {totalAmount.toLocaleString()}
                  </span>
                </div>

                {/* Deposit Paid Input */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ ...labelStyle, color: '#34d399', fontWeight: 700 }}>
                      Deposit Paid Today / 现场已付定金 *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: 12, color: '#34d399', fontWeight: 700, fontSize: 13 }}>RM</span>
                      <input
                        type="number"
                        required
                        value={depositPaid}
                        onChange={(e) => setDepositPaid(Number(e.target.value))}
                        style={{ ...inputStyle, paddingLeft: 42, borderColor: 'rgba(16,185,129,0.5)', color: '#34d399', fontWeight: 700, fontSize: 16 }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Balance Remaining / 待付尾款</label>
                    <div
                      style={{
                        padding: '11px 14px',
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10,
                        fontSize: 15,
                        fontWeight: 700,
                        color: balanceRemaining > 0 ? '#fbbf24' : '#34d399',
                      }}
                    >
                      RM {balanceRemaining.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Payment Method & Consultant */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14, marginTop: 14 }}>
                  <div>
                    <label style={labelStyle}>Payment Method / 付款方式</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="DuitNow QR Instant Transfer" style={{ background: '#121418' }}>DuitNow QR Instant Pay</option>
                      <option value="Bank Online Transfer (Maybank/Public)" style={{ background: '#121418' }}>Bank Online Transfer</option>
                      <option value="Credit Card / POS Terminal" style={{ background: '#121418' }}>Credit Card / Terminal</option>
                      <option value="Cash (现金付款)" style={{ background: '#121418' }}>Cash (现金)</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Sales Consultant / 经手顾问</label>
                    <input
                      type="text"
                      placeholder="e.g. Connie / Dane"
                      value={consultantName}
                      onChange={(e) => setConsultantName(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* STEP 4: Upload Receipt Image */}
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>
                  <div style={stepBadgeStyle}>4</div>
                  <div>
                    <h2 style={panelTitleStyle}>Upload Payment Receipt / 上传转账收据凭证</h2>
                    <p style={panelDescStyle}>拍摄转账截图或银行收据，自动附于签约单</p>
                  </div>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                {receiptImage ? (
                  <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0,86,179,0.4)', background: '#000' }}>
                    <img
                      src={receiptImage}
                      alt="Payment Receipt"
                      style={{ width: '100%', maxHeight: 220, objectFit: 'contain' }}
                    />
                    <button
                      type="button"
                      onClick={() => setReceiptImage(null)}
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        background: 'rgba(0,0,0,0.7)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: '#fff',
                        borderRadius: '50%',
                        width: 28,
                        height: 28,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                    <div style={{ padding: '6px 12px', background: 'rgba(16,185,129,0.15)', color: '#34d399', fontSize: 11, textAlign: 'center', fontWeight: 600 }}>
                      <i className="fa-solid fa-check" style={{ marginRight: 6 }} />
                      Receipt Attached (已成功关联付款凭据)
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed rgba(255,255,255,0.15)',
                      borderRadius: 14,
                      padding: '24px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'rgba(255,255,255,0.02)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#0077CC';
                      e.currentTarget.style.background = 'rgba(0,119,204,0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'rgba(0,86,179,0.15)',
                        color: '#6BB8FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 10px',
                        fontSize: 18,
                      }}
                    >
                      <i className="fa-solid fa-camera" />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
                      Click to Photo or Upload Receipt
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(229,229,229,0.45)' }}>
                      Supports PNG, JPG, Bank Transfer Slips
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 5: Digital Signature Pad */}
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>
                  <div style={stepBadgeStyle}>5</div>
                  <div>
                    <h2 style={panelTitleStyle}>Client Signature / 顾客现场电子签名</h2>
                    <p style={panelDescStyle}>支持顾客直接在屏幕上手写签字确认</p>
                  </div>
                </div>

                <div style={{ position: 'relative', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, overflow: 'hidden', background: '#ffffff' }}>
                  <canvas
                    ref={canvasRef}
                    width={480}
                    height={130}
                    style={{ width: '100%', height: 130, display: 'block', touchAction: 'none', cursor: 'crosshair' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  {!hasSignature && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                        color: '#94a3b8',
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      <i className="fa-solid fa-signature" style={{ marginRight: 8 }} />
                      Sign here on screen / 客户请在此签名
                    </div>
                  )}
                  {hasSignature && (
                    <button
                      type="button"
                      onClick={clearSignature}
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        background: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      Clear / 重签
                    </button>
                  )}
                </div>
              </div>

              {/* ACTION: Confirm & Create Project Button */}
              <button
                type="button"
                disabled={isSaving}
                onClick={handleConfirmAndSync}
                style={{
                  background: 'linear-gradient(135deg, #0056B3, #0077CC)',
                  color: '#fff',
                  border: 'none',
                  padding: '18px 28px',
                  borderRadius: 14,
                  fontWeight: 800,
                  fontSize: 16,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 10px 30px rgba(0,86,179,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  transition: 'all 0.2s',
                  opacity: isSaving ? 0.75 : 1,
                }}
              >
                {isSaving ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" />
                    <span>Creating Wedding in Event OS & Generating Summary...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-file-signature" />
                    <span>Confirm & Generate Booking Receipt / 确认签约并开单</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* CONFIRMED SUMMARY & EXPORT VOUCHER VIEW */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Action Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                background: 'rgba(18,20,24,0.85)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: '16px 20px',
                backdropFilter: 'blur(16px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'rgba(16,185,129,0.15)',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  <i className="fa-solid fa-circle-check" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                    Booking Confirmed & Event Synced to System!
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(229,229,229,0.6)' }}>
                    已成功在 Event OS 建立项目档案，并生成正式签约单据凭证。
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  style={{
                    background: '#25D366',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(37,211,102,0.3)',
                  }}
                >
                  <i className="fa-brands fa-whatsapp text-base" />
                  <span>Send via WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPDF}
                  style={{
                    background: 'linear-gradient(135deg, #0056B3, #0077CC)',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <i className="fa-solid fa-file-pdf" />
                  <span>Export Official PDF (导出单据)</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '10px 16px',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <i className="fa-solid fa-print" />
                  <span>Print (打印)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBookingConfirmed(false)}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'rgba(229,229,229,0.7)',
                    padding: '10px 14px',
                    borderRadius: 10,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Edit / 修改
                </button>
              </div>
            </div>

            {/* PRINTABLE / EXPORTABLE OFFICIAL INVOICE / VOUCHER */}
            <div
              ref={printAreaRef}
              id="printable-booking-summary"
              style={{
                background: '#FFFFFF',
                color: '#111827',
                padding: 'clamp(32px, 5vw, 48px)',
                borderRadius: 18,
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                position: 'relative',
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}
            >
              {/* Header with Company Logo & Details */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  paddingBottom: 24,
                  borderBottom: '2px solid #0056B3',
                  marginBottom: 24,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <img
                    src={COMPANY_INFO.logoUrl}
                    alt="ZTO Logo"
                    style={{
                      width: 68,
                      height: 68,
                      objectFit: 'contain',
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                  />
                  <div>
                    <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0056B3', margin: '0 0 2px', letterSpacing: '-0.5px' }}>
                      {COMPANY_INFO.name}
                    </h1>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {COMPANY_INFO.brand} · Reg: {COMPANY_INFO.regNo}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                      HQ: {COMPANY_INFO.address} | Email: {COMPANY_INFO.email}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      Tel / WhatsApp: {COMPANY_INFO.phone} | Web: {COMPANY_INFO.website}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      display: 'inline-block',
                      background: '#0056B3',
                      color: '#ffffff',
                      padding: '6px 14px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginBottom: 8,
                    }}
                  >
                    Bridal Fair Booking Voucher
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                    Ref No: <span style={{ color: '#0056B3' }}>{orderRefNo}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  {consultantName && (
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      Consultant: <strong>{consultantName}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Couple & Wedding Schedule Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#0056B3', marginBottom: 8, letterSpacing: '0.5px' }}>
                    Couple & Client Particulars (新人资料)
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                    {groomName} & {brideName}
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                    <div><strong>Phone / WhatsApp:</strong> {phone}</div>
                    {email && <div><strong>Email:</strong> {email}</div>}
                    <div><strong>Document Status:</strong> <span style={{ color: '#16a34a', fontWeight: 700 }}>Confirmed Booking (已签约确认)</span></div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#0056B3', marginBottom: 8, letterSpacing: '0.5px' }}>
                    Wedding Schedule & Venue (婚礼档期与宴会地点)
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                    {weddingDate || 'Date to be confirmed'}
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                    <div><strong>Session:</strong> {sessionTime}</div>
                    <div><strong>Venue:</strong> {venue || 'TBD (待确认)'}</div>
                    {tables && <div><strong>Estimated Scale:</strong> {tables}</div>}
                  </div>
                </div>
              </div>

              {/* Package & Service Inclusions Table */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                  Contracted Package & Production Inclusions (签约配套与制作清单)
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#0056B3', color: '#ffffff' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', borderRadius: '6px 0 0 0' }}>Item / Service Scope</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center', width: '25%' }}>Status</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right', width: '25%', borderRadius: '0 6px 0 0' }}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ background: '#f1f5f9', fontWeight: 700 }}>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #cbd5e1', color: '#0056B3' }} colSpan={3}>
                        Package Title: {packageName}
                      </td>
                    </tr>
                    {packageItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 14px', color: '#1e293b' }}>
                          <span style={{ color: '#0056B3', marginRight: 8, fontWeight: 700 }}>{idx + 1}.</span>
                          {item}
                        </td>
                        <td style={{ padding: '8px 14px', textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>
                          Included in Package
                        </td>
                        <td style={{ padding: '8px 14px', textAlign: 'right', color: '#64748b' }}>
                          Production Ready
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial & Deposit Summary Table */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, marginBottom: 24 }}>
                
                {/* Terms Box */}
                <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 700, color: '#334155', marginBottom: 4, textTransform: 'uppercase' }}>
                    Terms of Booking & Production Guarantee:
                  </div>
                  <div>1. <strong>Date Securing:</strong> The deposit guarantees technician crew & AV equipment reservation on the event date.</div>
                  <div>2. <strong>Balance Due:</strong> The remaining balance of RM {balanceRemaining.toLocaleString()} shall be settled 14 days prior to event setup.</div>
                  <div>3. <strong>Rescheduling:</strong> Free date postponement allowed subject to hardware schedule availability.</div>
                  <div>4. <strong>Quality Standard:</strong> Backed by Zero To One Event professional sound and lighting engineers.</div>
                </div>

                {/* Amount Calculation Box */}
                <div style={{ background: '#f1f5f9', padding: '16px 20px', borderRadius: 10, border: '1px solid #cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#475569' }}>
                    <span>Package Value (配套原价):</span>
                    <span>RM {packagePrice.toLocaleString()}</span>
                  </div>
                  {fairDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
                      <span>Bridal Fair Rebate (展会特惠):</span>
                      <span>- RM {fairDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottom: '2px solid #cbd5e1', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                    <span>Total Contract Amount (协议总额):</span>
                    <span>RM {totalAmount.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, fontWeight: 800, color: '#16a34a' }}>
                    <span>Deposit Paid (今日已付定金):</span>
                    <span>RM {depositPaid.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 900, color: balanceRemaining > 0 ? '#b45309' : '#16a34a' }}>
                    <span>Balance Remaining (待付尾款):</span>
                    <span>RM {balanceRemaining.toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 10, textAlign: 'right' }}>
                    Payment Mode: <strong>{paymentMethod}</strong>
                  </div>
                </div>
              </div>

              {/* Uploaded Receipt Proof & Signatures Section */}
              <div style={{ display: 'grid', gridTemplateColumns: receiptImage ? '1fr 1.2fr' : '1fr', gap: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                
                {/* Receipt Image Thumbnail if uploaded */}
                {receiptImage && (
                  <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#0056B3', marginBottom: 6, textTransform: 'uppercase' }}>
                      <i className="fa-solid fa-receipt" style={{ marginRight: 6 }} />
                      Verified Payment Receipt (已附转账收据)
                    </div>
                    <img
                      src={receiptImage}
                      alt="Payment Receipt"
                      style={{ maxHeight: 150, maxWidth: '100%', objectFit: 'contain', borderRadius: 6, border: '1px solid #cbd5e1' }}
                    />
                  </div>
                )}

                {/* Signatures */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div style={{ textAlign: 'center', borderTop: '1px solid #cbd5e1', paddingTop: 10 }}>
                    <div style={{ minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {hasSignature && canvasRef.current ? (
                        <img
                          src={canvasRef.current.toDataURL()}
                          alt="Client Signature"
                          style={{ maxHeight: 50, objectFit: 'contain' }}
                        />
                      ) : (
                        <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 13 }}>
                          {groomName || brideName || 'Client Signed on Fair'}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                      Client Signature (客户签名)
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {groomName} & {brideName}
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', borderTop: '1px solid #cbd5e1', paddingTop: 10 }}>
                    <div style={{ minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0056B3', fontWeight: 800, fontSize: 14 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 12, letterSpacing: '1px' }}>ZERO TO ONE EVENT</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>Authorized Production Director</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                      Authorized ZTO Signature
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {consultantName || 'Production Director'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Official Footer */}
              <div style={{ marginTop: 28, paddingTop: 14, borderTop: '1px solid #f1f5f9', textAlign: 'center', fontSize: 10, color: '#94a3b8' }}>
                Thank you for choosing ZERO TO ONE EVENT. System generated via ZTO Event OS Tournament & Production Platform.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Styling Helper Constants
const panelStyle: React.CSSProperties = {
  background: 'rgba(18, 20, 24, 0.75)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 18,
  padding: 'clamp(18px, 3vw, 24px)',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
};

const panelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 18,
  paddingBottom: 14,
  borderBottom: '1px solid rgba(255,255,255,0.06)',
};

const stepBadgeStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: '50%',
  background: '#0056B3',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 13,
  fontWeight: 800,
  flexShrink: 0,
};

const panelTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
  color: '#FFFFFF',
  margin: '0 0 2px',
};

const panelDescStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'rgba(229,229,229,0.5)',
  margin: 0,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'rgba(229,229,229,0.8)',
  marginBottom: 6,
  display: 'block',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(0,0,0,0.45)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  padding: '10px 14px',
  color: '#fff',
  fontSize: 13,
  outline: 'none',
  transition: 'border-color 0.2s',
  fontFamily: 'inherit',
};
