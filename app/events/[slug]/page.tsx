import { createSupabaseServerClient } from '@/src/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import TicketSelector from './TicketSelector';

export const revalidate = 60; // ISR: Revalidate every 60 seconds

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  // 1. Fetch Event
  const { data: event, error: eventError } = await supabase
    .from('zt_events')
    .select('*')
    .eq('slug', slug)
    .in('status', ['published', 'on_sale', 'sold_out', 'completed'])
    .single();

  if (eventError || !event) {
    notFound();
  }

  // 2. Fetch Active Tiers
  const { data: tiers } = await supabase
    .from('zt_ticket_tiers')
    .select('*')
    .eq('event_id', event.id)
    .in('status', ['active', 'sold_out'])
    .order('sort_order', { ascending: true });

  const heroImage = event.banner_url || '/marathon-hero.jpg';

  return (
    <div className="zto-shell" style={{ display: 'block', height: 'auto', overflow: 'visible' }}>
      {/* Navbar spacer */}
      <div style={{ height: 70, background: '#050505' }} />
      
      {/* Hero Section */}
      <div style={{ position: 'relative', width: '100%', height: '50vh', minHeight: 400, backgroundColor: '#0a0a0a' }}>
        <Image 
          src={heroImage}
          alt={event.name}
          fill
          style={{ objectFit: 'cover', opacity: 0.7 }}
          priority
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #050505, transparent)' }} />
        <div className="zto-guardrail" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <span className="zto-badge zto-badge-blue">{event.type.replace('_', ' ')}</span>
            <span className={`zto-badge ${event.status === 'on_sale' ? 'zto-badge-lime' : 'zto-badge-red'}`}>
              {event.status === 'on_sale' ? 'Tickets Available' : event.status.replace('_', ' ')}
            </span>
          </div>
          <h1 className="zto-title" style={{ fontSize: '3rem', marginBottom: 8 }}>{event.name}</h1>
          <div style={{ display: 'flex', gap: 24, color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="fa-regular fa-calendar" /> 
              {new Date(event.start_date).toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="fa-solid fa-location-dot" /> 
              {event.venue_name}
            </span>
          </div>
        </div>
      </div>

      {/* Content & Ticketing */}
      <div className="zto-guardrail" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 48, alignItems: 'start', paddingBottom: 100 }}>
        
        {/* Left Col - Details */}
        <div>
          <h2 className="zto-title" style={{ marginBottom: 24 }}>Event Overview</h2>
          <div 
            className="zto-desc" 
            style={{ fontSize: '1rem', whiteSpace: 'pre-wrap' }}
          >
            {event.description || 'Join us for an unforgettable experience. Full event details will be announced soon.'}
          </div>

          <div className="zto-card zto-card-sm" style={{ marginTop: 48, padding: 24 }}>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: 16 }}>Location</h3>
            <p className="zto-desc" style={{ marginBottom: 8 }}><strong>{event.venue_name}</strong></p>
            <p className="zto-desc">{event.venue_address}</p>
          </div>
        </div>

        {/* Right Col - Ticket Selector */}
        <div style={{ position: 'sticky', top: 100 }}>
          <TicketSelector event={event} tiers={tiers || []} />
        </div>

      </div>
    </div>
  );
}
