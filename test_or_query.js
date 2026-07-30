import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const projectIds = ['fbde691b-8901-4696-acb5-b563b1d3e260', '00000000-0000-0000-0000-000000000000'];
  const orString = `project_id.in.(${projectIds.join(',')}),project_id.is.null`;
  console.log("orString", orString);
  const { data, error } = await supabase.from('schedule_items').select('*').or(orString);
  console.log("Error:", error);
  console.log("Data count:", data?.length);
}
test();
