-- 1. Drop the existing CHECK constraint on the role column
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Add the new CHECK constraint including 'intern'
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'client', 'staff', 'intern'));

-- ==============================================================================
-- HOW TO SET A USER AS AN INTERN FOR TESTING
-- ==============================================================================
-- To test this feature, you can run the following SQL in your Supabase dashboard,
-- replacing 'intern@example.com' with the actual email of the user you want to restrict:
-- 
-- UPDATE public.profiles 
-- SET role = 'intern' 
-- WHERE email = 'intern@example.com';
-- ==============================================================================
