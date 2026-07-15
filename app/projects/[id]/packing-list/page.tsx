'use client';
import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { createPackingItem, updatePackingItem, deletePackingItem, updatePackingItemStatus } from '../../actions';
import { PrintBreakTrigger } from '../../components/PrintBreakTrigger';
import { usePrint } from '../../components/PrintContext';
import { PrintReportButton } from '../../components/ProjectModals';

// --- SHARED MODAL ---
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

// --- COMPONENTS ---

function PackingItemForm({ item, projectId, onClose, isWedding }: { item?: any, projectId: string, onClose: () => void, isWedding?: boolean }) {
    const isEdit = !!item;
    const [isLoading, setIsLoading] = useState(false);
    const focusClass = isWedding ? 'focus:border-pink-500' : 'focus:border-[#0056B3]/30';
    const btnClass = isWedding ? 'bg-pink-500 hover:bg-pink-400 shadow-pink-500/20' : 'bg-[#0056B3] hover:bg-[#0056B3] shadow-blue-900/20';

    const CATEGORIES = ['Audio', 'Lighting', 'Video', 'Structure/Truss', 'Power/Cables', 'Props', 'Tools', 'Misc'];

    return (
        <form action={async (formData) => {
            setIsLoading(true);
            if (isEdit) {
                formData.append('id', item.id);
                await updatePackingItem(formData);
            } else {
                await createPackingItem(formData);
            }
            setIsLoading(false);
            onClose();
        }} className="space-y-4">
            <input type="hidden" name="project_id" value={projectId} />
            
            <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Item Name</label>
                <input name="name" defaultValue={item?.name} required className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none ${focusClass} transition-colors`} placeholder="e.g. Wireless Mic, Extension Cord..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Category</label>
                    <select name="category" defaultValue={item?.category || 'Misc'} className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none ${focusClass}`}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Quantity</label>
                    <input type="number" name="quantity" defaultValue={item?.quantity || 1} min="1" className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none ${focusClass}`} />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Status</label>
                    <select name="status" defaultValue={item?.status || 'pending'} className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none ${focusClass}`}>
                        <option value="pending">Pending</option>
                        <option value="packed">Packed</option>
                        <option value="returned">Returned</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Remarks (Optional)</label>
                <textarea name="remarks" defaultValue={item?.remarks} className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none ${focusClass} min-h-[80px] resize-none`} placeholder="Specific notes..." />
            </div>

            <button type="submit" disabled={isLoading} className={`w-full py-3 rounded-lg text-white font-bold transition-all ${btnClass}`}>
                {isLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : isEdit ? 'Save Changes' : 'Add Item'}
            </button>
        </form>
    );
}

// --- MAIN PAGE ---

export default function PackingListPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [items, setItems] = useState<any[]>([]);
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { pageBreakIds } = usePrint();

    useEffect(() => {
        fetchData();
        
        // Listen for realtime updates
        const channel = supabase
            .channel('packing_list_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'packing_items', filter: `project_id=eq.${id}` }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    const fetchData = async () => {
        const { data: projectData } = await supabase.from('projects').select('type').eq('id', id).single();
        setProject(projectData);

        const { data: itemsData } = await supabase
            .from('packing_items')
            .select('*')
            .eq('project_id', id)
            .order('category', { ascending: true })
            .order('name', { ascending: true });
        
        setItems(itemsData || []);
        setLoading(false);
    };

    if (loading) return <div className="p-20 text-center animate-pulse">Loading Packing List...</div>;

    const isWedding = project?.type === 'wedding' || project?.type === 'wedding_fair';
    const accentColor = isWedding ? 'pink-500' : '[#0056B3]';

    // Group items by category
    const groupedItems = items.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, any[]>);

    const handleStatusToggle = async (itemId: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'pending' ? 'packed' : currentStatus === 'packed' ? 'returned' : 'pending';
        await updatePackingItemStatus(itemId, id, nextStatus);
    };

    return (
        <div className="flex flex-col flex-1 animate-in fade-in duration-700">
            {/* ── Page Header + Action Bar ── */}
            <div className="print:hidden flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                <div className="flex flex-col">
                    <p className={`text-xs font-black uppercase tracking-[0.2em] text-${accentColor} mb-2`}>Operations Hub</p>
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none font-['Urbanist']">
                        Packing List
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <PrintReportButton title="Packing List" />
                    <button onClick={() => setIsAddOpen(true)} className={`px-6 py-2.5 bg-${accentColor} text-white font-bold rounded-full transition-all flex items-center gap-2 transform hover:scale-105 shadow-lg`}>
                        <i className="fa-solid fa-plus"></i> Add Item
                    </button>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="space-y-8 print:space-y-6">
                {Object.keys(groupedItems).length === 0 ? (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-20 flex flex-col items-center justify-center opacity-50">
                        <i className="fa-solid fa-box-open text-6xl mb-6 text-zinc-700"></i>
                        <p className="text-sm font-bold tracking-widest uppercase">No items in packing list</p>
                    </div>
                ) : (
                    Object.keys(groupedItems).sort().map(category => (
                        <div key={category} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden print:bg-transparent print:border-zinc-300">
                            <div className={`bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center gap-3 print:bg-zinc-100 print:border-zinc-300`}>
                                <i className="fa-solid fa-layer-group text-zinc-500 print:text-black"></i>
                                <h2 className="text-lg font-bold text-white uppercase tracking-wide print:text-black">{category}</h2>
                                <span className="ml-auto bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded-full print:bg-white print:border print:border-zinc-300 print:text-black">
                                    {groupedItems[category].length} items
                                </span>
                            </div>
                            
                            <div className="divide-y divide-zinc-800/50 print:divide-zinc-200">
                                {groupedItems[category].map(item => (
                                    <div key={item.id} className="group flex items-center justify-between p-4 px-6 hover:bg-zinc-800/30 transition-colors print:hover:bg-transparent">
                                        <div className="flex items-center gap-6 flex-1">
                                            {/* Status Checkbox */}
                                            <button 
                                                onClick={() => handleStatusToggle(item.id, item.status)}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all print:hidden ${
                                                    item.status === 'packed' ? 'bg-emerald-500 text-white' : 
                                                    item.status === 'returned' ? 'bg-blue-500 text-white' : 
                                                    'bg-zinc-800 border border-zinc-700 text-transparent hover:border-zinc-500'
                                                }`}
                                            >
                                                {item.status === 'packed' && <i className="fa-solid fa-check text-sm"></i>}
                                                {item.status === 'returned' && <i className="fa-solid fa-rotate-left text-sm"></i>}
                                            </button>

                                            {/* Print Checkbox */}
                                            <div className="hidden print:block w-6 h-6 border-2 border-black rounded-sm shrink-0"></div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <span className={`font-medium ${item.status === 'packed' || item.status === 'returned' ? 'text-zinc-400 line-through print:text-black print:no-underline' : 'text-zinc-200 print:text-black'}`}>
                                                        {item.name}
                                                    </span>
                                                    {item.quantity > 1 && (
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isWedding ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'} print:bg-black/10 print:text-black`}>
                                                            x{item.quantity}
                                                        </span>
                                                    )}
                                                    {item.status === 'returned' && (
                                                        <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded print:hidden">Returned</span>
                                                    )}
                                                </div>
                                                {item.remarks && (
                                                    <div className="text-xs text-zinc-500 mt-1 font-light print:text-zinc-600">
                                                        <i className="fa-solid fa-info-circle mr-1 opacity-50"></i> {item.remarks}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 print:hidden ml-4">
                                            <button 
                                                onClick={() => setEditItem(item)}
                                                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                                            >
                                                <i className="fa-solid fa-pen-to-square text-xs"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modals */}
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Packing Item">
                <PackingItemForm projectId={id} onClose={() => setIsAddOpen(false)} isWedding={isWedding} />
            </Modal>

            <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit Packing Item">
                {editItem && (
                    <>
                        <PackingItemForm item={editItem} projectId={id} onClose={() => setEditItem(null)} isWedding={isWedding} />
                        <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center">
                            <span className="text-xs text-zinc-500">Danger Zone</span>
                            <button
                                onClick={async () => {
                                    if (confirm('Are you sure you want to delete this item?')) {
                                        setIsDeleting(true);
                                        const formData = new FormData();
                                        formData.append('id', editItem.id);
                                        formData.append('project_id', id);
                                        await deletePackingItem(formData);
                                        setIsDeleting(false);
                                        setEditItem(null);
                                    }
                                }}
                                disabled={isDeleting}
                                className="text-xs text-red-500 hover:text-red-400 hover:underline flex items-center gap-1"
                            >
                                {isDeleting ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-trash"></i>} Delete Item
                            </button>
                        </div>
                    </>
                )}
            </Modal>

            <style jsx global>{`
                @media print {
                    @page { size: A4 portrait; margin: 15mm; }
                    html, body, main { background: white !important; color: black !important; }
                    .print\\:hidden, nav, header, footer, button { display: none !important; }
                }
            `}</style>
        </div>
    );
}
