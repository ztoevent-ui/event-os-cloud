-- Migration: Create meeting_sessions table
-- Replaces the single meeting_notes TEXT field on projects with a
-- structured, per-session table for better readability and mobile UX.

CREATE TABLE IF NOT EXISTS public.meeting_sessions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title       TEXT        NOT NULL DEFAULT 'Meeting',
    meeting_date DATE       NOT NULL DEFAULT CURRENT_DATE,
    content     TEXT        NOT NULL DEFAULT '',
    assets      TEXT[]      NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index for fast per-project queries
CREATE INDEX IF NOT EXISTS meeting_sessions_project_id_idx
    ON public.meeting_sessions (project_id, meeting_date DESC);

-- Row Level Security
ALTER TABLE public.meeting_sessions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage sessions for projects they can see.
-- This mirrors the same open-read pattern used by other project tables.
CREATE POLICY "authenticated_users_can_manage_meeting_sessions"
    ON public.meeting_sessions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p WHERE p.id = project_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects p WHERE p.id = project_id
        )
    );
