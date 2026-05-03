import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id, width, height, ...rest } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing equipment id' }, { status: 400 });
        }

        // Null-safety guard: default width/height to 1 if not provided or zero
        const safeWidth = (typeof width === 'number' && width > 0) ? width : 1;
        const safeHeight = (typeof height === 'number' && height > 0) ? height : 1;

        const { data, error } = await supabase
            .from('stage_layouts')
            .update({
                ...rest,
                width: safeWidth,
                height: safeHeight,
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        return NextResponse.json({ error: 'Internal Server Error: ' + err.message }, { status: 500 });
    }
}
