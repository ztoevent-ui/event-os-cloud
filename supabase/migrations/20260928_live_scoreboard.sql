CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color_hex TEXT NOT NULL,
    logo_url TEXT
);

CREATE TABLE IF NOT EXISTS event_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS game_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    category_id UUID REFERENCES event_categories(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable realtime
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE game_scores;

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public Read teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public Read categories" ON event_categories FOR SELECT USING (true);
CREATE POLICY "Public Read scores" ON game_scores FOR SELECT USING (true);

CREATE POLICY "Public All teams" ON teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All categories" ON event_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All scores" ON game_scores FOR ALL USING (true) WITH CHECK (true);
