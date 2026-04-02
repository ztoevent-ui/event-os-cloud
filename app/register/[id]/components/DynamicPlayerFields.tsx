'use client';

import React from 'react';

type FieldsConfig = {
    requires_gender?: boolean;
    show_dupr?: boolean;
    show_medical?: boolean;
    show_city_state?: boolean;
    show_emergency_contact?: boolean;
    show_work_school?: boolean;
};

type DynamicPlayerFieldsProps = {
    player: any; // the state object for the player
    onChange: (field: string, value: any) => void;
    config: FieldsConfig;
    isCaptain?: boolean;
};

const MEDICAL_CONDITIONS = [
    'Heart Disease / Penyakit Jantung',
    'Asthma / Asma',
    'Diabetes / Kencing Manis',
    'High Blood Pressure / Darah Tinggi',
    'Epilepsy / Sawan',
    'Joint/Bone Injury / Kecederaan Sendi',
    'None / Tiada',
];

const MALAYSIAN_STATES = [
    'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan',
    'Pahang', 'Penang', 'Perak', 'Perlis', 'Sabah',
    'Sarawak', 'Selangor', 'Terengganu', 'W.P. Kuala Lumpur',
    'W.P. Labuan', 'W.P. Putrajaya',
];

export function DynamicPlayerFields({ player, onChange, config, isCaptain }: DynamicPlayerFieldsProps) {
    const handleMedicalToggle = (condition: string) => {
        const currentMeds = player.medical_conditions || [];
        let newList = [];
        if (condition === 'None / Tiada') {
            newList = ['None / Tiada'];
        } else {
            const listWithoutNone = currentMeds.filter((c: string) => c !== 'None / Tiada');
            if (currentMeds.includes(condition)) {
                newList = listWithoutNone.filter((c: string) => c !== condition);
            } else {
                newList = [...listWithoutNone, condition];
            }
        }
        onChange('medical_conditions', newList);
    };

    if (!config) return null;

    return (
        <div className="space-y-4 mt-3 pt-3 border-t border-zinc-800/50">
            {config.requires_gender && (
                <div>
                    <label className="block text-[10px] text-zinc-500 mb-1 uppercase tracking-wider font-bold">Gender <span className="text-red-500">*</span></label>
                    <select
                        required
                        value={player.gender || ''}
                        onChange={e => onChange('gender', e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none appearance-none"
                    >
                        <option value="" disabled>Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                </div>
            )}

            {config.show_dupr && (
                <div>
                    <label className="block text-[10px] text-zinc-500 mb-1 uppercase tracking-wider font-bold">DUPR ID <span className="text-red-500">*</span></label>
                    <input type="text" required value={player.dupr_id || ''} onChange={e => onChange('dupr_id', e.target.value)} placeholder="e.g. 123456" className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" />
                </div>
            )}

            {config.show_work_school && (
                <div>
                    <label className="block text-[10px] text-zinc-500 mb-1 uppercase tracking-wider font-bold">Work/School <span className="text-red-500">*</span></label>
                    <input type="text" required value={player.work_school || ''} onChange={e => onChange('work_school', e.target.value)} placeholder="e.g. SMK Bintulu" className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" />
                </div>
            )}

            {config.show_city_state && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] text-zinc-500 mb-1 uppercase tracking-wider font-bold">City <span className="text-red-500">*</span></label>
                        <input type="text" required value={player.city || ''} onChange={e => onChange('city', e.target.value)} placeholder="City" className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-[10px] text-zinc-500 mb-1 uppercase tracking-wider font-bold">State <span className="text-red-500">*</span></label>
                        <select required value={player.state || ''} onChange={e => onChange('state', e.target.value)} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none appearance-none">
                            <option value="" disabled>State</option>
                            {MALAYSIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            )}

            {config.show_medical && (
                <div>
                    <label className="block text-[10px] text-zinc-500 mb-1 uppercase tracking-wider font-bold">Medical History <span className="text-red-500">*</span></label>
                    <div className="flex flex-wrap gap-1.5">
                        {MEDICAL_CONDITIONS.map(cond => {
                            const isSelected = (player.medical_conditions || []).includes(cond);
                            return (
                                <button key={cond} type="button" onClick={() => handleMedicalToggle(cond)} className={`px-2 py-1 rounded text-[9px] font-bold border transition-all ${isSelected ? 'bg-amber-500 text-black border-amber-500' : 'bg-zinc-900 border-zinc-700 text-zinc-400'}`}>
                                    {cond.split('/')[0].trim()}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {config.show_emergency_contact && (
                <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                    <label className="block text-[10px] text-red-400 mb-2 uppercase tracking-wider font-bold"><i className="fa-solid fa-phone-volume mr-1"/> Emergency Contact</label>
                    <div className="space-y-2">
                        <input type="text" required value={player.emergency_contact_name || ''} onChange={e => onChange('emergency_contact_name', e.target.value)} placeholder="Contact Name *" className="w-full bg-black border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:border-amber-500 outline-none" />
                        <input type="text" required value={player.emergency_contact_phone || ''} onChange={e => onChange('emergency_contact_phone', e.target.value)} placeholder="Contact Phone *" className="w-full bg-black border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:border-amber-500 outline-none" />
                        <input type="text" required value={player.emergency_contact_relationship || ''} onChange={e => onChange('emergency_contact_relationship', e.target.value)} placeholder="Relationship *" className="w-full bg-black border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:border-amber-500 outline-none" />
                    </div>
                </div>
            )}
        </div>
    );
}
