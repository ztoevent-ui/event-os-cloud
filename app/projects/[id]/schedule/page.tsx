'use client';

import React, { useState } from 'react';

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

  const cycleStatus = (id: string, current: string) => {
    const nextStatus = current === 'PENDING' ? 'IN_PROGRESS' : current === 'IN_PROGRESS' ? 'DONE' : 'PENDING';
    setSchedule(schedule.map(s => s.id === id ? { ...s, status: nextStatus as any } : s));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-amber-900/30 shadow-2xl">
        <div>
          <h1 className="text-3xl font-black tracking-widest text-amber-500">PRODUCTION SCHEDULE</h1>
          <p className="text-zinc-500 mt-2 font-medium tracking-wide">Event day master logistics timeline.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Progress</span>
            <div className="text-2xl font-black text-amber-400">
              {Math.round((schedule.filter(s => s.status === 'DONE').length / schedule.length) * 100)}%
            </div>
          </div>
          <button className="px-6 py-3 bg-amber-500 text-black hover:bg-amber-400 font-black text-xs uppercase tracking-widest rounded-full transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center gap-2">
            <i className="fa-solid fa-print"></i> PRINT
          </button>
        </div>
      </div>

      <div className="bg-zinc-950/80 rounded-3xl p-8 border border-amber-900/20 shadow-2xl relative overflow-hidden">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        
        <div className="relative z-10 space-y-4">
          {schedule.map((item, index) => (
            <div key={item.id} className={`flex items-stretch gap-6 group transition-all duration-300 ${item.status === 'DONE' ? 'opacity-50' : ''}`}>
              
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
                  <div className="flex items-center gap-6">
                    <div className="text-xl font-black tabular-nums text-amber-500/80 tracking-wider w-24">
                      {item.time}
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold tracking-wide transition-colors ${item.status === 'DONE' ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 text-sm text-zinc-500">
                        <i className="fa-solid fa-user-gear"></i> {item.assignee}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => cycleStatus(item.id, item.status)}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 cursor-pointer ${getStatusColor(item.status)}`}
                  >
                    {getStatusLabel(item.status)}
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
