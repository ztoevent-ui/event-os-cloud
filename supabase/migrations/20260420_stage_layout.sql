-- =====================================================
-- MIGRATION: Stage Layout + Project Memoirs
-- Run in: Supabase SQL Editor
-- Date: 2026-04-20
-- =====================================================

-- 1. Stage Layouts — stores full 3D scene per project
CREATE TABLE IF NOT EXISTS stage_layouts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    scene_data jsonb DEFAULT '{}',
    equipment_items jsonb DEFAULT '[]',
    venue_bounds jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(project_id)
);

ALTER TABLE stage_layouts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "stage_layouts_open_select" ON stage_layouts FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "stage_layouts_open_insert" ON stage_layouts FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "stage_layouts_open_update" ON stage_layouts FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "stage_layouts_open_delete" ON stage_layouts FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Project Memoirs — screenshot archive
CREATE TABLE IF NOT EXISTS project_memoirs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    url text NOT NULL,
    caption text DEFAULT 'Stage Layout Capture',
    source text DEFAULT 'stage_layout',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE project_memoirs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "memoirs_open_select" ON project_memoirs FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "memoirs_open_insert" ON project_memoirs FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "memoirs_open_delete" ON project_memoirs FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Verify
SELECT tablename FROM pg_tables WHERE tablename IN ('stage_layouts', 'project_memoirs');
