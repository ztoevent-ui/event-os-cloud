-- Migration to fix ID constraints and add slug support
-- This will resolve the 500 Internal Server Error when creating new projects/events

-- 1. Create the events table if it doesn't already exist (in case it was manually created but missing in migrations)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Ensure 'id' column has a default UUID fallback to prevent null constraint errors
ALTER TABLE public.events ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Ensure 'slug' column exists on events
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'slug') THEN
        ALTER TABLE public.events ADD COLUMN slug TEXT UNIQUE;
    END IF;
END $$;

-- 4. Apply the same robust constraints to the 'projects' table to be safe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        -- Add slug if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'slug') THEN
            ALTER TABLE public.projects ADD COLUMN slug TEXT UNIQUE;
        END IF;
        
        -- Set default UUID for projects id to prevent future 500 errors
        ALTER TABLE public.projects ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;
END $$;

-- 5. Force update any existing rows with null slugs (optional cleanup)
UPDATE public.events SET slug = id::text WHERE slug IS NULL;
