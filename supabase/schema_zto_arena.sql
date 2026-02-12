-- ZTO Arena Database Schema

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players Table
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    nickname TEXT,
    avatar_url TEXT, -- For storing avatar image URL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournaments Table
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    sport_type TEXT NOT NULL CHECK (sport_type IN ('badminton', 'pickleball')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
    config JSONB DEFAULT '{}', -- Store specific config like points needed, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches Table
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    team_a_ids UUID[] NOT NULL, -- Array of player IDs for Team A
    team_b_ids UUID[] NOT NULL, -- Array of player IDs for Team B
    score_a INT DEFAULT 0,
    score_b INT DEFAULT 0,
    current_server_side TEXT CHECK (current_server_side IN ('a', 'b')), -- Who is serving
    server_idx INT DEFAULT 0, -- For Pickleball (0 or 1 for doubles)
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed')),
    winner_team TEXT CHECK (winner_team IN ('a', 'b')),
    court_number INT,
    match_type TEXT DEFAULT 'group' CHECK (match_type IN ('group', 'knockout')),
    next_match_id UUID, -- For bracket progression
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sponsor Ads Table
CREATE TABLE IF NOT EXISTS sponsor_ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    media_url TEXT NOT NULL, -- URL to image or .mp4 video
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    display_duration_seconds INT DEFAULT 10,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
