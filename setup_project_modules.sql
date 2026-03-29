-- ZTO Event OS: Project-Level Program & Schedule Tables
-- These power the /projects/[id]/program and /projects/[id]/schedule pages

-- 1. Program Items (Tentative Program rows)
CREATE TABLE IF NOT EXISTS public.program_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    time text DEFAULT '',
    activities text DEFAULT '',
    movement text DEFAULT '',
    cues text DEFAULT '',
    song text DEFAULT '',
    volume text DEFAULT '',
    is_important boolean DEFAULT false,
    sort_order int DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Schedule Items (Production Schedule rows)
CREATE TABLE IF NOT EXISTS public.schedule_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    time text DEFAULT '',
    title text DEFAULT '',
    assignee text DEFAULT '',
    status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'DONE')),
    sort_order int DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.program_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;

-- 4. Policies - open access (same pattern as your other tables)
DROP POLICY IF EXISTS "Program items are public" ON public.program_items;
CREATE POLICY "Program items are public" ON public.program_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Schedule items are public" ON public.schedule_items;
CREATE POLICY "Schedule items are public" ON public.schedule_items FOR ALL USING (true) WITH CHECK (true);
