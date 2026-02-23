'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function ProjectsPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;

        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) {
            console.error('Error deleting project:', error);
            alert('Failed to delete event.');
        } else {
            setProjects(projects.filter(p => p.id !== id));
        }
    };

    const handleCreateEvent = async () => {
        const name = prompt("Enter the new event name:");
        if (!name) return;

        setLoading(true);
        const { data, error } = await supabase.from('projects').insert([{
            name: name,
            type: 'corporate',
            status: 'planning',
            start_date: new Date().toISOString()
        }]).select();

        if (error || !data) {
            console.error('Error creating project:', error);
            alert('Failed to create event.');
            setLoading(false);
        } else {
            setProjects([data[0], ...projects]);
            setLoading(false);
        }
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
                    <button onClick={handleCreateEvent} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gray-900 shadow-lg shadow-gray-200 hover:bg-gray-800 transition transform hover:-translate-y-0.5">
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
                        <button onClick={handleCreateEvent} className="px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition">
                            Create First Event
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <Link key={project.id} href={`/projects/${project.id}`} className="group block h-full">
                                <article className="bg-white h-full rounded-2xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-xl hover:border-indigo-100 hover:-translate-y-1 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button
                                            onClick={(e) => handleDelete(e, project.id)}
                                            className="w-10 h-10 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition shadow-sm drop-shadow-md"
                                            title="Delete Event"
                                        >
                                            <i className="fa-solid fa-trash text-sm"></i>
                                        </button>
                                    </div>
                                    <div className="absolute top-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:block">
                                        <i className="fa-solid fa-arrow-right text-gray-300 group-hover:text-indigo-500 -rotate-45 group-hover:rotate-0 transition-transform duration-300 w-10 h-10 flex items-center justify-center mr-12"></i>
                                    </div>

                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner ${project.type === 'wedding_fair' ? 'bg-pink-50 text-pink-500' :
                                            project.type === 'corporate' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'
                                            }`}>
                                            <i className={`fa-solid ${project.type === 'wedding_fair' ? 'fa-heart' :
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
                                            <span>{project.start_date ? String(project.start_date).split('T')[0] : 'Date TBD'}</span>
                                        </div>
                                        {project.manager_id && (
                                            <div className="flex items-center text-sm text-gray-500">
                                                <i className="fa-regular fa-user w-6 text-center text-gray-300"></i>
                                                <span>Manager Assigned</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        <span>View Dashboard</span>
                                        <span className="group-hover:translate-x-1 transition-transform">Open <i className="fa-solid fa-chevron-right ml-1"></i></span>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
