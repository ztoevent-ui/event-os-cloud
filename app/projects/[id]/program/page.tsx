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
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(0,86,179,0.25)',
    borderRadius: 15,
    marginBottom: 12,
    overflow: 'hidden',
    transition: 'box-shadow 0.2s, transform 0.2s',
  } as React.CSSProperties,
  cardImportant: {
    background: 'rgba(239,68,68,0.05)',
    border: '1px solid rgba(239,68,68,0.3)',
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
    <div style={{ padding: '96px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'rgba(255,255,255,0.3)' }}>
      <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 32, marginBottom: 16, color: '#0056B3' }} />
      <p style={{ fontWeight: 900, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Syncing with Command Center...</p>
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
    <div style={{ fontFamily: "'Urbanist', sans-serif", padding: '32px 48px 96px', maxWidth: 1280, margin: '0 auto' }}>

      {/* Print Header */}
      <div className="hidden print:block" style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h1 style={{ margin: 0, fontSize: '11pt', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'black', fontStyle: 'italic' }}>Tentative Program: {project?.name}</h1>
          <span style={{ fontSize: '7pt', fontWeight: 700, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase' }}>ZTO Event OS</span>
        </div>
        <div style={{ height: 1, background: '#ccc', marginTop: 2 }} />
      </div>

      {/* ── Page Header + Action Bar ── */}
      <div className="print:hidden" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingBottom: 24, borderBottom: '1px solid rgba(0,86,179,0.2)', marginBottom: 32, flexWrap: 'wrap' }}>
        {/* Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0,86,179,0.15)', border: '1px solid rgba(0,86,179,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4da3ff', flexShrink: 0 }}>
            <i className="fa-solid fa-list-ol" style={{ fontSize: 16 }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1 }}>Tentative Program</h1>
            <p style={{ margin: '5px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{project?.name || 'Event Sequence Control'}</p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Font Size */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.5)', padding: '6px 8px', borderRadius: 12, border: '1px solid rgba(0,86,179,0.3)' }}>
            {(['text-sm', 'text-base', 'text-lg', 'text-xl'] as FontSize[]).map((size, i) => (
              <button key={size} onClick={() => setFontSize(size)}
                style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: fontSize === size ? '#0056B3' : 'transparent', color: fontSize === size ? '#fff' : 'rgba(255,255,255,0.35)', fontWeight: 900, fontSize: [10, 12, 14, 16][i], cursor: 'pointer', transition: 'all 0.15s' }}>
                {['A-', 'A', 'A+', 'A⁺'][i]}
              </button>
            ))}
          </div>

          <button onClick={() => setIsKiosk(true)} className="btn-royal h-10 px-5 text-xs tracking-widest">
            <i className="fa-solid fa-expand" /> KIOSK
          </button>

          {editMode && (
            <button onClick={addColumn} style={{ height: 40, padding: '0 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
              <i className="fa-solid fa-plus" /> ADD COL
            </button>
          )}

          {editMode && hasChanges && (
            <button onClick={() => { fetchProjectAndSettings(); fetchProgram(); setEditMode(false); }}
              style={{ height: 40, padding: '0 14px', borderRadius: 10, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#ff9999', fontWeight: 900, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
              DISCARD
            </button>
          )}

          <button onClick={editMode ? saveScript : toggleEditMode} disabled={isSaving}
            className="btn-royal h-10 px-6 text-xs tracking-widest"
            style={!editMode ? { background: '#fff', color: '#0056B3', boxShadow: 'none' } : {}}>
            <i className={`fa-solid ${isSaving ? 'fa-spinner fa-spin' : editMode ? 'fa-save' : 'fa-pencil'}`} />
            {' '}{isSaving ? 'SAVING...' : editMode ? 'SAVE SCRIPT' : 'MODIFY SEQUENCE'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 12, borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <CopyProgramButton projectId={projectId} />
            <PrintReportButton title="Event Program" />
          </div>
        </div>
      </div>

      {/* ── Program Card List ── */}
      {rows.length === 0 ? (
        <div style={{ padding: '80px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <i className="fa-solid fa-clipboard-list" style={{ fontSize: 40, color: 'rgba(0,86,179,0.3)', marginBottom: 20 }} />
          <h3 style={{ fontSize: 18, fontWeight: 900, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.3em', fontStyle: 'italic', marginBottom: 8 }}>No Sequence Defined</h3>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 28 }}>Initialize the first row to begin.</p>
          <button onClick={addRow} className="btn-royal h-11 px-10 text-xs tracking-widest">
            <i className="fa-solid fa-plus" /> Initialize Sequence
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

      {editMode && rows.length > 0 && (
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
          <button onClick={addRow} style={{ height: 44, padding: '0 40px', borderRadius: 9999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,86,179,0.3)', color: 'rgba(255,255,255,0.5)', fontWeight: 900, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="fa-solid fa-plus-circle" /> Append Row
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

  const fsMap: Record<string, number> = { 'text-sm': 13, 'text-base': 15, 'text-lg': 17, 'text-xl': 20 };
  const fs = fsMap[fontSize] || 15;

  return (
    <motion.div
      ref={setNodeRef} style={style} data-row-container="true"
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      className={isPageBreak ? 'print:break-before-page' : ''}
    >
      <div style={{
        ...S.card, ...(row.is_important ? S.cardImportant : {}),
        display: 'flex', alignItems: 'stretch', position: 'relative',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 24px rgba(0,86,179,0.25)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
      >
        {/* Drag + Delete controls */}
        {editMode && (
          <div style={{ width: 52, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
            <button {...attributes} {...listeners} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'grab', fontSize: 14, padding: 4 }} title="Drag to reorder">
              <i className="fa-solid fa-grip-lines" />
            </button>
            <button onClick={() => removeRow(row.id)} style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.4)', cursor: 'pointer', fontSize: 13, padding: 4 }} title="Delete row">
              <i className="fa-solid fa-trash-can" />
            </button>
          </div>
        )}

        {/* Cells */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', minWidth: 0 }}>
          {columns.map((col: ProgramColumn, idx: number) => {
            const val = col.isCustom ? (row.custom_data?.[col.id] || '') : (row as any)[col.id];
            const isTime = col.id === 'time';
            const isActivity = col.id === 'activities';
            const isRemark = ['movement', 'cues', 'song', 'volume'].includes(col.id);

            const textColor = isTime ? '#DEFF9A' : isActivity ? (row.is_important ? '#ef4444' : '#ffffff') : 'rgba(255,255,255,0.5)';
            const textFs = isTime ? fs + 2 : isRemark ? fs - 2 : fs;
            const fw = isTime || isActivity ? 900 : 500;

            return (
              <div key={col.id} style={{ flex: `0 0 ${col.width || '16%'}`, minWidth: 0, borderRight: idx < columns.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', position: 'relative' }}>
                {editMode ? (
                  <>
                    {/* Column header in edit mode */}
                    {idx === 0 && (
                      <div style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)', padding: '8px 14px 0' }}>
                        {col.label}
                        {col.isCustom && (
                          <button onClick={() => removeColumn(col.id)} style={{ marginLeft: 6, background: 'none', border: 'none', color: 'rgba(239,68,68,0.5)', cursor: 'pointer', fontSize: 10 }}>✕</button>
                        )}
                      </div>
                    )}
                    <textarea value={val} onChange={e => updateCell(row.id, col.id, e.target.value, col.isCustom || false)}
                      style={{ width: '100%', minHeight: 64, padding: '10px 14px', background: 'transparent', border: 'none', outline: 'none', resize: 'vertical', color: textColor, fontSize: textFs, fontWeight: fw, fontFamily: "'Urbanist', sans-serif", lineHeight: 1.5 }}
                      placeholder={col.label} />
                  </>
                ) : (
                  <div style={{ padding: '14px 18px', color: textColor, fontSize: textFs, fontWeight: fw, whiteSpace: 'pre-wrap', lineHeight: 1.5, wordBreak: 'break-word' }}>
                    {val || (isTime ? '—' : '')}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Important badge */}
        {row.is_important && (
          <div style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px rgba(239,68,68,0.6)' }} />
        )}
      </div>
    </motion.div>
  );
}
