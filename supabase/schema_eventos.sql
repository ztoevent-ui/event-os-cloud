-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'wedding_fair', 'corporate', etc.
    status TEXT DEFAULT 'planning', -- 'planning', 'active', 'completed'
    start_date DATE,
    end_date DATE,
    manager_id UUID, -- References auth.users later
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Timelines (Phases)
CREATE TABLE IF NOT EXISTS timelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    timeline_id UUID REFERENCES timelines(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo', -- 'todo', 'in_progress', 'review', 'done'
    priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    assignee_id UUID,
    due_date TIMESTAMPTZ,
    ai_suggestions JSONB DEFAULT '{}', -- Stores Gemini recommendations
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Vendors
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT, -- 'venue', 'catering', 'photo', etc.
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'potential', -- 'potential', 'contacted', 'confirmed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Budgets
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    item TEXT NOT NULL,
    amount NUMERIC(10, 2) DEFAULT 0.00,
    type TEXT NOT NULL, -- 'expense', 'income'
    category TEXT,
    status TEXT DEFAULT 'planned', -- 'planned', 'actual'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEED DATA: 'Destined Bintulu Wedding Expo 2026'

-- Insert Project
WITH new_project AS (
    INSERT INTO projects (name, type, status, start_date, end_date)
    VALUES ('Destined Bintulu Wedding Expo 2026', 'wedding_fair', 'planning', '2026-08-01', '2026-08-03')
    RETURNING id
),
-- Insert Timeline Phases
phase1 AS (
    INSERT INTO timelines (project_id, name, order_index, start_date, end_date)
    SELECT id, 'Phase 1: Concept & Setup', 1, '2026-02-01', '2026-03-31' FROM new_project RETURNING id, project_id
),
phase2 AS (
    INSERT INTO timelines (project_id, name, order_index, start_date, end_date)
    SELECT project_id, 'Phase 2: Vendor Recruitment', 2, '2026-04-01', '2026-06-30' FROM phase1 RETURNING id
),
phase3 AS (
    INSERT INTO timelines (project_id, name, order_index, start_date, end_date)
    SELECT project_id, 'Phase 3: Execution', 3, '2026-07-01', '2026-08-03' FROM phase1 RETURNING id
)
-- Insert Initial Tasks (we link to project, can refine timeline linking later if needed but lets do basic)
INSERT INTO tasks (project_id, title, status, priority, description)
SELECT id, 'Define Expo Theme & Branding', 'done', 'high', 'Finalize "Destined" theme colors and logo.' FROM new_project
UNION ALL
SELECT id, 'Secure Venue Booking', 'in_progress', 'critical', 'Confirm dates with Bintulu Civic Centre.' FROM new_project
UNION ALL
SELECT id, 'Draft Sponsor Packages', 'todo', 'high', 'Create Gold, Silver, Bronze tiers.' FROM new_project
UNION ALL
SELECT id, 'Launch Vendor Recruitment', 'todo', 'medium', 'Start calling potential exhibitors.' FROM new_project;

-- Insert Sample Vendors
INSERT INTO vendors (project_id, name, category, status)
SELECT id, 'Bintulu Civic Centre', 'venue', 'contacted' FROM projects WHERE name = 'Destined Bintulu Wedding Expo 2026'
UNION ALL
SELECT id, 'Grand Palace Hotel', 'accommodation', 'potential' FROM projects WHERE name = 'Destined Bintulu Wedding Expo 2026';

