
'use server'

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseKey);

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/*
 * Generates a concise client profile summary using Gemini AI.
 * Focuses on extracting key themes, style preferences, and important logistical constraints.
 */
async function generateAiSummary(loveStory: string, notes: string) {
    if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is not set. Returning mock summary.");
        return "AI Summary unavailable (API Key missing). Setup GEMINI_API_KEY in .env";
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        You are an expert wedding planner assistant. 
        Summarize the following couple's story and notes into a professional, 
        concise client profile (max 80 words).
        
        Focus on:
        1. The Vibe/Theme derived from their story.
        2. Key priorities or specific constraints from notes.
        3. Emotional tone.

        Love Story: "${loveStory}"
        Important Notes: "${notes}"
        
        Summary:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "AI Summary generation failed. Please review notes manually.";
    }
}


export async function submitConsultation(formData: FormData) {
    const rawProjectId = formData.get('project_id') as string;
    const project_id = rawProjectId && rawProjectId.trim() !== '' ? rawProjectId : null;

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

    // Construct insert payload
    const payload: any = {
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
    };

    if (project_id) {
        payload.project_id = project_id;
    }

    const { error } = await supabase.from('consulting_forms').insert(payload);

    if (error) {
        console.error('Error submitting form to Supabase:', error.message, error.details);
        throw new Error(`Failed to submit: ${error.message}`);
    }


    revalidatePath(`/projects/${project_id}/consultations`);
    // redirect(`/projects/${project_id}/consultations/thank-you`); // Optional: redirect to success page
}

export async function getAiSummaryAction(loveStory: string, notes: string) {
    return await generateAiSummary(loveStory, notes);
}
