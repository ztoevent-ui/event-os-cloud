-- 1. Create packing_items table
CREATE TABLE IF NOT EXISTS packing_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    category TEXT DEFAULT 'General', -- e.g., Audio, Lighting, Tools, Cables, Misc
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending', -- 'pending', 'packed', 'returned'
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Realtime if using subscriptions (Optional)
-- ALTER PUBLICATION supabase_realtime ADD TABLE packing_items;
