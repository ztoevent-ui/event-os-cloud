'use client';

import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { PrintReportButton } from '../../components/ProjectModals';

interface AuctionItem {
  id: string;
  project_id: string;
  title: string;
  description: string;
  image_url: string;
  starting_price: number;
  current_price: number;
  minimum_increment: number;
  status: string;
  winner_name: string;
}

export default function AuctionAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'live' | 'manage'>('live');
  const [project, setProject] = useState<any>(null);

  // Live Control State
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [livePrice, setLivePrice] = useState<number>(0);
  const [liveWinner, setLiveWinner] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Manage State
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<AuctionItem>>({});
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchProject();
    fetchItems();
    subscribeToLiveState();
    
    return () => {
      supabase.channel(`auction_${projectId}`).unsubscribe();
    };
  }, [projectId]);

  const fetchProject = async () => {
    const { data } = await supabase.from('projects').select('name').eq('id', projectId).single();
    setProject(data);
  };

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('auction_items').select('*').eq('project_id', projectId).order('sort_order');
    if (!error && data) setItems(data);
    setLoading(false);
  };

  const subscribeToLiveState = () => {
    supabase.channel(`auction_${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tool_states', filter: `tool_name=eq.auction` }, payload => {
        if (payload.new && payload.new.project_id === projectId) {
          const state = payload.new.current_state;
          if (state) {
            setActiveItemId(state.active_item_id);
            setLivePrice(state.current_price);
            setLiveWinner(state.current_winner || '');
          }
        }
      })
      .subscribe();
      
    // Initial fetch of live state
    supabase.from('tool_states')
      .select('current_state')
      .eq('project_id', projectId)
      .eq('tool_name', 'auction')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.current_state) {
          setActiveItemId(data.current_state.active_item_id);
          setLivePrice(data.current_state.current_price || 0);
          setLiveWinner(data.current_state.current_winner || '');
        }
      });
  };

  const updateLiveState = async (newState: any) => {
    setIsUpdating(true);
    const fullState = {
      active_item_id: newState.active_item_id !== undefined ? newState.active_item_id : activeItemId,
      current_price: newState.current_price !== undefined ? newState.current_price : livePrice,
      current_winner: newState.current_winner !== undefined ? newState.current_winner : liveWinner,
    };

    // Update tool_states for real-time
    const { data: existing } = await supabase.from('tool_states').select('id').eq('project_id', projectId).eq('tool_name', 'auction').maybeSingle();
    
    if (existing) {
      await supabase.from('tool_states').update({ current_state: fullState, updated_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await supabase.from('tool_states').insert({ project_id: projectId, tool_name: 'auction', current_state: fullState });
    }

    // Also persist current_price and winner to the auction_items table
    if (fullState.active_item_id) {
      await supabase.from('auction_items').update({
        current_price: fullState.current_price,
        winner_name: fullState.current_winner
      }).eq('id', fullState.active_item_id);
    }

    setLivePrice(fullState.current_price);
    setLiveWinner(fullState.current_winner || '');
    setActiveItemId(fullState.active_item_id);
    setIsUpdating(false);
  };

  const handleIncrement = (amount: number) => {
    updateLiveState({ current_price: livePrice + amount });
  };

  const handleSetStatus = async (itemId: string, status: string) => {
    await supabase.from('auction_items').update({ status }).eq('id', itemId);
    fetchItems();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `auction_${projectId}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage.from('event-assets').upload(fileName, file);
    
    if (!error && data) {
      const { data: publicUrlData } = supabase.storage.from('event-assets').getPublicUrl(data.path);
      setEditingItem({ ...editingItem, image_url: publicUrlData.publicUrl });
    } else {
      alert('Error uploading image');
    }
    setUploadingImage(false);
  };

  const saveItem = async () => {
    if (!editingItem.title) return alert('Title is required');
    
    let resultError = null;

    if (editingItem.id) {
      const { error } = await supabase.from('auction_items').update(editingItem).eq('id', editingItem.id);
      resultError = error;
    } else {
      const { error } = await supabase.from('auction_items').insert({
        ...editingItem,
        project_id: projectId,
        status: 'pending',
        current_price: editingItem.starting_price || 0
      });
      resultError = error;
    }
    
    if (resultError) {
      alert(`Error saving item: ${resultError.message}\n(Hint: Have you executed the SQL migration script in Supabase?)`);
      return;
    }

    setIsEditing(false);
    setEditingItem({});
    fetchItems();
  };

  const exportResults = () => {
    const soldItems = items.filter(i => i.status === 'sold');
    if (soldItems.length === 0) return alert('No items have been sold yet.');
    
    const headers = ['Lot Number', 'Item Title', 'Winner', 'Final Price (RM)'];
    const rows = soldItems.map(item => {
      const lotNum = items.findIndex(i => i.id === item.id) + 1;
      return [
        `Lot ${lotNum}`,
        `"${item.title.replace(/"/g, '""')}"`,
        `"${(item.winner_name || '').replace(/"/g, '""')}"`,
        item.current_price
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Auction_Results_${project?.name || 'Project'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeItem = items.find(i => i.id === activeItemId);

  return (
    <div className="page-transition" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="zto-label" style={{ marginBottom: 8 }}>Auction System</div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {project?.name || 'Loading...'}
          </h1>
        </div>
      </div>

      {/* ── Action Bar / Tabs ── */}
      <div className="zto-action-bar">
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            onClick={() => setActiveTab('live')} 
            className={`zto-btn ${activeTab === 'live' ? 'zto-btn-primary' : 'zto-btn-ghost'}`}
          >
            <i className="fa-solid fa-satellite-dish" /> Live Control
          </button>
          <button 
            onClick={() => setActiveTab('manage')} 
            className={`zto-btn ${activeTab === 'manage' ? 'zto-btn-primary' : 'zto-btn-ghost'}`}
          >
            <i className="fa-solid fa-boxes-stacked" /> Manage Items
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={exportResults} className="zto-btn zto-btn-ghost" style={{ fontSize: 13, color: '#fff' }}>
            <i className="fa-solid fa-file-csv" /> Export Results
          </button>
          <Link href={`/projects/${projectId}/auction/display`} target="_blank">
            <button className="zto-btn zto-btn-ghost" style={{ fontSize: 13, color: '#DEFF9A', border: '1px solid rgba(222,255,154,0.3)' }}>
              <i className="fa-solid fa-display" /> Open Big Screen
            </button>
          </Link>
        </div>
      </div>

      {/* ── Live Control Tab ── */}
      {activeTab === 'live' && (
        <div style={{ display: 'flex', gap: 24, flexDirection: 'column' }}>
          
          {/* Active Item Panel */}
          <div className="zto-card" style={{ padding: 32, border: '1px solid rgba(222, 255, 154, 0.4)', background: 'linear-gradient(145deg, rgba(222,255,154,0.05) 0%, rgba(0,0,0,0.5) 100%)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#DEFF9A', marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <i className="fa-solid fa-circle-dot" style={{ color: '#ef4444', animation: 'pulse 2s infinite', marginRight: 12 }} />
              On Stage Now
            </h2>

            {activeItem ? (
              <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 280 }}>
                  <img src={activeItem.image_url || '/placeholder.png'} alt={activeItem.title} style={{ width: '100%', borderRadius: 16, aspectRatio: '4/3', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#DEFF9A', marginTop: 24, letterSpacing: '0.1em' }}>
                    LOT {items.findIndex(i => i.id === activeItem.id) + 1}
                  </div>
                  <h3 style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{activeItem.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>{activeItem.description}</p>
                  
                  <div style={{ marginTop: 24, display: 'flex', gap: 16 }}>
                    <button 
                      onClick={() => handleSetStatus(activeItem.id, 'sold')}
                      className="zto-btn zto-btn-primary"
                      style={{ background: '#10b981', color: 'black', border: 'none', padding: '16px 32px', fontSize: 16, flex: 1 }}
                    >
                      <i className="fa-solid fa-gavel" /> MARK AS SOLD
                    </button>
                    <button 
                      onClick={() => updateLiveState({ active_item_id: null })}
                      className="zto-btn zto-btn-danger"
                    >
                       Clear Screen
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Price Display */}
                  <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Current Price (RM)</div>
                    <input 
                      type="number" 
                      value={livePrice}
                      onChange={(e) => setLivePrice(Number(e.target.value))}
                      onBlur={() => updateLiveState({ current_price: livePrice })}
                      style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 48, fontWeight: 800, width: '100%', outline: 'none', fontFamily: 'Urbanist' }}
                    />
                  </div>

                  {/* Quick Increments */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {[50, 100, 500, 1000, 5000, 10000].map(amount => (
                      <button 
                        key={amount}
                        onClick={() => handleIncrement(amount)}
                        disabled={isUpdating}
                        className="zto-btn zto-btn-ghost"
                        style={{ padding: '16px 0', fontSize: 18, fontWeight: 700, border: '1px solid rgba(77, 163, 255, 0.3)', color: '#4da3ff' }}
                      >
                        +{amount}
                      </button>
                    ))}
                  </div>

                  {/* Current Winner */}
                  <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Highest Bidder (Table/Name)</div>
                    <input 
                      type="text" 
                      value={liveWinner}
                      onChange={(e) => setLiveWinner(e.target.value)}
                      onBlur={() => updateLiveState({ current_winner: liveWinner })}
                      placeholder="e.g. Table 5"
                      style={{ background: 'transparent', border: 'none', borderBottom: '2px solid rgba(255,255,255,0.2)', color: '#DEFF9A', fontSize: 24, fontWeight: 700, width: '100%', outline: 'none', paddingBottom: 8, fontFamily: 'Urbanist' }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.4)' }}>
                <i className="fa-solid fa-tv" style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }} />
                <p>No item is currently active. Select an item below to project it to the big screen.</p>
              </div>
            )}
          </div>

          {/* Queue List */}
          <div className="zto-card" style={{ padding: 32 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24 }}>Upcoming & Pending Items</h3>
            <div style={{ display: 'grid', gap: 16 }}>
              {items.filter(i => i.status !== 'sold').map((item) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    {item.image_url ? (
                      <img src={item.image_url} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 64, height: 64, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fa-solid fa-image" /></div>
                    )}
                    <div>
                      <div style={{ fontSize: 12, color: '#DEFF9A', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 4 }}>
                        LOT {items.findIndex(i => i.id === item.id) + 1}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{item.title}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Starting: RM{item.starting_price}</div>
                    </div>
                  </div>
                  <div>
                    {activeItemId !== item.id && (
                      <button 
                        onClick={() => updateLiveState({ active_item_id: item.id, current_price: item.current_price || item.starting_price, current_winner: item.winner_name || '' })}
                        className="zto-btn zto-btn-primary"
                        style={{ padding: '8px 24px' }}
                      >
                        <i className="fa-solid fa-play" /> Project to Screen
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Manage Items Tab ── */}
      {activeTab === 'manage' && (
        <div style={{ display: 'flex', gap: 24, flexDirection: 'column' }}>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={() => { setEditingItem({}); setIsEditing(true); }}
              className="zto-btn zto-btn-primary"
            >
              <i className="fa-solid fa-plus" /> Add New Item
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {items.map(item => (
              <div key={item.id} className="zto-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ height: 200, borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', position: 'relative' }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.2)' }}><i className="fa-solid fa-image fa-2x" /></div>
                  )}
                  {item.status === 'sold' && (
                    <div style={{ position: 'absolute', top: 12, right: 12, background: '#10b981', color: 'black', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>SOLD</div>
                  )}
                  <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                    LOT {items.findIndex(i => i.id === item.id) + 1}
                  </div>
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700 }}>{item.title}</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#DEFF9A' }}>RM {item.current_price || item.starting_price}</div>
                  <button onClick={() => { setEditingItem(item); setIsEditing(true); }} className="zto-btn zto-btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Edit Modal */}
          {isEditing && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <div className="zto-card" style={{ width: '100%', maxWidth: 600, padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700 }}>{editingItem.id ? 'Edit Item' : 'New Auction Item'}</h2>
                  <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 20 }}><i className="fa-solid fa-xmark" /></button>
                </div>

                <div>
                  <label className="zto-label">Item Title</label>
                  <input type="text" className="zto-input" value={editingItem.title || ''} onChange={e => setEditingItem({...editingItem, title: e.target.value})} />
                </div>
                
                <div>
                  <label className="zto-label">Description</label>
                  <textarea className="zto-input" rows={3} value={editingItem.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} />
                </div>

                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label className="zto-label">Starting Price (RM)</label>
                    <input type="number" className="zto-input" value={editingItem.starting_price || 0} onChange={e => setEditingItem({...editingItem, starting_price: Number(e.target.value)})} />
                  </div>
                </div>

                <div>
                  <label className="zto-label">Item Image</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {editingItem.image_url && <img src={editingItem.image_url} alt="" style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover' }} />}
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }} />
                    {uploadingImage && <span style={{ fontSize: 12, color: '#4da3ff' }}>Uploading...</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                  <button onClick={() => setIsEditing(false)} className="zto-btn zto-btn-ghost">Cancel</button>
                  <button onClick={saveItem} className="zto-btn zto-btn-primary" disabled={uploadingImage}>Save Item</button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
