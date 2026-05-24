'use client';

// =============================================================================
// app/queue/page.tsx — Animated Waiting Room Page
// =============================================================================

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface QueueStatus {
  admitted:         boolean;
  position:         number;
  estimatedSeconds: number;
  total:            number;
}

function QueueContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const eventSlug = searchParams.get('event') ?? 'event';
  const returnTo  = searchParams.get('return_to') ?? '/';
  const initialPos = parseInt(searchParams.get('position') ?? '50', 10);

  const [position, setPosition]         = useState(initialPos);
  const [estimatedWait, setEstimatedWait] = useState(Math.ceil(initialPos * 0.03)); // ~0.03 min per position
  const [dots, setDots]                 = useState('');
  const [attempts, setAttempts]         = useState(0);

  // Animated dots for "Waiting" text
  useEffect(() => {
    const iv = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);
    return () => clearInterval(iv);
  }, []);

  // Poll queue status every 5 seconds
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/ticketing/queue-status?event=${encodeURIComponent(eventSlug)}`,
        { cache: 'no-store' }
      );

      if (!res.ok) return;
      const data: QueueStatus = await res.json();

      setAttempts(a => a + 1);

      if (data.admitted) {
        // Redirect back to checkout — the middleware will now see the valid cookie
        router.replace(returnTo);
        return;
      }

      setPosition(data.position);
      setEstimatedWait(data.estimatedSeconds > 0 ? Math.ceil(data.estimatedSeconds / 60) : 1);
    } catch {
      // Network error — keep polling silently
    }
  }, [eventSlug, returnTo, router]);

  useEffect(() => {
    // Immediate first check
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  // Progress bar: visual only, regresses toward 0 as position drops
  const progressPct = Math.max(0, Math.min(100, 100 - (position / Math.max(initialPos, 1)) * 100));

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 40%, #0a0a1a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: '#e2e8f0',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient glow circles */}
      <div style={{
        position: 'absolute', width: '600px', height: '600px',
        borderRadius: '50%', top: '-200px', left: '-200px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: '500px', height: '500px',
        borderRadius: '50%', bottom: '-150px', right: '-150px',
        background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        padding: '3rem 2.5rem',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Spinner */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '72px', height: '72px',
            borderRadius: '50%',
            border: '3px solid rgba(99,102,241,0.15)',
            borderTop: '3px solid #818cf8',
            animation: 'spin 1s linear infinite',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', inset: '8px',
              borderRadius: '50%',
              border: '2px solid rgba(168,85,247,0.2)',
              borderRight: '2px solid #a855f7',
              animation: 'spin 1.5s linear infinite reverse',
            }} />
          </div>
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: '1.75rem', fontWeight: 700,
          margin: '0 0 0.5rem',
          background: 'linear-gradient(135deg, #818cf8 0%, #a855f7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          You&apos;re in the Queue{dots}
        </h1>

        <p style={{ color: '#94a3b8', margin: '0 0 2rem', fontSize: '0.95rem' }}>
          High demand for{' '}
          <span style={{ color: '#c7d2fe', fontWeight: 600 }}>
            {eventSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
          . We&apos;ll let you in shortly.
        </p>

        {/* Position badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '99px',
          padding: '0.5rem 1.25rem',
          marginBottom: '2rem',
        }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#818cf8' }}>
            #{position.toLocaleString()}
          </span>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>in queue</span>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '99px',
            height: '8px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)',
              borderRadius: '99px',
              transition: 'width 1s ease',
              boxShadow: '0 0 12px rgba(99,102,241,0.6)',
            }} />
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b',
          }}>
            <span>Almost there!</span>
            <span>Est. {estimatedWait} min</span>
          </div>
        </div>

        {/* Status */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          padding: '1rem',
          fontSize: '0.85rem',
          color: '#64748b',
        }}>
          <span style={{ color: '#4ade80' }}>●</span>{' '}
          Checking every 5 seconds
          {attempts > 0 && (
            <span style={{ marginLeft: '0.5rem', color: '#475569' }}>
              · {attempts} check{attempts !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Info */}
        <p style={{
          marginTop: '1.5rem', fontSize: '0.8rem',
          color: '#475569', lineHeight: 1.6,
        }}>
          Keep this tab open. You&apos;ll be automatically redirected when it&apos;s your turn.
          Your spot is reserved for <strong style={{ color: '#94a3b8' }}>15 minutes</strong> once admitted.
        </p>
      </div>

      {/* CSS keyframes via style tag */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function QueuePage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: '#0a0a1a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#64748b', fontFamily: 'Inter, sans-serif',
      }}>
        Loading queue...
      </div>
    }>
      <QueueContent />
    </Suspense>
  );
}
