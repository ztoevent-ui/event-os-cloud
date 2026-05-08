'use client';

import React, { useEffect, useState, Suspense, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ──────────────────────────────────────────────────────────────────
type MarqueeMode = 'IDLE' | 'LIVE' | 'ANNOUNCEMENT';

type MatchState = {
  teamA: { name: string; score: number };
  teamB: { name: string; score: number };
  currentSet: number;
  announcement: string;
};

// ── Clock ──────────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{time}</span>;
}

// ── Scrolling ticker ───────────────────────────────────────────────────────
const TICKER_ITEMS = [
  'BINTULU PICKLEBALL OPEN 2026',
  'ZTO ARENA SYSTEM — LIVE OPERATIONS',
  'WELCOME TO THE TOURNAMENT',
  'ORGANISED BY ZERO TO ONE EVENT',
];

function Ticker() {
  return (
    <div style={{ overflow: 'hidden', flex: 1 }}>
      <motion.div
        style={{ display: 'flex', gap: '8vw', whiteSpace: 'nowrap' }}
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
      >
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span key={i} style={{ fontSize: '2.4vh', fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', flexShrink: 0 }}>
            <span style={{ color: '#0056B3', marginRight: '3vw' }}>◆</span>{item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ── IDLE mode ─────────────────────────────────────────────────────────────
function IdleView() {
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Scan line */}
      <motion.div
        style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,86,179,0.04) 3px, rgba(0,86,179,0.04) 4px)', pointerEvents: 'none' }}
      />
      <motion.div
        style={{ position: 'absolute', insetInline: 0, height: '100%', background: 'linear-gradient(90deg, transparent, rgba(0,86,179,0.06), transparent)', pointerEvents: 'none' }}
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      />

      {/* Left: Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2.5vw', paddingLeft: '3vw', paddingRight: '3vw', borderRight: '1px solid rgba(0,86,179,0.3)', flexShrink: 0, height: '100%' }}>
        <div style={{ width: '8vh', height: '8vh', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0,86,179,0.5)' }}>
          <img src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG" alt="ZTO" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div>
          <div style={{ fontSize: '3.2vh', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1, textTransform: 'uppercase' }}>
            ZTO <span style={{ color: '#0056B3' }}>Arena</span>
          </div>
          <div style={{ fontSize: '1.2vh', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.35em', textTransform: 'uppercase', marginTop: 4 }}>
            Live Event System
          </div>
        </div>
      </div>

      {/* Middle: Ticker */}
      <div style={{ flex: 1, overflow: 'hidden', paddingLeft: '3vw', paddingRight: '2vw' }}>
        <Ticker />
      </div>

      {/* Right: Clock */}
      <div style={{ paddingLeft: '2.5vw', paddingRight: '3vw', borderLeft: '1px solid rgba(0,86,179,0.3)', flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '1.2vh', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 6 }}>Live Time</div>
        <div style={{ fontSize: '3.6vh', fontWeight: 900, color: '#4da3ff', letterSpacing: '0.08em' }}>
          <LiveClock />
        </div>
      </div>
    </div>
  );
}

// ── LIVE match mode ────────────────────────────────────────────────────────
function LiveView({ match }: { match: MatchState }) {
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'stretch' }}>

      {/* Left: Branding strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5vw', paddingLeft: '2.5vw', paddingRight: '2.5vw', borderRight: '1px solid rgba(0,86,179,0.4)', flexShrink: 0, background: 'rgba(0,86,179,0.06)' }}>
        <div style={{ fontSize: '1.6vh', fontWeight: 900, color: '#0056B3', letterSpacing: '0.4em', textTransform: 'uppercase', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
          ZTO ARENA
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <motion.div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }}
            animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }} />
          <span style={{ fontSize: '1.3vh', fontWeight: 700, color: '#22c55e', letterSpacing: '0.25em', textTransform: 'uppercase' }}>LIVE</span>
        </div>
      </div>

      {/* Team A */}
      <motion.div
        style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '2vw', paddingLeft: '2.5vw', paddingRight: '2.5vw', background: 'rgba(37,99,235,0.08)', borderRight: '1px solid rgba(255,255,255,0.05)' }}
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
      >
        <div style={{ fontSize: '3.5vh', fontWeight: 900, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {match.teamA.name}
        </div>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={match.teamA.score}
            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{ fontSize: '7vh', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1, flexShrink: 0, textShadow: '0 0 40px rgba(37,99,235,0.7)' }}
          >
            {match.teamA.score}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* VS + Set */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingLeft: '2vw', paddingRight: '2vw', flexShrink: 0, gap: 4 }}>
        <div style={{ fontSize: '2.4vh', fontWeight: 900, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em' }}>VS</div>
        <div style={{ fontSize: '1.2vh', fontWeight: 700, color: '#0056B3', letterSpacing: '0.3em', textTransform: 'uppercase' }}>SET {match.currentSet}</div>
      </div>

      {/* Team B */}
      <motion.div
        style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '2vw', paddingLeft: '2.5vw', paddingRight: '2.5vw', background: 'rgba(220,38,38,0.06)', borderLeft: '1px solid rgba(255,255,255,0.05)' }}
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      >
        <AnimatePresence mode="popLayout">
          <motion.div
            key={match.teamB.score}
            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{ fontSize: '7vh', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1, flexShrink: 0, textShadow: '0 0 40px rgba(220,38,38,0.7)' }}
          >
            {match.teamB.score}
          </motion.div>
        </AnimatePresence>
        <div style={{ fontSize: '3.5vh', fontWeight: 900, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>
          {match.teamB.name}
        </div>
      </motion.div>

      {/* Right: Clock */}
      <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '2.5vw', paddingRight: '2.5vw', borderLeft: '1px solid rgba(0,86,179,0.4)', flexShrink: 0, background: 'rgba(0,86,179,0.04)' }}>
        <div style={{ fontSize: '3.2vh', fontWeight: 900, color: '#4da3ff', letterSpacing: '0.05em' }}>
          <LiveClock />
        </div>
      </div>
    </div>
  );
}

// ── ANNOUNCEMENT mode ──────────────────────────────────────────────────────
function AnnouncementView({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', paddingLeft: '4vw', paddingRight: '4vw' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ display: 'flex', alignItems: 'center', gap: '3vw' }}
      >
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
          style={{ fontSize: '4vh', color: '#DEFF9A' }}
        >
          <i className="fa-solid fa-bullhorn" />
        </motion.div>
        <span style={{ fontSize: '4.5vh', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center' }}>
          {text}
        </span>
      </motion.div>
    </div>
  );
}

// ── Main content ───────────────────────────────────────────────────────────
function MarqueeContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = (params.eventId as string) || 'BINTULU_OPEN_2026';
  const sid = parseInt(searchParams.get('sid') || '0');

  const [mode, setMode] = useState<MarqueeMode>('IDLE');
  const [match, setMatch] = useState<MatchState | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const autoResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isTargeted = (targets: number[]) => sid === 0 || targets.includes(sid);

  const resetToIdle = (delay = 15000) => {
    if (autoResetTimer.current) clearTimeout(autoResetTimer.current);
    autoResetTimer.current = setTimeout(() => setMode('IDLE'), delay);
  };

  // DB Autopilot: sync live match from DB
  useEffect(() => {
    const ch = supabase
      .channel(`marquee-autopilot-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'arena_matches' }, (payload) => {
        const m = payload.new as any;
        if (m?.status === 'LIVE') {
          setMatch({
            teamA: { name: m.team_a_name, score: m.score_a },
            teamB: { name: m.team_b_name, score: m.score_b },
            currentSet: m.current_set || 1,
            announcement: '',
          });
          setMode('LIVE');
        } else if (m?.status === 'COMPLETED' || m?.status === 'PENDING') {
          setMode('IDLE');
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [eventId]);

  // MC Broadcast channel (same as main screen, just different response)
  useEffect(() => {
    const channel = supabase.channel(`zto-arena-${eventId}`, { config: { broadcast: { ack: true } } });
    channel
      .on('broadcast', { event: 'match-update' }, (payload) => {
        if (!isTargeted(payload.payload.targets)) return;
        const p = payload.payload;
        setMatch({ teamA: p.teamA, teamB: p.teamB, currentSet: p.currentSet, announcement: p.announcement || '' });
        if (p.announcement) {
          setAnnouncement(p.announcement);
          setMode('ANNOUNCEMENT');
          resetToIdle(12000);
        } else {
          setMode('LIVE');
        }
      })
      .on('broadcast', { event: 'screen-mode' }, (payload) => {
        if (!isTargeted(payload.payload.targets)) return;
        const m = payload.payload.mode;
        if (m === 'STANDBY') setMode('IDLE');
      })
      .on('broadcast', { event: 'screen-action' }, (payload) => {
        if (!isTargeted(payload.payload.targets)) return;
        if (payload.payload.action === 'clear') setMode('IDLE');
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#050505',
      color: '#fff',
      fontFamily: 'Inter, sans-serif',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      userSelect: 'none',
      cursor: 'none',
    }}>
      {/* Subtle gradient bg */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 200% at 50% 50%, rgba(0,86,179,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Top + Bottom blue accent lines */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, #0056B3, #4da3ff, #0056B3, transparent)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, #0056B3, #4da3ff, #0056B3, transparent)' }} />

      {/* Content */}
      <AnimatePresence mode="wait">
        {mode === 'IDLE' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
            <IdleView />
          </motion.div>
        )}
        {mode === 'LIVE' && match && (
          <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'stretch' }}>
            <LiveView match={match} />
          </motion.div>
        )}
        {mode === 'ANNOUNCEMENT' && (
          <motion.div key="announcement" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
            <AnnouncementView text={announcement} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug SID indicator (tiny, bottom-right) */}
      <div style={{ position: 'absolute', bottom: 8, right: 12, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        MARQUEE · SID:{sid || 'ALL'} · {eventId}
      </div>
    </div>
  );
}

export default function MarqueePage() {
  return (
    <Suspense fallback={<div style={{ background: '#050505', minHeight: '100vh' }} />}>
      <MarqueeContent />
    </Suspense>
  );
}
