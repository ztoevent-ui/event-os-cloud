'use client';

import React, { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { PrintReportButton } from '../../components/ProjectModals';
import { PrintBreakTrigger } from '../../components/PrintBreakTrigger';
import { usePrint } from '../../components/PrintContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProgramColumn {
  id: string;
  label: string;
  width?: string;
  isCustom?: boolean;
}

const DEFAULT_COLUMNS: ProgramColumn[] = [
  { id: 'time', label: 'Time', width: '14%' },
  { id: 'activities', label: 'Activities', width: '22%' },
  { id: 'movement', label: 'Movement', width: '18%' },
  { id: 'cues', label: 'Staff Cues / Extra', width: '20%' },
  { id: 'song', label: 'Song (BGM)', width: '16%' },
  { id: 'volume', label: 'Volume', width: '10%' },
];

interface ProgramRow {
  id: string;
  project_id: string;
  time: string;
  activities: string;
  movement: string;
  cues: string;
  song: string;
  volume: string;
  is_important?: boolean;
  sort_order: number;
  custom_data: Record<string, string>;
}

export default function TentativeProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const [rows, setRows] = useState<ProgramRow[]>([]);
  const [columns, setColumns] = useState<ProgramColumn[]>(DEFAULT_COLUMNS);
  
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [project, setProject] = useState<any>(null);
  const { pageBreakIds } = usePrint();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchProjectAndSettings();
    fetchProgram();
  }, [projectId]);

  const fetchProjectAndSettings = async () => {
    const { data: projData } = await supabase.from('projects').select('type').eq('id', projectId).single();
    setProject(projData);

    const { data: settingsData } = await supabase.from('tournament_settings').select('program_columns').eq('project_id', projectId).single();
    if (settingsData?.program_columns) {
      setColumns(settingsData.program_columns);
    }
  };
  
  const fetchProgram = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('program_items')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });
    
    if (!error && data) {
      setRows(data.map(r => ({ ...r, custom_data: r.custom_data || {} })));
    } else {
      setRows([]);
    }
    setHasChanges(false);
    setLoading(false);
  };

  const isWedding = project?.type === 'wedding' || project?.type === 'wedding_fair';
  const theme = isWedding ? {
    text: 'text-pink-500', bg: 'bg-pink-500', border: 'border-pink-400', shadow: 'shadow-[0_0_20px_rgba(236,72,153,0.3)]',
    text70: 'text-pink-500/70', text80: 'text-pink-500/80', bgFocus: 'focus:bg-pink-500/5', bgHover: 'hover:bg-pink-500'
  } : {
    text: 'text-amber-500', bg: 'bg-amber-500', border: 'border-amber-400', shadow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    text70: 'text-amber-500/70', text80: 'text-amber-500/80', bgFocus: 'focus:bg-amber-500/5', bgHover: 'hover:bg-amber-500'
  };

  // --- Modifications (Local State) --- //
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setRows((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);
        // Update sort_order explicitly
        return reordered.map((item, index) => ({ ...item, sort_order: index }));
      });
      setHasChanges(true);
    }
  };

  const updateCell = (rowId: string, colId: string, value: string, isCustom: boolean) => {
    setRows(rows.map(row => {
      if (row.id !== rowId) return row;
      if (isCustom) {
        return { ...row, custom_data: { ...row.custom_data, [colId]: value } };
      }
      return { ...row, [colId]: value };
    }));
    setHasChanges(true);
  };

  const addRow = () => {
    const newId = `temp_${Date.now()}`;
    const newRow: ProgramRow = {
      id: newId, project_id: projectId, time: '', activities: '', movement: '', cues: '', song: '', volume: '',
      is_important: false, sort_order: rows.length, custom_data: {}
    };
    setRows([...rows, newRow]);
    setHasChanges(true);
  };

  const removeRow = (id: string) => {
    if (!confirm('确定要删除这一行吗？(Are you sure you want to delete this row?)')) return;
    setRows(rows.filter(r => r.id !== id));
    setHasChanges(true);
  };

  const addColumn = () => {
    const colName = prompt('What is the name of the new column? (新列的名称)');
    if (!colName) return;
    const newColId = `custom_${Date.now()}`;
    setColumns([...columns, { id: newColId, label: colName, isCustom: true }]);
    setHasChanges(true);
  };

  const removeColumn = (colId: string) => {
    if (!confirm('This will delete the column and all its data. Confirm? (确认删除该列及所有数据？)')) return;
    setColumns(columns.filter(c => c.id !== colId));
    setHasChanges(true);
  };

  const toggleEditMode = () => {
    if (editMode && hasChanges) {
       alert("You have unsaved changes. Please click 'SAVE SCRIPT' or discard changes first.");
       return;
    }
    setEditMode(!editMode);
  };

  // --- Save Logic --- //
  const saveScript = async () => {
    setIsSaving(true);
    
    // 1. Save Columns Format to Settings
    await supabase.from('tournament_settings').update({ program_columns: columns }).eq('project_id', projectId);

    // 2. Identify Rows to Insert/Update and Delete
    const { data: existingDbRows } = await supabase.from('program_items').select('id').eq('project_id', projectId);
    const existingIds = new Set(existingDbRows?.map(r => r.id) || []);
    
    const rowsToKeep = new Set(rows.filter(r => !r.id.startsWith('temp_')).map(r => r.id));
    const idsToDelete = Array.from(existingIds).filter(id => !rowsToKeep.has(id));

    if (idsToDelete.length > 0) {
      await supabase.from('program_items').delete().in('id', idsToDelete);
    }

    // 3. Split remaining rows into Updates and Inserts to avoid Supabase schema mismatch
    const indexedRows = rows.map((row, index) => ({ ...row, sort_order: index }));
    
    const rowsToUpdate = indexedRows.filter(r => !r.id.startsWith('temp_'));
    const rowsToInsert = indexedRows.filter(r => r.id.startsWith('temp_')).map(r => {
      const payload = { ...r };
      delete (payload as any).id; // Remove the temp ID so the database can generate a true UUID
      return payload;
    });

    if (rowsToUpdate.length > 0) {
      const { error } = await supabase.from('program_items').upsert(rowsToUpdate);
      if (error) alert(`Error updating rows: ${error.message}`);
    }

    if (rowsToInsert.length > 0) {
      const { error } = await supabase.from('program_items').insert(rowsToInsert);
      if (error) alert(`Error inserting new rows: ${error.message}`);
    }

    await fetchProgram(); // Re-sync local state with DB IDs
    setEditMode(false);
    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
        <i className={`fa-solid fa-circle-notch animate-spin text-4xl mb-6 ${theme.text}`}></i>
        <p className="font-black text-sm uppercase tracking-widest italic">Syncing with Command Center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto pb-20 overflow-x-hidden">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#0a0a0a]/80 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/5 shadow-2xl relative z-20">
        <div>
          <div className="flex items-center gap-3">
             <div className={`w-10 h-10 ${theme.bg} rounded-xl flex items-center justify-center text-black`}>
                <i className="fa-solid fa-list-check text-xl"></i>
             </div>
             <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">Tentative Program</h1>
          </div>
          <p className="text-zinc-500 mt-2 font-medium tracking-wide">Live event sequence control and production cues</p>
        </div>
        <div className="flex items-center gap-4 mt-6 md:mt-0">
            {editMode && hasChanges && (
                <button 
                  onClick={() => { fetchProgram(); setColumns(DEFAULT_COLUMNS); setEditMode(false); }}
                  className="h-12 px-6 text-xs font-black rounded-full text-zinc-400 hover:text-white transition-all underline tracking-widest"
                >
                  DISCARD
                </button>
            )}
            <button 
              onClick={editMode ? saveScript : toggleEditMode}
              disabled={isSaving}
              className={`h-12 px-8 text-xs font-black rounded-full transition-all flex items-center gap-3 border tracking-widest ${editMode ? `${theme.bg} text-black ${theme.border} ${theme.shadow} hover:scale-105 active:scale-95` : `bg-white/5 ${theme.text} border-white/10 hover:bg-white/10`}`}
            >
              <i className={`fa-solid ${isSaving ? 'fa-spinner fa-spin' : editMode ? 'fa-save' : 'fa-pencil'}`}></i>
              {isSaving ? 'SAVING...' : editMode ? 'SAVE SCRIPT' : 'MODIFY SEQUENCE'}
            </button>
            <PrintReportButton title="Event Program" />
        </div>
      </div>

      {/* Modern Table Container */}
      <div className="bg-[#050505] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-zinc-900/40 border-b border-white/5 text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500">
                {editMode && <th className="p-6 w-20 text-center">Ctrls</th>}
                {columns.map(col => (
                   <th key={col.id} className="p-6 border-r border-white/5 relative group" style={{ width: col.width || 'auto' }}>
                     {col.label}
                     {editMode && col.isCustom && (
                        <button onClick={() => removeColumn(col.id)} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <i className="fa-solid fa-times"></i>
                        </button>
                     )}
                   </th>
                ))}
                {editMode && (
                   <th className="p-6 w-32 border-r border-white/5 text-center">
                     <button onClick={addColumn} className={`text-xs ${theme.text} font-black hover:scale-110 transition-transform`}><i className="fa-solid fa-plus mr-2"></i>ADD COL</button>
                   </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={rows.map(r => r.id)} strategy={verticalListSortingStrategy}>
                  <AnimatePresence initial={false}>
                    {rows.map((row, index) => (
                      <SortableRow key={row.id} row={row} columns={columns} editMode={editMode} updateCell={updateCell} removeRow={removeRow} theme={theme} isPageBreak={pageBreakIds.includes(row.id)} />
                    ))}
                  </AnimatePresence>
                </SortableContext>
              </DndContext>
            </tbody>
          </table>
          
          {(rows.length === 0 && !loading) && (
            <div className="py-32 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.02] group hover:border-white/10 transition-all mx-8 my-8">
              <div className="relative mb-8">
                <div className={`absolute inset-0 blur-3xl opacity-20 ${theme.bg}`}></div>
                <i className={`fa-solid fa-layer-group text-7xl relative z-10 ${theme.text} opacity-30 group-hover:scale-110 transition-transform duration-700`}></i>
              </div>
              <h3 className="text-2xl font-black text-zinc-400 uppercase tracking-[0.3em] mb-3 italic">No Sequence Defined</h3>
              <p className="text-zinc-600 font-medium text-xs max-w-sm text-center border-t border-white/5 pt-6 mt-2 tracking-widest leading-loose uppercase">
                Your live production script is currently blank. <br/>
                Initialize the sequence to generate automated cues.
              </p>
              <div className="mt-10 print:hidden">
                <button onClick={addRow} className={`h-14 px-12 bg-zinc-900 ${theme.text} rounded-2xl border ${theme.border} text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-white hover:text-black transition-all`}>
                   Initialize First Row
                </button>
              </div>
            </div>
          )}
          
          {editMode && rows.length > 0 && (
            <div className="p-8 bg-zinc-900/20 border-t border-white/5 flex justify-center">
              <button onClick={addRow} className={`h-14 px-12 bg-zinc-800 text-white ${theme.bgHover} hover:scale-105 active:scale-95 text-[10px] uppercase tracking-[0.3em] font-black rounded-full transition-all flex items-center gap-4 shadow-2xl`}>
                <i className="fa-solid fa-plus-circle text-lg"></i> Append Sequence Row
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Visual Footer */}
      <div className="flex justify-between items-center px-8 text-[10px] font-black tracking-[0.4em] text-zinc-800 uppercase print:text-zinc-400 sticky bottom-0 bg-black/80 backdrop-blur-md py-4 z-20">
         <div className="flex items-center gap-3">
            <img src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG" alt="ZTO" crossOrigin="anonymous" className="w-4 h-4 grayscale opacity-30" />
            <span>ZTO Operational Protocol • 2026</span>
         </div>
         <div>Strictly Confidential • Production Use Only</div>
      </div>

      <style jsx global>{`
        @media print {
          nav, button, .print\\:hidden { display: none !important; }
          body { background: white !important; color: black !important; }
          .bg-zinc-900, .bg-\\[\\#0a0a0a\\]\\/80, .bg-\\[\\#050505\\] { background: transparent !important; color: black !important; }
          .border-white\\/5, .border-r { border-color: #eee !important; }
          .text-zinc-500, .text-zinc-400, .text-zinc-700 { color: #666 !important; }
          .text-white, .text-zinc-100, .text-zinc-200 { color: black !important; }
          .print-page-break, .print\\:break-before-page { break-before: page !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th { background: #f5f5f5 !important; color: black !important; -webkit-print-color-adjust: exact; }
          td, th { border: 1px solid #eee !important; padding: 12px !important; }
          .rounded-\\[2rem\\], .rounded-\\[2\\.5rem\\], .rounded-xl { border-radius: 0 !important; }
          .shadow-2xl, .shadow-xl { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}

function SortableRow({ row, columns, editMode, updateCell, removeRow, theme, isPageBreak }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { zIndex: 50, position: 'relative' as any, opacity: 0.8, background: '#111' } : {})
  };

  return (
    <motion.tr 
      ref={setNodeRef} style={style}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className={`group transition-colors relative ${row.is_important ? 'bg-red-500/5' : 'hover:bg-white/[0.02]'} ${isPageBreak ? 'print:break-before-page' : ''}`}
    >
      {editMode && (
        <td className="p-4 border-r border-white/5 text-center bg-[#050505]/50 align-top">
           <div className="flex flex-col gap-3 items-center justify-center pt-2">
              <button {...attributes} {...listeners} className="text-zinc-600 hover:text-white cursor-grab active:cursor-grabbing p-2"><i className="fa-solid fa-grip-lines"></i></button>
              <button onClick={() => removeRow(row.id)} className="text-zinc-700 hover:text-red-500 p-2 rounded-xl hover:bg-red-500/10 transition-all"><i className="fa-solid fa-trash-can"></i></button>
           </div>
        </td>
      )}
      
      {columns.map((col: any) => {
        const val = col.isCustom ? (row.custom_data?.[col.id] || '') : row[col.id];
        return (
          <td key={col.id} className="p-0 border-r border-white/5 align-top relative">
            {editMode ? (
              <textarea
                value={val}
                onChange={(e) => updateCell(row.id, col.id, e.target.value, col.isCustom)}
                className={`w-full h-full p-6 min-h-[100px] bg-transparent resize-none outline-none ${theme.bgFocus} text-sm font-bold ${row.is_important && col.id === 'activities' ? 'text-red-500' : 'text-zinc-300'} placeholder-zinc-800 transition-colors`}
                placeholder={col.label.toUpperCase()}
              />
            ) : (
              <div className={`p-6 text-sm whitespace-pre-wrap leading-relaxed font-bold ${row.is_important && col.id === 'activities' ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'text-zinc-300'}`}>
                {val}
              </div>
            )}
          </td>
        );
      })}
      
      {editMode && (
         <td className="p-0 bg-zinc-950/20 align-top text-zinc-800 italic flex items-center justify-center pt-8 text-xs border-r border-white/5 relative">
            {/* Empty space for adding col aligner */}
            {row.is_important && (
                 <button onClick={() => updateCell(row.id, 'is_important', 'false', false)} className="absolute bottom-2 right-2 text-red-500 text-[10px] font-black tracking-widest bg-red-500/10 px-2 py-1 rounded">UNMARK</button>
            )}
            {!row.is_important && (
                 <button onClick={() => updateCell(row.id, 'is_important', 'true', false)} className="absolute bottom-2 right-2 text-zinc-500 hover:text-white text-[10px] font-black tracking-widest bg-zinc-800 px-2 py-1 rounded">MARK</button>
            )}
         </td>
      )}
    </motion.tr>
  );
}
