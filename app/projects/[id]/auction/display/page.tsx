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

    const COLORS = ['#7fffd4', '#40e0d0', '#00ced1', '#00bcd4', '#4dd0e1', '#b2ebf2', '#80deea', '#26c6da', '#00acc1', '#ffffff'];
    const particles: { x: number; y: number; r: number; speed: number; color: string; opacity: number; drift: number; }[] = [];

    for (let i = 0; i < 200; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 2.2 + 0.3,
        speed: Math.random() * 1.0 + 0.25,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        opacity: Math.random() * 0.65 + 0.15,
        drift: (Math.random() - 0.5) * 0.6,
      });
    }

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep ocean blue gradient base
      const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bg.addColorStop(0, '#000d1a');
      bg.addColorStop(0.3, '#001a2e');
      bg.addColorStop(0.65, '#002a3a');
      bg.addColorStop(1, '#003344');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ocean teal glow at bottom (underwater light)
      const waveGrad = ctx.createRadialGradient(canvas.width / 2, canvas.height, 0, canvas.width / 2, canvas.height, canvas.width * 0.75);
      waveGrad.addColorStop(0, 'rgba(0,180,200,0.28)');
      waveGrad.addColorStop(0.45, 'rgba(0,120,150,0.12)');
      waveGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = waveGrad;
      ctx.fillRect(0, canvas.height * 0.45, canvas.width, canvas.height * 0.55);

      // Centre-right cool teal spotlight
      const spotlight = ctx.createRadialGradient(canvas.width * 0.55, canvas.height * 0.38, 0, canvas.width * 0.55, canvas.height * 0.38, canvas.width * 0.45);
      spotlight.addColorStop(0, 'rgba(0,150,180,0.16)');
      spotlight.addColorStop(0.6, 'rgba(0,80,120,0.06)');
      spotlight.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = spotlight;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Top-left dim cyan accent
      const topLeft = ctx.createRadialGradient(canvas.width * 0.15, canvas.height * 0.2, 0, canvas.width * 0.15, canvas.height * 0.2, canvas.width * 0.3);
      topLeft.addColorStop(0, 'rgba(0,200,210,0.10)');
      topLeft.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = topLeft;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Falling gold particles
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;

        p.y += p.speed;
        p.x += p.drift;
        if (p.y > canvas.height + 4) { p.y = -4; p.x = Math.random() * canvas.width; }
        if (p.x < -4) p.x = canvas.width + 4;
        if (p.x > canvas.width + 4) p.x = -4;
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tool_states', filter: `tool_name=eq.auction` }, payload => {
        if (payload.new && payload.new.project_id === projectId) {
          const state = payload.new.current_state;
          if (!state) return;
          if (state.active_item_id && activeItemIdRef.current !== state.active_item_id) {
            fetchItemDetails(state.active_item_id);
            setIsSold(false);
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

    return () => { channel.unsubscribe(); };
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
      if (data.current_state.active_item_id) await fetchItemDetails(data.current_state.active_item_id);
      setLivePrice(data.current_state.current_price || 0);
      setLiveWinner(data.current_state.current_winner || '');
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

  const lotNum = items.length > 0 && activeItem ? items.findIndex(i => i.id === activeItem.id) + 1 : '';

  /* ─── STANDBY ─── */
  if (!activeItem) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, overflow: 'hidden', fontFamily: '"Noto Serif SC", "STKaiti", "KaiTi", serif' }}>
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

      {/* Layer 1: Dark overlay for readability */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'rgba(0,0,0,0.2)', pointerEvents: 'none' }} />

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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3vh 8vw 0 8vw', flexShrink: 0, textAlign: 'center', position: 'relative' }}>
          {/* Small LIVE AUCTION badge on left */}
          <span style={{ position: 'absolute', left: '5vw', top: '50%', transform: 'translateY(-50%)', fontSize: 'clamp(9px, 0.8vw, 12px)', fontWeight: 700, color: 'rgba(212,175,55,0.4)', textTransform: 'uppercase', letterSpacing: '0.35em', fontFamily: '"Urbanist", sans-serif' }}>
            Live Auction
          </span>
          {/* Chinese name — 楷体 gold large */}
          {project?.name && (() => {
            const name = project.name as string;
            // Split at the boundary between CJK and Latin
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
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '3vh 5vw 5vh 5vw', gap: '5vw', overflow: 'hidden' }}>

          {/* LEFT — Holy Frame Image */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              style={{ flexShrink: 0, position: 'relative', width: 'clamp(200px, 34vw, 500px)', height: 'clamp(200px, 34vw, 500px)' }}
            >
              {/* Outer glow aura */}
              <div className="gala-aura" style={{ position: 'absolute', inset: -16, borderRadius: 'clamp(20px, 3vw, 40px)', background: 'transparent', boxShadow: '0 0 60px rgba(212,175,55,0.5), 0 0 120px rgba(212,175,55,0.25), 0 0 200px rgba(180,130,10,0.15)', zIndex: 0 }} />
              {/* Gold border frame */}
              <div style={{ position: 'absolute', inset: -4, borderRadius: 'clamp(18px, 2.5vw, 34px)', background: 'linear-gradient(135deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #d4af37)', zIndex: 1, padding: 3 }}>
                <div style={{ width: '100%', height: '100%', borderRadius: 'clamp(15px, 2vw, 30px)', background: '#0a0500' }} />
              </div>
              {/* White card with image */}
              <div className="gala-float" style={{ position: 'relative', width: '100%', height: '100%', background: '#ffffff', borderRadius: 'clamp(14px, 2vw, 28px)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                {activeItem.image_url
                  ? <img src={activeItem.image_url} alt={activeItem.title} style={{ width: '88%', height: '88%', objectFit: 'contain' }} />
                  : <i className="fa-solid fa-image" style={{ fontSize: 56, color: 'rgba(0,0,0,0.12)' }} />
                }
                {/* Shimmer sweep */}
                <div className="gala-shimmer" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.22) 50%, transparent 75%)', pointerEvents: 'none' }} />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* RIGHT — Info Stack */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'clamp(8px, 2.5vh, 28px)', overflow: 'hidden', minWidth: 0 }}>

            {/* LOT + Title */}
            <AnimatePresence mode="wait">
              <motion.div key={activeItem.id + '-info'} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                <div style={{ fontSize: 'clamp(10px, 1.1vw, 15px)', fontWeight: 800, color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: 'clamp(4px, 0.8vh, 12px)', fontFamily: '"Urbanist", sans-serif', textShadow: '0 0 12px rgba(212,175,55,0.6)' }}>
                  LOT {lotNum}
                </div>
                <div style={{ fontSize: 'clamp(1.3rem, 3vw, 4rem)', fontWeight: 900, lineHeight: 1.2, letterSpacing: '0.02em', background: 'linear-gradient(135deg, #ffffff 0%, #fcf6ba 40%, #fff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 2px 12px rgba(252,246,186,0.3))' }}>
                  {activeItem.title}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Divider */}
            <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(212,175,55,0.6), rgba(212,175,55,0.1))', width: '80%' }} />

            {/* 起拍价 STARTING PRICE */}
            <AnimatePresence mode="wait">
              <motion.div key={activeItem.id + '-start'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ fontSize: 'clamp(9px, 0.95vw, 13px)', fontWeight: 700, color: 'rgba(212,175,55,0.55)', letterSpacing: '0.2em', marginBottom: 'clamp(2px, 0.5vh, 8px)', fontFamily: '"Noto Serif SC", serif' }}>
                  起拍价
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.8vw' }}>
                  <span style={{ fontSize: 'clamp(0.9rem, 1.5vw, 2rem)', fontWeight: 700, color: 'rgba(212,175,55,0.6)', lineHeight: 1, flexShrink: 0 }}>RM</span>
                  <span style={{ fontSize: 'clamp(1.2rem, 2.5vw, 3.2rem)', fontWeight: 800, color: 'rgba(252,246,186,0.55)', lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', fontFamily: '"Urbanist", sans-serif' }}>
                    {(activeItem.starting_price || 0).toLocaleString()}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Divider */}
            <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(212,175,55,0.6), rgba(212,175,55,0.1))', width: '80%' }} />

            {/* 现价 CURRENT PRICE */}
            <div>
              <div style={{ fontSize: 'clamp(9px, 0.95vw, 13px)', fontWeight: 700, color: 'rgba(212,175,55,0.7)', letterSpacing: '0.2em', marginBottom: 'clamp(4px, 1vh, 14px)', fontFamily: '"Noto Serif SC", serif' }}>
                现价
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1vw' }}>
                <span style={{ fontSize: 'clamp(1.4rem, 2.5vw, 3.5rem)', fontWeight: 900, color: '#d4af37', lineHeight: 1, flexShrink: 0, textShadow: '0 0 20px rgba(212,175,55,0.8), 0 0 40px rgba(212,175,55,0.4)' }}>
                  RM
                </span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={livePrice}
                    initial={{ opacity: 0, scale: 1.35, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    style={{ fontSize: 'clamp(3rem, 9vw, 11rem)', fontWeight: 900, color: '#ffffff', lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', textShadow: '0 0 30px rgba(255,255,255,0.5), 0 0 60px rgba(212,175,55,0.3)', fontFamily: '"Urbanist", "Noto Serif SC", sans-serif' }}
                  >
                    {livePrice.toLocaleString()}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(212,175,55,0.6), rgba(212,175,55,0.1))', width: '80%' }} />

            {/* HIGHEST BIDDER */}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 'clamp(9px, 0.95vw, 13px)', fontWeight: 700, color: 'rgba(212,175,55,0.7)', letterSpacing: '0.2em', marginBottom: 'clamp(4px, 1vh, 14px)', fontFamily: '"Noto Serif SC", serif' }}>
                最高出价牌号
              </div>
              <AnimatePresence mode="wait">
                {liveWinner ? (
                  <motion.div
                    key={liveWinner}
                    initial={{ opacity: 0, scale: 1.3, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    style={{ fontSize: 'clamp(2rem, 6.5vw, 8.5rem)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.01em', wordBreak: 'break-word', background: 'linear-gradient(135deg, #d4af37 0%, #fcf6ba 35%, #b38728 65%, #ffe066 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.7))' }}
                  >
                    {liveWinner}
                  </motion.div>
                ) : (
                  <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 'clamp(2rem, 4vw, 5rem)', fontWeight: 700, color: 'rgba(212,175,55,0.12)', lineHeight: 1 }}>
                    —
                  </motion.div>
                )}
              </AnimatePresence>
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
              style={{ position: 'absolute', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,3,0,0.88)', backdropFilter: 'blur(16px)', pointerEvents: 'none' }}
            >
              <motion.div
                initial={{ scale: 0.8, y: 60 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 18, stiffness: 100, delay: 0.08 }}
                style={{ textAlign: 'center', background: 'linear-gradient(145deg, rgba(212,175,55,0.15) 0%, rgba(0,0,0,0.95) 100%)', border: '1px solid rgba(212,175,55,0.4)', padding: '7vh 9vw', borderRadius: 32, boxShadow: '0 0 80px rgba(212,175,55,0.3), 0 40px 120px rgba(0,0,0,0.9)' }}
              >
                <i className="fa-solid fa-gavel" style={{ fontSize: 'clamp(2rem, 3vw, 4rem)', color: '#d4af37', marginBottom: '2.5vh', display: 'block', textShadow: '0 0 30px rgba(212,175,55,0.8)' }} />
                <div style={{ fontSize: 'clamp(11px, 1.3vw, 18px)', color: 'rgba(252,246,186,0.6)', textTransform: 'uppercase', letterSpacing: '0.35em', marginBottom: '2vh', fontFamily: '"Urbanist", sans-serif' }}>Successful Bid</div>
                <div style={{ fontSize: 'clamp(3rem, 8vw, 11rem)', fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: '2.5vh', textShadow: '0 0 40px rgba(252,246,186,0.4)', fontFamily: '"Urbanist", sans-serif' }}>
                  <span style={{ fontSize: '0.33em', color: '#d4af37', marginRight: '0.8vw', verticalAlign: 'super', textShadow: '0 0 20px rgba(212,175,55,0.8)' }}>RM</span>
                  {livePrice.toLocaleString()}
                </div>
                <div style={{ fontSize: 'clamp(11px, 1.3vw, 18px)', color: 'rgba(212,175,55,0.5)', textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: '1.5vh', fontFamily: '"Urbanist", sans-serif' }}>Winning Bidder</div>
                <div style={{ fontSize: 'clamp(2rem, 5.5vw, 7.5rem)', fontWeight: 900, background: 'linear-gradient(135deg, #d4af37 0%, #fcf6ba 35%, #b38728 70%, #ffe066 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-0.01em' }}>
                  {liveWinner || 'ANONYMOUS'}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* ── CSS Animations ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700;900&family=Urbanist:wght@700;800;900&display=swap');

        @keyframes gala-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes gala-aura-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes gala-shimmer-sweep {
          0% { transform: translateX(-160%); }
          100% { transform: translateX(260%); }
        }
        .gala-float {
          animation: gala-float 4.5s ease-in-out infinite;
        }
        .gala-aura {
          animation: gala-aura-pulse 2.8s ease-in-out infinite;
        }
        .gala-shimmer {
          animation: gala-shimmer-sweep 4s ease-in-out infinite 1.2s;
        }
      `}</style>
    </div>
  );
}
