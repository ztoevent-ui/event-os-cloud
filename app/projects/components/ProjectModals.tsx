
'use client'

import React, { useState } from 'react';
import { createTask, updateTask, deleteTask, createTimeline, deleteTimeline, createBudget, deleteBudget, createVendor, deleteVendor } from '../actions';
import { useRouter } from 'next/navigation';

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

export function AddTaskButton({ projectId }: { projectId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <button onClick={() => setIsOpen(true)} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full transition-all flex items-center gap-2 transform hover:scale-105 shadow-lg shadow-amber-500/20">
                <i className="fa-solid fa-plus"></i> Add Task
            </button>
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="New Task">
                <TaskForm projectId={projectId} onClose={() => setIsOpen(false)} />
            </Modal>
        </>
    );
}

export function TaskCard({ task, projectId }: { task: any, projectId: string }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Dynamic styles
    const priorityColor = task.priority === 'critical' ? 'bg-red-500' : task.priority === 'high' ? 'bg-amber-500' : task.priority === 'medium' ? 'bg-blue-500' : 'bg-zinc-600';
    const accessBadge = task.access_level === 'admin' ? <span className="text-[10px] uppercase font-bold tracking-wider text-red-400 bg-red-900/20 px-1.5 py-0.5 rounded">Admin Only</span> : null;

    return (
        <>
            <div onClick={() => setIsEditOpen(true)} className="bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 p-4 rounded-xl transition-all group cursor-pointer shadow-sm hover:shadow-md relative overflow-hidden h-full flex flex-col">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${priorityColor}`}></div>
                <div className="ml-3 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        {accessBadge || <span className="text-zinc-500 text-[10px]">TASK-{task.id.slice(0, 4)}</span>}
                        {task.priority === 'critical' && <i className="fa-solid fa-fire text-red-500 animate-pulse text-xs" title="Critical"></i>}
                    </div>
                    <h4 className="font-medium text-zinc-100 mb-2 group-hover:text-amber-400 transition-colors leading-snug break-words">
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
                        <i className="fa-solid fa-pen-to-square opacity-0 group-hover:opacity-100 transition-opacity text-amber-500"></i>
                    </div>
                </div>
            </div>

            <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Task">
                <TaskForm task={task} projectId={projectId} onClose={() => setIsEditOpen(false)} />
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

function TaskForm({ task, projectId, onClose }: { task?: any, projectId: string, onClose: () => void }) {
    const isEdit = !!task;
    const [isLoading, setIsLoading] = useState(false);

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
                <input name="title" defaultValue={task?.title} required className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Task Name..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Status</label>
                    <select name="status" defaultValue={task?.status || 'todo'} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500">
                        <option value="todo">Todo</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Priority</label>
                    <select name="priority" defaultValue={task?.priority || 'medium'} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500">
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                        <option value="low">Low</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Due Date</label>
                <input type="date" name="due_date" defaultValue={task?.due_date?.split('T')[0]} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" />
            </div>
            <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Description</label>
                <textarea name="description" defaultValue={task?.description} rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" placeholder="Details..."></textarea>
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition-colors mt-4 flex justify-center items-center gap-2">
                {isLoading && <i className="fa-solid fa-spinner fa-spin"></i>}
                {isEdit ? 'Save Changes' : 'Create Task'}
            </button>
        </form>
    );
}


// --- TIMELINES ---

export function AddTimelineButton({ projectId }: { projectId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <button onClick={() => setIsOpen(true)} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full transition-all flex items-center gap-2 transform hover:scale-105 shadow-lg shadow-amber-500/20">
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
                        <input name="name" required className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" placeholder="e.g. Phase 1: Planning" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Start Date</label>
                            <input type="date" name="start_date" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">End Date</label>
                            <input type="date" name="end_date" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition-colors mt-4">Add Phase</button>
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

export function AddBudgetButton({ projectId }: { projectId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <button onClick={() => setIsOpen(true)} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full transition-all flex items-center gap-2 transform hover:scale-105 shadow-lg shadow-amber-500/20">
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
                        <input name="item" required className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" placeholder="e.g. Venue Deposit" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Amount (RM)</label>
                        <input name="amount" type="number" step="0.01" required className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" placeholder="0.00" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Type</label>
                            <select name="type" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500">
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Category</label>
                            <input name="category" list="categories" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" placeholder="Select or type..." />
                            <datalist id="categories">
                                <option value="Venue" />
                                <option value="Decor" />
                                <option value="Marketing" />
                                <option value="Staff" />
                                <option value="Sponsorship" />
                            </datalist>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition-colors mt-4">Add Transaction</button>
                </form>
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

export function AddVendorButton({ projectId }: { projectId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <button onClick={() => setIsOpen(true)} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full transition-all flex items-center gap-2 transform hover:scale-105 shadow-lg shadow-amber-500/20">
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
                        <input name="name" required className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" placeholder="Company Name" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Category</label>
                        <input name="category" list="vendor-categories" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" placeholder="e.g. Catering" />
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
                            <select name="status" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500">
                                <option value="potential">Potential</option>
                                <option value="contacted">Contacted</option>
                                <option value="confirmed">Confirmed</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Contact Person</label>
                            <input name="contact_person" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" placeholder="Name" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Phone</label>
                            <input name="phone" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" placeholder="+60..." />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Email</label>
                            <input name="email" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" placeholder="email@example.com" />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition-colors mt-4">Add Vendor</button>
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
