
'use server'

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/*
Simplified AI Logic for now.
Ideally, this should call an API route where you have the Gemini API key securely stored.
For this MVP, we will simulate the summary or use a basic string manipulation.
*/
async function generateAiSummary(loveStory: string, notes: string) {
    // Placeholder for actual Gemini API call
    // const prompt = `Summarize this client profile in under 100 words based on their love story: "${loveStory}" and notes: "${notes}".`;
    // const summary = await gemini.generate(prompt);

    const combined = `${loveStory} ${notes}`;
    return "New client inquiry. " + combined.slice(0, 80) + "...";
}

export async function submitConsultation(formData: FormData) {
    const project_id = formData.get('project_id') as string;

    // Step 1
    const groom_name = formData.get('groom_name') as string;
    const bride_name = formData.get('bride_name') as string;
    const contact_phone = formData.get('contact_phone') as string;
    const contact_email = formData.get('contact_email') as string;
    const contact_time = formData.get('contact_time') as string;

    // Step 2
    const wedding_date = formData.get('wedding_date') as string || null;
    const location = formData.get('location') as string;
    const guest_count = formData.get('guest_count') ? parseInt(formData.get('guest_count') as string) : null;
    const budget_range = formData.get('budget_range') as string;
    const wedding_theme = formData.get('wedding_theme') as string;

    // Step 3 (Booked Vendors) - Parse from hidden JSON input or multiple fields
    // Assuming the frontend serializes the dynamic list into a single JSON string
    const booked_vendors_json = formData.get('booked_vendors') as string;
    const booked_vendors = booked_vendors_json ? JSON.parse(booked_vendors_json) : [];

    // Step 4
    const special_features = formData.get('special_features') as string;
    const important_notes = formData.get('important_notes') as string;
    const love_story = formData.get('love_story') as string;

    // AI Summary
    const ai_summary = await generateAiSummary(love_story, important_notes);

    const { error } = await supabase.from('consulting_forms').insert({
        project_id,
        groom_name,
        bride_name,
        contact_phone,
        contact_email,
        contact_time,
        wedding_date,
        location,
        guest_count,
        budget_range,
        wedding_theme,
        booked_vendors,
        special_features,
        important_notes,
        love_story,
        ai_summary,
        status: 'new'
    });

    if (error) {
        console.error('Error submitting form:', error);
        throw new Error('Failed to submit consultation form');
    }

    revalidatePath(`/projects/${project_id}/consultations`);
    // redirect(`/projects/${project_id}/consultations/thank-you`); // Optional: redirect to success page
}
