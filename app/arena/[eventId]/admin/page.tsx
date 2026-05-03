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
];

const ADS_LIBRARY = [
    {id: 'sponsor1', title: 'Main Sponsor Video Ad', url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4', isVideo: true},
    {id: 'zto_promo', title: 'ZTO Event OS Reel', url: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4', isVideo: true},
    {id: 'stats_ad', title: 'Live Analytics Sponsor', url: 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=3000&auto=format&fit=crop', isVideo: false},
];

const INITIAL_BGM_TRACKS = [
    {id: 'epic_walkin', title: 'Walk-in Anthem', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', volume: 0.5},
    {id: 'suspense', title: 'Match Point', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', volume: 0.5},
    {id: 'winner', title: 'Celebration', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', volume: 0.5},
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
  
  // 5-Screen Target State
  const [targetScreens, setTargetScreens] = useState<number[]>([1,2,3,4,5]);
  type ProgramScreenState = { scene: string; url?: string; isPlaying?: boolean };
  const [programScenes, setProgramScenes] = useState<Record<number, ProgramScreenState>>({
      1: { scene: 'SCORE' }, 2: { scene: 'SCORE' }, 3: { scene: 'SCORE' }, 4: { scene: 'SCORE' }, 5: { scene: 'SCORE' }
  });

  const [matchState, setMatchState] = useState<MatchState>({
    eventId, sportType: 'PICKLEBALL', teamA: { name: 'Player A', score: 0 }, teamB: { name: 'Player B', score: 0 }, currentSet: 1, isPaused: false, announcement: '',
  });

  const [teamInputCount, setTeamInputCount] = useState(8);
  const [bracketState, setBracketState] = useState<BracketData>(() => generateFlexibleBracket(8));
  const [dispatchQueue, setDispatchQueue] = useState<{ id: string, name: string, status: string, scoreA: number, scoreB: number, teamA?: string, teamB?: string }[]>([]);
  const [activeAdId, setActiveAdId] = useState<string | null>(null);
  
  // Audio Mixer State
  const [bgmTracks, setBgmTracks] = useState(INITIAL_BGM_TRACKS);
  const [activeBgm, setActiveBgm] = useState<string | null>(null);
  
  const [youtubeLibrary, setYoutubeLibrary] = useState<{id: string, title: string, url: string}[]>([
      { id: 'yt1', title: 'ZTO Holding Screen', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
  ]);
  const [youtubeUrl, setYoutubeUrl] = useState<string>('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [isPlayingMedia, setIsPlayingMedia] = useState<boolean>(false);

  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<any>(null);
  const [isFading, setIsFading] = useState(false);
  
  // Per-screen LED dimensions (W × H in metres)
  const [screenDimensions, setScreenDimensions] = useState<Record<number, { w: number; h: number }>>(
    { 1: { w: 4, h: 3 }, 2: { w: 4, h: 3 }, 3: { w: 4, h: 3 }, 4: { w: 4, h: 3 }, 5: { w: 4, h: 3 } }
  );
  const [expandedDimScreen, setExpandedDimScreen] = useState<number | null>(null);

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
                    id: m.id, name: `Court ${m.court_number || '?'}`, status: m.status, scoreA: m.score_a, scoreB: m.score_b, teamA: m.team_a_name, teamB: m.team_b_name,
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
      .on('broadcast', { event: 'screen-mode' }, (payload) => {
          // If we receive a broadcast from another director (rare but possible)
      })
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
        }
      })
      .subscribe();
    
    // Keyboard listener for Spacebar (Play/Pause)
    const handleKeyDown = (e: KeyboardEvent) => {
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
    if (targetScreens.length === 0) {
        alert("Please select at least one Target Screen.");
        return;
    }
    const newPrograms = { ...programScenes };
    targetScreens.forEach(s => {
        newPrograms[s] = { scene: previewScene, url: youtubeUrl, isPlaying: isPlayingMedia };
    });
    setProgramScenes(newPrograms);

    // Send broadcast
    if (['SCORE', 'ADS', 'BRACKET', 'YOUTUBE'].includes(previewScene)) {
        channelRef.current?.send({ type: 'broadcast', event: 'screen-mode', payload: { mode: previewScene, targets: targetScreens } });
    }
    if (previewScene === 'SCORE') channelRef.current?.send({ type: 'broadcast', event: 'match-update', payload: { ...matchState, targets: targetScreens } });
    else if (previewScene === 'ADS') { const ad = ADS_LIBRARY.find(a => a.id === activeAdId); if (ad) channelRef.current?.send({ type: 'broadcast', event: 'ad-update', payload: { activeAd: ad, targets: targetScreens } }); }
    else if (previewScene === 'BRACKET') channelRef.current?.send({ type: 'broadcast', event: 'bracket-update', payload: { ...bracketState, targets: targetScreens } });
    else if (previewScene === 'YOUTUBE') channelRef.current?.send({ type: 'broadcast', event: 'youtube-update', payload: { url: youtubeUrl, playing: isPlayingMedia, targets: targetScreens } });
  };

  const handleFade = async () => {
    setIsFading(true);
    await new Promise(r => setTimeout(r, 400));
    handleCut();
    await new Promise(r => setTimeout(r, 400));
    setIsFading(false);
  };

  const handleRegenBracket = () => {
      const count = Number(teamInputCount);
      if (isNaN(count) || count < 2) return;
      const newBracket = generateFlexibleBracket(count);
      setBracketState(newBracket);
  };

  const addNewBgmTrack = () => {
      const url = prompt("Enter Audio/Video URL for BGM:");
      if (url) {
          const title = prompt("Enter Track Title:") || "Custom Track";
          setBgmTracks([...bgmTracks, { id: crypto.randomUUID(), title, url, volume: 0.5 }]);
      }
  };

  const handleScreenAction = (screenNum: number, action: 'play' | 'pause' | 'clear') => {
      const newProg = { ...programScenes };
      if (action === 'clear') {
          newProg[screenNum] = { scene: 'STANDBY' };
          channelRef.current?.send({ type: 'broadcast', event: 'screen-action', payload: { action: 'clear', targets: [screenNum] } });
      } else if (action === 'play') {
          newProg[screenNum].isPlaying = true;
          channelRef.current?.send({ type: 'broadcast', event: 'screen-action', payload: { action: 'play-youtube', targets: [screenNum] } });
      } else if (action === 'pause') {
          newProg[screenNum].isPlaying = false;
          channelRef.current?.send({ type: 'broadcast', event: 'screen-action', payload: { action: 'pause-youtube', targets: [screenNum] } });
      }
      setProgramScenes(newProg);
  };

  const renderSimulatedMonitor = (sceneState: ProgramScreenState | string, isProgram: boolean = false) => {
       const scene = typeof sceneState === 'string' ? sceneState : sceneState.scene;
       const url = typeof sceneState === 'string' ? youtubeUrl : sceneState.url || youtubeUrl;
       const isPlaying = typeof sceneState === 'string' ? isPlayingMedia : (sceneState.isPlaying ?? isPlayingMedia);
       
       if (scene === 'SCORE') {
            return (
                <div className="flex flex-col items-center justify-center w-full h-full p-2 relative">
                    <div className="absolute top-1 bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full text-[8px] font-black uppercase">SET {matchState.currentSet}</div>
                    <div className="flex w-full mt-2 h-full">
                         <div className="flex-1 border-r border-white/10 flex flex-col items-center justify-center">
                              <span className="text-blue-400 text-[8px] font-black uppercase truncate max-w-full px-1">{matchState.teamA.name}</span>
                              <span className="text-2xl font-black mt-1">{matchState.teamA.score}</span>
                         </div>
                         <div className="flex-1 flex flex-col items-center justify-center">
                              <span className="text-red-400 text-[8px] font-black uppercase truncate max-w-full px-1">{matchState.teamB.name}</span>
                              <span className="text-2xl font-black mt-1">{matchState.teamB.score}</span>
                         </div>
                    </div>
                </div>
            );
       }
       if (scene === 'ADS') {
            const ad = ADS_LIBRARY.find(a => a.id === activeAdId);
            return (
                <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
                    {!ad ? <div className="text-zinc-600 text-[10px]">No Media</div> : 
                     ad.isVideo ? (
                        <video src={ad.url} className="w-full h-full object-contain" autoPlay={isPlayingMedia} loop muted playsInline />
                     ) : (
                        <img src={ad.url} className="w-full h-full object-contain" />
                     )}
                    {ad && <div className="absolute bottom-1 left-1 text-white font-black text-[8px] drop-shadow-md bg-black/50 px-1 py-0.5 rounded">{ad.title}</div>}
                </div>
            );
       }
       if (scene === 'YOUTUBE') {
            return (
                <div className="w-full h-full bg-black relative flex items-center justify-center">
                    {url ? (
                        // Muted in program to avoid echo
                        <ReactPlayer 
                            url={url} 
                            playing={isPlaying} 
                            volume={isProgram ? 0 : 1} 
                            muted={isProgram}
                            width="100%" 
                            height="100%" 
                            controls={!isProgram} 
                            onPlay={() => !isProgram && setIsPlayingMedia(true)}
                            onPause={() => !isProgram && setIsPlayingMedia(false)}
                        />
                    ) : (
                        <div className="text-zinc-600 text-[10px] font-bold uppercase"><i className="fa-brands fa-youtube mr-1 text-red-500"></i>No URL</div>
                    )}
                </div>
            );
       }
       if (scene === 'BRACKET') {
            return (
                <div className="flex flex-col items-center justify-center w-full h-full">
                    <i className="fa-solid fa-sitemap text-xl text-blue-500/40 mb-1" />
                    <span className="font-black text-[8px] text-blue-400 tracking-widest">{bracketState.teamCount} TEAMS</span>
                </div>
            );
       }
       return (
            <div className="flex flex-col items-center justify-center w-full h-full opacity-50">
                <i className="fa-solid fa-ban mb-1 text-lg"></i>
                <span className="text-[8px] font-bold">OFF AIR</span>
            </div>
       );
  };

  const renderProperties = () => {
      if (previewScene === 'SCORE') {
          return (
             <div className="flex flex-col gap-4">
                 <div>
                     <label className="text-[10px] text-zinc-500 font-bold mb-1 block uppercase tracking-widest">Select Live Court</label>
                     <select 
                        className="w-full bg-[#111] border border-blue-500/30 text-blue-400 rounded px-2 py-2 text-xs mb-2 font-bold focus:outline-none focus:border-blue-500"
                        onChange={(e) => {
                            if (!e.target.value) return;
                            const m = dispatchQueue.find(x => x.id === e.target.value);
                            if (m) {
                                setMatchState(prev => ({
                                    ...prev,
                                    teamA: { name: m.teamA || 'Team A', score: m.scoreA },
                                    teamB: { name: m.teamB || 'Team B', score: m.scoreB },
                                }));
                            }
                        }}
                     >
                         <option value="">-- Manual Override / None --</option>
                         {dispatchQueue.map(m => (
                             <option key={m.id} value={m.id}>{m.name}: {m.teamA} vs {m.teamB}</option>
                         ))}
                     </select>
                 </div>
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
      if (previewScene === 'YOUTUBE') {
          return (
              <div>
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="font-black text-xs text-white uppercase tracking-widest"><i className="fa-brands fa-youtube text-red-500 mr-2" /> YouTube Player</h3>
                      <button onClick={() => {
                          const url = prompt("Enter YouTube URL:");
                          if (url) {
                              const title = prompt("Enter Video Title:") || "Custom Video";
                              setYoutubeLibrary([...youtubeLibrary, { id: crypto.randomUUID(), title, url }]);
                              setYoutubeUrl(url);
                          }
                      }} className="bg-[#444] hover:bg-[#555] text-white px-2 py-0.5 rounded text-[9px] font-bold">
                          <i className="fa-solid fa-plus mr-1" /> Add Preset
                      </button>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                      {youtubeLibrary.map(yt => (
                          <div key={yt.id} onClick={() => setYoutubeUrl(yt.url)} className={`p-2 rounded border cursor-pointer flex items-center justify-between text-xs transition-colors ${youtubeUrl === yt.url ? 'bg-red-600/20 border-red-500 text-white' : 'bg-[#111] border-[#333] text-zinc-400 hover:border-[#555]'}`}>
                              <span className="truncate flex-1 font-bold">{yt.title}</span>
                              {youtubeUrl === yt.url && <i className="fa-solid fa-play text-red-500" />}
                          </div>
                      ))}
                  </div>

                  <div className="space-y-4 pt-4 border-t border-[#333]">
                      <div>
                          <label className="text-[10px] text-zinc-500 font-bold mb-2 block uppercase tracking-widest">Active URL / Manual Override</label>
                          <input 
                              type="text" 
                              className="w-full bg-black/50 border border-white/10 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-red-500 transition-colors" 
                              value={youtubeUrl} 
                              onChange={(e) => setYoutubeUrl(e.target.value)} 
                              placeholder="https://youtube.com/watch?v=..."
                          />
                      </div>
                      <div className="p-3 bg-zinc-900 border border-white/5 rounded-xl flex items-center justify-center">
                          <button onClick={() => setIsPlayingMedia(p => !p)} className={`w-full py-2 rounded font-black text-xs uppercase tracking-widest transition-all ${isPlayingMedia ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-[#333] text-white hover:bg-[#444]'}`}>
                              <i className={`fa-solid ${isPlayingMedia ? 'fa-pause' : 'fa-play'} mr-2`} /> {isPlayingMedia ? 'Pause' : 'Play Video'}
                          </button>
                      </div>
                  </div>
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
              </div>
          );
      }
      return <div className="text-zinc-600 text-xs italic">Select a broadcast source above to edit properties.</div>;
  };

  return (
    <div className="h-screen bg-[#1e1e1e] text-[#ddd] font-sans overflow-hidden flex flex-col select-none text-[11px]">
        {/* TOP BAR */}
        <header className="bg-black border-b border-[#333] h-8 flex items-center px-4 justify-between shrink-0">
            <div className="flex items-center gap-4">
                 <Link href={`/arena/${eventId}`} className="text-[#888] hover:text-white uppercase tracking-widest flex items-center gap-1">
                     <i className="fa-solid fa-home"></i> ZTO Event OS
                 </Link>
                 <div className="w-px h-3 bg-[#333]"></div>
                 <div className="font-bold">MULTI-SCREEN MASTER CONSOLE</div>
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
            <div className="h-[55%] flex border-b border-black bg-[#111]">
                {/* PREVIEW */}
                <div className="flex-[0.8] flex flex-col border-r border-black p-2 relative min-w-0">
                    <div className="flex justify-between items-center bg-[#2b2b2b] px-2 py-1 mb-2 shadow-sm border border-[#333] rounded-sm">
                       <span className="font-bold text-green-400">Preview: {previewScene}</span>
                    </div>
                    <div className="flex-1 bg-black border border-green-500/50 relative overflow-hidden rounded flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.15)]">
                         {renderSimulatedMonitor(previewScene, false)}
                    </div>
                </div>

                {/* TRANSITION BUTTONS */}
                <div className="w-32 flex flex-col items-center justify-center p-2 bg-[#1a1a1a] border-r border-black shrink-0">
                    <div className="text-[10px] text-[#aaa] font-bold uppercase tracking-widest mb-2">Targets</div>
                    <div className="flex flex-wrap gap-1 mb-4 justify-center">
                        {[1,2,3,4,5].map(s => (
                            <label key={s} className={`cursor-pointer text-[10px] font-black px-2 py-1 rounded border transition-colors ${targetScreens.includes(s) ? 'bg-red-600 text-white border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.3)]' : 'bg-[#222] text-[#555] border-[#333] hover:border-[#555]'}`}>
                                <input type="checkbox" className="hidden" checked={targetScreens.includes(s)} onChange={(e) => {
                                    if (e.target.checked) setTargetScreens([...targetScreens, s]);
                                    else setTargetScreens(targetScreens.filter(x => x !== s));
                                }}/>
                                S{s}
                            </label>
                        ))}
                        <button onClick={() => setTargetScreens(targetScreens.length === 5 ? [] : [1,2,3,4,5])} className="w-full mt-1 text-[9px] py-1 rounded bg-[#333] hover:bg-[#444] text-white border border-[#444]">
                            {targetScreens.length === 5 ? 'DESELECT ALL' : 'SELECT ALL'}
                        </button>
                    </div>

                    <div className="w-full h-px bg-black my-2" />
                    
                    <button onClick={handleCut} className="w-full bg-[#3c3c3c] hover:bg-[#4a4a4a] border border-[#555] py-2 rounded shadow-inner text-white font-bold transition-colors mb-2">Cut</button>
                    <button onClick={handleFade} disabled={isFading} className="w-full bg-indigo-900/60 hover:bg-indigo-800/80 border border-indigo-700/50 py-2 rounded flex items-center justify-center gap-1 text-indigo-300 font-bold transition-colors disabled:opacity-40 mb-4">
                        {isFading ? <><i className="fa-solid fa-spinner fa-spin text-[9px]" /> Fading…</> : <><i className="fa-solid fa-wave-square text-[9px]" /> Fade</>}
                    </button>
                    
                    <button onClick={handleCut} className="w-full bg-red-600 hover:bg-red-500 border border-red-500 py-3 rounded-lg text-white font-black shadow-inner tracking-widest flex flex-col items-center justify-center">
                        TAKE
                        <i className="fa-solid fa-angles-right mt-1" />
                    </button>
                </div>

                {/* PROGRAM (5 SCREENS) */}
                <div className="flex-[1.5] flex flex-col p-2 relative min-w-0 bg-[#0a0a0a]">
                    <div className="flex justify-between items-center bg-[#2b2b2b] px-2 py-1 mb-2 shadow-sm border border-[#333] rounded-sm">
                       <span className="font-bold text-red-400">Program (5 Screens Output)</span>
                    </div>
                    <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-2">
                        {[1,2,3,4,5].map(screenNum => {
                          const dim = screenDimensions[screenNum] || { w: 4, h: 3 };
                          const ratio = `${dim.w} / ${dim.h}`;
                          const isExpanded = expandedDimScreen === screenNum;
                          return (
                            <div key={screenNum} className={`bg-black border relative overflow-hidden rounded flex items-center justify-center group ${targetScreens.includes(screenNum) ? 'border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.2)]' : 'border-[#333]'}`}>
                                <div className="absolute top-1 left-1 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow z-20">S{screenNum}</div>
                                <div className="absolute bottom-1 right-1 bg-black/60 text-white/50 text-[7px] font-black px-1 py-0.5 rounded z-20 uppercase">{programScenes[screenNum].scene}</div>
                                
                                {/* LED Dimension Badge - always visible */}
                                <button
                                    onClick={() => setExpandedDimScreen(isExpanded ? null : screenNum)}
                                    className="absolute top-1 right-1 z-30 flex items-center gap-1 bg-[#0056B3]/80 hover:bg-[#0056B3] border border-[#4da3ff]/40 rounded px-1.5 py-0.5 transition-all"
                                    title="Set LED Screen Dimensions"
                                >
                                    <i className="fa-solid fa-tv text-[7px] text-[#4da3ff]" />
                                    <span className="text-[7px] font-black text-[#4da3ff] font-mono">{dim.w}×{dim.h}M</span>
                                </button>

                                {/* LED Dimension Editor Panel */}
                                {isExpanded && (
                                    <div className="absolute inset-0 z-40 bg-black/95 flex flex-col items-center justify-center p-3 gap-3" onClick={e => e.stopPropagation()}>
                                        <div className="text-[9px] font-black text-[#4da3ff] uppercase tracking-widest">S{screenNum} — LED Dimensions</div>
                                        
                                        {/* Mini LED Visualizer */}
                                        <div className="w-full flex items-center justify-center" style={{ height: 48 }}>
                                            <div style={{
                                                aspectRatio: ratio,
                                                maxWidth: '100%',
                                                maxHeight: 44,
                                                height: '100%',
                                                background: 'linear-gradient(135deg, #000820, #001244)',
                                                border: '1.5px solid #0056B3',
                                                boxShadow: '0 0 12px rgba(0,86,179,0.5), inset 0 0 16px rgba(0,86,179,0.1)',
                                                position: 'relative',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}>
                                                <div style={{
                                                    position: 'absolute', inset: 0,
                                                    backgroundImage: 'linear-gradient(rgba(0,86,179,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,86,179,0.3) 1px, transparent 1px)',
                                                    backgroundSize: '25% 25%',
                                                }} />
                                                <span style={{ position: 'relative', color: '#4da3ff', fontSize: 8, fontWeight: 900, fontFamily: 'monospace', letterSpacing: 1, textShadow: '0 0 6px rgba(77,163,255,0.8)' }}>
                                                    {dim.w}M × {dim.h}M
                                                </span>
                                            </div>
                                        </div>

                                        {/* W / H Inputs */}
                                        <div className="grid grid-cols-2 gap-2 w-full">
                                            <div>
                                                <label className="block text-[8px] font-black text-[#4da3ff] uppercase tracking-widest mb-1">Width (M)</label>
                                                <input
                                                    type="number" min={0.5} step={0.5}
                                                    value={dim.w}
                                                    onChange={e => setScreenDimensions(prev => ({ ...prev, [screenNum]: { ...prev[screenNum], w: Math.max(0.5, parseFloat(e.target.value) || 1) } }))}
                                                    className="w-full bg-black border border-[#0056B3]/50 rounded px-2 py-1.5 text-xs font-black text-white focus:outline-none focus:border-[#4da3ff] text-center font-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[8px] font-black text-[#4da3ff] uppercase tracking-widest mb-1">Height (M)</label>
                                                <input
                                                    type="number" min={0.5} step={0.5}
                                                    value={dim.h}
                                                    onChange={e => setScreenDimensions(prev => ({ ...prev, [screenNum]: { ...prev[screenNum], h: Math.max(0.5, parseFloat(e.target.value) || 1) } }))}
                                                    className="w-full bg-black border border-[#0056B3]/50 rounded px-2 py-1.5 text-xs font-black text-white focus:outline-none focus:border-[#4da3ff] text-center font-mono"
                                                />
                                            </div>
                                        </div>
                                        
                                        {/* Aspect ratio info */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">Ratio</span>
                                            <span className="text-[9px] text-[#4da3ff] font-mono font-black">{dim.w} : {dim.h}</span>
                                        </div>

                                        <button onClick={() => setExpandedDimScreen(null)} className="text-[8px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">
                                            Done ✓
                                        </button>
                                    </div>
                                )}

                                {renderSimulatedMonitor(programScenes[screenNum], true)}
                                
                                {/* Quick Actions Overlay */}
                                <div className="absolute inset-0 bg-black/80 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                                    {programScenes[screenNum].scene === 'YOUTUBE' && (
                                        <button onClick={() => handleScreenAction(screenNum, programScenes[screenNum].isPlaying ? 'pause' : 'play')} className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                                            <i className={`fa-solid ${programScenes[screenNum].isPlaying ? 'fa-pause' : 'fa-play'}`} />
                                        </button>
                                    )}
                                    <button onClick={() => handleScreenAction(screenNum, 'clear')} className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110" title="Clear Screen">
                                        <i className="fa-solid fa-power-off" />
                                    </button>
                                </div>
                            </div>
                          );
                        })}
                    </div>
                </div>
            </div>

            {/* BOTTOM HALF: PANELS */}
            <div className="h-[45%] flex bg-[#1e1e1e]">
                 {/* SCENES */}
                 <div className="w-40 border-r border-black flex flex-col shrink-0">
                     <div className="bg-[#2b2b2b] px-2 py-1 shadow-sm border-b border-[#333] font-bold text-[#aaa]">
                         Scenes
                     </div>
                     <div className="flex-1 overflow-y-auto p-1 bg-[#1a1a1a]">
                         {SCENES_LIST.map(s => (
                              <div key={s.id} onClick={() => setPreviewScene(s.id)} className={`px-2 py-2 text-[11px] font-bold tracking-wide cursor-pointer border border-transparent rounded flex items-center gap-2 transition-colors mb-1 ${previewScene === s.id ? 'bg-green-600/20 text-green-400 border-green-500/30' : 'text-[#888] hover:bg-[#333] hover:text-[#ccc]'}`}>
                                  <i className={`fa-solid ${s.icon} text-[10px] opacity-70 w-4 text-center shrink-0`} />
                                  {s.label}
                               </div>
                          ))}
                     </div>
                 </div>

                 {/* SOURCES / PROPERTIES */}
                 <div className="w-80 border-r border-black flex flex-col shrink-0">
                     <div className="bg-[#2b2b2b] px-2 py-1 shadow-sm border-b border-[#333] font-bold text-[#aaa]">
                         Sources Config
                     </div>
                     <div className="flex-1 overflow-y-auto bg-[#1e1e1e] p-3 text-[#ddd]">
                          {renderProperties()}
                     </div>
                 </div>

                 {/* AUDIO MIXER */}
                 <div className="flex-1 border-r border-black flex flex-col min-w-0">
                     <div className="bg-[#2b2b2b] px-2 py-1 shadow-sm border-b border-[#333] font-bold text-[#aaa] flex justify-between items-center">
                         <span>Audio Mixer</span>
                         <button onClick={addNewBgmTrack} className="bg-[#444] hover:bg-[#555] text-white px-2 py-0.5 rounded text-[9px] font-bold">
                             <i className="fa-solid fa-plus mr-1" /> Add Track
                         </button>
                     </div>
                     <div className="flex-1 overflow-x-auto overflow-y-hidden bg-[#161616] p-4 flex gap-4 text-[#ddd]">
                         {bgmTracks.map(track => (
                             <div key={track.id} className={`w-24 shrink-0 flex flex-col items-center bg-[#222] border rounded-lg p-2 transition-colors ${activeBgm === track.id ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'border-[#333]'}`}>
                                 <div className="text-[9px] uppercase font-bold truncate w-full text-center text-[#888] mb-3">{track.title}</div>
                                 
                                 {/* Volume Slider */}
                                 <input 
                                     type="range" 
                                     min="0" max="1" step="0.01"
                                     className="flex-1 w-2 bg-[#111] appearance-none rounded outline-none cursor-pointer"
                                     style={{ WebkitAppearance: 'slider-vertical', writingMode: 'vertical-lr' } as any}
                                     value={track.volume}
                                     onChange={(e) => {
                                         const v = parseFloat(e.target.value);
                                         setBgmTracks(prev => prev.map(t => t.id === track.id ? {...t, volume: v} : t));
                                     }}
                                 />
                                 <div className="text-[8px] text-[#666] font-mono mt-2">{Math.round(track.volume * 100)}%</div>
                                 
                                 <button onClick={() => setActiveBgm(activeBgm === track.id ? null : track.id)} className={`mt-2 w-full text-[10px] font-black uppercase tracking-widest rounded py-1.5 transition-colors ${activeBgm === track.id ? 'bg-amber-600 text-white' : 'bg-[#3c3c3c] hover:bg-[#4a4a4a] text-zinc-400'}`}>
                                     {activeBgm === track.id ? 'Mute' : 'Play'}
                                 </button>
                                 
                                 {/* Hidden Audio Player */}
                                 {activeBgm === track.id && (
                                     <ReactPlayer url={track.url} playing={true} volume={track.volume} width="0" height="0" style={{display: 'none'}} />
                                 )}
                             </div>
                         ))}
                     </div>
                 </div>
            </div>
            
            {/* STATUS BAR */}
            <div className="h-6 bg-[#111] border-t border-black flex justify-between items-center px-4 text-[9px] text-[#555] font-black tracking-widest uppercase shrink-0">
                  <span>
                      ZTO ARENA OS · <span className={isConnected ? 'text-emerald-500' : 'text-red-500'}>{isConnected ? 'LIVE SYNC' : 'OFFLINE'}</span>
                      {liveDbMatch && <span className="ml-3 text-emerald-400"><i className="fa-solid fa-database mr-1"/>DB ACTIVE</span>}
                  </span>
                  <span>CPU: 14% · MEM: 32MB · DROPPED: 0</span>
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
