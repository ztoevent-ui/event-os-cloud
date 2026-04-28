'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function MeetingNotesPanel({ project }: { project: any }) {
    const [notes, setNotes] = useState(project?.meeting_notes || '');
    const [assets, setAssets] = useState<string[]>(project?.project_assets || []);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [isDragging, setIsDragging] = useState(false);

    // Sync initial state if project updates
    useEffect(() => {
        if (project) {
            setNotes(project.meeting_notes || '');
            setAssets(project.project_assets || []);
        }
    }, [project]);

    // Debounced Auto-save for notes
    useEffect(() => {
        if (!project || notes === (project.meeting_notes || '')) return;
        
        const handler = setTimeout(async () => {
            setSaveStatus('saving');
            const { error } = await supabase.from('projects').update({ meeting_notes: notes }).eq('id', project.id);
            if (!error) {
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
                // Update local project object reference to prevent re-triggering
                project.meeting_notes = notes;
            } else {
                setSaveStatus('idle');
                console.error("Failed to save notes:", error);
            }
        }, 1500);

        return () => clearTimeout(handler);
    }, [notes, project]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

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
            } else {
                console.error("Upload error:", uploadError);
            }
        }

        setAssets(newAssets);
        const { error: dbError } = await supabase.from('projects').update({ project_assets: newAssets }).eq('id', project.id);
        
        if (!dbError) {
            setSaveStatus('saved');
            project.project_assets = newAssets;
            setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
            setSaveStatus('idle');
            console.error("Failed to update assets array in DB:", dbError);
        }
    };

    const removeAsset = async (urlToRemove: string) => {
        const newAssets = assets.filter(url => url !== urlToRemove);
        setAssets(newAssets);
        await supabase.from('projects').update({ project_assets: newAssets }).eq('id', project.id);
        project.project_assets = newAssets;
        
        // Optional: Delete from storage as well to save space
        // const filePath = urlToRemove.split('/event-assets/')[1];
        // if (filePath) supabase.storage.from('event-assets').remove([filePath]);
    };

    return (
        <div className="flex flex-col gap-6 w-full h-[650px]">
            <div className="flex items-center justify-between px-8">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-[#0056B3]/10 rounded-lg flex items-center justify-center border border-[#0056B3]/30">
                        <i className="fa-solid fa-clipboard-list text-[#4da3ff] text-xs" />
                    </div>
                    <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-white font-['Urbanist']">Meeting Logs & Notes</h2>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 h-4 flex items-center gap-2">
                    {saveStatus === 'saving' && <><span className="w-2 h-2 rounded-full bg-[#0056B3] animate-pulse shadow-[0_0_8px_#0056B3]"></span><span className="text-[#0056B3]">Syncing Hub...</span></>}
                    {saveStatus === 'saved' && <><span className="w-2 h-2 rounded-full bg-[#4da3ff] animate-pulse shadow-[0_0_8px_#4da3ff]"></span><span className="text-[#4da3ff]">Autosave Active</span></>}
                </div>
            </div>

            <div 
                className={`relative flex-1 flex flex-col zto-card overflow-hidden transition-all duration-500 shadow-2xl p-[40px] box-border ${isDragging ? 'border-[#4da3ff] bg-[#0056B3]/10 shadow-[0_0_50px_rgba(0,86,179,0.2)]' : 'border-[#0056B3]/20'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Suspended Inner Window */}
                <div className="flex-1 flex flex-col bg-black/20 border border-white/5 rounded-[12px] p-6 relative overflow-hidden shadow-inner">
                    {/* Drag Overlay */}
                    {isDragging && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#050505]/80 backdrop-blur-sm pointer-events-none">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-[#0056B3] text-white rounded-full flex items-center justify-center text-4xl mb-4 mx-auto animate-bounce shadow-[0_0_40px_rgba(0,86,179,0.5)]">
                                    <i className="fa-solid fa-cloud-arrow-up" />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-widest font-['Urbanist']">Drop Media Here</h3>
                                <p className="text-[10px] font-bold text-[#4da3ff] uppercase tracking-[0.3em] mt-2">Auto-sync to Supabase Storage</p>
                            </div>
                        </div>
                    )}

                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Type meeting minutes, action items, or drop images directly here..."
                        className="flex-1 w-full bg-transparent p-2 text-sm text-zinc-300 font-['Urbanist'] tracking-wide leading-relaxed resize-none focus:outline-none placeholder-zinc-700 custom-scrollbar box-border"
                    />

                    {/* Assets Gallery */}
                    {assets.length > 0 && (
                        <div className="pt-8 mt-4 border-t border-[#0056B3]/20 bg-transparent">
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4">Attached Media ({assets.length})</p>
                            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                                {assets.map((url, i) => (
                                    <div key={i} className="relative shrink-0 group rounded-[12px] overflow-hidden border border-white/10 w-40 h-28 bg-zinc-900 shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
                                        <img src={url} alt={`Asset ${i}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        <button 
                                            onClick={() => removeAsset(url)}
                                            className="absolute top-2 right-2 w-6 h-6 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <i className="fa-solid fa-xmark" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 86, 179, 0.5);
                }
            `}</style>
        </div>
    );
}
