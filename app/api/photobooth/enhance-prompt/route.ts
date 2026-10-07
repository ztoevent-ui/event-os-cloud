import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { theme } = await request.json();
        
        if (!theme) {
            return NextResponse.json({ error: 'No theme provided' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
        }

        const prompt = `You are an expert midjourney prompt engineer. The user has provided a simple theme for a photobooth background: "${theme}". 
Write a highly detailed, descriptive, comma-separated image generation prompt (max 30 words) based on this theme.
Focus on lighting, atmosphere, style, and high quality (e.g. 4k, hyperrealistic, cinematic lighting). 
Do NOT include the person or subject in the prompt, ONLY the background/environment.
Respond ONLY with the generated prompt, nothing else.`;

        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': apiKey,
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Gemini API error: ${err}`);
        }

        const data = await response.json();
        const enhancedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || theme;

        return NextResponse.json({ enhancedPrompt });

    } catch (error: any) {
        console.error('[photobooth/enhance-prompt] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
