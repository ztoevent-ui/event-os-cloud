/**
 * ZTO Photobooth — shared types & defaults
 */

export type Orientation = 'portrait' | 'landscape';
export type LogoPosition = 'top-right' | 'top-left';
export type BgRemovalMode = 'auto' | 'removebg' | 'local' | 'off';

export interface FrameStyle {
    orientation: Orientation;
    border_width: number;
    border_color: string;
    overlay_url: string;
    logo_position: LogoPosition;
    logo_scale: number;
    text_color: string;
    subtitle: string;
    bottom_scrim: boolean;
    subject_scale: number;
    bg_removal: BgRemovalMode;
    countdown: number;
}

export interface PhotoboothTemplate {
    id?: string;
    event_id: string;
    bg_image_url: string | null;
    logo_url: string | null;
    event_name: string;
    frame_style: Partial<FrameStyle>;
    updated_at?: string;
}

export interface PhotoboothRecord {
    id: string;
    event_id: string;
    final_image_url: string;
    storage_path: string | null;
    created_at: string;
}

export const DEFAULT_FRAME_STYLE: FrameStyle = {
    orientation: 'portrait',
    border_width: 36,
    border_color: '#ffffff',
    overlay_url: '',
    logo_position: 'top-right',
    logo_scale: 0.22,
    text_color: '#ffffff',
    subtitle: '',
    bottom_scrim: true,
    subject_scale: 1,
    bg_removal: 'auto',
    countdown: 3,
};

export function resolveFrameStyle(fs?: Partial<FrameStyle> | null): FrameStyle {
    return { ...DEFAULT_FRAME_STYLE, ...(fs || {}) };
}

/** 4x6" @ 300dpi — native size for DNP / HiTi dye-sub printers */
export function outputSize(o: Orientation): { width: number; height: number } {
    return o === 'portrait' ? { width: 1200, height: 1800 } : { width: 1800, height: 1200 };
}

export const PHOTOBOOTH_BUCKET = 'photobooth-finals';
