-- Migration: Interactive Program Table Support

-- Safely add JSONB custom_data to program_items table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'program_items' AND column_name = 'custom_data') THEN
        ALTER TABLE public.program_items ADD COLUMN custom_data JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Add program_columns to tournament_settings to store custom column configurations project-wide
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournament_settings' AND column_name = 'program_columns') THEN
        ALTER TABLE public.tournament_settings ADD COLUMN program_columns JSONB;
    END IF;
END $$;
