'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MeetingNotesPanel({ project }: { project: any }) {
    const [notes, setNotes] = useState(project?.meeting_notes || '');
    const [assets, setAssets] = useState<string[]>(project?.project_assets || []);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [isDragging, setIsDragging] = useState(false);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (project) {
            setNotes(project.meeting_notes || '');
            setAssets(project.project_assets || []);
        }
    }, [project?.id]);

    // Debounced autosave
    useEffect(() => {
        if (!project || notes === (project.meeting_notes || '')) return;
        if (saveTimer.current) clearTimeout(saveTimer.current);
        setSaveStatus('saving');
        saveTimer.current = setTimeout(async () => {
            const { error } = await supabase.from('projects').update({ meeting_notes: notes }).eq('id', project.id);
            if (!error) {
                setSaveStatus('saved');
                project.meeting_notes = notes;
                setTimeout(() => setSaveStatus('idle'), 3000);
            } else {
                setSaveStatus('idle');
            }
        }, 5000);
        return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    }, [notes]);

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (!files.length) return;

        setSaveStatus('saving');
        const newAssets = [...assets];

        for (const file of files) {
            const fileName = `${Date.now()}_${file.name}`;
            const filePath = `project-notes/${project.id}/${fileName}`;
            const { error: uploadError } = await supabase.storage.from('event-assets').upload(filePath, file);
            if (!uploadError) {
                const { data: urlData } = supabase.storage.from('event-assets').getPublicUrl(filePath);
                newAssets.push(urlData.publicUrl);
            }
        }

        setAssets(newAssets);
        const { error: dbError } = await supabase.from('projects').update({ project_assets: newAssets }).eq('id', project.id);
        if (!dbError) {
            setSaveStatus('saved');
            project.project_assets = newAssets;
            setTimeout(() => setSaveStatus('idle'), 3000);
        } else {
            setSaveStatus('idle');
        }
    };

    const removeAsset = async (urlToRemove: string) => {
        const newAssets = assets.filter(url => url !== urlToRemove);
        setAssets(newAssets);
        await supabase.from('projects').update({ project_assets: newAssets }).eq('id', project.id);
        project.project_assets = newAssets;
    };

    return (
        <div className="zto-card" style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 28px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 32, height: 32,
                        borderRadius: 10,
                        background: 'rgba(0,86,179,0.1)',
                        border: '1px solid rgba(0,86,179,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, color: '#4da3ff',
                        flexShrink: 0,
                    }}>
                        <i className="fa-solid fa-clipboard-list" />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>
                        Meeting Logs & Notes
                    </span>
                </div>

                {/* Autosave indicator (right side) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 20 }}>
                    {saveStatus === 'saving' && (
                        <>
                            <span style={{
                                width: 6, height: 6, borderRadius: '50%',
                                background: '#0056B3',
                                boxShadow: '0 0 8px #0056B3',
                                animation: 'ztoPulse 1s ease-in-out infinite',
                            }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#4da3ff', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                                Syncing...
                            </span>
                        </>
                    )}
                    {saveStatus === 'saved' && (
                        <>
                            <span style={{
                                width: 6, height: 6, borderRadius: '50%',
                                background: '#DEFF9A',
                                boxShadow: '0 0 8px #DEFF9A',
                                animation: 'ztoPulse 2s ease-in-out infinite',
                            }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#DEFF9A', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                                Autosave Active
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Drop zone + textarea */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                    flex: 1,
                    position: 'relative',
                    minHeight: 280,
                    display: 'flex',
                    flexDirection: 'column',
                    background: isDragging ? 'rgba(0,86,179,0.06)' : 'transparent',
                    transition: 'background 0.3s ease',
                    border: isDragging ? '1px dashed rgba(77,163,255,0.5)' : '1px dashed transparent',
                    borderRadius: '0 0 24px 24px',
                }}
            >
                {/* Drag overlay */}
                {isDragging && (
                    <div style={{
                        position: 'absolute', inset: 0, zIndex: 10,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(5,5,5,0.7)',
                        backdropFilter: 'blur(6px)',
                        pointerEvents: 'none',
                        borderRadius: '0 0 24px 24px',
                    }}>
                        <div style={{
                            width: 64, height: 64,
                            borderRadius: '50%',
                            background: '#0056B3',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 28, color: '#fff',
                            marginBottom: 14,
                            boxShadow: '0 0 40px rgba(0,86,179,0.5)',
                            animation: 'bounce 0.8s ease-in-out infinite',
                        }}>
                            <i className="fa-solid fa-cloud-arrow-up" />
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: 'Urbanist' }}>
                            Drop Media Here
                        </h3>
                        <p style={{ fontSize: 11, color: '#4da3ff', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'Urbanist', fontWeight: 700 }}>
                            Auto-sync to Cloud Storage
                        </p>
                    </div>
                )}

                <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Type meeting minutes, action items, decisions... or drag images directly here."
                    style={{
                        flex: 1,
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        padding: '24px 28px',
                        color: 'rgba(255,255,255,0.75)',
                        fontFamily: 'Urbanist, sans-serif',
                        fontSize: 14,
                        lineHeight: 1.7,
                        minHeight: 220,
                    }}
                />

                {/* Assets Gallery */}
                {assets.length > 0 && (
                    <div style={{ padding: '0 28px 24px' }}>
                        <div style={{ borderTop: '1px solid rgba(0,86,179,0.15)', paddingTop: 16 }}>
                            <div className="zto-label" style={{ marginBottom: 10 }}>
                                Attached Media ({assets.length})
                            </div>
                            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                                {assets.map((url, i) => (
                                    <div key={i} style={{
                                        position: 'relative',
                                        flexShrink: 0,
                                        width: 140, height: 96,
                                        borderRadius: 12,
                                        overflow: 'hidden',
                                        border: '1px solid rgba(0,86,179,0.25)',
                                        boxShadow: '0 4px 20px rgba(0,86,179,0.15)',
                                        background: '#0a0a0a',
                                    }}
                                        onMouseEnter={e => {
                                            const btn = e.currentTarget.querySelector('button') as HTMLButtonElement;
                                            if (btn) btn.style.opacity = '1';
                                        }}
                                        onMouseLeave={e => {
                                            const btn = e.currentTarget.querySelector('button') as HTMLButtonElement;
                                            if (btn) btn.style.opacity = '0';
                                        }}
                                    >
                                        <img src={url} alt={`Asset ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
                                        <button
                                            onClick={() => removeAsset(url)}
                                            style={{
                                                position: 'absolute', top: 6, right: 6,
                                                width: 22, height: 22,
                                                borderRadius: '50%',
                                                background: 'rgba(239,68,68,0.85)',
                                                border: 'none', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 9, color: '#fff',
                                                opacity: 0,
                                                transition: 'opacity 0.2s ease',
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

            <style jsx global>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
            `}</style>
        </div>
    );
}
