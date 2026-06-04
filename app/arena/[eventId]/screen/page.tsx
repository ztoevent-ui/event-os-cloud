'use client';

import React, { useEffect, useState, Suspense, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import dynamic from 'next/dynamic';
import type { ArenaMatch } from '@/lib/arena-types';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false }) as any;

type ScreenMode = 'SCORE' | 'ADS' | 'BRACKET' | 'YOUTUBE' | 'STANDBY';
type AutoPilotMode = 'AUTO' | 'MANUAL';

type MatchState = {
  eventId: string; sportType: string;
  teamA: { name: string; score: number };
  teamB: { name: string; score: number };
  currentSet: number; isPaused: boolean; announcement: string; timer?: number;
};

type BracketMatch = { id: string; round: number; team1: string; team2: string; winner: 1 | 2 | null; };
type BracketState = { id: string; teamCount: number; matches: Record<string, BracketMatch>; };

// ==========================================
// STANDBY SCREEN
// ==========================================
const StandbyView = () => (
  <motion.div key="standby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="flex-1 flex flex-col items-center justify-center w-full h-full z-10 relative">
    <div className="absolute inset-0 overflow-hidden">
      {/* Scan lines */}
      <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,86,179,0.03) 2px, rgba(0,86,179,0.03) 4px)' }} />
      {/* Moving sweep */}
      <motion.div className="absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-blue-600/5 to-transparent"
        animate={{ y: ['-10%', '110%'] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} />
    </div>
    <div className="relative z-10 text-center">
      <motion.div className="w-24 h-24 bg-[#0056B3]/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-[#0056B3]/30"
        animate={{ boxShadow: ['0 0 20px rgba(0,86,179,0.2)', '0 0 60px rgba(0,86,179,0.5)', '0 0 20px rgba(0,86,179,0.2)'] }}
        transition={{ duration: 3, repeat: Infinity }}>
        <i className="fa-solid fa-atom text-4xl text-[#4da3ff]" style={{ animation: 'spin 8s linear infinite' }} />
      </motion.div>
      <motion.div className="text-6xl font-black uppercase tracking-[0.3em] text-white italic mb-4"
        animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 3, repeat: Infinity }}>ZTO ARENA</motion.div>
      <div className="text-[#0056B3] text-[11px] font-black uppercase tracking-[0.6em] mt-2">Awaiting Broadcast Signal</div>
    </div>
  </motion.div>
);

// ==========================================
// SCOREBOARD
// ==========================================
const ScoreBoardView = ({ matchState, currentSport }: { matchState: MatchState; currentSport: string }) => (
  <motion.div key="scoreboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="flex-1 flex flex-col z-10 w-full h-full">
    <header className="h-40 flex items-center justify-center">
      <div className="bg-zinc-900/60 backdrop-blur-3xl border border-white/5 px-12 py-4 rounded-full flex items-center gap-10 shadow-2xl">
        <div className="flex flex-col items-center">
          <div className="text-amber-500 font-black text-3xl tracking-[0.3em] uppercase leading-none italic">ZTO ARENA</div>
          <div className="text-[10px] font-bold text-zinc-500 tracking-[0.5em] mt-2 ml-1 uppercase">{currentSport}</div>
        </div>
        <div className="w-px h-10 bg-white/10" />
        <div className="px-6 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <span className="text-amber-500 font-black text-2xl tabular-nums">SET {matchState.currentSet}</span>
        </div>
      </div>
    </header>
    <main className="flex-1 flex w-full relative">
      <div className="flex-1 flex flex-col items-center justify-center relative border-r border-white/5">
        <div className="absolute inset-0 bg-blue-600/5" />
        <motion.h2 className="z-10 text-[6vw] font-black uppercase text-blue-400 drop-shadow-[0_0_20px_rgba(37,99,235,0.6)] px-12 text-center truncate w-full">
          {matchState.teamA.name}
        </motion.h2>
        <div className="z-10 relative">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={matchState.teamA.score}
              initial={{ scale: 0.5, opacity: 0, y: -30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 1.5, opacity: 0, y: 30 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="text-[35vw] font-black leading-none tabular-nums text-white drop-shadow-[0_0_100px_rgba(37,99,235,0.5)]">
              {matchState.teamA.score}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className="absolute inset-0 bg-red-600/5" />
        <motion.h2 className="z-10 text-[6vw] font-black uppercase text-red-500 drop-shadow-[0_0_20px_rgba(220,38,38,0.6)] px-12 text-center truncate w-full">
          {matchState.teamB.name}
        </motion.h2>
        <div className="z-10 relative">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={matchState.teamB.score}
              initial={{ scale: 0.5, opacity: 0, y: -30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 1.5, opacity: 0, y: 30 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="text-[35vw] font-black leading-none tabular-nums text-white drop-shadow-[0_0_100px_rgba(220,38,38,0.5)]">
              {matchState.teamB.score}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  </motion.div>
);

// ==========================================
// BRACKET
// ==========================================
const BracketBoardView = ({ bracketState }: { bracketState: BracketState | null }) => {
  const totalRounds = useMemo(() => bracketState ? Math.ceil(Math.log2(bracketState.teamCount)) : 0, [bracketState]);
  if (!bracketState?.matches) return (
    <div className="flex-1 flex flex-col items-center justify-center z-10 p-24 w-full h-full">
      <i className="fa-solid fa-sitemap text-9xl text-blue-500/20 mb-8 animate-pulse" />
      <h2 className="text-4xl font-black text-white uppercase tracking-[0.4em] italic text-center">INITIALIZING BRACKET...</h2>
    </div>
  );
  return (
    <motion.div key="bracket-render" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex-1 flex flex-col items-center justify-center z-10 w-full h-full relative overflow-hidden">
      <div className="absolute top-16 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
        <h1 className="text-6xl font-black text-blue-500 uppercase tracking-widest italic drop-shadow-[0_0_30px_rgba(59,130,246,0.6)]">ZTO Open Cup Bracket</h1>
        <div className="text-sm font-black text-blue-300 tracking-[0.5em] uppercase mt-4">Automated Node Render &bull; {bracketState.teamCount} Teams</div>
      </div>
      <TransformWrapper initialScale={0.5} centerOnInit minScale={0.1} limitToBounds={false}>
        <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
          <div className="flex gap-48 p-96 min-w-[4000px] h-full items-center">
            {Array.from({ length: totalRounds }).map((_, rIdx) => {
              const round = rIdx + 1;
              const roundMatches = Object.values(bracketState.matches).filter(m => m.round === round);
              return (
                <div key={round} className="flex flex-col justify-around gap-16 h-full">
                  <div className="text-center font-black uppercase text-blue-500/40 tracking-[0.8em] text-2xl mb-12">ROUND {round}</div>
                  {roundMatches.map(m => (
                    <div key={m.id} className={`w-[450px] bg-zinc-900/80 backdrop-blur-xl border-2 rounded-3xl overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.5)] transition-all duration-500 ${round === totalRounds ? 'border-amber-500/80 scale-125' : 'border-white/5'}`}>
                      <div className={`flex items-center p-10 border-b-2 border-white/5 ${m.winner === 1 ? 'bg-blue-600/20' : ''}`}>
                        <div className={`flex-1 truncate text-4xl font-black ${m.winner === 1 ? 'text-blue-400' : m.team1 === 'BYE' ? 'text-zinc-700 italic' : 'text-zinc-400'}`}>{m.team1}</div>
                        {m.winner === 1 && <i className="fa-solid fa-caret-right text-blue-500 text-5xl ml-6" />}
                      </div>
                      <div className={`flex items-center p-10 ${m.winner === 2 ? 'bg-blue-600/20' : ''}`}>
                        <div className={`flex-1 truncate text-4xl font-black ${m.winner === 2 ? 'text-blue-400' : m.team2 === 'BYE' ? 'text-zinc-700 italic' : 'text-zinc-400'}`}>{m.team2}</div>
                        {m.winner === 2 && <i className="fa-solid fa-caret-right text-blue-500 text-5xl ml-6" />}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </motion.div>
  );
};

// ==========================================
// BADMINTON 5-COURT STANDBY VIEW (OPTIMIZED FOR WIDE BANNERS)
// ==========================================
interface Badminton5CourtProps {
  urlEventId: string;
  eventName: string;
}

function Badminton5CourtStandbyView({ urlEventId, eventName }: Badminton5CourtProps) {
  const [matches, setMatches] = useState<ArenaMatch[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadMatches = async () => {
    const { data } = await supabase
      .from('arena_matches')
      .select('*')
      .eq('tournament_id', urlEventId)
      .in('status', ['LIVE', 'PENDING'])
      .order('court_number', { ascending: true, nullsFirst: false });
    if (data) setMatches(data as ArenaMatch[]);
  };

  useEffect(() => {
    loadMatches();
    const ch = supabase.channel(`badminton-standby-matches-${urlEventId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'arena_matches', 
        filter: `tournament_id=eq.${urlEventId}` 
      }, () => {
        loadMatches();
      })
      .subscribe();
    channelRef.current = ch;
    return () => { 
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [urlEventId]);

  const courtsList = [1, 2, 3, 4, 5];

  return (
    <div className="w-full h-full flex flex-col select-none bg-[#030712] text-white overflow-hidden">
      {/* Ultra-thin header bar */}
      <header className="flex justify-between items-center px-4 shrink-0 bg-black/60 border-b border-white/5" style={{ height: '2rem' }}>
        <span className="text-[10px] font-black tracking-widest text-[#059669] uppercase">{eventName} · LIVE SCORES</span>
        <span className="text-[10px] font-black text-[#22d3ee] tabular-nums tracking-widest">
          {currentTime.toLocaleTimeString('en-US', { hour12: false })}
        </span>
      </header>

      {/* 5-court grid – fills ALL remaining height */}
      <div className="flex-1 min-h-0 grid grid-cols-5 gap-1.5 p-1.5">
        {courtsList.map((courtNum) => {
          const courtMatches = matches.filter(m => m.court_number === courtNum);
          const liveMatch = courtMatches.find(m => m.status === 'LIVE');
          const pendingMatch = !liveMatch ? courtMatches.find(m => m.status === 'PENDING') : null;

          if (liveMatch) {
            const prevSets = liveMatch.sets_scores?.slice(0, (liveMatch.current_set ?? 1) - 1) ?? [];
            return (
              <div key={`court-${courtNum}`} className="bg-gradient-to-b from-[#011c14] to-[#030f09] border border-[#059669]/50 rounded-xl flex flex-col overflow-hidden">
                {/* Court badge strip */}
                <div className="flex items-center justify-between px-3 bg-[#059669]/20 border-b border-[#059669]/30 shrink-0" style={{ height: '2.2rem' }}>
                  <span className="bg-[#059669] text-black font-black text-[11px] px-2.5 py-0.5 rounded leading-none tracking-wider">COURT {courtNum}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">SET {liveMatch.current_set}</span>
                  </div>
                </div>

                {/* Team A – 50% of body */}
                <div className={`flex-1 flex items-center justify-between px-3 border-b border-white/5 min-h-0 ${liveMatch.server === 'A' ? 'bg-[#059669]/12' : ''}`}>
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5 overflow-hidden">
                    {liveMatch.server === 'A' && (
                      <span className="text-[#f59e0b] leading-none shrink-0" style={{ fontSize: 'clamp(0.7rem, 1.5vw, 1.2rem)' }}>🏸</span>
                    )}
                    <span className={`font-black uppercase leading-tight truncate ${liveMatch.server === 'A' ? 'text-white' : 'text-zinc-400'}`}
                      style={{ fontSize: 'clamp(0.5rem, 1.1vw, 0.95rem)' }}>
                      {liveMatch.team_a_name}
                    </span>
                  </div>
                  <span
                    className={`font-black tabular-nums leading-none ml-1 shrink-0 ${liveMatch.server === 'A' ? 'text-[#f59e0b]' : 'text-white'}`}
                    style={{
                      fontSize: 'clamp(3rem, 9vw, 9rem)',
                      textShadow: liveMatch.server === 'A' ? '0 0 40px rgba(245,158,11,0.8)' : '0 0 20px rgba(255,255,255,0.1)',
                    }}
                  >
                    {liveMatch.score_a}
                  </span>
                </div>

                {/* Team B – 50% of body */}
                <div className={`flex-1 flex items-center justify-between px-3 min-h-0 ${liveMatch.server === 'B' ? 'bg-[#059669]/12' : ''}`}>
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5 overflow-hidden">
                    {liveMatch.server === 'B' && (
                      <span className="text-[#f59e0b] leading-none shrink-0" style={{ fontSize: 'clamp(0.7rem, 1.5vw, 1.2rem)' }}>🏸</span>
                    )}
                    <span className={`font-black uppercase leading-tight truncate ${liveMatch.server === 'B' ? 'text-white' : 'text-zinc-400'}`}
                      style={{ fontSize: 'clamp(0.5rem, 1.1vw, 0.95rem)' }}>
                      {liveMatch.team_b_name}
                    </span>
                  </div>
                  <span
                    className={`font-black tabular-nums leading-none ml-1 shrink-0 ${liveMatch.server === 'B' ? 'text-[#f59e0b]' : 'text-white'}`}
                    style={{
                      fontSize: 'clamp(3rem, 9vw, 9rem)',
                      textShadow: liveMatch.server === 'B' ? '0 0 40px rgba(245,158,11,0.8)' : '0 0 20px rgba(255,255,255,0.1)',
                    }}
                  >
                    {liveMatch.score_b}
                  </span>
                </div>

                {/* Previous sets footer */}
                {prevSets.length > 0 && (
                  <div className="flex items-center justify-center gap-1 px-2 border-t border-white/5 shrink-0 bg-black/30" style={{ height: '1.8rem' }}>
                    {prevSets.map((set, idx) => (
                      <span key={idx} className="bg-white/5 border border-white/10 px-1.5 rounded text-[10px] font-black text-zinc-300 leading-none py-0.5">
                        {set.a}–{set.b}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          if (pendingMatch) {
            return (
              <div key={`court-${courtNum}`} className="bg-zinc-950 border border-zinc-800/60 rounded-xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-3 bg-zinc-900/60 border-b border-white/5 shrink-0" style={{ height: '2.2rem' }}>
                  <span className="bg-zinc-700 text-zinc-300 font-black text-[11px] px-2.5 py-0.5 rounded leading-none tracking-wider">COURT {courtNum}</span>
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest animate-pulse">CALLING</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-2 px-3 min-h-0">
                  <span className="text-zinc-200 font-black text-center w-full truncate uppercase tracking-wide" style={{ fontSize: 'clamp(0.7rem, 1.5vw, 1.2rem)' }}>{pendingMatch.team_a_name}</span>
                  <span className="text-zinc-600 font-black tracking-[0.4em]" style={{ fontSize: 'clamp(0.5rem, 1vw, 0.8rem)' }}>VS</span>
                  <span className="text-zinc-200 font-black text-center w-full truncate uppercase tracking-wide" style={{ fontSize: 'clamp(0.7rem, 1.5vw, 1.2rem)' }}>{pendingMatch.team_b_name}</span>
                </div>
              </div>
            );
          }

          return (
            <div key={`court-${courtNum}`} className="bg-[#050505] border border-white/5 rounded-xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-3 border-b border-white/5 shrink-0" style={{ height: '2.2rem' }}>
                <span className="text-zinc-600 font-black text-[11px] tracking-wider">COURT {courtNum}</span>
                <span className="text-[10px] font-black text-zinc-700 tracking-widest">STANDBY</span>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <span className="font-black text-zinc-800 tracking-widest uppercase" style={{ fontSize: 'clamp(1rem, 2.5vw, 2rem)' }}>OPEN</span>
              </div>
            </div>
          );
        })}
        </div>
    </div>
  );
}

// ==========================================
// MAIN SCREEN CONTENT
// ==========================================
function ArenaScreenContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const urlEventId = (params.eventId as string) || 'BINTULU_OPEN_2026';
  const sid = parseInt(searchParams.get('sid') || '0');

  const [screenMode, setScreenMode] = useState<ScreenMode>('STANDBY');
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [bracketState, setBracketState] = useState<BracketState | null>(null);
  const [activeAd, setActiveAd] = useState<any | null>(null);
  const [youtubeState, setYoutubeState] = useState<{url: string, playing: boolean} | null>(null);
  const [autoPilot, setAutoPilot] = useState<AutoPilotMode>('AUTO');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showLocate, setShowLocate] = useState(false);
  const [eventName, setEventName] = useState<string>(urlEventId);
  const [sportType, setSportType] = useState<string>('PICKLEBALL');
  const [screenDim, setScreenDim] = useState<{w: number, h: number} | null>(null);
  const manualOverrideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    supabase.from('arena_tournaments').select('name, sport_type, screen_config').eq('id', urlEventId).single()
      .then(({ data }) => { 
          if (data?.name) setEventName(data.name); 
          if (data?.sport_type) setSportType(data.sport_type);
          if (data?.screen_config && Array.isArray(data.screen_config)) {
              const myConf = data.screen_config.find((s:any) => s.id === sid);
              if (myConf) setScreenDim({ w: myConf.w, h: myConf.h });
          }
      });
  }, [urlEventId, sid]);

  const isTargeted = (targets: number[]) => sid === 0 || targets.includes(sid);

  // Manual override: MC broadcast takes control for 10 minutes, then AutoPilot resumes
  const applyManualOverride = (mode: ScreenMode) => {
    setAutoPilot('MANUAL');
    setScreenMode(mode);
    if (manualOverrideTimer.current) clearTimeout(manualOverrideTimer.current);
    manualOverrideTimer.current = setTimeout(() => {
      setAutoPilot('AUTO');
    }, 10 * 60 * 1000);
  };

  // AutoPilot: subscribe to DB and auto-switch scenes based on live match state
  useEffect(() => {
    const ch = supabase
      .channel(`screen-autopilot-${urlEventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'arena_matches' }, (payload) => {
        const m = payload.new as any;
        // Update matchState from DB for live matches
        if (m?.status === 'LIVE') {
          setMatchState(prev => ({
            eventId: urlEventId, sportType: prev?.sportType || 'SPORT',
            teamA: { name: m.team_a_name, score: m.score_a },
            teamB: { name: m.team_b_name, score: m.score_b },
            currentSet: m.current_set || 1, isPaused: false, announcement: '',
          }));
          // AutoPilot: switch to SCORE when live match detected
          if (autoPilot === 'AUTO') setScreenMode('SCORE');
        }
      })
      .subscribe();

    const configCh = supabase
      .channel(`screen-config-${urlEventId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'arena_tournaments', filter: `id=eq.${urlEventId}` }, (payload) => {
        const t = payload.new as any;
        if (t.screen_config && Array.isArray(t.screen_config)) {
            const myConf = t.screen_config.find((s:any) => s.id === sid);
            if (myConf) setScreenDim({ w: myConf.w, h: myConf.h });
        }
      })
      .subscribe();

    return () => { 
        supabase.removeChannel(ch); 
        supabase.removeChannel(configCh);
    };
  }, [urlEventId, autoPilot, sid]);

  // MC Broadcast channel (manual override)
  useEffect(() => {
    const channel = supabase.channel(`zto-arena-${urlEventId}`, { config: { broadcast: { ack: true } } });
    channel
      .on('broadcast', { event: 'match-update' }, (payload) => {
        if (!isTargeted(payload.payload.targets)) return;
        setMatchState(payload.payload);
        applyManualOverride('SCORE');
      })
      .on('broadcast', { event: 'bracket-update' }, (payload) => {
        if (!isTargeted(payload.payload.targets)) return;
        setBracketState(payload.payload);
        applyManualOverride('BRACKET');
      })
      .on('broadcast', { event: 'screen-mode' }, (payload) => {
        if (!isTargeted(payload.payload.targets)) return;
        applyManualOverride(payload.payload.mode as ScreenMode);
      })
      .on('broadcast', { event: 'ad-update' }, (payload) => {
        if (!isTargeted(payload.payload.targets)) return;
        setActiveAd(payload.payload.activeAd);
        applyManualOverride('ADS');
      })
      .on('broadcast', { event: 'youtube-update' }, (payload) => {
        if (!isTargeted(payload.payload.targets)) return;
        setYoutubeState({ url: payload.payload.url, playing: payload.payload.playing });
        applyManualOverride('YOUTUBE');
      })
      .on('broadcast', { event: 'screen-action' }, (payload) => {
        if (!isTargeted(payload.payload.targets)) return;
        const { action } = payload.payload;
        if (action === 'clear') {
            setScreenMode('STANDBY');
            setAutoPilot('AUTO');
        } else if (action === 'pause-youtube') {
            setYoutubeState(prev => prev ? { ...prev, playing: false } : null);
        } else if (action === 'play-youtube') {
            setYoutubeState(prev => prev ? { ...prev, playing: true } : null);
        } else if (action === 'locate') {
            setShowLocate(true);
            setTimeout(() => setShowLocate(false), 5000);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [urlEventId]);

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden flex flex-col relative select-none cursor-none items-center justify-center"
         onClick={() => setHasInteracted(true)}>
         
      <div 
         className="relative w-full h-full flex flex-col overflow-hidden bg-black shadow-[0_0_50px_rgba(0,0,0,1)]"
         style={screenDim ? { aspectRatio: `${screenDim.w} / ${screenDim.h}`, maxHeight: '100vh', maxWidth: '100vw' } : {}}
      >
        {/* Ambient background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(37,99,235,0.1),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(220,38,38,0.1),transparent_50%)]" />
        </div>

      <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
        {!hasInteracted && (
          <div className="px-3 py-1.5 bg-red-500/20 border border-red-500/50 rounded-full text-red-400 text-[9px] font-black uppercase tracking-widest animate-pulse pointer-events-none shadow-[0_0_10px_rgba(239,68,68,0.3)]">
            <i className="fa-solid fa-volume-xmark mr-2" />
            Click Anywhere to Enable Audio
          </div>
        )}
      </div>

      {/* AutoPilot indicator (top-right, subtle) */}
      <div className={`absolute top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${autoPilot === 'AUTO' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${autoPilot === 'AUTO' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
        {autoPilot === 'AUTO' ? 'AutoPilot' : 'Manual'}
      </div>

      <AnimatePresence>
        {showLocate && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
            <div className="bg-[#0056B3] text-white px-12 py-8 rounded-3xl font-black uppercase tracking-widest text-6xl shadow-[0_0_50px_rgba(0,86,179,0.8)] border border-blue-400 text-center">
              <div className="text-2xl text-blue-300 mb-2">{eventName}</div>
              <div>{sid === 0 ? 'MASTER SCREEN (0)' : `SCREEN ${sid}`}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {screenMode === 'STANDBY' && (
          sportType === 'BADMINTON' && (sid === 0 || isNaN(sid)) ? (
            <Badminton5CourtStandbyView key="badminton-5court" urlEventId={urlEventId} eventName={eventName} />
          ) : (
            <StandbyView key="standby" />
          )
        )}

        {screenMode === 'SCORE' && matchState && (
          <ScoreBoardView key="scoreboard" matchState={matchState} currentSport={matchState.sportType} />
        )}

        {screenMode === 'SCORE' && !matchState && (
          sportType === 'BADMINTON' && (sid === 0 || isNaN(sid)) ? (
            <Badminton5CourtStandbyView key="badminton-5court-no-match" urlEventId={urlEventId} eventName={eventName} />
          ) : (
            <StandbyView key="standby-no-match" />
          )
        )}

        {screenMode === 'ADS' && activeAd && (
          <motion.div key="ad-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col bg-black">
            {activeAd.isVideo ? (
              <video src={activeAd.url} className="w-full h-full object-cover" autoPlay loop muted={!hasInteracted} playsInline />
            ) : (
              <img src={activeAd.url} className="w-full h-full object-cover" alt="Ad" />
            )}
            <div className="absolute bottom-20 left-20">
              <h1 className="text-8xl font-black uppercase text-white drop-shadow-2xl">{activeAd.title}</h1>
            </div>
          </motion.div>
        )}

        {screenMode === 'BRACKET' && (
          <BracketBoardView key="bracket" bracketState={bracketState} />
        )}

        {screenMode === 'YOUTUBE' && youtubeState && (
          <motion.div key="youtube-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 bg-black flex items-center justify-center">
             <ReactPlayer 
                  url={youtubeState.url} 
                  playing={youtubeState.playing} 
                  volume={1} 
                  muted={!hasInteracted}
                  width="100%" 
                  height="100%" 
                  controls={true} 
                  config={{ youtube: { playerVars: { autoplay: 1 } } }}
              />
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

export default function ArenaScreenPage() {
  return (
    <Suspense fallback={<div className="bg-black min-h-screen" />}>
      <ArenaScreenContent />
    </Suspense>
  );
}
