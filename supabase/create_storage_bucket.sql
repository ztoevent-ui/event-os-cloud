-- Create the public_assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('public_assets', 'public_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up access controls (Policies) for the bucket
-- Allow anyone to read data from the bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'public_assets' );

-- Allow authenticated or anonymous users to insert new files 
-- (You might want to restrict this in production, but this ensures uploads work from your app)
CREATE POLICY "Public Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'public_assets' );

-- Allow users to update objects
CREATE POLICY "Public Update" 
ON storage.objects FOR UPDATE
USING ( bucket_id = 'public_assets' );
