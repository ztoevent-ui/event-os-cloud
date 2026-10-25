'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
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

// Preset Wedding Packages exactly matched from Official Bridal Fair PDF
const PRESET_PACKAGES = [
  {
    id: 'package_a',
    name: '🌸 Wedding Package A',
    subtitle: 'Classic Wedding Decoration & Reception Butler (婚宴现场布置与管家)',
    price: 9888,
    fairDiscount: 0,
    depositSuggestion: 2000,
    hasAddon: false,
    addonTitle: '',
    addonNormalPrice: 0,
    addonPromoPrice: 0,
    inclusions: [
      'Wedding Decoration — Reception Table (迎宾桌花艺与摆设布置)',
      'Wedding Decoration — VIP Table (贵宾主桌专属花艺)',
      'Wedding Decoration — Arch (经典入场拱门)',
      'Wedding Decoration — Walkway (Non-Lighting: 8pcs Flower Pillars with Hotel\'s Carpet, No Spotlights / 8组花柱+酒店地毯)',
      'Wedding Decoration — Photobooth Drapping Backdrop (16ft x 10ft Fabric Backdrop, Name, Flower Pillars, Flower Arrangement, Spotlights, Carpet)',
      'Wedding Decoration — LED Screen Design (Fixed standard design — no customization for background/logo)',
      'Wedding Butler — Wedding Reception Only (晚宴现场管家督导)',
      'Wedding Butler — Rehearsal x 1 Night (晚间婚礼彩排 1 次)',
      'Wedding Butler — Max 300 guest party (最高 300 宾客 / 3pax crew 3位专业督导团队)',
      'Bridal Hand Bouquet — Fresh Flower (新娘精美鲜花手捧花)',
      'Corsage — 4 pcs (新人与主婚人胸花 4 朵)',
    ],
    terms: 'Valid until 31 December 2027. Only the photobooth design is customizable. All other items included in this package are fixed and are not allowed to be replaced, or exchanged for other items.',
  },
  {
    id: 'package_b',
    name: '🌿 Wedding Package B',
    subtitle: 'Signature Full-Day Butler, Solid Photobooth & Car Deco (全天婚礼管家与硬板打卡墙)',
    price: 12888,
    fairDiscount: 0,
    depositSuggestion: 3000,
    hasAddon: true,
    addonTitle: 'Video Guestbook (复古视频/语音留言机)',
    addonNormalPrice: 1688,
    addonPromoPrice: 888, // Save RM 800!
    inclusions: [
      'Wedding Decoration — Reception Table (迎宾桌花艺与摆设布置)',
      'Wedding Decoration — VIP Table (贵宾主桌专属花艺)',
      'Wedding Decoration — Stage Side Deco (主舞台两侧立体美化装饰)',
      'Wedding Decoration — Arch (入场拱门)',
      'Wedding Decoration — Walkway (Non-Lighting: 8pcs Flower Pillars with Hotel\'s Carpet, No Spotlights / 8组花柱+酒店地毯)',
      'Wedding Decoration — Photobooth Solid Backdrop (16ft x 9ft Flower Arrangement Plain Solid Backdrop, Spotlights, Carpet — Design & Color Customizable)',
      'Wedding Decoration — LED Screen Design (Customizable design, final result subject to technical feasibility)',
      'Wedding Butler — Morning Ceremony (早上迎亲/出门仪式全程统筹督导)',
      'Wedding Butler — Wedding Reception (晚宴盛典全程统筹督导)',
      'Wedding Butler — Rehearsal x 1 Night (晚间婚礼彩排 1 次)',
      'Wedding Butler — Max 300 guest party (最高 300 宾客服务)',
      'Bridal Hand Bouquet — Fresh Flower (Dried Flower / Fresh Flower 鲜花或永生花手捧花)',
      'Corsage — 8 pcs (新人与贵宾胸花 8 朵)',
      'Bridal Car Deco — 1 Car Only (1 time car cash) (1辆新娘主婚车扎花装饰)',
    ],
    terms: 'Valid until 31 December 2027. Only the photobooth design is customizable. All other items included in this package are fixed and are not allowed to be replaced, or exchanged for other items.',
  },
  {
    id: 'package_c',
    name: '👑 Wedding Package C',
    subtitle: 'Luxury 3D Flower Arch, Lighting Walkway & Photo Gallery (立体花艺拱门与发光路引奢华配套)',
    price: 16888,
    fairDiscount: 0,
    depositSuggestion: 5000,
    hasAddon: true,
    addonTitle: 'Video Guestbook (复古视频/语音留言机)',
    addonNormalPrice: 1688,
    addonPromoPrice: 788, // Save RM 900!
    inclusions: [
      'Wedding Decoration — Reception Table (迎宾桌花艺与精美摆设布置)',
      'Wedding Decoration — VIP Table (贵宾主桌专属花艺)',
      'Wedding Decoration — Stage Side Deco (主舞台两侧立体奢华花艺装饰)',
      'Wedding Decoration — 3D Flower Arch (7ft Height 7尺高立体3D梦幻花艺拱门)',
      'Wedding Decoration — Walkway with Lighting (8pcs Lighting Standee with Flower Arrangement & Hotel\'s Carpet — Design Changeable)',
      'Wedding Decoration — Photo Gallery (3 Set 精美相框展示画架 3 组)',
      'Wedding Decoration — Photobooth Solid Backdrop (16ft x 9ft Customized Backdrop, Lighting, Spotlights, Flower Arrangement — Design & Color Customizable)',
      'Wedding Decoration — LED Screen Design (Customizable High-End Design, subject to technical feasibility)',
      'Wedding Butler — Morning Ceremony (早上迎亲仪式全程统筹)',
      'Wedding Butler — Wedding Reception (晚宴盛典全程统筹)',
      'Wedding Butler — Rehearsal x 1 Night (晚间婚礼彩排 1 次)',
      'Wedding Butler — Special Timing Cue (专业音乐灯光节点精准控场)',
      'Wedding Butler — Max 300 guest party (最高 300 宾客服务)',
      'Bridal Hand Bouquet — Fresh Flower (Dried Flower / Fresh Flower 鲜花或永生花手捧花)',
      'Corsage — 12 pcs (新人与贵宾胸花 12 朵)',
      'Bridal Car Deco — 1 Car Only (1 time car cash) (1辆新娘主婚车奢华扎花装饰)',
    ],
    terms: 'Valid until 31 December 2027. Only the photobooth design is customizable. All other items included in this package are fixed and are not allowed to be replaced, or exchanged for other items.',
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
  const [selectedPresetId, setSelectedPresetId] = useState<string>('package_a');
  const [packageName, setPackageName] = useState(PRESET_PACKAGES[0].name);
  const [packageItems, setPackageItems] = useState<string[]>(PRESET_PACKAGES[0].inclusions);
  const [packageTerms, setPackageTerms] = useState<string>(PRESET_PACKAGES[0].terms);
  const [newItemText, setNewItemText] = useState('');
  const [packagePrice, setPackagePrice] = useState<number>(PRESET_PACKAGES[0].price);
  
  // Special Add-on Video Guestbook State
  const [includeVideoGuestbook, setIncludeVideoGuestbook] = useState(false);
  
  const [fairDiscount, setFairDiscount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('Bridal Fair On-Site Sign-up Rebate (婚博会现场签约特惠立减)');
  const [depositPaid, setDepositPaid] = useState<number>(PRESET_PACKAGES[0].depositSuggestion);
  const [paymentMethod, setPaymentMethod] = useState('DuitNow QR Instant Transfer');
  const [consultantName, setConsultantName] = useState('');

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

  // iPad Handover & QR Sync State
  const [showIpadQRModal, setShowIpadQRModal] = useState(false);
  const [isWaitingForIpad, setIsWaitingForIpad] = useState(false);
  const [remoteSignatureImage, setRemoteSignatureImage] = useState<string | null>(null);
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [recentDrafts, setRecentDrafts] = useState<any[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [hostOrigin, setHostOrigin] = useState('');

  const currentPreset = PRESET_PACKAGES.find(p => p.id === selectedPresetId) || PRESET_PACKAGES[0];

  // Calculate Addon Price
  let resolvedAddonPrice = 0;
  if (includeVideoGuestbook && currentPreset.hasAddon) {
    resolvedAddonPrice = currentPreset.addonPromoPrice;
  }

  // Calculate totals
  const totalAmount = Math.max(0, packagePrice + resolvedAddonPrice - fairDiscount);
  const balanceRemaining = Math.max(0, totalAmount - depositPaid);

  // Auto-generate reference number and setup host origin on load
  useEffect(() => {
    const today = new Date();
    const yymm = today.getFullYear().toString().slice(2) + String(today.getMonth() + 1).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    setOrderRefNo(`ZTO-BF-${yymm}-${rand}`);

    if (typeof window !== 'undefined') {
      setHostOrigin(window.location.origin);
    }
  }, []);

  const ipadSignUrl = `${hostOrigin || 'https://ztoevent.com'}/projects/bridal-fair/sign?ref=${orderRefNo}`;

  // Real-time Polling for iPad Signature
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isWaitingForIpad && orderRefNo && !bookingConfirmed) {
      timer = setInterval(async () => {
        try {
          const { data } = await supabase
            .from('projects')
            .select('status, meeting_notes, id')
            .eq('slug', orderRefNo)
            .single();

          if (data?.meeting_notes) {
            try {
              const parsed = JSON.parse(data.meeting_notes);
              if (parsed.signatureImage || data.status === 'confirmed') {
                if (parsed.signatureImage) {
                  setRemoteSignatureImage(parsed.signatureImage);
                }
                setCreatedProjectId(data.id);
                setHasSignature(true);
                setIsWaitingForIpad(false);
                setShowIpadQRModal(false);
                setBookingConfirmed(true);
              }
            } catch (e) {
              console.error('Error parsing meeting_notes during iPad polling:', e);
            }
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 2000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isWaitingForIpad, orderRefNo, bookingConfirmed]);

  // Handle Preset Select
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = PRESET_PACKAGES.find(p => p.id === presetId);
    if (preset) {
      setPackageName(preset.name);
      setPackageTerms(preset.terms);
      let items = [...preset.inclusions];
      if (includeVideoGuestbook && preset.hasAddon) {
        items.push(`Special Add-On: Video Guestbook (视频/音频复古留言亭机 — 特惠 +RM ${preset.addonPromoPrice})`);
      }
      setPackageItems(items);
      setPackagePrice(preset.price);
      setFairDiscount(preset.fairDiscount);
      setDepositPaid(preset.depositSuggestion);
    }
  };

  // Toggle Video Guestbook Add-on
  const handleToggleAddon = (checked: boolean) => {
    setIncludeVideoGuestbook(checked);
    const addonText = `Special Add-On: Video Guestbook (视频/音频复古留言亭机 — 特惠 +RM ${currentPreset.addonPromoPrice})`;
    if (checked) {
      if (!packageItems.some(i => i.includes('Video Guestbook'))) {
        setPackageItems([...packageItems, addonText]);
      }
    } else {
      setPackageItems(packageItems.filter(i => !i.includes('Video Guestbook')));
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

  // Build Order Data Payload
  const buildOrderPayload = (signature?: string | null, status: 'draft' | 'confirmed' = 'confirmed') => ({
    orderRefNo,
    groomName: groomName.trim(),
    brideName: brideName.trim(),
    phone: phone.trim(),
    email: email.trim(),
    weddingDate,
    sessionTime,
    venue: venue.trim(),
    tables: tables.trim(),
    selectedPresetId,
    packageName,
    packagePrice,
    packageItems,
    packageTerms,
    includeVideoGuestbook,
    addonPromoPrice: currentPreset.addonPromoPrice,
    fairDiscount,
    discountReason: discountReason.trim(),
    depositPaid,
    balanceRemaining,
    totalAmount,
    paymentMethod,
    consultantName: consultantName.trim(),
    receiptImage,
    signatureImage: signature || remoteSignatureImage || null,
    status,
    updatedAt: new Date().toISOString(),
  });

  // Save Draft to DB & Handover to iPad for Signing
  const handleSaveDraftAndShowQR = async () => {
    if (!groomName.trim() || !brideName.trim()) {
      alert('请先输入新郎与新娘姓名 (Please enter Groom and Bride names)');
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
      const projectName = `${groomName.trim()} & ${brideName.trim()} Wedding Banquet (${packageName.split(' ')[1] || 'Wedding'})`;
      const orderData = buildOrderPayload(null, 'draft');

      // Check if project already exists with this slug
      const { data: existing } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', orderRefNo)
        .maybeSingle();

      let projId = existing?.id;

      if (existing) {
        await supabase
          .from('projects')
          .update({
            name: projectName,
            venue: venue || null,
            start_date: weddingDate,
            end_date: weddingDate,
            status: 'draft',
            meeting_notes: JSON.stringify(orderData),
          })
          .eq('id', existing.id);
      } else {
        const { data: newProj, error: insertErr } = await supabase
          .from('projects')
          .insert({
            name: projectName,
            type: 'wedding',
            venue: venue || null,
            start_date: weddingDate,
            end_date: weddingDate,
            status: 'draft',
            slug: orderRefNo,
            meeting_notes: JSON.stringify(orderData),
          })
          .select()
          .single();

        if (insertErr) {
          console.error(insertErr);
        } else {
          projId = newProj?.id;
        }
      }

      if (projId) {
        setCreatedProjectId(projId);
      }

      setShowIpadQRModal(true);
      setIsWaitingForIpad(true);
    } catch (err: any) {
      console.error(err);
      alert('保存草稿失败: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm Booking directly on PC & Sync to Event Management
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
      const projectName = `${groomName.trim()} & ${brideName.trim()} Wedding Banquet (${packageName.split(' ')[1] || 'Wedding'})`;
      const signatureImg = canvasRef.current && hasSignature ? canvasRef.current.toDataURL('image/png') : remoteSignatureImage;
      const orderData = buildOrderPayload(signatureImg, 'confirmed');

      // Check if existing project
      const { data: existing } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', orderRefNo)
        .maybeSingle();

      let projId = existing?.id;

      if (existing) {
        await supabase
          .from('projects')
          .update({
            name: projectName,
            venue: venue || null,
            start_date: weddingDate,
            end_date: weddingDate,
            status: 'confirmed',
            meeting_notes: JSON.stringify(orderData),
          })
          .eq('id', existing.id);
      } else {
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert({
            name: projectName,
            type: 'wedding',
            venue: venue || null,
            start_date: weddingDate,
            end_date: weddingDate,
            status: 'confirmed',
            slug: orderRefNo,
            meeting_notes: JSON.stringify(orderData),
          })
          .select()
          .single();

        if (projectError) {
          console.error('Project Insert Error:', projectError);
          alert('建立活动档案遇到提示: ' + projectError.message);
        } else if (newProject) {
          projId = newProject.id;
        }
      }

      if (projId) {
        setCreatedProjectId(projId);

        // Insert into `budgets` table as Confirmed Income
        if (depositPaid > 0) {
          await supabase.from('budgets').insert({
            project_id: projId,
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

  // Load Recent Drafts from Supabase
  const handleOpenDraftsModal = async () => {
    setShowDraftsModal(true);
    try {
      const { data } = await supabase
        .from('projects')
        .select('id, name, slug, start_date, meeting_notes, created_at, status')
        .eq('type', 'wedding')
        .not('slug', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) {
        setRecentDrafts(data);
      }
    } catch (e) {
      console.error('Failed to load drafts:', e);
    }
  };

  const handleApplyDraft = (draft: any) => {
    if (draft.meeting_notes) {
      try {
        const d = JSON.parse(draft.meeting_notes);
        if (d.groomName) setGroomName(d.groomName);
        if (d.brideName) setBrideName(d.brideName);
        if (d.phone) setPhone(d.phone);
        if (d.email) setEmail(d.email);
        if (d.weddingDate) setWeddingDate(d.weddingDate);
        if (d.sessionTime) setSessionTime(d.sessionTime);
        if (d.venue) setVenue(d.venue);
        if (d.tables) setTables(d.tables);
        if (d.selectedPresetId) setSelectedPresetId(d.selectedPresetId);
        if (d.packageName) setPackageName(d.packageName);
        if (d.packageItems) setPackageItems(d.packageItems);
        if (d.packageTerms) setPackageTerms(d.packageTerms);
        if (d.packagePrice) setPackagePrice(d.packagePrice);
        setIncludeVideoGuestbook(!!d.includeVideoGuestbook);
        if (d.fairDiscount !== undefined) setFairDiscount(d.fairDiscount);
        if (d.discountReason) setDiscountReason(d.discountReason);
        if (d.depositPaid !== undefined) setDepositPaid(d.depositPaid);
        if (d.paymentMethod) setPaymentMethod(d.paymentMethod);
        if (d.consultantName) setConsultantName(d.consultantName);
        if (d.receiptImage) setReceiptImage(d.receiptImage);
        if (d.signatureImage) {
          setRemoteSignatureImage(d.signatureImage);
          setHasSignature(true);
        }
        if (d.orderRefNo) setOrderRefNo(d.orderRefNo);
        setCreatedProjectId(draft.id);
        if (draft.status === 'confirmed' || d.signatureImage) {
          setBookingConfirmed(true);
        }
        setShowDraftsModal(false);
      } catch (err) {
        console.error('Failed to parse draft:', err);
      }
    }
  };

  // PDF Export
  const handleExportPDF = async () => {
    const element = printAreaRef.current;
    if (!element) return;

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: [8, 8, 8, 8],
        filename: `${orderRefNo}_${groomName}_${brideName}_${selectedPresetId}.pdf`,
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
      `🎉 恭喜 ${groomName} & ${brideName}！感谢您在婚博会现场签约！\n\n` +
      `📋 签约单据编号：${orderRefNo}\n` +
      `📅 婚礼日期：${weddingDate} (${sessionTime})\n` +
      `🏛️ 宴会场地：${venue || '待定'}\n` +
      `🌸 签约配套：${packageName}\n` +
      `${includeVideoGuestbook ? `🎥 包含特惠加购：Video Guestbook 留言机\n` : ''}` +
      `${fairDiscount > 0 ? `🏷️ 现场签约特惠立减：-RM ${fairDiscount.toLocaleString()} (${discountReason})\n` : ''}` +
      `💰 协议实付总额：RM ${totalAmount.toLocaleString()}\n` +
      `💳 今日已付定金：RM ${depositPaid.toLocaleString()} (${paymentMethod})\n` +
      `💵 待付尾款余额：RM ${balanceRemaining.toLocaleString()}\n\n` +
      `我们已在 Event OS 为您的婚礼建立专属档案与统筹筹备，期待与您携手打造毕生难忘的婚礼盛典！✨`
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
              Bridal Fair Official Packages
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
              婚博会现场官方签约单
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleOpenDraftsModal}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <i className="fa-solid fa-folder-open text-[#6BB8FF]" />
            <span>已存草稿 / 历史单据</span>
          </button>

          <Link
            href="/projects/bridal-fair/sign"
            target="_blank"
            style={{
              background: 'rgba(236,72,153,0.12)',
              border: '1px solid rgba(236,72,153,0.3)',
              color: '#ec4899',
              fontSize: 12,
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: 8,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <i className="fa-solid fa-tablet-screen-button" />
            <span>iPad 签约屏端</span>
          </Link>

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
                    <h2 style={panelTitleStyle}>Official Bridal Fair Package / 签约官方配套</h2>
                    <p style={panelDescStyle}>标准匹配 2026/2027 官方 PDF 套餐配置</p>
                  </div>
                </div>

                {/* Preset Options (A, B, C) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                  {PRESET_PACKAGES.map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset.id)}
                        style={{
                          padding: '14px 16px',
                          borderRadius: 14,
                          background: isSelected
                            ? 'linear-gradient(135deg, rgba(236,72,153,0.18), rgba(0,86,179,0.25))'
                            : 'rgba(255,255,255,0.03)',
                          border: isSelected ? '2px solid #ec4899' : '1px solid rgba(255,255,255,0.08)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s',
                          boxShadow: isSelected ? '0 0 20px rgba(236,72,153,0.25)' : 'none',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{preset.name}</span>
                            {isSelected && (
                              <span style={{ background: '#ec4899', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>
                                SELECTED
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: 'rgba(229,229,229,0.6)', marginTop: 4 }}>
                            {preset.subtitle}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 18, fontWeight: 900, color: '#ec4899' }}>
                            RM {preset.price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Special Add-on: Video Guestbook checkbox (for B and C) */}
                {currentPreset.hasAddon && (
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      borderRadius: 12,
                      padding: '12px 16px',
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleToggleAddon(!includeVideoGuestbook)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={includeVideoGuestbook}
                        onChange={(e) => handleToggleAddon(e.target.checked)}
                        style={{ width: 18, height: 18, accentColor: '#f59e0b', cursor: 'pointer' }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>
                          <i className="fa-solid fa-film" style={{ marginRight: 6 }} />
                          Special Add-On: Video Guestbook (复古视频/语音留言亭)
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(229,229,229,0.6)' }}>
                          原价 NP: RM {currentPreset.addonNormalPrice.toLocaleString()} ➔ 展会签约立省！
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#34d399' }}>
                        + RM {currentPreset.addonPromoPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Package Inclusions List */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={labelStyle}>Package Inclusions Checklist / 配套服务清单明细</label>
                    <span style={{ fontSize: 10, color: '#ec4899', fontWeight: 600 }}>
                      {packageItems.length} Items Included
                    </span>
                  </div>

                  <div
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '10px 14px',
                      maxHeight: 220,
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
                          padding: '5px 0',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <i className="fa-solid fa-circle-check text-xs" style={{ color: '#ec4899' }} />
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
                      placeholder="Add custom item (e.g. 追光灯加一组 / 音响专属调试)"
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
              
              {/* STEP 3: Financials & Special On-Site Discount */}
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>
                  <div style={stepBadgeStyle}>3</div>
                  <div>
                    <h2 style={panelTitleStyle}>Special Discount & Payment / 现场签单特惠与定金</h2>
                    <p style={panelDescStyle}>设置现场签约专属立减、优惠名目、实付定金与待付尾款</p>
                  </div>
                </div>

                {/* Pricing & Discount Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Standard Package Price (配套原价)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: 12, color: 'rgba(229,229,229,0.5)', fontSize: 13 }}>RM</span>
                      <input
                        type="number"
                        value={packagePrice + resolvedAddonPrice}
                        disabled
                        style={{ ...inputStyle, paddingLeft: 42, background: 'rgba(255,255,255,0.04)', opacity: 0.9 }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ ...labelStyle, color: '#f87171', fontWeight: 700 }}>
                      Special On-Site Discount (现场特惠立减) *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: 12, color: '#f87171', fontWeight: 800, fontSize: 13 }}>-RM</span>
                      <input
                        type="number"
                        value={fairDiscount}
                        onChange={(e) => setFairDiscount(Math.max(0, Number(e.target.value)))}
                        style={{ ...inputStyle, paddingLeft: 48, color: '#f87171', fontWeight: 800, fontSize: 15, borderColor: 'rgba(239,68,68,0.4)' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Discount Presets (展会现场快捷立减选项) */}
                <div style={{ marginTop: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: 'rgba(229,229,229,0.6)', marginBottom: 6, fontWeight: 600 }}>
                    ⚡ 展会现场签约特惠快捷立减 (Quick Discount Presets):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {[
                      { label: '无折扣 (RM 0)', amount: 0 },
                      { label: '立减 RM 500', amount: 500 },
                      { label: '特惠 RM 888', amount: 888 },
                      { label: '大促 RM 1,000', amount: 1000 },
                      { label: '特批 RM 1,500', amount: 1500 },
                      { label: '特批 RM 1,888', amount: 1888 },
                      { label: '重磅 RM 2,000', amount: 2000 },
                    ].map((preset) => {
                      const isCurrent = fairDiscount === preset.amount;
                      return (
                        <button
                          type="button"
                          key={preset.amount}
                          onClick={() => {
                            setFairDiscount(preset.amount);
                            if (preset.amount >= 1500) {
                              setDiscountReason('Manager Special Approval (展会现场经理特批立减)');
                            } else if (preset.amount > 0) {
                              setDiscountReason('Bridal Fair On-Site Sign-up Rebate (婚博会现场签约特惠立减)');
                            }
                          }}
                          style={{
                            background: isCurrent ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.04)',
                            border: isCurrent ? '1.5px solid #ef4444' : '1px solid rgba(255,255,255,0.08)',
                            color: isCurrent ? '#f87171' : 'rgba(229,229,229,0.75)',
                            padding: '5px 10px',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: isCurrent ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Discount Reason (立减名目) */}
                {fairDiscount > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ ...labelStyle, fontSize: 11 }}>Discount Reason / 优惠名目 (自动打印于正式单据)</label>
                    <input
                      type="text"
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      placeholder="例如: 婚博会现场签约特惠立减 / 早鸟特惠 / 经理特批"
                      style={{ ...inputStyle, fontSize: 12, color: '#fca5a5', borderColor: 'rgba(239,68,68,0.3)', padding: '8px 12px' }}
                    />
                  </div>
                )}

                {/* Final Total Amount Display with Strikethrough & Savings Badge */}
                <div
                  style={{
                    margin: '14px 0',
                    background: 'linear-gradient(135deg, rgba(236,72,153,0.18), rgba(0,86,179,0.22))',
                    border: '1.5px solid rgba(236,72,153,0.35)',
                    borderRadius: 14,
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#F472B6' }}>
                      Final Agreed Contract Total (协议实付总额)
                    </span>
                    {fairDiscount > 0 && (
                      <div style={{ fontSize: 11, color: 'rgba(229,229,229,0.5)', marginTop: 2 }}>
                        原价: <span style={{ textDecoration: 'line-through' }}>RM {(packagePrice + resolvedAddonPrice).toLocaleString()}</span>
                        <span style={{ marginLeft: 8, color: '#34d399', fontWeight: 700 }}>
                          🔥 现场立省 RM {fairDiscount.toLocaleString()}！
                        </span>
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 24, fontWeight: 900, color: '#FFFFFF' }}>
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
                      style={{ width: '100%', maxHeight: 200, objectFit: 'contain' }}
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
                      e.currentTarget.style.borderColor = '#ec4899';
                      e.currentTarget.style.background = 'rgba(236,72,153,0.05)';
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
                        background: 'rgba(236,72,153,0.15)',
                        color: '#ec4899',
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

              {/* STEP 5: Client Signature & iPad Handover */}
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>
                  <div style={stepBadgeStyle}>5</div>
                  <div>
                    <h2 style={panelTitleStyle}>Client Signature / 顾客现场电子签名</h2>
                    <p style={panelDescStyle}>支持换 iPad 给顾客手写签字，或在本电脑屏幕直接签名</p>
                  </div>
                </div>

                {/* iPad Handover Option Banner (Recommended) */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(0,86,179,0.18))',
                    border: '1.5px solid rgba(236,72,153,0.35)',
                    borderRadius: 14,
                    padding: '16px',
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: 'linear-gradient(135deg, #ec4899, #0056B3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: 18,
                        }}
                      >
                        <i className="fa-solid fa-tablet-screen-button" />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>
                          推荐：电脑填完资料 ➔ 换 iPad 给顾客手写签字
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(229,229,229,0.6)' }}>
                          点击下方按钮自动保存全部资料，生成 iPad 扫码签字二维码
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveDraftAndShowQR}
                      disabled={isSaving}
                      style={{
                        background: 'linear-gradient(135deg, #ec4899, #0056B3)',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 4px 14px rgba(236,72,153,0.35)',
                      }}
                    >
                      <i className="fa-solid fa-qrcode" />
                      <span>保存并唤起 iPad 签名</span>
                    </button>
                  </div>
                </div>

                {/* Local PC Canvas Fallback */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: 'rgba(229,229,229,0.5)', fontWeight: 600 }}>
                      或在本机触控板/触控屏手写签名 (备用):
                    </span>
                    {hasSignature && (
                      <button
                        type="button"
                        onClick={clearSignature}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#f87171',
                          fontSize: 11,
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        Clear / 重写
                      </button>
                    )}
                  </div>

                  <div style={{ position: 'relative', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, overflow: 'hidden', background: '#ffffff' }}>
                    <canvas
                      ref={canvasRef}
                      width={480}
                      height={110}
                      style={{ width: '100%', height: 110, display: 'block', touchAction: 'none', cursor: 'crosshair' }}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                    {!hasSignature && !remoteSignatureImage && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          pointerEvents: 'none',
                          color: '#94a3b8',
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        <i className="fa-solid fa-signature" style={{ marginRight: 6 }} />
                        Sign here on screen / 客户也可直接在此处签名
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                
                {/* 1. Primary Highlight Button: Save & Pass to iPad */}
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveDraftAndShowQR}
                  style={{
                    background: 'linear-gradient(135deg, #ec4899, #0056B3)',
                    color: '#fff',
                    border: 'none',
                    padding: '18px 24px',
                    borderRadius: 14,
                    fontWeight: 900,
                    fontSize: 16,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 10px 30px rgba(236,72,153,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    transition: 'all 0.2s',
                    opacity: isSaving ? 0.75 : 1,
                  }}
                >
                  {isSaving ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" />
                      <span>正在保存签约单草稿并生成签名二维码...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-tablet-screen-button text-xl" />
                      <div style={{ textAlign: 'left' }}>
                        <div>📱 保存并换 iPad 签名 (Save & Sign on iPad)</div>
                        <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.85, marginTop: 2 }}>
                          电脑自动监听，客户在 iPad 签完后本屏幕直接生成正式单据凭证
                        </div>
                      </div>
                    </>
                  )}
                </button>

                {/* 2. Secondary Button: Confirm on this PC */}
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleConfirmAndSync}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(229,229,229,0.85)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '14px 20px',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.2s',
                  }}
                >
                  <i className="fa-solid fa-laptop" />
                  <span>💻 在本电脑直接确认签约开单 (Sign & Confirm on PC)</span>
                </button>
              </div>
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
                padding: 'clamp(28px, 4vw, 44px)',
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
                  paddingBottom: 20,
                  borderBottom: '2px solid #0056B3',
                  marginBottom: 20,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <img
                    src={COMPANY_INFO.logoUrl}
                    alt="ZTO Logo"
                    style={{
                      width: 64,
                      height: 64,
                      objectFit: 'contain',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                  />
                  <div>
                    <h1 style={{ fontSize: 20, fontWeight: 900, color: '#0056B3', margin: '0 0 2px', letterSpacing: '-0.5px' }}>
                      {COMPANY_INFO.name}
                    </h1>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {COMPANY_INFO.brand} · Reg: {COMPANY_INFO.regNo}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
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
                      background: 'linear-gradient(135deg, #ec4899, #0056B3)',
                      color: '#ffffff',
                      padding: '6px 14px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginBottom: 6,
                    }}
                  >
                    Bridal Fair Booking Confirmation
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#0056B3', marginBottom: 6, letterSpacing: '0.5px' }}>
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

                <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#0056B3', marginBottom: 6, letterSpacing: '0.5px' }}>
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
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Contracted Package & Production Inclusions (签约配套与制作清单)</span>
                  <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>Valid until 31 Dec 2027</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#0056B3', color: '#ffffff' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', borderRadius: '6px 0 0 0' }}>Item / Service Scope</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', width: '22%' }}>Status</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', width: '24%', borderRadius: '0 6px 0 0' }}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ background: '#fdf2f8', fontWeight: 700 }}>
                      <td style={{ padding: '8px 12px', borderBottom: '1px solid #cbd5e1', color: '#db2777' }} colSpan={3}>
                        Selected: {packageName} (RM {packagePrice.toLocaleString()})
                      </td>
                    </tr>
                    {packageItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '7px 12px', color: '#1e293b' }}>
                          <span style={{ color: '#0056B3', marginRight: 8, fontWeight: 700 }}>{idx + 1}.</span>
                          {item}
                        </td>
                        <td style={{ padding: '7px 12px', textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>
                          Included in Package
                        </td>
                        <td style={{ padding: '7px 12px', textAlign: 'right', color: '#64748b' }}>
                          Production Ready
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial & Deposit Summary Table */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, marginBottom: 20 }}>
                
                {/* Terms Box directly from PDF */}
                <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 700, color: '#334155', marginBottom: 4, textTransform: 'uppercase' }}>
                    Package Terms & Guarantee (配套细则与品质保障):
                  </div>
                  <div>• <strong>Validity:</strong> This package is valid until <strong>31 December 2027</strong>.</div>
                  <div>• <strong>Customization:</strong> Only the photobooth design is customizable. All other items included in this package are fixed and are not allowed to be replaced, or exchanged for other items.</div>
                  <div>• <strong>Balance Settlement:</strong> The remaining balance of RM {balanceRemaining.toLocaleString()} shall be settled 14 days prior to event.</div>
                  <div>• <strong>Production Assurance:</strong> Professional delivery coordinated by experienced bridal butler and sound engineers.</div>
                </div>

                {/* Amount Calculation Box */}
                <div style={{ background: '#f1f5f9', padding: '14px 18px', borderRadius: 10, border: '1px solid #cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: '#475569' }}>
                    <span>Package Price (配套价):</span>
                    <span>RM {packagePrice.toLocaleString()}</span>
                  </div>
                  {includeVideoGuestbook && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: '#d97706', fontWeight: 600 }}>
                      <span>Video Guestbook (留言亭特惠加购):</span>
                      <span>+ RM {resolvedAddonPrice.toLocaleString()}</span>
                    </div>
                  )}
                  {fairDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: '#dc2626', fontWeight: 700 }}>
                      <span>Special On-Site Rebate ({discountReason || '展会现场签约特惠立减'}):</span>
                      <span>- RM {fairDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 8, borderBottom: '2px solid #cbd5e1', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                    <span>Total Contract Amount (协议总额):</span>
                    <span>RM {totalAmount.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14, fontWeight: 800, color: '#16a34a' }}>
                    <span>Deposit Paid (今日已付定金):</span>
                    <span>RM {depositPaid.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 900, color: balanceRemaining > 0 ? '#b45309' : '#16a34a' }}>
                    <span>Balance Remaining (待付尾款):</span>
                    <span>RM {balanceRemaining.toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 8, textAlign: 'right' }}>
                    Payment Mode: <strong>{paymentMethod}</strong>
                  </div>
                </div>
              </div>

              {/* Uploaded Receipt Proof & Signatures Section */}
              <div style={{ display: 'grid', gridTemplateColumns: receiptImage ? '1fr 1.2fr' : '1fr', gap: 20, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
                
                {/* Receipt Image Thumbnail if uploaded */}
                {receiptImage && (
                  <div style={{ background: '#f8fafc', padding: 10, borderRadius: 10, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#0056B3', marginBottom: 6, textTransform: 'uppercase' }}>
                      <i className="fa-solid fa-receipt" style={{ marginRight: 6 }} />
                      Verified Payment Receipt (已附转账收据凭证)
                    </div>
                    <img
                      src={receiptImage}
                      alt="Payment Receipt"
                      style={{ maxHeight: 130, maxWidth: '100%', objectFit: 'contain', borderRadius: 6, border: '1px solid #cbd5e1' }}
                    />
                  </div>
                )}

                {/* Signatures */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ textAlign: 'center', borderTop: '1px solid #cbd5e1', paddingTop: 8 }}>
                    <div style={{ minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {remoteSignatureImage ? (
                        <img
                          src={remoteSignatureImage}
                          alt="Client Signature"
                          style={{ maxHeight: 45, objectFit: 'contain' }}
                        />
                      ) : hasSignature && canvasRef.current ? (
                        <img
                          src={canvasRef.current.toDataURL()}
                          alt="Client Signature"
                          style={{ maxHeight: 45, objectFit: 'contain' }}
                        />
                      ) : (
                        <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 12 }}>
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

                  <div style={{ textAlign: 'center', borderTop: '1px solid #cbd5e1', paddingTop: 8 }}>
                    <div style={{ minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0056B3', fontWeight: 800, fontSize: 13 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, letterSpacing: '0.5px' }}>ZERO TO ONE EVENT</div>
                        <div style={{ fontSize: 9, color: '#64748b' }}>Authorized Production Director</div>
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

              {/* Bottom Official Collaboration Brands Footer from PDF */}
              <div
                style={{
                  marginTop: 24,
                  paddingTop: 12,
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 8,
                  fontSize: 10,
                  color: '#64748b',
                }}
              >
                <div>
                  Presented by: <strong>Unforgettable Event Planner</strong> & <strong>Sophia Creation Florist</strong> & <strong>Zero To One Event</strong>
                </div>
                <div>
                  Official Bridal Fair Order Voucher · Valid until 31 Dec 2027
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 1: iPad Handover QR Code Modal */}
        {showIpadQRModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(16px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            <div
              style={{
                background: '#121418',
                border: '2px solid rgba(236,72,153,0.4)',
                borderRadius: 24,
                maxWidth: 480,
                width: '100%',
                padding: 30,
                textAlign: 'center',
                boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
                position: 'relative',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowIpadQRModal(false);
                  setIsWaitingForIpad(false);
                }}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                }}
              >
                <i className="fa-solid fa-xmark" />
              </button>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(236,72,153,0.15)',
                  color: '#ec4899',
                  padding: '6px 14px',
                  borderRadius: 100,
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  marginBottom: 12,
                }}
              >
                <i className="fa-solid fa-tablet-screen-button" />
                iPad Handover Signing / 换 iPad 客户签名
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>
                请用 iPad 扫描二维码签字
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(229,229,229,0.6)', margin: '0 0 20px' }}>
                已为您保存草稿【{orderRefNo}】。iPad 扫码后可直接交由客户在屏幕上手写签名。
              </p>

              {/* QR Code Container */}
              <div
                style={{
                  background: '#FFFFFF',
                  padding: 18,
                  borderRadius: 18,
                  display: 'inline-block',
                  margin: '0 auto 18px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                }}
              >
                <QRCodeSVG
                  value={ipadSignUrl}
                  size={200}
                  bgColor="#FFFFFF"
                  fgColor="#0A0B0E"
                  level="Q"
                />
              </div>

              {/* Contract Preview Card in Modal */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  padding: '10px 14px',
                  fontSize: 12,
                  color: 'rgba(229,229,229,0.8)',
                  textAlign: 'left',
                  marginBottom: 18,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, color: '#fff' }}>{groomName} & {brideName}</div>
                  <div style={{ fontSize: 11, color: '#ec4899' }}>{packageName}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'rgba(229,229,229,0.5)' }}>定金已付</div>
                  <div style={{ fontWeight: 800, color: '#34d399' }}>RM {depositPaid.toLocaleString()}</div>
                </div>
              </div>

              {/* Live Listening Status */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  color: '#34d399',
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 18,
                }}
              >
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />
                <span>实时监听中... 客户在 iPad 签完后本屏幕将自动生成正式凭证</span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(ipadSignUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    } catch {}
                  }}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <i className="fa-solid fa-copy" style={{ marginRight: 6 }} />
                  {copiedLink ? '已复制签名链接！' : '复制 iPad 签名链接'}
                </button>

                <a
                  href={ipadSignUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1,
                    background: '#0056B3',
                    color: '#fff',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <i className="fa-solid fa-arrow-up-right-from-square" />
                  <span>直接在当前窗口打开</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: Saved Drafts Modal */}
        {showDraftsModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(16px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            <div
              style={{
                background: '#121418',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 24,
                maxWidth: 620,
                width: '100%',
                padding: 28,
                boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
                position: 'relative',
                maxHeight: '85vh',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>
                    📂 婚博会现场已存草稿与签约历史
                  </h2>
                  <p style={{ fontSize: 12, color: 'rgba(229,229,229,0.5)', margin: '4px 0 0' }}>
                    点击任一项目可立即载入电脑开单系统继续编辑或生成单据
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDraftsModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(229,229,229,0.6)',
                    fontSize: 18,
                    cursor: 'pointer',
                  }}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              {recentDrafts.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(229,229,229,0.4)', fontSize: 13 }}>
                  暂无已保存的草稿记录。
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {recentDrafts.map((draft) => (
                    <div
                      key={draft.id}
                      onClick={() => handleApplyDraft(draft)}
                      style={{
                        padding: '14px 16px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#ec4899';
                        e.currentTarget.style.background = 'rgba(236,72,153,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{draft.name}</span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 100,
                              background: draft.status === 'confirmed' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                              color: draft.status === 'confirmed' ? '#34d399' : '#fbbf24',
                            }}
                          >
                            {draft.status === 'confirmed' ? '已签约确认' : '草稿待签名'}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(229,229,229,0.5)', marginTop: 4 }}>
                          单号: <strong style={{ color: '#6BB8FF' }}>{draft.slug}</strong> · 档期: {draft.start_date || '待定'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#ec4899' }}>载入 ➔</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
  background: '#ec4899',
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
