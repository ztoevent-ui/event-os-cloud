'use client';

import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PrintReportButton } from '../../components/ProjectModals';
import { PrintBreakTrigger } from '../../components/PrintBreakTrigger';
import { usePrint } from '../../components/PrintContext';


interface ScheduleItem {
  id: string;
  project_id: string;
  time: string;
  title: string;
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

  useEffect(() => {
    fetchProject();
    fetchSchedule();
  }, [projectId]);

  const fetchProject = async () => {
    const { data } = await supabase.from('projects').select('type').eq('id', projectId).single();
    setProject(data);
  };
  
  const isWedding = project?.type === 'wedding' || project?.type === 'wedding_fair';
  const theme = isWedding ? {
    text: 'text-pink-500',
    bg: 'bg-pink-500',
    border: 'border-pink-500',
    text400: 'text-pink-400',
    bg20: 'bg-pink-500/20',
    border30: 'border-pink-500/30',
    shadow: 'shadow-[0_0_15px_rgba(236,72,153,0.8)]',
    border900_30: 'border-pink-900/30',
    border900_20: 'border-pink-900/20',
    hoverBorder900_50: 'hover:border-pink-900/50',
    text80: 'text-pink-500/80'
  } : {
    text: 'text-[#0056B3]',
    bg: 'bg-[#0056B3]',
    border: 'border-[#0056B3]/30',
    text400: 'text-[#0056B3]',
    bg20: 'bg-[#0056B3]/20',
    border30: 'border-[#0056B3]/30',
    shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.8)]',
    border900_30: 'border-[#0056B3]/30',
    border900_20: 'border-[#0056B3]/30',
    hoverBorder900_50: 'hover:border-[#0056B3]/30',
    text80: 'text-[#0056B3]/80'
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'IN_PROGRESS': return '${theme.bg20} ${theme.text400} ${theme.border30}';
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
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
    
    // Optimistic update
    setSchedule(schedule.map(s => s.id === id ? { ...s, status: nextStatus as any } : s));

    const { error } = await supabase
      .from('schedule_items')
      .update({ status: nextStatus })
      .eq('id', id);
    
    if (error) {
      console.error('Error cycling status:', error);
      fetchSchedule(); // Rollback
    }
  };

  const handleFieldChange = async (id: string, field: keyof ScheduleItem, value: string) => {
    setSchedule(schedule.map(item => item.id === id ? { ...item, [field]: value } : item));

    const { error } = await supabase
      .from('schedule_items')
      .update({ [field]: value })
      .eq('id', id);
    
    if (error) console.error('Error updating schedule item:', error);
  };

  const addItem = async () => {
    const { data, error } = await supabase
      .from('schedule_items')
      .insert({
        project_id: projectId,
        time: '',
        title: 'New Logistics Item',
        assignee: 'Assignee',
        status: 'PENDING'
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding schedule item:', error);
      if (error.code === '404' || error.message.includes('not found')) {
        alert('Table "schedule_items" not found. Please run the SQL script in Supabase first.');
      }
    } else if (data) {
      setSchedule([...schedule, data]);
    }
  };

  const removeItem = async (id: string) => {
    if (!confirm('确定要删除吗？')) return;
    setSchedule(schedule.filter(s => s.id !== id));
    const { error } = await supabase.from('schedule_items').delete().eq('id', id);
    if (error) {
      console.error('Error removing item:', error);
      fetchSchedule();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
        <i className={`fa-solid fa-clock animate-spin text-4xl mb-6 ${theme.text}`}></i>
        <p className="font-black text-sm uppercase tracking-widest italic">Syncing Logistics...</p>
      </div>
    );
  }

    return (
        <div className="flex flex-col flex-1 animate-in fade-in duration-700">
            {/* ── Page Header + Action Bar ── */}
            <div className="print:hidden flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                <div className="flex flex-col">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0056B3] mb-2">Operations Hub</p>
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none font-['Urbanist']">
                        Strategic Schedule
                    </h1>
                </div>

                {/* Action Hub */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-col items-end mr-6 px-6 border-r border-white/5">
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1">Execution Density</span>
                        <div className="text-2xl font-black text-[#4da3ff] font-['Urbanist'] tracking-tight leading-none">
                            {schedule.length > 0 ? Math.round((schedule.filter(s => s.status === 'DONE').length / schedule.length) * 100) : 0}%
                        </div>
                    </div>

                    <button 
                        onClick={() => setEditMode(!editMode)}
                        className={`h-11 px-8 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all flex items-center gap-2.5 shadow-[0_0_20px_rgba(255,255,255,0.05)] ${
                            editMode 
                            ? 'bg-[#0056B3] text-white' 
                            : 'bg-white text-black hover:bg-zinc-200'
                        }`}
                    >
                        <i className={`fa-solid ${editMode ? 'fa-check-double' : 'fa-pen-to-square'} text-[10px]`} />
                        {editMode ? 'Finalize' : 'Deploy Editor'}
                    </button>
                    <PrintReportButton title="Production Schedule" />
                </div>
            </div>

            {/* ── Timeline Console ── */}
            <div className="flex flex-col gap-12 relative">
                {/* Strategic Timeline Background */}
                <div className="absolute left-[39px] top-4 bottom-4 w-px bg-white/5 hidden md:block" />

                {loading ? (
                    <div className="py-32 flex flex-col items-center justify-center opacity-30">
                        <i className="fa-solid fa-clock-rotate-left fa-spin text-4xl mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing Master Logistics...</p>
                    </div>
                ) : schedule.length === 0 ? (
                    <div className="py-32 border border-dashed border-white/5 rounded-[32px] bg-white/[0.02] flex flex-col items-center justify-center opacity-30">
                        <i className="fa-solid fa-calendar-xmark text-4xl mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">No mission sequence detected</p>
                        <button 
                            onClick={addItem}
                            className="mt-8 h-12 px-10 bg-[#0056B3] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:shadow-[0_0_40px_rgba(0,86,179,0.3)]"
                        >
                            Initialize Sequence
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-8">
                        {schedule.map((item, index) => (
                            <div key={item.id} className={`${pageBreakIds.includes(item.id) ? 'print:break-before-page' : ''} group relative pl-0 md:pl-24`}>
                                {/* Timeline Node */}
                                <div className="absolute left-8 top-10 w-4 h-4 rounded-full bg-zinc-900 border-2 border-white/10 z-10 hidden md:flex items-center justify-center transition-all group-hover:scale-125 group-hover:border-[#4da3ff]">
                                    <div className={`w-1.5 h-1.5 rounded-full transition-colors ${item.status === 'DONE' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : item.status === 'IN_PROGRESS' ? 'bg-[#4da3ff] shadow-[0_0_10px_rgba(77,163,255,0.5)]' : 'bg-zinc-700'}`} />
                                </div>

                                {/* Logistics Card */}
                                <div className={`bg-white/[0.03] border border-white/5 p-8 rounded-[32px] flex flex-col md:flex-row md:items-center justify-between gap-8 hover:border-[#0056B3]/40 transition-all relative overflow-hidden print:bg-white print:border-zinc-200 print:text-black ${item.status === 'DONE' && !editMode ? 'opacity-40 grayscale' : ''}`}>
                                    <div className="flex flex-col md:flex-row md:items-center gap-12 flex-1">
                                        {/* Time Indicator */}
                                        <div className="shrink-0 flex flex-col min-w-[100px]">
                                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1">Time Delta</span>
                                            {editMode ? (
                                                <input 
                                                    type="text" 
                                                    defaultValue={item.time} 
                                                    onBlur={(e) => handleFieldChange(item.id, 'time', e.target.value)}
                                                    className="bg-transparent border-b border-white/10 text-2xl font-black text-[#4da3ff] font-['Urbanist'] outline-none py-1 focus:border-[#0056B3] transition-all"
                                                />
                                            ) : (
                                                <span className="text-3xl font-black text-white font-['Urbanist'] tabular-nums tracking-tight uppercase">{item.time || 'TBD'}</span>
                                            )}
                                        </div>

                                        {/* Title & Assignee */}
                                        <div className="flex-1">
                                            {editMode ? (
                                                <input 
                                                    type="text" 
                                                    defaultValue={item.title} 
                                                    onBlur={(e) => handleFieldChange(item.id, 'title', e.target.value)}
                                                    className="w-full bg-transparent border-b border-white/10 text-xl font-black text-white font-['Urbanist'] outline-none py-1 focus:border-[#0056B3] transition-all uppercase placeholder:text-zinc-800"
                                                    placeholder="Operational Title"
                                                />
                                            ) : (
                                                <h3 className={`text-xl font-black uppercase tracking-tight font-['Urbanist'] mb-2 ${item.status === 'DONE' ? 'text-zinc-600' : 'text-white'}`}>
                                                    {item.title}
                                                </h3>
                                            )}
                                            <div className="flex items-center gap-3">
                                                <i className="fa-solid fa-id-badge text-[10px] text-[#0056B3]" />
                                                {editMode ? (
                                                    <input 
                                                        type="text" 
                                                        defaultValue={item.assignee} 
                                                        onBlur={(e) => handleFieldChange(item.id, 'assignee', e.target.value)}
                                                        className="bg-transparent border-b border-white/10 text-[10px] font-black text-zinc-400 uppercase tracking-widest outline-none py-1 focus:border-[#0056B3] transition-all"
                                                        placeholder="Personnel Assigned"
                                                    />
                                                ) : (
                                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{item.assignee || 'Unassigned'}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Hub */}
                                    <div className="shrink-0 flex items-center gap-3">
                                        {editMode && (
                                            <button onClick={() => removeItem(item.id)} className="w-12 h-12 rounded-2xl bg-red-500/5 text-red-500/30 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center print:hidden">
                                                <i className="fa-solid fa-trash-can" />
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => cycleStatus(item.id, item.status)}
                                            className={`h-11 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 shadow-lg ${
                                                item.status === 'DONE' 
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5' 
                                                : item.status === 'IN_PROGRESS' 
                                                ? 'bg-[#0056B3]/10 text-[#4da3ff] border-[#0056B3]/20 shadow-[#0056B3]/5' 
                                                : 'bg-white/5 text-zinc-500 border-white/5 shadow-none'
                                            }`}
                                        >
                                            {getStatusLabel(item.status)}
                                        </button>
                                    </div>
                                </div>
                                <PrintBreakTrigger id={item.id} />
                            </div>
                        ))}

                        {editMode && (
                            <div className="pt-12 flex justify-center pl-0 md:pl-24">
                                <button 
                                    onClick={addItem}
                                    className="h-14 px-12 bg-white text-black font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl transition-all hover:bg-zinc-200 flex items-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.1)] active:scale-95"
                                >
                                    <i className="fa-solid fa-plus-circle text-lg" /> Append Sequence
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style jsx global>{`
                @media print {
                    @page { size: A4 portrait; margin: 15mm; }
                    html, body, main { background: white !important; color: black !important; }
                    .print\\:hidden, nav, header, footer, button { display: none !important; }
                    .bg-white\\/\\[0\\.03\\] { background: transparent !important; border: 1px solid #eee !important; border-radius: 12px !important; }
                    .text-white, .text-zinc-600 { color: black !important; }
                }
            `}</style>
        </div>
    );
}
