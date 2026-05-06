-- ============================================================
-- Migration: Arena Live Controls (Showdown Mode State Sync)
-- Created: 2026-05-06
-- Purpose: Single-row-per-tournament state table that drives
--          the /arena/[eventId]/showdown-live LED display page
--          via Supabase Realtime postgres_changes.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.arena_live_controls (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id    text NOT NULL UNIQUE,   -- maps to arena_tournaments.id (UUID slug)
  command          text NOT NULL DEFAULT 'RESET',
                   -- values: ACTIVATE_LEFT | ACTIVATE_RIGHT | FIRE_VS | RESET
  player_left_url  text,
  player_right_url text,
  background_video_url text,
  preset_name      text,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS arena_live_controls_tournament_idx
  ON public.arena_live_controls (tournament_id);

-- Enable RLS
ALTER TABLE public.arena_live_controls ENABLE ROW LEVEL SECURITY;

-- Public read (LED screens are public displays)
CREATE POLICY "arena_live_controls_read" ON public.arena_live_controls
  FOR SELECT USING (true);

-- Authenticated write (only admins can fire commands)
CREATE POLICY "arena_live_controls_write" ON public.arena_live_controls
  FOR ALL USING (auth.role() = 'authenticated');

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.arena_live_controls;

COMMENT ON TABLE public.arena_live_controls IS
  'Single-row-per-tournament live control state for Showdown Mode. Updated by Master Console, read by showdown-live LED screen.';
