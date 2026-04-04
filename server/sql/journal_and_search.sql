-- Run once in Supabase for existing projects.

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

CREATE INDEX IF NOT EXISTS notes_search_idx ON notes USING GIN (
  (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')))
);
