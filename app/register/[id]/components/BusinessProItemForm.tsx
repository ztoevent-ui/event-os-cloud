'use client';

import { useState } from 'react';
import Swal from 'sweetalert2';
import { uploadICFile } from '@/app/actions/tournament-actions';
import { supabase } from '@/lib/supabaseClient';
import { DynamicPlayerFields } from './DynamicPlayerFields';

type FormProps = {
    projectId: string;
    config: any;
    onSuccess?: () => void;
};

export function BusinessProItemForm({ projectId, config, onSuccess }: FormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fieldsConfig = config.fields_config || {};

    // Form State
    const [organizationName, setOrganizationName] = useState(''); // Used as Team Name
    const [captain, setCaptain] = useState<any>({ name: '', ic: '', file: null });
    const [partner, setPartner] = useState<any>({ name: '', ic: '', file: null });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // 1. Validation Logic
        if (!captain.name || !partner.name) return Swal.fire('Incomplete', 'Please enter names for both players.', 'warning');
        if (fieldsConfig.show_team_name && !organizationName) return Swal.fire('Incomplete', 'Please enter Team Name.', 'warning');
        
        // IC/Passport check
        if (fieldsConfig.show_ic_passport) {
            if (!captain.ic || !captain.file || !partner.ic || !partner.file) {
                return Swal.fire('Incomplete', 'IC Number and Image are required for both players.', 'warning');
            }
        }

        // Gender check
        if (fieldsConfig.requires_gender) {
            if (!captain.gender || !partner.gender) {
                return Swal.fire('Incomplete', 'Please select a gender for both players.', 'warning');
            }
        }

        setIsSubmitting(true);
        Swal.fire({ title: 'Uploading & Submitting...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        try {
            // Upload Captain IC if enabled
            let capIcUrl = null;
            if (fieldsConfig.show_ic_passport && captain.file) {
                const capData = new FormData();
                capData.append('file', captain.file!);
                capData.append('project_id', projectId);
                const capUpload = await uploadICFile(capData);
                if (!capUpload.success) throw new Error('Captain IC upload failed');
                capIcUrl = capUpload.url;
            }

            // Upload Partner IC if enabled
            let partnerIcUrl = null;
            if (fieldsConfig.show_ic_passport && partner.file) {
                const partnerData = new FormData();
                partnerData.append('file', partner.file!);
                partnerData.append('project_id', projectId);
                const partnerUpload = await uploadICFile(partnerData);
                if (!partnerUpload.success) throw new Error('Partner IC upload failed');
                partnerIcUrl = partnerUpload.url;
            }

            // Insert Database Record
            const { error } = await supabase.from('tournament_registrations').insert({
                project_id: projectId,
                organization_name: organizationName, 
                captain_name: captain.name,
                captain_ic: captain.ic || null,
                captain_role: 'Captain',
                captain_ic_url: capIcUrl,
                captain_gender: captain.gender || null,
                captain_phone: captain.phone || null,
                captain_email: captain.email || null,
                players: [
                    {
                        name: partner.name,
                        ic: partner.ic || null,
                        ic_url: partnerIcUrl,
                        category: 'Partner',
                        player_id: 'P1',
                        ...partner
                    }
                ]
            });

            if (error) throw error;

            Swal.fire({ icon: 'success', title: 'Registration Successful!', text: 'Your team registration has been recorded.', background: '#18181b', color: '#fff' });
            if (onSuccess) onSuccess();
            
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'Submission Failed', text: error.message, background: '#18181b', color: '#fff' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Team Settings */}
            {fieldsConfig.show_team_name && (
                <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl shadow-xl">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">1</div>
                        <h2 className="text-xl font-black text-white uppercase tracking-widest">Team Information</h2>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">Team Name *</label>
                        <input type="text" required value={organizationName} onChange={e => setOrganizationName(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" placeholder="Enter Team Name" />
                    </div>
                </div>
            )}

            {/* Captain Player Form */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl shadow-xl">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-black"><i className="fa-solid fa-crown text-sm" /></div>
                    <h2 className="text-xl font-black text-white uppercase tracking-widest">Captain</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className={fieldsConfig.show_ic_passport ? "" : "md:col-span-2"}>
                        <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">Full Name *</label>
                        <input type="text" required value={captain.name} onChange={e => setCaptain({...captain, name: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" />
                    </div>
                    {fieldsConfig.show_ic_passport && (
                        <div>
                            <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">IC Number *</label>
                            <input type="text" required value={captain.ic} onChange={e => setCaptain({...captain, ic: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" placeholder="XXXXXX-XX-XXXX" />
                        </div>
                    )}
                </div>
                
                {fieldsConfig.show_ic_passport && (
                    <div className="mt-5">
                        <label className="block text-[10px] text-zinc-500 mb-1 uppercase tracking-wider font-bold">Upload IC *</label>
                        <input type="file" required accept="image/*" onChange={e => setCaptain({...captain, file: e.target.files?.[0] || null})} className="w-full text-xs text-zinc-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-zinc-800 file:text-zinc-300" />
                    </div>
                )}

                <DynamicPlayerFields player={captain} onChange={(f, v) => setCaptain({ ...captain, [f]: v })} config={fieldsConfig} medicalOptions={config.medical_options} isCaptain={true} />
            </div>

            {/* Partner Player Form */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl shadow-xl">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-black"><i className="fa-solid fa-user text-sm" /></div>
                    <h2 className="text-xl font-black text-white uppercase tracking-widest">Partner</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className={fieldsConfig.show_ic_passport ? "" : "md:col-span-2"}>
                        <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">Full Name *</label>
                        <input type="text" required value={partner.name} onChange={e => setPartner({...partner, name: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" />
                    </div>
                    {fieldsConfig.show_ic_passport && (
                        <div>
                            <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">IC Number *</label>
                            <input type="text" required value={partner.ic} onChange={e => setPartner({...partner, ic: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" placeholder="XXXXXX-XX-XXXX" />
                        </div>
                    )}
                </div>

                {fieldsConfig.show_ic_passport && (
                    <div className="mt-5">
                        <label className="block text-[10px] text-zinc-500 mb-1 uppercase tracking-wider font-bold">Upload IC *</label>
                        <input type="file" required accept="image/*" onChange={e => setPartner({...partner, file: e.target.files?.[0] || null})} className="w-full text-xs text-zinc-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-zinc-800 file:text-zinc-300" />
                    </div>
                )}

                <DynamicPlayerFields player={partner} onChange={(f, v) => setPartner({ ...partner, [f]: v })} config={fieldsConfig} medicalOptions={config.medical_options} />
            </div>

            <div className="pt-6 border-t border-zinc-800 pb-12">
                <button disabled={isSubmitting} type="submit" className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:shadow-none text-black font-black uppercase tracking-widest px-8 py-5 rounded-2xl transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)] text-lg">
                    {isSubmitting ? 'Uploading & Processing...' : 'Submit Team Registration'}
                </button>
            </div>
        </form>
    );
}

