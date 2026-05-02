import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { participantId } = body;

        if (!participantId) {
            return NextResponse.json({ error: 'Missing participantId' }, { status: 400 });
        }

        // 1. Update the participant's status in the database
        const { data: participant, error: updateError } = await supabase
            .from('arena_participants')
            .update({ status: 'checked_in', check_in_time: new Date().toISOString() })
            .eq('id', participantId)
            .select('*')
            .single();

        if (updateError || !participant) {
            return NextResponse.json({ error: 'Participant not found or update failed: ' + (updateError?.message || '') }, { status: 404 });
        }

        // 2. Fetch the participant's next match to include in the response
        // In a full implementation, you'd join with arena_matches where team_a_id or team_b_id = participant.id
        // For now we'll just query arena_matches roughly based on name.
        const { data: matches } = await supabase
            .from('arena_matches')
            .select('*')
            .eq('tournament_id', participant.tournament_id)
            .in('status', ['PENDING', 'LIVE'])
            .or(`team_a_name.eq."${participant.name}",team_b_name.eq."${participant.name}"`)
            .order('created_at', { ascending: true })
            .limit(1);

        const nextMatch = matches && matches.length > 0 ? matches[0] : null;

        // 3. Broadcast the check-in event using Supabase Realtime
        const channel = supabase.channel(`arena-${participant.tournament_id}-checkins`);
        await channel.send({
            type: 'broadcast',
            event: 'player_checked_in',
            payload: {
                participantId: participant.id,
                name: participant.name,
                nextMatch: nextMatch
            }
        });
        await supabase.removeChannel(channel);

        return NextResponse.json({
            success: true,
            participant,
            nextMatch,
            message: `${participant.name} checked in successfully.`
        });
        
    } catch (err: any) {
        return NextResponse.json({ error: 'Internal Server Error: ' + err.message }, { status: 500 });
    }
}
