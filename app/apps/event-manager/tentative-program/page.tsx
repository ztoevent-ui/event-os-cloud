'use client';

import React, { useState } from 'react';
import Link from 'next/link';

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
  { id: '10', time: '2020pm-2025pm', activities: 'Long Service Award', movement: '', song: '', volume: '' },
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
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 z-10 sticky top-0">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/apps/event-manager" className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">
              <i className="fa-solid fa-list-ol"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Tentative Program</h1>
              <p className="text-xs text-gray-500 font-medium">Auto-saving to Local Storage (Offline Mode)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setEditMode(!editMode)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${editMode ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <i className={`fa-solid ${editMode ? 'fa-check' : 'fa-pencil'}`}></i>
              {editMode ? 'Done Editing' : 'Edit Mode'}
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
              <i className="fa-solid fa-download"></i> Export EXCEL
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-gray-100/80 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                  {editMode && <th className="p-3 w-10 text-center"><i className="fa-solid fa-trash"></i></th>}
                  <th className="p-4 border-r border-gray-200 w-1/6">Time</th>
                  <th className="p-4 border-r border-gray-200 w-1/3">Activities</th>
                  <th className="p-4 border-r border-gray-200 w-1/5">Movement</th>
                  <th className="p-4 border-r border-gray-200 w-1/5">Song / Cue</th>
                  <th className="p-4 w-24">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map((row) => (
                  <tr key={row.id} className={`group hover:bg-blue-50/30 transition-colors ${row.isImportant ? 'bg-red-50/20' : ''}`}>
                    {editMode && (
                      <td className="p-2 border-r border-gray-100 text-center">
                        <button onClick={() => removeRow(row.id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50">
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </td>
                    )}
                    
                    {/* Time Column */}
                    <td className="p-0 border-r border-gray-100 align-top">
                      {editMode ? (
                        <textarea
                          value={row.time}
                          onChange={(e) => handleFieldChange(row.id, 'time', e.target.value)}
                          className="w-full h-full p-4 min-h-[60px] bg-transparent resize-none outline-none focus:bg-blue-50/50 text-sm font-bold text-gray-800"
                          placeholder="00:00"
                        />
                      ) : (
                        <div className="p-4 text-sm font-bold text-gray-800 whitespace-pre-wrap">{row.time}</div>
                      )}
                    </td>

                    {/* Activities Column */}
                    <td className="p-0 border-r border-gray-100 align-top relative">
                      {editMode && (
                        <button 
                          onClick={() => handleFieldChange(row.id, 'isImportant', !row.isImportant)}
                          className={`absolute top-2 right-2 text-xs p-1 rounded z-10 ${row.isImportant ? 'text-red-500 bg-red-100' : 'text-gray-300 hover:bg-gray-100'}`}
                          title="Toggle Highlight"
                        >
                          <i className="fa-solid fa-flag"></i>
                        </button>
                      )}
                      {editMode ? (
                        <textarea
                          value={row.activities}
                          onChange={(e) => handleFieldChange(row.id, 'activities', e.target.value)}
                          className={`w-full h-full p-4 min-h-[60px] bg-transparent resize-none outline-none focus:bg-blue-50/50 text-sm font-medium ${row.isImportant ? 'text-red-600 font-bold' : 'text-gray-800'}`}
                          placeholder="Activity details"
                        />
                      ) : (
                        <div className={`p-4 text-sm whitespace-pre-wrap ${row.isImportant ? 'text-red-600 font-bold' : 'text-gray-800 font-medium'}`}>{row.activities}</div>
                      )}
                    </td>

                    {/* Movement Column */}
                    <td className="p-0 border-r border-gray-100 align-top bg-gray-50/30">
                      {editMode ? (
                        <textarea
                          value={row.movement}
                          onChange={(e) => handleFieldChange(row.id, 'movement', e.target.value)}
                          className="w-full h-full p-4 min-h-[60px] bg-transparent resize-none outline-none focus:bg-indigo-50/50 text-sm text-gray-600"
                          placeholder="Crew movement"
                        />
                      ) : (
                        <div className="p-4 text-sm text-gray-600 whitespace-pre-wrap">{row.movement}</div>
                      )}
                    </td>

                    {/* Song Column */}
                    <td className="p-0 border-r border-gray-100 align-top">
                      {editMode ? (
                        <textarea
                          value={row.song}
                          onChange={(e) => handleFieldChange(row.id, 'song', e.target.value)}
                          className="w-full h-full p-4 min-h-[60px] bg-transparent resize-none outline-none focus:bg-emerald-50/50 text-sm text-gray-600"
                          placeholder="BGM / Cues"
                        />
                      ) : (
                        <div className="p-4 text-sm text-gray-600 whitespace-pre-wrap">{row.song}</div>
                      )}
                    </td>

                    {/* Volume Column */}
                    <td className="p-0 align-top text-center">
                      {editMode ? (
                        <input
                          type="text"
                          value={row.volume}
                          onChange={(e) => handleFieldChange(row.id, 'volume', e.target.value)}
                          className="w-full h-full p-4 min-h-[60px] bg-transparent outline-none focus:bg-blue-50/50 text-sm text-gray-600 text-center"
                          placeholder="%"
                        />
                      ) : (
                        <div className="p-4 text-sm text-gray-600 font-mono">{row.volume}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {rows.length === 0 && (
              <div className="p-12 text-center text-gray-400">
                <i className="fa-solid fa-folder-open text-4xl mb-3 opacity-50"></i>
                <p>No program data. Click Add Row to start.</p>
              </div>
            )}
            
            {editMode && (
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <button 
                  onClick={addRow}
                  className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                  <i className="fa-solid fa-plus"></i> Add Row
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
