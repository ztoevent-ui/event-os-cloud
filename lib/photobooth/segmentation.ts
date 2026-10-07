/**
 * ZTO Photobooth — AI background removal
 *
 * Strategy (mode = 'auto'):
 *   1. remove.bg via our server proxy  /api/photobooth/remove-bg   (best hair/edge quality, ~1-3s)
 *   2. On-device MediaPipe Selfie Segmentation (free, ~50-150ms, no network)
 *   3. Give up → return null (compositor falls back to raw photo)
 */

import type { BgRemovalMode } from './types';

const MP_VERSION = '0.10.17';
const MP_WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
const MP_MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let segmenterPromise: Promise<any> | null = null;
let removeBgAvailable: Promise<boolean> | null = null;

export type CutoutEngine = 'remove.bg' | 'on-device' | 'none';

/** Ask the server once whether a remove.bg key is configured. */
export function checkRemoveBg(): Promise<boolean> {
    if (!removeBgAvailable) {
        removeBgAvailable = fetch('/api/photobooth/remove-bg', { cache: 'no-store' })
            .then(r => (r.ok ? r.json() : { configured: false }))
            .then(j => !!j.configured)
            .catch(() => false);
    }
    return removeBgAvailable;
}

/** Pre-load the on-device model (call on page load so the first shot is instant). */
export function warmupLocalSegmenter() {
    if (segmenterPromise) return segmenterPromise;
    segmenterPromise = (async () => {
        const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision');
        const fileset = await FilesetResolver.forVisionTasks(MP_WASM);
        const make = (delegate: 'GPU' | 'CPU') =>
            ImageSegmenter.createFromOptions(fileset, {
                baseOptions: { modelAssetPath: MP_MODEL, delegate },
                runningMode: 'IMAGE',
                outputCategoryMask: false,
                outputConfidenceMasks: true,
            });
        try { return await make('GPU'); } catch { return await make('CPU'); }
    })().catch(err => {
        console.warn('[photobooth] on-device segmenter unavailable', err);
        segmenterPromise = null;
        throw err;
    });
    return segmenterPromise;
}

async function removeViaApi(photo: HTMLCanvasElement, eventId: string): Promise<HTMLCanvasElement> {
    // Downscale for upload speed (and Vercel's 4.5MB body limit) — output is re-scaled anyway
    const MAX = 1600;
    const s = Math.min(1, MAX / Math.max(photo.width, photo.height));
    const tmp = document.createElement('canvas');
    tmp.width = Math.round(photo.width * s);
    tmp.height = Math.round(photo.height * s);
    tmp.getContext('2d')!.drawImage(photo, 0, 0, tmp.width, tmp.height);
    const blob: Blob = await new Promise((res, rej) => tmp.toBlob(b => (b ? res(b) : rej(new Error('encode'))), 'image/jpeg', 0.9));

    const fd = new FormData();
    fd.append('image', blob, 'capture.jpg');
    fd.append('event_id', eventId);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    try {
        const r = await fetch('/api/photobooth/remove-bg', { method: 'POST', body: fd, signal: ctrl.signal });
        if (!r.ok) throw new Error(`remove.bg proxy ${r.status}`);
        const bmp = await createImageBitmap(await r.blob());
        const out = document.createElement('canvas');
        out.width = photo.width;
        out.height = photo.height;
        out.getContext('2d')!.drawImage(bmp, 0, 0, out.width, out.height);
        bmp.close?.();
        return out;
    } finally {
        clearTimeout(timer);
    }
}

async function removeOnDevice(photo: HTMLCanvasElement): Promise<HTMLCanvasElement> {
    const segmenter = await warmupLocalSegmenter();
    const result = segmenter.segment(photo);
    try {
        // selfie_multiclass: category 0 = background → person = 1 - bg
        const bgMask = result.confidenceMasks?.[0];
        if (!bgMask) throw new Error('no mask');
        const mw: number = bgMask.width, mh: number = bgMask.height;
        const data: Float32Array = bgMask.getAsFloat32Array();

        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = mw;
        maskCanvas.height = mh;
        const mctx = maskCanvas.getContext('2d')!;
        const img = mctx.createImageData(mw, mh);
        for (let i = 0; i < data.length; i++) {
            // smoothstep between 0.25..0.75 → crisp but feathered edge
            const p = 1 - data[i];
            const t = Math.min(1, Math.max(0, (p - 0.25) / 0.5));
            const a = t * t * (3 - 2 * t);
            const o = i * 4;
            img.data[o] = img.data[o + 1] = img.data[o + 2] = 255;
            img.data[o + 3] = Math.round(a * 255);
        }
        mctx.putImageData(img, 0, 0);

        const out = document.createElement('canvas');
        out.width = photo.width;
        out.height = photo.height;
        const ctx = out.getContext('2d')!;
        ctx.drawImage(photo, 0, 0);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.filter = `blur(${Math.max(1, Math.round(photo.width / 900))}px)`;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(maskCanvas, 0, 0, out.width, out.height);
        ctx.filter = 'none';
        ctx.globalCompositeOperation = 'source-over';
        return out;
    } finally {
        result.close?.();
    }
}

export async function removeBackground(
    photo: HTMLCanvasElement,
    mode: BgRemovalMode,
    eventId: string,
): Promise<{ cutout: HTMLCanvasElement | null; engine: CutoutEngine }> {
    if (mode === 'off') return { cutout: null, engine: 'none' };

    if (mode === 'removebg' || (mode === 'auto' && (await checkRemoveBg()))) {
        try {
            return { cutout: await removeViaApi(photo, eventId), engine: 'remove.bg' };
        } catch (e) {
            console.warn('[photobooth] remove.bg failed → falling back to on-device', e);
        }
    }
    try {
        return { cutout: await removeOnDevice(photo), engine: 'on-device' };
    } catch (e) {
        console.warn('[photobooth] on-device segmentation failed', e);
        return { cutout: null, engine: 'none' };
    }
}
