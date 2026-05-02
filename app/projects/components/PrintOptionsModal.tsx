'use client';

import React from 'react';
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
    pageBreakIds,
    layoutType,
    setLayoutType
  } = usePrint();

  if (!isOpen) return null;

  const handlePrint = () => {
    setIsPageBreakMode(false);
    onClose();
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in overflow-y-auto items-start pt-10 md:pt-20">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl p-6 md:p-10 shadow-2xl relative animate-in zoom-in-95 mb-10">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-zinc-900 z-10">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-wider">Print / Export PDF</h3>
            <p className="text-zinc-500 text-sm mt-1">{title}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="space-y-8">
          {/* Layout Selection */}
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Visual Layout</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setLayoutType('table')}
                className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-4 transition-all ${layoutType === 'table' ? 'bg-blue-600/20 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'}`}
              >
                <i className="fa-solid fa-table-list text-3xl"></i>
                <div className="text-center">
                    <span className="font-bold text-sm uppercase tracking-widest block">Compact Table</span>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1.5 block">Saves paper</span>
                </div>
              </button>
              <button
                onClick={() => setLayoutType('cards')}
                className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-4 transition-all ${layoutType === 'cards' ? 'bg-blue-600/20 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'}`}
              >
                <i className="fa-solid fa-border-all text-3xl"></i>
                <div className="text-center">
                    <span className="font-bold text-sm uppercase tracking-widest block">Rich Cards</span>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1.5 block">Screen UI Format</span>
                </div>
              </button>
            </div>
          </div>

          {/* Orientation Selection */}
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Page Orientation</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setOrientation('portrait')}
                className={`p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${orientation === 'portrait' ? 'bg-white/10 border-white text-white' : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'}`}
              >
                <i className="fa-solid fa-file"></i>
                <span className="font-bold text-xs uppercase tracking-widest">Portrait</span>
              </button>
              <button
                onClick={() => setOrientation('landscape')}
                className={`p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${orientation === 'landscape' ? 'bg-white/10 border-white text-white' : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'}`}
              >
                <i className="fa-solid fa-file rotate-90"></i>
                <span className="font-bold text-xs uppercase tracking-widest">Landscape</span>
              </button>
            </div>
          </div>

          {/* Page Break Options */}
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Content Controls</label>
            <div className="bg-zinc-950/50 rounded-2xl border border-zinc-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-zinc-200">Manual Page Breaks</h4>
                  <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider italic">Insert breaks between rows before printing</p>
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

          {/* PDF Tip */}
          <div className="bg-[#0056B3]/10 border border-[#0056B3]/20 rounded-2xl p-4">
            <p className="text-[10px] font-black text-[#4da3ff] uppercase tracking-widest mb-2">💡 How to Export as PDF</p>
            <ol className="text-[11px] text-zinc-400 space-y-1 list-decimal list-inside">
              <li>Click <strong className="text-white">Print Report</strong> below</li>
              <li>In the print dialog, set <strong className="text-white">Destination → Save as PDF</strong></li>
              <li>Set margins to <strong className="text-white">None</strong> or <strong className="text-white">Minimal</strong> for best fit</li>
            </ol>
          </div>

          {/* Action Button */}
          <button
            onClick={handlePrint}
            className="w-full h-16 bg-white text-black hover:bg-zinc-100 font-black text-sm uppercase tracking-[0.1em] rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95"
          >
            <i className="fa-solid fa-print text-lg"></i>
            Print Report / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
