
'use server'

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- TASKS ---
export async function createTask(formData: FormData) {
    const project_id = formData.get('project_id') as string;
    const title = formData.get('title') as string;
    const priority = formData.get('priority') as string;
    const status = formData.get('status') as string;
    const description = formData.get('description') as string;
    const due_date = formData.get('due_date') as string || null;

    const { error } = await supabase.from('tasks').insert({
        project_id,
        title,
        priority,
        status,
        description,
        due_date,
        access_level: 'staff'
    });

    if (error) console.error('Error creating task:', error);
    revalidatePath(`/projects/${project_id}/tasks`);
    revalidatePath(`/projects/${project_id}`);
}

export async function updateTask(formData: FormData) {
    const id = formData.get('id') as string;
    const project_id = formData.get('project_id') as string;
    const title = formData.get('title') as string;
    const priority = formData.get('priority') as string;
    const status = formData.get('status') as string;
    const description = formData.get('description') as string;
    const due_date = formData.get('due_date') as string || null;

    const { error } = await supabase.from('tasks').update({
        title,
        priority,
        status,
        description,
        due_date
    }).eq('id', id);

    if (error) console.error('Error updating task:', error);
    revalidatePath(`/projects/${project_id}/tasks`);
    revalidatePath(`/projects/${project_id}`);
}

export async function deleteTask(formData: FormData) {
    const id = formData.get('id') as string;
    const project_id = formData.get('project_id') as string;

    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) console.error('Error deleting task:', error);
    revalidatePath(`/projects/${project_id}/tasks`);
    revalidatePath(`/projects/${project_id}`);
}

// --- TIMELINES ---
export async function createTimeline(formData: FormData) {
    const project_id = formData.get('project_id') as string;
    const name = formData.get('name') as string;
    const start_date = formData.get('start_date') as string;
    const end_date = formData.get('end_date') as string;

    const { error } = await supabase.from('timelines').insert({
        project_id,
        name,
        start_date: start_date || null,
        end_date: end_date || null
    });

    if (error) console.error('Error creating timeline:', error);
    revalidatePath(`/projects/${project_id}/timelines`);
    revalidatePath(`/projects/${project_id}`);
}

export async function deleteTimeline(formData: FormData) {
    const id = formData.get('id') as string;
    const project_id = formData.get('project_id') as string;

    const { error } = await supabase.from('timelines').delete().eq('id', id);
    if (error) console.error('Error deleting timeline:', error);
    revalidatePath(`/projects/${project_id}/timelines`);
}


// --- BUDGETS ---
export async function createBudget(formData: FormData) {
    const project_id = formData.get('project_id') as string;
    const item = formData.get('item') as string;
    const amount = formData.get('amount') as string;
    const type = formData.get('type') as string;
    const category = formData.get('category') as string;

    const { error } = await supabase.from('budgets').insert({
        project_id,
        item,
        amount,
        type,
        category,
        status: 'planned'
    });

    if (error) console.error('Error creating budget:', error);
    revalidatePath(`/projects/${project_id}/budget`);
    revalidatePath(`/projects/${project_id}`);
}

export async function deleteBudget(formData: FormData) {
    const id = formData.get('id') as string;
    const project_id = formData.get('project_id') as string;

    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) console.error('Error deleting budget:', error);
    revalidatePath(`/projects/${project_id}/budget`);
    revalidatePath(`/projects/${project_id}`);
}


// --- VENDORS ---
export async function createVendor(formData: FormData) {
    const project_id = formData.get('project_id') as string;
    const name = formData.get('name') as string;
    const category = formData.get('category') as string;
    const status = formData.get('status') as string;
    const contact_person = formData.get('contact_person') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;

    const { error } = await supabase.from('vendors').insert({
        project_id,
        name,
        category,
        status,
        contact_person,
        phone,
        email
    });

    if (error) console.error('Error creating vendor:', error);
    revalidatePath(`/projects/${project_id}/vendors`);
    revalidatePath(`/projects/${project_id}`);
}

export async function deleteVendor(formData: FormData) {
    const id = formData.get('id') as string;
    const project_id = formData.get('project_id') as string;

    const { error } = await supabase.from('vendors').delete().eq('id', id);
    if (error) console.error('Error deleting vendor:', error);
    revalidatePath(`/projects/${project_id}/vendors`);
    revalidatePath(`/projects/${project_id}`);
}
