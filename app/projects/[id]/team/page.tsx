'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { PrintReportButton } from '../../components/ProjectModals';
import { PrintBreakTrigger } from '../../components/PrintBreakTrigger';
import { usePrint } from '../../components/PrintContext';

type TeamMember = {
    id: string;
    full_name: string;
    role: 'SUPER_ADMIN' | 'PROJECT_MANAGER' | 'REFEREE';
    email?: string;
    avatar_url?: string;
};

type RefereeCode = {
    id: string;
    code: string;
    is_active: boolean;
    expires_at: string | null;
};

export default function TeamManagementPage() {
    const params = useParams();
    const projectId = params.id as string;
    
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [refereeCodes, setRefereeCodes] = useState<RefereeCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInviting, setIsInviting] = useState(false);
    const [newMember, setNewMember] = useState({ email: '', role: 'PROJECT_MANAGER' });
    const [isGeneratingCode, setIsGeneratingCode] = useState(false);
    const { pageBreakIds } = usePrint();

    useEffect(() => {
        fetchTeamData();
    }, [projectId]);

    const fetchTeamData = async () => {
        setLoading(true);
        // 1. Fetch Members from project_access
        const { data: accessData, error: accessError } = await supabase
            .from('project_access')
            .select(`
                user_id,
                profiles (id, full_name, role, avatar_url)
            `)
            .eq('project_id', projectId);

        if (!accessError && accessData) {
            const formatted = accessData.map((a: any) => ({
                id: a.profiles.id,
                full_name: a.profiles.full_name || 'Unnamed Staff',
                role: a.profiles.role,
                avatar_url: a.profiles.avatar_url
            }));
            setMembers(formatted);
        }

        // 2. Fetch Referee Codes
        const { data: codes, error: codesError } = await supabase
            .from('referee_access_codes')
            .select('*')
            .eq('event_id', projectId); // Using projectId as event_id for simplicity here

        if (!codesError && codes) {
            setRefereeCodes(codes);
        }
        
        setLoading(false);
    };

    const handleInvite = async () => {
        // Mocking invite for now as we don't have a user search by email yet
        // In real app: check if user exists, then insert into profiles if needed (or assume exists), then project_access
        alert('Invitation system requires a global user search. For now, users are added via Admin Dashboard.');
        setIsInviting(false);
    };

    const generateRefereeCode = async () => {
        setIsGeneratingCode(true);
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data, error } = await supabase
            .from('referee_access_codes')
            .insert([{
                event_id: projectId,
                code: code,
                is_active: true
            }])
            .select()
            .single();

        if (!error && data) {
            setRefereeCodes([data, ...refereeCodes]);
        }
        setIsGeneratingCode(false);
    };

    const toggleCode = async (id: string, active: boolean) => {
        const { error } = await supabase
            .from('referee_access_codes')
            .update({ is_active: !active })
            .eq('id', id);
        
        if (!error) {
            setRefereeCodes(prev => prev.map(c => c.id === id ? { ...c, is_active: !active } : c));
        }
    };

    return (
        <div className="flex flex-col flex-1 animate-in fade-in duration-700">
            {/* ── Page Header + Action Bar ── */}
            <div className="print:hidden flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                <div className="flex flex-col">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0056B3] mb-2">Personnel Hub</p>
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none font-['Urbanist']">
                        Team & Security
                    </h1>
                </div>

                {/* Action Hub */}
                <div className="flex flex-wrap items-center gap-3">
                    <PrintReportButton title="Team Roster" />
                    <button 
                        onClick={() => setIsInviting(true)}
                        className="h-11 px-8 rounded-xl bg-white text-black font-black text-[10px] tracking-widest uppercase hover:bg-zinc-200 transition-all flex items-center gap-2.5 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                        <i className="fa-solid fa-user-plus text-[10px]" /> Add Member
                    </button>
                    <button 
                        onClick={generateRefereeCode}
                        disabled={isGeneratingCode}
                        className="h-11 px-8 rounded-xl bg-[#0056B3] text-white font-black text-[10px] tracking-widest uppercase shadow-[0_0_20px_rgba(0,86,179,0.3)] hover:shadow-[0_0_30px_rgba(0,86,179,0.5)] transition-all flex items-center gap-2.5 disabled:opacity-50"
                    >
                        <i className="fa-solid fa-key text-[10px]" /> {isGeneratingCode ? 'Generating...' : 'Referee Key'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* ── Team List ── */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Authorized Personnel</h2>
                        <span className="text-[9px] font-black bg-white/5 text-zinc-600 px-3 py-1 rounded-full border border-white/5 font-mono">
                            {members.length}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AnimatePresence mode="popLayout">
                            {members.length === 0 && !loading && (
                                <div className="col-span-2 py-32 border border-dashed border-white/5 rounded-[32px] bg-white/[0.02] flex flex-col items-center justify-center opacity-30">
                                    <i className="fa-solid fa-users-slash text-4xl mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">No assigned personnel</p>
                                </div>
                            )}
                            {members.map((member) => (
                                <React.Fragment key={member.id}>
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`bg-white/[0.03] border border-white/5 p-8 rounded-[32px] flex items-center gap-6 hover:border-[#0056B3]/40 transition-all group relative overflow-hidden print:bg-white print:border-zinc-200 print:text-black ${pageBreakIds.includes(member.id) ? 'print:break-before-page pt-8' : ''}`}
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-2xl font-black text-[#0056B3] overflow-hidden shadow-2xl transition-transform group-hover:scale-105 print:hidden">
                                            {member.avatar_url ? <img src={member.avatar_url} className="w-full h-full object-cover" /> : member.full_name[0]}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none mb-2 font-['Urbanist'] group-hover:text-[#4da3ff] transition-colors">{member.full_name}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[8px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest border ${
                                                    member.role === 'SUPER_ADMIN' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                                                    member.role === 'PROJECT_MANAGER' ? 'bg-[#0056B3]/10 text-[#4da3ff] border-[#0056B3]/20' : 
                                                    'bg-white/5 text-zinc-500 border-white/10'
                                                }`}>
                                                    {member.role.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                        <button className="opacity-0 group-hover:opacity-100 w-10 h-10 rounded-xl bg-red-500/5 text-red-500/30 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center print:hidden">
                                            <i className="fa-solid fa-trash-can text-sm" />
                                        </button>
                                    </motion.div>
                                    <div className="print:hidden">
                                        <PrintBreakTrigger id={member.id} />
                                    </div>
                                </React.Fragment>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* ── Referee Keys ── */}
                <div className="flex flex-col gap-8">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Referee Access Keys</h2>
                        <span className="text-[9px] font-black bg-white/5 text-zinc-600 px-3 py-1 rounded-full border border-white/5 font-mono">
                            {refereeCodes.length}
                        </span>
                    </div>

                    <div className="bg-white/[0.03] border border-white/5 rounded-[32px] p-8 space-y-8 print:bg-white print:border-zinc-200">
                        <div className="bg-[#0056B3]/5 border border-[#0056B3]/10 p-5 rounded-2xl">
                            <p className="text-[9px] text-[#4da3ff] leading-relaxed font-bold uppercase tracking-widest italic opacity-60">
                                Access keys bypass accounts for temporary tournament officials. Strategic rotation recommended.
                            </p>
                        </div>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {refereeCodes.length === 0 ? (
                                <div className="text-center py-20 opacity-10">
                                    <i className="fa-solid fa-key text-4xl mb-4" />
                                    <p className="text-[8px] font-black uppercase tracking-widest">No keys active</p>
                                </div>
                            ) : (
                                refereeCodes.map((c) => (
                                    <div key={c.id} className="flex items-center justify-between p-6 bg-zinc-900 border border-white/5 rounded-2xl hover:border-[#0056B3]/20 transition-all group">
                                        <div className="flex flex-col">
                                            <span className={`text-2xl font-mono font-black tracking-[0.2em] ${c.is_active ? 'text-white' : 'text-zinc-800'}`}>
                                                {c.code}
                                            </span>
                                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-1">Status: {c.is_active ? 'Online' : 'Revoked'}</span>
                                        </div>
                                        <button 
                                            onClick={() => toggleCode(c.id, c.is_active)}
                                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                                                c.is_active 
                                                ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white shadow-emerald-500/5' 
                                                : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white shadow-red-500/5'
                                            }`}
                                        >
                                            <i className={`fa-solid ${c.is_active ? 'fa-lock-open' : 'fa-lock'} text-base`} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Invite Modal ── */}
            <AnimatePresence>
                {isInviting && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                            onClick={() => setIsInviting(false)}
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-[#0d0d0d] border border-white/10 rounded-[40px] w-full max-w-lg p-12 relative z-10 shadow-[0_24px_80px_rgba(0,0,0,0.8)] overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                                <i className="fa-solid fa-user-shield text-[12rem]" />
                            </div>

                            <h2 className="text-4xl font-black text-white uppercase tracking-tight font-['Urbanist'] mb-10 text-center">Add Personnel</h2>
                            
                            <div className="space-y-8 relative z-10">
                                <div>
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-3 block">Network Identity (Email)</label>
                                    <input 
                                        autoFocus
                                        type="email" 
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-8 py-5 text-white font-bold focus:border-[#0056B3]/40 focus:bg-white/[0.08] outline-none transition-all placeholder:text-zinc-800"
                                        placeholder="user@ztoevent.com"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-3 block">Operational Role</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button className="flex flex-col items-center gap-2 p-6 bg-[#0056B3]/10 border-2 border-[#0056B3]/40 text-[#4da3ff] rounded-3xl transition-all">
                                            <i className="fa-solid fa-briefcase text-lg" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Project Manager</span>
                                        </button>
                                        <button className="flex flex-col items-center gap-2 p-6 bg-white/5 border-2 border-transparent text-zinc-600 rounded-3xl hover:bg-white/10 transition-all">
                                            <i className="fa-solid fa-whistle text-lg" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Referee Hub</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button 
                                        onClick={handleInvite}
                                        className="w-full h-16 bg-white text-black font-black rounded-2xl text-[11px] uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] active:scale-95"
                                    >
                                        Authorize Access
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                @media print {
                    @page { size: A4 portrait; margin: 15mm; }
                    html, body, main { background: white !important; color: black !important; }
                    .print\\:hidden, nav, header, footer, button { display: none !important; }
                    .bg-white\\/\\[0\\.03\\] { background: transparent !important; border: 1px solid #eee !important; border-radius: 12px !important; }
                    .text-white, .text-zinc-600 { color: black !important; }
                }
            `}</style>
        </div>
    );
}
