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
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Event Manager</h1>
                    <p className="text-gray-500 mt-1">Oversee and coordinate all your active events.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/" className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition">
                        <i className="fa-solid fa-arrow-left mr-2"></i> Back Home
                    </Link>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gray-900 shadow-lg shadow-gray-200 hover:bg-gray-800 transition transform hover:-translate-y-0.5"
                    >
                        <i className="fa-solid fa-plus mr-2"></i> Create Event
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <i className="fa-solid fa-circle-notch animate-spin text-3xl text-gray-400 mb-4"></i>
                        <p className="text-gray-500 font-bold">Loading your events...</p>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 text-2xl mb-4">
                            <i className="fa-regular fa-folder-open"></i>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No events found</h3>
                        <p className="text-gray-500 mb-6 max-w-sm">Get started by creating your first event project to track tasks, vendors, and budget.</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition"
                        >
                            Create First Event
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <Link key={project.id} href={`/projects/${project.id}`} className="group block h-full">
                                <article className="bg-white h-full rounded-2xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-xl hover:border-indigo-100 hover:-translate-y-1 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <i className="fa-solid fa-arrow-right text-gray-300 group-hover:text-indigo-500 -rotate-45 group-hover:rotate-0 transition-transform duration-300"></i>
                                    </div>

                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner ${project.type === 'wedding' || project.type === 'wedding_fair' ? 'bg-pink-50 text-pink-500' :
                                                project.type === 'corporate' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'
                                            }`}>
                                            <i className={`fa-solid ${project.type === 'wedding' || project.type === 'wedding_fair' ? 'fa-heart' :
                                                    project.type === 'corporate' ? 'fa-building' : 'fa-calendar-check'
                                                }`}></i>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${project.status === 'active' ? 'bg-green-100 text-green-700' :
                                                project.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {project.status || 'Planning'}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
                                        {project.name}
                                    </h3>

                                    <div className="space-y-3 mt-6">
                                        <div className="flex items-center text-sm text-gray-500">
                                            <i className="fa-regular fa-calendar w-6 text-center text-gray-300"></i>
                                            <span>{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Date TBD'}</span>
                                        </div>
                                        {project.venue && (
                                            <div className="flex items-center text-sm text-gray-500">
                                                <i className="fa-solid fa-location-dot w-6 text-center text-gray-300"></i>
                                                <span>{project.venue}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        <span>View Dashboard</span>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={(e) => deleteProject(e, project.id, project.name)}
                                                className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                title="Delete project"
                                            >
                                                <i className="fa-solid fa-trash-can text-xs"></i>
                                            </button>
                                            <span className="group-hover:translate-x-1 transition-transform">Open <i className="fa-solid fa-chevron-right ml-1"></i></span>
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
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>

                    {/* Modal */}
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-[fadeIn_0.2s_ease-out]">
                        <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition">
                            <i className="fa-solid fa-xmark text-xl"></i>
                        </button>

                        <h2 className="text-2xl font-black text-gray-900 mb-1">Create New Event</h2>
                        <p className="text-sm text-gray-500 mb-8">Fill in the basic details. You can always edit later.</p>

                        <div className="space-y-5">
                            {/* Event Name */}
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Event Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Bintulu Gala Night 2026"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition text-gray-900 font-medium"
                                    autoFocus
                                />
                            </div>

                            {/* Event Type */}
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Event Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition text-gray-900 font-medium bg-white"
                                >
                                    <option value="corporate">Corporate Event</option>
                                    <option value="wedding">Wedding Ceremony</option>
                                    <option value="wedding_fair">Wedding Fair</option>
                                    <option value="sports">Sports Tournament</option>
                                    <option value="dinner">Annual Dinner</option>
                                    <option value="exhibition">Exhibition</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {/* Date Range */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition text-gray-900 font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">End Date</label>
                                    <input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition text-gray-900 font-medium"
                                    />
                                </div>
                            </div>

                            {/* Venue */}
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Venue</label>
                                <input
                                    type="text"
                                    value={formData.venue}
                                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                                    placeholder="e.g. Parkcity Everly Hotel, Bintulu"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition text-gray-900 font-medium"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-5 py-3 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createProject}
                                disabled={creating}
                                className="flex-1 px-5 py-3 rounded-xl text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                                {creating ? (
                                    <><i className="fa-solid fa-circle-notch animate-spin mr-2"></i> Creating...</>
                                ) : (
                                    <><i className="fa-solid fa-plus mr-2"></i> Create Event</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
