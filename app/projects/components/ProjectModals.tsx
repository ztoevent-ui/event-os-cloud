
'use client'

import React, { useState, useEffect } from 'react';
import { createTask, updateTask, deleteTask, createTimeline, deleteTimeline, createBudget, deleteBudget, createVendor, deleteVendor, copyBudget, copyProgram } from '../actions';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { PrintOptionsModal } from './PrintOptionsModal';
import { usePrint } from './PrintContext';
import { motion, AnimatePresence } from 'framer-motion';


// --- SHARED UI COMPONENTS ---

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

// --- TASKS ---

export function AddTaskButton({ projectId, isWedding }: { projectId: string; isWedding?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const colorClass = isWedding ? 'bg-pink-500 hover:bg-pink-400 shadow-pink-500/20' : 'bg-[#0056B3] hover:bg-[#0056B3] shadow-blue-900/20';
    return (
        <>
            <button onClick={() => setIsOpen(true)} className={`px-6 py-2.5 ${colorClass} text-black font-bold rounded-full transition-all flex items-center gap-2 transform hover:scale-105 shadow-lg`}>
                <i className="fa-solid fa-plus"></i> Add Task
            </button>
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="New Task">
                <TaskForm projectId={projectId} onClose={() => setIsOpen(false)} isWedding={isWedding} />
            </Modal>
        </>
    );
}

export function TaskCard({ task, projectId, isWedding }: { task: any, projectId: string, isWedding?: boolean }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Dynamic styles
    const accentColor = isWedding ? 'pink-500' : '[#0056B3]';
    const borderHover = isWedding ? 'hover:border-pink-500/50' : 'hover:border-[#0056B3]/30';
    const priorityColor = task.priority === 'critical' ? 'bg-red-500' : task.priority === 'high' ? `bg-${accentColor}` : task.priority === 'medium' ? 'bg-blue-500' : 'bg-zinc-600';
    const accessBadge = task.access_level === 'admin' ? <span className="text-[10px] uppercase font-bold tracking-wider text-red-400 bg-red-900/20 px-1.5 py-0.5 rounded">Admin Only</span> : null;

    return (
        <>
            <div onClick={() => setIsEditOpen(true)} className={`bg-zinc-900 border border-zinc-800 ${borderHover} p-4 rounded-xl transition-all group cursor-pointer shadow-sm hover:shadow-md relative overflow-hidden h-full flex flex-col`}>
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${priorityColor}`}></div>
                <div className="ml-3 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        {accessBadge || <span className="text-zinc-500 text-[10px]">TASK-{task.id.slice(0, 4)}</span>}
                        {task.priority === 'critical' && <i className="fa-solid fa-fire text-red-500 animate-pulse text-xs" title="Critical"></i>}
                    </div>
                    <h4 className={`font-medium text-zinc-100 mb-2 ${isWedding ? 'group-hover:text-pink-400' : 'group-hover:text-[#0056B3]'} transition-colors leading-snug break-words`}>
                        {task.title}
                    </h4>
                    {task.description && (
                        <p className="text-xs text-zinc-500 line-clamp-2 mb-4 font-light">
                            {task.description}
                        </p>
                    )}
                    <div className="mt-auto flex justify-between items-center text-xs text-zinc-600 border-t border-zinc-800 pt-3">
                        <div className="flex items-center gap-1.5">
                            <i className="fa-regular fa-calendar text-zinc-500"></i>
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                        </div>
                        <i className={`fa-solid fa-pen-to-square opacity-0 group-hover:opacity-100 transition-opacity ${isWedding ? 'text-pink-500' : 'text-[#0056B3]'}`}></i>
                    </div>
                </div>
            </div>

            <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Task">
                <TaskForm task={task} projectId={projectId} onClose={() => setIsEditOpen(false)} isWedding={isWedding} />
                <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Danger Zone</span>
                    <button
                        onClick={async () => {
                            if (confirm('Are you sure you want to delete this task?')) {
                                setIsDeleting(true);
                                const formData = new FormData();
                                formData.append('id', task.id);
                                formData.append('project_id', projectId);
                                await deleteTask(formData);
                                setIsEditOpen(false);
                            }
                        }}
                        disabled={isDeleting}
                        className="text-xs text-red-500 hover:text-red-400 hover:underline flex items-center gap-1"
                    >
                        {isDeleting ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-trash"></i>} Delete Task
                    </button>
                </div>
            </Modal>
        </>
    );
}

function TaskForm({ task, projectId, onClose, isWedding }: { task?: any, projectId: string, onClose: () => void, isWedding?: boolean }) {
    const isEdit = !!task;
    const [isLoading, setIsLoading] = useState(false);
    const focusClass = isWedding ? 'focus:border-pink-500' : 'focus:border-[#0056B3]/30';
    const btnClass = isWedding ? 'bg-pink-500 hover:bg-pink-400 shadow-pink-500/20' : 'bg-[#0056B3] hover:bg-[#0056B3] shadow-blue-900/20';

    return (
        <form action={async (formData) => {
            setIsLoading(true);
            if (isEdit) {
                formData.append('id', task.id);
                await updateTask(formData);
            } else {
                await createTask(formData);
            }
            setIsLoading(false);
            onClose();
        }} className="space-y-4">
            <input type="hidden" name="project_id" value={projectId} />
            <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Title</label>
                <input name="title" defaultValue={task?.title} required className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none ${focusClass} transition-colors`} placeholder="Task Name..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Status</label>
                    <select name="status" defaultValue={task?.status || 'todo'} className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none ${focusClass}`}>
                        <option value="todo">Todo</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Priority</label>
                    <select name="priority" defaultValue={task?.priority || 'medium'} className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none ${focusClass}`}>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                        <option value="low">Low</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Due Date</label>
                <input type="date" name="due_date" defaultValue={task?.due_date?.split('T')[0]} className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none ${focusClass}`} />
            </div>
            <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Description</label>
                <textarea name="description" defaultValue={task?.description} rows={3} className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none ${focusClass}`} placeholder="Details..."></textarea>
            </div>
            <button type="submit" disabled={isLoading} className={`w-full ${btnClass} text-black font-bold py-3 rounded-xl transition-colors mt-4 flex justify-center items-center gap-2 shadow-lg`}>
                {isLoading && <i className="fa-solid fa-spinner fa-spin"></i>}
                {isEdit ? 'Save Changes' : 'Create Task'}
            </button>
        </form>
    );
}


// --- TIMELINES ---

export function AddTimelineButton({ projectId, isWedding }: { projectId: string; isWedding?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const colorClass = isWedding ? 'bg-pink-500 hover:bg-pink-400 shadow-pink-500/20' : 'bg-[#0056B3] hover:bg-[#0056B3] shadow-blue-900/20';
    const focusClass = isWedding ? 'focus:border-pink-500' : 'focus:border-[#0056B3]/30';

    return (
        <>
            <button onClick={() => setIsOpen(true)} className={`px-6 py-2.5 ${colorClass} text-black font-bold rounded-full transition-all flex items-center gap-2 transform hover:scale-105 shadow-lg`}>
                <i className="fa-solid fa-plus"></i> Add Phase
            </button>
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="New Phase">
                <form action={async (formData) => {
                    await createTimeline(formData);
                    setIsOpen(false);
                }} className="space-y-4">
                    <input type="hidden" name="project_id" value={projectId} />
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Phase Name</label>
                        <input name="name" required className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none ${focusClass}`} placeholder="e.g. Phase 1: Planning" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Start Date</label>
                            <input type="date" name="start_date" className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none ${focusClass}`} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">End Date</label>
                            <input type="date" name="end_date" className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none ${focusClass}`} />
                        </div>
                    </div>
                    <button type="submit" className={`w-full ${colorClass} text-black font-bold py-3 rounded-xl transition-colors mt-4 shadow-lg`}>Add Phase</button>
                </form>
            </Modal>
        </>
    );
}

export function DeleteTimelineButton({ id, projectId }: { id: string, projectId: string }) {
    return (
        <form action={deleteTimeline}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="project_id" value={projectId} />
            <button type="submit" className="absolute top-4 right-4 text-zinc-600 hover:text-red-500 transition-colors z-20">
                <i className="fa-solid fa-trash"></i>
            </button>
        </form>
    );
}

// --- BUDGETS ---

export function AddBudgetButton({ projectId, isWedding }: { projectId: string; isWedding?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const colorClass = isWedding ? 'bg-pink-500 hover:bg-pink-400 shadow-pink-500/20' : 'bg-[#0056B3] hover:bg-[#0056B3] shadow-blue-900/20';
    const focusClass = isWedding ? 'focus:border-pink-500' : 'focus:border-[#0056B3]/30';

    return (
        <>
            <button onClick={() => setIsOpen(true)} className={`px-6 py-2.5 ${colorClass} text-black font-bold rounded-full transition-all flex items-center gap-2 transform hover:scale-105 shadow-lg`}>
                <i className="fa-solid fa-plus"></i> Add Item
            </button>
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="New Budget Item">
                <form action={async (formData) => {
                    await createBudget(formData);
                    setIsOpen(false);
                }} className="space-y-4">
                    <input type="hidden" name="project_id" value={projectId} />
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Item Name</label>
                        <input name="item" required className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none ${focusClass}`} placeholder="e.g. Venue Deposit" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Amount (RM)</label>
                        <input name="amount" type="number" step="0.01" required className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none ${focusClass}`} placeholder="0.00" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Type</label>
                            <select name="type" className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none ${focusClass}`}>
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Category</label>
                            <input name="category" list="categories" className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none ${focusClass}`} placeholder="Select or type..." />
                            <datalist id="categories">
                                <option value="Venue" />
                                <option value="Decor" />
                                <option value="Marketing" />
                                <option value="Staff" />
                                <option value="Sponsorship" />
                            </datalist>
                        </div>
                    </div>
                    <button type="submit" className={`w-full ${colorClass} text-black font-bold py-3 rounded-xl transition-colors mt-4 shadow-lg`}>Add Transaction</button>
                </form>
            </Modal>
        </>
    );
}

export function CopyBudgetButton({ projectId }: { projectId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCopying, setIsCopying] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchProjects();
        }
    }, [isOpen]);

    const fetchProjects = async () => {
        setIsLoading(true);
        const { data } = await supabase
            .from('projects')
            .select('id, name')
            .neq('id', projectId)
            .order('created_at', { ascending: false });
        setProjects(data || []);
        setIsLoading(false);
    };

    const filteredProjects = projects.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)} 
                className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-full transition-all flex items-center gap-2 border border-zinc-700 shadow-lg"
            >
                <i className="fa-solid fa-copy"></i> Copy From
            </button>
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Copy Budget From">
                <div className="space-y-4">
                    <p className="text-sm text-zinc-400">Select a project to clone its budget items into this tournament.</p>
                    <div className="relative">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"></i>
                        <input 
                            type="text" 
                            placeholder="Search projects..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:border-[#0056B3]/30 transition-colors"
                        />
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {isLoading ? (
                            <div className="text-center py-8 text-zinc-500 animate-pulse">Scanning Archive...</div>
                        ) : filteredProjects.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 italic uppercase text-[10px] tracking-widest font-bold">No projects found</div>
                        ) : (
                            filteredProjects.map(project => (
                                <button
                                    key={project.id}
                                    onClick={async () => {
                                        if (confirm(`Copy all budget items from "${project.name}"? This will add them to your current list.`)) {
                                            setIsCopying(true);
                                            const formData = new FormData();
                                            formData.append('fromProjectId', project.id);
                                            formData.append('toProjectId', projectId);
                                            const res = await copyBudget(formData);
                                            setIsCopying(false);
                                            if (res.success) {
                                                setIsOpen(false);
                                                alert(`Successfully copied ${res.count} items!`);
                                            } else {
                                                alert('Failed to copy budget: ' + res.error);
                                            }
                                        }
                                    }}
                                    disabled={isCopying}
                                    className="w-full text-left p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 hover:border-[#0056B3]/30 transition-all group"
                                >
                                    <div className="font-bold text-zinc-100 group-hover:text-[#0056B3] transition-colors">{project.name}</div>
                                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Project ID: {project.id.slice(0, 8)}</div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </Modal>
        </>
    );
}

export function DeleteBudgetButton({ id, projectId }: { id: string, projectId: string }) {
    return (
        <form action={deleteBudget}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="project_id" value={projectId} />
            <button type="submit" className="text-zinc-600 hover:text-red-500 transition-colors p-2" title="Delete">
                <i className="fa-solid fa-trash"></i>
            </button>
        </form>
    );
}


// --- VENDORS ---

export function AddVendorButton({ projectId, isWedding }: { projectId: string; isWedding?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const colorClass = isWedding ? 'bg-pink-500 hover:bg-pink-400 shadow-pink-500/20' : 'bg-[#0056B3] hover:bg-[#0056B3] shadow-blue-900/20';
    const focusClass = isWedding ? 'focus:border-pink-500' : 'focus:border-[#0056B3]/30';

    return (
        <>
            <button onClick={() => setIsOpen(true)} className={`px-6 py-2.5 ${colorClass} text-black font-bold rounded-full transition-all flex items-center gap-2 transform hover:scale-105 shadow-lg`}>
                <i className="fa-solid fa-plus"></i> Add Vendor
            </button>
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="New Vendor">
                <form action={async (formData) => {
                    await createVendor(formData);
                    setIsOpen(false);
                }} className="space-y-4">
                    <input type="hidden" name="project_id" value={projectId} />
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Vendor Name</label>
                        <input name="name" required className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none ${focusClass}`} placeholder="Company Name" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Category</label>
                        <input name="category" list="vendor-categories" className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none ${focusClass}`} placeholder="e.g. Catering" />
                        <datalist id="vendor-categories">
                            <option value="Venue" />
                            <option value="Catering" />
                            <option value="Photography" />
                            <option value="AV & Sound" />
                            <option value="Decor" />
                        </datalist>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Status</label>
                            <select name="status" className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none ${focusClass}`}>
                                <option value="potential">Potential</option>
                                <option value="contacted">Contacted</option>
                                <option value="confirmed">Confirmed</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Contact Person</label>
                            <input name="contact_person" className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none ${focusClass}`} placeholder="Name" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Phone</label>
                            <input name="phone" className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none ${focusClass}`} placeholder="+60..." />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Email</label>
                            <input name="email" className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none ${focusClass}`} placeholder="email@example.com" />
                        </div>
                    </div>
                    <button type="submit" className={`w-full ${colorClass} text-black font-bold py-3 rounded-xl transition-colors mt-4 shadow-lg`}>Add Vendor</button>
                </form>
            </Modal>
        </>
    );
}

export function DeleteVendorButton({ id, projectId }: { id: string, projectId: string }) {
    return (
        <form action={deleteVendor} className="absolute top-4 right-16">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="project_id" value={projectId} />
            <button type="submit" className="text-zinc-600 hover:text-red-500 transition-colors bg-zinc-900 rounded-full w-8 h-8 flex items-center justify-center border border-zinc-700" title="Delete">
                <i className="fa-solid fa-trash text-xs"></i>
            </button>
        </form>
    );
}

export function PrintReportButton({ title = "General Report" }: { title?: string }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    return (
        <>
            <button 
                onClick={() => setIsModalOpen(true)}
                style={{ height: 48, padding: '0 24px', borderRadius: 12, background: '#0056B3', border: '1px solid rgba(0,86,179,0.3)', color: '#fff', fontWeight: 900, fontSize: 13, textTransform: 'uppercase', cursor: 'pointer', zIndex: 1000, position: 'relative', boxShadow: '0 0 20px rgba(0,86,179,0.4)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 10 }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px rgba(0,86,179,0.8)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(0,86,179,0.4)'}
            >
                <i className="fa-solid fa-file-invoice-dollar"></i> REPORT
            </button>
            <PrintOptionsModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={title}
            />
        </>
    );
}

export function CopyProgramButton({ projectId }: { projectId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCopying, setIsCopying] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchProjects();
        }
    }, [isOpen]);

    const fetchProjects = async () => {
        setIsLoading(true);
        const { data } = await supabase
            .from('projects')
            .select('id, name')
            .neq('id', projectId)
            .order('created_at', { ascending: false });
        setProjects(data || []);
        setIsLoading(false);
    };

    const filteredProjects = projects.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)} 
                style={{ height: 48, padding: '0 24px', borderRadius: 12, background: '#0056B3', border: '1px solid rgba(0,86,179,0.3)', color: '#fff', fontWeight: 900, fontSize: 13, textTransform: 'uppercase', cursor: 'pointer', zIndex: 1000, position: 'relative', boxShadow: '0 0 20px rgba(0,86,179,0.4)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 10 }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px rgba(0,86,179,0.8)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(0,86,179,0.4)'}
            >
                <i className="fa-solid fa-clone"></i> COPY PROGRAM
            </button>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-zinc-950 border border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 border-b border-white/5 bg-zinc-900/50">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Copy Program From</h3>
                                    <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                                        <i className="fa-solid fa-xmark text-xl"></i>
                                    </button>
                                </div>
                                <div className="relative">
                                    <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm"></i>
                                    <input 
                                        type="text" 
                                        placeholder="Search projects..."
                                        className="w-full bg-black border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#0056B3]/30 transition-all font-medium"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto p-4 space-y-2 custom-scrollbar">
                                {isLoading ? (
                                    <div className="py-20 text-center text-zinc-500 font-bold animate-pulse uppercase tracking-widest text-xs flex flex-col items-center gap-3">
                                        <i className="fa-solid fa-circle-notch fa-spin text-xl text-[#0056B3]"></i>
                                        Scanning projects...
                                    </div>
                                ) : filteredProjects.length === 0 ? (
                                    <div className="py-20 text-center text-zinc-600 font-bold uppercase tracking-widest text-[10px]">No projects found</div>
                                ) : (
                                    filteredProjects.map(project => (
                                        <button 
                                            key={project.id}
                                            onClick={async () => {
                                                if (confirm(`Copy all program sequences and column settings from "${project.name}"? This will add them to your current list.`)) {
                                                    setIsCopying(true);
                                                    const formData = new FormData();
                                                    formData.append('fromProjectId', project.id);
                                                    formData.append('toProjectId', projectId);
                                                    const res = await copyProgram(formData);
                                                    setIsCopying(false);
                                                    if (res.success) {
                                                        setIsOpen(false);
                                                        alert(`Successfully copied ${res.count} items!`);
                                                        window.location.reload();
                                                    } else {
                                                        alert('Failed to copy program: ' + res.error);
                                                    }
                                                }
                                            }}
                                            disabled={isCopying}
                                            className="w-full group flex items-center justify-between p-4 bg-white/5 hover:bg-[#0056B3] rounded-2xl transition-all border border-transparent hover:border-[#0056B3]/30"
                                        >
                                            <div className="text-left flex-1 min-w-0">
                                                <div className="text-sm font-black text-white group-hover:text-black uppercase italic tracking-tight truncate">{project.name}</div>
                                                <div className="text-[9px] text-zinc-500 group-hover:text-black/60 font-bold uppercase tracking-widest truncate">{project.id}</div>
                                            </div>
                                            <i className="fa-solid fa-arrow-right-long text-zinc-700 group-hover:text-black group-hover:translate-x-1 transition-all ml-4"></i>
                                        </button>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
