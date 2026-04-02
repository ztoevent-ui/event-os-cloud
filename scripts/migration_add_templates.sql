-- Migration Script: Add Template & Dynamic Field Support
-- Run this in Supabase SQL Editor

-- 1. Add template_type and fields_config to tournament_settings
ALTER TABLE public.tournament_settings 
ADD COLUMN IF NOT EXISTS template_type TEXT DEFAULT 'guild_team_item',
ADD COLUMN IF NOT EXISTS fields_config JSONB DEFAULT '{
    "requires_gender": true,
    "show_dupr": false,
    "show_medical": false,
    "show_city_state": false,
    "show_emergency_contact": false,
    "show_work_school": false
}';

-- 2. Add captain_gender to tournament_registrations
ALTER TABLE public.tournament_registrations
ADD COLUMN IF NOT EXISTS captain_gender TEXT;

-- (Optional) Update existing records to have the default fields_config if null
UPDATE public.tournament_settings
SET fields_config = '{
    "requires_gender": true,
    "show_dupr": false,
    "show_medical": false,
    "show_city_state": false,
    "show_emergency_contact": false,
    "show_work_school": false
}'
WHERE fields_config IS NULL;
