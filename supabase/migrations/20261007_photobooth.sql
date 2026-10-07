-- =====================================================
-- MIGRATION: AI Photobooth Engine
-- Tables : photobooth_templates, photobooth_records
-- Bucket : photobooth-finals (public)
-- Run in : Supabase SQL Editor
-- Date   : 2026-10-07
-- =====================================================

-- ── 1. TEMPLATES (one per event / project) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.photobooth_templates (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id     UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
    bg_image_url TEXT,
    logo_url     TEXT,
    event_name   TEXT NOT NULL DEFAULT '',
    -- frame_style keys (all optional, defaults applied client-side):
    --   orientation      'portrait' | 'landscape'        (4x6 @300dpi → 1200x1800 / 1800x1200)
    --   border_width     number  (px at output resolution)
    --   border_color     css color
    --   overlay_url      PNG frame drawn on top of everything
    --   logo_position    'top-right' | 'top-left'
    --   logo_scale       0..1   (fraction of canvas width)
    --   text_color       css color
    --   subtitle         string (e.g. date / hashtag)
    --   bottom_scrim     boolean (dark gradient behind the title)
    --   subject_scale    number (zoom applied to the cut-out subject)
    --   bg_removal       'auto' | 'removebg' | 'local' | 'off'
    --   countdown        number (seconds)
    frame_style  JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. RECORDS (every finished photo) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.photobooth_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    final_image_url TEXT NOT NULL,
    storage_path    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_photobooth_records_event_created
    ON public.photobooth_records (event_id, created_at DESC);

-- ── 3. RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE public.photobooth_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photobooth_records   ENABLE ROW LEVEL SECURITY;

-- Templates: kiosk (anon) can read, staff (authenticated) can write
DO $$ BEGIN
    CREATE POLICY "pb_templates_public_read" ON public.photobooth_templates
        FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "pb_templates_auth_write" ON public.photobooth_templates
        FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Records: kiosk (anon) can insert, only staff can list / delete
DO $$ BEGIN
    CREATE POLICY "pb_records_public_insert" ON public.photobooth_records
        FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "pb_records_auth_select" ON public.photobooth_records
        FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "pb_records_auth_delete" ON public.photobooth_records
        FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Realtime: admin gallery updates live + template edits push to running kiosks
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.photobooth_records;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.photobooth_templates;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 4. STORAGE BUCKET ────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'photobooth-finals', 'photobooth-finals', true,
    10485760, -- 10MB
    ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp'];

DO $$ BEGIN
    CREATE POLICY "pb_finals_public_read" ON storage.objects
        FOR SELECT USING (bucket_id = 'photobooth-finals');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Kiosk devices are not necessarily logged in → allow anon upload (insert only)
DO $$ BEGIN
    CREATE POLICY "pb_finals_anon_insert" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'photobooth-finals');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "pb_finals_auth_delete" ON storage.objects
        FOR DELETE USING (bucket_id = 'photobooth-finals' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
