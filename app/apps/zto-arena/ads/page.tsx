'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';

const defaultAds = [
  { id: 'ad-1', title: 'Platinum Sponsor', url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1000', category: 'Main' },
  { id: 'ad-2', title: 'Main Event Partner', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1000', category: 'Main' },
  { id: 'ad-3', title: 'Food & Beverage', url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000', category: 'Vendor' },
  { id: 'ad-4', title: 'Tech Solutions', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1000', category: 'Partner' },
];

export default function AdsPlacementPage() {
  const [activeAdId, setActiveAdId] = useState<string | null>(null);
  const [eventId, setEventId] = useState('BINTULU_OPEN_2026');
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
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      <header className="z-10 bg-zinc-900/40 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/apps/zto-arena" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10">
            <i className="fa-solid fa-arrow-left text-zinc-400"></i>
          </Link>
          <div>
            <h1 className="text-xl font-black text-emerald-500 uppercase tracking-[0.2em] leading-none">Ads Placement</h1>
            <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-widest italic">Live Media Controller</p>
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
                  <div className="absolute top-2 left-2 px-2 py-1 bg-emerald-500 text-black text-[8px] font-black rounded uppercase tracking-tighter animate-pulse">
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
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-6 flex items-center gap-2">
                <i className="fa-solid fa-circle-info"></i> Broadcast Config
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Target Event ID</label>
                    <input 
                        type="text" 
                        value={eventId}
                        onChange={(e) => setEventId(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                </div>
                <div className="flex flex-col justify-end">
                    <p className="text-xs text-zinc-600 leading-relaxed italic">
                        All devices linked to this Event ID will react instantly when you trigger a placement. Ensure the "Arena Screen" is set to the same ID.
                    </p>
                </div>
            </div>
        </section>
      </main>
    </div>
  );
}
