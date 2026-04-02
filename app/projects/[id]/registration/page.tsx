'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import Swal from 'sweetalert2';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function RegistrationStudio() {
    const params = useParams();
    const projectId = params?.id as string;
    
    const [activeTab, setActiveTab] = useState<'settings' | 'submissions'>('settings');
    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState<any>({
        slogan: '',
        logo_url: '',
        title_sponsor: '',
        sponsors: [],
        co_organizers: [],
        template_type: 'guild_team_item',
        fields_config: {
            requires_gender: true,
            show_dupr: false,
            show_medical: false,
            show_city_state: false,
            show_emergency_contact: false,
            show_work_school: false
        }
    });
    const [submissions, setSubmissions] = useState<any[]>([]);

    useEffect(() => {
        if (projectId) {
            loadSettings();
            loadSubmissions();
        }
    }, [projectId]);

    const loadSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('tournament_settings')
                .select('*')
                .eq('project_id', projectId)
                .single();
            
            if (data) {
                const loadedSettings = {
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
                setSettings(loadedSettings);
            }
        } catch (error) {
            console.error('Error loading settings', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadSubmissions = async () => {
        const { data } = await supabase
            .from('tournament_registrations')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
        
        if (data) setSubmissions(data);
    };

    const handleSaveSettings = async () => {
        try {
            const { error } = await supabase
                .from('tournament_settings')
                .upsert({
                    project_id: projectId,
                    slogan: settings.slogan,
                    logo_url: settings.logo_url,
                    title_sponsor: settings.title_sponsor,
                    sponsors: settings.sponsors,
                    co_organizers: settings.co_organizers,
                    template_type: settings.template_type,
                    fields_config: settings.fields_config,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'project_id' });

            if (error) throw error;
            
            Swal.fire({
                title: 'Saved',
                text: 'Registration settings saved successfully',
                icon: 'success',
                confirmButtonColor: '#f59e0b',
                background: '#18181b',
                color: '#fff'
            });
        } catch (error: any) {
            Swal.fire('Error', error.message, 'error');
        }
    };

    const publicRegistrationUrl = projectId ? `https://www.ztoevent.com/register/${projectId}` : '';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Registration Studio</h1>
                    <p className="text-zinc-500">Design your tournament form & view submissions</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-4 border-b border-zinc-800 pb-2">
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`pb-2 px-4 font-bold text-sm tracking-widest uppercase transition-all ${
                        activeTab === 'settings' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-zinc-500 hover:text-white'
                    }`}
                >
                    Design & Settings
                </button>
                <button
                    onClick={() => setActiveTab('submissions')}
                    className={`pb-2 px-4 font-bold text-sm tracking-widest uppercase transition-all ${
                        activeTab === 'submissions' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-zinc-500 hover:text-white'
                    }`}
                >
                    Registrations ({submissions.length})
                </button>
            </div>

            {isLoading ? (
                <div className="h-64 flex items-center justify-center text-zinc-500">Loading...</div>
            ) : activeTab === 'settings' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form Settings */}
                    <div className="lg:col-span-2 space-y-6 bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl shadow-xl">
                        <div>
                            <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">Registration Template</label>
                            <select
                                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 appearance-none font-bold"
                                value={settings.template_type}
                                onChange={e => setSettings({...settings, template_type: e.target.value})}
                            >
                                <option value="guild_team_item">公会团体项目战 (Guild Team Item Battle)</option>
                                <option value="guild_team_semi_free">公会团体半自由战 (Guild Team Semi-free Battle)</option>
                                <option value="business_pro_item">商业职业项目战 (Business Pro Item Battle)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">Data Collection Fields</label>
                            <div className="grid grid-cols-2 gap-4 bg-black/50 p-5 rounded-2xl border border-zinc-800">
                                {[ 
                                    { key: 'requires_gender', label: 'Gender Selection' },
                                    { key: 'show_dupr', label: 'DUPR ID' },
                                    { key: 'show_medical', label: 'Medical History' },
                                    { key: 'show_city_state', label: 'City & State' },
                                    { key: 'show_emergency_contact', label: 'Emergency Contact' },
                                    { key: 'show_work_school', label: 'Work / School' },
                                ].map(field => (
                                    <label key={field.key} className="flex items-center gap-3 cursor-pointer group">
                                        <div 
                                            onClick={() => setSettings({
                                                ...settings, 
                                                fields_config: { 
                                                    ...settings.fields_config, 
                                                    [field.key]: !settings.fields_config[field.key] 
                                                }
                                            })}
                                            className={`w-5 h-5 rounded flex items-center justify-center transition-all ${settings.fields_config[field.key] ? 'bg-amber-500 border-amber-500' : 'bg-zinc-900 border-zinc-700'} border`}
                                        >
                                            {settings.fields_config[field.key] && <i className="fa-solid fa-check text-black text-[10px]" />}
                                        </div>
                                        <span className="text-xs text-zinc-400 group-hover:text-amber-500 transition-colors uppercase tracking-wider font-bold">{field.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">Tournament Slogan</label>
                            <input
                                type="text"
                                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                                value={settings.slogan || ''}
                                onChange={e => setSettings({...settings, slogan: e.target.value})}
                                placeholder="e.g. Bintulu Inter-Surname Clan Championship"
                            />
                        </div>
                        
                        <div className="space-y-3">
                            <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">Tournament Logo URL</label>
                            
                            <div className="flex items-center gap-4">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 pr-12"
                                        value={settings.logo_url || ''}
                                        onChange={e => setSettings({...settings, logo_url: e.target.value})}
                                        placeholder="Enter URL or upload a PNG"
                                    />
                                    {settings.logo_url && (
                                        <img src={settings.logo_url} alt="Logo" className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 object-contain rounded-md bg-white/5 p-1" />
                                    )}
                                </div>
                                <div className="relative">
                                    <input 
                                        type="file" 
                                        accept=".png,.jpeg,.jpg"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            
                                            Swal.fire({ title: 'Uploading Logo...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                                            try {
                                                const formData = new FormData();
                                                formData.append('file', file);
                                                formData.append('project_id', projectId);
                                                const { uploadLogoFile } = await import('@/app/actions/tournament-actions');
                                                const res = await uploadLogoFile(formData);
                                                
                                                if (res.success) {
                                                    setSettings({...settings, logo_url: res.url});
                                                    Swal.close();
                                                } else {
                                                    throw new Error(res.error || 'Upload failed');
                                                }
                                            } catch (error: any) {
                                                Swal.fire('Upload Failed', error.message, 'error');
                                            }
                                        }}
                                    />
                                    <button type="button" className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl transition-colors shrink-0">
                                        <i className="fa-solid fa-upload lg:mr-2"></i><span className="hidden lg:inline">Upload</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">Title Sponsor / 冠名商</label>
                            <input
                                type="text"
                                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                                value={settings.title_sponsor || ''}
                                onChange={e => setSettings({...settings, title_sponsor: e.target.value})}
                            />
                        </div>

                        <div className="pt-4 border-t border-zinc-800 text-right">
                            <button
                                onClick={handleSaveSettings}
                                className="bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest px-8 py-3 rounded-xl transition-colors shadow-lg shadow-amber-500/20"
                            >
                                Save Settings
                            </button>
                        </div>
                    </div>

                    {/* QR Code and Link */}
                    <div className="space-y-6">
                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl shadow-xl text-center">
                            <h3 className="text-sm font-black tracking-widest uppercase text-zinc-400 mb-6">Scan to Register</h3>
                            <div className="bg-white p-4 rounded-2xl inline-block mx-auto mb-6">
                                <QRCodeSVG value={publicRegistrationUrl || 'placeholder'} size={180} />
                            </div>
                            <div className="text-left space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-2">Public Registration Link</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={publicRegistrationUrl}
                                            className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300"
                                        />
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(publicRegistrationUrl);
                                                Swal.fire({ title: 'Copied!', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, background: '#18181b', color: '#fff' });
                                            }}
                                            className="bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg text-zinc-300"
                                        >
                                            <i className="fa-solid fa-copy"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="pt-4 border-t border-zinc-800/50">
                                    <label className="block text-[10px] font-black tracking-widest uppercase text-amber-500 mb-2">Legacy / Custom BPO 2026 Portal</label>
                                    <Link href="/apps/ticketing/bpo-2026" target="_blank" className="flex items-center justify-between w-full bg-zinc-950 border border-amber-500/20 rounded-lg px-4 py-3 hover:bg-zinc-800 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                                <i className="fa-solid fa-id-card"></i>
                                            </div>
                                            <div className="text-left">
                                                <div className="text-xs font-bold text-white uppercase tracking-widest">BPO 2026 Official</div>
                                                <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Custom Template Landing Page</div>
                                            </div>
                                        </div>
                                        <i className="fa-solid fa-external-link text-zinc-500 group-hover:text-amber-500 transition-colors text-xs"></i>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto p-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-800 bg-black/50">
                                    <th className="px-6 py-4 text-[10px] font-black tracking-widest uppercase text-zinc-500">Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black tracking-widest uppercase text-zinc-500">Organization (公会)</th>
                                    <th className="px-6 py-4 text-[10px] font-black tracking-widest uppercase text-zinc-500">Captain</th>
                                    <th className="px-6 py-4 text-[10px] font-black tracking-widest uppercase text-zinc-500">Pairs count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-zinc-600 font-medium">No registrations received yet.</td>
                                    </tr>
                                ) : (
                                    submissions.map(sub => (
                                        <tr key={sub.id} className="border-b border-zinc-800/50 hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 text-xs text-zinc-400">
                                                {new Date(sub.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-white">
                                                {sub.organization_name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-zinc-200">{sub.captain_name}</div>
                                                <div className="text-xs text-zinc-500">{sub.captain_role}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-zinc-400">
                                                {sub.players?.length / 2 || 0} Pairs
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
