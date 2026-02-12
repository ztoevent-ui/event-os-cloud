
-- TICKET SYSTEM SCHEMA EXTENSION

-- 1. TICKETS (Types/Categories)
CREATE TABLE IF NOT EXISTS tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID, -- Will link to projects table if desired, or null for general
    name TEXT NOT NULL, -- e.g., "Standard", "VIP"
    price DECIMAL(10, 2) DEFAULT 0.00,
    quantity INTEGER DEFAULT 100,
    sold INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ATTENDEES (People)
CREATE TABLE IF NOT EXISTS attendees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID, -- Optional link
    ticket_id UUID REFERENCES tickets(id),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    ticket_code TEXT UNIQUE NOT NULL, -- "TICKET-123456"
    checked_in BOOLEAN DEFAULT FALSE,
    checked_in_at TIMESTAMPTZ,
    won_prize BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES (Assuming basic anon/authenticated roles)
COMMENT ON TABLE tickets IS 'Types of tickets available for events';
COMMENT ON TABLE attendees IS 'Registered attendees and their check-in status';

-- Allow public read/write for demo purposes (Ideally restrain write)
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can register" ON attendees FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view (for check-in)" ON attendees FOR SELECT USING (true);
CREATE POLICY "Admin can update (check-in/win)" ON attendees FOR UPDATE USING (true); -- Simplification for demo

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view tickets" ON tickets FOR SELECT USING (true);
