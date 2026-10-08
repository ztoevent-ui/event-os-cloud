#!/usr/bin/env node
/**
 * Theme token codemod.
 * Converts dark-theme literal colours into semantic tokens whose DARK values are
 * identical to the literals, so the default theme renders pixel-identical while
 * any [data-theme] scope can re-skin the UI.
 *
 * Usage: node scripts/theme-codemod.mjs [--dry] <files...>
 *   --class-only   only rewrite Tailwind classes (for canvas/3D-heavy files)
 */
import fs from 'node:fs';

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const CLASS_ONLY = args.includes('--class-only');
const files = args.filter(a => !a.startsWith('--'));

// ── Tailwind arbitrary hex → semantic token ─────────────────────────────────
const HEX_TOKEN = {
    '0056b3': 'accent',
    '4da3ff': 'accent-bright',
    '6bb8ff': 'accent-bright',
    'deff9a': 'accent-2',
    '050505': 'canvas',
    '0a0a0a': 'surface-solid',
};
const HEX_VAR = Object.fromEntries(Object.entries(HEX_TOKEN).map(([k, v]) => [k, `var(--c-${v})`]));
const RGB_VAR = {
    '255,255,255': '--c-ink-rgb',
    '0,86,179': '--c-accent-rgb',
    '222,255,154': '--c-accent-2-rgb',
    '77,163,255': '--c-accent-bright-rgb',
    '5,5,5': '--c-canvas-rgb',
};

// Solid colour backgrounds on which white text must stay white.
const SOLID_BG = /(?:^|\s|:)bg-(?:accent(?:-hover|-bright)?(?![\w/-])|(?:blue|pink|red|rose|emerald|green|indigo|purple|violet|amber|orange|yellow|sky|cyan|teal|lime|fuchsia)-[4-9]00(?!\/)|\[#(?!050505|0a0a0a)[0-9a-fA-F]{3,6}\](?!\/)|gradient-)/;

function rewriteClasses(src) {
    // 1. arbitrary hex classes  e.g. hover:bg-[#0056B3]/20 → hover:bg-accent/20
    src = src.replace(/\b((?:[a-z-]+:)*(?:bg|text|border|from|via|to|ring|shadow|divide|outline|fill|stroke|decoration|caret|accent|placeholder)(?:-[trblxy])?)-\[#([0-9a-fA-F]{6})\]/g,
        (m, pre, hex) => HEX_TOKEN[hex.toLowerCase()] ? `${pre}-${HEX_TOKEN[hex.toLowerCase()]}` : m);
    // 2. font
    src = src.replace(/font-\['Urbanist'\]/g, 'font-display');
    // 3. translucent white overlays → ink overlays
    src = src.replace(/\b((?:[a-z-]+:)*(?:bg|text|border|divide|ring|from|via|to|placeholder|outline|shadow)(?:-[trblxy])?)-white\//g, '$1-ink/');
    // 4. solid black surfaces → canvas
    src = src.replace(/(^|[\s"'`])((?:[a-z-]+:)*)bg-black(?![\w/-])/g, '$1$2bg-canvas');
    // 5. text-white → text-ink, unless its own quoted segment sits on a solid colour bg.
    //    Segment = text between the nearest quote chars, so ternary branches inside
    //    template literals are judged independently.
    src = src.replace(/(^|[\s:'"`])text-white(?![\w/-])/g, (m, lead, offset, whole) => {
        const at = offset + lead.length;
        const seg = quotedSegment(whole, at);
        return SOLID_BG.test(seg) ? m : `${lead}text-ink`;
    });
    return src;
}

function quotedSegment(src, idx) {
    let s = idx, e = idx;
    while (s > 0 && !`'"\`\n{}`.includes(src[s - 1])) s--;
    while (e < src.length && !`'"\`\n{}`.includes(src[e])) e++;
    return ' ' + src.slice(s, e) + ' ';
}

function insideArbitrary(src, idx) {
    for (let i = idx - 1; i >= 0; i--) {
        const c = src[i];
        if (c === '[') return true;
        if (/[\s'"`\]{}]/.test(c)) return false;
    }
    return false;
}

function rewriteInline(src) {
    // rgba(R,G,B,A) → rgb(var(--c-x-rgb) / A)
    src = src.replace(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/g, (m, r, g, b, a, offset, whole) => {
        const v = RGB_VAR[`${r},${g},${b}`];
        if (!v) return m;
        return insideArbitrary(whole, offset) ? `rgb(var(${v})/${a})` : `rgb(var(${v}) / ${a})`;
    });
    // bare hex in strings/CSS (not inside Tailwind brackets, which step 1 already did)
    src = src.replace(/(?<![\[\w])#([0-9a-fA-F]{6})\b(?!\])/g, (m, hex) => HEX_VAR[hex.toLowerCase()] || m);

    // color: '#fff' → ink, or on-accent when the same style object has a solid bg
    src = rewriteWhiteText(src);
    return src;
}

const WHITE = String.raw`(?:#fff|#ffffff|white)`;
function rewriteWhiteText(src) {
    // walk every object literal "{ ... }" that contains a color: white declaration
    const re = new RegExp(String.raw`(\bcolor\s*:\s*)(['"\`])${WHITE}\2`, 'gi');
    let out = '';
    let last = 0;
    let m;
    while ((m = re.exec(src))) {
        const obj = enclosingObject(src, m.index);
        const solidBg = /\bbackground(?:Color)?\s*:\s*(?!['"`](?:transparent|none|rgb\(var\(--c-ink-rgb\)|var\(--c-(?:canvas|surface)))[^,}\n]*(?:var\(--c-accent|#[0-9a-fA-F]{3,6}|gradient|rgb\(var\(--c-accent|\$\{)/i.test(obj);
        out += src.slice(last, m.index) + m[1] + m[2] + (solidBg ? 'var(--c-on-accent)' : 'var(--c-ink)') + m[2];
        last = m.index + m[0].length;
    }
    return out + src.slice(last);
}

function enclosingObject(src, idx) {
    let depth = 0, start = idx;
    for (let i = idx; i >= 0; i--) {
        const c = src[i];
        if (c === '}') depth++;
        else if (c === '{') { if (depth === 0) { start = i; break; } depth--; }
    }
    depth = 0;
    let end = idx;
    for (let i = idx; i < src.length; i++) {
        const c = src[i];
        if (c === '{') depth++;
        else if (c === '}') { if (depth === 0) { end = i; break; } depth--; }
    }
    return src.slice(start, end + 1);
}

let changed = 0;
for (const f of files) {
    const before = fs.readFileSync(f, 'utf8');
    let after = rewriteClasses(before);
    if (!CLASS_ONLY) after = rewriteInline(after);
    if (after !== before) {
        changed++;
        if (!DRY) fs.writeFileSync(f, after);
        console.log(`${DRY ? '[dry] ' : ''}updated ${f}`);
    }
}
console.log(`${changed}/${files.length} files changed`);
