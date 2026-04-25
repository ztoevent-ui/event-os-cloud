'use client';

import React, { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { PrintReportButton, CopyProgramButton } from '../../components/ProjectModals';
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
  { id: 'time',       label: 'Time',               width: '12%' },
  { id: 'activities', label: 'Activities',          width: '26%' },
  { id: 'movement',   label: 'Movement',            width: '18%' },
  { id: 'cues',       label: 'Staff Cues / Extra',  width: '20%' },
  { id: 'song',       label: 'Song (BGM)',           width: '14%' },
  { id: 'volume',     label: 'Volume',              width: '10%' },
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

type FontSize = 'text-sm' | 'text-base' | 'text-lg' | 'text-xl';

// ─── Styles ─────────────────────────────────────────────────────────────────
const S = {
  card: {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(0, 86, 179, 0.2)',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  } as React.CSSProperties,
  cardImportant: {
    background: 'rgba(239, 68, 68, 0.05)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
  } as React.CSSProperties,
};

export default function TentativeProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const [rows, setRows]       = useState<ProgramRow[]>([]);
  const [columns, setColumns] = useState<ProgramColumn[]>(DEFAULT_COLUMNS);
  const [loading, setLoading]   = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving]     = useState(false);
  const [isKiosk, setIsKiosk]       = useState(false);
  const [fontSize, setFontSize]     = useState<FontSize>('text-base');
  const [project, setProject]       = useState<any>(null);
  const { pageBreakIds } = usePrint();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { fetchProjectAndSettings(); fetchProgram(); }, [projectId]);

  const fetchProjectAndSettings = async () => {
    const { data: projData } = await supabase.from('projects').select('type, name').eq('id', projectId).single();
    setProject(projData);
    const { data: settingsData } = await supabase.from('tournament_settings').select('program_columns').eq('project_id', projectId).single();
    if (settingsData?.program_columns && settingsData.program_columns.length > 0) setColumns(settingsData.program_columns);
  };

  const fetchProgram = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('program_items').select('*').eq('project_id', projectId).order('sort_order', { ascending: true });
    setRows(!error && data ? data.map(r => ({ ...r, custom_data: r.custom_data || {} })) : []);
    setHasChanges(false);
    setLoading(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setRows(items => {
      const reordered = arrayMove(items, items.findIndex(i => i.id === active.id), items.findIndex(i => i.id === over.id));
      return reordered.map((item, index) => ({ ...item, sort_order: index }));
    });
    setHasChanges(true);
  };

  const updateCell = (rowId: string, colId: string, value: string, isCustom: boolean) => {
    setRows(rows.map(row => {
      if (row.id !== rowId) return row;
      return isCustom ? { ...row, custom_data: { ...row.custom_data, [colId]: value } } : { ...row, [colId]: value };
    }));
    setHasChanges(true);
  };

  const addRow = () => {
    const newRow: ProgramRow = { id: `temp_${Date.now()}`, project_id: projectId, time: '', activities: '', movement: '', cues: '', song: '', volume: '', is_important: false, sort_order: rows.length, custom_data: {} };
    setRows([...rows, newRow]);
    setHasChanges(true);
  };

  const removeRow = (id: string) => {
    if (!confirm('Confirm row deletion?')) return;
    setRows(rows.filter(r => r.id !== id));
    setHasChanges(true);
  };

  const addColumn = () => {
    const colName = prompt('New column name');
    if (!colName) return;
    setColumns([...columns, { id: `custom_${Date.now()}`, label: colName, isCustom: true, width: '150px' }]);
    setHasChanges(true);
  };

  const removeColumn = (colId: string) => {
    if (!confirm('Confirm column deletion?')) return;
    setColumns(columns.filter(c => c.id !== colId));
    setHasChanges(true);
  };

  const moveColumn = (colId: string, dir: 'left' | 'right') => {
    setColumns(prev => {
      const idx = prev.findIndex(c => c.id === colId);
      if (dir === 'left' && idx > 0) return arrayMove(prev, idx, idx - 1);
      if (dir === 'right' && idx < prev.length - 1) return arrayMove(prev, idx, idx + 1);
      return prev;
    });
    setHasChanges(true);
  };

  const toggleEditMode = () => {
    if (editMode && hasChanges) { alert('Unsaved changes — click SAVE first.'); return; }
    setEditMode(!editMode);
  };

  const saveScript = async () => {
    setIsSaving(true);
    const { data: upd, error: updErr } = await supabase.from('tournament_settings').update({ program_columns: columns }).eq('project_id', projectId).select();
    if (!updErr && (!upd || upd.length === 0)) {
      await supabase.from('tournament_settings').insert({ project_id: projectId, program_columns: columns });
    }
    const { data: existingDbRows } = await supabase.from('program_items').select('id').eq('project_id', projectId);
    const existingIds = new Set(existingDbRows?.map(r => r.id) || []);
    const rowsToKeep = new Set(rows.filter(r => !r.id.startsWith('temp_')).map(r => r.id));
    const idsToDelete = Array.from(existingIds).filter(id => !rowsToKeep.has(id));
    if (idsToDelete.length > 0) await supabase.from('program_items').delete().in('id', idsToDelete);
    const indexed = rows.map((row, i) => ({ ...row, sort_order: i }));
    const toUpdate = indexed.filter(r => !r.id.startsWith('temp_'));
    const toInsert = indexed.filter(r => r.id.startsWith('temp_')).map(r => { const p = { ...r }; delete (p as any).id; return p; });
    if (toUpdate.length > 0) await supabase.from('program_items').upsert(toUpdate);
    if (toInsert.length > 0) await supabase.from('program_items').insert(toInsert);
    await fetchProgram();
    setEditMode(false);
    setIsSaving(false);
  };

  // ─── Loading state ────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
      <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-4 text-[#0056B3]" />
      <p className="text-[10px] font-black uppercase tracking-[0.2em]">Syncing Sequence Data...</p>
    </div>
  );

  // ─── Kiosk Mode ──────────────────────────────────────────────────────────
  if (isKiosk) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#050505', overflowY: 'auto', padding: '48px 64px 120px', fontFamily: "'Urbanist', sans-serif" }}>
      <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 200 }}>
        <button onClick={() => setIsKiosk(false)} style={{ height: 52, padding: '0 28px', borderRadius: 9999, background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', fontWeight: 900, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="fa-solid fa-compress" /> EXIT KIOSK
        </button>
      </div>
      <div style={{ marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid rgba(0,86,179,0.2)' }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{project?.name}</h1>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>Tentative Program — ZTO Event OS</p>
      </div>
      {rows.map(row => (
        <div key={row.id} style={{ ...S.card, ...(row.is_important ? S.cardImportant : {}), padding: '20px 28px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 24 }}>
          <div style={{ minWidth: 120, flexShrink: 0 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#DEFF9A', letterSpacing: '0.04em' }}>{row.time || '—'}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: row.is_important ? '#ef4444' : '#fff', marginBottom: 6 }}>{row.activities}</div>
            {row.movement && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 3 }}>{row.movement}</div>}
            {row.cues && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{row.cues}</div>}
          </div>
          {(row.song || row.volume) && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              {row.song && <div style={{ fontSize: 12, color: 'rgba(0,86,179,0.8)', fontWeight: 600 }}>{row.song}</div>}
              {row.volume && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{row.volume}</div>}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // ─── Main Page ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1">
      {/* Print Header */}
      <div className="hidden print:block mb-4">
        <div className="flex justify-between items-end border-b-2 border-black pb-2">
          <h1 className="text-xl font-black uppercase italic tracking-wider">Tentative Program: {project?.name}</h1>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">ZTO Event OS</span>
        </div>
      </div>

      {/* ── Page Header + Action Bar ── */}
      <div className="print:hidden flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="flex flex-col">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0056B3] mb-2">Project Sequence</p>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none">
            {project?.name || 'Loading...'}
          </h1>
        </div>

        {/* Action Hub */}
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setIsKiosk(true)}
            className="h-11 px-6 rounded-xl bg-zinc-900 border border-[#0056B3]/40 text-[#4da3ff] font-black text-[10px] tracking-widest uppercase hover:bg-[#0056B3] hover:text-white hover:shadow-[0_0_20px_rgba(0,86,179,0.4)] transition-all flex items-center gap-2.5"
          >
            <i className="fa-solid fa-expand" /> Kiosk Mode
          </button>

          <button 
            onClick={editMode ? saveScript : toggleEditMode}
            disabled={isSaving}
            className="h-11 px-8 rounded-xl bg-[#0056B3] text-white font-black text-[10px] tracking-widest uppercase shadow-[0_0_20px_rgba(0,86,179,0.3)] hover:shadow-[0_0_30px_rgba(0,86,179,0.5)] transition-all flex items-center gap-2.5 disabled:opacity-50"
          >
            <i className={`fa-solid ${isSaving ? 'fa-spinner fa-spin' : editMode ? 'fa-save' : 'fa-pencil'}`} />
            {isSaving ? 'Saving...' : editMode ? 'Save Sequence' : 'Modify Sequence'}
          </button>

          <div className="flex items-center gap-2">
            <CopyProgramButton projectId={projectId} />
            <PrintReportButton title="Event Program" />
          </div>
        </div>
      </div>

      {/* ── Program Card Grid ── */}
      <div className="flex flex-col gap-4">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
            <i className="fa-solid fa-clipboard-list text-5xl text-zinc-800 mb-6" />
            <h3 className="text-lg font-black text-zinc-600 uppercase tracking-widest">No Sequence Defined</h3>
            <button onClick={addRow} className="mt-8 h-12 px-10 rounded-xl bg-[#0056B3] text-white font-black text-xs tracking-widest uppercase">
              Initialize Program
            </button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={rows.map(r => r.id)} strategy={verticalListSortingStrategy}>
              <AnimatePresence initial={false}>
                {rows.map(row => (
                  <SortableRow key={row.id} row={row} columns={columns} editMode={editMode}
                    updateCell={updateCell} removeRow={removeRow} moveColumn={moveColumn}
                    removeColumn={removeColumn} isPageBreak={pageBreakIds.includes(row.id)} fontSize={fontSize} />
                ))}
              </AnimatePresence>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {editMode && rows.length > 0 && (
        <div className="mt-10 flex justify-center">
          <button 
            onClick={addRow}
            className="h-12 px-12 rounded-xl bg-white/5 border border-white/10 text-zinc-400 font-black text-[10px] tracking-widest uppercase hover:bg-white/10 hover:text-white transition-all flex items-center gap-3"
          >
            <i className="fa-solid fa-plus-circle" /> Append Sequence Row
          </button>
        </div>
      )}

      <style jsx global>{`
        @page { size: A4 landscape; margin: 5mm 7mm; }
        @media print {
          nav, button, .print\\:hidden, header, footer { display: none !important; }
          html, body { background: white !important; color: black !important; margin: 0 !important; padding: 0 !important; }
          .print\\:block { display: block !important; }
          * { background: transparent !important; color: black !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Sortable Row Card ───────────────────────────────────────────────────────
function SortableRow({ row, columns, editMode, updateCell, removeRow, moveColumn, removeColumn, isPageBreak, fontSize }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.7 : 1, zIndex: isDragging ? 50 : 'auto' } as React.CSSProperties;

  return (
    <motion.div
      ref={setNodeRef} style={style}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className={`group ${isPageBreak ? 'print:break-before-page' : ''}`}
    >
      <div 
        style={{ ...S.card, ...(row.is_important ? S.cardImportant : {}) }}
        className="flex items-stretch hover:border-[#0056B3]/60 hover:shadow-[0_8px_32px_rgba(0,86,179,0.15)] transition-all"
      >
        {/* Drag + Delete controls */}
        {editMode && (
          <div className="w-12 bg-white/[0.02] border-r border-white/5 flex flex-col items-center justify-center gap-4 py-4">
            <button {...attributes} {...listeners} className="text-zinc-600 hover:text-[#4da3ff] cursor-grab p-1 transition-colors">
              <i className="fa-solid fa-grip-lines" />
            </button>
            <button onClick={() => removeRow(row.id)} className="text-zinc-700 hover:text-red-500 p-1 transition-colors">
              <i className="fa-solid fa-trash-can text-sm" />
            </button>
          </div>
        )}

        {/* Cells Wrapper */}
        <div className="flex-1 flex flex-wrap md:flex-nowrap divide-x divide-white/5 overflow-hidden">
          {columns.map((col: ProgramColumn, idx: number) => {
            const val = col.isCustom ? (row.custom_data?.[col.id] || '') : (row as any)[col.id];
            const isTime = col.id === 'time';
            const isActivity = col.id === 'activities';
            
            return (
              <div 
                key={col.id} 
                style={{ flexBasis: col.width || 'auto', flexGrow: idx === 1 ? 2 : 1 }}
                className="min-w-[120px] p-4 flex flex-col"
              >
                {editMode ? (
                  <div className="flex flex-col h-full">
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-2">{col.label}</span>
                    <textarea 
                      value={val} 
                      onChange={e => updateCell(row.id, col.id, e.target.value, col.isCustom || false)}
                      className={`w-full bg-transparent border-none focus:ring-0 resize-none font-bold placeholder:text-zinc-800 ${isTime ? 'text-[#DEFF9A] text-lg' : isActivity ? 'text-white' : 'text-zinc-500 text-xs'}`}
                      placeholder={col.label}
                      rows={2}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col h-full justify-center">
                    {isTime && <span className="text-xs font-black uppercase text-zinc-600 tracking-widest mb-1">Time</span>}
                    <div className={`${isTime ? 'text-[#DEFF9A] text-xl font-black' : isActivity ? 'text-white font-black text-base' : 'text-zinc-400 text-xs font-medium'} leading-relaxed`}>
                      {val || (isTime ? '—' : '')}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Status Indicator */}
        {row.is_important && (
          <div className="w-1.5 bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
        )}
      </div>
    </motion.div>
  );
}
