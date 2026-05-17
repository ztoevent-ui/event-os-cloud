'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Swal from 'sweetalert2';

// --- Types ---
interface FlightMatch {
  id: string;
  status: string;
  group_id: string;
  category_code: string;
  score_a: number;
  score_b: number;
  team_a_name: string;
  team_b_name: string;
  clan_a: { short_name: string; primary_color: string; secondary_color: string } | null;
  clan_b: { short_name: string; primary_color: string; secondary_color: string } | null;
  created_at: string;
}

export default function FlightControllerPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [matches, setMatches] = useState<FlightMatch[]>([]);

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from('arena_matches')
      .select(`
        id, status, group_id, category_code, score_a, score_b, team_a_name, team_b_name, created_at,
        clan_a:arena_clans!clan_a_id(short_name, primary_color, secondary_color),
        clan_b:arena_clans!clan_b_id(short_name, primary_color, secondary_color)
      `)
      .eq('tournament_id', eventId)
      .neq('round_type', 'GROUP')
      .order('created_at', { ascending: true });

    if (error) console.error(error);
    else setMatches(data as any);
  };

  useEffect(() => {
    fetchMatches();
  }, [eventId]);

  const updateMatchStatus = async (matchId: string, newStatus: string, scores?: { scoreA: number, scoreB: number }) => {
    const updateData: any = { status: newStatus };
    if (scores) {
      updateData.score_a = scores.scoreA;
      updateData.score_b = scores.scoreB;
      updateData.sets_won_a = scores.scoreA > scores.scoreB ? 1 : 0;
      updateData.sets_won_b = scores.scoreB > scores.scoreA ? 1 : 0;
      updateData.winner = scores.scoreA > scores.scoreB ? 'A' : 'B';
    }

    const { error } = await supabase
      .from('arena_matches')
      .update(updateData)
      .eq('id', matchId);

    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      fetchMatches();
    }
  };

  const pushToScreen = async (matchId: string) => {
    const { error } = await supabase
      .from('arena_live_controls')
      .upsert({
        tournament_id: eventId,
        command: 'SHOW_MATCH',
        preset_name: matchId
      }, { onConflict: 'tournament_id' });
      
    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Pushed to Live Screen!',
        showConfirmButton: false,
        timer: 2000
      });
    }
  };

  const handleStatusChange = async (match: FlightMatch) => {
    if (match.status === 'PENDING') {
      await updateMatchStatus(match.id, 'CALLING');
    } else if (match.status === 'CALLING') {
      await updateMatchStatus(match.id, 'LIVE');
    } else if (match.status === 'LIVE') {
      // Prompt for scores
      const { value: formValues } = await Swal.fire({
        title: 'Enter Final Score',
        html: `
          <div class="flex flex-col gap-4 text-left">
            <div>
              <label class="block font-bold mb-1">${match.clan_a?.short_name || match.team_a_name} Score:</label>
              <input id="swal-input1" type="number" class="w-full border rounded p-2" value="0">
            </div>
            <div>
              <label class="block font-bold mb-1">${match.clan_b?.short_name || match.team_b_name} Score:</label>
              <input id="swal-input2" type="number" class="w-full border rounded p-2" value="0">
            </div>
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Save Result',
        confirmButtonColor: '#0056B3',
        preConfirm: () => {
          const scoreA = parseInt((document.getElementById('swal-input1') as HTMLInputElement).value);
          const scoreB = parseInt((document.getElementById('swal-input2') as HTMLInputElement).value);
          if (isNaN(scoreA) || isNaN(scoreB)) {
            Swal.showValidationMessage('Please enter valid numbers');
            return null;
          }
          return { scoreA, scoreB };
        }
      });

      if (formValues) {
        await updateMatchStatus(match.id, 'COMPLETED', formValues);
      }
    } else if (match.status === 'COMPLETED') {
      // Allow reset to PENDING? Or Edit score?
      const res = await Swal.fire({
        title: 'Edit Match?',
        text: 'This match is already completed.',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Re-enter Score',
        denyButtonText: 'Reset to PENDING',
      });

      if (res.isConfirmed) {
        // re-enter score
        // similar prompt as above
        const { value: formValues } = await Swal.fire({
          title: 'Re-enter Final Score',
          html: `
            <div class="flex flex-col gap-4 text-left">
              <div>
                <label class="block font-bold mb-1">${match.clan_a?.short_name || match.team_a_name} Score:</label>
                <input id="swal-input1" type="number" class="w-full border rounded p-2" value="${match.score_a}">
              </div>
              <div>
                <label class="block font-bold mb-1">${match.clan_b?.short_name || match.team_b_name} Score:</label>
                <input id="swal-input2" type="number" class="w-full border rounded p-2" value="${match.score_b}">
              </div>
            </div>
          `,
          preConfirm: () => {
            const scoreA = parseInt((document.getElementById('swal-input1') as HTMLInputElement).value);
            const scoreB = parseInt((document.getElementById('swal-input2') as HTMLInputElement).value);
            return { scoreA, scoreB };
          }
        });
        if (formValues) await updateMatchStatus(match.id, 'COMPLETED', formValues);
      } else if (res.isDenied) {
        await updateMatchStatus(match.id, 'PENDING');
      }
    }
  };

  const getButtonConfig = (status: string) => {
    switch (status) {
      case 'PENDING': return { text: 'Call to Court 3', class: 'bg-yellow-500 hover:bg-yellow-600 text-white' };
      case 'CALLING': return { text: 'Start Match', class: 'bg-green-500 hover:bg-green-600 text-white' };
      case 'LIVE': return { text: 'Finish & Score', class: 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse' };
      case 'COMPLETED': return { text: 'Done (Click to Edit)', class: 'bg-gray-300 hover:bg-gray-400 text-gray-800' };
      default: return { text: 'Unknown', class: 'bg-gray-200' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Match Controller</h1>
            <p className="text-gray-500 mt-1">Bintulu Interclan Pickleball Championship</p>
          </div>
          <div className="flex gap-4">
            <a href={`/arena/${eventId}/flight-board`} target="_blank" className="px-4 py-2 bg-black text-[#CCFF00] rounded font-bold shadow hover:bg-gray-800 transition">
              Open Flight Board <i className="fa-solid fa-external-link-alt ml-2"></i>
            </a>
            <a href={`/arena/${eventId}/match-overlay`} target="_blank" className="px-4 py-2 bg-blue-900 text-white rounded font-bold shadow hover:bg-blue-800 transition">
              Open Overlay <i className="fa-solid fa-desktop ml-2"></i>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm">
                <th className="p-4 font-semibold">Group</th>
                <th className="p-4 font-semibold">Event</th>
                <th className="p-4 font-semibold text-right">Team A</th>
                <th className="p-4 font-semibold text-center">Score</th>
                <th className="p-4 font-semibold">Team B</th>
                <th className="p-4 font-semibold">Current Status</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => {
                const btn = getButtonConfig(match.status);
                return (
                  <tr key={match.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="p-4">Group {match.group_id}</td>
                    <td className="p-4 font-bold text-blue-800">{match.category_code}</td>
                    
                    <td className="p-4 text-right font-bold" style={{ color: match.clan_a?.primary_color || '#333' }}>
                      {match.clan_a?.short_name || match.team_a_name || 'TBD'}
                    </td>
                    
                    <td className="p-4 text-center font-bold text-lg">
                      {match.status === 'COMPLETED' ? `${match.score_a} - ${match.score_b}` : '-'}
                    </td>
                    
                    <td className="p-4 font-bold" style={{ color: match.clan_b?.primary_color || '#333' }}>
                      {match.clan_b?.short_name || match.team_b_name || 'TBD'}
                    </td>
                    
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        match.status === 'PENDING' ? 'bg-gray-100 text-gray-600' :
                        match.status === 'CALLING' ? 'bg-yellow-100 text-yellow-800' :
                        match.status === 'LIVE' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {match.status}
                      </span>
                    </td>
                    
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button 
                        onClick={() => handleStatusChange(match)}
                        className={`px-4 py-2 rounded shadow-sm text-sm font-bold transition-transform active:scale-95 ${btn.class}`}
                      >
                        {btn.text}
                      </button>
                      <button 
                        onClick={() => pushToScreen(match.id)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded shadow-sm text-sm font-bold transition-transform active:scale-95"
                        title="Push to Overlay Screen"
                      >
                        <i className="fa-solid fa-tv"></i> 投屏
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {matches.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No matches found. Did you run the seed script?
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
