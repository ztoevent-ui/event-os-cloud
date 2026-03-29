'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import Swal from 'sweetalert2';

interface ProgramRow {
  id: string;
  time: string;
  activities: string;
  movement: string;
  song: string;
  volume: string;
  is_important?: boolean;
}

export default function TentativeProgramPage() {
  const [rows, setRows] = useState<ProgramRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const eventId = 'BPO_2026'; // Default scope

  useEffect(() => {
    fetchProgram();
  }, []);

  const fetchProgram = async () => {
    try {
      const { data, error } = await supabase
        .from('event_programs')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        setRows(data);
      } else {
        // Fallback for first-time use
        setRows([
          { id: '1', time: '17:00 PM', activities: 'Setup Ready', movement: 'All Stations', song: 'Ambient Mix', volume: '30%' }
        ]);
      }
    } catch (err: any) {
       console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveToDB = async (updatedRows: ProgramRow[]) => {
      // Upsert logic for simple demo, usually we'd do per-row on blur
      // But for small sets, we'll just track and sync
      setRows(updatedRows);
  };

  const handleFieldChange = async (id: string, field: keyof ProgramRow, value: any) => {
    const updated = rows.map(row => row.id === id ? { ...row, [field]: value } : row);
    setRows(updated);

    // Save specific row to DB
    const rowToSave = updated.find(r => r.id === id);
    if (rowToSave) {
        await supabase.from('event_programs').upsert({
            ...rowToSave,
            event_id: eventId
        });
    }
  };

  const addRow = async () => {
    const newRow = { 
        event_id: eventId,
        time: '', 
        activities: 'New Activity', 
        movement: '', 
        song: '', 
        volume: '50%',
        sort_order: rows.length + 1
    };
    
    const { data, error } = await supabase
        .from('event_programs')
        .insert([newRow])
        .select()
        .single();
    
    if (data) setRows([...rows, data]);
  };

  const removeRow = async (id: string) => {
    const { error } = await supabase.from('event_programs').delete().eq('id', id);
    if (!error) setRows(rows.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 z-10 sticky top-0">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/apps/event-manager" className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-blue-600 rounded-full">
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Tentative Program</h1>
              <p className="text-[10px] font-black text-blue-500 tracking-[0.2em] uppercase mt-0.5">Live Database Sync Active</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setEditMode(!editMode)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${editMode ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700'}`}
            >
              <i className={`fa-solid ${editMode ? 'fa-check' : 'fa-pencil'}`} />
              {editMode ? 'Save & Lock' : 'Edit Mode'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
        {loading ? (
             <div className="flex items-center justify-center h-64"><i className="fa-solid fa-spinner fa-spin text-4xl text-blue-500" /></div>
        ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                    <tr className="bg-gray-100/80 border-b border-gray-200 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                    {editMode && <th className="p-3 w-10 text-center" />}
                    <th className="p-4 border-r border-gray-200 w-1/6">Time</th>
                    <th className="p-4 border-r border-gray-200 w-1/3">Activities</th>
                    <th className="p-4 border-r border-gray-200 w-1/5">Movement</th>
                    <th className="p-4 border-r border-gray-200 w-1/5">Song / Cue</th>
                    <th className="p-4 w-24">Volume</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {rows.map((row) => (
                    <tr key={row.id} className={`group hover:bg-blue-50/30 transition-colors ${row.is_important ? 'bg-red-50/20' : ''}`}>
                        {editMode && (
                        <td className="p-2 border-r border-gray-100 text-center">
                            <button onClick={() => removeRow(row.id)} className="text-red-400 hover:text-red-600 p-1 rounded">
                            <i className="fa-solid fa-xmark"></i>
                            </button>
                        </td>
                        )}
                        <td className="p-0 border-r border-gray-100">
                            {editMode ? <textarea className="w-full h-full p-4 bg-transparent outline-none text-sm font-bold" value={row.time} onChange={e => handleFieldChange(row.id, 'time', e.target.value)} /> 
                            : <div className="p-4 text-sm font-bold text-gray-800">{row.time}</div>}
                        </td>
                        <td className="p-0 border-r border-gray-100 relative">
                            {editMode ? <textarea className={`w-full h-full p-4 bg-transparent outline-none text-sm ${row.is_important ? 'text-red-600 font-bold' : ''}`} value={row.activities} onChange={e => handleFieldChange(row.id, 'activities', e.target.value)} />
                            : <div className={`p-4 text-sm ${row.is_important ? 'text-red-600 font-bold' : ''}`}>{row.activities}</div>}
                        </td>
                        <td className="p-0 border-r border-gray-100 bg-gray-50/20">
                            {editMode ? <textarea className="w-full h-full p-4 bg-transparent outline-none text-sm" value={row.movement} onChange={e => handleFieldChange(row.id, 'movement', e.target.value)} />
                            : <div className="p-4 text-sm text-gray-600">{row.movement}</div>}
                        </td>
                        <td className="p-0 border-r border-gray-100">
                            {editMode ? <textarea className="w-full h-full p-4 bg-transparent outline-none text-sm" value={row.song} onChange={e => handleFieldChange(row.id, 'song', e.target.value)} />
                            : <div className="p-4 text-sm text-gray-600 font-medium">{row.song}</div>}
                        </td>
                        <td className="p-0 text-center">
                            {editMode ? <input className="w-full h-full p-4 bg-transparent outline-none text-sm text-center" value={row.volume} onChange={e => handleFieldChange(row.id, 'volume', e.target.value)} />
                            : <div className="p-4 text-sm font-mono text-gray-500">{row.volume}</div>}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
                {editMode && (
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <button onClick={addRow} className="px-4 py-2 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-2">
                    <i className="fa-solid fa-plus" /> Add Activity
                    </button>
                </div>
                )}
            </div>
        )}
      </main>
    </div>
  );
}
