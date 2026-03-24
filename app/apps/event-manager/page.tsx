import Link from 'next/link';

export default function EventManagerDashboard() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 z-10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              <i className="fa-solid fa-calendar-check"></i>
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">
              Event Manager
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h2 className="text-3xl font-black text-gray-900 mb-2">Event Modules</h2>
          <p className="text-gray-500">Select a management tool to continue.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/apps/event-manager/tentative-program"
            className="app-card bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group block hover:shadow-md transition-all"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
              <i className="fa-solid fa-list-ol text-6xl text-blue-500"></i>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 text-xl mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <i className="fa-solid fa-list-ol"></i>
            </div>
            <h4 className="text-lg font-bold text-gray-900">Tentative Program</h4>
            <p className="text-sm text-gray-500 mt-1">
              Interactive schedule, activities, and AV cues.
            </p>
            <div className="mt-4 flex items-center text-xs font-bold text-blue-600">
              OPEN PROGRAM <i className="fa-solid fa-arrow-right ml-1"></i>
            </div>
          </Link>

          <Link
            href="/apps/event-manager/schedule"
            className="app-card bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group block hover:shadow-md transition-all"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
              <i className="fa-solid fa-clipboard-list text-6xl text-emerald-500"></i>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 text-xl mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <i className="fa-solid fa-clipboard-list"></i>
            </div>
            <h4 className="text-lg font-bold text-gray-900">Event Schedule</h4>
            <p className="text-sm text-gray-500 mt-1">
              High-level production schedule, logistics, and crew dispatch.
            </p>
            <div className="mt-4 flex items-center text-xs font-bold text-emerald-600">
              OPEN SCHEDULE <i className="fa-solid fa-arrow-right ml-1"></i>
            </div>
          </Link>

          <div className="app-card disabled bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-gray-100 text-gray-400 text-[10px] font-bold px-2 py-1 rounded">
              COMING SOON
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 text-xl mb-4">
              <i className="fa-solid fa-users-viewfinder"></i>
            </div>
            <h4 className="text-lg font-bold text-gray-900">Guest Seating</h4>
            <p className="text-sm text-gray-500 mt-1">
              Table arrangements and VIP assignments.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
