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

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  // Group items by date string (YYYY-MM-DD)
  const itemsByDate: Record<string, ScheduleItem[]> = {};
  scheduleItems.forEach(item => {
    if (!itemsByDate[item.date]) itemsByDate[item.date] = [];
    itemsByDate[item.date].push(item);
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
          <div className="grid grid-cols-7 gap-px bg-white/10 border border-white/10 rounded-xl overflow-hidden">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
              <div key={d} className="bg-zinc-900 text-center py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                {d}
              </div>
            ))}
            
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="bg-[#0a0a0a] min-h-[120px]"></div>;
              
              const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayItems = itemsByDate[dateString] || [];
              const isToday = dateString === new Date().toISOString().split('T')[0];

              return (
                <div key={dateString} className={`bg-[#0a0a0a] min-h-[120px] p-2 flex flex-col gap-1 border-t border-white/5 transition-all hover:bg-white/[0.02]`}>
                  <div className={`text-right mb-2`}>
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black tabular-nums ${isToday ? 'bg-[#0056B3] text-white' : 'text-zinc-500'}`}>
                      {day}
                    </span>
                  </div>
                  
                  {dayItems.map(item => {
                    const project = projects[item.project_id];
                    if (!project) return null;
                    const col = typeColor(project.type);
                    
                    return (
                      <Link key={item.id} href={`/projects/${project.id}/schedule`} style={{ textDecoration: 'none' }}>
                        <div
                          className="px-2 py-1.5 rounded-lg mb-1 flex flex-col gap-0.5 cursor-pointer transition-all active:scale-95 hover:brightness-125"
                          style={{ background: `${col}20`, borderLeft: `3px solid ${col}` }}
                          title={`${project.name} - ${item.title}`}
                        >
                          <div style={{ fontSize: 9, fontWeight: 800, color: col, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {project.name}
                          </div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.time} - {item.title}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
