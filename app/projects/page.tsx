'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ProjectsPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const router = useRouter();

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        type: 'corporate',
        start_date: '',
        end_date: '',
        venue: '',
    });

    const deleteProject = async (e: React.MouseEvent, projectId: string, projectName: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm(`确定要删除 "${projectName}" 吗？此操作无法撤销。`)) return;
        const { error } = await supabase.from('projects').delete().eq('id', projectId);
        if (error) {
            alert('删除失败: ' + error.message);
        } else {
            setProjects(prev => prev.filter(p => p.id !== projectId));
        }
    };

    const createProject = async () => {
        if (!formData.name.trim()) { alert('请输入活动名称'); return; }
        setCreating(true);
        const { data, error } = await supabase.from('projects').insert({
            name: formData.name.trim(),
            type: formData.type,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            venue: formData.venue || null,
            status: 'planning',
        }).select().single();

        if (error) {
            alert('创建失败: ' + error.message);
            setCreating(false);
        } else {
            setShowModal(false);
            setFormData({ name: '', type: 'corporate', start_date: '', end_date: '', venue: '' });
            setCreating(false);
            router.push(`/projects/${data.id}`);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching projects:', error);
        } else {
            setProjects(data || []);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#050505] p-6 lg:p-10 font-urbanist text-white page-transition">
            {/* Header */}
            <header className="max-w-[1400px] mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight uppercase">Event Manager</h1>
                    <p className="zto-card-desc mt-1 text-sm tracking-wide">Oversee and coordinate active deployments.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Link href="/dashboard" className="flex-1 md:flex-none text-center px-4 py-2.5 rounded-[12px] text-xs font-bold uppercase tracking-widest text-zinc-400 border border-white/10 hover:bg-white/5 hover:text-white transition-all">
                        <i className="fa-solid fa-arrow-left mr-2"></i> Dashboard
                    </Link>
                    <button
                        onClick={() => setShowModal(true)}
                        className="zto-btn-glow flex-1 md:flex-none text-xs uppercase tracking-widest"
                    >
                        <i className="fa-solid fa-plus mr-2"></i> Deploy Event
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-[1400px] mx-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 opacity-50">
                        <div className="w-12 h-12 border-2 border-[#0056B3]/30 border-t-[#0056B3] rounded-full animate-spin mb-4"></div>
                        <p className="text-[#0056B3] font-bold uppercase tracking-[0.2em] text-xs">Synchronizing Nodes...</p>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="zto-card text-center flex flex-col items-center max-w-2xl mx-auto mt-10">
                        <div className="w-16 h-16 bg-[#0056B3]/10 border border-[#0056B3]/20 rounded-[16px] flex items-center justify-center text-[#0056B3] text-2xl mb-6">
                            <i className="fa-solid fa-layer-group"></i>
                        </div>
                        <h3 className="zto-card-title text-xl mb-2 uppercase tracking-wide">No Active Deployments</h3>
                        <p className="zto-card-desc mb-8 max-w-sm text-sm">Initialize your first event project to orchestrate tasks, coordinate vendors, and deploy operations.</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="zto-btn-glow text-xs uppercase tracking-widest"
                        >
                            <i className="fa-solid fa-bolt mr-2"></i> Initialize Project
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 auto-rows-fr">
                        {projects.map((project) => (
                            <Link key={project.id} href={`/projects/${project.id}`} className="group block h-full">
                                <article className="zto-card transition-all duration-300 hover:border-[#0056B3]/80 hover:bg-[#050505] hover:-translate-y-1.5 relative flex flex-col h-full overflow-hidden">
                                    {/* Hover Glow */}
                                    <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-[#0056B3] blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-500" />

                                    {/* Top Row: Icon & Status */}
                                    <div className="flex justify-between items-start mb-6 relative z-10">
                                        <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center text-lg border transition-all ${project.type === 'wedding' || project.type === 'wedding_fair' ? 'bg-[#ec4899]/10 text-[#ec4899] border-[#ec4899]/20 group-hover:bg-[#ec4899] group-hover:text-[#ffffff]' : project.type === 'corporate' ? 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20 group-hover:bg-[#3b82f6] group-hover:text-[#ffffff]' : 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20 group-hover:bg-[#10b981] group-hover:text-[#ffffff]'}`}>
                                            <i className={`fa-regular ${project.type === 'wedding' || project.type === 'wedding_fair' ? 'fa-heart' : project.type === 'corporate' ? 'fa-building' : 'fa-calendar-check'}`}></i>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0056B3]/10 border border-[#0056B3]/30 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] text-[#6BB8FF] group-hover:border-[#0056B3]/60 group-hover:bg-[#0056B3]/20 group-hover:text-white transition-all">
                                            <span className={`w-1.5 h-1.5 rounded-full ${project.status === 'completed' ? 'bg-zinc-600' : 'bg-[#DEFF9A] animate-pulse shadow-[0_0_8px_#DEFF9A]'}`}></span>
                                            {project.status || 'PLANNING'}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h3 className="zto-card-title text-xl mb-4 leading-snug group-hover:text-[#4da3ff] transition-colors line-clamp-2 relative z-10">
                                        {project.name}
                                    </h3>

                                    {/* Meta info */}
                                    <div className="space-y-2 mt-auto relative z-10">
                                        <div className="flex items-center text-xs font-urbanist zto-card-data group-hover:text-[#DEFF9A] transition-colors">
                                            <i className="fa-regular fa-clock w-5 text-white/40"></i>
                                            {project.start_date ? new Date(project.start_date).toLocaleDateString('en-GB') : 'TBD'}
                                        </div>
                                        {project.venue && (
                                            <div className="flex items-center text-xs font-urbanist zto-card-desc group-hover:text-white transition-colors truncate">
                                                <i className="fa-solid fa-location-crosshairs w-5 text-white/40"></i>
                                                <span className="truncate">{project.venue}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Bottom Row */}
                                    <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between relative z-10">
                                        <button
                                            onClick={(e) => deleteProject(e, project.id, project.name)}
                                            className="w-8 h-8 flex items-center justify-center rounded-[8px] text-zinc-600 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 border border-transparent transition-all"
                                            title="Terminate Project"
                                        >
                                            <i className="fa-regular fa-trash-can text-xs"></i>
                                        </button>
                                        
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest group-hover:text-[#0056B3] transition-colors">Enter</span>
                                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center group-hover:bg-[#0056B3] group-hover:border-[#0056B3] transition-all shadow-sm">
                                                <i className="fa-solid fa-arrow-right -rotate-45 text-xs group-hover:rotate-0 transition-transform duration-300"></i>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Event Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-md" onClick={() => setShowModal(false)}></div>

                    <div className="relative zto-card w-full max-w-lg animate-[fadeIn_0.2s_ease-out]">
                        <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-[8px] bg-white/5 text-zinc-400 border border-white/5 hover:text-white hover:border-[#222] transition-all">
                            <i className="fa-solid fa-xmark text-sm"></i>
                        </button>

                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-2 bg-[#DEFF9A] rounded-full animate-pulse shadow-[0_0_8px_#DEFF9A]"></div>
                            <h2 className="zto-card-title text-xl uppercase tracking-wider">Initialize Project</h2>
                        </div>
                        <p className="text-xs font-urbanist zto-card-desc mb-8 pb-4 border-b border-white/10">Configure root parameters. Metadata can be altered post-deployment.</p>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Project Classification *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. OPERATION NEBULA 2026"
                                    className="w-full px-4 py-3 bg-[#0a0a0a] rounded-[12px] border border-white/10 focus:border-[#0056B3] outline-none transition-all text-white font-urbanist text-sm placeholder:text-white/20"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Protocol Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#0a0a0a] rounded-[12px] border border-white/10 focus:border-[#0056B3] outline-none transition-all text-white font-urbanist text-sm appearance-none"
                                    style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                                >
                                    <option value="corporate" className="bg-[#050505]">Corporate Node</option>
                                    <option value="wedding" className="bg-[#050505]">Wedding Protocol</option>
                                    <option value="wedding_fair" className="bg-[#050505]">Wedding Fair</option>
                                    <option value="sports" className="bg-[#050505]">Sports Matrix</option>
                                    <option value="dinner" className="bg-[#050505]">Gala Banquet</option>
                                    <option value="other" className="bg-[#050505]">Uncategorized</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">T=Zero (Start)</label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#0a0a0a] rounded-[12px] border border-white/10 focus:border-[#0056B3] outline-none transition-all text-white font-urbanist text-sm [color-scheme:dark]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">T=End (Completion)</label>
                                    <input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#0a0a0a] rounded-[12px] border border-white/10 focus:border-[#0056B3] outline-none transition-all text-white font-urbanist text-sm [color-scheme:dark]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Sector / Venue</label>
                                <input
                                    type="text"
                                    value={formData.venue}
                                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                                    placeholder="e.g. Parkcity Sector-4"
                                    className="w-full px-4 py-3 bg-[#0a0a0a] rounded-[12px] border border-white/10 focus:border-[#0056B3] outline-none transition-all text-white font-urbanist text-sm placeholder:text-white/20"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-5 py-3 rounded-[12px] border border-white/10 text-xs font-bold tracking-widest uppercase text-zinc-400 hover:bg-white/5 hover:text-white transition-all"
                            >
                                Abort
                            </button>
                            <button
                                onClick={createProject}
                                disabled={creating}
                                className="zto-btn-glow flex-1 text-xs tracking-widest uppercase disabled:opacity-50 disabled:shadow-none"
                            >
                                {creating ? (
                                    <><i className="fa-solid fa-circle-notch animate-spin mr-2"></i> Initializing...</>
                                ) : (
                                    <><i className="fa-solid fa-bolt mr-2"></i> Deploy Data</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

