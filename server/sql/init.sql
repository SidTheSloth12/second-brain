-- Run this in the Supabase SQL Editor (or any PostgreSQL client) once per project.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed')),
  completed_at TIMESTAMPTZ,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON tasks (user_id, due_at) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks (user_id, status);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT events_time_order CHECK (ends_at >= starts_at)
);

CREATE INDEX IF NOT EXISTS idx_events_user_starts ON events (user_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_events_user_overlap ON events (user_id, starts_at, ends_at);

CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notes_user_slug_unique UNIQUE (user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_notes_user_updated ON notes (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_user_title_lower ON notes (user_id, lower(title));

CREATE INDEX IF NOT EXISTS notes_search_idx ON notes USING GIN (
  (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')))
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  body_html TEXT NOT NULL DEFAULT '',
  body_text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT journal_user_date_unique UNIQUE (user_id, entry_date)
);

CREATE INDEX IF NOT EXISTS idx_journal_user_date ON journal_entries (user_id, entry_date DESC);

CREATE INDEX IF NOT EXISTS journal_search_idx ON journal_entries USING GIN (
  (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body_text, '')))
);

CREATE TABLE IF NOT EXISTS note_links (
  from_note_id UUID NOT NULL REFERENCES notes (id) ON DELETE CASCADE,
  to_note_id UUID NOT NULL REFERENCES notes (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  PRIMARY KEY (from_note_id, to_note_id),
  CONSTRAINT note_links_no_self CHECK (from_note_id <> to_note_id)
);

CREATE INDEX IF NOT EXISTS idx_note_links_to ON note_links (to_note_id);
CREATE INDEX IF NOT EXISTS idx_note_links_user ON note_links (user_id);
