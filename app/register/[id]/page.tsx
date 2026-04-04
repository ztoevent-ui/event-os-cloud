'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

import { GuildTeamItemForm } from './components/GuildTeamItemForm';
import { GuildTeamSemiFreeForm } from './components/GuildTeamSemiFreeForm';
import { BusinessProItemForm } from './components/BusinessProItemForm';

export default function RegistrationPage() {
    const params = useParams();
    const projectId = params?.id as string;

    const [settings, setSettings] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (projectId) loadSettings();
    }, [projectId]);

    const loadSettings = async () => {
        const { data } = await supabase.from('tournament_settings').select('*').eq('project_id', projectId).single();
        if (data) {
            // Apply defaults if they are missing
            const config = {
                ...data,
                template_type: data.template_type || 'guild_team_item',
                fields_config: data.fields_config || {
                    requires_gender: true,
                    show_dupr: false,
                    show_medical: false,
                    show_city_state: false,
                    show_emergency_contact: false,
                    show_work_school: false
                }
            };
            setSettings(config);
        }
        setIsLoading(false);
    };

    if (isLoading) return <div className="min-h-screen bg-black flex justify-center items-center text-zinc-500"><i className="fa-solid fa-spinner fa-spin mr-3"/> Loading Tournament Details...</div>;
    if (!settings) return <div className="min-h-screen bg-black flex justify-center items-center text-zinc-500 text-xl font-bold">Registration not found or inactive.</div>;

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-black flex justify-center items-center text-zinc-300">
                <div className="text-center bg-zinc-900 border border-zinc-800 p-10 rounded-3xl shadow-2xl max-w-lg mx-auto">
                    <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fa-solid fa-check text-4xl" />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-4">Registration Complete</h2>
                    <p className="text-zinc-400 mb-8">Your team registration has been successfully verified and saved.</p>
                    <button onClick={() => window.location.reload()} className="px-8 py-3 bg-amber-500 text-black font-bold uppercase tracking-widest rounded-xl hover:bg-amber-400">
                        Submit Another
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black font-sans text-zinc-300 pb-20 selection:bg-amber-500 selection:text-black">
            {/* Header Banner */}
            <header className="relative w-full overflow-hidden bg-zinc-900 border-b border-zinc-800 pb-12 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 z-10"></div>
                
                <div className="relative z-20 max-w-3xl mx-auto px-6 pt-16 text-center">
                    {settings.logo_url && (
                        <img src={settings.logo_url} alt="Tournament Logo" className="w-32 h-32 object-contain mx-auto mb-6 drop-shadow-2xl rounded-2xl bg-white/5 p-2" />
                    )}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-5 border border-amber-900/30 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black tracking-[0.2em] uppercase">
                        Official Registration
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tighter uppercase italic drop-shadow-lg">
                        {settings.slogan || 'Tournament Registration'}
                    </h1>
                    
                    {settings.title_sponsor && (
                        <div className="mt-6 text-amber-500 font-bold tracking-widest text-sm uppercase">
                            {settings.title_sponsor_label || 'Title Sponsor'}: <span className="text-white">{settings.title_sponsor}</span>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 -mt-8 relative z-30">
                {settings.template_type === 'guild_team_item' && (
                    <GuildTeamItemForm projectId={projectId} config={settings} onSuccess={() => setIsSuccess(true)} />
                )}
                {settings.template_type === 'guild_team_semi_free' && (
                    <GuildTeamSemiFreeForm projectId={projectId} config={settings} onSuccess={() => setIsSuccess(true)} />
                )}
                {settings.template_type === 'business_pro_item' && (
                    <BusinessProItemForm projectId={projectId} config={settings} onSuccess={() => setIsSuccess(true)} />
                )}
            </main>
        </div>
    );
}
