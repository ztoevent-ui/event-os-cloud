-- 20261008_tasks_and_magic_link.sql
-- Schema migration for To-Do List refactor and Guest Magic Link

-- 1. Tasks Schema Enhancements
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS assignee_type VARCHAR(50) DEFAULT 'team'; -- 'team' | 'client'

-- 2. Project Share Links (Magic Links)
CREATE TABLE IF NOT EXISTS project_share_links (
    token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'Couple Portal', -- e.g., 'Bride & Groom', 'Parents'
    scopes TEXT[] DEFAULT ARRAY['tasks', 'program', 'timeline'], -- what they can see
    can_edit BOOLEAN DEFAULT false, -- whether they can check off tasks
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup by token
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_share_links_token ON project_share_links (token);
CREATE INDEX IF NOT EXISTS idx_project_share_links_project ON project_share_links (project_id);

-- Expose to RLS (if needed, but usually we handle via server actions using service_role)
ALTER TABLE project_share_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for everyone" ON project_share_links FOR SELECT USING (true);
