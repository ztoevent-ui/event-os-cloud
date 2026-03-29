-- ZTO Event OS: Project Venue Layout Settings
-- Stores which layout preset is selected for each project

CREATE TABLE IF NOT EXISTS public.project_venue_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    selected_layout text NOT NULL DEFAULT '',
    created_at timestamptz DEFAULT now(),
    UNIQUE(project_id)
);

ALTER TABLE public.project_venue_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Venue settings are public" ON public.project_venue_settings;
CREATE POLICY "Venue settings are public" ON public.project_venue_settings
    FOR ALL USING (true) WITH CHECK (true);
