-- Allow PTW documents to not be attached to any specific project (for Global PTWs)
ALTER TABLE ptw_documents ALTER COLUMN project_id DROP NOT NULL;
