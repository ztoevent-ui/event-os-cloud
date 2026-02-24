'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useMasterControl } from '@/lib/sports/useMasterControl';
import { useSportsState } from '@/lib/sports/useSportsState';
import dynamic from 'next/dynamic';
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });
const Player: any = ReactPlayer;

function AudioDeck({ name, deckId, isAdPlaying }: { name: string, deckId: string, isAdPlaying: boolean }) {
    const [url, setUrl] = useState('');
    const [inputUrl, setInputUrl] = useState('');
    const [playing, setPlaying] = useState(false);
    const [volume, setVolume] = useState(0.8);
    const [muted, setMuted] = useState(false);

    // Auto-fade logic for Ads
    const [fadeVolume, setFadeVolume] = useState(1);

    useEffect(() => {
        let interval: any;
        if (isAdPlaying) {
            interval = setInterval(() => {
                setFadeVolume(prev => {
                    const next = prev - 0.1;
                    return next <= 0 ? 0 : next;
                });
            }, 100);
        } else {
            interval = setInterval(() => {
                setFadeVolume(prev => {
                    const next = prev + 0.1;
                    return next >= 1 ? 1 : next;
                });
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isAdPlaying]);

    const handleLoad = () => {
        let finalUrl = inputUrl.trim();
        if (finalUrl && !finalUrl.startsWith('http') && !finalUrl.startsWith('/')) {
            finalUrl = 'https://' + finalUrl;
        }
        setUrl(finalUrl);
        setPlaying(true);
    };

    const actualVolume = volume * fadeVolume;

    return (
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex flex-col gap-3 relative overflow-hidden">
            {isAdPlaying && <div className="absolute inset-0 bg-red-900/10 pointer-events-none animate-pulse"></div>}

            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
                <span className="text-white bg-indigo-600 px-2 py-0.5 rounded shadow">{name}</span>
                {isAdPlaying && fadeVolume === 0 && <span className="text-red-500 animate-pulse">Ad Fade: Muted</span>}
            </div>

            <div className="flex gap-2">
                <input
                    className="flex-1 bg-black border border-gray-800 rounded p-2 text-xs text-white outline-none focus:border-indigo-500"
                    placeholder="YouTube URL or /uploads/music.mp3"
                    value={inputUrl}
                    onChange={e => setInputUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLoad()}
                />
                <button onClick={handleLoad} className="bg-gray-800 hover:bg-indigo-600 text-white px-3 py-1.5 rounded text-xs transition font-bold uppercase tracking-wider">
                    Load
                </button>
            </div>

            <div className="flex items-center gap-4 mt-2">
                <button
                    onClick={() => setPlaying(!playing)}
                    className={`min-w-[40px] h-10 rounded-full flex items-center justify-center text-sm transition shadow-lg ${playing ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                >
                    <i className={`fa-solid ${playing ? 'fa-pause' : 'fa-play'}`}></i>
                </button>

                <div className="flex-1 flex flex-col gap-1 w-full relative">
                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold mb-1">
                        <span><i className="fa-solid fa-volume-down"></i></span>
                        <span>{Math.round(actualVolume * 100)}%</span>
                        <span><i className="fa-solid fa-volume-up"></i></span>
                    </div>
                    <input
                        type="range" min="0" max="1" step="0.05"
                        value={volume} onChange={e => setVolume(parseFloat(e.target.value))}
                        className="w-full accent-indigo-500 relative z-10"
                    />
                </div>

                <button onClick={() => setMuted(!muted)} className={`min-w-[32px] h-8 rounded flex items-center justify-center transition ${muted ? 'bg-red-500/20 text-red-500' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                    <i className={`fa-solid ${muted ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i>
                </button>
            </div>

            {/* Render visibly but small to prevent Chromium blocking offscreen iframes */}
            <div className={`mt-2 h-2 w-full mx-auto rounded overflow-hidden pointer-events-none transition ${playing ? 'opacity-30 border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'opacity-0'}`} title="Engine Runtime">
                <Player
                    url={url}
                    playing={playing}
                    volume={actualVolume}
                    muted={muted}
                    loop={true}
                    width="100%"
                    height="100%"
                    playsinline
                    config={({ youtube: { playerVars: { autoplay: 1 } } } as any)}
                />
            </div>
        </div>
    );
}

export function DJAudioDeck({ isAdPlaying, setManualOverride }: { isAdPlaying: boolean, setManualOverride: (v: boolean) => void }) {
    return (
        <div className="bg-[#111] rounded-2xl border border-gray-800 p-6 flex-1 flex flex-col">
            <h3 className="text-xs font-bold text-gray-500 mb-6 uppercase tracking-widest border-b border-gray-800 pb-3 flex items-center justify-between">
                <span><i className="fa-solid fa-compact-disc text-indigo-500 mr-2"></i> Live DJ Mixer</span>
                <button
                    onClick={() => setManualOverride(!isAdPlaying)}
                    className={`text-[9px] px-2 py-1 rounded border transition ${isAdPlaying ? 'bg-red-900/30 text-red-500 border-red-500/30' : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}`}
                >
                    [{isAdPlaying ? 'OVERRIDE FADE' : 'FORCE FADE'}]
                </button>
            </h3>

            <div className="grid grid-cols-1 gap-4">
                <AudioDeck name="MAIN LINE" deckId="A" isAdPlaying={isAdPlaying} />
                <AudioDeck name="STANDBY LINE" deckId="B" isAdPlaying={isAdPlaying} />
            </div>

            <p className="text-[10px] text-gray-600 mt-auto pt-4 text-center uppercase tracking-wider">
                Music mathematically fades when Ads start.
            </p>
        </div>
    );
}

function AdOperatorRow({ ad, idx, onPlay, onRename }: { ad: any, idx: number, onPlay: () => void, onRename: (newName: string) => void }) {
    // Extract default name from ?name= query param inside the url
    const extractedName = (() => {
        try {
            const urlObj = new URL(ad.url, 'http://localhost');
            return urlObj.searchParams.get('name') || `Video ${idx + 1}`;
        } catch { return `Video ${idx + 1}`; }
    })();

    const [editing, setEditing] = useState(false);
    const [draftName, setDraftName] = useState(extractedName);

    const handleSave = () => {
        setEditing(false);
        if (draftName !== extractedName) onRename(draftName);
    };

    return (
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 p-2 rounded-lg group hover:border-purple-500/50 transition relative">
            <button
                onClick={onPlay}
                className="w-8 h-8 rounded-md bg-purple-900/30 text-purple-400 flex items-center justify-center hover:bg-purple-600 hover:text-white transition shadow-lg shrink-0"
                title="Play on Big Screen"
            >
                <i className="fa-solid fa-play text-xs"></i>
            </button>

            <div className="flex-1 min-w-0 flex items-center group/edit">
                {editing ? (
                    <input
                        autoFocus
                        className="w-full bg-black border border-purple-500/50 rounded px-2 py-1 text-xs text-white outline-none"
                        value={draftName}
                        onChange={e => setDraftName(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                    />
                ) : (
                    <div
                        onDoubleClick={() => setEditing(true)}
                        className="w-full truncate text-xs font-bold text-gray-300 group-hover:text-white cursor-pointer select-none pl-2"
                        title={ad.url}
                    >
                        {extractedName}
                    </div>
                )}
            </div>

            {!editing && (
                <button
                    onClick={() => setEditing(true)}
                    className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-purple-400 opacity-0 group-hover:opacity-100 transition shrink-0 absolute right-2"
                    title="Rename Video"
                >
                    <i className="fa-solid fa-pen text-[10px]"></i>
                </button>
            )}
        </div>
    );
}

export function MasterConsole({ eventId }: { eventId: string }) {
    const {
        gameState,
        conflictWarning,
        sendCommand,
        forceArbitration
    } = useMasterControl(eventId, 'admin');

    // Link with existing state for live metrics
    const { matches, tournament, loading, players, ads, updateAd } = useSportsState(eventId);

    // Derive top/live match for telemetry visualization
    const liveMatch = useMemo(() => {
        return matches.find(m => m.status === 'ongoing') || matches[0];
    }, [matches]);

    // 获取所有活跃场地
    const activeCourts = useMemo(() => {
        return Array.from(new Set(matches.map(m => m.court_id).filter(Boolean))).sort();
    }, [matches]);

    // 动态注入真实赛事名称到 Layout Header (Client-side injection)
    React.useEffect(() => {
        if (tournament?.name) {
            const el = document.getElementById('master-console-tournament-name');
            if (el) el.innerText = tournament.name;
        }
    }, [tournament?.name]);

    // Ad Auto Fade State for Local DJ Deck
    const [adIsPlaying, setAdIsPlaying] = useState(false);

    if (loading) {
        return <div className="text-center text-white/50 animate-pulse mt-20 font-bold uppercase tracking-widest">Loading Sandbox State...</div>;
    }

    // 控制逻辑：锁定当前 event_id 下的裁判 iPad
    const handleLockUI = () => {
        const isLocked = !gameState?.lock;
        sendCommand('LOCK_UI', { locked: isLocked, msg: 'Master Overridden' }, 'referee');
    };

    // 控制逻辑：靶向特效打击，向大屏渲染动画
    const handleTriggerFX = (effectType: 'MATCH_POINT' | 'VICTORY' | 'FIREWORKS', displayUnit = 'ALL') => {
        sendCommand('PLAY_FX', { pattern: effectType, specificDisplay: displayUnit }, 'display');
    };

    // 冲突仲裁覆盖
    const handleForceArbitration = () => {
        if (!liveMatch) return;
        forceArbitration({
            id: liveMatch.id,
            score: [liveMatch.current_score_p1, liveMatch.current_score_p2],
            lock: gameState?.lock,
            type: tournament?.type || 'general'
        });
    };



    // 控制大屏显示模式
    const handleSwitchView = (mode: 'court' | 'ads' | 'list' | 'bracket', court_id?: string, ad_url?: string) => {
        if (mode === 'ads') setAdIsPlaying(true);
        else setAdIsPlaying(false);
        sendCommand('SWITCH_VIEW', { mode, court_id, ad_url }, 'display');
    };

    // 广告声音控制
    const handleAdSound = (action: 'mute' | 'unmute') => {
        sendCommand('AD_CONTROL', { action }, 'display');
        // 同步状态到沙盒，让所有中控台同步显示当前状态
        forceArbitration({
            ...gameState,
            ad_muted: action === 'mute'
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 max-w-7xl mx-auto h-full flex-1">

            <div className="flex flex-col gap-8">
                {/* 动态 UI 生成区：Telemetry 遥测视图 */}
                <div className="bg-[#111] rounded-2xl border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col justify-center items-center relative overflow-hidden flex-1 min-h-[40vh]">
                    {gameState?.lock && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 shadow-[0_0_20px_#ef4444] z-10" />
                    )}

                    <h2 className="absolute top-8 left-8 text-xl font-bold uppercase tracking-[0.2em] text-gray-500">Live Telemetry</h2>

                    <div className="absolute top-8 right-8 text-right">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{tournament?.name || 'Unknown Event'}</div>
                        <div className="text-[#d4f933] text-sm font-black uppercase tracking-widest">{tournament?.type || 'Sport'}</div>
                    </div>

                    {liveMatch ? (
                        <div className="flex flex-col items-center">
                            <div className="flex gap-8 items-end mb-8">
                                <div className="text-center">
                                    <div className="text-gray-500 text-sm font-bold uppercase mb-2 truncate max-w-[150px]">{players[liveMatch.player1_id || '']?.name || 'P1'}</div>
                                    <span className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] font-mono text-[8rem] leading-none font-black tracking-tighter">{liveMatch.current_score_p1}</span>
                                </div>

                                <span className="text-gray-800 text-[5rem] translate-y-[-2rem] font-bold">:</span>

                                <div className="text-center">
                                    <div className="text-gray-500 text-sm font-bold uppercase mb-2 truncate max-w-[150px]">{players[liveMatch.player2_id || '']?.name || 'P2'}</div>
                                    <span className="text-[#d4f933] drop-shadow-[0_0_20px_rgba(212,249,51,0.2)] font-mono text-[8rem] leading-none font-black tracking-tighter">{liveMatch.current_score_p2}</span>
                                </div>
                            </div>

                            <div className="flex gap-4 items-center">
                                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-white uppercase tracking-widest border border-white/5">{liveMatch.status}</span>
                                {liveMatch.court_id && (
                                    <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-white uppercase tracking-widest border border-white/5">{liveMatch.court_id}</span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-600 font-bold uppercase tracking-widest animate-pulse">Waiting for Match Data...</div>
                    )}
                </div>

                {/* 大屏直控 Broadcast Control */}
                <div className="bg-[#111] rounded-2xl border border-gray-800 p-6">
                    <h3 className="text-xs font-bold text-gray-500 mb-6 uppercase tracking-widest border-b border-gray-800 pb-3 flex justify-between items-center">
                        <span>Live Display Control (Override)</span>
                        <i className="fa-solid fa-satellite-dish text-blue-500 animate-pulse"></i>
                    </h3>

                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        <button
                            onClick={() => handleSwitchView('court', activeCourts[0])}
                            className="bg-gray-900 border border-gray-800 hover:border-blue-500 hover:text-blue-400 p-4 rounded-xl text-xs font-bold text-gray-400 transition-colors uppercase tracking-widest shadow-inner group flex flex-col items-center gap-2"
                        >
                            <i className="fa-solid fa-video text-xl group-hover:scale-110 transition-transform"></i>
                            Live Court
                        </button>
                        <button
                            onClick={() => handleSwitchView('list')}
                            className="bg-gray-900 border border-gray-800 hover:border-green-500 hover:text-green-400 p-4 rounded-xl text-xs font-bold text-gray-400 transition-colors uppercase tracking-widest shadow-inner group flex flex-col items-center gap-2"
                        >
                            <i className="fa-solid fa-list text-xl group-hover:scale-110 transition-transform"></i>
                            Match List
                        </button>
                        <button
                            onClick={() => handleSwitchView('bracket')}
                            className="bg-gray-900 border border-gray-800 hover:border-orange-500 hover:text-orange-400 p-4 rounded-xl text-xs font-bold text-gray-400 transition-colors uppercase tracking-widest shadow-inner group flex flex-col items-center gap-2"
                        >
                            <i className="fa-solid fa-sitemap text-xl group-hover:scale-110 transition-transform"></i>
                            Bracket Tree
                        </button>
                        <button
                            onClick={() => handleSwitchView('ads')}
                            className="bg-gradient-to-br from-purple-900/50 to-gray-900 border border-purple-800 hover:border-purple-400 hover:text-purple-300 p-4 rounded-xl text-xs font-bold text-purple-500 transition-colors uppercase tracking-widest shadow-inner group flex flex-col items-center gap-2"
                        >
                            <i className="fa-solid fa-rectangle-ad text-xl group-hover:scale-110 transition-transform"></i>
                            Play Ads
                        </button>
                        <button
                            onClick={() => handleAdSound(gameState?.ad_muted === false ? 'mute' : 'unmute')}
                            className={`p-4 rounded-xl text-xs font-bold transition-all uppercase tracking-widest shadow-inner group flex flex-col items-center gap-2 border ${gameState?.ad_muted === false
                                ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500 hover:bg-yellow-500/30'
                                : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-yellow-500 hover:text-yellow-400'
                                }`}
                        >
                            <i className={`fa-solid ${gameState?.ad_muted === false ? 'fa-volume-high animate-pulse' : 'fa-volume-xmark'} text-xl group-hover:scale-110 transition-transform`}></i>
                            {gameState?.ad_muted === false ? 'Sound: ON' : 'Sound: OFF'}
                        </button>
                    </div>

                    {activeCourts.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-800">
                            <div className="text-[10px] text-gray-600 mb-2 uppercase tracking-widest font-bold">Select Active Court for Live Feed:</div>
                            <div className="flex flex-wrap gap-2">
                                {activeCourts.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => handleSwitchView('court', c as string)}
                                        className="px-4 py-2 bg-gray-900 text-gray-300 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold uppercase tracking-wider transition border border-gray-800 hover:border-blue-500"
                                    >
                                        {c as string}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Offline Direct Video Ad Control */}
                    {ads?.filter(a => a.type === 'video').length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-800">
                            <div className="text-[10px] text-purple-600 mb-3 uppercase tracking-widest font-bold flex items-center gap-2">
                                <i className="fa-solid fa-compact-disc"></i> Direct Video Override (MP4)
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                {ads.filter(a => a.type === 'video').map((ad, idx) => (
                                    <AdOperatorRow
                                        key={ad.id}
                                        ad={ad}
                                        idx={idx}
                                        onPlay={() => handleSwitchView('ads', undefined, ad.url)}
                                        onRename={(name: string) => updateAd(ad.id, name)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>

            <div className="flex flex-col gap-4">
                <DJAudioDeck isAdPlaying={adIsPlaying} setManualOverride={setAdIsPlaying} />
            </div>

            {/* 控制总区 */}
            <div className="flex flex-col gap-4">
                {/* 隔离警告层：自愈仲裁 */}
                {conflictWarning && (
                    <div className="bg-red-950/40 border border-red-500/50 rounded-xl p-5 backdrop-blur-sm animate-pulse">
                        <h4 className="font-bold text-red-500 text-sm flex items-center gap-2 mb-2">
                            <i className="fa-solid fa-triangle-exclamation"></i> STATE CONFLICT
                        </h4>
                        <p className="text-xs text-red-200/70 mb-4">{conflictWarning}</p>
                        <button
                            onClick={handleForceArbitration}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                        >
                            Force Arbitration override
                        </button>
                    </div>
                )}

                <div className="bg-[#111] rounded-2xl border border-gray-800 p-6 flex-1 flex flex-col h-full max-h-[50vh]">
                    <h3 className="text-xs font-bold text-gray-500 mb-6 uppercase tracking-widest border-b border-gray-800 pb-3 flex justify-between items-center">
                        <span>Security & Control</span>
                        <i className="fa-solid fa-lock text-gray-700"></i>
                    </h3>

                    {/* 全域锁定 (Room Lock) */}
                    <button
                        onClick={handleLockUI}
                        className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${gameState?.lock
                            ? 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20'
                            : 'bg-white text-black hover:bg-gray-200 border border-transparent'
                            }`}
                    >
                        {gameState?.lock ? <i className="fa-solid fa-unlock"></i> : <i className="fa-solid fa-lock"></i>}
                        {gameState?.lock ? 'Unlock Endpoints' : 'Lock Global Endpoints'}
                    </button>

                    <p className="text-[10px] text-gray-600 mt-2 text-center uppercase tracking-wider mb-8">
                        Restricts referee input across {eventId} sandbox.
                    </p>

                    <div className="mt-auto">
                        <h4 className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-widest flex items-center gap-2">
                            <i className="fa-solid fa-wand-magic-sparkles"></i> Targeted FX
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleTriggerFX('MATCH_POINT', 'ALL')}
                                className="bg-gray-900 border border-gray-800 hover:border-blue-500 hover:text-blue-400 py-4 rounded-xl text-[10px] font-bold text-gray-400 transition-colors uppercase tracking-widest shadow-inner relative overflow-hidden group"
                            >
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-500/50 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                                Match Point
                            </button>
                            <button
                                onClick={() => handleTriggerFX('FIREWORKS', 'MAIN_STAGE')}
                                className="bg-gray-900 border border-gray-800 hover:border-[#d4f933] hover:text-[#d4f933] py-4 rounded-xl text-[10px] font-bold text-gray-400 transition-colors uppercase tracking-widest shadow-inner relative overflow-hidden group"
                            >
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-[#d4f933]/50 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                                Fireworks
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-600 mt-3 text-center uppercase tracking-wider">
                            Deploys to displays only.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
