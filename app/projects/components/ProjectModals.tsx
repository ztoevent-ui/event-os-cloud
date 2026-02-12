
'use client'

import React, { useState } from 'react';
import { createTask, createTimeline, createBudget, createVendor } from '../actions';

// Generic Modal Component
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95">
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

export function AddTaskButton({ projectId }: { projectId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <button onClick={() => setIsOpen(true)} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full transition-all flex items-center gap-2 transform hover:scale-105 shadow-lg shadow-amber-500/20">
                <i className="fa-solid fa-plus"></i> Add Task
            </button>
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="New Task">
                <form action={async (formData) => {
                    await createTask(formData);
                    setIsOpen(false);
                }} className="space-y-4">
                    <input type="hidden" name="project_id" value={projectId} />
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Title</label>
                        <input name="title" required className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Task Name..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Status</label>
                            <select name="status" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500">
                                <option value="todo">Todo</option>
                                <option value="in_progress">In Progress</option>
                                <option value="review">Review</option>
                                <option value="done">Done</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Priority</label>
                            <select name="priority" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500">
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Description</label>
                        <textarea name="description" rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" placeholder="Details..."></textarea>
                    </div>
                    <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition-colors mt-4">Create Task</button>
                </form>
            </Modal>
        </>
    );
}

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
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Phone</label>
                        <input name="phone" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500" placeholder="+60..." />
                    </div>
                    <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition-colors mt-4">Add Vendor</button>
                </form>
            </Modal>
        </>
    );
}
