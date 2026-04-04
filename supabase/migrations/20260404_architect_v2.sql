-- =====================================================
-- MIGRATION: Tournament Architect v2
-- - completion_mode moves to arena_round_rules (per-stage)
-- - has_third_place added to arena_tournaments
-- - linked_project_id added to arena_tournaments
-- =====================================================

-- 1. Add completion_mode to round rules (per-stage control)
ALTER TABLE public.arena_round_rules
    ADD COLUMN IF NOT EXISTS completion_mode TEXT NOT NULL DEFAULT 'EARLY'; -- 'EARLY' | 'FULL'

COMMENT ON COLUMN public.arena_round_rules.completion_mode IS
    'EARLY: Ends Tie when wins_required is reached. FULL: All matches must be played.';

-- 2. Drop completion_mode from tie templates (moved to round_rules)
ALTER TABLE public.arena_tie_templates
    DROP COLUMN IF EXISTS completion_mode;

-- 3. Add optional 3rd/4th place playoff flag on tournaments
ALTER TABLE public.arena_tournaments
    ADD COLUMN IF NOT EXISTS has_third_place BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.arena_tournaments.has_third_place IS
    'When true, a 3rd/4th place (Bronze) match is generated in the bracket.';

-- 4. Link to registration project
ALTER TABLE public.arena_tournaments
    ADD COLUMN IF NOT EXISTS linked_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.arena_tournaments.linked_project_id IS
    'Optional link to a Project whose registrations auto-populate tournament teams.';

-- 5. Update seed function to include THIRD_PLACE defaults
CREATE OR REPLACE FUNCTION public.seed_default_round_rules(p_tournament_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.arena_round_rules (tournament_id, round_type, scoring_type, max_points, win_by, sets_to_win, max_sets, freeze_at, completion_mode)
    VALUES
        (p_tournament_id, 'GROUP',       'RALLY',    21, 1, 1, 1, NULL, 'FULL'),
        (p_tournament_id, 'KNOCKOUT',    'SIDE_OUT', 15, 2, 1, 1, NULL, 'FULL'),
        (p_tournament_id, 'SEMIFINALS',  'SIDE_OUT', 15, 2, 1, 1, NULL, 'EARLY'),
        (p_tournament_id, 'THIRD_PLACE', 'SIDE_OUT', 11, 2, 2, 3, NULL, 'EARLY'),
        (p_tournament_id, 'FINALS',      'SIDE_OUT', 11, 2, 2, 3, NULL, 'EARLY')
    ON CONFLICT (tournament_id, round_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql;
