-- ═══════════════════════════════════════════════════════════
-- ZTO Event OS — Fix profiles table RLS for Admin access
-- Run this in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Step 1: Check current RLS policies on profiles table
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- Step 2: Drop any existing restrictive SELECT policy (if needed)
-- DROP POLICY IF EXISTS "Users can view own profile." ON profiles;

-- Step 3: Allow users to always read their OWN profile
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Step 4: Allow admin users to read ALL profiles
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
CREATE POLICY "profiles_select_admin"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND lower(role) = 'admin'
  )
);

-- Step 5: Allow users to UPDATE their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Step 6: Allow admin to UPDATE any profile (for role changes)
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin"
ON profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND lower(role) = 'admin'
  )
);

-- Step 7: Allow upsert for new profile creation (signup trigger)
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Verify policies applied
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles' ORDER BY cmd;
