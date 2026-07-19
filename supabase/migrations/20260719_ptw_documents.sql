-- PTW Documents table for storing Permit to Work records
CREATE TABLE IF NOT EXISTS ptw_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  hash TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  title TEXT NOT NULL DEFAULT 'Work Permit & Site Activity Notice',
  work_leader TEXT,
  work_leader_contact TEXT,
  selected_items JSONB NOT NULL DEFAULT '[]',
  risks JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'approved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  issued_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE ptw_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for ptw_documents" ON ptw_documents FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS ptw_documents_project_id_idx ON ptw_documents(project_id);
CREATE INDEX IF NOT EXISTS ptw_documents_hash_idx ON ptw_documents(hash);
