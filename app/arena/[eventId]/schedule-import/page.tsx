'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { matchesToDbRows, type ParsedMatch } from '@/lib/pdf-schedule-parser';

const TYPE_COLORS: Record<string, string> = {
  MD1: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
  MD2: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300',
  WD:  'bg-pink-500/20 border-pink-500/40 text-pink-300',
  XD:  'bg-amber-500/20 border-amber-500/40 text-amber-300',
  V:   'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
  SINGLES: 'bg-zinc-500/20 border-zinc-500/40 text-zinc-300',
  DOUBLES: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
  MIXED:   'bg-orange-500/20 border-orange-500/40 text-orange-300',
  VETERANS:'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
};

function MatchCard({ match, selected, onToggle, index }: {
  match: ParsedMatch; selected: boolean; onToggle: () => void; index: number;
}) {
  const typeClass = TYPE_COLORS[match.match_type] || TYPE_COLORS.SINGLES;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.012 }}
      onClick={onToggle}
      className={`cursor-pointer border rounded-xl p-4 transition-all select-none ${
        selected
          ? 'bg-[#0056B3]/20 border-[#0056B3]/60 shadow-[0_0_16px_rgba(0,86,179,0.25)]'
          : 'bg-white/[0.03] border-white/8 hover:border-white/20 hover:bg-white/[0.05]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
          selected ? 'bg-[#0056B3] border-[#0056B3]' : 'border-white/20'
        }`}>
          {selected && <i className="fa-solid fa-check text-[8px] text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${typeClass}`}>
              {match.match_type_label}
            </span>
            <span className="text-[9px] font-black text-zinc-600 uppercase">Court {match.court_no}</span>
            <span className="text-[9px] text-zinc-700 ml-auto font-mono">{match.time_slot || 'TBD'}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-white">{match.team_a}</span>
            <span className="text-[10px] font-black text-[#a3e635] px-1.5 py-0.5 bg-[#a3e635]/10 rounded">VS</span>
            <span className="text-sm font-black text-white">{match.team_b}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ScheduleImportPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [rawPreview, setRawPreview] = useState('');
  const [parsedMatches, setParsedMatches] = useState<ParsedMatch[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importCount, setImportCount] = useState(0);
  const [fileName, setFileName] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterCourt, setFilterCourt] = useState('ALL');
  const [pageCount, setPageCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) { setError('请上传 PDF 文件'); return; }
    setFileName(file.name);
    setUploading(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/arena/parse-pdf', { method: 'POST', body: fd });
      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error || '解析失败');
        setUploading(false);
        return;
      }

      setPageCount(json.pageCount || 0);
      setRawPreview(json.rawTextPreview || '');
      setParsedMatches(json.matches || []);
      setSelectedIds(new Set((json.matches as ParsedMatch[]).map(m => m.id)));
      setStep('preview');
    } catch (e: any) {
      setError('上传失败：' + (e?.message || '网络错误'));
    }
    setUploading(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const toggleSelect = (id: string) => setSelectedIds(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  const toggleAll = () => {
    if (selectedIds.size === parsedMatches.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(parsedMatches.map(m => m.id)));
  };

  const handleImport = async () => {
    const toImport = parsedMatches.filter(m => selectedIds.has(m.id));
    if (!toImport.length) return;
    setImporting(true);
    const rows = matchesToDbRows(toImport, eventId);
    const { error: dbErr } = await supabase.from('arena_matches').insert(rows);
    if (dbErr) { setError('数据库写入失败：' + dbErr.message); setImporting(false); return; }
    setImportCount(toImport.length);
    setStep('done');
    setImporting(false);
  };

  const reset = () => { setStep('upload'); setParsedMatches([]); setSelectedIds(new Set()); setError(''); setRawPreview(''); };

  const allTypes = Array.from(new Set(parsedMatches.map(m => m.match_type)));
  const allCourts = Array.from(new Set(parsedMatches.map(m => m.court_no))).sort((a, b) => a - b);
  const visible = parsedMatches.filter(m =>
    (filterType === 'ALL' || m.match_type === filterType) &&
    (filterCourt === 'ALL' || m.court_no === Number(filterCourt))
  );
  const grouped: Record<string, ParsedMatch[]> = {};
  for (const m of visible) { const k = m.time_slot || 'TBD'; if (!grouped[k]) grouped[k] = []; grouped[k].push(m); }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-['Inter'] overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(0,86,179,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(163,230,53,0.04),transparent_60%)]" />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)', backgroundSize: '80px 80px' }} />
      </div>

      <div className="relative z-10">
        <header className="border-b border-white/5 bg-black/30 backdrop-blur-sm px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Link href={`/arena/${eventId}/admin`} className="text-[10px] font-black uppercase text-zinc-600 hover:text-white tracking-widest flex items-center gap-2 group">
              <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform" /> Master Console
            </Link>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#a3e635]/15 text-[#a3e635] rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-file-pdf text-xs" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">PDF 赛程解析器</span>
            </div>
          </div>
          {step === 'preview' && (
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <i className="fa-solid fa-circle-check text-[#a3e635]" />
              识别 {parsedMatches.length} 场 · {pageCount} 页
            </span>
          )}
        </header>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-xs font-bold">
              <i className="fa-solid fa-triangle-exclamation shrink-0" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError('')} className="hover:text-white">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto px-6 py-20">
              <div className="text-center mb-12">
                <div className="w-16 h-16 bg-[#a3e635]/10 text-[#a3e635] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(163,230,53,0.2)]">
                  <i className="fa-solid fa-brain text-2xl" />
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tight mb-3">PDF 赛程智能解析</h1>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  上传《民都鲁省姓氏匹克球锦标赛》赛程 PDF<br />
                  系统将自动识别场地、时段、参赛氏族与组别
                </p>
              </div>

              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300 ${
                  dragging ? 'border-[#a3e635] bg-[#a3e635]/5 shadow-[0_0_40px_rgba(163,230,53,0.15)]'
                           : 'border-white/10 hover:border-[#0056B3]/50 hover:bg-[#0056B3]/5'
                }`}
              >
                <input ref={fileInputRef} type="file" accept=".pdf" className="hidden"
                  onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />
                {uploading ? (
                  <div className="space-y-4">
                    <i className="fa-solid fa-server fa-bounce text-4xl text-[#0056B3]" />
                    <p className="text-sm font-black text-zinc-400 uppercase tracking-widest">服务器解析中...</p>
                    <p className="text-xs text-zinc-600">通常在 3-5 秒内完成</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <i className={`fa-solid fa-file-pdf text-5xl ${dragging ? 'text-[#a3e635]' : 'text-zinc-700'}`} />
                    <div>
                      <p className="text-base font-black text-white mb-1">拖放 PDF 至此，或点击上传</p>
                      <p className="text-xs text-zinc-600">文字版 PDF（非扫描图片）效果最佳</p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0056B3]/20 border border-[#0056B3]/40 rounded-full text-[#4da3ff] text-xs font-black uppercase tracking-widest">
                      <i className="fa-solid fa-upload" /> 选择文件
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                {[
                  { icon: 'fa-clock',         label: '时间段',  eg: '1500-1815' },
                  { icon: 'fa-location-dot',  label: '场地号',  eg: 'Court 1~7' },
                  { icon: 'fa-people-group',  label: '氏族名称', eg: '陈氏 林氏 黄氏' },
                  { icon: 'fa-trophy',        label: '组别代码', eg: 'MD1 MD2 WD XD V' },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                    <i className={`fa-solid ${item.icon} text-[#0056B3] mt-0.5 shrink-0`} />
                    <div>
                      <div className="text-[10px] font-black text-white uppercase tracking-widest">{item.label}</div>
                      <div className="text-[9px] text-zinc-600 mt-0.5">{item.eg}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: Preview */}
          {step === 'preview' && (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col h-[calc(100vh-53px)]">
              {/* Toolbar */}
              <div className="shrink-0 border-b border-white/5 bg-black/20 px-6 py-3 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500">
                  <i className="fa-solid fa-file-pdf text-[#a3e635]" />
                  <span className="truncate max-w-[160px]">{fileName}</span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                  className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black text-white uppercase tracking-widest focus:outline-none">
                  <option value="ALL">全部组别</option>
                  {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={filterCourt} onChange={e => setFilterCourt(e.target.value)}
                  className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black text-white uppercase tracking-widest focus:outline-none">
                  <option value="ALL">全部场地</option>
                  {allCourts.map(c => <option key={c} value={c}>Court {c}</option>)}
                </select>
                <button onClick={toggleAll} className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">
                  {selectedIds.size === parsedMatches.length ? '取消全选' : '全选'}
                </button>
                <div className="ml-auto flex items-center gap-3">
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">已选 {selectedIds.size}/{parsedMatches.length}</span>
                  <button onClick={reset} className="px-4 py-2 border border-white/10 rounded-lg text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-all">
                    重新上传
                  </button>
                  <button onClick={handleImport} disabled={importing || selectedIds.size === 0}
                    className="px-6 py-2 bg-[#0056B3] hover:bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 flex items-center gap-2 shadow-[0_0_20px_rgba(0,86,179,0.4)]">
                    {importing ? <><i className="fa-solid fa-spinner fa-spin" /> 写入中...</> : <><i className="fa-solid fa-database" /> 一键导入 ({selectedIds.size})</>}
                  </button>
                </div>
              </div>

              {/* Match list */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                {parsedMatches.length === 0 ? (
                  <div className="text-center py-24 text-zinc-600">
                    <i className="fa-solid fa-magnifying-glass text-4xl mb-4 block opacity-40" />
                    <p className="text-sm font-black uppercase tracking-widest mb-2">未识别到任何赛事</p>
                    <p className="text-xs text-zinc-700 mb-6">请确认 PDF 包含 VS 对阵信息和氏族名称（非扫描图片）</p>
                    {rawPreview && (
                      <div className="text-left p-4 bg-white/[0.02] border border-white/5 rounded-xl text-[10px] text-zinc-700 font-mono max-h-48 overflow-y-auto mx-auto max-w-2xl">
                        <div className="text-zinc-500 mb-2 font-sans font-black uppercase tracking-widest text-[9px]">PDF 原始文本预览：</div>
                        {rawPreview}
                      </div>
                    )}
                    <button onClick={reset} className="mt-4 px-6 py-2 border border-white/10 rounded-lg text-[10px] font-black text-zinc-400 hover:text-white uppercase tracking-widest">
                      重新上传
                    </button>
                  </div>
                ) : (
                  Object.entries(grouped).map(([slot, slotMatches]) => (
                    <div key={slot}>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-[#0056B3]/10 border border-[#0056B3]/30 rounded-lg">
                          <i className="fa-solid fa-clock text-[#0056B3] text-xs" />
                          <span className="text-xs font-black text-white uppercase tracking-widest">{slot}</span>
                          <span className="text-[10px] text-zinc-600">{slotMatches.length} 场</span>
                        </div>
                        <div className="flex-1 h-px bg-white/5" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {slotMatches.map((m, idx) => (
                          <MatchCard key={m.id} match={m} selected={selectedIds.has(m.id)} onToggle={() => toggleSelect(m.id)} index={idx} />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 3: Done */}
          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto px-6 py-32 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 bg-[#a3e635]/10 text-[#a3e635] rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_60px_rgba(163,230,53,0.3)]">
                <i className="fa-solid fa-circle-check text-4xl" />
              </motion.div>
              <h2 className="text-3xl font-black uppercase tracking-tight mb-3">导入成功</h2>
              <p className="text-zinc-500 text-sm mb-8">
                <span className="text-white font-black text-2xl">{importCount}</span> 场赛事已写入数据库
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link href={`/arena/${eventId}/scheduling`}
                  className="px-8 py-3 bg-[#0056B3] hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(0,86,179,0.4)] flex items-center gap-2">
                  <i className="fa-solid fa-calendar-check" /> 进入调度台
                </Link>
                <button onClick={reset}
                  className="px-8 py-3 border border-white/10 text-zinc-400 hover:text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                  <i className="fa-solid fa-plus mr-2" />再次导入
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
