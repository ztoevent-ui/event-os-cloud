-- =====================================================
-- CREATE ADMIN ACCOUNT
-- Run this in: Supabase Dashboard → SQL Editor
-- =====================================================

DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  -- 1. Create the user directly in auth.users (bypassing email confirmation)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'conniewongconnie@hotmail.com',
    crypt('123456', gen_salt('bf')), -- Hashes the password securely
    now(),                           -- Marks email as confirmed immediately
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  );

  -- 2. The trigger `on_auth_user_created` will automatically create a row in public.profiles.
  -- We just need to update that row to ensure the role is 'admin'.
  UPDATE public.profiles
  SET role = 'admin'
  WHERE id = new_user_id;

END $$;
