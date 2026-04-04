-- =====================================================
-- MIGRATION: arena_individual_events table
-- For non-TIE tournaments (singles/doubles bracket)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.arena_individual_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES public.arena_tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,               -- e.g. "Men's Singles"
    gender TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN','MALE','FEMALE','MIXED'
    type TEXT NOT NULL DEFAULT 'SINGLES', -- 'SINGLES','DOUBLES','MIXED_DOUBLES','TEAM'
    max_entries INT NOT NULL DEFAULT 32,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.arena_individual_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ind_events_read"  ON public.arena_individual_events FOR SELECT USING (true);
CREATE POLICY "ind_events_write" ON public.arena_individual_events FOR ALL    USING (true);

CREATE INDEX IF NOT EXISTS idx_arena_ind_events_tournament ON public.arena_individual_events(tournament_id);
