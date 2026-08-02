-- Add share token to projects for public tentative program viewing
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS program_share_token UUID DEFAULT gen_random_uuid();

-- Create unique index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_program_share_token
  ON projects (program_share_token);
