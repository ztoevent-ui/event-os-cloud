CREATE TABLE IF NOT EXISTS public.prompter_scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('lyric', 'speech')),
    content JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.prompter_state (
    id INT PRIMARY KEY CHECK (id = 1),
    current_script_id UUID REFERENCES public.prompter_scripts(id) ON DELETE SET NULL,
    mode TEXT NOT NULL CHECK (mode IN ('lyric', 'speech')),
    current_index INT NOT NULL DEFAULT 0,
    scroll_speed FLOAT NOT NULL DEFAULT 1.0,
    theme TEXT NOT NULL DEFAULT 'dark',
    is_playing BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Initialize the single state row
INSERT INTO public.prompter_state (id, mode) VALUES (1, 'lyric') ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.prompter_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompter_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to prompter_scripts" ON public.prompter_scripts FOR ALL USING (true);
CREATE POLICY "Allow all access to prompter_state" ON public.prompter_state FOR ALL USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.prompter_state;
