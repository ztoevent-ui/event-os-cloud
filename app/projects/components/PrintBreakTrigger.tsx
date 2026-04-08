'use client';

import React from 'react';
import { usePrint } from './PrintContext';

interface PrintBreakTriggerProps {
  id: string;
}

export function PrintBreakTrigger({ id }: PrintBreakTriggerProps) {
  const { isPageBreakMode, togglePageBreak, pageBreakIds } = usePrint();

  if (!isPageBreakMode) return null;

  const isActive = pageBreakIds.includes(id);

  return (
    <div className="relative h-4 group/break print:hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`w-full h-px border-t border-dashed transition-colors ${isActive ? 'border-blue-500' : 'border-zinc-800'}`}></div>
      </div>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          togglePageBreak(id);
        }}
        className={`absolute left-1/2 -top-3 -translate-x-1/2 h-6 px-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 shadow-2xl z-[60] 
          ${isActive 
            ? 'bg-blue-600 text-white border border-blue-400 rotate-0' 
            : 'bg-zinc-900 text-zinc-600 border border-zinc-800 hover:text-blue-400 hover:border-blue-900/50 hover:bg-zinc-800'}`}
      >
        <i className={`fa-solid ${isActive ? 'fa-scissors' : 'fa-plus'} text-[8px]`}></i>
        {isActive ? 'Page Break Active' : 'Insert Break'}
      </button>
    </div>
  );
}
