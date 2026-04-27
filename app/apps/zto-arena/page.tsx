'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

// --- Interfaces ---
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

const modules = [
  { title: 'Master Console',       desc: 'OBS-style studio for direct big-screen stream control.', path: '/admin',     icon: 'fa-tv',     bg: 'bg-[#0056B3]/10',    text: 'text-[#4da3ff]',    borderBase: 'border-white/5',    borderHover: 'hover:border-[#0056B3]/40' },
  { title: 'Tournament Architect', desc: 'Configure round rules, tie templates & scoring logic.', path: '/architect', icon: 'fa-wrench', bg: 'bg-[#0056B3]/10', text: 'text-[#4da3ff]', borderBase: 'border-white/5', borderHover: 'hover:border-[#0056B3]/40' },
  { title: 'Referee Panel',        desc: 'Simplified scoring engine for match officials.',       path: '/referee',   icon: 'fa-eye',    bg: 'bg-[#0056B3]/10',   text: 'text-[#4da3ff]',   borderBase: 'border-white/5',   borderHover: 'hover:border-[#0056B3]/40'   },
  { title: 'Director Dashboard',   desc: 'Real-time overview of all courts & match statuses.',  path: '/director',  icon: 'fa-tower-observation', bg: 'bg-[#0056B3]/10', text: 'text-[#4da3ff]', borderBase: 'border-white/5', borderHover: 'hover:border-[#0056B3]/40' },
];

const SPORTS = [
  { id: 'PICKLEBALL', name: 'Pickleball', icon: '🏓' },
  { id: 'BADMINTON',  name: 'Badminton',  icon: '🏸' },
  { id: 'BASKETBALL', name: 'Basketball', icon: '🏀' },
  { id: 'FUTSAL',     name: 'Futsal',     icon: '⚽' },
  { id: 'TENNIS',     name: 'Tennis',     icon: '🎾' },
  { id: 'VOLLEYBALL', name: 'Volleyball', icon: '🏐' },
  { id: 'TABLE_TENNIS', name: 'Table Tennis', icon: '🏓' },
  { id: 'ARCHERY',    name: 'Archery',    icon: '🎯' },
  { id: 'OTHER',      name: 'Other',      icon: '🏅' },
];

const FORMAT_OPTIONS = [
  {
    id: 'TIE_TEAM',
    label: 'Team Tie',
    sub: 'Thomas Cup / Corporate Cup style',
    icon: 'fa-people-group',
    color: '#0056B3',
  },
  {
    id: 'INDIVIDUAL',
    label: 'Individual Events',
    sub: 'Singles, Doubles, or Mixed brackets',
    icon: 'fa-person-running',
    color: '#0056B3',
  },
];

export default function ArenaHubRoot() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [draft, setDraft] = useState({
    name: '',
    sport: 'PICKLEBALL',
    format: 'TIE_TEAM' as 'TIE_TEAM' | 'INDIVIDUAL',
    linked_project_id: '' as string,
  });
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: tours }, { data: projs }] = await Promise.all([
      supabase.from('arena_tournaments').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name, type').order('name'),
    ]);
    if (tours) {
      setTournaments(tours as Tournament[]);
      if (tours.length > 0) setSelectedTournament(tours[0] as Tournament);
    }
    if (projs) setProjects(projs as Project[]);
    setLoading(false);
  };

  const handleCreate = async () => {
    setErrorMsg('');
    if (!draft.name.trim()) return;
    setCreating(true);
    const slug = draft.name.toUpperCase().replace(/\s+/g, '_') + '_' + Math.floor(Math.random() * 9000 + 1000);

    const { data, error } = await supabase
      .from('arena_tournaments')
      .insert([{
        name: draft.name.trim(),
        sport_type: draft.sport,
        event_id_slug: slug,
        format: draft.format,
        linked_project_id: draft.linked_project_id || null,
      }])
      .select()
      .single();

    if (data) {
      const newTournament = data as Tournament;
      setTournaments([newTournament, ...tournaments]);
      setSelectedTournament(newTournament);
      setIsCreating(false);
      setDraft({ name: '', sport: 'PICKLEBALL', format: 'TIE_TEAM', linked_project_id: '' });
    } else if (error) {
      setErrorMsg('Deployment Failed: ' + error.message);
    }
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!selectedTournament) return;
    const confirm = window.confirm(`WARNING: Terminating arena "${selectedTournament.name}" will permanently erase all matches, teams, and logs. Proceed?`);
    if (!confirm) return;

    setDeleting(true);
    const { error } = await supabase.from('arena_tournaments').delete().eq('id', selectedTournament.id);
    if (error) {
      setErrorMsg('Termination failed: ' + error.message);
    } else {
      const updated = tournaments.filter(t => t.id !== selectedTournament.id);
      setTournaments(updated);
      setSelectedTournament(updated.length > 0 ? updated[0] : null);
    }
    setDeleting(false);
  };

  const linkedProject = projects.find(p => p.id === selectedTournament?.linked_project_id);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-['Inter'] p-6 md:p-12 flex flex-col items-center justify-center relative overflow-x-hidden">
      {/* Background - Animated Pulse */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,86,179,0.08),transparent_70%)] pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />

      <div className="max-w-4xl w-full z-10 animate-in fade-in duration-1000">
        {/* Header */}
        <header className="mb-20 text-center relative">
          <Link href="/projects" className="absolute left-0 top-1/2 -translate-y-1/2 items-center gap-2 text-[10px] font-black uppercase text-zinc-600 hover:text-white transition-colors tracking-widest group hidden md:flex">
            <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform" />
            Back to OS
          </Link>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-6 mb-6">
            <div className="w-16 h-16 bg-[#0056B3] text-white rounded-[24px] flex items-center justify-center text-3xl shadow-[0_0_40px_rgba(0,86,179,0.4)]">
              <i className="fa-solid fa-atom animate-spin-slow" />
            </div>
            <h1 className="text-5xl font-black uppercase tracking-tight italic font-['Urbanist'] leading-none">
              Arena <span className="text-zinc-600 font-black">Command</span>
            </h1>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-[#0056B3] tracking-[0.4em] text-[10px] font-black uppercase">
            Production Orchestration for Competitive Sports
          </motion.p>
        </header>

        {/* Error Toast */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-[10px] font-black uppercase tracking-widest">
              <i className="fa-solid fa-triangle-exclamation" />
              {errorMsg}
              <button onClick={() => setErrorMsg('')} className="ml-auto hover:text-white transition-colors">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tournament Selector / Creator */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 p-10 bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-[48px] relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
            <i className="fa-solid fa-chess-board text-[12rem]" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Active Deployment</label>
              <button onClick={() => setIsCreating(!isCreating)}
                className={`text-[10px] font-black uppercase tracking-widest transition-colors px-4 py-2 rounded-full border ${isCreating ? 'text-white border-white/10 hover:bg-white/5' : 'text-[#4da3ff] border-[#0056B3]/30 hover:bg-[#0056B3]/10'}`}>
                {isCreating ? '✕ Cancel' : '+ New Arena'}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {/* ——— CREATE FORM ——— */}
              {isCreating ? (
                <motion.div key="create" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                  {/* Name + Sport */}
                  <div className="flex gap-4">
                    <input autoFocus type="text" value={draft.name}
                      onChange={(e) => setDraft(p => ({ ...p, name: e.target.value.toUpperCase() }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                      placeholder="TOURNAMENT CODNAME..."
                      className="flex-1 bg-black/40 border border-white/5 rounded-2xl px-6 py-5 font-black text-xs uppercase tracking-widest focus:outline-none focus:border-[#0056B3]/40 transition-all placeholder-zinc-800" />
                    <select value={draft.sport} onChange={(e) => setDraft(p => ({ ...p, sport: e.target.value }))}
                      className="bg-black/40 border border-white/5 rounded-2xl px-6 py-5 font-black text-[10px] uppercase tracking-[0.2em] focus:outline-none focus:border-[#0056B3]/40 cursor-pointer text-white">
                      {SPORTS.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name.toUpperCase()}</option>)}
                    </select>
                  </div>

                  {/* Format Toggle */}
                  <div className="grid grid-cols-2 gap-4">
                    {FORMAT_OPTIONS.map(opt => (
                      <button key={opt.id} onClick={() => setDraft(p => ({ ...p, format: opt.id as 'TIE_TEAM' | 'INDIVIDUAL' }))}
                        className={`p-8 rounded-[32px] border-2 text-left transition-all relative overflow-hidden group ${
                          draft.format === opt.id
                            ? 'border-[#0056B3] bg-[#0056B3]/10'
                            : 'border-white/5 bg-black/20 hover:border-white/10'
                        }`}>
                        <div className={`text-2xl mb-4 ${draft.format === opt.id ? 'text-[#4da3ff]' : 'text-zinc-700'} group-hover:scale-110 transition-transform`}>
                          <i className={`fa-solid ${opt.icon}`} />
                        </div>
                        <div className="font-black text-xs text-white uppercase tracking-widest mb-1">{opt.label}</div>
                        <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-tight leading-tight">{opt.sub}</div>
                      </button>
                    ))}
                  </div>

                  {/* Link Registration Project */}
                  <div className="flex flex-col gap-4">
                    <label className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">
                      Bridge Data <span className="text-zinc-800 ml-2">(PROJECT OVERRIDE)</span>
                    </label>
                    <select value={draft.linked_project_id} onChange={(e) => setDraft(p => ({ ...p, linked_project_id: e.target.value }))}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-5 font-black text-[10px] uppercase tracking-widest focus:outline-none focus:border-[#0056B3]/40 transition-all cursor-pointer text-white">
                      <option value="">— NULL SELECTION —</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()} [{p.type.toUpperCase()}]</option>)}
                    </select>
                  </div>

                  <button onClick={handleCreate} disabled={!draft.name.trim() || creating}
                    className="w-full py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.4em] hover:bg-zinc-200 transition-all disabled:opacity-20 shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3">
                    {creating ? <><i className="fa-solid fa-spinner fa-spin" /> Deploying Protocol...</> : 'Deploy Arena'}
                  </button>
                </motion.div>
              ) : (
                /* ——— SELECT ——— */
                <motion.div key="select" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                  <div className="flex gap-4 items-center">
                    <div className="relative group flex-1">
                      {loading ? (
                        <div className="w-full h-[64px] bg-black/60 border border-white/5 rounded-2xl px-8 flex items-center">
                          <div className="h-4 w-48 bg-zinc-800 rounded animate-pulse"></div>
                        </div>
                      ) : (
                        <select value={selectedTournament?.id || ''}
                          onChange={(e) => setSelectedTournament(tournaments.find(t => t.id === e.target.value) || null)}
                          className="w-full h-[64px] bg-black/60 border border-white/5 rounded-2xl px-8 py-6 font-black text-xs uppercase tracking-[0.2em] focus:outline-none focus:border-[#0056B3]/40 transition-all appearance-none cursor-pointer text-white">
                          {tournaments.length === 0 ? <option>NULL REGISTRY — INITIALIZE FIRST</option> :
                          tournaments.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.name} • {t.sport_type} • {t.format === 'TIE_TEAM' ? 'TEAM TIE' : 'INDIVIDUAL'}
                            </option>
                          ))}
                        </select>
                      )}
                      {!loading && (
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-[#0056B3]">
                            <i className="fa-solid fa-chevron-down text-xs" />
                        </div>
                      )}
                    </div>
                    {/* Delete Button */}
                    {!loading && selectedTournament && (
                      <button 
                        onClick={handleDelete}
                        disabled={deleting}
                        className="h-[64px] px-6 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all flex items-center justify-center disabled:opacity-50"
                        title="Terminate Protocol"
                      >
                        <i className={`fa-solid ${deleting ? 'fa-spinner fa-spin' : 'fa-power-off'}`}></i>
                      </button>
                    )}
                  </div>

                  {/* Selected tournament meta */}
                  {selectedTournament && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 flex flex-wrap items-center gap-3">
                      <div className="px-4 py-2 rounded-full border border-[#0056B3]/20 bg-[#0056B3]/10 text-[#4da3ff] text-[9px] font-black uppercase tracking-[0.2em]">
                        <i className={`fa-solid ${selectedTournament.format === 'TIE_TEAM' ? 'fa-people-group' : 'fa-person-running'} mr-2`} />
                        {selectedTournament.format === 'TIE_TEAM' ? 'Team Tie Matrix' : 'Individual Brackets'}
                      </div>
                      {selectedTournament.has_third_place && (
                        <div className="px-4 py-2 rounded-full border border-white/5 bg-white/[0.03] text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em]">
                          <i className="fa-solid fa-medal mr-2" />Bronze Playoff Included
                        </div>
                      )}
                      {linkedProject && (
                        <div className="px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em]">
                          <i className="fa-solid fa-link mr-2" />OS BRIDGE: {linkedProject.name}
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Module Grid */}
        <div className="relative">
          {/* Overlay when no tournament is selected */}
          {!selectedTournament && !loading && !isCreating && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-sm bg-black/40 rounded-[40px] border border-white/5">
                <i className="fa-solid fa-lock text-3xl text-zinc-600 mb-4"></i>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Deploy or Select an Arena to Unlock Modules</p>
             </motion.div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((mod, idx) => (
              <motion.div key={mod.title} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * idx }}>
                <Link
                  href={selectedTournament ? `/arena/${selectedTournament.id}${mod.path}` : '#'}
                  className={`group block p-10 bg-white/[0.03] backdrop-blur-2xl border ${mod.borderBase} rounded-[40px] ${mod.borderHover} transition-all duration-700 relative overflow-hidden ${!selectedTournament ? 'opacity-20 pointer-events-none' : ''}`}>
                  
                  <div className={`absolute -right-6 -bottom-6 opacity-[0.03] text-9xl transition-all duration-1000 group-hover:scale-150 group-hover:-rotate-12 ${mod.text}`}>
                    <i className={`fa-solid ${mod.icon}`} />
                  </div>

                  <div className="flex items-center gap-6 mb-8">
                      <div className={`w-16 h-16 ${mod.bg} ${mod.text} rounded-[20px] flex items-center justify-center text-2xl group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(0,86,179,0.3)] transition-all duration-500`}>
                        <i className={`fa-solid ${mod.icon}`} />
                      </div>
                      <div>
                          <h3 className="text-xl font-black text-white uppercase tracking-tight font-['Urbanist'] mb-1">{mod.title}</h3>
                          <p className="text-[10px] font-black text-[#0056B3] uppercase tracking-[0.4em]">System Node</p>
                      </div>
                  </div>

                  <p className="text-zinc-600 text-[11px] font-bold leading-relaxed uppercase tracking-widest h-12">{mod.desc}</p>
                  
                  <div className="mt-10 flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700 group-hover:text-white transition-colors">
                          <span>Execute Protocol</span>
                          <i className="fa-solid fa-arrow-right-long transition-transform group-hover:translate-x-3" />
                      </div>
                      <div className="w-2 h-2 rounded-full bg-zinc-800 group-hover:bg-[#0056B3] group-hover:shadow-[0_0_10px_#0056B3] transition-all" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Screen Shortcut */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-20 text-center">
          <Link href="/apps/zto-arena/screen"
            className="inline-flex items-center gap-4 px-10 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 hover:text-[#4da3ff] hover:border-[#0056B3]/30 hover:bg-[#0056B3]/10 transition-all">
            <i className="fa-solid fa-display text-[#0056B3]" />
            Arena Display Registry
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
