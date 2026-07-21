'use client';

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ClientSignature({ hash }: { hash: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle high DPI displays for canvas clarity
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set canvas resolution
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';
      }
    }
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      // Clear canvas keeping the high DPI scale intact
      ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
    }
  };

  const submitSignature = async () => {
    if (!clientName.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if canvas is completely blank (simplified check)
    const ctx = canvas.getContext('2d');
    const pixelBuffer = new Uint32Array(ctx?.getImageData(0, 0, canvas.width, canvas.height).data.buffer || new ArrayBuffer(0));
    if (!pixelBuffer.some(color => color !== 0)) {
      setErrorMsg('Please sign in the signature box.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const signatureDataUrl = canvas.toDataURL('image/png');
    
    const { error } = await supabase
      .from('ptw_documents')
      .update({
        client_name: clientName,
        client_signature: signatureDataUrl,
        signed_at: new Date().toISOString(),
        status: 'approved'
      })
      .eq('hash', hash);

    setLoading(false);

    if (error) {
      setErrorMsg('Failed to save signature: ' + error.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#10b981', background: '#ecfdf5', borderRadius: '8px' }}>
        <i className="fa-solid fa-circle-check" style={{ fontSize: 24, marginBottom: 10 }}></i>
        <div style={{ fontWeight: 700 }}>Signature Submitted Successfully</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>Refreshing document...</div>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid #D0D7E4', borderRadius: 8, padding: 20, background: '#fff' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#0056B3', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
        Client / Venue Site Manager (Approver)
      </div>
      
      <div className="no-print">
        {errorMsg && (
          <div style={{ color: '#ef4444', fontSize: 11, marginBottom: 10, padding: '8px', background: '#fef2f2', borderRadius: 4 }}>
            {errorMsg}
          </div>
        )}
        
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Full Name / Position *</label>
        <input 
          type="text" 
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="e.g. John Doe - Venue Manager"
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4, marginBottom: 16, fontSize: 13 }}
        />

        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
          Digital Signature *
          <button onClick={clearCanvas} style={{ float: 'right', background: 'none', border: 'none', color: '#0056B3', cursor: 'pointer', fontSize: 10 }}>
            Clear
          </button>
        </label>
        <div style={{ border: '1px dashed #aaa', borderRadius: 4, background: '#fafafa', marginBottom: 16, touchAction: 'none' }}>
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ width: '100%', height: '120px', display: 'block' }}
          />
        </div>

        <button 
          onClick={submitSignature}
          disabled={loading}
          style={{ 
            width: '100%', padding: '10px', background: '#0056B3', color: '#fff', 
            border: 'none', borderRadius: 4, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Submitting...' : 'Approve & Sign PTW'}
        </button>
      </div>

      <div className="print-only" style={{ display: 'none' }}>
        <div style={{ height: 56, borderBottom: '1px solid #ccc', marginBottom: 10 }}></div>
        <div style={{ fontSize: 11, color: '#888' }}>___________________</div>
        <div style={{ fontSize: 10, color: '#888', marginTop: 3 }}>Name &amp; Signature &amp; Stamp</div>
        <div style={{ marginTop: 12, height: 24, borderBottom: '1px solid #ccc', marginBottom: 6 }}></div>
        <div style={{ fontSize: 10, color: '#888' }}>Date</div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
      `}} />
    </div>
  );
}
