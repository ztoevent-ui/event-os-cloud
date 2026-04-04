'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import type { RoundRule, TieTemplate, TieTemplateEvent, RoundType, ScoringType } from '@/lib/arena-types';

// ——— Default Round Rules ———
const DEFAULT_RULES: Omit<RoundRule, 'id' | 'tournament_id'>[] = [
  { round_type: 'GROUP',      scoring_type: 'RALLY',    max_points: 21, win_by: 1, sets_to_win: 1, max_sets: 1, freeze_at: null },
  { round_type: 'KNOCKOUT',   scoring_type: 'SIDE_OUT', max_points: 15, win_by: 2, sets_to_win: 1, max_sets: 1, freeze_at: null },
  { round_type: 'SEMIFINALS', scoring_type: 'SIDE_OUT', max_points: 15, win_by: 2, sets_to_win: 1, max_sets: 1, freeze_at: null },
  { round_type: 'FINALS',     scoring_type: 'SIDE_OUT', max_points: 11, win_by: 2, sets_to_win: 2, max_sets: 3, freeze_at: null },
];

const ROUND_LABELS: Record<RoundType, { label: string; icon: string; color: string }> = {
  GROUP:      { label: 'Group Stage',  icon: 'fa-users',       color: 'emerald' },
  KNOCKOUT:   { label: 'Knockout',     icon: 'fa-bolt',        color: 'amber' },
  SEMIFINALS: { label: 'Semi-Finals',  icon: 'fa-star-half',   color: 'orange' },
  FINALS:     { label: 'Finals',       icon: 'fa-trophy',      color: 'yellow' },
};

const EVENT_TYPES = [
  { id: 'MD1',      label: "Men's Doubles 1" },
  { id: 'MD2',      label: "Men's Doubles 2" },
  { id: 'WD',       label: "Women's Doubles" },
  { id: 'MXD',      label: "Mixed Doubles" },
  { id: 'VETERANS', label: "Veterans" },
  { id: 'MS',       label: "Men's Singles" },
  { id: 'WS',       label: "Women's Singles" },
  { id: 'CUSTOM',   label: "Custom Event" },
];

function RuleEditor({
  rule,
  onChange,
}: {
  rule: Omit<RoundRule, 'id' | 'tournament_id'>;
  onChange: (updated: Omit<RoundRule, 'id' | 'tournament_id'>) => void;
}) {
  const meta = ROUND_LABELS[rule.round_type];
  const colorMap: Record<string, string> = {
    emerald: 'border-emerald-500/30 bg-emerald-500/5',
    amber: 'border-amber-500/30 bg-amber-500/5',
    orange: 'border-orange-500/30 bg-orange-500/5',
    yellow: 'border-yellow-500/30 bg-yellow-500/5',
  };
  const accentMap: Record<string, string> = {
    emerald: 'text-emerald-400', amber: 'text-amber-400', orange: 'text-orange-400', yellow: 'text-yellow-400',
  };

  return (
    <div className={`border rounded-3xl p-6 ${colorMap[meta.color]} transition-all`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-black/30 ${accentMap[meta.color]}`}>
          <i className={`fa-solid ${meta.icon}`} />
        </div>
        <div>
          <h3 className={`font-black text-sm uppercase tracking-widest ${accentMap[meta.color]}`}>{meta.label}</h3>
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Round Configuration</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Scoring Type */}
        <div className="col-span-2 md:col-span-1">
          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Scoring System</label>
          <div className="flex gap-2">
            {(['RALLY', 'SIDE_OUT'] as ScoringType[]).map((t) => (
              <button
                key={t}
                onClick={() => onChange({ ...rule, scoring_type: t })}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  rule.scoring_type === t
                    ? 'bg-white text-black border-white shadow-lg'
                    : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/30'
                }`}
              >
                {t === 'RALLY' ? '⚡ Rally' : '🏓 Side-out'}
              </button>
            ))}
          </div>
        </div>

        {/* Max Points */}
        <div>
          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Points to Win</label>
          <input
            type="number"
            min={1} max={100}
            value={rule.max_points}
            onChange={(e) => onChange({ ...rule, max_points: parseInt(e.target.value) || 21 })}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-white/40 transition-all"
          />
        </div>

        {/* Win By */}
        <div>
          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Win By</label>
          <input
            type="number"
            min={1} max={5}
            value={rule.win_by}
            onChange={(e) => onChange({ ...rule, win_by: parseInt(e.target.value) || 2 })}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-white/40 transition-all"
          />
        </div>

        {/* Sets */}
        <div>
          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Sets Format</label>
          <select
            value={`${rule.sets_to_win}of${rule.max_sets}`}
            onChange={(e) => {
              const [win, total] = e.target.value.split('of').map(Number);
              onChange({ ...rule, sets_to_win: win, max_sets: total });
            }}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold text-xs focus:outline-none focus:border-white/40 transition-all cursor-pointer"
          >
            <option value="1of1">Single Set</option>
            <option value="2of3">Best of 3 (2 wins)</option>
            <option value="3of5">Best of 5 (3 wins)</option>
          </select>
        </div>

        {/* Freeze Point */}
        <div>
          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
            Freeze At <span className="text-zinc-700">(optional)</span>
          </label>
          <input
            type="number"
            min={0} max={50}
            value={rule.freeze_at ?? ''}
            placeholder="None"
            onChange={(e) => onChange({ ...rule, freeze_at: e.target.value ? parseInt(e.target.value) : null })}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-white/40 transition-all placeholder-zinc-700"
          />
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
  const router = useRouter();
  const eventId = params.eventId as string;

  const [tournament, setTournament] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'RULES' | 'TIE'>('RULES');
  const [rules, setRules] = useState<Omit<RoundRule, 'id' | 'tournament_id'>[]>(DEFAULT_RULES);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Tie Template state
  const [ties, setTies] = useState({
    name: 'Standard Tie',
    wins_required: 3,
    total_matches: 5,
    events: EVENT_TYPES.slice(0, 5).map((et, idx) => ({
      sequence_order: idx + 1,
      event_type: et.id,
      event_label: et.label,
    })),
  });

  // Load existing tournament + rules
  useEffect(() => {
    async function load() {
      const { data: t } = await supabase
        .from('arena_tournaments')
        .select('*')
        .eq('event_id_slug', eventId)
        .single();

      if (t) {
        setTournament(t);
        // Load existing round rules
        const { data: existingRules } = await supabase
          .from('arena_round_rules')
          .select('*')
          .eq('tournament_id', t.id)
          .order('round_type');

        if (existingRules && existingRules.length > 0) {
          const merged = DEFAULT_RULES.map((def) => {
            const found = existingRules.find((r) => r.round_type === def.round_type);
            return found ? {
              round_type: found.round_type,
              scoring_type: found.scoring_type,
              max_points: found.max_points,
              win_by: found.win_by,
              sets_to_win: found.sets_to_win,
              max_sets: found.max_sets,
              freeze_at: found.freeze_at,
            } : def;
          });
          setRules(merged as any);
        }
      }
    }
    load();
  }, [eventId]);

  const updateRule = useCallback((roundType: RoundType, updated: Omit<RoundRule, 'id' | 'tournament_id'>) => {
    setRules((prev) => prev.map((r) => r.round_type === roundType ? updated : r));
  }, []);

  const handleSave = async () => {
    if (!tournament) return;
    setSaving(true);

    // Upsert round rules
    const upserts = rules.map((r) => ({
      tournament_id: tournament.id,
      round_type: r.round_type,
      scoring_type: r.scoring_type,
      max_points: r.max_points,
      win_by: r.win_by,
      sets_to_win: r.sets_to_win,
      max_sets: r.max_sets,
      freeze_at: r.freeze_at,
    }));

    const { error } = await supabase
      .from('arena_round_rules')
      .upsert(upserts, { onConflict: 'tournament_id,round_type' });

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      alert('Save failed: ' + error.message);
    }
    setSaving(false);
  };

  const handleSaveTie = async () => {
    if (!tournament) return;
    setSaving(true);

    // Delete existing tie templates for this tournament
    const { data: existing } = await supabase
      .from('arena_tie_templates')
      .select('id')
      .eq('tournament_id', tournament.id);

    if (existing?.length) {
      await supabase.from('arena_tie_templates').delete().eq('tournament_id', tournament.id);
    }

    // Insert new template
    const { data: tmpl, error: tmplErr } = await supabase
      .from('arena_tie_templates')
      .insert({
        tournament_id: tournament.id,
        name: ties.name,
        wins_required: ties.wins_required,
        total_matches: ties.events.length,
      })
      .select()
      .single();

    if (tmplErr || !tmpl) {
      alert('Failed to save tie template: ' + tmplErr?.message);
      setSaving(false);
      return;
    }

    // Insert events
    const events = ties.events.map((e) => ({
      template_id: tmpl.id,
      sequence_order: e.sequence_order,
      event_type: e.event_type,
      event_label: e.event_label,
    }));

    await supabase.from('arena_tie_template_events').insert(events);

    // Update tournament format
    await supabase.from('arena_tournaments').update({ format: 'TIE_TEAM' }).eq('id', tournament.id);

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  };

  const addTieEvent = () => {
    setTies((prev) => ({
      ...prev,
      events: [
        ...prev.events,
        {
          sequence_order: prev.events.length + 1,
          event_type: 'CUSTOM',
          event_label: `Event ${prev.events.length + 1}`,
        },
      ],
      wins_required: Math.ceil((prev.events.length + 1) / 2),
      total_matches: prev.events.length + 1,
    }));
  };

  const removeTieEvent = (idx: number) => {
    setTies((prev) => {
      const events = prev.events.filter((_, i) => i !== idx).map((e, i) => ({ ...e, sequence_order: i + 1 }));
      return { ...prev, events, wins_required: Math.ceil(events.length / 2), total_matches: events.length };
    });
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Header */}
      <header className="bg-zinc-950 border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <Link
            href={`/arena/${eventId}`}
            className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-600 hover:text-white transition-colors tracking-widest group"
          >
            <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform" />
            Hub
          </Link>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-500/20 text-violet-400 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-wrench text-sm" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest text-white">Tournament Architect</h1>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{tournament?.name || 'Loading...'}</p>
            </div>
          </div>
        </div>

        <button
          onClick={activeTab === 'RULES' ? handleSave : handleSaveTie}
          disabled={saving || !tournament}
          className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg ${
            saved
              ? 'bg-emerald-500 text-black shadow-emerald-500/30'
              : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/20 disabled:opacity-50'
          }`}
        >
          <i className={`fa-solid ${saving ? 'fa-spinner fa-spin' : saved ? 'fa-check' : 'fa-floppy-disk'}`} />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Config'}
        </button>
      </header>

      {/* Tabs */}
      <div className="border-b border-white/5 px-8 pt-4 flex gap-6 bg-zinc-950/50">
        {[
          { id: 'RULES', label: 'Round Rules', icon: 'fa-sliders' },
          { id: 'TIE', label: 'Tie Template', icon: 'fa-layer-group' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 pb-4 border-b-2 transition-all ${
              activeTab === tab.id ? 'border-violet-500 text-violet-400' : 'border-transparent text-zinc-500 hover:text-white'
            }`}
          >
            <i className={`fa-solid ${tab.icon} text-xs`} />
            <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>

      <main className="max-w-5xl mx-auto p-6 md:p-10">
        <AnimatePresence mode="wait">
          {activeTab === 'RULES' && (
            <motion.div key="rules" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="mb-8">
                <h2 className="text-2xl font-black text-white mb-1">Round-Specific Scoring Rules</h2>
                <p className="text-zinc-500 text-sm">Each round uses independent scoring logic. Referee UI auto-adapts.</p>
              </div>

              <div className="space-y-6">
                {rules.map((rule) => (
                  <RuleEditor
                    key={rule.round_type}
                    rule={rule}
                    onChange={(updated) => updateRule(rule.round_type as RoundType, updated)}
                  />
                ))}
              </div>

              {/* Preview Summary */}
              <div className="mt-10 p-6 bg-zinc-900/60 border border-white/5 rounded-3xl">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Configuration Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {rules.map((r) => {
                    const meta = ROUND_LABELS[r.round_type as RoundType];
                    return (
                      <div key={r.round_type} className="bg-black/40 rounded-2xl p-4 border border-white/5">
                        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">{meta.label}</div>
                        <div className="text-white font-bold text-sm">{r.scoring_type === 'RALLY' ? '⚡' : '🏓'} {r.scoring_type}</div>
                        <div className="text-zinc-400 text-xs mt-1">{r.max_points} pts • Win by {r.win_by}</div>
                        <div className="text-zinc-600 text-xs">{r.max_sets === 1 ? 'Single Set' : `Best of ${r.max_sets}`}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'TIE' && (
            <motion.div key="tie" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="mb-8">
                <h2 className="text-2xl font-black text-white mb-1">Tie Template Builder</h2>
                <p className="text-zinc-500 text-sm">Define the match composition of a team-vs-team Tie (Thomas Cup style).</p>
              </div>

              {/* Template Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Template Name</label>
                  <input
                    type="text"
                    value={ties.name}
                    onChange={(e) => setTies((p) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-violet-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Wins Required</label>
                  <div className="flex items-center gap-3 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3">
                    <span className="text-white font-black text-xl">{ties.wins_required}</span>
                    <span className="text-zinc-500 text-xs">of {ties.events.length} matches</span>
                  </div>
                </div>
                <div className="flex items-end">
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 w-full text-center">
                    <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Format</div>
                    <div className="text-white font-black">Best of {ties.events.length} — {ties.wins_required} to Win</div>
                  </div>
                </div>
              </div>

              {/* Match Event List */}
              <div className="space-y-3 mb-6">
                {ties.events.map((event, idx) => (
                  <motion.div
                    key={idx}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 bg-zinc-900 border border-white/5 rounded-2xl p-4"
                  >
                    <div className="w-8 h-8 bg-violet-500/20 text-violet-400 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <select
                        value={event.event_type}
                        onChange={(e) => {
                          const et = EVENT_TYPES.find((x) => x.id === e.target.value);
                          setTies((prev) => ({
                            ...prev,
                            events: prev.events.map((ev, i) =>
                              i === idx ? { ...ev, event_type: e.target.value, event_label: et?.label || ev.event_label } : ev
                            ),
                          }));
                        }}
                        className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
                      >
                        {EVENT_TYPES.map((et) => <option key={et.id} value={et.id}>{et.label}</option>)}
                      </select>
                      <input
                        type="text"
                        value={event.event_label}
                        onChange={(e) => setTies((prev) => ({
                          ...prev,
                          events: prev.events.map((ev, i) => i === idx ? { ...ev, event_label: e.target.value } : ev),
                        }))}
                        placeholder="Display label..."
                        className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-violet-500 placeholder-zinc-700"
                      />
                    </div>
                    <button
                      onClick={() => removeTieEvent(idx)}
                      className="w-8 h-8 text-zinc-600 hover:text-red-500 transition-colors flex items-center justify-center flex-shrink-0"
                    >
                      <i className="fa-solid fa-trash text-xs" />
                    </button>
                  </motion.div>
                ))}
              </div>

              <button
                onClick={addTieEvent}
                className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-zinc-600 hover:text-white hover:border-violet-500/40 transition-all font-bold text-sm uppercase tracking-widest"
              >
                <i className="fa-solid fa-plus mr-2" /> Add Event
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
