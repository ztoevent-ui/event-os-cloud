const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const projectId = 'ee6c37bc-0942-4380-aa88-bea32927318e';

const quotationItems = [
  { item: 'Marquee Tent', amount: 20000.00 },
  { item: 'LED Panel - Outdoor', amount: 4500.00 },
  { item: 'Marquee Tent Wooden Platform', amount: 2000.00 },
  { item: 'Alloy Staging System', amount: 3500.00 },
  { item: 'Electrical Wiring', amount: 1500.00 },
  { item: 'Installation & Dismantling Work & Transportation', amount: 200.00 },
  { item: 'Air Cooler 100L', amount: 750.00 },
  { item: 'Office Table 6ft', amount: 0.00 }
];

async function insertBudgets() {
  const budgets = quotationItems.map(q => ({
    project_id: projectId,
    item: q.item,
    amount: q.amount,
    type: 'income',
    status: 'planned'
  }));

  const { data, error } = await supabase
    .from('budgets')
    .insert(budgets)
    .select();

  if (error) {
    console.error('Error inserting budgets:', error);
  } else {
    console.log(`Successfully inserted ${data.length} records.`);
  }
}

insertBudgets();
