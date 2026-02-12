
-- PROFESSIONAL TICKETING SYSTEM SCHEMA --

-- 1. TICKETS (Types/Tiers) - Renaming/Refining from previous if needed, but 'tickets' table is good.
-- Ensure we have project_id linkage.
CREATE TABLE IF NOT EXISTS tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,          -- e.g. "Early Bird", "VIP"
    description TEXT,            -- e.g. "Includes backstage access"
    price DECIMAL(10, 2) DEFAULT 0.00,
    quantity_total INTEGER DEFAULT 100, -- Total available
    quantity_sold INTEGER DEFAULT 0,    -- sold count
    status TEXT DEFAULT 'active', -- active, sold_out, hidden
    sales_start_at TIMESTAMPTZ,
    sales_end_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ORDERS (Transactions)
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    buyer_name TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    buyer_phone TEXT,
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'completed', -- pending, completed, refunded, failed
    payment_method TEXT DEFAULT 'stripe', -- stripe, manual, free
    transaction_id TEXT, -- External Project Gateway ID
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ATTENDEES (Individual Ticket Holders) - updating linkage
-- We drop the old one if it conflicts or alter it. For safety in this environment, I'll create 'ticket_holders' to avoid conflict or alter 'attendees'.
-- Let's stick to 'attendees' but ensure columns exist.

CREATE TABLE IF NOT EXISTS attendees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE, -- Link to order
    ticket_id UUID REFERENCES tickets(id),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    ticket_code TEXT UNIQUE NOT NULL, -- QR content
    checked_in BOOLEAN DEFAULT FALSE,
    checked_in_at TIMESTAMPTZ,
    data JSONB, -- Flexible field for extra answers (dietary, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active tickets" ON tickets FOR SELECT USING (status = 'active');
CREATE POLICY "Admin full access tickets" ON tickets FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own orders" ON orders FOR SELECT USING (buyer_email = current_user); -- Simplification, usually based on user_id

ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public create attendees" ON attendees FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin full access attendees" ON attendees FOR ALL USING (auth.role() = 'authenticated');
