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

  if (!isOpen) return null;

  const handlePrint = () => {
    setIsPageBreakMode(false);
    onClose();
    // Delay slightly to allow the DOM to update and the modal to transition out
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg p-8 shadow-2xl relative animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-wider">Export PDF</h3>
            <p className="text-zinc-500 text-sm mt-1">{title}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
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
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${orientation === 'portrait' ? 'bg-white/10 border-white text-white' : 'bg-transparent border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}
              >
                <i className="fa-solid fa-file text-2xl"></i>
                <span className="font-bold text-xs uppercase tracking-widest">Portrait</span>
              </button>
              <button 
                onClick={() => setOrientation('landscape')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${orientation === 'landscape' ? 'bg-white/10 border-white text-white' : 'bg-transparent border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}
              >
                <i className="fa-solid fa-file rotate-90 text-2xl"></i>
                <span className="font-bold text-xs uppercase tracking-widest">Horizontal</span>
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
                  <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider italic">Insert breaks between rows before exporting</p>
                </div>
                <button 
                  onClick={() => {
                    setIsPageBreakMode(!isPageBreakMode);
                    if (!isPageBreakMode) onClose(); // Close modal to let them select
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

          {/* Action Button */}
          <button 
            onClick={handlePrint}
            className="w-full h-16 bg-white text-black hover:bg-zinc-200 font-black text-sm uppercase tracking-[0.3em] rounded-2xl transition-all shadow-2xl flex items-center justify-center gap-4 group"
          >
            <i className="fa-solid fa-cloud-arrow-down text-lg transition-transform group-hover:translate-y-1"></i>
            Launch Print / Export
          </button>
        </div>
      </div>
    </div>
  );
}
