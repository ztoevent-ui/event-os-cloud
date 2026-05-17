'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────
export type MatchOverlayStage =
  | 'EMPTY_VS'
  | 'LEFT_PLAYER'
  | 'RIGHT_PLAYER'
  | 'SCORE_BOARD';

interface ClanSide {
  name: string;
  shortName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  players: string[];
}

interface CurrentLiveMatch {
  matchId: string;
  category: string;
  stage: 'Semi-Final' | 'Final';
  scoreA: number;
  scoreB: number;
  team1: ClanSide;
  team2: ClanSide;
}

interface MatchOverlayProps {
  match?: CurrentLiveMatch;
  onStageChange?: (stage: MatchOverlayStage) => void;
}

// ─── Stage order ──────────────────────────────────────────────────────────────
const STAGE_ORDER: MatchOverlayStage[] = [
  'EMPTY_VS', 'LEFT_PLAYER', 'RIGHT_PLAYER', 'SCORE_BOARD',
];

// ─── Demo data (used when no match prop is passed) ────────────────────────────
const DEMO_MATCH: CurrentLiveMatch = {
  matchId: 'demo-uuid-1234',
  category: 'MD1',
  stage: 'Semi-Final',
  scoreA: 0,
  scoreB: 0,
  team1: {
    name: '陈氏公会',
    shortName: 'CHAN',
    primaryColor: '#B22222',
    secondaryColor: '#FFD700',
    players: ['Chan Ah Kow', 'Chan Wei Liang'],
  },
  team2: {
    name: '林氏公会',
    shortName: 'LIM',
    primaryColor: '#006400',
    secondaryColor: '#98FB98',
    players: ['Lim Beng Hock', 'Lim Chong Wei'],
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Animated lightning bolt SVG lines behind VS */
function LightningField() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      viewBox="0 0 2000 1000"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <filter id="glow-yg">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-bl">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Yellow-green bolts from center-left */}
      <motion.path d="M1000,500 L820,200 L760,320 L680,80" stroke="#CCFF00" strokeWidth="2.5" fill="none" filter="url(#glow-yg)"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: [0,1,1,0], opacity: [0,1,1,0] }}
        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }} />
      <motion.path d="M1000,500 L650,600 L590,480 L480,720" stroke="#CCFF00" strokeWidth="1.5" fill="none" filter="url(#glow-yg)"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: [0,1,1,0], opacity: [0,0.7,0.7,0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.8, delay: 0.5, ease: 'easeInOut' }} />

      {/* Royal blue bolts from center-right */}
      <motion.path d="M1000,500 L1180,200 L1240,320 L1320,80" stroke="#4D9FFF" strokeWidth="2.5" fill="none" filter="url(#glow-bl)"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: [0,1,1,0], opacity: [0,1,1,0] }}
        transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.4, delay: 0.3, ease: 'easeInOut' }} />
      <motion.path d="M1000,500 L1350,620 L1410,500 L1520,750" stroke="#4D9FFF" strokeWidth="1.5" fill="none" filter="url(#glow-bl)"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: [0,1,1,0], opacity: [0,0.7,0.7,0] }}
        transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2, delay: 0.8, ease: 'easeInOut' }} />

      {/* Horizontal energy beams */}
      <motion.line x1="0" y1="500" x2="860" y2="500" stroke="#CCFF00" strokeWidth="1" filter="url(#glow-yg)"
        initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: [0,1], opacity: [0, 0.4, 0] }}
        style={{ transformOrigin: '0 500px' }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2.5, ease: 'easeOut' }} />
      <motion.line x1="2000" y1="500" x2="1140" y2="500" stroke="#4D9FFF" strokeWidth="1" filter="url(#glow-bl)"
        initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: [0,1], opacity: [0, 0.4, 0] }}
        style={{ transformOrigin: '2000px 500px' }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2.5, delay: 0.4, ease: 'easeOut' }} />
    </svg>
  );
}

/** Hexagonal grid background */
function HexGrid() {
  return (
    <div
      className="absolute inset-0 z-0 opacity-10"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='92'%3E%3Cpolygon points='40,4 76,24 76,68 40,88 4,68 4,24' fill='none' stroke='%230056B3' stroke-width='1'/%3E%3C/svg%3E")`,
        backgroundSize: '80px 92px',
      }}
    />
  );
}

/** Centre VS badge */
function VSBadge({ small }: { small?: boolean }) {
  return (
    <motion.div
      className="relative flex items-center justify-center"
      animate={{ scale: small ? 0.38 : [1, 1.04, 1] }}
      transition={small ? { duration: 0.6, ease: 'backOut' } : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Glow rings */}
      <motion.div
        className="absolute rounded-full border-2 border-[#CCFF00]/30"
        animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2.4, repeat: Infinity }}
        style={{ width: small ? 80 : 220, height: small ? 80 : 220 }}
      />
      <motion.div
        className="absolute rounded-full border border-[#0056B3]/40"
        animate={{ scale: [1, 2.2, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 2.4, repeat: Infinity, delay: 0.6 }}
        style={{ width: small ? 80 : 220, height: small ? 80 : 220 }}
      />

      {/* VS text */}
      <span
        className="font-black italic leading-none select-none"
        style={{
          fontSize: small ? '4vw' : '14vw',
          background: 'linear-gradient(135deg, #ffffff 0%, #CCFF00 50%, #0056B3 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          WebkitTextStroke: small ? '1px rgba(0,0,0,0.5)' : '3px rgba(0,0,0,0.6)',
          filter: `drop-shadow(0 0 ${small ? 12 : 40}px rgba(204,255,0,0.6))`,
          fontFamily: '"Barlow Condensed", "Bebas Neue", Impact, sans-serif',
        }}
      >
        VS
      </span>
    </motion.div>
  );
}

/** Single clan panel (left or right) */
function ClanPanel({
  clan, side, visible,
}: { clan: ClanSide; side: 'left' | 'right'; visible: boolean }) {
  const isLeft = side === 'left';
  const xOffset = isLeft ? '-120%' : '120%';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={`clan-${side}`}
          className="flex flex-col items-center justify-center h-full w-full relative"
          initial={{ x: xOffset, opacity: 0, filter: 'blur(30px)' }}
          animate={{ x: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ x: xOffset, opacity: 0, filter: 'blur(30px)' }}
          transition={{ type: 'spring', damping: 22, stiffness: 90, mass: 1.2 }}
        >
          {/* Side color wash */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at ${isLeft ? '30%' : '70%'} 50%, ${clan.primaryColor}55 0%, transparent 70%)`,
            }}
          />

          {/* Content */}
          <div className={`relative z-10 flex flex-col ${isLeft ? 'items-start pl-[8%]' : 'items-end pr-[8%]'} gap-[1.5vh]`}>

            {/* Clan logo placeholder / initial badge */}
            <motion.div
              initial={{ scale: 0, rotate: isLeft ? -30 : 30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', damping: 14, stiffness: 120 }}
              className="flex items-center justify-center rounded-full shadow-2xl"
              style={{
                width: '12vw', height: '12vw',
                background: `radial-gradient(circle at 35% 35%, ${clan.secondaryColor}, ${clan.primaryColor})`,
                boxShadow: `0 0 60px ${clan.primaryColor}99, 0 0 120px ${clan.primaryColor}44`,
                border: `4px solid ${clan.secondaryColor}`,
              }}
            >
              {clan.logoUrl ? (
                <img src={clan.logoUrl} alt={clan.shortName} className="w-[80%] h-[80%] object-contain" />
              ) : (
                <span style={{
                  fontSize: '3.5vw', fontWeight: 900, color: '#fff',
                  fontFamily: '"Noto Serif SC", serif',
                  textShadow: '0 2px 12px rgba(0,0,0,0.6)',
                }}>
                  {clan.name.charAt(0)}
                </span>
              )}
            </motion.div>

            {/* Short name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              <p style={{
                fontSize: '5.5vw', fontWeight: 900, letterSpacing: '0.08em',
                color: clan.secondaryColor,
                fontFamily: '"Barlow Condensed", Impact, sans-serif',
                lineHeight: 1,
                textShadow: `0 0 30px ${clan.secondaryColor}99`,
              }}>
                {clan.shortName}
              </p>
            </motion.div>

            {/* Full clan name */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              style={{
                fontSize: '1.6vw', color: '#ffffffcc',
                fontFamily: '"Noto Serif SC", serif',
                letterSpacing: '0.05em',
              }}
            >
              {clan.name}
            </motion.p>

            {/* Players list */}
            <div className="flex flex-col gap-[0.5vh]">
              {clan.players.map((player, i) => (
                <motion.div
                  key={player}
                  initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 + i * 0.12, duration: 0.4 }}
                  className={`flex items-center gap-[0.8vw] ${isLeft ? '' : 'flex-row-reverse'}`}
                >
                  <div className="w-[0.5vw] h-[0.5vw] rounded-full" style={{ background: clan.primaryColor }} />
                  <span style={{
                    fontSize: '1.4vw', color: '#ffffffdd',
                    fontFamily: '"Barlow", sans-serif', fontWeight: 500,
                  }}>
                    {player}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Score board overlay */
function ScoreBoard({ match, visible }: { match: CurrentLiveMatch; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="scoreboard"
          className="absolute inset-x-0 top-0 z-40 flex flex-col items-center"
          initial={{ y: '-110%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-110%', opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 100 }}
        >
          {/* Top banner */}
          <div
            className="w-full flex items-stretch"
            style={{
              background: 'linear-gradient(180deg, rgba(5,10,30,0.98) 0%, rgba(5,10,30,0.85) 100%)',
              borderBottom: '3px solid #CCFF00',
              minHeight: '14vh',
            }}
          >
            {/* Team A score block */}
            <div className="flex-1 flex items-center justify-center gap-[2vw] pl-[3vw]">
              <div className="flex flex-col items-start">
                <span style={{ fontSize: '1.4vw', color: match.team1.secondaryColor, fontFamily: '"Barlow Condensed", sans-serif', letterSpacing: '0.1em', fontWeight: 700 }}>
                  {match.team1.shortName}
                </span>
                <span style={{ fontSize: '0.95vw', color: '#aaa', fontFamily: '"Noto Serif SC", serif' }}>
                  {match.team1.name}
                </span>
              </div>
              <motion.span
                key={match.scoreA}
                initial={{ scale: 1.6, color: '#CCFF00' }}
                animate={{ scale: 1, color: '#ffffff' }}
                transition={{ duration: 0.35, type: 'spring' }}
                style={{ fontSize: '7vw', fontWeight: 900, lineHeight: 1, fontFamily: '"Barlow Condensed", Impact, sans-serif' }}
              >
                {match.scoreA}
              </motion.span>
            </div>

            {/* Centre info */}
            <div className="flex flex-col items-center justify-center px-[3vw] gap-[0.5vh]">
              <span style={{ fontSize: '1.1vw', color: '#CCFF00', fontFamily: '"Barlow Condensed", sans-serif', letterSpacing: '0.15em', fontWeight: 700 }}>
                {match.stage.toUpperCase()}
              </span>
              <div
                className="px-[1.5vw] py-[0.4vh] rounded"
                style={{ background: '#0056B3', fontSize: '1.6vw', fontWeight: 800, color: '#fff', fontFamily: '"Barlow Condensed", sans-serif', letterSpacing: '0.1em' }}
              >
                {match.category}
              </div>
              <span style={{ fontSize: '0.9vw', color: '#ffffff88', fontFamily: 'sans-serif' }}>
                民都鲁省姓氏匹克球锦标赛 2026
              </span>
            </div>

            {/* Team B score block */}
            <div className="flex-1 flex items-center justify-center gap-[2vw] flex-row-reverse pr-[3vw]">
              <div className="flex flex-col items-end">
                <span style={{ fontSize: '1.4vw', color: match.team2.secondaryColor, fontFamily: '"Barlow Condensed", sans-serif', letterSpacing: '0.1em', fontWeight: 700 }}>
                  {match.team2.shortName}
                </span>
                <span style={{ fontSize: '0.95vw', color: '#aaa', fontFamily: '"Noto Serif SC", serif' }}>
                  {match.team2.name}
                </span>
              </div>
              <motion.span
                key={match.scoreB}
                initial={{ scale: 1.6, color: '#CCFF00' }}
                animate={{ scale: 1, color: '#ffffff' }}
                transition={{ duration: 0.35, type: 'spring' }}
                style={{ fontSize: '7vw', fontWeight: 900, lineHeight: 1, fontFamily: '"Barlow Condensed", Impact, sans-serif' }}
              >
                {match.scoreB}
              </motion.span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Stage hint strip at bottom */
function StageHint({ stage }: { stage: MatchOverlayStage }) {
  const labels: Record<MatchOverlayStage, string> = {
    EMPTY_VS: '按 Space 键 → 左侧公会入场',
    LEFT_PLAYER: '按 Space 键 → 右侧公会入场',
    RIGHT_PLAYER: '按 Space 键 → 进入计分板',
    SCORE_BOARD: '按 Space 键 → 重置',
  };
  return (
    <motion.div
      key={stage}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute bottom-[2vh] left-1/2 -translate-x-1/2 z-50 px-[2vw] py-[0.6vh] rounded-full"
      style={{
        background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.12)',
        fontSize: '1vw', color: '#ffffff88', fontFamily: '"Barlow", sans-serif',
        backdropFilter: 'blur(8px)',
      }}
    >
      {labels[stage]}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MatchOverlay({ match, onStageChange }: MatchOverlayProps) {
  const params = useParams();
  const eventId = params?.eventId as string | undefined;

  const [activeMatch, setActiveMatch] = useState<CurrentLiveMatch | null>(null);
  const liveMatch = match ?? activeMatch ?? DEMO_MATCH;
  const [stageIdx, setStageIdx] = useState(0);
  const stage = STAGE_ORDER[stageIdx];

  const fetchLiveMatch = async (matchId: string) => {
    const { data, error } = await supabase
      .from('arena_matches')
      .select(`
        id, category_code, round_type, score_a, score_b, team_a_name, team_b_name,
        clan_a:arena_clans!clan_a_id(name, short_name, primary_color, secondary_color, logo_url),
        clan_b:arena_clans!clan_b_id(name, short_name, primary_color, secondary_color, logo_url)
      `)
      .eq('id', matchId)
      .single();

    if (data && !error) {
      const d = data as any;
      setActiveMatch({
        matchId: d.id,
        category: d.category_code,
        stage: d.round_type as any,
        scoreA: d.score_a || 0,
        scoreB: d.score_b || 0,
        team1: {
          name: d.clan_a?.name || d.team_a_name || 'TBD',
          shortName: d.clan_a?.short_name || d.team_a_name || 'TBA',
          primaryColor: d.clan_a?.primary_color || '#333333',
          secondaryColor: d.clan_a?.secondary_color || '#aaaaaa',
          logoUrl: d.clan_a?.logo_url,
          players: [], // Add real players later if available in schema
        },
        team2: {
          name: d.clan_b?.name || d.team_b_name || 'TBD',
          shortName: d.clan_b?.short_name || d.team_b_name || 'TBA',
          primaryColor: d.clan_b?.primary_color || '#333333',
          secondaryColor: d.clan_b?.secondary_color || '#aaaaaa',
          logoUrl: d.clan_b?.logo_url,
          players: [],
        }
      });
      // Optionally reset stage when a new match is shown:
      // setStageIdx(0); 
    }
  };

  useEffect(() => {
    if (!eventId) return;

    const fetchCurrentControl = async () => {
      const { data } = await supabase
        .from('arena_live_controls')
        .select('command, preset_name')
        .eq('tournament_id', eventId)
        .single();
      if (data && data.command === 'SHOW_MATCH' && data.preset_name) {
        fetchLiveMatch(data.preset_name);
      }
    };
    fetchCurrentControl();

    const channel = supabase
      .channel('match_overlay_controls')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'arena_live_controls', filter: `tournament_id=eq.${eventId}` }, (payload) => {
        const d = payload.new as any;
        if (d && d.command === 'SHOW_MATCH' && d.preset_name) {
          fetchLiveMatch(d.preset_name);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'arena_matches', filter: `tournament_id=eq.${eventId}` }, (payload) => {
        // If the updated match is the currently active one, re-fetch it to get the latest score
        const updatedMatch = payload.new as any;
        setActiveMatch(prev => {
          if (prev && prev.matchId === updatedMatch.id) {
            fetchLiveMatch(updatedMatch.id);
          }
          return prev;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  const advance = useCallback(() => {
    setStageIdx((prev) => {
      const next = (prev + 1) % STAGE_ORDER.length;
      onStageChange?.(STAGE_ORDER[next]);
      return next;
    });
  }, [onStageChange]);

  // Keyboard listener (Space → advance)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowRight') {
        e.preventDefault();
        advance();
      }
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setStageIdx((prev) => {
          const next = (prev - 1 + STAGE_ORDER.length) % STAGE_ORDER.length;
          onStageChange?.(STAGE_ORDER[next]);
          return next;
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [advance, onStageChange]);

  const showLeft  = stage === 'LEFT_PLAYER'  || stage === 'RIGHT_PLAYER' || stage === 'SCORE_BOARD';
  const showRight = stage === 'RIGHT_PLAYER' || stage === 'SCORE_BOARD';
  const showBoard = stage === 'SCORE_BOARD';
  const vsSmall   = showLeft || showRight;

  return (
    <>
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@500;700;900&family=Barlow+Condensed:wght@700;800;900&family=Noto+Serif+SC:wght@400;700&display=swap');`}</style>

      <div
        className="w-screen h-screen overflow-hidden relative select-none"
        style={{ background: '#050A1E', fontFamily: '"Barlow", sans-serif' }}
      >
        {/* ── Background ── */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('/miri-pb-bg.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.35,
          }}
        />
        <HexGrid />
        <LightningField />

        {/* Dark vignette */}
        <div className="absolute inset-0 z-0"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(5,10,30,0.75) 100%)' }} />

        {/* ── Left / Right Panels ── */}
        <div className="absolute inset-0 z-10 flex">
          <div className="flex-1 relative">
            <ClanPanel clan={liveMatch.team1} side="left" visible={showLeft} />
          </div>

          {/* Centre VS */}
          <div className="flex items-center justify-center z-20 shrink-0" style={{ width: vsSmall ? '20vw' : '100%', position: vsSmall ? 'relative' : 'absolute', inset: vsSmall ? 'auto' : 0 }}>
            <VSBadge small={vsSmall} />
          </div>

          <div className="flex-1 relative">
            <ClanPanel clan={liveMatch.team2} side="right" visible={showRight} />
          </div>
        </div>

        {/* ── Tournament banner (EMPTY_VS only) ── */}
        <AnimatePresence>
          {stage === 'EMPTY_VS' && (
            <motion.div
              key="tournament-banner"
              className="absolute bottom-[6vh] inset-x-0 z-30 flex flex-col items-center gap-[1vh]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              <div className="h-[2px] w-[20vw]" style={{ background: 'linear-gradient(90deg, transparent, #CCFF00, transparent)' }} />
              <p style={{ fontSize: '1.8vw', fontWeight: 700, letterSpacing: '0.2em', color: '#CCFF00', fontFamily: '"Barlow Condensed", sans-serif' }}>
                民都鲁省姓氏匹克球锦标赛 2026
              </p>
              <p style={{ fontSize: '1vw', color: '#ffffff88', letterSpacing: '0.15em' }}>
                MIRI SURNAME PICKLEBALL CHAMPIONSHIP
              </p>
              <div className="h-[2px] w-[20vw]" style={{ background: 'linear-gradient(90deg, transparent, #0056B3, transparent)' }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Clash impact flash when RIGHT appears ── */}
        <AnimatePresence>
          {stage === 'RIGHT_PLAYER' && (
            <motion.div
              key="clash-flash"
              className="absolute inset-0 z-30 pointer-events-none"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(204,255,0,0.3) 0%, transparent 70%)' }}
            />
          )}
        </AnimatePresence>

        {/* ── Score board ── */}
        <ScoreBoard match={liveMatch} visible={showBoard} />

        {/* ── Category badge (visible when players shown) ── */}
        <AnimatePresence>
          {(showLeft || showRight) && !showBoard && (
            <motion.div
              key="cat-badge"
              className="absolute top-[3vh] left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-[0.5vh]"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', damping: 16 }}
            >
              <div className="px-[2vw] py-[0.8vh] rounded" style={{ background: '#0056B3', border: '2px solid #4D9FFF' }}>
                <span style={{ fontSize: '2.2vw', fontWeight: 900, color: '#fff', fontFamily: '"Barlow Condensed", sans-serif', letterSpacing: '0.1em' }}>
                  {liveMatch.category}
                </span>
              </div>
              <span style={{ fontSize: '1.1vw', color: '#ffffff99', letterSpacing: '0.1em', fontFamily: '"Barlow Condensed", sans-serif' }}>
                {liveMatch.stage.toUpperCase()}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stage hint ── */}
        <AnimatePresence mode="wait">
          <StageHint stage={stage} key={stage} />
        </AnimatePresence>

        {/* ── Click anywhere to advance (touch/tablet) ── */}
        <div
          className="absolute inset-0 z-50 cursor-pointer"
          style={{ background: 'transparent' }}
          onClick={advance}
        />

        {/* ── Stage indicator dots ── */}
        <div className="absolute bottom-[1vh] left-1/2 -translate-x-1/2 z-[60] flex gap-[0.8vw] pointer-events-none">
          {STAGE_ORDER.map((s, i) => (
            <div key={s} className="rounded-full transition-all duration-300"
              style={{
                width: i === stageIdx ? '2.5vw' : '0.6vw',
                height: '0.6vw',
                background: i === stageIdx ? '#CCFF00' : '#ffffff44',
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
