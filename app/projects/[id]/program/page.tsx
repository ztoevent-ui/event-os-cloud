'use client';

import React, { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { PrintReportButton, CopyProgramButton } from '../../components/ProjectModals';
import { usePrint } from '../../components/PrintContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core';
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
  pic: string;
  course: string;
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
  const [activeId, setActiveId]     = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [project, setProject]       = useState<any>(null);
  const [shareToken, setShareToken]  = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess]  = useState(false);
  const { pageBreakIds, layoutType } = usePrint();

  const sensors = useSensors(
    // Mouse / stylus: require a small move to distinguish from clicks
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    // Touch (iPad/tablet): press-and-hold 200ms activates drag, preventing
    // accidental activation while scrolling
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { fetchProjectAndSettings(); fetchProgram(); }, [projectId]);

  const fetchProjectAndSettings = async () => {
    const { data: projData } = await supabase.from('projects').select('type, name, program_share_token').eq('id', projectId).single();
    setProject(projData);
    if (projData?.program_share_token) setShareToken(projData.program_share_token);
    const { data: settingsData } = await supabase.from('tournament_settings').select('program_columns').eq('project_id', projectId).maybeSingle();
    if (settingsData && settingsData.program_columns?.length > 0) setColumns(settingsData.program_columns);
  };

  const generateShareLink = async () => {
    if (shareToken) {
      setShowShareModal(true);
      return;
    }
    // Generate a new token by updating the project row
    const newToken = crypto.randomUUID();
    const { error } = await supabase
      .from('projects')
      .update({ program_share_token: newToken })
      .eq('id', projectId);
    if (!error) {
      setShareToken(newToken);
      setShowShareModal(true);
    }
  };

  const copyShareLink = async () => {
    if (!shareToken) return;
    const url = `${window.location.origin}/share/program/${shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const fetchProgram = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('program_items').select('*').eq('project_id', projectId).order('sort_order', { ascending: true });
    setRows(!error && data ? data.map(r => ({ ...r, custom_data: r.custom_data || {} })) : []);
    setHasChanges(false);
    setLoading(false);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setRows(items => {
      const reordered = arrayMove(items, items.findIndex(i => i.id === active.id), items.findIndex(i => i.id === over.id));
      return reordered.map((item, idx) => ({ ...item, sort_order: idx }));
    });
    setHasChanges(true);
  };

  const handleDragCancel = () => setActiveId(null);

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
      time: '', activities: '', movement: '', cues: '', song: '', volume: '', pic: '', course: '',
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
      <div style={{ width: 36, height: 36, border: '2px solid rgb(var(--c-accent-rgb) / 0.2)', borderTopColor: 'var(--c-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'var(--c-accent)', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        Syncing Sequence Data...
      </p>
      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Kiosk Mode ───────────────────────────────────────────────────────────────
  if (isKiosk) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'var(--c-canvas)', overflowY: 'auto', padding: '48px 64px 120px' }}>
      <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 2100 }}>
        <button
          onClick={() => setIsKiosk(false)}
          className="zto-btn zto-btn-danger"
          style={{ padding: '12px 24px', fontSize: 12 }}
        >
          <i className="fa-solid fa-compress" /> EXIT KIOSK
        </button>
      </div>
      <div style={{ marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid rgb(var(--c-accent-rgb) / 0.2)' }}>
        <div className="zto-label" style={{ marginBottom: 8 }}>Tentative Program</div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: 'var(--c-ink)', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
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
              <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--c-accent-2)', letterSpacing: '0.02em' }}>
                {row.time || '—'}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: row.is_important ? '#ef4444' : 'var(--c-ink)', marginBottom: 6 }}>
                {row.activities}
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '4px' }}>
                {row.pic && <div style={{ fontSize: 13, color: 'var(--c-accent-bright)', fontWeight: 600 }}><i className="fa-solid fa-user-tie" style={{ marginRight: 6 }} />{row.pic}</div>}
                {row.course && <div style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600 }}><i className="fa-solid fa-utensils" style={{ marginRight: 6 }} />{row.course}</div>}
              </div>
              {row.movement && <div style={{ fontSize: 13, color: 'rgb(var(--c-ink-rgb) / 0.5)', marginBottom: 3 }}>{row.movement}</div>}
              {row.cues && <div style={{ fontSize: 12, color: 'rgb(var(--c-ink-rgb) / 0.35)' }}>{row.cues}</div>}
            </div>
            {(row.song || row.volume) && (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {row.song && <div style={{ fontSize: 13, color: 'var(--c-accent-bright)', fontWeight: 600 }}><i className="fa-solid fa-music" style={{ marginRight: 6 }} />{row.song}</div>}
                {row.volume && <div style={{ fontSize: 11, color: 'rgb(var(--c-ink-rgb) / 0.3)', marginTop: 4 }}>{row.volume}</div>}
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
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, color: 'var(--c-ink)', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1 }}>
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
        <button
          onClick={generateShareLink}
          className="zto-btn zto-btn-ghost"
          style={{ fontSize: 11 }}
          title="Share a public link to this program"
        >
          <i className="fa-solid fa-share-nodes" /> Share
        </button>
        <PrintReportButton title="Event Program" />
        {editMode && (
          <button onClick={addRow} className="zto-btn zto-btn-ghost" style={{ fontSize: 11 }}>
            <i className="fa-solid fa-plus" /> Add Row
          </button>
        )}
      </div>

      {/* ── Share Modal ── */}
      {showShareModal && shareToken && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={() => setShowShareModal(false)}
        >
          <div
            style={{
              background: 'var(--c-surface-solid)', border: '1px solid rgb(var(--c-accent-rgb) / 0.3)',
              borderRadius: 24, padding: 32, maxWidth: 520, width: '100%',
              boxShadow: '0 0 80px rgb(var(--c-accent-rgb) / 0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 12,
                    background: 'linear-gradient(135deg, var(--c-accent), #003d82)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 16px rgb(var(--c-accent-rgb) / 0.5)',
                  }}>
                    <i className="fa-solid fa-share-nodes" style={{ color: 'var(--c-ink)', fontSize: 14 }} />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--c-ink)', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>Share Program</h3>
                </div>
                <p style={{ fontSize: 12, color: 'rgb(var(--c-ink-rgb) / 0.4)', fontWeight: 600 }}>Anyone with this link can view the latest program — no login required.</p>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                style={{ background: 'none', border: 'none', color: 'rgb(var(--c-ink-rgb) / 0.4)', cursor: 'pointer', fontSize: 18, padding: 4 }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {/* Link Box */}
            <div style={{
              background: 'rgb(var(--c-ink-rgb) / 0.03)',
              border: '1px solid rgb(var(--c-ink-rgb) / 0.1)',
              borderRadius: 14, padding: '14px 16px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <i className="fa-solid fa-link" style={{ color: 'var(--c-accent-bright)', fontSize: 12, flexShrink: 0 }} />
              <span style={{
                flex: 1, fontSize: 12, color: 'rgb(var(--c-ink-rgb) / 0.6)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {typeof window !== 'undefined' ? `${window.location.origin}/share/program/${shareToken}` : ''}
              </span>
            </div>

            {/* Copy Button */}
            <button
              onClick={copyShareLink}
              style={{
                width: '100%', padding: '14px',
                background: copySuccess ? 'rgb(var(--c-accent-2-rgb) / 0.1)' : 'var(--c-accent)',
                border: copySuccess ? '1px solid rgb(var(--c-accent-2-rgb) / 0.4)' : 'none',
                color: copySuccess ? 'var(--c-accent-2)' : '#fff',
                borderRadius: 14, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s ease',
                boxShadow: copySuccess ? '0 0 20px rgb(var(--c-accent-2-rgb) / 0.3)' : '0 0 20px rgb(var(--c-accent-rgb) / 0.4)',
              }}
            >
              <i className={`fa-solid ${copySuccess ? 'fa-circle-check' : 'fa-copy'}`} />
              {copySuccess ? 'Copied!' : 'Copy Link'}
            </button>

            <div style={{ marginTop: 16, fontSize: 10, color: 'rgb(var(--c-ink-rgb) / 0.2)', textAlign: 'center', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Read-only · Live data · No account needed
            </div>
          </div>
        </div>
      )}

      {/* ── Program Cards (Vertical Stack) ── */}
      <div className={layoutType === 'table' ? 'print:hidden' : ''} style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}>
        {rows.length === 0 ? (
          <div className="zto-card" style={{ textAlign: 'center', padding: 64 }}>
            <i className="fa-solid fa-clipboard-list" style={{ fontSize: 40, color: 'rgb(var(--c-ink-rgb) / 0.08)', marginBottom: 20 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'rgb(var(--c-ink-rgb) / 0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 24 }}>
              No Sequence Defined
            </h3>
            <button onClick={addRow} className="zto-btn zto-btn-primary">
              <i className="fa-solid fa-plus" /> Initialize Program
            </button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
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
            <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
              {activeId ? (
                <RowCard
                  row={rows.find(r => r.id === activeId)!}
                  editMode={editMode}
                  updateCell={updateCell}
                  removeRow={removeRow}
                  toggleImportant={toggleImportant}
                  isOverlay={true}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* ── Compact Table (Print Only) ── */}
      {layoutType === 'table' && (
        <div className="hidden print:block mt-6">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #000' }}>
                <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 800, width: '14%', whiteSpace: 'nowrap' }}>Time</th>
                <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 800, width: '30%' }}>Activity / Course</th>
                <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 800, width: '32%' }}>PIC / Cues / Notes</th>
                <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 800, width: '24%' }}>BGM / Technical</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} style={{
                  borderBottom: '1px solid #ccc',
                  backgroundColor: row.is_important ? '#fff5f5' : 'transparent',
                  pageBreakInside: 'avoid',
                }}>
                  <td style={{ padding: '6px 10px', fontWeight: 700, whiteSpace: 'nowrap', verticalAlign: 'top' }}>{row.time}</td>
                  <td style={{ padding: '6px 10px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 700, fontSize: '12px' }}>{row.activities}</div>
                    {row.course && <div style={{ fontSize: '10.5px', color: '#92400e', fontWeight: 600, marginTop: 2 }}>🍴 {row.course}</div>}
                  </td>
                  <td style={{ padding: '6px 10px', verticalAlign: 'top' }}>
                    {row.pic && <div style={{ fontSize: '10.5px', fontWeight: 700, marginBottom: 2 }}>👤 PIC: {row.pic}</div>}
                    {row.cues && <div style={{ fontSize: '11px' }}>{row.cues}</div>}
                    {row.movement && <div style={{ fontSize: '10px', fontStyle: 'italic', marginTop: 2, opacity: 0.7 }}>Mov: {row.movement}</div>}
                  </td>
                  <td style={{ padding: '6px 10px', verticalAlign: 'top' }}>
                    {row.song && <div style={{ fontWeight: 700 }}>{row.song}</div>}
                    {row.volume && <div style={{ fontSize: '10px', marginTop: 2, opacity: 0.7 }}>Vol: {row.volume}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          /* Hide ALL chrome: sidebar, topbar, nav, action buttons */
          nav, aside, header, footer,
          button, [role="button"],
          .zto-action-bar { display: none !important; }

          /* Reset page layout so table fills the full A4 width */
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 11px !important;
          }

          /* Remove the main content wrapper padding/gap */
          .page-transition {
            gap: 0 !important;
            padding: 0 !important;
          }

          /* Strip all decorative styling */
          * {
            background: transparent !important;
            color: black !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif !important;
          }

          /* Compact table styling */
          table { width: 100% !important; border-collapse: collapse !important; }
          th { font-size: 10px !important; padding: 6px 8px !important; border-bottom: 2px solid #000 !important; }
          td { font-size: 11px !important; padding: 5px 8px !important; vertical-align: top !important; border-bottom: 1px solid #ccc !important; }
          tr { page-break-inside: avoid !important; }
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
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 0 : 'auto',
  };

  return (
    <motion.div
      ref={setNodeRef} style={style}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      className={isPageBreak ? 'print:break-before-page' : ''}
    >
      <RowCard
        row={row} editMode={editMode} updateCell={updateCell} removeRow={removeRow} toggleImportant={toggleImportant}
        isPlaceholder={isDragging} dragAttributes={attributes} dragListeners={listeners} setActivatorNodeRef={setActivatorNodeRef}
      />
    </motion.div>
  );
}

function RowCard({ row, editMode, updateCell, removeRow, toggleImportant, isPlaceholder, isOverlay, dragAttributes, dragListeners, setActivatorNodeRef }: any) {
  const inputStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgb(var(--c-ink-rgb) / 0.12)',
    outline: 'none',
    color: 'inherit',

    fontWeight: 'inherit',
    fontSize: 'inherit',
    width: '100%',
    padding: '2px 0',
  };

  return (
      <div
        style={{
          background: isPlaceholder ? 'rgb(var(--c-ink-rgb) / 0.04)' : (row.is_important ? 'rgba(239,68,68,0.08)' : 'rgb(var(--c-ink-rgb) / 0.04)'),
          border: isPlaceholder ? '2px dashed rgb(var(--c-accent-2-rgb) / 0.4)' : (row.is_important ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgb(var(--c-accent-rgb) / 0.3)'),
          borderRadius: 20,
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          transition: 'all 0.2s ease',
          position: 'relative',
          overflow: 'hidden',

          ...(isOverlay ? {
            cursor: 'grabbing',
            boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
            transform: 'scale(1.02)',
            zIndex: 9999,
          } : {})
        }}
        onMouseEnter={e => { if (!isPlaceholder && !isOverlay) (e.currentTarget as HTMLDivElement).style.borderColor = row.is_important ? 'rgba(239,68,68,0.5)' : 'rgb(var(--c-accent-rgb) / 0.5)'; }}
        onMouseLeave={e => { if (!isPlaceholder && !isOverlay) (e.currentTarget as HTMLDivElement).style.borderColor = row.is_important ? 'rgba(239,68,68,0.3)' : 'rgb(var(--c-accent-rgb) / 0.25)'; }}
      >
        {/* Left accent line for important */}
        {row.is_important && !isPlaceholder && (
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
            background: '#ef4444',
            boxShadow: '0 0 12px rgba(239,68,68,0.5)',
            borderRadius: '20px 0 0 20px',
          }} />
        )}

        {/* TIME Column */}
        <div style={{ minWidth: 100, flexShrink: 0, opacity: isPlaceholder ? 0.3 : 1 }}>
          {editMode && !isOverlay ? (
            <input
              value={row.time}
              onChange={e => updateCell(row.id, 'time', e.target.value, false)}
              placeholder="08:00"
              style={{ ...inputStyle, color: 'var(--c-accent-2)', fontSize: 20, fontWeight: 800, width: 100 }}
            />
          ) : (
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--c-accent-2)', letterSpacing: '0.02em' }}>
              {row.time || '—'}
            </div>
          )}
        </div>

        {/* CONTENT Center */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6, opacity: isPlaceholder ? 0.3 : 1 }}>
          {/* Activity (Title) */}
          {editMode && !isOverlay ? (
            <input
              value={row.activities}
              onChange={e => updateCell(row.id, 'activities', e.target.value, false)}
              placeholder="Activity / Programme Title"
              style={{ ...inputStyle, color: 'var(--c-ink)', fontSize: 16, fontWeight: 700 }}
            />
          ) : (
            <div style={{
              fontSize: 16, fontWeight: 700,
              color: row.is_important ? '#f87171' : 'var(--c-ink)',
            }}>
              {row.activities || <span style={{ color: 'rgb(var(--c-ink-rgb) / 0.15)' }}>—</span>}
            </div>
          )}

          {/* Extra / Movement / Cues row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 4 }}>
            {editMode && !isOverlay ? (
              <>
                <input value={row.pic} onChange={e => updateCell(row.id, 'pic', e.target.value, false)} placeholder="PIC" style={{ ...inputStyle, fontSize: 12, color: 'var(--c-accent-bright)', width: 100 }} />
                <input value={row.course} onChange={e => updateCell(row.id, 'course', e.target.value, false)} placeholder="Course Seq" style={{ ...inputStyle, fontSize: 12, color: '#f59e0b', width: 100 }} />
                <input value={row.movement} onChange={e => updateCell(row.id, 'movement', e.target.value, false)} placeholder="Movement" style={{ ...inputStyle, fontSize: 12, color: 'rgb(var(--c-ink-rgb) / 0.65)', width: 140 }} />
                <input value={row.cues} onChange={e => updateCell(row.id, 'cues', e.target.value, false)} placeholder="Staff cue / note" style={{ ...inputStyle, fontSize: 12, color: 'rgb(var(--c-ink-rgb) / 0.65)', flex: 1, minWidth: 120 }} />
              </>
            ) : (
              <>
                {row.pic && (
                  <span style={{ fontSize: 12, color: 'var(--c-accent-bright)', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                    <i className="fa-solid fa-user-tie" style={{ fontSize: 10 }} /> {row.pic}
                  </span>
                )}
                {row.course && (
                  <span style={{ fontSize: 12, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                    <i className="fa-solid fa-utensils" style={{ fontSize: 10 }} /> {row.course}
                  </span>
                )}
                {row.movement && (
                  <span style={{ fontSize: 12, color: 'rgb(var(--c-ink-rgb) / 0.65)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <i className="fa-solid fa-person-walking" style={{ fontSize: 10 }} /> {row.movement}
                  </span>
                )}
                {row.cues && (
                  <span style={{ fontSize: 12, color: 'rgb(var(--c-ink-rgb) / 0.55)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <i className="fa-solid fa-comment-dots" style={{ fontSize: 10 }} /> {row.cues}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* BGM / Volume */}
        <div style={{ minWidth: 130, flexShrink: 0, textAlign: 'right', opacity: isPlaceholder ? 0.3 : 1 }}>
          {editMode && !isOverlay ? (
            <>
              <input value={row.song} onChange={e => updateCell(row.id, 'song', e.target.value, false)} placeholder="BGM" style={{ ...inputStyle, fontSize: 12, color: 'var(--c-accent-bright)', textAlign: 'right' }} />
              <input value={row.volume} onChange={e => updateCell(row.id, 'volume', e.target.value, false)} placeholder="Vol" style={{ ...inputStyle, fontSize: 11, color: 'rgb(var(--c-ink-rgb) / 0.55)', textAlign: 'right', marginTop: 4 }} />
            </>
          ) : (
            <>
              {row.song && (
                <div style={{ fontSize: 12, color: 'var(--c-accent-bright)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                  <i className="fa-solid fa-music" style={{ fontSize: 10 }} /> {row.song}
                </div>
              )}
              {row.volume && (
                <div style={{ fontSize: 11, color: 'rgb(var(--c-ink-rgb) / 0.5)', marginTop: 4 }}>{row.volume}</div>
              )}
            </>
          )}
        </div>

        {/* Controls (edit mode only) */}
        {editMode && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 8,
            borderLeft: '1px solid rgb(var(--c-ink-rgb) / 0.07)',
            paddingLeft: 20, marginLeft: 4, flexShrink: 0,
            opacity: isPlaceholder ? 0.3 : 1
          }}>
            {/* Drag handle */}
            <button
              ref={setActivatorNodeRef}
              {...(dragAttributes || {})} {...(dragListeners || {})}
              title="Hold & drag to reorder"
              style={{
                background: 'rgb(var(--c-accent-2-rgb) / 0.08)',
                border: '1px solid rgb(var(--c-accent-2-rgb) / 0.2)',
                borderRadius: 10,
                cursor: 'grab',
                color: 'var(--c-accent-2)',
                minWidth: 48,
                minHeight: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                touchAction: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none',
              }}
            >
              <i className="fa-solid fa-grip-vertical" />
            </button>
            {!isOverlay && (
              <>
                <button
                  onClick={() => toggleImportant(row.id)}
                  title="Mark important"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: row.is_important ? '#ef4444' : 'rgb(var(--c-ink-rgb) / 0.2)', padding: 4, fontSize: 14 }}
                >
                  <i className="fa-solid fa-flag" />
                </button>
                <button
                  onClick={() => removeRow(row.id)}
                  title="Delete row"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgb(var(--c-ink-rgb) / 0.2)', padding: 4, fontSize: 13 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgb(var(--c-ink-rgb) / 0.2)'; }}
                >
                  <i className="fa-solid fa-trash-can" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
  );
}
