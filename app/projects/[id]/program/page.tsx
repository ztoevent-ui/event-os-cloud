'use client';

import React, { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { PrintReportButton, CopyProgramButton } from '../../components/ProjectModals';
import { usePrint } from '../../components/PrintContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

interface ProgramColumn {
  id: string;
  label: string;
  width?: string;
  isCustom?: boolean;
}

const DEFAULT_COLUMNS: ProgramColumn[] = [
  { id: 'time',       label: 'Time',              width: '12%' },
  { id: 'activities', label: 'Activities',         width: '26%' },
  { id: 'movement',   label: 'Movement',           width: '18%' },
  { id: 'cues',       label: 'Staff Cues / Extra', width: '20%' },
  { id: 'song',       label: 'Song (BGM)',          width: '14%' },
  { id: 'volume',     label: 'Volume',             width: '10%' },
];

export default function TentativeProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const [rows, setRows]             = useState<ProgramRow[]>([]);
  const [columns, setColumns]       = useState<ProgramColumn[]>(DEFAULT_COLUMNS);
  const [loading, setLoading]       = useState(true);
  const [editMode, setEditMode]     = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving]     = useState(false);
  const [isKiosk, setIsKiosk]       = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [project, setProject]       = useState<any>(null);
  const { pageBreakIds, layoutType } = usePrint();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { fetchProjectAndSettings(); fetchProgram(); }, [projectId]);

  const fetchProjectAndSettings = async () => {
    const { data: projData } = await supabase.from('projects').select('type, name').eq('id', projectId).single();
    setProject(projData);
    const { data: settingsData } = await supabase.from('tournament_settings').select('program_columns').eq('project_id', projectId).maybeSingle();
    if (settingsData && settingsData.program_columns?.length > 0) setColumns(settingsData.program_columns);
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
      return reordered.map((item, idx) => ({ ...item, sort_order: idx }));
    });
    setHasChanges(true);
  };

  const updateCell = (rowId: string, colId: string, value: string, isCustom: boolean) => {
    setRows(rows.map(row => {
      if (row.id !== rowId) return row;
      return isCustom
        ? { ...row, custom_data: { ...row.custom_data, [colId]: value } }
        : { ...row, [colId]: value };
    }));
    setHasChanges(true);
  };

  const addRow = () => {
    const newRow: ProgramRow = {
      id: `temp_${Date.now()}`, project_id: projectId,
      time: '', activities: '', movement: '', cues: '', song: '', volume: '',
      is_important: false, sort_order: rows.length, custom_data: {},
    };
    setRows([...rows, newRow]);
    setHasChanges(true);
  };

  const removeRow = (id: string) => {
    if (!confirm('Confirm row deletion?')) return;
    setRows(rows.filter(r => r.id !== id));
    setHasChanges(true);
  };

  const toggleImportant = (id: string) => {
    setRows(rows.map(r => r.id === id ? { ...r, is_important: !r.is_important } : r));
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toInsert = indexed.filter(r => r.id.startsWith('temp_')).map(r => { const p = { ...r }; delete (p as any).id; return p; });
    if (toUpdate.length > 0) await supabase.from('program_items').upsert(toUpdate);
    if (toInsert.length > 0) await supabase.from('program_items').insert(toInsert);
    await fetchProgram();
    setEditMode(false);
    setIsSaving(false);
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16, opacity: 0.5 }}>
      <div style={{ width: 36, height: 36, border: '2px solid rgba(0,86,179,0.2)', borderTopColor: '#0056B3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#0056B3', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'Urbanist, sans-serif' }}>
        Syncing Sequence Data...
      </p>
      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Kiosk Mode ───────────────────────────────────────────────────────────────
  if (isKiosk) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: '#050505', overflowY: 'auto', padding: '48px 64px 120px', fontFamily: "'Urbanist', sans-serif" }}>
      <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 2100 }}>
        <button
          onClick={() => setIsKiosk(false)}
          className="zto-btn zto-btn-danger"
          style={{ padding: '12px 24px', fontSize: 12 }}
        >
          <i className="fa-solid fa-compress" /> EXIT KIOSK
        </button>
      </div>
      <div style={{ marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid rgba(0,86,179,0.2)' }}>
        <div className="zto-label" style={{ marginBottom: 8 }}>Tentative Program</div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          {project?.name}
        </h1>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {rows.map(row => (
          <div key={row.id} className="zto-card" style={{
            display: 'flex', alignItems: 'center', gap: 32,
            padding: '24px 32px',
            ...(row.is_important ? { background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.3)' } : {}),
          }}>
            <div style={{ minWidth: 120, flexShrink: 0 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#DEFF9A', letterSpacing: '0.02em' }}>
                {row.time || '—'}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: row.is_important ? '#ef4444' : '#fff', marginBottom: 6 }}>
                {row.activities}
              </div>
              {row.movement && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 3 }}>{row.movement}</div>}
              {row.cues && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{row.cues}</div>}
            </div>
            {(row.song || row.volume) && (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {row.song && <div style={{ fontSize: 13, color: '#4da3ff', fontWeight: 600 }}><i className="fa-solid fa-music" style={{ marginRight: 6 }} />{row.song}</div>}
                {row.volume && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{row.volume}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ── Main Page ─────────────────────────────────────────────────────────────────
  return (
    <div className="page-transition" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Print Header */}
      <div className="hidden print:block" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #000', paddingBottom: 8 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, textTransform: 'uppercase' }}>Tentative Program: {project?.name}</h1>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#666' }}>ZTO Event OS</span>
        </div>
      </div>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }} className="print:hidden">
        <div>
          <div className="zto-label" style={{ marginBottom: 8 }}>Project Sequence</div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {project?.name || 'Tentative Program'}
          </h1>
        </div>
      </div>

      {/* ── Fixed Action Bar ── */}
      <div className="zto-action-bar print:hidden">
        <button onClick={() => setIsKiosk(true)} className="zto-btn zto-btn-ghost" style={{ fontSize: 11 }}>
          <i className="fa-solid fa-expand" /> Kiosk
        </button>
        <button
          onClick={editMode ? saveScript : toggleEditMode}
          disabled={isSaving}
          className="zto-btn zto-btn-primary"
          style={{ fontSize: 11 }}
        >
          <i className={`fa-solid ${isSaving ? 'fa-circle-notch fa-spin' : editMode ? 'fa-floppy-disk' : 'fa-pencil'}`} />
          {isSaving ? 'Saving' : editMode ? 'Save' : 'Modify'}
        </button>
        <CopyProgramButton projectId={projectId} />
        <PrintReportButton title="Event Program" />
        {editMode && (
          <button onClick={addRow} className="zto-btn zto-btn-ghost" style={{ fontSize: 11 }}>
            <i className="fa-solid fa-plus" /> Add Row
          </button>
        )}
      </div>

      {/* ── Program Cards (Vertical Stack) ── */}
      <div className={layoutType === 'table' ? 'print:hidden' : ''} style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}>
        {rows.length === 0 ? (
          <div className="zto-card" style={{ textAlign: 'center', padding: 64 }}>
            <i className="fa-solid fa-clipboard-list" style={{ fontSize: 40, color: 'rgba(255,255,255,0.08)', marginBottom: 20 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 24 }}>
              No Sequence Defined
            </h3>
            <button onClick={addRow} className="zto-btn zto-btn-primary">
              <i className="fa-solid fa-plus" /> Initialize Program
            </button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={rows.map(r => r.id)} strategy={verticalListSortingStrategy}>
              <AnimatePresence initial={false}>
                {rows.map(row => (
                  <SortableRow
                    key={row.id}
                    row={row}
                    editMode={editMode}
                    updateCell={updateCell}
                    removeRow={removeRow}
                    toggleImportant={toggleImportant}
                    isPageBreak={pageBreakIds.includes(row.id)}
                  />
                ))}
              </AnimatePresence>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* ── Compact Table (Print Only) ── */}
      {layoutType === 'table' && (
        <div className="hidden print:block mt-6">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-2 px-2 font-bold w-[15%]">Time</th>
                <th className="py-2 px-2 font-bold w-[35%]">Activity</th>
                <th className="py-2 px-2 font-bold w-[25%]">Notes / Cues</th>
                <th className="py-2 px-2 font-bold w-[25%]">BGM / Technical</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={`border-b border-black/20 ${pageBreakIds.includes(row.id) ? 'print:break-before-page' : ''} ${row.is_important ? 'bg-red-50' : ''}`}>
                  <td className="py-2 px-2 font-bold align-top">{row.time}</td>
                  <td className="py-2 px-2 align-top">
                    <div className="font-bold text-black text-[12px]">{row.activities}</div>
                    {row.movement && <div className="text-[10px] text-black/70 mt-1 italic">Mov: {row.movement}</div>}
                  </td>
                  <td className="py-2 px-2 align-top text-black/80">{row.cues}</td>
                  <td className="py-2 px-2 align-top">
                    {row.song && <div className="font-bold text-[#0056B3]">{row.song}</div>}
                    {row.volume && <div className="text-[10px] text-black/70 mt-0.5">Vol: {row.volume}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
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

// ── Sortable Row Card ─────────────────────────────────────────────────────────
function SortableRow({ row, editMode, updateCell, removeRow, toggleImportant, isPageBreak }: {
  row: ProgramRow;
  editMode: boolean;
  updateCell: (rowId: string, colId: string, value: string, isCustom: boolean) => void;
  removeRow: (id: string) => void;
  toggleImportant: (id: string) => void;
  isPageBreak: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  const inputStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.12)',
    outline: 'none',
    color: 'inherit',
    fontFamily: 'Urbanist, sans-serif',
    fontWeight: 'inherit',
    fontSize: 'inherit',
    width: '100%',
    padding: '2px 0',
  };

  return (
    <motion.div
      ref={setNodeRef} style={style}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      className={isPageBreak ? 'print:break-before-page' : ''}
    >
      <div
        style={{
          background: row.is_important ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.025)',
          border: row.is_important ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(0,86,179,0.25)',
          borderRadius: 20,
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          transition: 'all 0.2s ease',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'Urbanist, sans-serif',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = row.is_important ? 'rgba(239,68,68,0.5)' : 'rgba(0,86,179,0.5)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = row.is_important ? 'rgba(239,68,68,0.3)' : 'rgba(0,86,179,0.25)'; }}
      >
        {/* Left accent line for important */}
        {row.is_important && (
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
            background: '#ef4444',
            boxShadow: '0 0 12px rgba(239,68,68,0.5)',
            borderRadius: '20px 0 0 20px',
          }} />
        )}

        {/* TIME Column */}
        <div style={{ minWidth: 100, flexShrink: 0 }}>
          {editMode ? (
            <input
              value={row.time}
              onChange={e => updateCell(row.id, 'time', e.target.value, false)}
              placeholder="08:00"
              style={{ ...inputStyle, color: '#DEFF9A', fontSize: 20, fontWeight: 800, width: 100 }}
            />
          ) : (
            <div style={{ fontSize: 20, fontWeight: 800, color: '#DEFF9A', letterSpacing: '0.02em' }}>
              {row.time || '—'}
            </div>
          )}
        </div>

        {/* CONTENT Center */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Activity (Title) */}
          {editMode ? (
            <input
              value={row.activities}
              onChange={e => updateCell(row.id, 'activities', e.target.value, false)}
              placeholder="Activity / Programme Title"
              style={{ ...inputStyle, color: '#fff', fontSize: 16, fontWeight: 700 }}
            />
          ) : (
            <div style={{
              fontSize: 16, fontWeight: 700,
              color: row.is_important ? '#f87171' : '#fff',
            }}>
              {row.activities || <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>}
            </div>
          )}

          {/* Movement / Cues row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 4 }}>
            {editMode ? (
              <>
                <input value={row.movement} onChange={e => updateCell(row.id, 'movement', e.target.value, false)} placeholder="Movement" style={{ ...inputStyle, fontSize: 12, color: 'rgba(255,255,255,0.5)', width: 140 }} />
                <input value={row.cues} onChange={e => updateCell(row.id, 'cues', e.target.value, false)} placeholder="Staff cue / note" style={{ ...inputStyle, fontSize: 12, color: 'rgba(255,255,255,0.5)', flex: 1, minWidth: 120 }} />
              </>
            ) : (
              <>
                {row.movement && (
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <i className="fa-solid fa-person-walking" style={{ fontSize: 10 }} /> {row.movement}
                  </span>
                )}
                {row.cues && (
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <i className="fa-solid fa-comment-dots" style={{ fontSize: 10 }} /> {row.cues}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* BGM / Volume */}
        <div style={{ minWidth: 130, flexShrink: 0, textAlign: 'right' }}>
          {editMode ? (
            <>
              <input value={row.song} onChange={e => updateCell(row.id, 'song', e.target.value, false)} placeholder="BGM" style={{ ...inputStyle, fontSize: 12, color: '#4da3ff', textAlign: 'right' }} />
              <input value={row.volume} onChange={e => updateCell(row.id, 'volume', e.target.value, false)} placeholder="Vol" style={{ ...inputStyle, fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'right', marginTop: 4 }} />
            </>
          ) : (
            <>
              {row.song && (
                <div style={{ fontSize: 12, color: '#4da3ff', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                  <i className="fa-solid fa-music" style={{ fontSize: 10 }} /> {row.song}
                </div>
              )}
              {row.volume && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{row.volume}</div>
              )}
            </>
          )}
        </div>

        {/* Controls (edit mode only) */}
        {editMode && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 8,
            borderLeft: '1px solid rgba(255,255,255,0.07)',
            paddingLeft: 20, marginLeft: 4, flexShrink: 0,
          }}>
            <button
              {...attributes} {...listeners}
              title="Drag to reorder"
              style={{ background: 'none', border: 'none', cursor: 'grab', color: '#DEFF9A', padding: 4, fontSize: 16 }}
            >
              <i className="fa-solid fa-grip-lines" />
            </button>
            <button
              onClick={() => toggleImportant(row.id)}
              title="Mark important"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: row.is_important ? '#ef4444' : 'rgba(255,255,255,0.2)', padding: 4, fontSize: 14 }}
            >
              <i className="fa-solid fa-flag" />
            </button>
            <button
              onClick={() => removeRow(row.id)}
              title="Delete row"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: 4, fontSize: 13 }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.2)'; }}
            >
              <i className="fa-solid fa-trash-can" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
