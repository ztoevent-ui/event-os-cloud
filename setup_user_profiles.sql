-- ZTO Event OS: User Profile Architecture
-- 1. Create the Profiles table to safely store user data outside of auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text,
  role text DEFAULT 'client' CHECK (role IN ('admin', 'client', 'staff')),
  last_sign_in_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Anyone logged in can read profiles
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  USING ( auth.role() = 'authenticated' );

-- 4. Policy: Only Admins can Update profiles (e.g., change roles)
CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE
  USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- 5. Function to automatically mirror auth.users into public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    new.id, 
    new.email, 
    -- If it's the very first user in the database, make them an admin automatically
    CASE 
      WHEN (SELECT COUNT(*) FROM public.profiles) = 0 THEN 'admin'
      ELSE 'client'
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger to fire the function on registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. BACKFILL EXISTING USERS (Crucial for existing accounts)
-- This takes everyone currently in auth.users and puts them in profiles as 'admin'.
INSERT INTO public.profiles (id, email, role, last_sign_in_at)
SELECT id, email, 'admin', last_sign_in_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;
