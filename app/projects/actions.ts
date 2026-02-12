
'use server'

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function createTask(formData: FormData) {
    const project_id = formData.get('project_id') as string;
    const title = formData.get('title') as string;
    const priority = formData.get('priority') as string;
    const status = formData.get('status') as string;
    const description = formData.get('description') as string;

    const { error } = await supabase.from('tasks').insert({
        project_id,
        title,
        priority,
        status,
        description,
        access_level: 'staff' // Default
    });

    if (error) console.error('Error creating task:', error);
    revalidatePath(`/projects/${project_id}/tasks`);
    revalidatePath(`/projects/${project_id}`); // Update dashboard counts
}

export async function deleteTask(formData: FormData) {
    const id = formData.get('id') as string;
    const project_id = formData.get('project_id') as string;

    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) console.error('Error deleting task:', error);
    revalidatePath(`/projects/${project_id}/tasks`);
    revalidatePath(`/projects/${project_id}`);
}

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

export async function createVendor(formData: FormData) {
    const project_id = formData.get('project_id') as string;
    const name = formData.get('name') as string;
    const category = formData.get('category') as string;
    const status = formData.get('status') as string;
    const contact_person = formData.get('contact_person') as string;
    const phone = formData.get('phone') as string;

    const { error } = await supabase.from('vendors').insert({
        project_id,
        name,
        category,
        status,
        contact_person,
        phone
    });

    if (error) console.error('Error creating vendor:', error);
    revalidatePath(`/projects/${project_id}/vendors`);
    revalidatePath(`/projects/${project_id}`);
}
