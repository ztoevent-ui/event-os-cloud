'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  assignee: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
}

export default function EventSchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const eventId = 'BPO_2026';

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('event_schedules')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        setSchedule(data);
      } else {
        setSchedule([
          { id: '1', time: '08:00 AM', title: 'Loading & Setup', assignee: 'Production Team', status: 'DONE' }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'IN_PROGRESS': return 'bg-amber-50 text-amber-600 border-amber-200';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const cycleStatus = async (id: string, current: string) => {
    const nextStatus = current === 'PENDING' ? 'IN_PROGRESS' : current === 'IN_PROGRESS' ? 'DONE' : 'PENDING';
    const updated = schedule.map(s => s.id === id ? { ...s, status: nextStatus as any } : s);
    setSchedule(updated);

    await supabase.from('event_schedules').update({ status: nextStatus }).eq('id', id);
  };

  const handleFieldChange = async (id: string, field: keyof ScheduleItem, value: any) => {
    const updated = schedule.map(item => item.id === id ? { ...item, [field]: value } : item);
    setSchedule(updated);
    
    // Auto-save specific field
    await supabase.from('event_schedules').upsert({
        ...updated.find(i => i.id === id),
        event_id: eventId
    });
  };

  const addItem = async () => {
    const newItem = {
        event_id: eventId,
        time: '00:00',
        title: 'New Logistical Task',
        assignee: 'Crew',
        status: 'PENDING',
        sort_order: schedule.length + 1
    };

    const { data, error } = await supabase
        .from('event_schedules')
        .insert([newItem])
        .select()
        .single();
    
    if (data) setSchedule([...schedule, data]);
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase.from('event_schedules').delete().eq('id', id);
    if (!error) setSchedule(schedule.filter(s => s.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 z-10 sticky top-0">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/apps/event-manager" className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-emerald-600 rounded-full">
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Production Schedule</h1>
              <p className="text-[10px] font-black text-emerald-500 tracking-[0.2em] uppercase mt-0.5">Database Protected</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
              onClick={() => setEditMode(!editMode)}
              className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${editMode ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-white border border-gray-200 text-gray-400 hover:text-black hover:border-black'}`}
            >
              <i className={`fa-solid ${editMode ? 'fa-lock' : 'fa-pencil-alt'}`} />
              <span className="ml-2">{editMode ? 'Publish' : 'Edit Manager'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
            <div className="flex justify-center py-20"><i className="fa-solid fa-spinner fa-spin text-3xl text-emerald-500" /></div>
        ) : (
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 space-y-6">
            <AnimatePresence>
            {schedule.map((item, index) => (
                <motion.div 
                    layout
                    key={item.id} 
                    className={`flex items-stretch gap-6 group ${item.status === 'DONE' ? 'opacity-40 hover:opacity-100' : ''}`}
                >
                <div className="flex flex-col items-center min-w-[40px]">
                    <div className={`w-3 h-3 rounded-full mt-5 shadow-sm z-10 ${item.status === 'DONE' ? 'bg-emerald-500' : item.status === 'IN_PROGRESS' ? 'bg-amber-500' : 'bg-gray-300'}`}></div>
                    {index !== schedule.length - 1 && <div className="w-0.5 flex-1 mt-2 mb-2 bg-gray-100" />}
                </div>

                <div className="flex-1 bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl transition-all relative">
                    {editMode && (
                        <button onClick={() => removeItem(item.id)} className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg">
                            <i className="fa-solid fa-xmark text-xs" />
                        </button>
                    )}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-8">
                            {editMode ? (
                                <input className="w-24 text-xl font-black bg-emerald-50 border border-emerald-100 px-2 py-1 rounded" value={item.time} onChange={e => handleFieldChange(item.id, 'time', e.target.value)} />
                            ) : (
                                <div className="text-xl font-black tabular-nums text-gray-300 tracking-wider w-24">{item.time}</div>
                            )}
                            
                            <div className="flex-1">
                                {editMode ? (
                                    <>
                                        <input className="w-full text-lg font-bold bg-transparent border-b border-gray-100 focus:border-black outline-none mb-2" value={item.title} onChange={e => handleFieldChange(item.id, 'title', e.target.value)} />
                                        <input className="w-full text-xs text-gray-400 bg-transparent border-b border-transparent focus:border-gray-200 outline-none" value={item.assignee} onChange={e => handleFieldChange(item.id, 'assignee', e.target.value)} />
                                    </>
                                ) : (
                                    <>
                                        <h3 className={`text-lg font-bold tracking-tight ${item.status === 'DONE' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{item.title}</h3>
                                        <div className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-widest">{item.assignee}</div>
                                    </>
                                )}
                            </div>
                        </div>

                        <button 
                            onClick={() => cycleStatus(item.id, item.status)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${getStatusColor(item.status)}`}
                        >
                            {item.status.replace('_', ' ')}
                        </button>
                    </div>
                </div>
                </motion.div>
            ))}
            </AnimatePresence>

            {editMode && (
                 <button onClick={addItem} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-black uppercase tracking-widest hover:bg-gray-50 hover:border-black hover:text-black transition-all">
                    + Add Logistical Step
                 </button>
            )}
            </div>
        )}
      </main>
    </div>
  );
}
