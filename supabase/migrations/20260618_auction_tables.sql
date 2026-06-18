-- Migration: Create Auction Items table
-- Purpose: Support the new real-time Auction feature

CREATE TABLE IF NOT EXISTS auction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    starting_price NUMERIC(10, 2) DEFAULT 0.00,
    current_price NUMERIC(10, 2) DEFAULT 0.00,
    minimum_increment NUMERIC(10, 2) DEFAULT 100.00,
    status TEXT DEFAULT 'pending', -- 'pending', 'active', 'sold', 'passed'
    winner_name TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and grant full access for demo/internal purposes
ALTER TABLE public.auction_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for auction_items" ON public.auction_items FOR ALL USING (true) WITH CHECK (true);

-- Note: We will use the existing `tool_states` table for real-time tracking
-- of the 'auction' tool to keep things centralized.
