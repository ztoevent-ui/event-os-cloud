"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ScoreboardQRPage() {
  const { data } = useSWR('/api/scoreboard', fetcher, { refreshInterval: 5000 });
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isProjectorMode, setIsProjectorMode] = useState(false);
  const [customHost, setCustomHost] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setCustomHost(window.location.origin);
    }
  }, []);

  const config = data?.config || {
    organizer: 'Shell MDS',
    event_title: 'Family Day 2026',
  };

  const targetUrl = mounted
    ? `${customHost || (typeof window !== 'undefined' ? window.location.origin : '')}/scoreboard/public`
    : '/scoreboard/public';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPNG = () => {
    if (!mounted) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 1600);
    grad.addColorStop(0, '#0c0d14');
    grad.addColorStop(1, '#050508');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 1600);

    // Accent glow at top
    const glow = ctx.createRadialGradient(600, 200, 10, 600, 200, 500);
    glow.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1200, 800);

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, 1120, 1520);

    // Organizer Text
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 30px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '6px';
    ctx.fillText((config.organizer || 'SHELL MDS').toUpperCase(), 600, 140);

    // Event Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 64px Inter, sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText(config.event_title || 'FAMILY DAY 2026', 600, 220);

    // Subtitle Pill
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText('LIVE SCOREBOARD & STANDINGS', 600, 280);

    // White QR Container Card
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(250, 360, 700, 700, 36);
    ctx.fill();

    // Inner QR Code SVG rendering to canvas
    const svgEl = document.getElementById('qr-svg-code');
    if (svgEl) {
      const xml = new XMLSerializer().serializeToString(svgEl);
      const svg64 = btoa(unescape(encodeURIComponent(xml)));
      const b64Start = 'data:image/svg+xml;base64,';
      const image64 = b64Start + svg64;
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 300, 410, 600, 600);

        // Scan Instructions Below QR Card
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 42px Inter, sans-serif';
        ctx.fillText('SCAN WITH PHONE CAMERA', 600, 1180);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 26px Inter, sans-serif';
        ctx.fillText('Real-time scores & standings for 1,000 attendees · No app required', 600, 1240);

        // URL display box
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.roundRect(200, 1310, 800, 80, 16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.strokeRect(200, 1310, 800, 80);

        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 26px monospace';
        ctx.fillText(targetUrl, 600, 1360);

        // Footer
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.fillText('SHELL MDS FAMILY DAY 2026 · OFFICIAL LIVE SCOREBOARD', 600, 1470);

        // Trigger download
        const a = document.createElement('a');
        a.download = `${(config.event_title || 'Family_Day').replace(/\s+/g, '_')}_Scoreboard_QR.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      };
      img.src = image64;
    }
  };

  return (
    <div
      className="min-h-screen bg-[#07070a] text-white flex flex-col justify-between selection:bg-red-500/30"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Print Specific CSS */}
      <style jsx global>{`
        aside[id="__next-build-watcher"],
        [data-nextjs-toast],
        nextjs-portal {
          display: none !important;
        }
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-area {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100% !important;
            height: 100vh !important;
            padding: 2rem !important;
          }
          .print-border {
            border: 3px solid #111827 !important;
            padding: 3rem !important;
            border-radius: 1.5rem !important;
            text-align: center !important;
            width: 90% !important;
            max-width: 600px !important;
            margin: auto !important;
          }
        }
      `}</style>

      {/* Top Navbar */}
      <header className="no-print sticky top-0 z-30 backdrop-blur-xl bg-[#09090d]/90 border-b border-white/[0.08] px-4 sm:px-8 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/scoreboard/public"
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 transition-all flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Live Board</span>
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <div>
              <p className="text-[10px] font-black tracking-widest text-amber-400 uppercase">{config.organizer || 'SHELL MDS'}</p>
              <h1 className="text-sm font-black text-white uppercase tracking-tight">{config.event_title || 'Family Day 2026'} · QR Standee</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsProjectorMode(!isProjectorMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all flex items-center gap-1.5 border ${
                isProjectorMode
                  ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/25'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">{isProjectorMode ? 'Exit Stage Mode' : 'Stage Projector Mode'}</span>
            </button>
            <Link
              href="/scoreboard/admin"
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 transition-all hidden sm:inline-flex items-center gap-1.5"
            >
              <span>Admin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        {/* Stage Projector Mode */}
        {isProjectorMode ? (
          <div className="fixed inset-0 z-50 bg-[#050508] flex flex-col items-center justify-center p-8 select-none">
            <button
              onClick={() => setIsProjectorMode(false)}
              className="absolute top-6 right-6 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10"
            >
              Exit Stage Mode (ESC)
            </button>

            {/* Glowing Backdrop */}
            <div className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-600/30 via-amber-600/10 to-transparent" />

            <div className="relative z-10 flex flex-col items-center text-center max-w-2xl">
              <span className="px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-black uppercase tracking-widest mb-4 inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Scoreboard · 1,000 Spectators Realtime Sync
              </span>

              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight uppercase mb-2">
                {config.event_title || 'FAMILY DAY 2026'}
              </h1>
              <p className="text-zinc-400 text-base sm:text-xl font-medium tracking-wide mb-8">
                Point your phone camera to scan and view live standings & scores
              </p>

              {/* Big Stage QR Code */}
              <div className="p-8 bg-white rounded-3xl shadow-[0_0_80px_rgba(239,68,68,0.25)] border-4 border-white/80">
                <QRCodeSVG
                  id="qr-svg-code"
                  value={targetUrl}
                  size={360}
                  level="H"
                  includeMargin={false}
                  fgColor="#09090b"
                  bgColor="#ffffff"
                />
              </div>

              <div className="mt-8 flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
                <span className="text-xs font-mono text-blue-300 font-bold">{targetUrl}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Normal QR Poster & Setup View */
          <div className="max-w-4xl w-full flex flex-col lg:flex-row gap-8 items-center justify-center">
            
            {/* Left: The Printable Standee Card */}
            <div
              ref={printRef}
              className="print-border w-full max-w-md bg-gradient-to-b from-[#111218] to-[#0a0a0f] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden"
            >
              {/* Subtle Ambient glow */}
              <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-red-500/10 via-amber-500/5 to-transparent pointer-events-none" />

              {/* Status Chip */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Scoreboard QR
              </div>

              {/* Titles */}
              <p className="text-[10px] font-black tracking-[0.3em] text-amber-400 uppercase mb-1">
                {config.organizer || 'SHELL MDS'}
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase mb-6">
                {config.event_title || 'FAMILY DAY 2026'}
              </h2>

              {/* White QR Box */}
              <div className="p-5 bg-white rounded-2xl shadow-xl border border-white/20 mb-6">
                <QRCodeSVG
                  id="qr-svg-code"
                  value={targetUrl}
                  size={240}
                  level="H"
                  includeMargin={false}
                  fgColor="#0a0a0c"
                  bgColor="#ffffff"
                />
              </div>

              {/* Instructions */}
              <div className="space-y-1.5 mb-6">
                <div className="text-base font-black text-white flex items-center justify-center gap-2">
                  <span>Scan for Live Scores</span>
                </div>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                  Open your mobile camera or QR scanner<br />
                  No app download needed · 1,000 attendees live synchronization
                </p>
              </div>

              {/* URL preview pill */}
              <div className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-zinc-400 truncate">
                {targetUrl}
              </div>

              <div className="mt-4 text-[9px] font-black tracking-widest text-zinc-500 uppercase">
                Shell MDS Family Day 2026 · Official Standings
              </div>
            </div>

            {/* Right: Controls & Operations Panel */}
            <div className="no-print w-full max-w-md space-y-5">
              <div className="p-6 bg-white/[0.03] border border-white/[0.08] rounded-2xl">
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span>Spectator QR Code Deployment</span>
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-5">
                  Print table standees for guest tables, project on stage screens, or send directly to WhatsApp/company communication channels for 1,000 attendees.
                </p>

                {/* Host setting */}
                <div className="space-y-2 mb-5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                    <span>Scoreboard Host URL</span>
                    <span className="text-zinc-500 font-normal">Custom production domain</span>
                  </label>
                  <input
                    type="text"
                    value={customHost}
                    onChange={(e) => setCustomHost(e.target.value)}
                    placeholder="https://your-domain.com"
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-zinc-500">
                    QR Destination: <span className="text-blue-400 font-mono break-all">{targetUrl}</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-lg shadow-white/10"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>Print Standee</span>
                  </button>

                  <button
                    onClick={handleDownloadPNG}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-600/20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download PNG</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleCopy}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 transition-all"
                  >
                    <span>{copied ? '✓ Link Copied!' : 'Copy Link'}</span>
                  </button>

                  <Link
                    href="/scoreboard/public"
                    target="_blank"
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-emerald-400 transition-all"
                  >
                    <span>Mobile Preview</span>
                  </Link>
                </div>
              </div>

              {/* Live Info card */}
              <div className="p-5 bg-gradient-to-r from-red-500/10 to-amber-500/5 border border-amber-500/20 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                    Live Arena Status
                  </span>
                  <span className="text-[10px] text-zinc-400 font-bold">Edge Cache 3s</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300">Competing Houses:</span>
                  <span className="font-black text-white">{data?.teams?.length || 4} Teams (Red, Blue, Yellow, Green)</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-zinc-300">Audience Concurrency:</span>
                  <span className="font-bold text-emerald-400">1,000+ Attendees Edge Caching Ready</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-white/[0.06] py-3 text-center text-[10px] font-black text-zinc-600 uppercase tracking-widest">
        Shell MDS Family Day 2026 · Official Live Scoreboard
      </footer>
    </div>
  );
}
