'use client';

import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface PTWDocument {
  id: string;
  hash: string;
  title: string;
  work_leader: string;
  status: string;
  created_at: string;
  issued_at: string | null;
  client_name: string | null;
  signed_at: string | null;
}

export default function PTWListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const [ptws, setPtws] = useState<PTWDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPTWs();
  }, [projectId]);

  const fetchPTWs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ptw_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPtws(data);
    }
    setLoading(false);
  };

  const copyLink = (hash: string) => {
    const url = `${window.location.origin}/share/ptw/${hash}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const getStatusBadge = (status: string) => {
    if (status === 'approved') return <span className="zto-badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>APPROVED</span>;
    if (status === 'issued') return <span className="zto-badge zto-badge-blue">ISSUED</span>;
    return <span className="zto-badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#aaa', border: '1px solid rgba(255,255,255,0.2)' }}>DRAFT</span>;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}>
        <div style={{
          width: 32, height: 32,
          border: '2px solid rgba(0,86,179,0.15)',
          borderTopColor: '#0056B3',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading PTWs...</span>
        <style dangerouslySetInnerHTML={{__html: `@keyframes spin { to { transform: rotate(360deg); } }`}} />
      </div>
    );
  }

  return (
    <div className="page-transition flex flex-col gap-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
        <div className="flex flex-col">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ef4444] mb-2">Documentation</p>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none font-['Urbanist']">
            Permit To Work
          </h1>
        </div>
        
        <div>
          <Link href={`/projects/${projectId}/schedule`} className="h-11 px-6 bg-[#0056B3] text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all hover:bg-blue-600 flex items-center gap-2">
            <i className="fa-solid fa-plus" /> Generate New PTW
          </Link>
          <p className="text-[10px] text-zinc-500 mt-2 text-right">Generate from Schedule</p>
        </div>
      </div>

      <div className="zto-card" style={{ padding: 0, overflow: 'hidden' }}>
        {ptws.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center opacity-50">
            <i className="fa-solid fa-file-signature text-4xl mb-4 text-zinc-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">No PTW Documents Found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900/50 border-b border-white/5">
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Document Ref</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Work Leader</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Issued On</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Signed By</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ptws.map((ptw, idx) => (
                  <tr key={ptw.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-bold text-white">PTW-{ptw.hash.slice(0, 8).toUpperCase()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-white">{ptw.work_leader || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-zinc-400">
                        {ptw.issued_at ? new Date(ptw.issued_at).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {ptw.client_name ? (
                        <div>
                          <div className="text-xs font-bold text-emerald-400">{ptw.client_name}</div>
                          <div className="text-[10px] text-zinc-500">{new Date(ptw.signed_at!).toLocaleDateString()}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(ptw.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => copyLink(ptw.hash)}
                          className="w-8 h-8 rounded-lg bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
                          title="Copy Share Link"
                        >
                          <i className="fa-solid fa-link text-xs"></i>
                        </button>
                        <Link 
                          href={`/share/ptw/${ptw.hash}`}
                          target="_blank"
                          className="w-8 h-8 rounded-lg bg-[#0056B3]/20 text-[#4da3ff] border border-[#0056B3]/30 hover:bg-[#0056B3] hover:text-white transition-all flex items-center justify-center"
                          title="Open Document"
                        >
                          <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
