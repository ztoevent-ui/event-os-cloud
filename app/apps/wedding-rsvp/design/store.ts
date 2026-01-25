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
        // Merge defaults with stored custom ones if desired, or just return stored
        // For simplicity, let's assume stored completely overrides or extends.
        // But to ensure defaults always exist if I mess up:
        // Let's checking if it's an empty array.
        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
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
