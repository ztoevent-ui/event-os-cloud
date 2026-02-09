'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Template } from '../types';
import { saveTemplate } from '../store';

export default function TemplateBuilder() {
    const router = useRouter();
    const [template, setTemplate] = useState<Template>({
        id: 'temp-id',
        name: 'New Template',
        description: 'Created by staff',
        backgroundColor: 'bg-white',
        fontFamily: 'font-sans',
        textColor: 'text-gray-900',
        accentColor: 'text-blue-600',
        coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=300'
    });

    const handleSave = () => {
        const finalTemplate = template.id === 'temp-id'
            ? { ...template, id: `custom-${Date.now()}` }
            : template;

        saveTemplate(finalTemplate);
        router.push('/apps/wedding-hub/design');
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Template Builder</h1>
                    <p className="text-gray-500">Design a new invitation template for users.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition shadow-lg shadow-pink-200"
                    >
                        Save Template
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Controls */}
                <div className="space-y-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">

                    {/* Basic Info */}
                    <section className="space-y-4">
                        <h3 className="font-bold text-gray-900 border-b pb-2">Basic Info</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                            <input
                                type="text"
                                value={template.name}
                                onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-pink-500 focus:ring-pink-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
                            <input
                                type="text"
                                value={template.coverImage}
                                onChange={(e) => setTemplate({ ...template, coverImage: e.target.value })}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-pink-500 focus:ring-pink-500"
                            />
                        </div>
                    </section>

                    {/* Colors */}
                    <section className="space-y-4">
                        <h3 className="font-bold text-gray-900 border-b pb-2">Colors</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Background Style</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['bg-white', 'bg-stone-100', 'bg-gray-50', 'bg-pink-50', 'bg-yellow-50', 'bg-blue-50', 'bg-slate-900'].map(bg => (
                                    <button
                                        key={bg}
                                        onClick={() => setTemplate({ ...template, backgroundColor: bg })}
                                        className={`h-10 rounded-lg border ${bg} ${template.backgroundColor === bg ? 'ring-2 ring-pink-500 ring-offset-2' : 'border-gray-200'}`}
                                        title={bg}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                            <div className="flex gap-2">
                                {['text-gray-900', 'text-gray-800', 'text-stone-800', 'text-white'].map(tc => (
                                    <button
                                        key={tc}
                                        onClick={() => setTemplate({ ...template, textColor: tc })}
                                        className={`w-10 h-10 rounded-full border flex items-center justify-center ${tc === 'text-white' ? 'bg-black' : 'bg-gray-100'} ${template.textColor === tc ? 'ring-2 ring-pink-500 ring-offset-2' : 'border-gray-200'}`}
                                    >
                                        <span className={tc}>A</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color (Buttons/Icons)</label>
                            <div className="flex gap-2">
                                {['text-pink-600', 'text-blue-600', 'text-green-600', 'text-purple-600', 'text-amber-600', 'text-gray-900'].map(ac => (
                                    <button
                                        key={ac}
                                        onClick={() => setTemplate({ ...template, accentColor: ac })}
                                        className={`w-8 h-8 rounded-full border ${ac.replace('text', 'bg')} ${template.accentColor === ac ? 'ring-2 ring-gray-900 ring-offset-2' : 'border-transparent'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Typography */}
                    <section className="space-y-4">
                        <h3 className="font-bold text-gray-900 border-b pb-2">Typography</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {['font-sans', 'font-serif', 'font-mono'].map(font => (
                                <button
                                    key={font}
                                    onClick={() => setTemplate({ ...template, fontFamily: font })}
                                    className={`p-3 border rounded-lg text-center ${font} ${template.fontFamily === font ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {font.replace('font-', '')}
                                </button>
                            ))}
                        </div>
                    </section>

                </div>

                {/* Preview */}
                <div className="bg-gray-100 rounded-3xl p-8 border-4 border-gray-200 flex items-center justify-center relative">
                    <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-full text-xs font-bold text-gray-500 uppercase tracking-wide">Preview</div>

                    {/* Phone Frame */}
                    <div className="bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl w-full max-w-sm border-4 border-gray-800">
                        <div className={`aspect-[9/19] rounded-[2rem] w-full overflow-hidden flex flex-col relative ${template.backgroundColor}`}>

                            {/* Header Image */}
                            <div className="h-1/3 w-full relative">
                                <img src={template.coverImage} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                    <span className={`text-4xl text-white italic ${template.fontFamily}`}>S & J</span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className={`p-6 text-center flex-1 flex flex-col items-center gap-4 ${template.textColor} ${template.fontFamily}`}>
                                <div>
                                    <p className="text-xs uppercase tracking-widest opacity-60 mb-2">You Are Invited</p>
                                    <h1 className="text-2xl font-bold">Sarah & James</h1>
                                </div>

                                <div className="my-2 space-y-1 text-sm opacity-80">
                                    <p>October 24, 2026</p>
                                    <p>The Grand Ballroom</p>
                                </div>

                                <button
                                    className={`mt-auto px-8 py-3 rounded-full text-white text-sm uppercase tracking-widest font-bold shadow-lg w-full ${template.accentColor.replace('text', 'bg')}`}
                                >
                                    RSVP
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
