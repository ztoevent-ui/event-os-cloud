-- =============================================================================
-- ztoevent.com — Multi-Event Ticketing System Schema
-- Version: 1.0.0
-- Prefix: zt_ (avoids collision with existing project tables)
-- Run in: Supabase SQL Editor (as postgres / service_role)
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- for gen_random_bytes (QR tokens)

-- =============================================================================
-- ENUM TYPES
-- Wrapped in DO blocks so re-running this script never fails on "already exists"
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE zt_event_status AS ENUM ('draft', 'published', 'on_sale', 'sold_out', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE zt_event_type AS ENUM ('marathon', 'cultural_festival', 'sports_tournament', 'concert', 'conference', 'exhibition', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE zt_order_status AS ENUM ('pending', 'awaiting_payment', 'paid', 'cancelled', 'refunded', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE zt_tier_status AS ENUM ('active', 'paused', 'sold_out', 'hidden');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- TABLE 1: zt_events
-- The master record for every event hosted on ztoevent.com.
-- Each event has a unique slug used as the public-facing URL identifier.
-- =============================================================================

CREATE TABLE IF NOT EXISTS zt_events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug            TEXT NOT NULL UNIQUE,           -- URL-safe identifier, e.g. "bintulu-marathon-2026"
    name            TEXT NOT NULL,                  -- Display name
    type            zt_event_type NOT NULL DEFAULT 'other',
    description     TEXT,
    banner_url      TEXT,                           -- Storage URL for event banner image
    venue_name      TEXT,
    venue_address   TEXT,
    venue_lat       DECIMAL(10, 7),                 -- Geolocation for maps
    venue_lng       DECIMAL(10, 7),
    start_date      TIMESTAMPTZ NOT NULL,
    end_date        TIMESTAMPTZ,
    reg_open_at     TIMESTAMPTZ,                    -- When ticket sales open
    reg_close_at    TIMESTAMPTZ,                    -- When ticket sales close
    status          zt_event_status NOT NULL DEFAULT 'draft',
    max_capacity    INTEGER,                        -- Overall event cap (optional override per tier)
    currency        TEXT NOT NULL DEFAULT 'MYR',    -- ISO 4217 currency code
    organizer_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    settings        JSONB NOT NULL DEFAULT '{}',    -- Flexible: early_bird_rules, waitlist_enabled, etc.
    metadata        JSONB NOT NULL DEFAULT '{}',    -- SEO, social share data, etc.
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast slug lookups (public event pages)
CREATE UNIQUE INDEX IF NOT EXISTS zt_events_slug_idx ON zt_events (slug);
-- Index for listing events by status and date
CREATE INDEX IF NOT EXISTS zt_events_status_date_idx ON zt_events (status, start_date DESC);
-- Full-text search index
CREATE INDEX IF NOT EXISTS zt_events_search_idx ON zt_events USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION zt_update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER zt_events_updated_at
    BEFORE UPDATE ON zt_events
    FOR EACH ROW EXECUTE FUNCTION zt_update_updated_at();

-- =============================================================================
-- TABLE 2: zt_ticket_tiers
-- Defines ticket categories for each event (e.g., Early Bird, Standard, VIP).
-- available_capacity is the ONLY source of truth for stock — decremented atomically
-- by the reserve_ticket_and_create_order RPC function to prevent overselling.
-- =============================================================================

CREATE TABLE IF NOT EXISTS zt_ticket_tiers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id            UUID NOT NULL REFERENCES zt_events(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,                  -- "Early Bird", "Standard", "VIP"
    description         TEXT,
    price               DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_capacity      INTEGER NOT NULL CHECK (total_capacity > 0),
    available_capacity  INTEGER NOT NULL CHECK (available_capacity >= 0),
    max_per_order       INTEGER NOT NULL DEFAULT 4,     -- Max tickets per single order
    status              zt_tier_status NOT NULL DEFAULT 'active',
    sales_start_at      TIMESTAMPTZ,
    sales_end_at        TIMESTAMPTZ,
    sort_order          INTEGER NOT NULL DEFAULT 0,     -- Display ordering within event
    perks               JSONB NOT NULL DEFAULT '[]',    -- Array of perk strings ["Free T-Shirt", "Finisher Medal"]
    form_fields         JSONB NOT NULL DEFAULT '[]',    -- Custom registration fields per tier
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Enforce data integrity: available cannot exceed total
    CONSTRAINT zt_tier_capacity_valid CHECK (available_capacity <= total_capacity)
);

CREATE INDEX IF NOT EXISTS zt_ticket_tiers_event_idx ON zt_ticket_tiers (event_id, sort_order);
CREATE INDEX IF NOT EXISTS zt_ticket_tiers_status_idx ON zt_ticket_tiers (event_id, status);

CREATE TRIGGER zt_ticket_tiers_updated_at
    BEFORE UPDATE ON zt_ticket_tiers
    FOR EACH ROW EXECUTE FUNCTION zt_update_updated_at();

-- =============================================================================
-- TABLE 3: zt_profiles
-- Extends auth.users with attendee/runner-specific metadata.
-- Created automatically via trigger on first sign-up.
-- =============================================================================

CREATE TABLE IF NOT EXISTS zt_profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name       TEXT,
    display_name    TEXT,
    phone           TEXT,
    ic_number       TEXT,                   -- Malaysian IC / Passport
    date_of_birth   DATE,
    gender          TEXT CHECK (gender IN ('male', 'female', 'prefer_not_to_say')),
    nationality     TEXT DEFAULT 'Malaysian',
    address_line1   TEXT,
    address_line2   TEXT,
    city            TEXT,
    state           TEXT,
    postcode        TEXT,
    country         TEXT DEFAULT 'Malaysia',
    tshirt_size     TEXT CHECK (tshirt_size IN ('XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL')),
    blood_type      TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    emergency_name  TEXT,                   -- Emergency contact name
    emergency_phone TEXT,                   -- Emergency contact phone
    avatar_url      TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}',    -- Flexible extra data
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS zt_profiles_phone_idx ON zt_profiles (phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS zt_profiles_ic_idx ON zt_profiles (ic_number) WHERE ic_number IS NOT NULL;

CREATE TRIGGER zt_profiles_updated_at
    BEFORE UPDATE ON zt_profiles
    FOR EACH ROW EXECUTE FUNCTION zt_update_updated_at();

-- Auto-create profile row when a new auth.users record is inserted
CREATE OR REPLACE FUNCTION zt_handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO zt_profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- =============================================================================
-- ⚠️  IMPORTANT: auth.users trigger — Must be set up via Supabase Dashboard
-- =============================================================================
-- Supabase blocks CREATE TRIGGER on auth.users via the SQL Editor.
-- Instead, go to:
--   Supabase Dashboard → Database → Webhooks   (older UI)
--   OR
--   Supabase Dashboard → Database → Functions → "zt_handle_new_user" → Hook it
--
-- The correct way in modern Supabase is via the Dashboard:
--   1. Go to: Authentication → Hooks (or Database → Triggers in the Table Editor)
--   2. Create a new trigger:
--        Table:    auth.users
--        Event:    INSERT
--        Function: zt_handle_new_user
--
-- Alternatively, run this ONE-TIME in Supabase SQL Editor with service_role:
-- (uncomment the block below and run it separately as a superuser query)
-- =============================================================================

/*  RUN THIS BLOCK SEPARATELY as a one-time setup (requires superuser):

    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION zt_handle_new_user();

*/

-- Fallback: If the trigger above can't be created, call this function manually
-- after creating a user, or upsert the profile row in your sign-up Server Action.

-- =============================================================================
-- TABLE 4: zt_orders
-- A purchase transaction. One order = one checkout session.
-- May contain multiple items (via zt_order_items) for multi-ticket purchases.
-- Status machine: pending → awaiting_payment → paid → [cancelled | refunded]
--                 pending → expired (via scheduled cleanup job)
-- =============================================================================

CREATE TABLE IF NOT EXISTS zt_orders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    event_id            UUID NOT NULL REFERENCES zt_events(id) ON DELETE RESTRICT,
    status              zt_order_status NOT NULL DEFAULT 'pending',
    total_amount        DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    currency            TEXT NOT NULL DEFAULT 'MYR',
    payment_provider    TEXT,                       -- 'billplz', 'senangpay', 'stripe', 'free'
    payment_reference   TEXT,                       -- External gateway bill/payment ID
    payment_url         TEXT,                       -- Redirect URL from gateway
    payment_metadata    JSONB NOT NULL DEFAULT '{}',-- Raw gateway response (for audit)
    buyer_name          TEXT NOT NULL,
    buyer_email         TEXT NOT NULL,
    buyer_phone         TEXT,
    expires_at          TIMESTAMPTZ,                -- Null for paid orders; set for pending (15-min hold)
    paid_at             TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,
    notes               TEXT,
    metadata            JSONB NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS zt_orders_user_idx ON zt_orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS zt_orders_event_idx ON zt_orders (event_id, status);
CREATE INDEX IF NOT EXISTS zt_orders_payment_ref_idx ON zt_orders (payment_reference) WHERE payment_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS zt_orders_status_expires_idx ON zt_orders (status, expires_at) WHERE status = 'pending';

CREATE TRIGGER zt_orders_updated_at
    BEFORE UPDATE ON zt_orders
    FOR EACH ROW EXECUTE FUNCTION zt_update_updated_at();

-- =============================================================================
-- TABLE 5: zt_order_items
-- Individual ticket line items within an order.
-- One order can span multiple tiers (e.g., 2× Early Bird + 1× VIP).
-- =============================================================================

CREATE TABLE IF NOT EXISTS zt_order_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL REFERENCES zt_orders(id) ON DELETE CASCADE,
    tier_id         UUID NOT NULL REFERENCES zt_ticket_tiers(id) ON DELETE RESTRICT,
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    unit_price      DECIMAL(10, 2) NOT NULL,        -- Price at time of purchase (snapshot)
    subtotal        DECIMAL(10, 2) NOT NULL,         -- quantity × unit_price
    tier_name       TEXT NOT NULL,                   -- Snapshot of tier name (audit trail)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS zt_order_items_order_idx ON zt_order_items (order_id);
CREATE INDEX IF NOT EXISTS zt_order_items_tier_idx ON zt_order_items (tier_id);

-- =============================================================================
-- TABLE 6: zt_attendees
-- One record per individual ticket (not per order).
-- Generated after payment confirmation. Each has a unique QR code token.
-- Used for on-site check-in scanning.
-- =============================================================================

CREATE TABLE IF NOT EXISTS zt_attendees (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id            UUID NOT NULL REFERENCES zt_orders(id) ON DELETE CASCADE,
    order_item_id       UUID NOT NULL REFERENCES zt_order_items(id) ON DELETE CASCADE,
    tier_id             UUID NOT NULL REFERENCES zt_ticket_tiers(id) ON DELETE RESTRICT,
    event_id            UUID NOT NULL REFERENCES zt_events(id) ON DELETE RESTRICT,
    user_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    attendee_name       TEXT NOT NULL,
    attendee_email      TEXT,
    attendee_phone      TEXT,
    attendee_ic         TEXT,
    ticket_code         TEXT NOT NULL UNIQUE,        -- UUID-based QR token (generated on confirm)
    bib_number          TEXT,                        -- Marathon bib number (assigned post-payment)
    tshirt_size         TEXT,
    custom_answers      JSONB NOT NULL DEFAULT '{}', -- Answers to form_fields from tier
    checked_in          BOOLEAN NOT NULL DEFAULT FALSE,
    checked_in_at       TIMESTAMPTZ,
    checked_in_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS zt_attendees_ticket_code_idx ON zt_attendees (ticket_code);
CREATE INDEX IF NOT EXISTS zt_attendees_order_idx ON zt_attendees (order_id);
CREATE INDEX IF NOT EXISTS zt_attendees_event_idx ON zt_attendees (event_id, checked_in);
CREATE INDEX IF NOT EXISTS zt_attendees_email_idx ON zt_attendees (attendee_email) WHERE attendee_email IS NOT NULL;

CREATE TRIGGER zt_attendees_updated_at
    BEFORE UPDATE ON zt_attendees
    FOR EACH ROW EXECUTE FUNCTION zt_update_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- zt_events: Public read for published events; only service_role can write
ALTER TABLE zt_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zt_events_public_read" ON zt_events
    FOR SELECT USING (status IN ('published', 'on_sale', 'sold_out', 'completed'));

CREATE POLICY "zt_events_organizer_manage" ON zt_events
    FOR ALL USING (organizer_id = auth.uid());

-- zt_ticket_tiers: Public read for active tiers on published events; no direct writes
ALTER TABLE zt_ticket_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zt_tiers_public_read" ON zt_ticket_tiers
    FOR SELECT USING (
        status IN ('active', 'sold_out') AND
        EXISTS (
            SELECT 1 FROM zt_events e
            WHERE e.id = event_id AND e.status IN ('published', 'on_sale', 'sold_out')
        )
    );

-- Organizer can manage tiers for their events
CREATE POLICY "zt_tiers_organizer_manage" ON zt_ticket_tiers
    FOR ALL USING (
        EXISTS (SELECT 1 FROM zt_events e WHERE e.id = event_id AND e.organizer_id = auth.uid())
    );

-- zt_profiles: Users can only read/write their own profile
ALTER TABLE zt_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zt_profiles_own_read" ON zt_profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "zt_profiles_own_update" ON zt_profiles
    FOR UPDATE USING (id = auth.uid());

-- zt_orders: Users can only see and create their own orders
ALTER TABLE zt_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zt_orders_own_read" ON zt_orders
    FOR SELECT USING (user_id = auth.uid());

-- INSERT is done by the service_role RPC (not direct client inserts)
-- This policy allows the RPC to write on behalf of the user
CREATE POLICY "zt_orders_own_insert" ON zt_orders
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- zt_order_items: Accessible through order ownership
ALTER TABLE zt_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zt_order_items_own_read" ON zt_order_items
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM zt_orders o WHERE o.id = order_id AND o.user_id = auth.uid())
    );

-- zt_attendees: Users see their own attendee records; check-in staff see event attendees
ALTER TABLE zt_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zt_attendees_own_read" ON zt_attendees
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "zt_attendees_by_order" ON zt_attendees
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM zt_orders o WHERE o.id = order_id AND o.user_id = auth.uid())
    );

-- =============================================================================
-- HELPER: Expired order cleanup function (call via pg_cron or Supabase scheduled function)
-- =============================================================================

CREATE OR REPLACE FUNCTION zt_expire_pending_orders()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- First, restore capacity for expired orders
    UPDATE zt_ticket_tiers t
    SET available_capacity = available_capacity + item_totals.qty
    FROM (
        SELECT oi.tier_id, SUM(oi.quantity) AS qty
        FROM zt_order_items oi
        JOIN zt_orders o ON o.id = oi.order_id
        WHERE o.status = 'pending'
          AND o.expires_at < NOW()
        GROUP BY oi.tier_id
    ) AS item_totals
    WHERE t.id = item_totals.tier_id;

    -- Then mark orders as expired
    UPDATE zt_orders
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending' AND expires_at < NOW();

    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$;

-- =============================================================================
-- GRANT USAGE (service_role bypasses RLS; anon/authenticated use RLS policies above)
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON zt_events, zt_ticket_tiers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON zt_profiles TO authenticated;
GRANT SELECT, INSERT ON zt_orders TO authenticated;
GRANT SELECT ON zt_order_items TO authenticated;
GRANT SELECT ON zt_attendees TO authenticated;
