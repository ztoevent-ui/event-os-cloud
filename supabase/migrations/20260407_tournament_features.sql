-- =====================================================
-- MIGRATION: Tournament Public Page + Temp Users + Readable URLs
-- Run in: Supabase SQL Editor
-- Date: 2026-04-07
-- =====================================================

-- =====================================================
-- 1. PROFILES TABLE — Temporary User Support
-- =====================================================

-- Add user lifecycle fields to existing profiles table
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS user_type TEXT NOT NULL DEFAULT 'permanent' CHECK (user_type IN ('permanent', 'temporary')),
    ADD COLUMN IF NOT EXISTS display_name TEXT,
    ADD COLUMN IF NOT EXISTS active_from TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS active_until TIMESTAMPTZ;

-- Function to check if a user is currently within their validity window
CREATE OR REPLACE FUNCTION public.is_user_access_valid(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_type TEXT;
    v_active_from TIMESTAMPTZ;
    v_active_until TIMESTAMPTZ;
BEGIN
    SELECT user_type, active_from, active_until
    INTO v_user_type, v_active_from, v_active_until
    FROM public.profiles
    WHERE id = p_user_id;

    -- Permanent users always have access
    IF v_user_type = 'permanent' OR v_user_type IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Temporary users: check time window
    IF v_active_from IS NOT NULL AND NOW() < v_active_from THEN
        RETURN FALSE;
    END IF;

    IF v_active_until IS NOT NULL AND NOW() > v_active_until THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. TOURNAMENT SETTINGS — Public Page Fields + Slug
-- =====================================================

-- Readable URL slug (e.g. sipc2026, myc2025 — max 10 chars)
ALTER TABLE public.tournament_settings
    ADD COLUMN IF NOT EXISTS page_slug TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#f59e0b',
    ADD COLUMN IF NOT EXISTS hero_banner_url TEXT,
    ADD COLUMN IF NOT EXISTS event_description TEXT,
    ADD COLUMN IF NOT EXISTS prize_pool JSONB DEFAULT '[]'::JSONB,
    ADD COLUMN IF NOT EXISTS categories JSONB DEFAULT '[]'::JSONB,
    ADD COLUMN IF NOT EXISTS rules TEXT,
    ADD COLUMN IF NOT EXISTS format_description TEXT,
    ADD COLUMN IF NOT EXISTS event_schedule JSONB DEFAULT '[]'::JSONB,
    ADD COLUMN IF NOT EXISTS venue_name TEXT,
    ADD COLUMN IF NOT EXISTS venue_address TEXT,
    ADD COLUMN IF NOT EXISTS venue_map_url TEXT,
    ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::JSONB,
    ADD COLUMN IF NOT EXISTS reg_open_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reg_close_date TIMESTAMPTZ;

-- Index on slug for fast lookup at /t/[slug] and /register/[slug]
CREATE UNIQUE INDEX IF NOT EXISTS idx_tournament_settings_slug 
    ON public.tournament_settings(page_slug) 
    WHERE page_slug IS NOT NULL;

-- =====================================================
-- 3. RLS POLICY — Tournament settings public read for public page
-- =====================================================

-- Allow anyone to read tournament settings by slug (for public tournament pages)
DO $$ BEGIN
    CREATE POLICY "tournament_settings_public_read" 
        ON public.tournament_settings 
        FOR SELECT 
        USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 4. HELPER VIEW — Active temporary users summary
-- =====================================================

CREATE OR REPLACE VIEW public.temporary_users_status AS
SELECT 
    p.id,
    p.display_name,
    p.user_type,
    p.active_from,
    p.active_until,
    p.created_at,
    CASE 
        WHEN p.user_type = 'permanent' THEN 'permanent'
        WHEN p.active_from IS NOT NULL AND NOW() < p.active_from THEN 'pending'
        WHEN p.active_until IS NOT NULL AND NOW() > p.active_until THEN 'expired'
        ELSE 'active'
    END AS access_status
FROM public.profiles p;
