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
    <div className="fixed inset-0 z-[9999] flex justify-center items-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
      
      {/* ── Core Container ── */}
      <div className="bg-[#050505] border border-white/10 rounded-[32px] w-full max-w-4xl shadow-[0_0_100px_rgba(0,86,179,0.15)] relative animate-in zoom-in-95 duration-300 flex flex-col overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0056B3]/30 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#0056B3]/10 blur-[100px] rounded-full pointer-events-none translate-y-1/2 translate-x-1/4" />

        {/* ── Header ── */}
        <div className="px-8 py-8 md:px-10 md:py-10 border-b border-white/5 relative z-10 flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0056B3] to-[#003d82] flex items-center justify-center shadow-[0_0_20px_rgba(0,86,179,0.5)]">
                <i className="fa-solid fa-print text-white text-lg"></i>
              </div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tight font-['Urbanist'] leading-none">
                Print Engine
              </h3>
            </div>
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-[0.2em] ml-13">{title}</p>
          </div>
          
          <button 
            onClick={onClose} 
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-95"
          >
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        {/* ── Content Grid ── */}
        <div className="p-8 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10 overflow-y-auto max-h-[70vh]">
            
            {/* Left Column: Primary Settings */}
            <div className="lg:col-span-7 flex flex-col gap-8">
                
                {/* Visual Layout Selection */}
                <div className="flex flex-col gap-4">
                    <label className="flex items-center gap-2 text-xs font-black text-[#0056B3] uppercase tracking-[0.2em]">
                        <i className="fa-solid fa-layer-group"></i> Visual Architecture
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Option: Table */}
                        <button
                            onClick={() => setLayoutType('table')}
                            className={`group relative p-6 rounded-[24px] border border-white/5 overflow-hidden transition-all duration-300 flex flex-col text-left ${layoutType === 'table' ? 'bg-[#0056B3]/10 border-[#0056B3]/50 shadow-[0_0_30px_rgba(0,86,179,0.2)]' : 'bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20'}`}
                        >
                            <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] rounded-full transition-opacity ${layoutType === 'table' ? 'bg-[#0056B3]/40 opacity-100' : 'opacity-0'}`} />
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-6 transition-all ${layoutType === 'table' ? 'bg-[#0056B3] text-white shadow-[0_0_20px_rgba(0,86,179,0.5)]' : 'bg-white/[0.05] text-zinc-500 group-hover:text-zinc-300'}`}>
                                <i className="fa-solid fa-table-list"></i>
                            </div>
                            <div className="relative z-10">
                                <span className={`font-black text-lg uppercase tracking-widest block transition-colors ${layoutType === 'table' ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>Compact Table</span>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2 block leading-relaxed">Maximum data density.<br/>Highly optimized for saving paper.</span>
                            </div>
                        </button>

                        {/* Option: Cards */}
                        <button
                            onClick={() => setLayoutType('cards')}
                            className={`group relative p-6 rounded-[24px] border border-white/5 overflow-hidden transition-all duration-300 flex flex-col text-left ${layoutType === 'cards' ? 'bg-[#0056B3]/10 border-[#0056B3]/50 shadow-[0_0_30px_rgba(0,86,179,0.2)]' : 'bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20'}`}
                        >
                            <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] rounded-full transition-opacity ${layoutType === 'cards' ? 'bg-[#0056B3]/40 opacity-100' : 'opacity-0'}`} />
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-6 transition-all ${layoutType === 'cards' ? 'bg-[#0056B3] text-white shadow-[0_0_20px_rgba(0,86,179,0.5)]' : 'bg-white/[0.05] text-zinc-500 group-hover:text-zinc-300'}`}>
                                <i className="fa-solid fa-border-all"></i>
                            </div>
                            <div className="relative z-10">
                                <span className={`font-black text-lg uppercase tracking-widest block transition-colors ${layoutType === 'cards' ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>Rich Cards</span>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2 block leading-relaxed">Preserves screen UI blocks.<br/>Ideal for presentations.</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Print Orientation */}
                <div className="flex flex-col gap-4">
                    <label className="flex items-center gap-2 text-xs font-black text-[#0056B3] uppercase tracking-[0.2em]">
                        <i className="fa-solid fa-file-export"></i> Page Orientation
                    </label>
                    <div className="flex bg-white/[0.02] border border-white/5 p-2 rounded-2xl">
                        <button
                            onClick={() => setOrientation('portrait')}
                            className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-3 transition-all ${orientation === 'portrait' ? 'bg-white text-black shadow-lg scale-[1.02]' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                        >
                            <i className="fa-solid fa-file text-lg"></i>
                            <span className="font-black text-xs uppercase tracking-widest">Portrait</span>
                        </button>
                        <button
                            onClick={() => setOrientation('landscape')}
                            className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-3 transition-all ${orientation === 'landscape' ? 'bg-white text-black shadow-lg scale-[1.02]' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                        >
                            <i className="fa-solid fa-file rotate-90 text-lg"></i>
                            <span className="font-black text-xs uppercase tracking-widest">Landscape</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Column: Secondary Controls & Guide */}
            <div className="lg:col-span-5 flex flex-col gap-8">
                
                {/* Content Controls */}
                <div className="flex flex-col gap-4">
                    <label className="flex items-center gap-2 text-xs font-black text-[#0056B3] uppercase tracking-[0.2em]">
                        <i className="fa-solid fa-scissors"></i> Layout Adjustments
                    </label>
                    <div className="bg-white/[0.02] border border-white/5 rounded-[24px] p-6 h-full flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-widest">Page Break Mode</h4>
                                <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">Manually insert breaks between rows</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setIsPageBreakMode(!isPageBreakMode);
                                if (!isPageBreakMode) onClose();
                            }}
                            className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isPageBreakMode ? 'bg-[#DEFF9A] text-black shadow-[0_0_20px_rgba(222,255,154,0.3)]' : 'bg-white/[0.05] border border-white/10 text-white hover:bg-white/10 hover:border-white/20'}`}
                        >
                            {isPageBreakMode ? (
                                <><i className="fa-solid fa-circle-check mr-2"></i> Mode Active</>
                            ) : (
                                <><i className="fa-solid fa-power-off mr-2"></i> Enable Mode</>
                            )}
                        </button>

                        {pageBreakIds.length > 0 && (
                            <div className="mt-6 pt-5 border-t border-white/5 flex justify-between items-center">
                                <span className="text-[#DEFF9A] text-[10px] font-black tracking-widest uppercase flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#DEFF9A] animate-pulse"></span>
                                    {pageBreakIds.length} Breaks Set
                                </span>
                                <button onClick={resetPageBreaks} className="text-zinc-500 hover:text-red-400 transition-colors text-[10px] uppercase font-black tracking-widest underline decoration-zinc-800 underline-offset-4">Reset</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* PDF Export Guide */}
                <div className="bg-[#0056B3]/10 border border-[#0056B3]/20 rounded-[24px] p-6 relative overflow-hidden">
                    <i className="fa-solid fa-lightbulb absolute -right-4 -bottom-4 text-[100px] text-[#0056B3]/20 -rotate-12"></i>
                    <h4 className="text-[10px] font-black text-[#4da3ff] uppercase tracking-[0.2em] mb-4 relative z-10">Export Best Practices</h4>
                    <div className="space-y-4 relative z-10">
                        <div className="flex gap-4 items-center">
                            <span className="w-6 h-6 shrink-0 rounded-full bg-[#0056B3] text-white flex items-center justify-center text-[10px] font-black">1</span>
                            <span className="text-xs text-zinc-300 font-bold">Click <strong className="text-white">Export Engine</strong> below</span>
                        </div>
                        <div className="flex gap-4 items-center">
                            <span className="w-6 h-6 shrink-0 rounded-full bg-[#0056B3] text-white flex items-center justify-center text-[10px] font-black">2</span>
                            <span className="text-xs text-zinc-300 font-bold">Set print destination to <strong className="text-[#DEFF9A]">Save as PDF</strong></span>
                        </div>
                        <div className="flex gap-4 items-center">
                            <span className="w-6 h-6 shrink-0 rounded-full bg-[#0056B3] text-white flex items-center justify-center text-[10px] font-black">3</span>
                            <span className="text-xs text-zinc-300 font-bold">Set document margins to <strong className="text-white">None</strong></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* ── Footer Actions ── */}
        <div className="px-8 py-6 md:px-10 md:py-8 border-t border-white/5 bg-black/40 relative z-10">
          <button
            onClick={handlePrint}
            className="w-full h-16 bg-white text-black hover:bg-zinc-100 font-black text-sm uppercase tracking-[0.2em] rounded-2xl transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] flex items-center justify-center gap-3 hover:-translate-y-1 active:translate-y-0"
          >
            <i className="fa-solid fa-bolt text-lg"></i>
            Launch Export Engine
          </button>
        </div>

      </div>
    </div>
  );
}
