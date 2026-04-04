-- =====================================================
-- MIGRATION: Tournament Architect Full Schema
-- Run in: Supabase SQL Editor
-- Date: 2026-04-04
-- =====================================================

-- Enable UUID extension (idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. ROUND-SPECIFIC SCORING RULES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.arena_round_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES public.arena_tournaments(id) ON DELETE CASCADE,
    round_type TEXT NOT NULL, -- 'GROUP', 'KNOCKOUT', 'SEMIFINALS', 'FINALS'
    scoring_type TEXT NOT NULL DEFAULT 'RALLY', -- 'RALLY' | 'SIDE_OUT'
    max_points INT NOT NULL DEFAULT 21,
    win_by INT NOT NULL DEFAULT 2,
    sets_to_win INT NOT NULL DEFAULT 1, -- 1 = single set, 2 = best of 3
    max_sets INT NOT NULL DEFAULT 1, -- total sets in a match
    freeze_at INT, -- if set, freeze rule applies (e.g. 20-20 goes to 23 cap)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, round_type)
);

-- =====================================================
-- 2. TIE TEMPLATES (Thomas Cup style)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.arena_tie_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES public.arena_tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Default Tie',
    wins_required INT NOT NULL DEFAULT 3, -- e.g. best of 5: need 3 wins
    total_matches INT NOT NULL DEFAULT 5, -- total individual matches per Tie
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.arena_tie_template_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES public.arena_tie_templates(id) ON DELETE CASCADE,
    sequence_order INT NOT NULL, -- 1, 2, 3, 4, 5
    event_type TEXT NOT NULL, -- 'MD1', 'MD2', 'WD', 'MXD', 'VETERANS', 'SINGLES', 'DOUBLES'
    event_label TEXT NOT NULL, -- display name e.g. "Men's Doubles 1"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. ARENA MATCHES (persistent, persistent scoring)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.arena_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES public.arena_tournaments(id) ON DELETE CASCADE,
    bracket_match_id TEXT, -- e.g. 'R1-M3' from bracket tree
    tie_id UUID REFERENCES public.arena_tie_templates(id),
    event_type TEXT, -- 'MD1', 'WD', etc. (if Tie-based)
    round_type TEXT NOT NULL DEFAULT 'KNOCKOUT', -- 'GROUP', 'KNOCKOUT', 'SEMIFINALS', 'FINALS'
    group_id TEXT, -- e.g. 'A', 'B', 'C' for group stage
    court_number INT,
    
    team_a_name TEXT NOT NULL DEFAULT 'TBD',
    team_b_name TEXT NOT NULL DEFAULT 'TBD',
    team_a_id UUID,
    team_b_id UUID,
    
    -- Scores stored as JSONB array for multi-set: [{a:11,b:7}, {a:9,b:11}]
    sets_scores JSONB NOT NULL DEFAULT '[]',
    current_set INT NOT NULL DEFAULT 1,
    score_a INT NOT NULL DEFAULT 0, -- current set score
    score_b INT NOT NULL DEFAULT 0, -- current set score
    sets_won_a INT NOT NULL DEFAULT 0,
    sets_won_b INT NOT NULL DEFAULT 0,
    
    server TEXT DEFAULT 'A', -- 'A' | 'B' (for side-out scoring)
    left_team TEXT DEFAULT 'A', -- physical left/right (for side swap tracking)
    
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING' | 'LIVE' | 'SIDE_SWITCH' | 'COMPLETED'
    winner TEXT, -- 'A' | 'B'
    
    -- Bracket tree linkage for auto-progression
    next_match_id UUID REFERENCES public.arena_matches(id),
    next_team_slot TEXT, -- 'A' | 'B' (which slot winner fills in next match)
    
    -- Referee assignment
    referee_name TEXT,
    referee_session TEXT, -- session token for claiming
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for real-time queries
CREATE INDEX IF NOT EXISTS idx_arena_matches_tournament ON public.arena_matches(tournament_id, status);
CREATE INDEX IF NOT EXISTS idx_arena_matches_bracket ON public.arena_matches(tournament_id, bracket_match_id);

-- =====================================================
-- 4. SCORE EVENTS LOG (for offline replay)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.arena_score_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES public.arena_matches(id) ON DELETE CASCADE,
    tournament_id UUID NOT NULL,
    event_type TEXT NOT NULL, -- 'SCORE_A', 'SCORE_B', 'UNDO', 'SIDE_SWITCH', 'MATCH_END'
    payload JSONB DEFAULT '{}',
    referee_session TEXT,
    client_timestamp TIMESTAMPTZ, -- timestamp from client (for offline ordering)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. GROUP STANDINGS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.arena_group_standings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES public.arena_tournaments(id) ON DELETE CASCADE,
    group_id TEXT NOT NULL, -- 'A', 'B', 'C'
    team_name TEXT NOT NULL,
    team_id UUID,
    played INT DEFAULT 0,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    points_for INT DEFAULT 0, -- total points scored
    points_against INT DEFAULT 0, -- total points surrendered
    point_diff INT GENERATED ALWAYS AS (points_for - points_against) STORED,
    rank INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, group_id, team_name)
);

-- =====================================================
-- 6. ALTER arena_tournaments — add new columns
-- =====================================================
ALTER TABLE public.arena_tournaments 
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'SETUP', -- 'SETUP', 'REGISTRATION', 'GROUP_STAGE', 'KNOCKOUT', 'COMPLETED'
    ADD COLUMN IF NOT EXISTS current_round TEXT DEFAULT 'GROUP',
    ADD COLUMN IF NOT EXISTS bracket_json JSONB DEFAULT '{}', -- persisted bracket tree
    ADD COLUMN IF NOT EXISTS format TEXT DEFAULT 'SINGLES'; -- 'SINGLES', 'TIE_TEAM'

-- =====================================================
-- 7. ENABLE ROW LEVEL SECURITY & POLICIES
-- =====================================================

-- arena_matches: public read, authenticated write
ALTER TABLE public.arena_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "arena_matches_read" ON public.arena_matches FOR SELECT USING (true);
CREATE POLICY "arena_matches_write" ON public.arena_matches FOR ALL USING (true);

-- arena_score_events: public insert (referees), authenticated read
ALTER TABLE public.arena_score_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "score_events_insert" ON public.arena_score_events FOR INSERT WITH CHECK (true);
CREATE POLICY "score_events_read" ON public.arena_score_events FOR SELECT USING (true);

-- arena_round_rules: public read
ALTER TABLE public.arena_round_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "round_rules_read" ON public.arena_round_rules FOR SELECT USING (true);
CREATE POLICY "round_rules_write" ON public.arena_round_rules FOR ALL USING (true);

-- arena_tie_templates: public read
ALTER TABLE public.arena_tie_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tie_templates_read" ON public.arena_tie_templates FOR SELECT USING (true);
CREATE POLICY "tie_templates_write" ON public.arena_tie_templates FOR ALL USING (true);

ALTER TABLE public.arena_tie_template_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tie_events_read" ON public.arena_tie_template_events FOR SELECT USING (true);
CREATE POLICY "tie_events_write" ON public.arena_tie_template_events FOR ALL USING (true);

ALTER TABLE public.arena_group_standings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "standings_read" ON public.arena_group_standings FOR SELECT USING (true);
CREATE POLICY "standings_write" ON public.arena_group_standings FOR ALL USING (true);

-- =====================================================
-- 8. ENABLE REALTIME on critical tables
-- =====================================================
-- Run these in Supabase Dashboard > Database > Replication to enable Realtime:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.arena_matches;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.arena_group_standings;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.arena_score_events;

-- =====================================================
-- 9. SEED: Default round rules function
-- =====================================================
CREATE OR REPLACE FUNCTION public.seed_default_round_rules(p_tournament_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.arena_round_rules (tournament_id, round_type, scoring_type, max_points, win_by, sets_to_win, max_sets, freeze_at)
    VALUES
        (p_tournament_id, 'GROUP',      'RALLY',    21, 1, 1, 1, NULL),
        (p_tournament_id, 'KNOCKOUT',   'SIDE_OUT', 15, 2, 1, 1, NULL),
        (p_tournament_id, 'SEMIFINALS', 'SIDE_OUT', 15, 2, 1, 1, NULL),
        (p_tournament_id, 'FINALS',     'SIDE_OUT', 11, 2, 2, 3, NULL)
    ON CONFLICT (tournament_id, round_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. AUTO-UPDATE updated_at trigger
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER arena_matches_updated_at 
    BEFORE UPDATE ON public.arena_matches 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER arena_round_rules_updated_at 
    BEFORE UPDATE ON public.arena_round_rules 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER arena_standings_updated_at 
    BEFORE UPDATE ON public.arena_group_standings 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
