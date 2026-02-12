-- Migration: Backfill orphaned records to the first available project or create a default one.

DO $$
DECLARE
    target_project_id UUID;
BEGIN
    -- 1. Check if a project exists. If not, create one.
    SELECT id INTO target_project_id FROM projects ORDER BY created_at ASC LIMIT 1;

    IF target_project_id IS NULL THEN
        INSERT INTO projects (name, type, status, start_date)
        VALUES ('Default Project', 'wedding_fair', 'planning', NOW())
        RETURNING id INTO target_project_id;
    END IF;

    -- 2. Backfill Timelines
    UPDATE timelines 
    SET project_id = target_project_id 
    WHERE project_id IS NULL;

    -- 3. Backfill Tasks
    UPDATE tasks 
    SET project_id = target_project_id 
    WHERE project_id IS NULL;

    -- 4. Backfill Vendors
    UPDATE vendors 
    SET project_id = target_project_id 
    WHERE project_id IS NULL;

    -- 5. Backfill Budgets
    UPDATE budgets 
    SET project_id = target_project_id 
    WHERE project_id IS NULL;

    -- 6. Backfill Consulting Forms
    UPDATE consulting_forms 
    SET project_id = target_project_id 
    WHERE project_id IS NULL;

    -- 7. Backfill Attendees (New Table)
    -- Checking if attendees table exists first to avoid errors if run early
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'attendees') THEN
        UPDATE attendees 
        SET project_id = target_project_id 
        WHERE project_id IS NULL;
    END IF;

    -- 8. Backfill Tickets (New Table)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tickets') THEN
        UPDATE tickets 
        SET project_id = target_project_id 
        WHERE project_id IS NULL;
    END IF;

END $$;
