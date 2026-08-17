-- Add project_id to booth_visitors so each project has its own lead tracking
ALTER TABLE public.booth_visitors
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Index for fast per-project queries
CREATE INDEX IF NOT EXISTS idx_booth_visitors_project_id
  ON public.booth_visitors (project_id);

-- Allow public read for visitors (for admin console) - admins read via service role
-- Keep existing insert policy, add select for authenticated users
CREATE POLICY "Allow authenticated select on booth_visitors"
ON public.booth_visitors
FOR SELECT
TO authenticated
USING (true);
