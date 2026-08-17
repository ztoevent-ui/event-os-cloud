'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { ImageUploadField } from '@/app/components/ImageUploadField';

// Schema for booth_visitors
type Visitor = {
  id: string;
  event_title: string;
  visitor_name: string;
  phone: string;
  company: string;
  interest: string[];
  registered_at: string;
};

type DateFilter = 'all' | 'today' | 'yesterday' | 'custom';

export default function VisitorLeadsStudioPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date Filtering State
  const [filter, setFilter] = useState<DateFilter>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Report Customizer State
  const [eventName, setEventName] = useState('2026 Auto Show');
  const [clientName, setClientName] = useState('Acme Corp');
  const [logoUrl, setLogoUrl] = useState('');
  const [executiveSummary, setExecutiveSummary] = useState('');

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('booth_visitors')
      .select('*')
      .order('registered_at', { ascending: false });

    if (!error && data) {
      setVisitors(data as Visitor[]);
    }
    setLoading(false);
  };

  // Filter logic
  const filteredVisitors = useMemo(() => {
    const now = new Date();
    
    // Start of today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Start of yesterday
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    return visitors.filter(v => {
      const regDate = new Date(v.registered_at);
      if (filter === 'today') {
        return regDate >= startOfToday;
      }
      if (filter === 'yesterday') {
        return regDate >= startOfYesterday && regDate < startOfToday;
      }
      if (filter === 'custom' && customStart && customEnd) {
        const start = new Date(customStart);
        const end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        return regDate >= start && regDate <= end;
      }
      return true; // 'all'
    });
  }, [visitors, filter, customStart, customEnd]);

  // KPIs
  const totalVisitors = visitors.length;
  const newToday = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return visitors.filter(v => new Date(v.registered_at) >= startOfToday).length;
  }, [visitors]);

  const intentionRate = useMemo(() => {
    if (filteredVisitors.length === 0) return 0;
    const withInterests = filteredVisitors.filter(v => v.interest && v.interest.length > 0).length;
    return Math.round((withInterests / filteredVisitors.length) * 100);
  }, [filteredVisitors]);

  // Export functions
  const exportCSV = () => {
    const headers = ['Registered At', 'Name', 'Phone', 'Company', 'Interests'];
    const rows = filteredVisitors.map(v => [
      new Date(v.registered_at).toLocaleString(),
      `"${v.visitor_name.replace(/"/g, '""')}"`,
      `"${v.phone.replace(/"/g, '""')}"`,
      `"${(v.company || '').replace(/"/g, '""')}"`,
      `"${(v.interest || []).join(', ').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    const safeEventName = eventName.replace(/[^a-z0-9]/gi, '_');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${safeEventName}_Leads_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <>
      {/* 
        ========================================
        WEB DASHBOARD (Hidden during Print)
        ========================================
      */}
      <div className="print:hidden" style={s.page}>
        {/* Header */}
        <header style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link href="/dashboard" style={s.backLink}>
              ← Dashboard
            </Link>
            <div style={s.divider} />
            <h1 style={s.headerTitle}>Visitor Leads Studio</h1>
          </div>
        </header>

        <main style={s.main}>
          <div style={s.grid}>
            {/* Main Content: Data Table & Filters */}
            <div style={s.leftCol}>
              
              {/* KPI Panel */}
              <div style={s.kpiPanel}>
                <div style={s.kpiCard}>
                  <div style={s.kpiLabel}>Total Visitors</div>
                  <div style={s.kpiValue}>{totalVisitors}</div>
                </div>
                <div style={s.kpiCard}>
                  <div style={s.kpiLabel}>New Today</div>
                  <div style={{ ...s.kpiValue, color: '#39FF14' }}>+{newToday}</div>
                </div>
                <div style={s.kpiCard}>
                  <div style={s.kpiLabel}>Filtered Count</div>
                  <div style={s.kpiValue}>{filteredVisitors.length}</div>
                </div>
              </div>

              {/* Filter Bar */}
              <div style={s.filterBar}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={() => setFilter('all')} 
                    style={{ ...s.btnFilter, ...(filter === 'all' ? s.btnFilterActive : {}) }}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setFilter('today')} 
                    style={{ ...s.btnFilter, ...(filter === 'today' ? s.btnFilterActive : {}) }}
                  >
                    Today
                  </button>
                  <button 
                    onClick={() => setFilter('yesterday')} 
                    style={{ ...s.btnFilter, ...(filter === 'yesterday' ? s.btnFilterActive : {}) }}
                  >
                    Yesterday
                  </button>
                  <button 
                    onClick={() => setFilter('custom')} 
                    style={{ ...s.btnFilter, ...(filter === 'custom' ? s.btnFilterActive : {}) }}
                  >
                    Custom Range
                  </button>
                </div>

                {filter === 'custom' && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
                    <input 
                      type="date" 
                      style={s.inpDate} 
                      value={customStart} 
                      onChange={e => setCustomStart(e.target.value)} 
                    />
                    <span style={{ color: '#666' }}>to</span>
                    <input 
                      type="date" 
                      style={s.inpDate} 
                      value={customEnd} 
                      onChange={e => setCustomEnd(e.target.value)} 
                    />
                  </div>
                )}
              </div>

              {/* Data Table */}
              <div style={s.tableContainer}>
                {loading ? (
                  <div style={s.centerBox}>Loading data...</div>
                ) : filteredVisitors.length === 0 ? (
                  <div style={s.centerBox}>No visitors found for the selected range.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table style={s.table}>
                      <thead>
                        <tr>
                          <th style={s.th}>Name</th>
                          <th style={s.th}>Phone</th>
                          <th style={s.th}>Company</th>
                          <th style={s.th}>Interests</th>
                          <th style={s.th}>Registered At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVisitors.map(v => (
                          <tr key={v.id} style={s.tr}>
                            <td style={s.td}><strong style={{ color: '#fff' }}>{v.visitor_name}</strong></td>
                            <td style={s.td}>{v.phone}</td>
                            <td style={s.td}>{v.company || '-'}</td>
                            <td style={s.td}>
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {(v.interest || []).map((int, i) => (
                                  <span key={i} style={s.tag}>{int}</span>
                                ))}
                              </div>
                            </td>
                            <td style={{ ...s.td, color: '#888' }}>
                              {new Date(v.registered_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar: Report Customizer */}
            <div style={s.rightCol}>
              <div style={s.panel}>
                <h2 style={s.panelTitle}>Report Settings</h2>
                <p style={s.panelDesc}>Customize the data view for client reporting.</p>

                <div style={s.formGroup}>
                  <label style={s.label}>Event Name</label>
                  <input 
                    style={s.inp} 
                    value={eventName} 
                    onChange={e => setEventName(e.target.value)} 
                    placeholder="e.g. 2026 Auto Show" 
                  />
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>Client Name</label>
                  <input 
                    style={s.inp} 
                    value={clientName} 
                    onChange={e => setClientName(e.target.value)} 
                    placeholder="e.g. Acme Corp" 
                  />
                </div>

                <div style={{ ...s.formGroup, marginTop: 24 }}>
                  <ImageUploadField 
                    label="Client Logo" 
                    value={logoUrl} 
                    onChange={setLogoUrl} 
                    bucket="event-assets" 
                    folder="logos" 
                    placeholder="Upload client logo" 
                    preview="thumbnail" 
                    dark={true}
                  />
                </div>

                <div style={{ ...s.formGroup, marginTop: 24 }}>
                  <label style={s.label}>Executive Summary</label>
                  <textarea 
                    style={{ ...s.inp, minHeight: 120, resize: 'vertical' }} 
                    value={executiveSummary} 
                    onChange={e => setExecutiveSummary(e.target.value)} 
                    placeholder="Write a brief data analysis or summary here..." 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
                  <button onClick={exportCSV} style={s.btnSecondary}>
                    Export CSV/Excel
                  </button>
                  <button onClick={handlePrintPDF} style={s.btnPrimary}>
                    Generate PDF Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 
        ========================================
        PDF PRINT LAYOUT (Only visible when printing)
        ========================================
      */}
      <div className="hidden print:block bg-white text-black min-h-screen font-sans" style={{ padding: '40px' }}>
        
        {/* Print Header */}
        <div className="flex justify-between items-end border-b-2 border-[#4169E1] pb-6 mb-8">
          <div>
            {logoUrl ? (
              <img src={logoUrl} alt="Client Logo" className="max-h-16 object-contain" />
            ) : (
              <h2 className="text-2xl font-black text-gray-800">{clientName || 'Client Name'}</h2>
            )}
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-black text-gray-900 tracking-widest leading-none">ZTO EVENT OS</h1>
            <p className="text-xs font-bold text-gray-400 tracking-[0.2em] mt-1 uppercase">Official Report</p>
          </div>
        </div>

        {/* Title Area */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-black uppercase text-gray-900 tracking-tight">
            {eventName || 'Event Name'} - DAILY VISITOR & LEAD REPORT
          </h1>
          <p className="text-gray-500 font-semibold mt-3 bg-gray-100 inline-block px-4 py-1 rounded-full text-sm">
            Generated on: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Total Leads</p>
            <p className="text-5xl font-black text-[#4169E1]">{filteredVisitors.length}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">New Today</p>
            <p className="text-5xl font-black text-gray-900">{newToday}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Intention Rate</p>
            <p className="text-5xl font-black text-gray-900">{intentionRate}%</p>
          </div>
        </div>

        {/* Executive Summary */}
        {executiveSummary && (
          <div className="bg-[#4169E1]/10 border-l-4 border-[#4169E1] p-6 mb-10 rounded-r-xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#4169E1] mb-3">Executive Summary</h3>
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm font-medium">
              {executiveSummary}
            </p>
          </div>
        )}

        {/* Data Table */}
        <div className="rounded-xl overflow-hidden border border-gray-200 mb-10">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="py-4 px-6 font-bold text-gray-600 uppercase tracking-wider w-40">Time</th>
                <th className="py-4 px-6 font-bold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="py-4 px-6 font-bold text-gray-600 uppercase tracking-wider">Phone</th>
                <th className="py-4 px-6 font-bold text-gray-600 uppercase tracking-wider">Company</th>
                <th className="py-4 px-6 font-bold text-gray-600 uppercase tracking-wider">Interests</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisitors.map((v, idx) => (
                <tr key={v.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100 last:border-b-0`}>
                  <td className="py-3 px-6 text-gray-500 font-medium">
                    {new Date(v.registered_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="py-3 px-6 font-bold text-gray-900">{v.visitor_name}</td>
                  <td className="py-3 px-6 font-medium text-gray-700">{v.phone}</td>
                  <td className="py-3 px-6 font-medium text-gray-700">{v.company || '-'}</td>
                  <td className="py-3 px-6 font-medium text-[#4169E1]">{(v.interest || []).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="text-center text-xs font-bold text-gray-400 tracking-widest uppercase mt-20">
          Powered by ZTO Event OS
        </div>
      </div>
      
      {/* Global styles specifically enforcing print layout rules */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          @page {
            margin: 0;
            size: auto;
          }
        }
      `}} />
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#050505', color: '#E5E5E5', fontFamily: 'Urbanist, sans-serif' },
  header: { 
    position: 'sticky', top: 0, zIndex: 50, 
    background: 'rgba(5,5,5,0.92)', backdropFilter: 'blur(16px)', 
    borderBottom: '1px solid rgba(255,255,255,0.06)', 
    padding: '0 48px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' 
  },
  backLink: { 
    fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', 
    textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.12em' 
  },
  divider: { width: 1, height: 20, background: 'rgba(255,255,255,0.08)' },
  headerTitle: { fontSize: 16, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' },
  
  main: { maxWidth: 1440, margin: '0 auto', padding: '40px' },
  grid: { display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' },
  
  leftCol: { flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: 24 },
  rightCol: { flex: '0 0 400px', width: '100%' },

  kpiPanel: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 },
  kpiCard: { 
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,86,179,0.2)', 
    borderRadius: 16, padding: '24px', display: 'flex', flexDirection: 'column', gap: 8 
  },
  kpiLabel: { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  kpiValue: { fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1 },

  filterBar: { 
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', 
    borderRadius: 16, padding: '16px', display: 'flex', flexDirection: 'column'
  },
  btnFilter: { 
    padding: '8px 16px', borderRadius: 8, background: 'transparent', 
    color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', 
    fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
  },
  btnFilterActive: { background: '#0056B3', color: '#fff', borderColor: '#0056B3' },
  inpDate: { 
    background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', 
    color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 13 
  },

  tableContainer: { 
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', 
    borderRadius: 16, overflow: 'hidden'
  },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { 
    padding: '16px 20px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', 
    textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.06)' 
  },
  tr: { borderBottom: '1px solid rgba(255,255,255,0.03)' },
  td: { padding: '16px 20px', fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  tag: { 
    background: 'rgba(0,86,179,0.15)', color: '#60a5fa', 
    padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 
  },
  centerBox: { padding: '60px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14 },

  panel: { 
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,86,179,0.3)', 
    borderRadius: 20, padding: 32, position: 'sticky', top: 88 
  },
  panelTitle: { fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 },
  panelDesc: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 32 },
  
  formGroup: { marginBottom: 16 },
  label: { display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 8 },
  inp: { 
    width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.04)', 
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', 
    fontSize: 14, outline: 'none', boxSizing: 'border-box'
  },
  
  btnPrimary: { 
    width: '100%', padding: '14px', borderRadius: 12, 
    background: '#0056B3', color: '#fff', border: 'none', 
    fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 0 16px rgba(0,86,179,0.4)',
    transition: 'background 0.2s'
  },
  btnSecondary: {
    width: '100%', padding: '14px', borderRadius: 12, 
    background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', 
    fontWeight: 700, fontSize: 14, cursor: 'pointer',
    transition: 'background 0.2s'
  }
};
