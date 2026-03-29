-- ZTO Event OS: Registration Form Configuration Table
-- This stores the customizable form branding, sponsors, organizers, and field configs

CREATE TABLE IF NOT EXISTS public.registration_config (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_slug text UNIQUE NOT NULL,  -- e.g. 'bpo-2026'
    event_name text NOT NULL,
    event_subtitle text,
    
    -- Branding
    logo_url text,
    background_url text,
    primary_color text DEFAULT '#f59e0b',
    
    -- Organizations
    organizers jsonb DEFAULT '[]',      -- [{name, logo_url}]
    co_organizers jsonb DEFAULT '[]',   -- [{name, logo_url}]
    sponsors jsonb DEFAULT '[]',        -- [{name, logo_url, tier: "gold"|"silver"|"bronze"}]
    
    -- Form field toggles (which fields to show)
    fields_config jsonb DEFAULT '{
        "team_name": true,
        "average_dupr": true,
        "ic_number": true,
        "phone": true,
        "dupr_id": true,
        "captain_email": true,
        "medical_history": true,
        "city_state": true,
        "emergency_contact": true
    }',
    
    -- Terms & Conditions (editable rich text)
    terms_and_conditions text DEFAULT 'Terms & Conditions apply.',
    
    -- Payment
    payment_enabled boolean DEFAULT false,
    payment_gateway text,  -- 'stripe' | 'billplz' | 'toyyibpay' | null
    payment_amount numeric(10,2),
    payment_currency text DEFAULT 'MYR',
    
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.registration_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Registration config is public" ON public.registration_config;
CREATE POLICY "Registration config is public" ON public.registration_config
    FOR ALL USING (true) WITH CHECK (true);

-- Seed the BPO 2026 config
INSERT INTO public.registration_config (event_slug, event_name, event_subtitle, primary_color, terms_and_conditions)
VALUES (
    'bpo-2026',
    'BPO 2026',
    'Borneo Pickleball Open — Official Team Registration',
    '#f59e0b',
    '1. By registering, both players acknowledge that Pickleball is a physical sport and accept full responsibility for any injuries sustained during the tournament.
2. Players must present a valid IC/Passport for identity verification during check-in.
3. All DUPR IDs provided must be valid and verifiable. Falsified DUPR ratings will result in immediate disqualification.
4. The organizer reserves the right to change the tournament schedule, format, or rules at any time without prior notice.
5. Registration fees are non-refundable once payment is confirmed, unless the tournament is cancelled by the organizer.
6. Players consent to the use of their name, likeness, and photographs for promotional purposes related to BPO 2026.
7. The organizer is not liable for any loss of personal belongings during the tournament.
8. All players must adhere to the official BPO Code of Conduct. Unsportsmanlike behavior will result in penalties or disqualification.
9. Medical information provided will be kept confidential and used solely for emergency purposes during the event.
10. By submitting this form, both the Captain and Partner confirm that all information provided is accurate and complete.'
) ON CONFLICT (event_slug) DO NOTHING;
