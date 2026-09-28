"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Leaderboard } from '../components/Leaderboard';

export default function BroadcastScoreboard() {
  const [teams, setTeams] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  
  const fetchScores = async () => {
    const { data } = await supabase.from('game_scores').select('*');
    if (data) setScores(data);
  };

  useEffect(() => {
    // Initial load
    supabase.from('teams').select('*').then(res => {
      if (res.data) setTeams(res.data);
    });
    fetchScores();
    
    // 0ms Realtime Subscription for Broadcast
    const channel = supabase.channel('broadcast_scores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_scores' }, (payload) => {
        // Refetch to ensure accuracy on inserts/updates/deletes
        fetchScores();
      })
      .subscribe();
      
    // Enforce dark mode on body for broadcast
    document.body.style.backgroundColor = 'black';
    document.body.style.overflow = 'hidden';

    return () => {
      supabase.removeChannel(channel);
      document.body.style.backgroundColor = '';
      document.body.style.overflow = '';
    }
  }, []);
  
  const mergedTeams = teams.map(t => {
    const tScores = scores.filter(s => s.team_id === t.id);
    const total = tScores.reduce((sum, current) => sum + current.score, 0);
    return { ...t, score: total };
  });

  return (
    <div className="min-h-screen bg-black overflow-hidden flex flex-col justify-center items-center w-full">
      <div className="absolute top-12 text-center w-full">
        <h1 className="text-[3rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-500 tracking-[0.3em] uppercase mb-2 shadow-2xl">
          Live Cloud Scoreboard
        </h1>
        <p className="text-gray-500 tracking-widest font-mono uppercase text-sm">
          Broadcast Mode • 0ms Latency
        </p>
      </div>

      <div className="w-full mt-24">
        <Leaderboard teams={mergedTeams} />
      </div>
      
      {/* Visual noise / background decoration for premium feel */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-20"
           style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #ffffff 1px, transparent 1px)', backgroundSize: '100px 100px' }} 
      />
    </div>
  );
}
