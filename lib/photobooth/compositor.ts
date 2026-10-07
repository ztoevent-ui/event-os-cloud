/**
 * ZTO Photobooth — HTML5 Canvas multi-layer compositor
 *
 * Layer order (bottom → top):
 *   1. Theme background (bg_image_url, cover-fit)
 *   2. Subject (AI cut-out, or raw photo when bg removal is off)
 *   3. Client logo watermark (top-left / top-right)
 *   4. Event name text (bottom-centre, with shadow + optional scrim)
 *   5. Frame (solid border + optional PNG overlay)
 */

import { FrameStyle, outputSize } from './types';

export type Drawable = HTMLImageElement | HTMLCanvasElement | ImageBitmap;

export interface CompositeAssets {
    background: Drawable | null;
    logo: Drawable | null;
    overlay: Drawable | null;
}

const FONT_STACK = `'Urbanist', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif`;

const imageCache = new Map<string, Promise<HTMLImageElement | null>>();

/** Loads a CORS-enabled image (required, otherwise the canvas becomes tainted and toBlob() throws). */
export function loadImage(url: string | null | undefined): Promise<HTMLImageElement | null> {
    if (!url) return Promise.resolve(null);
    const cached = imageCache.get(url);
    if (cached) return cached;
    const p = new Promise<HTMLImageElement | null>(resolve => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.decoding = 'async';
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.warn('[photobooth] failed to load (check CORS):', url);
            imageCache.delete(url);
            resolve(null);
        };
        img.src = url;
    });
    imageCache.set(url, p);
    return p;
}

export async function loadAssets(bgUrl?: string | null, logoUrl?: string | null, overlayUrl?: string | null): Promise<CompositeAssets> {
    const [background, logo, overlay] = await Promise.all([loadImage(bgUrl), loadImage(logoUrl), loadImage(overlayUrl)]);
    // Make sure the title font is ready before the first draw
    if (typeof document !== 'undefined' && document.fonts) {
        try { await document.fonts.load(`800 64px 'Urbanist'`); } catch { /* ignore */ }
    }
    return { background, logo, overlay };
}

function dims(d: Drawable): { w: number; h: number } {
    if (d instanceof HTMLImageElement) return { w: d.naturalWidth, h: d.naturalHeight };
    return { w: d.width, h: d.height };
}

/** object-fit: cover */
function drawCover(ctx: CanvasRenderingContext2D, d: Drawable, W: number, H: number, scale = 1, anchorY: 'center' | 'bottom' = 'center') {
    const { w, h } = dims(d);
    if (!w || !h) return;
    const s = Math.max(W / w, H / h) * scale;
    const dw = w * s, dh = h * s;
    const dx = (W - dw) / 2;
    const dy = anchorY === 'bottom' ? H - dh : (H - dh) / 2;
    ctx.drawImage(d, dx, dy, dw, dh);
}

function fitFontSize(ctx: CanvasRenderingContext2D, text: string, weight: number, start: number, maxWidth: number) {
    let size = start;
    while (size > 18) {
        ctx.font = `${weight} ${size}px ${FONT_STACK}`;
        if (ctx.measureText(text).width <= maxWidth) break;
        size -= 4;
    }
    return size;
}

export interface CompositeInput {
    canvas: HTMLCanvasElement;
    subject: Drawable | null;
    assets: CompositeAssets;
    eventName: string;
    style: FrameStyle;
    /** Skip the background layer (used for the live overlay drawn above the camera feed). */
    transparentBackground?: boolean;
}

export function composite({ canvas, subject, assets, eventName, style, transparentBackground }: CompositeInput) {
    const { width: W, height: H } = outputSize(style.orientation);
    if (canvas.width !== W) canvas.width = W;
    if (canvas.height !== H) canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // ── 1. Background ────────────────────────────────────────────────────────
    if (transparentBackground) {
        /* live overlay: keep transparent */
    } else if (assets.background) {
        drawCover(ctx, assets.background, W, H);
    } else {
        const g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, '#0b1a3a');
        g.addColorStop(0.55, '#0056B3');
        g.addColorStop(1, '#6d28d9');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
    }

    // ── 2. Subject ───────────────────────────────────────────────────────────
    if (subject) {
        ctx.save();
        // soft contact shadow so the cut-out sits naturally on the scene
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 12;
        drawCover(ctx, subject, W, H, Math.max(0.5, style.subject_scale || 1), 'bottom');
        ctx.restore();
    }

    // ── 3. Logo watermark ────────────────────────────────────────────────────
    const inset = Math.max(style.border_width, 0) + Math.round(W * 0.04);
    if (assets.logo) {
        const { w, h } = dims(assets.logo);
        const maxW = W * Math.min(Math.max(style.logo_scale, 0.05), 0.6);
        const maxH = H * 0.16;
        const s = Math.min(maxW / w, maxH / h);
        const lw = w * s, lh = h * s;
        const lx = style.logo_position === 'top-left' ? inset : W - inset - lw;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = 18;
        ctx.drawImage(assets.logo, lx, inset, lw, lh);
        ctx.restore();
    }

    // ── 4. Event name (bottom centre) ────────────────────────────────────────
    const title = (eventName || '').trim();
    const subtitle = (style.subtitle || '').trim();
    if (title || subtitle) {
        if (style.bottom_scrim) {
            const sh = H * 0.28;
            const g = ctx.createLinearGradient(0, H - sh, 0, H);
            g.addColorStop(0, 'rgba(0,0,0,0)');
            g.addColorStop(1, 'rgba(0,0,0,0.6)');
            ctx.fillStyle = g;
            ctx.fillRect(0, H - sh, W, sh);
        }
        const maxTextW = W - inset * 2;
        const base = H - inset - (subtitle ? H * 0.035 : 0);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = style.text_color || '#fff';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        if (title) {
            fitFontSize(ctx, title.toUpperCase(), 800, Math.round(H * 0.055), maxTextW);
            ctx.fillText(title.toUpperCase(), W / 2, base);
        }
        if (subtitle) {
            const ss = fitFontSize(ctx, subtitle, 600, Math.round(H * 0.024), maxTextW);
            ctx.globalAlpha = 0.9;
            ctx.fillText(subtitle, W / 2, base + ss * 1.6);
            ctx.globalAlpha = 1;
        }
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
    }

    // ── 5. Frame ─────────────────────────────────────────────────────────────
    if (style.border_width > 0) {
        const b = style.border_width;
        ctx.fillStyle = style.border_color || '#fff';
        ctx.fillRect(0, 0, W, b);
        ctx.fillRect(0, H - b, W, b);
        ctx.fillRect(0, 0, b, H);
        ctx.fillRect(W - b, 0, b, H);
    }
    if (assets.overlay) {
        ctx.drawImage(assets.overlay, 0, 0, W, H);
    }
    ctx.restore();
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/jpeg', quality = 0.92): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Canvas export failed'))), type, quality);
    });
}
