'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

const SMDS_PROJECT_ID = 'f5769a5e-d83c-44cc-85ee-d5ed40ddeb46';
const DEFAULT_BG_IMAGE = 'url(/assets/smds-secret-garden-bg.jpg)';
const CLASSIC_BG_IMAGE = 'url(https://img.freepik.com/free-vector/gradient-lucky-draw-background_23-2150063963.jpg)';
const EMERALD_VELVET_BG = 'radial-gradient(circle at top, #134e4a 0%, #064e3b 45%, #022c22 100%)';

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

type DrawRuleMode = 'remove_winner' | 'allow_repeat';

type DrawRulePreset = {
    id: string;
    label: string;
    description: string;
    drawCount: number;
    ruleMode: DrawRuleMode;
    spinDurationMs: number;
};

const DRAW_RULE_PRESETS: DrawRulePreset[] = [
    {
        id: 'grand_single',
        label: 'Grand Single Draw (Default)',
        description: '1 winner per spin • Remove winner from pool • 8s suspense',
        drawCount: 1,
        ruleMode: 'remove_winner',
        spinDurationMs: 8000,
    },
    {
        id: 'group_three',
        label: 'Table Batch Draw (×3)',
        description: '3 winners per spin • Remove winners from pool • 8s suspense',
        drawCount: 3,
        ruleMode: 'remove_winner',
        spinDurationMs: 8000,
    },
    {
        id: 'bonus_five',
        label: 'Bonus Round (×5)',
        description: '5 winners per spin • Remove winners from pool • 8s suspense',
        drawCount: 5,
        ruleMode: 'remove_winner',
        spinDurationMs: 8000,
    },
    {
        id: 'encore_repeat',
        label: 'Encore / Grand Finale (Keep in Pool)',
        description: '1 winner per spin • Winner stays eligible • 8s suspense',
        drawCount: 1,
        ruleMode: 'allow_repeat',
        spinDurationMs: 8000,
    },
    {
        id: 'rapid_three',
        label: 'Rapid Prize Draw (3s)',
        description: '1 winner per spin • Remove winner from pool • 3s fast',
        drawCount: 1,
        ruleMode: 'remove_winner',
        spinDurationMs: 3000,
    },
];

function normDeg(deg: number): number {
    return ((deg % 360) + 360) % 360;
}

export default function LuckyDrawPage() {
    const [dbStatus, setDbStatus] = useState<'online' | 'offline'>('offline');
    const [authRequired, setAuthRequired] = useState(false);
    const [participants, setParticipants] = useState<AttendeeRow[]>([]);
    const [winners, setWinners] = useState<WinnerItem[]>([]);
    const [encoreWinners, setEncoreWinners] = useState<WinnerItem[]>([]);
    const [projects, setProjects] = useState<ProjectOption[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>(SMDS_PROJECT_ID);

    // Draw & Rules state
    const [activeRuleId, setActiveRuleId] = useState<string>('grand_single');
    const [ruleMode, setRuleMode] = useState<DrawRuleMode>('remove_winner');
    const [drawCount, setDrawCount] = useState(1);
    const [spinDurationMs, setSpinDurationMs] = useState(8000);
    const [revealDelayMs, setRevealDelayMs] = useState(500);

    // Runtime Stage state
    const [isSpinning, setIsSpinning] = useState(false);
    const [pointerBounce, setPointerBounce] = useState(false);
    const [highlightedSliceIdx, setHighlightedSliceIdx] = useState<number | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [mobileDrawer, setMobileDrawer] = useState<'none' | 'participants' | 'winners'>('none');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [bigWinnerModalOpen, setBigWinnerModalOpen] = useState(false);
    const [bigWinnerNames, setBigWinnerNames] = useState<string[]>([]);

    // Stage Title & Background settings (persisted under ld_v3_*)
    const [eventTitle, setEventTitle] = useState('SMDS Secret Draw');
    const [titlePos, setTitlePos] = useState(18);
    const [titleSize, setTitleSize] = useState(34);
    const [titleColor, setTitleColor] = useState('#fef3c7');
    const [maskColor, setMaskColor] = useState<'white' | 'black'>('white');
    const [maskOpacity, setMaskOpacity] = useState(0);
    const [backgroundImage, setBackgroundImage] = useState(DEFAULT_BG_IMAGE);
    const [customBgInput, setCustomBgInput] = useState('');

    // Participant sidebar add / search / edit
    const [participantSearch, setParticipantSearch] = useState('');
    const [quickAddName, setQuickAddName] = useState('');
    const [addingGuest, setAddingGuest] = useState(false);
    const [busyRowId, setBusyRowId] = useState<string | null>(null);

    const settingsLoadedRef = useRef(false);
    const wheelCanvasRef = useRef<HTMLCanvasElement>(null);
    const wheelContainerRef = useRef<HTMLDivElement>(null);
    const winSoundRef = useRef<HTMLAudioElement>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const spinRafRef = useRef<number | null>(null);
    const postStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rotationRef = useRef<number>(0);

    const isMutedRef = useRef(isMuted);
    useEffect(() => {
        isMutedRef.current = isMuted;
    }, [isMuted]);

    const filteredParticipants = useMemo(() => {
        const q = participantSearch.trim().toLowerCase();
        if (!q) return participants;
        return participants.filter(
            (p) => p.name.toLowerCase().includes(q) || p.ticket_code.toLowerCase().includes(q)
        );
    }, [participants, participantSearch]);

    const displayedWinners = useMemo(() => {
        if (ruleMode === 'allow_repeat' && encoreWinners.length > 0) {
            return [...encoreWinners, ...winners];
        }
        return winners;
    }, [winners, encoreWinners, ruleMode]);

    // Load saved v3 settings
    useEffect(() => {
        try {
            const t = localStorage.getItem('ld_v3_title');
            if (t !== null) setEventTitle(t);
            const p = localStorage.getItem('ld_v3_title_pos');
            if (p !== null) setTitlePos(Number(p));
            const s = localStorage.getItem('ld_v3_title_size');
            if (s !== null) setTitleSize(Number(s));
            const c = localStorage.getItem('ld_v3_title_color');
            if (c) setTitleColor(c);
            const mc = localStorage.getItem('ld_v3_mask_color');
            if (mc === 'white' || mc === 'black') setMaskColor(mc);
            const mo = localStorage.getItem('ld_v3_mask_opacity');
            if (mo !== null) setMaskOpacity(Number(mo));
            const bg = localStorage.getItem('ld_v3_bg_image');
            if (bg) setBackgroundImage(bg);
            const proj = localStorage.getItem('ld_v3_project_id');
            if (proj) setSelectedProjectId(proj);
            const rId = localStorage.getItem('ld_v3_rule_id');
            if (rId) setActiveRuleId(rId);
            const rMode = localStorage.getItem('ld_v3_rule_mode');
            if (rMode === 'remove_winner' || rMode === 'allow_repeat') setRuleMode(rMode);
            const dc = localStorage.getItem('ld_v3_draw_count');
            if (dc !== null) setDrawCount(Math.max(1, Number(dc) || 1));
            const sd = localStorage.getItem('ld_v3_spin_ms');
            if (sd !== null) setSpinDurationMs(Math.max(1000, Number(sd) || 8000));
            const rd = localStorage.getItem('ld_v3_reveal_ms');
            if (rd !== null) setRevealDelayMs(Math.max(0, Number(rd) || 500));
        } catch {
            // ignore storage errors
        } finally {
            settingsLoadedRef.current = true;
        }
    }, []);

    // Persist settings whenever changed
    useEffect(() => {
        if (!settingsLoadedRef.current) return;
        try {
            localStorage.setItem('ld_v3_title', eventTitle);
            localStorage.setItem('ld_v3_title_pos', String(titlePos));
            localStorage.setItem('ld_v3_title_size', String(titleSize));
            localStorage.setItem('ld_v3_title_color', titleColor);
            localStorage.setItem('ld_v3_mask_color', maskColor);
            localStorage.setItem('ld_v3_mask_opacity', String(maskOpacity));
            localStorage.setItem('ld_v3_bg_image', backgroundImage);
            localStorage.setItem('ld_v3_project_id', selectedProjectId);
            localStorage.setItem('ld_v3_rule_id', activeRuleId);
            localStorage.setItem('ld_v3_rule_mode', ruleMode);
            localStorage.setItem('ld_v3_draw_count', String(drawCount));
            localStorage.setItem('ld_v3_spin_ms', String(spinDurationMs));
            localStorage.setItem('ld_v3_reveal_ms', String(revealDelayMs));
        } catch {
            // ignore storage quota errors
        }
    }, [
        eventTitle,
        titlePos,
        titleSize,
        titleColor,
        maskColor,
        maskOpacity,
        backgroundImage,
        selectedProjectId,
        activeRuleId,
        ruleMode,
        drawCount,
        spinDurationMs,
        revealDelayMs,
    ]);

    // Sync browser fullscreen state
    useEffect(() => {
        const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
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

    // Synthesized Web Audio peg tick sound (crisp wooden/wheel peg clack, synced to pointer crossings)
    const ensureAudioContext = () => {
        if (typeof window === 'undefined') return null;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return null;
        if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioCtx();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume().catch(() => { });
        }
        return audioCtxRef.current;
    };

    const playPegTick = useCallback((slowFactor = 0.5) => {
        if (isMutedRef.current) return;
        const ctx = audioCtxRef.current;
        if (!ctx || ctx.state !== 'running') return;
        try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            const startFreq = 920 + slowFactor * 360;
            osc.frequency.setValueAtTime(startFreq, now);
            osc.frequency.exponentialRampToValueAtTime(220, now + 0.028);

            const vol = Math.min(0.32, 0.14 + slowFactor * 0.16);
            gain.gain.setValueAtTime(vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.035);
        } catch {
            // ignore WebAudio glitch
        }
    }, []);

    const playLockChime = useCallback(() => {
        if (isMutedRef.current) return;
        const ctx = audioCtxRef.current;
        if (!ctx || ctx.state !== 'running') return;
        try {
            const now = ctx.currentTime;
            [523.25, 659.25, 783.99].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.06);
                gain.gain.setValueAtTime(0.18, now + i * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + i * 0.06);
                osc.stop(now + i * 0.06 + 0.38);
            });
        } catch {
            // ignore
        }
    }, []);

    const playCelebrationFanfare = useCallback(() => {
        if (isMutedRef.current) return;
        if (winSoundRef.current) {
            winSoundRef.current.currentTime = 0;
            winSoundRef.current.play().catch(() => { });
        }
        const ctx = audioCtxRef.current;
        if (!ctx || ctx.state !== 'running') return;
        try {
            const now = ctx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.5];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                const t = now + idx * 0.09;
                osc.frequency.setValueAtTime(freq, t);
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(t);
                osc.stop(t + 0.7);
            });
        } catch {
            // ignore
        }
    }, []);

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
            if (spinRafRef.current !== null) cancelAnimationFrame(spinRafRef.current);
            if (postStopTimerRef.current) clearTimeout(postStopTimerRef.current);
        };
    }, [fetchData, selectedProjectId]);

    // Custom high-DPI Retina Canvas wheel renderer (every name visible & right-side up!)
    const drawWheelCanvas = useCallback(
        (rotDeg: number, sliceHighlight: number | null = highlightedSliceIdx) => {
            const canvas = wheelCanvasRef.current;
            const container = wheelContainerRef.current;
            if (!canvas || !container) return;

            const sizeCss = Math.max(260, Math.floor(container.clientWidth));
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            if (canvas.width !== sizeCss * dpr || canvas.height !== sizeCss * dpr) {
                canvas.width = sizeCss * dpr;
                canvas.height = sizeCss * dpr;
                canvas.style.width = `${sizeCss}px`;
                canvas.style.height = `${sizeCss}px`;
            }

            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.save();
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, sizeCss, sizeCss);

            const cx = sizeCss / 2;
            const cy = sizeCss / 2;
            const outerR = sizeCss / 2 - 4;
            const hubR = Math.max(24, sizeCss * 0.065);

            const items = participants.length > 0
                ? participants.map((p) => p.name)
                : ['READY', 'ADD', 'GUESTS', 'TO', 'SPIN'];

            const total = items.length;
            const stepRad = (Math.PI * 2) / total;
            const rotRad = (rotDeg * Math.PI) / 180;

            const fontSize =
                total > 80 ? 8 : total > 50 ? 10 : total > 35 ? 11.5 : total > 20 ? 13 : 15;

            for (let i = 0; i < total; i++) {
                // Top pointer is at -PI/2; slice 0 starts at rotRad - PI/2 clockwise
                const startA = rotRad + i * stepRad - Math.PI / 2;
                const endA = startA + stepRad;
                const midA = startA + stepRad / 2;
                const isLit = sliceHighlight === i;

                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, outerR, startA, endA);
                ctx.closePath();

                ctx.fillStyle = isLit
                    ? '#f59e0b'
                    : SECRET_GARDEN_COLORS[i % SECRET_GARDEN_COLORS.length];
                ctx.fill();

                ctx.lineWidth = isLit ? 2.5 : 1.25;
                ctx.strokeStyle = isLit ? '#ffffff' : 'rgba(255, 248, 232, 0.85)';
                ctx.stroke();

                // Draw participant name radially along slice center, keeping outer band clear so narrow hub stays uncrowded
                const rawName = items[i];
                const innerSafeR = total > 40 ? Math.max(hubR + 30, outerR * 0.36) : hubR + 18;
                const maxLabelPx = Math.max(60, outerR - 14 - innerSafeR);

                ctx.save();
                ctx.translate(cx, cy);

                const normMid = ((midA % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
                const onLeftHalf = normMid > Math.PI / 2 && normMid < (Math.PI * 3) / 2;

                ctx.font = `700 ${fontSize}px Inter, system-ui, -apple-system, sans-serif`;
                ctx.textBaseline = 'middle';

                // Truncate cleanly if name exceeds outer radial slot width
                let label = rawName;
                if (ctx.measureText(label).width > maxLabelPx) {
                    while (label.length > 3 && ctx.measureText(label + '…').width > maxLabelPx) {
                        label = label.slice(0, -1);
                    }
                    label = label.trimEnd() + '…';
                }

                if (onLeftHalf) {
                    ctx.rotate(midA + Math.PI);
                    ctx.textAlign = 'left';
                    ctx.lineWidth = 2.5;
                    ctx.strokeStyle = isLit ? 'rgba(120, 53, 15, 0.8)' : 'rgba(10, 20, 15, 0.72)';
                    ctx.strokeText(label, -(outerR - 14), 0);
                    ctx.fillStyle = isLit ? '#1c1917' : '#fffaf0';
                    ctx.fillText(label, -(outerR - 14), 0);
                } else {
                    ctx.rotate(midA);
                    ctx.textAlign = 'right';
                    ctx.lineWidth = 2.5;
                    ctx.strokeStyle = isLit ? 'rgba(120, 53, 15, 0.8)' : 'rgba(10, 20, 15, 0.72)';
                    ctx.strokeText(label, outerR - 14, 0);
                    ctx.fillStyle = isLit ? '#1c1917' : '#fffaf0';
                    ctx.fillText(label, outerR - 14, 0);
                }
                ctx.restore();
            }

            // Outer golden ring pegs around circumference
            for (let i = 0; i < total; i++) {
                const pegA = rotRad + i * stepRad - Math.PI / 2;
                const px = cx + Math.cos(pegA) * (outerR - 4);
                const py = cy + Math.sin(pegA) * (outerR - 4);
                ctx.beginPath();
                ctx.arc(px, py, Math.max(2, Math.min(3.5, 160 / total)), 0, Math.PI * 2);
                ctx.fillStyle = '#fde68a';
                ctx.fill();
            }

            ctx.restore();
        },
        [participants, highlightedSliceIdx]
    );

    useEffect(() => {
        drawWheelCanvas(rotationRef.current, highlightedSliceIdx);
        const onResize = () => drawWheelCanvas(rotationRef.current, highlightedSliceIdx);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [drawWheelCanvas, highlightedSliceIdx]);

    const fireConfetti = () => {
        const end = Date.now() + 3400;
        const colors = ['#f59e0b', '#10b981', '#fbbf24', '#fda4af', '#fffbeb'];
        const frame = () => {
            confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0.1, y: 0.65 }, colors });
            confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 0.9, y: 0.65 }, colors });
            confetti({ particleCount: 4, spread: 80, origin: { x: 0.5, y: 0.45 }, colors });
            if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
    };

    const applyRulePreset = (preset: DrawRulePreset) => {
        setActiveRuleId(preset.id);
        setDrawCount(preset.drawCount);
        setRuleMode(preset.ruleMode);
        setSpinDurationMs(preset.spinDurationMs);
    };

    const startSpin = async () => {
        if (isSpinning) return;
        if (authRequired) {
            Swal.fire('Sign In Required', 'Please sign in first to spin the live guest list.', 'info');
            return;
        }
        if (participants.length === 0) {
            Swal.fire('No Participants', 'Please add at least one participant to the wheel.', 'error');
            return;
        }
        const effectiveDrawCount = Math.max(1, drawCount);
        if (ruleMode === 'remove_winner' && effectiveDrawCount > participants.length) {
            Swal.fire('Invalid Draw Count', `Only ${participants.length} participant(s) left in pool.`, 'error');
            return;
        }

        // Prime Web Audio + applause audio strictly inside user click gesture
        ensureAudioContext();
        if (winSoundRef.current) {
            winSoundRef.current.volume = 1;
        }

        if (spinRafRef.current !== null) {
            cancelAnimationFrame(spinRafRef.current);
            spinRafRef.current = null;
        }
        if (postStopTimerRef.current) {
            clearTimeout(postStopTimerRef.current);
            postStopTimerRef.current = null;
        }

        setHighlightedSliceIdx(null);
        setBigWinnerModalOpen(false);
        setIsSpinning(true);

        // Determine snapshot of current wheel slices and pick random distinct winner indices up front
        // so the wheel lands DEAD ON the primary winner's slice at the end of the 8s spin!
        const poolSnapshot = [...participants];
        const total = poolSnapshot.length;
        const stepDeg = 360 / total;
        const pickCount = Math.min(effectiveDrawCount, total);

        const pickedIndices: number[] = [];
        const usedIdx = new Set<number>();
        while (pickedIndices.length < pickCount) {
            const r = Math.floor(Math.random() * total);
            if (!usedIdx.has(r)) {
                usedIdx.add(r);
                pickedIndices.push(r);
            }
        }

        const primaryIndex = pickedIndices[0];
        const pickedRows = pickedIndices.map((idx) => poolSnapshot[idx]);

        // Calculate exact landing rotation so `primaryIndex` centers under 12 o'clock pointer (0 deg)
        const startRot = rotationRef.current;
        const jitterInsideSlice = (Math.random() - 0.5) * stepDeg * 0.45;
        const targetMod = normDeg(-(primaryIndex + 0.5) * stepDeg + jitterInsideSlice);
        const currentMod = normDeg(startRot);
        const forwardAlign = normDeg(targetMod - currentMod);
        const extraSpins = spinDurationMs >= 7000 ? 11 : spinDurationMs >= 5000 ? 8 : 5;
        const totalDelta = extraSpins * 360 + forwardAlign;
        const finalRot = startRot + totalDelta;

        const duration = Math.max(1500, spinDurationMs);
        const startTime = performance.now();
        let lastSpokeStep = Math.floor(startRot / stepDeg);

        const animateFrame = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            // High-tension curve: launches fast, smoothly decelerates over 8 seconds with prolonged slow crawl at end
            const eased = 1 - Math.pow(1 - progress, 4.3);
            const currentRot = startRot + totalDelta * eased;
            rotationRef.current = currentRot;

            const spokeStep = Math.floor(currentRot / stepDeg);
            if (spokeStep !== lastSpokeStep) {
                lastSpokeStep = spokeStep;
                playPegTick(progress);
                setPointerBounce(true);
                setTimeout(() => setPointerBounce(false), 60);
            }

            drawWheelCanvas(currentRot, null);

            if (progress < 1) {
                spinRafRef.current = requestAnimationFrame(animateFrame);
                return;
            }

            // Landed cleanly on primary winner's slice!
            spinRafRef.current = null;
            rotationRef.current = finalRot;
            setHighlightedSliceIdx(primaryIndex);
            drawWheelCanvas(finalRot, primaryIndex);
            playLockChime();

            // Start exact 0.5s post-stop reveal timer immediately when wheel stops, saving to DB in parallel!
            postStopTimerRef.current = setTimeout(() => {
                setBigWinnerNames(pickedRows.map((r) => r.name));
                setBigWinnerModalOpen(true);
                fireConfetti();
                playCelebrationFanfare();
                setIsSpinning(false);
            }, Math.max(0, revealDelayMs));

            const persistWinners = async () => {
                const nowIso = new Date().toISOString();
                if (ruleMode === 'remove_winner') {
                    await Promise.all(
                        pickedRows.map((row) =>
                            supabase
                                .from('attendees')
                                .update({
                                    data: {
                                        ...(row.data || {}),
                                        won_prize: true,
                                        won_at: nowIso,
                                    },
                                })
                                .eq('id', row.id)
                        )
                    );
                    await fetchData(selectedProjectId);
                } else {
                    const newEncore: WinnerItem[] = pickedRows.map((row) => ({
                        id: `${row.id}-${Date.now()}`,
                        name: row.name,
                        code: row.ticket_code,
                        wonAt: nowIso,
                        data: row.data,
                    }));
                    setEncoreWinners((prev) => [...newEncore, ...prev]);
                }
            };

            persistWinners().catch((err) => {
                console.error('Commit winner failed:', err);
                Swal.fire('Sync Warning', 'Winner displayed, but cloud save had an error. Check connection.', 'warning');
            });
        };

        spinRafRef.current = requestAnimationFrame(animateFrame);
    };

    const handleDownloadWinners = () => {
        if (displayedWinners.length === 0) {
            Swal.fire('No Winners Yet', 'Spin the wheel first before exporting the winners list.', 'info');
            return;
        }
        const rows = displayedWinners.map((w, idx) => ({
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
            text: `Remove "${winner.name}" from Winners and return them to the wheel?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Return to Wheel',
        });
        if (!res.isConfirmed) return;

        if (winner.id.includes('-')) {
            // Encore local win item
            setEncoreWinners((prev) => prev.filter((w) => w.id !== winner.id));
            return;
        }

        const nextData = { ...(winner.data || {}), won_prize: false, won_at: null };
        const { error } = await supabase.from('attendees').update({ data: nextData }).eq('id', winner.id);
        if (error) {
            Swal.fire('Error', error.message, 'error');
            return;
        }
        await fetchData(selectedProjectId);
    };

    const handleResetAllWinners = async () => {
        if (displayedWinners.length === 0) {
            Swal.fire('Already Reset', 'There are no winners to reset right now.', 'info');
            return;
        }
        const res = await Swal.fire({
            title: 'Reset All Winners?',
            text: `All ${displayedWinners.length} winner(s) will return to the spin wheel. No guests are deleted.`,
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
        setEncoreWinners([]);
        setHighlightedSliceIdx(null);
        await fetchData(selectedProjectId);
        Swal.fire('Reset Complete', 'All guests are eligible on the wheel again.', 'success');
    };

    const handleQuickAddParticipant = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = quickAddName.trim();
        if (!trimmed || addingGuest) return;
        setAddingGuest(true);
        try {
            const ticketCode = `SMDS-G-${Date.now().toString(36).toUpperCase()}`;
            const { error } = await supabase.from('attendees').insert({
                project_id: selectedProjectId === 'ALL' ? SMDS_PROJECT_ID : selectedProjectId,
                name: trimmed,
                ticket_code: ticketCode,
                checked_in: true,
                checked_in_at: new Date().toISOString(),
                data: { won_prize: false, walk_in: true },
            });
            if (error) throw error;
            setQuickAddName('');
            await fetchData(selectedProjectId);
        } catch (err: any) {
            Swal.fire('Add Failed', err?.message || 'Could not add participant.', 'error');
        } finally {
            setAddingGuest(false);
        }
    };

    const handleRemoveParticipant = async (row: AttendeeRow) => {
        if (isSpinning || busyRowId) return;
        setBusyRowId(row.id);
        try {
            const { error } = await supabase
                .from('attendees')
                .update({ checked_in: false })
                .eq('id', row.id);
            if (error) throw error;
            setParticipants((prev) => prev.filter((p) => p.id !== row.id));
        } catch (err: any) {
            Swal.fire('Remove Failed', err?.message || 'Could not remove participant.', 'error');
        } finally {
            setBusyRowId(null);
        }
    };

    const handleBgFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result;
            if (typeof dataUrl !== 'string') return;

            // Compress large images onto an HD canvas so localStorage reliably persists them
            if (file.size <= 1.2 * 1024 * 1024) {
                setBackgroundImage(`url(${dataUrl})`);
                return;
            }
            const img = new Image();
            img.onload = () => {
                const maxW = 1920;
                const scale = img.width > maxW ? maxW / img.width : 1;
                const c = document.createElement('canvas');
                c.width = Math.round(img.width * scale);
                c.height = Math.round(img.height * scale);
                const cctx = c.getContext('2d');
                if (cctx) {
                    cctx.drawImage(img, 0, 0, c.width, c.height);
                    const compressed = c.toDataURL('image/jpeg', 0.86);
                    setBackgroundImage(`url(${compressed})`);
                } else {
                    setBackgroundImage(`url(${dataUrl})`);
                }
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    };

    const activePreset = DRAW_RULE_PRESETS.find((r) => r.id === activeRuleId);

    return (
        <div
            className="min-h-screen w-full overflow-hidden font-sans transition-all duration-500 ease-in-out relative select-none"
            style={{
                background: backgroundImage.startsWith('url(') ? undefined : backgroundImage,
                backgroundImage: backgroundImage.startsWith('url(') ? backgroundImage : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
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

            {/* Top-Left Navigation & Pool Counter */}
            <div className="fixed top-4 left-4 z-[60] flex items-center gap-2.5">
                <Link
                    href="/dashboard"
                    title="Back to Dashboard"
                    className="bg-emerald-950/80 hover:bg-emerald-900 backdrop-blur-md border border-amber-300/45 text-amber-100 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition transform hover:scale-105"
                >
                    <i className="fa-solid fa-arrow-left" />
                </Link>
                <div className="flex items-center gap-2 text-amber-50 bg-emerald-950/80 border border-amber-300/45 px-3.5 py-2 rounded-full backdrop-blur-md shadow-lg text-xs sm:text-sm font-bold">
                    <span
                        className={`w-2.5 h-2.5 rounded-full inline-block ${
                            dbStatus === 'online'
                                ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]'
                                : 'bg-rose-400'
                        }`}
                    />
                    <span className="text-amber-300 font-black">{participants.length}</span>
                    <span>Participants</span>
                </div>
                <button
                    onClick={() => setMobileDrawer(mobileDrawer === 'participants' ? 'none' : 'participants')}
                    className="lg:hidden bg-emerald-950/80 border border-amber-300/45 text-amber-100 px-3 py-2 rounded-full text-xs font-bold backdrop-blur-md shadow-lg"
                >
                    <i className="fa-solid fa-users mr-1" /> Edit List
                </button>
            </div>

            {/* Top-Right Stage Controls */}
            <div className="fixed top-4 right-4 z-[60] flex items-center gap-2">
                <button
                    onClick={() => setMobileDrawer(mobileDrawer === 'winners' ? 'none' : 'winners')}
                    className="lg:hidden bg-emerald-950/80 border border-amber-300/45 text-amber-100 px-3 py-2 rounded-full text-xs font-bold backdrop-blur-md shadow-lg"
                >
                    <i className="fa-solid fa-trophy text-amber-300 mr-1" /> ({displayedWinners.length})
                </button>
                <button
                    onClick={toggleFullscreen}
                    title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                    className="w-10 h-10 bg-emerald-950/80 hover:bg-emerald-900 backdrop-blur-md text-amber-100 rounded-full shadow-lg border border-amber-300/45 transition flex items-center justify-center"
                >
                    <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'}`} />
                </button>
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
                    className="w-10 h-10 bg-emerald-950/80 hover:bg-emerald-900 backdrop-blur-md text-amber-100 rounded-full shadow-lg border border-amber-300/45 transition flex items-center justify-center"
                >
                    <i className={`fa-solid ${isMuted ? 'fa-volume-xmark text-rose-400' : 'fa-volume-high'}`} />
                </button>
                <button
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    title="Cloud Settings"
                    className="w-10 h-10 bg-emerald-950/80 hover:bg-emerald-900 backdrop-blur-md text-amber-100 rounded-full shadow-lg border border-amber-300/45 transition flex items-center justify-center"
                >
                    <i className="fa-solid fa-gear" />
                </button>
            </div>

            {/* Main Content Layer */}
            <div className="relative z-10 h-screen w-full flex flex-col items-center pointer-events-auto">
                {/* Editable Stage Title */}
                {eventTitle.trim().length > 0 && (
                    <div
                        id="topTitleContainer"
                        className="w-full flex justify-center px-16 z-20 transition-all duration-150"
                        style={{ paddingTop: `${titlePos}px` }}
                    >
                        <button
                            type="button"
                            onClick={() => setSettingsOpen(true)}
                            title="Click to edit title in Settings"
                            className="px-7 py-1.5 rounded-full bg-emerald-950/82 hover:bg-emerald-950/92 border border-amber-300/55 backdrop-blur-md shadow-xl transition cursor-pointer"
                        >
                            <h1
                                className="font-black tracking-wide text-center leading-tight"
                                style={{ fontSize: `${titleSize}px`, color: titleColor }}
                            >
                                {eventTitle}
                            </h1>
                        </button>
                    </div>
                )}

                {/* Main Arena Row */}
                <div className="flex-1 w-full flex items-center justify-center relative px-4">
                    {/* Auth Notice */}
                    {authRequired && (
                        <div className="absolute top-6 z-40 bg-emerald-950/90 border border-amber-300/60 text-amber-50 px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-4">
                            <div className="text-xs sm:text-sm font-medium">
                                <span className="font-bold text-amber-300">Staff Sign-In Required:</span> Sign in to load and update live guests.
                            </div>
                            <Link
                                href="/auth?returnTo=/apps/lucky-draw"
                                className="bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs uppercase tracking-wider px-4 py-2 rounded-full transition shadow"
                            >
                                Sign In
                            </Link>
                        </div>
                    )}

                    {/* LEFT SIDEBAR: Live Participants (+ / -) */}
                    <aside
                        className={`${
                            mobileDrawer === 'participants'
                                ? 'flex fixed left-4 right-4 top-20 bottom-6 z-50 lg:right-auto lg:w-64'
                                : 'hidden lg:flex lg:fixed lg:left-5 lg:top-20 lg:bottom-6 lg:w-64'
                        } flex-col bg-white/88 backdrop-blur-md border border-amber-300/65 shadow-2xl rounded-2xl p-3 pointer-events-auto`}
                    >
                        <div className="flex justify-between items-center pb-2 mb-2 border-b border-amber-200/80">
                            <h3 className="font-black text-emerald-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                <i className="fa-solid fa-users text-emerald-700" />
                                Participants ({participants.length})
                            </h3>
                            <button
                                onClick={() => setMobileDrawer('none')}
                                className="lg:hidden text-gray-500 hover:text-gray-800 text-xs px-1"
                            >
                                <i className="fa-solid fa-xmark text-base" />
                            </button>
                        </div>

                        {/* Quick + Add Guest */}
                        <form onSubmit={handleQuickAddParticipant} className="flex gap-1.5 mb-2">
                            <input
                                type="text"
                                value={quickAddName}
                                onChange={(e) => setQuickAddName(e.target.value)}
                                placeholder="Add guest name..."
                                className="flex-1 min-w-0 text-xs bg-white border border-emerald-200 rounded-lg px-2.5 py-1.5 text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <button
                                type="submit"
                                disabled={addingGuest || !quickAddName.trim() || isSpinning}
                                title="Add participant to wheel"
                                className="bg-emerald-800 hover:bg-emerald-700 disabled:opacity-45 text-amber-100 text-xs font-black px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 shrink-0"
                            >
                                <i className="fa-solid fa-plus" /> Add
                            </button>
                        </form>

                        {/* Search Filter */}
                        <div className="relative mb-2">
                            <i className="fa-solid fa-magnifying-glass text-[10px] text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={participantSearch}
                                onChange={(e) => setParticipantSearch(e.target.value)}
                                placeholder="Search participants..."
                                className="w-full text-[11px] bg-white/80 border border-gray-200 rounded-lg pl-7 pr-2.5 py-1 text-gray-700 placeholder-gray-400 outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>

                        {/* Participant Rows */}
                        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                            {filteredParticipants.length === 0 ? (
                                <div className="text-center text-xs text-gray-400 py-8">
                                    No active participants match.
                                </div>
                            ) : (
                                filteredParticipants.map((p, idx) => (
                                    <div
                                        key={p.id}
                                        className="group bg-white/95 hover:bg-emerald-50/70 px-2.5 py-1.5 rounded-lg border border-amber-200/50 flex items-center justify-between gap-2 shadow-xs transition"
                                    >
                                        <div className="min-w-0 flex items-center gap-1.5">
                                            <span className="text-[10px] font-bold text-emerald-700/70 w-5 shrink-0">
                                                {idx + 1}.
                                            </span>
                                            <span className="text-xs font-semibold text-emerald-950 truncate" title={p.name}>
                                                {p.name}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveParticipant(p)}
                                            disabled={isSpinning || busyRowId === p.id}
                                            title="Remove from active wheel"
                                            className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 w-5 h-5 rounded flex items-center justify-center text-xs transition shrink-0"
                                        >
                                            <i className="fa-solid fa-minus" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </aside>

                    {/* CENTER WHEEL STAGE */}
                    <div className="flex flex-col items-center justify-center relative -mt-3">
                        <div className="w-[min(66vh,575px)] h-[min(66vh,575px)] relative flex items-center justify-center">
                            {/* Animated Top Pointer Arrow */}
                            <div
                                className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-30 drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)] pointer-events-none flex flex-col items-center transition-transform duration-75 ${
                                    pointerBounce ? '-rotate-12 scale-105' : 'rotate-0'
                                }`}
                            >
                                <div className="w-5 h-5 rounded-full bg-amber-300 border-2 border-emerald-950 -mb-2 shadow" />
                                <div className="w-0 h-0 border-l-[17px] border-l-transparent border-r-[17px] border-r-transparent border-t-[40px] border-t-rose-700" />
                            </div>

                            {/* Golden Halo Wheel Container */}
                            <div
                                ref={wheelContainerRef}
                                className="w-full h-full rounded-full p-2.5 bg-gradient-to-br from-amber-200 via-amber-400 to-amber-200 shadow-[0_24px_65px_rgba(20,45,35,0.48)] relative flex items-center justify-center"
                            >
                                <div className="w-full h-full rounded-full bg-emerald-950 overflow-hidden flex items-center justify-center relative">
                                    <canvas ref={wheelCanvasRef} className="block" />
                                </div>
                                {/* Center Hub Cap */}
                                <div className="absolute w-14 h-14 rounded-full bg-gradient-to-br from-emerald-900 to-emerald-950 border-2 border-amber-300 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center pointer-events-none">
                                    <span className="text-[10px] font-black tracking-widest text-amber-200">SMDS</span>
                                </div>
                            </div>
                        </div>

                        {/* SPIN + Active Rule Dock */}
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 z-30">
                            <button
                                onClick={startSpin}
                                disabled={isSpinning}
                                className="cursor-pointer bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 hover:from-emerald-800 hover:to-teal-800 text-amber-200 text-2xl sm:text-3xl font-black px-10 py-2.5 rounded-full shadow-[0_12px_30px_rgba(6,78,59,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border-2 border-amber-300/85 disabled:opacity-75 tracking-wider"
                            >
                                <i className="fa-solid fa-crown text-amber-300 text-xl" />
                                {isSpinning ? 'SPINNING...' : 'SPIN'}
                            </button>
                            <div className="bg-white/92 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-amber-300/70 flex items-center gap-3 text-xs font-bold text-emerald-950">
                                <span>
                                    Draw: <strong className="text-emerald-800 text-sm">{drawCount}</strong>
                                </span>
                                <span className="text-amber-500">•</span>
                                <span>{Math.round(spinDurationMs / 1000)}s</span>
                                <span className="text-amber-500">•</span>
                                <button
                                    type="button"
                                    onClick={() => setSettingsOpen(true)}
                                    className="text-emerald-700 hover:text-emerald-900 underline decoration-amber-400"
                                >
                                    {activePreset ? activePreset.label.split(' (')[0] : 'Custom Rule'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR: Cloud Winners */}
                    <aside
                        className={`${
                            mobileDrawer === 'winners'
                                ? 'flex fixed left-4 right-4 top-20 bottom-6 z-50 lg:left-auto lg:w-64'
                                : 'hidden lg:flex lg:fixed lg:right-5 lg:top-20 lg:bottom-6 lg:w-64'
                        } flex-col bg-white/88 backdrop-blur-md border border-amber-300/65 shadow-2xl rounded-2xl p-3 pointer-events-auto`}
                    >
                        <div className="flex justify-between items-center pb-2 mb-2 border-b border-amber-200/80">
                            <h3 className="font-black text-emerald-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                <i className="fa-solid fa-trophy text-amber-600" />
                                Winners ({displayedWinners.length})
                            </h3>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={handleDownloadWinners}
                                    className="text-xs text-emerald-800 hover:bg-emerald-50 font-bold px-2.5 py-1 rounded-lg border border-emerald-200 transition flex items-center gap-1"
                                >
                                    <i className="fa-solid fa-download" /> Save
                                </button>
                                <button
                                    onClick={() => setMobileDrawer('none')}
                                    className="lg:hidden text-gray-500 hover:text-gray-800 text-xs px-1"
                                >
                                    <i className="fa-solid fa-xmark text-base" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                            {displayedWinners.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-xs text-emerald-900/55 px-3">
                                    <i className="fa-solid fa-champagne-glasses text-2xl text-amber-500/60 mb-2" />
                                    Ready for tonight&apos;s first winner draw!
                                </div>
                            ) : (
                                displayedWinners.map((w, i) => (
                                    <div
                                        key={w.id || i}
                                        className="group bg-white/95 p-2.5 rounded-xl shadow-xs border-l-4 border-amber-500 flex items-center justify-between gap-2"
                                    >
                                        <div className="min-w-0">
                                            <div className="font-bold text-emerald-950 text-sm truncate">{w.name}</div>
                                            <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
                                                Winner #{displayedWinners.length - i}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleUndoWinner(w)}
                                            title="Return guest to wheel"
                                            className="opacity-60 group-hover:opacity-100 text-gray-400 hover:text-rose-600 text-xs p-1 transition"
                                        >
                                            <i className="fa-solid fa-rotate-left" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </aside>
                </div>
            </div>

            {/* FULL-STAGE ANIMATED WINNER REVEAL PAGE */}
            <div
                aria-hidden={!bigWinnerModalOpen}
                className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/82 backdrop-blur-md transition-all duration-500 ${
                    bigWinnerModalOpen ? 'visible opacity-100 pointer-events-auto' : 'invisible opacity-0 pointer-events-none'
                }`}
            >
                <div
                    className={`w-[92%] max-w-4xl max-h-[88vh] rounded-3xl border-4 border-amber-300 flex flex-col relative overflow-hidden transition-all duration-700 ${
                        bigWinnerModalOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-75 translate-y-8 opacity-0'
                    } bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 shadow-[0_30px_100px_rgba(245,158,11,0.35)]`}
                >
                    {/* Animated Radiant Golden Burst */}
                    <div
                        className="absolute -inset-24 opacity-20 pointer-events-none animate-[spin_28s_linear_infinite]"
                        style={{
                            background:
                                'repeating-conic-gradient(from 0deg, rgba(251,191,36,0.4) 0deg 10deg, transparent 10deg 20deg)',
                        }}
                    />

                    <div className="text-center pt-10 pb-3 px-6 z-10">
                        <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-300/60 text-amber-200 text-xs font-black uppercase tracking-[0.28em] px-4 py-1.5 rounded-full mb-4 animate-bounce">
                            <i className="fa-solid fa-crown text-amber-300" />
                            Official Winner Reveal
                        </div>
                        <p className="text-amber-100/80 text-xs sm:text-sm font-bold uppercase tracking-[0.22em] mb-1">
                            {eventTitle.trim() || 'SMDS Secret Draw'}
                        </p>
                        <h2
                            className="text-amber-300 font-black text-4xl sm:text-5xl md:text-6xl uppercase tracking-widest drop-shadow-xl"
                            style={{ textShadow: '0 4px 18px rgba(0,0,0,0.65)' }}
                        >
                            Congratulations
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-5 z-10 text-center flex flex-col items-center justify-center gap-4">
                        {bigWinnerNames.map((name, i) => (
                            <div
                                key={i}
                                className="bg-gradient-to-r from-emerald-950/75 via-emerald-900/80 to-emerald-950/75 backdrop-blur-md text-white font-black text-3xl sm:text-5xl md:text-6xl py-7 px-10 rounded-2xl border-2 border-amber-300 shadow-[0_0_45px_rgba(251,191,36,0.32)] w-full max-w-3xl"
                                style={{ textShadow: '0 3px 14px rgba(0,0,0,0.6)' }}
                            >
                                <div>{name}</div>
                            </div>
                        ))}
                    </div>

                    <div className="pb-8 pt-4 flex items-center justify-center gap-4 z-10">
                        <button
                            onClick={() => setBigWinnerModalOpen(false)}
                            className="bg-gradient-to-r from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-emerald-950 text-lg sm:text-xl font-black px-10 py-3 rounded-full shadow-xl hover:scale-105 transition transform border-b-4 border-amber-700"
                        >
                            Back to Wheel
                        </button>
                    </div>
                </div>
            </div>

            {/* SETTINGS DRAWER */}
            <div
                className={`fixed inset-y-0 right-0 w-80 sm:w-96 bg-white shadow-2xl z-[80] flex flex-col text-gray-800 font-sans border-l border-gray-200 transition-transform duration-300 ${
                    settingsOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="p-5 bg-emerald-950 text-amber-50 flex justify-between items-center shadow-md">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <i className="fa-solid fa-sliders text-amber-300" /> Cloud Settings
                    </h2>
                    <button
                        type="button"
                        aria-label="Close Settings"
                        onClick={() => setSettingsOpen(false)}
                        className="hover:text-amber-300 transition"
                    >
                        <i className="fa-solid fa-xmark text-xl" />
                    </button>
                </div>

                <div className="p-5 flex-1 overflow-y-auto space-y-5">
                    {/* 1. Draw Rules & Timing Presets */}
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-3">
                        <h3 className="text-xs font-black text-emerald-900 uppercase flex items-center gap-2">
                            <i className="fa-solid fa-gavel" /> Draw Rules & Timing
                        </h3>
                        <div className="space-y-1.5">
                            {DRAW_RULE_PRESETS.map((preset) => {
                                const selected = activeRuleId === preset.id;
                                return (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => applyRulePreset(preset)}
                                        className={`w-full text-left p-2.5 rounded-lg border transition ${
                                            selected
                                                ? 'bg-emerald-900 text-amber-100 border-emerald-900 shadow-xs'
                                                : 'bg-white text-gray-800 border-emerald-100 hover:bg-emerald-100/40'
                                        }`}
                                    >
                                        <div className="text-xs font-black">{preset.label}</div>
                                        <div
                                            className={`text-[10px] mt-0.5 ${
                                                selected ? 'text-amber-200/90' : 'text-gray-500'
                                            }`}
                                        >
                                            {preset.description}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/70">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                                    Winners / Spin
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={drawCount}
                                    onChange={(e) => {
                                        setActiveRuleId('custom');
                                        setDrawCount(Math.max(1, parseInt(e.target.value, 10) || 1));
                                    }}
                                    className="w-full text-xs font-bold border border-emerald-200 rounded-lg px-2.5 py-1.5 bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                                    Spin Duration
                                </label>
                                <select
                                    value={spinDurationMs}
                                    onChange={(e) => {
                                        setActiveRuleId('custom');
                                        setSpinDurationMs(Number(e.target.value));
                                    }}
                                    className="w-full text-xs font-bold border border-emerald-200 rounded-lg px-2.5 py-1.5 bg-white"
                                >
                                    <option value={3000}>3 sec (Quick)</option>
                                    <option value={5000}>5 sec (Standard)</option>
                                    <option value={8000}>8 sec (Suspense)</option>
                                    <option value={10000}>10 sec (Finale)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveRuleId('custom');
                                    setRuleMode('remove_winner');
                                }}
                                className={`text-[11px] font-bold py-1.5 px-2 rounded-lg border ${
                                    ruleMode === 'remove_winner'
                                        ? 'bg-emerald-800 text-white border-emerald-800'
                                        : 'bg-white text-gray-700 border-gray-200'
                                }`}
                            >
                                Remove After Win
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveRuleId('custom');
                                    setRuleMode('allow_repeat');
                                }}
                                className={`text-[11px] font-bold py-1.5 px-2 rounded-lg border ${
                                    ruleMode === 'allow_repeat'
                                        ? 'bg-emerald-800 text-white border-emerald-800'
                                        : 'bg-white text-gray-700 border-gray-200'
                                }`}
                            >
                                Allow Repeat Win
                            </button>
                        </div>

                        <div>
                            <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-1">
                                <span>Post-Stop Reveal Delay</span>
                                <span>{(revealDelayMs / 1000).toFixed(1)}s</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="2000"
                                step="100"
                                value={revealDelayMs}
                                onChange={(e) => setRevealDelayMs(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* 2. Background Image Upload & Switcher */}
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-3">
                        <h3 className="text-xs font-black text-amber-900 uppercase flex items-center gap-2">
                            <i className="fa-solid fa-image" /> Stage Background
                        </h3>

                        <label className="cursor-pointer flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-black py-2.5 px-3 rounded-xl shadow transition">
                            <i className="fa-solid fa-cloud-arrow-up" />
                            Upload & Replace Background
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleBgFileUpload}
                                className="hidden"
                            />
                        </label>

                        <div className="grid grid-cols-3 gap-1.5">
                            <button
                                type="button"
                                onClick={() => setBackgroundImage(DEFAULT_BG_IMAGE)}
                                className={`text-[11px] font-bold py-1.5 px-1.5 rounded-lg border transition ${
                                    backgroundImage === DEFAULT_BG_IMAGE
                                        ? 'bg-emerald-900 text-amber-200 border-emerald-900'
                                        : 'bg-white text-gray-700 border-gray-200'
                                }`}
                            >
                                Secret Garden
                            </button>
                            <button
                                type="button"
                                onClick={() => setBackgroundImage(CLASSIC_BG_IMAGE)}
                                className={`text-[11px] font-bold py-1.5 px-1.5 rounded-lg border transition ${
                                    backgroundImage === CLASSIC_BG_IMAGE
                                        ? 'bg-emerald-900 text-amber-200 border-emerald-900'
                                        : 'bg-white text-gray-700 border-gray-200'
                                }`}
                            >
                                Classic
                            </button>
                            <button
                                type="button"
                                onClick={() => setBackgroundImage(EMERALD_VELVET_BG)}
                                className={`text-[11px] font-bold py-1.5 px-1.5 rounded-lg border transition ${
                                    backgroundImage === EMERALD_VELVET_BG
                                        ? 'bg-emerald-900 text-amber-200 border-emerald-900'
                                        : 'bg-white text-gray-700 border-gray-200'
                                }`}
                            >
                                Velvet Green
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={customBgInput}
                                onChange={(e) => setCustomBgInput(e.target.value)}
                                placeholder="Or paste image URL..."
                                className="flex-1 text-xs border border-amber-200 rounded-lg px-2.5 py-1.5 bg-white outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (customBgInput.trim()) {
                                        setBackgroundImage(`url(${customBgInput.trim()})`);
                                    }
                                }}
                                className="bg-amber-700 text-white text-xs font-bold px-3 rounded-lg hover:bg-amber-800"
                            >
                                Apply
                            </button>
                        </div>

                        <div>
                            <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-1">
                                <span>Backdrop Overlay Tint</span>
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

                    {/* 3. Title Settings */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <h3 className="text-xs font-black text-slate-700 uppercase flex items-center gap-2">
                            <i className="fa-solid fa-text-height" /> Top Title Settings
                        </h3>
                        <input
                            type="text"
                            value={eventTitle}
                            onChange={(e) => setEventTitle(e.target.value)}
                            placeholder="SMDS Secret Draw"
                            className="w-full text-xs font-bold border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <div className="flex justify-between text-[11px] font-bold text-gray-500 mb-1">
                                    <span>Size</span>
                                    <span>{titleSize}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="18"
                                    max="72"
                                    value={titleSize}
                                    onChange={(e) => setTitleSize(Number(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between text-[11px] font-bold text-gray-500 mb-1">
                                    <span>Top Offset</span>
                                    <span>{titlePos}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="6"
                                    max="140"
                                    value={titlePos}
                                    onChange={(e) => setTitlePos(Number(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-gray-600">Title Color</span>
                            <div className="flex items-center gap-2">
                                {['#fef3c7', '#ffffff', '#2c4435', '#fbbf24'].map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setTitleColor(c)}
                                        className="w-5 h-5 rounded-full border border-gray-300 shadow-xs"
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                                <input
                                    type="color"
                                    value={titleColor}
                                    onChange={(e) => setTitleColor(e.target.value)}
                                    className="w-6 h-6 rounded cursor-pointer border-0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 4. Event Project & Pool Actions */}
                    <div className="space-y-3 border-t border-gray-100 pt-4">
                        <h3 className="text-xs font-black text-gray-500 uppercase">Event Database Pool</h3>
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="w-full text-xs font-bold border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 outline-none"
                        >
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} {p.start_date ? `(${p.start_date})` : ''}
                                </option>
                            ))}
                            <option value="ALL">All Checked-in Attendees</option>
                        </select>

                        <button
                            onClick={handleResetAllWinners}
                            className="w-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-2"
                        >
                            <i className="fa-solid fa-rotate-left" /> Reset All Winners (Keep Guests)
                        </button>
                    </div>
                </div>
            </div>

            {/* Lightweight Celebration Audio (Web Audio handles tick SFX dynamically!) */}
            <audio ref={winSoundRef} src="/assets/celebrate.mp3" preload="metadata" />
        </div>
    );
}
