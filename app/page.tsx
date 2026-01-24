import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="bg-white shadow-sm border-b border-gray-200 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              <i className="fa-solid fa-cube"></i>
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">
              Event<span className="text-blue-600">OS</span>{' '}
              <span className="text-xs text-gray-400 font-normal px-2 border border-gray-200 rounded-full">
                v1.0 Beta
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              System Online
            </div>
            <Link href="/auth" className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-300 transition-colors">
              <i className="fa-solid fa-user"></i>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h2 className="text-3xl font-black text-gray-900 mb-2">Command Center</h2>
          <p className="text-gray-500">Select a tool to launch.</p>
        </div>

        <div className="mb-12">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <i className="fa-solid fa-bolt"></i> Live Interaction
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/apps/lucky-draw"
              className="app-card bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group block"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                <i className="fa-solid fa-gift text-6xl text-red-500"></i>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600 text-xl mb-4 group-hover:bg-red-600 group-hover:text-white transition-colors">
                <i className="fa-solid fa-gift"></i>
              </div>
              <h4 className="text-lg font-bold text-gray-900">Lucky Draw Ultimate</h4>
              <p className="text-sm text-gray-500 mt-1">
                Full-screen lucky draw system with sound effects and confetti.
              </p>
              <div className="mt-4 flex items-center text-xs font-bold text-red-600">
                LAUNCH APP <i className="fa-solid fa-arrow-right ml-1"></i>
              </div>
            </Link>

            <Link
              href="/apps/spinning-wheel"
              className="app-card bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group block"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                <i className="fa-solid fa-circle-notch text-6xl text-emerald-500"></i>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 text-xl mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <i className="fa-solid fa-circle-notch"></i>
              </div>
              <h4 className="text-lg font-bold text-gray-900">Spinning Wheel Pro</h4>
              <p className="text-sm text-gray-500 mt-1">
                Canvas wheel + clean settings panel, Google Sheet/Excel import, big winner screen.
              </p>
              <div className="mt-4 flex items-center text-xs font-bold text-emerald-600">
                LAUNCH APP <i className="fa-solid fa-arrow-right ml-1"></i>
              </div>
            </Link>
          </div>
        </div>

        <div className="mb-12">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <i className="fa-solid fa-print"></i> Ticketing & Hardware
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="app-card disabled bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-gray-100 text-gray-400 text-[10px] font-bold px-2 py-1 rounded">
                DEV
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 text-xl mb-4">
                <i className="fa-solid fa-qrcode"></i>
              </div>
              <h4 className="text-lg font-bold text-gray-900">On-site Check-in</h4>
              <p className="text-sm text-gray-500 mt-1">
                QR scan check-in system linked to participant database.
              </p>
              <div className="mt-4 text-xs font-bold text-gray-300 flex items-center gap-1">
                <i className="fa-solid fa-lock"></i> COMING SOON
              </div>
            </div>

            <div className="app-card disabled bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-gray-100 text-gray-400 text-[10px] font-bold px-2 py-1 rounded">
                HARDWARE
              </div>
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-700 text-xl mb-4">
                <i className="fa-solid fa-id-card-clip"></i>
              </div>
              <h4 className="text-lg font-bold text-gray-900">Badge Auto-Print</h4>
              <p className="text-sm text-gray-500 mt-1">
                Auto-trigger thermal printers upon successful check-in.
              </p>
              <div className="mt-4 text-xs font-bold text-gray-300 flex items-center gap-1">
                <i className="fa-solid fa-lock"></i> COMING SOON
              </div>
            </div>

            <div className="app-card disabled bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-gray-100 text-gray-400 text-[10px] font-bold px-2 py-1 rounded">
                WEB
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 text-xl mb-4">
                <i className="fa-solid fa-ticket"></i>
              </div>
              <h4 className="text-lg font-bold text-gray-900">Ticket Sales</h4>
              <p className="text-sm text-gray-500 mt-1">
                Public facing website for selling event tickets.
              </p>
              <div className="mt-4 text-xs font-bold text-gray-300 flex items-center gap-1">
                <i className="fa-solid fa-lock"></i> COMING SOON
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <i className="fa-solid fa-layer-group"></i> Event Planning & Design
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="app-card disabled bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-gray-100 text-gray-400 text-[10px] font-bold px-2 py-1 rounded">
                DEV
              </div>
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 text-xl mb-4">
                <i className="fa-solid fa-cube"></i>
              </div>
              <h4 className="text-lg font-bold text-gray-900">3D Event Layout</h4>
              <p className="text-sm text-gray-500 mt-1">
                Design floor plans and outdoor setups in 3D.
              </p>
              <div className="mt-4 text-xs font-bold text-gray-300 flex items-center gap-1">
                <i className="fa-solid fa-lock"></i> COMING SOON
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <i className="fa-solid fa-rings-wedding"></i> Wedding Suite
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/apps/wedding-rsvp"
              className="app-card bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group block"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                <i className="fa-solid fa-envelope-open-text text-6xl text-pink-500"></i>
              </div>
              <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center text-pink-500 text-xl mb-4 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                <i className="fa-solid fa-envelope-open-text"></i>
              </div>
              <h4 className="text-lg font-bold text-gray-900">Wedding RSVP</h4>
              <p className="text-sm text-gray-500 mt-1">
                Guest list management, seating charts & RSVP design.
              </p>
              <div className="mt-4 flex items-center text-xs font-bold text-pink-500">
                LAUNCH APP <i className="fa-solid fa-arrow-right ml-1"></i>
              </div>
            </Link>

            <div className="app-card disabled bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 text-xl mb-4">
                <i className="fa-solid fa-user-tie"></i>
              </div>
              <h4 className="text-lg font-bold text-gray-900">Butler Consulting Form</h4>
              <p className="text-sm text-gray-500 mt-1">
                Pre-event questionnaire for VIP wedding clients.
              </p>
              <div className="mt-4 text-xs font-bold text-gray-300 flex items-center gap-1">
                <i className="fa-solid fa-lock"></i> COMING SOON
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          &copy; 2025 EventOS System. All systems operational.
        </div>
      </footer>
    </div>
  );
}
