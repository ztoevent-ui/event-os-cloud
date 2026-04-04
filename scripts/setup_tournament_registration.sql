-- Tournament Registration System Tables

-- 1. Tournament Settings Table
CREATE TABLE IF NOT EXISTS public.tournament_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'team', -- 'team' or 'individual'
    template_type VARCHAR(50) DEFAULT 'guild_team_item',
    slogan TEXT,
    logo_url TEXT,
    title_sponsor TEXT,
    sponsors TEXT[],
    co_organizers TEXT[],
    fields_config JSONB DEFAULT '{
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
    medical_options TEXT[] DEFAULT ARRAY[
        'Heart Disease / Penyakit Jantung',
        'Asthma / Asma',
        'Diabetes / Kencing Manis',
        'High Blood Pressure / Darah Tinggi',
        'Epilepsy / Sawan',
        'Joint/Bone Injury / Kecederaan Sendi'
    ],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id)
);

-- Enable RLS
ALTER TABLE public.tournament_settings ENABLE ROW LEVEL SECURITY;

-- Policies for tournament_settings
CREATE POLICY "Public can view settings" ON public.tournament_settings
    FOR SELECT USING (true);

CREATE POLICY "Public can insert settings" ON public.tournament_settings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update settings" ON public.tournament_settings
    FOR UPDATE USING (true);


-- 2. Tournament Registrations Table
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Submission Info
    organization_name TEXT NOT NULL,
    team_name TEXT,
    
    -- Captain Info
    captain_name TEXT NOT NULL,
    captain_ic TEXT NOT NULL,
    captain_role TEXT NOT NULL,
    captain_ic_url TEXT, -- Path to uploaded IC in storage
    captain_gender TEXT,
    captain_phone TEXT,
    captain_email TEXT,
    captain_details JSONB DEFAULT '{}'::jsonb, -- JSONB for other dynamic fields (medical, etc.)
    
    -- Roster Details (JSONB for flexibility)
    -- Format: [{ name, ic, organization, ic_url, category: 'MD A', ...other_fields }]
    players JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

-- Policies for tournament_registrations
CREATE POLICY "Public can insert registrations" ON public.tournament_registrations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view registrations" ON public.tournament_registrations
    FOR SELECT USING (true);

CREATE POLICY "Public can update registrations" ON public.tournament_registrations
    FOR UPDATE USING (true);

CREATE POLICY "Public can delete registrations" ON public.tournament_registrations
    FOR DELETE USING (true);
