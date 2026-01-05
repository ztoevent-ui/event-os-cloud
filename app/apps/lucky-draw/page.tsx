'use strict';
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';
import Swal from 'sweetalert2';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// Register Chart.js plugins
Chart.register(ChartDataLabels);

const SUPABASE_URL = 'https://zihjzbweasaqqbwilshx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function LuckyDrawPage() {
    const [dbStatus, setDbStatus] = useState<'online' | 'offline'>('offline');
    const [countDisplay, setCountDisplay] = useState(0);
    const [names, setNames] = useState<string[]>([]);
    const [winners, setWinners] = useState<any[]>([]);
    const [isSpinning, setIsSpinning] = useState(false);
    const [drawCount, setDrawCount] = useState(1);
    const [eventTitle, setEventTitle] = useState('EVENT TITLE');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [bigWinnerModalOpen, setBigWinnerModalOpen] = useState(false);
    const [bigWinnerNames, setBigWinnerNames] = useState<string[]>([]);

    // Settings state
    const [titlePos, setTitlePos] = useState(40);
    const [titleSize, setTitleSize] = useState(48);
    const [titleColor, setTitleColor] = useState('#333333');
    const [titleAlign, setTitleAlign] = useState<'left' | 'center' | 'right'>('center');
    const [maskColor, setMaskColor] = useState<'white' | 'black'>('white');
    const [maskOpacity, setMaskOpacity] = useState(50);
    const [backgroundImage, setBackgroundImage] = useState('url(https://img.freepik.com/free-vector/gradient-lucky-draw-background_23-2150063963.jpg)');

    const wheelCanvasRef = useRef<HTMLCanvasElement>(null);
    const wheelChartRef = useRef<Chart | null>(null);
    const bgmPlayerRef = useRef<HTMLAudioElement>(null);
    const winSoundRef = useRef<HTMLAudioElement>(null);
    const supabaseRef = useRef<any>(null);
    const spinningIntervalRef = useRef<any>(null);

    // Initialization
    useEffect(() => {
        initSupabase();
        loadSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Chart Effect
    useEffect(() => {
        if (wheelCanvasRef.current) {
            initWheel();
        }
        return () => {
            if (wheelChartRef.current) {
                wheelChartRef.current.destroy();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [names]); // Re-init or update when names change

    const initSupabase = async () => {
        try {
            const client = createClient(SUPABASE_URL, SUPABASE_KEY);
            supabaseRef.current = client;

            const { error: pingError } = await client.from('participants').select('id', { count: 'exact', head: true }).limit(1);
            if (pingError) {
                console.error('DB ping failed:', pingError);
                setDbStatus('offline');
                Swal.fire('Error', `Database not connected: ${pingError.message}`, 'error');
                return;
            }

            await fetchData();

            client.channel('public:participants').on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, (payload) => {
                console.log('DB Change:', payload);
                fetchData();
            }).subscribe((status) => {
                setDbStatus(status === 'SUBSCRIBED' ? 'online' : 'offline');
            });

        } catch (e: any) {
            console.error('Supabase Init Fail', e);
            setDbStatus('offline');
            Swal.fire('Error', `Database not connected: ${e.message || e}`, 'error');
        }
    };

    const fetchAllRows = async (table: string, isWinner: boolean) => {
        let allRows: any[] = [];
        let from = 0;
        const step = 1000;
        let keepFetching = true;

        if (!supabaseRef.current) return [];

        while (keepFetching) {
            const { data, error } = await supabaseRef.current
                .from(table)
                .select('id,name,is_winner,updated_at,created_at')
                .eq('is_winner', isWinner)
                .order('id', { ascending: true })
                .range(from, from + step - 1);

            if (error) {
                console.error('Fetch error:', error);
                return allRows;
            }

            if (data && data.length > 0) {
                allRows = allRows.concat(data);
                from += step;
                if (data.length < step) keepFetching = false;
            } else {
                keepFetching = false;
            }
        }
        return allRows;
    };

    const fetchData = async () => {
        if (!supabaseRef.current) return;
        try {
            const activeData = await fetchAllRows('participants', false);
            const nameList = activeData.map((r: any) => r.name);
            setNames(nameList);
            setCountDisplay(nameList.length);

            const winData = await fetchAllRows('participants', true);
            const sortedWinners = winData
                .map((r: any) => ({ id: r.id, name: r.name, updated_at: r.updated_at, created_at: r.created_at }))
                .sort((a: any, b: any) => {
                    const ta = new Date(a.updated_at || a.created_at || 0).getTime();
                    const tb = new Date(b.updated_at || b.created_at || 0).getTime();
                    return tb - ta;
                });
            setWinners(sortedWinners);
        } catch (e) {
            console.error('Fetch logic error:', e);
        }
    };

    const initWheel = () => {
        if (!wheelCanvasRef.current) return;
        const ctx = wheelCanvasRef.current.getContext('2d');
        if (!ctx) return;

        if (wheelChartRef.current) {
            wheelChartRef.current.destroy();
        }

        const data = names.length > 0 ? names : ['READY', 'SPIN'];

        wheelChartRef.current = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data,
                datasets: [{
                    data: data.map(() => 1),
                    backgroundColor: data.map((_, i) => COLORS[i % COLORS.length]),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 0 },
                layout: { padding: 20 },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false },
                    datalabels: {
                        color: '#fff',
                        font: { weight: 'bold', size: (context: any) => (names.length > 50 ? 0 : 16) },
                        formatter: (v: any, c: any) => c.chart.data.labels ? c.chart.data.labels[c.dataIndex] : '',
                        rotation: (context: any) => (context.dataIndex * (360 / (context.chart.data.labels?.length || 1)) + (360 / (context.chart.data.labels?.length || 1) / 2)) + 90,
                        anchor: 'end',
                        align: 'start',
                        offset: 10
                    }
                }
            } as any
        });
    };

    const startSpin = () => {
        if (isSpinning) return;
        if (names.length === 0) return Swal.fire('Error', 'Database Empty!', 'error');
        if (drawCount > names.length) return Swal.fire('Error', 'Not enough people', 'error');

        if (spinningIntervalRef.current) {
            clearInterval(spinningIntervalRef.current);
            spinningIntervalRef.current = null;
        }

        setIsSpinning(true);

        if (!isMuted && bgmPlayerRef.current) {
            bgmPlayerRef.current.play().catch(() => { });
        }

        if (winSoundRef.current) {
            winSoundRef.current.volume = 0;
            winSoundRef.current.play().then(() => {
                if (winSoundRef.current) {
                    winSoundRef.current.pause();
                    winSoundRef.current.currentTime = 0;
                    winSoundRef.current.volume = 1;
                }
            }).catch(() => { });
        }

        let rot = 0;
        let spd = 60;
        spinningIntervalRef.current = setInterval(() => {
            if (wheelChartRef.current) {
                rot += spd;
                (wheelChartRef.current.options as any).rotation = rot % 360;
                wheelChartRef.current.update('none');
                if (spd > 0.5) spd *= 0.99;
            }
        }, 16);

        setTimeout(() => {
            if (spinningIntervalRef.current) {
                clearInterval(spinningIntervalRef.current);
                spinningIntervalRef.current = null;
            }
            selectWinners(drawCount);
        }, 3000);
    };

    const selectWinners = async (count: number) => {
        if (bgmPlayerRef.current) bgmPlayerRef.current.pause();
        if (!isMuted && winSoundRef.current) {
            winSoundRef.current.currentTime = 0;
            winSoundRef.current.play().catch(() => { });
        }

        try {
            const eligible = await fetchAllRows('participants', false);
            if (!eligible || eligible.length === 0) {
                Swal.fire('Error', 'No eligible participants left.', 'error');
                return;
            }

            const targetCount = Math.min(count, eligible.length);
            const picked = new Map();
            const maxAttempts = targetCount * 8;
            let attempts = 0;

            while (picked.size < targetCount && attempts < maxAttempts) {
                attempts++;
                const r = Math.floor(Math.random() * eligible.length);
                const row = eligible[r];
                if (!row || row.id == null) continue;
                if (picked.has(row.id)) continue;

                const { data, error } = await supabaseRef.current
                    .from('participants')
                    .update({ is_winner: true })
                    .eq('id', row.id)
                    .eq('is_winner', false)
                    .select('id,name');

                if (error) {
                    console.error('Claim winner error:', error);
                    continue;
                }

                if (data && data.length === 1) {
                    picked.set(data[0].id, data[0].name);
                }
            }

            const batchNames = [...picked.values()];
            if (batchNames.length === 0) {
                Swal.fire('Error', 'Draw failed (collision). Please try again.', 'error');
                return;
            }

            await fetchData();
            fireConfetti();
            setIsSpinning(false);
            setBigWinnerNames(batchNames);
            setBigWinnerModalOpen(true);

        } catch (e) {
            setIsSpinning(false);
            console.error(e);
        } finally {
            setIsSpinning(false);
        }
    };

    const fireConfetti = () => {
        const end = Date.now() + 3000;
        const frame = () => {
            confetti({ particleCount: 5, spread: 60, origin: { y: 0.6 } });
            if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
    };

    // Settings Handlers
    const saveSettings = () => {
        localStorage.setItem('ld_title', eventTitle);
        localStorage.setItem('ld_title_pos', String(titlePos));
        localStorage.setItem('ld_title_size', String(titleSize));
        localStorage.setItem('ld_title_color', titleColor);
        localStorage.setItem('ld_title_align', titleAlign);
        localStorage.setItem('ld_mask_color', maskColor);
        localStorage.setItem('ld_mask_opacity', String(maskOpacity));
    };

    const loadSettings = () => {
        const t = localStorage.getItem('ld_title'); if (t) setEventTitle(t);
        const p = localStorage.getItem('ld_title_pos'); if (p) setTitlePos(Number(p));
        const s = localStorage.getItem('ld_title_size'); if (s) setTitleSize(Number(s));
        const c = localStorage.getItem('ld_title_color'); if (c) setTitleColor(c);
        const a = localStorage.getItem('ld_title_align'); if (a) setTitleAlign(a as any);
        const mc = localStorage.getItem('ld_mask_color'); if (mc) setMaskColor(mc as any);
        const mo = localStorage.getItem('ld_mask_opacity'); if (mo) setMaskOpacity(Number(mo));
    };

    const handleGoogleSheet = async () => {
        if (!supabaseRef.current) return;
        const { value: url } = await Swal.fire({
            title: 'Import CSV Link',
            input: 'url',
            inputLabel: 'Paste your Direct CSV Link (Publish to Web)',
            inputPlaceholder: 'https://docs.google.com/.../pub?output=csv',
            showCancelButton: true
        });

        if (url) {
            Swal.fire({ title: 'Fetching...', didOpen: () => Swal.showLoading() });
            try {
                let res;
                try { res = await fetch(url); } catch { res = null; }
                if (!res || !res.ok) {
                    const proxied = `https://r.jina.ai/http(s)://` + url.replace(/^https:\/\//, '');
                    res = await fetch(proxied);
                }
                if (!res.ok) throw new Error(`Fetch Failed (Status: ${res.status})`);

                const csvText = await res.text();
                // Basic CSV parsing logic from original
                const rows = csvText.split('\n').map(r => r.trim()).filter(r => r && !r.startsWith('Title:') && !r.startsWith('URL') && !r.startsWith('Markdown'));
                const validNames = rows
                    .filter(r => !r.toLowerCase().match(/^(name|nama|no|id)$/))
                    .map(line => ({ name: line.split(',')[0].replace(/['"]/g, '').trim(), is_winner: false }))
                    .filter(n => n.name.length > 0);

                const chunkSize = 1000;
                for (let i = 0; i < validNames.length; i += chunkSize) {
                    await supabaseRef.current.from('participants').insert(validNames.slice(i, i + chunkSize));
                }
                await fetchData();
                Swal.fire('Success', `Imported ${validNames.length} names!`, 'success');
            } catch (e: any) {
                Swal.fire('Error', `Failed: ${e.message}`, 'error');
            }
        }
    };

    return (
        <div className="min-h-screen overflow-hidden font-sans transition-all duration-500 ease-in-out" style={{ backgroundImage, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {/* Global Overlay */}
            <div className="fixed inset-0 pointer-events-none z-0 transition-colors duration-300"
                style={{ backgroundColor: maskColor === 'white' ? `rgba(255, 255, 255, ${maskOpacity / 100})` : `rgba(0, 0, 0, ${maskOpacity / 100})` }}>
            </div>

            <Link href="/" className="fixed top-6 left-6 z-[60] bg-white/20 backdrop-blur-sm border border-white/30 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-white hover:text-gray-800 transition transform hover:scale-110">
                <i className="fa-solid fa-arrow-left"></i>
            </Link>

            {/* Content Layer */}
            <div className="relative z-10 h-screen w-full flex flex-col pointer-events-auto">
                {/* Title */}
                <div id="topTitleContainer" className={`w-full flex px-4 transition-all duration-100 items-center ${titleAlign === 'left' ? 'justify-start' : titleAlign === 'right' ? 'justify-end' : 'justify-center'}`} style={{ paddingTop: `${titlePos}px` }}>
                    <input
                        type="text"
                        value={eventTitle}
                        onChange={(e) => { setEventTitle(e.target.value); saveSettings(); }}
                        className="bg-transparent border-none focus:ring-2 focus:ring-white/30 rounded-lg outline-none font-black uppercase tracking-wider text-center placeholder-gray-400"
                        style={{ fontSize: `${titleSize}px`, color: titleColor }}
                    />
                </div>

                {/* Stage */}
                <div className="flex-1 w-full flex items-center justify-center relative">
                    {/* Status Pill */}
                    <div className="absolute top-4 left-6 z-20">
                        <div className="flex items-center gap-2 text-gray-700 bg-white/40 border border-white/40 px-4 py-2 rounded-full backdrop-blur-md shadow-sm text-sm font-bold">
                            <span className={`w-2.5 h-2.5 rounded-full inline-block mr-1.5 ${dbStatus === 'online' ? 'bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`}></span>
                            <span>{countDisplay}</span> Participants
                        </div>
                    </div>

                    {/* Wheel */}
                    <div className="h-[75%] aspect-square relative flex items-center justify-center">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[50px] border-t-red-600 drop-shadow-xl pointer-events-none"></div>
                        <canvas ref={wheelCanvasRef} className="drop-shadow-2xl"></canvas>

                        <div className="absolute -bottom-8 flex flex-col items-center gap-2 z-30">
                            <button
                                onClick={startSpin}
                                disabled={isSpinning}
                                className="cursor-pointer bg-gradient-to-r from-red-600 to-rose-600 text-white text-3xl font-black px-12 py-3 rounded-full shadow-lg shadow-red-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border-2 border-white/20 disabled:opacity-70"
                            >
                                {isSpinning ? '...' : 'SPIN'}
                            </button>
                            <div className="bg-white/60 backdrop-blur-md rounded-full px-4 py-1 shadow-sm border border-white/40 flex items-center gap-2 text-sm">
                                <span className="text-gray-600 font-bold text-xs">DRAW:</span>
                                <input
                                    type="number"
                                    min="1"
                                    value={drawCount}
                                    onChange={(e) => setDrawCount(parseInt(e.target.value) || 1)}
                                    className="w-10 bg-transparent text-center font-bold text-gray-800 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Winners List */}
                    <div className="absolute right-6 top-6 bottom-6 w-64 flex flex-col pointer-events-none">
                        <div className="flex justify-between items-center pointer-events-auto pl-2 mb-2">
                            <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider">Cloud Winners</h3>
                            <button className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition bg-white/50 backdrop-blur"><i className="fa-solid fa-download"></i> Save</button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 pointer-events-auto" style={{ direction: 'rtl' }}>
                            {winners.map((w, i) => (
                                <div key={i} className="bg-white/60 p-2 rounded-lg shadow-sm border-l-4 border-yellow-400 ml-2 backdrop-blur-sm" style={{ direction: 'ltr' }}>
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-gray-800 text-sm truncate w-32">{w.name}</span>
                                        <span className="text-[10px] text-gray-600">Winner</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Big Winner Modal */}
            <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${bigWinnerModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div className={`w-[90%] h-[80%] md:w-[80%] md:h-[85%] rounded-3xl border-4 border-yellow-400 flex flex-col relative overflow-hidden transform transition-transform duration-500 ${bigWinnerModalOpen ? 'scale-100' : 'scale-75'} bg-red-800`}>
                    <div className="absolute inset-0 bg-cover opacity-20" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')" }}></div>
                    <div className="text-center pt-8 pb-4 z-10">
                        <h2 className="text-yellow-400 font-black text-4xl md:text-6xl uppercase tracking-widest drop-shadow-lg" style={{ textShadow: '0 4px 0 #000' }}>🎉 Congratulations 🎉</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 z-10 text-center flex flex-col items-center justify-center gap-4">
                        {bigWinnerNames.map((name, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-md text-white font-black text-3xl md:text-5xl py-4 px-8 rounded-2xl border border-yellow-400/30 shadow-lg w-full max-w-3xl transform hover:scale-105 transition">{name}</div>
                        ))}
                    </div>
                    <div className="pb-8 pt-4 flex justify-center z-10 bg-gradient-to-t from-red-900 to-transparent">
                        <button onClick={() => setBigWinnerModalOpen(false)} className="bg-yellow-400 hover:bg-yellow-300 text-red-900 text-xl font-black px-12 py-3 rounded-full shadow-lg hover:scale-105 transition transform border-b-4 border-yellow-600">CLOSE</button>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="fixed top-6 right-6 z-50 flex gap-2">
                <button onClick={() => setIsFullscreen(!isFullscreen)} className="w-10 h-10 bg-white/30 hover:bg-white/50 backdrop-blur text-gray-800 rounded-full shadow border border-white/30 transition flex items-center justify-center"><i className="fa-solid fa-expand"></i></button>
                <button onClick={() => setIsMuted(!isMuted)} className="w-10 h-10 bg-white/30 hover:bg-white/50 backdrop-blur text-gray-800 rounded-full shadow border border-white/30 transition flex items-center justify-center"><i className={`fa-solid ${isMuted ? 'fa-volume-xmark text-red-500' : 'fa-volume-high'}`}></i></button>
                <button onClick={() => setSettingsOpen(!settingsOpen)} className="w-10 h-10 bg-white/30 hover:bg-white/50 backdrop-blur text-gray-800 rounded-full shadow border border-white/30 transition flex items-center justify-center"><i className="fa-solid fa-gear"></i></button>
            </div>

            {/* Settings Panel */}
            <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-40 flex flex-col text-gray-800 font-sans border-l border-gray-100 transition-transform duration-300 ${settingsOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-5 bg-gray-900 text-white flex justify-between items-center shadow-md">
                    <h2 className="font-bold text-lg"><i className="fa-solid fa-sliders mr-2"></i> Cloud Settings</h2>
                    <button onClick={() => setSettingsOpen(false)} className="hover:text-red-400 transition"><i className="fa-solid fa-xmark text-xl"></i></button>
                </div>
                <div className="p-5 flex-1 overflow-y-auto space-y-6">
                    {/* Title Controls */}
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-4">
                        <h3 className="text-xs font-bold text-indigo-500 uppercase flex items-center gap-2"><i className="fa-solid fa-text-height"></i> Title Controls</h3>
                        <div>
                            <div className="flex justify-between text-xs font-bold text-gray-500 mb-1"><span>V-Position</span><span className="text-indigo-400">↕️ Move</span></div>
                            <input type="range" min="0" max="500" value={titlePos} onChange={(e) => { setTitlePos(Number(e.target.value)); saveSettings(); }} className="w-full" />
                        </div>
                        <div>
                            <div className="flex justify-between text-xs font-bold text-gray-500 mb-1"><span>Font Size</span><span className="text-indigo-400">Aa Size</span></div>
                            <input type="range" min="20" max="150" value={titleSize} onChange={(e) => { setTitleSize(Number(e.target.value)); saveSettings(); }} className="w-full" />
                        </div>
                    </div>

                    {/* Data Sources */}
                    <div className="space-y-3 border-t border-gray-100 pt-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase">Data Sources</h3>
                        <button onClick={handleGoogleSheet} className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:bg-green-50 text-sm font-medium text-green-700 flex items-center justify-between">
                            <span><i className="fa-brands fa-google-drive mr-2"></i> Import Google Sheet</span>
                        </button>
                        <button onClick={async () => {
                            if (!supabaseRef.current) return;
                            const { error } = await supabaseRef.current.from('participants').delete().gte('id', 0);
                            if (!error) { Swal.fire('Deleted', 'Database cleared.', 'success'); fetchData(); }
                        }} className="w-full text-red-500 hover:bg-red-50 font-bold py-2 rounded-xl transition text-sm flex items-center justify-center gap-2">
                            <i className="fa-solid fa-trash"></i> DELETE All Database
                        </button>
                    </div>
                </div>
            </div>

            {/* Audio Elements */}
            <audio ref={bgmPlayerRef} loop src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"></audio>
            <audio ref={winSoundRef} src="https://www.soundjay.com/human/sounds/applause-01.mp3" preload="auto"></audio>
        </div>
    );
}

// Add Tailwind CSS for input range in globals.css or keep utilizing standard appearance
