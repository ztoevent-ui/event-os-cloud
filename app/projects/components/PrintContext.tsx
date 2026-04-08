'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Orientation = 'portrait' | 'landscape';

interface PrintContextType {
  orientation: Orientation;
  setOrientation: (o: Orientation) => void;
  isPageBreakMode: boolean;
  setIsPageBreakMode: (b: boolean) => void;
  pageBreakIds: string[];
  togglePageBreak: (id: string) => void;
  resetPageBreaks: () => void;
  isPrinting: boolean;
  setIsPrinting: (b: boolean) => void;
}

const PrintContext = createContext<PrintContextType | undefined>(undefined);

export function PrintProvider({ children }: { children: ReactNode }) {
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [isPageBreakMode, setIsPageBreakMode] = useState(false);
  const [pageBreakIds, setPageBreakIds] = useState<string[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);

  const togglePageBreak = (id: string) => {
    setPageBreakIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const resetPageBreaks = () => setPageBreakIds([]);

  // Inject dynamic @page style for orientation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const styleId = 'print-orientation-style';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    
    styleEl.innerHTML = `
      @media print {
        @page { size: A4 ${orientation}; margin: 10mm; }
      }
    `;
  }, [orientation]);

  return (
    <PrintContext.Provider value={{
      orientation,
      setOrientation,
      isPageBreakMode,
      setIsPageBreakMode,
      pageBreakIds,
      togglePageBreak,
      resetPageBreaks,
      isPrinting,
      setIsPrinting
    }}>
      {children}
    </PrintContext.Provider>
  );
}

export function usePrint() {
  const context = useContext(PrintContext);
  if (context === undefined) {
    throw new Error('usePrint must be used within a PrintProvider');
  }
  return context;
}
