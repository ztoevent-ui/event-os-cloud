'use client';

import React, { useState } from 'react';
import { usePrint } from './PrintContext';

interface PrintOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export function PrintOptionsModal({ isOpen, onClose, title }: PrintOptionsModalProps) {
  const { 
    orientation, 
    setOrientation, 
    isPageBreakMode, 
    setIsPageBreakMode, 
    resetPageBreaks,
    pageBreakIds
  } = usePrint();

  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    setIsPageBreakMode(false);
    onClose();
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleDirectDownload = async () => {
    setIsDownloading(true);
    setIsPageBreakMode(false);
    
    // Create a temporary style element to force print-like styles during capture
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      .pdf-capture-mode nav, .pdf-capture-mode header, .pdf-capture-mode footer, .pdf-capture-mode button, .pdf-capture-mode .print\\:hidden { display: none !important; }
      .pdf-capture-mode, .pdf-capture-mode body, .pdf-capture-mode main { background: white !important; color: black !important; }
      .pdf-capture-mode .text-white, .pdf-capture-mode .text-zinc-400 { color: black !important; }
      .pdf-capture-mode .bg-zinc-900, .pdf-capture-mode .bg-black { background: transparent !important; border-color: #eee !important; box-shadow: none !important; }
    `;
    document.head.appendChild(styleEl);
    document.body.classList.add('pdf-capture-mode');

    // Slight delay to let styles apply
    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      // Dynamic import to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = document.body;
      
      const opt = {
        margin:       10,
        filename:     `${title.replace(/\s+/g, '_').toLowerCase()}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: orientation as "portrait" | "landscape" }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (e) {
      console.error("Direct download failed:", e);
      alert("Failed to generate PDF. Please use the 'Print' option instead.");
    } finally {
      document.body.classList.remove('pdf-capture-mode');
      document.head.removeChild(styleEl);
      setIsDownloading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg p-8 shadow-2xl relative animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-wider">Export PDF</h3>
            <p className="text-zinc-500 text-sm mt-1">{title}</p>
          </div>
          <button onClick={onClose} disabled={isDownloading} className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors disabled:opacity-50">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="space-y-8">
          {/* Orientation Selection */}
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Print Orientation</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setOrientation('portrait')}
                disabled={isDownloading}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all disabled:opacity-50 ${orientation === 'portrait' ? 'bg-white/10 border-white text-white' : 'bg-transparent border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}
              >
                <i className="fa-solid fa-file text-2xl"></i>
                <span className="font-bold text-xs uppercase tracking-widest">Portrait</span>
              </button>
              <button 
                onClick={() => setOrientation('landscape')}
                disabled={isDownloading}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all disabled:opacity-50 ${orientation === 'landscape' ? 'bg-white/10 border-white text-white' : 'bg-transparent border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}
              >
                <i className="fa-solid fa-file rotate-90 text-2xl"></i>
                <span className="font-bold text-xs uppercase tracking-widest">Horizontal</span>
              </button>
            </div>
          </div>

          {/* Page Break Options */}
          <div className={isDownloading ? 'opacity-50 pointer-events-none' : ''}>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Content Controls</label>
            <div className="bg-zinc-950/50 rounded-2xl border border-zinc-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-zinc-200">Manual Page Breaks</h4>
                  <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider italic">Insert breaks between rows before exporting</p>
                </div>
                <button 
                  onClick={() => {
                    setIsPageBreakMode(!isPageBreakMode);
                    if (!isPageBreakMode) onClose();
                  }}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isPageBreakMode ? 'bg-blue-500 text-black' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}
                >
                  {isPageBreakMode ? 'Mode Active' : 'Enable Mode'}
                </button>
              </div>
              
              {pageBreakIds.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center text-[10px]">
                  <span className="text-blue-400 font-bold tracking-widest uppercase">{pageBreakIds.length} BREAKS APPLIED</span>
                  <button onClick={resetPageBreaks} className="text-zinc-600 hover:text-white transition-colors underline uppercase font-black">Clear All</button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <button 
              onClick={handlePrint}
              disabled={isDownloading}
              className="w-full h-16 bg-white text-black hover:bg-zinc-200 font-black text-xs uppercase tracking-[0.1em] rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <i className="fa-solid fa-print text-lg"></i>
              System Print
            </button>
            <button 
              onClick={handleDirectDownload}
              disabled={isDownloading}
              className="w-full h-16 bg-blue-600 text-white hover:bg-blue-500 font-black text-xs uppercase tracking-[0.1em] rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isDownloading ? (
                 <><i className="fa-solid fa-circle-notch animate-spin text-lg"></i> Processing...</>
              ) : (
                 <><i className="fa-solid fa-file-pdf text-lg"></i> Direct PDF</>
              )}
            </button>
          </div>
          <div className="text-center">
             <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">For highest print quality, prefer "System Print" and "Save as PDF".</p>
          </div>
        </div>
      </div>
    </div>
  );
}
