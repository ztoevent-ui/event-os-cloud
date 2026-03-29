-- ZTO Event OS: Intelligent Ticketing & Verification Schema

-- 1. Create the Tickets Table
DROP TABLE IF EXISTS public.tickets CASCADE;
CREATE TABLE public.tickets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text NOT NULL,
  attendee_name text NOT NULL,
  attendee_company text,
  attendee_role text DEFAULT 'Guest' CHECK (attendee_role IN ('VIP', 'Guest', 'Media', 'Staff', 'Speaker')),
  status text DEFAULT 'issued' CHECK (status IN ('issued', 'checked_in', 'void')),
  scanned_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Public can read tickets (so the scanner app can verify them without complex login flows, or authenticated only if needed. For now, we'll allow anon reads for rapid verification)
CREATE POLICY "Tickets are viewable by anyone"
  ON public.tickets FOR SELECT
  USING (true);

-- 4. Policy: Anyone can update the status to 'checked_in' (The scanner app logic)
-- In a strict production system, this would be locked to 'authenticated' users with a 'staff/admin' role in profiles.
CREATE POLICY "Scanners can check in tickets"
  ON public.tickets FOR UPDATE
  USING (true);

CREATE POLICY "Admins can insert tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (true);

-- 5. Mock Data Generation (For Testing the Workflow)
-- We'll insert a few mock attendees for the 'ZTO_SUMMIT_2026' event
INSERT INTO public.tickets (id, event_id, attendee_name, attendee_company, attendee_role, status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'ZTO_SUMMIT_2026', 'Connie Wong', 'ZTO Operations', 'VIP', 'issued'),
  ('22222222-2222-2222-2222-222222222222', 'ZTO_SUMMIT_2026', 'Tommy Lee', 'Global Partners Corp', 'Speaker', 'issued'),
  ('33333333-3333-3333-3333-333333333333', 'ZTO_SUMMIT_2026', 'Sarah Chen', 'Tech Media Daily', 'Media', 'issued'),
  ('44444444-4444-4444-4444-444444444444', 'ZTO_SUMMIT_2026', 'Alex Mercer', 'Unknown', 'Guest', 'issued')
ON CONFLICT (id) DO NOTHING;
