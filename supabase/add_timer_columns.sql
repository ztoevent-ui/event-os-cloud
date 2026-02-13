-- Add Timer and Period tracking for timed sports (Basketball, Football)
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS timer_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS timer_last_updated TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS current_period INTEGER DEFAULT 1, -- Quarter 1, Half 1, etc.
ADD COLUMN IF NOT EXISTS possession TEXT DEFAULT 'home'; -- 'home' | 'away'

-- Add Fouls/Timeouts if we want deeper stats later, but JSONB is fine for now
-- ALTER TABLE matches ADD COLUMN stats_p1 JSONB DEFAULT '{}'; 
-- ALTER TABLE matches ADD COLUMN stats_p2 JSONB DEFAULT '{}'; 
