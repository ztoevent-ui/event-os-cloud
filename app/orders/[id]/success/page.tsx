import { createSupabaseServerClient } from '@/src/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import AttendeeForm from './AttendeeForm';

export default async function OrderSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  // Ensure user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // If not authenticated, they can't view the order (RLS protects it anyway)
    return (
      <div className="zto-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="zto-card zto-card-sm text-center">
          <h2 className="zto-title mb-4">Please Log In</h2>
          <p className="zto-desc mb-6">You need to be logged in to view your tickets.</p>
          <Link href="/auth" className="zto-btn zto-btn-primary">Go to Login</Link>
        </div>
      </div>
    );
  }

  // Fetch the order and related data
  const { data: order, error: orderError } = await supabase
    .from('zt_orders')
    .select(`
      *,
      zt_events ( name, slug, start_date, venue_name, type ),
      zt_order_items ( id, tier_name, quantity, unit_price ),
      zt_attendees ( id, attendee_name, attendee_email, attendee_ic, attendee_phone, tshirt_size, ticket_code, custom_answers )
    `)
    .eq('id', id)
    .single();

  if (orderError || !order) {
    notFound();
  }

  const isPaid = order.status === 'paid';
  const event = order.zt_events;
  const attendees = order.zt_attendees || [];

  return (
    <div className="zto-shell" style={{ display: 'block', height: 'auto', minHeight: '100vh' }}>
      <div style={{ height: 80, background: '#050505' }} />
      
      <div className="zto-guardrail" style={{ maxWidth: 800, paddingBottom: 100 }}>
        {isPaid ? (
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'rgba(222, 255, 154, 0.1)', color: 'var(--zto-lime)', fontSize: 32, marginBottom: 24 }}>
              <i className="fa-solid fa-check" />
            </div>
            <h1 className="zto-title" style={{ fontSize: '2.5rem', marginBottom: 12 }}>Payment Successful!</h1>
            <p className="zto-desc" style={{ fontSize: '1.1rem' }}>Your tickets for {event.name} are confirmed.</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'rgba(239, 165, 0, 0.1)', color: '#f59e0b', fontSize: 32, marginBottom: 24 }}>
              <i className="fa-solid fa-clock" />
            </div>
            <h1 className="zto-title" style={{ fontSize: '2.5rem', marginBottom: 12 }}>Order Pending</h1>
            <p className="zto-desc" style={{ fontSize: '1.1rem' }}>We are waiting for payment confirmation for {event.name}.</p>
          </div>
        )}

        <div className="zto-card" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 24, marginBottom: 24 }}>
            <div>
              <div className="zto-label" style={{ marginBottom: 8 }}>Order Reference</div>
              <div style={{ color: '#fff', fontSize: '1.25rem', fontFamily: 'var(--font-mono)' }}>{order.id.split('-')[0].toUpperCase()}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="zto-label" style={{ marginBottom: 8 }}>Amount Paid</div>
              <div style={{ color: 'var(--zto-lime)', fontSize: '1.25rem', fontWeight: 700 }}>{order.currency} {order.total_amount.toFixed(2)}</div>
            </div>
          </div>

          <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: 16 }}>Order Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(order.zt_order_items as any[]).map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)' }}>
                <span>{item.quantity} × {item.tier_name}</span>
                <span>{order.currency} {(item.quantity * item.unit_price).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {isPaid && attendees.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 className="zto-title" style={{ fontSize: '1.5rem' }}>Your Tickets</h2>
              {event.type === 'marathon' && (
                <span className="zto-badge zto-badge-blue">Action Required Below</span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {attendees.map((attendee: any, index: number) => (
                <AttendeeForm 
                  key={attendee.id} 
                  attendee={attendee} 
                  index={index} 
                  eventType={event.type}
                />
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 48, textAlign: 'center' }}>
          <Link href={`/events/${event.slug}`} className="zto-btn zto-btn-ghost">
            Back to Event
          </Link>
        </div>
      </div>
    </div>
  );
}
