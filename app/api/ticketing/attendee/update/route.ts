import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/src/lib/supabase/server';
import { supabaseAdmin } from '@/src/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { attendeeId, attendee_name, attendee_email, attendee_ic, attendee_phone, tshirt_size } = body;

    if (!attendeeId) {
      return NextResponse.json({ success: false, message: 'Missing attendeeId' }, { status: 400 });
    }

    // Ensure the user actually owns this attendee record
    const { data: attendee, error: fetchError } = await supabaseAdmin
      .from('zt_attendees')
      .select('user_id')
      .eq('id', attendeeId)
      .single();

    if (fetchError || !attendee || attendee.user_id !== user.id) {
      return NextResponse.json({ success: false, message: 'Not found or forbidden' }, { status: 403 });
    }

    // Update the record using the admin client (since RLS might block direct updates)
    const { error: updateError } = await supabaseAdmin
      .from('zt_attendees')
      .update({
        attendee_name,
        attendee_email,
        attendee_ic,
        attendee_phone,
        tshirt_size,
        updated_at: new Date().toISOString()
      })
      .eq('id', attendeeId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('[attendee-update] Error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
