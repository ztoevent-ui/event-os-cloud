'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

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

type PlayerForm = {
    full_name: string;
    ic_number: string;
    phone: string;
    dupr_id: string;
    email: string;
    medical_conditions: string[];
    city: string;
    state: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    emergency_contact_relationship: string;
};

const emptyPlayer = (): PlayerForm => ({
    full_name: '', ic_number: '', phone: '', dupr_id: '', email: '',
    medical_conditions: [], city: '', state: '',
    emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relationship: '',
});

export default function BPORegistrationPage() {
    const [step, setStep] = useState(1);
    const [teamName, setTeamName] = useState('');
    const [averageDupr, setAverageDupr] = useState('');
    const [captain, setCaptain] = useState<PlayerForm>(emptyPlayer());
    const [partner, setPartner] = useState<PlayerForm>(emptyPlayer());
    const [agreedTerms, setAgreedTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [successData, setSuccessData] = useState<any>(null);

    const toggleMedical = (player: 'captain' | 'partner', condition: string) => {
        const setter = player === 'captain' ? setCaptain : setPartner;
        const current = player === 'captain' ? captain : partner;
        const list = current.medical_conditions.includes(condition)
            ? current.medical_conditions.filter(c => c !== condition)
            : [...current.medical_conditions.filter(c => c !== 'None / Tiada'), condition];
        // If selecting "None", clear all others
        if (condition === 'None / Tiada') {
            setter({ ...current, medical_conditions: ['None / Tiada'] });
        } else {
            setter({ ...current, medical_conditions: list });
        }
    };

    const handleSubmit = async () => {
        if (!agreedTerms) return;
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('bpo_registrations')
                .insert([{
                    team_name: teamName,
                    average_dupr: parseFloat(averageDupr) || 0,
                    captain_name: captain.full_name,
                    captain_ic: captain.ic_number,
                    captain_phone: captain.phone,
                    captain_dupr_id: captain.dupr_id,
                    captain_email: captain.email,
                    captain_medical: captain.medical_conditions,
                    captain_city: captain.city,
                    captain_state: captain.state,
                    captain_emergency_name: captain.emergency_contact_name,
                    captain_emergency_phone: captain.emergency_contact_phone,
                    captain_emergency_relationship: captain.emergency_contact_relationship,
                    partner_name: partner.full_name,
                    partner_ic: partner.ic_number,
                    partner_phone: partner.phone,
                    partner_dupr_id: partner.dupr_id,
                    partner_medical: partner.medical_conditions,
                    partner_city: partner.city,
                    partner_state: partner.state,
                    partner_emergency_name: partner.emergency_contact_name,
                    partner_emergency_phone: partner.emergency_contact_phone,
                    partner_emergency_relationship: partner.emergency_contact_relationship,
                    status: 'pending_payment',
                }])
                .select()
                .single();

            if (error) throw error;
            setSuccessData(data);
        } catch (err: any) {
            import('sweetalert2').then(Swal => {
                Swal.default.fire({ title: 'Error', text: err.message, icon: 'error', background: '#18181b', color: '#fff' });
            });
        } finally {
            setLoading(false);
        }
    };

    // --- SUCCESS SCREEN ---
    if (successData) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08),transparent_70%)]">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-lg w-full bg-zinc-900 border border-amber-500/30 rounded-[2.5rem] p-12 text-center shadow-[0_0_100px_rgba(245,158,11,0.1)]">
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                        <i className="fa-solid fa-check text-black text-3xl" />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Registration Submitted!</h2>
                    <p className="text-zinc-400 text-sm mb-8">Your team <span className="text-amber-500 font-bold">{teamName}</span> has been registered for BPO 2026.</p>
                    
                    <div className="bg-black/50 border border-white/5 rounded-2xl p-6 mb-4 text-left space-y-2">
                        <div className="flex justify-between"><span className="text-zinc-500 text-xs uppercase tracking-widest">Captain</span><span className="text-white font-bold text-sm">{captain.full_name}</span></div>
                        <div className="flex justify-between"><span className="text-zinc-500 text-xs uppercase tracking-widest">Partner</span><span className="text-white font-bold text-sm">{partner.full_name}</span></div>
                        <div className="flex justify-between"><span className="text-zinc-500 text-xs uppercase tracking-widest">Avg DUPR</span><span className="text-amber-500 font-black text-sm">{averageDupr}</span></div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-8">
                        <p className="text-amber-500 text-xs font-bold uppercase tracking-widest">⏳ Payment Gateway Coming Soon</p>
                        <p className="text-zinc-500 text-[10px] mt-1">You will be notified when payment is ready.</p>
                    </div>

                    <Link href="/" className="block w-full py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest hover:bg-amber-500 transition-all text-center">Back to Home</Link>
                </motion.div>
            </div>
        );
    }

    // --- PLAYER FORM SECTION ---
    const PlayerSection = ({ title, role, data, setData }: { title: string; role: 'captain' | 'partner'; data: PlayerForm; setData: React.Dispatch<React.SetStateAction<PlayerForm>> }) => (
        <div className="space-y-5">
            <h3 className="text-lg font-black uppercase tracking-widest text-amber-500 flex items-center gap-3">
                <i className={`fa-solid ${role === 'captain' ? 'fa-crown' : 'fa-user'}`} />
                {title}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full Name (as per IC)" required value={data.full_name} onChange={v => setData({...data, full_name: v})} placeholder="JOHN DOE BIN ALI" />
                <Field label="IC / Passport Number" required value={data.ic_number} onChange={v => setData({...data, ic_number: v})} placeholder="901234-12-5678" />
                <Field label="Phone Number" required value={data.phone} onChange={v => setData({...data, phone: v})} placeholder="+60123456789" />
                <Field label="DUPR ID" required value={data.dupr_id} onChange={v => setData({...data, dupr_id: v})} placeholder="e.g. 12345678" />
                {role === 'captain' && (
                    <div className="md:col-span-2">
                        <Field label="Contact Email (Captain)" required value={data.email} onChange={v => setData({...data, email: v})} placeholder="captain@email.com" type="email" />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="City" required value={data.city} onChange={v => setData({...data, city: v})} placeholder="e.g. Bintulu" />
                <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">State <span className="text-red-500">*</span></label>
                    <select value={data.state} onChange={e => setData({...data, state: e.target.value})} required className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-all font-bold appearance-none cursor-pointer text-sm">
                        <option value="">Select State</option>
                        {MALAYSIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {/* Medical History */}
            <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3">Medical History <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                    {MEDICAL_CONDITIONS.map(cond => (
                        <button key={cond} type="button" onClick={() => toggleMedical(role, cond)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${data.medical_conditions.includes(cond) ? 'bg-amber-500 text-black border-amber-500' : 'bg-zinc-900 text-zinc-400 border-white/10 hover:border-amber-500/50'}`}
                        >{cond}</button>
                    ))}
                </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
                <label className="block text-[10px] font-black text-red-400 uppercase tracking-[0.2em] mb-4"><i className="fa-solid fa-phone-volume mr-2" />Emergency Contact</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Name" required value={data.emergency_contact_name} onChange={v => setData({...data, emergency_contact_name: v})} placeholder="Emergency contact name" small />
                    <Field label="Phone" required value={data.emergency_contact_phone} onChange={v => setData({...data, emergency_contact_phone: v})} placeholder="+60123456789" small />
                    <Field label="Relationship" required value={data.emergency_contact_relationship} onChange={v => setData({...data, emergency_contact_relationship: v})} placeholder="e.g. Spouse, Parent" small />
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white selection:bg-amber-500 selection:text-black">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-600 blur-[150px] rounded-full opacity-30" />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <span className="inline-block px-4 py-1 bg-amber-500 text-black text-[9px] font-black uppercase tracking-[0.4em] rounded-full mb-6">Official Registration</span>
                    <h1 className="text-6xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4">
                        BPO <span className="text-amber-500 italic">2026</span>
                    </h1>
                    <p className="text-zinc-500 max-w-md mx-auto">Borneo Pickleball Open — Team Registration Portal</p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-3 mb-12">
                    {[1, 2, 3].map(s => (
                        <div key={s} className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all ${step >= s ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-600 border border-white/10'}`}>
                                {step > s ? <i className="fa-solid fa-check" /> : s}
                            </div>
                            {s < 3 && <div className={`w-16 h-0.5 ${step > s ? 'bg-amber-500' : 'bg-zinc-800'}`} />}
                        </div>
                    ))}
                </div>

                <form onSubmit={e => { e.preventDefault(); }} className="space-y-10">
                    <AnimatePresence mode="wait">
                        {/* --- STEP 1: TEAM INFO --- */}
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="bg-zinc-950 border border-white/5 rounded-[2rem] p-8 md:p-10 space-y-8">
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-widest mb-1">Team Information</h2>
                                    <p className="text-zinc-500 text-sm">Every team consists of 1 Captain + 1 Partner.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Field label="Team Name" required value={teamName} onChange={setTeamName} placeholder="e.g. Borneo Smashers" />
                                    <Field label="Team Average DUPR" required value={averageDupr} onChange={setAverageDupr} placeholder="e.g. 3.75" type="number" />
                                </div>

                                <div className="border-t border-white/5 pt-8">
                                    <PlayerSection title="Captain" role="captain" data={captain} setData={setCaptain} />
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button type="button" onClick={() => setStep(2)} className="px-10 py-4 bg-amber-500 text-black rounded-2xl font-black uppercase tracking-widest hover:bg-amber-400 transition-all active:scale-95 shadow-xl shadow-amber-500/20">
                                        Next: Partner Info <i className="fa-solid fa-arrow-right ml-3" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* --- STEP 2: PARTNER INFO --- */}
                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="bg-zinc-950 border border-white/5 rounded-[2rem] p-8 md:p-10 space-y-8">
                                <PlayerSection title="Partner" role="partner" data={partner} setData={setPartner} />

                                <div className="flex justify-between pt-4">
                                    <button type="button" onClick={() => setStep(1)} className="px-8 py-4 bg-zinc-900 text-zinc-400 rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-800 transition-all">
                                        <i className="fa-solid fa-arrow-left mr-3" /> Back
                                    </button>
                                    <button type="button" onClick={() => setStep(3)} className="px-10 py-4 bg-amber-500 text-black rounded-2xl font-black uppercase tracking-widest hover:bg-amber-400 transition-all active:scale-95 shadow-xl shadow-amber-500/20">
                                        Next: Review <i className="fa-solid fa-arrow-right ml-3" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* --- STEP 3: REVIEW + T&C --- */}
                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                                {/* Summary */}
                                <div className="bg-zinc-950 border border-white/5 rounded-[2rem] p-8 md:p-10 space-y-6">
                                    <h2 className="text-2xl font-black uppercase tracking-widest mb-2">Review Your Registration</h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <SummaryCard title="Team" items={[['Team Name', teamName], ['Avg DUPR', averageDupr]]} />
                                        <SummaryCard title="Captain" items={[['Name', captain.full_name], ['IC', captain.ic_number], ['Phone', captain.phone], ['DUPR ID', captain.dupr_id], ['Email', captain.email], ['From', `${captain.city}, ${captain.state}`]]} />
                                        <SummaryCard title="Partner" items={[['Name', partner.full_name], ['IC', partner.ic_number], ['Phone', partner.phone], ['DUPR ID', partner.dupr_id], ['From', `${partner.city}, ${partner.state}`]]} />
                                        <SummaryCard title="Emergency Contacts" items={[
                                            [`Capt: ${captain.emergency_contact_name}`, `${captain.emergency_contact_phone} (${captain.emergency_contact_relationship})`],
                                            [`Part: ${partner.emergency_contact_name}`, `${partner.emergency_contact_phone} (${partner.emergency_contact_relationship})`],
                                        ]} />
                                    </div>
                                </div>

                                {/* Terms & Conditions */}
                                <div className="bg-zinc-950 border border-white/5 rounded-[2rem] p-8 md:p-10">
                                    <h3 className="text-lg font-black uppercase tracking-widest mb-4 text-amber-500">Terms & Conditions</h3>
                                    <div className="max-h-48 overflow-y-auto bg-black/50 rounded-xl p-6 border border-white/5 text-zinc-400 text-xs leading-relaxed space-y-3 mb-6">
                                        <p>1. By registering, both players acknowledge that Pickleball is a physical sport and accept full responsibility for any injuries sustained during the tournament.</p>
                                        <p>2. Players must present a valid IC/Passport for identity verification during check-in. Failure to do so may result in disqualification.</p>
                                        <p>3. All DUPR IDs provided must be valid and verifiable. Falsified DUPR ratings will result in immediate disqualification.</p>
                                        <p>4. The organizer reserves the right to change the tournament schedule, format, or rules at any time without prior notice.</p>
                                        <p>5. Registration fees are non-refundable once payment is confirmed, unless the tournament is cancelled by the organizer.</p>
                                        <p>6. Players consent to the use of their name, likeness, and photographs for promotional purposes related to BPO 2026.</p>
                                        <p>7. The organizer is not liable for any loss of personal belongings during the tournament.</p>
                                        <p>8. All players must adhere to the official BPO Code of Conduct. Unsportsmanlike behavior will result in penalties or disqualification.</p>
                                        <p>9. Medical information provided will be kept confidential and used solely for emergency purposes during the event.</p>
                                        <p>10. By submitting this form, both the Captain and Partner confirm that all information provided is accurate and complete.</p>
                                    </div>

                                    <label className="flex items-center gap-4 cursor-pointer group">
                                        <div onClick={() => setAgreedTerms(!agreedTerms)} className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${agreedTerms ? 'bg-amber-500 border-amber-500' : 'border-zinc-700 group-hover:border-amber-500/50'}`}>
                                            {agreedTerms && <i className="fa-solid fa-check text-black text-sm" />}
                                        </div>
                                        <span className="text-sm text-zinc-300 font-bold">I, <span className="text-amber-500">{captain.full_name || 'Captain'}</span>, confirm that both myself and my partner have read and agreed to the Terms & Conditions above.</span>
                                    </label>
                                </div>

                                <div className="flex justify-between pt-2">
                                    <button type="button" onClick={() => setStep(2)} className="px-8 py-4 bg-zinc-900 text-zinc-400 rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-800 transition-all">
                                        <i className="fa-solid fa-arrow-left mr-3" /> Back
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={handleSubmit} 
                                        disabled={!agreedTerms || loading}
                                        className="px-12 py-4 bg-amber-500 text-black rounded-2xl font-black uppercase tracking-widest hover:bg-amber-400 transition-all active:scale-95 shadow-xl shadow-amber-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        {loading ? <><i className="fa-solid fa-spinner fa-spin mr-3" />Processing...</> : <>Submit Registration <i className="fa-solid fa-paper-plane ml-3" /></>}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>

                <div className="mt-16 text-center">
                    <Link href="/" className="text-[9px] font-black text-zinc-700 uppercase tracking-widest hover:text-white transition-colors">← Return to ZTO Event OS</Link>
                </div>
            </div>
        </div>
    );
}

// --- REUSABLE COMPONENTS ---

function Field({ label, value, onChange, placeholder, required, type = 'text', small }: {
    label: string; value: string; onChange: (v: string) => void; placeholder: string; required?: boolean; type?: string; small?: boolean;
}) {
    return (
        <div>
            <label className={`block font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 ${small ? 'text-[9px]' : 'text-[10px]'}`}>{label} {required && <span className="text-red-500">*</span>}</label>
            <input
                type={type}
                required={required}
                value={value}
                onChange={e => onChange(e.target.value)}
                className={`w-full bg-zinc-900 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-amber-500 transition-all font-bold placeholder:text-zinc-700 text-sm ${small ? 'py-2.5' : 'py-3'}`}
                placeholder={placeholder}
                step={type === 'number' ? '0.01' : undefined}
            />
        </div>
    );
}

function SummaryCard({ title, items }: { title: string; items: [string, string][] }) {
    return (
        <div className="bg-black/50 border border-white/5 rounded-2xl p-5 space-y-2">
            <div className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-3">{title}</div>
            {items.map(([k, v], i) => (
                <div key={i} className="flex justify-between gap-4">
                    <span className="text-zinc-600 text-xs shrink-0">{k}</span>
                    <span className="text-white font-bold text-xs text-right truncate">{v || '—'}</span>
                </div>
            ))}
        </div>
    );
}
