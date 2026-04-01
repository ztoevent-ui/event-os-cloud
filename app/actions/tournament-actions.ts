'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function uploadICFile(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const file = formData.get('file') as File;
        const project_id = formData.get('project_id') as string;
        
        if (!file || !project_id) {
            return { success: false, error: 'Missing file or project ID' };
        }
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${project_id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
            .from('tournament-ic')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
            
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
            .from('tournament-ic')
            .getPublicUrl(fileName);
            
        return { success: true, url: publicUrl };
    } catch (e: any) {
        console.error('File upload failed', e);
        return { success: false, error: e.message };
    }
}
