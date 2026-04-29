'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

interface Tournament {
  id: string;
  name: string;
  sport_type: string;
  event_id_slug: string;
  format: 'TIE_TEAM' | 'INDIVIDUAL';
  linked_project_id: string | null;
  has_third_place?: boolean;
  created_at?: string;
}

interface Project {
  id: string;
  name: string;
  type: string;
}

const SPORT_META: Record<string, { icon: string; color: string }> = {
  PICKLEBALL:   { icon: '🏓', color: '#10b981' },
  BADMINTON:    { icon: '🏸', color: '#f59e0b' },
  BASKETBALL:   { icon: '🏀', color: '#f97316' },
  FUTSAL:       { icon: '⚽', color: '#22c55e' },
  TENNIS:       { icon: '🎾', color: '#a3e635' },
  VOLLEYBALL:   { icon: '🏐', color: '#60a5fa' },
  TABLE_TENNIS: { icon: '🏓', color: '#e879f9' },
  ARCHERY:      { icon: '🎯', color: '#fb7185' },
  OTHER:        { icon: '🏅', color: '#94a3b8' },
};

const SPORTS = Object.entries(SPORT_META).map(([id, m]) => ({ id, ...m, name: id.replace(/_/g, ' ') }));

const FORMAT_OPTIONS = [
  { id: 'TIE_TEAM',    label: 'Team Tie',         sub: 'Thomas Cup / Corporate Cup', icon: 'fa-people-group' },
  { id: 'INDIVIDUAL',  label: 'Individual Events', sub: 'Singles, Doubles, Mixed',    icon: 'fa-person-running' },
];

const MODULES = [
  { title: 'Master Console',       desc: 'OBS-style studio for big-screen stream control.', path: '/admin',     icon: 'fa-tv',                color: '#0056B3' },
  { title: 'Tournament Architect', desc: 'Configure round rules & scoring logic.',           path: '/architect', icon: 'fa-wrench',            color: '#0056B3' },
  { title: 'Referee Panel',        desc: 'Simplified scoring engine for match officials.',    path: '/referee',   icon: 'fa-eye',               color: '#0056B3' },
  { title: 'Director Dashboard',   desc: 'Real-time overview of all courts & statuses.',    path: '/director',  icon: 'fa-tower-observation', color: '#0056B3' },
];

function TournamentCard({ t, selected, onClick }: { t: Tournament; selected: boolean; onClick: () => void }) {
  const meta = SPORT_META[t.sport_type] || SPORT_META.OTHER;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
        selected
          ? 'bg-[#0056B3]/15 border-[#0056B3]/50 shadow-[0_0_20px_rgba(0,86,179,0.2)]'
          : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${selected ? 'bg-[#0056B3]/20' : 'bg-white/5'}`}>
          {meta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-white text-sm uppercase tracking-tight truncate">{t.name}</div>
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
            {t.sport_type.replace(/_/g, ' ')} · {t.format === 'TIE_TEAM' ? 'Team Tie' : 'Individual'}
          </div>
        </div>
        {selected && <div className="w-2.5 h-2.5 rounded-full bg-[#0056B3] shadow-[0_0_8px_#0056B3] shrink-0" />}
      </div>
    </button>
  );
}

export default function ArenaHubRoot() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selected, setSelected] = useState<Tournament | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState(1);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [draft, setDraft] = useState({
    name: '',
    sport: 'PICKLEBALL',
    format: 'TIE_TEAM' as 'TIE_TEAM' | 'INDIVIDUAL',
    linked_project_id: '',
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: tours }, { data: projs }] = await Promise.all([
      supabase.from('arena_tournaments').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name, type').order('name'),
    ]);
    if (tours) { setTournaments(tours as Tournament[]); if (tours.length > 0) setSelected(tours[0] as Tournament); }
    if (projs) setProjects(projs as Project[]);
    setLoading(false);
  };

  const handleCreate = async () => {
    setErrorMsg('');
    if (!draft.name.trim()) return;
    setCreating(true);
    const slug = draft.name.toUpperCase().replace(/\s+/g, '_') + '_' + Math.floor(Math.random() * 9000 + 1000);
    const { data, error } = await supabase.from('arena_tournaments')
      .insert([{ name: draft.name.trim(), sport_type: draft.sport, event_id_slug: slug, format: draft.format, linked_project_id: draft.linked_project_id || null }])
      .select().single();
    if (data) {
      const t = data as Tournament;
      setTournaments([t, ...tournaments]);
      setSelected(t);
      setIsCreating(false);
      setStep(1);
      setDraft({ name: '', sport: 'PICKLEBALL', format: 'TIE_TEAM', linked_project_id: '' });
    } else if (error) setErrorMsg('Deployment Failed: ' + error.message);
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!selected) return;
    const ok = window.confirm(`WARNING: Terminate "${selected.name}"? All matches and logs will be erased.`);
    if (!ok) return;
    setDeleting(true);
    const { error } = await supabase.from('arena_tournaments').delete().eq('id', selected.id);
    if (error) { setErrorMsg('Termination failed: ' + error.message); }
    else {
      const updated = tournaments.filter(t => t.id !== selected.id);
      setTournaments(updated);
      setSelected(updated.length > 0 ? updated[0] : null);
    }
    setDeleting(false);
  };

  const linkedProject = projects.find(p => p.id === selected?.linked_project_id);
  const selectedMeta = selected ? (SPORT_META[selected.sport_type] || SPORT_META.OTHER) : null;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-['Inter'] overflow-x-hidden">
      {/* Ambient bg */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(0,86,179,0.07),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(0,86,179,0.05),transparent_60%)]" />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)', backgroundSize: '80px 80px' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-20">

        {/* Header */}
        <header className="mb-16 text-center">
          <Link href="/projects" className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-zinc-700 hover:text-white transition-colors tracking-widest mb-8 group">
            <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform" />
            Event OS
          </Link>
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-5 mb-5">
            <div className="w-14 h-14 bg-[#0056B3] rounded-2xl flex items-center justify-center text-2xl shadow-[0_0_40px_rgba(0,86,179,0.5)]">
              <i className="fa-solid fa-atom" style={{ animation: 'spin 8s linear infinite' }} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight font-['Urbanist'] italic leading-none">
              Arena <span className="text-zinc-600">Command</span>
            </h1>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="text-[#0056B3] tracking-[0.4em] text-[10px] font-black uppercase">
            Production Orchestration · Competitive Sports
          </motion.p>
        </header>

        {/* Error Toast */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-[10px] font-black uppercase tracking-widest">
              <i className="fa-solid fa-triangle-exclamation" />
              {errorMsg}
              <button onClick={() => setErrorMsg('')} className="ml-auto hover:text-white">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Layout: Left = Tournament List, Right = Module Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">

          {/* LEFT PANEL: Tournament Selector */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Active Arenas</span>
              <button
                onClick={() => { setIsCreating(!isCreating); setStep(1); }}
                className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border transition-all ${isCreating ? 'border-white/10 text-zinc-400 hover:bg-white/5' : 'border-[#0056B3]/40 text-[#4da3ff] hover:bg-[#0056B3]/10'}`}
              >
                {isCreating ? '✕ Cancel' : '+ New Arena'}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {isCreating ? (
                <motion.div key="create-form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="bg-white/[0.03] border border-white/8 rounded-3xl p-6 space-y-5">
                  {/* Step indicator */}
                  <div className="flex items-center gap-2 mb-2">
                    {[1, 2, 3].map(s => (
                      <React.Fragment key={s}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${step >= s ? 'bg-[#0056B3] text-white shadow-[0_0_10px_rgba(0,86,179,0.5)]' : 'bg-white/5 text-zinc-600'}`}>{s}</div>
                        {s < 3 && <div className={`flex-1 h-px transition-all ${step > s ? 'bg-[#0056B3]/50' : 'bg-white/5'}`} />}
                      </React.Fragment>
                    ))}
                  </div>

                  {step === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div>
                        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2 block">Tournament Name</label>
                        <input autoFocus type="text" value={draft.name}
                          onChange={e => setDraft(p => ({ ...p, name: e.target.value.toUpperCase() }))}
                          onKeyDown={e => e.key === 'Enter' && draft.name.trim() && setStep(2)}
                          placeholder="E.G. BINTULU OPEN 2026..."
                          className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 font-black text-xs uppercase tracking-widest focus:outline-none focus:border-[#0056B3]/50 transition-all placeholder-zinc-800" />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2 block">Sport</label>
                        <div className="grid grid-cols-3 gap-2">
                          {SPORTS.slice(0, 9).map(s => (
                            <button key={s.id} onClick={() => setDraft(p => ({ ...p, sport: s.id }))}
                              className={`p-3 rounded-xl border text-center transition-all ${draft.sport === s.id ? 'border-[#0056B3]/50 bg-[#0056B3]/10' : 'border-white/5 bg-white/[0.02] hover:border-white/10'}`}>
                              <div className="text-lg mb-1">{s.icon}</div>
                              <div className="text-[8px] font-black uppercase text-zinc-500">{s.name.split(' ')[0]}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => draft.name.trim() && setStep(2)} disabled={!draft.name.trim()}
                        className="w-full py-3 bg-[#0056B3] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all disabled:opacity-30">
                        Next →
                      </button>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2 block">Format</label>
                      {FORMAT_OPTIONS.map(opt => (
                        <button key={opt.id} onClick={() => setDraft(p => ({ ...p, format: opt.id as any }))}
                          className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${draft.format === opt.id ? 'border-[#0056B3] bg-[#0056B3]/10' : 'border-white/5 hover:border-white/10'}`}>
                          <i className={`fa-solid ${opt.icon} text-[#4da3ff] mb-2 block text-lg`} />
                          <div className="font-black text-xs text-white uppercase tracking-widest">{opt.label}</div>
                          <div className="text-[9px] text-zinc-600 uppercase mt-0.5">{opt.sub}</div>
                        </button>
                      ))}
                      <div className="flex gap-2">
                        <button onClick={() => setStep(1)} className="px-5 py-3 border border-white/5 rounded-xl text-[10px] font-black text-zinc-500 hover:text-white transition-all">← Back</button>
                        <button onClick={() => setStep(3)} className="flex-1 py-3 bg-[#0056B3] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all">Next →</button>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2 block">Link OS Project (Optional)</label>
                      <select value={draft.linked_project_id} onChange={e => setDraft(p => ({ ...p, linked_project_id: e.target.value }))}
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 font-black text-[10px] uppercase tracking-widest focus:outline-none focus:border-[#0056B3]/50 transition-all text-white">
                        <option value="">— No Link —</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                      </select>
                      {/* Summary */}
                      <div className="p-4 bg-black/30 rounded-xl border border-white/5 space-y-2">
                        <div className="text-[9px] text-zinc-600 uppercase tracking-widest font-black mb-3">Deployment Summary</div>
                        <div className="flex justify-between text-xs"><span className="text-zinc-500">Name</span><span className="font-black text-white">{draft.name}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-zinc-500">Sport</span><span className="font-black text-white">{draft.sport}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-zinc-500">Format</span><span className="font-black text-white">{draft.format}</span></div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setStep(2)} className="px-5 py-3 border border-white/5 rounded-xl text-[10px] font-black text-zinc-500 hover:text-white transition-all">← Back</button>
                        <button onClick={handleCreate} disabled={creating}
                          className="flex-1 py-3 bg-white text-black rounded-xl font-black text-xs uppercase tracking-[0.3em] hover:bg-zinc-200 transition-all disabled:opacity-30 flex items-center justify-center gap-2">
                          {creating ? <><i className="fa-solid fa-spinner fa-spin" /> Deploying...</> : '🚀 Deploy Arena'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="tournament-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-20 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse" />
                    ))
                  ) : tournaments.length === 0 ? (
                    <div className="py-12 text-center border border-white/5 rounded-2xl">
                      <i className="fa-solid fa-inbox text-3xl text-zinc-700 mb-3 block" />
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">No arenas deployed</p>
                      <p className="text-[9px] text-zinc-700 mt-1">Click "+ New Arena" to get started</p>
                    </div>
                  ) : (
                    tournaments.map(t => (
                      <TournamentCard key={t.id} t={t} selected={selected?.id === t.id} onClick={() => setSelected(t)} />
                    ))
                  )}

                  {/* Delete button */}
                  {selected && !loading && (
                    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      onClick={handleDelete} disabled={deleting}
                      className="w-full mt-2 py-2.5 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/5 transition-all flex items-center justify-center gap-2 disabled:opacity-30">
                      <i className={`fa-solid ${deleting ? 'fa-spinner fa-spin' : 'fa-trash'}`} />
                      Terminate Selected
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* RIGHT PANEL: Selected Tournament Info + Modules */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-6">

            {/* Tournament Header Card */}
            <AnimatePresence mode="wait">
              {selected && selectedMeta ? (
                <motion.div key={selected.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="p-6 bg-white/[0.03] border border-white/8 rounded-3xl relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 text-8xl opacity-[0.04] select-none">{selectedMeta.icon}</div>
                  <div className="relative z-10">
                    <div className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-3">Active Deployment</div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-3">{selected.name}</h2>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full bg-[#0056B3]/15 border border-[#0056B3]/30 text-[#4da3ff] text-[9px] font-black uppercase tracking-widest">
                        {selectedMeta.icon} {selected.sport_type.replace(/_/g, ' ')}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-zinc-500 text-[9px] font-black uppercase tracking-widest">
                        {selected.format === 'TIE_TEAM' ? '👥 Team Tie' : '🏃 Individual'}
                      </span>
                      {linkedProject && (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                          <i className="fa-solid fa-link mr-1" />{linkedProject.name}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : !loading && !isCreating ? (
                <motion.div key="no-sel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 border border-white/5 rounded-3xl text-center">
                  <i className="fa-solid fa-lock text-2xl text-zinc-700 mb-3 block" />
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Select or deploy an arena to activate modules</p>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* Module Grid */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all ${!selected ? 'opacity-30 pointer-events-none' : ''}`}>
              {MODULES.map((mod, idx) => (
                <motion.div key={mod.title} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 * idx }}>
                  <Link
                    href={selected ? `/arena/${selected.id}${mod.path}` : '#'}
                    className="group block p-6 bg-white/[0.03] border border-white/5 rounded-2xl hover:border-[#0056B3]/40 hover:bg-[#0056B3]/5 transition-all duration-500 relative overflow-hidden">
                    <div className="absolute -right-3 -bottom-3 opacity-[0.04] text-6xl transition-all duration-700 group-hover:scale-125 group-hover:-rotate-6 text-[#4da3ff]">
                      <i className={`fa-solid ${mod.icon}`} />
                    </div>
                    <div className="relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-[#0056B3]/10 text-[#4da3ff] flex items-center justify-center mb-4 group-hover:shadow-[0_0_20px_rgba(0,86,179,0.3)] transition-all">
                        <i className={`fa-solid ${mod.icon}`} />
                      </div>
                      <h3 className="font-black text-white text-sm uppercase tracking-tight mb-1">{mod.title}</h3>
                      <p className="text-[10px] text-zinc-600 font-bold leading-relaxed">{mod.desc}</p>
                      <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-zinc-700 group-hover:text-[#4da3ff] transition-colors uppercase tracking-widest">
                        <span>Execute</span>
                        <i className="fa-solid fa-arrow-right-long group-hover:translate-x-2 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Screen Shortcut */}
            {selected && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <Link href={`/arena/${selected.id}/screen`}
                  className="flex items-center justify-between px-6 py-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-[#0056B3]/30 hover:bg-[#0056B3]/5 transition-all group">
                  <div className="flex items-center gap-3">
                    <i className="fa-solid fa-display text-[#0056B3]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-[#4da3ff] transition-colors">Arena Display Screen</span>
                  </div>
                  <i className="fa-solid fa-arrow-right text-zinc-700 group-hover:text-[#4da3ff] group-hover:translate-x-1 transition-all text-xs" />
                </Link>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
