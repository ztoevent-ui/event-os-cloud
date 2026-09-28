"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';

const SCORE_RULES = {
  'A':      { label: 'A类 — 大型道具竞技', scores: [100, 75, 50, 25] },
  'B_team': { label: 'B类 — 田径团队赛事', scores: [60, 40, 20, 10] },
  'B_ind':  { label: 'B类 — 田径个人赛事', scores: [30, 20, 10, 5] },
  'C':      { label: 'C类 — 四向十字拔河', scores: [200, 0, 0, 0] },
};

const ORDINALS = ['1ST', '2ND', '3RD', '4TH'];

export default function AdminScoreboard() {
  const [teams, setTeams] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [selectedCat, setSelectedCat] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedRankIdx, setSelectedRankIdx] = useState(0);

  useEffect(() => {
    Promise.all([
      supabase.from('teams').select('*'),
      supabase.from('event_categories').select('*'),
      supabase.from('game_scores').select('*'),
    ]).then(([t, c, s]) => {
      if (t.data) setTeams(t.data);
      if (c.data) setCategories(c.data);
      if (s.data) setScores(s.data);
      setLoading(false);
    });
  }, []);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const currentCat = categories.find(c => c.id === selectedCat);
  const ruleKey = currentCat?.event_type as keyof typeof SCORE_RULES | undefined;
  const rule = ruleKey ? SCORE_RULES[ruleKey] : null;
  const scoreToAward = rule?.scores[selectedRankIdx] ?? 0;

  const teamTotals = teams.map(t => ({
    ...t,
    total: scores.filter(s => s.team_id === t.id).reduce((sum, s) => sum + s.score, 0),
  })).sort((a, b) => b.total - a.total);

  const handleSubmit = async () => {
    if (!selectedCat || !selectedTeam) return showToast('error', '请选择队伍和赛事类别');
    if (scoreToAward === 0 && ruleKey !== 'C') return showToast('error', '得分为 0，无需录入');
    setSubmitting(true);
    const { error } = await supabase.from('game_scores').insert([{
      team_id: selectedTeam,
      category_id: selectedCat,
      score: scoreToAward,
    }]);
    setSubmitting(false);
    if (error) {
      showToast('error', error.message);
    } else {
      // Refresh scores
      supabase.from('game_scores').select('*').then(res => res.data && setScores(res.data));
      showToast('success', `+${scoreToAward} pts 已录入`);
      setSelectedTeam('');
    }
  };

  const handleReset = async () => {
    if (!confirm('确定清空所有比分记录？此操作不可撤销。')) return;
    await supabase.from('game_scores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    setScores([]);
    showToast('success', '已清空所有比分记录');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl ${
            toast.type === 'success'
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/20 border border-red-500/40 text-red-300'
          }`}
        >
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </motion.div>
      )}

      {/* Header */}
      <header className="border-b border-white/[0.05] px-8 py-5 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black tracking-[0.4em] text-zinc-600 uppercase mb-0.5">Admin Panel</p>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">Scoreboard Control</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/scoreboard/broadcast" target="_blank"
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all">
            📺 Broadcast
          </Link>
          <Link href="/scoreboard/public" target="_blank"
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all">
            📱 Public
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">

        {/* LEFT: Score Entry */}
        <div className="space-y-8">
          <div>
            <p className="text-[9px] font-black tracking-[0.4em] text-zinc-600 uppercase mb-5">录入成绩</p>

            {/* Category select */}
            <div className="mb-6">
              <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">
                1. 选择赛事类别
              </label>
              <div className="grid grid-cols-2 gap-3">
                {categories.map(c => {
                  const r = SCORE_RULES[c.event_type as keyof typeof SCORE_RULES];
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCat(c.id); setSelectedRankIdx(0); }}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedCat === c.id
                          ? 'bg-white/10 border-white/30'
                          : 'bg-white/[0.02] border-white/[0.06] hover:border-white/15'
                      }`}
                    >
                      <div className="text-xs font-black text-white uppercase tracking-tight mb-1">{c.event_name}</div>
                      <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">
                        {r ? r.scores.filter(s => s > 0).join(' / ') + ' pts' : 'Type ' + c.event_type}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Team select */}
            <div className="mb-6">
              <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">
                2. 选择队伍
              </label>
              <div className="grid grid-cols-2 gap-3">
                {teams.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTeam(t.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedTeam === t.id ? 'border-current' : 'border-white/[0.06] hover:border-white/15 bg-white/[0.02]'
                    }`}
                    style={selectedTeam === t.id ? {
                      borderColor: t.color_hex,
                      background: `${t.color_hex}15`,
                      boxShadow: `0 0 20px ${t.color_hex}20`,
                    } : {}}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: t.color_hex }} />
                      <span className="text-sm font-black text-white uppercase tracking-tight">{t.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Rank select */}
            {rule && (
              <div className="mb-8">
                <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">
                  3. 名次 / 得分
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {rule.scores.map((pts, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedRankIdx(idx)}
                      disabled={pts === 0}
                      className={`p-4 rounded-xl border-2 text-center transition-all disabled:opacity-25 disabled:cursor-not-allowed ${
                        selectedRankIdx === idx
                          ? 'bg-white text-black border-white'
                          : 'bg-white/[0.03] border-white/[0.07] hover:border-white/20 text-white'
                      }`}
                    >
                      <div className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">{ORDINALS[idx]}</div>
                      <div className="text-2xl font-black tabular-nums">+{pts}</div>
                      <div className="text-[9px] font-bold uppercase tracking-widest opacity-50 mt-1">pts</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedCat || !selectedTeam}
              className="w-full py-5 rounded-2xl font-black text-base uppercase tracking-[0.3em] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              style={{
                background: selectedTeam
                  ? `linear-gradient(135deg, ${teams.find(t => t.id === selectedTeam)?.color_hex || '#fff'}, ${teams.find(t => t.id === selectedTeam)?.color_hex || '#fff'}90)`
                  : 'rgba(255,255,255,0.07)',
                color: selectedTeam ? '#000' : '#666',
              }}
            >
              {submitting ? (
                <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />录入中...</>
              ) : (
                <>AWARD {scoreToAward > 0 ? `+${scoreToAward} PTS` : 'SCORE'}</>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT: Live standings snapshot */}
        <div>
          <p className="text-[9px] font-black tracking-[0.4em] text-zinc-600 uppercase mb-5">实时积分榜</p>
          <div className="space-y-3">
            {loading
              ? [1, 2, 3, 4].map(i => (
                  <div key={i} className="h-16 rounded-xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />
                ))
              : teamTotals.map((team, i) => {
                  const maxScore = Math.max(...teamTotals.map(t => t.total), 1);
                  const pct = Math.max((team.total / maxScore) * 100, 2);
                  return (
                    <div key={team.id}
                      className="relative p-4 rounded-xl border overflow-hidden"
                      style={{ borderColor: `${team.color_hex}20`, background: `${team.color_hex}08` }}>
                      <div className="absolute left-0 top-0 bottom-0 rounded-l-xl w-1" style={{ background: team.color_hex }} />
                      <div className="absolute left-0 top-0 bottom-0 rounded-xl transition-all duration-700"
                        style={{ width: `${pct}%`, background: `${team.color_hex}12` }} />
                      <div className="relative z-10 flex items-center justify-between pl-2">
                        <div>
                          <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">#{i + 1}</div>
                          <div className="text-sm font-black text-white uppercase tracking-tight">{team.name}</div>
                        </div>
                        <div className="text-2xl font-black" style={{ color: team.color_hex }}>
                          {team.total.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>

          <button onClick={handleReset} className="mt-8 w-full py-3 rounded-xl border border-red-500/20 text-[10px] font-black text-red-500/50 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/5 uppercase tracking-widest transition-all">
            危险: 清空所有比分
          </button>
        </div>
      </div>
    </div>
  );
}
