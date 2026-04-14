-- =====================================================
-- FIX: Relaxed Storage Policies for Tournament Suite
-- Run in: Supabase SQL Editor
-- =====================================================

-- ── 1. logo bucket ──────────────────────────────────────────────────────────
-- Allow ANON to insert for testing/registration guest flows
DO $$ BEGIN
    CREATE POLICY "logo_anon_insert" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'logo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow update/delete for authenticated users (organizers)
DO $$ BEGIN
    CREATE POLICY "logo_auth_all" ON storage.objects
        FOR ALL USING (bucket_id = 'logo' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. event-assets bucket ──────────────────────────────────────────────────
DO $$ BEGIN
    CREATE POLICY "assets_anon_insert" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'event-assets');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "assets_auth_all" ON storage.objects
        FOR ALL USING (bucket_id = 'event-assets' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 3. tournament-banners bucket ─────────────────────────────────────────────
DO $$ BEGIN
    CREATE POLICY "banners_anon_insert" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'tournament-banners');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "banners_auth_all" ON storage.objects
        FOR ALL USING (bucket_id = 'tournament-banners' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 4. Verify existing buckets are public ────────────────────────────────────
UPDATE storage.buckets SET public = true WHERE id IN ('logo', 'event-assets', 'tournament-banners');
