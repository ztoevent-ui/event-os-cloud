'use client';

import React, { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { PrintReportButton } from '../../components/ProjectModals';
import { PrintBreakTrigger } from '../../components/PrintBreakTrigger';
import { usePrint } from '../../components/PrintContext';


interface ProgramRow {
  id: string;
  project_id: string;
  time: string;
  activities: string;
  movement: string;
  cues: string;
  song: string;
  volume: string;
  is_important?: boolean;
}

export default function TentativeProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const [rows, setRows] = useState<ProgramRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [project, setProject] = useState<any>(null);
  const { pageBreakIds } = usePrint();

  useEffect(() => {
    fetchProject();
    fetchProgram();
  }, [projectId]);

  const fetchProject = async () => {
    const { data } = await supabase.from('projects').select('type').eq('id', projectId).single();
    setProject(data);
  };
  
  const isWedding = project?.type === 'wedding' || project?.type === 'wedding_fair';
  const theme = isWedding ? {
    text: 'text-pink-500',
    bg: 'bg-pink-500',
    border: 'border-pink-400',
    shadow: 'shadow-[0_0_20px_rgba(236,72,153,0.3)]',
    text70: 'text-pink-500/70',
    text80: 'text-pink-500/80',
    bgFocus: 'focus:bg-pink-500/5'
  } : {
    text: 'text-amber-500',
    bg: 'bg-amber-500',
    border: 'border-amber-400',
    shadow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    text70: 'text-amber-500/70',
    text80: 'text-amber-500/80',
    bgFocus: 'focus:bg-amber-500/5'
  };

  const fetchProgram = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('program_items')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.error('Error fetching program:', error);
      // Fallback to empty rows if table doesn't exist yet but UI is loaded
      setRows([]);
    } else {
      setRows(data || []);
    }
    setLoading(false);
  };

  const handleFieldChange = async (id: string, field: keyof ProgramRow, value: string | boolean) => {
    // Optimistic update
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));

    // Persist to Supabase
    const { error } = await supabase
      .from('program_items')
      .update({ [field]: value })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating program item:', error);
    }
  };

  const addRow = async () => {
    const { data, error } = await supabase
      .from('program_items')
      .insert({
        project_id: projectId,
        time: '',
        activities: '',
        movement: '',
        cues: '',
        song: '',
        volume: '',
        is_important: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding program row:', error);
      // Fallback for UI if table doesn't exist yet
      if (error.code === '404' || error.message.includes('not found')) {
        alert('Table "program_items" not found. Please run the SQL script in Supabase first.');
      }
    } else if (data) {
      setRows([...rows, data]);
    }
  };

  const removeRow = async (id: string) => {
    if (!confirm('确定要删除这一行吗？')) return;
    
    // Optimistic update
    setRows(rows.filter(r => r.id !== id));

    const { error } = await supabase
      .from('program_items')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error removing program item:', error);
      fetchProgram(); // Rollback
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
        <i className={`fa-solid fa-circle-notch animate-spin text-4xl mb-6 ${theme.text}`}></i>
        <p className="font-black text-sm uppercase tracking-widest italic">Syncing with Command Center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-20">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#0a0a0a]/80 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/5 shadow-2xl">
        <div>
          <div className="flex items-center gap-3">
             <div className={`w-10 h-10 ${theme.bg} rounded-xl flex items-center justify-center text-black`}>
                <i className="fa-solid fa-list-check text-xl"></i>
             </div>
             <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">Tentative Program</h1>
          </div>
          <p className="text-zinc-500 mt-2 font-medium tracking-wide">Live event sequence control and production cues</p>
        </div>
        <div className="flex items-center gap-4 mt-6 md:mt-0">
            <button 
              onClick={() => setEditMode(!editMode)}
              className={`h-12 px-8 text-xs font-black rounded-full transition-all flex items-center gap-3 border tracking-widest ${editMode ? '${theme.bg} text-black ${theme.border} ${theme.shadow}' : 'bg-white/5 ${theme.text} border-white/10 hover:bg-white/10'}`}
            >
              <i className={`fa-solid ${editMode ? 'fa-check' : 'fa-pencil'}`}></i>
              {editMode ? 'SAVE SCRIPT' : 'MODIFY SEQUENCE'}
            </button>
            <PrintReportButton title="Event Program" />
        </div>
      </div>

      {/* Modern Table Container */}
      <div className="bg-[#050505] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-zinc-900/40 border-b border-white/5 text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500">
                {editMode && <th className="p-6 w-16 text-center"></th>}
                <th className="p-6 border-r border-white/5 w-[14%]">Time</th>
                <th className="p-6 border-r border-white/5 w-[22%]">Activities</th>
                <th className="p-6 border-r border-white/5 w-[18%]">Movement</th>
                <th className="p-6 border-r border-white/5 w-[20%]">Staff Cues / Extra</th>
                <th className="p-6 border-r border-white/5 w-[16%]">Song (BGM)</th>
                <th className="p-6 w-20 text-center">Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence initial={false}>
                {rows.map((row, index) => (
                  <React.Fragment key={row.id}>
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`group transition-colors relative ${row.is_important ? 'bg-red-500/5' : 'hover:bg-white/[0.02]'} ${pageBreakIds.includes(row.id) ? 'print:break-before-page' : ''}`}
                    >
                      {editMode && (
                        <td className="p-4 border-r border-white/5 text-center">
                          <button onClick={() => removeRow(row.id)} className="text-zinc-700 hover:text-red-500 p-3 rounded-2xl hover:bg-red-500/10 transition-all">
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </td>
                      )}
                      
                      {/* Time */}
                      <td className="p-0 border-r border-white/5 align-top">
                        <div className="relative group/cell">
                          {editMode ? (
                            <textarea
                              defaultValue={row.time}
                              onBlur={(e) => {
                                if (e.target.value !== row.time) handleFieldChange(row.id, 'time', e.target.value)
                              }}
                              className={`w-full h-full p-6 min-h-[80px] bg-transparent resize-none outline-none ${theme.bgFocus} text-sm font-black ${theme.text80} placeholder-zinc-800 transition-colors`}
                              placeholder="TIME"
                            />
                          ) : (
                            <div className={`p-6 text-sm font-black ${theme.text70} tabular-nums whitespace-pre-wrap leading-relaxed`}>{row.time}</div>
                          )}
                        </div>
                      </td>

                      {/* Activities */}
                      <td className="p-0 border-r border-white/5 align-top relative">
                        {editMode && (
                          <button 
                            onClick={() => handleFieldChange(row.id, 'is_important', !row.is_important)}
                            className={`absolute top-4 right-4 text-[10px] px-3 py-1 rounded-full z-10 transition-all font-black tracking-widest ${row.is_important ? 'text-red-500 bg-red-950/40 border border-red-500/30' : 'text-zinc-600 border border-transparent hover:border-zinc-800 hover:bg-zinc-900'}`}
                          >
                            {row.is_important ? 'IMPORTANT' : 'MARK'}
                          </button>
                        )}
                        {editMode ? (
                          <textarea
                            defaultValue={row.activities}
                            onBlur={(e) => {
                              if (e.target.value !== row.activities) handleFieldChange(row.id, 'activities', e.target.value)
                            }}
                            className={`w-full h-full p-6 min-h-[80px] bg-transparent resize-none outline-none ${theme.bgFocus} text-sm font-bold placeholder-zinc-800 transition-colors ${row.is_important ? 'text-red-500' : 'text-zinc-100'}`}
                            placeholder="ACTIVITY"
                          />
                        ) : (
                          <div className={`p-6 text-sm whitespace-pre-wrap leading-relaxed font-bold ${row.is_important ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'text-zinc-200'}`}>{row.activities}</div>
                        )}
                      </td>

                      {/* Movement */}
                      <td className="p-0 border-r border-white/5 align-top">
                        {editMode ? (
                          <textarea
                            defaultValue={row.movement}
                            onBlur={(e) => {
                              if (e.target.value !== row.movement) handleFieldChange(row.id, 'movement', e.target.value)
                            }}
                            className={`w-full h-full p-6 min-h-[80px] bg-transparent resize-none outline-none ${theme.bgFocus} text-sm text-zinc-400 placeholder-zinc-800 font-medium transition-colors`}
                            placeholder="MOVEMENT"
                          />
                        ) : (
                          <div className="p-6 text-sm text-zinc-400 font-medium leading-relaxed whitespace-pre-wrap">{row.movement}</div>
                        )}
                      </td>

                      {/* Cues */}
                      <td className="p-0 border-r border-white/5 align-top">
                        {editMode ? (
                          <textarea
                            defaultValue={row.cues}
                            onBlur={(e) => {
                              if (e.target.value !== row.cues) handleFieldChange(row.id, 'cues', e.target.value)
                            }}
                            className={`w-full h-full p-6 min-h-[80px] bg-transparent resize-none outline-none ${theme.bgFocus} text-sm text-zinc-500 placeholder-zinc-800 italic transition-colors`}
                            placeholder="CUES / CUST"
                          />
                        ) : (
                          <div className="p-6 text-sm text-zinc-500 italic leading-relaxed whitespace-pre-wrap">{row.cues}</div>
                        )}
                      </td>

                      {/* Song */}
                      <td className="p-0 border-r border-white/5 align-top">
                        {editMode ? (
                          <textarea
                            defaultValue={row.song}
                            onBlur={(e) => {
                              if (e.target.value !== row.song) handleFieldChange(row.id, 'song', e.target.value)
                            }}
                            className={`w-full h-full p-6 min-h-[80px] bg-transparent resize-none outline-none ${theme.bgFocus} text-sm text-blue-400/80 font-black placeholder-zinc-800 tracking-wide transition-colors`}
                            placeholder="SONG / BGM"
                          />
                        ) : (
                          <div className="p-6 text-sm text-blue-400/80 font-black tracking-wide leading-relaxed whitespace-pre-wrap italic">{row.song}</div>
                        )}
                      </td>

                      {/* Volume */}
                      <td className="p-0 align-top text-center w-24">
                        {editMode ? (
                          <input
                            type="text"
                            defaultValue={row.volume}
                            onBlur={(e) => {
                              if (e.target.value !== row.volume) handleFieldChange(row.id, 'volume', e.target.value)
                            }}
                            className={`w-full h-full p-6 min-h-[80px] bg-transparent outline-none ${theme.bgFocus} text-sm text-zinc-500 font-black text-center placeholder-zinc-800 transition-colors`}
                            placeholder="%"
                          />
                        ) : (
                          <div className="p-6 text-sm text-zinc-600 font-black tabular-nums">{row.volume}</div>
                        )}
                      </td>
                    </motion.tr>
                    {/* Page Break Trigger */}
                    <tr>
                      <td colSpan={7} className="p-0 border-none">
                        <PrintBreakTrigger id={row.id} />
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {rows.length === 0 && !loading && (
            <div className="py-32 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.02] group hover:border-white/10 transition-all duration-500 mx-8 my-8">
              <div className="relative mb-8">
                <div className={`absolute inset-0 blur-3xl opacity-20 ${theme.bg}`}></div>
                <i className={`fa-solid fa-layer-group text-7xl relative z-10 ${theme.text} opacity-30 group-hover:scale-110 transition-transform duration-700`}></i>
              </div>
              <h3 className="text-2xl font-black text-zinc-400 uppercase tracking-[0.3em] mb-3 italic">No Sequence Defined</h3>
              <p className="text-zinc-600 font-medium text-xs max-w-sm text-center border-t border-white/5 pt-6 mt-2 tracking-widest leading-loose uppercase">
                Your live production script is currently blank. <br/>
                Initialize the sequence to generate automated cues.
              </p>
              <div className="mt-10 print:hidden">
                <button 
                  onClick={addRow}
                  className={`h-14 px-12 bg-zinc-900 ${theme.text} rounded-2xl border ${theme.border} text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-white hover:text-black transition-all`}
                >
                   Initialize First Row
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Visual Footer */}
      <div className="flex justify-between items-center px-8 text-[10px] font-black tracking-[0.4em] text-zinc-800 uppercase print:text-zinc-400 sticky bottom-0 bg-black/80 backdrop-blur-md py-4">
         <div className="flex items-center gap-3">
            <img src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG" alt="ZTO" className="w-4 h-4 grayscale opacity-30" />
            <span>ZTO Operational Protocol • 2026</span>
         </div>
         <div>Strictly Confidential • Production Use Only</div>
      </div>

      <style jsx global>{`
        @media print {
          nav, button, .print\\:hidden { display: none !important; }
          body { background: white !important; color: black !important; }
          .bg-zinc-900, .bg-\\[\\#0a0a0a\\]\\/80, .bg-\\[\\#050505\\] { background: transparent !important; color: black !important; }
          .border-white\\/5, .border-r { border-color: #eee !important; }
          .text-zinc-500, .text-zinc-400, .text-zinc-700 { color: #666 !important; }
          .text-white, .text-zinc-100, .text-zinc-200 { color: black !important; }
          .print-page-break, .print\\:break-before-page { break-before: page !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th { background: #f5f5f5 !important; color: black !important; -webkit-print-color-adjust: exact; }
          td, th { border: 1px solid #eee !important; padding: 12px !important; }
          .rounded-\\[2rem\\], .rounded-\\[2\\.5rem\\], .rounded-xl { border-radius: 0 !important; }
          .shadow-2xl, .shadow-xl { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
