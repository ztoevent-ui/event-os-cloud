ALTER TABLE bpo_registrations
ADD COLUMN IF NOT EXISTS registration_status TEXT DEFAULT 'Pending_Verification',
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS dupr_screenshot_url TEXT;

-- Update existing rows to have the default status
UPDATE bpo_registrations
SET registration_status = 'Pending_Verification'
WHERE registration_status IS NULL;
