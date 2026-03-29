'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

type ScreenMode = 'SCORE' | 'ADS' | 'BRACKET';

type MatchState = {
  eventId: string;
  sportType: string;
  teamA: { name: string; score: number };
  teamB: { name: string; score: number };
  currentSet: number;
  isPaused: boolean;
  announcement: string;
  timer?: number;
};

const defaultAds = [
  { id: 'ad-1', title: 'Platinum Sponsor', url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1000', category: 'Main' },
  { id: 'ad-2', title: 'Main Event Partner', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1000', category: 'Main' },
  { id: 'ad-3', title: 'Food & Beverage', url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000', category: 'Vendor' },
  { id: 'ad-4', title: 'Tech Solutions', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1000', category: 'Partner' },
];

function MasterConsoleContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId') || 'BINTULU_OPEN_2026';
  const sportType = searchParams.get('sport') || 'PICKLEBALL';
  
  const [activeTab, setActiveTab] = useState<'SCORE' | 'ADS' | 'BRACKET' | 'MUSIC'>('SCORE');
  const [screenMode, setScreenMode] = useState<ScreenMode>('SCORE');

  const [matchState, setMatchState] = useState<MatchState>({
    eventId,
    sportType,
    teamA: { name: 'Player A', score: 0 },
    teamB: { name: 'Player B', score: 0 },
    currentSet: 1,
    isPaused: false,
    announcement: '',
  });

  const [activeAdId, setActiveAdId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [locked, setLocked] = useState(false);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const channel = supabase.channel(`zto-arena-${eventId}`, {
      config: { broadcast: { ack: true } },
    });

    channel
      .on('broadcast', { event: 'match-update' }, (payload) => {
        setMatchState(payload.payload);
      })
      .on('broadcast', { event: 'screen-mode' }, (payload) => {
        setScreenMode(payload.payload.mode);
      })
      .on('broadcast', { event: 'ad-update' }, (payload) => {
        setActiveAdId(payload.payload.activeAd?.id || null);
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
        // Initial sync push to screen (optional, but requested by some protocols)
        if (status === 'SUBSCRIBED') {
          setTimeout(() => broadcastScreenMode(screenMode), 1000);
        }
      });

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  const broadcastScreenMode = async (mode: ScreenMode) => {
    setScreenMode(mode);
    if (channelRef.current && isConnected) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'screen-mode',
        payload: { mode },
      });
    }
  };

  const broadcastMatchUpdate = async (newState: MatchState) => {
    setMatchState(newState);
    if (channelRef.current && isConnected) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'match-update',
        payload: newState,
      });
    }
  };

  const broadcastAd = async (ad: any | null) => {
    setActiveAdId(ad?.id || null);
    if (channelRef.current && isConnected) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'ad-update',
        payload: { activeAd: ad },
      });
      // Auto-switch screen mode to ADS if not already
      if (ad && screenMode !== 'ADS') broadcastScreenMode('ADS');
    }
  };

  const updateScore = (team: 'A' | 'B', change: number) => {
    if (locked) return;
    const newState = { ...matchState };
    if (team === 'A') {
      newState.teamA.score = Math.max(0, newState.teamA.score + change);
    } else {
      newState.teamB.score = Math.max(0, newState.teamB.score + change);
    }
    broadcastMatchUpdate(newState);
  };

  const triggerAnnouncement = (type: string) => {
    if (locked) return;
    const newState = { ...matchState, announcement: type };
    broadcastMatchUpdate(newState);
    
    // Auto switch to score view to show the announcement
    if (screenMode !== 'SCORE') broadcastScreenMode('SCORE');
    
    setTimeout(() => {
      setMatchState(prev => {
        const resetState = { ...prev, announcement: '' };
        if (channelRef.current && isConnected) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'match-update',
            payload: resetState,
          });
        }
        return resetState;
      });
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden flex flex-col select-none relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.05),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.05),transparent_40%)] pointer-events-none"></div>

      <header className="z-20 bg-zinc-950 border-b border-white/10 px-6 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-6">
          <Link href="/apps/zto-arena" className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-600 hover:text-white transition-colors tracking-widest group">
            <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
            Hub
          </Link>
          <div className="w-px h-6 bg-white/10"></div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-500 text-black rounded-xl flex items-center justify-center text-xl shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <i className="fa-solid fa-gamepad"></i>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-widest uppercase italic hidden md:block leading-none">Omnibus Console</h1>
              <p className="text-[9px] font-black tracking-[0.2em] text-zinc-500 uppercase mt-1">Node: {eventId}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
            <div className="flex items-center gap-4 bg-zinc-900 border border-white/5 rounded-full p-1.5 shadow-inner">
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-3">Screen Out:</span>
                <button onClick={() => broadcastScreenMode('SCORE')} className={`px-4 py-2 rounded-full text-[10px] font-black tracking-[0.2em] uppercase transition-all ${screenMode === 'SCORE' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'text-zinc-500 hover:text-white'}`}>Score</button>
                <button onClick={() => broadcastScreenMode('ADS')} className={`px-4 py-2 rounded-full text-[10px] font-black tracking-[0.2em] uppercase transition-all ${screenMode === 'ADS' ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-zinc-500 hover:text-white'}`}>Ads</button>
                <button onClick={() => broadcastScreenMode('BRACKET')} className={`px-4 py-2 rounded-full text-[10px] font-black tracking-[0.2em] uppercase transition-all ${screenMode === 'BRACKET' ? 'bg-blue-500 text-black shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'text-zinc-500 hover:text-white'}`}>Bracket</button>
            </div>

            <div className="w-px h-8 bg-white/10"></div>

          <button 
            onClick={() => setLocked(!locked)}
            className={`h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all border ${locked ? 'bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'}`}
          >
            <i className={`fa-solid ${locked ? 'fa-lock' : 'fa-lock-open'}`}></i>
            {locked ? 'Pad Locked' : 'Guard iPad'}
          </button>
        </div>
      </header>

      {/* Internal Tabs for Control Context */}
      <div className="bg-zinc-900/40 border-b border-white/5 px-8 pt-4 flex gap-6 z-10 transition-colors">
          {[
              { id: 'SCORE', label: 'Live Scoring', icon: 'fa-stopwatch' },
              { id: 'ADS', label: 'Media & Ads', icon: 'fa-rectangle-ad' },
              { id: 'BRACKET', label: 'Match Bracket', icon: 'fa-sitemap' },
              { id: 'MUSIC', label: 'Audio FX', icon: 'fa-music' },
          ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 pb-4 border-b-2 transition-all ${activeTab === tab.id ? 'border-amber-500 text-amber-500' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              >
                  <i className={`fa-solid ${tab.icon}`}></i>
                  <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
              </button>
          ))}
      </div>

      <main className="flex-1 p-6 z-10 overflow-y-auto">
        {/* --- SCORE TAB --- */}
        {activeTab === 'SCORE' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Header Controls inside Score */}
                <div className="col-span-1 lg:col-span-2 bg-zinc-900/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white/5 flex flex-wrap items-center justify-between gap-6">
                    <div className="flex bg-black/50 p-1 rounded-xl border border-white/5">
                        {[1, 2, 3, 4, 5].map((set) => (
                        <button 
                            key={set}
                            onClick={() => !locked && broadcastMatchUpdate({ ...matchState, currentSet: set })}
                            className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${matchState.currentSet === set ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            {sportType === 'BASKETBALL' || sportType === 'FUTSAL' ? `Q${set}` : `SET ${set}`}
                        </button>
                        ))}
                    </div>
                
                    <div className="flex gap-4">
                        <button 
                        onClick={() => broadcastMatchUpdate({ ...matchState, isPaused: !matchState.isPaused })}
                        disabled={locked}
                        className={`h-12 px-8 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-colors ${matchState.isPaused ? 'bg-amber-500 text-black' : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white'}`}
                        >
                        <i className={`fa-solid ${matchState.isPaused ? 'fa-play' : 'fa-pause'}`}></i>
                        {matchState.isPaused ? 'Resume Match' : 'Pause'}
                        </button>
                        <button 
                        onClick={() => {
                            if (confirm('Reset scores to 0?')) {
                            broadcastMatchUpdate({ ...matchState, teamA: { ...matchState.teamA, score: 0 }, teamB: { ...matchState.teamB, score: 0 }, announcement: '' });
                            }
                        }} 
                        disabled={locked} 
                        className="h-12 px-6 bg-red-950/40 text-red-500 hover:bg-red-600 hover:text-white rounded-xl border border-red-500/30 font-black text-[11px] uppercase tracking-widest transition flex items-center gap-2"
                        >
                        <i className="fa-solid fa-rotate-right"></i> Reset
                        </button>
                    </div>
                </div>

                <div className={`relative flex flex-col rounded-[2rem] p-8 border-t border-white/10 transition-all duration-500 overflow-hidden min-h-[400px] ${locked ? 'bg-zinc-900/30' : 'bg-gradient-to-br from-blue-900/40 to-black'}`}>
                <div className="absolute inset-0 bg-blue-500/5 mix-blend-overlay"></div>
                <div className="flex justify-between items-start z-10">
                    <input 
                    className="bg-transparent border-none text-4xl font-black uppercase text-blue-400 focus:outline-none w-full placeholder-blue-900"
                    value={matchState.teamA.name}
                    onChange={(e) => broadcastMatchUpdate({ ...matchState, teamA: { ...matchState.teamA, name: e.target.value } })}
                    disabled={locked}
                    />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center z-10 relative">
                    <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div 
                        key={matchState.teamA.score}
                        initial={{ y: 20, opacity: 0, scale: 0.8 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -20, opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="text-[150px] font-black leading-none tabular-nums text-white drop-shadow-[0_0_50px_rgba(37,99,235,0.4)] absolute"
                    >
                        {matchState.teamA.score}
                    </motion.div>
                    </AnimatePresence>
                </div>
                <div className="flex gap-4 mt-8 w-full z-10">
                    <button onClick={() => updateScore('A', -1)} className="flex-1 py-6 rounded-2xl bg-white/5 hover:bg-white/10 text-4xl font-black text-zinc-500 transition active:scale-95 border border-white/5">-</button>
                    <button onClick={() => updateScore('A', 1)} className="flex-[2] py-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-4xl font-bold text-white shadow-xl shadow-blue-900/50 transition active:scale-95 drop-shadow-md">+</button>
                </div>
                </div>

                <div className={`relative flex flex-col rounded-[2rem] p-8 border-t border-white/10 transition-all duration-500 overflow-hidden min-h-[400px] ${locked ? 'bg-zinc-900/30' : 'bg-gradient-to-br from-red-900/40 to-black'}`}>
                <div className="absolute inset-0 bg-red-500/5 mix-blend-overlay"></div>
                <div className="flex justify-end items-start z-10 text-right">
                    <input 
                    className="bg-transparent border-none text-4xl font-black uppercase text-red-500 focus:outline-none w-full text-right placeholder-red-900"
                    value={matchState.teamB.name}
                    onChange={(e) => broadcastMatchUpdate({ ...matchState, teamB: { ...matchState.teamB, name: e.target.value } })}
                    disabled={locked}
                    />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center z-10 relative">
                    <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div 
                        key={matchState.teamB.score}
                        initial={{ y: 20, opacity: 0, scale: 0.8 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -20, opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="text-[150px] font-black leading-none tabular-nums text-white drop-shadow-[0_0_50px_rgba(220,38,38,0.4)] absolute"
                    >
                        {matchState.teamB.score}
                    </motion.div>
                    </AnimatePresence>
                </div>
                <div className="flex gap-4 mt-8 w-full z-10">
                    <button onClick={() => updateScore('B', 1)} className="flex-[2] py-6 rounded-2xl bg-red-600 hover:bg-red-500 text-4xl font-bold text-white shadow-xl shadow-red-900/50 transition active:scale-95 drop-shadow-md">+</button>
                    <button onClick={() => updateScore('B', -1)} className="flex-1 py-6 rounded-2xl bg-white/5 hover:bg-white/10 text-4xl font-black text-zinc-500 transition active:scale-95 border border-white/5">-</button>
                </div>
                </div>

                <div className="col-span-1 lg:col-span-2 bg-zinc-900/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white/5 flex flex-wrap items-center justify-between gap-6">
                <div className="flex-1 min-w-[300px]">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block mb-4">Production Cues (Auto-switches to Score Screen)</span>
                    <div className="flex gap-3">
                    {['MATCH POINT', 'TIMEOUT', 'WINNER'].map(type => (
                        <button 
                        key={type}
                        onClick={() => triggerAnnouncement(type)} 
                        disabled={locked} 
                        className={`px-6 py-4 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all border ${matchState.announcement === type ? 'bg-amber-500 border-amber-400 text-black shadow-lg shadow-amber-500/40 scale-105' : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'}`}
                        >
                        {type}
                        </button>
                    ))}
                    </div>
                </div>
                </div>
            </div>
        )}

        {/* --- ADS TAB --- */}
        {activeTab === 'ADS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-6 mb-2 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-emerald-500 uppercase tracking-widest italic">Ads Media Engine</h2>
                        <p className="text-zinc-500 text-sm mt-1">Select an asset to push it to the main screen. Broadcasts automatically.</p>
                    </div>
                </div>
                {defaultAds.map((ad) => (
                    <motion.div 
                    key={ad.id}
                    whileHover={{ y: -5 }}
                    className={`group relative aspect-video rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${activeAdId === ad.id ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'border-white/5 hover:border-white/20'}`}
                    onClick={() => broadcastAd(ad)}
                    >
                    <img src={ad.url} alt={ad.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-4">
                        <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-1 block">{ad.category}</span>
                        <h3 className="font-bold text-lg leading-tight text-white">{ad.title}</h3>
                    </div>
                    {activeAdId === ad.id && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-emerald-500 text-black text-[8px] font-black rounded uppercase tracking-tighter animate-pulse">
                            Live on Screen
                        </div>
                    )}
                    </motion.div>
                ))}
            </div>
        )}

        {/* --- BRACKET TAB --- */}
        {activeTab === 'BRACKET' && (
            <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-zinc-800 rounded-3xl m-8">
               <i className="fa-solid fa-sitemap text-6xl text-zinc-800 mb-6"></i>
               <h3 className="text-xl font-black text-zinc-500 uppercase tracking-widest">Tournament Bracket Editor</h3>
               <p className="text-zinc-600 mt-2 max-w-sm text-center text-sm">Design the draws and matchups here. Clicking "Push" will render a giant interactive tree on the Arena Screen.</p>

               <button onClick={() => broadcastScreenMode('BRACKET')} className="mt-8 px-8 py-3 bg-blue-500 text-black font-black uppercase tracking-[0.2em] rounded-xl hover:bg-blue-400 transition-all text-sm">
                   Preview Sample Bracket on Screen
               </button>
            </div>
        )}

        {/* --- MUSIC TAB --- */}
        {activeTab === 'MUSIC' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
               {['Walkout Anthem (Team A)', 'Walkout Anthem (Team B)', 'Tension Drone', 'Victory Fanfare', 'Match Point Heartbeat'].map((track, i) => (
                   <div key={track} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 flex flex-col gap-4 group hover:border-violet-500/50 transition-all cursor-pointer">
                       <div className="flex justify-between items-start">
                           <div className="w-10 h-10 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center text-lg">
                               <i className="fa-solid fa-music"></i>
                           </div>
                           <button className="text-zinc-600 hover:text-white transition-colors">
                               <i className="fa-solid fa-ellipsis-vertical"></i>
                           </button>
                       </div>
                       <div>
                           <div className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-1">Track 0{i+1}</div>
                           <h3 className="font-bold text-white leading-tight">{track}</h3>
                       </div>
                       <button className="w-full py-3 bg-white/5 hover:bg-violet-600 hover:text-white rounded-xl transition-all text-xs font-black uppercase tracking-widest mt-2 border border-white/5 text-zinc-400 flex items-center justify-center gap-2">
                           <i className="fa-solid fa-play"></i> Play Local
                       </button>
                   </div>
               ))}
            </div>
        )}
      </main>
    </div>
  );
}

export default function MasterConsolePage() {
    return (
        <Suspense fallback={<div className="bg-black min-h-screen"></div>}>
            <MasterConsoleContent />
        </Suspense>
    );
}
