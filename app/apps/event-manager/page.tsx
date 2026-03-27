import Link from 'next/link';
import { motion } from 'framer-motion';

export default function EventManagerDashboard() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-black text-white relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/10 blur-[120px] rounded-full"></div>

      <header className="bg-black/40 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all border border-white/5">
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                <i className="fa-solid fa-calendar-check text-xl"></i>
              </div>
              <div>
                <h1 className="text-xl font-black text-white uppercase tracking-[0.2em] leading-none">
                  Event Manager
                </h1>
                <p className="text-[10px] font-bold text-zinc-500 tracking-[0.1em] mt-1 uppercase">Operational Control Center</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-16 z-10">
        <div className="mb-12">
          <h2 className="text-4xl font-black text-white mb-3 tracking-tight italic uppercase">Event Modules</h2>
          <p className="text-zinc-500 font-medium tracking-wide">Select a specialized management tool to begin orchestration.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Tentative Program Card */}
          <Link
            href="/apps/event-manager/tentative-program"
            className="group relative bg-zinc-900/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/5 hover:border-blue-500/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(37,99,235,0.15)] flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity duration-700">
              <i className="fa-solid fa-list-ol text-8xl text-blue-500"></i>
            </div>
            <div>
              <div className="w-16 h-16 bg-blue-600/10 rounded-[1.2rem] flex items-center justify-center text-blue-500 text-3xl mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-xl border border-blue-500/20">
                <i className="fa-solid fa-list-ol text-2xl"></i>
              </div>
              <h4 className="text-2xl font-black text-white tracking-tight">Tentative Program</h4>
              <p className="text-zinc-500 mt-3 font-medium leading-relaxed">
                Interactive sequence controller for live activities, MC cues, and AV team synchronization.
              </p>
            </div>
            <div className="mt-10 flex items-center text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase">
              ORCHESTRATE SCRIPT <i className="fa-solid fa-chevron-right ml-2 group-hover:translate-x-2 transition-transform"></i>
            </div>
          </Link>

          {/* Event Schedule Card */}
          <Link
            href="/apps/event-manager/schedule"
            className="group relative bg-zinc-900/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/5 hover:border-emerald-500/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity duration-700">
              <i className="fa-solid fa-clipboard-list text-8xl text-emerald-500"></i>
            </div>
            <div>
              <div className="w-16 h-16 bg-emerald-600/10 rounded-[1.2rem] flex items-center justify-center text-emerald-500 text-3xl mb-8 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-xl border border-emerald-500/20">
                <i className="fa-solid fa-clipboard-list text-2xl"></i>
              </div>
              <h4 className="text-2xl font-black text-white tracking-tight">Production Schedule</h4>
              <p className="text-zinc-500 mt-3 font-medium leading-relaxed">
                High-level logistics tracking, crew dispatch, and equipment setup timelines.
              </p>
            </div>
            <div className="mt-10 flex items-center text-[10px] font-black tracking-[0.3em] text-emerald-500 uppercase">
              TRACK LOGISTICS <i className="fa-solid fa-chevron-right ml-2 group-hover:translate-x-2 transition-transform"></i>
            </div>
          </Link>

          {/* Guest Seating (Disabled) */}
          <div className="relative bg-zinc-900/20 rounded-[2.5rem] p-8 border border-white/5 opacity-40 grayscale pointer-events-none">
            <div className="absolute top-6 right-6 bg-white/5 text-zinc-500 text-[9px] font-black px-3 py-1 rounded-full tracking-widest border border-white/5">
              IN DEVELOPMENT
            </div>
            <div className="w-16 h-16 bg-purple-600/5 rounded-[1.2rem] flex items-center justify-center text-purple-900 text-3xl mb-8 border border-white/5">
              <i className="fa-solid fa-users-viewfinder text-2xl"></i>
            </div>
            <h4 className="text-2xl font-black text-zinc-600 tracking-tight">Guest Seating</h4>
            <p className="text-zinc-700 mt-3 font-medium leading-relaxed">
              Real-time table arrangements, VIP assignments, and venue allocation mapping.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-12 px-6 border-t border-white/5 z-10">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center text-[10px] font-bold text-zinc-700 tracking-[0.4em] uppercase">
          <span>ZTO Protocol Layer v2.5</span>
          <span>Property of ZTO Events</span>
        </div>
      </footer>
    </div>
  );
}
