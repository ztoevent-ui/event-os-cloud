'use client';

/**
 * ImageUploadField
 * ────────────────────────────────────────────────────────────────────────────
 * Reusable component: URL text input + direct Supabase storage upload button
 * + optional image preview.
 *
 * Props:
 *   value       — current URL string
 *   onChange    — called with new URL after upload or manual text input
 *   bucket      — Supabase storage bucket name (default: 'event-assets')
 *   folder      — path prefix inside bucket (default: 'uploads')
 *   label       — optional label above field
 *   placeholder — input placeholder
 *   accept      — MIME types for file picker
 *   preview     — 'none' | 'thumbnail' | 'banner'
 *   dark        — if true, uses dark-mode styling
 */

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type PreviewMode = 'none' | 'thumbnail' | 'banner';

interface ImageUploadFieldProps {
    value: string;
    onChange: (url: string) => void;
    bucket?: string;
    folder?: string;
    label?: string;
    placeholder?: string;
    accept?: string;
    preview?: PreviewMode;
    dark?: boolean;
    className?: string;
}

export function ImageUploadField({
    value,
    onChange,
    bucket = 'event-assets',
    folder = 'uploads',
    label,
    placeholder = 'https://…  or upload →',
    accept = 'image/png,image/jpeg,image/jpg,image/webp',
    preview = 'thumbnail',
    dark = true,
    className = '',
}: ImageUploadFieldProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleFile = async (file: File) => {
        setUploading(true);
        setError('');
        try {
            const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
            const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

            const { error: storageError } = await supabase.storage
                .from(bucket)
                .upload(path, file, { cacheControl: '3600', upsert: false });

            if (storageError) throw storageError;

            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
            onChange(publicUrl);
        } catch (e: any) {
            console.error('[ImageUploadField] Error:', e);
            const msg = e.message || e.error_description || 'Upload failed';
            const code = e.code ? ` (${e.code})` : '';
            setError(`${msg}${code}`);
        } finally {
            setUploading(false);
        }
    };

    // Styling based on dark/light mode
    const inputCls = dark
        ? 'flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 placeholder:text-zinc-700 transition-colors'
        : 'flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-blue-400 placeholder:text-gray-400 transition-colors';

    const btnCls = dark
        ? 'shrink-0 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl cursor-pointer transition-colors whitespace-nowrap flex items-center gap-2'
        : 'shrink-0 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-[10px] uppercase tracking-widest rounded-xl cursor-pointer transition-colors whitespace-nowrap flex items-center gap-2';

    const labelCls = dark
        ? 'block text-[10px] font-black tracking-widest uppercase text-zinc-400 mb-2'
        : 'block text-[10px] font-black tracking-widest uppercase text-gray-500 mb-2';

    return (
        <div className={className}>
            {label && <label className={labelCls}>{label}</label>}

            <div className="flex items-center gap-2">
                {/* Current image thumbnail (shown inline if thumbnail mode) */}
                {value && preview === 'thumbnail' && (
                    <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900">
                        <img src={value} alt="" className="w-full h-full object-cover" />
                    </div>
                )}

                {/* URL text input */}
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={inputCls}
                />

                {/* Upload button */}
                <label className={`${btnCls} ${uploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}>
                    <input
                        type="file"
                        accept={accept}
                        className="sr-only"
                        disabled={uploading}
                        onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleFile(file);
                            e.target.value = ''; // reset so same file can be re-selected
                        }}
                    />
                    {uploading
                        ? <><i className="fa-solid fa-circle-notch animate-spin" /><span className="hidden sm:inline">Uploading…</span></>
                        : <><i className="fa-solid fa-upload" /><span className="hidden sm:inline">Upload</span></>
                    }
                </label>
            </div>

            {/* Error */}
            {error && (
                <p className="text-red-400 text-[10px] font-bold mt-1.5">
                    <i className="fa-solid fa-triangle-exclamation mr-1" />{error}
                </p>
            )}

            {/* Banner preview (wide image) */}
            {value && preview === 'banner' && (
                <div className="mt-3 rounded-xl overflow-hidden border border-zinc-800 h-36 w-full">
                    <img src={value} alt="Banner preview" className="w-full h-full object-cover" />
                </div>
            )}
        </div>
    );
}
