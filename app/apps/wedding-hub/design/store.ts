'use client';

import { Template, DEFAULT_TEMPLATES } from './types';

const STORAGE_KEY = 'wedding_rsvp_templates';

export function getTemplates(): Template[] {
    if (typeof window === 'undefined') return DEFAULT_TEMPLATES;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        return DEFAULT_TEMPLATES;
    }

    try {
        const parsed = JSON.parse(stored);

        // Strategy: Always prefer code-defined DEFAULT_TEMPLATES for their IDs.
        // Only keep stored templates that are NOT in the default list (i.e. custom ones).
        if (Array.isArray(parsed)) {
            const customTemplates = parsed.filter((t: Template) =>
                !DEFAULT_TEMPLATES.some(dt => dt.id === t.id)
            );
            return [...DEFAULT_TEMPLATES, ...customTemplates];
        }
        return DEFAULT_TEMPLATES;
    } catch (e) {
        console.error('Failed to parse templates', e);
        return DEFAULT_TEMPLATES;
    }
}

export function saveTemplate(template: Template) {
    const current = getTemplates();
    const existingIndex = current.findIndex(t => t.id === template.id);

    let updated;
    if (existingIndex >= 0) {
        updated = [...current];
        updated[existingIndex] = template;
    } else {
        updated = [...current, template];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
}

export function deleteTemplate(id: string) {
    const current = getTemplates();
    const updated = current.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
}
