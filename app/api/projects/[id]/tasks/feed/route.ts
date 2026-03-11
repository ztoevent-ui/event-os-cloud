import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Fetch project tasks
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', id)
            .neq('status', 'done') // Only sync active tasks
            .not('due_date', 'is', null);

        if (error) throw error;

        // Fetch project name for the calendar name
        const { data: project } = await supabase
            .from('projects')
            .select('name')
            .eq('id', id)
            .single();

        const projectName = project?.name || 'Event Project';

        // Generate iCal content
        let ical = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Event OS//Tasks//EN',
            `X-WR-CALNAME:${projectName} Tasks`,
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH'
        ];

        tasks?.forEach(task => {
            const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            const dtStart = new Date(task.due_date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            // Tasks usually have a due date but maybe not a start time, so we treat them as all-day or point-in-time
            
            ical.push('BEGIN:VEVENT');
            ical.push(`UID:task-${task.id}@event-os.com`);
            ical.push(`DTSTAMP:${dtStamp}`);
            ical.push(`DTSTART;VALUE=DATE:${dtStart.substring(0, 8)}`);
            ical.push(`SUMMARY:${task.title}`);
            if (task.description) {
                ical.push(`DESCRIPTION:${task.description.replace(/\n/g, '\\n')}`);
            }
            ical.push(`LOCATION:Status: ${task.status.toUpperCase()}`);
            ical.push('END:VEVENT');
        });

        ical.push('END:VCALENDAR');

        return new Response(ical.join('\r\n'), {
            headers: {
                'Content-Type': 'text/calendar; charset=utf-8',
                'Content-Disposition': `attachment; filename="tasks-${id}.ics"`,
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
            }
        });
    } catch (err: any) {
        console.error('iCal Feed Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
