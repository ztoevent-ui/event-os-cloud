-- BPO Registrations Table
CREATE TABLE IF NOT EXISTS bpo_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id TEXT UNIQUE NOT NULL, -- e.g., 'TEAM-001'
    p1_name TEXT NOT NULL,
    p1_ic_no TEXT,
    p1_hp TEXT,
    p1_email TEXT,
    p1_profile_url TEXT, -- Link to uploaded photo
    
    p2_name TEXT NOT NULL,
    p2_ic_no TEXT,
    p2_hp TEXT,
    p2_email TEXT,
    p2_profile_url TEXT, -- Link to uploaded photo
    
    group_name TEXT, -- e.g., 'Men''s Open', 'Mixed'
    dupr_rating DECIMAL(4, 2) DEFAULT 0.00,
    payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed'
    
    data JSONB DEFAULT '{}', -- Extra flexible fields
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common filters
CREATE INDEX IF NOT EXISTS idx_bpo_group ON bpo_registrations(group_name);
CREATE INDEX IF NOT EXISTS idx_bpo_payment ON bpo_registrations(payment_status);

-- Enable RLS
ALTER TABLE bpo_registrations ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified: allow select for now, adjust as needed)
-- In a real app, only admins should see this.
CREATE POLICY "Admin full access bpo_registrations" ON bpo_registrations
    FOR ALL USING (true); -- Placeholder: adjust to role-based if Supabase Auth is fully used.

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE bpo_registrations;
