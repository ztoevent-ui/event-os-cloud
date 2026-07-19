'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Project = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ScheduleItem = any;

const typeColor = (type: string) => {
    if (type === 'wedding' || type === 'wedding_fair') return '#ec4899'; // pink
    if (type === 'corporate') return '#3b82f6'; // blue
    return '#10b981'; // green
};

export default function GlobalCalendarPage() {
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [projects, setProjects] = useState<Record<string, Project>>({});
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [editFormData, setEditFormData] = useState({ date: '', time: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch all active projects
    const { data: projectsData } = await supabase
      .from('projects')
      .select('*')
      .neq('status', 'completed');
    
    const projectMap: Record<string, Project> = {};
    if (projectsData) {
      projectsData.forEach(p => { projectMap[p.id] = p; });
    }
    setProjects(projectMap);

    // Fetch all schedule items that belong to these projects
    if (projectsData && projectsData.length > 0) {
      const projectIds = projectsData.map(p => p.id);
      const { data: scheduleData } = await supabase
        .from('schedule_items')
        .select('*')
        .in('project_id', projectIds)
        .order('time', { ascending: true });
        
      setScheduleItems(scheduleData || []);
    }
    setLoading(false);
  };

  const changeMonth = (offset: number) => {
    const d = new Date(currentMonthDate);
    d.setMonth(d.getMonth() + offset);
    setCurrentMonthDate(d);
  };

  const openEditModal = (item: ScheduleItem) => {
    setEditingItem(item);
    setEditFormData({ date: item.date, time: item.time });
  };

  const saveEdit = async () => {
    if (!editingItem) return;
    setLoading(true);
    const { date, time } = editFormData;
    
    await supabase.from('schedule_items').update({ date, time }).eq('id', editingItem.id);
    
    setScheduleItems(prev => prev.map(s => s.id === editingItem.id ? { ...s, date, time } : s));
    
    setEditingItem(null);
    setLoading(false);
  };

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  // Group items by date string (YYYY-MM-DD), sorted by time within each day
  const parseTimeMinutes = (t: string) => {
    if (!t) return 9999;
    const match = t.match(/(\d{1,2}):(\d{2})/);
    if (!match) return 9999;
    return parseInt(match[1]) * 60 + parseInt(match[2]);
  };

  const itemsByDate: Record<string, ScheduleItem[]> = {};
  scheduleItems.forEach(item => {
    if (!itemsByDate[item.date]) itemsByDate[item.date] = [];
    itemsByDate[item.date].push(item);
  });
  // Sort each day's items by start time
  Object.values(itemsByDate).forEach(items => {
    items.sort((a, b) => parseTimeMinutes(a.time) - parseTimeMinutes(b.time));
  });

  return (
    <div className="page-transition" style={{ minHeight: '100vh', background: '#050505', fontFamily: 'Urbanist, sans-serif', color: '#E5E5E5' }}>
      {/* Header */}
      <header style={{
          maxWidth: 1400, margin: '0 auto', padding: 'clamp(16px, 4vw, 40px)', paddingBottom: 32,
          display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
          flexWrap: 'wrap', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
          <div>
              <div className="zto-label" style={{ marginBottom: 8 }}>Company Overview</div>
              <h1 style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
                  Global Schedule
              </h1>
              <p className="zto-desc" style={{ marginTop: 6 }}>All tasks across active deployments.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Link href="/projects" className="zto-btn zto-btn-ghost" style={{ textDecoration: 'none' }}>
                  <i className="fa-solid fa-arrow-left" /> Back to Projects
              </Link>
          </div>
      </header>

      {/* Main content */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: 'clamp(16px, 4vw, 40px)' }}>
        <div className="zto-card" style={{ padding: 24 }}>
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => changeMonth(-1)} className="zto-btn zto-btn-ghost" style={{ padding: '8px 16px' }}>
              <i className="fa-solid fa-chevron-left" />
            </button>
            <h2 className="text-2xl font-black text-white uppercase tracking-widest">
              {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={() => changeMonth(1)} className="zto-btn zto-btn-ghost" style={{ padding: '8px 16px' }}>
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-px bg-white/10 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="bg-[#1C1C1E] text-center py-2 text-[11px] font-medium text-white/50">
                {d}
              </div>
            ))}
            
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="bg-[#1C1C1E] min-h-[120px]"></div>;
              
              const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayItems = itemsByDate[dateString] || [];
              const isToday = dateString === new Date().toISOString().split('T')[0];

              return (
                <div key={dateString} className={`bg-[#1C1C1E] min-h-[120px] p-1.5 flex flex-col gap-0.5 border-t border-white/5 transition-all hover:bg-white/[0.04]`}>
                  <div className={`text-right mb-1 pr-1 pt-1`}>
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[13px] tabular-nums ${isToday ? 'bg-[#FF3B30] text-white font-semibold' : 'text-white/80'}`}>
                      {day}
                    </span>
                  </div>
                  
                  {dayItems.map(item => {
                    const project = projects[item.project_id];
                    if (!project) return null;
                    const col = typeColor(project.type);
                    
                    return (
                      <div
                        key={item.id}
                        onClick={() => openEditModal(item)}
                        className="px-1.5 py-0.5 rounded-[4px] flex items-center gap-1.5 cursor-pointer transition-all hover:bg-white/10 group"
                        title={`${project.name}\n${item.time} - ${item.title}`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: col }}></div>
                        <div className="text-[10px] font-medium text-white/50 tabular-nums shrink-0 group-hover:text-white/80 transition-colors">
                          {item.time?.replace(/ - .*/, '')} {/* Show only start time for compactness if it's a range */}
                        </div>
                        <div className="text-[11px] font-medium text-white/90 truncate group-hover:text-white transition-colors">
                          {item.title}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {editingItem && (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
        }}>
            <div
                onClick={() => setEditingItem(null)}
                style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(5,5,5,0.85)',
                    backdropFilter: 'blur(8px)',
                }}
            />
            <div className="zto-card page-transition" style={{
                position: 'relative',
                width: '100%',
                maxWidth: 400,
                zIndex: 10,
                padding: 24
            }}>
                <button
                    onClick={() => setEditingItem(null)}
                    className="zto-btn zto-btn-ghost"
                    style={{ position: 'absolute', top: 16, right: 16, padding: '6px 10px', fontSize: 13 }}
                >
                    <i className="fa-solid fa-xmark" />
                </button>

                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Edit Schedule</h2>
                <p className="zto-desc" style={{ marginBottom: 24, fontSize: 12 }}>
                  {editingItem.title}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label className="zto-label" style={{ display: 'block', marginBottom: 8 }}>Date</label>
                        <input
                            type="date"
                            value={editFormData.date}
                            onChange={e => setEditFormData({ ...editFormData, date: e.target.value })}
                            className="zto-input"
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>
                    <div>
                        <label className="zto-label" style={{ display: 'block', marginBottom: 8 }}>Time</label>
                        <input
                            type="text"
                            value={editFormData.time}
                            onChange={e => setEditFormData({ ...editFormData, time: e.target.value })}
                            className="zto-input"
                            placeholder="09:00 - 10:00"
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                    <button onClick={() => setEditingItem(null)} className="zto-btn zto-btn-ghost" style={{ flex: 1 }}>
                        Cancel
                    </button>
                    <button onClick={saveEdit} disabled={loading} className="zto-btn zto-btn-primary" style={{ flex: 1 }}>
                        {loading ? <i className="fa-solid fa-circle-notch fa-spin" /> : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
