"use client";
import useSWR from 'swr';
import { Leaderboard } from '../components/Leaderboard';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PublicScoreboard() {
  // SWR polling every 3 seconds, strictly no WebSocket
  const { data, error } = useSWR('/api/scoreboard', fetcher, { 
    refreshInterval: 3000,
    revalidateOnFocus: true
  });
  
  if (error) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-red-500 font-mono">
      Failed to load scores
    </div>
  );
  
  if (!data) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-gray-600 border-t-white rounded-full animate-spin"></div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-12 pb-24 overflow-x-hidden selection:bg-white/20">
      <div className="text-center mb-12 px-4">
         <h1 className="text-3xl font-black text-white mb-3 tracking-[0.2em] uppercase">
           MDS Family Day
         </h1>
         <p className="text-sm tracking-widest text-gray-500 uppercase font-mono">
           Live Public Scoreboard
         </p>
      </div>
      <Leaderboard teams={data.teams} />
    </div>
  );
}
