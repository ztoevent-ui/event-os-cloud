const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const projectId = '97d456c1-b3a8-491d-ad52-c5ea97a6213b';

const itemsToInsert = [
  { item: 'Sound System (Invoice INV-0024)', amount: 2800, type: 'income', category: 'Equipment', status: 'confirmed', project_id: projectId },
  { item: 'LED Panel P3.91 Outdoor (Invoice INV-0024)', amount: 3825, type: 'income', category: 'Equipment', status: 'confirmed', project_id: projectId },
  { item: 'Marquee Tent 10M*5M (Invoice INV-0024)', amount: 5400, type: 'income', category: 'Equipment', status: 'confirmed', project_id: projectId },
  { item: 'Alloy Staging System (Invoice INV-0024)', amount: 3000, type: 'income', category: 'Equipment', status: 'confirmed', project_id: projectId },
  { item: 'DB & Jumpbox (Three Phase) (Invoice INV-0024)', amount: 500, type: 'income', category: 'Equipment', status: 'confirmed', project_id: projectId },
  { item: 'Generator 100kVa (Invoice INV-0024)', amount: 4000, type: 'income', category: 'Equipment', status: 'confirmed', project_id: projectId },
  { item: 'English & Mandarin Emcee - Dane Teng (Invoice INV-0024)', amount: 2000, type: 'income', category: 'Talent', status: 'confirmed', project_id: projectId },
  { item: 'Plastic chair with cover (Invoice INV-0024)', amount: 672, type: 'income', category: 'Equipment', status: 'confirmed', project_id: projectId },
  { item: 'Single Seater Sofa (Invoice INV-0024)', amount: 1260, type: 'income', category: 'Equipment', status: 'confirmed', project_id: projectId },
  { item: 'Hi-Tea Buffet for Guest (Invoice INV-0024)', amount: 19600, type: 'income', category: 'F&B', status: 'confirmed', project_id: projectId },
  { item: 'Dome Set for VIP (Invoice INV-0024)', amount: 1960, type: 'income', category: 'F&B', status: 'confirmed', project_id: projectId },
  { item: 'Electrical Wiring (Invoice INV-0024)', amount: 1500, type: 'income', category: 'Equipment', status: 'confirmed', project_id: projectId },
  { item: 'Air Cooler 100L (Invoice INV-0024)', amount: 400, type: 'income', category: 'Equipment', status: 'confirmed', project_id: projectId },
  { item: 'Rostrum (Invoice INV-0024)', amount: 0, type: 'income', category: 'Equipment', status: 'confirmed', project_id: projectId },
  { item: 'Event Coordinator (Invoice INV-0024)', amount: 1000, type: 'income', category: 'Manpower', status: 'confirmed', project_id: projectId },
  { item: 'Fire Extinguisher (ABC) (Invoice INV-0024)', amount: 0, type: 'income', category: 'Equipment', status: 'confirmed', project_id: projectId },
  { item: 'Table with cover (Invoice INV-0024)', amount: 840, type: 'income', category: 'Equipment', status: 'confirmed', project_id: projectId },
  { item: 'Ribbon-cutting Ceremony Balloon (Invoice INV-0024)', amount: 2250, type: 'income', category: 'Equipment', status: 'confirmed', project_id: projectId },
  { item: 'Photographer & Videographer (Invoice INV-0024)', amount: 3000, type: 'income', category: 'Talent', status: 'confirmed', project_id: projectId },
  { item: 'Corsage (Fresh Flower) (Invoice INV-0024)', amount: 360, type: 'income', category: 'Equipment', status: 'confirmed', project_id: projectId },
  { item: 'Rounding Adjust (Invoice INV-0024)', amount: -166, type: 'income', category: 'Other', status: 'confirmed', project_id: projectId },
  { item: 'Backdrop Structure & Frame Setup (Invoice INV-0024)', amount: 1799, type: 'income', category: 'Equipment', status: 'confirmed', project_id: projectId },
  { item: 'Hi-Tea Buffet - Pakej Menu (Invoice INV-0024)', amount: 4000, type: 'income', category: 'F&B', status: 'confirmed', project_id: projectId },
];

async function run() {
  console.log('Deleting old income items...');
  const { error: delError } = await supabase.from('budgets').delete().eq('project_id', projectId).eq('type', 'income');
  if (delError) {
    console.error('Error deleting:', delError);
    return;
  }
  
  console.log('Inserting new invoice items...');
  const { error: insError } = await supabase.from('budgets').insert(itemsToInsert);
  if (insError) {
    console.error('Error inserting:', insError);
    return;
  }
  
  console.log('Successfully updated budget income!');
}
run();
