import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

function escapeIcsText(val: string): string {
    return (val || '')
        .replace(/\\/g, '\\\\')
        .replace(/\r?\n/g, '\\n')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,');
}

function parseTimeRange(dateStr: string, rawTime?: string | null): { start: string; end: string } {
    const cleanDate = dateStr.replace(/-/g, '');
    const m = (rawTime || '').match(/(\d{1,2})[:.](\d{2})(?:\s*(?:am|pm))?\s*(?:-|to|–|—)?\s*(?:(\d{1,2})[:.](\d{2})(?:\s*(?:am|pm))?)?/i);
    if (!m) {
        return { start: `${cleanDate}T090000`, end: `${cleanDate}T170000` };
    }

    const sh = Math.min(23, Math.max(0, parseInt(m[1], 10)));
    const sm = Math.min(59, Math.max(0, parseInt(m[2], 10)));
    let eh = m[3] ? Math.min(23, Math.max(0, parseInt(m[3], 10))) : Math.min(23, sh + 2);
    let em = m[4] ? Math.min(59, Math.max(0, parseInt(m[4], 10))) : sm;

    if (eh * 60 + em <= sh * 60 + sm) {
        eh = Math.min(23, sh + 1);
        em = sm;
        if (eh * 60 + em <= sh * 60 + sm) {
            eh = 23;
            em = 59;
        }
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    return {
        start: `${cleanDate}T${pad(sh)}${pad(sm)}00`,
        end: `${cleanDate}T${pad(eh)}${pad(em)}00`,
    };
}

/**
 * Dynamic RFC 5545 iCalendar feed backed by Supabase `schedule_items` & active `projects`.
 * Supports both direct file download (`?download=1`) and live Google/Apple Calendar URL subscription.
 */
export async function GET(req: NextRequest) {
    const isDownload = req.nextUrl.searchParams.get('download') === '1';

    const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, venue, status')
        .neq('status', 'completed');

    const projectMap: Record<string, { id: string; name: string; venue?: string | null }> = {};
    const projectIds: string[] = [];
    for (const p of projectsData || []) {
        projectMap[p.id] = p;
        projectIds.push(p.id);
    }

    let query = supabase
        .from('schedule_items')
        .select('id, project_id, date, time, title, note, assignee, status, sort_order, created_at')
        .order('date', { ascending: true })
        .order('sort_order', { ascending: true });

    if (projectIds.length > 0) {
        query = query.or(`project_id.in.(${projectIds.join(',')}),project_id.is.null`);
    } else {
        query = query.is('project_id', null);
    }

    const { data: items, error } = await query;
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const lines: string[] = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//ZTO Event OS//Global Operations Schedule//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:ZTO Event OS Global Schedule',
        'X-WR-TIMEZONE:Asia/Kuching',
        'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
        'X-PUBLISHED-TTL:PT1H',
        'BEGIN:VTIMEZONE',
        'TZID:Asia/Kuching',
        'BEGIN:STANDARD',
        'DTSTART:19700101T000000',
        'TZOFFSETFROM:+0800',
        'TZOFFSETTO:+0800',
        'TZNAME:+08',
        'END:STANDARD',
        'END:VTIMEZONE',
    ];

    const dtStamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');

    for (const item of items || []) {
        if (!item.date || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) continue;
        const proj = item.project_id ? projectMap[item.project_id] : null;
        const prefix = proj ? `[${proj.name}]` : '[ZTO Global]';
        const { start, end } = parseTimeRange(item.date, item.time);
        const descParts = [
            proj ? `Project: ${proj.name}` : 'Scope: Global Task',
            item.assignee ? `PIC: ${item.assignee}` : '',
            item.status ? `Status: ${item.status}` : '',
            item.note || '',
        ].filter(Boolean);

        lines.push(
            'BEGIN:VEVENT',
            `UID:zto-sched-${item.id}@ztoevent.com`,
            `DTSTAMP:${dtStamp}`,
            `DTSTART;TZID=Asia/Kuching:${start}`,
            `DTEND;TZID=Asia/Kuching:${end}`,
            `SUMMARY:${escapeIcsText(`${prefix} ${item.title || 'Scheduled Operation'}`)}`,
            `DESCRIPTION:${escapeIcsText(descParts.join('\n'))}`,
            ...(proj?.venue ? [`LOCATION:${escapeIcsText(proj.venue)}`] : []),
            `STATUS:${item.status === 'DONE' ? 'COMPLETED' : 'CONFIRMED'}`,
            'END:VEVENT'
        );
    }

    lines.push('END:VCALENDAR', '');

    return new NextResponse(lines.join('\r\n'), {
        status: 200,
        headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': `${isDownload ? 'attachment' : 'inline'}; filename="ztoevent_global_schedule.ics"`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
    });
}
