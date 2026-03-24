'use client';

import React, { useState } from 'react';

interface ProgramRow {
  id: string;
  time: string;
  activities: string;
  movement: string;
  song: string;
  volume: string;
  isImportant?: boolean;
}

const initialData: ProgramRow[] = [
  { id: '1', time: 'All Setup Ready before 1700pm', activities: '', movement: '', song: '', volume: '' },
  { id: '2', time: '1800pm-1900pm', activities: 'Staff Arrival', movement: '', song: 'Make up or go toilet before 1815pm', volume: '70%' },
  { id: '3', time: '1910pm-1915pm', activities: 'Opening with Live Band Performance', movement: '', song: '', volume: '' },
  { id: '4', time: '1915pm-1917pm', activities: 'Brief On Event Program', movement: '', song: '', volume: '' },
  { id: '5', time: '1917pm-1920pm', activities: 'Welcoming Speech from Managing Director', movement: 'From VVIP Table to Podium', song: 'Stage Usher guide MD Chris to podium', volume: '' },
  { id: '6', time: '1920pm-1930pm', activities: 'Group Photo Taking', movement: 'Mod VVIP Table away first if needed', song: '', volume: '' },
  { id: '7', time: '1930pm-1935pm', activities: 'Dinner serve', movement: '', song: '', volume: '' },
  { id: '8', time: '1950pm-2010pm', activities: 'Interactive GAME', movement: '', song: '', volume: '', isImportant: true },
  { id: '9', time: '2010pm-2020pm', activities: '1st & 2nd Group Performance', movement: '', song: '', volume: '' },
];

export default function TentativeProgramPage() {
  const [rows, setRows] = useState<ProgramRow[]>(initialData);
  const [editMode, setEditMode] = useState(false);

  const handleFieldChange = (id: string, field: keyof ProgramRow, value: string | boolean) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const addRow = () => {
    const newId = Date.now().toString();
    setRows([...rows, { id: newId, time: '', activities: '', movement: '', song: '', volume: '' }]);
  };

  const removeRow = (id: string) => {
    setRows(rows.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-amber-900/30">
        <div>
          <h1 className="text-3xl font-black tracking-widest text-amber-400">TENTATIVE PROGRAM</h1>
          <p className="text-zinc-500 mt-1">Live event execution sequence and AV cues.</p>
        </div>
        <div className="flex items-center gap-3">
            <button 
              onClick={() => setEditMode(!editMode)}
              className={`px-6 py-2 text-sm font-bold rounded-full transition-colors flex items-center gap-2 border ${editMode ? 'bg-amber-500 text-black border-amber-500 hover:bg-amber-400' : 'bg-transparent text-amber-500 border-amber-500/50 hover:bg-amber-900/40'}`}
            >
              <i className={`fa-solid ${editMode ? 'fa-check' : 'fa-pencil'}`}></i>
              {editMode ? 'DONE EDITING' : 'EDIT SCRIPT'}
            </button>
            <button className="px-6 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-full text-sm font-bold hover:bg-zinc-800 transition-colors flex items-center gap-2">
              <i className="fa-solid fa-download"></i> EXPORT
            </button>
        </div>
      </div>

      <div className="bg-zinc-950/80 rounded-2xl shadow-xl border border-amber-900/20 overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-zinc-900/80 border-b border-amber-900/30 text-xs uppercase tracking-widest text-amber-500/60 font-black">
                {editMode && <th className="p-4 w-12 text-center"></th>}
                <th className="p-4 border-r border-zinc-800/50 w-1/6">Time</th>
                <th className="p-4 border-r border-zinc-800/50 w-1/3">Activities</th>
                <th className="p-4 border-r border-zinc-800/50 w-1/5">Movement</th>
                <th className="p-4 border-r border-zinc-800/50 w-1/5">Song / Cue</th>
                <th className="p-4 w-24">Vol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {rows.map((row) => (
                <tr key={row.id} className={`group hover:bg-amber-900/10 transition-colors ${row.isImportant ? 'bg-red-900/10' : ''}`}>
                  {editMode && (
                    <td className="p-2 border-r border-zinc-800/50 text-center">
                      <button onClick={() => removeRow(row.id)} className="text-red-500/50 hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  )}
                  
                  {/* Time Column */}
                  <td className="p-0 border-r border-zinc-800/50 align-top">
                    {editMode ? (
                      <textarea
                        value={row.time}
                        onChange={(e) => handleFieldChange(row.id, 'time', e.target.value)}
                        className="w-full h-full p-4 min-h-[60px] bg-zinc-950/50 resize-none outline-none focus:bg-amber-900/20 text-sm font-bold text-amber-100"
                        placeholder="00:00"
                      />
                    ) : (
                      <div className="p-4 text-sm font-bold text-amber-200 whitespace-pre-wrap">{row.time}</div>
                    )}
                  </td>

                  {/* Activities Column */}
                  <td className="p-0 border-r border-zinc-800/50 align-top relative">
                    {editMode && (
                      <button 
                        onClick={() => handleFieldChange(row.id, 'isImportant', !row.isImportant)}
                        className={`absolute top-2 right-2 text-xs p-1.5 rounded-md z-10 transition ${row.isImportant ? 'text-red-400 bg-red-900/40' : 'text-zinc-600 hover:bg-zinc-800'}`}
                        title="Highlight important event"
                      >
                        <i className="fa-solid fa-fire"></i>
                      </button>
                    )}
                    {editMode ? (
                      <textarea
                        value={row.activities}
                        onChange={(e) => handleFieldChange(row.id, 'activities', e.target.value)}
                        className={`w-full h-full p-4 min-h-[60px] bg-zinc-950/50 resize-none outline-none focus:bg-amber-900/20 text-sm font-medium ${row.isImportant ? 'text-red-400 font-bold' : 'text-zinc-300'}`}
                        placeholder="Activity details"
                      />
                    ) : (
                      <div className={`p-4 text-sm whitespace-pre-wrap ${row.isImportant ? 'text-red-400 font-bold drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]' : 'text-zinc-300'}`}>{row.activities}</div>
                    )}
                  </td>

                  {/* Movement Column */}
                  <td className="p-0 border-r border-zinc-800/50 align-top">
                    {editMode ? (
                      <textarea
                        value={row.movement}
                        onChange={(e) => handleFieldChange(row.id, 'movement', e.target.value)}
                        className="w-full h-full p-4 min-h-[60px] bg-zinc-950/50 resize-none outline-none focus:bg-amber-900/20 text-sm text-zinc-400"
                        placeholder="Crew movement"
                      />
                    ) : (
                      <div className="p-4 text-sm text-zinc-400 whitespace-pre-wrap">{row.movement}</div>
                    )}
                  </td>

                  {/* Song Column */}
                  <td className="p-0 border-r border-zinc-800/50 align-top">
                    {editMode ? (
                      <textarea
                        value={row.song}
                        onChange={(e) => handleFieldChange(row.id, 'song', e.target.value)}
                        className="w-full h-full p-4 min-h-[60px] bg-zinc-950/50 resize-none outline-none focus:bg-amber-900/20 text-sm text-cyan-400/80"
                        placeholder="BGM / Cues"
                      />
                    ) : (
                      <div className="p-4 text-sm text-cyan-400/80 whitespace-pre-wrap">{row.song}</div>
                    )}
                  </td>

                  {/* Volume Column */}
                  <td className="p-0 align-top text-center">
                    {editMode ? (
                      <input
                        type="text"
                        value={row.volume}
                        onChange={(e) => handleFieldChange(row.id, 'volume', e.target.value)}
                        className="w-full h-full p-4 min-h-[60px] bg-zinc-950/50 outline-none focus:bg-amber-900/20 text-sm text-zinc-500 text-center"
                        placeholder="%"
                      />
                    ) : (
                      <div className="p-4 text-sm text-zinc-500 font-mono">{row.volume}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {rows.length === 0 && (
            <div className="p-16 text-center text-zinc-600">
              <i className="fa-solid fa-list-ol text-5xl mb-4 opacity-50"></i>
              <p className="font-medium tracking-wide">NO PROGRAM DATA AVAILABLE</p>
            </div>
          )}
          
          {editMode && (
            <div className="p-4 bg-zinc-900/50 border-t border-amber-900/30 flex justify-center">
              <button 
                onClick={addRow}
                className="px-8 py-3 bg-zinc-800 text-amber-500 hover:bg-amber-500 hover:text-black hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] text-xs uppercase tracking-widest font-black rounded-full transition-all flex items-center gap-2"
              >
                <i className="fa-solid fa-plus"></i> ADD SEQUENCE ROW
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
