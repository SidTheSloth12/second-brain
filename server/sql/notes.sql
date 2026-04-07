-- Run in Supabase SQL Editor if init.sql was applied without notes.

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

CREATE TABLE IF NOT EXISTS note_links (
  from_note_id UUID NOT NULL REFERENCES notes (id) ON DELETE CASCADE,
  to_note_id UUID NOT NULL REFERENCES notes (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  PRIMARY KEY (from_note_id, to_note_id),
  CONSTRAINT note_links_no_self CHECK (from_note_id <> to_note_id)
);

CREATE INDEX IF NOT EXISTS idx_note_links_to ON note_links (to_note_id);
CREATE INDEX IF NOT EXISTS idx_note_links_user ON note_links (user_id);

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tags_user_normalized_name_unique UNIQUE (user_id, normalized_name)
);

CREATE TABLE IF NOT EXISTS note_tags (
  note_id UUID NOT NULL REFERENCES notes (id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_note_tags_note ON note_tags (note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag ON note_tags (tag_id);
