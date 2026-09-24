'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface MeetingSession {
    id: string;
    project_id: string;
    title: string;
    meeting_date: string;
    content: string;
    assets: string[];
    created_at: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ─────────────────────────────────────────────────────────────────────────────
// Individual session card
// ─────────────────────────────────────────────────────────────────────────────
function SessionCard({
    session,
    onDelete,
    onUpdated,
}: {
    session: MeetingSession;
    onDelete: (id: string) => void;
    onUpdated: (updated: MeetingSession) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [content, setContent] = useState(session.content);
    const [assets, setAssets] = useState<string[]>(session.assets ?? []);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [isDragging, setIsDragging] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync local state when session prop changes (e.g. after parent refresh)
    useEffect(() => {
        setContent(session.content);
        setAssets(session.assets ?? []);
    }, [session.id]);

    // ── Autosave content ──────────────────────────────────────────────────
    const scheduleSave = useCallback(
        (newContent: string, newAssets: string[]) => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
            setSaveStatus('saving');
            saveTimer.current = setTimeout(async () => {
                const { error } = await supabase
                    .from('meeting_sessions')
                    .update({ content: newContent, assets: newAssets })
                    .eq('id', session.id);
                if (!error) {
                    setSaveStatus('saved');
                    onUpdated({ ...session, content: newContent, assets: newAssets });
                    setTimeout(() => setSaveStatus('idle'), 3000);
                } else {
                    setSaveStatus('error');
                }
            }, 4000);
        },
        [session.id]
    );

    useEffect(() => {
        return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    }, []);

    const handleContentChange = (val: string) => {
        setContent(val);
        scheduleSave(val, assets);
    };

    // ── Image upload (drag-and-drop + click/camera) ───────────────────────
    const uploadFiles = async (files: File[]) => {
        const images = files.filter(f => f.type.startsWith('image/'));
        if (!images.length) return;
        setUploading(true);
        const newAssets = [...assets];
        for (const file of images) {
            const fileName = `${Date.now()}_${file.name}`;
            const filePath = `project-notes/${session.project_id}/${fileName}`;
            const { error: uploadError } = await supabase.storage
                .from('event-assets')
                .upload(filePath, file);
            if (!uploadError) {
                const { data: urlData } = supabase.storage
                    .from('event-assets')
                    .getPublicUrl(filePath);
                newAssets.push(urlData.publicUrl);
            }
        }
        setUploading(false);
        setAssets(newAssets);
        scheduleSave(content, newAssets);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        await uploadFiles(Array.from(e.dataTransfer.files));
    };

    const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            await uploadFiles(Array.from(e.target.files));
            e.target.value = '';
        }
    };

    const removeAsset = async (url: string) => {
        const newAssets = assets.filter(a => a !== url);
        setAssets(newAssets);
        await supabase
            .from('meeting_sessions')
            .update({ assets: newAssets })
            .eq('id', session.id);
        onUpdated({ ...session, content, assets: newAssets });
    };

    const handleDelete = async () => {
        if (!confirmDelete) { setConfirmDelete(true); return; }
        await supabase.from('meeting_sessions').delete().eq('id', session.id);
        onDelete(session.id);
    };

    // ── Date formatting ───────────────────────────────────────────────────
    const formattedDate = new Date(session.meeting_date + 'T00:00:00')
        .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const hasContent = content.trim().length > 0 || assets.length > 0;

    return (
        <div
            style={{
                borderRadius: 16,
                border: expanded
                    ? '1px solid rgba(0,86,179,0.35)'
                    : '1px solid rgba(255,255,255,0.07)',
                background: expanded
                    ? 'rgba(0,86,179,0.04)'
                    : 'rgba(255,255,255,0.02)',
                overflow: 'hidden',
                transition: 'border-color 0.25s ease, background 0.25s ease',
            }}
        >
            {/* ── Card Header (always visible) ── */}
            <div
                onClick={() => setExpanded(e => !e)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                }}
            >
                {/* Expand icon */}
                <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: expanded ? 'rgba(0,86,179,0.15)' : 'rgba(255,255,255,0.04)',
                    border: expanded ? '1px solid rgba(0,86,179,0.3)' : '1px solid rgba(255,255,255,0.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: expanded ? '#4da3ff' : 'rgba(255,255,255,0.3)',
                    transition: 'all 0.25s ease',
                    transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                }}>
                    <i className="fa-solid fa-chevron-right" />
                </div>

                {/* Date badge */}
                <span style={{
                    fontSize: 10, fontWeight: 700, color: '#4da3ff',
                    background: 'rgba(0,86,179,0.1)', border: '1px solid rgba(0,86,179,0.2)',
                    borderRadius: 6, padding: '2px 8px',
                    letterSpacing: '0.05em', flexShrink: 0,
                }}>
                    {formattedDate}
                </span>

                {/* Title */}
                <span style={{
                    fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)',
                    flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {session.title}
                </span>

                {/* Right-side indicators */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    {/* Content dot */}
                    {hasContent && (
                        <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: '#DEFF9A', boxShadow: '0 0 6px #DEFF9A', flexShrink: 0,
                        }} />
                    )}
                    {/* Asset count */}
                    {assets.length > 0 && (
                        <span style={{
                            fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: 5, padding: '1px 6px',
                        }}>
                            <i className="fa-solid fa-paperclip" style={{ marginRight: 3 }} />
                            {assets.length}
                        </span>
                    )}
                    {/* Autosave dot */}
                    {saveStatus === 'saving' && (
                        <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: '#0056B3', boxShadow: '0 0 8px #0056B3',
                            animation: 'ztoPulse 1s ease-in-out infinite', flexShrink: 0,
                        }} />
                    )}
                    {saveStatus === 'saved' && (
                        <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: '#DEFF9A', boxShadow: '0 0 8px #DEFF9A',
                            animation: 'ztoPulse 2s ease-in-out infinite', flexShrink: 0,
                        }} />
                    )}
                </div>
            </div>

            {/* ── Expanded Content ── */}
            {expanded && (
                <div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={handleDrop}
                    style={{
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        position: 'relative',
                        background: isDragging ? 'rgba(0,86,179,0.06)' : 'transparent',
                        transition: 'background 0.3s ease',
                    }}
                >
                    {/* Drag overlay */}
                    {isDragging && (
                        <div style={{
                            position: 'absolute', inset: 0, zIndex: 10,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(5,5,5,0.75)', backdropFilter: 'blur(6px)',
                            borderRadius: '0 0 16px 16px',
                        }}>
                            <div style={{
                                width: 52, height: 52, borderRadius: '50%',
                                background: '#0056B3',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 22, color: '#fff', marginBottom: 10,
                                boxShadow: '0 0 30px rgba(0,86,179,0.5)',
                            }}>
                                <i className="fa-solid fa-cloud-arrow-up" />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#4da3ff', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                Drop Images Here
                            </span>
                        </div>
                    )}

                    {/* Textarea */}
                    <textarea
                        value={content}
                        onChange={e => handleContentChange(e.target.value)}
                        placeholder="Type meeting minutes, action items, decisions..."
                        style={{
                            width: '100%', minHeight: 160,
                            background: 'transparent', border: 'none', outline: 'none',
                            resize: 'vertical', padding: '16px 16px',
                            color: 'rgba(255,255,255,0.75)',
                            fontFamily: 'Urbanist, sans-serif', fontSize: 14, lineHeight: 1.7,
                            boxSizing: 'border-box',
                        }}
                    />

                    {/* Toolbar: attach + delete */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 16px 14px',
                        borderTop: '1px solid rgba(255,255,255,0.04)',
                    }}>
                        {/* Upload button (works on mobile + desktop) */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            multiple
                            style={{ display: 'none' }}
                            onChange={handleFileInput}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 8, padding: '6px 12px',
                                color: 'rgba(255,255,255,0.5)', fontSize: 11,
                                fontWeight: 600, cursor: 'pointer', fontFamily: 'Urbanist, sans-serif',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLButtonElement).style.color = '#4da3ff';
                                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,86,179,0.3)';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)';
                                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)';
                            }}
                        >
                            <i className={uploading ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-camera'} />
                            {uploading ? 'Uploading...' : 'Add Photo'}
                        </button>

                        {/* Autosave label */}
                        {saveStatus === 'saving' && (
                            <span style={{ fontSize: 9, fontWeight: 700, color: '#4da3ff', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                                Syncing...
                            </span>
                        )}
                        {saveStatus === 'saved' && (
                            <span style={{ fontSize: 9, fontWeight: 700, color: '#DEFF9A', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                                Saved ✓
                            </span>
                        )}
                        {saveStatus === 'error' && (
                            <span style={{ fontSize: 9, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                                Save failed
                            </span>
                        )}

                        {/* Spacer */}
                        <div style={{ flex: 1 }} />

                        {/* Delete button */}
                        <button
                            onClick={handleDelete}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                background: confirmDelete ? 'rgba(239,68,68,0.12)' : 'transparent',
                                border: confirmDelete ? '1px solid rgba(239,68,68,0.3)' : '1px solid transparent',
                                borderRadius: 8, padding: '6px 10px',
                                color: confirmDelete ? '#ef4444' : 'rgba(255,255,255,0.2)',
                                fontSize: 11, fontWeight: 600,
                                cursor: 'pointer', fontFamily: 'Urbanist, sans-serif',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => {
                                if (!confirmDelete) (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
                            }}
                            onMouseLeave={e => {
                                if (!confirmDelete) {
                                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.2)';
                                    setConfirmDelete(false);
                                }
                            }}
                        >
                            <i className="fa-solid fa-trash-can" />
                            {confirmDelete ? 'Confirm Delete' : ''}
                        </button>
                    </div>

                    {/* Assets gallery */}
                    {assets.length > 0 && (
                        <div style={{ padding: '0 16px 16px' }}>
                            <div style={{
                                borderTop: '1px solid rgba(0,86,179,0.12)', paddingTop: 12,
                            }}>
                                <div style={{
                                    fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)',
                                    textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10,
                                }}>
                                    Attached Media ({assets.length})
                                </div>
                                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                                    {assets.map((url, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                position: 'relative', flexShrink: 0,
                                                width: 100, height: 70, borderRadius: 10, overflow: 'hidden',
                                                border: '1px solid rgba(0,86,179,0.2)',
                                                background: '#0a0a0a', cursor: 'pointer'
                                            }}
                                            onClick={() => setPreviewImage(url)}
                                            onMouseEnter={e => {
                                                const btn = e.currentTarget.querySelector('button') as HTMLButtonElement;
                                                if (btn) btn.style.opacity = '1';
                                            }}
                                            onMouseLeave={e => {
                                                const btn = e.currentTarget.querySelector('button') as HTMLButtonElement;
                                                if (btn) btn.style.opacity = '0';
                                            }}
                                        >
                                            <img
                                                src={url} alt={`Asset ${i + 1}`}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                                            />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeAsset(url); }}
                                                style={{
                                                    position: 'absolute', top: 4, right: 4,
                                                    width: 20, height: 20, borderRadius: '50%',
                                                    background: 'rgba(239,68,68,0.85)',
                                                    border: 'none', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 8, color: '#fff',
                                                    opacity: 0, transition: 'opacity 0.2s ease',
                                                }}
                                            >
                                                <i className="fa-solid fa-xmark" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
                        padding: 24,
                    }}
                >
                    <img
                        src={previewImage}
                        alt="Preview"
                        style={{
                            maxWidth: '100%', maxHeight: '100%',
                            objectFit: 'contain', borderRadius: 8,
                        }}
                        onClick={e => e.stopPropagation()}
                    />
                    <button
                        onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
                        style={{
                            position: 'absolute', top: 24, right: 24,
                            width: 40, height: 40, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)', border: 'none',
                            color: '#fff', fontSize: 20, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// New Session Modal
// ─────────────────────────────────────────────────────────────────────────────
function NewSessionModal({
    projectId,
    onCreated,
    onClose,
}: {
    projectId: string;
    onCreated: (session: MeetingSession) => void;
    onClose: () => void;
}) {
    const today = new Date().toISOString().split('T')[0];
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(today);
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        if (!title.trim()) return;
        setCreating(true);
        const { data, error } = await supabase
            .from('meeting_sessions')
            .insert({
                project_id: projectId,
                title: title.trim(),
                meeting_date: date,
                content: '',
                assets: [],
            })
            .select()
            .single();
        setCreating(false);
        if (!error && data) {
            onCreated(data as MeetingSession);
            onClose();
        }
    };

    return (
        <div
            className="meeting-new-sheet-container"
            style={{
                position: 'fixed', inset: 0, zIndex: 2000,
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                padding: 0,
            }}
        >
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{ position: 'absolute', inset: 0, background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(8px)' }}
            />
            {/* Sheet — slides up from bottom on mobile, centered on desktop */}
            <div
                className="meeting-new-sheet"
                style={{
                    position: 'relative', zIndex: 10,
                    width: '100%', maxWidth: 480,
                    background: '#0f0f0f',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '24px 24px 0 0',
                    padding: '28px 24px 40px',
                    boxShadow: '0 -20px 80px rgba(0,0,0,0.5)',
                    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
            >
                {/* Drag handle */}
                <div style={{
                    width: 40, height: 4, borderRadius: 2,
                    background: 'rgba(255,255,255,0.1)', margin: '0 auto 24px',
                }} />

                <h3 style={{
                    fontSize: 17, fontWeight: 700, color: '#fff',
                    marginBottom: 6, fontFamily: 'Urbanist, sans-serif',
                }}>
                    New Meeting
                </h3>
                <p style={{
                    fontSize: 12, color: 'rgba(255,255,255,0.35)',
                    marginBottom: 24, fontFamily: 'Urbanist, sans-serif',
                }}>
                    Add a new session to this project's meeting log.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <label style={{
                            display: 'block', fontSize: 10, fontWeight: 700,
                            color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
                            letterSpacing: '0.1em', marginBottom: 6,
                        }}>
                            Meeting Title *
                        </label>
                        <input
                            className="zto-input"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Vendor Coordination"
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label style={{
                            display: 'block', fontSize: 10, fontWeight: 700,
                            color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
                            letterSpacing: '0.1em', marginBottom: 6,
                        }}>
                            Date
                        </label>
                        <input
                            type="date"
                            className="zto-input"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                    <button
                        onClick={onClose}
                        className="zto-btn zto-btn-ghost"
                        style={{ flex: 1, padding: '12px 0', fontSize: 13 }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!title.trim() || creating}
                        className="zto-btn zto-btn-primary"
                        style={{ flex: 2, padding: '12px 0', fontSize: 13 }}
                    >
                        {creating
                            ? <><i className="fa-solid fa-circle-notch fa-spin" /> Creating...</>
                            : <><i className="fa-solid fa-plus" /> Create Meeting</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Panel
// ─────────────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MeetingNotesPanel({ project }: { project: any }) {
    const [sessions, setSessions] = useState<MeetingSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [legacyMigrated, setLegacyMigrated] = useState(false);

    // ── Fetch sessions ────────────────────────────────────────────────────
    useEffect(() => {
        if (!project?.id) return;
        fetchSessions();
    }, [project?.id]);

    const fetchSessions = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('meeting_sessions')
            .select('*')
            .eq('project_id', project.id)
            .order('meeting_date', { ascending: false })
            .order('created_at', { ascending: false });
        setSessions((data as MeetingSession[]) ?? []);
        setLoading(false);
    };

    // ── Legacy migration: import old meeting_notes TEXT field ─────────────
    useEffect(() => {
        if (!project?.id || legacyMigrated || loading) return;
        const legacyContent = project?.meeting_notes?.trim();
        if (!legacyContent) return;

        // Only migrate if no sessions exist yet
        if (sessions.length === 0) {
            migrateLegacyNotes(legacyContent);
        }
        setLegacyMigrated(true);
    }, [loading, sessions.length]);

    const migrateLegacyNotes = async (content: string) => {
        const { data } = await supabase
            .from('meeting_sessions')
            .insert({
                project_id: project.id,
                title: 'Imported Notes',
                meeting_date: new Date().toISOString().split('T')[0],
                content,
                assets: project?.project_assets ?? [],
            })
            .select()
            .single();
        if (data) {
            setSessions([data as MeetingSession]);
        }
    };

    // ── CRUD helpers ──────────────────────────────────────────────────────
    const handleCreated = (session: MeetingSession) => {
        setSessions(prev => [session, ...prev]);
    };

    const handleDeleted = (id: string) => {
        setSessions(prev => prev.filter(s => s.id !== id));
    };

    const handleUpdated = (updated: MeetingSession) => {
        setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
    };

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <>
        <div className="zto-card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 10,
                        background: 'rgba(0,86,179,0.1)',
                        border: '1px solid rgba(0,86,179,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, color: '#4da3ff', flexShrink: 0,
                    }}>
                        <i className="fa-solid fa-clipboard-list" />
                    </div>
                    <div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>
                            Meeting Logs &amp; Notes
                        </span>
                        {!loading && sessions.length > 0 && (
                            <span style={{
                                marginLeft: 8, fontSize: 9, fontWeight: 700,
                                color: 'rgba(255,255,255,0.3)',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 5, padding: '1px 7px',
                                textTransform: 'uppercase', letterSpacing: '0.08em',
                            }}>
                                {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
                            </span>
                        )}
                    </div>
                </div>

                {/* New meeting button */}
                <button
                    onClick={() => setShowNewModal(true)}
                    className="zto-btn zto-btn-primary"
                    style={{ fontSize: 11, padding: '7px 14px', gap: 6 }}
                >
                    <i className="fa-solid fa-plus" />
                    <span className="meeting-btn-label">New Meeting</span>
                </button>
            </div>

            {/* Sessions list */}
            <div style={{ padding: '16px 16px' }}>
                {loading ? (
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 10, padding: '32px 0', color: 'rgba(255,255,255,0.2)', fontSize: 13,
                    }}>
                        <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 14 }} />
                        Loading sessions...
                    </div>
                ) : sessions.length === 0 ? (
                    /* Empty state */
                    <div style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        padding: '40px 24px', textAlign: 'center', gap: 12,
                    }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: 18,
                            background: 'rgba(0,86,179,0.08)',
                            border: '1px solid rgba(0,86,179,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 22, color: 'rgba(77,163,255,0.5)',
                            marginBottom: 4,
                        }}>
                            <i className="fa-solid fa-clipboard-list" />
                        </div>
                        <p style={{
                            fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)',
                            fontFamily: 'Urbanist, sans-serif',
                        }}>
                            No meeting logs yet
                        </p>
                        <p style={{
                            fontSize: 11, color: 'rgba(255,255,255,0.2)',
                            fontFamily: 'Urbanist, sans-serif', maxWidth: 240,
                        }}>
                            Tap &quot;New Meeting&quot; to add your first session. Each meeting gets its own card — easy to read and find later.
                        </p>
                        <button
                            onClick={() => setShowNewModal(true)}
                            className="zto-btn zto-btn-primary"
                            style={{ marginTop: 8, fontSize: 12, padding: '10px 20px' }}
                        >
                            <i className="fa-solid fa-plus" /> New Meeting
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {sessions.map(session => (
                            <SessionCard
                                key={session.id}
                                session={session}
                                onDelete={handleDeleted}
                                onUpdated={handleUpdated}
                            />
                        ))}
                    </div>
                )}
                )}
            </div>
        </div>

            {/* New session modal */}
            {showNewModal && (
                <NewSessionModal
                    projectId={project.id}
                    onCreated={handleCreated}
                    onClose={() => setShowNewModal(false)}
                />
            )}

            <style jsx global>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to   { transform: translateY(0);    opacity: 1; }
                }
                @media (min-width: 640px) {
                    /* On desktop: center the modal instead of bottom-sheet */
                    .meeting-new-sheet {
                        border-radius: 20px !important;
                        margin: auto !important;
                        align-self: center !important;
                    }
                    .meeting-new-sheet-container {
                        align-items: center !important;
                    }
                    .meeting-btn-label { display: inline; }
                }
                @media (max-width: 400px) {
                    .meeting-btn-label { display: none; }
                }
            `}</style>
        </>
    );
}
