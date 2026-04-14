
'use server'

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
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

export async function copyBudget(formData: FormData) {
    const fromProjectId = formData.get('fromProjectId') as string;
    const toProjectId = formData.get('toProjectId') as string;

    // 1. Fetch source budget items
    const { data: sourceItems, error: fetchError } = await supabase
        .from('budgets')
        .select('*')
        .eq('project_id', fromProjectId);

    if (fetchError) {
        console.error('Error fetching source budget:', fetchError);
        return { success: false, error: fetchError.message };
    }

    if (!sourceItems || sourceItems.length === 0) {
        return { success: true, count: 0 };
    }

    // 2. Prepare new items (exclude id and created_at)
    const newItems = sourceItems.map(({ id, created_at, ...rest }) => ({
        ...rest,
        project_id: toProjectId,
        status: 'planned' // Reset status for new project
    }));

    // 3. Batch insert
    const { error: insertError } = await supabase
        .from('budgets')
        .insert(newItems);

    if (insertError) {
        console.error('Error copying budget:', insertError);
        return { success: false, error: insertError.message };
    }

    revalidatePath(`/projects/${toProjectId}/budget`);
    revalidatePath(`/projects/${toProjectId}`);
    return { success: true, count: newItems.length };
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

export async function deleteVendor(id: string, project_id: string) {
    const { error } = await supabase.from('vendors').delete().eq('id', id);
    if (error) console.error('Error deleting vendor:', error);
    revalidatePath(`/projects/${project_id}/vendors`);
    revalidatePath(`/projects/${project_id}`);
}

export async function copyProgram(formData: FormData) {
    const fromProjectId = formData.get('fromProjectId') as string;
    const toProjectId = formData.get('toProjectId') as string;

    // 1. Copy Column Settings
    const { data: sourceSettings } = await supabase
        .from('tournament_settings')
        .select('program_columns')
        .eq('project_id', fromProjectId)
        .single();
    
    if (sourceSettings?.program_columns) {
        await supabase
            .from('tournament_settings')
            .upsert({ 
                project_id: toProjectId, 
                program_columns: sourceSettings.program_columns 
            }, { onConflict: 'project_id' });
    }

    // 2. Copy Program Items
    const { data: items, error: fetchError } = await supabase
        .from('program_items')
        .select('*')
        .eq('project_id', fromProjectId)
        .order('sort_order', { ascending: true });

    if (fetchError) {
        console.error('Error fetching source program:', fetchError);
        return { success: false, error: fetchError.message };
    }

    if (!items || items.length === 0) {
        return { success: true, count: 0 };
    }

    // 3. Prepare new items (exclude id and created_at)
    const newItems = items.map(({ id, created_at, ...rest }) => ({
        ...rest,
        project_id: toProjectId
    }));

    // 4. Batch insert
    const { error: insertError } = await supabase
        .from('program_items')
        .insert(newItems);

    if (insertError) {
        console.error('Error copying program:', insertError);
        return { success: false, error: insertError.message };
    }

    revalidatePath(`/projects/${toProjectId}/program`);
    revalidatePath(`/projects/${toProjectId}`);
    return { success: true, count: newItems.length };
}
