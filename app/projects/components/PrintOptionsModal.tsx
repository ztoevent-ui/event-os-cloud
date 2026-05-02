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
    <div className="fixed inset-0 z-[9999] flex justify-center items-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-[32px] w-full max-w-2xl shadow-2xl relative animate-in zoom-in-95 flex flex-col my-8">
        
        {/* Header */}
        <div className="p-8 pb-6 border-b border-white/5 flex justify-between items-start sticky top-0 bg-[#0a0a0a] z-10 rounded-t-[32px]">
          <div>
            <h3 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-widest leading-none">Print / Export PDF</h3>
            <p className="text-zinc-500 text-sm mt-3 uppercase tracking-widest font-bold">{title}</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-8 space-y-10 overflow-y-auto">
          
          {/* Layout Selection */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">
                <i className="fa-solid fa-layer-group"></i> Visual Layout
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setLayoutType('table')}
                className={`p-6 rounded-2xl border-2 transition-all flex items-center gap-5 text-left ${layoutType === 'table' ? 'bg-[#0056B3]/20 border-[#0056B3] shadow-[0_0_20px_rgba(0,86,179,0.3)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${layoutType === 'table' ? 'bg-[#0056B3] text-white' : 'bg-white/5 text-zinc-500'}`}>
                    <i className="fa-solid fa-table-list"></i>
                </div>
                <div>
                    <span className={`font-black text-sm uppercase tracking-widest block ${layoutType === 'table' ? 'text-white' : 'text-zinc-300'}`}>Compact Table</span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1 block">Maximum Data Density</span>
                </div>
              </button>

              <button
                onClick={() => setLayoutType('cards')}
                className={`p-6 rounded-2xl border-2 transition-all flex items-center gap-5 text-left ${layoutType === 'cards' ? 'bg-[#0056B3]/20 border-[#0056B3] shadow-[0_0_20px_rgba(0,86,179,0.3)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${layoutType === 'cards' ? 'bg-[#0056B3] text-white' : 'bg-white/5 text-zinc-500'}`}>
                    <i className="fa-solid fa-border-all"></i>
                </div>
                <div>
                    <span className={`font-black text-sm uppercase tracking-widest block ${layoutType === 'cards' ? 'text-white' : 'text-zinc-300'}`}>Rich Cards</span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1 block">Preserve Screen UI</span>
                </div>
              </button>
            </div>
          </div>

          {/* Orientation Selection */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">
                <i className="fa-solid fa-file-export"></i> Page Orientation
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setOrientation('portrait')}
                className={`p-4 rounded-xl border flex items-center justify-center gap-3 transition-all ${orientation === 'portrait' ? 'bg-white text-black font-black' : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white font-bold'}`}
              >
                <i className="fa-solid fa-file text-lg"></i>
                <span className="text-xs uppercase tracking-widest">Portrait</span>
              </button>
              <button
                onClick={() => setOrientation('landscape')}
                className={`p-4 rounded-xl border flex items-center justify-center gap-3 transition-all ${orientation === 'landscape' ? 'bg-white text-black font-black' : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white font-bold'}`}
              >
                <i className="fa-solid fa-file rotate-90 text-lg"></i>
                <span className="text-xs uppercase tracking-widest">Landscape</span>
              </button>
            </div>
          </div>

          {/* Page Break Options */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">
                <i className="fa-solid fa-scissors"></i> Content Controls
            </label>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Manual Page Breaks</h4>
                  <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">Inject custom breaks between rows before printing</p>
                </div>
                <button
                  onClick={() => {
                    setIsPageBreakMode(!isPageBreakMode);
                    if (!isPageBreakMode) onClose();
                  }}
                  className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${isPageBreakMode ? 'bg-[#DEFF9A] text-black shadow-[0_0_15px_rgba(222,255,154,0.3)]' : 'bg-white/5 text-zinc-300 hover:bg-white/10'}`}
                >
                  {isPageBreakMode ? 'Mode Active' : 'Enable Mode'}
                </button>
              </div>

              {pageBreakIds.length > 0 && (
                <div className="mt-5 pt-5 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[#DEFF9A] text-[10px] font-black tracking-widest uppercase"><i className="fa-solid fa-check-circle mr-1"></i> {pageBreakIds.length} Breaks Applied</span>
                  <button onClick={resetPageBreaks} className="text-zinc-500 hover:text-red-400 transition-colors text-[10px] uppercase font-black tracking-widest">Clear All</button>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
            <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <i className="fa-solid fa-lightbulb"></i> Export Guide
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black/20 p-4 rounded-xl">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-1">Step 1</span>
                    <span className="text-xs text-zinc-300 font-bold">Click the big "Export PDF" button below</span>
                </div>
                <div className="bg-black/20 p-4 rounded-xl">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-1">Step 2</span>
                    <span className="text-xs text-zinc-300 font-bold">Set Destination to "Save as PDF"</span>
                </div>
                <div className="bg-black/20 p-4 rounded-xl">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-1">Step 3</span>
                    <span className="text-xs text-zinc-300 font-bold">Set Margins to "None" or "Minimal"</span>
                </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-white/5 bg-white/[0.01] rounded-b-[32px]">
          <button
            onClick={handlePrint}
            className="w-full h-16 bg-white text-black hover:bg-zinc-200 font-black text-sm uppercase tracking-[0.2em] rounded-2xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] flex items-center justify-center gap-3 active:scale-95"
          >
            <i className="fa-solid fa-print text-xl"></i>
            Export PDF / Print
          </button>
        </div>

      </div>
    </div>
  );
}
