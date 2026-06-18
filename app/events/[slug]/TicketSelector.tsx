'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TicketSelector({ event, tiers }: { event: any, tiers: any[] }) {
  const router = useRouter();
  // State for single tier selection
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTier = tiers.find(t => t.id === selectedTierId);
  const totalPrice = selectedTier ? selectedTier.price * quantity : 0;

  const handleSelectTier = (tierId: string) => {
    setSelectedTierId(tierId);
    setQuantity(1); // reset quantity when switching tiers
  };

  const handleCheckout = async () => {
    if (!selectedTierId || quantity === 0) return;
    
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ticketing/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          tierId: selectedTierId,
          quantity: quantity
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to reserve tickets. They might be sold out.');
      }

      // Success! The API returned a payment URL because it created the payment intent immediately.
      // Wait, let's redirect directly to the payment gateway url!
      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        // Fallback to success page if no payment URL (e.g. free tier)
        router.push(`/orders/${data.order_id}/success`);
      }
      
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (!tiers || tiers.length === 0) {
    return (
      <div className="zto-card">
        <p className="zto-desc text-center">Tickets are not available yet.</p>
      </div>
    );
  }

  return (
    <div className="zto-card" style={{ padding: 32 }}>
      <h3 style={{ color: '#fff', fontSize: '1.25rem', marginBottom: 24, fontWeight: 700 }}>Select Tickets</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tiers.map(tier => {
          const isSoldOut = tier.status === 'sold_out' || tier.available_capacity <= 0;
          const isSelected = selectedTierId === tier.id;
          
          return (
            <div 
              key={tier.id} 
              onClick={() => !isSoldOut && handleSelectTier(tier.id)}
              style={{ 
                padding: '16px', 
                border: `1px solid ${isSelected ? 'var(--zto-blue)' : 'rgba(255,255,255,0.08)'}`,
                background: isSelected ? 'rgba(0, 86, 179, 0.1)' : 'rgba(255,255,255,0.02)',
                borderRadius: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                opacity: isSoldOut ? 0.5 : 1,
                cursor: isSoldOut ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem' }}>{tier.name}</div>
                <div className="zto-desc" style={{ fontSize: '0.8rem', marginTop: 4 }}>
                  {event.currency} {tier.price.toFixed(2)}
                </div>
                {isSoldOut && (
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4, fontWeight: 600 }}>SOLD OUT</div>
                )}
              </div>
              
              {isSelected && !isSoldOut && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} onClick={(e) => e.stopPropagation()}>
                  <button 
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(q => q - 1)}
                    style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                      cursor: quantity <= 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <i className="fa-solid fa-minus" />
                  </button>
                  
                  <span style={{ color: '#fff', width: 20, textAlign: 'center', fontWeight: 600 }}>{quantity}</span>
                  
                  <button 
                    disabled={quantity >= tier.max_per_order}
                    onClick={() => setQuantity(q => q + 1)}
                    style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                      cursor: quantity >= tier.max_per_order ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <i className="fa-solid fa-plus" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="zto-label">Total</div>
          <div style={{ color: 'var(--zto-lime)', fontSize: '1.5rem', fontWeight: 800 }}>
            {event.currency} {totalPrice.toFixed(2)}
          </div>
        </div>
        
        <button 
          className="zto-btn zto-btn-primary" 
          onClick={handleCheckout}
          disabled={!selectedTierId || quantity === 0 || loading || event.status !== 'on_sale'}
          style={{ width: 160 }}
        >
          {loading ? <i className="fa-solid fa-circle-notch fa-spin" /> : 'Pay Now'}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 16, padding: 12, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, color: '#f87171', fontSize: '0.85rem' }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }} />
          {error}
        </div>
      )}
    </div>
  );
}
