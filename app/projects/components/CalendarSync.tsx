'use client';

import { useState } from 'react';

interface CalendarSyncProps {
    projectId: string;
}

export function CalendarSyncButton({ projectId }: CalendarSyncProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const feedUrl = `${window.location.origin}/api/projects/${projectId}/tasks/feed`;
    
    // Google Calendar 'Add by URL' doesn't have a direct 1-click API without auth, 
    // but we can provide a helper link that opens Google Calendar.
    // However, the best way for users is to copy the iCal URL.
    const googleCalendarUrl = `https://calendar.google.com/calendar/u/0/r/settings/addbyurl`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(feedUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-full transition-all flex items-center gap-2 border border-zinc-700 shadow-lg"
            >
                <i className="fa-solid fa-calendar-days text-amber-500"></i>
                Calendar Sync
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <i className="fa-solid fa-sync fa-spin text-amber-500 text-sm"></i>
                                Calendar Integration
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                                <i className="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <p className="text-sm text-zinc-400 leading-relaxed">
                                Subscribe to your project tasks in Google Calendar, Outlook, or Apple Calendar. Changes will sync automatically.
                            </p>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">iCal Feed URL</label>
                                <div className="flex gap-2">
                                    <input 
                                        readOnly 
                                        value={feedUrl}
                                        className="flex-1 bg-black border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 font-mono outline-none"
                                    />
                                    <button 
                                        onClick={copyToClipboard}
                                        className={`px-4 rounded-lg font-bold transition-all flex items-center justify-center min-w-[80px] ${copied ? 'bg-green-500 text-black' : 'bg-amber-500 text-black hover:bg-amber-400'}`}
                                    >
                                        {copied ? <i className="fa-solid fa-check"></i> : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <a 
                                    href={googleCalendarUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-[#4285F4]/10 flex items-center justify-center">
                                        <i className="fa-brands fa-google text-[#4285F4]"></i>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-white">Google Calendar</div>
                                        <div className="text-[10px] text-zinc-500">Open Gcal "Add by URL" settings</div>
                                    </div>
                                    <i className="fa-solid fa-arrow-up-right-from-square text-xs text-zinc-700 group-hover:text-zinc-400"></i>
                                </a>

                                <a 
                                    href={`webcal://${feedUrl.split('://')[1]}`}
                                    className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-zinc-700/50 flex items-center justify-center">
                                        <i className="fa-solid fa-calendar-plus text-white"></i>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-white">Outlook / Apple</div>
                                        <div className="text-[10px] text-zinc-500">Open in your default calendar app</div>
                                    </div>
                                    <i className="fa-solid fa-link text-xs text-zinc-700 group-hover:text-zinc-400"></i>
                                </a>
                            </div>

                            <div className="pt-4 border-t border-zinc-800/50">
                                <div className="flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                                    <i className="fa-solid fa-circle-info text-amber-500 text-xs mt-0.5"></i>
                                    <p className="text-[10px] text-zinc-500 leading-normal">
                                        <b>Tip:</b> Re-sync frequency depends on your calendar provider (usually every few hours). 
                                        Only tasks with due dates and non-"Done" status are included.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
