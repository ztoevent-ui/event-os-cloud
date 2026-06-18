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
        fetchItems(); // Refresh items list to keep sorting accurate if items change
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [projectId, activeItem, isSold]);

  // Handle fullscreen changes triggered by ESC key or F11
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const fetchItems = async () => {
    const { data } = await supabase.from('auction_items').select('*').eq('project_id', projectId).order('sort_order', { ascending: true }).order('created_at', { ascending: true });
    if (data) setItems(data);
  };

  const fetchLiveState = async () => {
    const { data } = await supabase.from('tool_states')
      .select('current_state')
      .eq('project_id', projectId)
      .eq('tool_name', 'auction')
      .maybeSingle();

    if (data?.current_state) {
      if (data.current_state.active_item_id) {
        await fetchItemDetails(data.current_state.active_item_id);
      }
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
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#DEFF9A', '#4da3ff', '#ef4444', '#10b981']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#DEFF9A', '#4da3ff', '#ef4444', '#10b981']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  if (!activeItem) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#050505', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <img src="/zto-logo.png" alt="ZTO" style={{ height: 60, opacity: 0.1, marginBottom: 32 }} onError={(e) => e.currentTarget.style.display='none'} />
        <h1 style={{ color: 'rgba(255,255,255,0.2)', fontSize: 48, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Live Auction</h1>
        <p style={{ color: 'rgba(255,255,255,0.1)', fontSize: 20, marginTop: 16 }}>Waiting for next item...</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#050505', zIndex: 9999, display: 'flex', flexDirection: 'column', fontFamily: 'Urbanist, sans-serif', overflow: 'hidden' }}>
      
      {/* ── Floating Fullscreen Button ── */}
      <button 
        onClick={toggleFullscreen}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 10000,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.4)',
          borderRadius: 8,
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
        }}
        title="Toggle Fullscreen"
      >
        <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'}`} style={{ fontSize: 16 }} />
      </button>

      {/* ══════════════════════════════════════════
          TOP 30%: Item Info (Header Bar + Photo + Title)
      ══════════════════════════════════════════ */}
      <div style={{ height: '30%', display: 'flex', flexDirection: 'column', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        
        {/* Title bar */}
        <div style={{ padding: '3% 5% 0 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 'clamp(12px, 1.4vw, 20px)', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.25em' }}>
            LIVE AUCTION
          </div>
          <div style={{ fontSize: 'clamp(12px, 1.4vw, 20px)', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.15em', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
            {project?.name || 'EVENT OS'}
          </div>
        </div>

        {/* Item info row: image + lot + title + description */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '3%', padding: '2% 5%', overflow: 'hidden' }}>
          
          {/* Item image — compact */}
          <AnimatePresence mode="wait">
            <motion.img
              key={activeItem.image_url}
              src={activeItem.image_url || '/placeholder.png'}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{ height: '100%', maxHeight: 160, width: 'auto', objectFit: 'contain', borderRadius: 12, flexShrink: 0, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
            />
          </AnimatePresence>

          {/* Text info */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{ flex: 1, overflow: 'hidden' }}
            >
              <div style={{ fontSize: 'clamp(11px, 1.2vw, 16px)', fontWeight: 800, color: '#DEFF9A', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 8 }}>
                LOT {items.length > 0 ? items.findIndex(i => i.id === activeItem.id) + 1 : ''}
              </div>
              <h1 style={{ fontSize: 'clamp(1.4rem, 2.8vw, 3.2rem)', fontWeight: 800, color: '#fff', lineHeight: 1.1, margin: 0, marginBottom: 10, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {activeItem.title}
              </h1>
              <p style={{ fontSize: 'clamp(11px, 1.2vw, 16px)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {activeItem.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          BOTTOM 70%: Price (Left) + Bidder (Right)
      ══════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>

        {/* LEFT — Current Price */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '5% 4% 5% 5%', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 'clamp(12px, 1.3vw, 18px)', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: '4%' }}>
            Current Price
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '2%' }}>
            <span style={{ fontSize: 'clamp(1.5rem, 3.5vw, 4rem)', fontWeight: 700, color: isSold ? '#10b981' : '#4da3ff', flexShrink: 0 }}>RM</span>
            <motion.div
              key={livePrice}
              initial={{ opacity: 0.4, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ fontSize: 'clamp(4rem, 12vw, 16rem)', fontWeight: 900, color: isSold ? '#10b981' : '#fff', lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}
            >
              {livePrice.toLocaleString()}
            </motion.div>
          </div>
        </div>

        {/* RIGHT — Bidder Number */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '5% 5% 5% 4%' }}>
          <div style={{ fontSize: 'clamp(12px, 1.3vw, 18px)', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: '4%' }}>
            Highest Bidder
          </div>
          <AnimatePresence mode="wait">
            {liveWinner ? (
              <motion.div
                key={liveWinner}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{ fontSize: 'clamp(4rem, 12vw, 16rem)', fontWeight: 900, color: isSold ? '#10b981' : '#DEFF9A', lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}
              >
                {liveWinner}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ fontSize: 'clamp(2rem, 5vw, 6rem)', fontWeight: 700, color: 'rgba(255,255,255,0.1)', lineHeight: 1 }}
              >
                —
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Winning Bid Popup Overlay ── */}
        <AnimatePresence>
          {isSold && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(5, 5, 5, 0.88)',
                backdropFilter: 'blur(16px)',
                pointerEvents: 'none'
              }}
            >
              <div style={{
                textAlign: 'center',
                background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.12) 0%, rgba(0, 0, 0, 0.9) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '8% 10%',
                borderRadius: 32,
                boxShadow: '0 40px 100px rgba(0,0,0,0.8), inset 0 0 80px rgba(16,185,129,0.08)'
              }}>
                <i className="fa-solid fa-gavel" style={{ fontSize: 'clamp(2rem, 3vw, 4rem)', color: '#10b981', marginBottom: '4%' }} />
                <div style={{ fontSize: 'clamp(12px, 1.5vw, 20px)', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '3%' }}>
                  SUCCESSFUL BID
                </div>
                <div style={{ fontSize: 'clamp(3rem, 8vw, 12rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '4%' }}>
                  <span style={{ fontSize: '0.35em', verticalAlign: 'super', color: '#10b981', marginRight: '2%' }}>RM</span>
                  {livePrice.toLocaleString()}
                </div>
                <div style={{ fontSize: 'clamp(12px, 1.3vw, 18px)', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2%' }}>
                  Winning Bidder
                </div>
                <div style={{ fontSize: 'clamp(3rem, 6vw, 8rem)', fontWeight: 800, color: '#DEFF9A', textShadow: '0 0 40px rgba(222, 255, 154, 0.3)' }}>
                  {liveWinner || 'ANONYMOUS'}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

