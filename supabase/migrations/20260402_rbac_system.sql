-- ZTO Event OS: RBAC System & User Management Migration
-- Date: 2026-04-02

-- 1. Create Custom Types for Roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'PROJECT_MANAGER', 'REFEREE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'REFEREE',
    full_name TEXT,
    avatar_url TEXT,
    username TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Project Access Table (Linking PMs to Projects)
CREATE TABLE IF NOT EXISTS public.project_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- 4. Create Referee Temporary Access Codes
CREATE TABLE IF NOT EXISTS public.referee_access_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL, -- using slug or ID
    code TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referee_access_codes ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Simplified for now, will refine as needed)
-- Profiles: Users can view all profiles but only update their own
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Project Access: Managers can see their own access
CREATE POLICY "Users can see their own project access." ON public.project_access FOR SELECT USING (auth.uid() = user_id);

-- 5. Helper Function for Referee Code Verification
CREATE OR REPLACE FUNCTION public.verify_referee_code(input_code TEXT, input_event_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    is_valid BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.referee_access_codes 
        WHERE code = input_code AND event_id = input_event_id AND is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW())
    ) INTO is_valid;
    RETURN is_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger to automatically create a profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'REFEREE');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
