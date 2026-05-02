'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabaseClient';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false }) as any;

// --- TYPES & CONFIG ---

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

export type BracketMatch = {
  id: string;
  round: number;
  team1: string;
  team2: string;
  winner: 1 | 2 | null;
  nextMatchId?: string;
  nextTeamSlot?: 1 | 2;
};

export type BracketData = {
  id: string;
  teamCount: number;
  matches: Record<string, BracketMatch>;
};

const SCENES_LIST = [
  { id: 'SCORE',      icon: 'fa-chart-line',       label: 'Score' },
  { id: 'BRACKET',   icon: 'fa-sitemap',           label: 'Bracket' },
  { id: 'ADS',       icon: 'fa-image',             label: 'Ads & Media' },
  { id: 'YOUTUBE',   icon: 'fa-youtube',           label: 'YouTube' },
  { id: 'DISPATCH',  icon: 'fa-list-check',        label: 'Dispatch' },
  { id: 'JUDGE_ROOM',icon: 'fa-gavel',             label: 'Judge Room' },
  { id: 'GROUPS',    icon: 'fa-table-cells',       label: 'Groups' },
];

const ADS_LIBRARY = [
    {id: 'sponsor1', title: 'Main Sponsor Video Ad', url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4', isVideo: true},
    {id: 'zto_promo', title: 'ZTO Event OS Reel', url: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4', isVideo: true},
    {id: 'stats_ad', title: 'Live Analytics Sponsor', url: 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=3000&auto=format&fit=crop', isVideo: false},
];

const BGM_TRACKS = [
    {id: 'epic_walkin', title: 'Walk-in Anthem (Epic)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'},
    {id: 'suspense', title: 'Match Point Suspense', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'},
    {id: 'winner', title: 'Winner Celebration BGM', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'},
];

// --- BRACKET GENERATOR LOGIC ---

function generateFlexibleBracket(count: number): BracketData {
    const matches: Record<string, BracketMatch> = {};
    const rounds = Math.ceil(Math.log2(count));
    
    for (let r = rounds; r >= 1; r--) {
        const matchesInRound = Math.pow(2, rounds - r);
        for (let i = 1; i <= matchesInRound; i++) {
            const matchId = `R${r}-M${i}`;
            const nextMatchId = r < rounds ? `R${r + 1}-M${Math.ceil(i / 2)}` : undefined;
            const nextTeamSlot = r < rounds ? (i % 2 !== 0 ? 1 : 2) : undefined;
            
            matches[matchId] = { id: matchId, round: r, team1: 'TBD', team2: 'TBD', winner: null, nextMatchId, nextTeamSlot };
        }
    }

    const round1Count = Math.pow(2, rounds - 1);
    for (let i = 1; i <= round1Count; i++) {
        const m = matches[`R1-M${i}`];
        const t1Idx = (i * 2) - 1;
        const t2Idx = i * 2;
        
        m.team1 = t1Idx <= count ? `Team ${t1Idx}` : 'BYE';
        m.team2 = t2Idx <= count ? `Team ${t2Idx}` : 'BYE';
        
        if (m.team2 === 'BYE' && m.team1 !== 'BYE') m.winner = 1;
        if (m.team1 === 'BYE' && m.team2 !== 'BYE') m.winner = 2;
    }

    return { id: 'universal-bracket', teamCount: count, matches };
}

// --- MAIN COMPONENTS ---

function MasterConsoleContent() {
  const params = useParams();
  const eventId = (params.eventId as string) || 'BINTULU_OPEN_2026';
  
  const [previewScene, setPreviewScene] = useState<string>('SCORE');
  const [programScene, setProgramScene] = useState<string>('SCORE');

  const [matchState, setMatchState] = useState<MatchState>({
    eventId, sportType: 'PICKLEBALL', teamA: { name: 'Player A', score: 0 }, teamB: { name: 'Player B', score: 0 }, currentSet: 1, isPaused: false, announcement: '',
  });

  const [teamInputCount, setTeamInputCount] = useState(8);
  const [bracketState, setBracketState] = useState<BracketData>(() => generateFlexibleBracket(8));
  const [dispatchQueue, setDispatchQueue] = useState<{ id: string, name: string, status: string, scoreA: number, scoreB: number, teamA?: string, teamB?: string }[]>([]);
  const [activeAdId, setActiveAdId] = useState<string | null>(null);
  const [activeBgm, setActiveBgm] = useState<string | null>(null);
  
  const [youtubeUrl, setYoutubeUrl] = useState<string>('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [isPlayingMedia, setIsPlayingMedia] = useState<boolean>(false);

  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<any>(null);
  const [isFading, setIsFading] = useState(false);
  
  // Ref to track if we're typing in an input (for spacebar shortcut)
  const isTypingRef = useRef(false);

  // Live DB match for Preview auto-sync
  const [liveDbMatch, setLiveDbMatch] = useState<{ score_a: number; score_b: number; team_a_name: string; team_b_name: string; current_set: number } | null>(null);

  useEffect(() => {
    async function loadRealData() {
        if (!eventId) return;
        const { data: t } = await supabase.from('arena_tournaments').select('id, bracket_json').eq('event_id_slug', eventId).single();
        if (t) {
            if (t.bracket_json && t.bracket_json.events) {
                const firstEvt = Object.keys(t.bracket_json.events)[0];
                if (firstEvt) setBracketState(t.bracket_json.events[firstEvt]);
            }
            const { data: matches } = await supabase.from('arena_matches').select('*').eq('tournament_id', t.id).order('court_number');
            if (matches) {
                const live = matches.filter((m: any) => m.status === 'LIVE' || m.status === 'PENDING').map((m: any) => ({
                    id: m.id, name: `Court ${m.court_number || '?'} - ${m.round_type}`, status: m.status, scoreA: m.score_a, scoreB: m.score_b, teamA: m.team_a_name, teamB: m.team_b_name,
                }));
                setDispatchQueue(live);
            }
        }
    }
    loadRealData();
  }, [eventId]);

  useEffect(() => {
    const channel = supabase.channel(`zto-arena-${eventId}`, { config: { broadcast: { ack: true } } });
    channel
      .on('broadcast', { event: 'screen-mode' }, (payload) => setProgramScene(payload.payload.mode))
      .on('broadcast', { event: 'bracket-update' }, (payload) => setBracketState(payload.payload))
      .subscribe((status) => setIsConnected(status === 'SUBSCRIBED'));
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  // Live DB sync for Preview SCORE
  useEffect(() => {
    const ch = supabase
      .channel(`mc-db-${eventId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'arena_matches' }, (payload) => {
        const m = payload.new as any;
        if (m.status === 'LIVE') {
          setLiveDbMatch({ score_a: m.score_a, score_b: m.score_b, team_a_name: m.team_a_name, team_b_name: m.team_b_name, current_set: m.current_set });
          setMatchState(prev => ({ ...prev, teamA: { ...prev.teamA, name: m.team_a_name, score: m.score_a }, teamB: { ...prev.teamB, name: m.team_b_name, score: m.score_b }, currentSet: m.current_set }));
        }
      })
      .subscribe();
    
    // Keyboard listener for Spacebar (Play/Pause)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlayingMedia(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => { 
        supabase.removeChannel(ch); 
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [eventId]);

  const handleCut = () => {
    setProgramScene(previewScene);
    if (['SCORE', 'ADS', 'BRACKET'].includes(previewScene)) {
      channelRef.current?.send({ type: 'broadcast', event: 'screen-mode', payload: { mode: previewScene } });
    }
    if (previewScene === 'SCORE') channelRef.current?.send({ type: 'broadcast', event: 'match-update', payload: matchState });
    else if (previewScene === 'ADS') { const ad = ADS_LIBRARY.find(a => a.id === activeAdId); if (ad) channelRef.current?.send({ type: 'broadcast', event: 'ad-update', payload: { activeAd: ad } }); }
    else if (previewScene === 'BRACKET') channelRef.current?.send({ type: 'broadcast', event: 'bracket-update', payload: bracketState });
    else if (previewScene === 'YOUTUBE') channelRef.current?.send({ type: 'broadcast', event: 'youtube-update', payload: { url: youtubeUrl, playing: isPlayingMedia } });
  };

  const handleFade = async () => {
    setIsFading(true);
    await new Promise(r => setTimeout(r, 400));
    handleCut();
    await new Promise(r => setTimeout(r, 400));
    setIsFading(false);
  };

  const handleTransition = handleCut;

  const handleRegenBracket = () => {
      const count = Number(teamInputCount);
      if (isNaN(count) || count < 2) return;
      const newBracket = generateFlexibleBracket(count);
      setBracketState(newBracket);
  };

  const renderSimulatedMonitor = (scene: string) => {
       if (scene === 'SCORE') {
            return (
                <div className="flex flex-col items-center justify-center w-full h-full p-4 relative">
                    <div className="absolute top-2 bg-amber-500/20 text-amber-500 px-4 py-1 rounded-full text-[10px] font-black uppercase">SET {matchState.currentSet}</div>
                    <div className="flex w-full mt-4 h-full">
                         <div className="flex-1 border-r border-white/10 flex flex-col items-center justify-center">
                              <span className="text-blue-400 text-[10px] font-black uppercase truncate max-w-full px-2">{matchState.teamA.name}</span>
                              <span className="text-4xl font-black mt-2">{matchState.teamA.score}</span>
                         </div>
                         <div className="flex-1 flex flex-col items-center justify-center">
                              <span className="text-red-400 text-[10px] font-black uppercase truncate max-w-full px-2">{matchState.teamB.name}</span>
                              <span className="text-4xl font-black mt-2">{matchState.teamB.score}</span>
                         </div>
                    </div>
                </div>
            );
       }
       if (scene === 'ADS') {
            const ad = ADS_LIBRARY.find(a => a.id === activeAdId);
            return (
                <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
                    {!ad ? <div className="text-zinc-600 text-xs">No Media Selected</div> : 
                     ad.isVideo ? (
                        <video src={ad.url} className="w-full h-full object-contain" autoPlay={isPlayingMedia} loop muted={scene !== programScene} playsInline />
                     ) : (
                        <img src={ad.url} className="w-full h-full object-contain" />
                     )}
                    {ad && <div className="absolute bottom-2 left-2 text-white font-black text-[10px] drop-shadow-md bg-black/50 px-2 py-1 rounded">{ad.title}</div>}
                </div>
            );
       }
       if (scene === 'YOUTUBE') {
            return (
                <div className="w-full h-full bg-black relative flex items-center justify-center">
                    {youtubeUrl ? (
                        <ReactPlayer url={youtubeUrl} playing={isPlayingMedia && scene === programScene} width="100%" height="100%" controls={false} />
                    ) : (
                        <div className="text-zinc-600 text-xs font-bold uppercase tracking-widest"><i className="fa-brands fa-youtube mr-2 text-red-500"></i>No URL</div>
                    )}
                    {/* Overlay to prevent accidental clicks inside the monitor */}
                    <div className="absolute inset-0 z-10 pointer-events-auto" onClick={() => setIsPlayingMedia(p => !p)} />
                </div>
            );
       }
       if (scene === 'BRACKET') {
            return (
                <div className="flex flex-col items-center justify-center w-full h-full">
                    <i className="fa-solid fa-sitemap text-3xl text-blue-500/40 mb-2" />
                    <span className="font-black text-[10px] text-blue-400 tracking-widest">BRACKET {bracketState.teamCount} TEAMS</span>
                </div>
            );
       }
       return (
            <div className="flex flex-col items-center justify-center w-full h-full opacity-50">
                <i className="fa-solid fa-ban mb-2 text-xl"></i>
                <span className="text-[10px] font-bold">NOT FOR BROADCAST</span>
            </div>
       );
  };

  const renderProperties = () => {
      if (previewScene === 'SCORE') {
          return (
             <div className="flex flex-col gap-4">
                 <div className="flex gap-4">
                     <div className="flex-1">
                         <label className="text-[10px] text-zinc-500 font-bold mb-1 block">TEAM A</label>
                         <input className="w-full bg-[#111] border border-[#333] rounded px-2 py-1 text-white text-xs mb-2" value={matchState.teamA.name} onChange={(e) => setMatchState({...matchState, teamA: {...matchState.teamA, name: e.target.value}})} />
                         <div className="flex items-center gap-2">
                             <button onClick={() => setMatchState({...matchState, teamA: {...matchState.teamA, score: Math.max(0, matchState.teamA.score - 1)}})} className="bg-[#3c3c3c] hover:bg-[#4a4a4a] px-3 py-1 rounded text-xs">-</button>
                             <span className="flex-1 text-center font-black">{matchState.teamA.score}</span>
                             <button onClick={() => setMatchState({...matchState, teamA: {...matchState.teamA, score: matchState.teamA.score + 1}})} className="bg-[#3c3c3c] hover:bg-[#4a4a4a] px-3 py-1 rounded text-xs">+</button>
                         </div>
                     </div>
                     <div className="flex-1">
                         <label className="text-[10px] text-zinc-500 font-bold mb-1 block">TEAM B</label>
                         <input className="w-full bg-[#111] border border-[#333] rounded px-2 py-1 text-white text-xs mb-2" value={matchState.teamB.name} onChange={(e) => setMatchState({...matchState, teamB: {...matchState.teamB, name: e.target.value}})} />
                         <div className="flex items-center gap-2">
                             <button onClick={() => setMatchState({...matchState, teamB: {...matchState.teamB, score: Math.max(0, matchState.teamB.score - 1)}})} className="bg-[#3c3c3c] hover:bg-[#4a4a4a] px-3 py-1 rounded text-xs">-</button>
                             <span className="flex-1 text-center font-black">{matchState.teamB.score}</span>
                             <button onClick={() => setMatchState({...matchState, teamB: {...matchState.teamB, score: matchState.teamB.score + 1}})} className="bg-[#3c3c3c] hover:bg-[#4a4a4a] px-3 py-1 rounded text-xs">+</button>
                         </div>
                     </div>
                 </div>
                 <div>
                    <label className="text-[10px] text-zinc-500 font-bold mb-1 block">SET</label>
                    <input type="number" className="w-[100px] bg-[#111] border border-[#333] rounded px-2 py-1 text-white text-xs" value={matchState.currentSet} onChange={(e) => setMatchState({...matchState, currentSet: parseInt(e.target.value) || 1})} />
                 </div>
             </div>
          );
      }
      if (previewScene === 'ADS') {
          return (
              <div className="space-y-2">
                  <div className="text-[10px] text-zinc-500 font-bold mb-2 uppercase">Video/Image Library</div>
                  {ADS_LIBRARY.map(ad => (
                      <div key={ad.id} onClick={() => setActiveAdId(ad.id)} className={`p-2 rounded border cursor-pointer flex items-center justify-between text-xs transition-colors ${activeAdId === ad.id ? 'bg-fuchsia-600/20 border-fuchsia-500 text-white' : 'bg-[#111] border-[#333] text-zinc-400 hover:border-[#555]'}`}>
                          <span className="truncate flex-1">{ad.title}</span>
                          {activeAdId === ad.id && <i className="fa-solid fa-check text-fuchsia-400" />}
                      </div>
                  ))}
              </div>
          );
      }
      if (previewScene === 'BRACKET') {
          return (
              <div>
                  <div className="text-[10px] text-zinc-500 font-bold mb-2 uppercase">Bracket Topology</div>
                  <div className="flex gap-2">
                      <input type="number" className="w-20 bg-[#111] border border-[#333] rounded px-2 py-1 text-white text-xs" value={teamInputCount} onChange={(e) => setTeamInputCount(parseInt(e.target.value) || 0)} />
                      <button onClick={handleRegenBracket} className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-xs">Init New Tree</button>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2">Note: To execute round advancement, please use a dedicated Backstage view.</p>
              </div>
          );
      }
      if (previewScene === 'DISPATCH') {
          return (
              <div className="text-[10px] text-zinc-400">
                  <p>Semi-auto match dispatching queue.</p>
                  <p className="mt-2">Active Matches: {dispatchQueue.length}</p>
              </div>
          );
      }
      return <div className="text-zinc-600 text-xs italic">Select a broadcast source above to edit properties.</div>;
  };

  return (
    <div className="h-screen bg-[#1e1e1e] text-[#ddd] font-sans overflow-hidden flex flex-col select-none text-[11px]">
        {/* TOP BAR */}
        <header className="bg-black border-b border-[#333] h-8 flex items-center px-4 justify-between">
            <div className="flex items-center gap-4">
                 <Link href={`/arena/${eventId}`} className="text-[#888] hover:text-white uppercase tracking-widest flex items-center gap-1">
                     <i className="fa-solid fa-home"></i> ZTO Event OS
                 </Link>
                 <div className="w-px h-3 bg-[#333]"></div>
                 <div className="font-bold">OBS Mode Workspace</div>
            </div>
            <div className="flex items-center gap-3">
                 <div className="flex items-center gap-1.5 px-2 bg-[#222] rounded border border-[#333]">
                     <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                     <span className="text-[9px] uppercase tracking-widest">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
                 </div>
            </div>
        </header>
        
        {/* MAIN OBS WORKSPACE */}
        <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* TOP HALF: MONITORS */}
            <div className="h-[45%] flex border-b border-black bg-[#111]">
                {/* PREVIEW */}
                <div className="flex-1 flex flex-col border-r border-black p-2 relative">
                    <div className="flex justify-between items-center bg-[#2b2b2b] px-2 py-1 mb-2 shadow-sm border border-[#333] rounded-sm">
                       <span className="font-bold text-[#aaa]">Preview: {previewScene}</span>
                    </div>
                    <div className="flex-1 bg-black border border-[#333] relative overflow-hidden rounded flex items-center justify-center">
                         {renderSimulatedMonitor(previewScene)}
                    </div>
                </div>

                {/* TRANSITION BUTTONS */}
                <div className="w-32 flex flex-col items-center justify-center gap-2 p-2 bg-[#222] border-r border-black">
                    <button onClick={handleCut} className="w-full bg-[#3c3c3c] hover:bg-[#4a4a4a] border border-[#555] py-1.5 rounded shadow-inner text-white font-bold transition-colors">Cut</button>
                    <button onClick={handleFade} disabled={isFading} className="w-full bg-indigo-900/60 hover:bg-indigo-800/80 border border-indigo-700/50 py-1.5 rounded flex items-center justify-center gap-1 text-indigo-300 font-bold transition-colors disabled:opacity-40">
                        {isFading ? <><i className="fa-solid fa-spinner fa-spin text-[9px]" /> Fading…</> : <><i className="fa-solid fa-wave-square text-[9px]" /> Fade</>}
                    </button>
                    <div className="w-full h-px bg-black my-2" />
                    <div className="text-[9px] text-[#777] uppercase font-bold w-full text-center mb-1">Direct Take</div>
                    <button onClick={handleCut} className="w-full bg-blue-600 hover:bg-blue-500 border border-blue-500 py-2 rounded text-white font-black shadow-inner">
                        TAKE <i className="fa-solid fa-arrow-right ml-1" />
                    </button>
                </div>

                {/* PROGRAM */}
                <div className="flex-1 flex flex-col p-2 relative">
                    <div className="flex justify-between items-center bg-[#2b2b2b] px-2 py-1 mb-2 shadow-sm border border-[#333] rounded-sm">
                       <span className="font-bold text-[#aaa]">Program: {programScene}</span>
                    </div>
                    <div className="flex-1 bg-black border border-red-900/50 relative overflow-hidden rounded flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                        {renderSimulatedMonitor(programScene)}
                    </div>
                </div>
            </div>

            {/* BOTTOM HALF: PANELS */}
            <div className="h-[55%] flex bg-[#1e1e1e]">
                 {/* SCENES */}
                 <div className="w-48 border-r border-black flex flex-col">
                     <div className="bg-[#2b2b2b] px-2 py-1 shadow-sm border-b border-[#333] font-bold text-[#aaa] flex justify-between">
                         <span>Scenes</span>
                     </div>
                     <div className="flex-1 overflow-y-auto p-1 bg-[#1a1a1a]">
                         {SCENES_LIST.map(s => (
                              <div key={s.id} onClick={() => setPreviewScene(s.id)} className={`px-2 py-1.5 text-[11px] cursor-pointer border border-transparent rounded-sm flex items-center gap-2 transition-colors ${previewScene === s.id ? 'bg-blue-600/80 text-white' : 'text-[#ccc] hover:bg-[#333]'}`}>
                                  <i className={`fa-solid ${s.icon} text-[9px] opacity-70 w-3 shrink-0`} />
                                  {s.label}
                               </div>
                          ))}
                     </div>
                 </div>

                 {/* SOURCES / PROPERTIES */}
                 <div className="w-80 border-r border-black flex flex-col">
                     <div className="bg-[#2b2b2b] px-2 py-1 shadow-sm border-b border-[#333] font-bold text-[#aaa]">
                         Sources
                     </div>
                     <div className="flex-1 overflow-y-auto bg-[#1e1e1e] p-3 text-[#ddd]">
                          {renderProperties()}
                     </div>
                 </div>

                 {/* AUDIO MIXER */}
                 <div className="flex-1 border-r border-black flex flex-col">
                     <div className="bg-[#2b2b2b] px-2 py-1 shadow-sm border-b border-[#333] font-bold text-[#aaa]">
                         Audio Mixer
                     </div>
                     <div className="flex-1 overflow-y-auto bg-[#1e1e1e] p-4 flex gap-6 text-[#ddd]">
                         {BGM_TRACKS.map(track => (
                             <div key={track.id} className="w-16 flex flex-col items-center">
                                 <div className="text-[9px] uppercase truncate w-24 text-center text-[#888] mb-2 px-1">{track.title}</div>
                                 <div className="flex-1 w-6 bg-black border border-[#333] rounded relative flex items-end overflow-hidden shadow-inner">
                                      <div className={`w-full bg-gradient-to-t from-green-500 via-yellow-400 to-red-500 transition-all duration-300 ${activeBgm === track.id ? 'h-[75%]' : 'h-[5%]'}`} />
                                 </div>
                                 <button onClick={() => setActiveBgm(activeBgm === track.id ? null : track.id)} className={`mt-3 w-16 text-[9px] rounded py-1.5 transition-colors ${activeBgm === track.id ? 'bg-amber-600 text-white' : 'bg-[#3c3c3c] hover:bg-[#4a4a4a] text-zinc-300'}`}>
                                     {activeBgm === track.id ? 'Mute' : 'Play'}
                                 </button>
                             </div>
                         ))}
                     </div>
                 </div>

                 {/* CONTROLS */}
                 <div className="w-48 flex flex-col bg-[#1e1e1e]">
                     <div className="bg-[#2b2b2b] px-2 py-1 shadow-sm border-b border-[#333] font-bold text-[#aaa]">
                         Controls
                     </div>
                     <div className="flex-1 p-2 flex flex-col gap-2">
                         <button className="w-full bg-[#3c3c3c] hover:bg-[#4a4a4a] border border-[#555] py-1.5 rounded shadow-inner text-[#ddd] text-left px-3">Start Streaming</button>
                         <button className="w-full bg-[#3c3c3c] hover:bg-[#4a4a4a] border border-[#555] py-1.5 rounded shadow-inner text-[#ddd] text-left px-3">Start Recording</button>
                         <div className="w-full h-px bg-[#333] my-1" />
                         <button className="w-full bg-[#3c3c3c] hover:bg-[#4a4a4a] py-1.5 rounded text-left px-3 text-[#555]">Studio Mode</button>
                         <button className="w-full bg-[#3c3c3c] hover:bg-[#4a4a4a] border border-[#555] py-1.5 rounded shadow-inner text-[#ddd] text-left px-3">Settings</button>
                         <button className="w-full bg-[#3c3c3c] hover:bg-[#4a4a4a] border border-[#555] py-1.5 rounded shadow-inner text-[#ddd] text-left px-3 pt-3">Exit ZTO Hub</button>
                     </div>
                 </div>
            </div>
            
            {/* STATUS BAR */}
            <div className="h-6 bg-[#222] border-t border-black flex justify-between items-center px-4 text-[10px] text-[#777] font-bold">
                  <span>ZTO ARENA · <span className={isConnected ? 'text-emerald-500' : 'text-red-500'}>{isConnected ? 'CONNECTED' : 'OFFLINE'}</span>{liveDbMatch ? <span className="ml-2 text-emerald-400">· DB ●</span> : null}</span>
                  <span className="text-[#555]">{previewScene} → {programScene}</span>
            </div>
        </div>
    </div>
  );
}

export default function MasterConsolePage() {
    return (
        <Suspense fallback={<div className="bg-black min-h-screen" />}>
            <MasterConsoleContent />
        </Suspense>
    );
}

