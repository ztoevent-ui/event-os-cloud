-- ============================================================
-- Migration: Add PIC and Course to program_items
-- Created: 2026-05-07
-- Purpose: Restores the missing 'PIC' and 'Course' columns 
--          in the tentative program table.
-- ============================================================

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'program_items' AND column_name = 'pic') THEN
        ALTER TABLE public.program_items ADD COLUMN pic TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'program_items' AND column_name = 'course') THEN
        ALTER TABLE public.program_items ADD COLUMN course TEXT DEFAULT '';
    END IF;
END $$;
