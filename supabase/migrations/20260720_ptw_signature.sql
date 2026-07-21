-- Add signature and client details for PTW approval
ALTER TABLE ptw_documents
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS client_signature TEXT,
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;
