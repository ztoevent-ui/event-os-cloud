
'use client'

import React, { useState } from 'react';
import { createTask, updateTask, deleteTask, createTimeline, updateTimeline, deleteTimeline, createBudget, updateBudget, deleteBudget, createVendor, updateVendor, deleteVendor } from '../actions';
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
                            {task.due_date ? String(task.due_date).split('T')[0] : 'No date'}
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

export function TimelineCard({ phase, projectId }: { phase: any, projectId: string }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    return (
        <>
            <div onClick={() => setIsEditOpen(true)} className="relative border-l-2 border-amber-500 ml-4 md:ml-6 group cursor-pointer hover:bg-zinc-800/20 p-4 -ml-4 rounded-xl transition-all">
                <div className="absolute w-3 h-3 bg-black border-2 border-amber-500 rounded-full -left-[23px] md:-left-[27px] top-1.5 group-hover:scale-125 transition-transform group-hover:bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                <div className="pl-6 md:pl-8">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
                            {phase.name}
                            <i className="fa-solid fa-pen-to-square opacity-0 group-hover:opacity-100 transition-opacity text-amber-500 text-sm"></i>
                        </h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-zinc-500 font-medium">
                        <span className="flex items-center gap-1.5 object-contain">
                            <i className="fa-regular fa-calendar-check text-amber-500/70"></i>
                            {phase.start_date ? String(phase.start_date).split('T')[0] : 'TBD'} 
                            <i className="fa-solid fa-arrow-right text-[10px] mx-1"></i> 
                            {phase.end_date ? String(phase.end_date).split('T')[0] : 'TBD'}
                        </span>
                    </div>
                </div>
            </div>

            <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Phase">
                <form action={async (formData) => {
                    formData.append('id', phase.id);
                    await updateTimeline(formData);
                    setIsEditOpen(false);
                }} className="space-y-4">
                    <input type="hidden" name="project_id" value={projectId} />
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Phase Name</label>
                        <input name="name" defaultValue={phase.name} required className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" placeholder="e.g. Phase 1: Planning" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Start Date</label>
                            <input type="date" name="start_date" defaultValue={phase.start_date?.split('T')[0]} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">End Date</label>
                            <input type="date" name="end_date" defaultValue={phase.end_date?.split('T')[0]} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition-colors mt-4">Save Changes</button>
                    
                    <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center">
                        <span className="text-xs text-zinc-500">Danger Zone</span>
                        <button
                            type="button"
                            onClick={async () => {
                                if (confirm('Are you sure you want to delete this phase?')) {
                                    setIsDeleting(true);
                                    const delData = new FormData();
                                    delData.append('id', phase.id);
                                    delData.append('project_id', projectId);
                                    await deleteTimeline(delData);
                                    setIsEditOpen(false);
                                }
                            }}
                            disabled={isDeleting}
                            className="text-xs text-red-500 hover:text-red-400 hover:underline flex items-center gap-1"
                        >
                            {isDeleting ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-trash"></i>} Delete Phase
                        </button>
                    </div>
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

export function AddBudgetButton({ projectId, existingCategories = [] }: { projectId: string, existingCategories?: string[] }) {
    const [isOpen, setIsOpen] = useState(false);
    
    // Combine defaults with existing categories and remove duplicates
    const defaultCategories = [
        "Venue", "Decor", "Marketing", "Staff", "Sponsorship",
        "Live Streaming", "Media Team (Photo/Video)", "Prize Pool", 
        "Equipment", "F&B (Catering)", "Logistics"
    ];
    const combinedCategories = Array.from(new Set([...defaultCategories, ...existingCategories]));

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
                                {combinedCategories.map((cat, i) => (
                                    <option key={i} value={cat} />
                                ))}
                            </datalist>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition-colors mt-4">Add Transaction</button>
                </form>
            </Modal>
        </>
    );
}

export function BudgetCard({ item, projectId, existingCategories = [] }: { item: any, projectId: string, existingCategories?: string[] }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const defaultCategories = [
        "Venue", "Decor", "Marketing", "Staff", "Sponsorship",
        "Live Streaming", "Media Team (Photo/Video)", "Prize Pool", 
        "Equipment", "F&B (Catering)", "Logistics"
    ];
    const combinedCategories = Array.from(new Set([...defaultCategories, ...existingCategories]));

    return (
        <>
            <div onClick={() => setIsEditOpen(true)} className="p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors group cursor-pointer">
                <div>
                    <h4 className="font-bold text-zinc-200 group-hover:text-amber-400 transition-colors flex items-center gap-2">
                        {item.item}
                        <i className="fa-solid fa-pen-to-square opacity-0 group-hover:opacity-100 transition-opacity text-amber-500 text-xs"></i>
                    </h4>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide mt-0.5">{item.category}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className={`font-mono font-bold ${item.type === 'expense' ? 'text-zinc-200' : 'text-green-400'}`}>
                            {item.type === 'expense' ? '-' : '+'} RM {Number(item.amount).toFixed(2)}
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block ${item.status === 'actual' ? 'bg-green-900/30 text-green-500' : 'bg-zinc-800 text-zinc-500'}`}>
                            {item.status}
                        </span>
                    </div>
                </div>
            </div>

            <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Transaction">
                <form action={async (formData) => {
                    formData.append('id', item.id);
                    await updateBudget(formData);
                    setIsEditOpen(false);
                }} className="space-y-4">
                    <input type="hidden" name="project_id" value={projectId} />
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Item Name</label>
                        <input name="item" defaultValue={item.item} required className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" placeholder="e.g. Venue Deposit" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Amount (RM)</label>
                        <input name="amount" defaultValue={item.amount} type="number" step="0.01" required className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" placeholder="0.00" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Type</label>
                            <select name="type" defaultValue={item.type} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500">
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Status</label>
                            <select name="status" defaultValue={item.status || 'planned'} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500">
                                <option value="planned">Planned</option>
                                <option value="actual">Actual</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Category</label>
                        <input name="category" defaultValue={item.category} list="categories" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" placeholder="Select or type..." />
                        <datalist id="categories">
                            {combinedCategories.map((cat, i) => (
                                <option key={i} value={cat} />
                            ))}
                        </datalist>
                    </div>
                    <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition-colors mt-4">Save Changes</button>
                    
                    <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center">
                        <span className="text-xs text-zinc-500">Danger Zone</span>
                        <button
                            type="button"
                            onClick={async () => {
                                if (confirm('Are you sure you want to delete this transaction?')) {
                                    setIsDeleting(true);
                                    const delData = new FormData();
                                    delData.append('id', item.id);
                                    delData.append('project_id', projectId);
                                    await deleteBudget(delData);
                                    setIsEditOpen(false);
                                }
                            }}
                            disabled={isDeleting}
                            className="text-xs text-red-500 hover:text-red-400 hover:underline flex items-center gap-1"
                        >
                            {isDeleting ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-trash"></i>} Delete Transaction
                        </button>
                    </div>
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

export function VendorCard({ vendor, projectId }: { vendor: any, projectId: string }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const statusStyle = vendor.status === 'confirmed' ? 'bg-green-500/20 text-green-500 border-green-500/30' :
                        vendor.status === 'contacted' ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' :
                        'bg-zinc-800 text-zinc-400 border-zinc-700';

    return (
        <>
            <div onClick={() => setIsEditOpen(true)} className="bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 p-6 rounded-2xl relative group cursor-pointer shadow-sm hover:shadow-md transition-all h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-white text-lg group-hover:text-amber-400 transition-colors flex items-center gap-2">
                            {vendor.name}
                            <i className="fa-solid fa-pen-to-square opacity-0 group-hover:opacity-100 transition-opacity text-amber-500 text-xs"></i>
                        </h3>
                        <p className="text-zinc-500 text-sm">{vendor.category}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${statusStyle} uppercase font-bold tracking-wider`}>
                        {vendor.status}
                    </span>
                </div>

                <div className="space-y-3 mt-auto">
                    {vendor.contact_person && (
                        <div className="flex items-center gap-3 text-sm text-zinc-300">
                            <i className="fa-regular fa-user text-zinc-500 w-4 text-center"></i>
                            {vendor.contact_person}
                        </div>
                    )}
                    {vendor.phone && (
                        <div className="flex items-center gap-3 text-sm text-zinc-300 pointer-events-auto">
                            <i className="fa-solid fa-phone text-zinc-500 w-4 text-center"></i>
                            <a href={`tel:${vendor.phone}`} className="hover:text-amber-400 transition block" onClick={(e) => e.stopPropagation()}>{vendor.phone}</a>
                        </div>
                    )}
                    {vendor.email && (
                        <div className="flex items-center gap-3 text-sm text-zinc-300 pointer-events-auto">
                            <i className="fa-regular fa-envelope text-zinc-500 w-4 text-center"></i>
                            <a href={`mailto:${vendor.email}`} className="hover:text-amber-400 transition block truncate" onClick={(e) => e.stopPropagation()}>{vendor.email}</a>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Vendor">
                <form action={async (formData) => {
                    formData.append('id', vendor.id);
                    await updateVendor(formData);
                    setIsEditOpen(false);
                }} className="space-y-4">
                    <input type="hidden" name="project_id" value={projectId} />
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Vendor Name</label>
                        <input name="name" defaultValue={vendor.name} required className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" placeholder="Company Name" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Category</label>
                        <input name="category" defaultValue={vendor.category} list="vendor-categories" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" placeholder="e.g. Catering" />
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
                            <select name="status" defaultValue={vendor.status} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500">
                                <option value="potential">Potential</option>
                                <option value="contacted">Contacted</option>
                                <option value="confirmed">Confirmed</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Contact Person</label>
                            <input name="contact_person" defaultValue={vendor.contact_person} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" placeholder="Name" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Phone</label>
                            <input name="phone" defaultValue={vendor.phone} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" placeholder="+60..." />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Email</label>
                            <input name="email" defaultValue={vendor.email} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" placeholder="email@example.com" />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition-colors mt-4">Save Changes</button>
                    
                    <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center">
                        <span className="text-xs text-zinc-500">Danger Zone</span>
                        <button
                            type="button"
                            onClick={async () => {
                                if (confirm('Are you sure you want to delete this vendor?')) {
                                    setIsDeleting(true);
                                    const delData = new FormData();
                                    delData.append('id', vendor.id);
                                    delData.append('project_id', projectId);
                                    await deleteVendor(delData);
                                    setIsEditOpen(false);
                                }
                            }}
                            disabled={isDeleting}
                            className="text-xs text-red-500 hover:text-red-400 hover:underline flex items-center gap-1"
                        >
                            {isDeleting ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-trash"></i>} Delete Vendor
                        </button>
                    </div>
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

export function ReportButton({ budgetItems, totalSpends, totalIncome }: { budgetItems: any[], totalSpends: number, totalIncome: number }) {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
        <>
            <button onClick={() => setIsOpen(true)} className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-full transition-all flex items-center gap-2 border border-zinc-700">
                <i className="fa-solid fa-file-invoice-dollar"></i> Report
            </button>
            <ReportModal isOpen={isOpen} onClose={() => setIsOpen(false)} budgetItems={budgetItems} totalSpends={totalSpends} totalIncome={totalIncome} />
        </>
    );
}

export function ReportModal({ isOpen, onClose, budgetItems, totalSpends, totalIncome }: { 
    isOpen: boolean; 
    onClose: () => void; 
    budgetItems: any[];
    totalSpends: number;
    totalIncome: number;
}) {
    const [reportTitle, setReportTitle] = useState("Budget Summary Report");
    const [preparedBy, setPreparedBy] = useState("Tony Wong");
    const today = new Date().toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' });

    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in report-modal-container">
            <div className="bg-white text-black w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 shadow-2xl flex flex-col print:max-h-none print:w-full print:bg-white print:p-0">
                {/* Non-printable header controls */}
                <div className="bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-10 flex justify-between items-center print:hidden">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <i className="fa-solid fa-print text-amber-500"></i> Report Configuration
                    </h3>
                    <div className="flex items-center gap-3">
                        <button onClick={handlePrint} className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors flex items-center gap-2">
                            <i className="fa-solid fa-file-pdf"></i> Print / Save PDF
                        </button>
                        <button onClick={onClose} className="w-10 h-10 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition-colors flex items-center justify-center">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </div>

                <div className="bg-zinc-800/50 p-6 border-b border-zinc-800 print:hidden grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Report Title</label>
                        <input 
                            value={reportTitle} 
                            onChange={(e) => setReportTitle(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Prepared By</label>
                        <input 
                            value={preparedBy} 
                            onChange={(e) => setPreparedBy(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" 
                        />
                    </div>
                </div>

                {/* Printable Area (`print:block` logic applied globally through CSS or just layout) */}
                <div className="p-12 print:p-8 flex-1 bg-white print:bg-white text-black print-area" id="printable-report">
                    
                    {/* Visual styles for print are injected directly inline to ensure they render when printing */}
                    <div className="border-b-[3px] border-black pb-6 mb-8 flex justify-between items-end">
                        <div>
                            <h1 className="text-4xl font-serif font-black mb-2 uppercase tracking-tight">{reportTitle}</h1>
                            <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Project Financials Overview</p>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-lg">{today}</div>
                            <div className="text-zinc-500 mt-1">Prepared by: <span className="text-black font-bold">{preparedBy}</span></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 mb-12">
                        <div className="border border-black p-6 rounded-xl text-center bg-zinc-50">
                            <div className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-2">Total Income</div>
                            <div className="text-3xl font-mono font-bold text-green-700">RM {totalIncome.toFixed(2)}</div>
                        </div>
                        <div className="border border-black p-6 rounded-xl text-center bg-zinc-50">
                            <div className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-2">Total Expenses</div>
                            <div className="text-3xl font-mono font-bold text-red-700">RM {totalSpends.toFixed(2)}</div>
                        </div>
                        <div className={`border-[3px] p-6 rounded-xl text-center ${totalIncome - totalSpends >= 0 ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50'}`}>
                            <div className={`text-sm font-black uppercase tracking-widest mb-2 ${totalIncome - totalSpends >= 0 ? 'text-green-800' : 'text-red-800'}`}>Net Balance</div>
                            <div className={`text-4xl font-mono font-black ${totalIncome - totalSpends >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                RM {(totalIncome - totalSpends).toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <div className="mb-10">
                        <h2 className="text-2xl font-bold border-b border-black pb-2 mb-4">Income Tracking</h2>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-black">
                                    <th className="py-3 px-2 font-bold uppercase text-xs tracking-wider">Date</th>
                                    <th className="py-3 px-2 font-bold uppercase text-xs tracking-wider">Item</th>
                                    <th className="py-3 px-2 font-bold uppercase text-xs tracking-wider">Category</th>
                                    <th className="py-3 px-2 font-bold uppercase text-xs tracking-wider">Status</th>
                                    <th className="py-3 px-2 font-bold uppercase text-xs tracking-wider text-right">Amount (RM)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200">
                                {budgetItems?.filter(i => i.type === 'income').map((item, idx) => (
                                    <tr key={idx} className="hover:bg-zinc-50">
                                        <td className="py-3 px-2 text-sm text-zinc-500">{new Date(item.created_at).toLocaleDateString()}</td>
                                        <td className="py-3 px-2 font-medium">{item.item}</td>
                                        <td className="py-3 px-2 text-sm uppercase">{item.category}</td>
                                        <td className="py-3 px-2 text-sm uppercase font-bold">{item.status}</td>
                                        <td className="py-3 px-2 font-mono font-bold text-right text-green-700">+{Number(item.amount).toFixed(2)}</td>
                                    </tr>
                                ))}
                                {(!budgetItems?.filter(i => i.type === 'income').length) && (
                                    <tr><td colSpan={5} className="py-4 text-center text-zinc-500 italic">No income records available.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold border-b border-black pb-2 mb-4">Expense Breakdown</h2>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-black">
                                    <th className="py-3 px-2 font-bold uppercase text-xs tracking-wider">Date</th>
                                    <th className="py-3 px-2 font-bold uppercase text-xs tracking-wider">Item</th>
                                    <th className="py-3 px-2 font-bold uppercase text-xs tracking-wider">Category</th>
                                    <th className="py-3 px-2 font-bold uppercase text-xs tracking-wider">Status</th>
                                    <th className="py-3 px-2 font-bold uppercase text-xs tracking-wider text-right">Amount (RM)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200">
                                {budgetItems?.filter(i => i.type === 'expense').map((item, idx) => (
                                    <tr key={idx} className="hover:bg-zinc-50">
                                        <td className="py-3 px-2 text-sm text-zinc-500">{new Date(item.created_at).toLocaleDateString()}</td>
                                        <td className="py-3 px-2 font-medium">{item.item}</td>
                                        <td className="py-3 px-2 text-sm uppercase">{item.category}</td>
                                        <td className="py-3 px-2 text-sm uppercase font-bold">{item.status}</td>
                                        <td className="py-3 px-2 font-mono font-bold text-right text-red-700">-{Number(item.amount).toFixed(2)}</td>
                                    </tr>
                                ))}
                                {(!budgetItems?.filter(i => i.type === 'expense').length) && (
                                    <tr><td colSpan={5} className="py-4 text-center text-zinc-500 italic">No expense records available.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-16 pt-8 border-t border-black grid grid-cols-2 gap-12 print:break-inside-avoid">
                        <div>
                            <p className="text-zinc-500 text-sm mb-12">Prepared By:</p>
                            <div className="border-b border-black w-full mb-2"></div>
                            <p className="font-bold">{preparedBy}</p>
                            <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Tournament Director</p>
                        </div>
                        <div>
                            <p className="text-zinc-500 text-sm mb-12">Approved By / Client Acknowledgment:</p>
                            <div className="border-b border-black w-full mb-2"></div>
                            <p className="font-bold">&nbsp;</p>
                            <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Signature & Date</p>
                        </div>
                    </div>

                </div>
            </div>
            {/* Custom print styles scoped to this modal action */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body > *:not(.report-modal-container) { display: none !important; }
                    .report-modal-container { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                        height: 100%; 
                        background: white; 
                        margin: 0; 
                        padding: 0; 
                    }
                    @page { margin: 1cm; size: auto; }
                }
            `}} />
        </div>
    );
}
