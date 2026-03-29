'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Html5Qrcode } from 'html5-qrcode';
import Link from 'next/link';

type Ticket = {
  id: string;
  event_id: string;
  attendee_name: string;
  attendee_company: string;
  attendee_role: string;
  status: 'issued' | 'checked_in' | 'void';
};

type ScanResult = {
  type: 'success' | 'warning' | 'error';
  message: string;
  ticket?: Ticket;
};

function TicketScannerContent() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<any[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // Wait until DOM has #reader before trying to setup
    const timer = setTimeout(() => {
        setupScanner();
    }, 500);
    return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
            scannerRef.current.stop().catch(console.error).finally(() => {
                scannerRef.current?.clear();
            });
        }
    };
  }, []);

  const setupScanner = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length) {
        setCameras(devices);
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;
        startScanning();
      } else {
        setScanResult({ type: 'error', message: 'No camera found on this device.' });
      }
    } catch (err) {
      console.error(err);
      setScanResult({ type: 'error', message: 'Camera permission denied.' });
    }
  };

  const startScanning = () => {
    setScanResult(null);
    if (!scannerRef.current) return;
    
    setIsScanning(true);
    scannerRef.current.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      onScanSuccess,
      (errorMessage) => { /* Ignore regular unreadable frame errors */ }
    ).catch((err) => {
      console.error(err);
      setIsScanning(false);
      setScanResult({ type: 'error', message: `Failed to start scanner: ${err.message}` });
    });
  };

  const stopScanningTemp = async () => {
    setIsScanning(false);
    if (scannerRef.current && scannerRef.current.isScanning) {
       await scannerRef.current.stop();
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    stopScanningTemp();
    
    // Quick validation of UUID format to avoid unnecessary DB hits
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(decodedText);
    if (!isUUID) {
       setScanResult({ type: 'error', message: 'Invalid QR Format. Not an Event OS Ticket.' });
       return;
    }

    // Verify against database
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', decodedText)
      .single();

    if (error || !data) {
        setScanResult({ type: 'error', message: 'TICKET NOT FOUND' });
        return;
    }

    const ticket = data as Ticket;

    if (ticket.status === 'checked_in') {
        setScanResult({ type: 'warning', message: 'ALREADY SCANNED', ticket });
        return;
    }

    if (ticket.status === 'void') {
         setScanResult({ type: 'error', message: 'TICKET VOIDED', ticket });
         return;
    }

    // Ticket is valid and 'issued'. Mark as checked in!
    const { error: updateError } = await supabase
       .from('tickets')
       .update({ status: 'checked_in', scanned_at: new Date().toISOString() })
       .eq('id', ticket.id);

    if (updateError) {
         setScanResult({ type: 'error', message: 'Database Write Failed: ' + updateError.message });
         return;
    }

    // Success!
    setScanResult({ type: 'success', message: 'VALID ACCESS', ticket });
  };

  const getBackgroundColor = () => {
      if (!scanResult) return 'bg-zinc-950';
      if (scanResult.type === 'success') return 'bg-emerald-600';
      if (scanResult.type === 'warning') return 'bg-amber-500';
      return 'bg-red-600';
  };

  const getIcon = () => {
      if (!scanResult) return null;
      if (scanResult.type === 'success') return 'fa-circle-check';
      if (scanResult.type === 'warning') return 'fa-triangle-exclamation';
      return 'fa-circle-xmark';
  };

  return (
    <div className={`min-h-screen font-sans text-white transition-colors duration-300 flex flex-col ${getBackgroundColor()}`}>
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                 <i className="fa-solid fa-qrcode text-xl text-white"></i>
             </div>
             <div>
                 <h1 className="text-lg font-black uppercase tracking-widest leading-none">Access Control</h1>
                 <p className="text-[10px] font-bold text-white/60 tracking-[0.3em] uppercase mt-1">ZTO Security Module</p>
             </div>
          </div>
          <Link href="/" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <i className="fa-solid fa-xmark"></i>
          </Link>
      </div>

      <div className="flex-1 flex flex-col relative preserve-3d">
          {/* CAMERA VIEWPORT */}
          <div className={`absolute inset-0 z-0 bg-black transition-opacity duration-300 ${scanResult ? 'opacity-0 pointer-events-none delay-200' : 'opacity-100'}`}>
              <div id="reader" className="w-full h-full object-cover [&>video]:object-cover [&>video]:h-full [&>video]:w-full"></div>
              
              {/* Overlay HUD elements */}
              {isScanning && (
                  <div className="absolute inset-0 pointer-events-none border-[20px] border-black/50 z-10 flex flex-col">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/30 rounded-3xl relative">
                           <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-3xl"></div>
                           <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-3xl"></div>
                           <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-3xl"></div>
                           <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-3xl"></div>
                           
                           {/* Scanning line animation */}
                           <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_20px_#10b981] animate-[scan_2s_ease-in-out_infinite_alternate]"></div>
                      </div>
                      
                      <div className="mt-auto mb-12 text-center text-white font-bold uppercase tracking-widest text-sm bg-black/60 mx-auto px-6 py-3 rounded-full backdrop-blur-md">
                          Position QR Code inside frame
                      </div>
                  </div>
              )}
          </div>

          {/* RESULT MASK overlaying everything when scan finishes */}
          {scanResult && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 bg-black/20 backdrop-blur-md">
                  <div className={`text-[120px] mb-8 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${scanResult.type === 'success' ? 'text-white' : scanResult.type === 'warning' ? 'text-black' : 'text-white'}`}>
                      <i className={`fa-solid ${getIcon()}`}></i>
                  </div>
                  
                  <h2 className={`text-5xl font-black uppercase tracking-tighter text-center leading-none drop-shadow-md mb-8 ${scanResult.type === 'warning' ? 'text-black' : 'text-white'}`}>
                      {scanResult.message}
                  </h2>

                  {scanResult.ticket && (
                      <div className="bg-white/10 backdrop-blur-xl border border-white/20 w-full max-w-sm rounded-[2rem] p-8 mt-4 text-center shadow-2xl">
                          <div className="px-4 py-1.5 bg-white/20 rounded-full inline-block text-[10px] font-black uppercase tracking-widest mb-6">
                              {scanResult.ticket.attendee_role} PASS
                          </div>
                          <div className={`text-4xl font-black uppercase tracking-tight leading-none mb-3 ${scanResult.type === 'warning' ? 'text-black' : 'text-white'}`}>
                              {scanResult.ticket.attendee_name}
                          </div>
                          <div className={`text-sm font-bold uppercase tracking-widest ${scanResult.type === 'warning' ? 'text-black/60' : 'text-white/60'}`}>
                              {scanResult.ticket.attendee_company || 'Independent'}
                          </div>
                          <div className="h-px bg-white/20 w-full my-6"></div>
                          <div className={`text-[10px] font-black tracking-[0.4em] uppercase ${scanResult.type === 'warning' ? 'text-black/40' : 'text-white/40'}`}>
                              ID: {scanResult.ticket.id.slice(0, 8)}...
                          </div>
                      </div>
                  )}

                  <button 
                    onClick={startScanning}
                    className={`mt-12 h-16 w-full max-w-sm rounded-2xl text-xl font-black uppercase tracking-[0.2em] transition-transform active:scale-95 shadow-2xl ${
                        scanResult.type === 'warning' 
                        ? 'bg-black text-amber-500 hover:bg-zinc-900 border border-black' 
                        : 'bg-white text-black hover:bg-zinc-100'
                    }`}
                  >
                      Scan Next
                  </button>
              </div>
          )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
            0% { top: 0; }
            100% { top: 100%; }
        }
      `}} />
    </div>
  );
}

export default function TicketScannerPage() {
    return (
        <Suspense fallback={<div className="bg-zinc-950 min-h-screen"></div>}>
            <TicketScannerContent />
        </Suspense>
    );
}

