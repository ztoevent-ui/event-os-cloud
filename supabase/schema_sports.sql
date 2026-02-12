-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tournaments Table
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'badminton', -- 'badminton', 'pickleball', etc.
    status TEXT DEFAULT 'setup', -- 'setup', 'active', 'completed'
    config JSONB DEFAULT '{}', -- Rules configuration (points to win, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Players Table
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    avatar_url TEXT, -- URL to uploaded image
    group_name TEXT, -- 'A', 'B', etc. for group stage
    stats JSONB DEFAULT '{"wins": 0, "losses": 0, "points_diff": 0, "sets_diff": 0, "played": 0}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Matches Table
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    player1_id UUID REFERENCES players(id) ON DELETE SET NULL,
    player2_id UUID REFERENCES players(id) ON DELETE SET NULL,
    round_name TEXT DEFAULT 'group', -- 'group', 'r16', 'qf', 'sf', 'final'
    court_id TEXT, -- 'Court 1', 'Center Court'
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'ongoing', 'completed'
    
    -- Scoring State
    current_score_p1 INTEGER DEFAULT 0,
    current_score_p2 INTEGER DEFAULT 0,
    sets_p1 INTEGER DEFAULT 0,
    sets_p2 INTEGER DEFAULT 0,
    server_side INTEGER DEFAULT 0, -- 0 for left, 1 for right (or specific rules)
    serving_player_id UUID,
    
    match_history JSONB DEFAULT '[]', -- Log of points for undo/replay
    winner_id UUID REFERENCES players(id),
    
    next_match_id UUID, -- For bracket progression
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Sponsor Ads Table
CREATE TABLE IF NOT EXISTS sponsor_ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'image', -- 'image', 'video'
    url TEXT NOT NULL,
    duration INTEGER DEFAULT 10, -- Display duration in seconds
    is_active BOOLEAN DEFAULT TRUE,
    display_location TEXT DEFAULT 'sidebar', -- 'sidebar', 'fullscreen', 'banner'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Realtime Subscription
-- Enable Realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE tournaments, players, matches, sponsor_ads;
