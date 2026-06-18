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

  useEffect(() => {
    supabase.from('projects').select('name').eq('id', projectId).single().then(({ data }) => setProject(data));
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
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [projectId, activeItem, isSold]);

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
    <div style={{ position: 'fixed', inset: 0, background: '#050505', zIndex: 9999, display: 'flex', fontFamily: 'Urbanist, sans-serif' }}>
      
      {/* ── Top Bar (Auction Title) ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '40px 60px', display: 'flex', justifyContent: 'space-between', zIndex: 20, pointerEvents: 'none' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
          LIVE AUCTION
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
          {project?.name || 'EVENT OS'}
        </div>
      </div>

      {/* ── Left Side: Image ── */}
      <div style={{ flex: '1.2', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 }}>
        <AnimatePresence mode="wait">
          <motion.img 
            key={activeItem.image_url}
            src={activeItem.image_url || '/placeholder.png'} 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ width: '60%', height: '60%', objectFit: 'contain', borderRadius: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}
          />
        </AnimatePresence>
      </div>

      {/* ── Right Side: Details & Bidding ── */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', padding: '80px 80px 80px 40px', justifyContent: 'center' }}>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.6 }}
          >
            <div style={{ display: 'inline-block', padding: '8px 16px', background: 'rgba(222,255,154,0.1)', color: '#DEFF9A', borderRadius: 24, fontSize: 16, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 24 }}>
              Current Lot
            </div>
            <h1 style={{ fontSize: 'clamp(3rem, 5vw, 5rem)', fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 24 }}>
              {activeItem.title}
            </h1>
            <p style={{ fontSize: 24, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: 64 }}>
              {activeItem.description}
            </p>
          </motion.div>
        </AnimatePresence>

        <div style={{ flex: 1 }} />

        {/* ── Price and Winner ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12 }}>
              Current Price
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
              <span style={{ fontSize: 40, fontWeight: 700, color: isSold ? '#10b981' : '#4da3ff' }}>RM</span>
              <motion.div 
                key={livePrice}
                initial={{ opacity: 0.5, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                style={{ fontSize: 'clamp(6rem, 10vw, 12rem)', fontWeight: 800, color: isSold ? '#10b981' : '#fff', lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}
              >
                {livePrice.toLocaleString()}
              </motion.div>
            </div>
          </div>

          <AnimatePresence>
            {liveWinner && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: 32, borderLeft: `8px solid ${isSold ? '#10b981' : '#DEFF9A'}` }}
              >
                <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 8 }}>
                  Highest Bidder
                </div>
                <div style={{ fontSize: 48, fontWeight: 800, color: isSold ? '#10b981' : '#DEFF9A' }}>
                  {liveWinner}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* ── Sold Stamp Overlay ── */}
        <AnimatePresence>
          {isSold && (
            <motion.div 
              initial={{ scale: 3, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: -10 }}
              transition={{ type: 'spring', damping: 12, stiffness: 100 }}
              style={{
                position: 'absolute',
                top: '40%',
                right: '15%',
                border: '16px solid #10b981',
                color: '#10b981',
                padding: '24px 64px',
                borderRadius: 24,
                fontSize: 120,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                pointerEvents: 'none',
                boxShadow: '0 0 100px rgba(16, 185, 129, 0.4), inset 0 0 50px rgba(16, 185, 129, 0.4)',
                textShadow: '0 0 20px rgba(16, 185, 129, 0.8)',
                zIndex: 10,
              }}
            >
              SOLD
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
