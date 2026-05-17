'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface FlightMatch {
  id: string;
  status: string; // 'PENDING', 'CALLING', 'LIVE', 'COMPLETED'
  group_id: string;
  category_code: string;
  score_a: number;
  score_b: number;
  clan_a: { short_name: string; primary_color: string; secondary_color: string };
  clan_b: { short_name: string; primary_color: string; secondary_color: string };
  created_at: string;
}

// --- Helpers ---
function getStatusColor(status: string) {
  switch (status.toUpperCase()) {
    case 'PENDING': return 'text-gray-500';
    case 'CALLING': return 'text-yellow-400 animate-pulse';
    case 'LIVE': return 'text-green-400';
    case 'COMPLETED': return 'text-blue-400';
    default: return 'text-gray-500';
  }
}

function getStatusLabel(status: string) {
  switch (status.toUpperCase()) {
    case 'PENDING': return 'WAITING';
    case 'CALLING': return 'PLEASE PROCEED TO COURT 3';
    case 'LIVE': return 'IN PROGRESS';
    case 'COMPLETED': return 'FINAL';
    default: return status.toUpperCase();
  }
}

export default function FlightBoardPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [matches, setMatches] = useState<FlightMatch[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from('arena_matches')
      .select(`
        id, status, group_id, category_code, score_a, score_b, created_at,
        clan_a:arena_clans!clan_a_id(short_name, primary_color, secondary_color),
        clan_b:arena_clans!clan_b_id(short_name, primary_color, secondary_color)
      `)
      .eq('tournament_id', eventId)
      .neq('round_type', 'GROUP')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching matches:', error);
      return;
    }
    
    // Sort logic: live/calling first, pending next, completed last?
    // Airport flight boards usually show chronological, but we can just show all of them.
    setMatches(data as any);
  };

  useEffect(() => {
    fetchMatches();

    const channel = supabase
      .channel('flight_board_updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'arena_matches', filter: `tournament_id=eq.${eventId}` },
        () => {
          fetchMatches();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  // Infinite scroll effect
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    let animationFrameId: number;
    let scrollPos = 0;

    const scrollStep = () => {
      // only scroll if content is taller than viewport
      if (el.scrollHeight > el.clientHeight) {
        scrollPos += 0.5; // speed
        if (scrollPos >= el.scrollHeight / 2) {
          scrollPos = 0; // reset loop (requires duplicated list)
        }
        el.scrollTop = scrollPos;
      }
      animationFrameId = requestAnimationFrame(scrollStep);
    };
    
    animationFrameId = requestAnimationFrame(scrollStep);
    return () => cancelAnimationFrame(animationFrameId);
  }, [matches]);

  // Duplicate list for seamless scrolling if needed
  const displayMatches = [...matches, ...matches];

  return (
    <div className="w-screen h-screen bg-[#050A1E] text-white overflow-hidden font-['Barlow'] flex flex-col">
      {/* Header */}
      <div className="h-[12vh] bg-gradient-to-b from-[#0A102A] to-[#050A1E] border-b border-[#CCFF00]/30 flex flex-col items-center justify-center shrink-0 shadow-lg z-10 relative">
        <h1 className="text-[2.5vw] font-black tracking-widest text-[#CCFF00] font-['Barlow_Condensed'] uppercase drop-shadow-[0_0_10px_rgba(204,255,0,0.5)]">
          Bintulu Interclan Pickleball Championship 2026
        </h1>
        <h2 className="text-[1.2vw] text-blue-300 tracking-[0.3em] font-light">
          OFFICIAL MATCH FLIGHT BOARD
        </h2>
        
        {/* Current Time Clock */}
        <Clock />
      </div>

      {/* Table Header */}
      <div className="flex w-full px-[2vw] py-[1.5vh] bg-[#0A102A] border-b border-gray-700 font-bold text-[1.2vw] text-gray-400 tracking-wider shrink-0 z-10">
        <div className="w-[10%]">GROUP</div>
        <div className="w-[15%]">EVENT</div>
        <div className="w-[20%] text-right pr-[2vw]">TEAM A</div>
        <div className="w-[10%] text-center">SCORE</div>
        <div className="w-[20%] pl-[2vw]">TEAM B</div>
        <div className="w-[25%] pl-[2vw]">STATUS</div>
      </div>

      {/* Scrolling List */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-hidden relative"
      >
        <div className="flex flex-col">
          <AnimatePresence>
            {displayMatches.map((match, i) => {
              // Create a unique key for the duplicated items by adding an index
              const key = `${match.id}-${i}`;
              const isCompleted = match.status.toUpperCase() === 'COMPLETED';
              const isLive = match.status.toUpperCase() === 'LIVE';
              const isCalling = match.status.toUpperCase() === 'CALLING';

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`flex w-full px-[2vw] py-[2vh] border-b border-gray-800/50 items-center text-[1.6vw] ${i % 2 === 0 ? 'bg-[#050A1E]' : 'bg-[#080d24]'}`}
                >
                  <div className="w-[10%] font-bold text-gray-400">
                    Group {match.group_id}
                  </div>
                  
                  <div className="w-[15%]">
                    <span className="bg-blue-900/50 border border-blue-500/50 px-[1vw] py-[0.2vh] rounded text-blue-300 font-bold">
                      {match.category_code}
                    </span>
                  </div>

                  <div className="w-[20%] text-right pr-[2vw] font-bold truncate" style={{ color: match.clan_a?.secondary_color || '#aaaaaa' }}>
                    {match.clan_a?.short_name || match.team_a_name || 'TBD'}
                  </div>

                  <div className="w-[10%] text-center font-['Barlow_Condensed'] font-black text-[2vw] tracking-wider">
                    {isCompleted ? (
                      <span className="text-white">
                        {match.score_a} - {match.score_b}
                      </span>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </div>

                  <div className="w-[20%] pl-[2vw] font-bold truncate" style={{ color: match.clan_b?.secondary_color || '#aaaaaa' }}>
                    {match.clan_b?.short_name || match.team_b_name || 'TBD'}
                  </div>

                  <div className={`w-[25%] pl-[2vw] font-bold tracking-widest ${getStatusColor(match.status)}`}>
                    {isCalling && <i className="fa-solid fa-bullhorn mr-2"></i>}
                    {isLive && <span className="mr-2 inline-block w-2 h-2 rounded-full bg-green-400 animate-ping"></span>}
                    {getStatusLabel(match.status)}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {matches.length === 0 && (
            <div className="w-full text-center py-20 text-gray-500 text-2xl">
              Loading Match Data...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Clock() {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute right-[2vw] top-1/2 -translate-y-1/2 font-['Barlow_Condensed'] text-[2.5vw] text-[#CCFF00] font-bold tracking-wider">
      {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </div>
  );
}
