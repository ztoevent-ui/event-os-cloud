'use client';

import React, { useState, useEffect, use } from 'react';
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

export default function AuctionDisplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const [activeItem, setActiveItem] = useState<AuctionItem | null>(null);
  const [livePrice, setLivePrice] = useState<number>(0);
  const [liveWinner, setLiveWinner] = useState<string>('');
  const [isSold, setIsSold] = useState<boolean>(false);
  const [project, setProject] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [items, setItems] = useState<AuctionItem[]>([]);

  useEffect(() => {
    supabase.from('projects').select('name').eq('id', projectId).single().then(({ data }) => setProject(data));
    fetchItems();
    fetchLiveState();

    const channel = supabase.channel(`auction_display_${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tool_states', filter: `tool_name=eq.auction` }, payload => {
        if (payload.new && payload.new.project_id === projectId) {
          const state = payload.new.current_state;
          if (state) {
            if (state.active_item_id && (!activeItem || activeItem.id !== state.active_item_id)) {
              fetchItemDetails(state.active_item_id);
              setIsSold(false);
            } else if (!state.active_item_id) {
              setActiveItem(null);
            }
            if (state.current_price !== undefined) setLivePrice(state.current_price);
            if (state.current_winner !== undefined) setLiveWinner(state.current_winner);
          }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'auction_items' }, payload => {
        if (payload.new && activeItem && payload.new.id === activeItem.id) {
          if (payload.new.status === 'sold' && !isSold) {
            triggerSoldAnimation();
          }
        }
        fetchItems();
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [projectId, activeItem, isSold]);

  useEffect(() => {
    const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
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
    if (data) {
      setActiveItem(data);
      if (data.status === 'sold') setIsSold(true);
    }
  };

  const triggerSoldAnimation = () => {
    setIsSold(true);
    const end = Date.now() + 3000;
    const frame = () => {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#DEFF9A', '#4da3ff', '#ef4444', '#10b981'] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#DEFF9A', '#4da3ff', '#ef4444', '#10b981'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  /* ─── STANDBY SCREEN ─── */
  if (!activeItem) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#050505', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', fontFamily: '"Urbanist", sans-serif' }}>
        <h1 style={{ color: 'rgba(255,255,255,0.15)', fontSize: 'clamp(2rem, 5vw, 5rem)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Live Auction</h1>
        <p style={{ color: 'rgba(255,255,255,0.08)', fontSize: 'clamp(1rem, 2vw, 1.5rem)', marginTop: 16, letterSpacing: '0.1em' }}>Waiting for next item...</p>
      </div>
    );
  }

  /* ─── MAIN DISPLAY ─── */
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#050505', zIndex: 9999, display: 'flex', flexDirection: 'column', fontFamily: '"Urbanist", sans-serif', overflow: 'hidden' }}>

      {/* Fullscreen Toggle */}
      <button
        onClick={toggleFullscreen}
        style={{ position: 'absolute', top: 18, right: 18, zIndex: 10000, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
        title="Toggle Fullscreen"
      >
        <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'}`} style={{ fontSize: 14 }} />
      </button>

      {/* ── HEADER: LIVE AUCTION | EVENT NAME ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4vh 5vw 0 5vw', flexShrink: 0 }}>
        <span style={{ fontSize: 'clamp(10px, 1.1vw, 14px)', fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.35em' }}>
          Live Auction
        </span>
        <span style={{ fontSize: 'clamp(10px, 1.1vw, 14px)', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.15em', textAlign: 'right', maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {project?.name || ''}
        </span>
      </div>

      {/* ── MAIN BODY: Image (left) | Price + Bidder (right) ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '3vh 5vw 5vh 5vw', gap: '6vw', overflow: 'hidden' }}>

        {/* LEFT — Animated image card with glow + float + shimmer */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              flexShrink: 0,
              position: 'relative',
              width: 'clamp(200px, 35vw, 520px)',
              height: 'clamp(200px, 35vw, 520px)',
            }}
          >
            {/* Outer glow ring */}
            <div className="auction-glow-ring" style={{
              position: 'absolute',
              inset: -8,
              borderRadius: 'clamp(20px, 3vw, 36px)',
              background: 'transparent',
              border: '2px solid rgba(222,255,154,0.25)',
              zIndex: 0,
            }} />
            {/* Second pulsing ring */}
            <div className="auction-pulse-ring" style={{
              position: 'absolute',
              inset: -20,
              borderRadius: 'clamp(24px, 3.5vw, 42px)',
              background: 'transparent',
              border: '1px solid rgba(222,255,154,0.1)',
              zIndex: 0,
            }} />
            {/* Main white card */}
            <div className="auction-float" style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              background: '#ffffff',
              borderRadius: 'clamp(14px, 2vw, 26px)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 24px 72px rgba(0,0,0,0.75), 0 0 60px rgba(222,255,154,0.12), 0 0 120px rgba(222,255,154,0.06)',
              zIndex: 1,
            }}>
              {activeItem.image_url
                ? <img src={activeItem.image_url} alt={activeItem.title} style={{ width: '86%', height: '86%', objectFit: 'contain' }} />
                : <i className="fa-solid fa-image" style={{ fontSize: 56, color: 'rgba(0,0,0,0.12)' }} />
              }
              {/* Light sweep shimmer overlay */}
              <div className="auction-shimmer" style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)',
                zIndex: 2,
                borderRadius: 'inherit',
                pointerEvents: 'none',
              }} />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* RIGHT — LOT + Title + Price + Bidder stacked vertically */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'clamp(10px, 3vh, 32px)', overflow: 'hidden', minWidth: 0 }}>

          {/* LOT NUMBER + ITEM TITLE */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem.id + '-title'}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div style={{ fontSize: 'clamp(10px, 1.1vw, 15px)', fontWeight: 800, color: '#DEFF9A', textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: 'clamp(4px, 0.8vh, 10px)' }}>
                LOT {items.length > 0 ? items.findIndex(i => i.id === activeItem.id) + 1 : ''}
              </div>
              <div style={{ fontSize: 'clamp(1.2rem, 2.8vw, 3.5rem)', fontWeight: 800, color: '#ffffff', lineHeight: 1.15, letterSpacing: '-0.01em', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {activeItem.title}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* CURRENT PRICE */}
          <div>
            <div style={{ fontSize: 'clamp(9px, 1vw, 14px)', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.28em', marginBottom: 'clamp(4px, 1vh, 14px)' }}>
              Current Price
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.2vw', flexWrap: 'nowrap' }}>
              <span style={{ fontSize: 'clamp(1.4rem, 2.8vw, 4rem)', fontWeight: 800, color: '#4da3ff', lineHeight: 1, flexShrink: 0 }}>
                RM
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={livePrice}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  style={{ fontSize: 'clamp(3rem, 9.5vw, 12rem)', fontWeight: 900, color: '#ffffff', lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', minWidth: 0 }}
                >
                  {livePrice.toLocaleString()}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* HIGHEST BIDDER */}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 'clamp(9px, 1vw, 14px)', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.28em', marginBottom: 'clamp(4px, 1vh, 14px)' }}>
              Highest Bidder
            </div>
            <AnimatePresence mode="wait">
              {liveWinner ? (
                <motion.div
                  key={liveWinner}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  style={{ fontSize: 'clamp(2.2rem, 7.5vw, 10rem)', fontWeight: 900, color: '#DEFF9A', lineHeight: 1.05, letterSpacing: '-0.01em', wordBreak: 'break-word' }}
                >
                  {liveWinner}
                </motion.div>
              ) : (
                <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 'clamp(2rem, 4vw, 5rem)', fontWeight: 700, color: 'rgba(255,255,255,0.07)', lineHeight: 1 }}>
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
            transition={{ duration: 0.35 }}
            style={{ position: 'absolute', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,5,5,0.9)', backdropFilter: 'blur(20px)', pointerEvents: 'none' }}
          >
            <motion.div
              initial={{ scale: 0.86, y: 48 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 110, delay: 0.08 }}
              style={{ textAlign: 'center', background: 'linear-gradient(145deg, rgba(16,185,129,0.1) 0%, rgba(0,0,0,0.96) 100%)', border: '1px solid rgba(16,185,129,0.22)', padding: '7vh 9vw', borderRadius: 32, boxShadow: '0 40px 120px rgba(0,0,0,0.9)' }}
            >
              <i className="fa-solid fa-gavel" style={{ fontSize: 'clamp(1.8rem, 2.8vw, 3.5rem)', color: '#10b981', marginBottom: '2.5vh', display: 'block' }} />
              <div style={{ fontSize: 'clamp(10px, 1.2vw, 16px)', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '1.8vh' }}>Successful Bid</div>
              <div style={{ fontSize: 'clamp(2.5rem, 7.5vw, 10rem)', fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: '2.5vh' }}>
                <span style={{ fontSize: '0.33em', color: '#10b981', marginRight: '0.8vw', verticalAlign: 'super' }}>RM</span>
                {livePrice.toLocaleString()}
              </div>
              <div style={{ fontSize: 'clamp(10px, 1.2vw, 16px)', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: '1.2vh' }}>Winning Bidder</div>
              <div style={{ fontSize: 'clamp(2rem, 5.5vw, 7.5rem)', fontWeight: 900, color: '#DEFF9A', letterSpacing: '-0.01em' }}>{liveWinner || 'ANONYMOUS'}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        @keyframes auction-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes auction-glow-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.015); }
        }
        @keyframes auction-shimmer-sweep {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(250%); }
        }
        .auction-float {
          animation: auction-float 4s ease-in-out infinite;
        }
        .auction-glow-ring {
          animation: auction-glow-pulse 2.5s ease-in-out infinite;
        }
        .auction-pulse-ring {
          animation: auction-glow-pulse 2.5s ease-in-out infinite 0.6s;
        }
        .auction-shimmer {
          animation: auction-shimmer-sweep 3.5s ease-in-out infinite 1s;
        }
      `}</style>

    </div>

  );
}

