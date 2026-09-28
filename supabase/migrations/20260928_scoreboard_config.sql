-- Add scoreboard_config table for event-level settings (title, subtitle, etc.)
CREATE TABLE IF NOT EXISTS scoreboard_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default config
INSERT INTO scoreboard_config (key, value) VALUES
    ('event_title',    'Family Day 2026'),
    ('event_subtitle', 'Live Scoreboard'),
    ('organizer',      'Your Company')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE scoreboard_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read config"  ON scoreboard_config FOR SELECT USING (true);
CREATE POLICY "Public Write config" ON scoreboard_config FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for teams (so name edits push to broadcast immediately)
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE scoreboard_config;
