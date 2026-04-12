-- =====================================================
-- FIX: Profiles Table RLS Policies
-- Run in: Supabase Dashboard → SQL Editor
-- =====================================================

-- 1. Make sure RLS is enabled on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop any conflicting select policies first (safe to ignore errors)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;

-- 3. Allow every authenticated user to read THEIR OWN profile row
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- 4. Allow admins to read ALL profiles (needed for /admin/users page)
CREATE POLICY "profiles_select_admin"
ON public.profiles
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles AS p2
        WHERE p2.id = auth.uid() AND p2.role = 'admin'
    )
);

-- 5. Allow users to update their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- 6. Allow admin to insert/update any profile (for user management)
DROP POLICY IF EXISTS "profiles_all_admin" ON public.profiles;
CREATE POLICY "profiles_all_admin"
ON public.profiles
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles AS p2
        WHERE p2.id = auth.uid() AND p2.role = 'admin'
    )
);

-- Verify: check which policies exist now
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles';
