-- ZTO Event OS: Project Venue Layout Settings (v2)
-- Added layout_data to store draggable positions and material choices

ALTER TABLE public.project_venue_settings 
ADD COLUMN IF NOT EXISTS layout_data jsonb DEFAULT '{}';

-- No changes to RLS needed as it's already public for now
