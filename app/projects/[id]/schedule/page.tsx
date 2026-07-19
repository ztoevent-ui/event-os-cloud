'use client';

import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface ScheduleItem {
  id: string;
  project_id: string;
  date: string;
  time: string;
  title: string;
  note: string;
  transport: string;
  assignee: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
  sort_order: number;
}

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function DroppableDayButton({ dateString, isSelected, hasTasks, allDone, day, onClick }: any) {
  const { isOver, setNodeRef } = useDroppable({ id: dateString });
  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={`h-10 rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-95 ${
        isOver
          ? 'bg-emerald-500/20 ring-2 ring-emerald-500 text-emerald-400'
          : isSelected
          ? 'bg-[#0056B3] text-white shadow-[0_0_15px_rgba(0,86,179,0.5)]'
          : 'hover:bg-white/5 text-zinc-400 hover:text-white'
      }`}
    >
      <span className="text-sm font-black font-['Urbanist'] tabular-nums">{day}</span>
      {hasTasks && (
        <div className={`absolute bottom-1.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : allDone ? 'bg-emerald-500' : 'bg-[#4da3ff]'}`}></div>
      )}
    </button>
  );
}

function SortableScheduleRow({ item, editMode, handleFieldChange, removeItem, cycleStatus, getStatusLabel }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 10 : 1,
    position: isDragging ? 'relative' : 'static',
  };

  return (
    <div
      ref={setNodeRef}
      style={style as any}
      className={`group grid grid-cols-[130px_1.5fr_1fr_100px_100px_110px] gap-0 px-4 py-3 items-center transition-all hover:bg-white/[0.03] border-b border-white/[0.04] last:border-b-0 ${item.status === 'DONE' && !editMode ? 'opacity-40' : ''}`}
    >
      {/* Time with drag handle */}
      <div className="shrink-0 flex items-center">
        {editMode && (
          <div {...attributes} {...listeners} className="shrink-0 w-6 h-6 mr-2 flex items-center justify-center text-zinc-600 hover:text-white cursor-grab active:cursor-grabbing rounded">
            <i className="fa-solid fa-grip-vertical"></i>
          </div>
        )}
        {editMode ? (
          <input type="text" defaultValue={item.time} onBlur={e => handleFieldChange(item.id, 'time', e.target.value)}
            className="bg-transparent border-b border-white/10 text-xs font-black text-[#4da3ff] outline-none py-0.5 focus:border-[#0056B3] w-full" placeholder="09:00 - 10:00" />
        ) : (
          <span className="text-sm font-black text-[#4da3ff] font-['Urbanist'] tabular-nums tracking-tight whitespace-nowrap">{item.time || '—'}</span>
        )}
      </div>

      {/* Task */}
      <div className="min-w-0 pr-3">
        {editMode ? (
          <input type="text" defaultValue={item.title} onBlur={e => handleFieldChange(item.id, 'title', e.target.value)}
            className="bg-transparent border-b border-white/10 text-xs font-black text-white outline-none py-0.5 focus:border-[#0056B3] w-full" placeholder="Task Name" />
        ) : (
          <span className="text-xs font-black text-white tracking-tight truncate block">{item.title || '—'}</span>
        )}
      </div>

      {/* Note */}
      <div className="min-w-0 pr-3">
        {editMode ? (
          <input type="text" defaultValue={item.note} onBlur={e => handleFieldChange(item.id, 'note', e.target.value)}
            className="bg-transparent border-b border-white/10 text-xs text-zinc-400 outline-none py-0.5 focus:border-[#0056B3] w-full" placeholder="Remarks..." />
        ) : (
          <span className="text-xs text-zinc-500 truncate block">{item.note || '—'}</span>
        )}
      </div>

      {/* Assignee */}
      <div className="shrink-0">
        {editMode ? (
          <input type="text" defaultValue={item.assignee} onBlur={e => handleFieldChange(item.id, 'assignee', e.target.value)}
            className="bg-transparent border-b border-white/10 text-[10px] font-black text-zinc-300 uppercase outline-none py-0.5 focus:border-[#0056B3] w-full" placeholder="Assignee" />
        ) : (
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider truncate block">{item.assignee || '—'}</span>
        )}
      </div>

      {/* Transport */}
      <div className="shrink-0">
        {editMode ? (
          <input type="text" defaultValue={item.transport} onBlur={e => handleFieldChange(item.id, 'transport', e.target.value)}
            className="bg-transparent border-b border-white/10 text-[10px] font-black text-zinc-300 uppercase outline-none py-0.5 focus:border-[#0056B3] w-full" placeholder="Transport" />
        ) : (
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider truncate block">{item.transport || '—'}</span>
        )}
      </div>

      {/* Status + Delete */}
      <div className="flex items-center justify-end gap-2">
        {editMode && (
          <button onClick={() => removeItem(item.id)} className="w-6 h-6 rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <i className="fa-solid fa-trash text-[8px]" />
          </button>
        )}
        <button
          onClick={() => cycleStatus(item.id, item.status)}
          className={`h-7 px-3 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all active:scale-95 whitespace-nowrap ${
            item.status === 'DONE'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : item.status === 'IN_PROGRESS'
              ? 'bg-[#0056B3]/20 text-[#4da3ff] border-[#0056B3]/30'
              : 'bg-zinc-800/50 text-zinc-500 border-zinc-700/50'
          }`}
        >
          {getStatusLabel(item.status)}
        </button>
      </div>
    </div>
  );
}

export default function EventSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [project, setProject] = useState<any>(null);

  // Selected date for editing
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  // Print / export selection
  const [showPrintPanel, setShowPrintPanel] = useState(false);
  const [selectedPrintDates, setSelectedPrintDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProject();
    fetchSchedule();

    const channel = supabase
      .channel('schedule_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_items', filter: `project_id=eq.${projectId}` }, () => {
        fetchSchedule();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId]);

  const fetchProject = async () => {
    const { data } = await supabase.from('projects').select('*').eq('id', projectId).single();
    setProject(data);
    if (data?.start_date) {
      const pDate = new Date(data.start_date);
      setCurrentMonthDate(pDate);
      setSelectedDate(data.start_date);
    }
  };

  const fetchSchedule = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('schedule_items')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: true })
      .order('sort_order', { ascending: true });
    if (!error) setSchedule(data || []);
    setLoading(false);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DONE': return 'DONE';
      case 'IN_PROGRESS': return 'IN PROGRESS';
      default: return 'STANDBY';
    }
  };

  const cycleStatus = async (id: string, current: string) => {
    const nextStatus = current === 'PENDING' ? 'IN_PROGRESS' : current === 'IN_PROGRESS' ? 'DONE' : 'PENDING';
    setSchedule(schedule.map(s => s.id === id ? { ...s, status: nextStatus as any } : s));
    await supabase.from('schedule_items').update({ status: nextStatus }).eq('id', id);
  };

  const handleFieldChange = async (id: string, field: keyof ScheduleItem, value: string) => {
    setSchedule(schedule.map(item => item.id === id ? { ...item, [field]: value } : item));
    await supabase.from('schedule_items').update({ [field]: value }).eq('id', id);
  };

  const handleDragStart = (event: any) => {
    if (!editMode) return;
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: any) => {
    setActiveId(null);
    if (!editMode) return;
    const { active, over } = event;
    if (!over) return;

    if (over.id.toString().length === 10) {
      // Dragged onto a calendar date
      const targetDate = over.id as string;
      if (active.id !== over.id) {
        const itemToMove = schedule.find(s => s.id === active.id);
        if (itemToMove && itemToMove.date !== targetDate) {
          const targetItems = schedule.filter(s => s.date === targetDate);
          const nextOrder = targetItems.length > 0 ? Math.max(...targetItems.map(t => t.sort_order)) + 10 : 0;
          setSchedule(prev => prev.map(item => item.id === active.id ? { ...item, date: targetDate, sort_order: nextOrder } : item));
          await supabase.from('schedule_items').update({ date: targetDate, sort_order: nextOrder }).eq('id', active.id);
        }
      }
      return;
    }

    if (active.id !== over.id) {
      setSchedule((items) => {
        const displayedItems = items.filter(s => s.date === selectedDate).sort((a, b) => a.sort_order - b.sort_order);
        const oldIndex = displayedItems.findIndex(i => i.id === active.id);
        const newIndex = displayedItems.findIndex(i => i.id === over.id);
        
        const newDisplayed = arrayMove(displayedItems, oldIndex, newIndex);
        
        // Re-assign sort_orders
        newDisplayed.forEach((item, index) => {
          item.sort_order = index * 10;
        });

        // Update DB
        newDisplayed.forEach(async (item) => {
          await supabase.from('schedule_items').update({ sort_order: item.sort_order }).eq('id', item.id);
        });

        // Merge back into main schedule state
        const updatedSchedule = items.map(item => {
          const updated = newDisplayed.find(d => d.id === item.id);
          return updated ? updated : item;
        });
        
        return updatedSchedule;
      });
    }
  };

  const addItem = async () => {
    const { data, error } = await supabase
      .from('schedule_items')
      .insert({ project_id: projectId, date: selectedDate, time: '09:00 - 10:00', title: 'New Task', note: '', transport: '', assignee: 'Assignee', status: 'PENDING' })
      .select().single();
    if (error) alert('Error: ' + error.message);
    else if (data) setSchedule([...schedule, data]);
  };

  const removeItem = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    setSchedule(schedule.filter(s => s.id !== id));
    await supabase.from('schedule_items').delete().eq('id', id);
  };

  // Calendar logic
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const changeMonth = (offset: number) => setCurrentMonthDate(new Date(year, month + offset, 1));

  const displayedSchedule = schedule.filter(s => s.date === selectedDate);
  const densityPercent = displayedSchedule.length > 0
    ? Math.round((displayedSchedule.filter(s => s.status === 'DONE').length / displayedSchedule.length) * 100)
    : 0;

  // All unique dates that have schedule items
  const allDates = Array.from(new Set(schedule.map(s => s.date))).sort();

  // Items to print (filtered by selected dates)
  const printItems = schedule.filter(s => selectedPrintDates.has(s.date));
  const printDates = Array.from(new Set(printItems.map(s => s.date))).sort();

  const togglePrintDate = (date: string) => {
    const next = new Set(selectedPrintDates);
    if (next.has(date)) next.delete(date);
    else next.add(date);
    setSelectedPrintDates(next);
  };

  const selectAllDates = () => setSelectedPrintDates(new Set(allDates));
  const clearAllDates = () => setSelectedPrintDates(new Set());

  const handlePrint = () => {
    if (selectedPrintDates.size === 0) { alert('Please select at least one date to print.'); return; }
    window.print();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading && !project) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
        <i className="fa-solid fa-clock animate-spin text-4xl mb-6"></i>
        <p className="font-black text-sm uppercase tracking-widest italic">Syncing Logistics...</p>
      </div>
    );
  }

  const isWedding = project?.type === 'wedding' || project?.type === 'wedding_fair';
  const theme = isWedding ? { text: 'text-pink-500', bg: 'bg-pink-500' } : { text: 'text-[#0056B3]', bg: 'bg-[#0056B3]' };

  return (
    <div className="flex flex-col flex-1 animate-in fade-in duration-700 pb-20">

      {/* ─────────────── PRINT LAYOUT ─────────────── */}
      <div className="hidden print:block">
        <div className="mb-6 border-b-2 border-black pb-4">
          <div className="flex items-start justify-between">
            <div>
              <p style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#555', marginBottom: 4 }}>ZTO Event OS — Production Schedule</p>
              <p style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#000' }}>{project?.name || 'Untitled Project'}</p>
            </div>
            <div style={{ textAlign: 'right', fontSize: 9, color: '#666', fontWeight: 700 }}>
              <p>Printed: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              <p>{selectedPrintDates.size} day(s) selected</p>
            </div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
          <thead>
            <tr style={{ background: '#111', color: '#fff' }}>
              <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 900, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap', width: 110 }}>Time</th>
              <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 900, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Task</th>
              <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 900, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Note</th>
              <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 900, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap', width: 100 }}>Assignee</th>
              <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 900, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap', width: 90 }}>Transport</th>
              <th style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 900, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap', width: 70 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {printDates.map((date, dateIdx) => {
              const dayItems = printItems.filter(s => s.date === date);
              return (
                <React.Fragment key={date}>
                  {/* Date Group Header Row */}
                  <tr style={{ background: '#f0f0f0', pageBreakInside: 'avoid' }}>
                    <td colSpan={6} style={{ padding: '5px 10px', fontWeight: 900, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#333', borderTop: dateIdx > 0 ? '2px solid #bbb' : 'none' }}>
                      {formatDate(date)} — {dayItems.length} item{dayItems.length !== 1 ? 's' : ''}
                    </td>
                  </tr>
                  {/* Items for this date */}
                  {dayItems.map((item, idx) => (
                    <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa', pageBreakInside: 'avoid', borderBottom: '1px solid #e8e8e8' }}>
                      <td style={{ padding: '5px 10px', fontWeight: 700, color: '#0056B3', whiteSpace: 'nowrap', fontSize: 10 }}>{item.time || '—'}</td>
                      <td style={{ padding: '5px 10px', fontWeight: 700, color: '#000', fontSize: 10 }}>{item.title || '—'}</td>
                      <td style={{ padding: '5px 10px', color: '#555', fontSize: 9 }}>{item.note || '—'}</td>
                      <td style={{ padding: '5px 10px', fontSize: 9, fontWeight: 700, color: '#333', whiteSpace: 'nowrap' }}>{item.assignee || '—'}</td>
                      <td style={{ padding: '5px 10px', fontSize: 9, fontWeight: 700, color: '#333', whiteSpace: 'nowrap' }}>{item.transport || '—'}</td>
                      <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: 8, fontWeight: 900, padding: '2px 6px', borderRadius: 4,
                          background: item.status === 'DONE' ? '#dcfce7' : item.status === 'IN_PROGRESS' ? '#dbeafe' : '#f4f4f5',
                          color: item.status === 'DONE' ? '#166534' : item.status === 'IN_PROGRESS' ? '#1e40af' : '#52525b',
                          textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                        }}>
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─────────────── SCREEN LAYOUT ─────────────── */}
      <div className="print:hidden">
        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="flex flex-col">
            <p className={`text-xs font-black uppercase tracking-[0.2em] ${theme.text} mb-2`}>Operations Hub</p>
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none font-['Urbanist']">
              Strategic Schedule
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col items-end mr-4 px-4 border-r border-white/5">
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1">Day Completion</span>
              <div className={`text-2xl font-black ${theme.text} font-['Urbanist'] tracking-tight leading-none`}>{densityPercent}%</div>
            </div>
            <button
              onClick={() => setEditMode(!editMode)}
              className={`h-11 px-6 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all flex items-center gap-2 ${editMode ? 'bg-[#0056B3] text-white' : 'bg-white text-black hover:bg-zinc-200'}`}
            >
              <i className={`fa-solid ${editMode ? 'fa-check-double' : 'fa-pen-to-square'} text-[10px]`} />
              {editMode ? 'Finalize' : 'Edit'}
            </button>
            <button
              onClick={() => { setShowPrintPanel(true); setSelectedPrintDates(new Set()); }}
              className="h-11 px-6 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-500"
            >
              <i className="fa-solid fa-print text-[10px]" />
              Print / Export
            </button>
          </div>
        </div>

        {/* ── Print Date Picker Panel ── */}
        {showPrintPanel && (
          <div className="mb-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-black text-white uppercase tracking-widest text-sm">Select Days to Print</h3>
                <p className="text-zinc-500 text-xs mt-1">Choose which days to include in the printed schedule table.</p>
              </div>
              <button onClick={() => setShowPrintPanel(false)} className="text-zinc-600 hover:text-white transition-colors">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {allDates.length === 0 ? (
              <p className="text-zinc-600 text-sm">No schedule items found. Add some items first.</p>
            ) : (
              <>
                <div className="flex gap-2 mb-4">
                  <button onClick={selectAllDates} className="text-xs font-black text-[#4da3ff] hover:text-white transition-colors uppercase tracking-wider">Select All</button>
                  <span className="text-zinc-700">·</span>
                  <button onClick={clearAllDates} className="text-xs font-black text-zinc-500 hover:text-white transition-colors uppercase tracking-wider">Clear</button>
                  <span className="text-zinc-700 ml-auto text-xs font-bold text-zinc-500">{selectedPrintDates.size} selected</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {allDates.map(date => {
                    const isChecked = selectedPrintDates.has(date);
                    const count = schedule.filter(s => s.date === date).length;
                    return (
                      <button
                        key={date}
                        onClick={() => togglePrintDate(date)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-black text-[11px] uppercase tracking-wider transition-all ${
                          isChecked
                            ? 'bg-[#0056B3] border-[#0056B3] text-white shadow-[0_0_12px_rgba(0,86,179,0.4)]'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
                        }`}
                      >
                        <i className={`fa-solid ${isChecked ? 'fa-check-square' : 'fa-square'} text-[10px]`}></i>
                        {formatDate(date)}
                        <span className={`text-[9px] font-bold ${isChecked ? 'text-blue-200' : 'text-zinc-600'}`}>{count} items</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
                  <button
                    onClick={handlePrint}
                    disabled={selectedPrintDates.size === 0}
                    className="h-11 px-8 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all hover:bg-zinc-200 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <i className="fa-solid fa-print text-[10px]" />
                    Print {selectedPrintDates.size > 0 ? `(${selectedPrintDates.size} day${selectedPrintDates.size > 1 ? 's' : ''})` : ''}
                  </button>
                  <p className="text-zinc-600 text-xs">Each item = 1 compact row · A4 Landscape</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Main content: Calendar + Day View ── */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-col xl:flex-row gap-12">

          {/* Calendar */}
          <div className="xl:w-[350px] shrink-0 flex flex-col gap-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => changeMonth(-1)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
                  <i className="fa-solid fa-chevron-left text-xs"></i>
                </button>
                <h3 className="font-black text-white uppercase tracking-widest text-sm font-['Urbanist']">
                  {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={() => changeMonth(1)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
                  <i className="fa-solid fa-chevron-right text-xs"></i>
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-[9px] font-black uppercase text-zinc-600 tracking-wider py-2">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} className="h-10"></div>;
                  const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = dateString === selectedDate;
                  const hasTasks = schedule.some(s => s.date === dateString);
                  const allDone = hasTasks && schedule.filter(s => s.date === dateString).every(s => s.status === 'DONE');
                  return (
                    <DroppableDayButton
                      key={dateString}
                      dateString={dateString}
                      isSelected={isSelected}
                      hasTasks={hasTasks}
                      allDone={allDone}
                      day={day}
                      onClick={() => setSelectedDate(dateString)}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Day Itinerary */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight font-['Urbanist']">{selectedDate}</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mt-1">Daily Itinerary — {displayedSchedule.length} items</p>
              </div>
              {editMode && (
                <button onClick={addItem} className="h-10 px-6 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all hover:bg-zinc-200 flex items-center gap-2 active:scale-95">
                  <i className="fa-solid fa-plus" /> Add Task
                </button>
              )}
            </div>

            {displayedSchedule.length === 0 ? (
              <div className="py-24 border border-dashed border-white/5 rounded-[32px] bg-white/[0.01] flex flex-col items-center justify-center opacity-40">
                <i className="fa-solid fa-mug-hot text-4xl mb-4 text-zinc-600" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">No tasks for this day</p>
                {editMode && (
                  <button onClick={addItem} className="mt-6 text-[#4da3ff] hover:text-white text-xs font-black uppercase tracking-widest transition-colors">
                    Create First Task
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-0 rounded-2xl overflow-hidden border border-white/5">
                {/* Table Header */}
                <div className="grid grid-cols-[130px_1.5fr_1fr_100px_100px_110px] gap-0 bg-zinc-900 px-4 py-2.5 text-[9px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5">
                  <div>Time</div>
                  <div>Task</div>
                  <div>Note</div>
                  <div>Assignee</div>
                  <div>Transport</div>
                  <div className="text-right">Status</div>
                </div>

                <SortableContext items={displayedSchedule.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  {displayedSchedule.map((item) => (
                    <SortableScheduleRow
                      key={item.id}
                      item={item}
                      editMode={editMode}
                      handleFieldChange={handleFieldChange}
                      removeItem={removeItem}
                      cycleStatus={cycleStatus}
                      getStatusLabel={getStatusLabel}
                    />
                  ))}
                </SortableContext>
                <DragOverlay>
                  {activeId ? (
                    <div className="bg-zinc-900 border border-[#0056B3] rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] opacity-90 scale-105" style={{ padding: '0' }}>
                      <SortableScheduleRow
                        item={schedule.find(s => s.id === activeId)}
                        editMode={editMode}
                        handleFieldChange={() => {}}
                        removeItem={() => {}}
                        cycleStatus={() => {}}
                        getStatusLabel={getStatusLabel}
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </div>
            )}
          </div>
        </div>
        </DndContext>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: A4 landscape; margin: 12mm; }
          html, body, main { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          nav, header, footer, button, aside { display: none !important; }
          .hidden.print\\:block { display: block !important; }
        }
      `}</style>
    </div>
  );
}
