const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL="([^"]+)"/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="([^"]+)"/);
const supabase = createClient(urlMatch[1], keyMatch[1]);

const PROJECT_ID = '97d456c1-b3a8-491d-ad52-c5ea97a6213b';

const data = [
  // Income (From Quotation)
  { project_id: PROJECT_ID, type: 'income', status: 'confirmed', item: 'Sound System (Quotation)', amount: 3500, category: 'Equipment' },
  { project_id: PROJECT_ID, type: 'income', status: 'confirmed', item: 'LED Panel P3.91 Outdoor (Quotation)', amount: 3825, category: 'Equipment' },
  { project_id: PROJECT_ID, type: 'income', status: 'confirmed', item: 'Marquee Tent 10M*5M (Quotation)', amount: 5400, category: 'Equipment' },
  { project_id: PROJECT_ID, type: 'income', status: 'confirmed', item: 'Alloy Staging System (Quotation)', amount: 3000, category: 'Equipment' },
  { project_id: PROJECT_ID, type: 'income', status: 'confirmed', item: 'DB & Jumpbox (Three Phase) (Quotation)', amount: 500, category: 'Equipment' },
  { project_id: PROJECT_ID, type: 'income', status: 'confirmed', item: 'Generator 100kVa (Quotation)', amount: 4000, category: 'Equipment' },
  { project_id: PROJECT_ID, type: 'income', status: 'confirmed', item: 'Emcee - Dane Teng (Quotation)', amount: 4000, category: 'Talent' },
  { project_id: PROJECT_ID, type: 'income', status: 'confirmed', item: 'Plastic chair with cover (Quotation)', amount: 1600, category: 'Equipment' },
  { project_id: PROJECT_ID, type: 'income', status: 'confirmed', item: 'Single Seater Sofa (Quotation)', amount: 1260, category: 'Equipment' },
  { project_id: PROJECT_ID, type: 'income', status: 'confirmed', item: 'Coffee Table with cover (Quotation)', amount: 300, category: 'Equipment' },
  { project_id: PROJECT_ID, type: 'income', status: 'confirmed', item: 'Hi-Tea Buffet for Guest (Quotation)', amount: 19600, category: 'F&B' },
  { project_id: PROJECT_ID, type: 'income', status: 'confirmed', item: 'Dome Set for VIP (Quotation)', amount: 1960, category: 'F&B' },
  { project_id: PROJECT_ID, type: 'income', status: 'confirmed', item: 'Electrical Wiring (Quotation)', amount: 1500, category: 'Equipment' },
  { project_id: PROJECT_ID, type: 'income', status: 'confirmed', item: 'Air Cooler 100L (Quotation)', amount: 400, category: 'Equipment' },
  { project_id: PROJECT_ID, type: 'income', status: 'confirmed', item: 'Rostrum (Quotation)', amount: 0, category: 'Equipment' },
  { project_id: PROJECT_ID, type: 'income', status: 'confirmed', item: 'Event Coordinator (Quotation)', amount: 1000, category: 'Manpower' },
  { project_id: PROJECT_ID, type: 'income', status: 'confirmed', item: 'Fire Extinguisher (ABC) (Quotation)', amount: 0, category: 'Equipment' },
  { project_id: PROJECT_ID, type: 'income', status: 'confirmed', item: 'Table with cover (Quotation)', amount: 840, category: 'Equipment' },

  // Expenses
  { project_id: PROJECT_ID, type: 'expense', status: 'confirmed', item: 'Sound System', amount: 2300, category: 'Equipment' },
  { project_id: PROJECT_ID, type: 'expense', status: 'confirmed', item: 'LED Panel', amount: 250, category: 'Equipment' },
  { project_id: PROJECT_ID, type: 'expense', status: 'confirmed', item: 'Marquee Tent (自有器材)', amount: 0, category: 'Equipment' },
  { project_id: PROJECT_ID, type: 'expense', status: 'confirmed', item: '舞台 Stage (自有器材)', amount: 0, category: 'Equipment' },
  { project_id: PROJECT_ID, type: 'expense', status: 'confirmed', item: 'DB (自有器材)', amount: 0, category: 'Equipment' },
  { project_id: PROJECT_ID, type: 'expense', status: 'confirmed', item: 'Genset and diesel', amount: 3900, category: 'Equipment' },
  { project_id: PROJECT_ID, type: 'expense', status: 'confirmed', item: '主持人 dane teng', amount: 1500, category: 'Talent' },
  { project_id: PROJECT_ID, type: 'expense', status: 'confirmed', item: 'Single Seater Sofa', amount: 600, category: 'Equipment' },
  { project_id: PROJECT_ID, type: 'expense', status: 'confirmed', item: 'hi tea buffet 220pax', amount: 19360, category: 'F&B' },
  { project_id: PROJECT_ID, type: 'expense', status: 'confirmed', item: 'Air Cooler (自有器材)', amount: 0, category: 'Equipment' },
  { project_id: PROJECT_ID, type: 'expense', status: 'confirmed', item: 'Rostrum (维修)', amount: 250, category: 'Equipment' },
  { project_id: PROJECT_ID, type: 'expense', status: 'confirmed', item: 'Table with cover', amount: 500, category: 'Equipment' },
  { project_id: PROJECT_ID, type: 'expense', status: 'confirmed', item: 'Plastic chair with cover', amount: 840, category: 'Equipment' },
  { project_id: PROJECT_ID, type: 'expense', status: 'confirmed', item: '人工 5位', amount: 4500, category: 'Manpower' },
  { project_id: PROJECT_ID, type: 'expense', status: 'confirmed', item: 'lorry fuel', amount: 500, category: 'Logistics' },
  { project_id: PROJECT_ID, type: 'expense', status: 'confirmed', item: 'Event Coordinator - Connie', amount: 500, category: 'Manpower' },
];

async function run() {
  // First clear existing budget for this project just in case
  const { error: deleteError } = await supabase.from('budgets').delete().eq('project_id', PROJECT_ID);
  if (deleteError) {
      console.error('Delete error', deleteError);
      return;
  }
  
  const { data: result, error } = await supabase.from('budgets').insert(data);
  if (error) console.error("Insert error:", error);
  else console.log("Successfully inserted", data.length, "budget items.");
}
run();
