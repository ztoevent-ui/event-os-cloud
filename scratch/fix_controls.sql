CREATE TABLE IF NOT EXISTS public.arena_live_controls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES public.arena_tournaments(id) ON DELETE CASCADE,
    screen_id TEXT NOT NULL,
    command_type TEXT NOT NULL,
    preset_name TEXT,
    payload JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID
);

ALTER TABLE public.arena_live_controls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for arena_live_controls" ON public.arena_live_controls;
CREATE POLICY "Enable all access for arena_live_controls" ON public.arena_live_controls FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.arena_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for arena_matches" ON public.arena_matches;
CREATE POLICY "Enable all access for arena_matches" ON public.arena_matches FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime (might fail if already added, but that's okay, we can ignore the error)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'arena_live_controls'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.arena_live_controls;
  END IF;
END $$;
