-- Migration to add meeting_notes and project_assets to projects table

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS meeting_notes TEXT,
ADD COLUMN IF NOT EXISTS project_assets TEXT[] DEFAULT '{}';
