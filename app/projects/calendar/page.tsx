'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Project = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ScheduleItem = any;

const typeColor = (type?: string) => {
  if (type === 'wedding' || type === 'wedding_fair') return '#ec4899'; // pink
  if (type === 'corporate') return '#3b82f6'; // blue
  if (type === 'tournament' || type === 'sports') return '#8b5cf6'; // purple
  if (type === 'expo') return '#06b6d4'; // cyan
  if (type === 'annual_dinner' || type === 'dinner') return '#f97316'; // orange
  return '#10b981'; // green
};

const getOpBadge = (title: string, note?: string) => {
  const text = `${title || ''} ${note || ''}`.toLowerCase();
  if (text.includes('concurrent')) return { label: 'CONCURRENT', bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' };
  if (text.includes('load-in') || text.includes('setup') || text.includes('install')) return { label: 'LOAD-IN', bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
  if (text.includes('load-out') || text.includes('dismantle') || text.includes('tear-down') || text.includes('wrap')) return { label: 'LOAD-OUT', bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
  return null;
};

export default function GlobalCalendarPage() {
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [projects, setProjects] = useState<Record<string, Project>>({});
  const [loading, setLoading] = useState(true);

  // View state: 'month' | 'agenda'
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'GLOBAL' | 'PROJECTS' | 'PENDING' | 'DONE'>('ALL');

  // Day Overflow Popover
  const [selectedDayPopover, setSelectedDayPopover] = useState<{ dateString: string; items: ScheduleItem[] } | null>(null);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    date: '',
    time: '',
    title: '',
    note: '',
    assignee: '',
    status: 'PENDING' as 'PENDING' | 'IN_PROGRESS' | 'DONE'
  });

  // Add Modal State
  const [addingGlobal, setAddingGlobal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    title: '',
    date: '',
    time: '09:00 - 10:00',
    note: '',
    assignee: '',
    status: 'PENDING' as 'PENDING' | 'IN_PROGRESS' | 'DONE'
  });

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

    // Fetch all schedule items that belong to active projects or are global (project_id is null)
    const projectIds = projectsData ? projectsData.map(p => p.id) : [];

    let query = supabase.from('schedule_items').select('*').order('time', { ascending: true });

    if (projectIds.length > 0) {
      query = query.or(`project_id.in.(${projectIds.join(',')}),project_id.is.null`);
    } else {
      query = query.is('project_id', null);
    }

    const { data: scheduleData } = await query;
    setScheduleItems(scheduleData || []);
    setLoading(false);
  };

  const changeMonth = (offset: number) => {
    const d = new Date(currentMonthDate);
    d.setMonth(d.getMonth() + offset);
    setCurrentMonthDate(d);
  };

  const jumpToToday = () => {
    setCurrentMonthDate(new Date());
  };

  const openEditModal = (item: ScheduleItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingItem(item);
    setEditFormData({
      date: item.date || '',
      time: item.time || '',
      title: item.title || '',
      note: item.note || '',
      assignee: item.assignee || '',
      status: item.status || 'PENDING'
    });
  };

  const cycleStatus = async (item: ScheduleItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const nextStatus = item.status === 'DONE' ? 'PENDING' : item.status === 'IN_PROGRESS' ? 'DONE' : 'IN_PROGRESS';
    setScheduleItems(prev => prev.map(s => s.id === item.id ? { ...s, status: nextStatus } : s));
    await supabase.from('schedule_items').update({ status: nextStatus }).eq('id', item.id);
  };

  const saveEdit = async () => {
    if (!editingItem) return;
    setLoading(true);
    const { date, time, title, note, assignee, status } = editFormData;

    await supabase.from('schedule_items').update({
      date,
      time,
      title,
      note,
      assignee,
      status
    }).eq('id', editingItem.id);

    setScheduleItems(prev => prev.map(s => s.id === editingItem.id ? {
      ...s,
      date,
      time,
      title,
      note,
      assignee,
      status
    } : s));

    // Update in selected day popover if open
    if (selectedDayPopover) {
      setSelectedDayPopover(prev => prev ? ({
        ...prev,
        items: prev.items.map(s => s.id === editingItem.id ? { ...s, date, time, title, note, assignee, status } : s)
      }) : null);
    }

    setEditingItem(null);
    setLoading(false);
  };

  const addGlobalItem = async () => {
    if (!addFormData.title || !addFormData.date) return;
    setLoading(true);
    const { data, error } = await supabase.from('schedule_items').insert({
      project_id: null,
      title: addFormData.title,
      date: addFormData.date,
      time: addFormData.time,
      note: addFormData.note,
      assignee: addFormData.assignee,
      status: addFormData.status || 'PENDING'
    }).select().single();

    if (error) {
      alert('Error adding global task: ' + error.message);
    } else if (data) {
      setScheduleItems(prev => [...prev, data]);
      setAddingGlobal(false);
      setAddFormData({ title: '', date: '', time: '09:00 - 10:00', note: '', assignee: '', status: 'PENDING' });
    }
    setLoading(false);
  };

  const deleteItem = async () => {
    if (!editingItem) return;
    if (!confirm(`Delete "${editingItem.title}"? This cannot be undone.`)) return;
    setLoading(true);
    await supabase.from('schedule_items').delete().eq('id', editingItem.id);
    setScheduleItems(prev => prev.filter(s => s.id !== editingItem.id));
    if (selectedDayPopover) {
      setSelectedDayPopover(prev => prev ? ({
        ...prev,
        items: prev.items.filter(s => s.id !== editingItem.id)
      }) : null);
    }
    setEditingItem(null);
    setLoading(false);
  };

  const parseTimeMinutes = (t: string) => {
    if (!t) return 9999;
    const match = t.match(/(\d{1,2}):(\d{2})/);
    if (!match) return 9999;
    return parseInt(match[1]) * 60 + parseInt(match[2]);
  };

  // Calendar Calculation
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  // Filtered Items
  const filteredScheduleItems = useMemo(() => {
    return scheduleItems.filter(item => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const proj = item.project_id ? projects[item.project_id]?.name || '' : 'Global Task';
        const match =
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.note && item.note.toLowerCase().includes(q)) ||
          (item.assignee && item.assignee.toLowerCase().includes(q)) ||
          proj.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Type filter
      if (filterType === 'GLOBAL' && item.project_id) return false;
      if (filterType === 'PROJECTS' && !item.project_id) return false;
      if (filterType === 'PENDING' && item.status === 'DONE') return false;
      if (filterType === 'DONE' && item.status !== 'DONE') return false;

      return true;
    });
  }, [scheduleItems, searchQuery, filterType, projects]);

  // Group items by date string (YYYY-MM-DD), sorted by time
  const itemsByDate = useMemo(() => {
    const map: Record<string, ScheduleItem[]> = {};
    filteredScheduleItems.forEach(item => {
      if (!map[item.date]) map[item.date] = [];
      map[item.date].push(item);
    });
    Object.values(map).forEach(items => {
      items.sort((a, b) => parseTimeMinutes(a.time) - parseTimeMinutes(b.time));
    });
    return map;
  }, [filteredScheduleItems]);

  // Agenda List (all dates in currently selected month that have items, sorted chronologically)
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const agendaDates = useMemo(() => {
    const dates = Object.keys(itemsByDate)
      .filter(d => d.startsWith(monthPrefix))
      .sort();
    return dates;
  }, [itemsByDate, monthPrefix]);

  const currentMonthTaskCount = useMemo(() => {
    return filteredScheduleItems.filter(item => item.date && item.date.startsWith(monthPrefix)).length;
  }, [filteredScheduleItems, monthPrefix]);

  return (
    <div className="page-transition" style={{ minHeight: '100vh', background: 'var(--c-canvas, #09090b)', fontFamily: 'Urbanist, sans-serif', color: '#E5E5E5' }}>
      {/* ── Global Header ── */}
      <header style={{
        maxWidth: 1440, margin: '0 auto', padding: 'clamp(16px, 4vw, 36px)', paddingBottom: 24,
        display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        flexWrap: 'wrap', gap: 16, borderBottom: '1px solid rgb(var(--c-ink-rgb, 255 255 255) / 0.06)'
      }}>
        <div>
          <div className="zto-label" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Company Overview</span>
            <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 99, color: '#9ca3af' }}>
              Asia/Kuching (GMT+8)
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(22px, 5vw, 30px)', fontWeight: 800, color: 'var(--c-ink, #ffffff)', letterSpacing: '-0.02em', margin: 0 }}>
            Global Operations Schedule
          </h1>
          <p className="zto-desc" style={{ marginTop: 6, color: '#9ca3af', fontSize: 13 }}>
            Full dispatch schedule & cross-deployment tracking across all ongoing projects.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Download ICS */}
          <a
            href="/ztoevent_global_schedule_2026.ics"
            download="ztoevent_global_schedule_2026.ics"
            className="zto-btn zto-btn-ghost"
            style={{ textDecoration: 'none', padding: '8px 14px', fontSize: 13, gap: 8, display: 'flex', alignItems: 'center' }}
            title="Download .ICS for Apple Calendar or Google Calendar"
          >
            <i className="fa-solid fa-file-arrow-down" style={{ color: '#38bdf8' }} /> Export .ICS
          </a>

          {/* Add Global Task */}
          <button
            onClick={() => {
              setAddFormData(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }));
              setAddingGlobal(true);
            }}
            className="zto-btn zto-btn-primary"
            style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <i className="fa-solid fa-plus" /> Add Global Task
          </button>

          {/* Back link */}
          <Link href="/projects" className="zto-btn zto-btn-ghost" style={{ textDecoration: 'none', padding: '8px 14px', fontSize: 13 }}>
            <i className="fa-solid fa-arrow-left mr-1.5" /> Back to Projects
          </Link>
        </div>
      </header>

      {/* ── Main Container ── */}
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: 'clamp(16px, 4vw, 36px)' }}>
        <div className="zto-card" style={{ padding: '24px clamp(16px, 3vw, 28px)', borderRadius: 16 }}>
          
          {/* ── Control Bar: Navigation, View Toggle, Search & Filters ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            
            {/* Month Navigation & Today */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  onClick={() => changeMonth(-1)}
                  className="zto-btn zto-btn-ghost"
                  style={{ padding: '6px 12px', border: 'none', borderRadius: 8 }}
                  aria-label="Previous Month"
                >
                  <i className="fa-solid fa-chevron-left" />
                </button>
                <button
                  onClick={jumpToToday}
                  className="zto-btn zto-btn-ghost"
                  style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, border: 'none', borderRadius: 8, color: '#38bdf8' }}
                >
                  Today
                </button>
                <button
                  onClick={() => changeMonth(1)}
                  className="zto-btn zto-btn-ghost"
                  style={{ padding: '6px 12px', border: 'none', borderRadius: 8 }}
                  aria-label="Next Month"
                >
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </div>

              <div style={{ marginLeft: 6 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em', color: '#ffffff' }}>
                  {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>
                  {currentMonthTaskCount} tasks scheduled
                </span>
              </div>
            </div>

            {/* View Mode Switcher: Month Grid vs Agenda List */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  onClick={() => setViewMode('month')}
                  style={{
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: viewMode === 'month' ? 'var(--c-accent, #0056B3)' : 'transparent',
                    color: viewMode === 'month' ? '#ffffff' : '#9ca3af'
                  }}
                >
                  <i className="fa-solid fa-calendar-days mr-1.5" /> Month
                </button>
                <button
                  onClick={() => setViewMode('agenda')}
                  style={{
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: viewMode === 'agenda' ? 'var(--c-accent, #0056B3)' : 'transparent',
                    color: viewMode === 'agenda' ? '#ffffff' : '#9ca3af'
                  }}
                >
                  <i className="fa-solid fa-list-check mr-1.5" /> Agenda List
                </button>
              </div>
            </div>
          </div>

          {/* ── Search & Filter Strip ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.05)',
            marginBottom: 20
          }}>
            {/* Search Box */}
            <div style={{ position: 'relative', minWidth: 240, flex: '1 1 240px' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontSize: 12 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search event, location, note or assignee..."
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 32px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#ffffff',
                  outline: 'none'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
                >
                  <i className="fa-solid fa-xmark text-xs" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              {(['ALL', 'GLOBAL', 'PROJECTS', 'PENDING', 'DONE'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setFilterType(mode)}
                  style={{
                    padding: '5px 11px',
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 99,
                    border: '1px solid',
                    borderColor: filterType === mode ? '#38bdf8' : 'rgba(255,255,255,0.08)',
                    background: filterType === mode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: filterType === mode ? '#38bdf8' : '#9ca3af',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {mode === 'ALL' && 'All Items'}
                  {mode === 'GLOBAL' && '⚡ Global Tasks'}
                  {mode === 'PROJECTS' && '📁 Projects'}
                  {mode === 'PENDING' && '⏳ Active / Pending'}
                  {mode === 'DONE' && '✓ Completed'}
                </button>
              ))}
            </div>
          </div>

          {/* ── Color Legend Strip ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', paddingBottom: 16, fontSize: 11, color: '#9ca3af' }}>
            <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>Category Legend:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
              <span>Global Task</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
              <span>Corporate Event</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ec4899', display: 'inline-block' }} />
              <span>Wedding</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6', display: 'inline-block' }} />
              <span>Sports / Tournament</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <span>Other Deployments</span>
            </div>
          </div>

          {/* ════════ VIEW 1: MONTH GRID VIEW ════════ */}
          {viewMode === 'month' && (
            <div className="grid grid-cols-7 gap-px bg-zinc-800/40 border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="bg-[#18181b] text-center py-2.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  {d}
                </div>
              ))}

              {calendarDays.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="bg-[#121214] min-h-[135px]"></div>;

                const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayItems = itemsByDate[dateString] || [];
                const isToday = dateString === new Date().toISOString().split('T')[0];

                const maxDisplay = 3;
                const visibleItems = dayItems.slice(0, maxDisplay);
                const overflowCount = dayItems.length - maxDisplay;

                return (
                  <div
                    key={dateString}
                    className={`bg-[#121214] min-h-[135px] p-2 flex flex-col gap-1 border-t border-zinc-800/50 transition-all hover:bg-zinc-800/30 ${isToday ? 'ring-1 ring-inset ring-sky-500/40' : ''}`}
                  >
                    {/* Day number header */}
                    <div className="flex items-center justify-between mb-0.5">
                      {dayItems.length > 0 ? (
                        <span className="text-[10px] font-bold text-zinc-500 tabular-nums">
                          {dayItems.length} {dayItems.length === 1 ? 'task' : 'tasks'}
                        </span>
                      ) : <span />}
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold tabular-nums ${isToday ? 'bg-sky-500 text-white shadow-[0_0_10px_rgba(56,189,248,0.5)]' : 'text-zinc-300'}`}>
                        {day}
                      </span>
                    </div>

                    {/* Task item cards */}
                    {visibleItems.map(item => {
                      const isGlobal = !item.project_id;
                      const project = isGlobal ? null : projects[item.project_id];
                      if (!isGlobal && !project) return null;
                      const col = isGlobal ? '#f59e0b' : typeColor(project?.type);
                      const projName = isGlobal ? 'Global Task' : project?.name;
                      const isDone = item.status === 'DONE';
                      const isInProgress = item.status === 'IN_PROGRESS';
                      const badge = getOpBadge(item.title, item.note);

                      return (
                        <div
                          key={item.id}
                          onClick={() => openEditModal(item)}
                          className={`px-1.5 py-1 rounded-md flex items-center justify-between gap-1 cursor-pointer transition-all hover:bg-white/[0.08] group border border-transparent hover:border-white/10 ${
                            isDone ? 'opacity-40 bg-white/[0.01]' : isInProgress ? 'bg-sky-500/[0.08] border-sky-500/20' : 'bg-white/[0.03]'
                          }`}
                          title={`${projName}\n${item.time || ''} - ${item.title}\nStatus: ${item.status}\n${item.note ? `Note: ${item.note}` : ''}`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {/* Color Dot / Status */}
                            <button
                              onClick={(e) => cycleStatus(item, e)}
                              className="shrink-0 hover:scale-125 transition-transform"
                              title={`Status: ${item.status}. Click to cycle.`}
                            >
                              {isDone ? (
                                <i className="fa-solid fa-circle-check text-[10px] text-emerald-400" />
                              ) : (
                                <div
                                  className={`w-2 h-2 rounded-full shrink-0 ${isInProgress ? 'animate-pulse ring-2 ring-sky-400/40' : ''}`}
                                  style={{ backgroundColor: col }}
                                />
                              )}
                            </button>

                            {/* Time */}
                            <span className="text-[10px] font-semibold text-zinc-400 tabular-nums shrink-0">
                              {item.time?.replace(/ - .*/, '') || '—'}
                            </span>

                            {/* Title */}
                            <span className={`text-[11px] font-medium truncate ${isDone ? 'line-through text-zinc-400' : 'text-zinc-200 group-hover:text-white'}`}>
                              {item.title}
                            </span>
                          </div>

                          {/* Quick Op Badge (Load-in / Load-out) */}
                          {badge && (
                            <span
                              className="shrink-0 text-[8px] font-black uppercase tracking-wider px-1 py-0.5 rounded"
                              style={{ background: badge.bg, color: badge.text, border: `1px solid ${badge.border}` }}
                            >
                              {badge.label}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {/* Overflow "+N more" button */}
                    {overflowCount > 0 && (
                      <button
                        onClick={() => setSelectedDayPopover({ dateString, items: dayItems })}
                        className="mt-auto text-left text-[10px] font-bold text-sky-400 hover:text-sky-300 py-0.5 px-1 rounded hover:bg-sky-500/10 transition-colors"
                      >
                        +{overflowCount} more...
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ════════ VIEW 2: AGENDA LIST VIEW ════════ */}
          {viewMode === 'agenda' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {agendaDates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                  <i className="fa-regular fa-calendar-xmark text-4xl mb-3 block text-zinc-600" />
                  <p style={{ fontSize: 14, fontWeight: 600 }}>No operations scheduled for {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })} matching your filters.</p>
                </div>
              ) : (
                agendaDates.map(dateStr => {
                  const items = itemsByDate[dateStr] || [];
                  const dateObj = new Date(`${dateStr}T00:00:00`);
                  const dayOfWeek = dateObj.toLocaleDateString('default', { weekday: 'long' });
                  const formattedDate = dateObj.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
                  const isToday = dateStr === new Date().toISOString().split('T')[0];

                  return (
                    <div
                      key={dateStr}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.05)',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Date Header */}
                      <div style={{
                        padding: '10px 18px',
                        background: isToday ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255,255,255,0.04)',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: isToday ? '#38bdf8' : '#ffffff' }}>
                            {dayOfWeek}, {formattedDate}
                          </span>
                          {isToday && (
                            <span style={{ fontSize: 10, fontWeight: 800, background: '#38bdf8', color: '#000', padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase' }}>
                              Today
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
                          {items.length} {items.length === 1 ? 'task' : 'tasks'}
                        </span>
                      </div>

                      {/* Items List */}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {items.map((item, idx) => {
                          const isGlobal = !item.project_id;
                          const project = isGlobal ? null : projects[item.project_id];
                          const col = isGlobal ? '#f59e0b' : typeColor(project?.type);
                          const projName = isGlobal ? 'Global Task' : project?.name || 'Project Task';
                          const isDone = item.status === 'DONE';
                          const isInProgress = item.status === 'IN_PROGRESS';
                          const badge = getOpBadge(item.title, item.note);

                          return (
                            <div
                              key={item.id}
                              onClick={() => openEditModal(item)}
                              style={{
                                padding: '12px 18px',
                                borderBottom: idx < items.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 16,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                opacity: isDone ? 0.45 : 1
                              }}
                              className="hover:bg-white/[0.03]"
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                                {/* Status Toggle Checkbox */}
                                <button
                                  onClick={(e) => cycleStatus(item, e)}
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                                  title={`Status: ${item.status}. Click to cycle.`}
                                >
                                  {isDone ? (
                                    <i className="fa-solid fa-circle-check text-emerald-400 text-lg" />
                                  ) : isInProgress ? (
                                    <i className="fa-solid fa-circle-play text-sky-400 text-lg" />
                                  ) : (
                                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)' }} />
                                  )}
                                </button>

                                {/* Time Badge */}
                                <div style={{
                                  minWidth: 100,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: '#38bdf8',
                                  fontFamily: 'monospace'
                                }}>
                                  {item.time || '—'}
                                </div>

                                {/* Content Details */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                                    <span style={{
                                      fontSize: 10,
                                      fontWeight: 800,
                                      padding: '2px 8px',
                                      borderRadius: 4,
                                      background: `${col}18`,
                                      color: col,
                                      border: `1px solid ${col}30`
                                    }}>
                                      {projName}
                                    </span>

                                    {badge && (
                                      <span style={{
                                        fontSize: 9,
                                        fontWeight: 800,
                                        padding: '2px 6px',
                                        borderRadius: 4,
                                        background: badge.bg,
                                        color: badge.text,
                                        border: `1px solid ${badge.border}`
                                      }}>
                                        {badge.label}
                                      </span>
                                    )}

                                    <span style={{
                                      fontSize: 13,
                                      fontWeight: 700,
                                      color: isDone ? '#9ca3af' : '#ffffff',
                                      textDecoration: isDone ? 'line-through' : 'none'
                                    }}>
                                      {item.title}
                                    </span>
                                  </div>

                                  {/* Note / Location / Remarks */}
                                  {item.note && (
                                    <div style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                      <i className="fa-solid fa-location-dot text-zinc-500" />
                                      <span>{item.note}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right Side: Assignee & Action */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                                {item.assignee && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#d1d5db', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6 }}>
                                    <i className="fa-solid fa-user text-[10px] text-zinc-500" />
                                    <span>{item.assignee}</span>
                                  </div>
                                )}
                                <button
                                  onClick={(e) => openEditModal(item, e)}
                                  className="zto-btn zto-btn-ghost"
                                  style={{ padding: '6px 10px', fontSize: 11 }}
                                >
                                  <i className="fa-solid fa-pen-to-square" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>
      </div>

      {/* ════════ DAY OVERFLOW POPOVER MODAL ════════ */}
      {selectedDayPopover && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20
        }}>
          <div
            onClick={() => setSelectedDayPopover(null)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          />
          <div className="zto-card page-transition" style={{
            position: 'relative', width: '100%', maxWidth: 520, zIndex: 10, padding: 24, borderRadius: 16
          }}>
            <button
              onClick={() => setSelectedDayPopover(null)}
              className="zto-btn zto-btn-ghost"
              style={{ position: 'absolute', top: 16, right: 16, padding: '6px 10px' }}
            >
              <i className="fa-solid fa-xmark" />
            </button>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', marginBottom: 4 }}>
              Schedule for {selectedDayPopover.dateString}
            </h3>
            <p className="zto-desc" style={{ marginBottom: 18, fontSize: 12, color: '#9ca3af' }}>
              {selectedDayPopover.items.length} tasks scheduled on this day.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
              {selectedDayPopover.items.map(item => {
                const isGlobal = !item.project_id;
                const project = isGlobal ? null : projects[item.project_id];
                const col = isGlobal ? '#f59e0b' : typeColor(project?.type);
                const isDone = item.status === 'DONE';

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedDayPopover(null);
                      openEditModal(item);
                    }}
                    style={{
                      padding: '10px 12px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10
                    }}
                    className="hover:bg-white/[0.08]"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8' }}>{item.time || '—'}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#ffffff', textDecoration: isDone ? 'line-through' : 'none' }}>
                          {item.title}
                        </div>
                      </div>
                    </div>
                    <i className="fa-solid fa-chevron-right text-xs text-zinc-600" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════ FULL-FEATURED EDIT MODAL ════════ */}
      {editingItem && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20
        }}>
          <div
            onClick={() => setEditingItem(null)}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(8px)'
            }}
          />
          <div className="zto-card page-transition" style={{
            position: 'relative',
            width: '100%',
            maxWidth: 480,
            zIndex: 10,
            padding: 26,
            borderRadius: 16
          }}>
            <button
              onClick={() => setEditingItem(null)}
              className="zto-btn zto-btn-ghost"
              style={{ position: 'absolute', top: 16, right: 16, padding: '6px 10px', fontSize: 13 }}
            >
              <i className="fa-solid fa-xmark" />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#38bdf8' }}>
                {editingItem.project_id ? (projects[editingItem.project_id]?.name || 'Project Task') : 'Global Task'}
              </span>
            </div>

            <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--c-ink, #ffffff)', marginBottom: 4 }}>
              Edit Operation Schedule
            </h2>
            <p className="zto-desc" style={{ marginBottom: 20, fontSize: 12, color: '#9ca3af' }}>
              Update timing, location details, assignee and completion status.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Title */}
              <div>
                <label className="zto-label" style={{ display: 'block', marginBottom: 6, fontSize: 11 }}>Task Title</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="zto-input"
                  placeholder="e.g. LED Setup & Event"
                />
              </div>

              {/* Date & Time Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="zto-label" style={{ display: 'block', marginBottom: 6, fontSize: 11 }}>Date</label>
                  <input
                    type="date"
                    value={editFormData.date}
                    onChange={e => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="zto-input"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label className="zto-label" style={{ display: 'block', marginBottom: 6, fontSize: 11 }}>Time</label>
                  <input
                    type="text"
                    value={editFormData.time}
                    onChange={e => setEditFormData({ ...editFormData, time: e.target.value })}
                    className="zto-input"
                    placeholder="09:00 - 17:00"
                  />
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="zto-label" style={{ display: 'block', marginBottom: 6, fontSize: 11 }}>Status</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {(['PENDING', 'IN_PROGRESS', 'DONE'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, status: st })}
                      style={{
                        padding: '7px 8px',
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 8,
                        border: '1px solid',
                        borderColor: editFormData.status === st ? (st === 'DONE' ? '#10b981' : st === 'IN_PROGRESS' ? '#38bdf8' : '#eab308') : 'rgba(255,255,255,0.08)',
                        background: editFormData.status === st ? (st === 'DONE' ? 'rgba(16, 185, 129, 0.15)' : st === 'IN_PROGRESS' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(234, 179, 8, 0.15)') : 'rgba(255,255,255,0.03)',
                        color: editFormData.status === st ? (st === 'DONE' ? '#34d399' : st === 'IN_PROGRESS' ? '#38bdf8' : '#facc15') : '#9ca3af',
                        cursor: 'pointer'
                      }}
                    >
                      {st === 'PENDING' && 'Pending'}
                      {st === 'IN_PROGRESS' && 'In Progress'}
                      {st === 'DONE' && 'Done'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className="zto-label" style={{ display: 'block', marginBottom: 6, fontSize: 11 }}>Assignee / Team</label>
                <input
                  type="text"
                  value={editFormData.assignee}
                  onChange={e => setEditFormData({ ...editFormData, assignee: e.target.value })}
                  className="zto-input"
                  placeholder="e.g. Tony, Connie, Audio Team"
                />
              </div>

              {/* Note / Location */}
              <div>
                <label className="zto-label" style={{ display: 'block', marginBottom: 6, fontSize: 11 }}>Location & Operational Notes</label>
                <textarea
                  rows={2}
                  value={editFormData.note}
                  onChange={e => setEditFormData({ ...editFormData, note: e.target.value })}
                  className="zto-input"
                  placeholder="Venue, load-in cues, equipment remarks..."
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button
                onClick={deleteItem}
                disabled={loading}
                className="zto-btn zto-btn-danger"
                style={{ padding: '0 14px' }}
                title="Delete task"
              >
                <i className="fa-regular fa-trash-can" />
              </button>
              <button
                onClick={() => setEditingItem(null)}
                className="zto-btn zto-btn-ghost"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={loading}
                className="zto-btn zto-btn-primary"
                style={{ flex: 1.5 }}
              >
                {loading ? <i className="fa-solid fa-circle-notch fa-spin" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ FULL-FEATURED ADD GLOBAL TASK MODAL ════════ */}
      {addingGlobal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20
        }}>
          <div
            onClick={() => setAddingGlobal(false)}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(8px)'
            }}
          />
          <div className="zto-card page-transition" style={{
            position: 'relative',
            width: '100%',
            maxWidth: 480,
            zIndex: 10,
            padding: 26,
            borderRadius: 16
          }}>
            <button
              onClick={() => setAddingGlobal(false)}
              className="zto-btn zto-btn-ghost"
              style={{ position: 'absolute', top: 16, right: 16, padding: '6px 10px', fontSize: 13 }}
            >
              <i className="fa-solid fa-xmark" />
            </button>

            <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--c-ink, #ffffff)', marginBottom: 4 }}>
              Add Global Task
            </h2>
            <p className="zto-desc" style={{ marginBottom: 20, fontSize: 12, color: '#9ca3af' }}>
              Create a cross-deployment task or milestone not bound to a single client project.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="zto-label" style={{ display: 'block', marginBottom: 6, fontSize: 11 }}>Task Title</label>
                <input
                  type="text"
                  value={addFormData.title}
                  onChange={e => setAddFormData({ ...addFormData, title: e.target.value })}
                  className="zto-input"
                  placeholder="e.g. Warehouse Inventory Loading"
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="zto-label" style={{ display: 'block', marginBottom: 6, fontSize: 11 }}>Date</label>
                  <input
                    type="date"
                    value={addFormData.date}
                    onChange={e => setAddFormData({ ...addFormData, date: e.target.value })}
                    className="zto-input"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label className="zto-label" style={{ display: 'block', marginBottom: 6, fontSize: 11 }}>Time</label>
                  <input
                    type="text"
                    value={addFormData.time}
                    onChange={e => setAddFormData({ ...addFormData, time: e.target.value })}
                    className="zto-input"
                    placeholder="09:00 - 10:00"
                  />
                </div>
              </div>

              <div>
                <label className="zto-label" style={{ display: 'block', marginBottom: 6, fontSize: 11 }}>Assignee / Team</label>
                <input
                  type="text"
                  value={addFormData.assignee}
                  onChange={e => setAddFormData({ ...addFormData, assignee: e.target.value })}
                  className="zto-input"
                  placeholder="e.g. Team, Connie"
                />
              </div>

              <div>
                <label className="zto-label" style={{ display: 'block', marginBottom: 6, fontSize: 11 }}>Location & Operational Notes</label>
                <textarea
                  rows={2}
                  value={addFormData.note}
                  onChange={e => setAddFormData({ ...addFormData, note: e.target.value })}
                  className="zto-input"
                  placeholder="Location, logistics remarks..."
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                onClick={() => setAddingGlobal(false)}
                className="zto-btn zto-btn-ghost"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={addGlobalItem}
                disabled={loading}
                className="zto-btn zto-btn-primary"
                style={{ flex: 1.5 }}
              >
                {loading ? <i className="fa-solid fa-circle-notch fa-spin" /> : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
