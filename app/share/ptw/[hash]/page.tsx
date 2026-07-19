import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';

interface ScheduleItem {
  id: string; date: string; time: string; title: string;
  note: string; transport: string; assignee: string; status: string;
}
interface Risk { id: string; label: string; description: string; }

async function getPTW(hash: string) {
  const { data, error } = await supabase
    .from('ptw_documents')
    .select('*, projects(name, venue, start_date, end_date)')
    .eq('hash', hash)
    .single();
  if (error || !data) return null;
  return data;
}

function formatDate(d: string) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-MY', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function formatDateTime(d: string) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-MY', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default async function PTWDocumentPage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  const ptw = await getPTW(hash);
  if (!ptw) return notFound();

  const project = ptw.projects as any;
  const items: ScheduleItem[] = ptw.selected_items || [];
  const risks: Risk[] = ptw.risks || [];

  // Group items by date
  const dateGroups: Record<string, ScheduleItem[]> = {};
  items.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).forEach(item => {
    if (!dateGroups[item.date]) dateGroups[item.date] = [];
    dateGroups[item.date].push(item);
  });

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #f5f5f5; font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; }
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          @page { margin: 18mm; size: A4; }
        }
        .doc { background: #fff; max-width: 860px; margin: 0 auto; box-shadow: 0 2px 40px rgba(0,0,0,0.12); }
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #d0d7e4; padding: 8px 12px; font-size: 11px; vertical-align: top; }
        th { background: #EEF4FF; color: #0056B3; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; }
      `}</style>

      {/* Screen toolbar */}
      <div className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#0056B3', padding: '12px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>ZTO Event OS · PTW Document</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{project?.name}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            data-print="true"
            style={{
              padding: '9px 20px', borderRadius: 8, cursor: 'pointer',
              background: '#fff', color: '#0056B3', fontWeight: 700, fontSize: 12,
              border: 'none', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            🖨 Print / Save PDF
          </button>
          <button
            data-copy="true"
            style={{
              padding: '9px 20px', borderRadius: 8, cursor: 'pointer',
              background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600, fontSize: 12,
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            Copy Link
          </button>
        </div>
      </div>


      {/* Document body */}
      <div className="doc" style={{ padding: '0' }}>

        {/* ── HEADER ── */}
        <div style={{ background: '#0056B3', padding: '32px 40px', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                ZTO Event OS · Official Document
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.01em', marginBottom: 4 }}>
                WORK PERMIT &amp; SITE ACTIVITY NOTICE
              </h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                Permit to Work (PTW) · Client Notification
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 10, padding: '12px 16px',
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                  DOCUMENT REF
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>
                  PTW-{ptw.hash.slice(0, 8).toUpperCase()}
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                  Issued: {formatDateTime(ptw.issued_at || ptw.created_at)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div style={{
          background: '#EEF4FF', padding: '10px 40px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '2px solid #0056B3',
        }}>
          <span style={{ fontSize: 11, color: '#555' }}>
            This document is generated by ZTO Event OS and is valid for the specified work period only.
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 10px',
            borderRadius: 4, background: '#0056B3', color: '#fff',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            {ptw.status === 'issued' ? 'ISSUED' : ptw.status?.toUpperCase()}
          </span>
        </div>

        <div style={{ padding: '36px 40px', display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* ── PART A: General Info ── */}
          <section>
            <div style={{
              fontSize: 10, fontWeight: 700, color: '#0056B3', textTransform: 'uppercase',
              letterSpacing: '0.15em', marginBottom: 14,
              paddingBottom: 8, borderBottom: '2px solid #0056B3',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: 6, background: '#0056B3',
                color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 900,
              }}>A</span>
              Part A — General Information
            </div>
            <table>
              <tbody>
                <tr>
                  <td style={{ background: '#F8FAFF', fontWeight: 700, color: '#333', width: '28%' }}>Project / Event Name</td>
                  <td style={{ fontWeight: 700, fontSize: 13 }}>{project?.name}</td>
                </tr>
                <tr>
                  <td style={{ background: '#F8FAFF', fontWeight: 700, color: '#333' }}>Site / Venue</td>
                  <td>{project?.venue || '—'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#F8FAFF', fontWeight: 700, color: '#333' }}>Project Date Range</td>
                  <td>{project?.start_date ? `${formatDate(project.start_date)} → ${formatDate(project.end_date || project.start_date)}` : '—'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#F8FAFF', fontWeight: 700, color: '#333' }}>Work Leader (Site IC)</td>
                  <td style={{ fontWeight: 700 }}>{ptw.work_leader || '—'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#F8FAFF', fontWeight: 700, color: '#333' }}>Emergency Contact</td>
                  <td style={{ fontWeight: 700, color: '#0056B3' }}>{ptw.work_leader_contact || '—'}</td>
                </tr>
                <tr>
                  <td style={{ background: '#F8FAFF', fontWeight: 700, color: '#333' }}>Issuing Organisation</td>
                  <td>ZTO Event Management Sdn. Bhd.</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* ── PART B: Scope of Work ── */}
          <section>
            <div style={{
              fontSize: 10, fontWeight: 700, color: '#0056B3', textTransform: 'uppercase',
              letterSpacing: '0.15em', marginBottom: 14,
              paddingBottom: 8, borderBottom: '2px solid #0056B3',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: 6, background: '#0056B3',
                color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 900,
              }}>B</span>
              Part B — Scope of Work
            </div>
            {Object.entries(dateGroups).map(([date, dayItems]) => (
              <div key={date} style={{ marginBottom: 16 }}>
                <div style={{
                  background: '#EEF4FF', padding: '7px 12px', marginBottom: 4,
                  fontSize: 11, fontWeight: 700, color: '#0056B3', borderLeft: '4px solid #0056B3',
                }}>
                  {formatDate(date)}
                </div>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '15%' }}>Time</th>
                      <th style={{ width: '30%' }}>Activity</th>
                      <th>Remarks / Notes</th>
                      <th style={{ width: '15%' }}>Assigned To</th>
                      <th style={{ width: '15%' }}>Transport / Equipment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayItems.map((item, idx) => (
                      <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#FAFCFF' }}>
                        <td style={{ fontWeight: 700, color: '#0056B3', whiteSpace: 'nowrap' }}>{item.time || '—'}</td>
                        <td style={{ fontWeight: 600 }}>{item.title}</td>
                        <td style={{ color: '#555' }}>{item.note || '—'}</td>
                        <td>{item.assignee || '—'}</td>
                        <td>{item.transport || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </section>

          {/* ── PART C: Risk & Client Impact ── */}
          {risks.length > 0 && (
            <section>
              <div style={{
                fontSize: 10, fontWeight: 700, color: '#0056B3', textTransform: 'uppercase',
                letterSpacing: '0.15em', marginBottom: 14,
                paddingBottom: 8, borderBottom: '2px solid #0056B3',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 6, background: '#0056B3',
                  color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 900,
                }}>C</span>
                Part C — Client Impact &amp; Risk Assessment
              </div>
              <div style={{
                background: '#FFF9E6', border: '1px solid #E6A817', borderRadius: 8,
                padding: '10px 16px', marginBottom: 14, fontSize: 11, color: '#8B6914',
              }}>
                ⚠️ The following notices require attention and coordination from the Venue / Client Site Manager during the specified work period.
              </div>
              {risks.map((risk, idx) => (
                <div key={risk.id} style={{
                  display: 'flex', gap: 14, padding: '12px 14px', marginBottom: 8,
                  background: idx % 2 === 0 ? '#F8FAFF' : '#fff',
                  border: '1px solid #D0D7E4', borderRadius: 8,
                  borderLeft: '4px solid #0056B3',
                }}>
                  <div style={{ flexShrink: 0, marginTop: 2 }}>
                    <span style={{
                      display: 'inline-flex', width: 20, height: 20,
                      borderRadius: '50%', background: '#0056B3',
                      color: '#fff', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700,
                    }}>{idx + 1}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0056B3', marginBottom: 4 }}>{risk.label}</div>
                    <div style={{ fontSize: 11, color: '#444', lineHeight: 1.6 }}>{risk.description}</div>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Additional Notes */}
          {ptw.notes && (
            <section>
              <div style={{
                fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase',
                letterSpacing: '0.15em', marginBottom: 10, paddingBottom: 8,
                borderBottom: '1px solid #ddd',
              }}>
                Additional Notes / Instructions
              </div>
              <div style={{ fontSize: 12, color: '#444', lineHeight: 1.7, whiteSpace: 'pre-line', padding: '12px 16px', background: '#FAFAFA', borderRadius: 8, border: '1px solid #eee' }}>
                {ptw.notes}
              </div>
            </section>
          )}

          {/* ── PART D: Sign-Off ── */}
          <section>
            <div style={{
              fontSize: 10, fontWeight: 700, color: '#0056B3', textTransform: 'uppercase',
              letterSpacing: '0.15em', marginBottom: 14,
              paddingBottom: 8, borderBottom: '2px solid #0056B3',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: 6, background: '#0056B3',
                color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 900,
              }}>D</span>
              Part D — Declaration &amp; Sign-Off
            </div>
            <div style={{
              fontSize: 11, color: '#555', lineHeight: 1.7, marginBottom: 20,
              padding: '12px 16px', background: '#F8FAFF', borderRadius: 8, border: '1px solid #D0D7E4',
            }}>
              I, the undersigned Work Leader, hereby declare that all work activities listed in this permit shall be carried out in compliance with applicable safety regulations, venue guidelines, and ZTO internal SOPs. I confirm that all crew members have been briefed on the scope of work and associated risks prior to commencement.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* ZTO Work Leader */}
              <div style={{ border: '1px solid #D0D7E4', borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#0056B3', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                  ZTO Work Leader (Issuer)
                </div>
                <div style={{ height: 56, borderBottom: '1px solid #ccc', marginBottom: 10 }}></div>
                <div style={{ fontSize: 11, color: '#333', fontWeight: 700 }}>{ptw.work_leader || '___________________'}</div>
                <div style={{ fontSize: 10, color: '#888', marginTop: 3 }}>Name &amp; Signature</div>
                <div style={{ marginTop: 12, height: 24, borderBottom: '1px solid #ccc', marginBottom: 6 }}></div>
                <div style={{ fontSize: 10, color: '#888' }}>Date</div>
              </div>

              {/* Client / Venue */}
              <div style={{ border: '1px solid #D0D7E4', borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#0056B3', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                  Client / Venue Site Manager (Approver)
                </div>
                <div style={{ height: 56, borderBottom: '1px solid #ccc', marginBottom: 10 }}></div>
                <div style={{ fontSize: 11, color: '#888' }}>___________________</div>
                <div style={{ fontSize: 10, color: '#888', marginTop: 3 }}>Name &amp; Signature &amp; Stamp</div>
                <div style={{ marginTop: 12, height: 24, borderBottom: '1px solid #ccc', marginBottom: 6 }}></div>
                <div style={{ fontSize: 10, color: '#888' }}>Date</div>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div style={{
          background: '#EEF4FF', borderTop: '2px solid #0056B3',
          padding: '16px 40px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: 10, color: '#555' }}>
            ZTO Event OS · Automated PTW Engine · Document Ref: PTW-{ptw.hash.slice(0, 8).toUpperCase()}
          </div>
          <div style={{ fontSize: 10, color: '#888' }}>
            Generated {formatDateTime(ptw.issued_at || ptw.created_at)} · This document is computer-generated.
          </div>
        </div>
      </div>

      {/* Print trigger script */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.addEventListener('DOMContentLoaded', function() {
          const printBtns = document.querySelectorAll('[data-print]');
          printBtns.forEach(b => b.addEventListener('click', () => window.print()));
          
          const copyBtns = document.querySelectorAll('[data-copy]');
          copyBtns.forEach(b => b.addEventListener('click', () => {
            navigator.clipboard.writeText(window.location.href);
            const originalText = b.innerText;
            b.innerText = 'Copied!';
            setTimeout(() => b.innerText = originalText, 2000);
          }));
        });
      `}} />
    </>
  );
}
