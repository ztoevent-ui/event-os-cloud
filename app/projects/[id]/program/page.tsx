'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProgramRow {
  id: string;
  time: string;
  activities: string;
  movement: string;
  cues: string;
  song: string;
  volume: string;
  isImportant?: boolean;
}

const initialData: ProgramRow[] = [
  { id: '1', time: 'All Setup Ready before 1700pm', activities: '', movement: '', cues: '', song: '', volume: '' },
  { id: '2', time: '1800pm-1900pm', activities: 'Staff Arrival', movement: '', cues: 'Make up or go toilet before 1815pm', song: '', volume: '70%', isImportant: false },
  { id: '3', time: '1910pm-1915pm', activities: 'Opening with Live Band Performance', movement: '', cues: '', song: '', volume: '' },
  { id: '4', time: '1915pm-1917pm', activities: 'Brief On Event Program', movement: '', cues: '', song: '', volume: '' },
  { id: '5', time: '1917pm-1920pm', activities: 'Welcoming Speech from Managing Director', movement: 'From VVIP Table to Podium', cues: 'Stage Usher guide MD Chris to podium', song: '', volume: '' },
  { id: '6', time: '1920pm-1930pm', activities: 'Group Photo Taking', movement: 'Mod VVIP Table away first if needed', cues: '', song: '', volume: '' },
  { id: '7', time: '1930pm-1935pm', activities: 'Dinner serve', movement: '', cues: '', song: '', volume: '' },
  { id: '8', time: '1935pm-1950pm', activities: 'Live Band Performance (2song)', movement: '', cues: '', song: '', volume: '' },
  { id: '9', time: '1950pm-2010pm', activities: 'Interactive GAME', movement: '', cues: '', song: '', volume: '', isImportant: true },
  { id: '10', time: '2010pm-2020pm', activities: '1st & 2nd Group Performance', movement: '', cues: '', song: '', volume: '' },
  { id: '11', time: '2020pm-2025pm', activities: 'Long Service Award', movement: '', cues: '', song: '', volume: '' },
  { id: '12', time: '2025pm-2035pm', activities: '3rd & 4th Group Performance', movement: '', cues: '', song: '', volume: '' },
  { id: '13', time: '2035pm-2105pm', activities: '1st Lucky Draw (40 set)', movement: '', cues: '1. Yek Nai Ping 2. Noel 3. James 4. Lenard', song: '', volume: '' },
  { id: '14', time: '2105pm-2110pm', activities: 'King & Queen of the night Winner', movement: '', cues: '', song: '', volume: '', isImportant: true },
  { id: '15', time: '2110pm-2125pm', activities: '5th, 6th Group Performance', movement: '', cues: '', song: '', volume: '' },
  { id: '16', time: '2125pm-2135pm', activities: 'Live Band Performance 2 (2song)', movement: '', cues: '', song: '', volume: '' },
  { id: '17', time: '2135pm-2140pm', activities: 'Group Performance Award', movement: '', cues: '', song: '', volume: '' },
  { id: '18', time: '2140pm-2145pm', activities: 'Tousing Ceremony', movement: '', cues: '', song: '', volume: '' },
  { id: '19', time: '2145pm-2205pm', activities: '2nd Session Lucky Draw (10set)', movement: 'Leonard Yek', cues: '', song: '', volume: '' },
  { id: '20', time: '', activities: '2nd Session Lucky Draw (10set)', movement: 'Christopher', cues: '', song: '', volume: '' },
  { id: '21', time: '', activities: 'Grand Lucky Draw (3set)', movement: 'Datuk Barry', cues: '', song: '', volume: '' },
  { id: '22', time: '2205pm', activities: 'Dinner End', movement: '', cues: 'Reception Usher escort VVIP Leaving', song: '', volume: '' },
  { id: '23', time: '2200pm-2320pm', activities: 'Informal Session', movement: '', cues: '', song: '', volume: '' },
  { id: '24', time: '2200pm-2230pm', activities: 'Live Band Performance 3 (2song)', movement: '', cues: '', song: '', volume: '' },
  { id: '25', time: '2310pm', activities: 'Cut Music', movement: '', cues: '', song: '', volume: '' },
];

export default function TentativeProgramPage() {
  const [rows, setRows] = useState<ProgramRow[]>(initialData);
  const [editMode, setEditMode] = useState(false);

  const handleFieldChange = (id: string, field: keyof ProgramRow, value: string | boolean) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const addRow = () => {
    const newId = Date.now().toString();
    setRows([...rows, { id: newId, time: '', activities: '', movement: '', cues: '', song: '', volume: '' }]);
  };

  const removeRow = (id: string) => {
    setRows(rows.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-20">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#0a0a0a]/80 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/5 shadow-2xl">
        <div>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-black">
                <i className="fa-solid fa-list-check text-xl"></i>
             </div>
             <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">Tentative Program</h1>
          </div>
          <p className="text-zinc-500 mt-2 font-medium tracking-wide">Live event sequence control and production cues</p>
        </div>
        <div className="flex items-center gap-4 mt-6 md:mt-0">
            <button 
              onClick={() => setEditMode(!editMode)}
              className={`h-12 px-8 text-xs font-black rounded-full transition-all flex items-center gap-3 border tracking-widest ${editMode ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-white/5 text-amber-500 border-white/10 hover:bg-white/10'}`}
            >
              <i className={`fa-solid ${editMode ? 'fa-check' : 'fa-pencil'}`}></i>
              {editMode ? 'SAVE SCRIPT' : 'MODIFY SEQUENCE'}
            </button>
            <button className="h-12 px-8 bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white rounded-full text-xs font-black tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-3">
              <i className="fa-solid fa-file-export"></i> EXPORT XLSX
            </button>
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
                  <motion.tr 
                    key={row.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`group transition-colors relative ${row.isImportant ? 'bg-red-500/5' : 'hover:bg-white/[0.02]'}`}
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
                            value={row.time}
                            onChange={(e) => handleFieldChange(row.id, 'time', e.target.value)}
                            className="w-full h-full p-6 min-h-[80px] bg-transparent resize-none outline-none focus:bg-amber-500/5 text-sm font-black text-amber-500/80 placeholder-zinc-800 transition-colors"
                            placeholder="TIME"
                          />
                        ) : (
                          <div className="p-6 text-sm font-black text-amber-500/70 tabular-nums whitespace-pre-wrap leading-relaxed">{row.time}</div>
                        )}
                      </div>
                    </td>

                    {/* Activities */}
                    <td className="p-0 border-r border-white/5 align-top relative">
                      {editMode && (
                        <button 
                          onClick={() => handleFieldChange(row.id, 'isImportant', !row.isImportant)}
                          className={`absolute top-4 right-4 text-[10px] px-3 py-1 rounded-full z-10 transition-all font-black tracking-widest ${row.isImportant ? 'text-red-500 bg-red-950/40 border border-red-500/30' : 'text-zinc-600 border border-transparent hover:border-zinc-800 hover:bg-zinc-900'}`}
                        >
                          {row.isImportant ? 'IMPORTANT' : 'MARK'}
                        </button>
                      )}
                      {editMode ? (
                        <textarea
                          value={row.activities}
                          onChange={(e) => handleFieldChange(row.id, 'activities', e.target.value)}
                          className={`w-full h-full p-6 min-h-[80px] bg-transparent resize-none outline-none focus:bg-amber-500/5 text-sm font-bold placeholder-zinc-800 transition-colors ${row.isImportant ? 'text-red-500' : 'text-zinc-100'}`}
                          placeholder="ACTIVITY"
                        />
                      ) : (
                        <div className={`p-6 text-sm whitespace-pre-wrap leading-relaxed font-bold ${row.isImportant ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'text-zinc-200'}`}>{row.activities}</div>
                      )}
                    </td>

                    {/* Movement */}
                    <td className="p-0 border-r border-white/5 align-top">
                      {editMode ? (
                        <textarea
                          value={row.movement}
                          onChange={(e) => handleFieldChange(row.id, 'movement', e.target.value)}
                          className="w-full h-full p-6 min-h-[80px] bg-transparent resize-none outline-none focus:bg-amber-500/5 text-sm text-zinc-400 placeholder-zinc-800 font-medium transition-colors"
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
                          value={row.cues}
                          onChange={(e) => handleFieldChange(row.id, 'cues', e.target.value)}
                          className="w-full h-full p-6 min-h-[80px] bg-transparent resize-none outline-none focus:bg-amber-500/5 text-sm text-zinc-500 placeholder-zinc-800 italic transition-colors"
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
                          value={row.song}
                          onChange={(e) => handleFieldChange(row.id, 'song', e.target.value)}
                          className="w-full h-full p-6 min-h-[80px] bg-transparent resize-none outline-none focus:bg-amber-500/5 text-sm text-blue-400/80 font-black placeholder-zinc-800 tracking-wide transition-colors"
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
                          value={row.volume}
                          onChange={(e) => handleFieldChange(row.id, 'volume', e.target.value)}
                          className="w-full h-full p-6 min-h-[80px] bg-transparent outline-none focus:bg-amber-500/5 text-sm text-zinc-500 font-black text-center placeholder-zinc-800 transition-colors"
                          placeholder="%"
                        />
                      ) : (
                        <div className="p-6 text-sm text-zinc-600 font-black tabular-nums">{row.volume}</div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {rows.length === 0 && (
            <div className="py-32 flex flex-col items-center justify-center text-zinc-800">
              <i className="fa-solid fa-layer-group text-8xl mb-6 opacity-20"></i>
              <p className="font-black text-xl uppercase tracking-[0.5em] opacity-30">No Sequence Defined</p>
            </div>
          )}
          
          {editMode && (
            <div className="p-8 bg-zinc-900/20 border-t border-white/5 flex justify-center">
              <button 
                onClick={addRow}
                className="h-14 px-12 bg-zinc-800 text-white hover:bg-white hover:text-black hover:scale-105 active:scale-95 text-[10px] uppercase tracking-[0.3em] font-black rounded-full transition-all flex items-center gap-4 shadow-2xl"
              >
                <i className="fa-solid fa-plus-circle text-lg"></i> Append Sequence Row
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Visual Footer */}
      <div className="flex justify-between items-center px-8 text-[10px] font-black tracking-[0.4em] text-zinc-800 uppercase pointer-events-none">
         <div>ZTO Operational Protocol • 2026</div>
         <div>Strictly Confidential • Production Use Only</div>
      </div>
    </div>
  );
}
