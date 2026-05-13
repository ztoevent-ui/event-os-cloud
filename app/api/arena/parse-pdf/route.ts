import { NextRequest, NextResponse } from 'next/server';
import { parseScheduleText } from '@/lib/pdf-schedule-parser';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    // Convert File -> Buffer for pdf-parse
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dynamically import pdf-parse (CommonJS module)
    const pdfParse = (await import('pdf-parse')).default;
    const result = await pdfParse(buffer);

    const rawText = result.text;
    const matches = parseScheduleText(rawText);

    return NextResponse.json({
      success: true,
      pageCount: result.numpages,
      charCount: rawText.length,
      rawTextPreview: rawText.slice(0, 800),
      matches,
    });
  } catch (err: any) {
    console.error('PDF parse error:', err);
    return NextResponse.json(
      { error: err?.message || 'PDF parsing failed' },
      { status: 500 }
    );
  }
}
