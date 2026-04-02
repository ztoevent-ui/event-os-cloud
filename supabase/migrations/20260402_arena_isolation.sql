-- 1. Storage Buckets (Media, Logs)
insert into storage.buckets (id, name, public) 
values ('media', 'media', true) 
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('logs', 'logs', false) 
on conflict (id) do nothing;

-- Ensure public access policy for media bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'media' );

-- 2. Schema Multi-Tournament Isolation Logic
-- Assuming tool_states, projects, or arena_tournaments etc.
-- Check if arena_tournaments exists, if so alter, else create.
CREATE TABLE IF NOT EXISTS public.arena_tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    sport_type TEXT NOT NULL,
    event_id_slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Judging Room System tables
CREATE TABLE IF NOT EXISTS public.judging_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id TEXT NOT NULL,
    participant_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Master Console Dispatch & Early Stop
CREATE TABLE IF NOT EXISTS public.match_dispatch (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id TEXT NOT NULL,
    match_id TEXT NOT NULL,
    dispatch_status TEXT DEFAULT 'suggested', -- 'suggested', 'dispatched'
    team_a_score INT DEFAULT 0,
    team_b_score INT DEFAULT 0,
    best_of INT DEFAULT 5,
    early_stop_triggered BOOLEAN DEFAULT FALSE,
    winner TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
