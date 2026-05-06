'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

type ShowdownCommand = 'ACTIVATE_LEFT' | 'ACTIVATE_RIGHT' | 'FIRE_VS' | 'RESET';

export default function ShowdownLivePage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [dbTournamentId, setDbTournamentId] = useState<string | null>(null);
  const [bgVideo, setBgVideo] = useState<string | null>(null);
  const [leftPlayer, setLeftPlayer] = useState<string | null>(null);
  const [rightPlayer, setRightPlayer] = useState<string | null>(null);
  
  // Animation states
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const [showVs, setShowVs] = useState(false);

  // 1. Resolve slug to UUID
  useEffect(() => {
    supabase.from('arena_tournaments').select('id').eq('event_id_slug', eventId).single()
      .then(({ data }) => {
        if (data) setDbTournamentId(data.id);
      });
  }, [eventId]);

  // 2. Listen to arena_live_controls
  useEffect(() => {
    if (!dbTournamentId) return;

    // Fetch initial state
    supabase.from('arena_live_controls').select('*').eq('tournament_id', dbTournamentId).single()
      .then(({ data }) => {
        if (data) applyCommand(data);
      });

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`showdown-${dbTournamentId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'arena_live_controls', filter: `tournament_id=eq.${dbTournamentId}` },
        (payload) => {
          applyCommand(payload.new);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [dbTournamentId]);

  const applyCommand = (data: any) => {
    const cmd: ShowdownCommand = data.command;
    
    // Update assets
    setBgVideo(data.background_video_url);
    setLeftPlayer(data.player_left_url);
    setRightPlayer(data.player_right_url);

    if (cmd === 'RESET') {
      setShowLeft(false);
      setShowRight(false);
      setShowVs(false);
    } else if (cmd === 'ACTIVATE_LEFT') {
      setShowLeft(true);
    } else if (cmd === 'ACTIVATE_RIGHT') {
      setShowRight(true);
    } else if (cmd === 'FIRE_VS') {
      setShowLeft(true);
      setShowRight(true);
      setShowVs(true);
      
      // Auto-hide VS impact after a few seconds, or leave it hanging?
      // Usually leave it hanging until RESET.
    }
  };

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative font-['Urbanist']">
      
      {/* 1. BACKGROUND VIDEO LOOP */}
      <AnimatePresence>
        {bgVideo && (
          <motion.video
            key={bgVideo}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            src={bgVideo}
            className="absolute inset-0 w-full h-full object-cover z-0"
            autoPlay loop muted playsInline
          />
        )}
      </AnimatePresence>

      {/* Global dark tint / Grid */}
      <div className="absolute inset-0 z-0 bg-black/40 mix-blend-multiply" />
      <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#0056B3 1px, transparent 1px), linear-gradient(90deg, #0056B3 1px, transparent 1px)', backgroundSize: '100px 100px' }} />

      {/* 2. PLAYERS CONTAINER */}
      <div className="absolute inset-0 z-10 flex">
        
        {/* LEFT PLAYER */}
        <div className="flex-1 relative flex items-end justify-start pl-[5%]">
          <AnimatePresence>
            {showLeft && leftPlayer && (
              <motion.img
                key="left-player"
                src={leftPlayer}
                initial={{ x: '-100%', opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
                animate={{ x: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ x: '-50%', opacity: 0, filter: 'blur(20px)' }}
                transition={{ type: 'spring', damping: 20, stiffness: 100, mass: 1.5 }}
                className="max-h-[90%] object-contain drop-shadow-[0_0_50px_rgba(0,86,179,0.8)] origin-bottom"
              />
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT PLAYER */}
        <div className="flex-1 relative flex items-end justify-end pr-[5%]">
          <AnimatePresence>
            {showRight && rightPlayer && (
              <motion.img
                key="right-player"
                src={rightPlayer}
                initial={{ x: '100%', opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
                animate={{ x: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ x: '50%', opacity: 0, filter: 'blur(20px)' }}
                transition={{ type: 'spring', damping: 20, stiffness: 100, mass: 1.5 }}
                className="max-h-[90%] object-contain drop-shadow-[0_0_50px_rgba(204,255,0,0.4)] origin-bottom"
              />
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* 3. VS LOGO IMPACT */}
      <AnimatePresence>
        {showVs && (
          <motion.div
            key="vs-impact"
            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
          >
            {/* Flash Effect */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="absolute inset-0 bg-[#ccff00] mix-blend-overlay"
            />
            
            {/* The VS Text */}
            <motion.div
              initial={{ scale: 5, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0, rotate: 20 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              className="relative"
            >
              <h1 className="text-[25vw] font-black italic leading-none text-transparent bg-clip-text bg-gradient-to-br from-[#ffffff] via-[#ccff00] to-[#0056B3]" style={{ WebkitTextStroke: '4px #000' }}>
                VS
              </h1>
              {/* Glow layers */}
              <div className="absolute inset-0 text-[25vw] font-black italic leading-none text-[#ccff00] blur-[40px] mix-blend-screen opacity-60 z-[-1]">
                VS
              </div>
              <div className="absolute inset-0 text-[25vw] font-black italic leading-none text-[#0056B3] blur-[100px] mix-blend-screen opacity-80 z-[-2]">
                VS
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wait indicator if DB not linked */}
      {!dbTournamentId && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black">
          <i className="fa-solid fa-satellite-dish animate-pulse text-[#0056B3] text-6xl" />
        </div>
      )}

    </div>
  );
}
