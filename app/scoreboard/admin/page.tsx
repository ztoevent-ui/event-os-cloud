"use client";
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

// ─── Score Rules ────────────────────────────────────────────────────────────
const SCORE_RULES = {
  'A':      { label: 'Type A — Large Props',   scores: [100, 75, 50, 25] },
  'B_team': { label: 'Type B — Team Athletics', scores: [60, 40, 20, 10] },
  'B_ind':  { label: 'Type B — Individual',    scores: [30, 20, 10, 5] },
  'C':      { label: 'Type C — Tug of War',    scores: [200, 0, 0, 0] },
};
const ORDINALS = ['1ST', '2ND', '3RD', '4TH'];

// ─── Color Palette ───────────────────────────────────────────────────────────
const COLOR_PRESETS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
  '#f59e0b', '#06b6d4', '#a855f7', '#64748b',
];

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12 }}
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl backdrop-blur-xl border ${
        type === 'success'
          ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
          : 'bg-red-950/90 border-red-500/30 text-red-300'
      }`}
    >
      <span>{type === 'success' ? '✓' : '✕'}</span>
      {msg}
    </motion.div>
  );
}

// ─── Mini Scoreboard (right panel) ───────────────────────────────────────────
function MiniScoreboard({ teams, scores }: { teams: any[]; scores: any[] }) {
  const totals = teams
    .map(t => ({ ...t, total: scores.filter(s => s.team_id === t.id).reduce((a, s) => a + s.score, 0) }))
    .sort((a, b) => b.total - a.total);
  const max = Math.max(...totals.map(t => t.total), 1);

  return (
    <div className="flex flex-col gap-2.5">
      {totals.map((team, i) => (
        <div key={team.id} className="relative rounded-xl overflow-hidden border" style={{ borderColor: `${team.color_hex}20` }}>
          <div className="absolute inset-0 rounded-xl transition-all duration-700"
            style={{ width: `${Math.max((team.total / max) * 100, 3)}%`, background: `${team.color_hex}15` }} />
          <div className="relative z-10 flex items-center gap-3 px-4 py-3">
            <div className="w-1 h-8 rounded-full shrink-0" style={{ background: team.color_hex }} />
            <div className="flex-1 min-w-0">
              <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">#{i + 1}</div>
              <div className="text-sm font-black text-white uppercase tracking-tight truncate">{team.name}</div>
            </div>
            <div className="text-xl font-black tabular-nums" style={{ color: team.color_hex }}>{team.total.toLocaleString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function AdminScoreboard() {
  const [teams, setTeams] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'score' | 'teams' | 'event'>('score');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Score entry state
  const [selCat, setSelCat] = useState('');
  const [selTeam, setSelTeam] = useState('');
  const [selRank, setSelRank] = useState(0);

  // Team editing state  
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [teamDraft, setTeamDraft] = useState<Record<string, { name: string; color_hex: string }>>({});

  // Event config state
  const [configDraft, setConfigDraft] = useState<Record<string, string>>({});

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchAll = async () => {
    const [t, c, s, cfg] = await Promise.all([
      supabase.from('teams').select('*').order('name'),
      supabase.from('event_categories').select('*'),
      supabase.from('game_scores').select('*'),
      supabase.from('scoreboard_config').select('*'),
    ]);
    if (t.data) setTeams(t.data);
    if (c.data) setCategories(c.data);
    if (s.data) setScores(s.data);
    if (cfg.data) {
      const map: Record<string, string> = {};
      cfg.data.forEach((r: any) => { map[r.key] = r.value; });
      setConfig(map);
      setConfigDraft(map);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Score submission ──────────────────────────────────────────────────────
  const currentCat = categories.find(c => c.id === selCat);
  const ruleKey = currentCat?.event_type as keyof typeof SCORE_RULES | undefined;
  const rule = ruleKey ? SCORE_RULES[ruleKey] : null;
  const pts = rule?.scores[selRank] ?? 0;

  const handleAwardScore = async () => {
    if (!selCat || !selTeam) return showToast('error', 'Select a team and event first');
    setSubmitting(true);
    const { error } = await supabase.from('game_scores').insert([{ team_id: selTeam, category_id: selCat, score: pts }]);
    setSubmitting(false);
    if (error) return showToast('error', error.message);
    const { data } = await supabase.from('game_scores').select('*');
    if (data) setScores(data);
    showToast('success', `${teams.find(t => t.id === selTeam)?.name} +${pts} pts awarded`);
    setSelTeam('');
  };

  // ── Team editing ──────────────────────────────────────────────────────────
  const startEdit = (team: any) => {
    setEditingTeam(team.id);
    setTeamDraft(prev => ({ ...prev, [team.id]: { name: team.name, color_hex: team.color_hex } }));
  };

  const saveTeam = async (teamId: string) => {
    const draft = teamDraft[teamId];
    if (!draft) return;
    const { error } = await supabase.from('teams').update({ name: draft.name.trim(), color_hex: draft.color_hex }).eq('id', teamId);
    if (error) return showToast('error', error.message);
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, ...draft } : t));
    setEditingTeam(null);
    showToast('success', 'Team updated — broadcast synced');
  };

  const cancelEdit = () => { setEditingTeam(null); };

  // ── Event config saving ───────────────────────────────────────────────────
  const saveConfig = async () => {
    const updates = Object.entries(configDraft).map(([key, value]) =>
      supabase.from('scoreboard_config').upsert({ key, value, updated_at: new Date().toISOString() })
    );
    await Promise.all(updates);
    setConfig(configDraft);
    showToast('success', 'Event settings saved — broadcast updated');
  };

  const handleReset = async () => {
    if (!confirm('Reset ALL scores? This cannot be undone.')) return;
    await supabase.from('game_scores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    setScores([]);
    showToast('success', 'All scores cleared');
  };

  const TABS = [
    { key: 'score', label: 'Score Entry', icon: '🎯' },
    { key: 'teams', label: 'Teams',       icon: '🏳️' },
    { key: 'event', label: 'Event Setup', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast key="toast" msg={toast.msg} type={toast.type} />}
      </AnimatePresence>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#09090b]/95 backdrop-blur-xl px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/apps/zto-arena"
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white transition-all text-sm">
              ←
            </Link>
            <div>
              <p className="text-[9px] font-black tracking-[0.4em] text-zinc-600 uppercase">
                {config.organizer || 'Event OS'}
              </p>
              <h1 className="text-lg font-black text-white uppercase tracking-tight leading-tight">
                {config.event_title || 'Scoreboard'} — Admin
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/scoreboard/broadcast" target="_blank"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.08] text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all">
              📺 Broadcast
            </Link>
            <Link href="/scoreboard/public" target="_blank"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.08] text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all">
              📱 Public
            </Link>
          </div>
        </div>
      </header>

      {/* ── Tab Bar ────────────────────────────────────────────────────────── */}
      <div className="border-b border-white/[0.05] px-6">
        <div className="max-w-6xl mx-auto flex gap-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-2 px-5 py-3.5 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 -mb-px ${
                tab === t.key
                  ? 'border-white text-white'
                  : 'border-transparent text-zinc-600 hover:text-zinc-300'
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">

          {/* ══ TAB: SCORE ENTRY ══════════════════════════════════════════════ */}
          {tab === 'score' && (
            <motion.div key="score" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">

              {/* Left: Entry form */}
              <div className="space-y-8">

                {/* Step 1: Category */}
                <section>
                  <p className="text-[9px] font-black tracking-[0.4em] text-zinc-600 uppercase mb-4">
                    Step 1 — Select Event Category
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map(c => {
                      const r = SCORE_RULES[c.event_type as keyof typeof SCORE_RULES];
                      const active = selCat === c.id;
                      return (
                        <button key={c.id} onClick={() => { setSelCat(c.id); setSelRank(0); }}
                          className={`p-5 rounded-2xl border-2 text-left transition-all ${
                            active ? 'border-white bg-white/10' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                          }`}>
                          <div className="text-sm font-black text-white uppercase tracking-tight mb-1.5">{c.event_name}</div>
                          <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                            {r ? r.scores.filter(s => s > 0).join(' / ') + ' pts' : c.event_type}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Step 2: Team */}
                <section>
                  <p className="text-[9px] font-black tracking-[0.4em] text-zinc-600 uppercase mb-4">
                    Step 2 — Select Team
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {teams.map(t => {
                      const active = selTeam === t.id;
                      return (
                        <button key={t.id} onClick={() => setSelTeam(t.id)}
                          className="p-5 rounded-2xl border-2 text-left transition-all duration-200"
                          style={active ? {
                            borderColor: t.color_hex,
                            background: `${t.color_hex}18`,
                            boxShadow: `0 0 24px ${t.color_hex}25`,
                          } : {
                            borderColor: 'rgba(255,255,255,0.06)',
                            background: 'rgba(255,255,255,0.02)',
                          }}>
                          <div className="flex items-center gap-3 mb-1">
                            <div className="w-3.5 h-3.5 rounded-full shrink-0"
                              style={{ background: t.color_hex, boxShadow: active ? `0 0 10px ${t.color_hex}` : 'none' }} />
                            <span className="text-base font-black text-white uppercase tracking-tight">{t.name}</span>
                          </div>
                          {scores.filter(s => s.team_id === t.id).length > 0 && (
                            <div className="text-[9px] text-zinc-600 font-bold mt-2 pl-6">
                              {scores.filter(s => s.team_id === t.id).reduce((a, s) => a + s.score, 0)} pts total
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Step 3: Rank */}
                {rule && (
                  <section>
                    <p className="text-[9px] font-black tracking-[0.4em] text-zinc-600 uppercase mb-4">
                      Step 3 — Select Rank / Points
                    </p>
                    <div className="grid grid-cols-4 gap-3">
                      {rule.scores.map((p, idx) => {
                        const active = selRank === idx;
                        return (
                          <button key={idx} onClick={() => setSelRank(idx)}
                            disabled={p === 0}
                            className={`p-5 rounded-2xl border-2 text-center transition-all disabled:opacity-20 disabled:cursor-not-allowed ${
                              active ? 'bg-white border-white text-black' : 'border-white/[0.07] bg-white/[0.03] text-white hover:border-white/20'
                            }`}>
                            <div className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-2">{ORDINALS[idx]}</div>
                            <div className="text-3xl font-black tabular-nums">+{p}</div>
                            <div className="text-[9px] font-bold uppercase opacity-40 mt-1">pts</div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Submit */}
                <button
                  onClick={handleAwardScore}
                  disabled={submitting || !selCat || !selTeam}
                  className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.25em] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  style={{
                    background: selTeam
                      ? teams.find(t => t.id === selTeam)?.color_hex
                      : 'rgba(255,255,255,0.07)',
                    color: selTeam ? '#000' : '#555',
                  }}
                >
                  {submitting
                    ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Submitting...</>
                    : <>🏅 Award {pts > 0 ? `+${pts} pts` : 'Score'}</>
                  }
                </button>
              </div>

              {/* Right: Mini scoreboard */}
              <div>
                <p className="text-[9px] font-black tracking-[0.4em] text-zinc-600 uppercase mb-5">Live Standings</p>
                {loading
                  ? <div className="flex flex-col gap-3">{[1,2,3,4].map(i => <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />)}</div>
                  : <MiniScoreboard teams={teams} scores={scores} />
                }
                <div className="mt-4 text-[9px] text-zinc-700 font-bold uppercase tracking-widest text-center">
                  {scores.length} score entries recorded
                </div>
                <button onClick={handleReset}
                  className="mt-6 w-full py-3 rounded-xl border border-red-500/15 text-[10px] font-black text-red-700 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/5 uppercase tracking-widest transition-all">
                  ⚠️ Reset All Scores
                </button>
              </div>
            </motion.div>
          )}

          {/* ══ TAB: TEAMS ════════════════════════════════════════════════════ */}
          {tab === 'teams' && (
            <motion.div key="teams" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="max-w-2xl">
              <p className="text-[9px] font-black tracking-[0.4em] text-zinc-600 uppercase mb-6">
                Team Configuration — Changes sync to broadcast instantly
              </p>

              <div className="flex flex-col gap-4">
                {teams.map(team => {
                  const isEditing = editingTeam === team.id;
                  const draft = teamDraft[team.id] || { name: team.name, color_hex: team.color_hex };

                  return (
                    <div key={team.id}
                      className="rounded-2xl border overflow-hidden transition-all duration-200"
                      style={{
                        borderColor: isEditing ? `${draft.color_hex}40` : 'rgba(255,255,255,0.06)',
                        background: isEditing ? `${draft.color_hex}08` : 'rgba(255,255,255,0.02)',
                      }}>

                      {/* View mode */}
                      {!isEditing && (
                        <div className="flex items-center gap-4 p-5">
                          <div className="w-5 h-5 rounded-full shrink-0" style={{ background: team.color_hex, boxShadow: `0 0 12px ${team.color_hex}60` }} />
                          <div className="flex-1">
                            <div className="text-base font-black text-white uppercase tracking-tight">{team.name}</div>
                            <div className="text-[10px] text-zinc-600 font-mono mt-0.5">{team.color_hex}</div>
                          </div>
                          <div className="text-xl font-black" style={{ color: team.color_hex }}>
                            {scores.filter(s => s.team_id === team.id).reduce((a, s) => a + s.score, 0)} pts
                          </div>
                          <button onClick={() => startEdit(team)}
                            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.08] text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all">
                            Edit
                          </button>
                        </div>
                      )}

                      {/* Edit mode */}
                      {isEditing && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 space-y-5">
                          {/* Name input */}
                          <div>
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Team Name</label>
                            <input
                              type="text"
                              value={draft.name}
                              onChange={e => setTeamDraft(prev => ({ ...prev, [team.id]: { ...draft, name: e.target.value.toUpperCase() } }))}
                              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 font-black text-white uppercase tracking-wider focus:outline-none focus:border-white/30 transition-all text-sm"
                              placeholder="TEAM NAME"
                            />
                          </div>

                          {/* Color picker */}
                          <div>
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-3">Team Color</label>
                            <div className="flex flex-wrap gap-2.5 mb-3">
                              {COLOR_PRESETS.map(hex => (
                                <button
                                  key={hex}
                                  onClick={() => setTeamDraft(prev => ({ ...prev, [team.id]: { ...draft, color_hex: hex } }))}
                                  className="w-9 h-9 rounded-xl border-2 transition-all"
                                  style={{
                                    background: hex,
                                    borderColor: draft.color_hex === hex ? 'white' : 'transparent',
                                    boxShadow: draft.color_hex === hex ? `0 0 12px ${hex}` : 'none',
                                  }}
                                />
                              ))}
                            </div>
                            {/* Custom hex input */}
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg border border-white/20" style={{ background: draft.color_hex }} />
                              <input
                                type="text"
                                value={draft.color_hex}
                                onChange={e => setTeamDraft(prev => ({ ...prev, [team.id]: { ...draft, color_hex: e.target.value } }))}
                                className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-white/30 w-36"
                                placeholder="#ef4444"
                                maxLength={7}
                              />
                              <span className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest">Custom hex</span>
                            </div>
                          </div>

                          {/* Preview */}
                          <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ borderColor: `${draft.color_hex}30`, background: `${draft.color_hex}10` }}>
                            <div className="w-4 h-4 rounded-full" style={{ background: draft.color_hex }} />
                            <span className="font-black text-white uppercase text-sm">{draft.name || 'PREVIEW'}</span>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-3 pt-1">
                            <button onClick={cancelEdit}
                              className="flex-1 py-3 rounded-xl border border-white/10 text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:border-white/20 transition-all">
                              Cancel
                            </button>
                            <button onClick={() => saveTeam(team.id)}
                              className="flex-1 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all"
                              style={{ background: draft.color_hex, color: '#000' }}>
                              Save & Sync Broadcast
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ══ TAB: EVENT SETUP ══════════════════════════════════════════════ */}
          {tab === 'event' && (
            <motion.div key="event" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="max-w-xl space-y-8">
              <p className="text-[9px] font-black tracking-[0.4em] text-zinc-600 uppercase mb-6">
                Event Configuration — Displayed on all screens
              </p>

              {[
                { key: 'organizer',      label: 'Organiser / Company', placeholder: 'Shell MDS Sarawak', hint: 'Shown as subtitle in broadcast header' },
                { key: 'event_title',    label: 'Event Title',         placeholder: 'Family Day 2026',   hint: 'Main headline on all scoreboards' },
                { key: 'event_subtitle', label: 'Event Subtitle',      placeholder: 'Live Scoreboard',   hint: 'Secondary label below headline' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2">{field.label}</label>
                  <input
                    type="text"
                    value={configDraft[field.key] || ''}
                    onChange={e => setConfigDraft(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 font-black text-white text-sm focus:outline-none focus:border-white/30 transition-all"
                    placeholder={field.placeholder}
                  />
                  <p className="text-[9px] text-zinc-700 mt-1.5 font-bold">{field.hint}</p>
                </div>
              ))}

              {/* Preview */}
              <div className="p-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] space-y-1">
                <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-3">Broadcast Preview</div>
                <div className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em]">{configDraft.organizer || '—'}</div>
                <div className="text-2xl font-black text-white uppercase tracking-tight">{configDraft.event_title || '—'}</div>
                <div className="text-[10px] text-zinc-500 tracking-[0.3em] uppercase font-bold">{configDraft.event_subtitle || '—'}</div>
              </div>

              <button onClick={saveConfig}
                className="w-full py-4 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-[0.3em] hover:bg-zinc-200 transition-all">
                Save Event Config
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
