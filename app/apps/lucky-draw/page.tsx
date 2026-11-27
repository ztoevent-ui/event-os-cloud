'use strict';
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

Chart.register(ChartDataLabels);

const SMDS_PROJECT_ID = 'f5769a5e-d83c-44cc-85ee-d5ed40ddeb46';
const DEFAULT_BG_IMAGE = 'url(/assets/smds-secret-garden-bg.jpg)';
const CLASSIC_BG_IMAGE = 'url(https://img.freepik.com/free-vector/gradient-lucky-draw-background_23-2150063963.jpg)';

const SECRET_GARDEN_COLORS = [
    '#1f4e3d', // Deep Emerald
    '#b8862d', // Antique Gold
    '#a94c5c', // English Rose
    '#356859', // Royal Sage
    '#6e4560', // Plum Blossom
    '#8c6d3f', // Warm Bronze
    '#255d63', // Peacock Teal
    '#8b5446', // Terracotta Mauve
];

type AttendeeRow = {
    id: string;
    project_id: string | null;
    name: string;
    ticket_code: string;
    checked_in: boolean;
    data: Record<string, any> | null;
    created_at?: string;
};

type WinnerItem = {
    id: string;
    name: string;
    code: string;
    wonAt?: string;
    data: Record<string, any> | null;
};

type ProjectOption = {
    id: string;
    name: string;
    start_date: string | null;
};

export default function LuckyDrawPage() {
    const [dbStatus, setDbStatus] = useState<'online' | 'offline'>('offline');
    const [authRequired, setAuthRequired] = useState(false);
    const [participants, setParticipants] = useState<AttendeeRow[]>([]);
    const [winners, setWinners] = useState<WinnerItem[]>([]);
    const [projects, setProjects] = useState<ProjectOption[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>(SMDS_PROJECT_ID);

    const [isSpinning, setIsSpinning] = useState(false);
    const [drawCount, setDrawCount] = useState(1);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [bigWinnerModalOpen, setBigWinnerModalOpen] = useState(false);
    const [bigWinnerNames, setBigWinnerNames] = useState<string[]>([]);

    // Visual settings state (versioned v2 defaults tailored for SMDS Secret Garden)
    const [eventTitle, setEventTitle] = useState('');
    const [titlePos, setTitlePos] = useState(24);
    const [titleSize, setTitleSize] = useState(40);
    const [titleColor, setTitleColor] = useState('#2c4435');
    const [titleAlign, setTitleAlign] = useState<'left' | 'center' | 'right'>('center');
    const [maskColor, setMaskColor] = useState<'white' | 'black'>('white');
    const [maskOpacity, setMaskOpacity] = useState(0);
    const [backgroundImage, setBackgroundImage] = useState(DEFAULT_BG_IMAGE);
    const [customBgInput, setCustomBgInput] = useState('');

    // Walk-in quick add state
    const [walkInName, setWalkInName] = useState('');
    const [addingWalkIn, setAddingWalkIn] = useState(false);

    const settingsLoadedRef = useRef(false);
    const wheelCanvasRef = useRef<HTMLCanvasElement>(null);
    const wheelChartRef = useRef<Chart | null>(null);
    const bgmPlayerRef = useRef<HTMLAudioElement>(null);
    const winSoundRef = useRef<HTMLAudioElement>(null);
    const spinRafRef = useRef<number | null>(null);

    const names = participants.map((p) => p.name);

    // Load saved v2 settings once
    useEffect(() => {
        try {
            const t = localStorage.getItem('ld_v2_title');
            if (t !== null) setEventTitle(t);
            const p = localStorage.getItem('ld_v2_title_pos');
            if (p !== null) setTitlePos(Number(p));
            const s = localStorage.getItem('ld_v2_title_size');
            if (s !== null) setTitleSize(Number(s));
            const c = localStorage.getItem('ld_v2_title_color');
            if (c) setTitleColor(c);
            const a = localStorage.getItem('ld_v2_title_align');
            if (a === 'left' || a === 'center' || a === 'right') setTitleAlign(a);
            const mc = localStorage.getItem('ld_v2_mask_color');
            if (mc === 'white' || mc === 'black') setMaskColor(mc);
            const mo = localStorage.getItem('ld_v2_mask_opacity');
            if (mo !== null) setMaskOpacity(Number(mo));
            const bg = localStorage.getItem('ld_v2_bg_image');
            if (bg) setBackgroundImage(bg);
            const proj = localStorage.getItem('ld_v2_project_id');
            if (proj) setSelectedProjectId(proj);
        } catch {
            // ignore storage errors
        } finally {
            settingsLoadedRef.current = true;
        }
    }, []);

    // Persist settings whenever updated
    useEffect(() => {
        if (!settingsLoadedRef.current) return;
        try {
            localStorage.setItem('ld_v2_title', eventTitle);
            localStorage.setItem('ld_v2_title_pos', String(titlePos));
            localStorage.setItem('ld_v2_title_size', String(titleSize));
            localStorage.setItem('ld_v2_title_color', titleColor);
            localStorage.setItem('ld_v2_title_align', titleAlign);
            localStorage.setItem('ld_v2_mask_color', maskColor);
            localStorage.setItem('ld_v2_mask_opacity', String(maskOpacity));
            localStorage.setItem('ld_v2_bg_image', backgroundImage);
            localStorage.setItem('ld_v2_project_id', selectedProjectId);
        } catch {
            // ignore storage quota errors on large custom images
        }
    }, [eventTitle, titlePos, titleSize, titleColor, titleAlign, maskColor, maskOpacity, backgroundImage, selectedProjectId]);

    // Sync browser fullscreen state
    useEffect(() => {
        const handleFsChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch {
            setIsFullscreen((prev) => !prev);
        }
    };

    const fetchAttendeesForDraw = useCallback(async (projectFilter: string): Promise<AttendeeRow[]> => {
        let query = supabase
            .from('attendees')
            .select('id, project_id, name, ticket_code, checked_in, data, created_at')
            .eq('checked_in', true)
            .order('ticket_code', { ascending: true });

        if (projectFilter && projectFilter !== 'ALL') {
            query = query.eq('project_id', projectFilter);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Fetch attendees error:', error);
            return [];
        }
        return (data || []) as AttendeeRow[];
    }, []);

    const fetchData = useCallback(async (projectFilter = selectedProjectId) => {
        const rows = await fetchAttendeesForDraw(projectFilter);

        const activeRows = rows.filter((r) => !r.data?.won_prize);
        const winnerRows = rows
            .filter((r) => Boolean(r.data?.won_prize))
            .sort((a, b) => {
                const ta = a.data?.won_at ? new Date(a.data.won_at).getTime() : 0;
                const tb = b.data?.won_at ? new Date(b.data.won_at).getTime() : 0;
                return tb - ta;
            })
            .map((r) => ({
                id: r.id,
                name: r.name,
                code: r.ticket_code,
                wonAt: r.data?.won_at,
                data: r.data,
            }));

        setParticipants(activeRows);
        setWinners(winnerRows);
    }, [fetchAttendeesForDraw, selectedProjectId]);

    // Initialize auth check, project list, realtime subscription
    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            try {
                const { data: sessionData } = await supabase.auth.getSession();
                const hasSession = Boolean(sessionData?.session);
                if (!cancelled) setAuthRequired(!hasSession);

                const [{ error: pingError }, { data: projectRows }] = await Promise.all([
                    supabase.from('attendees').select('id', { count: 'exact', head: true }).limit(1),
                    supabase.from('projects').select('id, name, start_date').order('start_date', { ascending: false }).limit(20),
                ]);

                if (!cancelled) {
                    setDbStatus(pingError ? 'offline' : 'online');
                    if (projectRows) setProjects(projectRows as ProjectOption[]);
                }

                await fetchData(selectedProjectId);
            } catch (e) {
                console.error('Lucky draw init failed:', e);
                if (!cancelled) setDbStatus('offline');
            }
        };

        init();

        const channel = supabase
            .channel('public:attendees:lucky-draw')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendees' }, () => {
                fetchData(selectedProjectId);
            })
            .subscribe((status) => {
                if (!cancelled) {
                    setDbStatus(status === 'SUBSCRIBED' ? 'online' : 'offline');
                }
            });

        return () => {
            cancelled = true;
            supabase.removeChannel(channel);
            if (spinRafRef.current !== null) {
                cancelAnimationFrame(spinRafRef.current);
            }
        };
    }, [fetchData, selectedProjectId]);

    // Build / refresh Chart.js wheel
    const initWheel = useCallback(() => {
        if (!wheelCanvasRef.current) return;
        const ctx = wheelCanvasRef.current.getContext('2d');
        if (!ctx) return;

        if (wheelChartRef.current) {
            wheelChartRef.current.destroy();
        }

        const displayLabels = names.length > 0 ? names : ['READY', 'SPIN'];

        wheelChartRef.current = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: displayLabels,
                datasets: [{
                    data: displayLabels.map(() => 1),
                    backgroundColor: displayLabels.map((_, i) => SECRET_GARDEN_COLORS[i % SECRET_GARDEN_COLORS.length]),
                    borderColor: 'rgba(255, 248, 232, 0.85)',
                    borderWidth: 1.5,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 0 },
                layout: { padding: 14 },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false },
                    datalabels: {
                        color: '#fffaf0',
                        textStrokeColor: 'rgba(15, 23, 42, 0.55)',
                        textStrokeWidth: 2,
                        clip: false,
                        font: {
                            weight: 'bold',
                            family: 'Inter, system-ui, sans-serif',
                            size: (context: any) => {
                                const total = context.chart.data.labels?.length || 1;
                                if (total > 100) return 0;
                                if (total > 50) return 10;
                                if (total > 35) return 11;
                                if (total > 20) return 13;
                                return 15;
                            },
                        },
                        formatter: (_v: any, c: any) => {
                            const raw = c.chart.data.labels ? String(c.chart.data.labels[c.dataIndex] || '') : '';
                            if ((c.chart.data.labels?.length || 0) > 30 && raw.length > 19) {
                                return raw.slice(0, 18) + '…';
                            }
                            return raw;
                        },
                        rotation: (context: any) => {
                            const total = context.chart.data.labels?.length || 1;
                            const step = 360 / total;
                            const chartRot = (context.chart.options as any).rotation || 0;
                            const midDeg = chartRot + context.dataIndex * step + step / 2;
                            return midDeg - 90;
                        },
                        anchor: 'end',
                        align: 'start',
                        offset: 10,
                    },
                },
            } as any,
        });
    }, [names]);

    useEffect(() => {
        if (wheelCanvasRef.current) {
            initWheel();
        }
        return () => {
            if (wheelChartRef.current) {
                wheelChartRef.current.destroy();
                wheelChartRef.current = null;
            }
        };
    }, [initWheel]);

    const fireConfetti = () => {
        const end = Date.now() + 3000;
        const colors = ['#f59e0b', '#10b981', '#fbbf24', '#fda4af', '#ffffff'];
        const frame = () => {
            confetti({ particleCount: 5, spread: 70, origin: { y: 0.55 }, colors });
            if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
    };

    const selectWinners = async (count: number) => {
        if (bgmPlayerRef.current) bgmPlayerRef.current.pause();
        if (!isMuted && winSoundRef.current) {
            winSoundRef.current.currentTime = 0;
            winSoundRef.current.play().catch(() => { });
        }

        try {
            const freshRows = await fetchAttendeesForDraw(selectedProjectId);
            const eligible = freshRows.filter((r) => !r.data?.won_prize);

            if (eligible.length === 0) {
                Swal.fire('No Eligible Guests', 'Everyone in this pool has already won or no guests are loaded.', 'info');
                return;
            }

            const targetCount = Math.min(count, eligible.length);
            const picked = new Map<string, string>();
            const maxAttempts = targetCount * 10;
            let attempts = 0;

            while (picked.size < targetCount && attempts < maxAttempts) {
                attempts++;
                const r = Math.floor(Math.random() * eligible.length);
                const row = eligible[r];
                if (!row || !row.id || picked.has(row.id)) continue;

                const updatedData = {
                    ...(row.data || {}),
                    won_prize: true,
                    won_at: new Date().toISOString(),
                };

                const { data, error } = await supabase
                    .from('attendees')
                    .update({ data: updatedData })
                    .eq('id', row.id)
                    .select('id, name');

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
                Swal.fire('Draw Error', 'Could not record winner in database. Please ensure you are signed in and try again.', 'error');
                return;
            }

            await fetchData(selectedProjectId);
            fireConfetti();
            setBigWinnerNames(batchNames);
            setBigWinnerModalOpen(true);
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'Unexpected error while selecting winners.', 'error');
        } finally {
            setIsSpinning(false);
        }
    };

    const startSpin = () => {
        if (isSpinning) return;
        if (authRequired) {
            Swal.fire('Sign In Required', 'Please sign in first to spin the live guest list.', 'info');
            return;
        }
        if (names.length === 0) {
            Swal.fire('No Participants', 'No eligible checked-in participants in this pool.', 'error');
            return;
        }
        if (drawCount < 1 || drawCount > names.length) {
            Swal.fire('Invalid Draw Count', `Please enter between 1 and ${names.length}.`, 'error');
            return;
        }

        if (spinRafRef.current !== null) {
            cancelAnimationFrame(spinRafRef.current);
            spinRafRef.current = null;
        }

        setIsSpinning(true);

        if (!isMuted && bgmPlayerRef.current) {
            bgmPlayerRef.current.currentTime = 0;
            bgmPlayerRef.current.play().catch(() => { });
        }

        const totalDuration = 3600;
        const startRot = ((wheelChartRef.current?.options as any)?.rotation as number) || 0;
        const extraDegrees = 1800 + Math.random() * 720;
        const startTime = performance.now();

        const animateSpin = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / totalDuration);
            // Smooth cubic ease-out
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentRot = (startRot + extraDegrees * eased) % 360;

            if (wheelChartRef.current) {
                (wheelChartRef.current.options as any).rotation = currentRot;
                wheelChartRef.current.update('none');
            }

            if (progress < 1) {
                spinRafRef.current = requestAnimationFrame(animateSpin);
            } else {
                spinRafRef.current = null;
                selectWinners(drawCount);
            }
        };

        spinRafRef.current = requestAnimationFrame(animateSpin);
    };

    const handleDownloadWinners = () => {
        if (winners.length === 0) {
            Swal.fire('No Winners Yet', 'Spin the wheel first before exporting the winners list.', 'info');
            return;
        }
        const rows = winners.map((w, idx) => ({
            No: idx + 1,
            Name: w.name,
            TicketCode: w.code,
            WonAt: w.wonAt ? new Date(w.wonAt).toLocaleString() : '',
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Winners');
        const dateTag = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(wb, `smds-lucky-draw-winners-${dateTag}.xlsx`);
    };

    const handleUndoWinner = async (winner: WinnerItem) => {
        const res = await Swal.fire({
            title: 'Return Guest to Pool?',
            text: `Remove "${winner.name}" from Winners and put back into the draw wheel?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Return to Wheel',
        });
        if (!res.isConfirmed) return;

        const nextData = { ...(winner.data || {}), won_prize: false, won_at: null };
        const { error } = await supabase
            .from('attendees')
            .update({ data: nextData })
            .eq('id', winner.id);

        if (error) {
            Swal.fire('Error', error.message, 'error');
            return;
        }
        await fetchData(selectedProjectId);
    };

    const handleResetAllWinners = async () => {
        if (winners.length === 0) {
            Swal.fire('Already Reset', 'There are no winners to reset right now.', 'info');
            return;
        }
        const res = await Swal.fire({
            title: 'Reset All Winners?',
            text: `All ${winners.length} winner(s) will return to the active spin wheel. No guests will be deleted.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d97706',
            confirmButtonText: 'Reset Winners',
        });
        if (!res.isConfirmed) return;

        for (const w of winners) {
            await supabase
                .from('attendees')
                .update({ data: { ...(w.data || {}), won_prize: false, won_at: null } })
                .eq('id', w.id);
        }

        await fetchData(selectedProjectId);
        Swal.fire('Reset Complete', 'All guests are eligible on the wheel again.', 'success');
    };

    const handleAddWalkIn = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = walkInName.trim();
        if (!trimmed) return;
        setAddingWalkIn(true);
        try {
            const ticketCode = `SMDS-W-${Date.now().toString(36).toUpperCase()}`;
            const { error } = await supabase.from('attendees').insert({
                project_id: selectedProjectId === 'ALL' ? SMDS_PROJECT_ID : selectedProjectId,
                name: trimmed,
                ticket_code: ticketCode,
                checked_in: true,
                checked_in_at: new Date().toISOString(),
                data: { won_prize: false, walk_in: true },
            });
            if (error) throw error;
            setWalkInName('');
            await fetchData(selectedProjectId);
            Swal.fire('Added', `${trimmed} joined the Lucky Draw wheel!`, 'success');
        } catch (err: any) {
            Swal.fire('Error', err?.message || 'Could not add walk-in guest.', 'error');
        } finally {
            setAddingWalkIn(false);
        }
    };

    const handleBgFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 3 * 1024 * 1024) {
            Swal.fire('Image Too Large', 'Please choose an image smaller than 3 MB.', 'warning');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                setBackgroundImage(`url(${reader.result})`);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div
            className="min-h-screen w-full overflow-hidden font-sans transition-all duration-500 ease-in-out relative select-none"
            style={{ backgroundImage, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
            {/* Optional Backdrop Overlay */}
            <div
                className="fixed inset-0 pointer-events-none z-0 transition-colors duration-300"
                style={{
                    backgroundColor:
                        maskColor === 'white'
                            ? `rgba(255, 255, 255, ${maskOpacity / 100})`
                            : `rgba(0, 0, 0, ${maskOpacity / 100})`,
                }}
            />

            {/* Top-Left Navigation & Status Pill */}
            <div className="fixed top-5 left-5 z-[60] flex items-center gap-3">
                <Link
                    href="/dashboard"
                    title="Back to Dashboard"
                    className="bg-emerald-950/75 hover:bg-emerald-900 backdrop-blur-md border border-amber-300/40 text-amber-100 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition transform hover:scale-105"
                >
                    <i className="fa-solid fa-arrow-left" />
                </Link>
                <div className="flex items-center gap-2 text-amber-50 bg-emerald-950/75 border border-amber-300/40 px-4 py-2 rounded-full backdrop-blur-md shadow-lg text-sm font-bold">
                    <span
                        className={`w-2.5 h-2.5 rounded-full inline-block ${
                            dbStatus === 'online'
                                ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]'
                                : 'bg-rose-400'
                        }`}
                    />
                    <span className="text-amber-300 font-black">{names.length}</span>
                    <span>Participants (In House)</span>
                </div>
            </div>

            {/* Content Layer */}
            <div className="relative z-10 h-screen w-full flex flex-col pointer-events-auto">
                {/* Optional Event Title (hidden cleanly when blank so backdrop artwork stays unobstructed) */}
                {eventTitle.trim().length > 0 && (
                    <div
                        id="topTitleContainer"
                        className={`w-full flex px-8 transition-all duration-100 items-center ${
                            titleAlign === 'left'
                                ? 'justify-start'
                                : titleAlign === 'right'
                                  ? 'justify-end'
                                  : 'justify-center'
                        }`}
                        style={{ paddingTop: `${titlePos}px` }}
                    >
                        <input
                            type="text"
                            value={eventTitle}
                            onChange={(e) => setEventTitle(e.target.value)}
                            className="bg-transparent border-none focus:ring-2 focus:ring-amber-300/40 rounded-lg outline-none font-black uppercase tracking-wider text-center"
                            style={{ fontSize: `${titleSize}px`, color: titleColor }}
                        />
                    </div>
                )}

                {/* Main Stage */}
                <div className="flex-1 w-full flex items-center justify-center relative px-4">
                    {/* Auth Required Prompt if unauthenticated */}
                    {authRequired && (
                        <div className="absolute top-20 z-40 bg-emerald-950/90 border border-amber-300/60 text-amber-50 px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-4">
                            <div className="text-xs sm:text-sm font-medium">
                                <span className="font-bold text-amber-300">Staff Sign-In Required:</span> Sign in to Event OS to load the live guest pool.
                            </div>
                            <Link
                                href="/auth?returnTo=/apps/lucky-draw"
                                className="bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs uppercase tracking-wider px-4 py-2 rounded-full transition shadow"
                            >
                                Sign In
                            </Link>
                        </div>
                    )}

                    {/* Center Wheel */}
                    <div className="w-[min(74vh,630px)] h-[min(74vh,630px)] relative flex items-center justify-center -mt-4">
                        {/* Pointer Arrow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20 drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)] pointer-events-none flex flex-col items-center">
                            <div className="w-5 h-5 rounded-full bg-amber-400 border-2 border-white -mb-2 shadow" />
                            <div className="w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-t-[42px] border-t-rose-700" />
                        </div>

                        {/* Floral-friendly Golden Rim Canvas Wrapper */}
                        <div className="w-full h-full rounded-full p-2.5 bg-gradient-to-br from-amber-200/90 via-amber-400/80 to-amber-200/90 shadow-[0_24px_65px_rgba(20,45,35,0.45)] relative flex items-center justify-center">
                            <div className="w-full h-full rounded-full bg-emerald-950/90 p-1 relative">
                                <canvas ref={wheelCanvasRef} />
                            </div>
                            {/* Center Hub Cap */}
                            <div className="absolute w-14 h-14 rounded-full bg-gradient-to-br from-emerald-900 to-emerald-950 border-2 border-amber-300 shadow-[0_0_20px_rgba(0,0,0,0.45)] flex items-center justify-center pointer-events-none">
                                <span className="text-[10px] font-black tracking-widest text-amber-200">SMDS</span>
                            </div>
                        </div>

                        {/* SPIN + Draw Count Dock */}
                        <div className="absolute -bottom-11 flex items-center gap-3 z-30">
                            <button
                                onClick={startSpin}
                                disabled={isSpinning}
                                className="cursor-pointer bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 hover:from-emerald-800 hover:to-teal-800 text-amber-200 text-2xl sm:text-3xl font-black px-11 py-2.5 rounded-full shadow-[0_12px_30px_rgba(6,78,59,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border-2 border-amber-300/80 disabled:opacity-70 tracking-wider"
                            >
                                <i className="fa-solid fa-crown text-amber-300 text-xl" />
                                {isSpinning ? 'SPINNING...' : 'SPIN'}
                            </button>
                            <div className="bg-white/90 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-amber-300/70 flex items-center gap-2 text-sm">
                                <span className="text-emerald-950 font-bold text-xs uppercase tracking-wider">Draw:</span>
                                <input
                                    type="number"
                                    min="1"
                                    max={Math.max(1, names.length)}
                                    value={drawCount}
                                    onChange={(e) => setDrawCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                    className="w-10 bg-transparent text-center font-black text-emerald-900 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Cloud Winners Sidebar */}
                    <div className="hidden lg:flex absolute right-5 top-20 bottom-6 w-64 flex-col bg-white/85 backdrop-blur-md border border-amber-300/60 shadow-2xl rounded-2xl p-3 pointer-events-auto">
                        <div className="flex justify-between items-center pb-2 mb-2 border-b border-amber-200/70">
                            <h3 className="font-black text-emerald-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                <i className="fa-solid fa-trophy text-amber-600" />
                                Cloud Winners ({winners.length})
                            </h3>
                            <button
                                onClick={handleDownloadWinners}
                                className="text-xs text-emerald-800 hover:bg-emerald-50 font-bold px-2.5 py-1 rounded-lg border border-emerald-200 transition flex items-center gap-1"
                            >
                                <i className="fa-solid fa-download" /> Save
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                            {winners.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-xs text-emerald-900/50 px-3">
                                    <i className="fa-solid fa-champagne-glasses text-2xl text-amber-500/50 mb-2" />
                                    Ready for tonight&apos;s first winner draw!
                                </div>
                            ) : (
                                winners.map((w, i) => (
                                    <div
                                        key={w.id || i}
                                        className="group bg-white/90 p-2.5 rounded-xl shadow-sm border-l-4 border-amber-500 flex items-center justify-between gap-2"
                                    >
                                        <div className="min-w-0">
                                            <div className="font-bold text-emerald-950 text-sm truncate">{w.name}</div>
                                            <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
                                                #{winners.length - i} • {w.code}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleUndoWinner(w)}
                                            title="Return guest to wheel"
                                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-600 text-xs p-1 transition"
                                        >
                                            <i className="fa-solid fa-rotate-left" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Big Winner Modal */}
            <div
                className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
                    bigWinnerModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
            >
                <div
                    className={`w-[90%] max-w-4xl max-h-[85vh] rounded-3xl border-4 border-amber-400 flex flex-col relative overflow-hidden transform transition-transform duration-500 ${
                        bigWinnerModalOpen ? 'scale-100' : 'scale-75'
                    } bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 shadow-[0_30px_90px_rgba(0,0,0,0.65)]`}
                >
                    <div
                        className="absolute inset-0 bg-cover opacity-20 pointer-events-none"
                        style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')" }}
                    />
                    <div className="text-center pt-9 pb-3 px-6 z-10">
                        <p className="text-amber-300/90 text-xs sm:text-sm font-bold uppercase tracking-[0.25em] mb-2">
                            SMDS Annual Dinner 2026 • Secret Garden
                        </p>
                        <h2
                            className="text-amber-300 font-black text-3xl sm:text-5xl md:text-6xl uppercase tracking-widest drop-shadow-lg"
                            style={{ textShadow: '0 4px 12px rgba(0,0,0,0.6)' }}
                        >
                            Congratulations
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 py-4 z-10 text-center flex flex-col items-center justify-center gap-4">
                        {bigWinnerNames.map((name, i) => (
                            <div
                                key={i}
                                className="bg-white/10 backdrop-blur-md text-amber-50 font-black text-3xl sm:text-4xl md:text-5xl py-5 px-8 rounded-2xl border border-amber-300/50 shadow-xl w-full max-w-3xl"
                            >
                                {name}
                            </div>
                        ))}
                    </div>
                    <div className="pb-8 pt-4 flex justify-center z-10">
                        <button
                            onClick={() => setBigWinnerModalOpen(false)}
                            className="bg-gradient-to-r from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-emerald-950 text-xl font-black px-12 py-3 rounded-full shadow-xl hover:scale-105 transition transform border-b-4 border-amber-700"
                        >
                            CLOSE
                        </button>
                    </div>
                </div>
            </div>

            {/* Top-Right Stage Controls */}
            <div className="fixed top-5 right-5 z-50 flex gap-2">
                <button
                    onClick={toggleFullscreen}
                    title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                    className="w-10 h-10 bg-emerald-950/75 hover:bg-emerald-900 backdrop-blur-md text-amber-100 rounded-full shadow-lg border border-amber-300/40 transition flex items-center justify-center"
                >
                    <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'}`} />
                </button>
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                    className="w-10 h-10 bg-emerald-950/75 hover:bg-emerald-900 backdrop-blur-md text-amber-100 rounded-full shadow-lg border border-amber-300/40 transition flex items-center justify-center"
                >
                    <i className={`fa-solid ${isMuted ? 'fa-volume-xmark text-rose-400' : 'fa-volume-high'}`} />
                </button>
                <button
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    title="Cloud Settings"
                    className="w-10 h-10 bg-emerald-950/75 hover:bg-emerald-900 backdrop-blur-md text-amber-100 rounded-full shadow-lg border border-amber-300/40 transition flex items-center justify-center"
                >
                    <i className="fa-solid fa-gear" />
                </button>
            </div>

            {/* Settings Drawer */}
            <div
                className={`fixed inset-y-0 right-0 w-80 sm:w-96 bg-white shadow-2xl z-[70] flex flex-col text-gray-800 font-sans border-l border-gray-200 transition-transform duration-300 ${
                    settingsOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="p-5 bg-emerald-950 text-amber-50 flex justify-between items-center shadow-md">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <i className="fa-solid fa-sliders text-amber-300" /> Cloud Settings
                    </h2>
                    <button onClick={() => setSettingsOpen(false)} className="hover:text-amber-300 transition">
                        <i className="fa-solid fa-xmark text-xl" />
                    </button>
                </div>

                <div className="p-5 flex-1 overflow-y-auto space-y-6">
                    {/* Event Guest Pool */}
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-3">
                        <h3 className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-2">
                            <i className="fa-solid fa-users" /> Event Guest Pool
                        </h3>
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="w-full text-sm font-semibold border border-emerald-200 rounded-lg px-3 py-2 bg-white text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} {p.start_date ? `(${p.start_date})` : ''}
                                </option>
                            ))}
                            <option value="ALL">All Checked-in Attendees</option>
                        </select>

                        {/* Quick Walk-In Guest Add */}
                        <form onSubmit={handleAddWalkIn} className="flex gap-2">
                            <input
                                type="text"
                                value={walkInName}
                                onChange={(e) => setWalkInName(e.target.value)}
                                placeholder="Add walk-in guest name..."
                                className="flex-1 text-xs border border-emerald-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <button
                                type="submit"
                                disabled={addingWalkIn || !walkInName.trim()}
                                className="bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
                            >
                                Add
                            </button>
                        </form>
                    </div>

                    {/* Backdrop Controls */}
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-3">
                        <h3 className="text-xs font-bold text-amber-800 uppercase flex items-center gap-2">
                            <i className="fa-solid fa-image" /> Stage Background
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setBackgroundImage(DEFAULT_BG_IMAGE)}
                                className={`text-xs font-bold py-2 px-2 rounded-lg border transition ${
                                    backgroundImage === DEFAULT_BG_IMAGE
                                        ? 'bg-emerald-900 text-amber-200 border-emerald-900'
                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                SMDS Secret Garden
                            </button>
                            <button
                                onClick={() => setBackgroundImage(CLASSIC_BG_IMAGE)}
                                className={`text-xs font-bold py-2 px-2 rounded-lg border transition ${
                                    backgroundImage === CLASSIC_BG_IMAGE
                                        ? 'bg-emerald-900 text-amber-200 border-emerald-900'
                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                Classic Gradient
                            </button>
                        </div>
                        <label className="block">
                            <span className="text-[11px] font-bold text-gray-600">Upload Custom Image</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleBgFileUpload}
                                className="mt-1 block w-full text-xs text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-200 file:text-amber-950 hover:file:bg-amber-300"
                            />
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={customBgInput}
                                onChange={(e) => setCustomBgInput(e.target.value)}
                                placeholder="https://... custom image URL"
                                className="flex-1 text-xs border border-amber-200 rounded-lg px-2.5 py-1.5 bg-white outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (customBgInput.trim()) {
                                        setBackgroundImage(`url(${customBgInput.trim()})`);
                                    }
                                }}
                                className="bg-amber-600 text-white text-xs font-bold px-3 rounded-lg hover:bg-amber-700"
                            >
                                Apply
                            </button>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                                <span>Backdrop Veil Opacity</span>
                                <span>{maskOpacity}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="80"
                                value={maskOpacity}
                                onChange={(e) => setMaskOpacity(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Optional Title Overlay Controls */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <h3 className="text-xs font-bold text-slate-600 uppercase flex items-center gap-2">
                            <i className="fa-solid fa-text-height" /> Overlay Title (Optional)
                        </h3>
                        <input
                            type="text"
                            value={eventTitle}
                            onChange={(e) => setEventTitle(e.target.value)}
                            placeholder="Leave blank to keep artwork title clear"
                            className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none"
                        />
                        <div>
                            <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                                <span>V-Position</span>
                                <span>{titlePos}px</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="300"
                                value={titlePos}
                                onChange={(e) => setTitlePos(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                                <span>Font Size</span>
                                <span>{titleSize}px</span>
                            </div>
                            <input
                                type="range"
                                min="20"
                                max="100"
                                value={titleSize}
                                onChange={(e) => setTitleSize(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Winner Pool Actions */}
                    <div className="space-y-3 border-t border-gray-100 pt-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase">Draw Actions</h3>
                        <button
                            onClick={handleResetAllWinners}
                            className="w-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-2"
                        >
                            <i className="fa-solid fa-rotate-left" /> Reset All Winners (Keep Guests)
                        </button>
                        <button
                            onClick={async () => {
                                const res = await Swal.fire({
                                    title: 'Delete All Guests in Pool?',
                                    text: 'This permanently deletes attendees in the selected pool from the database.',
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonColor: '#dc2626',
                                    confirmButtonText: 'Delete Permanently',
                                });
                                if (!res.isConfirmed) return;

                                let delQuery = supabase
                                    .from('attendees')
                                    .delete()
                                    .neq('id', '00000000-0000-0000-0000-000000000000');
                                if (selectedProjectId !== 'ALL') {
                                    delQuery = delQuery.eq('project_id', selectedProjectId);
                                }
                                const { error } = await delQuery;
                                if (!error) {
                                    Swal.fire('Deleted', 'Pool cleared.', 'success');
                                    fetchData(selectedProjectId);
                                } else {
                                    Swal.fire('Error', error.message, 'error');
                                }
                            }}
                            className="w-full text-red-500 hover:bg-red-50 font-bold py-2 rounded-xl transition text-xs flex items-center justify-center gap-2"
                        >
                            <i className="fa-solid fa-trash" /> Clear Selected Pool
                        </button>
                    </div>
                </div>
            </div>

            {/* Local Reliable Audio Assets */}
            <audio ref={bgmPlayerRef} loop src="/assets/spin.mp3" preload="auto" />
            <audio ref={winSoundRef} src="/assets/celebrate.mp3" preload="auto" />
        </div>
    );
}
