'use client';

import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';

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

  useEffect(() => {
    fetchSchedule();
  }, [projectId]);

  const fetchSchedule = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('schedule_items')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.error('Error fetching schedule:', error);
      setRows([]);
    } else {
      setSchedule(data || []);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'IN_PROGRESS': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
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
        <i className="fa-solid fa-clock animate-spin text-4xl mb-6 text-amber-500"></i>
        <p className="font-black text-sm uppercase tracking-widest italic">Syncing Logistics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-amber-900/30 shadow-2xl">
        <div>
          <h1 className="text-3xl font-black tracking-widest text-amber-500 uppercase italic">Production Schedule</h1>
          <p className="text-zinc-500 mt-2 font-medium tracking-wide">Event day master logistics timeline.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-end mr-4">
            <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Progress</span>
            <div className="text-2xl font-black text-amber-400">
              {schedule.length > 0 ? Math.round((schedule.filter(s => s.status === 'DONE').length / schedule.length) * 100) : 0}%
            </div>
          </div>
          <button 
            onClick={() => setEditMode(!editMode)}
            className={`px-6 py-3 font-black text-xs uppercase tracking-widest rounded-full transition-all flex items-center gap-2 border ${editMode ? 'bg-amber-500 text-black border-amber-400' : 'bg-white/5 text-amber-500 border-white/10 hover:bg-white/10'}`}
          >
            <i className={`fa-solid ${editMode ? 'fa-check' : 'fa-pencil'}`}></i>
            {editMode ? 'Finish' : 'Edit'}
          </button>
          <button className="px-6 py-3 bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white font-black text-xs uppercase tracking-widest rounded-full transition-all flex items-center gap-2">
            <i className="fa-solid fa-print"></i> PRINT
          </button>
        </div>
      </div>

      <div className="bg-zinc-950/80 rounded-3xl p-8 border border-amber-900/20 shadow-2xl relative overflow-hidden">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        
        <div className="relative z-10 space-y-4">
          {schedule.map((item, index) => (
            <div key={item.id} className={`flex items-stretch gap-6 group transition-all duration-300 ${item.status === 'DONE' && !editMode ? 'opacity-50' : ''}`}>
              
              {/* Timeline Connector */}
              <div className="flex flex-col items-center min-w-[60px]">
                <div className={`w-3 h-3 rounded-full mt-6 shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10 transition-colors ${item.status === 'DONE' ? 'bg-emerald-500' : item.status === 'IN_PROGRESS' ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.8)]' : 'bg-zinc-700'}`}></div>
                {index !== schedule.length - 1 && (
                  <div className={`w-0.5 flex-1 mt-2 mb-2 transition-colors ${item.status === 'DONE' ? 'bg-emerald-900/50' : 'bg-zinc-800'}`}></div>
                )}
              </div>

              {/* Event Card */}
              <div className="flex-1 bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 hover:border-amber-900/50 rounded-2xl p-6 transition-all group-hover:bg-zinc-900/90 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-6 flex-1">
                    <div className="w-24 shrink-0">
                      {editMode ? (
                        <input 
                          type="text" 
                          defaultValue={item.time} 
                          onBlur={(e) => handleFieldChange(item.id, 'time', e.target.value)}
                          className="w-full bg-transparent border-b border-zinc-800 text-amber-500 font-black focus:border-amber-500 outline-none text-xl tabular-nums"
                        />
                      ) : (
                        <div className="text-xl font-black tabular-nums text-amber-500/80 tracking-wider">
                          {item.time || 'TBD'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      {editMode ? (
                        <input 
                          type="text" 
                          defaultValue={item.title} 
                          onBlur={(e) => handleFieldChange(item.id, 'title', e.target.value)}
                          className="w-full bg-transparent border-b border-zinc-800 text-zinc-100 font-bold focus:border-amber-500 outline-none text-lg"
                        />
                      ) : (
                        <h3 className={`text-lg font-bold tracking-wide transition-colors ${item.status === 'DONE' ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
                          {item.title}
                        </h3>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-sm text-zinc-500">
                        <i className="fa-solid fa-user-gear"></i> 
                        {editMode ? (
                          <input 
                            type="text" 
                            defaultValue={item.assignee} 
                            onBlur={(e) => handleFieldChange(item.id, 'assignee', e.target.value)}
                            className="bg-transparent border-b border-zinc-800 focus:border-amber-500 outline-none w-32"
                          />
                        ) : (
                          item.assignee
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {editMode && (
                      <button onClick={() => removeItem(item.id)} className="text-zinc-700 hover:text-red-500 p-2 transition-colors">
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    )}
                    <button 
                      onClick={() => cycleStatus(item.id, item.status)}
                      className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 cursor-pointer ${getStatusColor(item.status)}`}
                    >
                      {getStatusLabel(item.status)}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ))}
          
          {editMode && (
            <div className="pt-8 flex justify-center">
               <button 
                onClick={addItem}
                className="h-12 px-10 bg-zinc-800 text-amber-500 hover:bg-white hover:text-black font-black text-[10px] uppercase tracking-widest rounded-full transition-all flex items-center gap-3 shadow-2xl border border-white/5"
              >
                <i className="fa-solid fa-plus-circle"></i> Add Schedule Row
              </button>
            </div>
          )}

          {(schedule.length === 0 && !loading) && (
            <div className="py-20 text-center text-zinc-700">
              <i className="fa-solid fa-calendar-day text-5xl mb-4 opacity-20"></i>
              <p className="font-black text-xs uppercase tracking-widest opacity-30">No Schedule Items Recorded</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
