'use client';

import React, { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { PrintReportButton } from '../../components/ProjectModals';
import { usePrint } from '../../components/PrintContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
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
  
  // Custom Display Modes
  const [isKiosk, setIsKiosk] = useState(false);
  const [fontSize, setFontSize] = useState<'text-xs' | 'text-sm' | 'text-base' | 'text-lg' | 'text-xl' | 'text-2xl'>('text-sm');
  
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
    if (settingsData?.program_columns && settingsData.program_columns.length > 0) {
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

  // --- Dual-Axis Drag Logic --- //
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setRows((items) => {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      const reordered = arrayMove(items, oldIndex, newIndex);
      return reordered.map((item, index) => ({ ...item, sort_order: index }));
    });
    setHasChanges(true);
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

  const updateColumnWidth = (colId: string, newWidth: string) => {
    setColumns(columns.map(c => c.id === colId ? { ...c, width: newWidth } : c));
    setHasChanges(true);
  };

  const moveColumn = (colId: string, direction: 'left' | 'right') => {
    setColumns((prev) => {
      const idx = prev.findIndex(c => c.id === colId);
      if (idx === -1) return prev;
      if (direction === 'left' && idx > 0) return arrayMove(prev, idx, idx - 1);
      if (direction === 'right' && idx < prev.length - 1) return arrayMove(prev, idx, idx + 1);
      return prev;
    });
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
    if (!confirm('确定删除这行吗？(Confirm row deletion?)')) return;
    setRows(rows.filter(r => r.id !== id));
    setHasChanges(true);
  };

  const addColumn = () => {
    const colName = prompt('新列名称 (New column name)');
    if (!colName) return;
    const newColId = `custom_${Date.now()}`;
    setColumns([...columns, { id: newColId, label: colName, isCustom: true, width: '150px' }]);
    setHasChanges(true);
  };

  const removeColumn = (colId: string) => {
    if (!confirm('确认删除该列及所有数据？(Confirm column deletion?)')) return;
    setColumns(columns.filter(c => c.id !== colId));
    setHasChanges(true);
  };

  const toggleEditMode = () => {
    if (editMode && hasChanges) {
       alert("未保存修改，请先点击 SAVE SCRIPT。");
       return;
    }
    setEditMode(!editMode);
  };

  // --- Save Logic --- //
  const saveScript = async () => {
    setIsSaving(true);
    
    const { data: updateData, error: updateError } = await supabase.from('tournament_settings').update({ program_columns: columns }).eq('project_id', projectId).select();
    if (!updateError && (!updateData || updateData.length === 0)) {
        const { error: insertError } = await supabase.from('tournament_settings').insert({ project_id: projectId, program_columns: columns });
        if (insertError) alert(`Config Error: ${insertError.message}`);
    } else if (updateError) {
        alert(`Config Update Error: ${updateError.message}`);
    }

    const { data: existingDbRows } = await supabase.from('program_items').select('id').eq('project_id', projectId);
    const existingIds = new Set(existingDbRows?.map(r => r.id) || []);
    
    const rowsToKeep = new Set(rows.filter(r => !r.id.startsWith('temp_')).map(r => r.id));
    const idsToDelete = Array.from(existingIds).filter(id => !rowsToKeep.has(id));

    if (idsToDelete.length > 0) {
      await supabase.from('program_items').delete().in('id', idsToDelete);
    }

    const indexedRows = rows.map((row, index) => ({ ...row, sort_order: index }));
    const rowsToUpdate = indexedRows.filter(r => !r.id.startsWith('temp_'));
    const rowsToInsert = indexedRows.filter(r => r.id.startsWith('temp_')).map(r => {
      const payload = { ...r };
      delete (payload as any).id; 
      return payload;
    });

    if (rowsToUpdate.length > 0) await supabase.from('program_items').upsert(rowsToUpdate);
    if (rowsToInsert.length > 0) await supabase.from('program_items').insert(rowsToInsert);

    await fetchProgram(); 
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
    <div className={isKiosk ? "fixed inset-0 z-[100] bg-[#050505] h-screen w-screen overflow-y-auto px-4 py-8 md:px-12 md:py-12 pb-32 transition-all duration-500 print:relative print:inset-auto" : "space-y-6 max-w-[1500px] mx-auto pb-20 overflow-x-hidden transition-all duration-500"}>
      
      {isKiosk && (
          <div className="fixed bottom-8 right-8 z-[200]">
              <button onClick={() => setIsKiosk(false)} className="h-14 px-8 bg-black hover:bg-zinc-900 border border-red-500 text-red-500 rounded-full font-black text-xs tracking-widest flex items-center gap-3 transition-all">
                  <i className="fa-solid fa-compress"></i> EXIT KIOSK
              </button>
          </div>
      )}

      {/* Premium Header */}
      <div className={`flex flex-col xl:flex-row justify-between items-start xl:items-center bg-[#0a0a0a]/80 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/5 shadow-2xl relative z-20 ${isKiosk ? 'mb-8' : ''}`}>
        <div>
          <div className="flex items-center gap-3">
             <div className={`w-10 h-10 ${theme.bg} rounded-xl flex items-center justify-center text-black`}>
                <i className="fa-solid fa-list-check text-xl"></i>
             </div>
             <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">Tentative Program</h1>
          </div>
          <p className="text-zinc-500 mt-2 font-medium tracking-wide">Live event sequence control and production cues</p>
        </div>
        <div className="flex items-center gap-4 mt-6 xl:mt-0 flex-wrap">
            <div className="flex items-center gap-1 bg-zinc-900/50 p-1.5 rounded-full border border-white/5 mr-2 print:hidden">
              <button onClick={() => setFontSize('text-xs')} title="Small Text" className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${fontSize === 'text-xs' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>A-</button>
              <button onClick={() => setFontSize('text-base')} title="Medium Text" className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${fontSize === 'text-base' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>A</button>
              <button onClick={() => setFontSize('text-xl')} title="Large Text" className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-base ${fontSize === 'text-xl' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>A+</button>
            </div>
            {!isKiosk && (
                <button onClick={() => setIsKiosk(true)} className="h-12 px-6 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-full font-black text-[10px] tracking-widest flex items-center gap-3 border border-white/5 transition-all print:hidden">
                    <i className="fa-solid fa-expand"></i> KIOSK
                </button>
            )}
            {editMode && hasChanges && (
                <button 
                  onClick={() => { fetchProjectAndSettings(); fetchProgram(); setEditMode(false); }}
                  className="h-12 px-6 text-xs font-black rounded-full text-zinc-400 hover:text-white transition-all underline tracking-widest print:hidden"
                >
                  DISCARD
                </button>
            )}
            <button 
              onClick={editMode ? saveScript : toggleEditMode}
              disabled={isSaving}
              className={`h-12 px-8 text-xs font-black rounded-full transition-all flex items-center gap-3 border tracking-widest print:hidden ${editMode ? `${theme.bg} text-black ${theme.border} ${theme.shadow} hover:scale-105 active:scale-95` : `bg-white/5 ${theme.text} border-white/10 hover:bg-white/10`}`}
            >
              <i className={`fa-solid ${isSaving ? 'fa-spinner fa-spin' : editMode ? 'fa-save' : 'fa-pencil'}`}></i>
              {isSaving ? 'SAVING...' : editMode ? 'SAVE SCRIPT' : 'MODIFY SEQUENCE'}
            </button>
            <PrintReportButton title="Event Program" />
        </div>
      </div>

      <div className="bg-[#050505] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto print:overflow-visible print:w-full">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table className="w-full text-left border-collapse min-w-[1200px] print:min-w-full print:w-full">
              <thead>
                <tr className="bg-zinc-900/40 border-b border-white/5 text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500">
                  {editMode && <th className="p-4 w-20 text-center">Ctrls</th>}
                  {columns.map(col => (
                    <ColumnHeader key={`col_${col.id}`} col={col} editMode={editMode} removeColumn={removeColumn} updateColumnWidth={updateColumnWidth} moveColumn={moveColumn} theme={theme} />
                  ))}
                  {editMode && (
                    <th className="p-4 w-32 border-l border-white/5 text-center">
                      <button onClick={addColumn} className={`text-[10px] ${theme.text} font-black hover:scale-110 transition-transform`}><i className="fa-solid fa-plus mr-1"></i>ADD COL</button>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <SortableContext items={rows.map(r => r.id)} strategy={verticalListSortingStrategy}>
                  <AnimatePresence initial={false}>
                    {rows.map(row => (
                      <SortableRow key={row.id} row={row} columns={columns} editMode={editMode} updateCell={updateCell} removeRow={removeRow} theme={theme} isPageBreak={pageBreakIds.includes(row.id)} fontSize={fontSize} />
                    ))}
                  </AnimatePresence>
                </SortableContext>
              </tbody>
            </table>
          </DndContext>
          
          {(rows.length === 0 && !loading) && (
            <div className="py-32 flex flex-col items-center justify-center bg-white/[0.02] border-t border-white/5">
              <h3 className="text-2xl font-black text-zinc-400 uppercase tracking-[0.3em] mb-3 italic">No Sequence Defined</h3>
              <p className="text-zinc-600 font-medium text-xs mt-2 uppercase tracking-widest">Initialize the sequence.</p>
              <div className="mt-10 print:hidden">
                <button onClick={addRow} className={`h-14 px-12 bg-zinc-900 ${theme.text} rounded-2xl border ${theme.border} text-[10px] font-black uppercase tracking-[0.3em]`}>Initialize First Row</button>
              </div>
            </div>
          )}
          
          {editMode && rows.length > 0 && (
            <div className="p-8 bg-zinc-900/20 border-t border-white/5 flex justify-center">
              <button onClick={addRow} className={`h-14 px-12 bg-zinc-800 text-white ${theme.bgHover} active:scale-95 text-[10px] uppercase tracking-[0.3em] font-black rounded-full transition-all flex items-center gap-4 shadow-2xl`}>
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
          .border-white\\/5, .border-r, .border-l { border-color: #eee !important; }
          .text-zinc-500, .text-zinc-400, .text-zinc-700 { color: #666 !important; }
          .text-white, .text-zinc-100, .text-zinc-200 { color: black !important; }
          .print-page-break, .print\\:break-before-page { break-before: page !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th { background: #f5f5f5 !important; color: black !important; -webkit-print-color-adjust: exact; }
          td, th { border: 1px solid #eee !important; padding: 8px !important; }
          .rounded-\\[2rem\\], .rounded-\\[2\\.5rem\\], .rounded-xl { border-radius: 0 !important; }
          .shadow-2xl, .shadow-xl { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}

// ------ Horizontal Column Header Component (Manual Arrow Ordering) ------ //
function ColumnHeader({ col, editMode, removeColumn, updateColumnWidth, moveColumn, theme }: any) {
  const style = { width: col.width || 'auto' };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const th = (e.target as HTMLElement).closest('th');
    const startWidth = th?.getBoundingClientRect().width || 150;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      updateColumnWidth(col.id, `${Math.max(60, startWidth + deltaX)}px`);
    };

    const onMouseUp = () => {
       document.removeEventListener('mousemove', onMouseMove);
       document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <th style={style} className={`p-4 border-r border-white/5 relative group align-middle ${editMode ? 'hover:bg-white/[0.02]' : ''}`}>
      <div className="flex items-center justify-between gap-2 h-full">
        <div className="flex-1 flex items-center gap-3">
           {editMode && (
             <div className="flex gap-1 print:hidden opacity-30 group-hover:opacity-100 transition-opacity">
               <button onClick={() => moveColumn(col.id, 'left')} className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"><i className="fa-solid fa-chevron-left text-[8px]"></i></button>
               <button onClick={() => moveColumn(col.id, 'right')} className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"><i className="fa-solid fa-chevron-right text-[8px]"></i></button>
             </div>
           )}
           <span className="truncate">{col.label}</span>
        </div>
        
        {editMode && col.isCustom && (
           <button onClick={() => removeColumn(col.id)} className="text-zinc-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity print:hidden shrink-0">
             <i className="fa-solid fa-times text-xs"></i>
           </button>
        )}
      </div>

      {/* Invisible Custom Vertical Drag Handle for Width Setting */}
      {editMode && (
        <div
            onMouseDown={handleResizeStart}
            className={`absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/20 transition-colors z-10`}
        />
      )}
    </th>
  );
}

// ------ Vertical Sortable Row Component ------ //
function SortableRow({ row, columns, editMode, updateCell, removeRow, theme, isPageBreak, fontSize }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
  
  // Custom height logic based on JSONB property
  const rowHeight = row.custom_data?.rowHeight || 'auto';

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    height: rowHeight,
    // When absolute sizing is applied, ensure minimal height constraints
    ...(isDragging ? { zIndex: 50, position: 'relative' as any, opacity: 0.8, shadow: '0 10px 30px rgba(0,0,0,0.5)', background: 'black' } : {})
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const tr = (e.target as HTMLElement).closest('tr');
    const startHeight = tr?.getBoundingClientRect().height || 50;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(20, startHeight + deltaY);
      updateCell(row.id, 'rowHeight', `${newHeight}px`, true);
    };

    const onMouseUp = () => {
       document.removeEventListener('mousemove', onMouseMove);
       document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <motion.tr 
      ref={setNodeRef} style={style}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className={`group transition-colors relative ${row.is_important ? 'bg-red-500/5' : 'hover:bg-white/[0.02]'} ${isPageBreak ? 'print:break-before-page' : ''}`}
    >
      {editMode && (
        <td className="p-0 border-r border-white/5 text-center bg-[#050505]/50 align-top relative min-h-full">
           <div className="flex flex-col gap-3 items-center pt-4 relative z-10 h-full">
              <button {...attributes} {...listeners} className="text-zinc-600 hover:text-white cursor-grab active:cursor-grabbing p-2"><i className="fa-solid fa-grip-lines"></i></button>
              <button onClick={() => removeRow(row.id)} className="text-zinc-700 hover:text-red-500 p-2 rounded-xl transition-all"><i className="fa-solid fa-trash-can"></i></button>
           </div>
           {/* Invisible Custom Horizontal Drag Handle for Height Setting placed ONLY on this first column cell! */}
           <div 
             onMouseDown={handleResizeStart}
             title="Drag to resize row height"
             className="absolute bottom-0 left-0 right-0 h-3 cursor-row-resize hover:bg-white/10 z-20 transition-all flex items-center justify-center print:hidden border-b border-transparent hover:border-white/20"
           >
              <div className="w-4 h-0.5 bg-zinc-600 opacity-50 rounded-full" />
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
                className={`w-full h-full min-h-0 p-1 md:p-2 bg-transparent resize-none outline-none ${theme.bgFocus} ${fontSize} font-bold ${row.is_important && col.id === 'activities' ? 'text-red-500' : 'text-zinc-300'} placeholder-zinc-800 transition-colors`}
                placeholder={col.label.toUpperCase()}
              />
            ) : (
              <div className={`p-1 md:p-2 ${fontSize} whitespace-pre-wrap leading-relaxed font-bold ${row.is_important && col.id === 'activities' ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'text-zinc-300'}`}>
                {val}
              </div>
            )}
          </td>
        );
      })}
    </motion.tr>
  );
}
