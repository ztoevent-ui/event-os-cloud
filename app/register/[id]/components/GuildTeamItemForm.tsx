'use client';

import { useState } from 'react';
import Swal from 'sweetalert2';
import { uploadICFile } from '@/app/actions/tournament-actions';
import { supabase } from '@/lib/supabaseClient';
import { DynamicPlayerFields } from './DynamicPlayerFields';

const CATEGORIES = ['男双 A (MD A)', '男双 B (MD B)', '女双 A (WD A)', '女双 B (WD B)', '宿将组 (Veterans)'];

type FormProps = {
    projectId: string;
    config: any;
    onSuccess?: () => void;
};

export function GuildTeamItemForm({ projectId, config, onSuccess }: FormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [organizationName, setOrganizationName] = useState('');
    const [captain, setCaptain] = useState<any>({ name: '', ic: '', role: '', file: null });
    
    // Players Tracker (5 pairs = 10 players)
    const [pairs, setPairs] = useState<any[]>(
        Array(5).fill(null).map((_, i) => ({
            id: i,
            category: '',
            player1: { name: '', ic: '', file: null },
            player2: { name: '', ic: '', file: null },
        }))
    );

    const getAvailableCategories = (currentPairId: number) => {
        const usedCategories = pairs.filter(p => p.id !== currentPairId).map(p => p.category).filter(Boolean);
        return CATEGORIES.filter(c => !usedCategories.includes(c));
    };

    const handlePairChange = (pairId: number, field: string, value: any, playerIndex?: 1 | 2) => {
        setPairs(prev => prev.map(pair => {
            if (pair.id === pairId) {
                if (playerIndex) {
                    return {
                        ...pair,
                        [`player${playerIndex}`]: { ...pair[`player${playerIndex}` as 'player1' | 'player2'], [field]: value }
                    };
                }
                return { ...pair, [field]: value };
            }
            return pair;
        }));
    };

    const handlePlayerDetailsChange = (pairId: number, playerIndex: 1 | 2, field: string, value: any) => {
        setPairs(prev => prev.map(pair => {
            if (pair.id === pairId) {
                const targetPlayer = pair[`player${playerIndex}` as 'player1' | 'player2'];
                return {
                    ...pair,
                    [`player${playerIndex}`]: { ...targetPlayer, [field]: value }
                };
            }
            return pair;
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic Validation
        if (!organizationName || !captain.name || !captain.ic || !captain.file) {
            Swal.fire('Incomplete', 'Please fill in all organization and captain details including IC upload.', 'warning');
            return;
        }

        const unselectedCategory = pairs.some(p => !p.category);
        if (unselectedCategory) {
            Swal.fire('Incomplete', 'Please select a category for all 5 pairs.', 'warning');
            return;
        }

        const missingPlayerInfo = pairs.some(p => 
            !p.player1.name || !p.player1.ic || !p.player1.file || 
            !p.player2.name || !p.player2.ic || !p.player2.file
        );
        if (missingPlayerInfo) {
            Swal.fire('Incomplete', 'Please complete all player details and upload ICs for all 10 players.', 'warning');
            return;
        }

        if (config.fields_config?.requires_gender) {
            if (!captain.gender) return Swal.fire('Incomplete', 'Please select a gender for the Captain.', 'warning');
            if (pairs.some(p => !p.player1.gender || !p.player2.gender)) return Swal.fire('Incomplete', 'Please select a gender for all players.', 'warning');
        }

        setIsSubmitting(true);
        Swal.fire({ title: 'Uploading & Submitting...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        try {
            // Upload Captain IC
            const capData = new FormData();
            capData.append('file', captain.file!);
            capData.append('project_id', projectId);
            const capUpload = await uploadICFile(capData);
            if (!capUpload.success) throw new Error('Captain IC upload failed');

            // Upload Player ICs & Formatting
            const playersData = [];
            for (const pair of pairs) {
                // Player 1
                const p1Data = new FormData();
                p1Data.append('file', pair.player1.file!);
                p1Data.append('project_id', projectId);
                const p1Upload = await uploadICFile(p1Data);
                if (!p1Upload.success) throw new Error(`Player ${pair.player1.name} IC upload failed`);
                
                const { file: f1, ...p1Details } = pair.player1;
                playersData.push({
                    ...p1Details,
                    ic_url: p1Upload.url, 
                    category: pair.category, 
                    pair_id: pair.id
                });

                // Player 2
                const p2Data = new FormData();
                p2Data.append('file', pair.player2.file!);
                p2Data.append('project_id', projectId);
                const p2Upload = await uploadICFile(p2Data);
                if (!p2Upload.success) throw new Error(`Player ${pair.player2.name} IC upload failed`);
                
                const { file: f2, ...p2Details } = pair.player2;
                playersData.push({
                    ...p2Details,
                    ic_url: p2Upload.url, 
                    category: pair.category, 
                    pair_id: pair.id
                });
            }

            // Insert Database Record
            const { error } = await supabase.from('tournament_registrations').insert({
                project_id: projectId,
                organization_name: organizationName,
                captain_name: captain.name,
                captain_ic: captain.ic,
                captain_role: captain.role,
                captain_ic_url: capUpload.url,
                captain_gender: captain.gender || null, // Special field added
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

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Organization & Captain */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl shadow-xl">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">1</div>
                    <h2 className="text-xl font-black text-white uppercase tracking-widest">Organization & Captain Form</h2>
                </div>
                
                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">参赛公会全称 (Organization Name) *</label>
                        <input type="text" required value={organizationName} onChange={e => setOrganizationName(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" placeholder="Enter Full Organization Name" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">领队名字 (Captain Name) *</label>
                            <input type="text" required value={captain.name} onChange={e => setCaptain({...captain, name: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">身分证号 (IC Number) *</label>
                            <input type="text" required value={captain.ic} onChange={e => setCaptain({...captain, ic: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" placeholder="XXXXXX-XX-XXXX" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">公会职务 (Role in Org) *</label>
                            <input type="text" required value={captain.role} onChange={e => setCaptain({...captain, role: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" placeholder="e.g. Chairman, Secretary" />
                        </div>
                        <div>
                            <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">上传 IC (Upload IC) *</label>
                            <input type="file" required accept="image/*" onChange={e => setCaptain({...captain, file: e.target.files?.[0] || null})} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-white file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-amber-500/10 file:text-amber-500 hover:file:bg-amber-500/20" />
                        </div>
                    </div>

                    {/* Dynamic Fields */}
                    <DynamicPlayerFields
                        player={captain}
                        onChange={(f, v) => setCaptain({ ...captain, [f]: v })}
                        config={config.fields_config}
                        isCaptain={true}
                    />
                </div>
            </div>

            {/* 5 Pairs Configuration */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl shadow-xl">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">2</div>
                    <h2 className="text-xl font-black text-white uppercase tracking-widest">Team Setup (5 Matches)</h2>
                </div>
                <p className="text-xs text-amber-500 mb-8 border border-amber-500/30 bg-amber-500/5 p-4 rounded-xl">
                    Each team match is best of 5. You must assign 5 distinct pairs for: MD A, MD B, WD A, WD B, and Veterans.
                </p>

                <div className="space-y-12">
                    {pairs.map((pair, index) => (
                        <div key={pair.id} className="relative pl-4 md:pl-8 border-l-2 border-zinc-800">
                            <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-black border-2 border-zinc-800 text-zinc-500 flex items-center justify-center font-bold text-xs">P{index + 1}</div>
                            
                            <div className="mb-6">
                                <label className="block text-xs font-black tracking-widest uppercase text-amber-500 mb-2">选参赛项目 (Select Match Category) *</label>
                                <select 
                                    required
                                    value={pair.category}
                                    onChange={e => handlePairChange(pair.id, 'category', e.target.value)}
                                    className="w-full bg-black border border-amber-900/50 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none appearance-none font-bold"
                                >
                                    <option value="" disabled>Select a Category...</option>
                                    <option value={pair.category} className="hidden">{pair.category}</option>
                                    {getAvailableCategories(pair.id).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-black/30 p-4 rounded-2xl border border-zinc-800/50">
                                {/* Player 1 */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-white border-b border-zinc-800 pb-2">Player 1</h4>
                                    <div>
                                        <input type="text" required placeholder="Name *" value={pair.player1.name || ''} onChange={e => handlePlayerDetailsChange(pair.id, 1, 'name', e.target.value)} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none mb-3" />
                                        <input type="text" required placeholder="IC Number *" value={pair.player1.ic || ''} onChange={e => handlePlayerDetailsChange(pair.id, 1, 'ic', e.target.value)} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none mb-3" />
                                        
                                        <label className="block text-[10px] text-zinc-500 mb-1 uppercase tracking-wider font-bold">Upload IC</label>
                                        <input type="file" required accept="image/*" onChange={e => handlePlayerDetailsChange(pair.id, 1, 'file', e.target.files?.[0] || null)} className="w-full text-xs text-zinc-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-zinc-800 file:text-zinc-300" />
                                        
                                        <DynamicPlayerFields player={pair.player1} onChange={(f, v) => handlePlayerDetailsChange(pair.id, 1, f, v)} config={config.fields_config} />
                                    </div>
                                </div>
                                {/* Player 2 */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-white border-b border-zinc-800 pb-2">Player 2</h4>
                                    <div>
                                        <input type="text" required placeholder="Name *" value={pair.player2.name || ''} onChange={e => handlePlayerDetailsChange(pair.id, 2, 'name', e.target.value)} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none mb-3" />
                                        <input type="text" required placeholder="IC Number *" value={pair.player2.ic || ''} onChange={e => handlePlayerDetailsChange(pair.id, 2, 'ic', e.target.value)} className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none mb-3" />
                                        
                                        <label className="block text-[10px] text-zinc-500 mb-1 uppercase tracking-wider font-bold">Upload IC</label>
                                        <input type="file" required accept="image/*" onChange={e => handlePlayerDetailsChange(pair.id, 2, 'file', e.target.files?.[0] || null)} className="w-full text-xs text-zinc-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-zinc-800 file:text-zinc-300" />
                                        
                                        <DynamicPlayerFields player={pair.player2} onChange={(f, v) => handlePlayerDetailsChange(pair.id, 2, f, v)} config={config.fields_config} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
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
