'use server';

import { supabase } from '@/lib/supabaseClient';

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

export async function uploadLogoFile(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const file = formData.get('file') as File;
        const project_id = formData.get('project_id') as string;
        
        if (!file || !project_id) {
            return { success: false, error: 'Missing file or project ID' };
        }
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${project_id}/logo_${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
            .from('logo')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
            
        if (error) {
            console.error('Uploading to logo bucket failed, fallback to tournament-ic bucket', error);
            const fallbackResult = await uploadICFile(formData);
            return fallbackResult;
        }
        
        const { data: { publicUrl } } = supabase.storage
            .from('logo')
            .getPublicUrl(fileName);
            
        return { success: true, url: publicUrl };
    } catch (e: any) {
        console.error('Logo upload failed', e);
        return { success: false, error: e.message };
    }
}

export async function linkTournamentToProject(tournamentId: string, projectId: string) {
    const { data, error } = await supabase
        .from('arena_tournaments')
        .update({ linked_project_id: projectId })
        .eq('id', tournamentId)
        .select();

    if (error) {
        console.error('Error linking tournament:', error);
        return { success: false, error: error.message };
    }
    return { success: true, data };
}
