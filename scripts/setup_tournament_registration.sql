-- Tournament Registration System Tables

-- 1. Tournament Settings Table
CREATE TABLE IF NOT EXISTS public.tournament_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'team', -- 'team' or 'individual'
    slogan TEXT,
    logo_url TEXT,
    title_sponsor TEXT,
    sponsors TEXT[],
    co_organizers TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id)
);

-- Enable RLS
ALTER TABLE public.tournament_settings ENABLE ROW LEVEL SECURITY;

-- Policies for tournament_settings
CREATE POLICY "Public can view settings" ON public.tournament_settings
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert settings" ON public.tournament_settings
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update settings" ON public.tournament_settings
    FOR UPDATE TO authenticated USING (true);


-- 2. Tournament Registrations Table
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Submission Info
    organization_name TEXT NOT NULL,
    
    -- Captain Info
    captain_name TEXT NOT NULL,
    captain_ic TEXT NOT NULL,
    captain_role TEXT NOT NULL,
    captain_ic_url TEXT, -- Path to uploaded IC in storage
    
    -- Roster Details (JSONB for flexibility)
    -- Format: [{ name, ic, organization, ic_url, category: 'MD A' }]
    players JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

-- Policies for tournament_registrations
CREATE POLICY "Public can insert registrations" ON public.tournament_registrations
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Authenticated users can view registrations" ON public.tournament_registrations
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update registrations" ON public.tournament_registrations
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete registrations" ON public.tournament_registrations
    FOR DELETE TO authenticated USING (true);
