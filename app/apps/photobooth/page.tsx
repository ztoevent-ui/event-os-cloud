'use client';

/**
 * ZTO Event OS — AI Photobooth Studio (admin)
 * Route: /apps/photobooth
 *
 * Configure per-event templates (photobooth_templates), preview the exact
 * canvas composite the kiosk will produce, launch the kiosk, and review the
 * live gallery of finished photos (photobooth_records).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ImageUploadField } from '@/app/components/ImageUploadField';
import {
    BgRemovalMode, DEFAULT_FRAME_STYLE, FrameStyle, PHOTOBOOTH_BUCKET,
    PhotoboothRecord, outputSize, resolveFrameStyle,
} from '@/lib/photobooth/types';
import { composite, loadAssets } from '@/lib/photobooth/compositor';
import styles from './studio.module.css';

type Gate = 'checking' | 'no-session' | 'ready';
type Project = { id: string; name: string; start_date: string | null };

/** Draws a neutral silhouette so operators can judge subject placement in the preview. */
function makeSilhouette(w: number, h: number): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d')!;
    const g = ctx.createLinearGradient(0, h * 0.3, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0.25)');
    ctx.fillStyle = g;
    const cx = w / 2;
    ctx.beginPath();
    ctx.ellipse(cx, h * 0.42, w * 0.13, h * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.36, h);
    ctx.bezierCurveTo(cx - w * 0.36, h * 0.66, cx - w * 0.2, h * 0.58, cx, h * 0.58);
    ctx.bezierCurveTo(cx + w * 0.2, h * 0.58, cx + w * 0.36, h * 0.66, cx + w * 0.36, h);
    ctx.closePath();
    ctx.fill();
    return c;
}

export default function PhotoboothStudioPage() {
    const router = useRouter();
    const [gate, setGate] = useState<Gate>('checking');
    const [projects, setProjects] = useState<Project[]>([]);
    const [eventId, setEventId] = useState('');

    const [eventName, setEventName] = useState('');
    const [bgUrl, setBgUrl] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [fs, setFs] = useState<FrameStyle>(DEFAULT_FRAME_STYLE);
    const [hasTemplate, setHasTemplate] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedAt, setSavedAt] = useState<Date | null>(null);
    const [msg, setMsg] = useState('');

    const [records, setRecords] = useState<PhotoboothRecord[]>([]);
    const [total, setTotal] = useState(0);
    const [cloudAi, setCloudAi] = useState<boolean | null>(null);

    const previewRef = useRef<HTMLCanvasElement>(null);
    const set = <K extends keyof FrameStyle>(k: K, v: FrameStyle[K]) => setFs(p => ({ ...p, [k]: v }));

    // ── Auth gate ───────────────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setGate('no-session'); router.replace('/auth?returnTo=/apps/photobooth'); return; }
            const { data } = await supabase.from('projects').select('id, name, start_date').order('created_at', { ascending: false });
            const list = (data || []) as Project[];
            setProjects(list);
            const last = localStorage.getItem('zto-pb:studio-event');
            setEventId(list.find(p => p.id === last)?.id || list[0]?.id || '');
            setGate('ready');
            fetch('/api/photobooth/remove-bg').then(r => r.json()).then(j => setCloudAi(!!j.configured)).catch(() => setCloudAi(false));
        })();
    }, [router]);

    // ── Load template + records for selected event ──────────────────────────
    const loadRecords = useCallback(async (id: string) => {
        const { data, count } = await supabase
            .from('photobooth_records')
            .select('*', { count: 'exact' })
            .eq('event_id', id)
            .order('created_at', { ascending: false })
            .limit(60);
        setRecords((data || []) as PhotoboothRecord[]);
        setTotal(count || 0);
    }, []);

    useEffect(() => {
        if (!eventId) return;
        localStorage.setItem('zto-pb:studio-event', eventId);
        setMsg('');
        setSavedAt(null);
        (async () => {
            const { data, error } = await supabase.from('photobooth_templates').select('*').eq('event_id', eventId).maybeSingle();
            if (error) setMsg(`⚠️ ${error.message} — did you run the photobooth migration?`);
            const project = projects.find(p => p.id === eventId);
            setHasTemplate(!!data);
            setEventName(data?.event_name ?? project?.name ?? '');
            setBgUrl(data?.bg_image_url ?? '');
            setLogoUrl(data?.logo_url ?? '');
            setFs(resolveFrameStyle(data?.frame_style));
        })();
        loadRecords(eventId);

        const ch = supabase
            .channel(`pb-records-${eventId}`)
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'photobooth_records', filter: `event_id=eq.${eventId}` },
                payload => {
                    setRecords(r => [payload.new as PhotoboothRecord, ...r].slice(0, 60));
                    setTotal(t => t + 1);
                })
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [eventId, projects, loadRecords]);

    // ── Live preview (same compositor as the kiosk) ─────────────────────────
    const { width: OW, height: OH } = outputSize(fs.orientation);
    const silhouette = useMemo(
        () => (typeof document === 'undefined' ? null : makeSilhouette(OW, OH)),
        [OW, OH],
    );

    useEffect(() => {
        let cancelled = false;
        const t = window.setTimeout(async () => {
            const assets = await loadAssets(bgUrl, logoUrl, fs.overlay_url);
            if (cancelled || !previewRef.current) return;
            composite({ canvas: previewRef.current, subject: silhouette, assets, eventName, style: fs });
        }, 120);
        return () => { cancelled = true; clearTimeout(t); };
    }, [bgUrl, logoUrl, eventName, fs, silhouette]);

    // ── Save ────────────────────────────────────────────────────────────────
    const save = async () => {
        if (!eventId) return;
        setSaving(true);
        setMsg('');
        const { error } = await supabase.from('photobooth_templates').upsert({
            event_id: eventId,
            event_name: eventName,
            bg_image_url: bgUrl || null,
            logo_url: logoUrl || null,
            frame_style: fs,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'event_id' });
        setSaving(false);
        if (error) { setMsg(`⚠️ ${error.message}`); return; }
        setHasTemplate(true);
        setSavedAt(new Date());
    };

    const deleteRecord = async (r: PhotoboothRecord) => {
        if (!confirm('Delete this photo permanently?')) return;
        if (r.storage_path) await supabase.storage.from(PHOTOBOOTH_BUCKET).remove([r.storage_path]);
        const { error } = await supabase.from('photobooth_records').delete().eq('id', r.id);
        if (!error) { setRecords(list => list.filter(x => x.id !== r.id)); setTotal(t => t - 1); }
    };

    const kioskPath = eventId ? `/kiosk/photobooth/${eventId}` : '';
    const copyLink = async () => {
        await navigator.clipboard.writeText(`${location.origin}${kioskPath}`);
        setMsg('✅ Kiosk link copied');
        window.setTimeout(() => setMsg(''), 2500);
    };

    if (gate !== 'ready') {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
                <span>Loading Photobooth Studio…</span>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headLeft}>
                    <Link href="/dashboard" className="zto-btn zto-btn-ghost" style={{ textDecoration: 'none', fontSize: 11 }}>
                        <i className="fa-solid fa-arrow-left" /> Console
                    </Link>
                    <div>
                        <div className={styles.kicker}>ZTO Event OS · Module</div>
                        <h1 className={styles.title}>AI Photobooth <span>Studio</span></h1>
                    </div>
                </div>
                <div className={styles.headRight}>
                    <select
                        id="pb-studio-event"
                        className="zto-select"
                        value={eventId}
                        onChange={e => setEventId(e.target.value)}
                        style={{ minWidth: 260 }}
                    >
                        {projects.length === 0 && <option value="">No projects found</option>}
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name}{p.start_date ? ` · ${new Date(p.start_date).toLocaleDateString('en-GB')}` : ''}
                            </option>
                        ))}
                    </select>
                    {hasTemplate && kioskPath && (
                        <>
                            <button id="pb-copy-link" className="zto-btn zto-btn-ghost" onClick={copyLink}>
                                <i className="fa-solid fa-link" /> Copy Link
                            </button>
                            <a id="pb-launch-kiosk" className={styles.launchBtn} href={kioskPath} target="_blank" rel="noreferrer">
                                <i className="fa-solid fa-camera-retro" /> Launch Booth
                            </a>
                        </>
                    )}
                </div>
            </header>

            {msg && <div className={styles.banner}>{msg}</div>}

            <main className={styles.grid}>
                {/* ── Config ── */}
                <section className={styles.panel}>
                    <div className={styles.panelHead}>
                        <span className="zto-label">Template</span>
                        <span className={styles.chip} data-tone={hasTemplate ? 'ok' : 'warn'}>
                            {hasTemplate ? 'Configured' : 'Not saved yet'}
                        </span>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="pb-event-name">Event name (bottom title)</label>
                        <input id="pb-event-name" className="zto-input" value={eventName} onChange={e => setEventName(e.target.value)} placeholder="e.g. ACME Annual Dinner 2026" />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="pb-subtitle">Subtitle (date / hashtag)</label>
                        <input id="pb-subtitle" className="zto-input" value={fs.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="#ACMENight · 12.12.2026" />
                    </div>

                    <ImageUploadField label="Theme background" value={bgUrl} onChange={setBgUrl} folder="photobooth/backgrounds" preview="banner" className={styles.field} />
                    <ImageUploadField label="Client logo (PNG with transparency)" value={logoUrl} onChange={setLogoUrl} folder="photobooth/logos" className={styles.field} />
                    <ImageUploadField label="Frame overlay PNG (optional)" value={fs.overlay_url} onChange={v => set('overlay_url', v)} folder="photobooth/frames" accept="image/png" className={styles.field} />

                    <div className={styles.split}>
                        <div className={styles.field}>
                            <span className={styles.label}>Orientation</span>
                            <div className={styles.segment}>
                                {(['portrait', 'landscape'] as const).map(o => (
                                    <button key={o} id={`pb-orient-${o}`} data-active={fs.orientation === o} onClick={() => set('orientation', o)}>
                                        <i className={`fa-solid ${o === 'portrait' ? 'fa-mobile-screen' : 'fa-image'}`} /> {o === 'portrait' ? '4×6 Portrait' : '6×4 Landscape'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className={styles.field}>
                            <span className={styles.label}>Logo position</span>
                            <div className={styles.segment}>
                                {(['top-left', 'top-right'] as const).map(p => (
                                    <button key={p} id={`pb-logo-${p}`} data-active={fs.logo_position === p} onClick={() => set('logo_position', p)}>
                                        {p === 'top-left' ? '↖ Left' : 'Right ↗'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className={styles.split}>
                        <Range id="pb-logo-scale" label="Logo size" value={fs.logo_scale} min={0.08} max={0.45} step={0.01} fmt={v => `${Math.round(v * 100)}%`} onChange={v => set('logo_scale', v)} />
                        <Range id="pb-subject-scale" label="Subject zoom" value={fs.subject_scale} min={0.7} max={1.6} step={0.05} fmt={v => `${v.toFixed(2)}×`} onChange={v => set('subject_scale', v)} />
                    </div>
                    <div className={styles.split}>
                        <Range id="pb-border" label="Frame border" value={fs.border_width} min={0} max={120} step={2} fmt={v => `${v}px`} onChange={v => set('border_width', v)} />
                        <div className={styles.colors}>
                            <ColorField id="pb-border-color" label="Border" value={fs.border_color} onChange={v => set('border_color', v)} />
                            <ColorField id="pb-text-color" label="Title" value={fs.text_color} onChange={v => set('text_color', v)} />
                        </div>
                    </div>

                    <div className={styles.split}>
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="pb-bg-removal">AI background removal</label>
                            <select id="pb-bg-removal" className="zto-select" value={fs.bg_removal} onChange={e => set('bg_removal', e.target.value as BgRemovalMode)}>
                                <option value="auto">Auto — remove.bg, fallback on-device</option>
                                <option value="removebg">remove.bg only (cloud)</option>
                                <option value="local">On-device only (free, instant)</option>
                                <option value="off">Off — use original photo</option>
                            </select>
                            <small className={styles.help}>
                                remove.bg key: {cloudAi === null ? '…' : cloudAi ? <b className={styles.ok}>configured</b> : <b className={styles.warn}>not set (REMOVE_BG_API_KEY)</b>}
                            </small>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="pb-countdown">Countdown</label>
                            <select id="pb-countdown" className="zto-select" value={fs.countdown} onChange={e => set('countdown', Number(e.target.value))}>
                                {[3, 5, 10].map(n => <option key={n} value={n}>{n} seconds</option>)}
                            </select>
                            <label className={styles.check}>
                                <input type="checkbox" checked={fs.bottom_scrim} onChange={e => set('bottom_scrim', e.target.checked)} />
                                Dark gradient behind title
                            </label>
                        </div>
                    </div>

                    <button id="pb-save" className={styles.saveBtn} onClick={save} disabled={saving || !eventId}>
                        {saving ? <><i className="fa-solid fa-circle-notch fa-spin" /> Saving…</> : <><i className="fa-solid fa-floppy-disk" /> Save Template</>}
                    </button>
                    {savedAt && <p className={styles.saved}>Saved {savedAt.toLocaleTimeString()} · running kiosks update instantly</p>}
                </section>

                {/* ── Preview ── */}
                <section className={`${styles.panel} ${styles.previewPanel}`}>
                    <div className={styles.panelHead}>
                        <span className="zto-label">Live composite preview</span>
                        <span className={styles.dim}>{OW}×{OH}px · 300dpi</span>
                    </div>
                    <div className={styles.previewStage}>
                        <canvas ref={previewRef} className={styles.previewCanvas} data-orient={fs.orientation} />
                    </div>
                    <ol className={styles.layers}>
                        <li><span>5</span>Frame {fs.overlay_url ? '+ PNG overlay' : `border ${fs.border_width}px`}</li>
                        <li><span>4</span>Event title &amp; subtitle</li>
                        <li><span>3</span>Client logo ({fs.logo_position})</li>
                        <li><span>2</span>Guest (AI cut-out)</li>
                        <li><span>1</span>Theme background</li>
                    </ol>
                </section>
            </main>

            {/* ── Gallery ── */}
            <section className={styles.gallerySection}>
                <div className={styles.panelHead}>
                    <span className="zto-label">Live gallery</span>
                    <span className={styles.chip} data-tone="ok"><span className="zto-pulse-dot lime" /> {total} photos</span>
                </div>
                {records.length === 0 ? (
                    <div className={styles.empty}>
                        <i className="fa-regular fa-images" />
                        <p>No photos yet. Launch the booth and start shooting — photos appear here in real time.</p>
                    </div>
                ) : (
                    <div className={styles.gallery}>
                        {records.map(r => (
                            <figure key={r.id} className={styles.thumb}>
                                <a href={r.final_image_url} target="_blank" rel="noreferrer">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={r.final_image_url} alt="Photobooth shot" loading="lazy" />
                                </a>
                                <figcaption>
                                    <span>{new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <button onClick={() => deleteRecord(r)} aria-label="Delete photo"><i className="fa-solid fa-trash" /></button>
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function Range({ id, label, value, min, max, step, fmt, onChange }: {
    id: string; label: string; value: number; min: number; max: number; step: number;
    fmt: (v: number) => string; onChange: (v: number) => void;
}) {
    return (
        <div className={styles.field}>
            <label className={styles.label} htmlFor={id}>
                {label} <b className={styles.rangeVal}>{fmt(value)}</b>
            </label>
            <input id={id} type="range" className={styles.range} min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
        </div>
    );
}

function ColorField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
    return (
        <label className={styles.color} htmlFor={id}>
            <input id={id} type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#ffffff'} onChange={e => onChange(e.target.value)} />
            <span>{label}</span>
        </label>
    );
}
