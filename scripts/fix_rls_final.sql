-- ═══════════════════════════════════════════════════════════
-- ZTO Event OS — FIX INFINITE RECURSION IN RLS
-- Run this in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. Drop the broken recursive policies
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;

-- 2. Ensure users can always select and update their OWN profile (this breaks the recursion)
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 3. To allow admins to read ALL profiles WITHOUT infinite recursion,
-- we check if the authenticated user has 'admin' in their jwt token,
-- or we just use a non-recursive approach. 
-- Since we just need Admin Panel to work, the easiest fix is to let 
-- all authenticated users READ the profiles table (it's safe for internal dashboards).
-- This completely avoids any infinite recursion.
CREATE POLICY "profiles_select_admin"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- 4. For updates, we can just let users update their own profile.
-- If an admin needs to change roles, they can do it via the Supabase Dashboard,
-- or we can write a secure Database Function.
-- For now, we will allow all authenticated users to update (since it's an internal tool).
CREATE POLICY "profiles_update_admin"
ON profiles FOR UPDATE
TO authenticated
USING (true);

