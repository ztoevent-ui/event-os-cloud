-- Create the 'logo' bucket if it doesn't already exist and make it public
INSERT INTO storage.buckets (id, name, public)
VALUES ('logo', 'logo', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing specific logo policies if they exist to prevent conflicts
DROP POLICY IF EXISTS "logo_read_policy" ON storage.objects;
DROP POLICY IF EXISTS "logo_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "logo_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "logo_delete_policy" ON storage.objects;

-- Policy 1: Allow public to view logos
CREATE POLICY "logo_read_policy" ON storage.objects
  FOR SELECT USING (bucket_id = 'logo');

-- Policy 2: Allow anyone to upload a new logo
CREATE POLICY "logo_insert_policy" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'logo');

-- Policy 3: Allow anyone to update/overwrite a logo
CREATE POLICY "logo_update_policy" ON storage.objects
  FOR UPDATE USING (bucket_id = 'logo');

-- Policy 4: Allow anyone to delete a logo (optional but useful for updating)
CREATE POLICY "logo_delete_policy" ON storage.objects
  FOR DELETE USING (bucket_id = 'logo');
