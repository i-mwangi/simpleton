-- Particl database schema
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query -> Run)
-- Columns match what the backend code reads/writes:
--   db/users.py, db/queries.py, db/versions.py, auth/routes.py

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users (custom table, not auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  onboarding JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Existing databases: add the onboarding column if it is missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding JSONB;

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  prompt TEXT NOT NULL,
  latex TEXT NOT NULL,
  pdf_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  prompt TEXT NOT NULL,
  response TEXT,
  latex TEXT,
  pdf_url TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document versions
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  latex TEXT NOT NULL,
  pdf_url TEXT,
  prompt TEXT,
  status TEXT DEFAULT 'success',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);

-- The backend connects with the service-role key, which bypasses RLS.
-- Enabling RLS with no policies blocks the anon key from touching these tables.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- Refresh PostgREST's schema cache so the API sees the new tables immediately
NOTIFY pgrst, 'reload schema';
