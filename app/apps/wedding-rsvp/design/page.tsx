'use client';

import { useState } from 'react';

export default function DesignPage() {
    const [selectedTemplate, setSelectedTemplate] = useState('classic');
    const [musicFile, setMusicFile] = useState<File | null>(null);

    const templates = [
        { id: 'classic', name: 'Classic Elegance', color: 'bg-stone-100', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=300' },
        { id: 'modern', name: 'Modern Minimal', color: 'bg-white', image: 'https://images.unsplash.com/photo-1510076860523-8c11e64903ec?auto=format&fit=crop&q=80&w=300' },
        { id: 'floral', name: 'Floral Garden', color: 'bg-pink-50', image: 'https://images.unsplash.com/photo-1507504031981-723e9edd684e?auto=format&fit=crop&q=80&w=300' },
        { id: 'gold', name: 'Golden Luxury', color: 'bg-yellow-50', image: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=300' },
    ];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setMusicFile(e.target.files[0]);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-black text-gray-900 mb-2">Design Invitation</h1>
                <p className="text-gray-500">Customize how your RSVP page looks to your guests.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Settings Column */}
                <div className="lg:col-span-1 space-y-8">

                    {/* Template Selection */}
                    <div className="bg-white rounded-2xl p-6 border border-pink-100 shadow-sm">
                        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <i className="fa-solid fa-layer-group text-pink-500"></i> Choose Template
                        </h2>
                        <div className="space-y-3">
                            {templates.map((t) => (
                                <div
                                    key={t.id}
                                    onClick={() => setSelectedTemplate(t.id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedTemplate === t.id
                                            ? 'border-pink-500 bg-pink-50'
                                            : 'border-gray-200 hover:border-pink-200'
                                        }`}
                                >
                                    <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                                        <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                                    </div>
                                    {selectedTemplate === t.id && (
                                        <i className="fa-solid fa-circle-check text-pink-500"></i>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Music Selection */}
                    <div className="bg-white rounded-2xl p-6 border border-pink-100 shadow-sm">
                        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <i className="fa-solid fa-music text-pink-500"></i> Background Music
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Upload MP3</label>
                                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition cursor-pointer">
                                    <input
                                        type="file"
                                        accept="audio/mp3"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <i className="fa-solid fa-cloud-arrow-up text-3xl text-gray-400 mb-2"></i>
                                    <p className="text-xs text-gray-500">
                                        {musicFile ? musicFile.name : 'Click to browse or drag file (MP3)'}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Or select from library</label>
                                <select className="w-full border-gray-300 rounded-lg text-sm shadow-sm focus:border-pink-500 focus:ring-pink-500">
                                    <option>Wedding March (Classic)</option>
                                    <option>Perfect (Ed Sheeran)</option>
                                    <option>A Thousand Years</option>
                                    <option>No Music</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <button className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-lg shadow-pink-200 transition">
                        Save & Publish
                    </button>
                </div>

                {/* Live Preview */}
                <div className="lg:col-span-2">
                    <div className="bg-gray-900 rounded-3xl p-4 shadow-2xl h-[800px] max-w-sm mx-auto sticky top-4 border-4 border-gray-800">
                        <div className="bg-black rounded-2xl h-full w-full overflow-hidden relative group">
                            {/* Phone Status Bar Mock */}
                            <div className="h-6 bg-black text-white text-[10px] flex items-center justify-between px-4">
                                <span>9:41</span>
                                <div className="flex gap-1">
                                    <i className="fa-solid fa-signal"></i>
                                    <i className="fa-solid fa-wifi"></i>
                                    <i className="fa-solid fa-battery-full"></i>
                                </div>
                            </div>

                            {/* Content */}
                            <div className={`h-full w-full overflow-y-auto ${selectedTemplate === 'modern' ? 'bg-white' :
                                    selectedTemplate === 'classic' ? 'bg-stone-100' :
                                        selectedTemplate === 'floral' ? 'bg-pink-50' : 'bg-yellow-50'
                                }`}>
                                <div className="h-64 bg-gray-200 relative">
                                    <img
                                        src={templates.find(t => t.id === selectedTemplate)?.image}
                                        alt="Cover"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                        <h1 className="text-4xl font-serif text-white italic tracking-wider">S & J</h1>
                                    </div>
                                </div>
                                <div className="p-6 text-center space-y-6">
                                    <div>
                                        <h2 className="text-sm uppercase tracking-widest text-gray-500">You Are Invited</h2>
                                        <h1 className="text-3xl font-serif text-gray-900 my-4">Sarah & James</h1>
                                        <p className="text-gray-600 font-light italic">Request the honor of your presence</p>
                                    </div>

                                    <div className="py-6 border-t border-b border-gray-200 space-y-2">
                                        <p className="font-bold text-gray-900">OCTOBER 24, 2026</p>
                                        <p className="text-sm text-gray-500">AT FOUR O'CLOCK IN THE AFTERNOON</p>
                                        <p className="text-sm font-bold text-gray-900 mt-4">THE GRAND BALLROOM</p>
                                        <p className="text-xs text-gray-500">123 Wedding Ave, New York</p>
                                    </div>

                                    <button className="px-8 py-3 bg-black text-white rounded-full text-sm uppercase tracking-wider">
                                        RSVP Now
                                    </button>

                                    {/* Music Player Mock */}
                                    <div className="bg-white/50 backdrop-blur-sm rounded-full p-2 flex items-center gap-3 w-max mx-auto border border-gray-200">
                                        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 animate-spin-slow">
                                            <i className="fa-solid fa-compact-disc"></i>
                                        </div>
                                        <span className="text-xs font-medium text-gray-600">
                                            {musicFile ? musicFile.name : 'Wedding March'}
                                        </span>
                                        <i className="fa-solid fa-volume-high text-xs text-gray-400"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
