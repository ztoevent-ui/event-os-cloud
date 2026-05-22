'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

const ADS_LIBRARY = [
    {id: 'sponsor1', title: 'Main Sponsor Video Ad', url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4', isVideo: true},
    {id: 'zto_promo', title: 'ZTO Event OS Reel', url: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4', isVideo: true},
    {id: 'stats_ad', title: 'Live Analytics Sponsor', url: 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=3000&auto=format&fit=crop', isVideo: false},
];

const YOUTUBE_LIBRARY = [
    { id: 'yt1', title: 'ZTO Holding Screen', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
];

type ScreenConfig = { id: number; w: number; h: number; label?: string };

export type BracketMatch = { id: string; round: number; team1: string; team2: string; winner: 1 | 2 | null; };
export type BracketData = { id: string; teamCount: number; matches: Record<string, BracketMatch>; };

function generateFlexibleBracket(count: number): BracketData {
    const matches: Record<string, BracketMatch> = {};
    const rounds = Math.ceil(Math.log2(count));
    for (let r = rounds; r >= 1; r--) {
        const matchesInRound = Math.pow(2, rounds - r);
        for (let i = 1; i <= matchesInRound; i++) {
            const matchId = `R${r}-M${i}`;
            matches[matchId] = { id: matchId, round: r, team1: 'TBD', team2: 'TBD', winner: null };
        }
    }
    const round1Count = Math.pow(2, rounds - 1);
    for (let i = 1; i <= round1Count; i++) {
        const m = matches[`R1-M${i}`];
        m.team1 = (i * 2) - 1 <= count ? `Team ${(i * 2) - 1}` : 'BYE';
        m.team2 = i * 2 <= count ? `Team ${i * 2}` : 'BYE';
    }
    return { id: 'universal-bracket', teamCount: count, matches };
}

function MasterConsoleContent() {
  const params = useParams();
  const eventId = (params.eventId as string) || 'BINTULU_OPEN_2026';
  const [eventName, setEventName] = useState<string>(eventId);
  
  const [screensConfig, setScreensConfig] = useState<ScreenConfig[]>([{ id: 1, w: 4, h: 3 }, { id: 2, w: 4, h: 3 }]);
  const [targetScreens, setTargetScreens] = useState<number[]>([1,2]);
  
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<any>(null);

  // Load Event Info
  useEffect(() => {
      supabase.from('arena_tournaments').select('name, screen_config').eq('id', eventId).single().then(({data}) => {
          if (data?.name) setEventName(data.name);
          if (data?.screen_config) {
             setScreensConfig(data.screen_config);
             setTargetScreens(data.screen_config.map((s:any) => s.id));
          }
      });
  }, [eventId]);

  // Load Live Matches
  useEffect(() => {
      const fetchMatches = async () => {
         const { data } = await supabase.from('arena_matches').select('*, clan_a:arena_clans!clan_a_id(short_name), clan_b:arena_clans!clan_b_id(short_name)').eq('status', 'LIVE');
         if (data) setLiveMatches(data);
      };
      fetchMatches();

      const ch = supabase.channel(`live-matches-${eventId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'arena_matches' }, () => {
            fetchMatches();
        }).subscribe();
      
      return () => { supabase.removeChannel(ch); }
  }, [eventId]);

  // Setup Broadcast Channel
  useEffect(() => {
      const ch = supabase.channel(`zto-arena-${eventId}`, { config: { broadcast: { ack: true } } });
      ch.subscribe((status) => {
          if (status === 'SUBSCRIBED') setIsConnected(true);
      });
      channelRef.current = ch;
      return () => { supabase.removeChannel(ch); setIsConnected(false); }
  }, [eventId]);

  const pushScore = (match: any) => {
      if (targetScreens.length === 0) return alert("Please select at least one target screen!");
      const matchState = {
          eventId, sportType: match.category_code || 'SPORT',
          teamA: { name: match.clan_a?.short_name || match.team_a_name || 'Team A', score: match.score_a || 0 },
          teamB: { name: match.clan_b?.short_name || match.team_b_name || 'Team B', score: match.score_b || 0 },
          currentSet: match.current_set || 1, isPaused: false, announcement: ''
      };
      channelRef.current?.send({ type: 'broadcast', event: 'match-update', payload: { ...matchState, targets: targetScreens } });
  };

  const pushAd = (ad: any) => {
      if (targetScreens.length === 0) return alert("Select target screens!");
      channelRef.current?.send({ type: 'broadcast', event: 'ad-update', payload: { activeAd: ad, targets: targetScreens } });
  };

  const pushYouTube = (video: any) => {
      if (targetScreens.length === 0) return alert("Select target screens!");
      channelRef.current?.send({ type: 'broadcast', event: 'youtube-update', payload: { url: video.url, playing: true, targets: targetScreens } });
  };

  const pushBracket = () => {
      if (targetScreens.length === 0) return alert("Select target screens!");
      const bracket = generateFlexibleBracket(8);
      channelRef.current?.send({ type: 'broadcast', event: 'bracket-update', payload: { ...bracket, targets: targetScreens } });
  };

  const resetScreens = () => {
      if (targetScreens.length === 0) return alert("Select target screens!");
      channelRef.current?.send({ type: 'broadcast', event: 'screen-action', payload: { action: 'clear', targets: targetScreens } });
  };

  const locateScreens = () => {
      if (targetScreens.length === 0) return alert("Select target screens!");
      channelRef.current?.send({ type: 'broadcast', event: 'screen-action', payload: { action: 'locate', targets: targetScreens } });
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* HEADER */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <Link href={`/arena/${eventId}`} className="text-gray-500 hover:text-black font-bold text-sm uppercase tracking-widest transition-colors">
                      <i className="fa-solid fa-arrow-left mr-2" /> Back
                  </Link>
                  <div className="w-px h-6 bg-gray-200" />
                  <div className="font-black text-gray-900 text-lg uppercase tracking-widest">{eventName}</div>
                  <div className="text-blue-600 font-bold text-sm uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100 hidden md:block">Simplified Master Console</div>
              </div>
              <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest ${isConnected ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                      {isConnected ? 'Broadcasting' : 'Offline'}
                  </div>
              </div>
          </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 mt-8 space-y-8">
          
          {/* SECTION 1: TARGET SCREENS */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                  <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">1. Target Screens</h2>
                  <div className="flex gap-2">
                      <button onClick={locateScreens} className="px-4 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors">
                          <i className="fa-solid fa-location-crosshairs mr-2" /> Locate
                      </button>
                      <button onClick={resetScreens} className="px-4 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors">
                          <i className="fa-solid fa-power-off mr-2" /> Reset to AutoPilot
                      </button>
                  </div>
              </div>
              <div className="flex flex-wrap gap-3">
                  <button 
                      onClick={() => setTargetScreens(targetScreens.length === screensConfig.length ? [] : screensConfig.map(s => s.id))} 
                      className={`px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${targetScreens.length === screensConfig.length ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                      All
                  </button>
                  {screensConfig.map(sc => (
                      <button 
                          key={sc.id}
                          onClick={() => {
                              if (targetScreens.includes(sc.id)) setTargetScreens(targetScreens.filter(x => x !== sc.id));
                              else setTargetScreens([...targetScreens, sc.id]);
                          }}
                          className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2 ${targetScreens.includes(sc.id) ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-transparent bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                          <i className={`fa-solid ${targetScreens.includes(sc.id) ? 'fa-check-circle' : 'fa-tv'}`} /> 
                          Screen {sc.id}
                      </button>
                  ))}
              </div>
          </section>

          {/* SECTION 2: LIVE MATCHES */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">2. Live Matches (Push to Screen)</h2>
              {liveMatches.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <i className="fa-solid fa-table-tennis-paddle-ball text-4xl text-gray-300 mb-3" />
                      <p className="text-sm font-bold text-gray-500">No matches are currently LIVE.</p>
                      <p className="text-xs text-gray-400 mt-1">Wait for a referee to start a match.</p>
                  </div>
              ) : (
                  <div className="overflow-hidden border border-gray-200 rounded-xl">
                      <table className="w-full text-left border-collapse">
                          <thead>
                              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-widest">
                                  <th className="p-4 font-black">Event / Round</th>
                                  <th className="p-4 font-black text-right">Team A</th>
                                  <th className="p-4 font-black text-center">Score</th>
                                  <th className="p-4 font-black">Team B</th>
                                  <th className="p-4 font-black text-right">Action</th>
                              </tr>
                          </thead>
                          <tbody>
                              {liveMatches.map(match => (
                                  <tr key={match.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                      <td className="p-4 font-bold text-sm text-gray-900">
                                          {match.category_code} <span className="text-gray-400 mx-1">•</span> {match.round_type}
                                      </td>
                                      <td className="p-4 text-right font-black text-lg text-blue-700">
                                          {match.clan_a?.short_name || match.team_a_name || 'TBD'}
                                      </td>
                                      <td className="p-4 text-center">
                                          <div className="inline-flex items-center gap-3 bg-gray-900 text-white px-4 py-1.5 rounded-full font-black text-xl tabular-nums shadow-inner">
                                              <span>{match.score_a}</span>
                                              <span className="text-gray-500 text-sm">:</span>
                                              <span>{match.score_b}</span>
                                          </div>
                                      </td>
                                      <td className="p-4 font-black text-lg text-red-600">
                                          {match.clan_b?.short_name || match.team_b_name || 'TBD'}
                                      </td>
                                      <td className="p-4 text-right flex justify-end gap-2">
                                          <button 
                                              onClick={() => pushScore(match)}
                                              title="Push static scoreboard to standard screens"
                                              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition-all active:scale-95"
                                          >
                                              <i className="fa-solid fa-satellite-dish mr-2" /> Broadcast
                                          </button>
                                          <button 
                                              onClick={async () => {
                                                  await supabase.from('arena_live_controls').upsert({ tournament_id: eventId, command: 'SHOW_MATCH', preset_name: match.id }, { onConflict: 'tournament_id' });
                                                  window.open(`/arena/${eventId}/match-overlay`, '_blank');
                                              }}
                                              title="Launch Cinematic VS Overlay in new window"
                                              className="px-6 py-2 bg-indigo-900 hover:bg-indigo-800 text-[#CCFF00] rounded-lg font-black text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition-all active:scale-95 border border-[#CCFF00]/30"
                                          >
                                              <i className="fa-solid fa-bolt mr-2" /> Cinematic Overlay
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              )}
          </section>

          {/* SECTION 3: MEDIA & BRACKET */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">3. Media & Custom Display</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {/* BRACKET CARD */}
                  <div className="border border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-indigo-300 transition-colors group bg-gray-50">
                      <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <i className="fa-solid fa-sitemap text-2xl" />
                      </div>
                      <h3 className="font-black text-gray-900 mb-1">Tournament Bracket</h3>
                      <p className="text-xs text-gray-500 mb-6">Display the live bracket tree.</p>
                      <button onClick={pushBracket} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-black text-xs uppercase tracking-widest transition-all shadow-md">
                          Push Bracket
                      </button>
                  </div>

                  {/* ADS CARDS */}
                  {ADS_LIBRARY.map(ad => (
                      <div key={ad.id} className="border border-gray-200 rounded-xl overflow-hidden flex flex-col hover:border-emerald-300 transition-colors group">
                          <div className="h-32 bg-black relative">
                              {ad.isVideo ? (
                                  <video src={ad.url} className="w-full h-full object-cover opacity-80" muted />
                              ) : (
                                  <img src={ad.url} className="w-full h-full object-cover opacity-80" />
                              )}
                              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded">
                                  {ad.isVideo ? 'Video' : 'Image'}
                              </div>
                          </div>
                          <div className="p-4 flex-1 flex flex-col bg-white">
                              <h3 className="font-black text-gray-900 mb-1 truncate text-sm">{ad.title}</h3>
                              <p className="text-xs text-gray-500 mb-4 flex-1">Sponsor media overlay.</p>
                              <button onClick={() => pushAd(ad)} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-xs uppercase tracking-widest transition-all shadow-md">
                                  Play Ad
                              </button>
                          </div>
                      </div>
                  ))}

                  {/* YOUTUBE CARDS */}
                  {YOUTUBE_LIBRARY.map(yt => (
                      <div key={yt.id} className="border border-gray-200 rounded-xl overflow-hidden flex flex-col hover:border-red-300 transition-colors group">
                          <div className="h-32 bg-gray-100 flex items-center justify-center relative">
                              <i className="fa-brands fa-youtube text-5xl text-red-500" />
                          </div>
                          <div className="p-4 flex-1 flex flex-col bg-white">
                              <h3 className="font-black text-gray-900 mb-1 truncate text-sm">{yt.title}</h3>
                              <p className="text-xs text-gray-500 mb-4 flex-1 truncate">YouTube stream override.</p>
                              <button onClick={() => pushYouTube(yt)} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-black text-xs uppercase tracking-widest transition-all shadow-md">
                                  Play YouTube
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          </section>

      </div>
    </div>
  );
}

export default function MasterConsolePage() {
  return (
    <Suspense fallback={<div className="bg-gray-50 min-h-screen" />}>
      <MasterConsoleContent />
    </Suspense>
  );
}
