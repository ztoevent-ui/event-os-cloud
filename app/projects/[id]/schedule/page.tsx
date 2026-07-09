'use client';

import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PrintReportButton } from '../../components/ProjectModals';
import { PrintBreakTrigger } from '../../components/PrintBreakTrigger';
import { usePrint } from '../../components/PrintContext';

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
}

export default function EventSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [project, setProject] = useState<any>(null);
  const { pageBreakIds } = usePrint();
  
  // Default selected date to today, will update when project loads
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());

  useEffect(() => {
    fetchProject();
    fetchSchedule();

    const channel = supabase
      .channel('schedule_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedule_items',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          fetchSchedule();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.error('Error fetching schedule:', error);
      setSchedule([]);
    } else {
      setSchedule(data || []);
    }
    setLoading(false);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DONE': return 'COMPLETED';
      case 'IN_PROGRESS': return 'ONGOING';
      default: return 'STANDBY';
    }
  };

  const cycleStatus = async (id: string, current: string) => {
    const nextStatus = current === 'PENDING' ? 'IN_PROGRESS' : current === 'IN_PROGRESS' ? 'DONE' : 'PENDING';
    setSchedule(schedule.map(s => s.id === id ? { ...s, status: nextStatus as any } : s));
    const { error } = await supabase.from('schedule_items').update({ status: nextStatus }).eq('id', id);
    if (error) {
      console.error('Error cycling status:', error);
      fetchSchedule(); // Rollback
    }
  };

  const handleFieldChange = async (id: string, field: keyof ScheduleItem, value: string) => {
    setSchedule(schedule.map(item => item.id === id ? { ...item, [field]: value } : item));
    const { error } = await supabase.from('schedule_items').update({ [field]: value }).eq('id', id);
    if (error) console.error('Error updating schedule item:', error);
  };

  const addItem = async () => {
    const { data, error } = await supabase
      .from('schedule_items')
      .insert({
        project_id: projectId,
        date: selectedDate,
        time: '09:00 - 10:00',
        title: 'New Task',
        note: '',
        transport: '',
        assignee: 'Assignee',
        status: 'PENDING'
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding schedule item:', error);
      alert('无法创建任务：' + error.message + '\n\n提示：请确认您是否已经在 Supabase 中执行了添加 note 和 transport 字段的 SQL 语句。');
    } else if (data) {
      setSchedule([...schedule, data]);
    }
  };

  const removeItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    setSchedule(schedule.filter(s => s.id !== id));
    const { error } = await supabase.from('schedule_items').delete().eq('id', id);
    if (error) {
      console.error('Error removing item:', error);
      fetchSchedule();
    }
  };

  const exportData = () => {
    const sortedSchedule = [...schedule].sort((a, b) => {
      if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
      return (a.time || '').localeCompare(b.time || '');
    });

    const dataStr = JSON.stringify(sortedSchedule, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Project-${projectId}-Schedule.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Calendar Logic
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null); // Empty slots before the 1st
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const changeMonth = (offset: number) => {
    setCurrentMonthDate(new Date(year, month + offset, 1));
  };

  const displayedSchedule = schedule.filter(s => s.date === selectedDate);
  const densityPercent = displayedSchedule.length > 0 
    ? Math.round((displayedSchedule.filter(s => s.status === 'DONE').length / displayedSchedule.length) * 100) 
    : 0;

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
      {/* ── Page Header + Action Bar ── */}
      <div className="print:hidden flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="flex flex-col">
          <p className={`text-xs font-black uppercase tracking-[0.2em] ${theme.text} mb-2`}>Operations Hub</p>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none font-['Urbanist']">
            Strategic Schedule
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col items-end mr-6 px-6 border-r border-white/5">
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1">Execution Density</span>
            <div className={`text-2xl font-black ${theme.text} font-['Urbanist'] tracking-tight leading-none`}>
              {densityPercent}%
            </div>
          </div>

          <button 
            onClick={() => setEditMode(!editMode)}
            className={`h-11 px-8 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all flex items-center gap-2.5 shadow-[0_0_20px_rgba(255,255,255,0.05)] ${
              editMode ? 'bg-[#0056B3] text-white' : 'bg-white text-black hover:bg-zinc-200'
            }`}
          >
            <i className={`fa-solid ${editMode ? 'fa-check-double' : 'fa-pen-to-square'} text-[10px]`} />
            {editMode ? 'Finalize' : 'Deploy Editor'}
          </button>
          <button 
            onClick={exportData}
            className="h-11 px-6 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all flex items-center gap-2.5 bg-zinc-900 text-white hover:bg-zinc-800 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
          >
            <i className="fa-solid fa-file-export text-[10px]" />
            Export JSON
          </button>
          <PrintReportButton title="Production Schedule" />
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-12">
        
        {/* ── Calendar View ── */}
        <div className="print:hidden xl:w-[350px] shrink-0 flex flex-col gap-6">
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => changeMonth(-1)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all"><i className="fa-solid fa-chevron-left text-xs"></i></button>
              <h3 className="font-black text-white uppercase tracking-widest text-sm font-['Urbanist']">
                {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={() => changeMonth(1)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all"><i className="fa-solid fa-chevron-right text-xs"></i></button>
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
                const allTasksDone = hasTasks && schedule.filter(s => s.date === dateString).every(s => s.status === 'DONE');
                
                return (
                  <button
                    key={dateString}
                    onClick={() => setSelectedDate(dateString)}
                    className={`h-10 rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-95 ${
                      isSelected 
                      ? 'bg-[#0056B3] text-white shadow-[0_0_15px_rgba(0,86,179,0.5)]' 
                      : 'hover:bg-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="text-sm font-black font-['Urbanist'] tabular-nums">{day}</span>
                    {hasTasks && (
                      <div className={`absolute bottom-1.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : allTasksDone ? 'bg-emerald-500' : 'bg-[#4da3ff]'}`}></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Daily Itinerary List ── */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight font-['Urbanist']">{selectedDate}</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mt-1">Daily Itinerary</p>
            </div>
            {editMode && (
              <button 
                onClick={addItem}
                className="h-10 px-6 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all hover:bg-zinc-200 flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 print:hidden"
              >
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
            <div className="flex flex-col gap-4">
              {/* List Header */}
              <div className="hidden md:grid grid-cols-[140px_1.5fr_1fr_100px_100px_auto] gap-4 px-6 pb-2 border-b border-white/10 text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                <div>Time</div>
                <div>Task</div>
                <div>Note</div>
                <div>Assignee</div>
                <div>Transport</div>
                <div className="w-24 text-right">Status</div>
              </div>

              {/* List Items */}
              {displayedSchedule.map((item) => (
                <div 
                  key={item.id} 
                  className={`group ${pageBreakIds.includes(item.id) ? 'print:break-before-page' : ''} bg-white/[0.02] border border-white/5 rounded-2xl p-4 md:px-6 md:py-4 transition-all hover:bg-white/[0.04] flex flex-col md:grid md:grid-cols-[140px_1.5fr_1fr_100px_100px_auto] gap-4 md:items-center relative ${item.status === 'DONE' && !editMode ? 'opacity-50 grayscale' : ''}`}
                >
                  <PrintBreakTrigger id={item.id} />
                  
                  {/* Time Range */}
                  <div className="flex flex-col shrink-0">
                    <span className="md:hidden text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Time</span>
                    {editMode ? (
                      <input 
                        type="text" 
                        defaultValue={item.time} 
                        onBlur={(e) => handleFieldChange(item.id, 'time', e.target.value)}
                        className="bg-transparent border-b border-white/10 text-sm font-black text-[#4da3ff] font-['Urbanist'] outline-none py-1 focus:border-[#0056B3] w-full"
                        placeholder="09:00 - 10:00"
                      />
                    ) : (
                      <span className="text-base font-black text-[#4da3ff] font-['Urbanist'] tabular-nums tracking-tight whitespace-nowrap">{item.time || '-'}</span>
                    )}
                  </div>

                  {/* Task / Title */}
                  <div className="flex flex-col min-w-0">
                    <span className="md:hidden text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Task</span>
                    {editMode ? (
                      <input 
                        type="text" 
                        defaultValue={item.title} 
                        onBlur={(e) => handleFieldChange(item.id, 'title', e.target.value)}
                        className="bg-transparent border-b border-white/10 text-sm font-black text-white font-['Urbanist'] outline-none py-1 focus:border-[#0056B3] w-full"
                        placeholder="Task Name"
                      />
                    ) : (
                      <span className="text-sm font-black text-white font-['Urbanist'] tracking-tight truncate">{item.title || '-'}</span>
                    )}
                  </div>

                  {/* Note */}
                  <div className="flex flex-col min-w-0">
                    <span className="md:hidden text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Note</span>
                    {editMode ? (
                      <input 
                        type="text" 
                        defaultValue={item.note} 
                        onBlur={(e) => handleFieldChange(item.id, 'note', e.target.value)}
                        className="bg-transparent border-b border-white/10 text-xs text-zinc-400 outline-none py-1 focus:border-[#0056B3] w-full"
                        placeholder="Remarks..."
                      />
                    ) : (
                      <span className="text-xs text-zinc-400 truncate">{item.note || '-'}</span>
                    )}
                  </div>

                  {/* Assignee */}
                  <div className="flex flex-col shrink-0">
                    <span className="md:hidden text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Assignee</span>
                    {editMode ? (
                      <input 
                        type="text" 
                        defaultValue={item.assignee} 
                        onBlur={(e) => handleFieldChange(item.id, 'assignee', e.target.value)}
                        className="bg-transparent border-b border-white/10 text-xs font-black text-zinc-300 uppercase outline-none py-1 focus:border-[#0056B3] w-full"
                        placeholder="Assignee"
                      />
                    ) : (
                      <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest truncate flex items-center gap-2">
                        <i className="fa-solid fa-user text-zinc-600 text-[8px]"></i> {item.assignee || '-'}
                      </span>
                    )}
                  </div>

                  {/* Transport */}
                  <div className="flex flex-col shrink-0">
                    <span className="md:hidden text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Transport</span>
                    {editMode ? (
                      <input 
                        type="text" 
                        defaultValue={item.transport} 
                        onBlur={(e) => handleFieldChange(item.id, 'transport', e.target.value)}
                        className="bg-transparent border-b border-white/10 text-xs font-black text-zinc-300 uppercase outline-none py-1 focus:border-[#0056B3] w-full"
                        placeholder="Transport"
                      />
                    ) : (
                      <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest truncate flex items-center gap-2">
                        <i className="fa-solid fa-car text-zinc-600 text-[8px]"></i> {item.transport || '-'}
                      </span>
                    )}
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center justify-end gap-2 mt-4 md:mt-0 pt-4 md:pt-0 border-t border-white/5 md:border-t-0">
                    {editMode && (
                      <button onClick={() => removeItem(item.id)} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center print:hidden mr-2">
                        <i className="fa-solid fa-trash text-[10px]" />
                      </button>
                    )}
                    <button 
                      onClick={() => cycleStatus(item.id, item.status)}
                      className={`h-8 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
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
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: A4 landscape; margin: 15mm; }
          html, body, main { background: white !important; color: black !important; }
          .print\\:hidden, nav, header, footer, button { display: none !important; }
          .bg-white\\/\\[0\\.02\\] { background: transparent !important; border: 1px solid #eee !important; border-radius: 8px !important; }
          .text-white { color: black !important; }
          .text-zinc-400, .text-zinc-300 { color: #555 !important; }
          .border-white\\/10, .border-white\\/5 { border-color: #eee !important; }
        }
      `}</style>
    </div>
  );
}
