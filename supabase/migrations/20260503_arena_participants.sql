CREATE TABLE IF NOT EXISTS public.arena_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES public.arena_tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'checked_in'
    check_in_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.arena_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "arena_participants_read" ON public.arena_participants FOR SELECT USING (true);
CREATE POLICY "arena_participants_write" ON public.arena_participants FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_arena_participants_tournament ON public.arena_participants(tournament_id);
