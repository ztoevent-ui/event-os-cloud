import { NextRequest, NextResponse } from 'next/server';
import { parseScheduleText } from '@/lib/pdf-schedule-parser';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    if (!file.name.toLowerCase().endsWith('.pdf'))
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    // unpdf works in Node.js/Edge without browser DOM APIs
    const { extractText } = await import('unpdf');
    const { text } = await extractText(uint8, { mergePages: true });

    const rawText = text || '';
    const matches = parseScheduleText(rawText);

    return NextResponse.json({
      success: true,
      charCount: rawText.length,
      rawTextPreview: rawText.slice(0, 1000),
      matches,
    });
  } catch (err: any) {
    console.error('[parse-pdf]', err);
    return NextResponse.json({ error: err?.message || 'Parsing failed' }, { status: 500 });
  }
}
