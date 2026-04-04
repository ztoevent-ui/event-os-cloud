'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

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
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                    <i className="fa-solid fa-users-gear text-9xl"></i>
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Personnel Hub</span>
                    </div>
                    <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Team & Permissions</h1>
                    <p className="text-zinc-500 text-sm mt-1 max-w-md">Manage roles, project isolation, and tournament officials.</p>
                </div>

                <div className="flex gap-4 mt-6 md:mt-0 relative z-10">
                    <button 
                        onClick={() => setIsInviting(true)}
                        className="px-8 py-3 bg-white text-black font-black rounded-2xl text-[11px] uppercase tracking-widest hover:bg-zinc-200 transition-all transform hover:scale-105 shadow-xl shadow-white/5"
                    >
                        + Add Member
                    </button>
                    <button 
                        onClick={generateRefereeCode}
                        disabled={isGeneratingCode}
                        className="px-8 py-3 bg-amber-500 text-black font-black rounded-2xl text-[11px] uppercase tracking-widest hover:bg-amber-400 transition-all transform hover:scale-105 shadow-xl shadow-amber-500/20 disabled:opacity-50"
                    >
                        {isGeneratingCode ? 'Generating...' : 'New Referee Code'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Team List */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-600 ml-4">Current Staff</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AnimatePresence mode="popLayout">
                            {members.length === 0 && !loading && (
                                <div className="col-span-2 p-12 text-center border-2 border-dashed border-zinc-800 rounded-[2rem] text-zinc-600 italic uppercase text-[10px] font-black tracking-widest">
                                    No direct members assigned. Owner has full access.
                                </div>
                            )}
                            {members.map((member) => (
                                <motion.div 
                                    key={member.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-zinc-900 border border-white/5 p-6 rounded-3xl flex items-center gap-5 hover:border-white/10 transition-all group"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center text-2xl font-black text-amber-500 overflow-hidden shadow-2xl transition-transform group-hover:scale-105">
                                        {member.avatar_url ? <img src={member.avatar_url} className="w-full h-full object-cover" /> : member.full_name[0]}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-black text-white text-lg tracking-tight leading-none mb-1">{member.full_name}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${
                                                member.role === 'SUPER_ADMIN' ? 'bg-purple-500/10 text-purple-500' : 
                                                member.role === 'PROJECT_MANAGER' ? 'bg-amber-500/10 text-amber-500' : 
                                                'bg-zinc-500/10 text-zinc-500'
                                            }`}>
                                                {member.role.replace('_', ' ')}
                                            </span>
                                            {member.role === 'PROJECT_MANAGER' && <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter underline decoration-zinc-800">Isolated Access</span>}
                                        </div>
                                    </div>
                                    <button className="opacity-0 group-hover:opacity-100 p-3 text-zinc-600 hover:text-red-500 transition-all">
                                        <i className="fa-solid fa-trash-can"></i>
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Referee Access Codes */}
                <div className="space-y-6">
                    <h2 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-600 ml-4">Referee Quick Codes</h2>
                    <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                        <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-2xl">
                            <p className="text-[10px] text-amber-500 leading-relaxed font-bold uppercase tracking-wider italic">
                                codes allow temporary, account-free access to the Referee Dashboard for this event. Expiring codes recommended for BPO 2026.
                            </p>
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {refereeCodes.length === 0 && (
                                <div className="text-center py-10 text-zinc-700 text-[10px] font-black uppercase tracking-widest">
                                    No active codes
                                </div>
                            )}
                            {refereeCodes.map((c) => (
                                <div key={c.id} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                                    <div className="flex flex-col">
                                        <span className={`text-xl font-mono font-black tracking-widest ${c.is_active ? 'text-white' : 'text-zinc-700'}`}>
                                            {c.code}
                                        </span>
                                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Active Status</span>
                                    </div>
                                    <button 
                                        onClick={() => toggleCode(c.id, c.is_active)}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                            c.is_active ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                        }`}
                                    >
                                        <i className={`fa-solid ${c.is_active ? 'fa-toggle-on' : 'fa-toggle-off'} text-xl`}></i>
                                    </button>
                                </div>
                            ))}
                        </div>

                        {refereeCodes.length > 0 && (
                            <div className="pt-4 border-t border-white/5 mt-4">
                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                    <span>Total Session Keys</span>
                                    <span>{refereeCodes.length}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Invite Modal Mockup */}
            <AnimatePresence>
                {isInviting && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setIsInviting(false)}
                        ></motion.div>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-zinc-900 border border-white/10 rounded-[2.5rem] w-full max-w-md p-10 relative z-10 shadow-3xl"
                        >
                            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-8 text-center">Add Staff Member</h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">User Email</label>
                                    <input 
                                        autoFocus
                                        type="email" 
                                        className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-white font-bold focus:border-amber-500 outline-none transition-all"
                                        placeholder="user@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Assigned Role</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button className="p-4 bg-amber-500/10 border-2 border-amber-500 text-amber-500 rounded-2xl text-[10px] font-black uppercase tracking-widest">PM (Isolated)</button>
                                        <button className="p-4 bg-zinc-800 border-2 border-transparent text-zinc-500 rounded-2xl text-[10px] font-black uppercase tracking-widest">Referee</button>
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <button 
                                        onClick={handleInvite}
                                        className="w-full py-5 bg-white text-black font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl shadow-white/5"
                                    >
                                        Send Invitation
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
