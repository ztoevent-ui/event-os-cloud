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

export function GuildTeamSemiFreeForm({ projectId, config, onSuccess }: FormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fieldsConfig = config.fields_config || {};

    // Form State
    const [organizationName, setOrganizationName] = useState('');
    const [captain, setCaptain] = useState<any>({ name: '', ic: '', role: '', file: null });
    
    // Players Tracker (10 active, 3 reserves)
    const [activePlayers, setActivePlayers] = useState<any[]>(
        Array(10).fill(null).map((_, i) => ({ id: `A${i+1}`, type: 'Active', name: '', ic: '', file: null }))
    );
    const [reservePlayers, setReservePlayers] = useState<any[]>(
        Array(3).fill(null).map((_, i) => ({ id: `R${i+1}`, type: 'Reserve', name: '', ic: '', file: null }))
    );

    const handlePlayerChange = (type: 'active' | 'reserve', id: string, field: string, value: any) => {
        const updater = type === 'active' ? setActivePlayers : setReservePlayers;
        updater(prev => prev.map(p => {
            if (p.id === id) {
                return { ...p, [field]: value };
            }
            return p;
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // 1. Validation Logic
        if (!captain.name) return Swal.fire('Incomplete', 'Please enter Captain Name.', 'warning');
        if (fieldsConfig.show_team_name && !organizationName) return Swal.fire('Incomplete', 'Please enter Organization/Team Name.', 'warning');
        
        // IC/Passport check
        if (fieldsConfig.show_ic_passport) {
            if (!captain.ic || !captain.file) return Swal.fire('Incomplete', 'Captain IC Number and Image are required.', 'warning');
            const missingActive = activePlayers.some(p => !p.name || !p.ic || !p.file);
            if (missingActive) return Swal.fire('Incomplete', 'All 10 active players must have IC details and uploads.', 'warning');
            const invalidReserves = reservePlayers.some(p => (p.name || p.ic || p.file) && (!p.name || !p.ic || !p.file));
            if (invalidReserves) return Swal.fire('Incomplete', 'If you provide a reserve player, please complete their IC details.', 'warning');
        }

        // Gender check
        if (fieldsConfig.requires_gender) {
            if (!captain.gender) return Swal.fire('Incomplete', 'Captain Gender is required.', 'warning');
            if (activePlayers.some(p => !p.gender)) return Swal.fire('Incomplete', 'All active players must have gender selected.', 'warning');
            const filledReserves = reservePlayers.filter(p => p.name);
            if (filledReserves.some(p => !p.gender)) return Swal.fire('Incomplete', 'Please select a gender for all reserve players.', 'warning');
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

            // Players Formatting & Uploads
            const playersData = [];
            const allPlayersToProcess = [...activePlayers, ...reservePlayers.filter(p => p.name)];

            for (const p of allPlayersToProcess) {
                let pIcUrl = null;
                if (fieldsConfig.show_ic_passport && p.file) {
                    const pData = new FormData();
                    pData.append('file', p.file!);
                    pData.append('project_id', projectId);
                    const res = await uploadICFile(pData);
                    if (!res.success) throw new Error(`IC upload failed for ${p.name}`);
                    pIcUrl = res.url;
                }
                
                const { file: f, ...pDetails } = p;
                playersData.push({
                    ...pDetails,
                    ic_url: pIcUrl, 
                    category: p.type, 
                    player_id: p.id
                });
            }

            // Insert Database Record
            const { error } = await supabase.from('tournament_registrations').insert({
                project_id: projectId,
                organization_name: organizationName,
                captain_name: captain.name,
                captain_ic: captain.ic || null,
                captain_role: captain.role || null,
                captain_ic_url: capIcUrl,
                captain_gender: captain.gender || null,
                captain_phone: captain.phone || null,
                captain_email: captain.email || null,
                captain_details: {
                    medical_conditions: captain.medical_conditions || [],
                    work_school: captain.work_school || null,
                    city: captain.city || null,
                    state: captain.state || null,
                    emergency_contact: {
                        name: captain.emergency_contact_name || null,
                        phone: captain.emergency_contact_phone || null,
                        relationship: captain.emergency_contact_relationship || null
                    }
                },
                players: playersData
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

    const renderPlayerForm = (p: any, index: number, type: 'active' | 'reserve') => (
        <div key={p.id} className="bg-black/30 p-5 rounded-2xl border border-zinc-800/50">
            <h4 className="text-sm font-bold text-white border-b border-zinc-800 pb-2 mb-4">
                {type === 'active' ? `Active Player ${index + 1}` : `Reserve Player ${index + 1}`}
                {type === 'reserve' && <span className="text-zinc-500 text-xs ml-2 font-normal">(Optional)</span>}
            </h4>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={fieldsConfig.show_ic_passport ? "" : "md:col-span-2"}>
                        <input type="text" required={type === 'active'} placeholder="Full Name *" value={p.name || ''} onChange={e => handlePlayerChange(type, p.id, 'name', e.target.value)} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" />
                    </div>
                    {fieldsConfig.show_ic_passport && (
                        <div className="space-y-3">
                            <input type="text" required={type === 'active'} placeholder="IC Number *" value={p.ic || ''} onChange={e => handlePlayerChange(type, p.id, 'ic', e.target.value)} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" />
                            <div>
                                <label className="block text-[10px] text-zinc-500 mb-1 uppercase tracking-wider font-bold">Upload IC</label>
                                <input type="file" required={type === 'active'} accept="image/*" onChange={e => handlePlayerChange(type, p.id, 'file', e.target.files?.[0] || null)} className="w-full text-xs text-zinc-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-zinc-800 file:text-zinc-300" />
                            </div>
                        </div>
                    )}
                </div>
                {(p.name || type === 'active') && (
                    <DynamicPlayerFields 
                        player={p} 
                        onChange={(f, v) => handlePlayerChange(type, p.id, f, v)} 
                        config={fieldsConfig} 
                        medicalOptions={config.medical_options}
                    />
                )}
            </div>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Organization & Captain */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl shadow-xl">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">1</div>
                    <h2 className="text-xl font-black text-white uppercase tracking-widest">Organization & Captain Form</h2>
                </div>
                
                <div className="space-y-5">
                    {fieldsConfig.show_team_name && (
                        <div>
                            <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">参赛公会全称 (Organization / Team Name) *</label>
                            <input type="text" required value={organizationName} onChange={e => setOrganizationName(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" placeholder="Enter Full Organization Name" />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className={fieldsConfig.show_ic_passport ? "" : "md:col-span-2"}>
                            <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">领队名字 (Captain Name) *</label>
                            <input type="text" required value={captain.name} onChange={e => setCaptain({...captain, name: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" />
                        </div>
                        {fieldsConfig.show_ic_passport && (
                            <div>
                                <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">身分证号 (IC Number) *</label>
                                <input type="text" required value={captain.ic} onChange={e => setCaptain({...captain, ic: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" placeholder="XXXXXX-XX-XXXX" />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">领队职务 (Role in Org)</label>
                            <input type="text" value={captain.role} onChange={e => setCaptain({...captain, role: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" placeholder="e.g. Chairman, Secretary" />
                        </div>
                        {fieldsConfig.show_ic_passport && (
                            <div>
                                <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">上传 IC (Upload IC) *</label>
                                <input type="file" required accept="image/*" onChange={e => setCaptain({...captain, file: e.target.files?.[0] || null})} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-white file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-amber-500/10 file:text-amber-500 hover:file:bg-amber-500/20" />
                            </div>
                        )}
                    </div>

                    <DynamicPlayerFields 
                        player={captain} 
                        onChange={(f, v) => setCaptain({ ...captain, [f]: v })} 
                        config={fieldsConfig} 
                        medicalOptions={config.medical_options}
                        isCaptain={true} 
                    />
                </div>
            </div>

            {/* Players Configuration */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl shadow-xl">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">2</div>
                    <h2 className="text-xl font-black text-white uppercase tracking-widest">Active Players (10)</h2>
                </div>
                <div className="space-y-6">
                    {activePlayers.map((p, index) => renderPlayerForm(p, index, 'active'))}
                </div>
            </div>

            {/* Reserves Configuration */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl shadow-xl">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">3</div>
                    <h2 className="text-xl font-black text-white uppercase tracking-widest">Reserve Players (3)</h2>
                </div>
                <p className="text-xs text-zinc-400 mb-6">Reserves are optional. You can substitute active players during the event from this list.</p>
                <div className="space-y-6">
                    {reservePlayers.map((p, index) => renderPlayerForm(p, index, 'reserve'))}
                </div>
            </div>

            <div className="pt-6 border-t border-zinc-800 pb-12">
                <button disabled={isSubmitting} type="submit" className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:shadow-none text-black font-black uppercase tracking-widest px-8 py-5 rounded-2xl transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)] text-lg">
                    {isSubmitting ? 'Uploading & Processing...' : 'Submit Team Registration'}
                </button>
            </div>
        </form>
    );
}

