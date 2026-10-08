'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Visitor = {
  id: string;
  visitor_name: string;
  phone: string;
  company: string;
  interest: string[];
  registered_at: string;
};

type DateFilter = 'all' | 'today' | 'yesterday';

const INTEREST_OPTIONS = [
  'General Inquiry',
  'Event Sponsorship',
  'Partnership',
  'Technology Demo',
  'Other',
];

// CheckIcon
const CheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

function VisitorLeadsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.id as string;

  // Tab: 'table' | 'register'
  const [tab, setTab] = useState<'table' | 'register'>('table');

  // ── Data ──────────────────────────────────────────────
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Filters ───────────────────────────────────────────
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  // ── Register form state ───────────────────────────────
  const [visitorName, setVisitorName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [interest, setInterest] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchVisitors();
  }, [projectId]);

  const fetchVisitors = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('booth_visitors')
      .select('*')
      .eq('project_id', projectId)
      .order('registered_at', { ascending: false });
    setVisitors((data as Visitor[]) || []);
    setLoading(false);
  };

  // ── KPIs ─────────────────────────────────────────────
  const startOfToday = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }, []);
  const startOfYesterday = useMemo(() => {
    const d = new Date(startOfToday); d.setDate(d.getDate() - 1); return d;
  }, [startOfToday]);

  const filteredVisitors = useMemo(() => {
    return visitors.filter(v => {
      const d = new Date(v.registered_at);
      if (dateFilter === 'today') return d >= startOfToday;
      if (dateFilter === 'yesterday') return d >= startOfYesterday && d < startOfToday;
      return true;
    });
  }, [visitors, dateFilter, startOfToday, startOfYesterday]);

  const totalLeads = visitors.length;
  const todayLeads = visitors.filter(v => new Date(v.registered_at) >= startOfToday).length;
  const intentionRate = filteredVisitors.length === 0 ? 0 :
    Math.round((filteredVisitors.filter(v => v.interest?.length > 0).length / filteredVisitors.length) * 100);

  // ── Export CSV ────────────────────────────────────────
  const exportCSV = () => {
    const headers = ['Registered At', 'Name', 'Phone', 'Company', 'Interests'];
    const rows = filteredVisitors.map(v => [
      new Date(v.registered_at).toLocaleString(),
      `"${v.visitor_name.replace(/"/g, '""')}"`,
      `"${v.phone.replace(/"/g, '""')}"`,
      `"${(v.company || '').replace(/"/g, '""')}"`,
      `"${(v.interest || []).join(', ')}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Leads_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Register form ─────────────────────────────────────
  const toggleInterest = (val: string) =>
    setInterest(prev => prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('booth_visitors').insert({
        project_id: projectId,
        visitor_name: visitorName,
        phone,
        company,
        interest,
      });
      if (error) throw error;
      setIsSuccess(true);
      setTimeout(() => {
        setVisitorName(''); setPhone(''); setCompany(''); setInterest([]);
        setIsSuccess(false); setIsSubmitting(false);
        fetchVisitors(); // refresh table
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Header Row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-ink)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Visitor Leads
          </h2>
          <p style={{ fontSize: 13, color: 'rgb(var(--c-ink-rgb) / 0.4)' }}>
            Booth check-in & lead capture for this event
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={exportCSV} style={s.btnGhost}>
            <i className="fa-solid fa-file-csv" /> Export CSV
          </button>
          <button onClick={() => setTab(tab === 'register' ? 'table' : 'register')} style={s.btnPrimary}>
            <i className={`fa-solid ${tab === 'register' ? 'fa-table' : 'fa-plus'}`} />
            {tab === 'register' ? 'View Table' : 'Add Visitor'}
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 }}>
        {[
          { label: 'Total Leads', val: totalLeads, color: 'var(--c-accent-bright)' },
          { label: 'Today', val: `+${todayLeads}`, color: '#39FF14' },
          { label: 'Showing', val: filteredVisitors.length, color: 'var(--c-ink)' },
          { label: 'Intention Rate', val: `${intentionRate}%`, color: '#a855f7' },
        ].map(k => (
          <div key={k.label} className="zto-card zto-card-sm" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="zto-label">{k.label}</span>
            <span style={{ fontSize: 28, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.val}</span>
          </div>
        ))}
      </div>

      {/* ── Tab Body ── */}
      {tab === 'table' ? (
        <>
          {/* Date filter pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['all', 'today', 'yesterday'] as DateFilter[]).map(f => (
              <button key={f} onClick={() => setDateFilter(f)}
                style={{ ...s.pill, ...(dateFilter === f ? s.pillActive : {}) }}>
                {f === 'all' ? 'All Time' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="zto-card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'rgb(var(--c-ink-rgb) / 0.3)' }}>Loading...</div>
            ) : filteredVisitors.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'rgb(var(--c-ink-rgb) / 0.3)' }}>
                No visitors yet.{' '}
                <button onClick={() => setTab('register')} style={{ color: 'var(--c-accent-bright)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                  Add the first one →
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgb(var(--c-ink-rgb) / 0.06)' }}>
                      {['Time', 'Name', 'Phone', 'Company', 'Interests'].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVisitors.map((v, idx) => (
                      <tr key={v.id} style={{ borderBottom: '1px solid rgb(var(--c-ink-rgb) / 0.03)', background: idx % 2 === 1 ? 'rgb(var(--c-ink-rgb) / 0.01)' : 'transparent' }}>
                        <td style={{ ...s.td, color: '#666', fontSize: 12, whiteSpace: 'nowrap' }}>
                          {new Date(v.registered_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td style={{ ...s.td }}><strong style={{ color: 'var(--c-ink)' }}>{v.visitor_name}</strong></td>
                        <td style={s.td}>{v.phone}</td>
                        <td style={s.td}>{v.company || '-'}</td>
                        <td style={s.td}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {(v.interest || []).map((i, ix) => (
                              <span key={ix} style={s.tag}>{i}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* ── Inline Register Form ── */
        <div className="zto-card" style={{ maxWidth: 560 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-ink)', marginBottom: 4 }}>Register Visitor</h3>
          <p style={{ fontSize: 13, color: 'rgb(var(--c-ink-rgb) / 0.4)', marginBottom: 28 }}>
            Walk-in check-in — linked to this project automatically.
          </p>

          {isSuccess ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(57,255,20,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckIcon className="w-7 h-7" style={{ width: 28, height: 28, color: '#39FF14', stroke: '#39FF14' } as React.CSSProperties} />
              </div>
              <span style={{ fontWeight: 800, color: '#39FF14', fontSize: 18 }}>Registered!</span>
              <span style={{ color: 'rgb(var(--c-ink-rgb) / 0.4)', fontSize: 13 }}>Ready for next visitor...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {errorMsg && (
                <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#f87171', fontSize: 13 }}>
                  {errorMsg}
                </div>
              )}
              <div>
                <label style={s.label}>Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input required value={visitorName} onChange={e => setVisitorName(e.target.value)} disabled={isSubmitting} className="zto-input" placeholder="John Doe" />
              </div>
              <div>
                <label style={s.label}>Phone / WhatsApp <span style={{ color: '#ef4444' }}>*</span></label>
                <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} disabled={isSubmitting} className="zto-input" placeholder="+60 12 345 6789" />
              </div>
              <div>
                <label style={s.label}>Company <span style={{ color: 'rgb(var(--c-ink-rgb) / 0.3)' }}>(Optional)</span></label>
                <input value={company} onChange={e => setCompany(e.target.value)} disabled={isSubmitting} className="zto-input" placeholder="Acme Corp" />
              </div>
              <div>
                <label style={{ ...s.label, marginBottom: 10 }}>Interested In</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {INTEREST_OPTIONS.map(opt => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: `1px solid ${interest.includes(opt) ? '#4169E1' : 'rgb(var(--c-ink-rgb) / 0.1)'}`, background: interest.includes(opt) ? 'rgba(65,105,225,0.1)' : 'rgb(var(--c-ink-rgb) / 0.02)', cursor: 'pointer', transition: 'all 0.15s' }}>
                      <input type="checkbox" checked={interest.includes(opt)} onChange={() => toggleInterest(opt)} disabled={isSubmitting} className="sr-only" />
                      <div style={{ width: 16, height: 16, borderRadius: 4, border: `1px solid ${interest.includes(opt) ? '#4169E1' : 'rgb(var(--c-ink-rgb) / 0.3)'}`, background: interest.includes(opt) ? '#4169E1' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {interest.includes(opt) && <CheckIcon style={{ width: 10, height: 10, stroke: '#fff' } as React.CSSProperties} />}
                      </div>
                      <span style={{ fontSize: 13, color: 'rgb(var(--c-ink-rgb) / 0.8)' }}>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} style={{ ...s.btnPrimary, width: '100%', padding: '14px', opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer', background: '#39FF14', color: 'var(--c-canvas)' }}>
                {isSubmitting ? 'Submitting...' : 'Register Visitor'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function VisitorLeadsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: 'rgb(var(--c-ink-rgb) / 0.3)' }}>Loading...</div>}>
      <VisitorLeadsContent />
    </Suspense>
  );
}

const s: Record<string, React.CSSProperties> = {
  btnPrimary: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 10, background: 'var(--c-accent)', color: 'var(--c-on-accent)', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Urbanist, sans-serif' },
  btnGhost: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 10, background: 'rgb(var(--c-ink-rgb) / 0.04)', color: 'rgb(var(--c-ink-rgb) / 0.7)', border: '1px solid rgb(var(--c-ink-rgb) / 0.1)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Urbanist, sans-serif' },
  pill: { padding: '6px 14px', borderRadius: 999, background: 'rgb(var(--c-ink-rgb) / 0.04)', color: 'rgb(var(--c-ink-rgb) / 0.5)', border: '1px solid rgb(var(--c-ink-rgb) / 0.08)', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  pillActive: { background: 'var(--c-accent)', color: 'var(--c-on-accent)', borderColor: 'var(--c-accent)' },
  th: { padding: '14px 20px', fontSize: 10, fontWeight: 700, color: 'rgb(var(--c-ink-rgb) / 0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'left' },
  td: { padding: '14px 20px', fontSize: 13, color: 'rgb(var(--c-ink-rgb) / 0.65)' },
  tag: { background: 'rgba(65,105,225,0.15)', color: '#7ba3ff', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 },
  label: { display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgb(var(--c-ink-rgb) / 0.35)', marginBottom: 8 },
};
