'use client';

import React, { useState, useEffect, use, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface AuctionItem {
  id: string;
  project_id: string;
  title: string;
  description: string;
  image_url: string;
  starting_price: number;
  current_price: number;
  minimum_increment: number;
  status: string;
  winner_name: string;
  lot_number?: string;
  sponsor?: string;
}

// ── Gold Particle Canvas Background ──────────────────────────
function GoldParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);

    const particles: { x: number; y: number; length: number; speed: number; opacity: number; color: string; }[] = [];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        length: Math.random() * 80 + 30,
        speed: Math.random() * 4 + 1.5,
        opacity: Math.random() * 0.6 + 0.1,
        color: Math.random() > 0.5 ? '#d4af37' : '#fcf6ba'
      });
    }

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Bottom Emerald glow (正阳绿)
      const waveGrad = ctx.createRadialGradient(canvas.width / 2, canvas.height, 0, canvas.width / 2, canvas.height, canvas.width * 0.75);
      waveGrad.addColorStop(0, 'rgba(0, 180, 90, 0.35)'); // Imperial Jade Emerald glow
      waveGrad.addColorStop(0.45, 'rgba(0, 90, 45, 0.15)');
      waveGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = waveGrad;
      ctx.fillRect(0, canvas.height * 0.45, canvas.width, canvas.height * 0.55);

      // Centre-right Gold spotlight
      const spotlight = ctx.createRadialGradient(canvas.width * 0.55, canvas.height * 0.38, 0, canvas.width * 0.55, canvas.height * 0.38, canvas.width * 0.45);
      spotlight.addColorStop(0, 'rgba(212,175,55,0.18)'); // Gold spotlight
      spotlight.addColorStop(0.6, 'rgba(180,140,40,0.06)');
      spotlight.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = spotlight;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Top-left accent (Gold Sheen)
      const topLeft = ctx.createRadialGradient(canvas.width * 0.15, canvas.height * 0.2, 0, canvas.width * 0.15, canvas.height * 0.2, canvas.width * 0.3);
      topLeft.addColorStop(0, 'rgba(212,175,55,0.15)');
      topLeft.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = topLeft;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Golden Meteor Shower (Starlight falling)
      particles.forEach(p => {
        ctx.beginPath();
        const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.length);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.8, p.color);
        grad.addColorStop(1, 'rgba(255,255,255,0.9)');
        
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.globalAlpha = p.opacity;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y + p.length);
        ctx.stroke();

        p.y += p.speed;
        
        if (p.y > canvas.height) { 
          p.y = -p.length - Math.random() * 200; 
          p.x = Math.random() * canvas.width; 
        }
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}

// ── Main Component ─────────────────────────────────────────────
export default function AuctionDisplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const [activeItem, setActiveItem] = useState<AuctionItem | null>(null);
  const [livePrice, setLivePrice] = useState<number>(0);
  const [liveWinner, setLiveWinner] = useState<string>('');
  const [isSold, setIsSold] = useState<boolean>(false);
  const [project, setProject] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [priceImpact, setPriceImpact] = useState(0);  // increment to trigger animation
  const [bidderImpact, setBidderImpact] = useState(0);

  const itemsRef = useRef<AuctionItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const activeItemIdRef = useRef<string | null>(null);
  const isSoldRef = useRef<boolean>(false);

  useEffect(() => {
    activeItemIdRef.current = activeItem?.id || null;
    isSoldRef.current = isSold;
  }, [activeItem, isSold]);

  useEffect(() => {
    supabase.from('projects').select('name').eq('id', projectId).single().then(({ data }) => setProject(data));
    fetchItems();
    fetchLiveState();

    const channel = supabase.channel(`auction_display_gala_${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tool_states' }, payload => {
        const newRecord = payload.new as any;
        if (newRecord && newRecord.project_id === projectId && newRecord.tool_name === 'auction') {
          const state = newRecord.current_state;
          if (!state) return;
          if (state.active_item_id && activeItemIdRef.current !== state.active_item_id) {
            const localItem = itemsRef.current.find(i => i.id === state.active_item_id);
            if (localItem) {
              setActiveItem(localItem);
              setIsSold(localItem.status === 'sold');
            } else {
              fetchItemDetails(state.active_item_id);
            }
          } else if (!state.active_item_id) {
            setActiveItem(null);
          }
          if (state.current_price !== undefined) {
            setLivePrice(p => { if (p !== state.current_price) setPriceImpact(c => c + 1); return state.current_price; });
          }
          if (state.current_winner !== undefined) {
            setLiveWinner(w => { if (w !== state.current_winner) setBidderImpact(c => c + 1); return state.current_winner; });
          }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'auction_items' }, payload => {
        if (payload.new && activeItemIdRef.current === payload.new.id && payload.new.status === 'sold' && !isSoldRef.current) {
          triggerSoldAnimation();
        }
        fetchItems();
      })
      .subscribe();

    // Polling fallback — guarantees updates even if Supabase realtime is not configured
    const pollInterval = setInterval(() => fetchLiveState(), 2000);

    return () => { channel.unsubscribe(); clearInterval(pollInterval); };
  }, [projectId]);

  useEffect(() => {
    const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  };

  const fetchItems = async () => {
    const { data } = await supabase.from('auction_items').select('*').eq('project_id', projectId).order('sort_order', { ascending: true }).order('created_at', { ascending: true });
    if (data) setItems(data);
  };

  const fetchLiveState = async () => {
    const { data } = await supabase.from('tool_states').select('current_state').eq('project_id', projectId).eq('tool_name', 'auction').maybeSingle();
    if (data?.current_state) {
      const state = data.current_state;
      // Switch item only if it changed
      if (state.active_item_id && activeItemIdRef.current !== state.active_item_id) {
        const localItem = itemsRef.current.find(i => i.id === state.active_item_id);
        if (localItem) {
          setActiveItem(localItem);
          setIsSold(localItem.status === 'sold');
        } else {
          await fetchItemDetails(state.active_item_id);
        }
      } else if (!state.active_item_id && activeItemIdRef.current !== null) {
        setActiveItem(null);
      }
      setLivePrice(p => { if (p !== (state.current_price || 0)) setPriceImpact(c => c + 1); return state.current_price || 0; });
      setLiveWinner(w => { if (w !== (state.current_winner || '')) setBidderImpact(c => c + 1); return state.current_winner || ''; });
    } else if (activeItemIdRef.current !== null) {
      setActiveItem(null);
    }
  };

  const fetchItemDetails = async (itemId: string) => {
    const { data } = await supabase.from('auction_items').select('*').eq('id', itemId).single();
    if (data) { setActiveItem(data); if (data.status === 'sold') setIsSold(true); }
  };

  const triggerSoldAnimation = () => {
    setIsSold(true);
    const end = Date.now() + 4000;
    const frame = () => {
      confetti({ particleCount: 8, angle: 60, spread: 60, origin: { x: 0 }, colors: ['#d4af37', '#fcf6ba', '#bf953f', '#ffe066', '#fff'] });
      confetti({ particleCount: 8, angle: 120, spread: 60, origin: { x: 1 }, colors: ['#d4af37', '#fcf6ba', '#bf953f', '#ffe066', '#fff'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  const lotNum = items.length > 0 && activeItem ? (activeItem.lot_number || (items.findIndex(i => i.id === activeItem.id) + 1)) : '';

  /* ─── STANDBY ─── */
  if (!activeItem) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, overflow: 'hidden', fontFamily: '"Noto Serif SC", "STKaiti", "KaiTi", serif', backgroundColor: '#012111' }}>
        <GoldParticleCanvas />
        <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 'clamp(2rem, 6vw, 7rem)', fontWeight: 900, background: 'linear-gradient(135deg, #bf953f 0%, #fcf6ba 30%, #b38728 55%, #fbf5b7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '0.15em', textShadow: 'none' }}>
            竞 拍 进 行 中
          </div>
          <div style={{ color: 'rgba(252,246,186,0.4)', fontSize: 'clamp(1rem, 2vw, 2rem)', marginTop: 24, letterSpacing: '0.3em' }}>Waiting for next item...</div>
        </div>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700;900&display=swap');`}</style>
      </div>
    );
  }

  /* ─── MAIN GALA DISPLAY ─── */
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, overflow: 'hidden', fontFamily: '"Noto Serif SC", "STKaiti", "KaiTi", "Urbanist", serif' }}>

      {/* Layer 0: Gold Particle Canvas */}
      <GoldParticleCanvas />

      {/* Layer -2: Zheng Yang Emerald Green Base (正阳绿) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: -2, backgroundColor: '#012111' }} />

      {/* Layer -1: Dragon & Cloud Watermark Background */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none',
        backgroundImage: "url('/images/dragon_cloud_bg.png')",
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.9,
        filter: 'brightness(1.8) contrast(1.3) hue-rotate(90deg)'
      }} />

      {/* Layer 0.5: Vivid Zheng Yang Emerald Core Glow (正阳绿核心强光) */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none',
        background: 'radial-gradient(circle at center, rgba(0, 200, 90, 0.45) 0%, rgba(0, 100, 45, 0.15) 65%, transparent 100%)',
        mixBlendMode: 'screen'
      }} />

      {/* Layer 1: Edge Shadow */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        boxShadow: 'inset 0 0 120px rgba(0,30,15,0.85)'
      }} />

      {/* Layer 1.5: Grand Imperial Frame (Pan Chang Knot Borders) */}
      <div style={{
        position: 'absolute', inset: 24, zIndex: 1, pointerEvents: 'none',
        border: '3px solid rgba(212,175,55,0.6)',
        outline: '1px solid rgba(252,246,186,0.2)', outlineOffset: '-12px',
        boxShadow: 'inset 0 0 80px rgba(212,175,55,0.1), 0 0 60px rgba(212,175,55,0.2)',
      }}>
        {/* 4 Chinese Knot Corners */}
        {(() => {
          const KnotCorner = () => (
            <svg width="120" height="120" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.8))' }}>
              <g fill="none" stroke="url(#goldGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 50 L50 20 L80 50 L50 80 Z" />
                <path d="M35 35 L65 65 M35 65 L65 35" strokeWidth="2" />
                <path d="M50 20 C50 0 30 0 30 20 L50 40" />
                <path d="M50 20 C50 0 70 0 70 20 L50 40" />
                <path d="M20 50 C0 50 0 30 20 30 L40 50" />
                <path d="M20 50 C0 50 0 70 20 70 L40 50" />
                <path d="M80 50 C100 50 100 30 80 30 L60 50" />
                <path d="M80 50 C100 50 100 70 80 70 L60 50" />
                <path d="M50 80 C50 100 30 100 30 80 L50 60" />
                <path d="M50 80 C50 100 70 100 70 80 L50 60" />
                <path d="M0 0 L25 25" strokeWidth="3" />
                <path d="M15 0 L15 15 L0 15" strokeWidth="2" />
              </g>
              <defs>
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#bf953f" />
                  <stop offset="40%" stopColor="#fcf6ba" />
                  <stop offset="60%" stopColor="#d4af37" />
                  <stop offset="100%" stopColor="#aa7c11" />
                </linearGradient>
              </defs>
            </svg>
          );
          return (
            <>
              <div style={{ position: 'absolute', top: -3, left: -3 }}><KnotCorner /></div>
              <div style={{ position: 'absolute', top: -3, right: -3, transform: 'scaleX(-1)' }}><KnotCorner /></div>
              <div style={{ position: 'absolute', bottom: -3, left: -3, transform: 'scaleY(-1)' }}><KnotCorner /></div>
              <div style={{ position: 'absolute', bottom: -3, right: -3, transform: 'scaleX(-1) scaleY(-1)' }}><KnotCorner /></div>
            </>
          );
        })()}
      </div>

      {/* Layer 2: Content */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          style={{ position: 'absolute', top: 18, right: 18, zIndex: 100, background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: 'rgba(252,246,186,0.5)', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.15)'; }}
        >
          <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'}`} style={{ fontSize: 14 }} />
        </button>

        {/* ── HEADER — Centered Event Name ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6vh 8vw 0 8vw', flexShrink: 0, textAlign: 'center', position: 'relative' }}>
          {/* Chinese name — 楷体 gold large */}
          {project?.name && (() => {
            const name = project.name as string;
            const match = name.match(/^([\u4e00-\u9fff\u3000-\u303f\uff00-\uffef\s]+?)\s*([A-Za-z].*)$/);
            const chinesePart = match ? match[1].trim() : name;
            const englishPart = match ? match[2].trim() : '';
            return (
              <>
                <div style={{
                  fontSize: 'clamp(1.2rem, 2.8vw, 3.8rem)',
                  fontWeight: 900,
                  fontFamily: '"Noto Serif SC", "STKaiti", "KaiTi", serif',
                  letterSpacing: '0.12em',
                  lineHeight: 1.2,
                  background: 'linear-gradient(135deg, #bf953f 0%, #fcf6ba 30%, #d4af37 55%, #fbf5b7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 2px 8px rgba(212,175,55,0.4))',
                }}>
                  {chinesePart}
                </div>
                {englishPart && (
                  <div style={{
                    fontSize: 'clamp(9px, 1vw, 14px)',
                    fontWeight: 600,
                    fontFamily: '"Urbanist", sans-serif',
                    letterSpacing: '0.18em',
                    color: 'rgba(252,246,186,0.55)',
                    textTransform: 'uppercase',
                    marginTop: 'clamp(2px, 0.5vh, 8px)',
                    lineHeight: 1.4,
                  }}>
                    {englishPart}
                  </div>
                )}
              </>
            );
          })()}
        </div>


        {/* ── MAIN BODY ── */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2vh 5vw 4vh 5vw', gap: '5vw', overflow: 'hidden' }}>

          {/* LEFT — Holy Frame Image */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, exit: { duration: 0.15 }, ease: 'easeOut' }}
              style={{ flexShrink: 0, position: 'relative', width: 'clamp(240px, 36vw, 540px)', height: 'clamp(240px, 36vw, 540px)' }}
            >
              {/* Classical Wood & Gold Frame */}
              <div style={{
                position: 'absolute', inset: -14,
                borderRadius: 'clamp(20px, 3vw, 42px)',
                background: 'linear-gradient(145deg, #3a2200, #180b00)',
                padding: 8, zIndex: 1,
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.9), 0 0 50px rgba(212, 175, 55, 0.6)',
                animation: 'pulse 3s infinite'
              }}>
                <div style={{
                  position: 'absolute', inset: 8,
                  borderRadius: 'clamp(14px, 2.5vw, 34px)',
                  background: 'linear-gradient(135deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #d4af37)',
                  padding: 4,
                  boxShadow: '0 0 15px rgba(0,0,0,0.8)'
                }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: 'clamp(10px, 2.2vw, 30px)', background: '#002414', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.9)' }} />
                </div>
              </div>
              
              {/* White card with image */}
              <div className="gala-float" style={{ position: 'relative', width: '100%', height: '100%', background: '#ffffff', borderRadius: 'clamp(12px, 2.2vw, 30px)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)' }}>
                {activeItem.image_url
                  ? <img src={activeItem.image_url} alt={activeItem.title} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4%' }} />
                  : <i className="fa-solid fa-image" style={{ fontSize: 56, color: 'rgba(0,0,0,0.12)' }} />
                }
                {/* Shimmer sweep */}
                <div className="gala-shimmer" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.4) 50%, transparent 75%)', pointerEvents: 'none' }} />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* RIGHT — Info Stack (ENLARGED PRICING SECTIONS) */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'clamp(8px, 2vh, 24px)', overflow: 'visible', flex: 1, minWidth: '40%' }}>

            {/* LOT + Title */}
            <AnimatePresence mode="wait">
              <motion.div key={activeItem.id + '-info'} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, exit: { duration: 0.1 } }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2vw, 28px)', marginBottom: 'clamp(4px, 0.8vh, 12px)', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 'clamp(14px, 1.5vw, 22px)', fontWeight: 800, color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.3em', fontFamily: '"Urbanist", sans-serif', textShadow: '0 0 12px rgba(212,175,55,0.6)', flexShrink: 0 }}>
                    LOT {lotNum}
                  </div>
                  {activeItem.sponsor && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(90deg, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.06) 100%)', border: '1px solid rgba(212,175,55,0.35)', borderRadius: 40, padding: 'clamp(4px,0.5vh,7px) clamp(12px,1.5vw,20px)' }}>
                      <i className="fa-solid fa-hand-holding-heart" style={{ color: '#d4af37', fontSize: 'clamp(13px,1.4vw,20px)', opacity: 0.9 }} />
                      <span style={{ fontSize: 'clamp(13px, 1.4vw, 20px)', fontWeight: 700, color: 'rgba(252,246,186,0.85)', fontFamily: '"Noto Serif SC", serif', letterSpacing: '0.06em' }}>
                        赞助人&nbsp;·&nbsp;{activeItem.sponsor}
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: activeItem.title.length > 30 ? 'clamp(1.2rem, 2.2vw, 2.8rem)' : activeItem.title.length > 15 ? 'clamp(1.5rem, 3vw, 3.8rem)' : 'clamp(1.5rem, 3.5vw, 4.5rem)', fontWeight: 900, lineHeight: 1.15, letterSpacing: '0.02em', background: 'linear-gradient(135deg, #ffffff 0%, #fcf6ba 40%, #fff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 2px 12px rgba(252,246,186,0.3))' }}>
                  {activeItem.title}
                </div>
                {activeItem.description && (
                  <div style={{ fontSize: 'clamp(14px, 1.5vw, 22px)', color: 'rgba(252,246,186,0.7)', marginTop: 'clamp(8px, 1.5vh, 20px)', lineHeight: 1.6, fontFamily: '"Noto Serif SC", serif' }}>
                    {activeItem.description}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Divider */}
            <div style={{ height: 2, background: 'linear-gradient(90deg, rgba(212,175,55,0.8), rgba(212,175,55,0.15))', width: '90%' }} />

            {/* 起拍价 STARTING PRICE (ENLARGED) */}
            <AnimatePresence mode="wait">
              <motion.div key={activeItem.id + '-start'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ exit: { duration: 0.1 } }}>
                <div style={{ fontSize: 'clamp(16px, 1.8vw, 26px)', fontWeight: 700, color: '#fcf6ba', letterSpacing: '0.2em', marginBottom: 'clamp(4px, 0.8vh, 10px)', fontFamily: '"Ma Shan Zheng", "Noto Serif SC", serif' }}>
                  起拍价
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '1vw' }}>
                  <span style={{ fontSize: 'clamp(1.4rem, 2.5vw, 3.2rem)', fontWeight: 800, color: 'rgba(212,175,55,0.75)', lineHeight: 1, flexShrink: 0 }}>RM</span>
                  <span style={{ fontSize: 'clamp(2rem, 4vw, 5.5rem)', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', fontFamily: '"Urbanist", sans-serif', background: 'linear-gradient(180deg, #ffe58f 0%, #d4af37 50%, #aa7c11 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(2px 4px 8px rgba(0,0,0,0.8))' }}>
                    {(activeItem.starting_price || 0).toLocaleString()}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Divider */}
            <div style={{ height: 2, background: 'linear-gradient(90deg, rgba(212,175,55,0.8), rgba(212,175,55,0.15))', width: '90%' }} />

            {/* 现价 CURRENT PRICE (MUCH LARGER & PROMINENT) */}
            <div>
              {livePrice > activeItem.starting_price || liveWinner ? (
                <>
                  <div style={{ fontSize: 'clamp(20px, 2.2vw, 32px)', fontWeight: 900, color: '#ffe066', letterSpacing: '0.25em', marginBottom: 'clamp(6px, 1.2vh, 16px)', fontFamily: '"Ma Shan Zheng", "Noto Serif SC", serif', filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.6))' }}>
                    现价
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '1vw' }}>
                    <span style={{ fontSize: 'clamp(1.8rem, 3.5vw, 4.5rem)', fontWeight: 900, color: '#d4af37', lineHeight: 1, flexShrink: 0, textShadow: '0 0 25px rgba(212,175,55,0.9), 0 0 50px rgba(212,175,55,0.5)' }}>
                      RM
                    </span>
                    
                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                      {/* Golden Ripple Effect for Impact */}
                      <AnimatePresence mode="popLayout">
                        <motion.div
                          key={'ripple-' + priceImpact}
                          initial={{ opacity: 0.8, scale: 1 }}
                          animate={{ opacity: 0, scale: 1.4 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          style={{ position: 'absolute', inset: -10, borderRadius: 20, border: '4px solid rgba(212,175,55,0.9)', pointerEvents: 'none', filter: 'blur(4px)' }}
                        />
                      </AnimatePresence>
                      
                      <motion.span
                        key={'price-' + priceImpact}
                        initial={{ scale: 1.3, textShadow: '0 0 80px rgba(212,175,55,1)' }}
                        animate={{ scale: 1, textShadow: '0 0 25px rgba(212,175,55,0)' }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        style={{ fontSize: 'clamp(3rem, 7.5vw, 9rem)', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', fontFamily: '"Urbanist", "Noto Serif SC", sans-serif', background: 'linear-gradient(180deg, #ffffff 0%, #ffe58f 30%, #d4af37 65%, #aa7c11 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(3px 8px 16px rgba(0,0,0,0.9))', whiteSpace: 'nowrap' }}
                      >
                        {livePrice.toLocaleString()}
                      </motion.span>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 'clamp(20px, 2.5vw, 36px)', fontWeight: 800, color: 'rgba(212,175,55,0.5)', fontFamily: '"Noto Serif SC", serif', letterSpacing: '0.15em', marginTop: '1vh', paddingLeft: '4px' }}>
                  等待出价...
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── WINNING BID POPUP ── */}
        <AnimatePresence>
          {isSold && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{ position: 'absolute', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(1, 20, 10, 0.92)', backdropFilter: 'blur(16px)', pointerEvents: 'none' }}
            >
              <motion.div
                initial={{ scale: 0.8, y: 60 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 18, stiffness: 100, delay: 0.08 }}
                style={{ textAlign: 'center', background: 'linear-gradient(145deg, rgba(212,175,55,0.18) 0%, rgba(1,40,20,0.96) 100%)', border: '2px solid rgba(212,175,55,0.5)', padding: '7vh 9vw', borderRadius: 32, boxShadow: '0 0 80px rgba(212,175,55,0.4), 0 40px 120px rgba(0,10,5,0.95)' }}
              >
                <i className="fa-solid fa-gavel" style={{ fontSize: 'clamp(2rem, 3.5vw, 4.5rem)', color: '#d4af37', marginBottom: '2.5vh', display: 'block', textShadow: '0 0 30px rgba(212,175,55,0.8)' }} />
                <div style={{ fontSize: 'clamp(12px, 1.5vw, 20px)', color: 'rgba(252,246,186,0.8)', textTransform: 'uppercase', letterSpacing: '0.35em', marginBottom: '2vh', fontFamily: '"Urbanist", sans-serif' }}>Successful Bid</div>
                <div style={{ fontSize: 'clamp(3.5rem, 9vw, 12rem)', fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: '2.5vh', textShadow: '0 0 40px rgba(252,246,186,0.4)', fontFamily: '"Urbanist", sans-serif' }}>
                  <span style={{ fontSize: '0.33em', color: '#d4af37', marginRight: '0.8vw', verticalAlign: 'super', textShadow: '0 0 20px rgba(212,175,55,0.8)' }}>RM</span>
                  {livePrice.toLocaleString()}
                </div>
                {liveWinner && (
                  <>
                    <div style={{ fontSize: 'clamp(11px, 1.3vw, 18px)', color: 'rgba(212,175,55,0.5)', textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: '1.5vh', fontFamily: '"Urbanist", sans-serif' }}>Winning Bidder</div>
                    <div style={{ fontSize: 'clamp(2rem, 5.5vw, 7.5rem)', fontWeight: 900, background: 'linear-gradient(135deg, #d4af37 0%, #fcf6ba 35%, #b38728 70%, #ffe066 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-0.01em' }}>
                      {liveWinner}
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* ── CSS Animations ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@700;900&family=Urbanist:wght@700;800;900&display=swap');

        @keyframes gala-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: inset 0 0 10px rgba(0,0,0,0.9), 0 0 40px rgba(212, 175, 55, 0.5); }
          50% { box-shadow: inset 0 0 10px rgba(0,0,0,0.9), 0 0 80px rgba(212, 175, 55, 0.8), 0 0 120px rgba(212, 175, 55, 0.3); }
        }
        @keyframes gala-shimmer-sweep {
          0% { transform: translateX(-160%); }
          100% { transform: translateX(260%); }
        }
        .gala-float {
          animation: gala-float 4.5s ease-in-out infinite;
        }
        .gala-shimmer {
          animation: gala-shimmer-sweep 4s ease-in-out infinite 1.2s;
        }
      `}</style>
    </div>
  );
}

