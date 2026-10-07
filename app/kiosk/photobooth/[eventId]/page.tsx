'use client';

/**
 * ZTO Event OS — AI Photobooth Kiosk
 * Route: /kiosk/photobooth/[eventId]
 *
 * Flow:  ready (live camera) → 3-2-1 countdown → flash + shutter → AI cut-out
 *        → canvas composite → result (QR softcopy + one-click print) → auto-reset
 *
 * Hardware shortcuts (for USB "big buttons" / presenters):
 *   Space / Enter → start      P → print      Esc → back to live view
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { PhotoboothTemplate, PHOTOBOOTH_BUCKET, outputSize, resolveFrameStyle } from '@/lib/photobooth/types';
import { CompositeAssets, canvasToBlob, composite, loadAssets } from '@/lib/photobooth/compositor';
import { CutoutEngine, checkRemoveBg, removeBackground, warmupLocalSegmenter } from '@/lib/photobooth/segmentation';
import { beep, shutter, unlockAudio } from '@/lib/photobooth/sfx';
import styles from './photobooth.module.css';

type Phase = 'boot' | 'error' | 'ready' | 'countdown' | 'processing' | 'result';
type UploadState = 'idle' | 'uploading' | 'done' | 'error';

const AUTO_RESET_SEC = 90;
const EMPTY_ASSETS: CompositeAssets = { background: null, logo: null, overlay: null };
const LS_CAMERA = 'zto-pb:camera';
const LS_MIRROR = 'zto-pb:mirror';

/**
 * Print protocol for DNP / HiTi dye-sub printers.
 * Rendered as a <style> tag that only exists while the kiosk is mounted,
 * so it can never leak into other pages' print output.
 */
const PRINT_CSS = `
@media print {
  @page { margin: 0; size: auto; } /* kill browser header/footer + white margins */
  html, body {
    margin: 0 !important; padding: 0 !important;
    width: 100vw !important; height: 100vh !important;
    overflow: hidden !important; background: #fff !important;
  }
  body * {
    visibility: hidden;
    /* anything that creates a containing block would trap the fixed canvas */
    transform: none !important; filter: none !important; backdrop-filter: none !important;
    animation: none !important; transition: none !important; will-change: auto !important;
    contain: none !important; box-shadow: none !important;
  }
  #final-photo-canvas, #final-photo-canvas * { visibility: visible; }
  #final-photo-canvas {
    position: fixed !important; left: 0 !important; top: 0 !important;
    width: 100vw !important; height: 100vh !important;
    max-width: none !important; max-height: none !important;
    object-fit: cover; margin: 0 !important; border: 0 !important; border-radius: 0 !important;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
}
`;

/** Crop the live frame exactly like `object-fit: cover` does in the preview (WYSIWYG). */
function captureFrame(video: HTMLVideoElement, aspect: number, mirror: boolean): HTMLCanvasElement {
    const vw = video.videoWidth, vh = video.videoHeight;
    let sw = vw, sh = vw / aspect;
    if (sh > vh) { sh = vh; sw = vh * aspect; }
    const sx = (vw - sw) / 2, sy = (vh - sh) / 2;
    const c = document.createElement('canvas');
    c.width = Math.round(sw);
    c.height = Math.round(sh);
    const ctx = c.getContext('2d')!;
    if (mirror) { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, c.width, c.height);
    return c;
}

export default function PhotoboothKioskPage() {
    const { eventId } = useParams<{ eventId: string }>();

    const [phase, setPhase] = useState<Phase>('boot');
    const [errorMsg, setErrorMsg] = useState('');
    const [toast, setToast] = useState('');
    const [template, setTemplate] = useState<PhotoboothTemplate | null>(null);
    const [count, setCount] = useState(0);
    const [flash, setFlash] = useState(false);
    const [still, setStill] = useState<string | null>(null);
    const [upload, setUpload] = useState<UploadState>('idle');
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [engine, setEngine] = useState<CutoutEngine>('none');
    const [elapsed, setElapsed] = useState<number | null>(null);
    const [resetIn, setResetIn] = useState(AUTO_RESET_SEC);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [mirror, setMirror] = useState(true);
    const [cloudAi, setCloudAi] = useState<boolean | null>(null);
    const [shots, setShots] = useState(0);

    const videoRef = useRef<HTMLVideoElement>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);
    const finalRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const assetsRef = useRef<CompositeAssets>(EMPTY_ASSETS);
    const timersRef = useRef<number[]>([]);

    const style = useMemo(() => resolveFrameStyle(template?.frame_style), [template]);
    const { width: OW, height: OH } = outputSize(style.orientation);
    const hasTemplate = !!template;

    const later = useCallback((fn: () => void, ms: number) => {
        timersRef.current.push(window.setTimeout(fn, ms));
    }, []);
    const clearTimers = useCallback(() => {
        timersRef.current.forEach(t => clearTimeout(t));
        timersRef.current = [];
    }, []);

    const showToast = useCallback((msg: string) => {
        setToast(msg);
        window.setTimeout(() => setToast(''), 4000);
    }, []);

    // ── Prefs ───────────────────────────────────────────────────────────────
    useEffect(() => {
        setDeviceId(localStorage.getItem(LS_CAMERA) || '');
        setMirror(localStorage.getItem(LS_MIRROR) !== '0');
    }, []);

    // ── Template + realtime + AI warm-up ────────────────────────────────────
    useEffect(() => {
        if (!eventId) return;
        let cancelled = false;
        (async () => {
            const { data, error } = await supabase
                .from('photobooth_templates').select('*').eq('event_id', eventId).maybeSingle();
            if (cancelled) return;
            if (error || !data) {
                setErrorMsg(error?.message || 'No photobooth template has been configured for this event yet.');
                setPhase('error');
                return;
            }
            setTemplate(data as PhotoboothTemplate);
        })();

        const channel = supabase
            .channel(`pb-template-${eventId}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'photobooth_templates', filter: `event_id=eq.${eventId}` },
                payload => {
                    const row = payload.new as PhotoboothTemplate | undefined;
                    if (row && row.event_id) setTemplate(row);
                })
            .subscribe();

        checkRemoveBg().then(setCloudAi);
        warmupLocalSegmenter().catch(() => { /* fallback handled at capture */ });

        return () => { cancelled = true; supabase.removeChannel(channel); };
    }, [eventId]);

    // ── Asset preload + live overlay ────────────────────────────────────────
    const drawOverlay = useCallback(() => {
        if (!overlayRef.current || !template) return;
        composite({
            canvas: overlayRef.current,
            subject: null,
            assets: assetsRef.current,
            eventName: template.event_name,
            style,
            transparentBackground: true,
        });
    }, [template, style]);

    useEffect(() => {
        if (!template) return;
        let cancelled = false;
        loadAssets(template.bg_image_url, template.logo_url, style.overlay_url).then(a => {
            if (cancelled) return;
            assetsRef.current = a;
            drawOverlay();
        });
        return () => { cancelled = true; };
    }, [template, style.overlay_url, drawOverlay]);

    // ── Camera (WebRTC) ─────────────────────────────────────────────────────
    const startCamera = useCallback(async (id: string) => {
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error('Camera API unavailable. Open this page over HTTPS (or localhost).');
        }
        streamRef.current?.getTracks().forEach(t => t.stop());
        const hd = { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } };
        const video: MediaTrackConstraints = id ? { ...hd, deviceId: { exact: id } } : { ...hd, facingMode: 'user' };
        let stream: MediaStream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
        } catch (e) {
            if (id) { // saved camera unplugged → fall back to default
                localStorage.removeItem(LS_CAMERA);
                stream = await navigator.mediaDevices.getUserMedia({ video: { ...hd, facingMode: 'user' }, audio: false });
            } else throw e;
        }
        streamRef.current = stream;
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play().catch(() => {});
        }
        const all = await navigator.mediaDevices.enumerateDevices();
        setDevices(all.filter(d => d.kind === 'videoinput'));
    }, []);

    useEffect(() => {
        if (!hasTemplate || deviceId === null) return;
        startCamera(deviceId)
            .then(() => setPhase(p => (p === 'boot' ? 'ready' : p)))
            .catch((e: Error & { name?: string }) => {
                const msg = e.name === 'NotAllowedError'
                    ? 'Camera permission denied. Allow camera access in the browser and reload.'
                    : e.name === 'NotFoundError' ? 'No camera detected. Connect a webcam and reload.' : e.message;
                setErrorMsg(msg);
                setPhase('error');
            });
    }, [hasTemplate, deviceId, startCamera]);

    useEffect(() => () => {
        clearTimers();
        streamRef.current?.getTracks().forEach(t => t.stop());
    }, [clearTimers]);

    // ── Upload to Supabase Storage + record ─────────────────────────────────
    const uploadFinal = useCallback(async () => {
        const canvas = finalRef.current;
        if (!canvas || !eventId) return;
        setUpload('uploading');
        try {
            const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
            const day = new Date().toISOString().slice(0, 10);
            const path = `${eventId}/${day}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
            const { error: upErr } = await supabase.storage
                .from(PHOTOBOOTH_BUCKET)
                .upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false });
            if (upErr) throw upErr;
            const { data: { publicUrl } } = supabase.storage.from(PHOTOBOOTH_BUCKET).getPublicUrl(path);
            setPhotoUrl(publicUrl);
            setUpload('done');
            const { error: dbErr } = await supabase
                .from('photobooth_records')
                .insert({ event_id: eventId, final_image_url: publicUrl, storage_path: path });
            if (dbErr) console.warn('[photobooth] record insert failed', dbErr);
        } catch (e) {
            console.error('[photobooth] upload failed', e);
            setUpload('error');
        }
    }, [eventId]);

    // ── Shutter → AI → composite ────────────────────────────────────────────
    const takeShot = useCallback(async () => {
        const video = videoRef.current;
        if (!video || !video.videoWidth || !template) {
            showToast('Camera not ready — please try again.');
            setPhase('ready');
            return;
        }
        shutter();
        setFlash(true);
        later(() => setFlash(false), 700);

        const t0 = performance.now();
        const raw = captureFrame(video, OW / OH, mirror);
        setStill(raw.toDataURL('image/jpeg', 0.75));
        setPhase('processing');

        try {
            const { cutout, engine: used } = await removeBackground(raw, style.bg_removal, template.event_id);
            setEngine(used);

            let aiBg = assetsRef.current.background;
            if (style.bg_type === 'ai' && style.theme_prompt) {
                let finalPrompt = style.theme_prompt;
                try {
                    const res = await fetch('/api/photobooth/enhance-prompt', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ theme: style.theme_prompt })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.enhancedPrompt) finalPrompt = data.enhancedPrompt;
                    }
                } catch (e) {
                    console.warn('[photobooth] Gemini enhance failed, falling back to base prompt', e);
                }

                const seed = Math.floor(Math.random() * 1000000000);
                const bgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${OW}&height=${OH}&nologo=true&seed=${seed}`;
                
                const img = new Image();
                img.crossOrigin = 'anonymous';
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = bgUrl;
                });
                aiBg = img;
            }

            composite({
                canvas: finalRef.current!,
                subject: cutout ?? raw,
                assets: { ...assetsRef.current, background: aiBg },
                eventName: template.event_name,
                style,
            });
            setElapsed((performance.now() - t0) / 1000);
            setResetIn(AUTO_RESET_SEC);
            setShots(s => s + 1);
            setPhase('result');
            void uploadFinal();
        } catch (e) {
            console.error('[photobooth] compose failed', e);
            showToast('Something went wrong — please try again.');
            setPhase('ready');
        }
    }, [template, style, OW, OH, mirror, later, uploadFinal, showToast]);

    const startSession = useCallback(() => {
        if (phase !== 'ready' && phase !== 'result') return;
        unlockAudio();
        clearTimers();
        setUpload('idle');
        setPhotoUrl(null);
        setElapsed(null);
        setStill(null);
        setSettingsOpen(false);
        setPhase('countdown');
        const n = Math.max(1, Math.min(10, Math.round(style.countdown || 3)));
        for (let i = 0; i < n; i++) {
            later(() => { setCount(n - i); beep(i === n - 1 ? 988 : 784); }, i * 1000);
        }
        later(() => { setCount(0); void takeShot(); }, n * 1000);
    }, [phase, style.countdown, clearTimers, later, takeShot]);

    const backToReady = useCallback(() => {
        clearTimers();
        setPhase('ready');
        setStill(null);
        setPhotoUrl(null);
        setUpload('idle');
    }, [clearTimers]);

    const printPhoto = useCallback(() => {
        if (phase !== 'result') return;
        setResetIn(AUTO_RESET_SEC);
        window.print();
    }, [phase]);

    // ── Auto reset in result phase ──────────────────────────────────────────
    useEffect(() => {
        if (phase !== 'result') return;
        const t = window.setInterval(() => setResetIn(s => s - 1), 1000);
        return () => clearInterval(t);
    }, [phase]);

    useEffect(() => {
        if (phase === 'result' && resetIn <= 0) backToReady();
    }, [phase, resetIn, backToReady]);

    // ── Keyboard / USB button ───────────────────────────────────────────────
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (settingsOpen) return;
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT') return;
            if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); startSession(); }
            else if (e.key.toLowerCase() === 'p') { e.preventDefault(); printPhoto(); }
            else if (e.key === 'Escape' && phase === 'result') backToReady();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [settingsOpen, startSession, printPhoto, backToReady, phase]);

    // ── Settings helpers ────────────────────────────────────────────────────
    const chooseCamera = (id: string) => {
        localStorage.setItem(LS_CAMERA, id);
        setDeviceId(id);
    };
    const toggleMirror = () => {
        setMirror(m => { localStorage.setItem(LS_MIRROR, m ? '0' : '1'); return !m; });
    };
    const toggleFullscreen = () => {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        else document.documentElement.requestFullscreen().catch(() => {});
    };

    const stageHeight = `min(76vh, calc(88vw * ${OH / OW}))`;
    const resultHeight = `min(80vh, calc(52vw * ${OH / OW}))`;
    const engineLabel = engine === 'remove.bg' ? 'Cloud AI' : engine === 'on-device' ? 'On-device AI' : 'Original';

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div
            className={styles.root}
            onPointerDown={() => phase === 'result' && setResetIn(AUTO_RESET_SEC)}
        >
            <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
            <div className={styles.aurora} aria-hidden />
            <div className={styles.grain} aria-hidden />

            {/* Top bar */}
            <header className={styles.topBar}>
                <div className={styles.brand}>
                    <span className={styles.brandDot} />
                    <span>ZTO <b>PHOTOBOOTH</b></span>
                </div>
                <h1 className={styles.eventTitle}>{template?.event_name || 'AI Photobooth'}</h1>
                <button
                    id="pb-settings-toggle"
                    className={styles.iconBtn}
                    onClick={() => setSettingsOpen(o => !o)}
                    aria-label="Booth settings"
                >
                    <i className="fa-solid fa-sliders" />
                </button>
            </header>

            {/* Boot / error */}
            {phase === 'boot' && (
                <div className={styles.center}>
                    <div className={styles.spinner} />
                    <p className={styles.mutedCaps}>Warming up camera &amp; AI engine…</p>
                </div>
            )}
            {phase === 'error' && (
                <div className={styles.center}>
                    <div className={styles.errorCard}>
                        <i className="fa-solid fa-triangle-exclamation" />
                        <h2>Booth unavailable</h2>
                        <p>{errorMsg}</p>
                        <div className={styles.row}>
                            <button className={styles.ghostBtn} onClick={() => location.reload()}>
                                <i className="fa-solid fa-rotate-right" /> Reload
                            </button>
                            <Link className={styles.ghostBtn} href="/apps/photobooth">
                                <i className="fa-solid fa-sliders" /> Open Studio
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Live stage — kept mounted so the stream never drops */}
            <main
                className={styles.stageArea}
                data-hidden={phase === 'boot' || phase === 'error' || phase === 'result'}
            >
                <div className={styles.stage} style={{ height: stageHeight, aspectRatio: `${OW} / ${OH}` }}>
                    <video
                        ref={videoRef}
                        className={styles.video}
                        style={{ transform: mirror ? 'scaleX(-1)' : undefined }}
                        playsInline
                        muted
                        autoPlay
                    />
                    <canvas ref={overlayRef} className={styles.overlay} />
                    <span className={`${styles.corner} ${styles.tl}`} />
                    <span className={`${styles.corner} ${styles.tr}`} />
                    <span className={`${styles.corner} ${styles.bl}`} />
                    <span className={`${styles.corner} ${styles.br}`} />

                    {/* Processing: frozen frame + AI scan */}
                    <AnimatePresence>
                        {phase === 'processing' && still && (
                            <motion.div
                                className={styles.processing}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={still} alt="" className={styles.still} />
                                <div className={styles.scanLine} />
                                <div className={styles.processingLabel}>
                                    <i className="fa-solid fa-wand-magic-sparkles" />
                                    <span>AI is creating your photo…</span>
                                    <small>AI 正在为您合成</small>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Countdown */}
                    <AnimatePresence mode="popLayout">
                        {phase === 'countdown' && count > 0 && (
                            <motion.div
                                key={count}
                                className={styles.countdown}
                                initial={{ scale: 2.4, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.4, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                            >
                                {count}
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {phase === 'countdown' && count > 0 && <div key={`ring-${count}`} className={styles.ring} />}
                </div>

                {phase === 'ready' && (
                    <motion.button
                        id="pb-start"
                        className={styles.startBtn}
                        onClick={startSession}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        whileTap={{ scale: 0.96 }}
                    >
                        <span className={styles.startIcon}><i className="fa-solid fa-camera" /></span>
                        <span className={styles.startText}>
                            <b>Tap to Start</b>
                            <small>点击开始拍照</small>
                        </span>
                    </motion.button>
                )}
                {phase === 'countdown' && <p className={styles.mutedCaps}>Get ready — smile! 😄</p>}
            </main>

            {/* Result */}
            <section className={styles.result} data-visible={phase === 'result'} aria-hidden={phase !== 'result'}>
                <motion.div
                    className={styles.photoWrap}
                    initial={false}
                    animate={phase === 'result' ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
                    style={{ height: resultHeight }}
                >
                    <canvas id="final-photo-canvas" ref={finalRef} className={styles.finalCanvas} width={OW} height={OH} />
                </motion.div>

                <div className={styles.sidePanel}>
                    <div className={styles.qrCard}>
                        {upload === 'done' && photoUrl ? (
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                <QRCode value={photoUrl} size={260} level="M" bgColor="#ffffff" fgColor="#0a0a0a" />
                            </motion.div>
                        ) : upload === 'error' ? (
                            <div className={styles.qrPlaceholder}>
                                <i className="fa-solid fa-cloud-arrow-up" />
                                <span>Upload failed</span>
                                <button id="pb-retry-upload" className={styles.ghostBtnDark} onClick={() => uploadFinal()}>
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <div className={styles.qrPlaceholder}>
                                <div className={styles.spinnerDark} />
                                <span>Uploading HD photo…</span>
                            </div>
                        )}
                    </div>
                    <p className={styles.qrLabel}>
                        <b>Scan to Download Softcopy</b>
                        <span>扫码获取高清电子版</span>
                    </p>

                    <button id="pb-print" className={styles.printBtn} onClick={printPhoto}>
                        <span>🖨️</span> Print Photo
                    </button>

                    <div className={styles.row}>
                        <button id="pb-retake" className={styles.ghostBtn} onClick={startSession}>
                            <i className="fa-solid fa-rotate-left" /> Take Another
                        </button>
                        <button id="pb-done" className={styles.ghostBtn} onClick={backToReady}>
                            <i className="fa-solid fa-check" /> Done
                        </button>
                    </div>

                    <div className={styles.meta}>
                        {elapsed !== null && <span><i className="fa-solid fa-bolt" /> {elapsed.toFixed(1)}s</span>}
                        <span><i className="fa-solid fa-wand-magic-sparkles" /> {engineLabel}</span>
                        <span><i className="fa-regular fa-clock" /> Auto-return {Math.max(resetIn, 0)}s</span>
                    </div>
                </div>
            </section>

            {/* Flash */}
            <AnimatePresence>
                {flash && (
                    <motion.div
                        className={styles.flash}
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                    />
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div className={styles.toast} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Operator settings */}
            <AnimatePresence>
                {settingsOpen && (
                    <motion.aside
                        className={styles.settings}
                        initial={{ x: 380 }}
                        animate={{ x: 0 }}
                        exit={{ x: 380 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                    >
                        <div className={styles.settingsHead}>
                            <span>Operator Settings</span>
                            <button className={styles.iconBtn} onClick={() => setSettingsOpen(false)} aria-label="Close settings">
                                <i className="fa-solid fa-xmark" />
                            </button>
                        </div>

                        <label className={styles.fieldLabel} htmlFor="pb-camera">Camera</label>
                        <select
                            id="pb-camera"
                            className={styles.select}
                            value={deviceId || ''}
                            onChange={e => chooseCamera(e.target.value)}
                        >
                            <option value="">Default (front camera)</option>
                            {devices.map((d, i) => (
                                <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</option>
                            ))}
                        </select>

                        <button id="pb-mirror" className={styles.toggleRow} onClick={toggleMirror}>
                            <span>Mirror preview &amp; photo</span>
                            <span className={styles.switch} data-on={mirror} />
                        </button>
                        <button id="pb-fullscreen" className={styles.toggleRow} onClick={toggleFullscreen}>
                            <span>Toggle fullscreen</span>
                            <i className="fa-solid fa-expand" />
                        </button>

                        <div className={styles.statusList}>
                            <div><span>Output</span><b>{OW}×{OH} · 4×6&quot; 300dpi</b></div>
                            <div><span>Cut-out engine</span><b>{style.bg_removal === 'off' ? 'Disabled' : cloudAi ? 'remove.bg → on-device' : 'On-device (MediaPipe)'}</b></div>
                            <div><span>Shots this session</span><b>{shots}</b></div>
                        </div>

                        <p className={styles.hint}>
                            Shortcuts: <kbd>Space</kbd> start · <kbd>P</kbd> print · <kbd>Esc</kbd> back.<br />
                            For silent one-click printing launch Chrome with <code>--kiosk --kiosk-printing</code>.
                        </p>

                        <Link className={styles.ghostBtn} href="/apps/photobooth">
                            <i className="fa-solid fa-arrow-left" /> Back to Studio
                        </Link>
                    </motion.aside>
                )}
            </AnimatePresence>
        </div>
    );
}
