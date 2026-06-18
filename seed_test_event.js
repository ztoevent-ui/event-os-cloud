import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // Check for organizer profile
  const { data: users, error: uErr } = await supabase.from('zt_profiles').select('id').limit(1);
  if (uErr) {
    console.log('Error fetching profiles:', uErr);
    return;
  }
  const orgId = users[0]?.id;

  // 1. Create Event
  const { data: event, error: evErr } = await supabase.from('zt_events').insert({
    slug: 'borneo-marathon-2026',
    name: 'Borneo Marathon 2026',
    description: 'The ultimate tropical rainforest marathon experience. Join thousands of runners in traversing the scenic routes of Sarawak.',
    type: 'marathon',
    status: 'on_sale',
    start_date: '2026-08-15T06:00:00Z',
    end_date: '2026-08-15T12:00:00Z',
    venue_name: 'Kuching Waterfront',
    venue_address: 'Jalan Main Bazaar, 93000 Kuching, Sarawak',
    currency: 'MYR',
    organizer_id: orgId
  }).select().single();

  if (evErr) {
    if (evErr.code === '23505') {
      console.log('Event already exists.');
    } else {
      console.log('Error creating event:', evErr);
    }
  } else {
    console.log('Event created:', event.slug);
    
    // 2. Create Tiers
    await supabase.from('zt_ticket_tiers').insert([
      {
        event_id: event.id,
        name: '42KM Full Marathon',
        price: 150.00,
        available_capacity: 500,
        max_per_order: 1,
        status: 'active',
        sort_order: 1
      },
      {
        event_id: event.id,
        name: '21KM Half Marathon',
        price: 120.00,
        available_capacity: 1000,
        max_per_order: 1,
        status: 'active',
        sort_order: 2
      },
      {
        event_id: event.id,
        name: '10KM Run',
        price: 80.00,
        available_capacity: 2000,
        max_per_order: 2,
        status: 'active',
        sort_order: 3
      }
    ]);
    console.log('Tiers created.');
  }
}
run();
