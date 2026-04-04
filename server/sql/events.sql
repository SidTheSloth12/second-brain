-- Run in Supabase SQL Editor if init.sql was applied without events.

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
