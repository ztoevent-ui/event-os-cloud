-- ============================================================
-- Migration: Arena Screen Config
-- Created: 2026-05-06
-- Purpose: Adds JSONB column to arena_tournaments to persist
--          dynamic LED screen matrix configurations (W/H, counts).
-- ============================================================

ALTER TABLE public.arena_tournaments 
ADD COLUMN IF NOT EXISTS screen_config JSONB DEFAULT '[]';

COMMENT ON COLUMN public.arena_tournaments.screen_config IS
  'JSON array of screen configs. e.g. [{ "id": 1, "w": 4, "h": 3, "label": "S1" }]';
