-- ZTO Event OS: BPO 2026 Team Registration Schema
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.bpo_registrations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    team_name text NOT NULL,
    average_dupr numeric(4,2) DEFAULT 0,

    -- Captain
    captain_name text NOT NULL,
    captain_ic text NOT NULL,
    captain_phone text NOT NULL,
    captain_dupr_id text,
    captain_email text,
    captain_medical text[] DEFAULT '{}',
    captain_city text,
    captain_state text,
    captain_emergency_name text,
    captain_emergency_phone text,
    captain_emergency_relationship text,

    -- Partner
    partner_name text NOT NULL,
    partner_ic text NOT NULL,
    partner_phone text NOT NULL,
    partner_dupr_id text,
    partner_medical text[] DEFAULT '{}',
    partner_city text,
    partner_state text,
    partner_emergency_name text,
    partner_emergency_phone text,
    partner_emergency_relationship text,

    -- Status
    status text DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'paid', 'confirmed', 'rejected')),
    payment_reference text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.bpo_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "BPO registrations are public" ON public.bpo_registrations;
CREATE POLICY "BPO registrations are public" ON public.bpo_registrations
    FOR ALL USING (true) WITH CHECK (true);
