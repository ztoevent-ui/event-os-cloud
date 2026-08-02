import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PrintButton } from './PrintButton';

// Helper — creates a fresh client inside each request (never at module load time)
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface ProgramRow {
  id: string;
  time: string;
  activities: string;
  movement: string;
  cues: string;
  song: string;
  volume: string;
  pic: string;
  course: string;
  is_important?: boolean;
  sort_order: number;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const { data: project } = await getSupabase()
    .from('projects')
    .select('name')
    .eq('program_share_token', token)
    .single();

  return {
    title: project ? `${project.name} — Tentative Program` : 'Tentative Program',
    description: 'Live tentative program powered by ZTO Event OS.',
  };
}

export default async function SharedProgramPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = getSupabase();

  // Lookup project by share token
  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('program_share_token', token)
    .single();

  if (!project) notFound();

  // Fetch program rows
  const { data: rows } = await supabase
    .from('program_items')
    .select('*')
    .eq('project_id', project.id)
    .order('sort_order', { ascending: true });

  const programRows: ProgramRow[] = (rows || []).map((r: any) => ({
    ...r,
    custom_data: r.custom_data || {},
  }));

  const now = new Date().toLocaleString('zh-MY', {
    timeZone: 'Asia/Kuching',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;800&family=Urbanist:wght@400;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          font-family: 'Urbanist', 'Noto Sans SC', -apple-system, BlinkMacSystemFont,
            'PingFang SC', 'Microsoft YaHei', sans-serif;
          background: #050505;
          color: #e5e5e5;
          -webkit-font-smoothing: antialiased;
        }

        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          * {
            font-family: 'Noto Sans SC', 'Urbanist', -apple-system, 'PingFang SC',
              'Microsoft YaHei', sans-serif !important;
            -webkit-font-smoothing: auto !important;
          }
          .print-table { font-size: 10pt !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#050505' }}>

        {/* ── Top Bar ── */}
        <div style={{
          background: 'rgba(5,5,5,0.95)',
          borderBottom: '1px solid rgba(0,86,179,0.25)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg, #0056B3, #003d82)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(0,86,179,0.5)',
            }}>
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 900 }}>Z</span>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#4da3ff', letterSpacing: '0.2em', textTransform: 'uppercase' }}>ZTO Event OS</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{project.name}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="no-print">
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(222,255,154,0.08)',
              border: '1px solid rgba(222,255,154,0.3)',
              borderRadius: 999, padding: '4px 12px',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DEFF9A', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: '#DEFF9A', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Live</span>
            </div>
            <PrintButton />
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px 80px' }}>

          {/* Title */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
              Tentative Program
            </div>
            <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {project.name}
            </h1>
            <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
              Last refreshed: {now}
            </div>
          </div>

          {/* Program Table */}
          {programRows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 80, color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>
              No program items yet.
            </div>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(0,86,179,0.25)',
              borderRadius: 20,
              overflow: 'hidden',
            }}>
              <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'rgba(0,86,179,0.1)', borderBottom: '1px solid rgba(0,86,179,0.3)' }}>
                    {['Time', 'Activity', 'PIC / Cues', 'Movement', 'BGM'].map(h => (
                      <th key={h} style={{
                        padding: '12px 16px', textAlign: 'left',
                        fontSize: 9, fontWeight: 700, letterSpacing: '0.15em',
                        textTransform: 'uppercase', color: '#4da3ff',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {programRows.map((row, i) => (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        background: row.is_important
                          ? 'rgba(239,68,68,0.04)'
                          : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                      }}
                    >
                      <td style={{
                        padding: '12px 16px', fontWeight: 800,
                        color: '#DEFF9A', whiteSpace: 'nowrap', verticalAlign: 'top',
                        minWidth: 90,
                      }}>
                        {row.time || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top', maxWidth: 280 }}>
                        <div style={{
                          fontWeight: 700, fontSize: 14,
                          color: row.is_important ? '#f87171' : '#fff',
                          lineHeight: 1.4,
                        }}>
                          {row.activities}
                        </div>
                        {row.course && (
                          <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4, fontWeight: 600 }}>
                            🍴 {row.course}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                        {row.pic && (
                          <div style={{ fontSize: 12, color: '#4da3ff', fontWeight: 600, marginBottom: 4 }}>
                            👤 {row.pic}
                          </div>
                        )}
                        {row.cues && (
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                            {row.cues}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'rgba(255,255,255,0.45)', verticalAlign: 'top' }}>
                        {row.movement}
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                        {row.song && (
                          <div style={{ fontSize: 12, color: '#4da3ff', fontWeight: 600 }}>
                            🎵 {row.song}
                          </div>
                        )}
                        {row.volume && (
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
                            Vol: {row.volume}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 40, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.15)', lineHeight: 1.8 }} className="no-print">
            <div>Powered by <strong style={{ color: 'rgba(255,255,255,0.3)' }}>ZTO Event OS</strong></div>
            <div>This link is read-only and refreshes automatically with the latest data.</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
}
