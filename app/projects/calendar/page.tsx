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

// Local date string formatter without UTC timezone drift
const formatDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Calculate 7 days for the week (Monday to Sunday)
const getWeekRange = (baseDate: Date) => {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const dayOfWeek = d.getDay(); // 0 is Sunday, 1 is Monday ...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const days: {
    date: Date;
    dateStr: string;
    dayName: string;
    fullDayName: string;
    dayNumber: number;
    monthName: string;
    isToday: boolean;
    isWeekend: boolean;
  }[] = [];

  const todayStr = formatDateKey(new Date());

  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);
    const dateStr = formatDateKey(cur);
    const curDay = cur.getDay();
    days.push({
      date: cur,
      dateStr,
      dayName: cur.toLocaleDateString('en-US', { weekday: 'short' }),
      fullDayName: cur.toLocaleDateString('en-US', { weekday: 'long' }),
      dayNumber: cur.getDate(),
      monthName: cur.toLocaleDateString('en-US', { month: 'short' }),
      isToday: dateStr === todayStr,
      isWeekend: curDay === 0 || curDay === 6
    });
  }

  return {
    monday,
    sunday: days[6].date,
    days,
    startStr: days[0].dateStr,
    endStr: days[6].dateStr
  };
};

const formatWeekLabel = (startDate: Date, endDate: Date) => {
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  if (startYear !== endYear) {
    return `${startMonth} ${startDate.getDate()}, ${startYear} – ${endMonth} ${endDate.getDate()}, ${endYear}`;
  }
  if (startMonth !== endMonth) {
    return `${startMonth} ${startDate.getDate()} – ${endMonth} ${endDate.getDate()}, ${startYear}`;
  }
  return `${startMonth} ${startDate.getDate()} – ${endDate.getDate()}, ${startYear}`;
};

const getWeekNumber = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export default function GlobalCalendarPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [projects, setProjects] = useState<Record<string, Project>>({});
  const [loading, setLoading] = useState(true);

  // View state: 'month' | 'week' | 'list'
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');

  // List View Sub-states: Scope & Format
  const [listScope, setListScope] = useState<'MONTH' | 'WEEK' | 'UPCOMING' | 'ALL'>('MONTH');
  const [listLayout, setListLayout] = useState<'grouped' | 'table'>('grouped');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'GLOBAL' | 'PROJECTS' | 'PENDING' | 'DONE'>('ALL');

  // Day Overflow Popover (Month view)
  const [selectedDayPopover, setSelectedDayPopover] = useState<{ dateString: string; items: ScheduleItem[] } | null>(null);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    project_id: '',
    date: '',
    time: '',
    title: '',
    note: '',
    assignee: '',
    status: 'PENDING' as 'PENDING' | 'IN_PROGRESS' | 'DONE'
  });

  // Add Modal State
  const [addingTask, setAddingTask] = useState(false);
  const [addFormData, setAddFormData] = useState({
    project_id: '',
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
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + offset);
    setCurrentDate(d);
  };

  const changeWeek = (offset: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + offset * 7);
    setCurrentDate(d);
  };

  const jumpToToday = () => {
    setCurrentDate(new Date());
  };

  const openEditModal = (item: ScheduleItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingItem(item);
    setEditFormData({
      project_id: item.project_id || '',
      date: item.date || '',
      time: item.time || '',
      title: item.title || '',
      note: item.note || '',
      assignee: item.assignee || '',
      status: item.status || 'PENDING'
    });
  };

  const openAddModalForDate = (dateStr: string, defaultProjectId: string = '') => {
    setAddFormData({
      project_id: defaultProjectId,
      title: '',
      date: dateStr,
      time: '09:00 - 10:00',
      note: '',
      assignee: '',
      status: 'PENDING'
    });
    setAddingTask(true);
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
    const { project_id, date, time, title, note, assignee, status } = editFormData;

    await supabase.from('schedule_items').update({
      project_id: project_id ? project_id : null,
      date,
      time,
      title,
      note,
      assignee,
      status
    }).eq('id', editingItem.id);

    setScheduleItems(prev => prev.map(s => s.id === editingItem.id ? {
      ...s,
      project_id: project_id ? project_id : null,
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
        items: prev.items.map(s => s.id === editingItem.id ? {
          ...s,
          project_id: project_id ? project_id : null,
          date,
          time,
          title,
          note,
          assignee,
          status
        } : s)
      }) : null);
    }

    setEditingItem(null);
    setLoading(false);
  };

  const addTaskItem = async () => {
    if (!addFormData.title || !addFormData.date) return;
    setLoading(true);
    const { data, error } = await supabase.from('schedule_items').insert({
      project_id: addFormData.project_id ? addFormData.project_id : null,
      title: addFormData.title,
      date: addFormData.date,
      time: addFormData.time,
      note: addFormData.note,
      assignee: addFormData.assignee,
      status: addFormData.status || 'PENDING'
    }).select().single();

    if (error) {
      alert('Error adding task: ' + error.message);
    } else if (data) {
      setScheduleItems(prev => [...prev, data]);
      setAddingTask(false);
      setAddFormData({ project_id: '', title: '', date: '', time: '09:00 - 10:00', note: '', assignee: '', status: 'PENDING' });
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

  const deleteSpecificItem = async (item: ScheduleItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    setLoading(true);
    await supabase.from('schedule_items').delete().eq('id', item.id);
    setScheduleItems(prev => prev.filter(s => s.id !== item.id));
    if (selectedDayPopover) {
      setSelectedDayPopover(prev => prev ? ({
        ...prev,
        items: prev.items.filter(s => s.id !== item.id)
      }) : null);
    }
    if (editingItem?.id === item.id) {
      setEditingItem(null);
    }
    setLoading(false);
  };

  const parseTimeMinutes = (t: string) => {
    if (!t) return 9999;
    const match = t.match(/(\d{1,2}):(\d{2})/);
    if (!match) return 9999;
    return parseInt(match[1]) * 60 + parseInt(match[2]);
  };

  // Calendar Calculation for Month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  // Week Information
  const weekInfo = useMemo(() => getWeekRange(currentDate), [currentDate]);
  const weekDaysSet = useMemo(() => new Set(weekInfo.days.map(d => d.dateStr)), [weekInfo]);

  // Filtered Items based on search and type
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
      if (!item.date) return;
      if (!map[item.date]) map[item.date] = [];
      map[item.date].push(item);
    });
    Object.values(map).forEach(items => {
      items.sort((a, b) => parseTimeMinutes(a.time) - parseTimeMinutes(b.time));
    });
    return map;
  }, [filteredScheduleItems]);

  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  const currentMonthTaskCount = useMemo(() => {
    return filteredScheduleItems.filter(item => item.date && item.date.startsWith(monthPrefix)).length;
  }, [filteredScheduleItems, monthPrefix]);

  const currentWeekTasks = useMemo(() => {
    return filteredScheduleItems.filter(item => item.date && weekDaysSet.has(item.date));
  }, [filteredScheduleItems, weekDaysSet]);

  // List View Items based on List Scope
  const listFilteredItems = useMemo(() => {
    const todayStr = formatDateKey(new Date());
    return filteredScheduleItems.filter(item => {
      if (!item.date) return false;
      if (listScope === 'MONTH') {
        return item.date.startsWith(monthPrefix);
      }
      if (listScope === 'WEEK') {
        return weekDaysSet.has(item.date);
      }
      if (listScope === 'UPCOMING') {
        return item.date >= todayStr;
      }
      return true; // ALL
    }).sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return parseTimeMinutes(a.time) - parseTimeMinutes(b.time);
    });
  }, [filteredScheduleItems, listScope, monthPrefix, weekDaysSet]);

  const listDates = useMemo(() => {
    return Array.from(new Set(listFilteredItems.map(i => i.date))).sort();
  }, [listFilteredItems]);

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

          {/* Add Task */}
          <button
            onClick={() => {
              setAddFormData(prev => ({
                ...prev,
                project_id: '',
                date: formatDateKey(new Date())
              }));
              setAddingTask(true);
            }}
            className="zto-btn zto-btn-primary"
            style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <i className="fa-solid fa-plus" /> Add Task
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
            
            {/* Date Navigation & Today */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3, border: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  onClick={() => {
                    if (viewMode === 'week' || (viewMode === 'list' && listScope === 'WEEK')) {
                      changeWeek(-1);
                    } else {
                      changeMonth(-1);
                    }
                  }}
                  className="zto-btn zto-btn-ghost"
                  style={{ padding: '6px 12px', border: 'none', borderRadius: 8 }}
                  aria-label="Previous"
                  title={viewMode === 'week' || (viewMode === 'list' && listScope === 'WEEK') ? "Previous Week" : "Previous Month"}
                >
                  <i className="fa-solid fa-chevron-left" />
                </button>
                <button
                  onClick={jumpToToday}
                  className="zto-btn zto-btn-ghost"
                  style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, border: 'none', borderRadius: 8, color: '#38bdf8' }}
                  title="Jump to Today"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    if (viewMode === 'week' || (viewMode === 'list' && listScope === 'WEEK')) {
                      changeWeek(1);
                    } else {
                      changeMonth(1);
                    }
                  }}
                  className="zto-btn zto-btn-ghost"
                  style={{ padding: '6px 12px', border: 'none', borderRadius: 8 }}
                  aria-label="Next"
                  title={viewMode === 'week' || (viewMode === 'list' && listScope === 'WEEK') ? "Next Week" : "Next Month"}
                >
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </div>

              <div style={{ marginLeft: 6 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em', color: '#ffffff' }}>
                  {viewMode === 'month' && currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  {viewMode === 'week' && `Week ${getWeekNumber(currentDate)} • ${formatWeekLabel(weekInfo.monday, weekInfo.sunday)}`}
                  {viewMode === 'list' && (
                    listScope === 'MONTH' ? `${currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}` :
                    listScope === 'WEEK' ? `Week ${getWeekNumber(currentDate)} • ${formatWeekLabel(weekInfo.monday, weekInfo.sunday)}` :
                    listScope === 'UPCOMING' ? 'All Upcoming Operations' : 'All Operation History'
                  )}
                </h2>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>
                  {viewMode === 'month' && `${currentMonthTaskCount} tasks scheduled`}
                  {viewMode === 'week' && `${currentWeekTasks.length} tasks this week`}
                  {viewMode === 'list' && `${listFilteredItems.length} tasks matching filters`}
                </span>
              </div>
            </div>

            {/* View Mode Switcher: Month | Week | List */}
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
                  onClick={() => setViewMode('week')}
                  style={{
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: viewMode === 'week' ? 'var(--c-accent, #0056B3)' : 'transparent',
                    color: viewMode === 'week' ? '#ffffff' : '#9ca3af'
                  }}
                >
                  <i className="fa-solid fa-calendar-week mr-1.5" /> Week
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: viewMode === 'list' ? 'var(--c-accent, #0056B3)' : 'transparent',
                    color: viewMode === 'list' ? '#ffffff' : '#9ca3af'
                  }}
                >
                  <i className="fa-solid fa-list-ul mr-1.5" /> List
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
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06b6d4', display: 'inline-block' }} />
              <span>Expo</span>
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
                const isToday = dateString === formatDateKey(new Date());

                const maxDisplay = 3;
                const visibleItems = dayItems.slice(0, maxDisplay);
                const overflowCount = dayItems.length - maxDisplay;

                return (
                  <div
                    key={dateString}
                    onClick={() => openAddModalForDate(dateString)}
                    className={`bg-[#121214] min-h-[135px] p-2 flex flex-col gap-1 border-t border-zinc-800/50 transition-all hover:bg-zinc-800/30 cursor-pointer ${isToday ? 'ring-1 ring-inset ring-sky-500/40' : ''}`}
                    title={`Click to add task on ${dateString}`}
                  >
                    {/* Day number header */}
                    <div className="flex items-center justify-between mb-0.5" onClick={e => e.stopPropagation()}>
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
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(item);
                          }}
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

                          {/* Quick Op Badge */}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDayPopover({ dateString, items: dayItems });
                        }}
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

          {/* ════════ VIEW 2: WEEKLY VIEW (周视图) ════════ */}
          {viewMode === 'week' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Week Highlights Bar */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: 12,
                padding: '14px 18px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 14,
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                    <i className="fa-solid fa-calendar-week text-base" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Week Total</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#ffffff' }}>
                      {currentWeekTasks.length} <span style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af' }}>tasks</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(234, 179, 8, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#facc15' }}>
                    <i className="fa-regular fa-clock text-base" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Active / Pending</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#facc15' }}>
                      {currentWeekTasks.filter(t => t.status !== 'DONE').length}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                    <i className="fa-solid fa-check text-base" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Completed</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#34d399' }}>
                      {currentWeekTasks.filter(t => t.status === 'DONE').length}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                    <i className="fa-solid fa-cubes text-base" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Projects Involved</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#c084fc' }}>
                      {new Set(currentWeekTasks.filter(t => t.project_id).map(t => t.project_id)).size}
                    </div>
                  </div>
                </div>
              </div>

              {/* 7-Day Spacious Columns with Responsive Scroll */}
              <div style={{ overflowX: 'auto', paddingBottom: 14, margin: '0 -4px' }}>
                <div style={{ minWidth: 1080, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12 }}>
                  {weekInfo.days.map(day => {
                    const dayTasks = itemsByDate[day.dateStr] || [];
                    const isToday = day.isToday;

                    return (
                      <div
                        key={day.dateStr}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                          background: isToday ? 'rgba(56, 189, 248, 0.03)' : 'rgba(255, 255, 255, 0.015)',
                          border: isToday ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: 14,
                          padding: 12,
                          boxShadow: isToday ? '0 0 20px rgba(56, 189, 248, 0.06)' : 'none'
                        }}
                      >
                        {/* Day Header */}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          paddingBottom: 10,
                          borderBottom: isToday ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid rgba(255, 255, 255, 0.06)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{
                                fontSize: 12,
                                fontWeight: 800,
                                color: isToday ? '#38bdf8' : '#e4e4e7',
                                letterSpacing: '0.04em'
                              }}>
                                {day.dayName.toUpperCase()}
                              </span>
                              {isToday && (
                                <span style={{ fontSize: 9, fontWeight: 900, background: '#38bdf8', color: '#09090b', padding: '1px 5px', borderRadius: 4, letterSpacing: '0.05em' }}>
                                  TODAY
                                </span>
                              )}
                              {day.isWeekend && !isToday && (
                                <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '1px 5px', borderRadius: 4 }}>
                                  WEEKEND
                                </span>
                              )}
                            </div>

                            <span style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 13,
                              fontWeight: 800,
                              background: isToday ? '#38bdf8' : 'rgba(255,255,255,0.06)',
                              color: isToday ? '#09090b' : '#ffffff',
                              boxShadow: isToday ? '0 0 12px rgba(56,189,248,0.6)' : 'none'
                            }}>
                              {day.dayNumber}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                            <span style={{ color: '#71717a', fontWeight: 600 }}>
                              {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                            </span>
                            <button
                              onClick={() => openAddModalForDate(day.dateStr)}
                              className="zto-btn zto-btn-ghost"
                              style={{ padding: '2px 8px', fontSize: 10, borderRadius: 6, gap: 4, display: 'flex', alignItems: 'center' }}
                              title={`Add task on ${day.dateStr}`}
                            >
                              <i className="fa-solid fa-plus text-[9px]" /> Add
                            </button>
                          </div>
                        </div>

                        {/* Tasks List - NO truncation in Weekly view! */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 460 }}>
                          {dayTasks.length === 0 ? (
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '40px 10px',
                              borderRadius: 10,
                              border: '1px dashed rgba(255,255,255,0.06)',
                              background: 'rgba(255,255,255,0.01)',
                              marginTop: 8
                            }}>
                              <i className="fa-regular fa-calendar-check text-2xl text-zinc-700 mb-2" />
                              <span style={{ fontSize: 11, color: '#71717a', fontWeight: 600 }}>No tasks scheduled</span>
                              <button
                                onClick={() => openAddModalForDate(day.dateStr)}
                                style={{
                                  marginTop: 10,
                                  padding: '4px 10px',
                                  fontSize: 11,
                                  borderRadius: 6,
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  background: 'rgba(255,255,255,0.03)',
                                  color: '#9ca3af',
                                  cursor: 'pointer'
                                }}
                                className="hover:text-white hover:border-white/20 transition-colors"
                              >
                                + Schedule task
                              </button>
                            </div>
                          ) : (
                            dayTasks.map(item => {
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
                                    padding: '10px 11px',
                                    borderRadius: 10,
                                    cursor: 'pointer',
                                    background: isDone ? 'rgba(255,255,255,0.015)' : isInProgress ? 'rgba(56, 189, 248, 0.06)' : 'rgba(255, 255, 255, 0.035)',
                                    border: isDone ? '1px solid rgba(255,255,255,0.03)' : isInProgress ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                                    opacity: isDone ? 0.45 : 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                    transition: 'all 0.15s'
                                  }}
                                  className="hover:border-sky-500/50 hover:bg-white/[0.06] group"
                                >
                                  {/* Top Row: Status, Time, Op Badge */}
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                      {/* Status Cycle Button */}
                                      <button
                                        onClick={(e) => cycleStatus(item, e)}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                                        title={`Status: ${item.status}. Click to cycle.`}
                                      >
                                        {isDone ? (
                                          <i className="fa-solid fa-circle-check text-emerald-400 text-xs" />
                                        ) : isInProgress ? (
                                          <i className="fa-solid fa-circle-play text-sky-400 text-xs animate-pulse" />
                                        ) : (
                                          <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.3)' }} />
                                        )}
                                      </button>

                                      {/* Time Badge */}
                                      <span style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: '#38bdf8',
                                        fontFamily: 'monospace'
                                      }}>
                                        {item.time || 'All Day'}
                                      </span>
                                    </div>

                                    {badge && (
                                      <span style={{
                                        fontSize: 8,
                                        fontWeight: 900,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.04em',
                                        padding: '2px 5px',
                                        borderRadius: 4,
                                        background: badge.bg,
                                        color: badge.text,
                                        border: `1px solid ${badge.border}`,
                                        flexShrink: 0
                                      }}>
                                        {badge.label}
                                      </span>
                                    )}
                                  </div>

                                  {/* Project Tag */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <span style={{
                                      fontSize: 9,
                                      fontWeight: 800,
                                      padding: '1px 6px',
                                      borderRadius: 4,
                                      background: `${col}15`,
                                      color: col,
                                      border: `1px solid ${col}25`,
                                      maxWidth: '100%',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {projName}
                                    </span>
                                  </div>

                                  {/* Task Title (Wrapped, fully readable) */}
                                  <div style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: isDone ? '#9ca3af' : '#ffffff',
                                    textDecoration: isDone ? 'line-through' : 'none',
                                    lineHeight: 1.35
                                  }}>
                                    {item.title}
                                  </div>

                                  {/* Notes / Venue */}
                                  {item.note && (
                                    <div style={{ fontSize: 10, color: '#9ca3af', display: 'flex', alignItems: 'flex-start', gap: 5, marginTop: 2 }}>
                                      <i className="fa-solid fa-location-dot text-zinc-500 text-[10px] mt-0.5 shrink-0" />
                                      <span style={{ lineHeight: 1.3 }}>{item.note}</span>
                                    </div>
                                  )}

                                  {/* Assignee & Action Row */}
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                                    {item.assignee ? (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#cbd5e1' }}>
                                        <i className="fa-solid fa-user text-zinc-500 text-[9px]" />
                                        <span>{item.assignee}</span>
                                      </div>
                                    ) : <span />}

                                    <button
                                      onClick={(e) => openEditModal(item, e)}
                                      className="text-zinc-500 hover:text-sky-400 transition-colors"
                                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, fontSize: 11 }}
                                      title="Edit task"
                                    >
                                      <i className="fa-solid fa-pen-to-square" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ════════ VIEW 3: LIST / TABLE VIEW (列表视图) ════════ */}
          {viewMode === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* List Filter Sub-strip: Scope + Format Switcher */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                {/* Scope Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Range:</span>
                  {(['MONTH', 'WEEK', 'UPCOMING', 'ALL'] as const).map(scope => (
                    <button
                      key={scope}
                      onClick={() => setListScope(scope)}
                      style={{
                        padding: '4px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 6,
                        border: '1px solid',
                        borderColor: listScope === scope ? '#38bdf8' : 'rgba(255,255,255,0.08)',
                        background: listScope === scope ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.02)',
                        color: listScope === scope ? '#38bdf8' : '#9ca3af',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {scope === 'MONTH' && 'This Month'}
                      {scope === 'WEEK' && 'This Week'}
                      {scope === 'UPCOMING' && 'Upcoming (From Today)'}
                      {scope === 'ALL' && 'All History'}
                    </button>
                  ))}
                </div>

                {/* Format Toggle: Grouped Timeline vs Table View */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <button
                    onClick={() => setListLayout('grouped')}
                    style={{
                      padding: '4px 11px',
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      background: listLayout === 'grouped' ? 'rgba(255,255,255,0.1)' : 'transparent',
                      color: listLayout === 'grouped' ? '#ffffff' : '#9ca3af'
                    }}
                  >
                    <i className="fa-solid fa-list-check mr-1.5" /> Grouped by Date
                  </button>
                  <button
                    onClick={() => setListLayout('table')}
                    style={{
                      padding: '4px 11px',
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      background: listLayout === 'table' ? 'rgba(255,255,255,0.1)' : 'transparent',
                      color: listLayout === 'table' ? '#ffffff' : '#9ca3af'
                    }}
                  >
                    <i className="fa-solid fa-table-list mr-1.5" /> Compact Table
                  </button>
                </div>
              </div>

              {/* Content: Grouped by Date or Table View */}
              {listFilteredItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                  <i className="fa-regular fa-calendar-xmark text-4xl mb-3 block text-zinc-600" />
                  <p style={{ fontSize: 14, fontWeight: 600 }}>No operations found for this scope matching your filters.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterType('ALL');
                      setListScope('ALL');
                    }}
                    className="zto-btn zto-btn-ghost"
                    style={{ marginTop: 12, fontSize: 12 }}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : listLayout === 'grouped' ? (
                /* ── Grouped Timeline ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {listDates.map(dateStr => {
                    const items = itemsByDate[dateStr] || [];
                    const dateObj = new Date(`${dateStr}T00:00:00`);
                    const dayOfWeek = dateObj.toLocaleDateString('default', { weekday: 'long' });
                    const formattedDate = dateObj.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
                    const isToday = dateStr === formatDateKey(new Date());

                    return (
                      <div
                        key={dateStr}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          borderRadius: 12,
                          border: isToday ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(255,255,255,0.05)',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Date Header */}
                        <div style={{
                          padding: '10px 18px',
                          background: isToday ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255,255,255,0.035)',
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
                              {items.length} {items.length === 1 ? 'task' : 'tasks'}
                            </span>
                            <button
                              onClick={() => openAddModalForDate(dateStr)}
                              className="zto-btn zto-btn-ghost"
                              style={{ padding: '3px 8px', fontSize: 11 }}
                              title="Add task on this day"
                            >
                              <i className="fa-solid fa-plus mr-1" /> Add
                            </button>
                          </div>
                        </div>

                        {/* Items in Date */}
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

                                  <div style={{
                                    minWidth: 100,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: '#38bdf8',
                                    fontFamily: 'monospace'
                                  }}>
                                    {item.time || 'All Day'}
                                  </div>

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

                                    {item.note && (
                                      <div style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                        <i className="fa-solid fa-location-dot text-zinc-500" />
                                        <span>{item.note}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

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
                                    title="Edit"
                                  >
                                    <i className="fa-solid fa-pen-to-square" />
                                  </button>
                                  <button
                                    onClick={(e) => deleteSpecificItem(item, e)}
                                    className="zto-btn zto-btn-ghost text-red-400 hover:text-red-300"
                                    style={{ padding: '6px 10px', fontSize: 11 }}
                                    title="Delete"
                                  >
                                    <i className="fa-regular fa-trash-can" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* ── Compact Table View ── */
                <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <th style={{ padding: '12px 16px', width: 44 }}>Status</th>
                        <th style={{ padding: '12px 14px', width: 120 }}>Date</th>
                        <th style={{ padding: '12px 14px', width: 110 }}>Time</th>
                        <th style={{ padding: '12px 14px', width: 160 }}>Project</th>
                        <th style={{ padding: '12px 14px' }}>Task & Badges</th>
                        <th style={{ padding: '12px 14px', width: 140 }}>Assignee</th>
                        <th style={{ padding: '12px 14px', width: 180 }}>Location / Remarks</th>
                        <th style={{ padding: '12px 16px', width: 90, textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listFilteredItems.map((item, idx) => {
                        const isGlobal = !item.project_id;
                        const project = isGlobal ? null : projects[item.project_id];
                        const col = isGlobal ? '#f59e0b' : typeColor(project?.type);
                        const projName = isGlobal ? 'Global Task' : project?.name || 'Project Task';
                        const isDone = item.status === 'DONE';
                        const isInProgress = item.status === 'IN_PROGRESS';
                        const badge = getOpBadge(item.title, item.note);

                        return (
                          <tr
                            key={item.id}
                            onClick={() => openEditModal(item)}
                            style={{
                              borderBottom: idx < listFilteredItems.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                              cursor: 'pointer',
                              opacity: isDone ? 0.45 : 1,
                              transition: 'background 0.15s'
                            }}
                            className="hover:bg-white/[0.04]"
                          >
                            <td style={{ padding: '10px 16px' }} onClick={e => e.stopPropagation()}>
                              <button
                                onClick={(e) => cycleStatus(item, e)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                                title={`Status: ${item.status}. Click to cycle.`}
                              >
                                {isDone ? (
                                  <i className="fa-solid fa-circle-check text-emerald-400 text-base" />
                                ) : isInProgress ? (
                                  <i className="fa-solid fa-circle-play text-sky-400 text-base" />
                                ) : (
                                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)' }} />
                                )}
                              </button>
                            </td>
                            <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontWeight: 700, color: '#e4e4e7' }}>
                              {item.date}
                            </td>
                            <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                              {item.time || 'All Day'}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{
                                fontSize: 10,
                                fontWeight: 800,
                                padding: '2px 7px',
                                borderRadius: 4,
                                background: `${col}15`,
                                color: col,
                                border: `1px solid ${col}25`,
                                display: 'inline-block',
                                maxWidth: 150,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {projName}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{
                                  fontWeight: 700,
                                  color: isDone ? '#9ca3af' : '#ffffff',
                                  textDecoration: isDone ? 'line-through' : 'none'
                                }}>
                                  {item.title}
                                </span>
                                {badge && (
                                  <span style={{
                                    fontSize: 8,
                                    fontWeight: 900,
                                    padding: '1px 5px',
                                    borderRadius: 3,
                                    background: badge.bg,
                                    color: badge.text,
                                    border: `1px solid ${badge.border}`
                                  }}>
                                    {badge.label}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>
                              {item.assignee ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <i className="fa-solid fa-user text-zinc-500 text-[10px]" />
                                  <span>{item.assignee}</span>
                                </div>
                              ) : (
                                <span style={{ color: '#52525b' }}>—</span>
                              )}
                            </td>
                            <td style={{ padding: '10px 14px', color: '#9ca3af' }}>
                              {item.note || <span style={{ color: '#52525b' }}>—</span>}
                            </td>
                            <td style={{ padding: '10px 16px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                                <button
                                  onClick={() => openEditModal(item)}
                                  className="zto-btn zto-btn-ghost"
                                  style={{ padding: '4px 8px', fontSize: 11 }}
                                  title="Edit task"
                                >
                                  <i className="fa-solid fa-pen-to-square" />
                                </button>
                                <button
                                  onClick={(e) => deleteSpecificItem(item, e)}
                                  className="zto-btn zto-btn-ghost text-red-400 hover:text-red-300"
                                  style={{ padding: '4px 8px', fontSize: 11 }}
                                  title="Delete task"
                                >
                                  <i className="fa-regular fa-trash-can" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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

            <button
              onClick={() => {
                const d = selectedDayPopover.dateString;
                setSelectedDayPopover(null);
                openAddModalForDate(d);
              }}
              className="zto-btn zto-btn-primary"
              style={{ width: '100%', marginTop: 16, fontSize: 12 }}
            >
              <i className="fa-solid fa-plus mr-1" /> Add Task to This Date
            </button>
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
              Update project, timing, location details, assignee and completion status.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Project selector */}
              <div>
                <label className="zto-label" style={{ display: 'block', marginBottom: 6, fontSize: 11 }}>Project Association</label>
                <select
                  value={editFormData.project_id}
                  onChange={e => setEditFormData({ ...editFormData, project_id: e.target.value })}
                  className="zto-input"
                  style={{ background: '#18181b', color: '#fff' }}
                >
                  <option value="">⚡ Global Task (No specific project)</option>
                  {Object.values(projects).map(p => (
                    <option key={p.id} value={p.id}>📁 {p.name} ({p.type || 'Event'})</option>
                  ))}
                </select>
              </div>

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

      {/* ════════ FULL-FEATURED ADD TASK MODAL ════════ */}
      {addingTask && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20
        }}>
          <div
            onClick={() => setAddingTask(false)}
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
              onClick={() => setAddingTask(false)}
              className="zto-btn zto-btn-ghost"
              style={{ position: 'absolute', top: 16, right: 16, padding: '6px 10px', fontSize: 13 }}
            >
              <i className="fa-solid fa-xmark" />
            </button>

            <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--c-ink, #ffffff)', marginBottom: 4 }}>
              Schedule Operation Task
            </h2>
            <p className="zto-desc" style={{ marginBottom: 20, fontSize: 12, color: '#9ca3af' }}>
              Create a cross-deployment task or attach it to a specific client project.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Project selector */}
              <div>
                <label className="zto-label" style={{ display: 'block', marginBottom: 6, fontSize: 11 }}>Project Association</label>
                <select
                  value={addFormData.project_id}
                  onChange={e => setAddFormData({ ...addFormData, project_id: e.target.value })}
                  className="zto-input"
                  style={{ background: '#18181b', color: '#fff' }}
                >
                  <option value="">⚡ Global Task (No specific project)</option>
                  {Object.values(projects).map(p => (
                    <option key={p.id} value={p.id}>📁 {p.name} ({p.type || 'Event'})</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="zto-label" style={{ display: 'block', marginBottom: 6, fontSize: 11 }}>Task Title</label>
                <input
                  type="text"
                  value={addFormData.title}
                  onChange={e => setAddFormData({ ...addFormData, title: e.target.value })}
                  className="zto-input"
                  placeholder="e.g. Warehouse Inventory Loading / Stage Setup"
                  autoFocus
                />
              </div>

              {/* Date & Time */}
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

              {/* Assignee */}
              <div>
                <label className="zto-label" style={{ display: 'block', marginBottom: 6, fontSize: 11 }}>Assignee / Team</label>
                <input
                  type="text"
                  value={addFormData.assignee}
                  onChange={e => setAddFormData({ ...addFormData, assignee: e.target.value })}
                  className="zto-input"
                  placeholder="e.g. Team, Connie, Tony"
                />
              </div>

              {/* Location & Notes */}
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
                onClick={() => setAddingTask(false)}
                className="zto-btn zto-btn-ghost"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={addTaskItem}
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
