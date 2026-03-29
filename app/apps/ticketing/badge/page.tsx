'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';

type Ticket = {
  id: string;
  event_id: string;
  attendee_name: string;
  attendee_company: string;
  attendee_role: 'VIP' | 'Guest' | 'Media' | 'Staff' | 'Speaker';
  status: 'issued' | 'checked_in' | 'void';
};

function BadgePrinterContent() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('attendee_name', { ascending: true });

    if (error) {
      console.error(error);
      setError("Please ensure you've run the `setup_tickets.sql` script in Supabase first to create the tickets table and mock data.");
    } else {
      setTickets(data || []);
    }
    setLoading(false);
  };

  const getRoleColor = (role: Ticket['attendee_role']) => {
    switch (role) {
      case 'VIP': return 'bg-amber-500 text-black';
      case 'Speaker': return 'bg-rose-500 text-white';
      case 'Staff': return 'bg-zinc-800 text-white';
      case 'Media': return 'bg-blue-500 text-white';
      case 'Guest':
      default: return 'bg-zinc-200 text-zinc-900';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 font-sans print:bg-white text-zinc-900">
      {/* Non-printable Control UI */}
      <div className="print:hidden bg-zinc-900 text-white p-6 shadow-xl flex items-center justify-between sticky top-0 z-50">
         <div>
            <h1 className="text-xl font-black uppercase tracking-widest italic">Lanyard Batch Generator</h1>
            <p className="text-xs text-zinc-400 mt-1">Found {tickets.length} attendees. Connect A4/A6 printer to begin.</p>
         </div>
         <div className="flex gap-4">
             <Link href="/" className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                 <i className="fa-solid fa-arrow-left mr-2"></i> Exit
             </Link>
             <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all">
                 <i className="fa-solid fa-print mr-2"></i> Print All Badges
             </button>
         </div>
      </div>

      <div className="p-8 print:p-0">
         {loading && <div className="text-center py-20 font-black animate-pulse">Fetching Attendee Roster...</div>}
         
         {error && (
             <div className="max-w-2xl mx-auto bg-red-100 border border-red-300 p-8 rounded-3xl mt-12 print:hidden">
                 <h2 className="text-red-900 font-black text-xl"><i className="fa-solid fa-database"></i> Database Missing</h2>
                 <p className="text-red-700 mt-2">{error}</p>
             </div>
         )}
         
         {/* Badge Grid for Display / Print */}
         <div className="flex flex-wrap gap-8 justify-center print:flex-row print:justify-start print:gap-0">
             {tickets.map((ticket, index) => (
                 <div 
                   key={ticket.id} 
                   className="relative flex flex-col items-center justify-between w-[95mm] h-[135mm] bg-white border border-zinc-200 shadow-xl overflow-hidden print:shadow-none print:border-zinc-300 print:break-inside-avoid print:m-2"
                   style={{ pageBreakInside: 'avoid' }}
                 >
                    {/* Badge Header Theme Art */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.1),transparent)] border-b border-zinc-100 pointer-events-none"></div>

                    {/* Logo & Event Tag */}
                    <div className="w-full text-center pt-8 z-10">
                        <div className="text-xl font-black text-zinc-800 tracking-tighter uppercase italic drop-shadow-sm">ZTO SUMMIT</div>
                        <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.4em] mt-1">{ticket.event_id.replace(/_/g, ' ')}</div>
                    </div>

                    {/* Attendee Details */}
                    <div className="flex-1 w-full flex flex-col items-center justify-center px-6 text-center z-10 mt-6">
                        <div className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-4 inline-block ${getRoleColor(ticket.attendee_role)}`}>
                            {ticket.attendee_role} Pass
                        </div>
                        <h2 className="text-3xl font-black text-zinc-900 leading-tight tracking-tight uppercase break-words w-full">
                            {ticket.attendee_name}
                        </h2>
                        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mt-2 px-4 line-clamp-2">
                            {ticket.attendee_company || 'Independent'}
                        </h3>
                    </div>

                    {/* QR Code Anchor (Scanner Target) */}
                    <div className="w-full flex justify-center pb-8 pt-4 bg-zinc-50/50 border-t border-zinc-100 z-10 relative">
                        {/* Cut/Punch marker hint */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-zinc-200 rounded-full"></div>
                        <div className="p-3 bg-white shadow-sm border border-zinc-100 rounded-2xl">
                           <QRCodeSVG 
                             value={ticket.id} 
                             size={90} 
                             bgColor={"#ffffff"} 
                             fgColor={"#18181b"}
                             level={"Q"}
                             includeMargin={false}
                           />
                        </div>
                    </div>
                 </div>
             ))}
         </div>
      </div>
    </div>
  );
}

export default function BadgePrinterPage() {
    return (
        <Suspense fallback={<div className="bg-zinc-100 min-h-screen"></div>}>
            <BadgePrinterContent />
        </Suspense>
    );
}

