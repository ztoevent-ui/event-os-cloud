'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import type { RoundRule, RoundType, ScoringType } from '@/lib/arena-types';

// ——— Types ———
type CompletionMode = 'EARLY' | 'FULL';
type RoundRuleLocal = Omit<RoundRule, 'id' | 'tournament_id'> & { completion_mode: CompletionMode };

// ——— Constants ———
const ALL_ROUND_TYPES: RoundType[] = ['GROUP', 'KNOCKOUT', 'SEMIFINALS', 'THIRD_PLACE', 'FINALS'];

const DEFAULT_RULES: RoundRuleLocal[] = [
  { round_type: 'GROUP',       scoring_type: 'RALLY',    max_points: 21, win_by: 2, sets_to_win: 1, max_sets: 1, freeze_at: null, completion_mode: 'FULL'  },
  { round_type: 'KNOCKOUT',    scoring_type: 'RALLY',    max_points: 15, win_by: 2, sets_to_win: 1, max_sets: 1, freeze_at: null, completion_mode: 'FULL'  },
  { round_type: 'SEMIFINALS',  scoring_type: 'RALLY',    max_points: 15, win_by: 2, sets_to_win: 2, max_sets: 3, freeze_at: null, completion_mode: 'EARLY' },
  { round_type: 'THIRD_PLACE', scoring_type: 'RALLY',    max_points: 15, win_by: 2, sets_to_win: 2, max_sets: 3, freeze_at: null, completion_mode: 'EARLY' },
  { round_type: 'FINALS',      scoring_type: 'RALLY',    max_points: 21, win_by: 2, sets_to_win: 2, max_sets: 3, freeze_at: null, completion_mode: 'EARLY' },
];

const ROUND_META: Record<string, { label: string; icon: string; color: string; accent: string; border: string }> = {
  GROUP:       { label: 'Group Stage',        icon: 'fa-users',          color: 'emerald', accent: 'text-emerald-400', border: 'border-emerald-500/30 bg-emerald-500/5'  },
  KNOCKOUT:    { label: 'Knockout',            icon: 'fa-bolt',           color: 'amber',   accent: 'text-amber-400',   border: 'border-amber-500/30 bg-amber-500/5'    },
  SEMIFINALS:  { label: 'Semi-Finals',         icon: 'fa-star-half-stroke', color: 'orange', accent: 'text-orange-400', border: 'border-orange-500/30 bg-orange-500/5'  },
  THIRD_PLACE: { label: '3rd Place Playoff',   icon: 'fa-medal',          color: 'sky',     accent: 'text-sky-400',     border: 'border-sky-500/30 bg-sky-500/5'        },
  FINALS:      { label: 'Finals',              icon: 'fa-trophy',         color: 'yellow',  accent: 'text-yellow-400',  border: 'border-yellow-500/30 bg-yellow-500/5'  },
};

const EVENT_TYPES = [
  { id: 'MD1', label: "Men's Doubles 1" }, { id: 'MD2', label: "Men's Doubles 2" },
  { id: 'WD',  label: "Women's Doubles" }, { id: 'MXD', label: "Mixed Doubles" },
  { id: 'VETERANS', label: "Veterans" },   { id: 'MS',  label: "Men's Singles" },
  { id: 'WS',  label: "Women's Singles" }, { id: 'CUSTOM', label: "Custom Event" },
];

// ——— Rule Editor Component ———
function RuleEditor({
  rule, onChange, isTieTeam,
}: {
  rule: RoundRuleLocal;
  onChange: (r: RoundRuleLocal) => void;
  isTieTeam: boolean;
}) {
  const meta = ROUND_META[rule.round_type];
  return (
    <div className={`border rounded-3xl p-6 ${meta.border} transition-all`}>
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-black/30 ${meta.accent}`}>
            <i className={`fa-solid ${meta.icon}`} />
          </div>
          <div>
            <h3 className={`font-black text-sm uppercase tracking-widest ${meta.accent}`}>{meta.label}</h3>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Round Configuration</p>
          </div>
        </div>

        {/* Per-stage Completion Mode — only shown for TIE_TEAM format */}
        {isTieTeam && (
          <div className="flex bg-black p-1 rounded-xl border border-white/5">
            {([['EARLY', 'fa-bolt', 'Early Stop'], ['FULL', 'fa-calendar-check', 'Full Session']] as const).map(([id, icon, label]) => (
              <button
                key={id}
                onClick={() => onChange({ ...rule, completion_mode: id })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  rule.completion_mode === id
                    ? 'bg-violet-600 text-white shadow'
                    : 'bg-transparent text-zinc-600 hover:text-zinc-400'
                }`}
              >
                <i className={`fa-solid ${icon}`} />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Scoring System Presets */}
        <div className="col-span-2 md:col-span-1">
          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Scoring Mode (Rally)</label>
          <div className="flex gap-2">
            <button onClick={() => onChange({ ...rule, scoring_type: 'RALLY', max_points: 21, win_by: 2 })}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                rule.max_points === 21 ? 'bg-white text-black border-white shadow-lg' : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/30'
              }`}>
              Standard (21 Pts)
            </button>
            <button onClick={() => onChange({ ...rule, scoring_type: 'RALLY', max_points: 15, win_by: 2 })}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                rule.max_points === 15 ? 'bg-white text-black border-white shadow-lg' : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/30'
              }`}>
              2027 (15 Pts)
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Points to Win</label>
          <input type="number" min={1} max={100} value={rule.max_points}
            onChange={(e) => onChange({ ...rule, max_points: parseInt(e.target.value) || 21 })}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-white/40 transition-all" />
        </div>

        <div>
          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Win By</label>
          <input type="number" min={1} max={5} value={rule.win_by}
            onChange={(e) => onChange({ ...rule, win_by: parseInt(e.target.value) || 2 })}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-white/40 transition-all" />
        </div>

        <div>
          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Sets Format</label>
          <select value={`${rule.sets_to_win}of${rule.max_sets}`}
            onChange={(e) => { const [win, total] = e.target.value.split('of').map(Number); onChange({ ...rule, sets_to_win: win, max_sets: total }); }}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold text-xs focus:outline-none focus:border-white/40 transition-all cursor-pointer">
            <option value="1of1">Single Set</option>
            <option value="2of3">Best of 3 (2 wins)</option>
            <option value="3of5">Best of 5 (3 wins)</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
            Freeze At <span className="text-zinc-700">(optional)</span>
          </label>
          <input type="number" min={0} max={50} value={rule.freeze_at ?? ''} placeholder="None"
            onChange={(e) => onChange({ ...rule, freeze_at: e.target.value ? parseInt(e.target.value) : null })}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-white/40 transition-all placeholder-zinc-700" />
        </div>
      </div>
    </div>
  );
}

// ——————————————————————————————————————————————————
// MAIN ARCHITECT PAGE
// ——————————————————————————————————————————————————
export default function ArchitectPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [tournament, setTournament] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'RULES' | 'TIE' | 'EVENTS'>('RULES');
  const [rules, setRules] = useState<RoundRuleLocal[]>(DEFAULT_RULES);
  const [hasThirdPlace, setHasThirdPlace] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isTieTeam = tournament?.format === 'TIE_TEAM';

  // Tie Template State
  const [ties, setTies] = useState<{
    name: string; wins_required: number; total_matches: number;
    events: { sequence_order: number; event_type: string; event_label: string }[];
  }>({
    name: 'Standard Tie', wins_required: 3, total_matches: 5,
    events: EVENT_TYPES.slice(0, 5).map((et, idx) => ({ sequence_order: idx + 1, event_type: et.id, event_label: et.label })),
  });

  // Individual Events State
  const [indivEvents, setIndivEvents] = useState<{ id?: string; name: string; gender: string; type: string; max_entries: number }[]>([]);

  // ——— Load on mount ———
  useEffect(() => {
    async function load() {
      const { data: t } = await supabase
        .from('arena_tournaments')
        .select('*')
        .or(`id.eq.${eventId},event_id_slug.eq.${eventId}`)
        .single();
      if (!t) return;
      setTournament(t);
      setHasThirdPlace(t.has_third_place || false);

      // Load round rules
      const { data: existingRules } = await supabase
        .from('arena_round_rules').select('*').eq('tournament_id', t.id);
      if (existingRules && existingRules.length > 0) {
        const merged = DEFAULT_RULES.map((def) => {
          const found = existingRules.find((r) => r.round_type === def.round_type);
          return found ? {
            round_type: found.round_type, scoring_type: found.scoring_type,
            max_points: found.max_points, win_by: found.win_by,
            sets_to_win: found.sets_to_win, max_sets: found.max_sets,
            freeze_at: found.freeze_at, completion_mode: (found.completion_mode || 'EARLY') as CompletionMode,
          } : def;
        });
        setRules(merged);
      }

      // Load tie template
      const { data: existingTie } = await supabase
        .from('arena_tie_templates')
        .select('*, events:arena_tie_template_events(*)')
        .eq('tournament_id', t.id).maybeSingle();
      if (existingTie) {
        setTies({
          name: existingTie.name, wins_required: existingTie.wins_required,
          total_matches: existingTie.total_matches,
          events: existingTie.events.sort((a: any, b: any) => a.sequence_order - b.sequence_order),
        });
      }

      // Load individual events
      const { data: evts } = await supabase
        .from('arena_individual_events').select('*').eq('tournament_id', t.id).order('created_at');
      if (evts) setIndivEvents(evts.map((e: any) => ({ id: e.id, name: e.name, gender: e.gender, type: e.type, max_entries: e.max_entries })));
    }
    load();
  }, [eventId]);

  const updateRule = useCallback((roundType: string, updated: RoundRuleLocal) => {
    setRules((prev) => prev.map((r) => r.round_type === roundType ? updated : r));
  }, []);

  // ——— Save Round Rules ———
  const handleSave = async () => {
    if (!tournament) return;
    setSaving(true);
    const activeRoundTypes = hasThirdPlace ? ALL_ROUND_TYPES : ALL_ROUND_TYPES.filter(r => r !== 'THIRD_PLACE');
    const activeRules = rules.filter(r => activeRoundTypes.includes(r.round_type as RoundType));
    const upserts = activeRules.map((r) => ({
      tournament_id: tournament.id, round_type: r.round_type,
      scoring_type: r.scoring_type, max_points: r.max_points,
      win_by: r.win_by, sets_to_win: r.sets_to_win, max_sets: r.max_sets,
      freeze_at: r.freeze_at, completion_mode: r.completion_mode,
    }));
    const { error } = await supabase.from('arena_round_rules').upsert(upserts, { onConflict: 'tournament_id,round_type' });
    // Also update has_third_place on tournament
    await supabase.from('arena_tournaments').update({ has_third_place: hasThirdPlace }).eq('id', tournament.id);
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    else alert('Save failed: ' + error.message);
    setSaving(false);
  };

  // ——— Save Tie Template ———
  const handleSaveTie = async () => {
    if (!tournament) return;
    setSaving(true);
    await supabase.from('arena_tie_templates').delete().eq('tournament_id', tournament.id);
    const { data: tmpl, error: tmplErr } = await supabase.from('arena_tie_templates').insert({
      tournament_id: tournament.id, name: ties.name,
      wins_required: ties.wins_required, total_matches: ties.events.length,
    }).select().single();
    if (tmplErr || !tmpl) { alert('Failed: ' + tmplErr?.message); setSaving(false); return; }
    await supabase.from('arena_tie_template_events').insert(
      ties.events.map((e) => ({ template_id: tmpl.id, sequence_order: e.sequence_order, event_type: e.event_type, event_label: e.event_label }))
    );
    await supabase.from('arena_tournaments').update({ format: 'TIE_TEAM' }).eq('id', tournament.id);
    setSaved(true); setTimeout(() => setSaved(false), 2500); setSaving(false);
  };

  // ——— Save Individual Events ———
  const handleSaveEvents = async () => {
    if (!tournament) return;
    setSaving(true);
    // Delete old and reinsert
    await supabase.from('arena_individual_events').delete().eq('tournament_id', tournament.id);
    if (indivEvents.length > 0) {
      await supabase.from('arena_individual_events').insert(
        indivEvents.map((e) => ({ tournament_id: tournament.id, name: e.name, gender: e.gender, type: e.type, max_entries: e.max_entries }))
      );
    }
    await supabase.from('arena_tournaments').update({ format: 'INDIVIDUAL' }).eq('id', tournament.id);
    setSaved(true); setTimeout(() => setSaved(false), 2500); setSaving(false);
  };

  const visibleRules = hasThirdPlace ? rules : rules.filter(r => r.round_type !== 'THIRD_PLACE');

  const handleSaveCurrent = () => {
    if (activeTab === 'RULES') return handleSave();
    if (activeTab === 'TIE') return handleSaveTie();
    return handleSaveEvents();
  };

  // ——— Individual Event helpers ———
  const addIndivEvent = () => setIndivEvents(p => [...p, { name: "New Event", gender: 'OPEN', type: 'DOUBLES', max_entries: 32 }]);
  const removeIndivEvent = (i: number) => setIndivEvents(p => p.filter((_, idx) => idx !== i));
  const updateIndivEvent = (i: number, patch: Partial<typeof indivEvents[0]>) =>
    setIndivEvents(p => p.map((e, idx) => idx === i ? { ...e, ...patch } : e));

  const tabs = [
    { id: 'RULES', label: 'Round Rules', icon: 'fa-sliders' },
    ...(isTieTeam ? [{ id: 'TIE', label: 'Tie Template', icon: 'fa-layer-group' }] : []),
    ...(!isTieTeam || tournament?.format === 'INDIVIDUAL' ? [{ id: 'EVENTS', label: 'Events', icon: 'fa-list-check' }] : []),
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <header className="bg-zinc-950 border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <Link href="/apps/zto-arena" className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-600 hover:text-white transition-colors tracking-widest group">
            <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform" />
            Arena Hub
          </Link>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-500/20 text-violet-400 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-wrench text-sm" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest text-white">Tournament Architect</h1>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{tournament?.name || 'Loading...'}</p>
                {tournament?.format && (
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    tournament.format === 'TIE_TEAM' ? 'bg-violet-500/20 text-violet-400' : 'bg-sky-500/20 text-sky-400'
                  }`}>
                    {tournament.format === 'TIE_TEAM' ? 'Team Tie' : 'Individual'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleSaveCurrent} disabled={saving || !tournament}
          className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg ${
            saved ? 'bg-emerald-500 text-black shadow-emerald-500/30' : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/20 disabled:opacity-50'
          }`}>
          <i className={`fa-solid ${saving ? 'fa-spinner fa-spin' : saved ? 'fa-check' : 'fa-floppy-disk'}`} />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Config'}
        </button>
      </header>

      {/* Tabs */}
      <div className="border-b border-white/5 px-8 pt-4 flex gap-6 bg-zinc-950/50">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 pb-4 border-b-2 transition-all ${
              activeTab === tab.id ? 'border-violet-500 text-violet-400' : 'border-transparent text-zinc-500 hover:text-white'
            }`}>
            <i className={`fa-solid ${tab.icon} text-xs`} />
            <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>

      <main className="max-w-5xl mx-auto p-6 md:p-10">
        <AnimatePresence mode="wait">

          {/* ——— ROUND RULES TAB ——— */}
          {activeTab === 'RULES' && (
            <motion.div key="rules" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white mb-1">Round-Specific Scoring Rules</h2>
                  <p className="text-zinc-500 text-sm">Each round uses independent scoring logic. Referee UI auto-adapts.</p>
                  {isTieTeam && <p className="text-violet-400 text-xs mt-1 font-bold">⚡ Team Tie mode: Completion Mode is configurable per stage.</p>}
                </div>

                {/* 3rd Place Toggle */}
                <button
                  onClick={() => setHasThirdPlace(p => !p)}
                  className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                    hasThirdPlace
                      ? 'border-sky-500/60 bg-sky-500/10 text-sky-400'
                      : 'border-white/10 bg-transparent text-zinc-600 hover:text-zinc-400 hover:border-white/20'
                  }`}
                >
                  <i className="fa-solid fa-medal" />
                  {hasThirdPlace ? '3rd Place Playoff: ON' : 'Enable 3rd Place Playoff'}
                </button>
              </div>

              <div className="space-y-6">
                {visibleRules.map((rule) => (
                  <RuleEditor
                    key={rule.round_type}
                    rule={rule}
                    onChange={(updated) => updateRule(rule.round_type, updated)}
                    isTieTeam={isTieTeam}
                  />
                ))}
              </div>

              {/* Summary */}
              <div className="mt-10 p-6 bg-zinc-900/60 border border-white/5 rounded-3xl">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Configuration Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {visibleRules.map((r) => {
                    const meta = ROUND_META[r.round_type];
                    return (
                      <div key={r.round_type} className="bg-black/40 rounded-2xl p-4 border border-white/5">
                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${meta.accent}`}>{meta.label}</div>
                        <div className="text-white font-bold text-sm">⚡ RALLY ({r.max_points} PTS)</div>
                        <div className="text-zinc-400 text-xs mt-1">Win by {r.win_by}</div>
                        <div className="text-zinc-600 text-xs">{r.max_sets === 1 ? 'Single Set' : `Best of ${r.max_sets}`}</div>
                        {isTieTeam && (
                          <div className={`text-[9px] font-black uppercase tracking-wider mt-1 ${r.completion_mode === 'FULL' ? 'text-violet-400' : 'text-zinc-600'}`}>
                            {r.completion_mode === 'FULL' ? '● Full Session' : '○ Early Stop'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ——— TIE TEMPLATE TAB ——— */}
          {activeTab === 'TIE' && (
            <motion.div key="tie" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="mb-8">
                <h2 className="text-2xl font-black text-white mb-1">Tie Template Builder</h2>
                <p className="text-zinc-500 text-sm">Define the match composition of a team-vs-team Tie (Thomas Cup style).</p>
                <p className="text-violet-400 text-xs mt-1 font-bold">💡 Completion Mode is now controlled per-stage in Round Rules.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Template Name</label>
                  <input type="text" value={ties.name} onChange={(e) => setTies((p) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-violet-500 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Wins Required</label>
                  <div className="flex items-center gap-3 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3">
                    <button onClick={() => setTies(p => ({ ...p, wins_required: Math.max(1, p.wins_required - 1) }))} className="text-zinc-500 hover:text-white w-6 h-6 flex items-center justify-center"><i className="fa-solid fa-minus text-xs" /></button>
                    <span className="text-white font-black text-xl flex-1 text-center">{ties.wins_required}</span>
                    <button onClick={() => setTies(p => ({ ...p, wins_required: Math.min(p.events.length, p.wins_required + 1) }))} className="text-zinc-500 hover:text-white w-6 h-6 flex items-center justify-center"><i className="fa-solid fa-plus text-xs" /></button>
                    <span className="text-zinc-500 text-xs">of {ties.events.length}</span>
                  </div>
                </div>
                <div className="flex items-end">
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 w-full text-center">
                    <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Format</div>
                    <div className="text-white font-black">Best of {ties.events.length} — {ties.wins_required} wins</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {ties.events.map((event, idx) => (
                  <motion.div key={idx} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 bg-zinc-900 border border-white/5 rounded-2xl p-4">
                    <div className="w-8 h-8 bg-violet-500/20 text-violet-400 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0">{idx + 1}</div>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <select value={event.event_type}
                        onChange={(e) => {
                          const et = EVENT_TYPES.find((x) => x.id === e.target.value);
                          setTies((prev) => ({ ...prev, events: prev.events.map((ev, i) => i === idx ? { ...ev, event_type: e.target.value, event_label: et?.label || ev.event_label } : ev) }));
                        }}
                        className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-violet-500 cursor-pointer">
                        {EVENT_TYPES.map((et) => <option key={et.id} value={et.id}>{et.label}</option>)}
                      </select>
                      <input type="text" value={event.event_label} placeholder="Display label..."
                        onChange={(e) => setTies((prev) => ({ ...prev, events: prev.events.map((ev, i) => i === idx ? { ...ev, event_label: e.target.value } : ev) }))}
                        className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-violet-500 placeholder-zinc-700" />
                    </div>
                    <button onClick={() => {
                      const events = ties.events.filter((_, i) => i !== idx).map((e, i) => ({ ...e, sequence_order: i + 1 }));
                      setTies(p => ({ ...p, events, wins_required: Math.min(p.wins_required, events.length), total_matches: events.length }));
                    }} className="w-8 h-8 text-zinc-600 hover:text-red-500 transition-colors flex items-center justify-center flex-shrink-0">
                      <i className="fa-solid fa-trash text-xs" />
                    </button>
                  </motion.div>
                ))}
              </div>
              <button onClick={() => setTies((prev) => ({
                ...prev,
                events: [...prev.events, { sequence_order: prev.events.length + 1, event_type: 'CUSTOM', event_label: `Event ${prev.events.length + 1}` }],
                wins_required: Math.ceil((prev.events.length + 1) / 2), total_matches: prev.events.length + 1,
              }))} className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-zinc-600 hover:text-white hover:border-violet-500/40 transition-all font-bold text-sm uppercase tracking-widest">
                <i className="fa-solid fa-plus mr-2" /> Add Event
              </button>
            </motion.div>
          )}

          {/* ——— INDIVIDUAL EVENTS TAB ——— */}
          {activeTab === 'EVENTS' && (
            <motion.div key="events" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="mb-8">
                <h2 className="text-2xl font-black text-white mb-1">Individual Event Setup</h2>
                <p className="text-zinc-500 text-sm">Configure the events and categories for this tournament (e.g. Men's Singles, Mixed Doubles).</p>
              </div>

              <div className="space-y-3 mb-6">
                {indivEvents.length === 0 && (
                  <div className="text-center py-16 text-zinc-700 border border-dashed border-white/10 rounded-3xl">
                    <i className="fa-solid fa-list-check text-4xl mb-4 block" />
                    <p className="font-bold text-sm">No events configured yet</p>
                    <p className="text-xs mt-1">Add events below to build the draw structure.</p>
                  </div>
                )}
                {indivEvents.map((evt, idx) => (
                  <motion.div key={idx} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 bg-zinc-900 border border-white/5 rounded-2xl p-4 flex-wrap">
                    <div className="w-8 h-8 bg-sky-500/20 text-sky-400 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0">{idx + 1}</div>
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 min-w-0">
                      <input type="text" value={evt.name} placeholder="Event name..."
                        onChange={(e) => updateIndivEvent(idx, { name: e.target.value })}
                        className="col-span-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-sky-500 placeholder-zinc-700" />
                      <select value={evt.gender} onChange={(e) => updateIndivEvent(idx, { gender: e.target.value })}
                        className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-sky-500 cursor-pointer">
                        <option value="OPEN">Open</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="MIXED">Mixed</option>
                      </select>
                      <select value={evt.type} onChange={(e) => updateIndivEvent(idx, { type: e.target.value })}
                        className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-sky-500 cursor-pointer">
                        <option value="SINGLES">Singles</option>
                        <option value="DOUBLES">Doubles</option>
                        <option value="MIXED_DOUBLES">Mixed Doubles</option>
                        <option value="TEAM">Team</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Max</label>
                      <input type="number" min={4} max={256} value={evt.max_entries}
                        onChange={(e) => updateIndivEvent(idx, { max_entries: parseInt(e.target.value) || 32 })}
                        className="w-20 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-sky-500 text-center" />
                    </div>
                    <button onClick={() => removeIndivEvent(idx)} className="w-8 h-8 text-zinc-600 hover:text-red-500 transition-colors flex items-center justify-center flex-shrink-0">
                      <i className="fa-solid fa-trash text-xs" />
                    </button>
                  </motion.div>
                ))}
              </div>

              <button onClick={addIndivEvent}
                className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-zinc-600 hover:text-white hover:border-sky-500/40 transition-all font-bold text-sm uppercase tracking-widest">
                <i className="fa-solid fa-plus mr-2" /> Add Event Category
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
