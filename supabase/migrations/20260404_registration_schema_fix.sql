-- Migration: Add missing columns to tournament_settings for Registration Studio
-- Date: 2026-04-04

-- 1. Add missing columns to tournament_settings
ALTER TABLE public.tournament_settings 
ADD COLUMN IF NOT EXISTS template_type VARCHAR(50) DEFAULT 'guild_team_item',
ADD COLUMN IF NOT EXISTS fields_config JSONB DEFAULT '{
    "show_team_name": true,
    "show_team_dupr_average": false,
    "requires_gender": true,
    "show_ic_passport": true,
    "show_phone": true,
    "show_email": true,
    "show_dupr": false,
    "show_medical": false,
    "show_city_state": false,
    "show_emergency_contact": false,
    "show_work_school": false
}'::jsonb,
ADD COLUMN IF NOT EXISTS medical_options TEXT[] DEFAULT ARRAY[
    'Heart Disease / Penyakit Jantung',
    'Asthma / Asma',
    'Diabetes / Kencing Manis',
    'High Blood Pressure / Darah Tinggi',
    'Epilepsy / Sawan',
    'Joint/Bone Injury / Kecederaan Sendi'
];

-- 2. Ensure RLS policies are correct (they were already public in the setup script, but safety first)
-- The setup script had: "Public can view", "Public can insert", "Public can update".
-- No change needed here if those exist.

-- 3. Verify tournament_registrations is robust
-- Current schema has 'players JSONB'. The registration logic uses this correctly.
