const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('budgets').select('*').eq('project_id', '97d456c1-b3a8-491d-ad52-c5ea97a6213b');
  if (error) {
    console.error(error);
  } else {
    console.log(data);
  }
}
run();
