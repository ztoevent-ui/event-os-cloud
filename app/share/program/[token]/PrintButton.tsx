'use client';

export function PrintButton() {
  return (
    <button
      onClick={() => {
        document.fonts.ready.then(() => window.print());
      }}
      style={{
        background: '#0056B3', color: '#fff', border: 'none', borderRadius: 10,
        padding: '8px 16px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
      }}
    >
      <span>⬇</span> Export PDF
    </button>
  );
}
