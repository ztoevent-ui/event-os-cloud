-- Migration: Fix missing columns in tournament_settings & tournament_registrations
-- Date: 2026-04-04

-- 1. Update tournament_settings with missing configuration columns
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

-- 2. Update tournament_registrations with missing data columns
ALTER TABLE public.tournament_registrations
ADD COLUMN IF NOT EXISTS team_name TEXT,
ADD COLUMN IF NOT EXISTS captain_gender TEXT,
ADD COLUMN IF NOT EXISTS captain_phone TEXT,
ADD COLUMN IF NOT EXISTS captain_email TEXT,
ADD COLUMN IF NOT EXISTS captain_details JSONB DEFAULT '{}'::jsonb;

-- 3. Update existing setup script for future-proofing
-- (This migration script only handles current DB state)
