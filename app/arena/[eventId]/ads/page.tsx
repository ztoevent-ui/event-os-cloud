'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';

const defaultAds = [
  { id: 'ad-1', title: 'Platinum Sponsor', url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1000', category: 'Main' },
  { id: 'ad-2', title: 'Main Event Partner', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1000', category: 'Main' },
  { id: 'ad-3', title: 'Food & Beverage', url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000', category: 'Vendor' },
  { id: 'ad-4', title: 'Tech Solutions', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1000', category: 'Partner' },
];

function AdsPlacementContent() {
  const params = useParams();
  const eventId = (params.eventId as string) || 'BINTULU_OPEN_2026';
  
  const [activeAdId, setActiveAdId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const channel = supabase.channel(`zto-arena-${eventId}`, {
      config: { broadcast: { ack: true } },
    });

    channel.subscribe((status) => {
      setIsConnected(status === 'SUBSCRIBED');
    });

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  const broadcastAd = async (ad: any | null) => {
    setActiveAdId(ad?.id || null);
    if (channelRef.current && isConnected) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'ad-update',
        payload: { activeAd: ad },
      });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col relative overflow-hidden">
      <header className="z-10 bg-black border-b border-white/10 px-8 py-10 flex items-center justify-between">
        <div className="flex items-center gap-6">
            <Link href={`/arena/${eventId}`} className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-600 hover:text-white transition-colors tracking-widest group">
                <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
                Hub
            </Link>
            <div className="w-px h-6 bg-white/10"></div>
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 text-black rounded-2xl flex items-center justify-center text-2xl shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                    <i className="fa-solid fa-rectangle-ad"></i>
                </div>
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-widest italic leading-none">Ads Placement</h1>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mt-1">Billboard Engine V2.0</p>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                {isConnected ? 'NODE ACTIVE' : 'OFFLINE'}
            </div>
            <button 
                onClick={() => broadcastAd(null)}
                className="h-10 px-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all"
            >
                Clear Screen
            </button>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {defaultAds.map((ad) => (
            <motion.div 
              key={ad.id}
              whileHover={{ y: -5 }}
              className={`group relative aspect-video rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${activeAdId === ad.id ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'border-white/5 hover:border-white/20'}`}
              onClick={() => broadcastAd(ad)}
            >
              <img src={ad.url} alt={ad.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4">
                <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-1 block">{ad.category}</span>
                <h3 className="font-bold text-lg leading-tight">{ad.title}</h3>
              </div>
              <div className={`absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center ${activeAdId === ad.id ? 'bg-emerald-500 text-black' : 'bg-black/50 text-white opacity-0 group-hover:opacity-100'}`}>
                <i className={`fa-solid ${activeAdId === ad.id ? 'fa-check' : 'fa-play text-[10px]'}`}></i>
              </div>
              {activeAdId === ad.id && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-emerald-500 text-black text-[8px] font-black rounded uppercase tracking-tighter animate-pulse text-white">
                      On Screen
                  </div>
              )}
            </motion.div>
          ))}
          
          <div className="aspect-video rounded-2xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center hover:bg-zinc-900/40 hover:border-zinc-700 transition-all cursor-not-allowed group">
            <i className="fa-solid fa-cloud-arrow-up text-3xl text-zinc-700 group-hover:text-zinc-500 mb-2"></i>
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Upload New Asset</span>
          </div>
        </div>

        <section className="mt-12 p-8 bg-zinc-900/40 rounded-[2rem] border border-white/5">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-2 flex items-center gap-2">
                        <i className="fa-solid fa-circle-info"></i> Isolation Protocol
                    </h2>
                    <p className="text-[10px] text-zinc-600 leading-relaxed italic max-w-2xl">
                        This session is isolated to <span className="text-emerald-500 font-black">{eventId}</span>. Only screens set to this specific ID will receive these media updates. To switch events, return to the Arena Hub.
                    </p>
                </div>
                <Link href={`/arena/${eventId}`} className="h-10 px-6 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 flex items-center justify-center transition-all">
                    Change Session
                </Link>
            </div>
        </section>
      </main>
    </div>
  );
}

export default function AdsPlacementPage() {
    return (
        <Suspense fallback={<div className="bg-black min-h-screen"></div>}>
            <AdsPlacementContent />
        </Suspense>
    );
}

