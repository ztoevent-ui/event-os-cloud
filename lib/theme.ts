/**
 * Theme resolution — the ONLY place that decides which visual theme a project uses.
 *
 * Colour values live in app/globals.css (`--c-*` tokens per [data-theme]).
 * Components must never branch on project type for colours; they use tokens
 * (`bg-canvas`, `text-ink`, `text-accent`, `var(--c-ink)` …) and inherit the theme
 * from the nearest `data-theme` attribute.
 */

export type ThemeName = 'dark' | 'wedding';

const TYPE_THEME: Record<string, ThemeName> = {
    wedding: 'wedding',
    wedding_fair: 'wedding',
};

export function resolveTheme(projectType?: string | null): ThemeName {
    return (projectType && TYPE_THEME[projectType]) || 'dark';
}

export function isWeddingType(projectType?: string | null): boolean {
    return resolveTheme(projectType) === 'wedding';
}

/**
 * For the rare JS-side colour needs (canvas, charts, 3D) — read the live token
 * value from the themed element so canvases follow the theme too.
 */
export function readToken(name: string, el?: Element | null): string {
    if (typeof window === 'undefined') return '';
    const target = el || document.querySelector('[data-theme]') || document.documentElement;
    return getComputedStyle(target).getPropertyValue(name).trim();
}
