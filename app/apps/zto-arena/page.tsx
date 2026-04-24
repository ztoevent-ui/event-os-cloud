'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

const modules = [
  { title: 'Master Console',       desc: 'OBS-style studio for direct big-screen stream control.', path: '/admin',     icon: 'fa-tv',     bg: 'bg-amber-500/10',    text: 'text-amber-400',    borderBase: 'border-amber-500/10',    borderHover: 'hover:border-amber-500/40' },
  { title: 'Tournament Architect', desc: 'Configure round rules, tie templates & scoring logic.', path: '/architect', icon: 'fa-wrench', bg: 'bg-violet-500/10', text: 'text-violet-400', borderBase: 'border-violet-500/10', borderHover: 'hover:border-violet-500/40' },
  { title: 'Referee Panel',        desc: 'Simplified scoring engine for match officials.',       path: '/referee',   icon: 'fa-eye',    bg: 'bg-blue-500/10',   text: 'text-blue-400',   borderBase: 'border-blue-500/10',   borderHover: 'hover:border-blue-500/40'   },
  { title: 'Director Dashboard',   desc: 'Real-time overview of all courts & match statuses.',  path: '/director',  icon: 'fa-tower-observation', bg: 'bg-rose-500/10', text: 'text-rose-400', borderBase: 'border-rose-500/10', borderHover: 'hover:border-rose-500/40' },
];

const SPORTS = [
  { id: 'PICKLEBALL', name: 'Pickleball', icon: '🏓' },
  { id: 'BADMINTON',  name: 'Badminton',  icon: '🏸' },
  { id: 'BASKETBALL', name: 'Basketball', icon: '🏀' },
  { id: 'FUTSAL',     name: 'Futsal',     icon: '⚽' },
  { id: 'ARCHERY',    name: 'Archery',    icon: '🎯' },
  { id: 'OTHER',      name: 'Other',      icon: '🏅' },
];

const FORMAT_OPTIONS = [
  {
    id: 'TIE_TEAM',
    label: 'Team Tie',
    sub: 'Thomas Cup / Corporate Cup style',
    icon: 'fa-people-group',
    color: 'violet',
  },
  {
    id: 'INDIVIDUAL',
    label: 'Individual Events',
    sub: 'Singles, Doubles, or Mixed brackets',
    icon: 'fa-person-running',
    color: 'sky',
  },
];

export default function ArenaHubRoot() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [draft, setDraft] = useState({
    name: '',
    sport: 'PICKLEBALL',
    format: 'TIE_TEAM' as 'TIE_TEAM' | 'INDIVIDUAL',
    linked_project_id: '' as string,
  });
  const [creating, setCreating] = useState(false);

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
      setTournaments(tours);
      if (tours.length > 0) setSelectedTournament(tours[0]);
    }
    if (projs) setProjects(projs);
    setLoading(false);
  };

  const handleCreate = async () => {
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
      setTournaments([data, ...tournaments]);
      setSelectedTournament(data);
      setIsCreating(false);
      setDraft({ name: '', sport: 'PICKLEBALL', format: 'TIE_TEAM', linked_project_id: '' });
    } else if (error) {
      alert('Create failed: ' + error.message);
    }
    setCreating(false);
  };

  const linkedProject = projects.find(p => p.id === selectedTournament?.linked_project_id);

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 md:p-12 flex flex-col items-center justify-center relative overflow-x-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.05),transparent_70%)] pointer-events-none" />

      <div className="max-w-4xl w-full z-10">
        {/* Header */}
        <header className="mb-12 text-center relative">
          <Link href="/projects" className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[10px] font-black uppercase text-zinc-600 hover:text-white transition-colors tracking-widest group">
            <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform" />
            Back to OS
          </Link>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-4 mb-4">
            <div className="w-12 h-12 bg-amber-500 text-black rounded-2xl flex items-center justify-center text-2xl shadow-[0_0_30px_rgba(245,158,11,0.3)]">
              <i className="fa-solid fa-trophy" />
            </div>
            <h1 className="text-4xl font-black uppercase tracking-[0.2em] italic">Arena Hub</h1>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-zinc-500 tracking-widest text-[10px] font-black uppercase">
            Central orchestration for all tournament projects
          </motion.p>
        </header>

        {/* Tournament Selector / Creator */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 p-8 bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <i className="fa-solid fa-layer-group text-8xl" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Tournament</label>
              <button onClick={() => setIsCreating(!isCreating)}
                className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isCreating ? 'text-zinc-500 hover:text-white' : 'text-amber-500 hover:text-amber-400'}`}>
                {isCreating ? '✕ Cancel' : '+ New Tournament'}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {/* ——— CREATE FORM ——— */}
              {isCreating ? (
                <motion.div key="create" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  {/* Name + Sport */}
                  <div className="flex gap-3">
                    <input autoFocus type="text" value={draft.name}
                      onChange={(e) => setDraft(p => ({ ...p, name: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                      placeholder="Tournament name..."
                      className="flex-1 bg-black/50 border border-amber-500/20 rounded-2xl px-5 py-4 font-bold text-sm focus:outline-none focus:border-amber-500 transition-all placeholder-zinc-700" />
                    <select value={draft.sport} onChange={(e) => setDraft(p => ({ ...p, sport: e.target.value }))}
                      className="bg-black/50 border border-amber-500/20 rounded-2xl px-4 py-4 font-black text-xs uppercase tracking-widest focus:outline-none focus:border-amber-500 cursor-pointer">
                      {SPORTS.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                    </select>
                  </div>

                  {/* Format Toggle */}
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Tournament Format</label>
                    <div className="grid grid-cols-2 gap-3">
                      {FORMAT_OPTIONS.map(opt => (
                        <button key={opt.id} onClick={() => setDraft(p => ({ ...p, format: opt.id as any }))}
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${
                            draft.format === opt.id
                              ? opt.id === 'TIE_TEAM'
                                ? 'border-violet-500 bg-violet-500/10'
                                : 'border-sky-500 bg-sky-500/10'
                              : 'border-white/10 hover:border-white/20'
                          }`}>
                          <div className={`text-lg mb-1 ${draft.format === opt.id ? (opt.id === 'TIE_TEAM' ? 'text-violet-400' : 'text-sky-400') : 'text-zinc-600'}`}>
                            <i className={`fa-solid ${opt.icon}`} />
                          </div>
                          <div className="font-black text-sm text-white">{opt.label}</div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">{opt.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Link Registration Project */}
                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                      Link Registration Project <span className="text-zinc-700">(optional)</span>
                    </label>
                    <select value={draft.linked_project_id} onChange={(e) => setDraft(p => ({ ...p, linked_project_id: e.target.value }))}
                      className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 font-bold text-sm focus:outline-none focus:border-amber-500 transition-all cursor-pointer text-white">
                      <option value="">— No project linked —</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
                    </select>
                    {draft.linked_project_id && (
                      <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mt-2">
                        <i className="fa-solid fa-link mr-1" /> Registered participants will auto-populate as tournament teams.
                      </p>
                    )}
                  </div>

                  <button onClick={handleCreate} disabled={!draft.name.trim() || creating}
                    className="w-full py-4 bg-amber-500 text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-400 transition-all disabled:opacity-50">
                    {creating ? <><i className="fa-solid fa-spinner fa-spin mr-2" />Creating...</> : 'Initialize Tournament'}
                  </button>
                </motion.div>
              ) : (
                /* ——— SELECT ——— */
                <motion.div key="select" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                  <select value={selectedTournament?.id || ''}
                    onChange={(e) => setSelectedTournament(tournaments.find(t => t.id === e.target.value))}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 font-bold text-sm focus:outline-none focus:border-amber-500 transition-all appearance-none cursor-pointer">
                    {loading ? <option>Loading...</option> :
                     tournaments.length === 0 ? <option>No tournaments — create one above</option> :
                     tournaments.map(t => (
                       <option key={t.id} value={t.id}>
                         {t.name} • {t.sport_type} • {t.format === 'TIE_TEAM' ? 'Team Tie' : 'Individual'}
                       </option>
                     ))}
                  </select>

                  {/* Selected tournament meta */}
                  {selectedTournament && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex flex-wrap items-center gap-3">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                        selectedTournament.format === 'TIE_TEAM'
                          ? 'border-violet-500/30 bg-violet-500/10 text-violet-400'
                          : 'border-sky-500/30 bg-sky-500/10 text-sky-400'
                      }`}>
                        <i className={`fa-solid ${selectedTournament.format === 'TIE_TEAM' ? 'fa-people-group' : 'fa-person-running'} mr-1`} />
                        {selectedTournament.format === 'TIE_TEAM' ? 'Team Tie' : 'Individual Events'}
                      </span>
                      {selectedTournament.has_third_place && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400">
                          <i className="fa-solid fa-medal mr-1" />3rd Place Playoff
                        </span>
                      )}
                      {linkedProject && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                          <i className="fa-solid fa-link mr-1" />Linked: {linkedProject.name}
                        </span>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((mod, idx) => (
            <motion.div key={mod.title} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * idx }}>
              <Link
                href={selectedTournament ? `/arena/${selectedTournament.id}${mod.path}` : '#'}
                className={`group block p-8 bg-zinc-900/40 backdrop-blur-xl border ${mod.borderBase} rounded-[2.5rem] ${mod.borderHover} transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden ${!selectedTournament ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                <div className={`absolute -right-4 -bottom-4 opacity-5 text-8xl transition-transform duration-700 group-hover:scale-125 group-hover:rotate-12 ${mod.text}`}>
                  <i className={`fa-solid ${mod.icon}`} />
                </div>
                <div className={`w-14 h-14 ${mod.bg} ${mod.text} rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform`}>
                  <i className={`fa-solid ${mod.icon}`} />
                </div>
                <h3 className="text-xl font-bold mb-2 text-zinc-100 group-hover:text-white transition-colors">{mod.title}</h3>
                <p className="text-zinc-500 text-[11px] font-medium leading-relaxed uppercase tracking-wider">{mod.desc}</p>
                <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-zinc-300 transition-colors">
                  <span>Enter</span>
                  <i className="fa-solid fa-arrow-right-long transition-transform group-hover:translate-x-2" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Screen Shortcut */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-12 text-center">
          <Link href="/apps/zto-arena/screen"
            className="inline-flex items-center gap-3 px-6 py-3 bg-zinc-900 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:border-amber-500/20 transition-all">
            <i className="fa-solid fa-display text-amber-500" />
            Public Screen Picker
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
