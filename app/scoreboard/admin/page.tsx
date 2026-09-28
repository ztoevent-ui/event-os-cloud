"use client";
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

// ─── Types & Constants ────────────────────────────────────────────────────────
const EVENT_TYPES = [
  { key: 'A',      label: 'Type A',  sub: 'Large Props',       scores: [100, 75, 50, 25] },
  { key: 'B_team', label: 'Type B',  sub: 'Team Athletics',    scores: [60,  40, 20, 10] },
  { key: 'B_ind',  label: 'Type B',  sub: 'Individual Events', scores: [30,  20, 10,  5] },
  { key: 'C',      label: 'Type C',  sub: 'Tug of War',        scores: [200,  0,  0,  0] },
];
const ORDINALS = ['1ST', '2ND', '3RD', '4TH'];
const COLOR_PRESETS = [
  '#ef4444','#f97316','#eab308','#22c55e',
  '#3b82f6','#8b5cf6','#ec4899','#14b8a6',
  '#f59e0b','#06b6d4','#a855f7','#64748b',
];

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'success'|'error'|'info' }) {
  const colors = {
    success: 'bg-emerald-950/95 border-emerald-500/30 text-emerald-300',
    error:   'bg-red-950/95     border-red-500/30     text-red-300',
    info:    'bg-blue-950/95    border-blue-500/30    text-blue-300',
  };
  const icons = { success: '✓', error: '✕', info: '📢' };
  return (
    <motion.div initial={{ opacity:0, y:-24, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:-10 }}
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl backdrop-blur-xl border ${colors[type]}`}>
      {icons[type]} {msg}
    </motion.div>
  );
}

// ─── Mini Scoreboard ─────────────────────────────────────────────────────────
function MiniScoreboard({ teams, scores }: { teams: any[]; scores: any[] }) {
  const totals = teams
    .map(t => ({ ...t, total: scores.filter(s => s.team_id === t.id).reduce((a,s)=>a+s.score,0) }))
    .sort((a,b) => b.total - a.total);
  const max = Math.max(...totals.map(t=>t.total), 1);
  return (
    <div className="flex flex-col gap-2.5">
      {totals.map((team, i) => (
        <div key={team.id} className="relative rounded-xl overflow-hidden border" style={{ borderColor:`${team.color_hex}20` }}>
          <div className="absolute inset-0 rounded-xl transition-all duration-700"
            style={{ width:`${Math.max((team.total/max)*100,3)}%`, background:`${team.color_hex}15` }} />
          <div className="relative z-10 flex items-center gap-3 px-4 py-3">
            <div className="w-1 h-8 rounded-full shrink-0" style={{ background:team.color_hex }} />
            <div className="flex-1 min-w-0">
              <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">#{i+1}</div>
              <div className="text-sm font-black text-white uppercase tracking-tight truncate">{team.name}</div>
            </div>
            <div className={`text-xl font-black tabular-nums ${team.total < 0 ? 'text-red-400' : ''}`} style={team.total >= 0 ? { color:team.color_hex } : {}}>
              {team.total.toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function AdminScoreboard() {
  const [teams,       setTeams]       = useState<any[]>([]);
  const [categories,  setCategories]  = useState<any[]>([]);
  const [scores,      setScores]      = useState<any[]>([]);
  const [config,      setConfig]      = useState<Record<string,string>>({});
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState<'score'|'history'|'announce'|'categories'|'teams'|'event'>('score');
  const [submitting,  setSubmitting]  = useState(false);
  const [toast,       setToast]       = useState<{ type:'success'|'error'|'info'; msg:string }|null>(null);

  // Score entry
  const [selCat,    setSelCat]    = useState('');
  const [selTeam,   setSelTeam]   = useState('');
  const [selRank,   setSelRank]   = useState(0);
  const [scoreMode, setScoreMode] = useState<'award'|'deduct'>('award');
  const [customPts, setCustomPts] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  // Team editing
  const [editingTeam, setEditingTeam] = useState<string|null>(null);
  const [teamDraft,   setTeamDraft]   = useState<Record<string,{name:string; color_hex:string}>>({});

  // Category editing
  const [editingCat, setEditingCat] = useState<string|null>(null);
  const [catDraft,   setCatDraft]   = useState<{event_name:string; event_type:string; status:string}>({ event_name:'', event_type:'A', status:'active' });
  const [addingCat,  setAddingCat]  = useState(false);
  const [newCat,     setNewCat]     = useState({ event_name:'', event_type:'A' });

  // Announcement
  const [announcement, setAnnouncement] = useState('');
  const [annActive,    setAnnActive]    = useState(false);

  // Config draft
  const [configDraft, setConfigDraft] = useState<Record<string,string>>({});

  const showToast = useCallback((type:'success'|'error'|'info', msg:string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchAll = async () => {
    const [t, c, s, cfg] = await Promise.all([
      supabase.from('teams').select('*').order('name'),
      supabase.from('event_categories').select('*').order('event_name'),
      supabase.from('game_scores').select('*, teams(name, color_hex), event_categories(event_name)').order('created_at', { ascending: false }),
      supabase.from('scoreboard_config').select('*'),
    ]);
    if (t.data)   setTeams(t.data);
    if (c.data)   setCategories(c.data);
    if (s.data)   setScores(s.data);
    if (cfg.data) {
      const map: Record<string,string> = {};
      cfg.data.forEach((r:any) => { map[r.key] = r.value; });
      setConfig(map);
      setConfigDraft(map);
      setAnnouncement(map['announcement_text'] || '');
      setAnnActive(map['announcement_active'] === 'true');
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Score Entry ──────────────────────────────────────────────────────────
  const currentCat = categories.find(c => c.id === selCat);
  const ruleKey    = currentCat?.event_type as string | undefined;
  const rule       = EVENT_TYPES.find(r => r.key === ruleKey);
  const presetPts  = rule?.scores[selRank] ?? 0;
  const finalPts   = useCustom ? parseInt(customPts || '0', 10) : presetPts;
  const awardedPts = scoreMode === 'award' ? finalPts : -Math.abs(finalPts);

  const handleAwardScore = async () => {
    if (!selCat || !selTeam) return showToast('error', 'Select a team and event first');
    if (finalPts === 0) return showToast('error', 'Score is 0 — nothing to record');
    setSubmitting(true);
    const { error } = await supabase.from('game_scores').insert([{ team_id:selTeam, category_id:selCat, score:awardedPts }]);
    setSubmitting(false);
    if (error) return showToast('error', error.message);
    await fetchAll();
    const tName = teams.find(t=>t.id===selTeam)?.name || '';
    const sign = scoreMode === 'award' ? '+' : '';
    showToast(scoreMode === 'award' ? 'success' : 'info', `${tName} ${sign}${awardedPts} pts`);
    setSelTeam('');
    setCustomPts('');
  };

  // ── Delete score entry ────────────────────────────────────────────────────
  const handleDeleteScore = async (id: string, pts: number) => {
    if (!confirm(`Delete this score entry (${pts > 0 ? '+' : ''}${pts} pts)? The score will be reversed.`)) return;
    await supabase.from('game_scores').delete().eq('id', id);
    await fetchAll();
    showToast('info', 'Score entry removed');
  };

  // ── Reset all ─────────────────────────────────────────────────────────────
  const handleReset = async () => {
    if (!confirm('Reset ALL scores? This cannot be undone.')) return;
    await supabase.from('game_scores').delete().neq('id','00000000-0000-0000-0000-000000000000');
    await fetchAll();
    showToast('info', 'All scores cleared');
  };

  // ── Announcement ─────────────────────────────────────────────────────────
  const pushAnnouncement = async () => {
    if (!announcement.trim()) return;
    await Promise.all([
      supabase.from('scoreboard_config').upsert({ key:'announcement_text',   value:announcement.trim(), updated_at: new Date().toISOString() }),
      supabase.from('scoreboard_config').upsert({ key:'announcement_active', value:'true',               updated_at: new Date().toISOString() }),
    ]);
    setAnnActive(true);
    showToast('info', 'Announcement pushed to broadcast');
  };

  const clearAnnouncement = async () => {
    await supabase.from('scoreboard_config').upsert({ key:'announcement_active', value:'false', updated_at: new Date().toISOString() });
    setAnnActive(false);
    showToast('success', 'Announcement cleared from broadcast');
  };

  // ── Team editing ──────────────────────────────────────────────────────────
  const startEditTeam = (team:any) => {
    setEditingTeam(team.id);
    setTeamDraft(prev => ({ ...prev, [team.id]: { name:team.name, color_hex:team.color_hex } }));
  };
  const saveTeam = async (id:string) => {
    const d = teamDraft[id];
    if (!d) return;
    const { error } = await supabase.from('teams').update({ name:d.name.trim(), color_hex:d.color_hex }).eq('id', id);
    if (error) return showToast('error', error.message);
    setTeams(prev => prev.map(t => t.id===id ? {...t,...d} : t));
    setEditingTeam(null);
    showToast('success', 'Team updated — broadcast synced');
  };

  // ── Category CRUD ─────────────────────────────────────────────────────────
  const startEditCat = (cat:any) => {
    setEditingCat(cat.id);
    setCatDraft({ event_name:cat.event_name, event_type:cat.event_type, status:cat.status });
  };
  const saveCat = async (id:string) => {
    const { error } = await supabase.from('event_categories').update(catDraft).eq('id', id);
    if (error) return showToast('error', error.message);
    setCategories(prev => prev.map(c => c.id===id ? {...c,...catDraft} : c));
    setEditingCat(null);
    showToast('success', 'Category updated');
  };
  const deleteCat = async (id:string, name:string) => {
    if (!confirm(`Delete category "${name}"? All its scores will be removed too.`)) return;
    await supabase.from('game_scores').delete().eq('category_id', id);
    await supabase.from('event_categories').delete().eq('id', id);
    await fetchAll();
    showToast('info', `Category "${name}" deleted`);
  };
  const addCat = async () => {
    if (!newCat.event_name.trim()) return showToast('error', 'Enter a category name');
    const { error } = await supabase.from('event_categories').insert([{ event_name:newCat.event_name.trim(), event_type:newCat.event_type, status:'active' }]);
    if (error) return showToast('error', error.message);
    await fetchAll();
    setNewCat({ event_name:'', event_type:'A' });
    setAddingCat(false);
    showToast('success', 'Category added');
  };

  // ── Event Config ──────────────────────────────────────────────────────────
  const saveConfig = async () => {
    await Promise.all(Object.entries(configDraft).map(([key, value]) =>
      supabase.from('scoreboard_config').upsert({ key, value, updated_at: new Date().toISOString() })
    ));
    setConfig(configDraft);
    showToast('success', 'Event settings saved');
  };

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const TABS = [
    { key:'score',      icon:'🎯', label:'Score Entry' },
    { key:'history',    icon:'📋', label:'History' },
    { key:'announce',   icon:'📢', label:'Announce',   badge: annActive ? '●' : undefined },
    { key:'categories', icon:'🏅', label:'Events' },
    { key:'teams',      icon:'🏳️', label:'Teams' },
    { key:'event',      icon:'⚙️', label:'Setup' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#09090b] text-white" style={{ fontFamily:"'Inter', sans-serif" }}>
      <AnimatePresence>{toast && <Toast key="toast" msg={toast.msg} type={toast.type} />}</AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#09090b]/95 backdrop-blur-xl px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/apps/zto-arena"
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white transition-all text-sm">←</Link>
            <div>
              <p className="text-[9px] font-black tracking-[0.4em] text-zinc-600 uppercase">{config.organizer || 'Event OS'}</p>
              <h1 className="text-lg font-black text-white uppercase tracking-tight leading-tight">{config.event_title || 'Scoreboard'} — Admin</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {annActive && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-[9px] font-black text-orange-400 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />Announcing
              </div>
            )}

            {/* Broadcast Theme Picker */}
            <div className="flex items-stretch rounded-xl border border-white/[0.08] overflow-hidden">
              <div className="flex items-center px-3 text-[9px] font-black text-zinc-600 uppercase tracking-widest border-r border-white/[0.08] bg-white/[0.03]">
                📺 Broadcast
              </div>
              <Link href="/scoreboard/broadcast" target="_blank"
                className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.03] hover:bg-white/10 border-r border-white/[0.08] text-[10px] font-black text-zinc-400 hover:text-white transition-all"
                title="Cinematic Dark theme">
                🎬 <span className="hidden sm:inline">Dark</span>
              </Link>
              <Link href="/scoreboard/broadcast-fun" target="_blank"
                className="flex items-center gap-1.5 px-3 py-2 hover:bg-teal-500/10 text-[10px] font-black text-zinc-400 hover:text-teal-300 transition-all"
                title="House Cup Fun theme"
                style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.05), rgba(234,179,8,0.05))' }}>
                🎪 <span className="hidden sm:inline">Fun</span>
              </Link>
            </div>

            <Link href="/scoreboard/public" target="_blank"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.08] text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all">
              📱
            </Link>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="border-b border-white/[0.05] px-6">
        <div className="max-w-6xl mx-auto flex gap-0.5 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 -mb-px shrink-0 ${
                tab===t.key ? 'border-white text-white' : 'border-transparent text-zinc-600 hover:text-zinc-300'
              }`}>
              <span>{t.icon}</span> {t.label}
              {t.badge && <span className="text-orange-500 text-[6px]">{t.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">

          {/* ══ SCORE ENTRY ══ */}
          {tab==='score' && (
            <motion.div key="score" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
              <div className="space-y-7">

                {/* Step 1: Event */}
                <section>
                  <p className="text-[9px] font-black tracking-[0.4em] text-zinc-600 uppercase mb-4">Step 1 — Event Category</p>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.filter(c=>c.status!=='inactive').map(c => {
                      const r = EVENT_TYPES.find(r=>r.key===c.event_type);
                      const active = selCat===c.id;
                      return (
                        <button key={c.id} onClick={() => { setSelCat(c.id); setSelRank(0); setUseCustom(false); }}
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${active ? 'border-white bg-white/10' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/20'}`}>
                          <div className="text-sm font-black text-white uppercase tracking-tight mb-1">{c.event_name}</div>
                          <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                            {r ? r.scores.filter(s=>s>0).join(' / ')+' pts' : c.event_type}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Step 2: Mode + Team */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <p className="text-[9px] font-black tracking-[0.4em] text-zinc-600 uppercase">Step 2 — Mode & Team</p>
                    {/* Award / Deduct toggle */}
                    <div className="ml-auto flex rounded-xl overflow-hidden border border-white/10">
                      {(['award','deduct'] as const).map(m => (
                        <button key={m} onClick={()=>setScoreMode(m)}
                          className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${scoreMode===m
                            ? m==='award' ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'
                            : 'text-zinc-600 hover:text-zinc-300'}`}>
                          {m==='award'?'＋ Award':'－ Deduct'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {teams.map(t => {
                      const active = selTeam===t.id;
                      return (
                        <button key={t.id} onClick={()=>setSelTeam(t.id)}
                          className="p-4 rounded-2xl border-2 text-left transition-all duration-200"
                          style={active ? { borderColor:t.color_hex, background:`${t.color_hex}18`, boxShadow:`0 0 20px ${t.color_hex}25` }
                            : { borderColor:'rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.02)' }}>
                          <div className="flex items-center gap-3 mb-1">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ background:t.color_hex, boxShadow:active?`0 0 10px ${t.color_hex}`:'none' }} />
                            <span className="text-sm font-black text-white uppercase tracking-tight">{t.name}</span>
                          </div>
                          <div className="text-[9px] text-zinc-600 font-bold pl-6">
                            {scores.filter(s=>s.team_id===t.id).reduce((a,s)=>a+s.score,0)} pts total
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Step 3: Points */}
                {rule && (
                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <p className="text-[9px] font-black tracking-[0.4em] text-zinc-600 uppercase">Step 3 — Points</p>
                      <button onClick={()=>setUseCustom(v=>!v)}
                        className={`ml-auto px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${useCustom ? 'border-white/30 text-white bg-white/10' : 'border-white/10 text-zinc-600 hover:text-zinc-300'}`}>
                        Custom
                      </button>
                    </div>

                    {useCustom ? (
                      <div className="flex items-center gap-3">
                        <input type="number" value={customPts} onChange={e=>setCustomPts(e.target.value)}
                          placeholder="e.g. 50" min="0"
                          className="flex-1 bg-black/60 border border-white/10 rounded-2xl px-5 py-4 font-black text-white text-xl focus:outline-none focus:border-white/30 transition-all tabular-nums" />
                        <div className={`text-xl font-black px-4 ${scoreMode==='award' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {scoreMode==='award'?'+':'-'}{customPts||'?'} pts
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-3">
                        {rule.scores.map((p,idx) => {
                          const active = selRank===idx;
                          return (
                            <button key={idx} onClick={()=>setSelRank(idx)} disabled={p===0}
                              className={`p-4 rounded-2xl border-2 text-center transition-all disabled:opacity-20 disabled:cursor-not-allowed ${active ? 'bg-white border-white text-black' : 'border-white/[0.07] bg-white/[0.03] text-white hover:border-white/20'}`}>
                              <div className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1.5">{ORDINALS[idx]}</div>
                              <div className={`text-2xl font-black tabular-nums ${scoreMode==='deduct' && active ? 'text-red-400' : ''}`}>
                                {scoreMode==='award' ? '+' : '-'}{p}
                              </div>
                              <div className="text-[9px] font-bold uppercase opacity-40 mt-1">pts</div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </section>
                )}

                {/* Submit */}
                <button onClick={handleAwardScore} disabled={submitting||!selCat||!selTeam}
                  className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.25em] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  style={{
                    background: scoreMode==='deduct' ? 'rgba(239,68,68,0.8)' :
                      (selTeam ? teams.find(t=>t.id===selTeam)?.color_hex : 'rgba(255,255,255,0.07)'),
                    color: (scoreMode==='deduct' || selTeam) ? '#fff' : '#555',
                  }}>
                  {submitting
                    ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Submitting...</>
                    : scoreMode==='award'
                      ? <>🏅 Award {finalPts>0?`+${finalPts} pts`:'Score'}</>
                      : <>⬇️ Deduct {finalPts>0?`${awardedPts} pts`:''}</>
                  }
                </button>
              </div>

              {/* Right: scoreboard */}
              <div>
                <p className="text-[9px] font-black tracking-[0.4em] text-zinc-600 uppercase mb-5">Live Standings</p>
                {loading ? [1,2,3,4].map(i=><div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse mb-3" />) : <MiniScoreboard teams={teams} scores={scores} />}
                <div className="mt-4 text-[9px] text-zinc-700 font-bold uppercase tracking-widest text-center">{scores.length} entries recorded</div>
                <button onClick={handleReset} className="mt-6 w-full py-3 rounded-xl border border-red-500/15 text-[10px] font-black text-red-700 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/5 uppercase tracking-widest transition-all">
                  ⚠️ Reset All Scores
                </button>
              </div>
            </motion.div>
          )}

          {/* ══ SCORE HISTORY ══ */}
          {tab==='history' && (
            <motion.div key="history" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
              <p className="text-[9px] font-black tracking-[0.4em] text-zinc-600 uppercase mb-6">Score History — Click × to reverse an entry</p>
              {scores.length === 0 && <div className="py-16 text-center text-zinc-700 font-black uppercase tracking-widest text-sm">No entries yet</div>}
              <div className="flex flex-col gap-2">
                {scores.map((s:any) => {
                  const team = teams.find(t=>t.id===s.team_id);
                  const cat  = categories.find(c=>c.id===s.category_id);
                  const isPos = s.score >= 0;
                  return (
                    <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/10 transition-all group">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: team?.color_hex || '#666' }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-black text-white uppercase tracking-tight truncate">{team?.name || '—'}</div>
                        <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">
                          {cat?.event_name || '—'} · {new Date(s.created_at).toLocaleTimeString('en-MY', { hour12:false })}
                        </div>
                      </div>
                      <div className={`text-xl font-black tabular-nums ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPos?'+':''}{s.score}
                      </div>
                      <button onClick={() => handleDeleteScore(s.id, s.score)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 text-xs font-black">
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ══ ANNOUNCE ══ */}
          {tab==='announce' && (
            <motion.div key="announce" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="max-w-xl space-y-6">
              <p className="text-[9px] font-black tracking-[0.4em] text-zinc-600 uppercase mb-2">Push Announcement to Broadcast Screen</p>
              <div className={`p-4 rounded-2xl border flex items-center gap-3 ${annActive ? 'border-orange-500/40 bg-orange-500/10' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${annActive ? 'bg-orange-500 animate-pulse' : 'bg-zinc-700'}`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${annActive ? 'text-orange-300' : 'text-zinc-600'}`}>
                  {annActive ? 'Announcement is LIVE on broadcast' : 'No announcement active'}
                </span>
              </div>

              <div>
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-3">Announcement Text</label>
                <textarea
                  value={announcement}
                  onChange={e=>setAnnouncement(e.target.value)}
                  rows={3}
                  placeholder={"CALLING: JOHN DOE\nPlease proceed to Court 1 immediately"}
                  className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 font-black text-white text-base focus:outline-none focus:border-white/30 transition-all resize-none leading-relaxed"
                />
                <p className="text-[9px] text-zinc-700 mt-1.5">Displayed as a full-screen overlay on the broadcast. Use short, bold text.</p>
              </div>

              {/* Quick templates */}
              <div>
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-3">Quick Templates</label>
                <div className="flex flex-col gap-2">
                  {[
                    'CALLING: ___\nPlease proceed to the starting line',
                    'NEXT EVENT STARTING IN 5 MINUTES',
                    'ALL PARTICIPANTS — PLEASE ASSEMBLE AT THE MAIN FIELD',
                    'BREAK TIME — RESUME AT 2:00 PM',
                    'FINAL RESULTS NOW ANNOUNCED',
                  ].map((tmpl, i) => (
                    <button key={i} onClick={()=>setAnnouncement(tmpl)}
                      className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/15 text-left text-[10px] text-zinc-500 hover:text-white font-bold transition-all leading-relaxed whitespace-pre-line">
                      {tmpl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={pushAnnouncement}
                  className="flex-1 py-4 rounded-2xl bg-orange-500 text-black font-black text-sm uppercase tracking-widest hover:bg-orange-400 transition-all">
                  📢 Push to Broadcast
                </button>
                {annActive && (
                  <button onClick={clearAnnouncement}
                    className="px-6 py-4 rounded-2xl border border-white/10 text-[11px] font-black text-zinc-500 hover:text-white hover:border-white/20 uppercase tracking-widest transition-all">
                    Clear
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* ══ CATEGORIES ══ */}
          {tab==='categories' && (
            <motion.div key="categories" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <p className="text-[9px] font-black tracking-[0.4em] text-zinc-600 uppercase">Event Categories</p>
                <button onClick={()=>setAddingCat(v=>!v)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${addingCat ? 'border-white/10 text-zinc-600' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'}`}>
                  {addingCat ? '✕ Cancel' : '+ New Category'}
                </button>
              </div>

              {/* Add form */}
              <AnimatePresence>
                {addingCat && (
                  <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
                    className="mb-5 p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-4 overflow-hidden">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Event Name</label>
                        <input value={newCat.event_name} onChange={e=>setNewCat(p=>({...p,event_name:e.target.value}))}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 font-black text-white text-sm focus:outline-none focus:border-white/30"
                          placeholder="e.g. Sack Race" />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Score Type</label>
                        <select value={newCat.event_type} onChange={e=>setNewCat(p=>({...p,event_type:e.target.value}))}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 font-black text-white text-sm focus:outline-none focus:border-white/30">
                          {EVENT_TYPES.map(t=><option key={t.key} value={t.key}>{t.label} — {t.sub} ({t.scores.filter(s=>s>0).join('/')})</option>)}
                        </select>
                      </div>
                    </div>
                    <button onClick={addCat} className="w-full py-3 rounded-xl bg-emerald-500 text-black font-black text-[11px] uppercase tracking-widest hover:bg-emerald-400 transition-all">
                      Add Category
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-3">
                {categories.map(cat => {
                  const isEditing = editingCat===cat.id;
                  const r = EVENT_TYPES.find(r=>r.key===cat.event_type);
                  const catScoreTotal = scores.filter(s=>s.category_id===cat.id).reduce((a,s)=>a+s.score,0);
                  return (
                    <div key={cat.id} className={`rounded-2xl border overflow-hidden transition-all ${isEditing ? 'border-blue-500/30 bg-blue-500/5' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                      {!isEditing ? (
                        <div className="flex items-center gap-4 p-4">
                          <div className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${cat.status==='inactive' ? 'bg-zinc-800 text-zinc-600' : 'bg-white/10 text-white'}`}>
                            {cat.event_type}
                          </div>
                          <div className="flex-1">
                            <div className={`text-sm font-black uppercase tracking-tight ${cat.status==='inactive' ? 'text-zinc-600' : 'text-white'}`}>{cat.event_name}</div>
                            <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">
                              {r?.scores.filter(s=>s>0).join('/')+'pts'} · {scores.filter(s=>s.category_id===cat.id).length} entries · {catScoreTotal} pts awarded
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={()=>startEditCat(cat)} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[9px] font-black text-zinc-400 hover:text-white uppercase tracking-widest transition-all">Edit</button>
                            <button onClick={()=>deleteCat(cat.id, cat.event_name)} className="px-3 py-1.5 rounded-lg hover:bg-red-500/10 text-[9px] font-black text-zinc-700 hover:text-red-400 uppercase tracking-widest transition-all">Del</button>
                          </div>
                        </div>
                      ) : (
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="p-5 space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Name</label>
                              <input value={catDraft.event_name} onChange={e=>setCatDraft(p=>({...p,event_name:e.target.value}))}
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 font-black text-white text-sm focus:outline-none focus:border-white/30" />
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Score Type</label>
                              <select value={catDraft.event_type} onChange={e=>setCatDraft(p=>({...p,event_type:e.target.value}))}
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 font-black text-white text-sm focus:outline-none focus:border-white/30">
                                {EVENT_TYPES.map(t=><option key={t.key} value={t.key}>{t.label} — {t.sub}</option>)}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Status</label>
                            <div className="flex gap-2">
                              {(['active','inactive'] as const).map(s=>(
                                <button key={s} onClick={()=>setCatDraft(p=>({...p,status:s}))}
                                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${catDraft.status===s ? 'border-white text-white bg-white/10' : 'border-white/10 text-zinc-600'}`}>
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button onClick={()=>setEditingCat(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-all">Cancel</button>
                            <button onClick={()=>saveCat(cat.id)} className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-blue-400 transition-all">Save</button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ══ TEAMS ══ */}
          {tab==='teams' && (
            <motion.div key="teams" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="max-w-2xl">
              <p className="text-[9px] font-black tracking-[0.4em] text-zinc-600 uppercase mb-6">Team Config — Edits sync to broadcast in real time</p>
              <div className="flex flex-col gap-4">
                {teams.map(team => {
                  const isEditing = editingTeam===team.id;
                  const draft = teamDraft[team.id] || { name:team.name, color_hex:team.color_hex };
                  return (
                    <div key={team.id} className="rounded-2xl border overflow-hidden transition-all duration-200"
                      style={{ borderColor:isEditing?`${draft.color_hex}40`:'rgba(255,255,255,0.06)', background:isEditing?`${draft.color_hex}08`:'rgba(255,255,255,0.02)' }}>
                      {!isEditing ? (
                        <div className="flex items-center gap-4 p-5">
                          <div className="w-5 h-5 rounded-full shrink-0" style={{ background:team.color_hex, boxShadow:`0 0 12px ${team.color_hex}60` }} />
                          <div className="flex-1">
                            <div className="text-base font-black text-white uppercase tracking-tight">{team.name}</div>
                            <div className="text-[9px] text-zinc-600 font-mono mt-0.5">{team.color_hex} · {scores.filter(s=>s.team_id===team.id).reduce((a,s)=>a+s.score,0)} pts</div>
                          </div>
                          <button onClick={()=>startEditTeam(team)} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.08] text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all">Edit</button>
                        </div>
                      ) : (
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="p-5 space-y-5">
                          <div>
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Team Name</label>
                            <input type="text" value={draft.name}
                              onChange={e=>setTeamDraft(prev=>({...prev,[team.id]:{...draft,name:e.target.value.toUpperCase()}}))}
                              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 font-black text-white uppercase tracking-wider text-sm focus:outline-none focus:border-white/30" />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-3">Team Color</label>
                            <div className="flex flex-wrap gap-2.5 mb-3">
                              {COLOR_PRESETS.map(hex=>(
                                <button key={hex} onClick={()=>setTeamDraft(prev=>({...prev,[team.id]:{...draft,color_hex:hex}}))}
                                  className="w-9 h-9 rounded-xl border-2 transition-all"
                                  style={{ background:hex, borderColor:draft.color_hex===hex?'white':'transparent', boxShadow:draft.color_hex===hex?`0 0 12px ${hex}`:'none' }} />
                              ))}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg border border-white/20" style={{ background:draft.color_hex }} />
                              <input type="text" value={draft.color_hex}
                                onChange={e=>setTeamDraft(prev=>({...prev,[team.id]:{...draft,color_hex:e.target.value}}))}
                                className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-white/30 w-32"
                                maxLength={7} placeholder="#ef4444" />
                              <span className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest">Custom HEX</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor:`${draft.color_hex}30`, background:`${draft.color_hex}10` }}>
                            <div className="w-3 h-3 rounded-full" style={{ background:draft.color_hex }} />
                            <span className="font-black text-white uppercase text-sm">{draft.name||'PREVIEW'}</span>
                          </div>
                          <div className="flex gap-3">
                            <button onClick={()=>setEditingTeam(null)} className="flex-1 py-3 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">Cancel</button>
                            <button onClick={()=>saveTeam(team.id)} className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all" style={{ background:draft.color_hex, color:'#000' }}>
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

          {/* ══ EVENT SETUP ══ */}
          {tab==='event' && (
            <motion.div key="event" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="max-w-xl space-y-7">
              <p className="text-[9px] font-black tracking-[0.4em] text-zinc-600 uppercase">Event Configuration</p>
              {[
                { key:'organizer',      label:'Organiser / Company', placeholder:'Shell MDS Sarawak', hint:'Shown in broadcast header' },
                { key:'event_title',    label:'Event Title',         placeholder:'Family Day 2026',   hint:'Main headline on all screens' },
                { key:'event_subtitle', label:'Subtitle',            placeholder:'Live Scoreboard',   hint:'Secondary line below title' },
              ].map(f=>(
                <div key={f.key}>
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2">{f.label}</label>
                  <input type="text" value={configDraft[f.key]||''} onChange={e=>setConfigDraft(p=>({...p,[f.key]:e.target.value}))}
                    className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 font-black text-white text-sm focus:outline-none focus:border-white/30 transition-all"
                    placeholder={f.placeholder} />
                  <p className="text-[9px] text-zinc-700 mt-1.5">{f.hint}</p>
                </div>
              ))}

              {/* Logo Upload */}
              <div>
                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Company Logo (Optional)</label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer bg-black/60 border border-white/10 hover:border-white/30 rounded-2xl px-5 py-4 font-black text-white text-sm transition-all text-center flex-1">
                    📁 Choose Image...
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) return showToast('error', 'Image too large (max 2MB)');
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) setConfigDraft(p => ({ ...p, logo_url: ev.target!.result as string }));
                      };
                      reader.readAsDataURL(file);
                    }} />
                  </label>
                  {configDraft.logo_url && (
                    <button onClick={() => setConfigDraft(p => ({...p, logo_url: ''}))} 
                      className="px-5 py-4 rounded-2xl border border-red-500/30 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/10 transition-all">
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-[9px] text-zinc-700 mt-1.5">PNG, SVG, or WebP. Max 2MB.</p>
              </div>
              <div className="p-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] flex items-center gap-6">
                {configDraft.logo_url && (
                  <img src={configDraft.logo_url} alt="Logo" className="w-20 h-20 object-contain shrink-0" />
                )}
                <div>
                  <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-3">Preview</div>
                  <div className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em]">{configDraft.organizer||'—'}</div>
                  <div className="text-2xl font-black text-white uppercase tracking-tight">{configDraft.event_title||'—'}</div>
                  <div className="text-[10px] text-zinc-500 tracking-[0.3em] uppercase font-bold">{configDraft.event_subtitle||'—'}</div>
                </div>
              </div>
              <button onClick={saveConfig} className="w-full py-4 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-[0.3em] hover:bg-zinc-200 transition-all">
                Save Event Config
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
