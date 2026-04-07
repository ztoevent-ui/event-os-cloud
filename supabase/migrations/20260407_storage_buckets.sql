-- =====================================================
-- MIGRATION: Storage Buckets + RLS Policies
-- Run in: Supabase SQL Editor
-- Date: 2026-04-07
-- =====================================================

-- ── 1. CREATE BUCKETS ────────────────────────────────────────────────────────
-- logo (tournament logos) - may already exist, ensure public + limits
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'logo', 'logo', true,
    5242880,  -- 5MB
    ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif'];

-- tournament-ic (player IC/passport photos) - may already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'tournament-ic', 'tournament-ic', true,
    8388608,  -- 8MB
    ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 8388608;

-- tournament-banners (full-width hero banner images) - NEW
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'tournament-banners', 'tournament-banners', true,
    20971520, -- 20MB (banners are large)
    ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- event-assets (organizer logos, sponsor logos, branding assets) - NEW
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'event-assets', 'event-assets', true,
    5242880,  -- 5MB
    ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- user-avatars (staff/user profile photos) - NEW
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'user-avatars', 'user-avatars', true,
    3145728,  -- 3MB
    ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;


-- ── 2. RLS POLICIES ──────────────────────────────────────────────────────────
-- Template: Public READ, Authenticated WRITE for all asset buckets

-- ─────── logo bucket ──────────────────────────────────────────────
DO $$ BEGIN
    CREATE POLICY "logo_public_read" ON storage.objects
        FOR SELECT USING (bucket_id = 'logo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "logo_auth_insert" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'logo' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "logo_auth_update" ON storage.objects
        FOR UPDATE USING (bucket_id = 'logo' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "logo_auth_delete" ON storage.objects
        FOR DELETE USING (bucket_id = 'logo' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────── tournament-ic bucket ─────────────────────────────────────
DO $$ BEGIN
    CREATE POLICY "ic_public_read" ON storage.objects
        FOR SELECT USING (bucket_id = 'tournament-ic');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "ic_anon_insert" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'tournament-ic');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "ic_auth_delete" ON storage.objects
        FOR DELETE USING (bucket_id = 'tournament-ic' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────── tournament-banners bucket ────────────────────────────────
DO $$ BEGIN
    CREATE POLICY "banners_public_read" ON storage.objects
        FOR SELECT USING (bucket_id = 'tournament-banners');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "banners_auth_insert" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'tournament-banners' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "banners_auth_update" ON storage.objects
        FOR UPDATE USING (bucket_id = 'tournament-banners' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "banners_auth_delete" ON storage.objects
        FOR DELETE USING (bucket_id = 'tournament-banners' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────── event-assets bucket ──────────────────────────────────────
DO $$ BEGIN
    CREATE POLICY "assets_public_read" ON storage.objects
        FOR SELECT USING (bucket_id = 'event-assets');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "assets_auth_insert" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'event-assets' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "assets_auth_update" ON storage.objects
        FOR UPDATE USING (bucket_id = 'event-assets' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "assets_auth_delete" ON storage.objects
        FOR DELETE USING (bucket_id = 'event-assets' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────── user-avatars bucket ──────────────────────────────────────
DO $$ BEGIN
    CREATE POLICY "avatars_public_read" ON storage.objects
        FOR SELECT USING (bucket_id = 'user-avatars');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "avatars_auth_insert" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'user-avatars' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "avatars_auth_update" ON storage.objects
        FOR UPDATE USING (bucket_id = 'user-avatars' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "avatars_auth_delete" ON storage.objects
        FOR DELETE USING (bucket_id = 'user-avatars' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── 3. VERIFY ────────────────────────────────────────────────────────────────
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id IN ('logo','tournament-ic','tournament-banners','event-assets','user-avatars')
ORDER BY id;
