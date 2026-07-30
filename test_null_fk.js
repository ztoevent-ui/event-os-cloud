import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('schedule_items').insert({
    project_id: null,
    date: '2026-07-29',
    time: '12:00',
    title: 'Global Task',
    note: 'Testing global task',
    transport: '',
    assignee: 'System',
    status: 'PENDING'
  }).select();
  console.log("Error:", error);
  console.log("Data:", data);
  if (data) {
    await supabase.from('schedule_items').delete().eq('id', data[0].id);
  }
}
test();
