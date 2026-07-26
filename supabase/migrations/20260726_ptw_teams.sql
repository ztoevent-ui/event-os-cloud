-- Add teams JSONB column to ptw_documents to store personnel allocation
ALTER TABLE ptw_documents ADD COLUMN IF NOT EXISTS teams JSONB NOT NULL DEFAULT '[]';
