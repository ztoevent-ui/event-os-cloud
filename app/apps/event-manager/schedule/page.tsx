'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  assignee: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE';
}

const initialSchedule: ScheduleItem[] = [
  { id: '1', time: '08:00 AM', title: 'Loading & Setup (Stage & AV)', assignee: 'Production Team', status: 'DONE' },
  { id: '2', time: '12:00 PM', title: 'Sound Check', assignee: 'AV Crew & Band', status: 'DONE' },
  { id: '3', time: '02:00 PM', title: 'Final Rehearsal', assignee: 'Stage Manager', status: 'IN_PROGRESS' },
  { id: '4', time: '04:00 PM', title: 'Crew Briefing', assignee: 'Event Director', status: 'PENDING' },
  { id: '5', time: '05:00 PM', title: 'Doors Open (Usher Standby)', assignee: 'Front of House', status: 'PENDING' },
  { id: '6', time: '06:00 PM', title: 'VIP Arrival', assignee: 'VIP Protocol', status: 'PENDING' },
];

export default function EventSchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>(initialSchedule);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'IN_PROGRESS': return 'bg-amber-50 text-amber-600 border-amber-200';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DONE': return 'COMPLETED';
      case 'IN_PROGRESS': return 'ONGOING';
      default: return 'STANDBY';
    }
  };

  const cycleStatus = (id: string, current: string) => {
    const nextStatus = current === 'PENDING' ? 'IN_PROGRESS' : current === 'IN_PROGRESS' ? 'DONE' : 'PENDING';
    setSchedule(schedule.map(s => s.id === id ? { ...s, status: nextStatus as any } : s));
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 z-10 sticky top-0">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/apps/event-manager" className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors">
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 font-bold">
              <i className="fa-solid fa-clipboard-list"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Production Schedule</h1>
              <p className="text-xs text-gray-500 font-medium">Tracking logistics and crew dispatch</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Progress</span>
                <div className="text-xl font-bold text-emerald-600 leading-none">
                {Math.round((schedule.filter(s => s.status === 'DONE').length / schedule.length) * 100)}%
                </div>
            </div>
            <button className="h-9 px-4 bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-600 transition flex items-center gap-2">
              <i className="fa-solid fa-print"></i> Print
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-4">
          
          {schedule.map((item, index) => (
            <div key={item.id} className={`flex items-stretch gap-6 group transition-all duration-300 ${item.status === 'DONE' ? 'opacity-50 hover:opacity-100' : ''}`}>
              
              {/* Timeline Connector */}
              <div className="flex flex-col items-center min-w-[40px]">
                <div className={`w-3 h-3 rounded-full mt-5 shadow-sm z-10 transition-colors ${item.status === 'DONE' ? 'bg-emerald-500' : item.status === 'IN_PROGRESS' ? 'bg-amber-500' : 'bg-gray-300'}`}></div>
                {index !== schedule.length - 1 && (
                  <div className={`w-0.5 flex-1 mt-2 mb-2 transition-colors ${item.status === 'DONE' ? 'bg-emerald-100' : 'bg-gray-100'}`}></div>
                )}
              </div>

              {/* Event Card */}
              <div className="flex-1 bg-white border border-gray-100 hover:border-gray-200 rounded-xl p-5 hover:shadow-md transition-all group-hover:bg-gray-50/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div className="text-xl font-black tabular-nums text-gray-300 tracking-wider w-24 group-hover:text-gray-400 transition-colors">
                      {item.time}
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold tracking-wide transition-colors ${item.status === 'DONE' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-sm font-medium text-gray-500">
                        <i className="fa-solid fa-user-gear opacity-50"></i> {item.assignee}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => cycleStatus(item.id, item.status)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer ${getStatusColor(item.status)}`}
                  >
                    {getStatusLabel(item.status)}
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
