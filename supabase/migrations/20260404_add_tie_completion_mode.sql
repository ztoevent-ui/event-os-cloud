-- =====================================================
-- MIGRATION: Add Completion Mode to Tie Templates
-- Experience Mode (FULL) vs Competitive Mode (EARLY)
-- =====================================================

ALTER TABLE public.arena_tie_templates 
    ADD COLUMN IF NOT EXISTS completion_mode TEXT NOT NULL DEFAULT 'EARLY'; -- 'EARLY' (Best of X) | 'FULL' (Play All X)

COMMENT ON COLUMN public.arena_tie_templates.completion_mode IS 'EARLY: Ends Tie as soon as wins_required reached. FULL: Requires all matches to be played.';
