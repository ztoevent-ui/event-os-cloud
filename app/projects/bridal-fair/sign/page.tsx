'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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

interface OrderDetails {
  orderRefNo: string;
  groomName: string;
  brideName: string;
  phone: string;
  email?: string;
  weddingDate: string;
  sessionTime: string;
  venue?: string;
  tables?: string;
  selectedPresetId: string;
  packageName: string;
  packagePrice: number;
  packageItems: string[];
  packageTerms: string;
  includeVideoGuestbook: boolean;
  addonPromoPrice: number;
  fairDiscount: number;
  discountReason?: string;
  depositPaid: number;
  balanceRemaining: number;
  totalAmount: number;
  paymentMethod: string;
  consultantName: string;
  receiptImage?: string | null;
  signatureImage?: string | null;
  signedAt?: string;
}

function BridalFairSignContent() {
  const searchParams = useSearchParams();
  const refFromUrl = searchParams.get('ref') || '';

  const [orderRefNo, setOrderRefNo] = useState(refFromUrl);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [recentDrafts, setRecentDrafts] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Fetch recent drafts if no ref provided
  useEffect(() => {
    async function loadRecentDrafts() {
      try {
        const { data } = await supabase
          .from('projects')
          .select('id, name, slug, start_date, meeting_notes, created_at, status')
          .eq('type', 'wedding')
          .not('slug', 'is', null)
          .order('created_at', { ascending: false })
          .limit(6);
        if (data) {
          setRecentDrafts(data);
        }
      } catch (e) {
        console.error('Error loading recent drafts:', e);
      }
    }

    if (!refFromUrl) {
      loadRecentDrafts();
    }
  }, [refFromUrl]);

  // Load Order by Ref
  const loadOrderByRef = async (ref: string) => {
    if (!ref.trim()) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', ref.trim())
        .single();

      if (error || !data) {
        setErrorMsg(`找不到签约单号「${ref}」，请确认单号或重新扫描二维码。`);
        setOrder(null);
        return;
      }

      if (data.meeting_notes) {
        try {
          const parsed = JSON.parse(data.meeting_notes);
          setOrder(parsed);
          setOrderRefNo(parsed.orderRefNo || ref);
          if (parsed.signatureImage || data.status === 'confirmed') {
            setSubmitted(true);
          }
        } catch {
          setErrorMsg('单据数据格式解析异常，请联系现场技术顾问。');
        }
      } else {
        setErrorMsg('该活动尚未保存完整签约明细。');
      }
    } catch (err: any) {
      setErrorMsg('网络读取错误: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (refFromUrl) {
      loadOrderByRef(refFromUrl);
    }
  }, [refFromUrl]);

  // Canvas drawing handlers with high DPI support
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set display size and buffer size for crisp lines on iPad Retina screens
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0056B3';
  }, [order, submitted]);

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasSignature(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getCanvasPos(e);
    ctx.lineTo(pos.x, pos.y);
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

  // Submit Signature
  const handleSubmitSignature = async () => {
    if (!hasSignature || !canvasRef.current) {
      alert('请在手写区域签名后再点击提交 (Please sign before submitting)');
      return;
    }

    if (!order) return;

    setIsSubmitting(true);

    try {
      const signatureDataUrl = canvasRef.current.toDataURL('image/png');
      const updatedOrder: OrderDetails = {
        ...order,
        signatureImage: signatureDataUrl,
        signedAt: new Date().toISOString(),
      };

      // 1. Update Supabase projects table
      const { data: updatedProject, error: updateError } = await supabase
        .from('projects')
        .update({
          status: 'planning', // Set to planning to ensure it displays actively in Event Management
          meeting_notes: JSON.stringify(updatedOrder),
        })
        .eq('slug', order.orderRefNo)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // 2. Auto-sync Event Management details (Budgets, Tasks, Meeting Archive)
      if (updatedProject) {
        const projId = updatedProject.id;

        // Sync Budgets
        try {
          await supabase.from('budgets').delete().eq('project_id', projId);
          const totalAmt = Number(order.totalAmount || 0);
          const depPaid = Number(order.depositPaid || 0);
          const balRem = Number(order.balanceRemaining || 0);
          const fDisc = Number(order.fairDiscount || 0);

          const budgetItems: any[] = [
            {
              project_id: projId,
              type: 'income',
              category: 'Client Contract',
              item: `[婚博签约合同总额] ${order.packageName} (折后实收 RM ${totalAmt.toLocaleString()})`,
              amount: totalAmt,
              status: 'confirmed',
            },
          ];

          if (depPaid > 0) {
            budgetItems.push({
              project_id: projId,
              type: 'income',
              category: 'Deposit Received',
              item: `[婚博现场定金收款] ${order.paymentMethod || '现场支付'} [单号: ${order.orderRefNo}]`,
              amount: depPaid,
              status: 'paid',
            });
          }

          if (balRem > 0) {
            budgetItems.push({
              project_id: projId,
              type: 'income',
              category: 'Balance Due',
              item: `[待收婚礼尾款余额] 婚前付清 [单号: ${order.orderRefNo}]`,
              amount: balRem,
              status: 'planned',
            });
          }

          if (fDisc > 0) {
            budgetItems.push({
              project_id: projId,
              type: 'expense',
              category: 'Special Discount',
              item: `[现场立减特惠] ${order.discountReason || '婚博会现场签约立减'} [单号: ${order.orderRefNo}]`,
              amount: fDisc,
              status: 'confirmed',
            });
          }

          await supabase.from('budgets').insert(budgetItems);
        } catch (bErr) {
          console.warn('iPad sync budget error:', bErr);
        }

        // Sync Tasks (Wedding milestones)
        try {
          const { count: taskCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projId);

          if (!taskCount || taskCount === 0) {
            await supabase.from('tasks').insert([
              {
                project_id: projId,
                title: `[客户对接] 发送正式签约单据与收据，建立专属婚礼统筹群`,
                description: `联系新郎 ${order.groomName} / 新娘 ${order.brideName} (${order.phone})，确认收据并拉入婚礼专属策划群。`,
                priority: 'high',
                status: 'todo',
                sort_order: 1,
              },
              {
                project_id: projId,
                title: `[场地对接] 预约 ${order.venue || '宴会场地'} 现场测量与工程动线勘测`,
                description: `勘测宴会厅尺寸、迎宾区尺寸、电源插座及背板搭建空间，核实预估 ${order.tables ? order.tables + ' 席' : '待定'} 摆台走向。`,
                priority: 'medium',
                status: 'todo',
                sort_order: 2,
              },
              {
                project_id: projId,
                title: `[物料设计] 启动「${order.packageName}」3D效果图与花艺方案定制`,
                description: `细化迎宾桌、主桌花艺、入场经典大拱门、16ft 拍照背板${order.includeVideoGuestbook ? '及 Video Guestbook 留言机' : ''}设计图。`,
                priority: 'medium',
                status: 'todo',
                sort_order: 3,
              },
              {
                project_id: projId,
                title: `[尾款跟进] 婚礼前14天核对最终出席桌数并收取尾款 RM ${Number(order.balanceRemaining || 0).toLocaleString()}`,
                description: `跟进合同尾款结算，核对现场统筹工程人员与音响、灯光全流程总彩排。`,
                priority: 'critical',
                status: 'todo',
                sort_order: 4,
              },
            ]);
          }
        } catch (tErr) {
          console.warn('iPad sync tasks error:', tErr);
        }

        // Sync Meeting Session Archive Note
        try {
          const { count: sessionCount } = await supabase
            .from('meeting_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projId);

          if (!sessionCount || sessionCount === 0) {
            const markdownContent = [
              `# 💍 婚博会官方现场签约凭证档案`,
              ``,
              `- **签约单号 / Ref No**: ${order.orderRefNo}`,
              `- **新人姓名**: ${order.groomName}（新郎） & ${order.brideName}（新娘）`,
              `- **联系电话 / WhatsApp**: ${order.phone}`,
              `- **电子邮箱**: ${order.email || '未提供'}`,
              `- **婚礼日期**: ${order.weddingDate} (${order.sessionTime || '晚宴'})`,
              `- **预定席位 / 桌数**: ${order.tables ? order.tables + ' 席' : '待定'}`,
              `- **宴会场地**: ${order.venue || '待定'}`,
              `- **签约配套**: ${order.packageName} (原价 RM ${Number(order.packagePrice || 0).toLocaleString()})`,
              order.includeVideoGuestbook ? `- **加购项目**: Video Guestbook 视频/音频复古留言亭机 (+RM ${order.addonPromoPrice || 788})` : null,
              Number(order.fairDiscount) > 0 ? `- **现场立减特惠**: -RM ${Number(order.fairDiscount).toLocaleString()} (${order.discountReason || '婚博会现场签约立减'})` : null,
              `- **协议实付总额**: RM ${Number(order.totalAmount || 0).toLocaleString()}`,
              `- **已付定金**: RM ${Number(order.depositPaid || 0).toLocaleString()} (${order.paymentMethod || '转账/现金'})`,
              `- **待付尾款**: RM ${Number(order.balanceRemaining || 0).toLocaleString()} (婚前付清)`,
              `- **现场顾问 / Consultant**: ${order.consultantName || '官方销售顾问'}`,
              ``,
              `---`,
              `### 📋 配套包含服务清单：`,
              ...(order.packageItems || []).map((item: string) => `* ${item}`),
              ``,
              `---`,
              `### 📜 条款细则与承诺：`,
              order.packageTerms || '依官方正式服务细则执行。',
            ].filter(Boolean).join('\n');

            await supabase.from('meeting_sessions').insert({
              project_id: projId,
              title: `💍 婚博会现场签约官方档案 (${order.orderRefNo})`,
              meeting_date: new Date().toISOString().split('T')[0],
              content: markdownContent,
            });
          }
        } catch (mErr) {
          console.warn('iPad sync meeting session error:', mErr);
        }
      }

      setOrder(updatedOrder);
      setSubmitted(true);

      // Trigger Confetti
      try {
        const confetti = (await import('canvas-confetti')).default;
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // confetti fallback
      }
    } catch (err: any) {
      console.error(err);
      alert('提交签名失败，请重试: ' + (err.message || 'Network error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#090A0D',
        color: '#E5E7EB',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        padding: 'clamp(16px, 3vw, 36px) clamp(12px, 2vw, 24px)',
      }}
    >
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        
        {/* Top Header */}
        <header
          style={{
            background: 'rgba(18, 20, 24, 0.9)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: '16px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            backdropFilter: 'blur(16px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src={COMPANY_INFO.logoUrl}
              alt="ZTO Logo"
              style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8, background: '#fff' }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#6BB8FF', letterSpacing: '-0.3px' }}>
                {COMPANY_INFO.name}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(229,229,229,0.5)' }}>
                Bridal Fair iPad Client Signing Terminal / 顾客手写签约屏
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {orderRefNo && (
              <span
                style={{
                  background: 'rgba(0,86,179,0.2)',
                  color: '#6BB8FF',
                  padding: '4px 10px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  border: '1px solid rgba(0,86,179,0.4)',
                }}
              >
                Ref: {orderRefNo}
              </span>
            )}
            <Link
              href="/projects/bridal-fair"
              style={{
                color: 'rgba(229,229,229,0.6)',
                textDecoration: 'none',
                fontSize: 12,
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              PC 开单工作台
            </Link>
          </div>
        </header>

        {/* Search / Select Bar if no order loaded */}
        {!order && (
          <div
            style={{
              background: 'rgba(18, 20, 24, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 18,
              padding: 24,
              marginBottom: 20,
              backdropFilter: 'blur(20px)',
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
              🔍 输入签约单号或选择待签订单
            </h2>
            <p style={{ fontSize: 12, color: 'rgba(229,229,229,0.5)', marginBottom: 16 }}>
              电脑保存后，可使用 iPad 摄像头直接扫码，或在下方输入单号调出。
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                placeholder="例如: ZTO-BF-2610-8832"
                value={orderRefNo}
                onChange={(e) => setOrderRefNo(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  color: '#fff',
                  fontSize: 14,
                }}
              />
              <button
                type="button"
                onClick={() => loadOrderByRef(orderRefNo)}
                disabled={loading}
                style={{
                  background: '#0056B3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px 24px',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {loading ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-file-contract" />}
                调出签约单
              </button>
            </div>

            {errorMsg && (
              <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: 12 }}>
                <i className="fa-solid fa-circle-exclamation" style={{ marginRight: 6 }} />
                {errorMsg}
              </div>
            )}

            {/* Recent Drafts List */}
            {recentDrafts.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(229,229,229,0.7)', marginBottom: 10, textTransform: 'uppercase' }}>
                  近期待签订单快捷载入:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                  {recentDrafts.map((draft) => (
                    <div
                      key={draft.id}
                      onClick={() => {
                        setOrderRefNo(draft.slug);
                        loadOrderByRef(draft.slug);
                      }}
                      style={{
                        padding: '12px 14px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 10,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#6BB8FF' }}>{draft.slug}</span>
                        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 100, background: draft.status === 'confirmed' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: draft.status === 'confirmed' ? '#34d399' : '#fbbf24' }}>
                          {draft.status === 'confirmed' ? '已签约' : '待签名'}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginTop: 4 }}>
                        {draft.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(229,229,229,0.4)', marginTop: 2 }}>
                        档期: {draft.start_date || '待定'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ORDER REVIEW & SIGNATURE AREA */}
        {order && (
          <div>
            {!submitted ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* 1. Summary Card */}
                <div
                  style={{
                    background: 'rgba(18, 20, 24, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 18,
                    padding: '24px',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16, marginBottom: 16 }}>
                    <div>
                      <span
                        style={{
                          background: 'linear-gradient(135deg, #ec4899, #0056B3)',
                          color: '#fff',
                          padding: '3px 10px',
                          borderRadius: 100,
                          fontSize: 11,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        Official Agreement / 签约协议
                      </span>
                      <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '8px 0 2px' }}>
                        {order.groomName} & {order.brideName} 婚宴预订协议
                      </h1>
                      <div style={{ fontSize: 12, color: 'rgba(229,229,229,0.6)' }}>
                        档期: <strong>{order.weddingDate || '待确认'}</strong> ({order.sessionTime}) · 场地: <strong>{order.venue || '待定'}</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'rgba(229,229,229,0.5)' }}>签约单号</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#6BB8FF' }}>{order.orderRefNo}</div>
                    </div>
                  </div>

                  {/* Financial Overview Chips */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: 12,
                      background: 'rgba(0,0,0,0.3)',
                      padding: 14,
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.06)',
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(229,229,229,0.5)' }}>签约配套</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#ec4899' }}>{order.packageName}</div>
                    </div>
                    {order.fairDiscount > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: '#f87171', fontWeight: 600 }}>
                          现场签单立减 ({order.discountReason || '特惠'})
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#f87171' }}>
                          - RM {order.fairDiscount.toLocaleString()}
                        </div>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(229,229,229,0.5)' }}>协议实付总额</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>RM {order.totalAmount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(229,229,229,0.5)' }}>今日已付定金</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#34d399' }}>RM {order.depositPaid.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(229,229,229,0.5)' }}>待付尾款余额</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#fbbf24' }}>RM {order.balanceRemaining.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Service Inclusions Accordion */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                      配套包含明细 Checklist ({order.packageItems.length} 项):
                    </div>
                    <div style={{ maxHeight: 180, overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                      {order.packageItems.map((item, idx) => (
                        <div key={idx} style={{ fontSize: 12, color: 'rgba(229,229,229,0.85)', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <i className="fa-solid fa-check" style={{ color: '#34d399', fontSize: 11 }} />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Terms Alert */}
                  <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', fontSize: 11, color: '#93c5fd', lineHeight: 1.5 }}>
                    <i className="fa-solid fa-shield-halved" style={{ marginRight: 6 }} />
                    <strong>配套保障与细则：</strong>有效期至 <strong>2027年12月31日</strong>。仅拍照打卡墙设计可协商，其余项目为固定标配。尾款于婚礼前 14 天结清。
                  </div>
                </div>

                {/* 2. Big iPad Signature Canvas Card */}
                <div
                  style={{
                    background: 'rgba(18, 20, 24, 0.95)',
                    border: '2px solid rgba(236,72,153,0.4)',
                    borderRadius: 20,
                    padding: '24px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div>
                      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <i className="fa-solid fa-signature" style={{ color: '#ec4899' }} />
                        客户手写电子签名 / Client Signature
                      </h2>
                      <p style={{ fontSize: 12, color: 'rgba(229,229,229,0.5)', margin: '4px 0 0' }}>
                        请新郎或新娘直接在下方白色触控板手写签名，完成签约授权
                      </p>
                    </div>

                    {hasSignature && (
                      <button
                        type="button"
                        onClick={clearSignature}
                        style={{
                          background: 'rgba(239,68,68,0.15)',
                          color: '#f87171',
                          border: '1px solid rgba(239,68,68,0.3)',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontSize: 12,
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        <i className="fa-solid fa-rotate-left" style={{ marginRight: 4 }} />
                        重新签名
                      </button>
                    )}
                  </div>

                  {/* Tablet Optimized Canvas */}
                  <div
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 14,
                      border: '2px solid #cbd5e1',
                      overflow: 'hidden',
                      position: 'relative',
                      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.06)',
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      style={{
                        width: '100%',
                        height: 220,
                        display: 'block',
                        touchAction: 'none',
                        cursor: 'crosshair',
                      }}
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
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          pointerEvents: 'none',
                          color: '#94a3b8',
                          gap: 6,
                        }}
                      >
                        <i className="fa-solid fa-pen-nib" style={{ fontSize: 28, color: '#cbd5e1' }} />
                        <span style={{ fontSize: 15, fontWeight: 600 }}>
                          在此处手写签名 (Sign Here with Finger / Pencil)
                        </span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>
                          支持手指触摸或 Apple Pencil 笔迹
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="button"
                    disabled={!hasSignature || isSubmitting}
                    onClick={handleSubmitSignature}
                    style={{
                      width: '100%',
                      marginTop: 20,
                      background: hasSignature
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'rgba(255,255,255,0.1)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '18px 24px',
                      borderRadius: 14,
                      fontSize: 17,
                      fontWeight: 800,
                      cursor: hasSignature && !isSubmitting ? 'pointer' : 'not-allowed',
                      boxShadow: hasSignature ? '0 8px 24px rgba(16,185,129,0.4)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      transition: 'all 0.2s',
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin" />
                        <span>正在同步签名并生成官方单据...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-circle-check" />
                        <span>确认手写签名并完成签约 (Confirm & Submit Signature)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* SUCCESS SCREEN AFTER SIGNING */
              <div
                style={{
                  background: '#FFFFFF',
                  color: '#0f172a',
                  borderRadius: 20,
                  padding: 'clamp(28px, 4vw, 44px)',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'rgba(16,185,129,0.15)',
                    color: '#10b981',
                    fontSize: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <i className="fa-solid fa-check" />
                </div>

                <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
                  🎉 签约成功！恭喜新人！
                </h1>
                <p style={{ fontSize: 14, color: '#64748b', maxWidth: 500, margin: '0 auto 16px' }}>
                  尊敬的 <strong>{order.groomName} & {order.brideName}</strong>，您的婚礼签约单已正式建立，电脑端正在自动生成官方单据凭证。
                </p>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', color: '#059669', fontSize: 12, fontWeight: 700, margin: '0 auto 24px' }}>
                  <i className="fa-solid fa-circle-check" />
                  活动档案、定金财务与筹备任务已自动同步录入 Event Management 系统
                </div>

                {/* Signature Preview Thumbnail */}
                {order.signatureImage && (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 12,
                      padding: 16,
                      maxWidth: 400,
                      margin: '0 auto 24px',
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
                      已签署客户手写签名:
                    </div>
                    <img
                      src={order.signatureImage}
                      alt="Verified Signature"
                      style={{ maxHeight: 60, objectFit: 'contain' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link
                    href={`/projects/bridal-fair`}
                    style={{
                      background: '#0056B3',
                      color: '#fff',
                      padding: '12px 24px',
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <i className="fa-solid fa-desktop" />
                    返回电脑开单系统查看完整凭证
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setOrder(null);
                      setOrderRefNo('');
                    }}
                    style={{
                      background: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      padding: '12px 20px',
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    签下一张单
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BridalFairSignPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', background: '#090A0D', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }} />
          Loading iPad Client Signing Portal...
        </div>
      }
    >
      <BridalFairSignContent />
    </Suspense>
  );
}
